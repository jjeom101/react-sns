const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const { checkSql } = require('../utils/db_helpers');

async function ensureConversationExists(user1, user2) {
    const users = [user1, user2].sort(); 
    let existing = []; 


    const findQuerySimple = `
        SELECT C.CONVERSATION_ID
        FROM SNS_CONVERSATIONS C
        WHERE C.TYPE = 'DM'
        AND C.CONVERSATION_ID IN (
            SELECT CONVERSATION_ID FROM SNS_PARTICIPANTS WHERE USER_ID = ?
        )
        AND C.CONVERSATION_ID IN (
            SELECT CONVERSATION_ID FROM SNS_PARTICIPANTS WHERE USER_ID = ?
        )
    `;
    

    const [rows] = await db.query(findQuerySimple, [users[0], users[1]]);
    existing = rows;


    if (existing.length > 0) { 
        return existing[0].CONVERSATION_ID;
    }


    const insertConvQuery = `INSERT INTO SNS_CONVERSATIONS (TYPE) VALUES ('DM')`; 
    
    
    const [convResult] = await db.query(insertConvQuery);
    const newConvId = convResult.insertId;

    if (!newConvId) {
        throw new Error("Failed to retrieve new conversation ID."); 
    }
    

    const insertParticipantsQuery = `
        INSERT INTO SNS_PARTICIPANTS (CONVERSATION_ID, USER_ID, LAST_READ_AT)
        VALUES (?, ?, NOW()), (?, ?, NOW())
    `;
    
    await db.query(insertParticipantsQuery, [
        newConvId, users[0],
        newConvId, users[1]
    ]);
    

    return newConvId;
}


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
    

    if (!targetUserId) {
        return res.status(400).json({ result: 'fail', msg: "targetUserId 필요함" });
    }

    if (!myId) {
        return res.status(401).json({ result: 'fail', msg: "인증 정보 누락" });
    }

    try {
        let sql = `SELECT * FROM  SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`; 
        
        
        const [rows] = await db.query(sql, [myId, targetUserId]);

        
        const isFollowing = rows.length > 0;

        
        
        res.json({
            result: "success",
            isFollowing: isFollowing
        });
        
    } catch (e) {
        console.error("!!! DB 쿼리 중 오류 발생:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
    
});


router.post("/", authMiddleware, async (req, res) => {
    const { targetUserId } = req.body;
    const myId = req.user.userId;

    if (!targetUserId) {
        return res.status(400).json({ result: 'fail', msg: "targetUserId 필요함" });
    }

    try {
       let selectSql = `SELECT * FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`;
       const [exist] = await db.query(selectSql, [myId, targetUserId]);

        if (exist.length > 0) {
            
            await db.query(`DELETE FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`, 
                             [myId, targetUserId]);
            
            
            

            return res.json({
                result: "success",
                action: "unfollow"
            });
        } else {
            
            
            
            const [insert] = await db.query(`INSERT INTO SNS_FOLLOWS (FOLLOWER_ID, FOLLOWING_ID) VALUES (?, ?)`,
                [myId, targetUserId]
            );

            
            
            const conversationId = await ensureConversationExists(myId, targetUserId); 

            
            return res.json({
                result: "success",
                action: "follow",
                insertId: insert.insertId,
                conversationId: conversationId 
            });
        }

    } catch (e) {
        console.error("팔로우 또는 채팅방 관리 중 오류 발생:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
});

module.exports = router;