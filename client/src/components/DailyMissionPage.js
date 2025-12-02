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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function DailyMissionPage() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    
    // 1. 사용자 ID 추출 (기존 코드와 동일)
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


    // 2. 미션 목록 데이터 패치 (fetch API 사용)
    useEffect(() => {
        const fetchMissions = async () => {
            if (!userId) return; 

            const token = localStorage.getItem("token");
            if (!token) {
                 setLoading(false);
                 return;
            }

            try {
                // axios.get 대신 fetch 사용
                const response = await fetch('http://localhost:3010/mission/daily', {
                    method: "GET", // 명시적으로 GET 메서드 지정 (생략 가능)
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }); 
                
                // fetch는 HTTP 상태 코드가 4xx/5xx여도 에러를 던지지 않으므로 수동으로 확인해야 합니다.
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
                    throw new Error(`HTTP 오류! 상태 코드: ${response.status}, 메시지: ${errorData.message || '서버 응답 오류'}`);
                }
                
                // 응답 본문을 JSON으로 변환
                const data = await response.json();
                
                console.log("미션 서버 데이터:", data);
                setMissions(data.missionList || []);
            } catch (error) {
                console.error("미션 로드 실패:", error.message);
                // 오류 발생 시에도 빈 배열로 처리하여 화면은 유지
                setMissions([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchMissions();
    }, [userId]); // userId가 설정된 후에만 실행

    
    // 로딩 상태 처리 (기존 코드와 동일)
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>일일 미션 ✨</Typography>
                <LinearProgress />
                <Box mt={2}><Typography>미션을 불러오는 중...</Typography></Box>
            </Container>
        );
    }
    
    // 미션 완료 상태 업데이트 함수 (기존 코드와 동일)
   const handleCheckReward = async (missionId) => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3010/mission/reward/${missionId}`, {
            method: "POST", // 보상 지급은 보통 POST나 PUT 메서드를 사용합니다.
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
        
        alert(`보상 수령 성공: ${result.message || '새로운 배지를 획득했습니다!'}`);

        // 보상 수령 성공 후, 미션 목록 상태를 로컬에서 즉시 업데이트하여 '수령 가능' 버튼을 비활성화/변경합니다.
        setMissions(prevMissions => prevMissions.map(m => 
            m.MISSION_ID === missionId 
            ? { ...m, IS_COMPLETED: 2 } // 1: 완료, 2: 보상 수령 완료 (필요에 따라 상태 코드를 정의해야 함)
            : m
        ));
        
        // *참고: 필요하다면 setMissions 대신 fetchMissions()를 다시 호출하여 전체 목록을 갱신할 수도 있습니다.
        
    } catch (error) {
        console.error("보상 수령 중 오류 발생:", error.message);
        alert(`보상 수령에 실패했습니다: ${error.message}`);
    }
};

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="warning" sx={{ mr: 1, fontSize: 30 }} />
                오늘의 일일 미션
            </Typography>
            
            {missions.length === 0 && (
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
                    const isCompleted = mission.IS_COMPLETED === 1;
                    
                    return (
                        <Grid item xs={12} sm={6} key={mission.MISSION_ID}>
                            <Card 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    p: 2,
                                    boxShadow: isCompleted ? '0 0 10px 1px green' : 3,
                                    borderLeft: isCompleted ? '5px solid green' : '5px solid #1976d2',
                                    opacity: isCompleted ? 0.8 : 1
                                }}
                            >
                                <Box sx={{ flexGrow: 1, mr: 2 }}>
                                    <Typography 
                                        variant="subtitle1" 
                                        fontWeight="bold" 
                                        color={isCompleted ? 'success.main' : 'text.primary'}
                                        sx={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
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
                                        {/* 보상 배지 이미지 */}
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

                                    {/* 완료 버튼 */}
                                    <Button
                                        variant={isCompleted ? "contained" : "outlined"}
                                        color={isCompleted ? "success" : "primary"}
                                        size="small"
                                        onClick={() => handleCheckReward(mission.MISSION_ID)}
                                        sx={{ mt: 1, minWidth: '80px' }}
                                        disabled={!isCompleted}
                                        startIcon={isCompleted ? <CheckCircleIcon /> : null}
                                    >
                                        {isCompleted ? '완료' : '진행 중'}
                                    </Button>
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