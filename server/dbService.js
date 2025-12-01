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
        FROM SNS_MESSAGES 
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



async function insertMessage(message) {
    const { conversationId, senderId, text, isRead = 0 } = message;
    
 
    const readStatus = senderId === GEMINI_BOT_ID ? 1 : isRead;
    console.log("text===>",text);


const query = `
        INSERT INTO SNS_MESSAGES (CONVERSATION_ID, SENDER_ID, CONTENT, IS_READ)
        VALUES (?, ?, ?, ?)
    `;
try {
const [result] = await db.query(query, [
            conversationId, 
            senderId,       
            text,           
            readStatus      
        ]);
    return result.insertId;
} catch (error) {
    console.error("메시지 저장 오류:", error);
    throw error;
}

}

module.exports = { getMessagesByConversationId, insertMessage };