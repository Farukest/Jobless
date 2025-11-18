import express from 'express'
import { deployContract, getAllContracts, getContract, updateContract } from '../controllers/smartContract.controller'
import { protect, authorize } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', authorize('super_admin'), deployContract)
router.get('/', getAllContracts)
router.get('/:address', getContract)
router.put('/:address', authorize('super_admin'), updateContract)

export default router
