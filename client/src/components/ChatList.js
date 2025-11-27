import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


function ChatList() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
   

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("로그인 후 이용해주세요.");
            navigate("/login");
            return;
        }

        const fetchChatList = async () => {
            const API_URL = `http://localhost:3010/chat/list`;
            console.log("1. API 호출 시작:", API_URL);
            try {
             
                const response = await fetch(`http://localhost:3010/chat/list`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log("2. API 응답 수신, Status:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const data = await response.json();
                console.log("3. API 데이터:", data);
                if (data.result === 'success') {
                    setChatRooms(data.chats);
                } else {
                    console.error("채팅 목록 로드 실패:", data.msg);
                    setChatRooms([]); // 실패 시 빈 목록
                }
            } catch (error) {
                console.error("채팅 목록 API 호출 오류:", error);
                alert("채팅 목록을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
                console.log("4. 로딩 완료 (화면 렌더링 시도)");
            }
        };

        fetchChatList();
    }, [navigate]);

    const handleChatClick = (conversationId) => {
        // 2. 채팅방 클릭 시 해당 대화방으로 이동
        navigate(`/messeger/${conversationId}`);
        console.log("conversationId====>",conversationId);
    };

    if (loading) {
        return <Container sx={{ mt: 4 }}><Typography>채팅 목록을 불러오는 중...</Typography></Container>;
    }
    
    // 💡 데이터가 없거나 서버 응답이 비어있는 경우
    if (chatRooms.length === 0 && !loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6" align="center">현재 참여 중인 채팅방이 없습니다.</Typography>
            </Container>
        );
    }

    return (
        <Container component={Paper} sx={{ mt: 4, p: 2, height: '80vh', overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                💬 채팅 목록
            </Typography>
            <List>
                {chatRooms.map((chat) => (
                    <React.Fragment key={chat.conversationId}>
                        <ListItem 
                            alignItems="flex-start" 
                            onClick={() => handleChatClick(chat.CONVERSATION_ID)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f0f0' } }}
                        >
                            <ListItemAvatar>
                                <Avatar>{chat.partnerName ? chat.partnerName[0] : 'G'}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography component="span" variant="subtitle1" fontWeight="bold">
                                        {chat.partnerName || `그룹 채팅 #${chat.conversationId}`}
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        
                                        <Typography component="span" variant="body2" color="text.secondary" noWrap>
                                            {chat.lastMessage || '새로운 대화를 시작해보세요.'}
                                        </Typography>
                                       
                                        {chat.unreadCount > 0 && (
                                            <Typography component="span" variant="body2" color="error" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                ({chat.unreadCount} 새 메시지)
                                            </Typography>
                                        )}
                                    </>
                                }
                            />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))}
            </List>
        </Container>
    );
}

export default ChatList;