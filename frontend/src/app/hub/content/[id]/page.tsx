'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useContent, useToggleLike, useToggleBookmark } from '@/hooks/use-hub'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function ContentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading, error } = useContent(id)
  const { mutate: toggleLike, isPending: isLiking } = useToggleLike()
  const { mutate: toggleBookmark, isPending: isBookmarking } = useToggleBookmark()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleLike = () => {
    toggleLike(id, {
      onSuccess: () => toast.success('Liked!'),
      onError: () => toast.error('Failed to like'),
    })
  }

  const handleBookmark = () => {
    toggleBookmark(id, {
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

  if (authLoading || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The content you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/hub')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Hub
              </button>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!data?.data) {
    return null
  }

  const content = data.data
  const isAuthor = user?._id === content.authorId._id

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/hub')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Hub
          </button>

          {/* Content Header */}
          <div className="bg-card rounded-lg border border-border p-8 mb-6">
            {/* Badges */}
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
              {content.isFeatured && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                  Featured
                </span>
              )}
              {content.isPinned && (
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                  Pinned
                </span>
              )}
              {content.status === 'draft' && (
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                  Draft
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>

            {/* Description */}
            {content.description && (
              <p className="text-lg text-muted-foreground mb-6">{content.description}</p>
            )}

            {/* Author Info */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-3">
                {content.authorId.profileImage ? (
                  <Image
                    src={content.authorId.profileImage}
                    alt={content.authorId.displayName || 'Author'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-medium text-muted-foreground">
                      {(content.authorId.displayName || content.authorId.twitterUsername || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {content.authorId.displayName || content.authorId.twitterUsername || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Published {new Date(content.publishedAt || content.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              {isAuthor && (
                <button
                  onClick={() => router.push(`/hub/content/${id}/edit`)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Edit Content
                </button>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="bg-card rounded-lg border border-border p-8 mb-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{content.body}</div>
            </div>

            {/* Media */}
            {content.mediaUrls && content.mediaUrls.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.mediaUrls.map((media, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-border">
                    {media.type === 'image' && (
                      <Image
                        src={media.url}
                        alt={`Media ${index + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                    )}
                    {media.type === 'video' && (
                      <video controls className="w-full h-auto">
                        <source src={media.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="text-sm font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Actions */}
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <span className="font-medium">{content.views}</span>
                  <span className="text-sm">views</span>
                </div>

                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="font-medium">{content.likes}</span>
                  <span className="text-sm">likes</span>
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span className="font-medium">{content.bookmarks}</span>
                  <span className="text-sm">bookmarks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section (Placeholder) */}
          <div className="bg-card rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4">Comments</h2>
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-muted-foreground">Comments feature coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                The comment model doesn't exist yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
