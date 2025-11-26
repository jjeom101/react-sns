const express = require('express')
const cors = require('cors') 
const jwt = require('jsonwebtoken');
const path = require('path');

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const chatRouter = require("./routes/chat");

const app = express()
app.use(cors({
    origin : "*",
    credentials : true,
    
}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

// router 영역

app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/chat", chatRouter);


app.listen(3010, ()=>{
    console.log("server start!");
})