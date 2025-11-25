import React, { useEffect, useState } from 'react';
import {
  Grid2,
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

  // 💡 [추가] 토큰에서 추출한 userId를 상태로 관리
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate(); // 💡 [추가] useNavigate Hook 사용



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // 백엔드에서 설정한 키 이름에 따라 'id'나 'userId' 사용
        const extractedId = decodedToken.userId || decodedToken.id;

        if (extractedId) {
          setUserId(extractedId); // userId 상태 업데이트
        } else {
          console.error("토큰에 사용자 ID 정보가 없습니다.");
          alert("토큰 정보 오류. 다시 로그인해주세요.");
          console.log(extractedId);
          navigate('/login');
        }
      } catch (e) {
        console.error("토큰 디코딩 오류:", e);
        alert("유효하지 않은 토큰입니다. 다시 로그인해주세요.");
        navigate('/login');
      }
    } else {
      // 토큰이 없으면 로그인 페이지로 이동
      alert("로그인 후 이용해주세요");
      navigate("/login");
    }
  }, [navigate]);


  // ----------------------------------------
  // 2단계: 피드 정보 패치 함수 (userId 사용)
  // ----------------------------------------
  function fnFeeds() {
    // 💡 [수정] 하드코딩 제거, 상태 userId 사용
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

  // 💡 [수정] userId가 설정될 때마다 fnFeeds 호출 (의존성 배열 사용)
  useEffect(() => {
    if (userId) {
      fnFeeds();
    }
  }, [userId]) // userId가 변경될 때만 실행


  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
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

  // ----------------------------------------
  // 3단계: 피드 삭제 기능 (함수로 분리 및 개선)
  // ----------------------------------------
  const handleDelete = () => {
    if (!selectedFeed) return;

    // 피드 ID 추출
    const feedIdToDelete = selectedFeed.id || selectedFeed.feedId;
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

        // 💡 [개선] setFeeds를 사용하여 UI 즉시 업데이트 (재패치 방지)
        setFeeds(prevFeeds =>
          prevFeeds.filter(feed => (feed.id || feed.feedId) !== feedIdToDelete)
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
        <Grid2 container spacing={3}>
          {feeds && feeds.length > 0 ? feeds.map((feed) => (
            <Grid2 xs={12} sm={6} md={4} key={feed.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={feed.imgPath}
                  alt={feed.imgName}
                  onClick={() => handleClickOpen(feed)}
                  style={{ cursor: 'pointer' }}
                />
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {feed.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          )): <Typography variant="h6" sx={{ padding: 2 }}>로딩 중이거나 등록된 게시글이 없습니다.</Typography>}
        </Grid2>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg"> {/* 모달 크기 조정 */}
        <DialogTitle>
          {selectedFeed?.title}
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
            <Typography variant="body1">{selectedFeed?.content}</Typography>
            {selectedFeed?.imgPath && (
              <img
                src={selectedFeed.imgPath}
                alt={selectedFeed.imgName}
                style={{ width: '100%', marginTop: '10px' }}
              />
            )}
          </Box>

          <Box sx={{ width: '300px', marginLeft: '20px' }}>
            <Typography variant="h6">댓글</Typography>
            <List>
              {comments.map((comment, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar>{comment.id.charAt(0).toUpperCase()}</Avatar> {/* 아이디의 첫 글자를 아바타로 표시 */}
                  </ListItemAvatar>
                  <ListItemText primary={comment.text} secondary={comment.id} /> {/* 아이디 표시 */}
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
           <Button onClick={handleDelete} color="blue" variant='contained'>
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