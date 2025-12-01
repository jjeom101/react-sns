import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    AppBar, 
    Toolbar, 
    IconButton 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import io from 'socket.io-client'; 
import { jwtDecode } from "jwt-decode";
import { useNavigate ,useParams} from 'react-router-dom';

import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm'; 

const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // 한국 시간 형식으로 시:분 표시
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '시간 정보 없음';
    }
};

function Messenger() {
    const navigate = useNavigate();
    
    const params = useParams(); 

    const BOT_ID = 'GEMINI_BOT'; 
    const BOT_NAME = 'Gemini 챗봇';
    
    const conversationId = params.conversationId || params.partnerId;
    const partnerId = params.partnerId || conversationId;
    
    const [userId, setUserId] = useState(null); 
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState(''); 
    const [partnerName, setPartnerName] = useState(null); 
    const [showRefreshButton, setShowRefreshButton] = useState(false); 
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null); 
    const tempIdRef = useRef(0); 
    const refreshTimerRef = useRef(null); 

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current); 
            refreshTimerRef.current = null;
        }
    }, []);

    const markAsRead = useCallback((convId, uId) => {
        const token = localStorage.getItem("token");
        if (!token || !convId || !uId) return;

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

    const handleAutoRefresh = () => {
        console.log("⏰ 20초 경과: 응답 지연으로 페이지를 새로고침합니다.");
        clearRefreshTimer();
        window.location.reload();
    };
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인 후 이용해주세요.");
            navigate("/login");
            return;
        }

        let currentSocket = null;
        let currentId = null;
        const actualConversationId = parseInt(conversationId, 10);

        try {
            const decoded = jwtDecode(token);
            currentId = decoded.userId || decoded.id;

            setUserId(currentId);
            
            if (String(partnerId) === BOT_ID) {
                setPartnerName(BOT_NAME);
            }
            
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
                    
                    clearRefreshTimer(); 
                    
                } catch (e) {
                    console.error("Failed to load message history:", e);
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
                console.log("Socket connected successfully.");
            });
            
            currentSocket.on('connect_error', (err) => {
                console.error("Socket connection error:", err);
            });
            
            currentSocket.on('newMessage', (msg) => {
                const incomingConvId = parseInt(msg.conversationId, 10);
                
                if (incomingConvId === actualConversationId) {
                    
                    const isMyOwnMessage = String(msg.senderId) === String(currentId);
                    const isPartnerMessage = !isMyOwnMessage; 

                    if (isPartnerMessage) {
                        clearRefreshTimer(); 
                        console.log("✅ 상대방 응답 수신 완료! 자동 새로고침 타이머 해제.");
                    }
                    
                    setMessages(prevMessages => {
                        if (isMyOwnMessage) {
                            if (msg.tempId && msg.MESSAGE_ID) { 
                                const isAlreadyReplaced = prevMessages.some(m => String(m.MESSAGE_ID) === String(msg.MESSAGE_ID));
                                if (!isAlreadyReplaced) {
                                    return prevMessages.map(m => 
                                        String(m.tempId) === String(msg.tempId) 
                                        ? { ...m, MESSAGE_ID: msg.MESSAGE_ID, CREATED_AT: msg.CREATED_AT || m.CREATED_AT, tempId: undefined }
                                        : m
                                    );
                                }
                            }
                            return prevMessages;
                        } 
                        
                        const isDuplicate = prevMessages.some(m => String(m.MESSAGE_ID) === String(msg.MESSAGE_ID));
                        
                        if (!isDuplicate) {
                            return [...prevMessages, msg];
                        }
                        
                        return prevMessages; 
                    });
                    
                    markAsRead(actualConversationId, currentId);
                }
            });

        } catch (e) {
            console.error("Initial setup failed:", e);
            navigate("/login");
        }
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            clearRefreshTimer(); 
        };
    }, [navigate, conversationId, markAsRead, partnerId, clearRefreshTimer]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    
    function sendMessage(){
        const currentSocket = socketRef.current;
        const trimmedInput = input.trim();
        const actualConversationId = parseInt(conversationId, 10);
        
        if (trimmedInput && currentSocket && userId && !isNaN(actualConversationId)) {
            
            const tempId = `temp-${tempIdRef.current++}`; 
            
            const messageDataForDisplay = {
                conversationId: actualConversationId, 
                senderId: userId,
                receiverId: partnerId, 
                text: trimmedInput,
                tempId: tempId, 
                CREATED_AT: new Date().toISOString()
            };

            setMessages((prevMessages) => [...prevMessages, messageDataForDisplay]); 
            
            const messageToSendToServer = {
                conversationId: actualConversationId, 
                senderId: userId,
                receiverId: partnerId, 
                text: trimmedInput,
                tempId: tempId
            };

            currentSocket.emit('sendMessage', messageToSendToServer);
            
            setInput('');
            
            clearRefreshTimer(); 

            console.log("💬 메시지 전송. 5초 후 자동 새로고침 타이머 시작.");
            
            refreshTimerRef.current = setTimeout(handleAutoRefresh, 5000); 
            
        }
    }


    return (
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
            <AppBar position="static">
                <Toolbar>
                     <IconButton 
                        edge="start" 
                        color="inherit" 
                        aria-label="back" 
                        onClick={() => navigate("/chatlist")}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            flexGrow: 1,
                            textAlign: 'center', 
                            mr: 6
                        }}
                    >
                        {partnerName ? `${partnerName} 님과의 채팅` : '채팅 로드 중...'}
                    </Typography>
                </Toolbar>
            </AppBar>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, bgcolor: '#E5DDD5' }}>
                <List>
                    {messages.map((msg, index) => {
                        const sender = msg.senderId || msg.SENDER_ID; 
                        const content = msg.text || msg.CONTENT;
                        const createdAt = msg.CREATED_AT || new Date().toISOString();
                        const isMyMessage = String(sender) === String(userId); 
                        
                        const isBotMessage = String(sender) === BOT_ID;

                        const bubbleStyle = {
                            p: 1.2, 
                            maxWidth: '100%', 
                            bgcolor: isMyMessage ? '#DCF8C6' : (isBotMessage ? '#F0F0F0' : '#FFFFFF'), 
                            borderRadius: isMyMessage 
                                ? '15px 15px 0 15px' 
                                : '15px 15px 15px 0', 
                            wordBreak: 'break-word',
                            
                            // 챗 버블 내부 스타일 수정: 시간 포함을 위해 flexbox 적용
                            display: 'flex', 
                            flexDirection: 'column', 
                            position: 'relative', 
                            
                            '& pre': {
                                bgcolor: '#272822',
                                color: '#f8f8f2',
                                p: 1,
                                borderRadius: '4px',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap'
                            },
                            '& code': {
                                bgcolor: '#e0e0e0',
                                p: '2px 4px',
                                borderRadius: '3px'
                            }
                        };
                        
                        // 시간 표시 컴포넌트 (버블 내부에 위치)
                        const timeDisplay = (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: isMyMessage ? '#666' : '#999', 
                                    alignSelf: 'flex-end', // 오른쪽 하단 정렬
                                    mt: 0.5, 
                                    fontSize: '0.65rem'
                                }}
                            >
                                {formatTime(createdAt)}
                            </Typography>
                        );

                        return (
                            <ListItem 
                                key={msg.MESSAGE_ID || msg.tempId || `idx-${index}`} 
                                sx={{ 
                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                                    p: 0.5,
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: isMyMessage ? 'row-reverse' : 'row', 
                                    alignItems: 'flex-end',
                                    maxWidth: '100%' 
                                }}>
                                    
                                    <Paper elevation={1} sx={bubbleStyle}>
                                        
                                        {isBotMessage ? (
                                            <Box>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        textAlign: 'left', 
                                                        color: '#999',
                                                        fontWeight: 'bold',
                                                        display: 'block',
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {partnerName || partnerId}
                                                </Typography>
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // 컴포넌트 렌더링 오버라이드 (필요시 추가)
                                                    }}
                                                >
                                                    {content}
                                                </ReactMarkdown>
                                                {timeDisplay} {/* 챗봇 메시지에 시간 추가 */}
                                            </Box>
                                        ) : (
                                            <Box> {/* 일반 메시지 내용과 시간을 포함하는 컨테이너 */}
                                                <ListItemText 
                                                    primary={
                                                        <Typography variant="body1" sx={{ color: '#333' }}>
                                                            {content}
                                                        </Typography>
                                                    } 
                                                    secondary={
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                textAlign: 'left', 
                                                                color: isMyMessage ? '#666' : '#999',
                                                                fontWeight: 'bold',
                                                                display: 'block',
                                                                mt: 0.5
                                                            }}
                                                        >
                                                            {isMyMessage ? '나' : partnerName || partnerId}
                                                        </Typography>
                                                    }
                                                    sx={{ m: 0, '& .MuiListItemText-primary': { mb: 0.5 } }}
                                                />
                                                {timeDisplay} {/* 내/상대방 메시지에 시간 추가 */}
                                            </Box>
                                        )}
                                    </Paper>
                                </Box>
                            </ListItem>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </List>
            </Box>
            
            <Box sx={{ p: 1, display: 'flex', borderTop: '1px solid #ddd', bgcolor: '#f0f0f0' }}>
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
                    sx={{ 
                        mr: 1, 
                        bgcolor: 'white', 
                        borderRadius: '4px',
                        alignSelf: 'center', 
                        '& .MuiInputBase-root': { 
                            minHeight: 40, 
                            alignItems: 'center',
                            py: 0
                        },
                        '& .MuiInputBase-input': { 
                            paddingTop: '8px', 
                            paddingBottom: '8px',
                        }
                    }}
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={sendMessage}
                    endIcon={<SendIcon />}
                    disabled={!userId || input.trim().length === 0} 
                    sx={{ 
                        fontSize: '0.875rem', 
                        minWidth: '60px' 
                    }}
                >
                    
                </Button>
            </Box>
        </Container>
    );
}

export default Messenger;