-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: mysqldb
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `sns_badge`
--

DROP TABLE IF EXISTS `sns_badge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_badge` (
  `BADGE_ID` bigint NOT NULL AUTO_INCREMENT,
  `BADGE_NAME` varchar(100) NOT NULL,
  `BADGE_DESC` varchar(255) DEFAULT NULL,
  `BADGE_IMG` varchar(255) DEFAULT NULL,
  `BADGE_TYPE` varchar(50) NOT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`BADGE_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_badge`
--

LOCK TABLES `sns_badge` WRITE;
/*!40000 ALTER TABLE `sns_badge` DISABLE KEYS */;
INSERT INTO `sns_badge` VALUES (1,'골드 배지','가장 높은 난이도의 업적을 달성한 사용자에게 주어지는 금 배지입니다.','/uploads/badge/gold.png','GOLD','2025-12-01 18:09:19'),(2,'금배찌','금색 배지(한국어 파일명). 업적 달성 시 부여되는 금 배지입니다.','/uploads/badge/금배찌.png','GOLD','2025-12-01 18:09:19'),(3,'실버 배지','중간 난이도의 업적을 달성한 사용자에게 주어지는 실버 배지입니다.','/uploads/badge/silver.png','SILVER','2025-12-01 18:09:19'),(4,'은배찌','은색 배지(한국어 파일명). 업적 달성 시 부여되는 실버 배지입니다.','/uploads/badge/은배찌.png','SILVER','2025-12-01 18:09:19');
/*!40000 ALTER TABLE `sns_badge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_comments`
--

DROP TABLE IF EXISTS `sns_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_comments` (
  `COMMENT_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `POST_ID` bigint DEFAULT NULL,
  `SHORT_ID` bigint DEFAULT NULL,
  `PARENT_COMMENT_ID` bigint DEFAULT NULL,
  `CONTENT` text NOT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`COMMENT_ID`),
  KEY `idx_comments_post_id` (`POST_ID`),
  KEY `idx_comments_short_id` (`SHORT_ID`),
  KEY `fk_comments_user` (`USER_ID`),
  KEY `fk_comments_parent` (`PARENT_COMMENT_ID`),
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`PARENT_COMMENT_ID`) REFERENCES `sns_comments` (`COMMENT_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_short` FOREIGN KEY (`SHORT_ID`) REFERENCES `sns_short_videos` (`SHORT_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_comments`
--

LOCK TABLES `sns_comments` WRITE;
/*!40000 ALTER TABLE `sns_comments` DISABLE KEYS */;
INSERT INTO `sns_comments` VALUES (1,'user02',4,NULL,NULL,'멋지네요','2025-11-27 17:20:30'),(2,'user02',5,NULL,NULL,'시원해보이네요','2025-11-27 17:37:35'),(3,'user01',3,NULL,NULL,'ㅎㅇㅇㅎ','2025-11-28 09:33:55'),(4,'user01',4,NULL,NULL,'멋지네요!!','2025-11-28 16:39:28'),(5,'user01',8,NULL,NULL,'햇빛이 강해도 바람이 시원하네요!!','2025-12-01 15:39:50'),(6,'user05',12,NULL,NULL,'또 가고 싶네요!','2025-12-01 17:42:45');
/*!40000 ALTER TABLE `sns_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_conversations`
--

DROP TABLE IF EXISTS `sns_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_conversations` (
  `CONVERSATION_ID` bigint NOT NULL AUTO_INCREMENT,
  `TYPE` varchar(10) NOT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IS_GROUP` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`CONVERSATION_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_conversations`
--

LOCK TABLES `sns_conversations` WRITE;
/*!40000 ALTER TABLE `sns_conversations` DISABLE KEYS */;
INSERT INTO `sns_conversations` VALUES (1,'DM','2025-11-27 14:33:06',0),(2,'DM','2025-11-27 14:33:28',0),(3,'DM','2025-11-27 14:36:43',0),(4,'DM','2025-11-27 14:36:52',0),(5,'GROUP','2025-11-27 14:40:15',0),(6,'DM','2025-11-27 14:41:35',0),(7,'DM','2025-11-27 14:42:19',0),(8,'DM','2025-11-27 15:22:32',0),(9,'DM','2025-11-27 15:23:04',0),(10,'DM','2025-11-28 17:39:04',0),(11,'DM','2025-12-01 17:37:34',0),(12,'DM','2025-12-01 17:38:52',0),(13,'DM','2025-12-02 11:58:17',0),(14,'DM','2025-12-02 11:59:01',0);
/*!40000 ALTER TABLE `sns_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_daily_mission`
--

DROP TABLE IF EXISTS `sns_daily_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_daily_mission` (
  `MISSION_ID` bigint NOT NULL AUTO_INCREMENT,
  `MISSION_NAME` varchar(100) NOT NULL,
  `MISSION_DESC` varchar(255) DEFAULT NULL,
  `CONDITION_DETAIL` varchar(255) DEFAULT NULL,
  `REWARD_BADGE_ID` bigint DEFAULT NULL,
  `IS_ACTIVE` tinyint(1) NOT NULL DEFAULT '1',
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MISSION_ID`),
  KEY `fk_mission_reward_badge` (`REWARD_BADGE_ID`),
  CONSTRAINT `fk_mission_reward_badge` FOREIGN KEY (`REWARD_BADGE_ID`) REFERENCES `sns_badge` (`BADGE_ID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_daily_mission`
--

LOCK TABLES `sns_daily_mission` WRITE;
/*!40000 ALTER TABLE `sns_daily_mission` DISABLE KEYS */;
INSERT INTO `sns_daily_mission` VALUES (1,'유산소 30분 하기','30분 동안 지속적으로 유산소 운동을 수행하세요.','30분 이상 유산소',1,1,'2025-12-01 17:54:10'),(2,'러닝머신 3km 달리기','러닝머신에서 3km를 완주하세요.','3km 달성',2,1,'2025-12-01 17:54:10'),(3,'사이클 10km 타기','실내 또는 실외 자전거로 10km를 주행하세요.','10km 완료',3,1,'2025-12-01 17:54:10'),(4,'줄넘기 500개 하기','줄넘기 500회를 목표로 도전하세요.','줄넘기 500회',4,1,'2025-12-01 17:54:10');
/*!40000 ALTER TABLE `sns_daily_mission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_follows`
--

DROP TABLE IF EXISTS `sns_follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_follows` (
  `FOLLOW_ID` bigint NOT NULL AUTO_INCREMENT,
  `FOLLOWER_ID` varchar(255) NOT NULL,
  `FOLLOWING_ID` varchar(255) NOT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FOLLOW_ID`),
  UNIQUE KEY `uk_follow` (`FOLLOWER_ID`,`FOLLOWING_ID`),
  KEY `idx_follows_follower_id` (`FOLLOWER_ID`),
  KEY `idx_follows_following_id` (`FOLLOWING_ID`),
  CONSTRAINT `fk_follows_follower` FOREIGN KEY (`FOLLOWER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_following` FOREIGN KEY (`FOLLOWING_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_follows`
--

LOCK TABLES `sns_follows` WRITE;
/*!40000 ALTER TABLE `sns_follows` DISABLE KEYS */;
INSERT INTO `sns_follows` VALUES (1,'user01','user02','2025-11-27 11:06:29'),(3,'user02','user01','2025-11-27 11:06:35'),(4,'user01','user03','2025-11-27 12:05:50'),(11,'user01','user04','2025-11-28 12:12:44'),(12,'user03','user01','2025-12-01 15:46:28'),(13,'user05','user01','2025-12-01 17:32:02'),(16,'user03','user04','2025-12-01 17:37:34'),(17,'user03','user05','2025-12-01 17:38:52'),(19,'user01','user05','2025-12-02 11:58:32'),(20,'user05','user02','2025-12-02 11:59:01');
/*!40000 ALTER TABLE `sns_follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_likes`
--

DROP TABLE IF EXISTS `sns_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_likes` (
  `LIKE_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `POST_ID` bigint DEFAULT NULL,
  `SHORT_ID` bigint DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LIKE_ID`),
  UNIQUE KEY `uk_like` (`USER_ID`,`POST_ID`,`SHORT_ID`),
  KEY `idx_likes_post_id` (`POST_ID`),
  KEY `idx_likes_short_id` (`SHORT_ID`),
  CONSTRAINT `fk_likes_short` FOREIGN KEY (`SHORT_ID`) REFERENCES `sns_short_videos` (`SHORT_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_likes`
--

LOCK TABLES `sns_likes` WRITE;
/*!40000 ALTER TABLE `sns_likes` DISABLE KEYS */;
INSERT INTO `sns_likes` VALUES (19,'user02',5,NULL,'2025-11-27 18:17:38'),(20,'user02',4,NULL,'2025-11-27 18:18:07'),(25,'user01',3,NULL,'2025-11-28 09:44:50'),(26,'user01',5,NULL,'2025-11-28 10:12:28'),(27,'user01',6,NULL,'2025-11-28 16:41:23'),(28,'user01',7,NULL,'2025-12-01 15:36:06'),(29,'user01',8,NULL,'2025-12-01 15:39:27'),(30,'user03',9,NULL,'2025-12-01 15:40:56'),(31,'user03',NULL,3,'2025-12-01 16:51:34'),(32,'user01',NULL,3,'2025-12-01 16:52:09'),(33,'user05',12,NULL,'2025-12-01 17:42:47');
/*!40000 ALTER TABLE `sns_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_media_files`
--

DROP TABLE IF EXISTS `sns_media_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_media_files` (
  `MEDIA_ID` bigint NOT NULL AUTO_INCREMENT,
  `POST_ID` bigint NOT NULL,
  `FILE_URL` varchar(512) NOT NULL,
  `MEDIA_TYPE` char(20) DEFAULT NULL,
  `FILE_NAME` varchar(255) DEFAULT NULL,
  `DISPLAY_ORDER` int NOT NULL DEFAULT '1' COMMENT '게시물 내 미디어 노출 순서',
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MEDIA_ID`),
  KEY `fk_mediafiles_post` (`POST_ID`),
  CONSTRAINT `fk_mediafiles_post` FOREIGN KEY (`POST_ID`) REFERENCES `sns_posts` (`POST_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_media_files`
--

LOCK TABLES `sns_media_files` WRITE;
/*!40000 ALTER TABLE `sns_media_files` DISABLE KEYS */;
INSERT INTO `sns_media_files` VALUES (2,4,'http://localhost:3010/uploads/1764229789641-ì¼êµ¬ì¥.png','I','1764229789641-ì¼êµ¬ì¥.png',1,'2025-11-27 16:49:49'),(3,5,'http://localhost:3010/uploads/1764229971596-ì½ì¹´ì½ë¼.png','I','1764229971596-ì½ì¹´ì½ë¼.png',1,'2025-11-27 16:52:51'),(5,7,'http://localhost:3010/uploads/1764570960580-ë´.png','I','1764570960580-ë´.png',1,'2025-12-01 15:36:00'),(6,8,'http://localhost:3010/uploads/1764571164649-ì¬ë¦.png','I','1764571164649-ì¬ë¦.png',1,'2025-12-01 15:39:24'),(7,9,'http://localhost:3010/uploads/1764571254355-ê°ì.png','I','1764571254355-ê°ì.png',1,'2025-12-01 15:40:54'),(9,12,'http://localhost:3010/uploads/1764578527205-ê²¨ì¸.png','I','1764578527205-ê²¨ì¸.png',1,'2025-12-01 17:42:07'),(10,13,'http://localhost:3010/uploads/1764647188503-ì½ì¹´ì½ë¼.png','I','1764647188503-ì½ì¹´ì½ë¼.png',1,'2025-12-02 12:46:28'),(11,14,'http://localhost:3010/uploads/1764647405294-ê°ì.png','I','1764647405294-ê°ì.png',1,'2025-12-02 12:50:05');
/*!40000 ALTER TABLE `sns_media_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_messages`
--

DROP TABLE IF EXISTS `sns_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_messages` (
  `MESSAGE_ID` bigint NOT NULL AUTO_INCREMENT,
  `CONVERSATION_ID` varchar(255) NOT NULL,
  `SENDER_ID` varchar(255) NOT NULL,
  `CONTENT` text,
  `MEDIA_URL` varchar(255) DEFAULT NULL,
  `MEDIA_TYPE` char(1) DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IS_READ` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`MESSAGE_ID`),
  KEY `idx_messages_conv_id` (`CONVERSATION_ID`),
  KEY `fk_messages_sender` (`SENDER_ID`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`SENDER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_messages`
--

LOCK TABLES `sns_messages` WRITE;
/*!40000 ALTER TABLE `sns_messages` DISABLE KEYS */;
INSERT INTO `sns_messages` VALUES (1,'8','user01','ㅎㅇㅎㅇ',NULL,NULL,'2025-12-01 16:59:39',1),(2,'8','user01','ㅎㅇㅎㅇ',NULL,NULL,'2025-12-01 16:59:40',1),(3,'8','user02','나도안녕',NULL,NULL,'2025-12-01 17:00:22',1),(4,'8','user02','반가워',NULL,NULL,'2025-12-01 17:03:27',1),(5,'8','user01','반가워',NULL,NULL,'2025-12-01 17:07:00',1),(6,'13','user05','안녕하세요!!!',NULL,NULL,'2025-12-02 12:00:18',0);
/*!40000 ALTER TABLE `sns_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_participants`
--

DROP TABLE IF EXISTS `sns_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_participants` (
  `PARTICIPANT_ID` bigint NOT NULL AUTO_INCREMENT,
  `CONVERSATION_ID` bigint NOT NULL,
  `USER_ID` varchar(255) NOT NULL,
  `LAST_READ_AT` datetime DEFAULT NULL,
  `IS_MUTED` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`PARTICIPANT_ID`),
  UNIQUE KEY `uk_participant` (`CONVERSATION_ID`,`USER_ID`),
  KEY `idx_participants_user_id` (`USER_ID`),
  CONSTRAINT `fk_participants_conversation` FOREIGN KEY (`CONVERSATION_ID`) REFERENCES `sns_conversations` (`CONVERSATION_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_participants`
--

LOCK TABLES `sns_participants` WRITE;
/*!40000 ALTER TABLE `sns_participants` DISABLE KEYS */;
INSERT INTO `sns_participants` VALUES (1,5,'user01','2025-11-28 17:48:09',0),(2,5,'user02','2025-11-27 14:41:39',0),(3,5,'user03','2025-11-27 14:41:39',0),(4,5,'user04','2025-11-27 14:41:39',0),(5,8,'user01','2025-12-01 17:09:34',0),(6,8,'user02','2025-12-01 17:09:13',0),(7,9,'user01','2025-12-01 14:42:47',0),(8,9,'user03','2025-11-27 15:23:17',0),(9,10,'user01','2025-11-28 17:50:03',0),(10,10,'GEMINI_BOT',NULL,0),(11,11,'user03','2025-12-01 17:37:34',0),(12,11,'user04','2025-12-01 17:37:34',0),(13,12,'user03','2025-12-01 17:38:52',0),(14,12,'user05','2025-12-01 17:38:52',0),(15,13,'user01','2025-12-02 11:58:17',0),(16,13,'user05','2025-12-02 12:00:24',0),(17,14,'user02','2025-12-02 11:59:01',0),(18,14,'user05','2025-12-02 11:59:01',0);
/*!40000 ALTER TABLE `sns_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_posts`
--

DROP TABLE IF EXISTS `sns_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_posts` (
  `POST_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(50) NOT NULL,
  `CONTENT` text,
  `MEDIA_TYPE` char(50) DEFAULT NULL,
  `VIEW_COUNT` int NOT NULL DEFAULT '0',
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`POST_ID`),
  KEY `fk_posts_user` (`USER_ID`),
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_posts`
--

LOCK TABLES `sns_posts` WRITE;
/*!40000 ALTER TABLE `sns_posts` DISABLE KEYS */;
INSERT INTO `sns_posts` VALUES (4,'user02','야구장 도착!!','I',0,'2025-11-27 16:49:48'),(5,'user02','콜라 맛있다!!','I',0,'2025-11-27 16:52:50'),(7,'user01','봄바람 따라 기분도 업!','I',0,'2025-12-01 15:35:59'),(8,'user01','햇빛이 쨍! 기분도 쨍!','I',0,'2025-12-01 15:39:23'),(9,'user03','한 잎 한 잎 떨어지는 계절에 쉬어가기','I',0,'2025-12-01 15:40:53'),(12,'user05','눈이 멋지게 쌓였네요!!','I',0,'2025-12-01 17:42:06'),(13,'user01','콜라가 맛있네요','I',0,'2025-12-02 12:46:27'),(14,'user05','단풍이 떨어지네요','I',0,'2025-12-02 12:50:04');
/*!40000 ALTER TABLE `sns_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_retweets`
--

DROP TABLE IF EXISTS `sns_retweets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_retweets` (
  `RETWEET_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `POST_ID` bigint DEFAULT NULL,
  `SHORT_ID` bigint DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RETWEET_ID`),
  UNIQUE KEY `uk_retweet` (`USER_ID`,`POST_ID`,`SHORT_ID`),
  KEY `idx_retweets_post_id` (`POST_ID`),
  KEY `idx_retweets_short_id` (`SHORT_ID`),
  CONSTRAINT `fk_retweets_post` FOREIGN KEY (`POST_ID`) REFERENCES `sns_posts` (`POST_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_retweets_short` FOREIGN KEY (`SHORT_ID`) REFERENCES `sns_short_videos` (`SHORT_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_retweets_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_retweets`
--

LOCK TABLES `sns_retweets` WRITE;
/*!40000 ALTER TABLE `sns_retweets` DISABLE KEYS */;
INSERT INTO `sns_retweets` VALUES (1,'user01',5,NULL,'2025-11-28 10:32:05'),(3,'user02',4,NULL,'2025-11-28 10:38:32'),(4,'user05',9,NULL,'2025-12-01 17:42:18');
/*!40000 ALTER TABLE `sns_retweets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_short_videos`
--

DROP TABLE IF EXISTS `sns_short_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_short_videos` (
  `SHORT_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `VIDEO_URL` varchar(255) NOT NULL,
  `DESCRIPTION` text,
  `THUMBNAIL_URL` varchar(255) DEFAULT NULL,
  `VIEW_COUNT` int NOT NULL DEFAULT '0',
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SHORT_ID`),
  KEY `idx_shorts_user_id` (`USER_ID`),
  CONSTRAINT `fk_shorts_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_short_videos`
--

LOCK TABLES `sns_short_videos` WRITE;
/*!40000 ALTER TABLE `sns_short_videos` DISABLE KEYS */;
INSERT INTO `sns_short_videos` VALUES (1,'user01','/uploads/shorts_videos/[팔운동루틴] 따라하면 성장하는 이두 삼두 3종목!! (슈퍼세트).mp4','[팔운동루틴] 따라하면 성장하는 이두 삼두 3종목!! (슈퍼세트)',NULL,0,'2025-12-01 15:01:59'),(3,'user03','/uploads/1764575476529-[íì´ëë£¨í´] ë°ë¼íë©´ ì±ì¥íë ì´ë ì¼ë 3ì¢ëª©!! (ìí¼ì¸í¸).mp4','슈퍼세트 운동법',NULL,0,'2025-12-01 16:51:16');
/*!40000 ALTER TABLE `sns_short_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_user_badge`
--

DROP TABLE IF EXISTS `sns_user_badge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_user_badge` (
  `USER_BADGE_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `BADGE_ID` bigint NOT NULL,
  `OBTAINED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IS_ACTIVE` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`USER_BADGE_ID`),
  UNIQUE KEY `uk_user_badge` (`USER_ID`,`BADGE_ID`),
  KEY `fk_userbadge_badge` (`BADGE_ID`),
  CONSTRAINT `fk_userbadge_badge` FOREIGN KEY (`BADGE_ID`) REFERENCES `sns_badge` (`BADGE_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_userbadge_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_user_badge`
--

LOCK TABLES `sns_user_badge` WRITE;
/*!40000 ALTER TABLE `sns_user_badge` DISABLE KEYS */;
INSERT INTO `sns_user_badge` VALUES (5,'user01',1,'2025-12-01 18:15:58',0),(6,'user01',2,'2025-12-01 18:15:58',0),(7,'user01',3,'2025-12-01 18:15:58',0),(8,'user01',4,'2025-12-01 18:15:58',1),(9,'user05',1,'2025-12-02 12:54:45',1);
/*!40000 ALTER TABLE `sns_user_badge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_user_daily_mission`
--

DROP TABLE IF EXISTS `sns_user_daily_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_user_daily_mission` (
  `USER_MISSION_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `MISSION_ID` bigint NOT NULL,
  `MISSION_DATE` date NOT NULL DEFAULT (curdate()),
  `IS_COMPLETED` tinyint(1) NOT NULL DEFAULT '0',
  `COMPLETED_AT` datetime DEFAULT NULL,
  PRIMARY KEY (`USER_MISSION_ID`),
  UNIQUE KEY `uk_user_mission_date` (`USER_ID`,`MISSION_ID`,`MISSION_DATE`),
  KEY `fk_usermission_mission` (`MISSION_ID`),
  CONSTRAINT `fk_usermission_mission` FOREIGN KEY (`MISSION_ID`) REFERENCES `sns_daily_mission` (`MISSION_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_usermission_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_user_daily_mission`
--

LOCK TABLES `sns_user_daily_mission` WRITE;
/*!40000 ALTER TABLE `sns_user_daily_mission` DISABLE KEYS */;
INSERT INTO `sns_user_daily_mission` VALUES (1,'user01',2,'2025-12-02',2,'2025-12-02 11:17:55'),(2,'user01',4,'2025-12-02',2,'2025-12-02 11:18:03'),(3,'user01',1,'2025-12-02',2,'2025-12-02 12:46:39'),(5,'user05',1,'2025-12-02',2,'2025-12-02 12:50:07');
/*!40000 ALTER TABLE `sns_user_daily_mission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_users`
--

DROP TABLE IF EXISTS `sns_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_users` (
  `USER_ID` varchar(255) NOT NULL,
  `USERNAME` varchar(50) NOT NULL,
  `PASSWORD` varchar(200) NOT NULL,
  `NICKNAME` varchar(100) DEFAULT NULL,
  `PROFILE_IMG` varchar(512) DEFAULT NULL,
  `BIO` varchar(255) DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `USERNAME` (`USERNAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_users`
--

LOCK TABLES `sns_users` WRITE;
/*!40000 ALTER TABLE `sns_users` DISABLE KEYS */;
INSERT INTO `sns_users` VALUES ('user01','홍길동','$2b$10$EYnGUkWalNuPWbGZNgAkKulLDIa.I.6jXGNt5YZwZgEaBC0xZFy6m','홍박사','/uploads/profile_images/1764309397383-622703350.png','안녕하세요 잘부탁 드립니다!','2025-11-26 16:14:37'),('user02','김영희','$2b$10$zjOt1YUpMXnmBnkW1Q54aO2haQYc3sFjFvwvrx4mHSr0u8KxzqTey','영공주','/uploads/profile_images/1764310499528-488838942.png','안녕하세요 반갑습니다','2025-11-26 16:41:45'),('user03','엄준식','$2b$10$csZ8z3T6/zN8U.aSa/Pa6.TLrORaY4Pm.J3lgYHntKlVeQ3Qzs9/u','엄대장','/uploads/profile_images/1764577227409-140704691.png','안녕하세요!!','2025-11-27 11:49:41'),('user04','안호준','$2b$10$PqnWAKOEMZRLc5U2aP/7BeF64M6lWC44RqJ7KelVbj1ySMoKknOMa','호준',NULL,'잘부탁드립니다!','2025-11-27 11:50:23'),('user05','이건','$2b$10$NVQGW8SbHLAtIb5NXvm2H.JUV87FRqIE1RoH.WckRuIxIi7fplLBG','적이건','/uploads/profile_images/1764578482959-592223840.png','잘부탁드립니다!!','2025-12-01 17:31:54');
/*!40000 ALTER TABLE `sns_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_workout_exercises`
--

DROP TABLE IF EXISTS `sns_workout_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_workout_exercises` (
  `EXERCISE_ID` bigint NOT NULL AUTO_INCREMENT,
  `ROUTINE_ID` bigint NOT NULL,
  `EXERCISE_NAME` varchar(100) NOT NULL,
  `SETS` int DEFAULT NULL,
  `REPS` int DEFAULT NULL,
  `WEIGHT_KG` decimal(6,2) DEFAULT NULL,
  `REST_TIME_SEC` int DEFAULT NULL,
  PRIMARY KEY (`EXERCISE_ID`),
  KEY `fk_exercises_routine` (`ROUTINE_ID`),
  CONSTRAINT `fk_exercises_routine` FOREIGN KEY (`ROUTINE_ID`) REFERENCES `sns_workout_routines` (`ROUTINE_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_workout_exercises`
--

LOCK TABLES `sns_workout_exercises` WRITE;
/*!40000 ALTER TABLE `sns_workout_exercises` DISABLE KEYS */;
/*!40000 ALTER TABLE `sns_workout_exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sns_workout_routines`
--

DROP TABLE IF EXISTS `sns_workout_routines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sns_workout_routines` (
  `ROUTINE_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(255) NOT NULL,
  `TITLE` varchar(100) NOT NULL,
  `DESCRIPTION` text,
  `DIFFICULTY` varchar(50) DEFAULT NULL,
  `EST_DURATION_MIN` int DEFAULT NULL,
  `TARGET_MUSCLE` varchar(100) DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ROUTINE_ID`),
  KEY `fk_routines_user` (`USER_ID`),
  CONSTRAINT `fk_routines_user` FOREIGN KEY (`USER_ID`) REFERENCES `sns_users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sns_workout_routines`
--

LOCK TABLES `sns_workout_routines` WRITE;
/*!40000 ALTER TABLE `sns_workout_routines` DISABLE KEYS */;
/*!40000 ALTER TABLE `sns_workout_routines` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-02 16:35:32
