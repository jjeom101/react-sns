import React, { useEffect, useState } from 'react';
import {
  Grid,
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
  CardHeader
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RepeatIcon from '@mui/icons-material/Repeat';
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const extractedId = decodedToken.userId || decodedToken.id;

        if (extractedId) {
          setUserId(extractedId);
        } else {
          navigate('/login');
        }
      } catch (e) {
        navigate('/login');
      }
    } else {
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
        if (data.list && data.list.length > 0) {
          data.list.forEach((feed, index) => {
            console.log(`게시물 #${index + 1} (POST_ID: ${feed.POST_ID}):`);

            // 🚨 LIKE_COUNT -> like_count로 수정되었는지 확인하세요.
            console.log(`- 좋아요 갯수 (LIKE_COUNT): ${feed.like_count}`);

            // 🚨 IS_LIKED -> is_liked로 수정되었는지 확인하세요.
            console.log(`- 현재 사용자 좋아요 여부 (IS_LIKED): ${feed.is_liked}`);

            // 💡 만약 like_count가 undefined라면, 원본 이름을 확인해 봅시다.
            console.log(`- 서버에서 넘어온 전체 객체: `, feed);
          });
        } else {
          console.log("로딩된 게시물이 없습니다.");
        }

      })
      .catch(error => {
      });
  }

  useEffect(() => {
    if (userId) {
      fnFeeds();
    }
  }, [userId])

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token || !postId) return;

    try {
      const response = await fetch("http://localhost:3010/feed/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ postId: postId })
      });

      if (!response.ok) {
        throw new Error("좋아요 요청에 실패했습니다.");
      }

      const result = await response.json();

      setFeeds(prevFeeds => prevFeeds.map(feed => {
        if (feed.POST_ID === postId) {
          return {
            ...feed,
            IS_LIKED: result.liked,
            LIKE_COUNT: result.likeCount
          };
        }
        return feed;
      }));

    } catch (error) {
      console.error("좋아요 처리 오류:", error);
    }
  };

  const handleRetweet = (postId) => { };

  const fetchComments = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3010/feed/comments/${postId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("댓글 데이터를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      setComments(data.comments || []);

    } catch (error) {
      console.error("댓글 로드 오류:", error);
      setComments([]);
    }
  };

  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
    setNewComment('');

    if (feed.POST_ID) {
      fetchComments(feed.POST_ID);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFeed(null);
    setComments([]);
  };

  const handleAddComment = async (postId) => {
    const trimmedComment = newComment.trim();
    const token = localStorage.getItem("token");

    if (!trimmedComment || !userId || !token) return;

    try {
      const response = await fetch("http://localhost:3010/feed/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: postId,
          content: trimmedComment
        })
      });

      if (!response.ok) {
        throw new Error("댓글 작성 요청에 실패했습니다.");
      }

      const result = await response.json();

      const newCommentData = {
        COMMENT_ID: result.commentId || Date.now(),
        USER_ID: userId,
        CONTENT: trimmedComment,
        USERNAME: '나',
        PROFILE_IMAGE_URL: selectedFeed?.PROFILE_IMAGE_URL || '/default-avatar.png'
      };

      if (open && selectedFeed?.POST_ID === postId) {
        setComments(prev => [...prev, newCommentData]);
      }

      fnFeeds();

      setNewComment('');

    } catch (error) {
      alert(`댓글 작성 중 오류 발생: ${error.message}`);
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
        alert("삭제되었습니다!");

        setFeeds(prevFeeds =>
          prevFeeds.filter(feed => feed.POST_ID !== feedIdToDelete)
        );
        handleClose();
      })
      .catch(error => {
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
        <Grid container spacing={3}>
          {feeds && feeds.length > 0 ? feeds.map((feed) => (
            <Grid
              item
              xs={12}
              key={feed.POST_ID}
            >
              <Card sx={{ maxWidth: '100%', mb: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar
                      src={feed.PROFILE_IMAGE_URL || '/default-avatar.png'}
                      aria-label="profile-image"
                    />
                  }
                  title={feed.USERNAME || `사용자 ID: ${feed.USER_ID}`}
                  subheader={feed.CREATED_AT ? new Date(feed.CREATED_AT).toLocaleString() : ''}
                />

                <CardMedia
                  component="img"
                  height="400"
                  image={feed.FILE_URL || 'placeholder-image-url.jpg'}
                  alt={feed.imgName || '게시물 이미지'}
                  onClick={() => handleClickOpen(feed)}
                  style={{ cursor: 'pointer', objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="body1" component="p" sx={{ mb: 1 }}>
                    {feed.CONTENT}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1.5, borderTop: '1px solid #eee', pt: 1 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleLike(feed.POST_ID); }}>
                      {feed.IS_LIKED ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />}
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>{feed.LIKE_COUNT || 0}</Typography>
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRetweet(feed.POST_ID); }} sx={{ ml: 1 }}>
                      <RepeatIcon fontSize="small" />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>

                        {feed.LIKE_COUNT || 0}
                      </Typography>
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TextField
                      label="댓글을 입력하세요"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(feed.POST_ID);
                        }
                      }}
                      sx={{ mr: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAddComment(feed.POST_ID)}
                    >
                      작성
                    </Button>
                  </Box>

                  {(feed.FIRST_COMMENT_CONTENT && feed.FIRST_COMMENT_USERNAME) && (
                    <Box sx={{
                      bgcolor: '#f9f9f9',
                      p: 1,
                      borderRadius: '4px',
                      borderLeft: '3px solid #1976d2',
                      mt: 1
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {feed.FIRST_COMMENT_USERNAME}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {feed.FIRST_COMMENT_CONTENT}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )) : <Typography variant="h6" sx={{ padding: 2 }}>로딩 중이거나 등록된 게시글이 없습니다.</Typography>}
        </Grid>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedFeed?.USERNAME || selectedFeed?.USER_ID}의 게시물
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
            <Typography variant="body1">{selectedFeed?.CONTENT}</Typography>
            {selectedFeed?.FILE_URL && (
              <img
                src={selectedFeed.FILE_URL}
                alt={selectedFeed.FILE_NAME || '게시물 이미지'}
                style={{ width: '100%', marginTop: '10px' }}
              />
            )}
          </Box>

          <Box sx={{ width: '300px', marginLeft: '20px' }}>
            <Typography variant="h6">댓글</Typography>
            <List>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <ListItem key={comment.COMMENT_ID || comment.id}>
                    <ListItemAvatar>
                      <Avatar src={comment.PROFILE_IMAGE_URL || '/default-avatar.png'}>
                        {(comment.USERNAME || comment.USER_ID)?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={comment.CONTENT}
                      secondary={comment.USERNAME || comment.USER_ID}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="댓글을 불러오는 중이거나, 댓글이 없습니다." />
                </ListItem>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelete} color="error" variant='contained'>
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