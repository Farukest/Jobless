'use client'

import { useAuth } from '@/hooks/use-auth'
import { useUserStats } from '@/hooks/use-user'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function StatsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: stats, isLoading: statsLoading } = useUserStats()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || statsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const moduleStats = [
    {
      module: 'J Hub',
      stats: [
        { label: 'Contents Created', value: stats?.jHub.contentsCreated || 0, color: 'text-blue-500' },
        { label: 'Contents Viewed', value: stats?.jHub.contentsViewed || 0, color: 'text-blue-400' },
      ],
    },
    {
      module: 'J Studio',
      stats: [
        { label: 'Requests Submitted', value: stats?.jStudio.requestsSubmitted || 0, color: 'text-purple-500' },
        { label: 'Requests Completed', value: stats?.jStudio.requestsCompleted || 0, color: 'text-purple-400' },
        { label: 'Tasks Completed', value: stats?.jStudio.tasksCompleted || 0, color: 'text-purple-300' },
      ],
    },
    {
      module: 'J Academy',
      stats: [
        { label: 'Courses Created', value: stats?.jAcademy.coursesCreated || 0, color: 'text-green-500' },
        { label: 'Courses Completed', value: stats?.jAcademy.coursesCompleted || 0, color: 'text-green-400' },
        { label: 'Courses Requested', value: stats?.jAcademy.coursesRequested || 0, color: 'text-green-300' },
      ],
    },
    {
      module: 'J Info',
      stats: [
        { label: 'Tweets Submitted', value: stats?.jInfo.tweetsSubmitted || 0, color: 'text-pink-500' },
        { label: 'Engagements Given', value: stats?.jInfo.engagementsGiven || 0, color: 'text-pink-400' },
        { label: 'Engagements Received', value: stats?.jInfo.engagementsReceived || 0, color: 'text-pink-300' },
      ],
    },
    {
      module: 'J Alpha',
      stats: [
        { label: 'Alphas Submitted', value: stats?.jAlpha.alphasSubmitted || 0, color: 'text-orange-500' },
        { label: 'Alphas Validated', value: stats?.jAlpha.alphasValidated || 0, color: 'text-orange-400' },
        { label: 'Votes Given', value: stats?.jAlpha.votesGiven || 0, color: 'text-orange-300' },
      ],
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Your Statistics</h1>
            <p className="text-muted-foreground">Detailed breakdown of your activity across all modules</p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-border p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total J-Rank Points</p>
                  <p className="text-5xl font-bold">{stats?.overall.jRankPoints || 0}</p>
                </div>
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-border p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contribution Score</p>
                  <p className="text-5xl font-bold">{stats?.overall.contributionScore || 0}</p>
                </div>
                <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Module Statistics */}
          {moduleStats.map((moduleData) => (
            <div key={moduleData.module} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{moduleData.module}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {moduleData.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
