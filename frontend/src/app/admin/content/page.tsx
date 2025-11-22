'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { CreateContentModal } from '@/components/admin/create-content-modal'
import { api } from '@/lib/api'
import { userHasAnyRole } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Content {
  _id: string
  title: string
  description?: string
  contentType: 'video' | 'thread' | 'podcast' | 'guide' | 'tutorial'
  category: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived' | 'rejected'
  authorId: {
    _id: string
    name?: string
    displayName?: string
  }
  viewsCount: number
  likesCount: number
  bookmarksCount: number
  isFeatured: boolean
  isPinned: boolean
  isAdminPinned?: boolean // Admin-only pin for prioritization
  createdAt: string
  publishedAt?: string
}

type SortColumn = 'title' | 'author' | 'contentType' | 'category' | 'status' | 'createdAt' | 'stats'
type SortOrder = 'asc' | 'desc'
type StatsSortBy = 'likes' | 'views' | 'bookmarks'

export default function AdminContentPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [contents, setContents] = useState<Content[]>([])
  const [loadingContents, setLoadingContents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statsSortBy, setStatsSortBy] = useState<StatsSortBy>('views')
  const [showStatsPopup, setShowStatsPopup] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  // Hub Settings Modal
  const [showHubSettingsModal, setShowHubSettingsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'categories' | 'types' | 'difficulty'>('categories')
  const [loadingConfig, setLoadingConfig] = useState(false)

  // Categories
  const [categories, setCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null)

  // Content Types
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [editingType, setEditingType] = useState<{ old: string; new: string } | null>(null)

  // Difficulty Levels
  const [difficultyLevels, setDifficultyLevels] = useState<string[]>([])
  const [newDifficultyName, setNewDifficultyName] = useState('')
  const [editingDifficulty, setEditingDifficulty] = useState<{ old: string; new: string } | null>(null)

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
      fetchContents()
      // Load filter options
      if (categories.length === 0 || contentTypes.length === 0) {
        fetchHubConfig()
      }
    }
  }, [isAuthenticated, user, currentPage, selectedStatus, selectedType, selectedCategory, searchQuery, sortColumn, sortOrder, statsSortBy])

  const fetchContents = async () => {
    try {
      setLoadingContents(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      // Admin için status filter
      // 'all' seçiliyse status=all gönder (backend tüm statusleri döndür)
      // Specific status seçiliyse onu gönder
      params.append('status', selectedStatus)

      if (selectedType !== 'all') {
        params.append('contentType', selectedType)
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      // Sorting parameters
      let backendSortBy = sortColumn
      if (sortColumn === 'stats') {
        // Map stats sorting to specific field
        if (statsSortBy === 'likes') backendSortBy = 'likesCount'
        else if (statsSortBy === 'views') backendSortBy = 'viewsCount'
        else backendSortBy = 'bookmarksCount'
      } else if (sortColumn === 'author') {
        // Can't sort by populated field directly, use createdAt instead
        backendSortBy = 'createdAt'
      }

      params.append('sortBy', backendSortBy)
      params.append('sortOrder', sortOrder)

      const response = await api.get(`/hub/content?${params.toString()}`)

      if (response.data?.data) {
        setContents(response.data.data)
        setTotal(response.data.total || 0)
        setTotalPages(response.data.pages || 1)
      }

      setLoadingContents(false)
    } catch (err: any) {
      console.error('Error fetching contents:', err)
      setError(err.message || 'Failed to load contents')
      setLoadingContents(false)
    }
  }

  const handleModerate = async (contentId: string, action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'feature' | 'pin' | 'adminPin') => {
    try {
      const data: any = {}

      if (action === 'approve') {
        data.status = 'published'
      } else if (action === 'reject') {
        data.status = 'rejected'
      } else if (action === 'archive') {
        // Archive can only be done on published content (backend validates this)
        data.status = 'archived'
      } else if (action === 'unarchive') {
        // Unarchive brings content back to published
        data.status = 'published'
      } else if (action === 'feature') {
        const content = contents.find(c => c._id === contentId)
        data.isFeatured = !content?.isFeatured
      } else if (action === 'pin') {
        const content = contents.find(c => c._id === contentId)
        data.isPinned = !content?.isPinned
      } else if (action === 'adminPin') {
        // Admin pin for prioritization (not user-facing)
        const content = contents.find(c => c._id === contentId)
        data.isAdminPinned = !content?.isAdminPinned
      }

      await api.put(`/hub/content/${contentId}/moderate`, data)

      const successMessage = action === 'unarchive' ? 'Content unarchived successfully' : action === 'adminPin' ? 'Admin pin toggled' : `Content ${action}d successfully`
      toast.success(successMessage)

      // Backend sorting handles pin priority automatically
      // Just refresh current page
      fetchContents()
    } catch (err: any) {
      console.error('Error moderating content:', err)
      toast.error(err.response?.data?.message || err.message || 'Failed to moderate content')
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

  // Sorting functions
  const handleSort = (column: SortColumn) => {
    if (column === 'stats') {
      // Show stats popup
      setShowStatsPopup(true)
      return
    }

    if (sortColumn === column) {
      // Toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New column - default to ascending
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleStatsSort = (sortBy: StatsSortBy) => {
    setStatsSortBy(sortBy)
    setSortColumn('stats')
    setShowStatsPopup(false)
  }

  // Backend already handles sorting (isAdminPinned, isPinned, then by column)
  // Frontend just needs to return contents as-is
  const getSortedContents = () => {
    return contents
  }

  // Hub Config Functions
  const fetchHubConfig = async () => {
    try {
      setLoadingConfig(true)
      const response = await api.get('/admin/hub/config')
      const { categories: cats, contentTypes: types, difficultyLevels: levels } = response.data.data
      setCategories(cats || [])
      setContentTypes(types || [])
      setDifficultyLevels(levels || [])
      // Also set for create modal
      setAvailableCategories(cats || [])
      setAvailableContentTypes(types || [])
      setLoadingConfig(false)
    } catch (err: any) {
      console.error('Error fetching hub config:', err)
      toast.error('Failed to load Hub configuration')
      setLoadingConfig(false)
    }
  }

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await api.post('/admin/hub/categories', { category: newCategoryName })
      toast.success('Category added successfully')
      setNewCategoryName('')
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      console.error('Error adding category:', err)
      toast.error(err.response?.data?.message || 'Failed to add category')
    }
  }

  const handleRenameCategory = async (oldSlug: string) => {
    if (!editingCategory?.new.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await api.put(`/admin/hub/categories/${oldSlug}`, { newName: editingCategory.new })
      toast.success('Category renamed successfully')
      setEditingCategory(null)
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      console.error('Error renaming category:', err)
      toast.error(err.response?.data?.message || 'Failed to rename category')
    }
  }

  const handleDeleteCategory = async (slug: string) => {
    try {
      // Try without force first
      const response = await api.delete(`/admin/hub/categories/${slug}`)
      toast.success(response.data.message || 'Category deleted successfully')
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || ''
      if (errorMsg.includes('content(s) use this category')) {
        if (confirm(`${errorMsg}\n\nDo you want to move all content to "other" category and delete?`)) {
          try {
            const forceResponse = await api.delete(`/admin/hub/categories/${slug}?force=true`)
            toast.success(forceResponse.data.message || 'Category deleted and content moved')
            fetchHubConfig()
            fetchContents()
          } catch (forceErr: any) {
            toast.error(forceErr.response?.data?.message || 'Failed to delete category')
          }
        }
      } else {
        toast.error(errorMsg || 'Failed to delete category')
      }
    }
  }

  // Content Types CRUD
  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name is required')
      return
    }

    try {
      await api.post('/admin/hub/types', { type: newTypeName })
      toast.success('Content type added successfully')
      setNewTypeName('')
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add type')
    }
  }

  const handleRenameType = async (oldSlug: string) => {
    if (!editingType?.new.trim()) {
      toast.error('Type name is required')
      return
    }

    try {
      await api.put(`/admin/hub/types/${oldSlug}`, { newName: editingType.new })
      toast.success('Content type renamed successfully')
      setEditingType(null)
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to rename type')
    }
  }

  const handleDeleteType = async (slug: string) => {
    try {
      const response = await api.delete(`/admin/hub/types/${slug}`)
      toast.success(response.data.message || 'Type deleted successfully')
      fetchHubConfig()
      fetchContents()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || ''
      if (errorMsg.includes('content(s) use this type')) {
        if (confirm(`${errorMsg}\n\nMove content to another type and delete?`)) {
          try {
            const forceResponse = await api.delete(`/admin/hub/types/${slug}?force=true`)
            toast.success(forceResponse.data.message || 'Type deleted and content moved')
            fetchHubConfig()
            fetchContents()
          } catch (forceErr: any) {
            toast.error(forceErr.response?.data?.message || 'Failed to delete type')
          }
        }
      } else {
        toast.error(errorMsg || 'Failed to delete type')
      }
    }
  }

  // Difficulty Levels CRUD
  const handleAddDifficulty = async () => {
    if (!newDifficultyName.trim()) {
      toast.error('Difficulty level name is required')
      return
    }

    try {
      await api.post('/admin/hub/difficulty', { level: newDifficultyName })
      toast.success('Difficulty level added successfully')
      setNewDifficultyName('')
      fetchHubConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add difficulty level')
    }
  }

  const handleRenameDifficulty = async (oldSlug: string) => {
    if (!editingDifficulty?.new.trim()) {
      toast.error('Difficulty level name is required')
      return
    }

    try {
      await api.put(`/admin/hub/difficulty/${oldSlug}`, { newName: editingDifficulty.new })
      toast.success('Difficulty level renamed successfully')
      setEditingDifficulty(null)
      fetchHubConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to rename difficulty level')
    }
  }

  const handleDeleteDifficulty = async (slug: string) => {
    if (confirm('Delete this difficulty level? Affected content will have difficulty cleared.')) {
      try {
        const response = await api.delete(`/admin/hub/difficulty/${slug}`)
        toast.success(response.data.message || 'Difficulty level deleted successfully')
        fetchHubConfig()
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete difficulty level')
      }
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">J Hub Content Management</h1>
            <p className="text-muted-foreground mt-2">
              Moderate and manage all content submissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Create Content Button */}
            <button
              onClick={() => {
                setShowCreateModal(true)
                if (availableContentTypes.length === 0 || availableCategories.length === 0) {
                  fetchHubConfig()
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Content
            </button>

            {/* Only super_admin can manage Hub settings */}
            {userHasAnyRole(user, ['super_admin']) && (
              <button
                onClick={() => {
                  setShowHubSettingsModal(true)
                  fetchHubConfig()
                }}
                className="p-2 bg-card border border-border hover:bg-muted rounded-lg transition-colors"
                title="Hub Settings"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
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
                {contentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
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
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
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

        {/* Stats Sort Popup */}
        {showStatsPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStatsPopup(false)}>
            <div className="bg-card rounded-lg border border-border p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Sort Stats By</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleStatsSort('views')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    statsSortBy === 'views' && sortColumn === 'stats'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Views</span>
                  </div>
                </button>
                <button
                  onClick={() => handleStatsSort('likes')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    statsSortBy === 'likes' && sortColumn === 'stats'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Likes</span>
                  </div>
                </button>
                <button
                  onClick={() => handleStatsSort('bookmarks')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    statsSortBy === 'bookmarks' && sortColumn === 'stats'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>Bookmarks</span>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowStatsPopup(false)}
                className="w-full mt-4 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      {sortColumn === 'title' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                    onClick={() => handleSort('author')}
                  >
                    <div className="flex items-center gap-2">
                      Author
                      {sortColumn === 'author' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                    onClick={() => handleSort('contentType')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {sortColumn === 'contentType' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Category
                      {sortColumn === 'category' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortColumn === 'status' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors select-none relative"
                    onClick={() => handleSort('stats')}
                  >
                    <div className="flex items-center gap-2">
                      Stats
                      {sortColumn === 'stats' && (
                        <span className="text-xs flex items-center gap-1">
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          {statsSortBy === 'likes' ? (
                            <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          ) : statsSortBy === 'views' ? (
                            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
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
                  getSortedContents().map((content) => (
                    <tr key={content._id} className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      content.isAdminPinned ? 'border-l-2 border-l-indigo-400/60' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{content.title}</p>
                            {/* Admin Pin Icon */}
                            <button
                              onClick={() => handleModerate(content._id, 'adminPin')}
                              className={`transition-all ${
                                content.isAdminPinned
                                  ? 'text-indigo-400 opacity-100'
                                  : 'text-muted-foreground opacity-30 hover:opacity-60'
                              }`}
                              title={content.isAdminPinned ? 'Unpin from admin list' : 'Pin to top of admin list'}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 17v5" />
                                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                              </svg>
                            </button>
                          </div>
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
                          className={`text-xs px-2 py-1 rounded-lg ${
                            content.status === 'published'
                              ? 'bg-green-500/10 text-green-500'
                              : content.status === 'draft'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : content.status === 'rejected'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}
                        >
                          {content.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {content.viewsCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {content.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            {content.bookmarksCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve - show for draft/rejected */}
                          {(content.status === 'draft' || content.status === 'rejected') && (
                            <button
                              onClick={() => handleModerate(content._id, 'approve')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {/* Unarchive - only for archived content */}
                          {content.status === 'archived' && (
                            <button
                              onClick={() => handleModerate(content._id, 'unarchive')}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Unarchive
                            </button>
                          )}

                          {/* Reject - show for draft/published */}
                          {(content.status === 'draft' || content.status === 'published') && (
                            <button
                              onClick={() => handleModerate(content._id, 'reject')}
                              className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                            >
                              Reject
                            </button>
                          )}

                          {/* Archive - only for published content */}
                          {content.status === 'published' && (
                            <button
                              onClick={() => handleModerate(content._id, 'archive')}
                              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                              Archive
                            </button>
                          )}

                          {/* Feature - only for published */}
                          {content.status === 'published' && (
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
                          )}

                          {/* Pin - only for published */}
                          {content.status === 'published' && (
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
                          )}

                          <button
                            onClick={() => router.push(`/hub/content/${content._id}`)}
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

        {/* Hub Settings Modal */}
        {showHubSettingsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border border-border max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">J Hub Settings</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage dynamic content configuration
                  </p>
                </div>
                <button
                  onClick={() => setShowHubSettingsModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-muted/30">
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-card border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Categories ({categories.length})
                </button>
                <button
                  onClick={() => setActiveTab('types')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'types'
                      ? 'bg-card border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Content Types ({contentTypes.length})
                </button>
                <button
                  onClick={() => setActiveTab('difficulty')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'difficulty'
                      ? 'bg-card border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Difficulty Levels ({difficultyLevels.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {loadingConfig ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading configuration...</p>
                  </div>
                ) : (
                  <>
                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                      <>
                        {/* Add New Category */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Add New Category</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                              placeholder="e.g., blockchain, defi, nft..."
                              className="flex-1 px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              onClick={handleAddCategory}
                              disabled={!newCategoryName.trim()}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Category names will be automatically converted to lowercase with underscores
                          </p>
                        </div>

                        {/* Categories List */}
                        <div>
                          <label className="block text-sm font-medium mb-3">Existing Categories ({categories.length})</label>
                          {categories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No categories found
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {categories.map((category) => (
                                <div
                                  key={category}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border hover:border-primary/50 transition-colors"
                                >
                                  {editingCategory?.old === category ? (
                                    <input
                                      type="text"
                                      value={editingCategory.new}
                                      onChange={(e) => setEditingCategory({ old: category, new: e.target.value })}
                                      onKeyPress={(e) => e.key === 'Enter' && handleRenameCategory(category)}
                                      className="flex-1 px-3 py-1 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary mr-2"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-medium capitalize">
                                      {category.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {editingCategory?.old === category ? (
                                      <>
                                        <button
                                          onClick={() => handleRenameCategory(category)}
                                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingCategory(null)}
                                          className="px-3 py-1 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setEditingCategory({ old: category, new: category })}
                                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                          Rename
                                        </button>
                                        {category !== 'other' && (
                                          <button
                                            onClick={() => handleDeleteCategory(category)}
                                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        )}
                                        {category === 'other' && (
                                          <span className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded cursor-not-allowed">
                                            Protected
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Content Types Tab */}
                    {activeTab === 'types' && (
                      <>
                        {/* Add New Type */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Add New Content Type</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTypeName}
                              onChange={(e) => setNewTypeName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
                              placeholder="e.g., article, video, podcast..."
                              className="flex-1 px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              onClick={handleAddType}
                              disabled={!newTypeName.trim()}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Type names will be automatically converted to lowercase with underscores
                          </p>
                        </div>

                        {/* Types List */}
                        <div>
                          <label className="block text-sm font-medium mb-3">Existing Content Types ({contentTypes.length})</label>
                          {contentTypes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No content types found
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {contentTypes.map((type) => (
                                <div
                                  key={type}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border hover:border-primary/50 transition-colors"
                                >
                                  {editingType?.old === type ? (
                                    <input
                                      type="text"
                                      value={editingType.new}
                                      onChange={(e) => setEditingType({ old: type, new: e.target.value })}
                                      onKeyPress={(e) => e.key === 'Enter' && handleRenameType(type)}
                                      className="flex-1 px-3 py-1 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary mr-2"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-medium capitalize">
                                      {type.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {editingType?.old === type ? (
                                      <>
                                        <button
                                          onClick={() => handleRenameType(type)}
                                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingType(null)}
                                          className="px-3 py-1 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setEditingType({ old: type, new: type })}
                                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                          Rename
                                        </button>
                                        <button
                                          onClick={() => handleDeleteType(type)}
                                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Difficulty Levels Tab */}
                    {activeTab === 'difficulty' && (
                      <>
                        {/* Add New Difficulty */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Add New Difficulty Level</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDifficultyName}
                              onChange={(e) => setNewDifficultyName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddDifficulty()}
                              placeholder="e.g., beginner, intermediate, advanced..."
                              className="flex-1 px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              onClick={handleAddDifficulty}
                              disabled={!newDifficultyName.trim()}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Level names will be automatically converted to lowercase with underscores
                          </p>
                        </div>

                        {/* Difficulty Levels List */}
                        <div>
                          <label className="block text-sm font-medium mb-3">Existing Difficulty Levels ({difficultyLevels.length})</label>
                          {difficultyLevels.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No difficulty levels found
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {difficultyLevels.map((level) => (
                                <div
                                  key={level}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border hover:border-primary/50 transition-colors"
                                >
                                  {editingDifficulty?.old === level ? (
                                    <input
                                      type="text"
                                      value={editingDifficulty.new}
                                      onChange={(e) => setEditingDifficulty({ old: level, new: e.target.value })}
                                      onKeyPress={(e) => e.key === 'Enter' && handleRenameDifficulty(level)}
                                      className="flex-1 px-3 py-1 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary mr-2"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-medium capitalize">
                                      {level.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {editingDifficulty?.old === level ? (
                                      <>
                                        <button
                                          onClick={() => handleRenameDifficulty(level)}
                                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingDifficulty(null)}
                                          className="px-3 py-1 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setEditingDifficulty({ old: level, new: level })}
                                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                          Rename
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDifficulty(level)}
                                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Content Modal */}
        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchContents()}
          availableContentTypes={availableContentTypes}
          availableCategories={availableCategories}
        />
      </div>
    </AdminLayout>
  )
}
