import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Avatar, Grid, Paper } from '@mui/material';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import FollowListModal from './FollowListModal';
import ProfileEditModal from './ProfileEditModal';

function MyPage() {

    let [user, setUser] = useState(null);
    let navigate = useNavigate();

    let [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    let [isModalOpen, setIsModalOpen] = useState(false);
    let [listType, setListType] = useState('followers');
    let [listData, setListData] = useState([]);

    let [userBadges, setUserBadges] = useState([]); // 획득한 배지 목록 상태
    let [activeBadge, setActiveBadge] = useState(null); // 현재 착용 중인 배지 상태

    function fnGetUser() {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const decoded = jwtDecode(token);

                const extractedId = decoded.userId || decoded.id;

                if (!extractedId) {
                    throw new Error("토큰에 사용자 ID 정보가 없습니다.");
                }


                fetch("http://localhost:3010/user/" + extractedId)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        console.log("서버에서 받은 사용자 데이터:", data);

                        setUser(data.user);
                        fnGetUserBadges(data.user.USER_ID);
                    })
                    .catch(error => {
                        console.error("사용자 정보 로드 오류:", error);
                        alert("사용자 정보를 가져오는 데 실패했습니다.");

                    });
            } catch (e) {
                console.error("토큰 처리 오류:", e);
                alert("유효하지 않은 토큰입니다. 다시 로그인해주세요.");
                navigate("/");
            }
        } else {

            alert("로그인 후 이용해주세요.");
            navigate("/");
        }
    }

    const fnGetUserBadges = useCallback(async (userId) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3010/user/${userId}/badges`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        // 획득한 전체 배지 목록 저장
        setUserBadges(data.badges || []); 
        
        // 현재 활성화된 배지 찾아서 저장
        const currentActive = (data.badges || []).find(b => b.IS_ACTIVE === 1);
        setActiveBadge(currentActive);

    } catch (error) {
        console.error("배지 정보 로드 오류:", error);
        // 사용자에게 알림은 생략하고 콘솔에만 기록해도 좋습니다.
    }
}, []);

    function fnGetFollowList(type, userId) {
        setListData([]);
        const endpoint = `http://localhost:3010/user/${userId}/${type}`;

        fetch(endpoint)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log(`${type} 목록 데이터:`, data);

                setListData(data.list || data);
            })
            .catch(error => {
                console.error(`${type} 목록 로드 오류:`, error);
                alert(`${type} 목록을 가져오는 데 실패했습니다.`);
            });
    }

    function handleListClick(type) {
        if (!user || !user.USER_ID) return;

        const listName = type === 'followers' ? '팔로워' : '팔로잉';


        if ((type === 'followers' && (user.FOLLOWER_COUNT || 0) === 0) ||
            (type === 'followings' && (user.FOLLOWING_COUNT || 0) === 0)) {
            alert(`${user.NICKNAME || user.USERNAME}님의 ${listName} 목록이 비어있습니다.`);
            return;
        }

        setListType(type);
        setIsModalOpen(true);
        fnGetFollowList(type, user.USER_ID);
    }




    const handleImageUpload = useCallback(async (file) => {
        if (!user || !user.USER_ID) return;

        setIsProfileModalOpen(false);

        const formData = new FormData();
        formData.append('profileImage', file);
        formData.append('userId', user.USER_ID);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:3010/user/profile/image", {
                method: 'POST',
                headers: {

                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("이미지 업로드에 실패했습니다.");
            }

            const data = await response.json();
            alert("프로필 사진이 성공적으로 업데이트되었습니다.");


            fnGetUser();

        } catch (error) {
            console.error("프로필 사진 업로드 오류:", error);
            alert(`업로드 오류: ${error.message}`);
        }
    }, [user, fnGetUser]);

    useEffect(() => {
        fnGetUser();
    }, [fnGetUserBadges])

    const handleBadgeSelect = useCallback(async (badgeId, badgeName) => {
    if (!user || !user.USER_ID) return;
    
    if (activeBadge && activeBadge.BADGE_ID === badgeId) {
        alert("이미 착용 중인 배지입니다.");
        return;
    }

    if (!window.confirm(`정말 '${badgeName}' 배지를 대표 배지로 착용하시겠습니까?`)) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3010/user/badge/active", { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                badgeId: badgeId,
                userId: user.USER_ID // 백엔드 로직에 따라 필요 없을 수 있음 (토큰에서 추출 가능하면)
            }),
        });

        if (!response.ok) {
            throw new Error("배지 착용에 실패했습니다. 서버 오류.");
        }

        alert(`'${badgeName}' 배지가 성공적으로 착용되었습니다!`);
        
        // **배지 목록 및 상태 새로고침**
        fnGetUserBadges(user.USER_ID); 

    } catch (error) {
        console.error("배지 착용 오류:", error);
        alert(`배지 착용 오류: ${error.message}`);
    }
}, [user, activeBadge, fnGetUserBadges]);

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', mt: 5 }}>
                <Typography variant="h6">사용자 정보를 불러오는 중입니다...</Typography>
            </Container>
        );
    }

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


                    <Box display="flex" flexDirection="column" alignItems="center" sx={{ marginBottom: 3 }}>
                        <Avatar
                            alt="프로필 이미지"

                            src={user.PROFILE_IMG
                                ? `http://localhost:3010${user.PROFILE_IMG}`
                                : "placeholder-image-url.jpg"}
                            sx={{
                                width: 100,
                                height: 100,
                                marginBottom: 2,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => setIsProfileModalOpen(true)}
                        />

                        <Typography variant="h5">{user.NICKNAME || user.USERNAME}</Typography>
                        <Typography variant="body2" color="text.secondary">

                            @{user.USER_ID}
                        </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ marginTop: 2 }}>

                        <Grid item xs={4} textAlign="center" onClick={() => handleListClick('followers')} style={{ cursor: 'pointer' }}>

                            <Typography variant="h6">팔로워</Typography>

                            <Typography variant="body1">{user.FOLLOWER_COUNT || 0}</Typography>
                        </Grid>
                        <Grid item xs={4} textAlign="center" onClick={() => handleListClick('followings')} style={{ cursor: 'pointer' }}>
                            <Typography variant="h6">팔로잉</Typography>

                            <Typography variant="body1">{user.FOLLOWING_COUNT || 0}</Typography>
                        </Grid>
                        <Grid item xs={4} textAlign="center">
                            <Typography variant="h6">게시물</Typography>

                            <Typography variant="body1">{user.POST_COUNT || 0}</Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ marginTop: 3 }}>
                        <Typography variant="h6">내 소개</Typography>
                        <Typography variant="body1">

                            {user.BIO || '아직 작성된 소개글이 없습니다.'}
                        </Typography>
                    </Box>

                    <Box sx={{ marginTop: 5 }}>
        <Typography variant="h6" gutterBottom> 내 획득 배지 ({userBadges.length}개)</Typography>

        {activeBadge && (
            <Box sx={{ marginBottom: 2, border: '1px solid #FFD700', padding: '10px', borderRadius: '8px', backgroundColor: '#FFFACD' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    현재 착용 배지: <span style={{ color: 'gold' }}>{activeBadge.BADGE_NAME}</span>

                    </Typography>
                <Typography variant="body2" color="text.secondary">{activeBadge.BADGE_DESC}</Typography>
            </Box>
        )}

        {userBadges.length > 0 ? (
            <Grid container spacing={2}>
                {userBadges.map((badge) => (
                    <Grid item key={badge.BADGE_ID} xs={3} sm={2} md={2}>
                        <Box
                            onClick={() => handleBadgeSelect(badge.BADGE_ID, badge.BADGE_NAME)}
                            sx={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '8px',
                                border: badge.IS_ACTIVE 
                                    ? '2px solid gold' // 착용 중인 배지는 테두리 강조
                                    : '1px solid #ccc',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            <Avatar 
                                src={`http://localhost:3010${badge.BADGE_IMG}` || "placeholder-badge-url.jpg"}
                                sx={{ width: 50, height: 50, margin: '0 auto 5px auto' }}
                                alt={badge.BADGE_NAME}
                            />
                            <Typography variant="caption" noWrap>
                                {badge.BADGE_NAME}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        ) : (
            <Typography variant="body2" color="text.secondary">
                아직 획득한 배지가 없습니다. 미션을 수행해보세요!
            </Typography>
        )}
    </Box>
                </Paper>
            </Box>

            <FollowListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={listType === 'followers' ? '팔로워 목록' : '팔로잉 목록'}
                list={listData}
            />
            <ProfileEditModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userProfileImg={user.PROFILE_IMG}
                onImageUpload={handleImageUpload}
            />
        </Container>
    );
}

export default MyPage;