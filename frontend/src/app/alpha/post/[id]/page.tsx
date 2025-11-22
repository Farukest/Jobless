'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Scout {
  _id: string
  displayName?: string
  twitterUsername?: string
  profileImage?: string
  alphaReputation?: number
  successRate?: number
  totalAlphas?: number
  verifiedAlphas?: number
}

interface AlphaPost {
  _id: string
  scoutId: Scout
  title: string
  description: string
  alphaType: 'airdrop' | 'testnet' | 'memecoin' | 'defi' | 'nft' | 'other'
  potentialRating: 1 | 2 | 3 | 4
  riskRating: 'low' | 'medium' | 'high'
  requirements: string[]
  sourceUrl?: string
  twitterUrl?: string
  discordUrl?: string
  expectedReward?: string
  deadline?: string
  status: 'active' | 'expired' | 'verified'
  isVerified: boolean
  outcome?: {
    success: boolean
    actualResults?: string
    proofLinks?: string[]
    verifiedAt?: string
  }
  viewsCount: number
  likesCount: number
  isLiked?: boolean
  votes: {
    bullish: number
    bearish: number
  }
  userVote?: 'bullish' | 'bearish' | null
  isBookmarked?: boolean
  createdAt: string
  updatedAt: string
}

function useAlphaPost(id: string) {
  return useQuery<{ data: AlphaPost }>({
    queryKey: ['alpha', 'post', id],
    queryFn: async () => {
      const { data } = await api.get(`/alpha/posts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

function useVoteOnAlpha(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ voteType }: { voteType: 'bullish' | 'bearish' | null }) => {
      const { data } = await api.post(`/alpha/posts/${postId}/vote`, { voteType })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'post', postId] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'posts'] })
    },
  })
}

function useToggleBookmark(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/alpha/posts/${postId}/bookmark`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'post', postId] })
    },
  })
}

function useMarkAsVerified(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (outcomeData: {
      success: boolean
      actualResults?: string
      proofLinks?: string[]
    }) => {
      const { data } = await api.post(`/alpha/posts/${postId}/verify`, outcomeData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'post', postId] })
      toast.success('Alpha marked as verified')
    },
    onError: () => {
      toast.error('Failed to verify alpha')
    },
  })
}

function useRelatedAlphas(postId: string, alphaType: string) {
  return useQuery<{ data: AlphaPost[] }>({
    queryKey: ['alpha', 'related', postId],
    queryFn: async () => {
      const { data } = await api.get(`/alpha/posts?type=${alphaType}&limit=3&exclude=${postId}`)
      return data
    },
    enabled: !!postId && !!alphaType,
  })
}

export default function AlphaPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: postData, isLoading: postLoading, error } = useAlphaPost(id)
  const voteMutation = useVoteOnAlpha(id)
  const bookmarkMutation = useToggleBookmark(id)
  const verifyMutation = useMarkAsVerified(id)

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const post = postData?.data

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Deadline countdown
  useEffect(() => {
    if (!post?.deadline) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const deadline = new Date(post.deadline!).getTime()
      const distance = deadline - now

      if (distance < 0) {
        setTimeRemaining('Expired')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [post?.deadline])

  const handleVote = (voteType: 'bullish' | 'bearish') => {
    if (post?.status !== 'active') {
      toast.error('Voting is only available for active alphas')
      return
    }

    // Toggle vote if clicking same button
    const newVote = post?.userVote === voteType ? null : voteType
    voteMutation.mutate({ voteType: newVote })
  }

  const handleBookmark = () => {
    bookmarkMutation.mutate()
  }

  const handleShare = (platform: 'twitter' | 'copy') => {
    const url = window.location.href

    if (platform === 'twitter') {
      const text = `Check out this alpha: ${post?.title}`
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  if (authLoading || postLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full mb-6" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div>
                <Skeleton className="h-32 w-full mb-6" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error || !post) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">404</div>
            <h1 className="text-2xl font-bold mb-2">Alpha Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The alpha you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/alpha')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Alpha
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const isAuthor = user?._id === post.scoutId._id
  const totalVotes = post.votes.bullish + post.votes.bearish
  const bullishPercentage = totalVotes > 0 ? Math.round((post.votes.bullish / totalVotes) * 100) : 0
  const bearishPercentage = totalVotes > 0 ? Math.round((post.votes.bearish / totalVotes) * 100) : 0

  const getPotentialRatingColor = (rating: number) => {
    switch (rating) {
      case 4: return 'bg-green-500'
      case 3: return 'bg-blue-500'
      case 2: return 'bg-yellow-500'
      case 1: return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 text-green-500'
      case 'medium': return 'bg-yellow-500/10 text-yellow-500'
      case 'high': return 'bg-red-500/10 text-red-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusBadge = () => {
    switch (post.status) {
      case 'active':
        return <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">Active</span>
      case 'expired':
        return <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 text-sm font-medium">Expired</span>
      case 'verified':
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">Verified</span>
      default:
        return null
    }
  }

  const getAlphaTypeIcon = (type: string) => {
    switch (type) {
      case 'airdrop':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        )
      case 'testnet':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'memecoin':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'defi':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Hero Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => router.push('/alpha')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-muted-foreground text-sm">Back to Alpha</span>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusBadge()}
                  <span className="px-3 py-1 rounded-full bg-card border border-border text-sm font-medium capitalize">
                    {post.alphaType}
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
                <p className="text-lg text-muted-foreground">{post.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleBookmark}
                  className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                  title="Bookmark"
                >
                  <svg
                    className={`w-5 h-5 ${post.isBookmarked ? 'fill-current text-yellow-500' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                  title="Share on Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                  title="Copy link"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{post.viewsCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Posted {formatRelativeTime(post.createdAt)}</span>
              </div>
              {post.deadline && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className={timeRemaining === 'Expired' ? 'text-red-500 font-medium' : 'font-medium'}>
                    {timeRemaining || 'Calculating...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PROMINENT Voting Section */}
          <div className="bg-gradient-to-r from-green-500/10 to-red-500/10 rounded-xl p-6 mb-8 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Community Sentiment</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleVote('bullish')}
                disabled={post.status !== 'active' || voteMutation.isPending}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${post.userVote === 'bullish'
                    ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-card border-border hover:border-green-500/50'
                  }
                  ${post.status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-2xl font-bold text-green-500">{post.votes.bullish}</span>
                  <span className="text-sm font-medium">Bullish</span>
                  <span className="text-xs text-muted-foreground">{bullishPercentage}%</span>
                </div>
              </button>

              <button
                onClick={() => handleVote('bearish')}
                disabled={post.status !== 'active' || voteMutation.isPending}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${post.userVote === 'bearish'
                    ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20'
                    : 'bg-card border-border hover:border-red-500/50'
                  }
                  ${post.status !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span className="text-2xl font-bold text-red-500">{post.votes.bearish}</span>
                  <span className="text-sm font-medium">Bearish</span>
                  <span className="text-xs text-muted-foreground">{bearishPercentage}%</span>
                </div>
              </button>
            </div>

            {/* Vote progress bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${bullishPercentage}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${bearishPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{totalVotes} total votes</span>
              {post.userVote && (
                <span className="font-medium">
                  You voted {post.userVote}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Scout Info */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-4">Scout Information</h3>
                <div className="flex items-start gap-4">
                  <img
                    src={post.scoutId.profileImage || '/default-avatar.png'}
                    alt={post.scoutId.displayName || 'Scout'}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {post.scoutId.displayName || post.scoutId.twitterUsername || 'Anonymous Scout'}
                      </h4>
                      {post.scoutId.twitterUsername && (
                        <a
                          href={`https://twitter.com/${post.scoutId.twitterUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Reputation</p>
                        <p className="font-semibold">{post.scoutId.alphaReputation || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">{post.scoutId.successRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verified Alphas</p>
                        <p className="font-semibold">{post.scoutId.verifiedAlphas || 0}/{post.scoutId.totalAlphas || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alpha Details */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-4">Alpha Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border">
                        {getAlphaTypeIcon(post.alphaType)}
                        <span className="capitalize font-medium">{post.alphaType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Potential Rating</span>
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < post.potentialRating ? getPotentialRatingColor(post.potentialRating) : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(post.riskRating)}`}>
                      {post.riskRating}
                    </span>
                  </div>

                  {post.expectedReward && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expected Reward</span>
                      <span className="font-medium">{post.expectedReward}</span>
                    </div>
                  )}

                  {post.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium">{formatDate(post.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {post.requirements && post.requirements.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-4">Requirements</h3>
                  <ul className="space-y-2">
                    {post.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Links */}
              {(post.sourceUrl || post.twitterUrl || post.discordUrl) && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-4">Important Links</h3>
                  <div className="space-y-3">
                    {post.sourceUrl && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Source URL</span>
                      </a>
                    )}
                    {post.twitterUrl && (
                      <a
                        href={post.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Twitter</span>
                      </a>
                    )}
                    {post.discordUrl && (
                      <a
                        href={post.discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span>Discord</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Outcome Section (if verified) */}
              {post.isVerified && post.outcome && (
                <div className={`rounded-lg border-2 p-6 ${
                  post.outcome.success
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    {post.outcome.success ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <h3 className="text-lg font-semibold">
                      {post.outcome.success ? 'Verified Success' : 'Verified Failure'}
                    </h3>
                  </div>
                  {post.outcome.actualResults && (
                    <p className="mb-4">{post.outcome.actualResults}</p>
                  )}
                  {post.outcome.proofLinks && post.outcome.proofLinks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Proof:</p>
                      <div className="space-y-2">
                        {post.outcome.proofLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Proof Link {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {post.outcome.verifiedAt && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Verified {formatRelativeTime(post.outcome.verifiedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Author Actions */}
              {isAuthor && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-4">Author Actions</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/alpha/post/${id}/edit`)}
                      className="flex-1 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Edit Alpha
                    </button>
                    {!post.isVerified && (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Mark as Verified
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Placeholder */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-4">Comments</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Comments coming soon</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Alphas */}
              <RelatedAlphas postId={id} alphaType={post.alphaType} />
            </div>
          </div>
        </div>

        {/* Verify Modal */}
        {showVerifyModal && (
          <VerifyModal
            onClose={() => setShowVerifyModal(false)}
            onSubmit={(data) => {
              verifyMutation.mutate(data)
              setShowVerifyModal(false)
            }}
          />
        )}
      </div>
    </AuthenticatedLayout>
  )
}

// Related Alphas Component
function RelatedAlphas({ postId, alphaType }: { postId: string; alphaType: string }) {
  const { data, isLoading } = useRelatedAlphas(postId, alphaType)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold mb-4">Related Alphas</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.data || data.data.length === 0) {
    return null
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold mb-4">Related Alphas</h3>
      <div className="space-y-4">
        {data.data.map((alpha) => (
          <button
            key={alpha._id}
            onClick={() => router.push(`/alpha/post/${alpha._id}`)}
            className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium line-clamp-2 flex-1">{alpha.title}</h4>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                alpha.status === 'active'
                  ? 'bg-green-500/10 text-green-500'
                  : alpha.status === 'verified'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-gray-500/10 text-gray-500'
              }`}>
                {alpha.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{alpha.description}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="capitalize">{alpha.alphaType}</span>
              <div className="flex items-center gap-2">
                <span className="text-green-500">{alpha.votes.bullish}</span>
                <span>/</span>
                <span className="text-red-500">{alpha.votes.bearish}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Verify Modal Component
function VerifyModal({
  onClose,
  onSubmit
}: {
  onClose: () => void
  onSubmit: (data: { success: boolean; actualResults?: string; proofLinks?: string[] }) => void
}) {
  const [success, setSuccess] = useState(true)
  const [actualResults, setActualResults] = useState('')
  const [proofLink, setProofLink] = useState('')
  const [proofLinks, setProofLinks] = useState<string[]>([])

  const handleAddProofLink = () => {
    if (proofLink.trim()) {
      setProofLinks([...proofLinks, proofLink.trim()])
      setProofLink('')
    }
  }

  const handleRemoveProofLink = (index: number) => {
    setProofLinks(proofLinks.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    onSubmit({
      success,
      actualResults: actualResults.trim() || undefined,
      proofLinks: proofLinks.length > 0 ? proofLinks : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Mark as Verified</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Outcome</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSuccess(true)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  success
                    ? 'bg-green-500/20 border-green-500'
                    : 'border-border hover:border-green-500/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Success</span>
                </div>
              </button>
              <button
                onClick={() => setSuccess(false)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !success
                    ? 'bg-red-500/20 border-red-500'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Failure</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Actual Results (Optional)</label>
            <textarea
              value={actualResults}
              onChange={(e) => setActualResults(e.target.value)}
              placeholder="Describe the actual outcome..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Proof Links (Optional)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleAddProofLink()}
              />
              <button
                onClick={handleAddProofLink}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            {proofLinks.length > 0 && (
              <div className="space-y-2">
                {proofLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded border border-border">
                    <span className="flex-1 text-sm truncate">{link}</span>
                    <button
                      onClick={() => handleRemoveProofLink(idx)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Submit Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
