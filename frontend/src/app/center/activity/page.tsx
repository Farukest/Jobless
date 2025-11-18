'use client'

import { useAuth } from '@/hooks/use-auth'
import { useUserActivity } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ActivityPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>('')
  const { data: activity, isLoading } = useUserActivity(page, 20)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_created':
      case 'content_published':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'course_completed':
      case 'course_enrolled':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'alpha_submitted':
      case 'alpha_validated':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const filteredActivities = filter
    ? activity?.data.filter((item) => item.module === filter)
    : activity?.data

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Activity Feed</h1>
            <p className="text-muted-foreground">Track all your activities across the ecosystem</p>
          </div>

          {/* Filter */}
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by module:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Modules</option>
                <option value="j_hub">J Hub</option>
                <option value="j_studio">J Studio</option>
                <option value="j_academy">J Academy</option>
                <option value="j_info">J Info</option>
                <option value="j_alpha">J Alpha</option>
              </select>
            </div>
          </div>

          {/* Activity List */}
          <div className="bg-card rounded-lg border border-border">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredActivities && filteredActivities.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredActivities.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getActivityIcon(item.activityType)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary capitalize">
                            {item.module.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-foreground mb-1">{item.description}</p>
                        {item.points > 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                              />
                            </svg>
                            <span>+{item.points} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  {filter ? 'No activity found for this module' : 'No activity yet'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {activity && activity.pages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {activity.page} of {activity.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(activity.pages, p + 1))}
                  disabled={page === activity.pages}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
