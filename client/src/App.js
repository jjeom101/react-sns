import React from 'react';
import { Route, Routes, useLocation,Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './components/Login';
import Join from './components/Join'; 
import Feed from './components/Feed';
import Register from './components/Register';
import MyPage from './components/MyPage';
import Menu from './components/Menu'; 
import Message from './components/messeger'; 
import Follow from './components/Follow'; 
import ChatList from './components/ChatList';
import ShortsFeed from './components/ShortsFeed';
import ShortsRegister from './components/shortsRegister.js';







// import UserProfile from './components/UserProfile';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />} {/* 로그인과 회원가입 페이지가 아닐 때만 Menu 렌더링 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/register" element={<Register />} />
          <Route path="/messeger/:partnerId" element={<Message />} />
          
          <Route path="/chat/list" element={<ChatList />} />
          <Route path="/ShortsFeed" element={<ShortsFeed />} />
          
          

          <Route path="/chat" element={<Navigate to="/chat/list" replace />} />

          <Route path="/user/:userId" element={<Follow />} />
          <Route path="/follow" element={<Follow />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/shorts/register" element={<ShortsRegister />} />
          <Route path="/shortsRegister" element={<ShortsRegister />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
