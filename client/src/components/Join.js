import React, { useRef } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Join() {

  let idRef = useRef();
  let nameRef = useRef();
  let nickRef = useRef();
  let passwordRef = useRef();
  let bioRef = useRef();

  let navigate= useNavigate();
  function handleJoin() {
let param = {
        nickName : nickRef.current.value,
        pwd : passwordRef.current.value,
        userName : nameRef.current.value,
        userId : idRef.current.value,
        bio : bioRef.current.value
    };


    fetch("http://localhost:3010/user/join",{
        method : "POST",
        headers : {
            "Content-type" : "application/json"
        },
        body : JSON.stringify(param)
    })
    .then(res => res.json())
    .then(data => {
        alert("저장되었습니다!");
        navigate("/");
    });
  }
  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Typography variant="h4" gutterBottom>
          회원가입
        </Typography>
        <TextField  inputRef={idRef}  label="ID" variant="outlined" margin="normal" fullWidth />
        <TextField inputRef={passwordRef}
          label="비밀번호"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
        />
          <TextField inputRef={bioRef}
          label="자기소개"
          variant="outlined"
          margin="normal"
          fullWidth
          type="text"
        />
        
        <TextField inputRef={nameRef} label="이름" variant="outlined" margin="normal" fullWidth />
        <TextField inputRef={nickRef} label="닉네임" variant="outlined" margin="normal" fullWidth />
        <Button onClick={handleJoin} variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }}>
            회원가입
        </Button>
        <Typography variant="body2" style={{ marginTop: '10px' }}>
          이미 회원이신가요? <Link to="/login">로그인</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Join;