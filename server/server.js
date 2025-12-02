
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require("dotenv").config();

const http = require('http');
const { Server } = require('socket.io');

const { sendAiMessage, getOrCreateAiChat, cleanupInactiveChats } = require("./chatBot"); 
const { getMessagesByConversationId, insertMessage } = require("./dbService"); 

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const chatRouter = require("./routes/chat");
const followRouter = require('./routes/follow');
const shortRouter = require("./routes/short");
const missionRouter = require("./routes/mission");

const app = express();
app.use(cors({
    origin: "*",
    credentials: true,
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/chat", chatRouter);
app.use("/follow", followRouter);
app.use("/shorts", shortRouter);
app.use("/mission", missionRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const GEMINI_BOT_ID = 'GEMINI_BOT';
const BOT_COMMAND_PREFIX = '/';

io.on('connection', (socket) => {

    const { currentId, conversationId } = socket.handshake.query;

    if (conversationId) {
        socket.join(conversationId);
    }

    socket.on('sendMessage', async (msg) => {

        let userMessageId;
        
        try {
            userMessageId = await insertMessage({
                ...msg,
                text: msg.text,
                senderId: msg.senderId,
                isRead: 0
            });

            const userMessageToSend = {
                ...msg,
                MESSAGE_ID: userMessageId,
                CREATED_AT: new Date().toISOString()
            };
            io.to(msg.conversationId).emit('newMessage', userMessageToSend);

        } catch (error) {
            console.error(`[User Message Save Error - 대화방 ${msg.conversationId}]`, error);
            return; 
        }

        const isDirectBotChat = (msg.receiverId === GEMINI_BOT_ID);
        const isBotCommand = (msg.text && String(msg.text).startsWith(BOT_COMMAND_PREFIX));

        if (isDirectBotChat || isBotCommand) {

            let questionText = msg.text;
            if (isBotCommand) {
                questionText = String(msg.text).substring(BOT_COMMAND_PREFIX.length).trim();
            }

            if (questionText.length === 0) {
                return;
            }
            
            
            const INSTRUCTION = `
                당신은 운동 전문가이며, 사용자의 요청에 대해 오직 '운동명: N세트 M회' 형식으로 간결하게 답변해야 합니다.
                추가 설명이나 인사말, 기타 텍스트는 절대로 넣지 마세요.
                각 운동은 Markdown 목록(-)으로 제시해야 합니다.
                예시 출력 형식:
                - 덤벨 컬: 3세트 20회
                - 푸쉬업: 4세트 15회
            `.trim();

            const finalPrompt = isBotCommand 
                                ? `${INSTRUCTION}\n\n사용자 요청: ${questionText}` 
                                : questionText;

            try {
                let geminiHistory = [];

                if (isDirectBotChat) {
                    const rawHistory = await getMessagesByConversationId(msg.conversationId);
                    
                    geminiHistory = rawHistory
                        .filter(m => m.text && String(m.text).trim().length > 0)
                        .map(m => {
                            const safeText = String(m.text).trim();
                            return {
                                role: String(m.senderId) === GEMINI_BOT_ID ? "model" : "user",
                                parts: [{ text: safeText }]
                            }
                        });
                }
                
                const aiResponseText = await sendAiMessage(msg.conversationId, finalPrompt, geminiHistory);

                const aiMessage = {
                    conversationId: msg.conversationId,
                    senderId: GEMINI_BOT_ID,
                    receiverId: msg.senderId,
                    text: aiResponseText,
                    isRead: 1
                };

                const botMessageId = await insertMessage(aiMessage);

                const finalAiMessage = {
                    conversationId: aiMessage.conversationId,
                    senderId: aiMessage.senderId,
                    receiverId: aiMessage.receiverId,
                    text: aiMessage.text,
                    isRead: aiMessage.isRead,
                    MESSAGE_ID: botMessageId, 
                    CREATED_AT: new Date().toISOString()
                };

                io.to(msg.conversationId).emit('newMessage', finalAiMessage);

            } catch (error) {
                console.error(`[Gemini Error - 대화방 ${msg.conversationId}]`, error);

                const errorMsgToSend = {
                    conversationId: msg.conversationId,
                    text: "⚠️ 죄송합니다. 챗봇 응답에 문제가 발생했습니다.",
                    senderId: GEMINI_BOT_ID,
                    receiverId: msg.senderId,
                    MESSAGE_ID: `error-${Date.now()}`, 
                    CREATED_AT: new Date().toISOString()
                };
                
                io.to(msg.conversationId).emit('newMessage', errorMsgToSend);
            }
        }
    });

    socket.on('disconnect', () => {
    });
});

const PORT = 3010;

httpServer.listen(PORT, () => {
    console.log(`Server started on port ${PORT} (HTTP & Socket.IO)`);
    console.log("server start!");
    setInterval(cleanupInactiveChats, 5 * 60 * 1000);
    console.log("Chat cleanup interval started.");
});