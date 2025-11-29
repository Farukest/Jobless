import { Response } from 'express'
import { Role } from '../models/Role.model'
import { asyncHandler, AppError } from '../middleware/error-handler'
import { AuthRequest } from '../middleware/auth.middleware'
import mongoose from 'mongoose'

// Get all roles
export const getAllRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, includeInactive } = req.query

  const query: any = {}

  if (status) {
    query.status = status
  } else if (!includeInactive) {
    query.status = 'active'
  }

  const roles = await Role.find(query).sort({ isSystemRole: -1, name: 1 })

  res.status(200).json({
    success: true,
    data: roles,
  })
})

// Get single role
export const getRoleById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid role ID', 400)
  }

  const role = await Role.findById(id)

  if (!role) {
    throw new AppError('Role not found', 404)
  }

  res.status(200).json({
    success: true,
    data: role,
  })
})

// Get role by name
export const getRoleByName = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name } = req.params

  const role = await Role.findOne({ name: name.toLowerCase() })

  if (!role) {
    throw new AppError('Role not found', 404)
  }

  res.status(200).json({
    success: true,
    data: role,
  })
})

// Create new role
export const createRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, displayName, description, permissions } = req.body

  // Validate required fields
  if (!name || !displayName) {
    throw new AppError('Name and display name are required', 400)
  }

  // Check if role already exists
  const existingRole = await Role.findOne({ name: name.toLowerCase() })
  if (existingRole) {
    throw new AppError('Role with this name already exists', 400)
  }

  // Create role
  const role = await Role.create({
    name: name.toLowerCase(),
    displayName,
    description,
    permissions: permissions || {},
    isSystemRole: false,
    status: 'active',
  })

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role,
  })
})

// Update role
export const updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { displayName, description, permissions, status } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid role ID', 400)
  }

  const role = await Role.findById(id)

  if (!role) {
    throw new AppError('Role not found', 404)
  }

  // Update fields
  if (displayName) role.displayName = displayName
  if (description !== undefined) role.description = description
  if (permissions) role.permissions = { ...role.permissions, ...permissions }
  if (status) role.status = status

  await role.save()

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: role,
  })
})

// Delete role
export const deleteRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid role ID', 400)
  }

  const role = await Role.findById(id)

  if (!role) {
    throw new AppError('Role not found', 404)
  }

  if (role.isSystemRole) {
    throw new AppError('Cannot delete system roles', 403)
  }

  // Check if any users have this role
  const User = mongoose.model('User')
  const usersWithRole = await User.countDocuments({ roles: role._id })

  if (usersWithRole > 0) {
    throw new AppError(`Cannot delete role. ${usersWithRole} user(s) still have this role`, 400)
  }

  await role.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully',
  })
})

// Get role permissions (helper for frontend)
export const getRolePermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roleIds } = req.body

  if (!roleIds || !Array.isArray(roleIds)) {
    throw new AppError('roleIds must be an array', 400)
  }

  const roles = await Role.find({ _id: { $in: roleIds }, status: 'active' })

  // Merge permissions from all roles
  const mergedPermissions: any = {
    canAccessJHub: false,
    canAccessJStudio: false,
    canAccessJAcademy: false,
    canAccessJInfo: false,
    canAccessJAlpha: false,
    canCreateContent: false,
    canModerateContent: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageSiteSettings: false,
    canEnrollCourses: false,
    canTeachCourses: false,
    canCreateRequests: false,
    canSubmitProposals: false,
    canSubmitProjects: false,
  }

  roles.forEach((role) => {
    const permissionsObj = role.permissions as any
    Object.keys(permissionsObj).forEach((key) => {
      if (permissionsObj[key]) {
        mergedPermissions[key] = true
      }
    })
  })

  res.status(200).json({
    success: true,
    data: mergedPermissions,
  })
})
