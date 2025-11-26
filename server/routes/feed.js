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


module.exports = router;