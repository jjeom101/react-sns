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
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

// ⭐️ 서버 기본 주소 정의 (필수)
const SERVER_BASE_URL = "http://localhost:3010";

function ShortsFeed() {
    const [shorts, setShorts] = useState([]);
    const [userId, setUserId] = useState(null);
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0); // 현재 재생 중인 쇼츠 인덱스
    const navigate = useNavigate();
    const videoRefs = useRef([]); // 각 비디오 요소를 참조하기 위한 Ref 배열

    // --- 1. 인증 및 사용자 ID 추출 로직 (기존 Feed와 동일) ---
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

    // --- 2. 쇼츠 목록 로드 함수 ---
    const fetchShorts = async () => {
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        try {
            const response = await fetch(`${SERVER_BASE_URL}/shorts/feed?page=1&limit=10`, { // 💡 /shorts/feed 엔드포인트 사용
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("쇼츠 로드 실패");
            
            const data = await response.json();
            setShorts(data.list || []); // list 배열을 가정
            
        } catch (error) {
            console.error("쇼츠 로드 오류:", error);
            setShorts([]);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchShorts();
        }
    }, [userId]);


    // --- 3. 조회수 증가 및 자동 재생 처리 로직 (핵심) ---

    // 💡 Intersection Observer를 사용하여 화면에 보이는 비디오를 감지합니다.
    useEffect(() => {
        if (shorts.length === 0) return;

        const options = {
            root: null, // 뷰포트
            rootMargin: '0px',
            threshold: 0.8, // 80% 이상 보일 때
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = parseInt(entry.target.getAttribute('data-index'));
                const shortId = entry.target.getAttribute('data-short-id');
                const videoElement = videoRefs.current[index];

                if (entry.isIntersecting && index !== currentPlayingIndex) {
                    // 현재 비디오 재생
                    videoElement?.play().catch(e => console.log("자동 재생 실패:", e));
                    setCurrentPlayingIndex(index);
                    
                    // 이전 비디오 일시 정지 (선택 사항)
                    videoRefs.current.forEach((video, i) => {
                        if (i !== index && video && !video.paused) {
                            video.pause();
                        }
                    });

                    // ⭐️ 조회수 증가 API 호출
                    handleViewCount(shortId);

                } else if (!entry.isIntersecting && videoElement && !videoElement.paused) {
                    // 화면에서 벗어날 경우 일시 정지
                    videoElement.pause();
                }
            });
        }, options);

        // 모든 비디오 요소를 관찰 대상에 추가
        videoRefs.current.forEach(video => {
            if (video) observer.observe(video);
        });

        return () => {
            // 클린업: 관찰 중단
            videoRefs.current.forEach(video => {
                if (video) observer.unobserve(video);
            });
        };
    }, [shorts, currentPlayingIndex]); 


    const handleViewCount = async (shortId) => {
        const token = localStorage.getItem("token");
        if (!token || !shortId) return;

        try {
            await fetch(`${SERVER_BASE_URL}/shorts/view/${shortId}`, { 
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            // 조회수가 즉시 업데이트되도록 상태 업데이트 (선택 사항)
            setShorts(prev => prev.map(s => 
                s.SHORT_ID.toString() === shortId.toString() ? { ...s, VIEW_COUNT: (s.VIEW_COUNT || 0) + 1 } : s
            ));
        } catch (error) {
            console.error("조회수 증가 오류:", error);
        }
    };

    // --- 4. 렌더링 (전체 화면 스크롤 UI) ---
    return (
        <div style={{ 
            height: '100vh', 
            overflowY: 'scroll', 
            // 💡 스크롤 스냅 효과를 사용하여 쇼츠 간 부드러운 전환 구현 (CSS에서 처리)
        }}>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6">SNS Shorts</Typography>
                    {/* 다른 메뉴 아이콘 */}
                </Toolbar>
            </AppBar>
            <Box mt={7}> 
                {shorts.length > 0 ? shorts.map((short, index) => (
                    <Box 
                        key={short.SHORT_ID}
                        className="short-item-container" // CSS에서 height: 100vh 및 scroll-snap 설정 필요
                        style={{ position: 'relative', height: '100vh' }} 
                        data-index={index}
                        data-short-id={short.SHORT_ID}
                    >
                        {/* 비디오 요소 */}
                        <video
                            ref={el => videoRefs.current[index] = el}
                            id={`video-${short.SHORT_ID}`}
                            src={short.VIDEO_URL ? `${SERVER_BASE_URL}${short.VIDEO_URL}` : ''} // ⭐️ URL 조합
                            loop
                            muted // 초기에는 음소거
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {/* 오버레이 UI (상세 정보 및 액션 버튼) */}
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
                                {short.DESCRIPTION}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* 좋아요 버튼 (로직 추가 필요) */}
                                <IconButton sx={{ color: 'white' }}>
                                    <FavoriteIcon />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>{short.like_count || 0}</Typography>
                                </IconButton>
                                {/* 댓글 버튼 (로직 추가 필요) */}
                                <IconButton sx={{ color: 'white' }}>
                                    <CommentIcon />
                                </IconButton>
                                {/* 조회수 표시 */}
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                    <VisibilityIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>{short.VIEW_COUNT || 0}</Typography>
                                </Box>
                                {/* 재생/일시정지 버튼 (선택적) */}
                                <IconButton 
                                    sx={{ color: 'white' }} 
                                    onClick={() => {
                                        const video = videoRefs.current[index];
                                        if (video.paused) {
                                            video.play();
                                        } else {
                                            video.pause();
                                        }
                                    }}
                                >
                                    {currentPlayingIndex === index && videoRefs.current[index]?.paused === false 
                                        ? <PauseIcon /> : <PlayArrowIcon />}
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