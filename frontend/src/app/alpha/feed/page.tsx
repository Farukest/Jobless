'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import { useAlphaPosts, type AlphaPost, type AlphaFilters } from '@/hooks/use-alpha'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function AlphaFeedPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, hasRole } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()

  const [filters, setFilters] = useState<AlphaFilters>({
    page: 1,
    limit: 12,
    alphaType: 'all',
    potentialRating: undefined,
    riskRating: 'all',
    status: 'all',
    sortBy: 'latest',
    search: '',
  })

  // Dynamic config options
  const alphaCategories = configs?.alpha_categories || []
  const potentialRatings = configs?.potential_ratings || []
  const riskRatings = configs?.risk_ratings || []

  const { data: postsData, isLoading: postsLoading } = useAlphaPosts(
    filters.alphaType === 'all' ? { ...filters, alphaType: undefined } :
    filters.riskRating === 'all' ? { ...filters, riskRating: undefined } :
    filters.status === 'all' ? { ...filters, status: undefined } :
    filters
  )

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || configsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-10 w-64 mb-8" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const stats = postsData?.stats || {
    totalAlphas: 0,
    activeAlphas: 0,
    successRate: 0,
    topScouts: 0,
  }

  const posts = postsData?.data || []
  const isScout = hasRole('scout')

  const handleFilterChange = (key: keyof AlphaFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }))
  }

  const getPotentialRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
        return 'bg-gray-500'
      case 2:
        return 'bg-yellow-500'
      case 3:
        return 'bg-blue-500'
      case 4:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRiskRatingColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/10 text-green-500'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'high':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getAlphaTypeColor = (type: string) => {
    switch (type) {
      case 'airdrop':
        return 'bg-blue-500/10 text-blue-500'
      case 'testnet':
        return 'bg-green-500/10 text-green-500'
      case 'memecoin':
        return 'bg-orange-500/10 text-orange-500'
      case 'defi':
        return 'bg-purple-500/10 text-purple-500'
      case 'nft_mint':
        return 'bg-pink-500/10 text-pink-500'
      case 'other':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Alpha Feed</h1>
                <p className="text-muted-foreground">Discover early opportunities from top scouts</p>
              </div>
              {isScout && (
                <button
                  onClick={() => router.push('/alpha/submit')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Submit Alpha
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <p className="text-3xl font-bold mb-2">{stats.totalAlphas}</p>
              <p className="text-sm text-muted-foreground">Total Alphas</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <p className="text-3xl font-bold mb-2">{stats.activeAlphas}</p>
              <p className="text-sm text-muted-foreground">Active Alphas</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <p className="text-3xl font-bold mb-2">{stats.successRate}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <p className="text-3xl font-bold mb-2">{stats.topScouts}</p>
              <p className="text-sm text-muted-foreground">Top Scouts</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-lg border border-border p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search alphas by title or description..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Alpha Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Alpha Type</label>
                <select
                  value={filters.alphaType}
                  onChange={(e) => handleFilterChange('alphaType', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  {alphaCategories.map((category: string) => (
                    <option key={category} value={category}>
                      {category.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Potential Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Potential</label>
                <select
                  value={filters.potentialRating || 'all'}
                  onChange={(e) => handleFilterChange('potentialRating', e.target.value === 'all' ? undefined : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Ratings</option>
                  {potentialRatings.map((rating: string) => {
                    const map: Record<string, { value: number; label: string }> = {
                      low: { value: 1, label: 'Low (1)' },
                      medium: { value: 2, label: 'Medium (2)' },
                      high: { value: 3, label: 'High (3)' },
                      very_high: { value: 4, label: 'Very High (4)' },
                    }
                    const ratingData = map[rating] || { value: 2, label: rating }
                    return (
                      <option key={rating} value={ratingData.value}>
                        {ratingData.label}
                      </option>
                    )
                  }).reverse()}
                </select>
              </div>

              {/* Risk Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Risk Level</label>
                <select
                  value={filters.riskRating}
                  onChange={(e) => handleFilterChange('riskRating', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Risk Levels</option>
                  {riskRatings.map((risk: string) => (
                    <option key={risk} value={risk}>
                      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="latest">Latest</option>
                  <option value="most_bullish">Most Bullish</option>
                  <option value="most_views">Most Views</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alpha Posts Grid */}
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <svg
                className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No Alpha Posts Found</h3>
              <p className="text-muted-foreground mb-6">
                {filters.search
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to share an alpha opportunity!'}
              </p>
              {isScout && (
                <button
                  onClick={() => router.push('/alpha/submit')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Submit Alpha
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: AlphaPost) => (
                <div
                  key={post._id}
                  onClick={() => router.push(`/alpha/post/${post._id}`)}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {/* Scout Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {post.scoutId.profileImage ? (
                        <img
                          src={post.scoutId.profileImage}
                          alt={post.scoutId.displayName || post.scoutId.twitterUsername || 'Scout'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {post.scoutId.displayName || post.scoutId.twitterUsername || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rep: {post.scoutId.reputationScore || 0}
                      </p>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {truncateText(post.description, 100)}
                  </p>

                  {/* Type and Ratings */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlphaTypeColor(post.alphaType)}`}>
                      {post.alphaType.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskRatingColor(post.riskRating)}`}>
                      {post.riskRating}
                    </span>
                  </div>

                  {/* Potential Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Potential:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < post.potentialRating
                              ? getPotentialRatingColor(post.potentialRating)
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{post.bullishVotes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{post.bearishVotes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{post.viewCount}</span>
                      </div>
                    </div>
                    <span className="text-xs">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {postsData && postsData.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-card border border-border rounded-lg font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {postsData.pages}
              </span>
              <button
                onClick={() => handleFilterChange('page', Math.min(postsData.pages, (filters.page || 1) + 1))}
                disabled={filters.page === postsData.pages}
                className="px-4 py-2 bg-card border border-border rounded-lg font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
