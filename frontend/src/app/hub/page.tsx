'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs, formatAsOptions } from '@/hooks/use-configs'
import { useHubContent, useFeaturedContent, useToggleLike, useToggleBookmark, Content } from '@/hooks/use-hub'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import Image from 'next/image'
import toast from 'react-hot-toast'

function ContentCard({ content }: { content: Content }) {
  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleBookmark } = useToggleBookmark()

  const handleLike = () => {
    toggleLike(content._id, {
      onSuccess: () => toast.success('Liked!'),
      onError: () => toast.error('Failed to like'),
    })
  }

  const handleBookmark = () => {
    toggleBookmark(content._id, {
      onSuccess: () => toast.success('Bookmarked!'),
      onError: () => toast.error('Failed to bookmark'),
    })
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-500 bg-green-500/10'
      case 'intermediate':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'advanced':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {content.authorId?.profileImage ? (
            <Image
              src={content.authorId.profileImage}
              alt={content.authorId.displayName || 'Author'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                {(content.authorId?.displayName || content.authorId?.twitterUsername || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">
              {content.authorId?.displayName || content.authorId?.twitterUsername || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(content.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {content.isFeatured && (
            <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
              Featured
            </span>
          )}
          {content.isPinned && (
            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
              Pinned
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">{content.title}</h3>
      {content.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{content.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {content.contentType}
        </span>
        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          {content.category}
        </span>
        {content.difficulty && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
            {content.difficulty}
          </span>
        )}
      </div>

      {content.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {content.tags.slice(0, 5).map((tag, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{content.viewsCount}</span>
          </div>
          <button onClick={handleLike} className="flex items-center gap-1 hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{content.likesCount}</span>
          </button>
          <button onClick={handleBookmark} className="flex items-center gap-1 hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span>{content.bookmarksCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HubPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [page, setPage] = useState(1)
  const [contentType, setContentType] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')

  // Dynamic config options with "All" prepended
  const configContentTypes = configs?.content_types || []
  const contentTypes = [
    { value: '', label: 'All Types' },
    ...configContentTypes.map((type: string) => ({
      value: type,
      label: type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    })),
  ]

  const configCategories = configs?.content_categories || []
  const categories = [
    { value: '', label: 'All Categories' },
    ...configCategories.map((cat: string) => ({
      value: cat,
      label: cat.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    })),
  ]

  const configDifficulties = configs?.difficulty_levels || []
  const difficulties = [
    { value: '', label: 'All Levels' },
    ...configDifficulties.map((diff: string) => ({
      value: diff,
      label: diff.charAt(0).toUpperCase() + diff.slice(1),
    })),
  ]

  const { data: featured, isLoading: featuredLoading } = useFeaturedContent(3)
  const { data: contents, isLoading: contentsLoading } = useHubContent({
    page,
    limit: 12,
    contentType: contentType || undefined,
    category: category || undefined,
    difficulty: difficulty || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">J Hub</h1>
          <p className="text-muted-foreground">Discover and share valuable content</p>
        </div>

        {/* Featured Content */}
        {featured && featured.data.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Featured Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredLoading ? (
                Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              ) : (
                featured.data.map((content) => <ContentCard key={content._id} content={content} />)
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {difficulties.map((diff) => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">All Content</h2>
            {contents && (
              <p className="text-sm text-muted-foreground">
                Showing {contents.count} of {contents.total} results
              </p>
            )}
          </div>

          {contentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : contents && contents.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.data.map((content) => (
                <ContentCard key={content._id} content={content} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">No content found. Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {contents && contents.pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {contents.page} of {contents.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(contents.pages, p + 1))}
              disabled={page === contents.pages}
              className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
