import express from 'express'
import {
  createTransaction,
  getUserTransactions,
  updateTransactionStatus,
} from '../controllers/tokenTransaction.controller'
import { protect, authorize } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', createTransaction)
router.get('/user/:userId?', getUserTransactions)
router.put('/:id/status', authorize('admin', 'super_admin'), updateTransactionStatus)

export default router
