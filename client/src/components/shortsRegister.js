import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Avatar,
  IconButton,
} from '@mui/material';
import { Videocam } from '@mui/icons-material';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function ShortsRegister() {
  const [files, setFile] = useState([]);
  let contentRef = useRef();
  const navigate = useNavigate();
  
  const handleFileChange = (event) => {
    const selectedFiles = event.target.files;

    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      
      if (!file.type.startsWith('video/')) {
        alert("동영상 파일만 선택할 수 있습니다.");
        setFile([]);
        return;
      }

      setFile([file]); 
    } else {
      setFile([]);
    }
  };

  function fnShortsAdd() {
    // ... (등록 로직은 변경 없음)
    if (files.length === 0) {
      alert("쇼츠(동영상) 파일을 첨부해주세요!");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    
    const formData = new FormData();
    formData.append("videoFile", files[0]); 
    formData.append("content", contentRef.current.value);
    

    fetch("http://localhost:3010/shorts/upload", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error(`업로드 요청 실패: HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("쇼츠 등록 성공:", data);
        alert("쇼츠가 성공적으로 등록되었습니다!");
        
        navigate("/shortsfeed"); 
      })
      .catch(error => {
        console.error("쇼츠 등록 중 오류 발생:", error);
        alert(`쇼츠 등록 중 오류가 발생했습니다: ${error.message}`);
      });
  }


  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start" 
        minHeight="100vh"
        sx={{ padding: '20px', width: '100%' }}
      >
        <Typography variant="h4" gutterBottom>
          🎬 쇼츠 등록
        </Typography>

        <TextField
          inputRef={contentRef}
          label="설명 (선택 사항)"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          rows={4}
        />

        {/* ⭐️ 파일 첨부 UI 수정: 텍스트 깨짐 방지 및 정렬 개선 */}
        <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="flex-start" 
            margin="normal" 
            sx={{ width: '100%', border: '1px solid #ccc', borderRadius: '4px', p: 1, minHeight: '56px' }} // 최소 높이 지정
        >
          <input
            accept="video/*" 
            style={{ display: 'none' }}
            id="video-upload"
            type="file"
            onChange={handleFileChange}
            multiple={false}
          />
          <label htmlFor="video-upload">
            <IconButton color="primary" component="span" size="small">
              <Videocam fontSize="small" /> 
            </IconButton>
          </label>

            {/* 파일 선택 시 아바타 및 파일명 표시 */}
            {files.length > 0 ? (
                <>
                    <Avatar
                        alt="첨부된 동영상"
                        sx={{ width: 30, height: 30, fontSize: '0.8rem', marginLeft: 1, bgcolor: 'secondary.main' }}
                    >
                        V
                    </Avatar>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            marginLeft: 2, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' // ⭐️ 파일명 한 줄 유지
                        }}>
                        {files[0].name}
                    </Typography>
                </>
            ) : (
                <Typography 
                    variant="body1" 
                    color="textSecondary" 
                    sx={{ 
                        marginLeft: 1, 
                        whiteSpace: 'nowrap' // ⭐️ '동영상 선택' 텍스트 한 줄 유지
                    }}>
                    동영상 선택 
                </Typography>
            )}
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          style={{ marginTop: '20px' }} 
          onClick={fnShortsAdd}
        >
          쇼츠 등록하기
        </Button>

      </Box>
    </Container>
  );
}

export default ShortsRegister;