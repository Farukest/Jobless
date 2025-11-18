'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAdminAnalytics } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [period, setPeriod] = useState('30d')
  const [mounted, setMounted] = useState(false)

  const { data: analytics, isLoading } = useAdminAnalytics(period)

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics</h1>
              <p className="text-muted-foreground">Platform statistics and insights</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-md bg-card border border-border"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : analytics?.data ? (
            <>
              {/* User Stats */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">User Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Users" value={analytics.data.users.total} color="blue" />
                  <StatCard title="Active Users" value={analytics.data.users.active} color="green" />
                  <StatCard title="New Users" value={analytics.data.users.new} color="purple" />
                  <StatCard title="Recent Logins" value={analytics.data.users.recentLogins} color="yellow" />
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Users by Role</h2>
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.data.users.byRole).map(([role, count]: [string, any]) => (
                      <div key={role} className="text-center p-4 rounded-lg bg-muted">
                        <p className="text-3xl font-bold text-primary">{count}</p>
                        <p className="text-sm text-muted-foreground mt-1">{role.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Engagement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Content" value={analytics.data.engagement.totalContentCreated} color="blue" />
                  <StatCard title="Total Interactions" value={analytics.data.engagement.totalInteractions} color="green" />
                  <StatCard title="Avg J-Rank Points" value={analytics.data.engagement.averageJRankPoints} color="purple" />
                  <StatCard title="Avg Contribution" value={analytics.data.engagement.averageContributionScore} color="yellow" />
                </div>
              </div>

              {/* User Status */}
              <div>
                <h2 className="text-2xl font-bold mb-4">User Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-500">{analytics.data.users.active}</p>
                      <p className="text-sm text-muted-foreground mt-2">Active</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-yellow-500">{analytics.data.users.suspended}</p>
                      <p className="text-sm text-muted-foreground mt-2">Suspended</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-red-500">{analytics.data.users.banned}</p>
                      <p className="text-sm text-muted-foreground mt-2">Banned</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses] || 'text-foreground'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}
