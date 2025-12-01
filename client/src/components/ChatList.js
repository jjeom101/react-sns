import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    List, 
    ListItem, 
    ListItemAvatar, 
    Avatar, 
    ListItemText, 
    Divider, 
    Paper,
    Badge, 
    Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// 서버 URL (필요시 백엔드 서버 주소로 변경)
const SERVER_URL = "http://localhost:3010"; 

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
            const API_URL = `${SERVER_URL}/chat/list`; // SERVER_URL 사용
            console.log("1. API 호출 시작:", API_URL);
            try {
                
                const response = await fetch(API_URL, { // API_URL 사용
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
                    const formattedChats = data.chats.map(chat => ({
                        ...chat,
                        conversationId: chat.CONVERSATION_ID,
                        // 백엔드에서 PROFILE_IMAGE_URL로 주었다면 그대로 사용
                        // 만약 PROFILE_IMG로 주었다면, 아래 코드와 같이 접근
                        profileImg: chat.PROFILE_IMG // ⭐️ 백엔드에서 PROFILE_IMG 컬럼으로 가져온다고 가정
                    }));
                    setChatRooms(formattedChats);
                } else {
                    console.error("채팅 목록 로드 실패:", data.msg);
                    setChatRooms([]);
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
        navigate(`/messeger/${conversationId}`);
        console.log("conversationId====>",conversationId);
    };

    if (loading) {
        return <Container sx={{ mt: 4 }}><Typography>채팅 목록을 불러오는 중...</Typography></Container>;
    }
    
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
                            onClick={() => handleChatClick(chat.conversationId)} 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f0f0' } }}
                        >
                            <ListItemAvatar>
                                {/* ⭐️ 프로필 이미지 표시 로직 추가 */}
                                <Avatar 
                                    alt={chat.partnerName || 'Group Chat'} 
                                    src={chat.profileImg ? `${SERVER_URL}${chat.profileImg}` : undefined} 
                                    // profileImg가 없으면 첫 글자 표시 (기존 로직 유지)
                                >
                                    {!chat.profileImg && (chat.partnerName ? chat.partnerName[0] : 'G')}
                                </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <Typography component="span" variant="subtitle1" fontWeight="bold" noWrap>
                                            {chat.partnerName || `그룹 채팅 #${chat.conversationId}`}
                                        </Typography>
                                        
                                        {chat.unreadCount > 0 && (
                                            <Badge 
                                                badgeContent={chat.unreadCount} 
                                                color="error" 
                                                max={99} 
                                                sx={{ 
                                                    '& .MuiBadge-badge': {
                                                        right: 0, 
                                                        top: 8,
                                                        padding: '0 4px',
                                                        height: 20,
                                                        minWidth: 20,
                                                        fontWeight: 'bold'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ width: 10, height: 10 }} /> 
                                            </Badge>
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Typography component="span" variant="body2" color="text.secondary" noWrap>
                                        {chat.lastMessage || '새로운 대화를 시작해보세요.'}
                                    </Typography>
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