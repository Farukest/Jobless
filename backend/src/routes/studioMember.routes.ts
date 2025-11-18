import express from 'express'
import { createStudioMember, getStudioMembers, updateStudioMember } from '../controllers/studioMember.controller'
import { protect } from '../middleware/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', createStudioMember)
router.get('/', getStudioMembers)
router.put('/', updateStudioMember)

export default router
