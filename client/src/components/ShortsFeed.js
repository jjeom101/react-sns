import React, { useEffect, useState, useRef } from 'react';
import {
    Container,
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const SERVER_URL = "http://localhost:3010"; 

function ShortsFeed() {
    const [shorts, setShorts] = useState([]);
    const [userId, setUserId] = useState(null);
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0); 
    const navigate = useNavigate();
    const videoRefs = useRef([]); 

    
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

    
    const fetchShorts = async () => {
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        try {
            const response = await fetch(`${SERVER_URL}/shorts/feed?page=1&limit=10`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("쇼츠 로드 실패");
            
            const data = await response.json();
            setShorts(data.list || []); 
            
        } catch (error) {
            console.error("쇼츠 로드 오류:", error);
            console.log("error===>",error);
            setShorts([]);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchShorts();
        }
    }, [userId]);


    
    useEffect(() => {
        if (shorts.length === 0) return;

        const options = {
            root: null, 
            rootMargin: '0px',
            threshold: 0.8, 
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = parseInt(entry.target.getAttribute('data-index'));
                const shortId = entry.target.getAttribute('data-short-id');
                const videoElement = videoRefs.current[index];

                if (entry.isIntersecting && index !== currentPlayingIndex) {
                    videoElement?.play().catch(e => console.log("자동 재생 실패:", e));
                    setCurrentPlayingIndex(index);
                    
                    videoRefs.current.forEach((video, i) => {
                        if (i !== index && video && !video.paused) {
                            video.pause();
                        }
                    });

                    handleViewCount(shortId);

                } else if (!entry.isIntersecting && videoElement && !videoElement.paused) {
                    videoElement.pause();
                }
            });
        }, options);

        videoRefs.current.forEach(video => {
            if (video) observer.observe(video);
        });

        return () => {
            videoRefs.current.forEach(video => {
                if (video) observer.unobserve(video);
            });
        };
    }, [shorts, currentPlayingIndex]); 


    const handleViewCount = async (shortId) => {
        const token = localStorage.getItem("token");
        if (!token || !shortId) return;

        try {
            await fetch(`${SERVER_URL}/shorts/view/${shortId}`, { 
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            
            setShorts(prev => prev.map(s => 
                s.SHORT_ID.toString() === shortId.toString() ? { ...s, VIEW_COUNT: (s.VIEW_COUNT || 0) + 1 } : s
            ));
        } catch (error) {
            console.error("조회수 증가 오류:", error);
        }
    };

    
    const handleLikeToggle = async (shortId) => {
        const token = localStorage.getItem("token");
        if (!token || !shortId) return;

        try {
            
            const endpoint = `${SERVER_URL}/shorts/like`; 
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json" 
                },
                
                body: JSON.stringify({ shortId: shortId }) 
            });
            
            if (!response.ok) throw new Error("좋아요 처리 실패");

            const data = await response.json(); 
            const newAction = data.msg; 
            const newLikeCount = data.likeCount; 

            
            setShorts(prev => prev.map(s => {
                if (s.SHORT_ID.toString() === shortId.toString()) {
                    return { 
                        ...s, 
                        IS_LIKED: newAction === 'like_added' ? 1 : 0, 
                        like_count: newLikeCount
                    };
                }
                return s;
            }));

        } catch (error) {
            console.error("좋아요 토글 오류:", error);
            alert("좋아요 처리 중 오류가 발생했습니다.");
        }
    };

    
    return (
        
        <div style={{ 
            height: '100vh', 
            overflowY: 'scroll', 
            maxWidth: '40%', 
            margin: '0 auto', 
            border: '1px solid #ddd' 
        }}>
            <AppBar position="fixed" sx={{ width: 'inherit' }}> 
                <Toolbar>
                    <Typography variant="h6">SNS Shorts</Typography>
                </Toolbar>
            </AppBar>
            <Box mt={7}> 
                {shorts.length > 0 ? shorts.map((short, index) => (
                    <Box 
                        key={short.SHORT_ID}
                        className="short-item-container" 
                        style={{ position: 'relative', height: '100vh' }} 
                        data-index={index}
                        data-short-id={short.SHORT_ID}
                    >
                        
                        <video
                            ref={el => videoRefs.current[index] = el}
                            id={`video-${short.SHORT_ID}`}
                            src={short.VIDEO_URL ? `${SERVER_URL}${short.VIDEO_URL}` : ''}
                            loop
                            muted 
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            
                            onClick={() => {
                                const video = videoRefs.current[index];
                                if (video.paused) {
                                    video.play();
                                } else {
                                    video.pause();
                                }
                            }}
                        />

                        
                        <Box sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            color: 'white', 
                            p: 2, 
                            width: '100%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
                        }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                @{short.USER_ID}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {short.DESCRIPTION || short.CONTENT} 
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                
                                <IconButton 
                                    sx={{ color: short.IS_LIKED === 1 ? 'red' : 'white' }} 
                                    
                                    onClick={() => handleLikeToggle(short.SHORT_ID)}
                                >
                                    {short.IS_LIKED === 1 ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>{short.like_count || 0}</Typography>
                                </IconButton>
                                
                                <IconButton sx={{ color: 'white' }}>
                                    <CommentIcon />
                                </IconButton>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                    <VisibilityIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>{short.VIEW_COUNT || 0}</Typography>
                                </Box>
                                
                                <IconButton 
                                    sx={{ color: 'white' }} 
                                    
                                >
                                    
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                )) : (
                    <Typography variant="h6" sx={{ p: 2, textAlign: 'center' }}>
                        로딩 중이거나 등록된 쇼츠가 없습니다.
                    </Typography>
                )}
            </Box>
        </div>
    );
}

export default ShortsFeed;