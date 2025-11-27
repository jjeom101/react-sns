import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, AppBar, Toolbar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import io from 'socket.io-client'; 
import { jwtDecode } from "jwt-decode";
import { useNavigate ,useParams} from 'react-router-dom';

function Messenger() {
    const navigate = useNavigate();
    
    const params = useParams(); 
    
    const conversationId = params.conversationId || params.partnerId;
    const partnerId = params.partnerId || conversationId;
    
    const [userId, setUserId] = useState(null); 
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState(''); 
    const [partnerName, setPartnerName] = useState(null); 
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null); 

    const markAsRead = useCallback((convId, uId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`http://localhost:3010/chat/read`, {
            method: "PATCH",
            headers: { 
                "Content-type": "application/json",
                "Authorization": `Bearer ${token}`
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

        let currentSocket = null;

        try {
            const decoded = jwtDecode(token);
            const currentId = decoded.userId || decoded.id;

            setUserId(currentId);
            
            const actualConversationId = parseInt(conversationId, 10);
            
            if (isNaN(actualConversationId)) {
                navigate("/chatlist");
                return;
            }
            
            const loadHistory = async () => {
                try {
                    const response = await fetch(`http://localhost:3010/chat/messages/${actualConversationId}`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    
                    const data = await response.json();
                    
                    setMessages(data.messages || []);
                    
                    if (data.partnerName) { 
                        setPartnerName(data.partnerName);
                    } else if (partnerId) {
                        setPartnerName(partnerId); 
                    }
                    
                    markAsRead(actualConversationId, currentId);
                    
                } catch (e) {
                }
            };
            
            loadHistory(); 
            
            socketRef.current = io("http://localhost:3010", {
                query: { 
                    token: token, 
                    currentId: currentId, 
                    conversationId: actualConversationId 
                } 
            });
            currentSocket = socketRef.current;
            
            currentSocket.on('connect', () => {
            });
            
            currentSocket.on('connect_error', (err) => {
            });
            
            currentSocket.on('newMessage', (msg) => {
                if (parseInt(msg.conversationId, 10) === actualConversationId) {
                    setMessages(prev => [...prev, msg]);
                    markAsRead(actualConversationId, currentId);
                }
            });

        } catch (e) {
            navigate("/login");
        }
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate, conversationId, markAsRead, partnerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    
    function sendMessage(){
        const currentSocket = socketRef.current;
        const trimmedInput = input.trim();
        const token = localStorage.getItem("token");
        let messageData; 

        const actualConversationId = parseInt(conversationId, 10);
        
        
        if (trimmedInput && currentSocket && userId && !isNaN(actualConversationId)) {
            
            messageData = {
                conversationId: actualConversationId, 
                senderId: userId,
                receiverId: partnerId, 
                text: trimmedInput,
                timestamp: new Date().toISOString()
            };
            
            currentSocket.emit('sendMessage', messageData);


            setMessages((prevMessages) => [...prevMessages, messageData]);
            setInput('');

            fetch("http://localhost:3010/chat/message",{
                method : "POST",
                headers : {
                    "Content-type" : "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body : JSON.stringify({
                    conversationId: actualConversationId, 
                    senderId: userId, 
                    content: trimmedInput 
                }) 
            })
            .then(res => res.json())
            .then(data => {
            })
            .catch(error => {
            });
        }
    }


    return (
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {partnerName ? `${partnerName} 님과의 채팅` : '채팅 로드 중...'}
                    </Typography>
                </Toolbar>
            </AppBar>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                <List>
                    {messages.map((msg, index) => {
                        const sender = msg.senderId || msg.SENDER_ID;
                        const isMyMessage = String(sender) === String(userId); 
                        
                        return (
                            <ListItem 
                                key={index} 
                                
                                sx={{ justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}
                            >
                                <Paper 
                                    elevation={1} 
                                    sx={{ 
                                        p: 1, 
                                        maxWidth: '70%', 
                                        bgcolor: isMyMessage ? '#DCF8C6' : 'white', 
                                        borderRadius: '10px'
                                    }}
                                >
                                    <ListItemText 
                                        primary={msg.text || msg.CONTENT} 
                                        secondary={isMyMessage ? '나' : partnerName || partnerId} 
                                        sx={{ textAlign: 'left' }}
                                    />
                                </Paper>
                            </ListItem>
                        );
                    })}
                    <div ref={messagesEndRef} /> 
                </List>
            </Box>
            
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