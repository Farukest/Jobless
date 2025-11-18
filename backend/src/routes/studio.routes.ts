import { Router } from 'express'
import { protect } from '../middleware/auth.middleware'
import {
  getAllRequests,
  getRequest,
  createRequest,
  submitProposal,
  respondToProposal,
  deliverProduction,
  submitFeedback,
  getMyRequests,
  getMyAssignments,
} from '../controllers/studio.controller'

const router = Router()

router.get('/requests', protect, getAllRequests)
router.get('/requests/:id', protect, getRequest)
router.post('/requests', protect, createRequest)

router.post('/requests/:id/proposal', protect, submitProposal)
router.put('/requests/:id/proposal-response', protect, respondToProposal)
router.post('/requests/:id/deliver', protect, deliverProduction)
router.post('/requests/:id/feedback', protect, submitFeedback)

router.get('/my-requests', protect, getMyRequests)
router.get('/my-assignments', protect, getMyAssignments)

export default router
