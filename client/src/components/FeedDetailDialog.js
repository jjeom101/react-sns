import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';


// 서버 URL 상수를 지정합니다.
const SERVER_URL = "http://localhost:3010";

/**
 * 게시물 상세 모달 컴포넌트
 * @param {object} props
 * @param {boolean} props.open - 모달 열림/닫힘 상태
 * @param {object|null} props.selectedFeed - 선택된 게시물 데이터
 * @param {function} props.handleClose - 모달 닫기 핸들러
 * @param {string} props.userId - 현재 로그인한 사용자 ID
 * @param {object[]} props.comments - 현재 게시물의 댓글 목록
 * @param {function} props.fetchComments - 댓글 목록 새로고침 함수
 * @param {function} props.fnFeeds - 전체 피드 목록 새로고침 함수 (댓글 추가 시 필요)
 * @param {function} props.handleDelete - 게시물 삭제 핸들러 (선택 사항)
 */
function FeedDetailDialog({
  open,
  selectedFeed,
  handleClose,
  userId,
  comments,
  fetchComments,
  fnFeeds,
  handleDelete,
}) {
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // 이미지 URL을 절대 경로로 변환하는 헬퍼 함수
  const getFullImageUrl = (relativePath) => {
    if (relativePath && relativePath.startsWith('/')) {
      return `${SERVER_URL}${relativePath}`;
    }
    return relativePath;
  };

  // 댓글 추가 핸들러
  const handleAddComment = async () => {
    const trimmedComment = newComment.trim();
    const token = localStorage.getItem("token");

    if (!trimmedComment || !userId || !token || !selectedFeed?.POST_ID) return;

    setIsPostingComment(true);

    try {
      const response = await fetch(`${SERVER_URL}/feed/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: selectedFeed.POST_ID,
          content: trimmedComment
        })
      });

      if (!response.ok) {
        throw new Error("댓글 작성 요청에 실패했습니다.");
      }

      // 댓글 목록 업데이트: 서버에서 최신 댓글 목록을 다시 가져옴
      if (selectedFeed?.POST_ID) {
        await fetchComments(selectedFeed.POST_ID); 
      }

      fnFeeds(); // 전체 피드 목록 새로고침 (선택 사항, 댓글 수 업데이트 등을 위해)
      setNewComment(''); // 입력 필드 초기화

    } catch (error) {
      console.error("댓글 작성 중 오류 발생:", error);
      alert(`댓글 작성 중 오류 발생: ${error.message}`);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (!selectedFeed) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="lg" // 넓은 모달 크기 지정
      PaperProps={{ sx: { minHeight: '60vh' } }} // 최소 높이 설정
    >
      <DialogTitle sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="span" fontWeight="bold">
            {selectedFeed.USERNAME || selectedFeed.USER_ID}의 게시물
          </Typography>
          {/* 대표 배지 표시 */}
          {selectedFeed.ACTIVE_BADGE_IMG && (
            <Avatar
              src={getFullImageUrl(selectedFeed.ACTIVE_BADGE_IMG)}
              alt={selectedFeed.ACTIVE_BADGE_NAME || 'Active Badge'}
              sx={{
                width: 24,
                height: 24,
                ml: 1,
                border: '2px solid gold'
              }}
              title={selectedFeed.ACTIVE_BADGE_NAME || '대표 배지'}
            />
          )}
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          aria-label="close"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* 게시물 내용 및 댓글 영역 (Flex 레이아웃) */}
      <DialogContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 0 }}>
        
        {/* 게시물 내용 & 이미지 영역 (왼쪽/상단) */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: 0, 
            p: 2,
            borderRight: { md: '1px solid #eee' }, 
            order: { xs: 2, md: 1 } // 모바일에서 댓글 아래로 이동
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedFeed.CONTENT}
            </Typography>
          </Box>
          
          {/* 게시물 이미지/파일 표시 */}
          {selectedFeed.FILE_URL && (
            <Box 
              sx={{ 
                width: '100%', 
                maxHeight: { xs: '300px', md: '600px' }, 
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            >
              <img
                src={getFullImageUrl(selectedFeed.FILE_URL)}
                alt={selectedFeed.FILE_NAME || '게시물 이미지'}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'contain' 
                }}
              />
            </Box>
          )}
        </Box>

        {/* 댓글 영역 (오른쪽/하단) */}
        <Box 
          sx={{ 
            width: { xs: '100%', md: '350px' }, 
            minHeight: { md: '100%' },
            p: 2,
            order: { xs: 1, md: 2 } // 모바일에서 상단으로 이동
          }}
        >
          <Typography variant="h6" gutterBottom>댓글 ({comments.length}개)</Typography>
          
          {/* 댓글 목록 */}
          <List sx={{ maxHeight: { xs: '200px', md: '450px' }, overflowY: 'auto', mb: 2, p: 0 }}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <ListItem key={comment.COMMENT_ID || comment.id} sx={{ alignItems: 'flex-start', py: 1, px: 0 }}>
                  <ListItemAvatar sx={{ minWidth: '40px' }}>
                    <Avatar 
                      src={comment.PROFILE_IMG
                        ? getFullImageUrl(comment.PROFILE_IMG)
                        : "/default-avatar.png"
                      } 
                      sx={{ width: 32, height: 32 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" component="span" fontWeight="bold">
                        {comment.USERNAME || `사용자 ID: ${comment.USER_ID}`}
                      </Typography>
                    }
                    secondary={
                      <Typography component="p" variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {comment.CONTENT}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary={<Typography variant="body2" color="text.secondary">아직 댓글이 없습니다.</Typography>} />
              </ListItem>
            )}
          </List>

          {/* 댓글 작성 입력창 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TextField
              label="댓글을 입력하세요"
              variant="outlined"
              size="small"
              fullWidth
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              disabled={newComment.trim().length === 0 || isPostingComment}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              disabled={newComment.trim().length === 0 || isPostingComment}
              endIcon={isPostingComment ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            >
              {isPostingComment ? '작성 중' : '작성'}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {/* 현재 사용자가 작성한 게시물만 삭제 버튼 표시 */}
        {selectedFeed.USER_ID === userId && handleDelete && (
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant='contained'
            startIcon={<DeleteIcon />}
          >
            게시물 삭제
          </Button>
        )}
        <Button onClick={handleClose} color="inherit" variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FeedDetailDialog;