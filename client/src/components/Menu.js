import React from 'react';
import { Drawer, List, ListItem, ListItemText, Typography, Toolbar,ListItemIcon } from '@mui/material';
import { Home, Add, AccountCircle,Message,People,Logout,Movie } from '@mui/icons-material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240, 
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240, 
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Typography variant="h6" component="div" sx={{ p: 2 }}>
        SNS 메뉴
      </Typography>
      <List>
        <ListItem button component={Link} to="/feed">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="게시글" />
        </ListItem>
        <ListItem button component={Link} to="/ShortsFeed">
          <ListItemIcon>
            <Movie />
          </ListItemIcon>
          <ListItemText primary="short" />
        </ListItem>
        <ListItem button component={Link} to="/register">
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText primary="등록" />
        </ListItem>
            <ListItem button component={Link} to="/chat">
          <ListItemIcon>
            <Message />
          </ListItemIcon>
          <ListItemText primary="메신저" />
        </ListItem>
        <ListItem button component={Link} to="/mypage">
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText primary="마이페이지" />
        </ListItem>
         <ListItem button component={Link} to="/follow">
          <ListItemIcon>
            <People />
          </ListItemIcon>
          <ListItemText primary="팔로우/팔로윙" />
        </ListItem>
         <ListItem button component={Link} to="/DailyMissionPage">
          <ListItemIcon>
            <AssignmentTurnedInIcon/>
          </ListItemIcon>
          <ListItemText primary="일일 미션" />
        </ListItem>
          <ListItem button component={Link} to="/">
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="로그아웃" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Menu;