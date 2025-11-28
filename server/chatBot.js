const { GoogleGenAI } = require("@google/genai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = "gemini-2.5-flash"; 


const activeAiChats = new Map();

function getOrCreateAiChat(conversationId, history = []) {
    if (activeAiChats.has(conversationId)) {
        // 오타 수정 후의 올바른 코드
        return activeAiChats.get(conversationId); 
    }

    const chat = ai.chats.create({ 
        model, 
        history, 
        // tools를 create 시점에 포함시켜 sendMessage 호출을 단순화
        tools: [{ googleSearch: {} }] 
    });
    activeAiChats.set(conversationId, chat);
    
    return chat;
}

async function sendAiMessage(conversationId, messageText, history = []) {
    
 const chat = getOrCreateAiChat(conversationId, history); 
    
    // ⭐️ [최종 확정] 1.30.0 버전에서 가장 기본적인 Content 구조를 따름
    // 'role'은 history에 의해 관리되므로, 현재 메시지는 parts만 보냅니다.
    const messageContent = {
        parts: [ 
            { text: messageText } 
        ]
    };

    try {
        // chat.sendMessage()에 명시적으로 정의한 Content 객체를 전달
        const result = await chat.sendMessage(messageContent); 
        
        return result.text;
    } catch (error) {
        console.error(`[Gemini API Error - 대화방 ${conversationId}]`, error); 
        throw new Error("Gemini API 호출 중 오류 발생");
    }
}

module.exports = { sendAiMessage, getOrCreateAiChat };