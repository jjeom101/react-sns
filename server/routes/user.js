const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



const JWT_KEY = "server_secret_key";
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_images');
router.post('/join', async (req, res) => {
    let { userId, pwd, userName, nickName, bio } = req.body;
    console.log("req.body ===>", req.body);
    try {
        const hashPwd = await bcrypt.hash(pwd, 10);

        let sql = "INSERT INTO SNS_USERS (USER_ID, USERNAME, PASSWORD, NICKNAME, BIO, CREATED_AT) VALUES (?, ?, ?, ?, ?, NOW())";
        let result = await db.query(sql, [userId, userName, hashPwd, nickName, bio]);

        res.json({
            msg: "success",
            result: {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            }
        });
    } catch (error) {
        console.error("회원가입 중 데이터베이스 에러 발생:", error);
        console.log(error);
        if (error.errno === 1062) {
            return res.status(409).json({
                msg: "fail",
                error: "이미 존재하는 사용자 ID입니다."
            });
        }

        res.status(500).json({
            msg: "fail",
            error: "회원가입 처리 중 서버 오류가 발생했습니다."

        });
    }
});

router.post('/login', async (req, res) => {
    let { userId, pwd } = req.body

    console.log("클라이언트가 보낸 데이터:", req.body);
    try {

        let sql = "SELECT * FROM SNS_USERS WHERE USER_ID = ?";
        let [list] = await db.query(sql, [userId]);
        let msg = "";
        let result = "false";
        let token = "null";


        if (list.length > 0) {
            console.log("DB에서 조회된 해쉬화된 비밀번호:", list[0].PASSWORD);
        } else {
            msg = "아이디를 확인해주세요!";
        }
        
        if (list.length > 0) {

            const match = await bcrypt.compare(pwd, list[0].PASSWORD);
            if (match) {
                msg = list[0].USERNAME + "님 환영합니다!";
                result = "true";
                let user = {
                    userId: list[0].USER_ID,
                    userName: list[0].USERNAME,

                }

                token = jwt.sign(user, JWT_KEY, { expiresIn: '1h' });
            } else {
                msg = "비밀번호를 확인해라";
            }
        } else {

            msg = "해당 아이디가 존재하지 않습니다.";
        }


        res.json({
            msg: msg,
            result: result,
            token: token
        });
    } catch (error) {
        console.log("에러 발생!");
        console.log(error);
        res.status(500).json({ msg: "서버 오류 발생", result: "fail" });
    }
})

router.get("/:userId", async (req, res) => {
    let { userId } = req.params;
    try {

        let sql = `
SELECT 
    U.USER_ID,
    U.NICKNAME,
    U.PROFILE_IMG,
    U.BIO,
    IFNULL(T1.POST_COUNT, 0) AS POST_COUNT,
    IFNULL(T2.FOLLOWER_COUNT, 0) AS FOLLOWER_COUNT,
    IFNULL(T3.FOLLOWING_COUNT, 0) AS FOLLOWING_COUNT,
    B.BADGE_NAME AS ACTIVE_BADGE_NAME,
    B.BADGE_IMG AS ACTIVE_BADGE_IMG
FROM SNS_USERS U
LEFT JOIN (
    SELECT USER_ID, COUNT(*) AS POST_COUNT 
    FROM SNS_POSTS 
    GROUP BY USER_ID
) T1 ON U.USER_ID = T1.USER_ID
LEFT JOIN (
    SELECT FOLLOWING_ID, COUNT(*) AS FOLLOWER_COUNT 
    FROM SNS_FOLLOWS 
    GROUP BY FOLLOWING_ID
) T2 ON U.USER_ID = T2.FOLLOWING_ID
LEFT JOIN (
    SELECT FOLLOWER_ID, COUNT(*) AS FOLLOWING_COUNT 
    FROM SNS_FOLLOWS 
    GROUP BY FOLLOWER_ID
) T3 ON U.USER_ID = T3.FOLLOWER_ID
LEFT JOIN SNS_USER_BADGE UB 
    ON U.USER_ID = UB.USER_ID AND UB.IS_ACTIVE = 1
LEFT JOIN SNS_BADGE B 
    ON UB.BADGE_ID = B.BADGE_ID
WHERE U.USER_ID = ?;
`;


        let [list] = await db.query(sql, [userId]);
        res.json({
            user: list[0],
            result: "success"
        })



    } catch (error) {
        console.log(error);
    }
})

router.get('/:userId/followers', async (req, res) => {
    const { userId } = req.params;

    try {

        let sql = `
            SELECT 
                T1.FOLLOWER_ID AS USER_ID,
                U.NICKNAME,
                U.PROFILE_IMG
            FROM SNS_FOLLOWS T1
            JOIN SNS_USERS U ON T1.FOLLOWER_ID = U.USER_ID
            WHERE T1.FOLLOWING_ID = ?
        `;

        let [list] = await db.query(sql, [userId]);

        res.json({
            list: list,
            count: list.length,
            result: "success"
        });

    } catch (error) {
        console.error("팔로워 목록 조회 중 에러 발생:", error);
        res.status(500).json({
            msg: "fail",
            error: "팔로워 목록 조회 중 서버 오류가 발생했습니다."
        });
    }
});

router.get('/:userId/followings', async (req, res) => {
    const { userId } = req.params;

    try {

        let sql = `
            SELECT 
                T1.FOLLOWING_ID AS USER_ID,
                U.NICKNAME,
                U.PROFILE_IMG
            FROM SNS_FOLLOWS T1
            JOIN SNS_USERS U ON T1.FOLLOWING_ID = U.USER_ID
            WHERE T1.FOLLOWER_ID = ?
        `;

        let [list] = await db.query(sql, [userId]);

        res.json({
            list: list,
            count: list.length,
            result: "success"
        });

    } catch (error) {
        console.error("팔로잉 목록 조회 중 에러 발생:", error);
        res.status(500).json({
            msg: "fail",
            error: "팔로잉 목록 조회 중 서버 오류가 발생했습니다."
        });
    }
});




const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (!fs.existsSync(uploadDir)) {

            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[Multer] 새 업로드 디렉터리 생성: ${uploadDir}`);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {

        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});


const upload = multer({ storage: storage });



router.post('/profile/image', upload.single('profileImage'), async (req, res) => {
    

    const userId = req.body.userId;

    
    const relativePath = req.file ? `/uploads/profile_images/${req.file.filename}` : null;

    if (!relativePath) {
        return res.status(400).json({ result: 'fail', msg: '파일 업로드에 실패했습니다.' });
    }

    try {
        
        const updateQuery = `UPDATE SNS_USERS  SET PROFILE_IMG = ? WHERE USER_ID = ?`;
        await db.query(updateQuery, [relativePath, userId]);

        
        res.status(200).json({
            result: 'success',
            msg: '프로필 사진이 성공적으로 업데이트되었습니다.',
            profileImgUrl: relativePath
        });

    } catch (e) {
        console.error("프로필 이미지 DB 업데이트 오류:", e);
        
        res.status(500).json({ result: 'fail', msg: 'DB 업데이트 중 서버 오류가 발생했습니다.' });
    }
});


router.get('/:userId/badges', async (req, res) => {
    const { userId } = req.params;

    try {
        
        let sql = `
            SELECT 
                UB.BADGE_ID,
                B.BADGE_NAME,
                B.BADGE_DESC,
                B.BADGE_IMG,
                UB.OBTAINED_AT,
                UB.IS_ACTIVE
            FROM SNS_USER_BADGE UB
            JOIN SNS_BADGE B ON UB.BADGE_ID = B.BADGE_ID
            WHERE UB.USER_ID = ?
            ORDER BY UB.OBTAINED_AT DESC
        `;

        let [badges] = await db.query(sql, [userId]);

        res.json({
            badges: badges,
            count: badges.length,
            result: "success"
        });

    } catch (error) {
        console.error("획득 배지 목록 조회 중 에러 발생:", error);
        res.status(500).json({
            msg: "fail",
            error: "배지 목록 조회 중 서버 오류가 발생했습니다."
        });
    }
});

router.put('/badge/active', async (req, res) => {

    const { badgeId, userId } = req.body;
    try {

        let deactivateSql = `
            UPDATE SNS_USER_BADGE 
            SET IS_ACTIVE = 0 
            WHERE USER_ID = ? AND IS_ACTIVE = 1
        `;
        await db.query(deactivateSql, [userId]);


        let activateSql = `
            UPDATE SNS_USER_BADGE 
            SET IS_ACTIVE = 1 
            WHERE USER_ID = ? AND BADGE_ID = ?
        `;
        const result = await db.query(activateSql, [userId, badgeId]);

        if (result.affectedRows === 0) {

            return res.status(400).json({
                msg: "fail",
                error: "배지 착용에 실패했습니다. 해당 배지를 획득했는지 확인해주세요."
            });
        }

        res.json({
            msg: "success",
            result: "배지 착용이 성공적으로 업데이트되었습니다."
        });

    } catch (error) {
        console.error("배지 착용 설정 중 에러 발생:", error);

        res.status(500).json({
            msg: "fail",
            error: "배지 착용 설정 중 서버 오류가 발생했습니다."
        });
    }
});

router.get('/:userId/posts', async (req, res) => {
    const { userId } = req.params;

    // TODO: 필요하다면 JWT를 이용한 인증/인가 미들웨어를 여기에 추가해야 합니다.
    // 현재는 로그인 상태임을 가정하고 조회만 합니다.

    try {
        // 특정 사용자가 작성한 게시물(SNS_POSTS)과 해당 게시물에 연결된 첫 번째 미디어 파일(SNS_MEDIA_FILES)의
        // URL을 조회하여 썸네일로 사용합니다.
        let sql = `
          SELECT
    P.POST_ID,
    P.CONTENT,
    P.CREATED_AT,
    MF.FILE_URL
FROM SNS_POSTS P
LEFT JOIN SNS_MEDIA_FILES MF ON P.POST_ID = MF.POST_ID
LEFT JOIN (
    SELECT POST_ID, MIN(DISPLAY_ORDER) as min_display_order
    FROM SNS_MEDIA_FILES
    GROUP BY POST_ID
) AS MinOrder ON MF.POST_ID = MinOrder.POST_ID AND MF.DISPLAY_ORDER = MinOrder.min_display_order
WHERE P.USER_ID = ?
AND (MinOrder.POST_ID IS NOT NULL OR MF.POST_ID IS NULL)
ORDER BY P.CREATED_AT DESC
LIMIT 0, 1000;
        `;
        
        let [posts] = await db.query(sql, [userId]);

        res.json({
            msg: "success",
            posts: posts,
            count: posts.length
        });

    } catch (error) {
        console.error("사용자 게시물 목록 조회 중 에러 발생:", error);
        res.status(500).json({
            msg: "fail",
            error: "게시물 목록 조회 중 서버 오류가 발생했습니다."
        });
    }
});

module.exports = router;