import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  getComments,
  getCommentById,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from '../controllers/comment.controller'

const router = Router()

// All routes require authentication
router.use(protect)

// Comment routes - specific routes first to avoid param conflicts
router.get('/single/:id', getCommentById) // Get single comment by ID
router.post('/:id/like', toggleCommentLike) // MUST be before /:contentType/:contentId
router.get('/:commentId/replies', getReplies)
router.put('/:id', updateComment)
router.delete('/:id', deleteComment)
router.get('/:contentType/:contentId', getComments)
router.post('/:contentType/:contentId', createComment)

export default router
