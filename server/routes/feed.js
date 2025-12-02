const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});


const upload = multer({ storage });

// array 는 여러개 한개는 siggle
router.post('/upload', upload.array('file'), async (req, res) => {

    let  mediaType  = req.body.MEDIA_TYPE;
    console.log("req.body upload file ====>", req.body);
    const postId = req.body.POST_ID;
    const files = req.files;
    console.log("클라이언트가 전송한 MEDIA_TYPE:", mediaType);
    console.log(files);
    if (!files || files.length === 0 || !postId) {
        return res.status(400).json({ msg: "파일 또는 POST_ID가 누락되었습니다." });
    }

    try {
        let results = [];
        let host = `${req.protocol}://${req.get("host")}/`;
        for (let file of files) {

            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO SNS_MEDIA_FILES (POST_ID, FILE_URL, MEDIA_TYPE, FILE_NAME) VALUES (?, ?, ?, ?)";
            let fileFullPath = host + destination.replace(/\\/g, '/') + filename;
            let result = await db.query(query, [postId, fileFullPath, mediaType, file.filename]);
            results.push(result);
        }
        res.json({
            message: "result",
            result: results
        });
    } catch (err) {
        console.log("에러 발생!", err);
        res.status(500).send("Server Error");
    }
});




router.delete("/:POST_ID", authMiddleware, async (req, res) => {
    let { POST_ID } = req.params;
    try {
        let sql = "DELETE FROM SNS_POSTS WHERE POST_ID = ?";
        let result = await db.query(sql, [POST_ID]);
        res.json({
            result: result,
            msg: "success"
        });
    } catch (error) {
        console.log("에러 발생!");
        console.log(error);
    }
})

router.post("/", upload.array('files'), async (req, res) => {
    let { userId, content, mediaType } = req.body;
    const files = req.files;
    console.log("req.body ====>", req.body);

    let sql;
    let values;

    if (mediaType === 'I' || mediaType === 'V') {

        sql = "INSERT INTO SNS_POSTS (USER_ID, CONTENT, MEDIA_TYPE) VALUES (?, ?, ?)";
        values = [userId, content, mediaType];
        
    } else {
  
        sql = "INSERT INTO SNS_POSTS (USER_ID, CONTENT) VALUES (?, ?)";
        values = [userId, content];
    }
   
    try {

        let result = await db.query(sql, values);
        console.log("게시물 삽입 성공:", result);
        res.json({
            msg: "success",
            result: result
        })

    } catch (error) {
        console.error("DB 삽입 중 오류 발생:", error);
        res.status(500).json({ msg: "게시물 등록 실패", error: error.message });
    }
})

router.post("/comment", authMiddleware, async (req, res) => {
    const currentUserId = req.user && (req.user.userId || req.user.id || req.user.user_id);
    const { postId, content } = req.body;

    if (!postId || !content || !currentUserId) {
        return res.status(400).json({ msg: "필수 정보(postId, content, userId)가 누락되었습니다." });
    }
    console.log("postId,content,currentUserId",postId,content,currentUserId);
    try {
    
        const sql = `
           INSERT INTO SNS_COMMENTS (USER_ID, POST_ID, CONTENT) VALUES (?, ?, ?);
        `;
        
        const [result] = await db.query(sql, [currentUserId, postId, content]);

        if (result.affectedRows === 1) {
            res.json({
                msg: "success",
                commentId: result.insertId, // 새로 생성된 댓글 ID 반환
                userId: currentUserId,
                content: content
            });
        } else {
            res.status(500).json({ msg: "댓글 등록 실패: DB 반영 실패" });
        }

    } catch (error) {
        console.error("댓글 DB 삽입 중 오류 발생:", error);
        res.status(500).json({ msg: "댓글 등록 실패", error: error.message });
    }
});

router.get("/comments/:postId", async (req, res) => {
    const { postId } = req.params;

    if (!postId) {
        return res.status(400).json({ msg: "POST_ID가 누락되었습니다." });
    }

    try {
        // 💡 SNS_USERS 테이블을 사용하고, PROFILE_IMG 컬럼을 선택하도록 수정
        const sql = `
            SELECT 
                C.COMMENT_ID, 
                C.CONTENT, 
                C.CREATED_AT, 
                C.USER_ID,
                U.USERNAME,  
                U.PROFILE_IMG AS PROFILE_IMAGE_URL  -- 💡 U.PROFILE_IMG로 수정하고 클라이언트와 일치하도록 별칭(Alias) 사용
            FROM SNS_COMMENTS C
            JOIN SNS_USERS U ON C.USER_ID = U.USER_ID  -- 💡 SNS_USERS 테이블 이름으로 수정
            WHERE C.POST_ID = ?
            ORDER BY C.CREATED_AT ASC; 
        `;
        
        const [comments] = await db.query(sql, [postId]);

        res.json({
            msg: "success",
            comments: comments
        });

    } catch (error) {
        console.error("댓글 목록 조회 중 오류 발생:", error);
        res.status(500).json({ msg: "댓글 목록 조회 실패", error: error.message });
    }
});

router.get("/all", authMiddleware, async (req, res) => {
    const currentUserId = req.user && (req.user.userId || req.user.id || req.user.user_id); 

    if (!currentUserId) {
        return res.status(401).json({ msg: "인증 정보가 유효하지 않습니다." });
    }

    try {const sql = `
SELECT
    P.POST_ID AS POST_ID,
    P.USER_ID AS USER_ID,
    U_ORIGINAL.USERNAME AS USERNAME,
    U_ORIGINAL.PROFILE_IMG AS PROFILE_IMAGE_URL,
    P.CONTENT,
    P.CREATED_AT AS SORT_DATE,
    MF.FILE_URL,
    B.BADGE_IMG AS ACTIVE_BADGE_IMG,
    B.BADGE_NAME AS ACTIVE_BADGE_NAME,
    NULL AS RETWEET_USER_ID,
    NULL AS RETWEET_USERNAME,
    0 AS IS_RETWEET,
    IFNULL(COUNT(DISTINCT L.LIKE_ID), 0) AS like_count,
    MAX(CASE WHEN L.USER_ID = ? THEN 1 ELSE 0 END) AS is_liked,
    IFNULL(COUNT(DISTINCT R.RETWEET_ID), 0) AS retweet_count,
    MAX(CASE WHEN R.USER_ID = ? THEN 1 ELSE 0 END) AS is_retweeted
FROM
    SNS_POSTS P
JOIN
    SNS_USERS U_ORIGINAL ON P.USER_ID = U_ORIGINAL.USER_ID
LEFT JOIN
    SNS_MEDIA_FILES MF ON P.POST_ID = MF.POST_ID AND MF.DISPLAY_ORDER = 1
LEFT JOIN
    SNS_USER_BADGE UB ON U_ORIGINAL.USER_ID = UB.USER_ID AND UB.IS_ACTIVE = 1
LEFT JOIN
    SNS_BADGE B ON UB.BADGE_ID = B.BADGE_ID
LEFT JOIN 
    SNS_LIKES L ON P.POST_ID = L.POST_ID
LEFT JOIN 
    SNS_RETWEETS R ON P.POST_ID = R.POST_ID
GROUP BY
    P.POST_ID, P.USER_ID, U_ORIGINAL.USERNAME, U_ORIGINAL.PROFILE_IMG, P.CONTENT, P.CREATED_AT, MF.FILE_URL, B.BADGE_IMG, B.BADGE_NAME

UNION ALL

SELECT
    P.POST_ID AS POST_ID,
    P.USER_ID AS USER_ID,
    U_ORIGINAL.USERNAME AS USERNAME,
    U_ORIGINAL.PROFILE_IMG AS PROFILE_IMAGE_URL,
    P.CONTENT,
    R.CREATED_AT AS SORT_DATE,
    MF.FILE_URL,
    B.BADGE_IMG AS ACTIVE_BADGE_IMG,
    B.BADGE_NAME AS ACTIVE_BADGE_NAME,
    R.USER_ID AS RETWEET_USER_ID,
    U_RETWEET.USERNAME AS RETWEET_USERNAME,
    1 AS IS_RETWEET,
    T_COUNT.like_count,
    T_COUNT.is_liked,
    T_COUNT.retweet_count,
    T_COUNT.is_retweeted
FROM
    SNS_RETWEETS R
JOIN
    SNS_POSTS P ON R.POST_ID = P.POST_ID
JOIN
    SNS_USERS U_ORIGINAL ON P.USER_ID = U_ORIGINAL.USER_ID
JOIN
    SNS_USERS U_RETWEET ON R.USER_ID = U_RETWEET.USER_ID
LEFT JOIN
    SNS_MEDIA_FILES MF ON P.POST_ID = MF.POST_ID AND MF.DISPLAY_ORDER = 1
LEFT JOIN
    SNS_USER_BADGE UB ON U_ORIGINAL.USER_ID = UB.USER_ID AND UB.IS_ACTIVE = 1
LEFT JOIN
    SNS_BADGE B ON UB.BADGE_ID = B.BADGE_ID
LEFT JOIN 
    (
        SELECT
            P_SUB.POST_ID,
            IFNULL(COUNT(DISTINCT L_SUB.LIKE_ID), 0) AS like_count,
            MAX(CASE WHEN L_SUB.USER_ID = ? THEN 1 ELSE 0 END) AS is_liked,
            IFNULL(COUNT(DISTINCT R_SUB.RETWEET_ID), 0) AS retweet_count,
            MAX(CASE WHEN R_SUB.USER_ID = ? THEN 1 ELSE 0 END) AS is_retweeted
        FROM
            SNS_POSTS P_SUB
        LEFT JOIN
            SNS_LIKES L_SUB ON P_SUB.POST_ID = L_SUB.POST_ID
        LEFT JOIN
            SNS_RETWEETS R_SUB ON P_SUB.POST_ID = R_SUB.POST_ID
        GROUP BY P_SUB.POST_ID
    ) AS T_COUNT ON P.POST_ID = T_COUNT.POST_ID
WHERE
    R.USER_ID = ?
    OR R.USER_ID IN (SELECT FOLLOWING_ID FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ?)
ORDER BY
    SORT_DATE DESC
`.trim(); 
        const cleanSql = sql.replace(/\s+/g, ' ').trim();
    
        const [list] = await db.query(cleanSql, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]); 
        
    

        res.json({ msg: "success", list: list });
    } catch (error) {
        console.error("피드 조회 오류:", error);
        res.status(500).json({ msg: "피드 조회 실패", error: error.message });
    }
});
router.post("/like", authMiddleware, async (req, res) => {
    const currentUserId = req.user?.userId || req.user?.id || req.user?.user_id;
    const { postId, shortId } = req.body; 

    if (!currentUserId || (!postId && !shortId)) {
        return res.status(400).json({ msg: "필수 정보(userId, postId 또는 shortId)가 누락되었습니다." });
    }

    const targetId = postId || shortId;
    const targetField = postId ? 'POST_ID' : 'SHORT_ID';
    

    let liked = false; 
    let finalLikeCount = 0;

    try {
     
        const checkSql = `
            SELECT LIKE_ID FROM SNS_LIKES 
            WHERE USER_ID = ? AND ${targetField} = ?;
        `;
        const [existingLike] = await db.query(checkSql, [currentUserId, targetId]);

        if (existingLike.length > 0) {
          
            const deleteSql = `
                DELETE FROM SNS_LIKES 
                WHERE USER_ID = ? AND ${targetField} = ?;
            `;
            await db.query(deleteSql, [currentUserId, targetId]);
            liked = false; 

        } else {
            const insertSql = `
                INSERT INTO SNS_LIKES (USER_ID, ${targetField}) 
                VALUES (?, ?);
            `;
            await db.query(insertSql, [currentUserId, targetId]);
            liked = true; 
        }

       
        const countSql = `
            SELECT COUNT(LIKE_ID) AS like_count 
            FROM SNS_LIKES 
            WHERE ${targetField} = ?;
        `;
        const [countResult] = await db.query(countSql, [targetId]);
        
        if (countResult.length > 0) {
            finalLikeCount = countResult[0].like_count;
        }

  
        return res.json({ 
            msg: liked ? "like_added" : "like_removed", 
            liked: liked, 
            likeCount: finalLikeCount 
        });

    } catch (error) {
        console.error("좋아요 처리 중 오류 발생:", error);
        res.status(500).json({ msg: "좋아요 처리 실패", error: error.message });
    }
});


router.post("/retweet", authMiddleware, async (req, res) => {
    const currentUserId = req.user?.userId || req.user?.id || req.user?.user_id;
    const { postId, shortId } = req.body; 

    if (!currentUserId || (!postId && !shortId)) {
        return res.status(400).json({ msg: "필수 정보(userId, postId 또는 shortId)가 누락되었습니다." });
    }

    const targetId = postId || shortId;
    const targetField = postId ? 'POST_ID' : 'SHORT_ID';
    
    let retweeted = false; 
    let finalRetweetCount = 0;

    try {
   
        const checkSql = `
            SELECT RETWEET_ID FROM SNS_RETWEETS 
            WHERE USER_ID = ? AND ${targetField} = ?;
        `;
        const [existingRetweet] = await db.query(checkSql, [currentUserId, targetId]);

        if (existingRetweet.length > 0) {
      
            const deleteSql = `
                DELETE FROM SNS_RETWEETS 
                WHERE USER_ID = ? AND ${targetField} = ?;
            `;
            await db.query(deleteSql, [currentUserId, targetId]);
            retweeted = false;
        } else {
     
            const insertSql = `
                INSERT INTO SNS_RETWEETS (USER_ID, ${targetField}) 
                VALUES (?, ?);
            `;
            await db.query(insertSql, [currentUserId, targetId]);
            retweeted = true;
        }

    
        const countSql = `
            SELECT COUNT(RETWEET_ID) AS retweet_count 
            FROM SNS_RETWEETS 
            WHERE ${targetField} = ?;
        `;
        const [countResult] = await db.query(countSql, [targetId]);
        
        if (countResult.length > 0) {
            finalRetweetCount = countResult[0].retweet_count;
        }

        return res.json({ 
            msg: retweeted ? "retweet_added" : "retweet_removed", 
            retweeted: retweeted, 
            retweetCount: finalRetweetCount 
        });

    } catch (error) {
        console.error("리트윗 처리 중 오류 발생:", error);
        res.status(500).json({ msg: "리트윗 처리 실패", error: error.message });
    }
});


module.exports = router;