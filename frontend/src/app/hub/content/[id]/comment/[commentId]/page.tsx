'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useCommentById, useReplies, useCreateComment, useToggleCommentLike } from '@/hooks/use-hub'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { CommentItem } from '@/components/hub/comment-item'
import { TwitterReplyInput } from '@/components/hub/twitter-reply-input'
import Image from 'next/image'
import { getSocket } from '@/lib/socket'
import { useQueryClient } from '@tanstack/react-query'

export default function CommentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const commentId = params.commentId as string
  const contentId = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: commentData, isLoading: commentLoading, error: commentError } = useCommentById(commentId)
  const { data: repliesData, isLoading: repliesLoading } = useReplies(commentId)
  const { mutate: createComment, isPending: isSubmittingComment } = useCreateComment()
  const { mutate: toggleCommentLike } = useToggleCommentLike()
  const [replyText, setReplyText] = useState('')
  const [replyModalComment, setReplyModalComment] = useState<any>(null)
  const [replyModalText, setReplyModalText] = useState('')
  const [isModalCommentDeleted, setIsModalCommentDeleted] = useState(false)
  const queryClient = useQueryClient()

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Socket.IO real-time updates for replies
  useEffect(() => {
    if (!commentId) return

    const socket = getSocket()

    // Join comment room
    socket.emit('join:comment', commentId)
    console.log('[Socket] Joined comment room:', commentId)

    // Listen for new replies
    const handleNewReply = (reply: any) => {
      console.log('[Socket] New reply received:', reply)

      // Add reply to replies list
      queryClient.setQueryData(['replies', commentId], (old: any) => {
        if (!old) {
          return {
            success: true,
            count: 1,
            data: [reply]
          }
        }
        return {
          ...old,
          count: (old.count || 0) + 1,
          data: [reply, ...(old.data || [])]
        }
      })

      // Increment parent comment's repliesCount
      queryClient.setQueryData(['comment', commentId], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            repliesCount: (old.data.repliesCount || 0) + 1
          }
        }
      })
    }

    // Listen for comment like updates (for parent comment and replies)
    const handleCommentLikeUpdate = (data: any) => {
      console.log('[Socket] Comment like update received:', data)

      // Update parent comment if it's the one being liked
      if (data.commentId === commentId) {
        queryClient.setQueryData(['comment', commentId], (old: any) => {
          if (!old?.data) return old
          return {
            ...old,
            data: {
              ...old.data,
              likes: data.likes,
              likedBy: data.isLiked
                ? [...(old.data.likedBy || []), data.userId]
                : (old.data.likedBy || []).filter((uid: string) => uid !== data.userId)
            }
          }
        })
      }

      // Update reply in replies list
      queryClient.setQueryData(['replies', commentId], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((reply: any) =>
            reply._id === data.commentId
              ? {
                  ...reply,
                  likes: data.likes,
                  likedBy: data.isLiked
                    ? [...(reply.likedBy || []), data.userId]
                    : (reply.likedBy || []).filter((uid: string) => uid !== data.userId)
                }
              : reply
          )
        }
      })
    }

    // Listen for comment deletions
    const handleCommentDeleted = (data: any) => {
      console.log('[Socket] Comment deleted:', data)
      const { commentId: deletedId, parentCommentId: deletedParentId, deletedReplies } = data

      // If the parent comment (the one we're viewing) was deleted, redirect to content page
      if (deletedId === commentId) {
        console.log('[Socket] Parent comment deleted, redirecting to content page')
        router.push(`/hub/content/${contentId}`)
        return
      }

      // If a reply was deleted, remove it from the replies list
      queryClient.setQueryData(['replies', commentId], (old: any) => {
        if (!old) return old

        const allDeletedIds = [deletedId, ...deletedReplies]

        return {
          ...old,
          count: Math.max(0, old.count - allDeletedIds.filter((id: string) =>
            old.data.some((reply: any) => reply._id === id)
          ).length),
          data: old.data.filter((reply: any) => !allDeletedIds.includes(reply._id))
        }
      })

      // Update parent comment's reply count
      queryClient.setQueryData(['comment', commentId], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            repliesCount: Math.max(0, old.data.repliesCount - 1)
          }
        }
      })

      // If modal is open and the modal comment was deleted, show warning
      if (replyModalComment && deletedId === replyModalComment._id) {
        console.log('[Socket] Modal comment deleted, showing warning')
        setIsModalCommentDeleted(true)
      }
    }

    socket.on('newReply', handleNewReply)
    socket.on('commentLikeUpdate', handleCommentLikeUpdate)
    socket.on('commentDeleted', handleCommentDeleted)

    console.log('[Socket] Listeners registered. Testing...')

    // Force test - emit a fake event to ourselves
    setTimeout(() => {
      console.log('[Socket] Testing event system...')
      socket.emit('test')
    }, 1000)

    // Cleanup
    return () => {
      socket.emit('leave:comment', commentId)
      socket.off('newReply', handleNewReply)
      socket.off('commentLikeUpdate', handleCommentLikeUpdate)
      socket.off('commentDeleted', handleCommentDeleted)
      console.log('[Socket] Left comment room:', commentId)
    }
  }, [commentId, queryClient, replyModalComment, router, contentId])

  const handleSubmitReply = () => {
    if (!replyText.trim() || !commentData?.data) return

    createComment({
      contentType: commentData.data.contentType,
      contentId: commentData.data.contentId,
      content: replyText.trim(),
      parentCommentId: commentId
    }, {
      onSuccess: () => {
        setReplyText('')
        // Reply will appear via WebSocket real-time update
      }
    })
  }

  const handleCommentLike = (id: string) => {
    toggleCommentLike(id)
  }

  const handleReplyClick = (reply: any) => {
    setReplyModalComment(reply)
    setReplyModalText('')
    setIsModalCommentDeleted(false) // Reset deletion warning when opening modal
  }

  // Get all unique users in the reply chain with their IDs
  const getReplyingToUsers = (reply: any) => {
    const usersMap = new Map<string, string>() // username -> userId

    // Get username or displayName or wallet for parent comment author
    const parentCommentAuthorUsername =
      comment?.userId?.twitterUsername ||
      comment?.userId?.displayName ||
      (comment?.userId?.walletAddress ? `${comment.userId.walletAddress.slice(0, 6)}...${comment.userId.walletAddress.slice(-4)}` : null)

    const replyAuthorUsername =
      reply.userId?.twitterUsername ||
      reply.userId?.displayName ||
      (reply.userId?.walletAddress ? `${reply.userId.walletAddress.slice(0, 6)}...${reply.userId.walletAddress.slice(-4)}` : null)

    // Add parent comment author (if different from reply author)
    if (parentCommentAuthorUsername && parentCommentAuthorUsername !== replyAuthorUsername) {
      usersMap.set(parentCommentAuthorUsername, comment.userId._id)
    }

    // Always add reply author
    if (replyAuthorUsername) {
      usersMap.set(replyAuthorUsername, reply.userId._id)
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

    // If list is empty after filtering (replying to own comment), show reply author
    if (usersMap.size === 0 && replyAuthorUsername) {
      usersMap.set(replyAuthorUsername, reply.userId._id)
    }

    // Return array of {username, userId} objects
    return Array.from(usersMap.entries()).map(([username, userId]) => ({
      username,
      userId
    }))
  }

  const handleModalReplySubmit = () => {
    // Prevent posting if comment was deleted
    if (isModalCommentDeleted) {
      console.log('[Modal] Cannot reply to deleted comment')
      return
    }

    if (!replyModalText.trim() || !replyModalComment || !commentData?.data) return

    createComment({
      contentType: commentData.data.contentType,
      contentId: commentData.data.contentId,
      content: replyModalText.trim(),
      parentCommentId: replyModalComment._id
    }, {
      onSuccess: () => {
        setReplyModalText('')
        setReplyModalComment(null)
        setIsModalCommentDeleted(false)
        // Reply will appear via WebSocket real-time update
      }
    })
  }

  if (authLoading || commentLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (commentError || !commentData?.data) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Comment Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The comment you're looking for doesn't exist or has been removed.
              </p>
              <Link
                href={`/hub/content/${contentId}`}
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Content
              </Link>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const comment = commentData.data

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto max-w-2xl">
          {/* Back Button */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
            <Link
              href={`/hub/content/${contentId}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {/* Parent Comment */}
          <CommentItem
            comment={comment}
            onLike={handleCommentLike}
            isLiked={user && comment.likedBy?.includes(user._id)}
          />

          {/* Reply Input */}
          <div className="border-t border-border">
            <div className="p-4 border-b border-border">
              <TwitterReplyInput
                value={replyText}
                onChange={setReplyText}
                onSubmit={handleSubmitReply}
                isSubmitting={isSubmittingComment}
                placeholder="Post your reply..."
                maxLength={500}
              />
            </div>

            {/* Replies List */}
            {repliesLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : repliesData?.data && repliesData.data.length > 0 ? (
              <div>
                {repliesData.data.map((reply: any) => {
                  const isLiked = user && reply.likedBy?.includes(user._id)
                  const isAuthorReply = reply.userId._id === comment.userId._id
                  return (
                    <div
                      key={reply._id}
                      className={isAuthorReply ? 'border-l-2 border-primary' : ''}
                    >
                      <CommentItem
                        comment={reply}
                        onLike={handleCommentLike}
                        onReplyClick={() => handleReplyClick(reply)}
                        isLiked={isLiked}
                        contentAuthorId={comment.userId._id}
                      />
                    </div>
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
                <p className="text-muted-foreground text-sm">No replies yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to reply!
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
              className={`bg-card rounded-xl border max-w-xl w-full max-h-[80vh] overflow-y-auto ${
                isModalCommentDeleted ? 'border-red-500' : 'border-border'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                // Focus textarea when clicking anywhere in modal (only if not deleted)
                if (!isModalCommentDeleted) {
                  const textarea = e.currentTarget.querySelector('textarea')
                  if (textarea && !window.getSelection()?.toString()) {
                    textarea.focus()
                  }
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

              {/* Deleted Comment Warning */}
              {isModalCommentDeleted && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-red-500 font-medium">
                      This comment has been deleted
                    </p>
                  </div>
                  <p className="text-xs text-red-500/70 mt-1 ml-7">
                    You cannot reply to a deleted comment
                  </p>
                </div>
              )}

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
                  isSubmitting={isSubmittingComment || isModalCommentDeleted}
                  placeholder={isModalCommentDeleted ? "Cannot reply to deleted comment" : "Post your reply..."}
                  maxLength={500}
                  autoFocus={!isModalCommentDeleted}
                  disabled={isModalCommentDeleted}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
