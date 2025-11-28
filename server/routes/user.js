const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');   
// const authMiddleware = require('../middleware/auth');



// 해시 함수 실행 위해 사용할 키로 아주 긴 랜덤한 문자를 사용하길 권장하며, 노출되면 안됨.
const JWT_KEY = "server_secret_key"; 
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_images');
router.post('/join', async (req, res) => {
    let {userId, pwd, userName,nickName,bio} = req.body;
    console.log("req.body ===>",req.body);
    try {
        const hashPwd = await bcrypt.hash(pwd, 10);

        let sql = "INSERT INTO SNS_USERS (USER_ID, USERNAME, PASSWORD, NICKNAME, BIO, CREATED_AT) VALUES (?, ?, ?, ?, ?, NOW())";
        let result = await db.query(sql, [userId, userName, hashPwd,nickName,bio]);
        
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
                
                token = jwt.sign(user, JWT_KEY, {expiresIn : '1h'});
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
 
       let sql = "SELECT U.USER_ID, U.NICKNAME, IFNULL(T1.POST_COUNT, 0) AS POST_COUNT, IFNULL(T2.FOLLOWER_COUNT, 0) AS FOLLOWER_COUNT, IFNULL(T3.FOLLOWING_COUNT, 0) AS FOLLOWING_COUNT FROM SNS_USERS U LEFT JOIN (SELECT USER_ID, COUNT(*) AS POST_COUNT FROM SNS_POSTS GROUP BY USER_ID) T1 ON U.USER_ID = T1.USER_ID LEFT JOIN (SELECT FOLLOWING_ID, COUNT(*) AS FOLLOWER_COUNT FROM SNS_FOLLOWS GROUP BY FOLLOWING_ID) T2 ON U.USER_ID = T2.FOLLOWING_ID LEFT JOIN (SELECT FOLLOWER_ID, COUNT(*) AS FOLLOWING_COUNT FROM SNS_FOLLOWS GROUP BY FOLLOWER_ID) T3 ON U.USER_ID = T3.FOLLOWER_ID WHERE U.USER_ID = ?"
    

        let [list] = await db.query(sql, [userId]);
        res.json({
            user : list[0],
            result : "success"
        })



    } catch (error) {
        console.log(error);
    }
})

router.get('/:userId/followers', async (req, res) => {
    const { userId } = req.params;
    
    try {
        // T1: 팔로워 ID 목록 조회 (현재 사용자(userId)를 팔로잉하고 있는 사람들)
        let sql = `
            SELECT 
                T1.FOLLOWER_ID AS USER_ID,
                U.NICKNAME,
                U.PROFILE_IMG
            FROM SNS_FOLLOWS T1
            JOIN SNS_USERS U ON T1.FOLLOWER_ID = U.USER_ID
            WHERE T1.FOLLOWING_ID = ?
        `;
        
        let [list] = await db.query(sql, [userId]);
        
        res.json({
            list: list,
            count: list.length,
            result: "success"
        });
        
    } catch (error) {
        console.error("팔로워 목록 조회 중 에러 발생:", error);
        res.status(500).json({ 
            msg: "fail", 
            error: "팔로워 목록 조회 중 서버 오류가 발생했습니다." 
        });
    }
});

router.get('/:userId/followings', async (req, res) => {
    const { userId } = req.params;
    
    try {
        // T2: 팔로잉 ID 목록 조회 (현재 사용자(userId)가 팔로잉하고 있는 사람들)
        let sql = `
            SELECT 
                T1.FOLLOWING_ID AS USER_ID,
                U.NICKNAME,
                U.PROFILE_IMG
            FROM SNS_FOLLOWS T1
            JOIN SNS_USERS U ON T1.FOLLOWING_ID = U.USER_ID
            WHERE T1.FOLLOWER_ID = ?
        `;
        
        let [list] = await db.query(sql, [userId]);
        
        res.json({
            list: list,
            count: list.length,
            result: "success"
        });
        
    } catch (error) {
        console.error("팔로잉 목록 조회 중 에러 발생:", error);
        res.status(500).json({ 
            msg: "fail", 
            error: "팔로잉 목록 조회 중 서버 오류가 발생했습니다." 
        });
    }
});



// ⭐️ 파일 저장 설정 (Multer Storage Configuration)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 1. 디렉터리가 없으면 생성합니다.
        if (!fs.existsSync(uploadDir)) {
            // recursive: true 옵션으로 상위 폴더도 한 번에 생성합니다.
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[Multer] 새 업로드 디렉터리 생성: ${uploadDir}`);
        }
        // 2. 절대 경로를 사용하여 Multer에 전달합니다.
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // 파일명 생성 로직은 그대로 유지합니다.
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

// ⭐️ Multer 미들웨어 생성
const upload = multer({ storage: storage });

// 토큰에서 사용자 ID를 추출하는 미들웨어 (인증 미들웨어)가 필요하지만, 
// 여기서는 간단히 FormData에서 넘어온 userId를 사용하는 예시를 사용하겠습니다.

// ⭐️ POST /user/profile/image 라우터 구현
router.post('/profile/image', upload.single('profileImage'), async (req, res) => {
    // upload.single('profileImage'): 프론트에서 FormData에 'profileImage'라는 이름으로 보낸 파일을 처리합니다.
    
    const userId = req.body.userId;
    
    // 파일이 저장된 서버상의 경로
    const relativePath = req.file ? `/profile_images/${req.file.filename}` : null; 
    
    if (!relativePath) {
        return res.status(400).json({ result: 'fail', msg: '파일 업로드에 실패했습니다.' });
    }

    try {
        // ⭐️ DB 업데이트 쿼리
       const updateQuery = `UPDATE SNS_USERS  SET PROFILE_IMG = ? WHERE USER_ID = ?`;
        await db.query(updateQuery, [relativePath, userId]);

        // 성공 응답. 프론트에서 fnGetUser를 호출해 갱신하도록 유도합니다.
        res.status(200).json({ 
            result: 'success', 
            msg: '프로필 사진이 성공적으로 업데이트되었습니다.', 
            profileImgUrl: relativePath 
        });

    } catch (e) {
        console.error("프로필 이미지 DB 업데이트 오류:", e);
        // 업로드된 파일도 삭제하는 로직을 추가해야 하지만, 여기서는 생략합니다.
        res.status(500).json({ result: 'fail', msg: 'DB 업데이트 중 서버 오류가 발생했습니다.' });
    }
});

module.exports = router;