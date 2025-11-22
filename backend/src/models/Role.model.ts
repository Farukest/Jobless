import mongoose, { Document, Schema } from 'mongoose'

export interface IRole extends Document {
  name: string
  displayName: string
  description?: string
  permissions: {
    canAccessJHub: boolean
    canAccessJStudio: boolean
    canAccessJAcademy: boolean
    canAccessJInfo: boolean
    canAccessJAlpha: boolean
    canCreateContent: boolean
    canModerateContent: boolean
    canManageUsers: boolean
    canManageRoles: boolean
    canManageSiteSettings: boolean
    canEnrollCourses: boolean
    canTeachCourses: boolean
    canCreateRequests: boolean
    canSubmitProposals: boolean
    canSubmitProjects: boolean
  }
  allowedContentTypes: string[] // Content types this role can create (e.g., ['Video', 'Thread', 'Guide'])
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
      canAccessJHub: { type: Boolean, default: true },
      canAccessJStudio: { type: Boolean, default: true },
      canAccessJAcademy: { type: Boolean, default: true },
      canAccessJInfo: { type: Boolean, default: true },
      canAccessJAlpha: { type: Boolean, default: true },
      canCreateContent: { type: Boolean, default: false },
      canModerateContent: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageRoles: { type: Boolean, default: false },
      canManageSiteSettings: { type: Boolean, default: false },
      canEnrollCourses: { type: Boolean, default: false },
      canTeachCourses: { type: Boolean, default: false },
      canCreateRequests: { type: Boolean, default: false },
      canSubmitProposals: { type: Boolean, default: false },
      canSubmitProjects: { type: Boolean, default: false },
    },
    allowedContentTypes: {
      type: [String],
      default: [], // Empty means no content creation allowed
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
