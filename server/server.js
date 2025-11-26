const express = require('express')
const cors = require('cors') 
const jwt = require('jsonwebtoken');
const path = require('path');

const http = require('http'); 
const { Server } = require('socket.io');

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const chatRouter = require("./routes/chat");
const followRouter = require("./routes/follow");

const app = express()
app.use(cors({
    origin : "*",
    credentials : true,
    
}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// router 영역

app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/chat", chatRouter);
app.use("/follow", followRouter);

const PORT = 3010;

httpServer.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT} (HTTP & Socket.IO)`);
    console.log("server start!");
});