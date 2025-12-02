import React, { useState, useEffect } from 'react';

import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Avatar,
    LinearProgress
} from '@mui/material';
// 기존 아이콘
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
// 추가 아이콘
import RedeemIcon from '@mui/icons-material/Redeem'; // 보상 아이콘 (1 -> 2)
import DoneAllIcon from '@mui/icons-material/DoneAll'; // 모두 완료 아이콘 (2)
import TaskAltIcon from '@mui/icons-material/TaskAlt'; // 미션 완료 확인 아이콘 (0 -> 1)
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function DailyMissionPage() {
    // ... (기존 state 및 useEffect - userId 추출 로직 생략) ...
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    
    // 1. 사용자 ID 추출 (기존 코드 유지)
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

    // 2. 미션 목록 데이터 패치 (기존 코드 유지)
    useEffect(() => {
        const fetchMissions = async () => {
            if (!userId) return; 
            const token = localStorage.getItem("token");
            if (!token) {
                 setLoading(false);
                 return;
            }

            try {
                 const response = await fetch('http://localhost:3010/mission/daily', {
                     method: "GET",
                     headers: { "Authorization": `Bearer ${token}` }
                 }); 
                 
                 if (!response.ok) {
                     const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
                     throw new Error(`HTTP 오류! 상태 코드: ${response.status}, 메시지: ${errorData.message || '서버 응답 오류'}`);
                 }
                 
                 const data = await response.json();
                 setMissions(data.missionList || []);
            } catch (error) {
                 console.error("미션 로드 실패:", error.message);
                 setMissions([]); 
            } finally {
                 setLoading(false);
            }
        };

        fetchMissions();
    }, [userId]); 

    // ----------------------------------------------------
    // 💡 1. 미션 완료 상태 확인/트리거 함수 (0 -> 1)
    // ----------------------------------------------------
    const handleCheckCompletion = async (missionId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        try {
            // 서버의 미션 완료 조건 확인 API를 호출합니다. (새로운 엔드포인트 가정)
            const response = await fetch(`http://localhost:3010/mission/check-completion/${missionId}`, {
                method: "POST", 
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
                throw new Error(`미션 완료 확인 실패: ${errorData.message || '서버 응답 오류'}`);
            }

            const result = await response.json();
            
            if (result.isCompleted) {
                alert(result.message || '미션 완료! 보상을 수령할 수 있습니다.');
                // 상태 업데이트: 0 (진행 중)에서 1 (완료, 수령 가능)로 변경
                setMissions(prevMissions => prevMissions.map(m => 
                    m.MISSION_ID === missionId 
                    ? { ...m, IS_COMPLETED: 1 } 
                    : m
                ));
            } else {
                alert(result.message || '아직 미션 조건을 충족하지 못했습니다. 조건을 확인해주세요.');
            }
            
        } catch (error) {
            console.error("미션 완료 확인 중 오류 발생:", error.message);
            alert(`미션 완료 확인에 실패했습니다: ${error.message}`);
        }
    };


    // ----------------------------------------------------
    // 2. 보상 수령 함수 (1 -> 2) (기존 로직 유지)
    // ----------------------------------------------------
    const handleCheckReward = async (missionId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3010/mission/reward/${missionId}`, {
                method: "POST", 
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
                throw new Error(`보상 수령 실패! 상태 코드: ${response.status}, 메시지: ${errorData.message || '서버 응답 오류'}`);
            }

            const result = await response.json();
            
            alert(`보상 수령 성공! ${result.message || '축하합니다! 배지를 획득했습니다.'}`);

            // 상태 업데이트: 1 (완료)에서 2 (수령 완료)로 변경
            setMissions(prevMissions => prevMissions.map(m => 
                m.MISSION_ID === missionId 
                ? { ...m, IS_COMPLETED: 2 } 
                : m
            ));
            
        } catch (error) {
            console.error("보상 수령 중 오류 발생:", error.message);
            alert(`보상 수령에 실패했습니다: ${error.message}`);
        }
    };

    // ... (로딩 상태 UI 생략) ...
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>일일 미션 ✨</Typography>
                <LinearProgress />
                <Box mt={2}><Typography>미션을 불러오는 중...</Typography></Box>
            </Container>
        );
    }
    
    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="warning" sx={{ mr: 1, fontSize: 30 }} />
                오늘의 일일 미션
            </Typography>
            
            {missions.length === 0 && (
                // ... (미션 없음 UI 생략) ...
                <Box sx={{ mt: 4, textAlign: 'center', p: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                        현재 활성화된 일일 미션이 없습니다.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        새로운 미션이 곧 추가될 예정입니다.
                    </Typography>
                </Box>
            )}

            <Grid container spacing={3} mt={2}>
                {missions.map((mission) => {
                    // 상태 변수 3가지로 분리
                    const isCompleted = mission.IS_COMPLETED === 1; // 완료 & 수령 가능
                    const isRewardReceived = mission.IS_COMPLETED === 2; // 보상 수령 완료
                    const isProgressing = mission.IS_COMPLETED === 0; // 진행 중

                    const buttonText = isRewardReceived ? '수령 완료' : '보상 수령';
                    const buttonColor = isRewardReceived ? "default" : "success"; // 보상 수령 버튼 색상

                    return (
                        <Grid item xs={12} sm={6} key={mission.MISSION_ID}>
                            <Card 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    p: 2,
                                    // 완료된 미션 강조 스타일 (수령 완료 시에도 적용)
                                    boxShadow: (isCompleted || isRewardReceived) ? '0 0 10px 1px green' : 3,
                                    borderLeft: (isCompleted || isRewardReceived) ? '5px solid green' : '5px solid #1976d2',
                                    opacity: (isCompleted || isRewardReceived) ? 0.8 : 1
                                }}
                            >
                                <Box sx={{ flexGrow: 1, mr: 2 }}>
                                    <Typography 
                                        variant="subtitle1" 
                                        fontWeight="bold" 
                                        // 수령 완료 시에는 초록색 + 취소선
                                        color={isRewardReceived ? 'success.dark' : 'text.primary'} 
                                        sx={{ textDecoration: isRewardReceived ? 'line-through' : 'none' }}
                                    >
                                        {mission.MISSION_NAME}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {mission.MISSION_DESC}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        조건: {mission.CONDITION_DETAIL}
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                                    <CardContent sx={{ p: 0 }}>
                                        {/* 보상 배지 이미지 (기존 코드 유지) */}
                                        <Avatar
                                            src={mission.REWARD_BADGE_IMG ? `http://localhost:3010${mission.REWARD_BADGE_IMG}` : '/default-badge.png'} 
                                            alt={mission.REWARD_BADGE_NAME || '보상 배지'}
                                            sx={{ width: 40, height: 40, mx: 'auto', mb: 0.5, border: '1px solid gold' }}
                                            title={mission.REWARD_BADGE_NAME || '보상'}
                                        />
                                        <Typography variant="caption" fontWeight="medium">
                                            {mission.REWARD_BADGE_NAME || '보상'}
                                        </Typography>
                                    </CardContent>

                                    {/* ---------------------------------------------------- */}
                                    {/* 💡 미션 상태에 따른 버튼 렌더링 로직 (핵심 수정 부분) */}
                                    {/* ---------------------------------------------------- */}
                                    
                                    {/* 1. 진행 중 (0)일 때: 미션 완료 확인 버튼 */}
                                    {isProgressing && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() => handleCheckCompletion(mission.MISSION_ID)}
                                            sx={{ mt: 1, minWidth: '80px' }}
                                            startIcon={<TaskAltIcon />}
                                        >
                                            완료 확인
                                        </Button>
                                    )}

                                    {/* 2. 완료됨 (1) 또는 수령 완료 (2)일 때: 보상 수령 버튼 */}
                                    {(isCompleted || isRewardReceived) && (
                                        <Button
                                            variant={isRewardReceived ? "outlined" : "contained"}
                                            color={buttonColor}
                                            size="small"
                                            onClick={() => handleCheckReward(mission.MISSION_ID)}
                                            sx={{ mt: 1, minWidth: '80px' }}
                                            // 보상 수령이 완료된 경우 (2)에만 비활성화
                                            disabled={isRewardReceived} 
                                            // 아이콘 변경
                                            startIcon={isRewardReceived ? <DoneAllIcon /> : <RedeemIcon />}
                                        >
                                            {buttonText}
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
}

export default DailyMissionPage;