import React, { useState, useEffect, useRef,useCallback } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, AppBar, Toolbar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import io from 'socket.io-client'; 
import { jwtDecode } from "jwt-decode";
import { useNavigate ,useParams} from 'react-router-dom';

const SOCKET_SERVER_URL = "http://localhost:3010"; 
const CHAT_API_URL = "http://localhost:3010/chat";

const getConversationId = (id1, id2) => {
    return [id1, id2].sort().join('_');
};

function Messenger() {
    const navigate = useNavigate();
    // const { partnerId } = useParams();
    
    // 1. 상태 관리
    const [userId, setUserId] = useState(null); 
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState(''); 
    

    const [partnerId, setPartnerId] = useState(null); 

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null); 

    const markAsRead = useCallback((convId, uId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${CHAT_API_URL}/read`, {
            method: "PATCH",
            headers: { 
                "Content-type": "application/json",
                "Authorization": `Bearer ${token}` // 💡 [추가] 2. 인증 헤더
            },
            body: JSON.stringify({ 
                conversationId: convId, 
                userId: uId, 
                readAt: new Date().toISOString()
                })
                });
    },[]);
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인 후 이용해주세요.");
            navigate("/login");
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const currentId = decoded.userId || decoded.id;
            setUserId(currentId);

            socketRef.current = io(SOCKET_SERVER_URL, {
    query: { token: token, currentId: currentId, partnerId: partnerId } // 서버로 사용자 정보 전달
});
            const currentSocket = socketRef.current;
            const conversationId = getConversationId(currentId, partnerId);

            currentSocket.emit('load_history', { currentId: currentId, partnerId: partnerId });
            currentSocket.on('history_loaded', (history) => {
                 setMessages(history);
                 markAsRead(conversationId, currentId);
                });
                
        

            // socket.emit('load_history', { currentId: currentId, partnerId: partnerId });
            // socket.on('history_loaded', (history) => {
            //      setMessages(history);
            // });

        } catch (e) {
            console.error("인증 또는 소켓 연결 오류:", e);
            navigate("/login");
        }
        // 컴포넌트 언마운트 시 소켓 연결 해제
        return () => {
           if (socketRef.current) { // 💡 socketRef.current 사용
                socketRef.current.disconnect();
            }
        };
    }, [navigate, partnerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    
    function sendMessage(){
        const currentSocket = socketRef.current;
        const trimmedInput = input.trim();
        const token = localStorage.getItem("token");
        let messageData;

        if (trimmedInput && currentSocket && userId) {
            const conversationId = getConversationId(userId, partnerId);

             messageData = {

                conversationId: conversationId,
                senderId: userId,
                receiverId: partnerId,
                text: trimmedInput,
                timestamp: new Date().toISOString()
            };
            //currentSocket 를 이용해서 실시간 전송
            currentSocket.emit('sendMessage', messageData);

            //바로 반응
            setMessages((prevMessages) => [...prevMessages, messageData]);
            setInput('');

        }
         fetch("http://localhost:3010/chat/message",{
        method : "POST",
        headers : {
            "Content-type" : "application/json",
            "Authorization": `Bearer ${token}`
        },
        body : JSON.stringify(messageData)
    })
    .then(res => res.json())
    .then(data => {
        // alert("저장되었습니다!");
        if (data.result === 'success') {
                console.log("메시지 DB 저장 성공");
            } else {
                console.error("메시지 DB 저장 실패:", data.msg);
            }
    })
    .catch(error => {
            console.error("메시지 저장 fetch 오류:", error);
        });
    }


    return (
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
            {/* 상단바: 상대방 ID 표시 */}
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {partnerId} 님과의 채팅
                    </Typography>
                </Toolbar>
            </AppBar>
            
            {/* 메시지 목록 영역 */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                <List>
                    {messages.map((msg, index) => (
                        <ListItem 
                            key={index} 
                            
                            sx={{ justifyContent: msg.senderId === userId ? 'flex-end' : 'flex-start' }}
                        >
                            <Paper 
                                elevation={1} 
                                sx={{ 
                                    p: 1, 
                                    maxWidth: '70%', 
                                    bgcolor: msg.senderId === userId ? '#DCF8C6' : 'white', // 배경색 구분
                                    borderRadius: '10px'
                                }}
                            >
                                <ListItemText 
                                    primary={msg.text} 
                                    secondary={msg.senderId === userId ? '나' : msg.senderId} 
                                    sx={{ textAlign: 'left' }}
                                />
                            </Paper>
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} /> {/* 자동 스크롤을 위한 요소 */}
                </List>
            </Box>
            
            {/* 메시지 입력 영역 */}
            <Box sx={{ p: 1, display: 'flex', borderTop: '1px solid #ddd' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="메시지를 입력하세요"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); 
                            sendMessage();
                        }
                    }}
                    sx={{ mr: 1 }}
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={sendMessage}
                    endIcon={<SendIcon />}
                    disabled={!userId} 
                >
                    전송
                </Button>
            </Box>
        </Container>
    );
}

export default Messenger;