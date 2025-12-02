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
        console.log(`[ChatLog] 기존 대화방 찾음: ${existing[0].CONVERSATION_ID}`);
        return existing[0].CONVERSATION_ID;
    }


    const insertConvQuery = `INSERT INTO SNS_CONVERSATIONS (TYPE) VALUES ('DM')`; 
    console.log('[ChatLog] 새로운 대화방 생성 시도...');
    
    const [convResult] = await db.query(insertConvQuery);
    const newConvId = convResult.insertId;

    if (!newConvId) {
        console.error("[ChatLog] 🚨 심각한 오류: 새로 생성된 CONVERSATION_ID를 가져오지 못했습니다. (DB AUTO_INCREMENT 확인 필요)");
        throw new Error("Failed to retrieve new conversation ID."); 
    }
    console.log(`[ChatLog] 새로운 대화방 ID: ${newConvId}`);

    const insertParticipantsQuery = `
        INSERT INTO SNS_PARTICIPANTS (CONVERSATION_ID, USER_ID, LAST_READ_AT)
        VALUES (?, ?, NOW()), (?, ?, NOW())
    `;
    console.log(`[ChatLog] 참여자 등록 시도: ${users[0]}, ${users[1]}`);
    await db.query(insertParticipantsQuery, [
        newConvId, users[0],
        newConvId, users[1]
    ]);
    console.log('[ChatLog] 참여자 등록 성공.');

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
        let sql = `SELECT * FROM  SNS_FOLLOWS WHERE FOLLOWER_ID = ?`; 
        
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
        console.error("!!! DB 쿼리 중 오류 발생:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
    
    console.log("--- GET /follow/status 요청 종료 ---");
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
            // --- 언팔로우 로직 ---
            await db.query(`DELETE FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?`, 
                            [myId, targetUserId]);
            
            // *주의: 언팔로우 시 대화방 삭제 여부는 서비스 정책에 따라 결정해야 합니다.
            // *일반적으로는 삭제하지 않습니다.

            return res.json({
                result: "success",
                action: "unfollow"
            });
        } else {
            // --- 팔로우 로직 (대화방 생성 위치!) ---
            
            // 1. 팔로우 테이블에 레코드 삽입
            const [insert] = await db.query(`INSERT INTO SNS_FOLLOWS (FOLLOWER_ID, FOLLOWING_ID) VALUES (?, ?)`,
                [myId, targetUserId]
            );

            // 2. 대화방 생성 또는 기존 대화방 ID 조회
            // ensureConversationExists 함수를 호출하여 대화방을 확보합니다.
            const conversationId = await ensureConversationExists(myId, targetUserId); 

            // 3. 성공 응답 반환 (프론트엔드에서 사용할 수 있도록 conversationId 포함)
            return res.json({
                result: "success",
                action: "follow",
                insertId: insert.insertId,
                conversationId: conversationId // 💡 프론트엔드에서 이 ID를 사용하여 채팅방으로 이동할 수 있습니다.
            });
        }

    } catch (e) {
        console.error("팔로우 또는 채팅방 관리 중 오류 발생:", e);
        res.status(500).json({ result: 'fail', msg: "서버 오류" });
    }
});

module.exports = router;