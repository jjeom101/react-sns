import React, { useRef } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  let userIdRef = useRef();
  let passwordRef = useRef();
  let navigate = useNavigate();
   function fnhandLogin() {
 
    let param = { 
      userId: userIdRef.current.value,
      pwd: passwordRef.current.value
    }
    fetch("http://localhost:3010/user/login", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(param)
    })
      .then(res => res.json())
      .then(data => {
        alert(data.msg);
        
        if (data.result === "true") {
          console.log(data);
          localStorage.setItem("userId", data.userId); 
          localStorage.setItem("token", data.token);
          navigate("/feed");
        }

      })
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
          로그인
        </Typography>
        <TextField inputRef={userIdRef} label="ID" variant="outlined" margin="normal" fullWidth />
        <TextField inputRef={passwordRef}
          label="Password"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
        />
        <Button onClick={fnhandLogin} variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }}>
          로그인
        </Button>
        <Typography variant="body2" style={{ marginTop: '10px' }}>
          회원이 아니신가요 ? <Link to="/join">회원가입</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;
