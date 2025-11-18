import express from 'express'
import { createComment, getComments, deleteComment } from '../controllers/alphaComment.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/:alphaPostId', createComment)
router.get('/:alphaPostId', getComments)
router.delete('/:id', deleteComment)

export default router
