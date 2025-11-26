
const express = require('express');
const router = express.Router();
const db = require("../db"); 
const authMiddleware = require("../auth"); 



router.post('/:followingId', authMiddleware, async (req, res) => {
   
    const followerId = req.userId; 
    const { followingId } = req.params;

    if (!followerId || !followingId) {
        return res.status(400).json({ msg: "사용자 ID가 누락되었습니다." });
    }

    if (followerId.toString() === followingId.toString()) {
        return res.status(400).json({ msg: "자기 자신을 팔로우할 수 없습니다." });
    }

    const query = "INSERT INTO SNS_FOLLOWS (FOLLOWER_ID, FOLLOWING_ID) VALUES (?, ?)";
    const values = [followerId, followingId];

    try {
        const result = await db.query(query, values);
        
      
        
        res.status(201).json({ 
            msg: "팔로우 성공", 
            result: result 
        });
    } catch (error) {
       
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ msg: "이미 팔로우 중입니다." });
        }
        console.error("팔로우 DB 삽입 오류:", error);
        res.status(500).json({ msg: "팔로우 처리 중 서버 오류 발생" });
    }
});



router.delete('/:followingId', authMiddleware, async (req, res) => {
    const followerId = req.userId; 
    const { followingId } = req.params;

    if (!followerId || !followingId) {
        return res.status(400).json({ msg: "사용자 ID가 누락되었습니다." });
    }
    
    const query = "DELETE FROM SNS_FOLLOWS WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?";
    const values = [followerId, followingId];

    try {
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "팔로우 관계가 존재하지 않아 삭제할 수 없습니다." });
        }

   

        res.json({ 
            msg: "언팔로우 성공", 
            result: result 
        });
    } catch (error) {
        console.error("언팔로우 DB 삭제 오류:", error);
        res.status(500).json({ msg: "언팔로우 처리 중 서버 오류 발생" });
    }
});



router.get('/status/:followingId', authMiddleware, async (req, res) => {
    const followerId = req.userId; 
    const { followingId } = req.params; 

    if (!followerId || !followingId) {
        return res.status(400).json({ msg: "사용자 ID가 누락되었습니다." });
    }

    const query = `
        SELECT EXISTS (
            SELECT 1 FROM SNS_FOLLOWS 
            WHERE FOLLOWER_ID = ? AND FOLLOWING_ID = ?
        ) AS isFollowing
    `;
    const values = [followerId, followingId];

    try {
        const [[{ isFollowing }]] = await db.query(query, values);
        
        res.json({ 
            isFollowing: isFollowing === 1,
            msg: "팔로우 상태 확인 완료"
        });

    } catch (error) {
        console.error("팔로우 상태 확인 DB 오류:", error);
        res.status(500).json({ msg: "상태 확인 중 서버 오류 발생" });
    }
});



router.get('/following/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT T2.USER_ID, T2.NICKNAME, T2.PROFILE_IMG
        FROM SNS_FOLLOWS T1
        INNER JOIN SNS_USERS T2 ON T1.FOLLOWING_ID = T2.USER_ID
        WHERE T1.FOLLOWER_ID = ?
    `;
    try {
        const [followingList] = await db.query(query, [userId]);
        res.json({ following: followingList, count: followingList.length });
    } catch (error) {
        console.error("팔로잉 목록 조회 오류:", error);
        res.status(500).json({ msg: "서버 오류" });
    }
});
//test

router.get('/followers/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT T2.USER_ID, T2.NICKNAME, T2.PROFILE_IMG
        FROM SNS_FOLLOWS T1
        INNER JOIN SNS_USERS T2 ON T1.FOLLOWER_ID = T2.USER_ID
        WHERE T1.FOLLOWING_ID = ?
    `;
    try {
        const [followerList] = await db.query(query, [userId]);
        res.json({ followers: followerList, count: followerList.length });
    } catch (error) {
        console.error("팔로워 목록 조회 오류:", error);
        res.status(500).json({ msg: "서버 오류" });
    }
});


module.exports = router;