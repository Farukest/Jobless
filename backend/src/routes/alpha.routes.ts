import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  getAllAlphaPosts,
  getAlphaPost,
  createAlphaPost,
  updateAlphaPost,
  deleteAlphaPost,
  voteOnAlphaPost,
  getAlphaComments,
  addAlphaComment,
} from '../controllers/alpha.controller'

const router = Router()

// Alpha posts
router.get('/posts', protect, getAllAlphaPosts)
router.get('/posts/:id', protect, getAlphaPost)
router.post('/posts', protect, createAlphaPost)
router.put('/posts/:id', protect, updateAlphaPost)
router.delete('/posts/:id', protect, deleteAlphaPost)

// Voting
router.post('/posts/:id/vote', protect, voteOnAlphaPost)

// Comments
router.get('/posts/:id/comments', protect, getAlphaComments)
router.post('/posts/:id/comments', protect, addAlphaComment)

export default router
