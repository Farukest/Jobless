import { IUser } from '../models/User.model'
import { IRole } from '../models/Role.model'
import { Role } from '../models/Role.model'

/**
 * Get allowed content types for a user
 * Priority: User's contentTypeOverrides > Role's allowedContentTypes
 */
export async function getUserAllowedContentTypes(user: IUser): Promise<string[]> {
  // If user has specific content type overrides, use those
  if (user.contentTypeOverrides && user.contentTypeOverrides.length > 0) {
    return user.contentTypeOverrides
  }

  // Otherwise, collect from all user's roles
  const allTypes = new Set<string>()

  // Populate roles if not already populated
  const populatedRoles = await Role.find({ _id: { $in: user.roles } })

  populatedRoles.forEach(role => {
    if (role.allowedContentTypes && role.allowedContentTypes.length > 0) {
      role.allowedContentTypes.forEach(type => allTypes.add(type))
    }
  })

  return Array.from(allTypes)
}

/**
 * Check if user can create a specific content type
 */
export async function canUserCreateContentType(
  user: IUser,
  contentType: string
): Promise<boolean> {
  const allowedTypes = await getUserAllowedContentTypes(user)
  return allowedTypes.includes(contentType)
}
