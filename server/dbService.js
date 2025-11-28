const db = require("./db"); 

const GEMINI_BOT_ID = 'GEMINI_BOT';

/**
 * 특정 대화방의 기존 메시지 기록을 DB에서 가져옵니다.
 * (Gemini가 맥락을 이해하는 데 필요한 senderId와 content만 가져옵니다.)
 * @param {number} conversationId - 대화방 ID
 * @returns {Promise<Array<{ senderId: string, content: string }>>}
 */
async function getMessagesByConversationId(conversationId) {
    // MESSAGE 테이블의 필드명을 확인하여 SENDER_ID와 CONTENT를 가져옵니다.
    const query = `
        SELECT SENDER_ID AS senderId, CONTENT AS content 
        FROM MESSAGE 
        WHERE CONVERSATION_ID = ? 
        ORDER BY CREATED_AT ASC
    `;
    try {
        const [rows] = await db.query(query, [conversationId]);
        return rows;
    } catch (error) {
        console.error("메시지 기록 로드 오류:", error);
        throw error;
    }
}

/**
 * 새로운 메시지를 DB에 저장합니다. (사용자 메시지 및 챗봇 응답 모두)
 * @param {Object} message - 메시지 객체 (server.js에서 생성된 aiMessage 객체 등)
 */
async function insertMessage(message) {
    const { conversationId, senderId, receiverId, text, isRead = 0 } = message;
    
    // 챗봇 응답일 경우 is_read를 1로 설정하여 바로 읽음 처리합니다.
    const readStatus = senderId === GEMINI_BOT_ID ? 1 : isRead;
    
    // DB 테이블 구조에 맞게 필드명을 사용합니다.
    const query = `
        INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, RECEIVER_ID, CONTENT, IS_READ)
        VALUES (?, ?, ?, ?, ?)
    `;
    try {
        await db.query(query, [conversationId, senderId, receiverId, text, readStatus]);
    } catch (error) {
        console.error("메시지 저장 오류:", error);
        throw error;
    }
}

module.exports = { getMessagesByConversationId, insertMessage };