const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth"); // JWT 인증 미들웨어


router.post('/message', authMiddleware, async (req, res) => {
    
    console.log("--- New Message POST Request ---");
    console.log("1-A. Authenticated User (req.user):", JSON.stringify(req.user)); 
    console.log("1-B. Received Request Body:", JSON.stringify(req.body));

    const { conversationId, senderId, content, text } = req.body; 
    const messageContent = content || text; 
    
  
    const authenticatedUserId = req.user && (req.user.userId || req.user.id || req.user.user_id);
    
    
    if (!authenticatedUserId) { // req.user 객체는 있으나 userId 필드가 없거나, req.user가 없는 경우 처리
        console.warn(`2-A. Auth Middleware Failed: Authenticated User ID is missing in req.user.`); 
        return res.status(401).json({ result: 'fail', msg: '인증 토큰 처리 실패: 사용자 ID를 식별할 수 없습니다.' });
    }
    
  
    
    if (!conversationId || !senderId || !messageContent) {
        console.error("2-B. Validation Error: Required fields missing in body.");
        
        if (!messageContent) {
            console.error("2-B-1. Missing field: messageContent (Client likely sent empty 'text').");
        }

        return res.status(400).json({ result: 'fail', msg: '필수 메시지 데이터(대화ID, 발신자ID, 내용)가 누락되었습니다.' });
    }

    if (authenticatedUserId !== senderId) {
       console.warn(`2-C. Authorization mismatch: Token ID(${authenticatedUserId}) != Body SENDER ID(${senderId})`); 
        return res.status(403).json({ result: 'fail', msg: '메시지 발신 권한이 없습니다.' });
    }

    try {
        console.log(`3. Executing DB Query: CONV_ID=${conversationId}, SENDER_ID=${senderId}`); 
        
       
        let sql = "INSERT INTO SNS_MESSAGES (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (?, ?, ?)";
        const [dbResult] = await db.query(sql, [conversationId, senderId, messageContent]); 
        
        console.log("4. DB Query Success. Insert ID:", dbResult.insertId, "Affected Rows:", dbResult.affectedRows); 
        
        if (dbResult.affectedRows === 0) {
            console.error("4-B. DB Insert Failed: 0 affected rows.");
            return res.status(500).json({ result: 'fail', msg: '메시지 저장에 실패했습니다.' });
        }
        res.status(201).json({
            result: "success",
            message: "메시지 저장 완료",
            data: { 
                messageId: dbResult.insertId,
                affectedRows: dbResult.affectedRows
            }
        });

    } catch (error) {
        console.error("5. CRITICAL ERROR (DB/Server):", error.stack); 
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});



router.patch('/read', authMiddleware, async (req, res) => {
    const { conversationId, userId } = req.body;


    try {
        const [result] = await db.query(
            "UPDATE SNS_PARTICIPANTS SET LAST_READ_AT = NOW() WHERE CONVERSATION_ID = ? AND USER_ID = ?",
            [conversationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: 'fail', msg: '참여 정보를 찾을 수 없습니다.' });
        }

        res.json({ result: 'success', msg: '읽음 처리 완료' });
    } catch (error) {
        console.error("읽음 처리 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});



router.get('/list', authMiddleware, async (req, res) => {
    const userId = req.userId; // authMiddleware에서 userId를 추출했다고 가정

    try {
        // (쿼리 예시: JOIN을 통해 채팅방 정보와 마지막 메시지를 가져와야 합니다.)
        const [rows] = await db.query(
            `SELECT * FROM SNS_PARTICIPANTS WHERE USER_ID = ?`,
            [userId]
        );

        res.json({ result: 'success', chats: rows });
    } catch (error) {
        console.error("채팅방 목록 조회 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});


module.exports = router;