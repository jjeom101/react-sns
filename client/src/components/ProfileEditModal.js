import React, { useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Box, Avatar } from '@mui/material';

function ProfileEditModal({ isOpen, onClose, userProfileImg, onImageUpload }) {
    
    const fileInputRef = useRef(null); 

    const handleButtonClick = () => {
        fileInputRef.current.click(); 
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
        event.target.value = null; 
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: 'center' }}>프로필 사진 관리</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <Avatar
                    src={userProfileImg || "placeholder-image-url.jpg"}
                    sx={{ width: 150, height: 150, marginBottom: 3, border: '3px solid #ccc' }}
                    alt="현재 프로필"
                />

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleButtonClick} 
                    sx={{ width: '100%', marginBottom: 1 }}
                >
                    🖼️ 사진 등록/변경
                </Button>
                
                 <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={onClose}
                    sx={{ width: '100%' }}
                >
                    닫기
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default ProfileEditModal;