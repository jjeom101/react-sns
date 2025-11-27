import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemAvatar, ListItemText, Button, CircularProgress, Divider, Paper } from '@mui/material';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import Avatar from '@mui/material/Avatar';




function Follow() {
    const [userId, setUserId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState({});
    
    
    const navigate = useNavigate();


    function getMyIdFromToken() {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const decodedToken = jwtDecode(token);
            return decodedToken.userId || decodedToken.id || null;
        } catch (e) {
            console.error("토큰 디코딩 오류:", e);
            return null;
        }
    }

    function fetchAllUsers() {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem("token");

       fetch(`http://localhost:3010/follow/list`, {
            headers: {
               "Authorization": `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(`사용자 로드 실패: HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                const userList = data.users || data.list || [];
                const followingIds = data.followingIds || [];

                const filteredUsers = userList.filter(user => user.USER_ID !== userId);

                setUsers(filteredUsers);

                const initialFollowingStatus = filteredUsers.reduce((acc, u) => {
                    acc[u.USER_ID] = followingIds.includes(u.USER_ID);
                    return acc;
                }, {});

                setFollowingStatus(initialFollowingStatus);
            })
            .catch(error => {
                console.error("사용자/팔로우 상태 로드 오류:", error);
                alert(`데이터 로드 중 오류가 발생했습니다: ${error.message}`);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

  
    function fetchFollowStatus(targetUserId) {
        if (!userId) {
            alert("로그인 정보가 유효하지 않습니다.");
            navigate('/login');
            return;
        }

        const isCurrentlyFollowing = followingStatus[targetUserId];
        const token = localStorage.getItem("token");
        // const method = isCurrentlyFollowing ? "DELETE" : "POST";

        // 낙관적 업데이트 (UI 먼저 변경)
        setFollowingStatus(prev => ({
            ...prev,
            [targetUserId]: !isCurrentlyFollowing
        }));

        const param = { targetUserId };

        fetch(`http://localhost:3010/follow`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(param)
        })
            .then(res => {
                if (!res.ok) {
                    // 실패 시 상태 롤백
                    setFollowingStatus(prev => ({
                        ...prev,
                        [targetUserId]: isCurrentlyFollowing
                    }));
                    throw new Error(`요청 실패: HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log(isCurrentlyFollowing ? "언팔로우됨" : "팔로우됨", data);
            })
            .catch(error => {
                console.error("팔로우/언팔로우 중 오류:", error);
                alert(`작업 중 오류가 발생했습니다: ${error.message}`);

                // 오류 발생 시 롤백
                setFollowingStatus(prev => ({
                    ...prev,
                    [targetUserId]: isCurrentlyFollowing
                }));
            });
    }


    useEffect(() => {
        const currentId = getMyIdFromToken();
        const token = localStorage.getItem("token");

        if (currentId && token) {
            setUserId(currentId);
        } else {
            alert("로그인 후 이용해주세요");
            navigate("/login");
        }
    }, [navigate]);

   
    useEffect(() => {
        if (userId) {
            fetchAllUsers();
        }
    }, [userId]);

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', mt: 10 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>사용자 목록을 불러오는 중입니다...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom textAlign="center">
                사용자 찾기 및 팔로우
            </Typography>

            <Paper elevation={3} sx={{ padding: '20px', borderRadius: '15px' }}>
                <List>
                    {users.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
                            나를 제외한 다른 사용자가 없습니다.
                        </Typography>
                    ) : (
                        users.map((user, index) => {
                            const targetId = user.USER_ID;
                            const isFollowing = followingStatus[targetId] || false;

                            return (
                                <Box key={targetId}>
                                    <ListItem
                                        secondaryAction={
                                            <Button
                                                variant={isFollowing ? "outlined" : "contained"}
                                                color={isFollowing ? "inherit" : "primary"}
                                                onClick={() => fetchFollowStatus(targetId)}
                                                startIcon={isFollowing ? <CheckIcon /> : <PersonAddIcon />}
                                                sx={{ minWidth: '110px' }}
                                                disabled={!userId}
                                            >
                                                {isFollowing ? '팔로우 중' : '팔로우'}
                                            </Button>
                                        }
                                       
                                        onClick={() => navigate(`/user/${targetId}`)}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={user.PROFILE_IMG || ""} />
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={user.NICKNAME || user.USERNAME || "이름 없음"}
                                            secondary={`@${user.USER_ID}`}
                                        />
                                    </ListItem>

                                    {index < users.length - 1 && <Divider component="li" />}
                                </Box>
                            );
                        })
                    )}
                </List>
            </Paper>
        </Container>
    );
}

export default Follow;
