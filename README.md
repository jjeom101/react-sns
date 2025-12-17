

# 🎉 SNS 프로젝트 

사용자가 운동 관련 정보를 공유하고, DM 채팅, 쇼츠, 팔로우 시스템, 배지 시스템 등 다양한 기능을 제공하는 **소셜 네트워크 서비스 프로젝트**입니다.
Gemini API를 통해 운동 추천까지 제공하는 **운동 특화 SNS 플랫폼**을 목표로 합니다.



## 🚀 주요 기능

### 🧑‍💻 1. 회원 & 인증

* 회원가입
* 로그인
* JWT 기반 인증
* 사용자 프로필 이미지 업로드



### 📝 2. 게시글 기능

* 게시글 작성 / 등록
* 게시글 목록 조회(피드)
* 게시글 상세 보기
* 게시글 삭제
* 게시글 좋아요
* 게시글 댓글
* 리트윗(공유) 기능



### 🎬 3. 쇼츠 (Shorts)

* 쇼츠 업로드
* 쇼츠 피드 조회



### ☑️ 4. 일일 미션 시스템

* 일일 미션 목록 제공
* 미션 완료 처리
* **미션 클리어 시 배지 지급 연동**



### 🏅 5. 배지 시스템

* 조건 달성 시 배지 획득
* 마이페이지에서 보유 배지 확인
* 대표 배지(Active Badge) 설정


### 👥 6. 팔로우 / 팔로잉

* 팔로우 / 언팔로우
* 팔로우·팔로잉 목록 모달 창 제공
* 마이페이지에서 즉시 확인 가능



### 💬 7. 1:1 채팅 시스템

* 1:1 DM 채팅방 생성
* WebSocket 기반 실시간 메시지 송수신
* 메시지 읽음 처리
* 대화 목록 조회


### 🔍 8. Gemini AI 운동 추천

* “등 운동 추천” 같이 메시지를 입력하면
  → Gemini API를 이용해 운동 루틴 자동 추천



### 📱 9. 사용자 페이지

* 마이페이지

  * 프로필 이미지
  * 닉네임 / 소개
  * 게시글 수
  * 팔로워 / 팔로잉 수
  * 대표 배지 표시
  * 오늘의 일일 미션 요약



## 🗂 기술 스택

### **Frontend**

* React
* Material UI (MUI)
* React Router DOM
* Axios
* Socket.io-client

### **Backend**

* Node.js (Express)
* MySQL
* Socket.io
* JWT 인증
* Gemini API 연동

### **Infra / 기타**

* Multer (이미지 업로드)
* MySQL Workbench


## 📊 DB 구조(요약)

주요 테이블:

* SNS_USERS
* SNS_POSTS
* SNS_COMMENTS
* SNS_FOLLOWS
* SNS_MESSAGES
* SNS_CONVERSATIONS
* SNS_SHORTS
* SNS_BADGES
* SNS_USER_BADGE
* SNS_DAILY_MISSIONS
* SNS_USER_MISSION_STATUS

<img width="779" height="828" alt="image" src="https://github.com/user-attachments/assets/33199054-ad13-4e98-9e5a-8ea582bc928a" />




## 📁 프로젝트 구조


project/
 ├── backend/
 │   ├── routes/
 │   ├── controllers/
 │   ├── db/
 │   └── server.js
 └── frontend/
     ├── components/
     ├── pages/
     └── App.js


## ⭐ 향후 업데이트 예정 기능

* 그룹 채팅
* 운동 루틴 자동 저장 기능




