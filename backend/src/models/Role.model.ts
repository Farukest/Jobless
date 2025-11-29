import mongoose, { Document, Schema } from 'mongoose'

export interface IRole extends Document {
  name: string
  displayName: string
  description?: string
  permissions: {
    // J Hub Permissions
    hub: {
      canAccess: boolean
      canCreate: boolean
      canModerate: boolean
      allowedContentTypes: string[]
    }
    // J Studio Permissions
    studio: {
      canAccess: boolean
      canCreateRequest: boolean
      canClaimRequest: boolean
      allowedRequestTypes: string[]
    }
    // J Academy Permissions
    academy: {
      canAccess: boolean
      canEnroll: boolean
      canTeach: boolean
      canCreateCourseRequest: boolean
      allowedCourseCategories: string[]
    }
    // J Info Permissions
    info: {
      canAccess: boolean
      canSubmitEngagement: boolean
      allowedPlatforms: string[]
      allowedEngagementTypes: string[]
    }
    // J Alpha Permissions
    alpha: {
      canAccess: boolean
      canSubmitAlpha: boolean
      canModerate: boolean
      allowedAlphaCategories: string[]
    }
    // Admin Permissions
    admin: {
      canManageUsers: boolean
      canManageRoles: boolean
      canManageSiteSettings: boolean
      canModerateAllContent: boolean
    }
  }
  isSystemRole: boolean
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      hub: {
        canAccess: { type: Boolean, default: true },
        canCreate: { type: Boolean, default: false },
        canModerate: { type: Boolean, default: false },
        allowedContentTypes: { type: [String], default: [] },
      },
      studio: {
        canAccess: { type: Boolean, default: true },
        canCreateRequest: { type: Boolean, default: false },
        canClaimRequest: { type: Boolean, default: false },
        allowedRequestTypes: { type: [String], default: [] },
      },
      academy: {
        canAccess: { type: Boolean, default: true },
        canEnroll: { type: Boolean, default: false },
        canTeach: { type: Boolean, default: false },
        canCreateCourseRequest: { type: Boolean, default: false },
        allowedCourseCategories: { type: [String], default: [] },
      },
      info: {
        canAccess: { type: Boolean, default: true },
        canSubmitEngagement: { type: Boolean, default: false },
        allowedPlatforms: { type: [String], default: [] },
        allowedEngagementTypes: { type: [String], default: [] },
      },
      alpha: {
        canAccess: { type: Boolean, default: true },
        canSubmitAlpha: { type: Boolean, default: false },
        canModerate: { type: Boolean, default: false },
        allowedAlphaCategories: { type: [String], default: [] },
      },
      admin: {
        canManageUsers: { type: Boolean, default: false },
        canManageRoles: { type: Boolean, default: false },
        canManageSiteSettings: { type: Boolean, default: false },
        canModerateAllContent: { type: Boolean, default: false },
      },
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
RoleSchema.index({ name: 1 })
RoleSchema.index({ status: 1 })

// Prevent deletion of system roles
RoleSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.isSystemRole) {
    return next(new Error('Cannot delete system roles'))
  }
  next()
})

// Prevent name change of system roles
RoleSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.isNew && this.isSystemRole) {
    return next(new Error('Cannot change name of system roles'))
  }
  next()
})

export const Role = mongoose.model<IRole>('Role', RoleSchema)
