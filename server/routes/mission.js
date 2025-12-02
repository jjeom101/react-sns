
const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");

router.get("/daily", authMiddleware, async (req, res) => {
    const currentUserId = req.user?.userId || req.user?.id || req.user?.user_id;

    if (!currentUserId) {
        return res.status(401).json({ msg: "인증 정보가 유효하지 않습니다." });
    }

    try {
        const sql = `
    SELECT
        M.MISSION_ID,
        M.MISSION_NAME,
        M.MISSION_DESC,
        M.CONDITION_DETAIL,
        M.REWARD_BADGE_ID,
        IFNULL(UB.IS_COMPLETED, 0) AS IS_COMPLETED, -- 완료 여부가 없으면 0으로 처리
        B.BADGE_NAME AS REWARD_BADGE_NAME,
        B.BADGE_IMG AS REWARD_BADGE_IMG
    FROM
        SNS_DAILY_MISSION M
    LEFT JOIN
        SNS_USER_DAILY_MISSION UB ON M.MISSION_ID = UB.MISSION_ID 
            AND UB.USER_ID = ?  
            AND UB.MISSION_DATE = CURRENT_DATE()
    LEFT JOIN
        SNS_BADGE B ON M.REWARD_BADGE_ID = B.BADGE_ID
    WHERE
        M.IS_ACTIVE = 1 
    ORDER BY 
        M.MISSION_ID ASC;
`;

        const [missionList] = await db.query(sql, [currentUserId]);

        res.json({
            msg: "success",
            missionList: missionList
        });

    } catch (error) {
        console.error("일일 미션 조회 오류:", error);
        res.status(500).json({ msg: "일일 미션 조회 실패", error: error.message });
    }
});



router.post("/reward/:missionId", authMiddleware, async (req, res) => {
    const currentUserId = req.user?.userId || req.user?.id || req.user?.user_id;
    const missionId = req.params.missionId;

    if (!currentUserId || !missionId) {
        return res.status(400).json({ msg: "필수 정보(사용자 ID 또는 미션 ID)가 누락되었습니다." });
    }

    try {
        // A. 미션 상태 및 보상 정보 확인
        const checkSql = `
            SELECT IS_COMPLETED, M.REWARD_BADGE_ID
            FROM SNS_USER_DAILY_MISSION UM
            JOIN SNS_DAILY_MISSION M ON UM.MISSION_ID = M.MISSION_ID
            WHERE UM.USER_ID = ? AND UM.MISSION_ID = ? AND UM.MISSION_DATE = CURRENT_DATE()
        `;
        const [missionStatus] = await db.query(checkSql, [currentUserId, missionId]);

        if (missionStatus.length === 0 || missionStatus[0].IS_COMPLETED === 0) {
            return res.status(400).json({ msg: "미션이 완료되지 않았거나 존재하지 않습니다." });
        }
        if (missionStatus[0].IS_COMPLETED === 2) {
            return res.status(400).json({ msg: "이미 보상을 수령했습니다." });
        }

        const rewardBadgeId = missionStatus[0].REWARD_BADGE_ID;

        // B. 배지 지급: (sns_user_badge 테이블, OBTAINED_AT 컬럼 사용)
        const giveBadgeSql = `
            INSERT INTO sns_user_badge (USER_ID, BADGE_ID, OBTAINED_AT)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE OBTAINED_AT = OBTAINED_AT; 
        `;
        await db.query(giveBadgeSql, [currentUserId, rewardBadgeId]);

        // C. 미션 상태를 '수령 완료' (2)로 업데이트
        // 🚨 오류 컬럼 'REWARD_AT'을 제거하고 IS_COMPLETED만 업데이트합니다.
        const updateSql = `
            UPDATE SNS_USER_DAILY_MISSION 
            SET IS_COMPLETED = 2  /* 🚨 REWARD_AT = NOW() 부분 제거 */
            WHERE USER_ID = ? 
              AND MISSION_ID = ? 
              AND MISSION_DATE = CURRENT_DATE()
              AND IS_COMPLETED = 1;
        `;
        const [updateResult] = await db.query(updateSql, [currentUserId, missionId]);

        if (updateResult.affectedRows === 1) {
            res.json({
                msg: "보상 수령 성공 및 미션 상태 업데이트 완료",
                badgeId: rewardBadgeId
            });
        } else {
            // 배지 지급은 성공했지만, 일일 미션 상태 업데이트가 실패했을 경우
            res.status(500).json({ msg: "미션 상태 업데이트에 실패했습니다. (배지 지급은 성공했을 수 있음)" });
        }

    } catch (error) {
        console.error("보상 수령 처리 중 오류:", error);
        res.status(500).json({ msg: "서버 오류: 보상 수령 실패", error: error.message });
    }
});


router.post("/check-completion/:missionId", authMiddleware, async (req, res) => {
    // 1. 사용자 ID 및 미션 ID 추출
    const currentUserId = req.user?.userId || req.user?.id || req.user?.user_id;
    const missionId = req.params.missionId;

    if (!currentUserId || !missionId) {
        return res.status(400).json({ msg: "필수 정보(사용자 ID 또는 미션 ID)가 누락되었습니다." });
    }

    try {
        // 🚨 0. [404 오류 해결] 오늘의 사용자 미션 기록이 없으면 생성하는 로직 (UPSERT)
        // 미션 확인 전에 기록이 없으면 IS_COMPLETED=0으로 미리 생성하여 404 오류를 방지합니다.
        const insertUserMissionSql = `
            INSERT INTO SNS_USER_DAILY_MISSION (USER_ID, MISSION_ID, MISSION_DATE, IS_COMPLETED)
            VALUES (?, ?, CURRENT_DATE(), 0)
            ON DUPLICATE KEY UPDATE USER_ID=USER_ID; 
            -- 이미 존재하면 기존 데이터 그대로 유지
        `;
        await db.query(insertUserMissionSql, [currentUserId, missionId]);


        // 2. 현재 미션 상태 및 조건 확인
        const checkSql = `
            SELECT 
                UM.IS_COMPLETED, 
                M.CONDITION_DETAIL,     /* MISSION_TYPE 대신 존재하는 컬럼 조회 */
                M.REWARD_BADGE_ID       /* CONDITION_VALUE 대신 존재하는 컬럼 조회 */
            FROM 
                SNS_USER_DAILY_MISSION UM
            JOIN 
                SNS_DAILY_MISSION M ON UM.MISSION_ID = M.MISSION_ID
            WHERE 
                UM.USER_ID = ? AND UM.MISSION_ID = ? AND UM.MISSION_DATE = CURRENT_DATE()
        `;
        const [missionInfo] = await db.query(checkSql, [currentUserId, missionId]);

        // 기록 생성 로직 후에도 데이터가 없다면 서버 오류로 처리 (거의 발생하지 않아야 함)
        if (missionInfo.length === 0) {
            return res.status(500).json({ msg: "미션 기록 생성 후에도 데이터를 찾을 수 없습니다." });
        }

        const currentStatus = missionInfo[0].IS_COMPLETED;
        
        // 🚨 [DB 스키마 수정 필요] MISSION_TYPE과 CONDITION_VALUE를 임시로 하드코딩함.
        // 실제 미션 로직이 작동하려면 DB에 해당 컬럼을 추가하고 아래 값을 DB에서 조회해야 합니다.
        const missionType = 'POST_COUNT'; // 미션 1번이 'POST_COUNT'라고 가정
        const conditionValue = 1;         // 미션 1번의 조건이 1회라고 가정 
        
        let userProgress = 0; // 초기 진행도

        // 3. 이미 완료되었거나 보상이 수령된 경우 (1 또는 2) 처리
        if (currentStatus !== 0) {
            const msg = currentStatus === 1 ? "이미 완료되었으며 보상 수령이 가능합니다." : "이미 보상을 수령했습니다.";
            return res.json({ msg: msg, isCompleted: currentStatus === 1 });
        }

        // 4. 미션 완료 조건 충족 여부 확인 (핵심 로직)
        let isConditionMet = false;

        if (missionType === 'POST_COUNT') {
            const countSql = `
                SELECT COUNT(*) as currentCount
                FROM SNS_POSTS  /* [1146 오류 해결] 실제 테이블 이름 'SNS_POSTS' 사용 */
                WHERE USER_ID = ? AND CREATED_AT >= CURDATE();
            `;
            const [countResult] = await db.query(countSql, [currentUserId]);
            
            userProgress = countResult[0].currentCount; 
            
            if (userProgress >= conditionValue) {
                isConditionMet = true;
            }
        } 
        // else if (missionType === 'COMMENT_COUNT') { ... } 
        // ... (다른 미션 타입 로직 추가)

        // 5. 완료 조건 충족 시 상태 업데이트 (0 -> 1)
        if (isConditionMet) {
            const updateSql = `
                UPDATE SNS_USER_DAILY_MISSION 
                SET IS_COMPLETED = 1, COMPLETED_AT = NOW() 
                WHERE USER_ID = ? AND MISSION_ID = ? AND MISSION_DATE = CURRENT_DATE() AND IS_COMPLETED = 0;
            `;
            const [updateResult] = await db.query(updateSql, [currentUserId, missionId]);

            if (updateResult.affectedRows === 1) {
                return res.json({
                    msg: "미션 완료 조건을 충족했습니다! 보상을 수령할 수 있습니다.",
                    isCompleted: true
                });
            } else {
                return res.status(500).json({ msg: "미션 상태 업데이트에 실패했습니다." });
            }
        } else {
            // 6. 완료 조건 미충족 시 응답
            return res.json({
                msg: `아직 미션 조건을 충족하지 못했습니다. (현재 진행도: ${userProgress}/${conditionValue})`,
                isCompleted: false
            });
        }


    } catch (error) {
        console.error("미션 완료 확인 처리 중 오류:", error);
        res.status(500).json({ msg: "서버 오류: 미션 완료 확인 실패", error: error.message });
    }
});
module.exports = router;