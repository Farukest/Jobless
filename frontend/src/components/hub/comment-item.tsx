'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useReplies, useDeleteComment } from '@/hooks/use-hub'
import { getSocket } from '@/lib/socket'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface CommentItemProps {
  comment: any
  onLike?: (commentId: string) => void
  isLiked?: boolean
  contentAuthorId?: string
  contentId?: string
  onReplyClick?: (comment: any) => void
  isReply?: boolean
  depth?: number
  myReply?: any
  onMyReplyCleared?: () => void
  myRepliesMap?: Record<string, any>
  onMyReplyClearedForId?: (parentId: string) => void
}

// Dropdown Menu Component
function CommentDropdown({
  comment,
  canDelete,
  onDelete
}: {
  comment: any
  canDelete: boolean
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!canDelete) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        data-no-navigate
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-popover border border-border rounded-md shadow-lg py-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onDelete()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-muted/50 flex items-center gap-2"
            data-no-navigate
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// Sub-component for rendering a single comment's content (without wrapper)
function CommentContent({
  comment,
  onLike,
  isLiked,
  contentAuthorId,
  contentId,
  onReplyClick,
  showVerticalLine,
  isLastInThread,
  onDelete,
  canDelete
}: {
  comment: any
  onLike?: (commentId: string) => void
  isLiked?: boolean
  contentAuthorId?: string
  contentId?: string
  onReplyClick?: (comment: any) => void
  showVerticalLine?: boolean
  isLastInThread?: boolean
  onDelete?: () => void
  canDelete?: boolean
}) {
  const router = useRouter()
  const [showCopyButton, setShowCopyButton] = useState(false)
  const [copied, setCopied] = useState(false)

  const commentDetailUrl = contentId ? `/hub/content/${contentId}/comment/${comment._id}` : null

  const handleCommentClick = (e: React.MouseEvent) => {
    if (window.getSelection()?.toString()) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-navigate]')) return
    if (commentDetailUrl) router.push(commentDetailUrl)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 && commentDetailUrl) {
      e.preventDefault()
      window.open(commentDetailUrl, '_blank')
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(comment.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatTimestamp = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUserDisplay = (userData: any) => {
    if (!userData) return { name: 'Anonymous', username: null }
    return {
      name: userData.displayName || userData.twitterUsername ||
        (userData.walletAddress ? `${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}` : 'Anonymous'),
      username: userData.twitterUsername || null
    }
  }

  const { name, username } = getUserDisplay(comment.userId)
  const isContentAuthorComment = contentAuthorId && (comment.userId._id || comment.userId) === contentAuthorId

  return (
    <div
      className={`flex gap-3 ${commentDetailUrl ? 'cursor-pointer' : ''}`}
      onClick={handleCommentClick}
      onMouseDown={handleMouseDown}
    >
      {/* Avatar column with vertical line */}
      <div className="flex flex-col items-center" style={{ width: '40px' }}>
        <Link
          href={`/center/profile/${comment.userId._id || comment.userId}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {comment.userId?.profileImage ? (
            <Image
              src={comment.userId.profileImage}
              alt={name}
              width={40}
              height={40}
              className="rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
              <span className="text-sm font-semibold text-primary">
                {name[0].toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Vertical line connecting to next comment */}
        {showVerticalLine && (
          <div className="w-0.5 bg-border flex-1 mt-2" />
        )}
      </div>

      {/* Content column */}
      <div className={`flex-1 min-w-0 ${commentDetailUrl ? 'hover:bg-muted/30 -ml-1 pl-1 -mr-4 pr-4 -my-2 py-2 rounded transition-colors' : ''}`}>
        {/* Header with dropdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/center/profile/${comment.userId._id || comment.userId}`}
              className="font-semibold text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
            {username && <span className="text-muted-foreground text-xs">@{username}</span>}
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{formatTimestamp(comment.createdAt)}</span>
            {isContentAuthorComment && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">Author</span>
            )}
            {comment.isEdited && <span className="text-muted-foreground text-xs">(edited)</span>}
          </div>

          {/* Dropdown menu */}
          {canDelete && onDelete && (
            <CommentDropdown
              comment={comment}
              canDelete={canDelete}
              onDelete={onDelete}
            />
          )}
        </div>

        {/* Content with copy */}
        <div
          className="relative group"
          onMouseEnter={() => setShowCopyButton(true)}
          onMouseLeave={() => { setShowCopyButton(false); if (!copied) setCopied(false) }}
        >
          <p className="text-sm mt-1 whitespace-pre-wrap break-words select-text" data-no-navigate>
            {comment.content}
          </p>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute -right-1 top-0 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
              title="Copy"
              data-no-navigate
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-4 mt-2 ${!isLastInThread ? 'pb-4' : ''}`}>
          {onReplyClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplyClick(comment) }}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comment.repliesCount > 0 && <span className="text-xs">{comment.repliesCount}</span>}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.(comment._id) }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          >
            <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {comment.likes > 0 && <span className="text-xs">{comment.likes}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to check if a comment will have visible nested replies for current user
function willHaveNestedReplies(comment: any, myUserId: string | undefined): boolean {
  if (!myUserId) return false
  const commentUserId = comment.userId._id || comment.userId
  return commentUserId === myUserId && comment.repliesCount > 0
}

export function CommentItem({
  comment,
  onLike,
  isLiked = false,
  contentAuthorId,
  contentId,
  onReplyClick,
  isReply = false,
  depth = 0,
  myReply,
  onMyReplyCleared,
  myRepliesMap = {},
  onMyReplyClearedForId
}: CommentItemProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showReplies, setShowReplies] = useState(false)
  const [hiddenRepliesExpanded, setHiddenRepliesExpanded] = useState(false)

  const deleteComment = useDeleteComment()

  const myUserId = user?._id
  const hasReplies = comment.repliesCount > 0

  // Check if user can delete this comment
  const canDeleteComment = (commentUserId: string) => {
    if (!user) return false
    const isOwner = (commentUserId === myUserId)
    const isModerator = user.permissions?.hub?.canModerate
    const isSuperAdmin = user.permissions?.admin?.canModerateAllContent
    return isOwner || isModerator || isSuperAdmin
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    try {
      await deleteComment.mutateAsync(commentId)
      toast.success('Comment deleted')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete comment')
    }
  }

  // Auto-expand replies for top-level comments
  useEffect(() => {
    if (hasReplies && !isReply) {
      setShowReplies(true)
    }
  }, [hasReplies, isReply])

  // Fetch replies
  const { data: repliesData, isLoading: repliesLoading } = useReplies(
    showReplies ? comment._id : ''
  )

  // WebSocket for real-time replies
  useEffect(() => {
    if (!comment._id) return
    const socket = getSocket()
    socket.emit('join:comment', comment._id)

    const handleNewReply = (reply: any) => {
      if (reply.parentCommentId === comment._id) {
        queryClient.setQueryData(['replies', comment._id], (old: any) => {
          if (!old) return { success: true, count: 1, data: [reply] }
          const exists = old.data?.some((r: any) => r._id === reply._id)
          if (exists) return old
          return { ...old, count: (old.count || 0) + 1, data: [...(old.data || []), reply] }
        })
      }
    }

    socket.on('newReply', handleNewReply)
    return () => {
      socket.emit('leave:comment', comment._id)
      socket.off('newReply', handleNewReply)
    }
  }, [comment._id, queryClient])

  // Process replies according to display rules
  const processedReplies = useMemo(() => {
    const replies = repliesData?.data || []
    if (replies.length === 0) return { visible: [], hidden: [], showMoreCount: 0 }

    const isPostAuthor = (userId: string) => userId === contentAuthorId
    const isMe = (userId: string) => userId === myUserId

    const parentCommentUserId = comment.userId._id || comment.userId
    const isParentCommentByPostAuthor = isPostAuthor(parentCommentUserId)
    const isParentCommentMine = myUserId && parentCommentUserId === myUserId
    const isTopLevelComment = !comment.parentCommentId

    const sortedReplies = [...replies].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const visible: any[] = []
    const hidden: any[] = []
    let firstReplyShown = false

    sortedReplies.forEach((reply) => {
      const replyUserId = reply.userId._id || reply.userId

      // Rule: All MY replies are always visible (and count as first reply)
      if (isMe(replyUserId)) {
        visible.push(reply)
        firstReplyShown = true
        return
      }

      // For TOP-LEVEL comments only:
      if (isTopLevelComment && !firstReplyShown) {
        // Rule A: Parent by post author → first reply always shown
        if (isParentCommentByPostAuthor) {
          visible.push(reply)
          firstReplyShown = true
          return
        }
        // Rule B: Parent by someone else → first reply shown only if from post author
        if (isPostAuthor(replyUserId)) {
          visible.push(reply)
          firstReplyShown = true
          return
        }
      }

      // Rule: First reply to MY comment (any level)
      if (isParentCommentMine && !firstReplyShown) {
        visible.push(reply)
        firstReplyShown = true
        return
      }

      // Hide remaining replies
      if (isParentCommentMine || (isTopLevelComment && (isParentCommentByPostAuthor || visible.length > 0))) {
        hidden.push(reply)
      }
    })

    return { visible, hidden, showMoreCount: hidden.length }
  }, [repliesData?.data, contentAuthorId, myUserId, comment])

  const { visible: visibleReplies, hidden: hiddenReplies, showMoreCount } = processedReplies

  // Add optimistic reply
  const allVisibleReplies = useMemo(() => {
    if (myReply && !visibleReplies.some((r: any) => r._id === myReply._id)) {
      return [...visibleReplies, myReply]
    }
    return visibleReplies
  }, [visibleReplies, myReply])

  // Clear optimistic reply when server confirms
  useEffect(() => {
    if (myReply && repliesData?.data) {
      const existsInServer = repliesData.data.some((r: any) => r._id === myReply._id)
      if (existsInServer && onMyReplyCleared) onMyReplyCleared()
    }
  }, [myReply, repliesData?.data, onMyReplyCleared])

  const hasVisibleReplies = allVisibleReplies.length > 0
  const commentUserId = comment.userId._id || comment.userId

  return (
    <div className={`${!isReply ? 'border-b border-border' : ''}`}>
      <div className="p-4">
        {/* Parent comment */}
        <CommentContent
          comment={comment}
          onLike={onLike}
          isLiked={isLiked}
          contentAuthorId={contentAuthorId}
          contentId={contentId}
          onReplyClick={onReplyClick}
          showVerticalLine={hasVisibleReplies}
          isLastInThread={!hasVisibleReplies}
          canDelete={canDeleteComment(commentUserId)}
          onDelete={() => handleDeleteComment(comment._id)}
        />

        {/* Visible replies */}
        {showReplies && (
          <>
            {repliesLoading ? (
              <div className="py-4 flex justify-center ml-[52px]">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {/* First: Render all visible direct replies (without nested yet) */}
                {allVisibleReplies.map((reply: any, index: number) => {
                  const replyIsLiked = user && reply.likedBy?.includes(user._id)
                  const isLastVisible = index === allVisibleReplies.length - 1
                  const hasMoreToShow = showMoreCount > 0 // Hidden replies exist (collapsed or expanded)
                  const hasNestedReplies = willHaveNestedReplies(reply, myUserId)
                  // Show line if: not last, OR has more replies (hidden or shown), OR has nested replies
                  const shouldShowLine = !isLastVisible || hasMoreToShow || hasNestedReplies
                  const replyUserId = reply.userId._id || reply.userId
                  
                  return (
                    <CommentContent
                      key={reply._id}
                      comment={reply}
                      onLike={onLike}
                      isLiked={replyIsLiked}
                      contentAuthorId={contentAuthorId}
                      contentId={contentId}
                      onReplyClick={onReplyClick}
                      showVerticalLine={shouldShowLine}
                      isLastInThread={!shouldShowLine}
                      canDelete={canDeleteComment(replyUserId)}
                      onDelete={() => handleDeleteComment(reply._id)}
                    />
                  )
                })}

                {/* Second: Show more button for hidden direct replies */}
                {showMoreCount > 0 && !hiddenRepliesExpanded && (
                  <div className="flex gap-3">
                    {/* Vertical line column - connects to nested replies below */}
                    <div className="flex flex-col items-center" style={{ width: '40px' }}>
                      <div className="flex flex-col items-center justify-center gap-1 py-2">
                        <div className="w-0.5 h-1.5 bg-border rounded-full" />
                        <div className="w-0.5 h-1.5 bg-border rounded-full" />
                        <div className="w-0.5 h-1.5 bg-border rounded-full" />
                      </div>
                      {/* Continue line if there are nested replies */}
                      {allVisibleReplies.some((r: any) => willHaveNestedReplies(r, myUserId)) && (
                        <div className="w-0.5 bg-border flex-1" />
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setHiddenRepliesExpanded(true) }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="py-2 text-sm text-primary hover:underline"
                    >
                      Show {showMoreCount} more {showMoreCount === 1 ? 'reply' : 'replies'}
                    </button>
                  </div>
                )}

                {/* Third: Hidden replies when expanded */}
                {hiddenRepliesExpanded && hiddenReplies.map((reply: any, index: number) => {
                  const replyIsLiked = user && reply.likedBy?.includes(user._id)
                  const isLast = index === hiddenReplies.length - 1
                  const replyUserId = reply.userId._id || reply.userId
                  // Check if any visible reply has nested replies
                  const anyVisibleHasNested = allVisibleReplies.some((r: any) => willHaveNestedReplies(r, myUserId))
                  return (
                    <CommentContent
                      key={reply._id}
                      comment={reply}
                      onLike={onLike}
                      isLiked={replyIsLiked}
                      contentAuthorId={contentAuthorId}
                      contentId={contentId}
                      onReplyClick={onReplyClick}
                      showVerticalLine={!isLast || anyVisibleHasNested}
                      isLastInThread={isLast && !anyVisibleHasNested}
                      canDelete={canDeleteComment(replyUserId)}
                      onDelete={() => handleDeleteComment(reply._id)}
                    />
                  )
                })}

                {/* Fourth: Nested replies for visible replies (after all direct replies) */}
                {allVisibleReplies.map((reply: any, index: number) => {
                  const isLastInList = index === allVisibleReplies.length - 1 && 
                    (hiddenRepliesExpanded ? hiddenReplies.length === 0 : showMoreCount === 0)
                  
                  return (
                    <NestedReplies
                      key={`nested-${reply._id}`}
                      comment={reply}
                      onLike={onLike}
                      contentAuthorId={contentAuthorId}
                      contentId={contentId}
                      onReplyClick={onReplyClick}
                      myUserId={myUserId}
                      user={user}
                      myRepliesMap={myRepliesMap}
                      onMyReplyClearedForId={onMyReplyClearedForId}
                      isLastInParentList={isLastInList}
                      canDeleteComment={canDeleteComment}
                      onDeleteComment={handleDeleteComment}
                    />
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Nested replies component - handles deeper levels
 */
function NestedReplies({
  comment,
  onLike,
  contentAuthorId,
  contentId,
  onReplyClick,
  myUserId,
  user,
  myRepliesMap,
  onMyReplyClearedForId,
  isLastInParentList = false,
  canDeleteComment,
  onDeleteComment
}: {
  comment: any
  onLike?: (commentId: string) => void
  contentAuthorId?: string
  contentId?: string
  onReplyClick?: (comment: any) => void
  myUserId?: string
  user?: any
  myRepliesMap?: Record<string, any>
  onMyReplyClearedForId?: (parentId: string) => void
  isLastInParentList?: boolean
  canDeleteComment: (userId: string) => boolean
  onDeleteComment: (commentId: string) => void
}) {
  const queryClient = useQueryClient()
  const [hiddenRepliesExpanded, setHiddenRepliesExpanded] = useState(false)

  const parentCommentUserId = comment.userId._id || comment.userId
  const isParentCommentMine = myUserId && parentCommentUserId === myUserId
  const hasReplies = comment.repliesCount > 0

  // Only fetch if parent comment is mine
  const shouldFetch = hasReplies && isParentCommentMine

  const { data: repliesData, isLoading } = useReplies(shouldFetch ? comment._id : '')

  // WebSocket
  useEffect(() => {
    if (!comment._id || !isParentCommentMine) return
    const socket = getSocket()
    socket.emit('join:comment', comment._id)

    const handleNewReply = (reply: any) => {
      if (reply.parentCommentId === comment._id) {
        queryClient.setQueryData(['replies', comment._id], (old: any) => {
          if (!old) return { success: true, count: 1, data: [reply] }
          const exists = old.data?.some((r: any) => r._id === reply._id)
          if (exists) return old
          return { ...old, count: (old.count || 0) + 1, data: [...(old.data || []), reply] }
        })
      }
    }

    socket.on('newReply', handleNewReply)
    return () => {
      socket.emit('leave:comment', comment._id)
      socket.off('newReply', handleNewReply)
    }
  }, [comment._id, queryClient, isParentCommentMine])

  const processedReplies = useMemo(() => {
    if (!isParentCommentMine) {
      return { visible: [], hidden: [], showMoreCount: 0 }
    }

    const replies = repliesData?.data || []
    if (replies.length === 0) return { visible: [], hidden: [], showMoreCount: 0 }

    const isMe = (userId: string) => userId === myUserId

    const sortedReplies = [...replies].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const visible: any[] = []
    const hidden: any[] = []
    let firstReplyShown = false

    sortedReplies.forEach((reply) => {
      const replyUserId = reply.userId._id || reply.userId

      if (isMe(replyUserId)) {
        visible.push(reply)
        firstReplyShown = true
        return
      }

      if (!firstReplyShown) {
        visible.push(reply)
        firstReplyShown = true
        return
      }

      hidden.push(reply)
    })

    return { visible, hidden, showMoreCount: hidden.length }
  }, [repliesData?.data, myUserId, isParentCommentMine])

  const { visible: visibleReplies, hidden: hiddenReplies, showMoreCount } = processedReplies

  // Add optimistic reply
  const myReply = myRepliesMap?.[comment._id]
  const allVisibleReplies = useMemo(() => {
    if (myReply && !visibleReplies.some((r: any) => r._id === myReply._id)) {
      return [...visibleReplies, myReply]
    }
    return visibleReplies
  }, [visibleReplies, myReply])

  useEffect(() => {
    if (myReply && repliesData?.data) {
      const existsInServer = repliesData.data.some((r: any) => r._id === myReply._id)
      if (existsInServer && onMyReplyClearedForId) onMyReplyClearedForId(comment._id)
    }
  }, [myReply, repliesData?.data, onMyReplyClearedForId, comment._id])

  if (!isParentCommentMine || allVisibleReplies.length === 0) return null

  return (
    <>
      {isLoading ? (
        <div className="py-4 flex justify-center ml-[52px]">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {allVisibleReplies.map((reply: any, index: number) => {
            const replyIsLiked = user && reply.likedBy?.includes(user._id)
            const isLastInList = index === allVisibleReplies.length - 1 && showMoreCount === 0
            const hasNestedReplies = willHaveNestedReplies(reply, myUserId)
            const shouldShowLine = !isLastInList || hasNestedReplies
            const isActuallyLast = isLastInList && !hasNestedReplies && isLastInParentList
            const replyUserId = reply.userId._id || reply.userId
            
            return (
              <div key={reply._id}>
                <CommentContent
                  comment={reply}
                  onLike={onLike}
                  isLiked={replyIsLiked}
                  contentAuthorId={contentAuthorId}
                  contentId={contentId}
                  onReplyClick={onReplyClick}
                  showVerticalLine={shouldShowLine}
                  isLastInThread={isActuallyLast}
                  canDelete={canDeleteComment(replyUserId)}
                  onDelete={() => onDeleteComment(reply._id)}
                />
                <NestedReplies
                  comment={reply}
                  onLike={onLike}
                  contentAuthorId={contentAuthorId}
                  contentId={contentId}
                  onReplyClick={onReplyClick}
                  myUserId={myUserId}
                  user={user}
                  myRepliesMap={myRepliesMap}
                  onMyReplyClearedForId={onMyReplyClearedForId}
                  isLastInParentList={isLastInList && isLastInParentList}
                  canDeleteComment={canDeleteComment}
                  onDeleteComment={onDeleteComment}
                />
              </div>
            )
          })}

          {showMoreCount > 0 && !hiddenRepliesExpanded && (
            <div className="flex gap-3">
              {/* Dotted vertical line column */}
              <div className="flex flex-col items-center justify-center gap-1" style={{ width: '40px' }}>
                <div className="w-0.5 h-1.5 bg-border rounded-full" />
                <div className="w-0.5 h-1.5 bg-border rounded-full" />
                <div className="w-0.5 h-1.5 bg-border rounded-full" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setHiddenRepliesExpanded(true) }}
                className="py-2 text-sm text-primary hover:underline"
              >
                Show {showMoreCount} more {showMoreCount === 1 ? 'reply' : 'replies'}
              </button>
            </div>
          )}

          {hiddenRepliesExpanded && hiddenReplies.map((reply: any, index: number) => {
            const replyIsLiked = user && reply.likedBy?.includes(user._id)
            const isLast = index === hiddenReplies.length - 1
            const replyUserId = reply.userId._id || reply.userId
            return (
              <CommentContent
                key={reply._id}
                comment={reply}
                onLike={onLike}
                isLiked={replyIsLiked}
                contentAuthorId={contentAuthorId}
                contentId={contentId}
                onReplyClick={onReplyClick}
                showVerticalLine={!isLast}
                isLastInThread={isLast}
                canDelete={canDeleteComment(replyUserId)}
                onDelete={() => onDeleteComment(reply._id)}
              />
            )
          })}
        </>
      )}
    </>
  )
}
