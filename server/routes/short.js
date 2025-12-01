const express = require('express');
const router = express.Router();
const db = require("../db");

const multer = require('multer');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../auth');

const JWT_KEY = "server_secret_key"; 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 파일을 저장할 디렉토리 (서버 루트 경로에 'uploads' 폴더가 있어야 함)
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // 파일명이 겹치지 않도록 현재 시간 + 파일명으로 설정
        cb(null, Date.now() + '-' + file.originalname); 
    }
});
const upload = multer({ storage: storage });



router.get('/feed', authMiddleware, async (req, res) => {
    console.log("req.query===>",req.query);
   
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        

        const sql = `
            SELECT 
                S.*,
                U.NICKNAME,
                (SELECT COUNT(*) FROM SNS_LIKES L WHERE L.SHORT_ID = S.SHORT_ID) AS like_count,
                (SELECT COUNT(*) FROM SNS_LIKES L WHERE L.SHORT_ID = S.SHORT_ID AND L.USER_ID = ?) AS IS_LIKED
            FROM SNS_SHORT_VIDEOS S
            JOIN SNS_USERS U ON S.USER_ID = U.USER_ID
            ORDER BY S.CREATED_AT DESC
            LIMIT ? OFFSET ?
        `;

        const [shortsList] = await db.query(sql, [req.user.userId, parseInt(limit), parseInt(offset)]);
        console.log("sql====>",sql);
        res.json({
            msg: "success",
            list: shortsList,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });

    } catch (error) {
        console.error("쇼츠 피드 로드 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "서버 오류가 발생했습니다." });
    }
});

router.post('/view/:shortId', authMiddleware, async (req, res) => {
    const { shortId } = req.params;

    try {
        const sql = "UPDATE SNS_SHORT_VIDEOS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE SHORT_ID = ?";
        await db.query(sql, [shortId]);

        res.json({
            msg: "success",
            shortId: shortId
        });
    } catch (error) {
        console.error("조회수 증가 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "조회수 증가 처리 중 오류가 발생했습니다." });
    }
});

router.post('/like/:shortId', authMiddleware, async (req, res) => {
    const { shortId } = req.params;
    const userId = req.user.userId;

    if (!shortId || !userId) {
        return res.status(400).json({ msg: "fail", error: "Short ID 또는 User ID가 누락되었습니다." });
    }

    try {
        // 1단계: 좋아요가 이미 존재하는지 확인
        const checkSql = "SELECT LIKE_ID FROM SNS_LIKES WHERE SHORT_ID = ? AND USER_ID = ?";
        const [existingLike] = await db.query(checkSql, [shortId, userId]);

        if (existingLike.length > 0) {
            // 좋아요 취소 (DELETE)
            const deleteSql = "DELETE FROM SNS_LIKES WHERE SHORT_ID = ? AND USER_ID = ?";
            await db.query(deleteSql, [shortId, userId]);

            // 좋아요 취소 후 총 좋아요 수를 다시 조회
            const countSql = "SELECT COUNT(*) AS like_count FROM SNS_LIKES WHERE SHORT_ID = ?";
            const [result] = await db.query(countSql, [shortId]);
            
            res.json({
                msg: "unlike_success",
                action: "unliked",
                shortId: shortId,
                like_count: result[0].like_count
            });

        } else {
            // 좋아요 등록 (INSERT)
            const insertSql = "INSERT INTO SNS_LIKES (SHORT_ID, USER_ID) VALUES (?, ?)";
            await db.query(insertSql, [shortId, userId]);

            // 좋아요 등록 후 총 좋아요 수를 다시 조회
            const countSql = "SELECT COUNT(*) AS like_count FROM SNS_LIKES WHERE SHORT_ID = ?";
            const [result] = await db.query(countSql, [shortId]);

            res.json({
                msg: "like_success",
                action: "liked",
                shortId: shortId,
                like_count: result[0].like_count
            });
        }
        
    } catch (error) {
        console.error("좋아요 토글 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "좋아요 처리 중 오류가 발생했습니다." });
    }
});

router.post('/upload', authMiddleware, upload.single('videoFile'), 
    async (req, res) => {

    console.log("--- 업로드 요청 디버깅 ---");
    console.log("req.file:", req.file);     
    console.log("req.body:", req.body);    
    console.log("-----------------------");
    
    // 1. req.body의 안전성 강화 (이전 오류 해결용)
    const { content = '' } = req.body || {}; 
    
    const userId = req.user.userId;
    
    const filePath = req.file ? `/uploads/${req.file.filename}` : null; 

    if (!filePath) {
        return res.status(400).json({ msg: "fail", error: "업로드할 동영상 파일이 누락되었습니다." });
    }


    const videoUrl = filePath; 
    const description = content;

    
    try {
        
      const insertSql = `
            INSERT INTO SNS_SHORT_VIDEOS 
            (USER_ID, VIDEO_URL, DESCRIPTION) 
            VALUES (?, ?, ?)
        `;
        // DB 쿼리에 videoUrl과 description 변수를 사용
        const [insertResult] = await db.query(insertSql, [userId, videoUrl, description]); 
        
        const shortId = insertResult.insertId;

        res.status(201).json({
            msg: "upload_success",
            shortId: shortId,
            videoPath: filePath,
            content: content // 클라이언트 응답 시에는 content 이름 그대로 사용해도 무방
        });

    } catch (error) {
        // ... 오류 처리 로직
        console.error("쇼츠 업로드 및 DB 삽입 중 에러:", error);
        res.status(500).json({ msg: "fail", error: "쇼츠 등록 중 서버 오류가 발생했습니다." });
    }
});

module.exports = router;