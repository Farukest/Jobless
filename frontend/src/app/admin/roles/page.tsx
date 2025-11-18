'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAllUsers } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'

export default function AdminRolesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const { data: usersData } = useAllUsers(1, 1000)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!user?.roles?.includes('admin') && !user?.roles?.includes('super_admin')))) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, user, router])

  if (!mounted || authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
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
    return usersData.data.filter((u: any) => u.roles?.includes(roleName)).length
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Role Management</h1>
            <p className="text-muted-foreground">Overview of user roles and their capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => {
              const userCount = getRoleUserCount(role.name)

              return (
                <div
                  key={role.name}
                  className={`bg-card rounded-lg border-2 ${role.color} p-6 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{role.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        {role.name}
                      </span>
                      <span className="text-sm text-muted-foreground mt-2">
                        {userCount} {userCount === 1 ? 'user' : 'users'}
                      </span>
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
              <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 text-sm">Member</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">Creator/Requester/Scout/Mentor/Learner</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm">Admin</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm">Super Admin</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
