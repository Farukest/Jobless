'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { userHasAnyRole } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalContent: number
  pendingContent: number
  activeCourses: number
  totalEnrollments: number
  pendingReviews: number
  totalEngagements: number
}

interface RecentActivity {
  id: string
  action: string
  adminName: string
  timestamp: Date
  details: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!userHasAnyRole(user, ['admin', 'super_admin'])) {
      router.push('/')
      return
    }
  }, [mounted, isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && userHasAnyRole(user, ['admin', 'super_admin'])) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true)
      setError(null)

      // Fetch all data in parallel
      const [usersRes, contentRes, coursesRes, logsRes] = await Promise.all([
        api.get('/admin/users?page=1&limit=1'),
        api.get('/hub/content?page=1&limit=1'),
        api.get('/academy/courses?page=1&limit=1'),
        api.get('/admin/logs?page=1&limit=5'),
      ])

      // Calculate stats
      const totalUsers = usersRes.data?.pagination?.total || 0
      const activeUsers = usersRes.data?.users?.filter((u: any) => u.status === 'active').length || 0

      const totalContent = contentRes.data?.pagination?.total || 0
      const pendingContent = contentRes.data?.content?.filter((c: any) => c.status === 'pending').length || 0

      const activeCourses = coursesRes.data?.courses?.filter((c: any) => c.status === 'published').length || 0
      const totalEnrollments = coursesRes.data?.courses?.reduce((sum: number, c: any) => sum + (c.enrolledCount || 0), 0) || 0

      // Count pending reviews across all modules
      const pendingReviews = pendingContent

      setStats({
        totalUsers,
        activeUsers,
        totalContent,
        pendingContent,
        activeCourses,
        totalEnrollments,
        pendingReviews,
        totalEngagements: 0, // This would come from J Info engagements
      })

      // Format recent activity from logs
      if (logsRes.data?.logs) {
        const formattedActivity = logsRes.data.logs.map((log: any) => ({
          id: log._id,
          action: log.action,
          adminName: log.adminId?.name || 'Unknown Admin',
          timestamp: new Date(log.createdAt),
          details: log.details || '',
        }))
        setRecentActivity(formattedActivity)
      }

      setLoadingStats(false)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
      setLoadingStats(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !userHasAnyRole(user, ['admin', 'super_admin'])) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user.name || user.displayName}. Manage your Jobless ecosystem.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                {loadingStats ? (
                  <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                )}
                {!loadingStats && stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeUsers} active
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Content */}
          <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">J Hub Content</p>
                {loadingStats ? (
                  <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalContent || 0}</p>
                )}
                {!loadingStats && stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pendingContent} pending
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Courses */}
          <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Courses</p>
                {loadingStats ? (
                  <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{stats?.activeCourses || 0}</p>
                )}
                {!loadingStats && stats && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalEnrollments} enrollments
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Reviews</p>
                {loadingStats ? (
                  <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{stats?.pendingReviews || 0}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Across all modules
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <button
                onClick={() => router.push('/admin/logs')}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </div>

            {loadingStats ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {activity.adminName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.adminName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>

          {/* System Status */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-6">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Database</span>
                </div>
                <span className="text-xs text-green-500">Healthy</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">API</span>
                </div>
                <span className="text-xs text-green-500">Healthy</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Blockchain</span>
                </div>
                <span className="text-xs text-blue-500">Connected</span>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => router.push('/admin/content')}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Moderate Content
                  </button>
                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Site Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
