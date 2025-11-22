'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { TwitterStyleContent } from '@/components/hub/twitter-style-content'
import { Skeleton, TwitterFeedSkeleton } from '@/components/ui/skeleton'
import { TwitterReplyInput } from '@/components/hub/twitter-reply-input'
import { TwitterPostComposer } from '@/components/hub/twitter-post-composer'
import { useToggleLike, useToggleBookmark, useCreateComment } from '@/hooks/use-hub'
import Image from 'next/image'
import Link from 'next/link'

interface Content {
  _id: string
  title: string
  description?: string
  body?: string
  contentType: string
  category: string
  difficulty?: string
  tags?: string[]
  authorId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
    walletAddress: string
  }
  viewsCount: number
  likesCount: number
  bookmarksCount: number
  commentsCount: number
  isLiked?: boolean
  isBookmarked?: boolean
  isFeatured: boolean
  isPinned: boolean
  status: string
  createdAt: string
}

interface FeedResponse {
  success: boolean
  count: number
  total: number
  page: number
  pages: number
  data: Content[]
}

export default function HubFeedPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: configs } = usePublicConfigs()
  const queryClient = useQueryClient()
  const observerTarget = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [newPosts, setNewPosts] = useState<Content[]>([])
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [commentText, setCommentText] = useState('')
  const { user } = useAuth()

  // Handle client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleBookmark } = useToggleBookmark()
  const { mutate: createComment, isPending: isSubmittingComment } = useCreateComment()

  // Get feed limit from config (default: 10)
  const feedLimit = configs?.hub_limits?.feed_page_limit || 10

  // Fetch feed with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ['hub', 'feed'],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/hub/content', {
        params: {
          page: pageParam,
          limit: feedLimit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !authLoading && isAuthenticated,
  })

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // WebSocket listeners
  useEffect(() => {
    const socket = getSocket()

    // New content created
    const handleContentCreated = (content: Content) => {
      console.log('[Feed] New content created:', content)
      setNewPosts((prev) => [content, ...prev])
      setNewPostsCount((prev) => prev + 1)
    }

    // Like update
    const handleLikeUpdate = (data: { contentId: string; likesCount: number; isLiked?: boolean }) => {
      console.log('[Feed] Like update:', data)
      queryClient.setQueryData(['hub', 'feed'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            data: page.data.map((content) =>
              content._id === data.contentId
                ? { ...content, likesCount: data.likesCount }
                : content
            ),
          })),
        }
      })
    }

    // Bookmark update
    const handleBookmarkUpdate = (data: { contentId: string; bookmarksCount: number; isBookmarked?: boolean }) => {
      console.log('[Feed] Bookmark update:', data)
      queryClient.setQueryData(['hub', 'feed'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            data: page.data.map((content) =>
              content._id === data.contentId
                ? { ...content, bookmarksCount: data.bookmarksCount }
                : content
            ),
          })),
        }
      })
    }

    // Comment created (updates comment count)
    const handleCommentCreated = (data: { contentId: string }) => {
      console.log('[Feed] Comment created:', data)
      queryClient.setQueryData(['hub', 'feed'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            data: page.data.map((content) =>
              content._id === data.contentId
                ? { ...content, commentsCount: (content.commentsCount || 0) + 1 }
                : content
            ),
          })),
        }
      })
    }

    // Listen to global hub events
    socket.on('hub:contentCreated', handleContentCreated)
    socket.on('hub:likeUpdate', handleLikeUpdate)
    socket.on('hub:bookmarkUpdate', handleBookmarkUpdate)
    socket.on('hub:commentCreated', handleCommentCreated)

    return () => {
      socket.off('hub:contentCreated', handleContentCreated)
      socket.off('hub:likeUpdate', handleLikeUpdate)
      socket.off('hub:bookmarkUpdate', handleBookmarkUpdate)
      socket.off('hub:commentCreated', handleCommentCreated)
    }
  }, [queryClient])

  const handleLoadNewPosts = useCallback(() => {
    if (newPosts.length === 0) return

    queryClient.setQueryData(['hub', 'feed'], (old: any) => {
      if (!old) return old

      const firstPage = old.pages[0]
      return {
        ...old,
        pages: [
          {
            ...firstPage,
            data: [...newPosts, ...firstPage.data],
            total: firstPage.total + newPosts.length,
            count: firstPage.count + newPosts.length,
          },
          ...old.pages.slice(1),
        ],
      }
    })

    setNewPosts([])
    setNewPostsCount(0)
  }, [newPosts, queryClient])

  const handleCommentClick = (content: Content) => {
    setSelectedContent(content)
    setCommentText('')
  }

  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedContent) return

    createComment({
      contentType: 'hub_content',
      contentId: selectedContent._id,
      content: commentText.trim()
    }, {
      onSuccess: () => {
        setCommentText('')
        setSelectedContent(null)
        // WebSocket will handle comment count update via hub:commentCreated event
      }
    })
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Show skeleton only after client-side mount
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4">
        {/* Feed Content Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TwitterFeedSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const allContents = data?.pages.flatMap((page) => page.data) || []

  const handlePostCreated = () => {
    // Refetch feed to show new post
    queryClient.invalidateQueries({ queryKey: ['hub', 'feed'] })
  }

  return (
    <>
      <div className="container mx-auto max-w-2xl px-4">
        {/* Post Composer */}
        <TwitterPostComposer onPostCreated={handlePostCreated} />

        {/* New Posts Banner */}
        {newPostsCount > 0 && (
          <button
            onClick={handleLoadNewPosts}
            className="w-full mb-4 py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
          </button>
        )}

        {/* Feed Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TwitterFeedSkeleton key={i} />
            ))}
          </div>
        ) : allContents.length > 0 ? (
          <div className="space-y-3">
            {allContents.map((content) => (
              <TwitterStyleContent
                key={content._id}
                content={content}
                onLike={() => toggleLike(content._id)}
                onBookmark={() => toggleBookmark(content._id)}
                onComment={() => handleCommentClick(content)}
                showFullContent={true}
              />
            ))}

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Intersection observer target */}
            <div ref={observerTarget} className="h-4" />

            {/* End of feed */}
            {!hasNextPage && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                You've reached the end
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">No content yet. Be the first to post!</p>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {selectedContent && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedContent(null)}
          >
            <div
              className="bg-card rounded-xl border border-border max-w-xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => {
                e.stopPropagation()
                const textarea = e.currentTarget.querySelector('textarea')
                if (textarea && !window.getSelection()?.toString()) {
                  textarea.focus()
                }
              }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex items-center justify-end">
                <button
                  onClick={() => setSelectedContent(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Info & Comment Input */}
              <div className="p-4">
                {/* Content Section */}
                <div className="flex gap-3 mb-2">
                  {/* Left column - Avatar + Vertical Line */}
                  <div className="flex flex-col items-center" style={{ width: '40px' }}>
                    {selectedContent.authorId?.profileImage ? (
                      <Image
                        src={selectedContent.authorId.profileImage}
                        alt={selectedContent.authorId.displayName || 'User'}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(selectedContent.authorId?.displayName || selectedContent.authorId?.twitterUsername || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Vertical line */}
                    <div className="w-0.5 bg-border flex-1 my-2" style={{ minHeight: '20px' }}></div>
                  </div>

                  {/* Right column - Content info */}
                  <div className="flex-1 min-w-0">
                    {/* Content header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{selectedContent.authorId?.displayName || 'Anonymous'}</span>
                      {selectedContent.authorId?.twitterUsername && (
                        <span className="text-muted-foreground text-xs">@{selectedContent.authorId.twitterUsername}</span>
                      )}
                    </div>

                    {/* Content title */}
                    <p className="text-sm font-medium mb-2">{selectedContent.title}</p>

                    {/* Replying to indicator */}
                    <div className="text-xs text-muted-foreground mb-2">
                      Replying to{' '}
                      <Link
                        href={`/center/profile/${selectedContent.authorId._id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{selectedContent.authorId?.twitterUsername || selectedContent.authorId?.displayName || 'user'}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Comment Input Section */}
                <TwitterReplyInput
                  value={commentText}
                  onChange={setCommentText}
                  onSubmit={handleSubmitComment}
                  isSubmitting={isSubmittingComment}
                  placeholder="Post your comment..."
                  currentUser={user}
                />
              </div>
            </div>
          </div>
        )}
    </>
  )
}
