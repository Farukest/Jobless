'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { userHasAnyRole } from '@/lib/utils'
import toast from 'react-hot-toast'

interface EngagementPost {
  _id: string
  submitterId: {
    _id: string
    name?: string
    displayName?: string
  }
  platform: 'twitter' | 'farcaster'
  postUrl: string
  postType: string
  campaignName: string
  engagementType: string
  requiredActions: string[]
  description?: string
  submittedAt: string
  engagementCount: number
  participants: Array<{
    userId: {
      _id: string
      name?: string
      displayName?: string
    }
    proofUrl: string
    engagedAt: string
    pointsEarned: number
  }>
  status: 'active' | 'completed' | 'expired'
  expiresAt?: string
  isVerified: boolean
  verifiedBy?: {
    _id: string
    name?: string
    displayName?: string
  }
}

export default function AdminEngagementPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const [posts, setPosts] = useState<EngagementPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('all')
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
  }, [isAuthenticated, user, currentPage, selectedStatus, selectedPlatform, selectedVerificationStatus, searchQuery])

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

      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }

      if (selectedVerificationStatus === 'verified') {
        params.append('isVerified', 'true')
      } else if (selectedVerificationStatus === 'unverified') {
        params.append('isVerified', 'false')
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await api.get(`/info/posts?${params.toString()}`)

      if (response.data?.posts) {
        setPosts(response.data.posts)
        setTotal(response.data.pagination?.total || 0)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }

      setLoadingPosts(false)
    } catch (err: any) {
      console.error('Error fetching engagement posts:', err)
      toast.error(err.message || 'Failed to load engagement posts')
      setLoadingPosts(false)
    }
  }

  const handleVerifyPost = async (postId: string) => {
    try {
      await api.put(`/info/posts/${postId}/verify`, { isVerified: true })
      toast.success('Post verified successfully')
      fetchPosts()
    } catch (err: any) {
      console.error('Error verifying post:', err)
      toast.error(err.message || 'Failed to verify post')
    }
  }

  const handleUnverifyPost = async (postId: string) => {
    try {
      await api.put(`/info/posts/${postId}/verify`, { isVerified: false })
      toast.success('Post unverified')
      fetchPosts()
    } catch (err: any) {
      console.error('Error unverifying post:', err)
      toast.error(err.message || 'Failed to unverify post')
    }
  }

  const handleUpdateStatus = async (postId: string, status: 'active' | 'completed' | 'expired') => {
    try {
      await api.put(`/info/posts/${postId}`, { status })
      toast.success(`Post marked as ${status}`)
      fetchPosts()
    } catch (err: any) {
      console.error('Error updating status:', err)
      toast.error(err.message || 'Failed to update status')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this engagement post?')) {
      return
    }

    try {
      await api.delete(`/info/posts/${postId}`)
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">J Info Engagement Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and verify social engagement posts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search campaigns..."
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <select
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="farcaster">Farcaster</option>
              </select>
            </div>

            <div>
              <select
                value={selectedVerificationStatus}
                onChange={(e) => {
                  setSelectedVerificationStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
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
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {posts.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-blue-500">
              {posts.filter(p => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-red-500">
              {posts.filter(p => p.status === 'expired').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Verified</p>
            <p className="text-2xl font-bold text-purple-500">
              {posts.filter(p => p.isVerified).length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Engagements</p>
            <p className="text-2xl font-bold text-orange-500">
              {posts.reduce((sum, p) => sum + p.engagementCount, 0)}
            </p>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Campaign</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Submitter</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Platform</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Required Actions</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Engagement</th>
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
                      No engagement posts found
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{post.campaignName}</p>
                          {post.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {post.description}
                            </p>
                          )}
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Post →
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {post.submitterId?.name || post.submitterId?.displayName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.submittedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          post.platform === 'twitter'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm capitalize">{post.engagementType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {post.requiredActions.map((action, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                              {action}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">👥 {post.engagementCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.participants.length} participants
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`text-xs px-2 py-1 rounded-lg ${
                            post.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : post.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {post.status}
                          </span>
                          {post.isVerified ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-green-500">✓ Verified</span>
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-500">⚠ Unverified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!post.isVerified ? (
                            <button
                              onClick={() => handleVerifyPost(post._id)}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Verify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnverifyPost(post._id)}
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              Unverify
                            </button>
                          )}
                          {post.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(post._id, 'completed')}
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(post._id, 'expired')}
                                className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                              >
                                Expire
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => router.push(`/info/${post._id}`)}
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
          <h3 className="text-lg font-semibold mb-4">Engagement Post Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">📱 Supported Platforms</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Twitter/X - Tweets, Retweets, Quotes</li>
                <li>• Farcaster - Casts, Recasts</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">✅ Verification Process</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Review post URL validity</li>
                <li>2. Verify required actions match</li>
                <li>3. Check campaign legitimacy</li>
                <li>4. Approve or flag for review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
