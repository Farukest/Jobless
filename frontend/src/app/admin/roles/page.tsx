'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAllUsers } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'
import { userHasAnyRole } from '@/lib/utils'

import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { EditRoleModal } from '@/components/admin/edit-role-modal'

export default function AdminRolesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [dbRoles, setDbRoles] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([])

  const { data: usersData } = useAllUsers(1, 1000)

  // Fetch roles from database
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles')
        setDbRoles(response.data?.data || [])
      } catch (error) {
        console.error('Failed to fetch roles:', error)
      } finally {
        setLoadingRoles(false)
      }
    }

    if (isAuthenticated) {
      fetchRoles()
    }
  }, [isAuthenticated])

  // Fetch available content types
  useEffect(() => {
    const fetchHubConfig = async () => {
      try {
        const response = await api.get('/admin/hub-config')
        const types = response.data?.data?.contentTypes || []
        setAvailableContentTypes(types)
      } catch (error) {
        console.error('Failed to fetch hub config:', error)
      }
    }

    if (isAuthenticated) {
      fetchHubConfig()
    }
  }, [isAuthenticated])

  const handleEditRole = (role: any) => {
    setSelectedRole(role)
    setShowEditModal(true)
  }

  const handleEditSuccess = async () => {
    // Refresh roles
    try {
      const response = await api.get('/roles')
      setDbRoles(response.data?.data || [])
    } catch (error) {
      console.error('Failed to refresh roles:', error)
    }
  }

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

  const roles = [
    {
      name: 'member',
      displayName: 'Member',
      description: 'Default role for all registered users. Can view content and interact with the platform.',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      capabilities: [
        'View public content',
        'Like and bookmark content',
        'Access profile settings',
        'Connect wallet',
      ],
    },
    {
      name: 'content_creator',
      displayName: 'Content Creator',
      description: 'Users who can create and publish content on J Hub.',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      capabilities: [
        'All Member permissions',
        'Create J Hub content (videos, threads, podcasts)',
        'Edit own content',
        'View content analytics',
        'Earn J-Rank points',
      ],
    },
    {
      name: 'requester',
      displayName: 'Requester',
      description: 'Users who can create production requests in J Studio.',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      capabilities: [
        'All Member permissions',
        'Create J Studio production requests',
        'Review and accept proposals',
        'Approve deliveries',
        'Rate content creators',
      ],
    },
    {
      name: 'scout',
      displayName: 'Scout',
      description: 'Trusted users who can discover and share early-stage projects.',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      capabilities: [
        'All Member permissions',
        'Submit J Alpha projects',
        'Earn scout rewards',
        'Access exclusive project info',
        'Vote on project quality',
      ],
    },
    {
      name: 'mentor',
      displayName: 'Mentor',
      description: 'Expert users who can teach and create courses.',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      capabilities: [
        'All Member permissions',
        'Create and manage J Academy courses',
        'Upload course materials',
        'Track student progress',
        'Earn from course enrollments',
      ],
    },
    {
      name: 'learner',
      displayName: 'Learner',
      description: 'Users enrolled in J Academy courses.',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      capabilities: [
        'All Member permissions',
        'Enroll in J Academy courses',
        'Track learning progress',
        'Earn completion certificates',
        'Access course materials',
      ],
    },
    {
      name: 'admin',
      displayName: 'Admin',
      description: 'Platform administrators with elevated privileges.',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      capabilities: [
        'All previous permissions',
        'Moderate content',
        'Manage users',
        'View analytics',
        'Configure site settings',
        'Access admin logs',
      ],
    },
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full platform access with all administrative capabilities.',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      capabilities: [
        'ALL PERMISSIONS',
        'Manage admin roles',
        'System configuration',
        'Database access',
        'Override all restrictions',
      ],
    },
  ]

  const getRoleUserCount = (roleName: string) => {
    if (!usersData?.data) return 0
    return usersData.data.filter((u: any) => u.roles?.some((r: any) => r.name === roleName || r === roleName)).length
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Role Management</h1>
              <p className="text-muted-foreground">Overview of user roles and their capabilities</p>
            </div>
            {userHasAnyRole(user, ['super_admin']) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Role
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => {
              const userCount = getRoleUserCount(role.name)
              const dbRole = dbRoles.find((r) => r.name === role.name)

              return (
                <div
                  key={role.name}
                  className={`bg-card rounded-lg border-2 ${role.color} p-6 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{role.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${role.color}`}>
                        {role.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {userCount} {userCount === 1 ? 'user' : 'users'}
                      </span>
                      {dbRole && userHasAnyRole(user, ['admin', 'super_admin']) && (
                        <button
                          onClick={() => handleEditRole(dbRole)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Capabilities:</h4>
                    <ul className="space-y-1">
                      {role.capabilities.map((capability, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {userCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => router.push(`/admin/users?role=${role.name}`)}
                        className="text-sm text-primary hover:underline"
                      >
                        View all {role.displayName}s →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Role Statistics */}
          <div className="mt-8 bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl font-bold mb-4">Role Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map((role) => {
                const userCount = getRoleUserCount(role.name)
                const totalUsers = usersData?.data?.length || 1
                const percentage = ((userCount / totalUsers) * 100).toFixed(1)

                return (
                  <div key={role.name} className="text-center p-4 rounded-lg bg-muted">
                    <p className={`text-3xl font-bold ${role.color}`}>{userCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{role.displayName}</p>
                    <p className="text-xs text-muted-foreground">({percentage}%)</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Role Hierarchy Info */}
          <div className="mt-8 bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl font-bold mb-4">Role Hierarchy</h2>
            <p className="text-muted-foreground mb-4">
              Roles in Jobless are cumulative - higher roles inherit permissions from lower roles.
              Users can have multiple roles simultaneously.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-gray-500/10 text-gray-500 text-sm">Member</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-sm">Creator/Requester/Scout/Mentor/Learner</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-sm">Admin</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 text-sm">Super Admin</span>
            </div>
          </div>

          {/* Create Role Modal */}
          {showCreateModal && (
            <CreateRoleModal
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false)
                // Refresh roles
                api.get('/roles').then(res => setDbRoles(res.data?.data || []))
              }}
            />
          )}

          {/* Edit Role Modal */}
          <EditRoleModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedRole(null)
            }}
            onSuccess={handleEditSuccess}
            role={selectedRole}
            availableContentTypes={availableContentTypes}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

// Create Role Modal Component
function CreateRoleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {
      canAccessJHub: true,
      canAccessJStudio: true,
      canAccessJAcademy: true,
      canAccessJInfo: true,
      canAccessJAlpha: true,
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const PERMISSION_GROUPS = {
    'Platform Access': [
      { key: 'canAccessJHub', label: 'Access J Hub' },
      { key: 'canAccessJStudio', label: 'Access J Studio' },
      { key: 'canAccessJAcademy', label: 'Access J Academy' },
      { key: 'canAccessJInfo', label: 'Access J Info' },
      { key: 'canAccessJAlpha', label: 'Access J Alpha' },
    ],
    'Content Permissions': [
      { key: 'canCreateContent', label: 'Create Content' },
      { key: 'canModerateContent', label: 'Moderate Content' },
    ],
    'Academy Permissions': [
      { key: 'canEnrollCourses', label: 'Enroll in Courses' },
      { key: 'canTeachCourses', label: 'Teach Courses' },
    ],
    'Studio Permissions': [
      { key: 'canCreateRequests', label: 'Create Production Requests' },
      { key: 'canSubmitProposals', label: 'Submit Proposals' },
    ],
    'Alpha Permissions': [
      { key: 'canSubmitProjects', label: 'Submit Alpha Projects' },
    ],
    'Admin Permissions': [
      { key: 'canManageUsers', label: 'Manage Users' },
      { key: 'canManageRoles', label: 'Manage Roles' },
      { key: 'canManageSiteSettings', label: 'Manage Site Settings' },
    ],
  }

  const togglePermission = (key: string) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key as keyof typeof formData.permissions]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.displayName) {
      toast.error('Name and display name are required')
      return
    }

    try {
      setIsSubmitting(true)
      await api.post('/roles', formData)
      toast.success('Role created successfully')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create role')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg border border-border p-6 max-w-2xl w-full mx-4 my-8">
        <h2 className="text-2xl font-bold mb-4">Create New Role</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Role Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="e.g. custom_role"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase, use underscore for spaces
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g. Custom Role"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this role's purpose..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background min-h-[100px]"
            />
          </div>

          {/* Permissions Section */}
          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-semibold mb-3">Permissions</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                <div key={groupName} className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2 text-primary">{groupName}</h4>
                  <div className="space-y-2">
                    {permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/80 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions[perm.key as keyof typeof formData.permissions]}
                          onChange={() => togglePermission(perm.key)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
