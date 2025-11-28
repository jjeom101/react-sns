require('dotenv').config();
const express = require('express')
const cors = require('cors') 
const jwt = require('jsonwebtoken');
const path = require('path');

const http = require('http'); 
const { Server } = require('socket.io');
const { sendAiMessage } = require("./chatBot");
const { getMessagesByConversationId, insertMessage } = require("./dbService");

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const chatRouter = require("./routes/chat");
const followRouter = require('./routes/follow');
const shortRouter = require("./routes/short");


const app = express()
app.use(cors({
    origin : "*",
    credentials : true,
    
}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/chat", chatRouter);
app.use("/follow", followRouter);
app.use("/short", shortRouter);


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
        
        if (msg.receiverId !== GEMINI_BOT_ID) {
            io.to(msg.conversationId).emit('newMessage', msg); 
        }

        const isDirectBotChat = (msg.receiverId === GEMINI_BOT_ID);
        const isBotCommand = (msg.text && msg.text.startsWith(BOT_COMMAND_PREFIX));
        
        if (isDirectBotChat || isBotCommand) { 
            
            let geminiHistory = [];
            let questionText = msg.text;

            if (isDirectBotChat) {
                try {
                    const rawHistory = await getMessagesByConversationId(msg.conversationId);

                    // ⭐️ [수정된 부분] History 필터링 및 구조 안정화 적용
                    geminiHistory = rawHistory
                      .filter(m => m.content && String(m.content).trim().length > 0) // 필터링 유지
                        .map(m => ({
                            role: String(m.senderId) === GEMINI_BOT_ID ? "model" : "user", 
                            parts: [{ text: m.content }], 
                        }));

                } catch (error) {
                    console.error(`[History Load Error - 대화방 ${msg.conversationId}]`, error);
                }
            }
            
            try {
                const aiResponseText = await sendAiMessage(msg.conversationId, questionText, geminiHistory);
                
                const aiMessage = {
                    conversationId: msg.conversationId,
                    senderId: GEMINI_BOT_ID, 
                    receiverId: msg.senderId, 
                    text: aiResponseText,
                    timestamp: new Date().toISOString(),
                    isRead: 1 
                };
                
                await insertMessage(aiMessage); 
                
                io.to(msg.conversationId).emit('newMessage', aiMessage); 
                
            } catch (error) {
                console.error(`[Gemini Error - 대화방 ${msg.conversationId}]`, error);
                
                const errorMsg = { 
                    conversationId: msg.conversationId,
                    text: "죄송합니다. 챗봇 응답에 문제가 발생했습니다.",
                    senderId: GEMINI_BOT_ID, 
                    receiverId: msg.senderId 
                };
                socket.emit('newMessage', errorMsg);
            }
        }
    });

    socket.on('disconnect', () => {
        
    });
});


const PORT = 3010;

httpServer.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT} (HTTP & Socket.IO)`);
    console.log("server start!");
});