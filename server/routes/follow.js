const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const { checkSql } = require('../utils/db_helpers');

// 1) 특정 유저 팔로우 상태 조회
router.get("/list", authMiddleware, async (req, res) => {
     const myId = req.user.userId; 
    
    try {
     
        const usersSql = `SELECT USER_ID, NICKNAME, PROFILE_IMG FROM SNS_USERS WHERE USER_ID != ?`;
        const [users] = await db.query(usersSql, [myId]);

       
        const followingsSql = `SELECT FOLLOWING_ID FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ?`;
        const [followingRows] = await db.query(followingsSql, [myId]);
        
        const followingIds = followingRows.map(row => row.FOLLOWING_ID);

       
        res.json({
            result: "success",
            users: users,             
            followingIds: followingIds 
        });

    } catch (e) {
        console.error("사용자 목록 조회 중 오류:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
});

router.get("/status", authMiddleware, async (req, res) => {
    const { targetUserId } = req.query;  
    
 
    const myId = req.user.userId; 
    

    console.log("--- GET /follow/status 요청 시작 ---");
    console.log(`요청자(myId): ${myId}, 대상(targetUserId): ${targetUserId}`);

    if (!targetUserId) {
      
        console.log("오류: targetUserId가 누락되었습니다.");
        return res.status(400).json({ result: 'fail', msg: "targetUserId 필요함" });
    }

  
    if (!myId) {
        console.log("오류: 인증 정보(myId)가 req.user.userId에 없습니다.");
        return res.status(401).json({ result: 'fail', msg: "인증 정보 누락" });
    }

    try {
        let sql = `SELECT * FROM  SNS_FOLLOWS WHERE FOLLOWER_ID = ?`; 
        
    
        console.log(`DB 쿼리 실행: ${sql}`);
        console.log(`파라미터: [${myId}, ${targetUserId}]`);
        
        const [rows] = await db.query(sql, [myId]);

       
        console.log("DB 쿼리 성공. 결과 행 수:", rows.length);
        
        const isFollowing = rows.length > 0;

       
        console.log(`최종 응답: { result: "success", isFollowing: ${isFollowing} }`);
        
        res.json({
            result: "success",
            isFollowing: isFollowing
        });
        
    } catch (e) {
        // 6. DB 쿼리 실패 로그
        console.error("!!! DB 쿼리 중 오류 발생:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
    
    console.log("--- GET /follow/status 요청 종료 ---");
});

// 2) 팔로우/언팔로우 토글
router.post("/", authMiddleware, async (req, res) => {
    const { targetUserId } = req.body;
    
    const myId = req.user.userId;

    console.log("targetUserId====> ",targetUserId);
    console.log("myId====> ",myId);

    if (!targetUserId) {
        return res.status(400).json({ result: 'fail', msg: "targetUserId 필요함" });
    }

    try {
       let selectSql = `SELECT * FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`;
       const [exist] = await db.query(selectSql, [myId, targetUserId]);

        if (exist.length > 0) {
            // 언팔로우
         await db.query(`DELETE FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`, 
                            [myId, targetUserId]);

            return res.json({
                result: "success",
                action: "unfollow"
            });
        } else {
            // 팔로우
           const [insert] = await db.query(`INSERT INTO SNS_FOLLOWS (FOLLOWER_ID, FOLLOWING_ID) VALUES (?, ?)`,
                [myId, targetUserId]
            );

            return res.json({
                result: "success",
                action: "follow",
                insertId: insert.insertId
            });
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
});

module.exports = router;
