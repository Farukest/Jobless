'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useAdminLogs } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'
import { userHasAnyRole } from '@/lib/utils'

export default function AdminLogsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [actionFilter, setActionFilter] = useState('all')

  const { data: logsData, isLoading } = useAdminLogs(page, 50)

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

  const filteredLogs = logsData?.data?.filter((log: any) => {
    if (actionFilter === 'all') return true
    return log.action === actionFilter
  }) || []

  const actionTypes = ['all', 'user_update', 'role_change', 'permission_change', 'content_delete', 'content_feature', 'settings_update']

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'user_update':
        return 'bg-blue-500/10 text-blue-500'
      case 'role_change':
        return 'bg-purple-500/10 text-purple-500'
      case 'permission_change':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'content_delete':
        return 'bg-red-500/10 text-red-500'
      case 'content_feature':
        return 'bg-green-500/10 text-green-500'
      case 'settings_update':
        return 'bg-orange-500/10 text-orange-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Logs</h1>
            <p className="text-muted-foreground">View all administrative actions and changes</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-md bg-card border border-border"
            >
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {log.timestamp || log.createdAt ? formatDate(log.timestamp || log.createdAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">
                                {log.adminId?.displayName || log.adminId?.twitterUsername || 'System'}
                              </p>
                              {log.adminId?.walletAddress && (
                                <p className="text-xs text-muted-foreground">
                                  {log.adminId.walletAddress.slice(0, 6)}...{log.adminId.walletAddress.slice(-4)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs ${getActionBadgeColor(log.action)}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.targetType && (
                            <div>
                              <p className="font-medium">{log.targetType}</p>
                              {log.targetId && (
                                <p className="text-xs text-muted-foreground">
                                  {typeof log.targetId === 'string' ? log.targetId.slice(0, 8) : log.targetId}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.changes && typeof log.changes === 'object' ? (
                            <div className="max-w-md">
                              <details className="cursor-pointer">
                                <summary className="text-primary hover:underline">View Changes</summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ) : log.description ? (
                            <p className="text-muted-foreground">{log.description}</p>
                          ) : (
                            <p className="text-muted-foreground italic">No details</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No logs found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {logsData && logsData.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-md bg-card border border-border hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">Page {page} of {logsData.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(logsData.pages, p + 1))}
                disabled={page === logsData.pages}
                className="px-4 py-2 rounded-md bg-card border border-border hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
