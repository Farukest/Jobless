'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useMyEngagements } from '@/hooks/use-engagements'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ExternalLink,
  Twitter,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Award
} from 'lucide-react'

export default function MyEngagementsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: engagementsData, isLoading: engagementsLoading } = useMyEngagements()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (!mounted || authLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Skeleton className="h-10 w-64 mb-8" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const engagements = engagementsData?.data || []
  const totalPointsEarned = engagementsData?.totalPointsEarned || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'completed':
        return 'bg-blue-500/10 text-blue-500'
      case 'expired':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'expired':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />
      case 'farcaster':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  // Calculate stats
  const activeEngagements = engagements.filter((e) => e.post.status === 'active').length
  const completedEngagements = engagements.filter((e) => e.post.status === 'completed').length
  const verifiedEngagements = engagements.filter((e) => e.post.isVerified).length

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">My Engagements</h1>
              <p className="text-muted-foreground">Track your engagement activities and points earned</p>
            </div>
            <Link
              href="/info/submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Submit New Post
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Engagements</p>
              <p className="text-2xl font-bold">{engagements.length}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-2xl font-bold text-green-500">{activeEngagements}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-blue-500">{completedEngagements}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Points</p>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <p className="text-2xl font-bold text-yellow-500">{totalPointsEarned}</p>
              </div>
            </div>
          </div>

          {/* Engagements List */}
          {engagementsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : engagements.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No engagements yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start engaging with community posts to earn points and build your reputation.
                </p>
                <Link
                  href="/info"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Browse Engagement Posts
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {engagements.map((engagement) => (
                <div
                  key={engagement.post._id}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{engagement.post.campaignName}</h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(engagement.post.status)}`}>
                          {getStatusIcon(engagement.post.status)}
                          <span>{engagement.post.status.toUpperCase()}</span>
                        </div>
                        {engagement.post.isVerified && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          {getPlatformIcon(engagement.post.platform)}
                          <span className="capitalize">{engagement.post.platform}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{engagement.post.engagementType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-yellow-500">
                          +{engagement.engagement?.pointsEarned || 0} points
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {engagement.engagement?.engagedAt
                            ? new Date(engagement.engagement.engagedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {engagement.engagement?.proofUrl && (
                        <a
                          href={engagement.engagement.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Proof
                        </a>
                      )}
                      <a
                        href={engagement.post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Post
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
