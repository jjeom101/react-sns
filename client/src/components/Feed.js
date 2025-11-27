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
            })
            .catch(error => {
            });
    }

    useEffect(() => {
        if (userId) {
            fnFeeds();
        }
    }, [userId]) 

    const handleLike = (postId) => {
    };

    const handleRetweet = (postId) => {
    };

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

    const handleAddComment = (postId) => {
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
                                            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>{feed.RETWEET_COUNT || 0}</Typography>
                                        </IconButton>
                                    </Box>

                                    {/* 댓글 입력 섹션 */}
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

                                    {/* 첫 번째 댓글 표시 */}
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
                    )): <Typography variant="h6" sx={{ padding: 2 }}>로딩 중이거나 등록된 게시글이 없습니다.</Typography>}
                </Grid>
            </Box>

            {/* 게시글 상세 모달 */}
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
                            {comments.map((comment, index) => (
                                <ListItem key={comment.id || index}> 
                                    <ListItemAvatar>
                                        <Avatar>{comment.id.charAt(0).toUpperCase()}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={comment.text} secondary={comment.id} />
                                </ListItem>
                            ))}
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