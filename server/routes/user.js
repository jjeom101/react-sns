const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
// const authMiddleware = require('../middleware/auth');



// 해시 함수 실행 위해 사용할 키로 아주 긴 랜덤한 문자를 사용하길 권장하며, 노출되면 안됨.
const JWT_KEY = "server_secret_key"; 

router.post('/join', async (req, res) => {
    let {userId, pwd, userName,nickName} = req.body;
    try {
        const hashPwd = await bcrypt.hash(pwd, 10);

        let sql = "INSERT INTO SNS_USERS (USER_ID, USERNAME, PASSWORD, NICKNAME, CREATED_AT) VALUES (?, ?, ?, ?, NOW())";
        let result = await db.query(sql, [userId, userName, hashPwd,nickName]);
        
        res.json({
            msg: "success", 
            result: {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            }
        });
    } catch (error) {
        console.error("회원가입 중 데이터베이스 에러 발생:", error);
        console.log(error);
        if (error.errno === 1062) {
             return res.status(409).json({
                msg: "fail",
                error: "이미 존재하는 사용자 ID입니다."
            });
        }
        
        res.status(500).json({ 
            msg: "fail", 
            error: "회원가입 처리 중 서버 오류가 발생했습니다." 

        });
    }
});

router.post('/login', async (req, res) => {
    let {userId, pwd} = req.body
    
    console.log("클라이언트가 보낸 데이터:", req.body);
    try {
        
        let sql = "SELECT * FROM SNS_USERS WHERE USER_ID = ?";
        let [list] = await db.query(sql, [userId]);
        let msg = "";
        let result = "false"; 
        let token = "null";
        
    
        if(list.length > 0) {
            console.log("DB에서 조회된 해쉬화된 비밀번호:", list[0].PASSWORD);
        }else{
            msg = "아이디를 확인해주세요!";
        }
        // -------------------------------------------------------------
        
        if(list.length > 0){
            // 아이디 존재
            const match = await bcrypt.compare(pwd, list[0].PASSWORD);
            if(match){
                msg = list[0].USERNAME + "님 환영합니다!";
                result = "true";
                let user = {
                    userId : list[0].USER_ID,
                    userName : list[0].USERNAME,// 권한등 필요한 정보 추가 
                    status : "A" //일단 하드 코딩 db에 없어서
                }
                // *주의: JWT 토큰 생성 코드가 잘못되어 수정했습니다.
                token = jwt.sign(user, JWT_KEY, {expiresIn : '1h'})
            } else {
                msg = "비밀번호를 확인해라";
            }
        } else {
            // 아이디 없음
            msg = "해당 아이디가 존재하지 않습니다.";
        }
        
        
        res.json({
            msg : msg,  //msg 이런식으로 생략가능
            result : result,
            token: token // JWT 토큰도 포함하여 응답합니다.
        });
    } catch (error) {
        console.log("에러 발생!");
        console.log(error);
        res.status(500).json({ msg: "서버 오류 발생", result: "fail" });
    }
})

router.get("/:userId", async (req, res) => {
    let {userId} = req.params;
    try {
       // 1. 두개 쿼리 써서 리턴
    //    let [list] = await db.query("SELECT * FROM TBL_USER WHERE USERID = ?", [userId]);
    //    let [cnt] = await db.query("SELECT COUNT(*) FROM TBL_FEED WHERE USERID = ?", [userId]);
    //    res.json({
    //     user : list[0],
    //     cnt : cnt[0]
    //    }) 

       // 2. 조인쿼리 만들어서 하나로 리턴
        let sql = 
            "SELECT U.*, IFNULL(T.CNT, 0) cnt " +
            "FROM TBL_USER U " +
            "LEFT JOIN ( " +
            "    SELECT USERID, COUNT(*) CNT " +
            "    FROM TBL_FEED " +
            "    GROUP BY USERID " +
            ") T ON U.USERID = T.USERID " +
            "WHERE U.USERID = ?";

        let [list] = await db.query(sql, [userId]);
        res.json({
            user : list[0],
            result : "success"
        })



    } catch (error) {
        console.log(error);
    }
})








module.exports = router;