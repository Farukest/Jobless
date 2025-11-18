import express from 'express'
import { createComment, getComments, deleteComment } from '../controllers/contentComment.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/:contentId', createComment)
router.get('/:contentId', getComments)
router.delete('/:id', deleteComment)

export default router
