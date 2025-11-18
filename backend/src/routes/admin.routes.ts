import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware'
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRoles,
  updateUserPermissions,
  getSiteSettings,
  updateSiteSettings,
  getAdminLogs,
  getAnalytics,
} from '../controllers/admin.controller'
import { engagementCriteriaController } from '../controllers/engagementCriteria.controller'

const router = Router()

// All admin routes require admin or super_admin role
router.use(protect)
router.use(authorize('admin', 'super_admin'))

// User management
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

// Role & permission management (super_admin only)
router.put('/users/:id/roles', authorize('super_admin'), updateUserRoles)
router.put('/users/:id/permissions', authorize('super_admin'), updateUserPermissions)

// Site settings (super_admin only)
router.get('/settings', getSiteSettings)
router.put('/settings', authorize('super_admin'), updateSiteSettings)

// Logs
router.get('/logs', getAdminLogs)

// Analytics
router.get('/analytics', getAnalytics)

// Engagement Criteria Management
router.get('/engagement-criteria', engagementCriteriaController.getAllCriteria.bind(engagementCriteriaController))
router.get('/engagement-criteria/:id', engagementCriteriaController.getCriteriaById.bind(engagementCriteriaController))
router.post('/engagement-criteria', engagementCriteriaController.createCriteria.bind(engagementCriteriaController))
router.put('/engagement-criteria/:id', engagementCriteriaController.updateCriteria.bind(engagementCriteriaController))
router.delete('/engagement-criteria/:id', engagementCriteriaController.deleteCriteria.bind(engagementCriteriaController))
router.patch('/engagement-criteria/:id/toggle', engagementCriteriaController.toggleCriteria.bind(engagementCriteriaController))

export default router
