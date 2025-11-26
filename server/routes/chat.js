const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth"); // JWT 인증 미들웨어


router.post('/message', authMiddleware, async (req, res) => {
    const { conversationId, senderId, content } = req.body;

    if (req.userId !== senderId) {
        return res.status(403).json({ result: 'fail', msg: '메시지 발신 권한이 없습니다.' });
    }

    try {

        let sql = "INSERT INTO SNS_MESSAGES (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (?, ?, ?)";
       const [dbResult] = await db.query(sql, [conversationId, senderId, content]);
        
        if (dbResult.affectedRows === 0) {
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
        console.error("메시지 저장 오류:", error);
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