import { IUser } from '../models/User.model'

/**
 * Get effective permissions for a user (role permissions + user overrides)
 * Modern nested permission system with module-based structure
 */
export function getEffectivePermissions(user: IUser) {
  const basePermissions = user.permissions
  const overrides = user.permissionOverrides

  if (!overrides) {
    return basePermissions
  }

  // Deep merge: overrides take precedence
  const effective: any = JSON.parse(JSON.stringify(basePermissions))

  Object.keys(overrides).forEach((module) => {
    const moduleOverrides = (overrides as any)[module]
    if (moduleOverrides && effective[module]) {
      Object.keys(moduleOverrides).forEach((key) => {
        const overrideValue = moduleOverrides[key]
        if (overrideValue !== undefined) {
          effective[module][key] = overrideValue
        }
      })
    }
  })

  return effective
}

/**
 * Check if user can create content in Hub
 */
export function canUserCreateContent(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.hub?.canCreate || false
}

/**
 * Get allowed content types for user
 */
export function getAllowedContentTypes(user: IUser): string[] {
  const permissions = getEffectivePermissions(user)
  return permissions.hub?.allowedContentTypes || []
}

/**
 * Check if user can create specific content type
 */
export function canUserCreateContentType(user: IUser, contentType: string): boolean {
  if (!canUserCreateContent(user)) {
    return false
  }

  const allowedTypes = getAllowedContentTypes(user)
  // Empty array means no restriction - user can create any type
  if (allowedTypes.length === 0) {
    return true
  }

  return allowedTypes.includes(contentType)
}

/**
 * Check if user can moderate Hub content
 * Includes both hub-specific moderation AND admin-level moderation
 */
export function canUserModerateContent(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.hub?.canModerate || permissions.admin?.canModerateAllContent || false
}

/**
 * Check if user can create Studio request
 */
export function canUserCreateStudioRequest(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.studio?.canCreateRequest || false
}

/**
 * Check if user can claim Studio request
 */
export function canUserClaimStudioRequest(user: IUser, requestType: string): boolean {
  const permissions = getEffectivePermissions(user)

  if (!permissions.studio?.canClaimRequest) {
    return false
  }

  const allowedTypes = permissions.studio?.allowedRequestTypes || []
  // Empty array means no restriction - user can claim any type
  return allowedTypes.length === 0 || allowedTypes.includes(requestType)
}

/**
 * Check if user can enroll in Academy courses
 */
export function canUserEnrollCourse(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.academy?.canEnroll || false
}

/**
 * Check if user can teach in Academy
 */
export function canUserTeachCourse(user: IUser, category?: string): boolean {
  const permissions = getEffectivePermissions(user)

  if (!permissions.academy?.canTeach) {
    return false
  }

  if (!category) {
    return true
  }

  const allowedCategories = permissions.academy?.allowedCourseCategories || []
  // Empty array means no restriction - user can teach any category
  return allowedCategories.length === 0 || allowedCategories.includes(category)
}

/**
 * Check if user can submit Alpha posts
 */
export function canUserSubmitAlpha(user: IUser, category?: string): boolean {
  const permissions = getEffectivePermissions(user)

  if (!permissions.alpha?.canSubmitAlpha) {
    return false
  }

  if (!category) {
    return true
  }

  const allowedCategories = permissions.alpha?.allowedAlphaCategories || []
  // Empty array means no restriction - user can submit any category
  return allowedCategories.length === 0 || allowedCategories.includes(category)
}

/**
 * Check if user can submit Info engagements
 */
export function canUserSubmitEngagement(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.info?.canSubmitEngagement || false
}

/**
 * Check if user has admin permissions
 */
export function isUserAdmin(user: IUser): boolean {
  const permissions = getEffectivePermissions(user)
  return permissions.admin?.canManageUsers ||
         permissions.admin?.canManageRoles ||
         permissions.admin?.canManageSiteSettings || false
}
