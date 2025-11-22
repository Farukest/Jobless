'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { userHasAnyRole } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AlphaPost {
  _id: string
  scoutId: {
    _id: string
    name?: string
    displayName?: string
  }
  category: 'airdrop_radar' | 'testnet_tracker' | 'memecoin_calls' | 'defi_signals'
  projectName: string
  projectDescription: string
  blockchain: string
  potentialRating: 'low' | 'medium' | 'high' | 'very_high'
  riskRating: 'low' | 'medium' | 'high'
  details: string
  requirements?: string
  deadline?: string
  links: Array<{
    type: 'website' | 'twitter' | 'discord' | 'docs' | 'telegram'
    url: string
  }>
  viewsCount: number
  bullishVotes: number
  bearishVotes: number
  commentsCount: number
  status: 'pending' | 'published' | 'validated' | 'rejected' | 'archived'
  validatedAt?: string
  validatedBy?: {
    _id: string
    name?: string
    displayName?: string
  }
  outcome?: 'success' | 'failure' | 'ongoing'
  outcomeNotes?: string
  tags: string[]
  createdAt: string
}

export default function AdminAlphaPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const [posts, setPosts] = useState<AlphaPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

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
      fetchPosts()
    }
  }, [isAuthenticated, user, currentPage, selectedStatus, selectedCategory, selectedRisk, searchQuery])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      if (selectedRisk !== 'all') {
        params.append('riskRating', selectedRisk)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await api.get(`/alpha/posts?${params.toString()}`)

      if (response.data?.posts) {
        setPosts(response.data.posts)
        setTotal(response.data.pagination?.total || 0)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }

      setLoadingPosts(false)
    } catch (err: any) {
      console.error('Error fetching alpha posts:', err)
      toast.error(err.message || 'Failed to load alpha posts')
      setLoadingPosts(false)
    }
  }

  const handleModerate = async (postId: string, action: 'approve' | 'validate' | 'reject' | 'archive') => {
    try {
      let data: any = {}

      if (action === 'approve') {
        data.status = 'published'
      } else if (action === 'validate') {
        data.status = 'validated'
        data.validatedBy = user?._id
        data.validatedAt = new Date()
      } else if (action === 'reject') {
        data.status = 'rejected'
      } else if (action === 'archive') {
        data.status = 'archived'
      }

      await api.put(`/alpha/posts/${postId}`, data)
      toast.success(`Post ${action}d successfully`)
      fetchPosts()
    } catch (err: any) {
      console.error('Error moderating post:', err)
      toast.error(err.message || 'Failed to moderate post')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this alpha post?')) {
      return
    }

    try {
      await api.delete(`/alpha/posts/${postId}`)
      toast.success('Post deleted successfully')
      fetchPosts()
    } catch (err: any) {
      console.error('Error deleting post:', err)
      toast.error(err.message || 'Failed to delete post')
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !userHasAnyRole(user, ['admin', 'super_admin'])) {
    return null
  }

  const categories = ['airdrop_radar', 'testnet_tracker', 'memecoin_calls', 'defi_signals']

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">J Alpha Management</h1>
          <p className="text-muted-foreground mt-2">
            Moderate and validate alpha posts from scouts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedRisk}
                onChange={(e) => {
                  setSelectedRisk(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">
              {posts.filter(p => p.status === 'pending').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-blue-500">
              {posts.filter(p => p.status === 'published').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Validated</p>
            <p className="text-2xl font-bold text-green-500">
              {posts.filter(p => p.status === 'validated').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-red-500">
              {posts.filter(p => p.status === 'rejected').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold text-purple-500">
              {posts.reduce((sum, p) => sum + p.views, 0)}
            </p>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Project</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Scout</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Chain</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Ratings</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Sentiment</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingPosts ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No alpha posts found
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{post.projectName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {post.projectDescription}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {post.scoutId?.name || post.scoutId?.displayName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500">
                          {post.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{post.blockchain}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            post.potentialRating === 'very_high'
                              ? 'bg-green-500/10 text-green-500'
                              : post.potentialRating === 'high'
                              ? 'bg-blue-500/10 text-blue-500'
                              : post.potentialRating === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            📈 {post.potentialRating.replace(/_/g, ' ')}
                          </span>
                          <br />
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            post.riskRating === 'low'
                              ? 'bg-green-500/10 text-green-500'
                              : post.riskRating === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            ⚠️ {post.riskRating} risk
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <p className="text-green-500">🐂 {post.bullishVotes} bullish</p>
                          <p className="text-red-500">🐻 {post.bearishVotes} bearish</p>
                          <p className="text-muted-foreground">👁️ {post.viewsCount} views</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          post.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : post.status === 'published'
                            ? 'bg-blue-500/10 text-blue-500'
                            : post.status === 'validated'
                            ? 'bg-green-500/10 text-green-500'
                            : post.status === 'rejected'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleModerate(post._id, 'approve')}
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Publish
                              </button>
                              <button
                                onClick={() => handleModerate(post._id, 'reject')}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(post.status === 'published' || post.status === 'validated') && (
                            <button
                              onClick={() => handleModerate(post._id, 'validate')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Validate
                            </button>
                          )}
                          {post.status !== 'archived' && (
                            <button
                              onClick={() => handleModerate(post._id, 'archive')}
                              className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/alpha/${post._id}`)}
                            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Alpha Post Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">🎯 Airdrop Radar</h4>
              <p className="text-sm text-muted-foreground">
                Upcoming airdrops, farming opportunities, and token distribution events
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">🧪 Testnet Tracker</h4>
              <p className="text-sm text-muted-foreground">
                New testnets, early access opportunities, and retroactive potential
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">🚀 Memecoin Calls</h4>
              <p className="text-sm text-muted-foreground">
                Early memecoin opportunities, trending tokens, and community launches
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">💰 DeFi Signals</h4>
              <p className="text-sm text-muted-foreground">
                DeFi protocols, yield farming, staking opportunities, and liquidity pools
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
