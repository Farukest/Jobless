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
  getHubConfig,
  getContentCategories,
  addContentCategory,
  deleteContentCategory,
  renameContentCategory,
  addContentType,
  deleteContentType,
  renameContentType,
  addDifficultyLevel,
  deleteDifficultyLevel,
  renameDifficultyLevel,
  updateSystemConfig,
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

// Dynamic J Hub Configuration Management (super_admin only)
router.get('/hub/config', authorize('super_admin'), getHubConfig) // Get all configs at once

// Categories
router.get('/hub/categories', authorize('super_admin'), getContentCategories)
router.post('/hub/categories', authorize('super_admin'), addContentCategory)
router.delete('/hub/categories/:slug', authorize('super_admin'), deleteContentCategory)
router.put('/hub/categories/:oldSlug', authorize('super_admin'), renameContentCategory)

// Content Types
router.post('/hub/types', authorize('super_admin'), addContentType)
router.delete('/hub/types/:slug', authorize('super_admin'), deleteContentType)
router.put('/hub/types/:oldSlug', authorize('super_admin'), renameContentType)

// Difficulty Levels
router.post('/hub/difficulty', authorize('super_admin'), addDifficultyLevel)
router.delete('/hub/difficulty/:slug', authorize('super_admin'), deleteDifficultyLevel)
router.put('/hub/difficulty/:oldSlug', authorize('super_admin'), renameDifficultyLevel)

// System Config (super_admin only)
router.put('/system-config/:configKey', authorize('super_admin'), updateSystemConfig)

export default router
