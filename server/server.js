const express = require('express')
const cors = require('cors') 
const jwt = require('jsonwebtoken');
const path = require('path');

const http = require('http'); 
const { Server } = require('socket.io');
const { sendAiMessage } = require("./chatBot");

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const chatRouter = require("./routes/chat");
const followRouter = require("./routes/follow");
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

// router 영역

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

require('dotenv').config();
const express = require('express')
const cors = require('cors')

const GEMINI_BOT_ID = 'GEMINI_BOT'; 

io.on('connection', (socket) => {
    const { currentId, conversationId } = socket.handshake.query;

    if (conversationId) {
       
        socket.join(conversationId); 
    }

    socket.on('sendMessage', async (msg) => {
        
        
     
        socket.to(msg.conversationId).emit('newMessage', msg); 
        
     
        if (msg.receiverId === GEMINI_BOT_ID) { 
            try {
             
                const aiResponseText = await sendAiMessage(msg.conversationId, msg.text);
                
           
                const aiMessage = {
                    conversationId: msg.conversationId,
                    senderId: GEMINI_BOT_ID, 
                    receiverId: msg.senderId, 
                    text: aiResponseText,
                    timestamp: new Date().toISOString(),
                 
                };
                
             
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
        // console.log(`사용자 ${currentId} 소켓 연결 해제`);
    });
});



const PORT = 3010;

httpServer.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT} (HTTP & Socket.IO)`);
    console.log("server start!");
});