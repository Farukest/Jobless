'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { userHasAnyRole } from '@/lib/utils'

export default function AdminPermissionsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [selectedRole, setSelectedRole] = useState('member')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!userHasAnyRole(user, ['admin', 'super_admin'])) {
      router.push('/')
      return
    }
  }, [mounted, authLoading, isAuthenticated, user, router])

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !userHasAnyRole(user, ['admin', 'super_admin'])) {
    return null
  }

  // Modern nested permission structure
  const permissions = [
    {
      category: 'J Hub Permissions',
      color: 'bg-blue-500',
      items: [
        { key: 'hub.canAccess', name: 'Access J Hub', description: 'View and interact with J Hub content' },
        { key: 'hub.canCreate', name: 'Create Content', description: 'Create videos, threads, podcasts, guides, tutorials' },
        { key: 'hub.canModerate', name: 'Moderate Content', description: 'Delete, archive, or feature content' },
      ],
    },
    {
      category: 'J Studio Permissions',
      color: 'bg-purple-500',
      items: [
        { key: 'studio.canAccess', name: 'Access J Studio', description: 'View production requests and proposals' },
        { key: 'studio.canCreateRequest', name: 'Create Requests', description: 'Post new production requests' },
        { key: 'studio.canClaimRequest', name: 'Claim Requests', description: 'Respond to and claim production requests' },
      ],
    },
    {
      category: 'J Academy Permissions',
      color: 'bg-yellow-500',
      items: [
        { key: 'academy.canAccess', name: 'Access J Academy', description: 'View available courses' },
        { key: 'academy.canEnroll', name: 'Enroll in Courses', description: 'Join and complete courses' },
        { key: 'academy.canTeach', name: 'Teach Courses', description: 'Create and manage courses' },
        { key: 'academy.canCreateCourseRequest', name: 'Create Course Requests', description: 'Request new courses to be created' },
      ],
    },
    {
      category: 'J Alpha Permissions',
      color: 'bg-green-500',
      items: [
        { key: 'alpha.canAccess', name: 'Access J Alpha', description: 'View early project discoveries' },
        { key: 'alpha.canSubmitAlpha', name: 'Submit Alpha Posts', description: 'Scout and share new projects' },
        { key: 'alpha.canModerate', name: 'Moderate Alpha', description: 'Review and moderate alpha posts' },
      ],
    },
    {
      category: 'J Info Permissions',
      color: 'bg-indigo-500',
      items: [
        { key: 'info.canAccess', name: 'Access J Info', description: 'Request social engagement support' },
        { key: 'info.canSubmitEngagement', name: 'Submit Engagements', description: 'Submit social media engagement posts' },
      ],
    },
    {
      category: 'Admin Permissions',
      color: 'bg-red-500',
      items: [
        { key: 'admin.canManageUsers', name: 'Manage Users', description: 'Edit user roles and permissions' },
        { key: 'admin.canManageRoles', name: 'Manage Roles', description: 'Create and edit roles' },
        { key: 'admin.canManageSiteSettings', name: 'Configure Settings', description: 'Modify site-wide settings' },
        { key: 'admin.canModerateAllContent', name: 'Moderate All Content', description: 'Moderate content across all modules' },
      ],
    },
  ]

  const defaultPermissionsByRole: Record<string, string[]> = {
    member: [
      'hub.canAccess',
      'studio.canAccess',
      'academy.canAccess',
      'alpha.canAccess',
      'info.canAccess',
    ],
    content_creator: [
      'hub.canAccess',
      'hub.canCreate',
      'studio.canAccess',
      'academy.canAccess',
      'alpha.canAccess',
      'info.canAccess',
    ],
    designer: [
      'hub.canAccess',
      'studio.canAccess',
      'studio.canClaimRequest', // Can claim design requests
      'academy.canAccess',
      'alpha.canAccess',
      'info.canAccess',
    ],
    video_editor: [
      'hub.canAccess',
      'studio.canAccess',
      'studio.canClaimRequest', // Can claim video requests
      'academy.canAccess',
      'alpha.canAccess',
      'info.canAccess',
    ],
    requester: [
      'hub.canAccess',
      'studio.canAccess',
      'studio.canCreateRequest',
      'academy.canAccess',
      'academy.canCreateCourseRequest',
      'alpha.canAccess',
      'info.canAccess',
    ],
    scout: [
      'hub.canAccess',
      'studio.canAccess',
      'academy.canAccess',
      'alpha.canAccess',
      'alpha.canSubmitAlpha',
      'info.canAccess',
    ],
    mentor: [
      'hub.canAccess',
      'studio.canAccess',
      'academy.canAccess',
      'academy.canTeach',
      'alpha.canAccess',
      'info.canAccess',
    ],
    learner: [
      'hub.canAccess',
      'studio.canAccess',
      'academy.canAccess',
      'academy.canEnroll',
      'alpha.canAccess',
      'info.canAccess',
    ],
    admin: [
      'hub.canAccess',
      'hub.canCreate',
      'hub.canModerate',
      'studio.canAccess',
      'studio.canCreateRequest',
      'studio.canClaimRequest',
      'academy.canAccess',
      'academy.canEnroll',
      'academy.canTeach',
      'academy.canCreateCourseRequest',
      'alpha.canAccess',
      'alpha.canSubmitAlpha',
      'alpha.canModerate',
      'info.canAccess',
      'info.canSubmitEngagement',
      'admin.canManageUsers',
      'admin.canManageRoles',
      'admin.canModerateAllContent',
    ],
    super_admin: ['ALL'],
  }

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'content_creator', label: 'Content Creator' },
    { value: 'designer', label: 'Designer' },
    { value: 'video_editor', label: 'Video Editor' },
    { value: 'requester', label: 'Requester' },
    { value: 'scout', label: 'Scout' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'learner', label: 'Learner' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ]

  const hasPermission = (permissionKey: string) => {
    const rolePermissions = defaultPermissionsByRole[selectedRole]
    if (rolePermissions?.includes('ALL')) return true
    return rolePermissions?.includes(permissionKey) ?? false
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Permission Management</h1>
            <p className="text-muted-foreground">Modern module-based permission system - Overview of permissions for each role</p>
          </div>

          {/* Role Selector */}
          <div className="mb-8 bg-card rounded-lg border border-border p-6">
            <label className="block text-sm font-medium mb-3">Select Role to View Permissions:</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {roles.map((role) => (
                <div key={role.value} className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedRole(role.value)}
                    className={`px-4 py-3 rounded-md border-2 transition-colors ${
                      selectedRole === role.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:border-primary'
                    }`}
                  >
                    {role.label}
                  </button>
                  <a
                    href={`/admin/users?role=${role.value}`}
                    className="text-xs text-center text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Members
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Matrix */}
          {selectedRole === 'super_admin' ? (
            <div className="bg-card rounded-lg border-2 border-red-500/20 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Super Admin</h2>
              <p className="text-lg text-muted-foreground">
                This role has <span className="text-red-500 font-bold">ALL PERMISSIONS</span> across the entire platform.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Super admins have unrestricted access to all features, settings, and data.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {permissions.map((category) => (
                <div key={category.category} className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className={`${category.color} bg-opacity-10 px-6 py-3 border-b border-border`}>
                    <h2 className="text-xl font-bold">{category.category}</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.items.map((permission) => {
                        const isEnabled = hasPermission(permission.key)

                        return (
                          <div
                            key={permission.key}
                            className={`p-4 rounded-lg border-2 ${
                              isEnabled
                                ? 'bg-green-500/5 border-green-500/20'
                                : 'bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{permission.name}</h3>
                                <p className="text-sm text-muted-foreground">{permission.description}</p>
                                <p className="text-xs text-muted-foreground mt-2 font-mono">{permission.key}</p>
                              </div>
                              <div>
                                {isEnabled ? (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Permission Summary */}
          <div className="mt-8 bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl font-bold mb-4">Permission Summary for {roles.find(r => r.value === selectedRole)?.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-green-500">
                  {selectedRole === 'super_admin' ? 'ALL' : defaultPermissionsByRole[selectedRole]?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Active Permissions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-blue-500">
                  {permissions.reduce((acc, cat) => acc + cat.items.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Permissions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-purple-500">
                  {selectedRole === 'super_admin' ? '100' : (
                    ((defaultPermissionsByRole[selectedRole]?.length || 0) /
                    permissions.reduce((acc, cat) => acc + cat.items.length, 0) * 100).toFixed(0)
                  )}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Coverage</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-500/10 border-2 border-blue-500/20 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold mb-2">About Modern Permission System</h3>
                <p className="text-sm text-muted-foreground">
                  This platform uses a modern module-based permission system. Permissions are organized by module (hub, studio, academy, info, alpha, admin) for better scalability and maintainability.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Each role has a default set of permissions. Individual users can have permission overrides applied through the <a href="/admin/users" className="text-primary hover:underline">User Management</a> page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
