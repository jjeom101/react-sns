// FollowListModal.js

import React from 'react';
import { Modal, Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    overflowY: 'auto',
};

function FollowListModal({ isOpen, onClose, title, list }) {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = React.useState(false);
    const getCurrentUserId = () => {

        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                return decoded.userId || decoded.id;
            } catch (e) {
                console.error("토큰 디코딩 실패:", e);
                return null;
            }
        }
        return null; // 토큰이 없으면 null 반환
    };
    const handleChatClick = (targetUserId, nickname) => {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            alert("로그인 정보가 유효하지 않습니다.");
            return;

        }
        alert("아직 준비중입니다.");
        // onClose();
        // fetch('http://localhost:3010/chat/dm', { 
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         // 'Authorization': `Bearer ${localStorage.getItem('token')}` 
        //     },
        //     body: JSON.stringify({
        //         currentUserId: currentUserId, 
        //         targetUserId: targetUserId
        //     })
        // })
        //     .then(res => {
        //         if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        //         return res.json();
        //     })
        //     .then(data => {
        //         if (data.conversationId) {
        //             // 3. 성공 시 CONVERSATION_ID로 이동
        //             alert(`${nickname}님과의 채팅방으로 이동합니다. (CONV ID: ${data.conversationId})`);
        //             navigate(`/chat/${data.conversationId}`); 
        //         } else {
        //             throw new Error("대화방 ID를 받지 못했습니다.");
        //         }
        //     })
        //     .catch(error => {
        //         console.error("대화방 처리 중 오류:", error);
        //         alert("채팅방을 여는 데 실패했습니다.");
        //     });
    };
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="follow-list-title"
        >
            <Box sx={modalStyle}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography id="follow-list-title" variant="h6" component="h2">
                        {title}
                    </Typography>
                    <IconButton onClick={onClose} aria-label="닫기">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {list.length === 0 && !isProcessing ? (
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>
                        목록을 불러오는 중이거나 비어있습니다.
                    </Typography>
                ) : (
                    <List sx={{ mt: 2 }}>

                        {isProcessing ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2, alignSelf: 'center' }}>채팅방을 준비 중입니다...</Typography>
                            </Box>
                        ) : (
                            list.map((item) => (
                                <ListItem
                                    key={item.USER_ID}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="채팅"
                                            onClick={() => handleChatClick(item.USER_ID, item.NICKNAME || item.USERNAME)}
                                        >
                                            <ChatIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar

                                            src={item.PROFILE_IMG ? `http://localhost:3010${item.PROFILE_IMG}` : "/default-profile.png"}
                                            alt={item.NICKNAME || item.USERNAME}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={item.NICKNAME || item.USERNAME}
                                        secondary={`@${item.USER_ID}`}
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                )}
            </Box>
        </Modal>
    );
}

export default FollowListModal;