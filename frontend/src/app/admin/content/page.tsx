'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Content {
  _id: string
  title: string
  description?: string
  contentType: 'video' | 'thread' | 'podcast' | 'guide' | 'tutorial'
  category: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  authorId: {
    _id: string
    name?: string
    displayName?: string
  }
  views: number
  likes: number
  bookmarks: number
  isFeatured: boolean
  isPinned: boolean
  createdAt: string
  publishedAt?: string
}

export default function AdminContentPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [contents, setContents] = useState<Content[]>([])
  const [loadingContents, setLoadingContents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && user && !user.roles?.includes('admin') && !user.roles?.includes('super_admin')) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && (user.roles?.includes('admin') || user.roles?.includes('super_admin'))) {
      fetchContents()
    }
  }, [isAuthenticated, user, currentPage, selectedStatus, selectedType, searchQuery])

  const fetchContents = async () => {
    try {
      setLoadingContents(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (selectedType !== 'all') {
        params.append('contentType', selectedType)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await api.get(`/hub/content?${params.toString()}`)

      if (response.data?.content) {
        setContents(response.data.content)
        setTotal(response.data.pagination?.total || 0)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }

      setLoadingContents(false)
    } catch (err: any) {
      console.error('Error fetching contents:', err)
      setError(err.message || 'Failed to load contents')
      setLoadingContents(false)
    }
  }

  const handleModerate = async (contentId: string, action: 'approve' | 'reject' | 'feature' | 'pin') => {
    try {
      const data: any = {}

      if (action === 'approve') {
        data.status = 'published'
      } else if (action === 'reject') {
        data.status = 'archived'
      } else if (action === 'feature') {
        const content = contents.find(c => c._id === contentId)
        data.isFeatured = !content?.isFeatured
      } else if (action === 'pin') {
        const content = contents.find(c => c._id === contentId)
        data.isPinned = !content?.isPinned
      }

      await api.put(`/hub/content/${contentId}/moderate`, data)
      toast.success(`Content ${action}d successfully`)

      // Refresh contents
      fetchContents()
    } catch (err: any) {
      console.error('Error moderating content:', err)
      toast.error(err.message || 'Failed to moderate content')
    }
  }

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return
    }

    try {
      await api.delete(`/hub/content/${contentId}`)
      toast.success('Content deleted successfully')
      fetchContents()
    } catch (err: any) {
      console.error('Error deleting content:', err)
      toast.error(err.message || 'Failed to delete content')
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

  if (!isAuthenticated || !user || (!user.roles?.includes('admin') && !user.roles?.includes('super_admin'))) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">J Hub Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Moderate and manage all content submissions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
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
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="video">Video</option>
                <option value="thread">Thread</option>
                <option value="podcast">Podcast</option>
                <option value="guide">Guide</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Content</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-green-500">
              {contents.filter(c => c.status === 'published').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold text-yellow-500">
              {contents.filter(c => c.status === 'draft').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Archived</p>
            <p className="text-2xl font-bold text-red-500">
              {contents.filter(c => c.status === 'archived').length}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchContents}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Author</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Stats</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingContents ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : contents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No content found
                    </td>
                  </tr>
                ) : (
                  contents.map((content) => (
                    <tr key={content._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{content.title}</p>
                          {content.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {content.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {content.isFeatured && (
                              <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded">
                                Featured
                              </span>
                            )}
                            {content.isPinned && (
                              <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
                                Pinned
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {content.authorId?.name || content.authorId?.displayName || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">{content.contentType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">{content.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            content.status === 'published'
                              ? 'bg-green-500/10 text-green-500'
                              : content.status === 'draft'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {content.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>👁️ {content.views}</span>
                          <span>❤️ {content.likes}</span>
                          <span>🔖 {content.bookmarks}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {content.status !== 'published' && (
                            <button
                              onClick={() => handleModerate(content._id, 'approve')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {content.status !== 'archived' && (
                            <button
                              onClick={() => handleModerate(content._id, 'reject')}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleModerate(content._id, 'feature')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              content.isFeatured
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-muted text-foreground hover:bg-yellow-500 hover:text-white'
                            }`}
                          >
                            {content.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            onClick={() => handleModerate(content._id, 'pin')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              content.isPinned
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-muted text-foreground hover:bg-blue-500 hover:text-white'
                            }`}
                          >
                            {content.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => router.push(`/hub/${content._id}`)}
                            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(content._id)}
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
      </div>
    </AdminLayout>
  )
}
