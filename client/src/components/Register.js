import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';


function Register() {
  const [files, setFile] = React.useState([]);
  let contentRef = useRef();
  const navigate = useNavigate();
  const [mediaType, setmediaType] = useState(null); // 'null' for 게시글, 'V' for 쇼츠, 'I' for 사진

  const handleChange = (event) => {
    let dbType = null;
    switch(event.target.value) {
        case 1: // 게시글 (텍스트 전용)
            dbType = null; 
            break;
        // case 2: 쇼츠 (동영상) 제거됨
        case 3: // 사진 (이미지)
            dbType = 'I';
            break;
        default:
            dbType = null;
    }
    setmediaType(dbType);
    // 게시글 유형 변경 시 파일 목록 초기화 (선택적)
    setFile([]); 
  };

  const handleFileChange = (event) => {
    setFile(event.target.files);
  };

  function fnFeedAdd() {
    // 사진 유형 선택 시 파일 필수 검사
    if (mediaType === 'I' && files.length === 0) {
      alert("사진 유형을 선택하셨습니다. 이미지를 첨부해주세요!");
      return;
    }
    
    // 게시글(텍스트)인데 내용이 없으면 경고
    if (mediaType === null && contentRef.current.value.trim() === "") {
        alert("게시글 내용을 입력해주세요.");
        return;
    }

    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);

    let param = {
      content: contentRef.current.value,
      userId: decoded.userId,
      mediaType : mediaType
    }
    
    fetch(`http://localhost:3010/feed`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(param)
    })
      .then(res => {
        if (!res.ok) throw new Error(`등록 요청 실패: HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log(data);
        alert("등록되었습니다!");
        if (files.length > 0) {
          fnUploadFile(data.result[0].insertId);
        } else {
          navigate("/feed"); 
        }
      })
      .catch(error => {
        console.error("등록 중 오류 발생:", error);
        alert(`등록 중 오류가 발생했습니다: ${error.message}`);
      });

  }
  
  const fnUploadFile = (POST_ID) => {
    console.log("POST_ID", POST_ID);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }
    formData.append("POST_ID", POST_ID);
    console.log("클라이언트 디버그: 파일 MIME Type:", mediaType);
    formData.append("MEDIA_TYPE", mediaType);
   
    fetch("http://localhost:3010/feed/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        navigate("/feed"); // 원하는 경로
      })
      .catch(err => {
        console.error(err);
      });
  }


  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start" // 상단 정렬
        minHeight="100vh"
        sx={{ padding: '20px' }} // 배경색 없음
      >
        <Typography variant="h4" gutterBottom>
          등록
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>게시글 유형</InputLabel>
          <Select  
                value={mediaType === 'I' ? 3 : 1} 
                label="게시물 유형" 
                onChange={handleChange}
            >
            <MenuItem value={1}>게시글</MenuItem>
         
            <MenuItem value={3}>사진</MenuItem>
          </Select>
        </FormControl>

      
        <TextField
          inputRef={contentRef}
          label="내용"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          rows={4}
        />

        {mediaType === 'I' && (
            <Box display="flex" alignItems="center" margin="normal" sx={{ width: '100%' }}>
                <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    multiple
                />
                <label htmlFor="file-upload">
                    <IconButton color="primary" component="span">
                        <PhotoCamera />
                    </IconButton>
                </label>
                {files.length > 0 && (
                    <Avatar
                        alt="첨부된 이미지"
                        src={URL.createObjectURL(files[0])}
                        sx={{ width: 56, height: 56, marginLeft: 2 }}
                    />
                )}
                <Typography variant="body1" sx={{ marginLeft: 2 }}>
                    {files.length > 0 ? files[0].name : '첨부할 파일 선택'}
                </Typography>
            </Box>
        )}

        <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            style={{ marginTop: '20px' }} 
            onClick={fnFeedAdd}
        >
          등록하기
        </Button>

        <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth 
            style={{ marginTop: '10px' }} 
            onClick={() => navigate("/shortsRegister")} // 쇼츠 등록 페이지 URL로 이동 (예시)
        >
          쇼츠 전용 등록하기
        </Button>

      </Box>
    </Container>
  );
}

export default Register;