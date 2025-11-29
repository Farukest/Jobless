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

// All admin routes require authentication
router.use(protect)

// User management (super_admin only)
router.get('/users', authorize('super_admin'), getAllUsers)
router.get('/users/:id', authorize('super_admin'), getUserById)
router.put('/users/:id', authorize('super_admin'), updateUser)
router.delete('/users/:id', authorize('super_admin'), deleteUser)

// Role & permission management (super_admin only)
router.put('/users/:id/roles', authorize('super_admin'), updateUserRoles)
router.put('/users/:id/permissions', authorize('super_admin'), updateUserPermissions)

// Site settings (super_admin only)
router.get('/settings', authorize('super_admin'), getSiteSettings)
router.put('/settings', authorize('super_admin'), updateSiteSettings)

// Logs (admin & super_admin)
router.get('/logs', authorize('admin', 'super_admin'), getAdminLogs)

// Analytics (admin & super_admin)
router.get('/analytics', authorize('admin', 'super_admin'), getAnalytics)

// Engagement Criteria Management (admin & super_admin)
router.get('/engagement-criteria', authorize('admin', 'super_admin'), engagementCriteriaController.getAllCriteria.bind(engagementCriteriaController))
router.get('/engagement-criteria/:id', authorize('admin', 'super_admin'), engagementCriteriaController.getCriteriaById.bind(engagementCriteriaController))
router.post('/engagement-criteria', authorize('admin', 'super_admin'), engagementCriteriaController.createCriteria.bind(engagementCriteriaController))
router.put('/engagement-criteria/:id', authorize('admin', 'super_admin'), engagementCriteriaController.updateCriteria.bind(engagementCriteriaController))
router.delete('/engagement-criteria/:id', authorize('admin', 'super_admin'), engagementCriteriaController.deleteCriteria.bind(engagementCriteriaController))
router.patch('/engagement-criteria/:id/toggle', authorize('admin', 'super_admin'), engagementCriteriaController.toggleCriteria.bind(engagementCriteriaController))

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
