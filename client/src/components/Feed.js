import React, { useEffect, useState } from 'react';
import {
  Grid, // Grid2 대신 Grid 사용 (Grid2는 일반적으로 @mui/system에서 가져오지만, @mui/material Grid로 통일)
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function Feed() {
  const [open, setOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [feeds, setFeeds] = useState([]);

  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  // 1단계: 토큰 디코딩 및 userId 설정
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const extractedId = decodedToken.userId || decodedToken.id;

        if (extractedId) {
          setUserId(extractedId);
        } else {
          console.error("토큰에 사용자 ID 정보가 없습니다.");
          alert("토큰 정보 오류. 다시 로그인해주세요.");
          navigate('/login');
        }
      } catch (e) {
        console.error("토큰 디코딩 오류:", e);
        alert("유효하지 않은 토큰입니다. 다시 로그인해주세요.");
        navigate('/login');
      }
    } else {
      alert("로그인 후 이용해주세요");
      navigate("/login");
    }
  }, [navigate]);



  function fnFeeds() {
    if (!userId) return;


    fetch("http://localhost:3010/feed/" + userId) 
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then(data => {
    
        setFeeds(data.list || []);
        console.log(data);
      })
      .catch(error => {
        console.error("게시글 로드 오류:", error);
      });
  }


  useEffect(() => {
    if (userId) {
      fnFeeds();
    }
  }, [userId]) 


  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
    // 댓글 로직은 그대로 유지 (API 연동 필요)
    setComments([
      { id: 'user1', text: '멋진 사진이에요!' },
      { id: 'user2', text: '이 장소에 가보고 싶네요!' },
      { id: 'user3', text: '아름다운 풍경이네요!' },
    ]);
    setNewComment('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFeed(null);
    setComments([]);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, { id: 'currentUser', text: newComment }]);
      setNewComment('');
    }
  };

  const handleDelete = () => {
    if (!selectedFeed) return;

    const feedIdToDelete = selectedFeed.POST_ID; 
    const token = localStorage.getItem("token");

    if (!token) {
      alert("인증 정보가 없습니다. 다시 로그인해주세요.");
      navigate('/login');
      return;
    }

    fetch(`http://localhost:3010/feed/${feedIdToDelete}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`삭제 요청 실패: HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log(data);
        alert("삭제되었습니다!");

        // 💡 [개선] UI 즉시 업데이트: POST_ID로 필터링
        setFeeds(prevFeeds =>
          prevFeeds.filter(feed => feed.POST_ID !== feedIdToDelete)
        );
        handleClose();
      })
      .catch(error => {
        console.error("삭제 중 오류 발생:", error);
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      });
  };
  
  return (
    <Container maxWidth="md">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">SNS</Typography>
        </Toolbar>
      </AppBar>

      <Box mt={4}>
        {/* Grid2 대신 @mui/material의 Grid 사용 */}
        <Grid container spacing={3}> 
          {feeds && feeds.length > 0 ? feeds.map((feed) => (
            // 💡 [수정] key prop을 feed.POST_ID로 변경
            <Grid item xs={12} sm={6} md={4} key={feed.POST_ID}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  // 💡 [수정] 이미지 URL을 FILE_URL로 변경
                  image={feed.FILE_URL || 'placeholder-image-url.jpg'} 
                  alt={feed.imgName || '게시물 이미지'}
                  onClick={() => handleClickOpen(feed)}
                  style={{ cursor: 'pointer' }}
                />
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {feed.CONTENT} {/* 💡 [수정] DB 컬럼명에 맞춰 CONTENT 사용 (대문자 가정) */}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )): <Typography variant="h6" sx={{ padding: 2 }}>로딩 중이거나 등록된 게시글이 없습니다.</Typography>}
        </Grid>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          {/* 💡 [수정] selectedFeed?.title 대신 사용자 ID 또는 다른 제목 필드 사용 */}
          {selectedFeed?.USER_ID}의 게시물
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1">{selectedFeed?.CONTENT}</Typography> {/* 💡 [수정] CONTENT 사용 */}
            {selectedFeed?.FILE_URL && (
              <img
                src={selectedFeed.FILE_URL} // 💡 [수정] FILE_URL 사용
                alt={selectedFeed.FILE_NAME || '게시물 이미지'}
                style={{ width: '100%', marginTop: '10px' }}
              />
            )}
          </Box>

          <Box sx={{ width: '300px', marginLeft: '20px' }}>
            <Typography variant="h6">댓글</Typography>
            <List>
              {comments.map((comment, index) => (
                // 💡 [개선] 목록 key prop을 index 대신 고유 ID(comment.id)로 사용
                <ListItem key={comment.id || index}> 
                  <ListItemAvatar>
                    <Avatar>{comment.id.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={comment.text} secondary={comment.id} />
                </ListItem>
              ))}
            </List>
            <TextField
              label="댓글을 입력하세요"
              variant="outlined"
              fullWidth
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              sx={{ marginTop: 1 }}
            >
              댓글 추가
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
           <Button onClick={handleDelete} color="error" variant='contained'> {/* 💡 [개선] 삭제 버튼은 error 색상 사용 권장 */}
            삭제
          </Button>
          <Button onClick={handleClose} color="primary">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Feed;