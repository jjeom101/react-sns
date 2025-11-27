// FollowListModal.js

import React from 'react';
import { Modal, Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
                
                {list.length === 0 ? (
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>
                        목록을 불러오는 중이거나 비어있습니다.
                    </Typography>
                ) : (
                    <List sx={{ mt: 2 }}>
                        {list.map((item) => (
                            // 서버에서 받은 목록 데이터 구조에 맞게 item.NICKNAME 등을 변경하세요.
                            <ListItem key={item.USER_ID || item.id}> 
                                <ListItemAvatar>
                                    <Avatar src={item.PROFILE_IMG} />
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={item.NICKNAME || item.USERNAME} 
                                    secondary={`@${item.USER_ID || item.id}`} 
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Modal>
    );
}

export default FollowListModal;