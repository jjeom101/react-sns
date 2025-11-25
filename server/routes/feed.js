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
    let {feedId} = req.body;
    const files = req.files;
    console.log(files);

    try{
        let results = [];
        for(let file of files){
            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO SNS_MEDIA_FILES (POST_ID, MEDIA_URL, MEDIA_TYPE, FILE_NAME) VALUES (?, ?, ?, ?)";
            let fileFullPath = host + file.destination.replace(/\\/g, '/') + file.filename;
            let result = await db.query(query, [postId, fileFullPath, mediaTypeFromMime, file.filename]);
            results.push(result);
        }
        res.json({
            message : "result",
            result : results
        });
    } catch(err){
        console.log("에러 발생!", err);
        res.status(500).send("Server Error");
    }
});


router.get("/:userId", async (req, res) => {
    // console.log(`${req.protocol}://${req.get("host")}`);
    let { userId } = req.params;
    try {
        let sql = "SELECT * FROM SNS_POSTS USER_ID = ? ";
        let [list] = await db.query(sql, [userId]);
        res.json({
            list,
            result: "success"
        })

    } catch (error) {
        console.log(error);
    }
})

router.delete("/:feedId", authMiddleware, async (req, res) => {
    let { feedId } = req.params;
    try {
        let sql = "DELETE FROM SNS_POSTS WHERE ID = ?";
        let result = await db.query(sql, [feedId]);
        res.json({
            result: result,
            msg: "success"
        });
    } catch (error) {
        console.log("에러 발생!");
    }
})

router.post("/", upload.array('files'), async (req, res) => {
    let { userId, content } = req.body;
    const files = req.files;

    let mediaUrl = null;
    let mediaType = null;
    let values;
    let sql;

    if (uploadedFiles && uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        mediaUrl = file.path;
        if (file.mimetype.startsWith('image/')) {
            mediaType = 'I';
        } else if (file.mimetype.startsWith('video/')) { 
             mediaType = 'V';
        } else {
          
            mediaUrl = null;
            mediaType = null;
        }
         sql = "INSERT INTO SNS_POSTS (USER_ID, CONTENT, MEDIA_URL, MEDIA_TYPE) VALUES (?, ?, ?, ?)";
        values = [userId, content, mediaUrl, mediaType];
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