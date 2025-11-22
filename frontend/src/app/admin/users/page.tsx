'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAllUsers, useUpdateUserRole, useUpdateUserPermissions, useUpdateUser } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'
import toast from 'react-hot-toast'
import { userHasAnyRole } from '@/lib/utils'

interface User {
  _id: string
  displayName?: string
  twitterUsername?: string
  walletAddress?: string
  roles: Array<string | { _id: string; name: string; displayName: string }>
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
    customPermissions: string[]
  }
  status: string
  jRankPoints: number
  contributionScore: number
  joinedAt: string
  lastLogin?: string
}

const AVAILABLE_ROLES = ['member', 'content_creator', 'requester', 'scout', 'mentor', 'learner', 'admin', 'super_admin']

// Role hierarchy (higher index = higher priority)
const ROLE_HIERARCHY = ['member', 'learner', 'requester', 'scout', 'content_creator', 'mentor', 'admin', 'super_admin']

// Sort roles by hierarchy (highest priority first)
const sortRolesByHierarchy = (roles: string[]): string[] => {
  return [...roles].sort((a, b) => {
    const indexA = ROLE_HIERARCHY.indexOf(a)
    const indexB = ROLE_HIERARCHY.indexOf(b)
    return indexB - indexA // Descending order (super_admin first)
  })
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Read URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const roleParam = params.get('role')
      const statusParam = params.get('status')
      const searchParam = params.get('search')

      if (roleParam) setRoleFilter(roleParam)
      if (statusParam) setStatusFilter(statusParam)
      if (searchParam) setSearch(searchParam)
    }
  }, [])

  const { data: usersData, isLoading: usersLoading, refetch } = useAllUsers(page, 20, search, statusFilter, roleFilter)
  const { mutate: updateRole } = useUpdateUserRole()
  const { mutate: updatePermissions } = useUpdateUserPermissions()
  const { mutate: updateUser } = useUpdateUser()

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!userHasAnyRole(currentUser, ['admin', 'super_admin'])) {
      router.push('/')
      return
    }
  }, [mounted, authLoading, isAuthenticated, currentUser, router])

  const handleUpdateRoles = (userId: string, newRoles: string[]) => {
    // Sort roles by hierarchy before saving
    const sortedRoles = sortRolesByHierarchy(newRoles)

    updateRole({ userId, roles: sortedRoles }, {
      onSuccess: () => {
        toast.success('Roles updated successfully')
        setShowRoleModal(false)
        refetch()
      },
      onError: () => toast.error('Failed to update roles'),
    })
  }

  const handleUpdatePermissions = (userId: string, newPermissions: any) => {
    updatePermissions({ userId, permissions: newPermissions }, {
      onSuccess: () => {
        toast.success('Permissions updated successfully')
        setShowPermissionModal(false)
        refetch()
      },
      onError: () => toast.error('Failed to update permissions'),
    })
  }

  const handleUpdateStatus = (userId: string, status: string) => {
    updateUser({ userId, status }, {
      onSuccess: () => {
        toast.success(`User ${status} successfully`)
        refetch()
      },
      onError: () => toast.error('Failed to update user status'),
    })
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userHasAnyRole(currentUser, ['admin', 'super_admin'])) {
    return null
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, username, wallet..."
                  className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {usersLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading users...</p>
              </div>
            ) : usersData?.data && usersData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">J-Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersData.data.map((user: User) => (
                      <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{user.displayName || user.twitterUsername || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.walletAddress && `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.slice(0, 2).map((role: any) => (
                              <span key={role._id || role.name} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs">
                                {role.displayName || role.name || role}
                              </span>
                            ))}
                            {user.roles && user.roles.length > 2 && (
                              <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs">
                                +{user.roles.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            user.status === 'active' ? 'bg-green-500/10 text-green-500' :
                            user.status === 'suspended' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{user.jRankPoints || 0}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowRoleModal(true)
                              }}
                              className="px-3 py-1 text-sm rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                            >
                              Roles
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowPermissionModal(true)
                              }}
                              className="px-3 py-1 text-sm rounded-md bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                            >
                              Permissions
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateStatus(user._id, 'suspended')}
                                className="px-3 py-1 text-sm rounded-md bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(user._id, 'active')}
                                className="px-3 py-1 text-sm rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {usersData && usersData.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {usersData.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(usersData.pagination.pages, p + 1))}
                disabled={page === usersData.pagination.pages}
                className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Role Modal */}
        {showRoleModal && selectedUser && (
          <RoleModal
            user={selectedUser}
            onClose={() => setShowRoleModal(false)}
            onSave={handleUpdateRoles}
          />
        )}

        {/* Permission Modal */}
        {showPermissionModal && selectedUser && (
          <PermissionModal
            user={selectedUser}
            onClose={() => setShowPermissionModal(false)}
            onSave={handleUpdatePermissions}
          />
        )}
      </div>
    </AdminLayout>
  )
}

function RoleModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (userId: string, roles: string[]) => void }) {
  // Convert role objects to role names (string array)
  const initialRoles = user.roles.map((role: any) =>
    typeof role === 'string' ? role : role.name
  )
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles)

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Manage Roles</h2>
        <p className="text-sm text-muted-foreground mb-4">
          User: {user.displayName || user.twitterUsername || 'Anonymous'}
        </p>

        {/* Info Alert */}
        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-500">
              Permissions will be automatically updated based on selected roles.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {[...AVAILABLE_ROLES].reverse().map(role => (
            <label key={role} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">{role.replace('_', ' ').toUpperCase()}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSave(user._id, selectedRoles)}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function PermissionModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (userId: string, permissions: any) => void }) {
  const [permissions, setPermissions] = useState(user.permissions)

  const togglePermission = (key: string) => {
    setPermissions({ ...permissions, [key]: !permissions[key] })
  }

  const PERMISSION_LABELS: Record<string, string> = {
    canAccessJHub: 'Access J Hub',
    canAccessJStudio: 'Access J Studio',
    canAccessJAcademy: 'Access J Academy',
    canAccessJInfo: 'Access J Info',
    canAccessJAlpha: 'Access J Alpha',
    canCreateContent: 'Create Content',
    canModerateContent: 'Moderate Content',
    canManageUsers: 'Manage Users',
    canManageRoles: 'Manage Roles',
    canManageSiteSettings: 'Manage Site Settings',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Manage Permissions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          User: {user.displayName || user.twitterUsername || 'Anonymous'}
        </p>

        <div className="space-y-2 mb-6">
          {Object.keys(PERMISSION_LABELS).map(key => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={permissions[key as keyof typeof permissions] || false}
                onChange={() => togglePermission(key)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">{PERMISSION_LABELS[key]}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSave(user._id, permissions)}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
