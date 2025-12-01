const { GoogleGenAI } = require("@google/genai");
// CHAT_TTL_MS, activeAiChats, cleanupInactiveChats는 더 이상 사용되지 않습니다.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = "gemini-2.5-flash";


// 🚨 Chat 객체 사용을 포기했으므로 캐싱 관련 함수 및 맵은 제거하거나 주석 처리해야 합니다.

const activeAiChats = new Map(); // (주석 처리 또는 제거 권장)
function getOrCreateAiChat(conversationId, history = []) { 
    // Chat 인스턴스 대신 generateContent를 사용하므로 이 함수는 더 이상 유효하지 않습니다.
    return { error: "Chat functionality disabled" }; 
} 
function cleanupInactiveChats() {
    // Chat 객체가 없으므로 정리할 것도 없습니다. (setInterval 호출도 제거해야 함)
    // console.log("Chat cleanup is skipped.");
}


async function sendAiMessage(conversationId, messageText, history = []) {

    const cleanedMessageText = String(messageText).trim();
    if (cleanedMessageText.length === 0) {
        throw new Error("Cannot send empty message to Gemini API.");
    }

    // 1. 기존의 강력한 validHistory 재구성 로직 유지 (history 무결성 확보)
    const validHistory = history
        .filter(m => 
            m && 
            typeof m === 'object' && 
            typeof m.role === 'string' && 
            (m.role.toLowerCase() === 'user' || m.role.toLowerCase() === 'model') &&
            Array.isArray(m.parts) && 
            m.parts.length > 0
        )
        .map(m => {
            const textPart = m.parts.find(p => p.text && String(p.text).trim().length > 0);
            if (textPart) {
                return {
                    role: m.role.toLowerCase(), 
                    parts: [{ text: String(textPart.text).trim() }]
                };
            }
            return null;
        })
        .filter(m => m !== null);

    // 2. 현재 메시지를 Content 객체로 구성
    const userMessageContent = {
        role: 'user', 
        parts: [{ text: cleanedMessageText }]
    };

    // 3. history와 현재 메시지를 하나의 Contents 배열로 결합
    const contents = [...validHistory, userMessageContent]; 

    try {
        // 🚨 최후의 수정: ai.models.generateContent 호출! (Chat 객체 사용 중단)
        const response = await ai.models.generateContent({
            model: model, 
            contents: contents, // history와 현재 메시지를 통째로 전달
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        // 4. 응답 구조가 달라졌으므로 응답 텍스트를 새로운 경로로 반환
        return response.text; 
    } catch (error) {
        console.error(`[Gemini API Error - 대화방 ${conversationId}]`, error);
        throw new Error("Gemini API 호출 중 오류 발생");
    }
}

// 🚨 module.exports도 변경되어야 함
module.exports = { sendAiMessage, getOrCreateAiChat, cleanupInactiveChats };