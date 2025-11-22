import express from 'express'
import { protect, requireRole } from '../middleware/auth.middleware'
import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
} from '../controllers/role.controller'

const router = express.Router()

// Public routes (authenticated users can view roles)
router.get('/', protect, getAllRoles)
router.get('/:id', protect, getRoleById)
router.get('/name/:name', protect, getRoleByName)
router.post('/permissions', protect, getRolePermissions)

// Super admin only routes
router.post('/', protect, requireRole(['super_admin']), createRole)
router.put('/:id', protect, requireRole(['super_admin']), updateRole)
router.delete('/:id', protect, requireRole(['super_admin']), deleteRole)

export default router
