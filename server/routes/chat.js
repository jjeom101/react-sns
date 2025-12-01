const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");

router.post('/dm', authMiddleware, async (req, res) => {
    const currentUserId = req.user && (req.user.userId || req.user.id || req.user.user_id || req.userId);
    const { targetUserId } = req.body;

    if (!currentUserId || !targetUserId) {
        return res.status(400).json({ msg: "fail", error: "사용자 ID 정보가 필요합니다." });
    }

    const userIds = [currentUserId, targetUserId].sort();

    try {
        let sql_check = `
            SELECT T1.CONVERSATION_ID
            FROM SNS_CONVERSATIONS T1
            JOIN SNS_PARTICIPANTS P1 ON T1.CONVERSATION_ID = P1.CONVERSATION_ID
            JOIN SNS_PARTICIPANTS P2 ON T1.CONVERSATION_ID = P2.CONVERSATION_ID
            WHERE T1.TYPE = 'DM'
            AND P1.USER_ID = ? AND P2.USER_ID = ?
            LIMIT 1;
        `;

        let [existing] = await db.query(sql_check, [userIds[0], userIds[1]]);

        let conversationId;

        if (existing.length > 0) {
            conversationId = existing[0].CONVERSATION_ID;
        } else {
            let sql_insert_conv = "INSERT INTO SNS_CONVERSATIONS (TYPE) VALUES ('DM')";
            let result_conv = await db.query(sql_insert_conv);
            conversationId = result_conv.insertId;

            let sql_insert_part = "INSERT INTO SNS_PARTICIPANTS (CONVERSATION_ID, USER_ID) VALUES (?, ?), (?, ?)";
            await db.query(sql_insert_part, [
                conversationId, currentUserId,
                conversationId, targetUserId
            ]);
        }

        res.json({
            msg: "success",
            conversationId: conversationId
        });

    } catch (error) {
        console.error("DM 대화방 처리 중 오류:", error);
        res.status(500).json({ msg: "fail", error: "대화방 처리 중 서버 오류가 발생했습니다." });
    }
});

router.post('/message', authMiddleware, async (req, res) => {
    const senderId = req.user && (req.user.userId || req.user.id || req.user.user_id || req.userId);
    const { conversationId, content, text } = req.body;
    const messageContent = content || text;
    
    if (!senderId) {
        return res.status(401).json({ result: 'fail', msg: '인증 정보가 유효하지 않습니다.' });
    }
    if (!conversationId || !messageContent) {
        return res.status(400).json({ result: 'fail', msg: '대화방 ID와 내용이 필요합니다.' });
    }
    
    console.log("conversationId ===>",conversationId);

    try {
        let sql = "INSERT INTO SNS_MESSAGES (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (?, ?, ?)";
        const [dbResult] = await db.query(sql, [conversationId, senderId, messageContent]);

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
        console.error("메시지 저장 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});

router.patch('/read', authMiddleware, async (req, res) => {
    const userId = req.user && (req.user.userId || req.user.id || req.user.user_id || req.userId);
    const { conversationId } = req.body;

    if (!userId) {
        return res.status(401).json({ result: 'fail', msg: '인증 정보가 유효하지 않습니다.' });
    }

    try {
     
        const [messageResult] = await db.query(
           
            "UPDATE SNS_MESSAGES SET IS_READ = TRUE WHERE CONVERSATION_ID = ? AND SENDER_ID != ? AND IS_READ = FALSE",
            [conversationId, userId]
        );
        
        console.log(`[Read Patch] Message updated: ${messageResult.affectedRows} rows.`);

     
        const [participantResult] = await db.query(
            "UPDATE SNS_PARTICIPANTS SET LAST_READ_AT = NOW() WHERE CONVERSATION_ID = ? AND USER_ID = ?",
            [conversationId, userId]
        );

        if (participantResult.affectedRows === 0) {
            return res.status(404).json({ result: 'fail', msg: '참여 정보를 찾을 수 없습니다.' });
        }

        res.json({ result: 'success', msg: '읽음 처리 완료', updatedMessages: messageResult.affectedRows });
    } catch (error) {
        console.error("읽음 처리 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});

router.get('/list', authMiddleware, async (req, res) => {
    const currentUserId = req.user && (req.user.userId || req.user.id || req.user.user_id || req.userId);
    
    if (!currentUserId) {
        return res.status(401).json({ result: 'fail', msg: '인증 정보가 유효하지 않습니다.' });
    }
    
    console.log(`[Chat List] 현재 조회 사용자 ID: ${currentUserId}`);
    try {
        const sql = `
            SELECT
                T1.CONVERSATION_ID,
                T1.TYPE,
                P2.USER_ID AS partnerId,
                U.USERNAME AS partnerName,
                U.PROFILE_IMG,
                P1.LAST_READ_AT,
                
                (
                    SELECT CONTENT 
                    FROM SNS_MESSAGES M_LAST 
                    WHERE M_LAST.CONVERSATION_ID = T1.CONVERSATION_ID 
                    ORDER BY M_LAST.CREATED_AT DESC 
                    LIMIT 1
                ) AS lastMessage,
                
                (
                    SELECT COUNT(M.MESSAGE_ID)
                    FROM SNS_MESSAGES M
                    WHERE M.CONVERSATION_ID = T1.CONVERSATION_ID
                      AND M.IS_READ = FALSE
                      AND M.SENDER_ID != ?
                ) AS unreadCount
            
            FROM SNS_CONVERSATIONS T1
            JOIN SNS_PARTICIPANTS P1 ON T1.CONVERSATION_ID = P1.CONVERSATION_ID
            JOIN SNS_PARTICIPANTS P2 ON T1.CONVERSATION_ID = P2.CONVERSATION_ID
            JOIN SNS_USERS U ON P2.USER_ID = U.USER_ID
            
            WHERE P1.USER_ID = ?
              AND P2.USER_ID != ?
              AND T1.TYPE = 'DM'
            
            ORDER BY T1.CONVERSATION_ID DESC;
        `;
    
        const [rows] = await db.query(sql, [currentUserId, currentUserId, currentUserId]); 

        res.json({ result: 'success', chats: rows }); 
        
    } catch (error) {
        console.error("채팅방 목록 조회 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});

router.get('/messages/:conversationId', authMiddleware, async (req, res) => {
    
    const currentUserId = req.user && (req.user.userId || req.user.id || req.user.user_id || req.userId);
    const conversationId = parseInt(req.params.conversationId, 10);

    if (isNaN(conversationId) || !currentUserId) {
        return res.status(400).json({ result: 'fail', msg: '유효하지 않은 요청입니다.' });
    }
    
    console.log(`[History] 대화 기록 조회 요청: ConvID=${conversationId}`);

    try {
        const partnerSql = `
            SELECT U.USERNAME 
            FROM SNS_PARTICIPANTS P
            JOIN SNS_USERS U ON P.USER_ID = U.USER_ID
            WHERE P.CONVERSATION_ID = ? AND P.USER_ID != ? LIMIT 1;
        `;
        const [partnerRows] = await db.query(partnerSql, [conversationId, currentUserId]);
        const partnerName = partnerRows.length > 0 ? partnerRows[0].USERNAME : '알 수 없음';

        const sql = `
            SELECT T1.MESSAGE_ID, T1.CONVERSATION_ID, T1.SENDER_ID, T1.CONTENT, T1.CREATED_AT 
            FROM SNS_MESSAGES T1
            WHERE T1.CONVERSATION_ID = ?
            ORDER BY T1.CREATED_AT ASC;
        `;
        const [messages] = await db.query(sql, [conversationId]);
        
        res.json({ 
            result: 'success', 
            messages: messages,
            partnerName: partnerName 
        });

    } catch (error) {
        console.error("채팅 기록 조회 오류:", error);
        res.status(500).json({ result: 'fail', msg: '서버 오류' });
    }
});

module.exports = router;