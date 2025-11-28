
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
        return activeAiChats.get(conversationId);
    }

    const chat = ai.chats.create({ model, history });
    activeAiChats.set(conversationId, chat);
    
    return chat;
}

async function sendAiMessage(conversationId, messageText) {
    const chat = getOrCreateAiChat(conversationId);
    

    try {
        const result = await chat.sendMessage({ 
            text: messageText,
      
            tools: [{ googleSearch: {} }] 
        });
        
        return result.text;
    } catch (error) {
        console.error(`[Gemini API Error - 대화방 ${conversationId}]`, error);
        throw new Error("Gemini API 호출 중 오류 발생");
    }
    
  
}

module.exports = { sendAiMessage, getOrCreateAiChat };