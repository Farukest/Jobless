import express from 'express'
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.get('/', getUserNotifications)
router.put('/:id/read', markAsRead)
router.put('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)

export default router
