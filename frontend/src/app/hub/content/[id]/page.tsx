'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useContent, useToggleLike, useToggleBookmark, useComments, useCreateComment, useToggleCommentLike } from '@/hooks/use-hub'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { TwitterStyleContent } from '@/components/hub/twitter-style-content'
import { CommentItem } from '@/components/hub/comment-item'
import { TwitterReplyInput } from '@/components/hub/twitter-reply-input'
import { getSocket } from '@/lib/socket'
import { useQueryClient } from '@tanstack/react-query'

export default function ContentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading, error } = useContent(id)
  const { mutate: toggleLike, isPending: isLiking } = useToggleLike()
  const { mutate: toggleBookmark, isPending: isBookmarking } = useToggleBookmark()
  const { data: commentsData, isLoading: commentsLoading } = useComments('hub_content', id)
  const { mutate: createComment, isPending: isSubmittingComment } = useCreateComment()
  const { mutate: toggleCommentLike } = useToggleCommentLike()
  const [commentText, setCommentText] = useState('')
  const [replyModalComment, setReplyModalComment] = useState<any>(null)
  const [replyModalText, setReplyModalText] = useState('')
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = getSocket()

    // Join content room
    socket.emit('join:content', id)
    console.log('[Socket] Joined content room:', id)

    // Listen for new comments
    const handleNewComment = (comment: any) => {
      console.log('[Socket] New comment received:', comment)
      queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => {
        if (!old) {
          // Initialize if no data exists yet
          return {
            success: true,
            count: 1,
            total: 1,
            data: [comment]
          }
        }
        return {
          ...old,
          count: (old.count || 0) + 1,
          total: (old.total || 0) + 1,
          data: [comment, ...(old.data || [])]
        }
      })
    }

    // Listen for like updates
    const handleLikeUpdate = (data: any) => {
      console.log('[Socket] Like update received:', data)
      queryClient.setQueryData(['hub', 'content', id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            likesCount: data.likesCount,
            isLiked: data.isLiked
          }
        }
      })
    }

    // Listen for bookmark updates
    const handleBookmarkUpdate = (data: any) => {
      console.log('[Socket] Bookmark update received:', data)
      queryClient.setQueryData(['hub', 'content', id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            bookmarksCount: data.bookmarksCount,
            isBookmarked: data.isBookmarked
          }
        }
      })
    }

    // Listen for comment like updates
    const handleCommentLikeUpdate = (data: any) => {
      console.log('[Socket] Comment like update received:', data)
      queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((comment: any) =>
            comment._id === data.commentId
              ? { ...comment, likes: data.likes, likedBy: data.isLiked ? [...(comment.likedBy || []), data.userId] : (comment.likedBy || []).filter((uid: string) => uid !== data.userId) }
              : comment
          )
        }
      })
    }

    // Listen for new replies (to update comment reply count)
    const handleNewReply = (reply: any) => {
      console.log('[Socket] New reply received:', reply)
      if (reply.parentCommentId) {
        // Increment parent comment's repliesCount
        queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((comment: any) =>
              comment._id === reply.parentCommentId
                ? { ...comment, repliesCount: (comment.repliesCount || 0) + 1 }
                : comment
            )
          }
        })
      }
    }

    // Listen for comment deletions
    const handleCommentDeleted = (data: any) => {
      console.log('[Socket] Comment deleted:', data)
      const { commentId, parentCommentId, deletedReplies } = data

      queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => {
        if (!old) return old

        // Remove the deleted comment and all its replies from cache
        const allDeletedIds = [commentId, ...deletedReplies]

        return {
          ...old,
          count: Math.max(0, old.count - allDeletedIds.length),
          total: Math.max(0, old.total - allDeletedIds.length),
          data: old.data.filter((comment: any) => !allDeletedIds.includes(comment._id))
        }
      })

      // Update content's comment count
      queryClient.setQueryData(['hub', 'content', id], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            commentsCount: Math.max(0, old.data.commentsCount - 1)
          }
        }
      })
    }

    socket.on('newComment', handleNewComment)
    socket.on('likeUpdate', handleLikeUpdate)
    socket.on('bookmarkUpdate', handleBookmarkUpdate)
    socket.on('commentLikeUpdate', handleCommentLikeUpdate)
    socket.on('newReply', handleNewReply)
    socket.on('commentDeleted', handleCommentDeleted)

    console.log('[Socket] Event listeners registered for content:', id)

    // Test listener
    socket.onAny((eventName, ...args) => {
      console.log('[Socket] ANY EVENT:', eventName, args)
    })

    // Cleanup
    return () => {
      socket.emit('leave:content', id)
      socket.off('newComment', handleNewComment)
      socket.off('likeUpdate', handleLikeUpdate)
      socket.off('bookmarkUpdate', handleBookmarkUpdate)
      socket.off('commentLikeUpdate', handleCommentLikeUpdate)
      socket.off('newReply', handleNewReply)
      socket.off('commentDeleted', handleCommentDeleted)
      socket.offAny()
      console.log('[Socket] Left content room:', id)
    }
  }, [id, queryClient])

  const handleLike = () => {
    toggleLike(id)
  }

  const handleBookmark = () => {
    toggleBookmark(id)
  }

  const handleSubmitComment = () => {
    if (!commentText.trim()) return

    createComment({
      contentType: 'hub_content',
      contentId: id,
      content: commentText.trim()
    }, {
      onSuccess: () => {
        setCommentText('')
      }
    })
  }

  const handleCommentLike = (commentId: string) => {
    toggleCommentLike(commentId)
  }

  const handleReplyClick = (comment: any) => {
    setReplyModalComment(comment)
    setReplyModalText('')
  }

  // Get all unique users in the reply chain with their IDs
  const getReplyingToUsers = (comment: any) => {
    const usersMap = new Map<string, string>() // username -> userId

    // Get username or displayName or wallet for content author
    const contentAuthorUsername =
      content?.authorId?.twitterUsername ||
      content?.authorId?.displayName ||
      (content?.authorId?.walletAddress ? `${content.authorId.walletAddress.slice(0, 6)}...${content.authorId.walletAddress.slice(-4)}` : null)

    const commentAuthorUsername =
      comment.userId?.twitterUsername ||
      comment.userId?.displayName ||
      (comment.userId?.walletAddress ? `${comment.userId.walletAddress.slice(0, 6)}...${comment.userId.walletAddress.slice(-4)}` : null)

    // Add content author (if different from comment author)
    if (contentAuthorUsername && contentAuthorUsername !== commentAuthorUsername) {
      usersMap.set(contentAuthorUsername, content.authorId._id)
    }

    // Always add parent comment author
    if (commentAuthorUsername) {
      usersMap.set(commentAuthorUsername, comment.userId._id)
    }

    // Remove current user from the list
    const currentUsername =
      user?.twitterUsername ||
      user?.displayName ||
      (user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : null)

    // Filter out current user
    if (currentUsername) {
      usersMap.delete(currentUsername)
    }

    // If list is empty after filtering (replying to own comment), show comment author
    if (usersMap.size === 0 && commentAuthorUsername) {
      usersMap.set(commentAuthorUsername, comment.userId._id)
    }

    // Return array of {username, userId} objects
    return Array.from(usersMap.entries()).map(([username, userId]) => ({
      username,
      userId
    }))
  }

  const handleModalReplySubmit = () => {
    if (!replyModalText.trim() || !replyModalComment) return

    createComment({
      contentType: 'hub_content',
      contentId: id,
      content: replyModalText.trim(),
      parentCommentId: replyModalComment._id
    }, {
      onSuccess: () => {
        setReplyModalText('')
        setReplyModalComment(null)
      }
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
              <Link
                href="/hub"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-block"
              >
                Back to Hub
              </Link>
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
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto max-w-2xl">
          {/* Back Button */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
            <Link
              href="/hub"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {/* Twitter-Style Content */}
          <TwitterStyleContent
            content={content}
            onLike={handleLike}
            onBookmark={handleBookmark}
            showFullContent={true}
          />

          {/* Edit Button (if author) */}
          {isAuthor && (
            <div className="border-b border-border p-4">
              <button
                onClick={() => router.push(`/hub/content/${id}/edit`)}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Edit Content
              </button>
            </div>
          )}

          {/* Comments Section - Twitter Style */}
          <div className="border-t border-border">
            {/* Comment Input */}
            <div className="p-4 border-b border-border">
              <TwitterReplyInput
                value={commentText}
                onChange={setCommentText}
                onSubmit={handleSubmitComment}
                isSubmitting={isSubmittingComment}
                placeholder="Post your reply..."
                maxLength={500}
              />
            </div>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : commentsData?.data && commentsData.data.length > 0 ? (
              <div>
                {commentsData.data.map((comment: any) => {
                  const isLiked = user && comment.likedBy?.includes(user._id)
                  return (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      onLike={handleCommentLike}
                      commentDetailUrl={`/hub/content/${id}/comment/${comment._id}`}
                      onReplyClick={handleReplyClick}
                      isLiked={isLiked}
                      contentAuthorId={content.authorId._id}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground mb-3"
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
                <p className="text-muted-foreground text-sm">No comments yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reply Modal */}
        {replyModalComment && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setReplyModalComment(null)}
          >
            <div
              className="bg-card rounded-xl border border-border max-w-xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => {
                e.stopPropagation()
                // Focus textarea when clicking anywhere in modal
                const textarea = e.currentTarget.querySelector('textarea')
                if (textarea && !window.getSelection()?.toString()) {
                  textarea.focus()
                }
              }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex items-center justify-end">
                <button
                  onClick={() => setReplyModalComment(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Parent Comment & Reply Input - Twitter Style */}
              <div className="p-4">
                {/* Parent Comment Section */}
                <div className="flex gap-3 mb-2">
                  {/* Left column - Avatar + Vertical Line */}
                  <div className="flex flex-col items-center" style={{ width: '40px' }}>
                    {replyModalComment.userId?.profileImage ? (
                      <Image
                        src={replyModalComment.userId.profileImage}
                        alt={replyModalComment.userId.displayName || 'User'}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(replyModalComment.userId?.displayName || replyModalComment.userId?.twitterUsername || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Vertical line */}
                    <div className="w-0.5 bg-border flex-1 my-2" style={{ minHeight: '20px' }}></div>
                  </div>

                  {/* Right column - Comment content */}
                  <div className="flex-1 min-w-0">
                    {/* Parent comment header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{replyModalComment.userId?.displayName || 'Anonymous'}</span>
                      {replyModalComment.userId?.twitterUsername && (
                        <span className="text-muted-foreground text-xs">@{replyModalComment.userId.twitterUsername}</span>
                      )}
                    </div>

                    {/* Parent comment content */}
                    <p className="text-sm whitespace-pre-wrap mb-3">{replyModalComment.content}</p>

                    {/* Replying to indicator */}
                    {(() => {
                      const users = getReplyingToUsers(replyModalComment)
                      if (users.length === 0) return null

                      return (
                        <div className="text-xs text-muted-foreground mb-2">
                          Replying to{' '}
                          {users.map((userObj, index) => (
                            <span key={userObj.username}>
                              <span
                                className="text-primary hover:underline cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  router.push(`/center/profile/${userObj.userId}`)
                                }}
                              >
                                @{userObj.username}
                              </span>
                              {index < users.length - 2 && ', '}
                              {index === users.length - 2 && ' and '}
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Reply Input Section */}
                <TwitterReplyInput
                  value={replyModalText}
                  onChange={setReplyModalText}
                  onSubmit={handleModalReplySubmit}
                  isSubmitting={isSubmittingComment}
                  placeholder="Post your reply..."
                  maxLength={500}
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
