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


router.get("/:userId", async (req, res) => {
    // console.log(`${req.protocol}://${req.get("host")}`);
    let { userId } = req.params;
    try {
        let sql = "SELECT * FROM sns_posts F INNER JOIN SNS_MEDIA_FILES I ON F.POST_ID = I.POST_ID WHERE F.USER_ID =?";
        let [list] = await db.query(sql, [userId]);
        res.json({
            list,
            result: "success"
        })

    } catch (error) {
        console.log(error);
    }
})

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

router.get("/:currentUserId", authMiddleware, async (req, res) => {
    const currentUserId = req.params.currentUserId; 

    if (!currentUserId) {
        return res.status(400).json({ msg: "사용자 ID가 필요합니다." });
    }

    try {
        const sql = `
            SELECT
                P.POST_ID,
                P.USER_ID,
                P.CONTENT,
                P.CREATED_AT,
                U.USERNAME,
                U.PROFILE_IMG AS PROFILE_IMAGE_URL,
                MF.FILE_URL,
                
                COUNT(L.LIKE_ID) AS LIKE_COUNT,
                
                MAX(CASE WHEN L.USER_ID = ? THEN 1 ELSE 0 END) AS IS_LIKED 
                
            FROM SNS_POSTS P
            JOIN SNS_USERS U ON P.USER_ID = U.USER_ID
            LEFT JOIN SNS_MEDIA_FILES MF ON P.POST_ID = MF.POST_ID AND MF.DISPLAY_ORDER = 1
            LEFT JOIN SNS_LIKES L ON P.POST_ID = L.POST_ID  
            
            GROUP BY 
                P.POST_ID, 
                P.USER_ID, 
                P.CONTENT, 
                P.CREATED_AT, 
                U.USERNAME, 
                U.PROFILE_IMG, 
                MF.FILE_URL
            ORDER BY P.CREATED_AT DESC;
        `;
        
        const [list] = await db.query(sql, [currentUserId]); 
        console.log("=== [SERVER] DB 쿼리 결과 확인 ===");
        if (list && list.length > 0) {
            console.log("첫 번째 게시물 데이터 (필드 이름 확인):", list[0]);
        } else {
            console.log("DB에서 로드된 게시물이 없습니다.");
        }
        console.log("=====================================");

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
            likeCount: finalLikeCount // 💡 최신 갯수 반환
        });

    } catch (error) {
        console.error("좋아요 처리 중 오류 발생:", error);
        res.status(500).json({ msg: "좋아요 처리 실패", error: error.message });
    }
});


module.exports = router;