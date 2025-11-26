import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Avatar, Grid, Paper, Button, CircularProgress } from '@mui/material';
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // 팔로우 아이콘
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'; // 언팔로우 아이콘
import CheckIcon from '@mui/icons-material/Check'; // 팔로우됨 아이콘

// 💡 [참고] 서버 API 엔드포인트는 다음 라우터를 사용한다고 가정합니다.
// - 사용자 정보 조회: GET /user/:userId
// - 팔로우 상태 확인: GET /follow/:followingId
// - 팔로우/언팔로우: POST/DELETE /follow/:followingId

function Follows() {
    // URL 파라미터에서 대상 사용자(팔로우 대상)의 ID를 가져옵니다.
    const { userId: followingId } = useParams(); 
    
    // 상태 관리
    const [targetUser, setTargetUser] = useState(null); // 팔로우 대상 사용자 정보
    const [myId, setMyId] = useState(null); // 현재 로그인한 사용자(나)의 ID
    const [isFollowing, setIsFollowing] = useState(false); // 팔로우 상태 (내가 대상 유저를 팔로우 하는지)
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태

    let navigate = useNavigate();

    // 1. 현재 사용자(나)의 ID를 토큰에서 추출하는 함수
    function getMyIdFromToken() {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // 토큰에서 추출된 ID를 설정
                setMyId(decoded.userId || decoded.id);
                return decoded.userId || decoded.id;
            } catch (e) {
                console.error("토큰 처리 오류:", e);
                alert("유효하지 않은 토큰입니다. 다시 로그인해주세요.");
                navigate("/");
                return null;
            }
        } else {
            alert("로그인 후 이용해주세요.");
            navigate("/");
            return null;
        }
    }

    // 2. 대상 사용자의 정보 (프로필 + 팔로우 카운트)를 불러오는 함수
    const fetchTargetUser = async (id) => {
        try {
            const res = await fetch(`http://localhost:3010/user/${id}`);
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            const data = await res.json();
            setTargetUser(data.user);
            // console.log("대상 사용자 정보:", data.user);
        } catch (error) {
            console.error("대상 사용자 정보 로드 오류:", error);
            alert("대상 사용자 정보를 가져오는 데 실패했습니다.");
        }
    };

    // 3. 현재 사용자(나)와 대상 사용자 간의 팔로우 상태를 확인하는 함수
    const checkFollowStatus = async (followerId, targetId) => {
        if (!followerId || !targetId) return;
        
        // 💡 [서버 통신] GET /follow/:followingId 엔드포인트 호출
        // 서버에서 'Follows' 테이블을 조회하여 관계 존재 여부를 반환한다고 가정합니다.
        try {
            const res = await fetch(`http://localhost:3010/follow/${targetId}`, {
                headers: {
                    // 서버는 이 헤더의 토큰을 통해 followerId (나)를 식별합니다.
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // 서버에서 관계가 존재하면 200 OK와 { isFollowing: true } 반환,
            // 존재하지 않으면 404 Not Found 또는 { isFollowing: false } 반환을 가정
            if (res.ok) {
                const data = await res.json();
                // console.log("팔로우 상태 확인:", data);
                setIsFollowing(data.isFollowing === true);
            } else {
                // 404 등의 오류가 발생하면 팔로우 상태가 아니라고 간주 (서버 설계에 따라 다름)
                setIsFollowing(false); 
            }
        } catch (error) {
            console.error("팔로우 상태 확인 오류:", error);
            setIsFollowing(false);
        }
    };
    
    // 4. 팔로우/언팔로우 버튼 클릭 핸들러
    const handleFollowToggle = async () => {
        if (!myId || !followingId || myId === followingId) return;

        const method = isFollowing ? 'DELETE' : 'POST'; // 현재 팔로우 중이면 DELETE (언팔로우), 아니면 POST (팔로우)
        
        try {
            const res = await fetch(`http://localhost:3010/follow/${followingId}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
                // POST 요청 시, followingId는 URL 파라미터로, followerId는 토큰으로 전달됩니다.
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP Error: ${res.status}`);
            }

            // 성공적으로 관계가 변경되면 상태를 업데이트하고 프로필 정보를 새로고침합니다.
            setIsFollowing(!isFollowing); 
            // 팔로우/언팔로우 카운트 업데이트를 위해 프로필 정보 새로고침
            await fetchTargetUser(followingId); 

        } catch (error) {
            console.error("팔로우/언팔로우 실패:", error);
            alert(isFollowing ? "언팔로우에 실패했습니다." : "팔로우에 실패했습니다.");
        }
    };

    // 5. 초기 로딩 효과
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const id = getMyIdFromToken();
            if (id && followingId) {
                // 자기 자신의 페이지인 경우 MyPage로 리다이렉트 (선택 사항)
                if (id.toString() === followingId.toString()) {
                    navigate('/mypage'); 
                    return;
                }
                
                await Promise.all([
                    fetchTargetUser(followingId),
                    checkFollowStatus(id, followingId)
                ]);
            }
            setIsLoading(false);
        };
        init();
    }, [followingId, navigate]); // followingId가 변경되면 새로고침

    // 로딩 중 표시
    if (isLoading || !targetUser) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', mt: 10 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>프로필을 불러오는 중입니다...</Typography>
            </Container>
        );
    }
    
    // 렌더링
    return (
        <Container maxWidth="md">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-start"
                minHeight="100vh"
                sx={{ padding: '20px' }}
            >
                <Paper elevation={3} sx={{ padding: '20px', borderRadius: '15px', width: '100%' }}>
                    
                    {/* 프로필 정보 상단 배치 */}
                    <Box display="flex" flexDirection="column" alignItems="center" sx={{ marginBottom: 3 }}>
                        <Avatar
                            alt="프로필 이미지"
                            src={targetUser.PROFILE_IMG || "placeholder-image-url.jpg"} 
                            sx={{ width: 120, height: 120, marginBottom: 2 }}
                        />
                        <Typography variant="h4" fontWeight="bold">
                            {targetUser.NICKNAME || targetUser.USERNAME}
                        </Typography> 
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            @{targetUser.USER_ID}
                        </Typography>
                        
                        {/* 팔로우 버튼 */}
                        <Button
                            variant={isFollowing ? "outlined" : "contained"}
                            color={isFollowing ? "inherit" : "primary"}
                            onClick={handleFollowToggle}
                            startIcon={isFollowing ? <CheckIcon /> : <PersonAddIcon />}
                            sx={{ mt: 1, minWidth: '150px' }}
                        >
                            {isFollowing ? '팔로우 중' : '팔로우'}
                        </Button>
                        
                    </Box>
                    
                    <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        {/* 팔로워/팔로잉/게시물 카운트 */}
                        <Grid item xs={4} textAlign="center">
                            <Typography variant="h6">팔로워</Typography>
                            <Typography variant="body1" color="primary" fontWeight="bold">
                                {targetUser.FOLLOWER_COUNT || 0}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} textAlign="center">
                            <Typography variant="h6">팔로잉</Typography>
                            <Typography variant="body1" color="primary" fontWeight="bold">
                                {targetUser.FOLLOWING_COUNT || 0}
                            </Typography>
                        </Grid>
                        <Grid item xs={4} textAlign="center">
                            <Typography variant="h6">게시물</Typography>
                            <Typography variant="body1" color="primary" fontWeight="bold">
                                {targetUser.POST_COUNT || 0}
                            </Typography>
                        </Grid>
                    </Grid>
                    
                    <Box sx={{ marginTop: 4 }}>
                        <Typography variant="h6" gutterBottom>내 소개</Typography>
                        <Paper variant="outlined" sx={{ padding: 2, minHeight: '80px', backgroundColor: '#f9f9f9' }}>
                            <Typography variant="body1">
                                {targetUser.BIO || '아직 작성된 소개글이 없습니다.'}
                            </Typography>
                        </Paper>
                    </Box>
                    
                    {/* 여기에 게시물 목록 등을 추가할 수 있습니다. */}
                    <Box sx={{ marginTop: 5 }}>
                        <Typography variant="h5" textAlign="center">게시물</Typography>
                        {/* <PostsList userId={followingId} /> */}
                        <Typography textAlign="center" color="text.secondary" sx={{ mt: 2 }}>
                             게시물 목록을 불러오는 기능이 여기에 추가됩니다.
                        </Typography>
                    </Box>

                </Paper>
            </Box>
        </Container>
    );
}

export default Follows;

// 💡 라우팅 설정 예시 (React Router DOM)
// <Route path="/user/:userId" element={<Follows />} />