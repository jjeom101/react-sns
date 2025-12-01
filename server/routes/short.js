const express = require('express');
const router = express.Router();
const db = require("../db");

const fakeAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {

        req.user = { userId: 'current_logged_in_user' };
        next();
    } else {
        return res.status(401).json({ msg: "인증 실패: 토큰 누락 또는 유효하지 않음" });
    }
};

router.get('/feed', fakeAuthMiddleware, async (req, res) => {
    console.log("req.query===>",req.query);
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        

        const sql = `
            SELECT 
                S.*,
                U.NICKNAME,
                (SELECT COUNT(*) FROM SNS_LIKES L WHERE L.SHORT_ID = S.SHORT_ID) AS like_count,
                (SELECT COUNT(*) FROM SNS_LIKES L WHERE L.SHORT_ID = S.SHORT_ID AND L.USER_ID = ?) AS IS_LIKED
            FROM SNS_SHORT_VIDEOS S
            JOIN SNS_USERS U ON S.USER_ID = U.USER_ID
            ORDER BY S.CREATED_AT DESC
            LIMIT ? OFFSET ?
        `;

        const [shortsList] = await db.query(sql, [req.user.userId, parseInt(limit), parseInt(offset)]);
        console.log("sql====>",sql);
        res.json({
            msg: "success",
            list: shortsList,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });

    } catch (error) {
        console.error("쇼츠 피드 로드 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "서버 오류가 발생했습니다." });
    }
});

router.post('/view/:shortId', fakeAuthMiddleware, async (req, res) => {
    const { shortId } = req.params;

    try {
        const sql = "UPDATE SNS_SHORT_VIDEOS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE SHORT_ID = ?";
        await db.query(sql, [shortId]);

        res.json({
            msg: "success",
            shortId: shortId
        });
    } catch (error) {
        console.error("조회수 증가 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "조회수 증가 처리 중 오류가 발생했습니다." });
    }
});

router.post('/like/:shortId', fakeAuthMiddleware, async (req, res) => {
    const { shortId } = req.params;
    const userId = req.user.userId;

    if (!shortId || !userId) {
        return res.status(400).json({ msg: "fail", error: "Short ID 또는 User ID가 누락되었습니다." });
    }

    try {
        // 1단계: 좋아요가 이미 존재하는지 확인
        const checkSql = "SELECT LIKE_ID FROM SNS_LIKES WHERE SHORT_ID = ? AND USER_ID = ?";
        const [existingLike] = await db.query(checkSql, [shortId, userId]);

        if (existingLike.length > 0) {
            // 좋아요 취소 (DELETE)
            const deleteSql = "DELETE FROM SNS_LIKES WHERE SHORT_ID = ? AND USER_ID = ?";
            await db.query(deleteSql, [shortId, userId]);

            // 좋아요 취소 후 총 좋아요 수를 다시 조회
            const countSql = "SELECT COUNT(*) AS like_count FROM SNS_LIKES WHERE SHORT_ID = ?";
            const [result] = await db.query(countSql, [shortId]);
            
            res.json({
                msg: "unlike_success",
                action: "unliked",
                shortId: shortId,
                like_count: result[0].like_count
            });

        } else {
            // 좋아요 등록 (INSERT)
            const insertSql = "INSERT INTO SNS_LIKES (SHORT_ID, USER_ID) VALUES (?, ?)";
            await db.query(insertSql, [shortId, userId]);

            // 좋아요 등록 후 총 좋아요 수를 다시 조회
            const countSql = "SELECT COUNT(*) AS like_count FROM SNS_LIKES WHERE SHORT_ID = ?";
            const [result] = await db.query(countSql, [shortId]);

            res.json({
                msg: "like_success",
                action: "liked",
                shortId: shortId,
                like_count: result[0].like_count
            });
        }
        
    } catch (error) {
        console.error("좋아요 토글 중 DB 에러:", error);
        res.status(500).json({ msg: "fail", error: "좋아요 처리 중 오류가 발생했습니다." });
    }
});

module.exports = router;