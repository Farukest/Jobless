import express from 'express'
import { createActivity, getUserActivities, deleteActivity } from '../controllers/profileActivity.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', createActivity)
router.get('/user/:userId?', getUserActivities)
router.delete('/:id', deleteActivity)

export default router
