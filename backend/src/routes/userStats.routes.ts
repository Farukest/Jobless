import express from 'express'
import { getUserStats, updateUserStats } from '../controllers/userStats.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.get('/:userId?', getUserStats)
router.put('/update', updateUserStats)

export default router
