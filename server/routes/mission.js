
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
module.exports = router;