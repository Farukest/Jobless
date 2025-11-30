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

// Types for flat list rendering
type FlatItem = 
  | { type: 'comment'; comment: any; isLiked: boolean; canDelete: boolean; hasReplies: boolean; parentId: string }
  | { type: 'show-more'; count: number; onClick: () => void; parentId: string }

// Dropdown Menu Component
function CommentDropdown({
  canDelete,
  onDelete
}: {
  canDelete: boolean
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!canDelete) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
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
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete() }}
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

// Single comment row component
function CommentRow({
  comment,
  onLike,
  isLiked,
  contentAuthorId,
  contentId,
  onReplyClick,
  showTopLine,
  showBottomLine,
  onDelete,
  canDelete
}: {
  comment: any
  onLike?: (commentId: string) => void
  isLiked?: boolean
  contentAuthorId?: string
  contentId?: string
  onReplyClick?: (comment: any) => void
  showTopLine: boolean
  showBottomLine: boolean
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
      className={`${commentDetailUrl ? 'cursor-pointer' : ''}`}
      onClick={handleCommentClick}
      onMouseDown={handleMouseDown}
    >
      {/* Top connector line */}
      <div className="flex">
        <div style={{ width: '40px' }} className="flex justify-center">
          <div className={`w-0.5 h-2 ${showTopLine ? 'bg-border' : 'bg-transparent'}`} />
        </div>
      </div>

      {/* Main content row */}
      <div className="flex gap-3">
        {/* Avatar + bottom line column */}
        <div className="flex flex-col items-center" style={{ width: '40px' }}>
          <Link
            href={`/center/profile/${comment.userId._id || comment.userId}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-shrink-0"
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
          {showBottomLine && <div className="w-0.5 bg-border flex-1 mt-1" />}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
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
            </div>
            {canDelete && onDelete && <CommentDropdown canDelete={canDelete} onDelete={onDelete} />}
          </div>

          {/* Content */}
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
          <div className={`flex items-center gap-4 mt-2 ${showBottomLine ? 'pb-4' : ''}`}>
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
    </div>
  )
}

// Show more button row
function ShowMoreRow({ count, onClick, hasNextItem }: { count: number; onClick: () => void; hasNextItem: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center" style={{ width: '40px' }}>
        <div className="w-0.5 h-2 bg-border" />
        <div className="flex flex-col items-center justify-center gap-1 py-1">
          <div className="w-0.5 h-1.5 bg-border rounded-full" />
          <div className="w-0.5 h-1.5 bg-border rounded-full" />
          <div className="w-0.5 h-1.5 bg-border rounded-full" />
        </div>
        {hasNextItem && <div className="w-0.5 bg-border flex-1" />}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onMouseDown={(e) => e.stopPropagation()}
        className="py-2 text-sm text-primary hover:underline"
      >
        Show {count} more {count === 1 ? 'reply' : 'replies'}
      </button>
    </div>
  )
}

/**
 * VISIBILITY RULES - Clean filter-based approach
 * 
 * Rules (in priority order):
 * 1. MY replies → ALWAYS visible (doesn't consume "first slot")
 * 2. First slot for others (only applies when parent is mine OR top-level):
 *    - If parent is MY comment → first reply from anyone
 *    - If top-level & parent is by post author → first reply from anyone
 *    - If top-level & parent is by someone else → first reply only if from post author
 * 3. Hidden (show more): remaining replies when parent is mine or top-level with visible replies
 * 4. Non-top-level & parent is NOT mine → ONLY my replies visible, nothing else
 */
function processRepliesVisibility(
  replies: any[],
  myUserId: string | undefined,
  contentAuthorId: string | undefined,
  parentCommentUserId: string,
  isTopLevel: boolean
): { visible: any[]; hidden: any[] } {
  if (replies.length === 0) return { visible: [], hidden: [] }

  // Helper functions
  const getUserId = (r: any) => r.userId._id || r.userId
  const isMe = (userId: string) => myUserId && userId === myUserId
  const isPostAuthor = (userId: string) => userId === contentAuthorId
  const isParentByPostAuthor = isPostAuthor(parentCommentUserId)
  const isParentMine = isMe(parentCommentUserId)

  // Sort by date
  const sorted = [...replies].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // CASE: Non-top-level AND parent is NOT mine → only show MY replies, nothing else
  if (!isTopLevel && !isParentMine) {
    const myReplies = sorted.filter(r => isMe(getUserId(r)))
    console.log('[VISIBILITY] Non-top-level, not my parent. myUserId:', myUserId, 'parentUserId:', parentCommentUserId, 'myReplies:', myReplies.length)
    return { visible: myReplies, hidden: [] }
  }

  // CASE: Top-level OR parent is mine → apply full visibility rules
  
  // Step 1: Find "first slot" reply from ALL replies (chronologically first)
  let firstSlotReply: any = null

  if (sorted.length > 0) {
    if (isParentMine) {
      // My comment → first reply from anyone
      firstSlotReply = sorted[0]
    } else if (isTopLevel) {
      if (isParentByPostAuthor) {
        // Top-level, parent by post author → first reply from anyone
        firstSlotReply = sorted[0]
      } else {
        // Top-level, parent by someone else → first reply only if from post author
        firstSlotReply = sorted.find(r => isPostAuthor(getUserId(r))) || null
      }
    }
  }

  // Step 2: Build visible and hidden lists
  const visible: any[] = []
  const hidden: any[] = []

  sorted.forEach(reply => {
    const userId = getUserId(reply)
    
    if (reply === firstSlotReply) {
      // First slot reply → visible (even if mine)
      visible.push(reply)
    } else if (isMe(userId)) {
      // My other replies → also visible
      visible.push(reply)
    } else {
      // Everything else → hidden (for "Show more")
      hidden.push(reply)
    }
  })

  return { visible, hidden }
}

// Helper to update repliesCount of a comment in all replies caches
function updateCommentRepliesCount(queryClient: any, targetCommentId: string, delta: number) {
  // Search through all replies caches to find and update the target comment
  queryClient.setQueriesData({ queryKey: ['replies'] }, (old: any) => {
    if (!old?.data) return old
    let changed = false
    const updated = old.data.map((comment: any) => {
      if (comment._id === targetCommentId) {
        changed = true
        return { ...comment, repliesCount: Math.max(0, (comment.repliesCount || 0) + delta) }
      }
      return comment
    })
    return changed ? { ...old, data: updated } : old
  })
}

// Hook to fetch replies with WebSocket
function useRepliesWithSocket(commentId: string, shouldFetch: boolean) {
  const queryClient = useQueryClient()
  const { data: repliesData, isLoading } = useReplies(shouldFetch ? commentId : '')

  useEffect(() => {
    if (!commentId) return
    const socket = getSocket()
    socket.emit('join:comment', commentId)

    const handleNewReply = (reply: any) => {
      if (reply.parentCommentId === commentId) {
        queryClient.setQueryData(['replies', commentId], (old: any) => {
          if (!old) return { success: true, count: 1, data: [reply] }
          const exists = old.data?.some((r: any) => r._id === reply._id)
          if (exists) return old
          return { ...old, count: (old.count || 0) + 1, data: [...(old.data || []), reply] }
        })
        // Also update the parent comment's repliesCount in all caches
        updateCommentRepliesCount(queryClient, commentId, 1)
      }
    }

    const handleCommentDeleted = (data: { commentId: string, parentCommentId?: string }) => {
      queryClient.setQueryData(['replies', commentId], (old: any) => {
        if (!old?.data) return old
        const filtered = old.data.filter((r: any) => r._id !== data.commentId)
        return { ...old, count: filtered.length, data: filtered }
      })
      // Also update the parent comment's repliesCount if this was a direct child
      if (data.parentCommentId === commentId) {
        updateCommentRepliesCount(queryClient, commentId, -1)
      }
    }

    socket.on('newReply', handleNewReply)
    socket.on('commentDeleted', handleCommentDeleted)
    return () => {
      socket.emit('leave:comment', commentId)
      socket.off('newReply', handleNewReply)
      socket.off('commentDeleted', handleCommentDeleted)
    }
  }, [commentId, queryClient])

  return { replies: repliesData?.data || [], isLoading }
}

/**
 * ReplyWithNested - Renders a reply and fetches its nested replies
 * This component handles its own nested reply fetching and rendering
 */
function ReplyWithNested({
  reply,
  onLike,
  isLiked,
  contentAuthorId,
  contentId,
  onReplyClick,
  showTopLine,
  hasNextSibling,
  myUserId,
  user,
  canDeleteComment,
  onDeleteComment,
  expandedShowMore,
  setExpandedShowMore,
  myRepliesMap
}: {
  reply: any
  onLike?: (commentId: string) => void
  isLiked: boolean
  contentAuthorId?: string
  contentId?: string
  onReplyClick?: (comment: any) => void
  showTopLine: boolean
  hasNextSibling: boolean
  myUserId?: string
  user?: any
  canDeleteComment: (userId: string) => boolean
  onDeleteComment: (commentId: string) => void
  expandedShowMore: Set<string>
  setExpandedShowMore: React.Dispatch<React.SetStateAction<Set<string>>>
  myRepliesMap?: Record<string, any>
}) {
  const replyUserId = reply.userId._id || reply.userId
  const hasReplies = reply.repliesCount > 0

  // Fetch nested replies
  const { replies: nestedRawReplies, isLoading: nestedLoading } = useRepliesWithSocket(
    hasReplies ? reply._id : '',
    hasReplies
  )

  // Process nested visibility
  const { visible: nestedVisible, hidden: nestedHidden } = useMemo(() => {
    console.log('[ReplyWithNested] Processing nested for:', reply.content, 'replyUserId:', replyUserId, 'isTopLevel: false')
    const result = processRepliesVisibility(nestedRawReplies, myUserId, contentAuthorId, replyUserId, false)
    console.log('[ReplyWithNested] Result:', 'visible:', result.visible.length, 'hidden:', result.hidden.length)
    return result
  }, [nestedRawReplies, myUserId, contentAuthorId, replyUserId])

  // Add optimistic nested reply
  const myNestedReply = myRepliesMap?.[reply._id]
  const allNestedVisible = useMemo(() => {
    if (myNestedReply && !nestedVisible.some((r: any) => r._id === myNestedReply._id)) {
      return [...nestedVisible, myNestedReply]
    }
    return nestedVisible
  }, [nestedVisible, myNestedReply])

  // Build nested items
  const nestedItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = []
    
    allNestedVisible.forEach((nested) => {
      items.push({
        type: 'comment',
        comment: nested,
        isLiked: user && nested.likedBy?.includes(user._id),
        canDelete: canDeleteComment(nested.userId._id || nested.userId),
        hasReplies: nested.repliesCount > 0,
        parentId: reply._id
      })
    })

    if (nestedHidden.length > 0) {
      if (!expandedShowMore.has(reply._id)) {
        items.push({
          type: 'show-more',
          count: nestedHidden.length,
          onClick: () => setExpandedShowMore(prev => new Set(prev).add(reply._id)),
          parentId: reply._id
        })
      } else {
        nestedHidden.forEach((nested) => {
          items.push({
            type: 'comment',
            comment: nested,
            isLiked: user && nested.likedBy?.includes(user._id),
            canDelete: canDeleteComment(nested.userId._id || nested.userId),
            hasReplies: nested.repliesCount > 0,
            parentId: reply._id
          })
        })
      }
    }

    return items
  }, [allNestedVisible, nestedHidden, expandedShowMore, user, reply._id, canDeleteComment, setExpandedShowMore])

  const hasNestedItems = nestedItems.length > 0
  // Show bottom line if there's a next sibling OR if there are nested items
  const showBottomLine = hasNextSibling || hasNestedItems

  return (
    <>
      <CommentRow
        comment={reply}
        onLike={onLike}
        isLiked={isLiked}
        contentAuthorId={contentAuthorId}
        contentId={contentId}
        onReplyClick={onReplyClick}
        showTopLine={showTopLine}
        showBottomLine={showBottomLine}
        canDelete={canDeleteComment(replyUserId)}
        onDelete={() => onDeleteComment(reply._id)}
      />

      {/* Nested replies */}
      {hasReplies && (
        <>
          {nestedLoading ? (
            <div className="py-2 flex justify-center ml-[52px]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          ) : (
            nestedItems.map((item, index) => {
              const hasNextNestedItem = index < nestedItems.length - 1
              // For last nested item, also consider if parent has next sibling
              const nestedHasNextSibling = hasNextNestedItem || hasNextSibling

              if (item.type === 'comment') {
                // Recursive: nested replies can also have their own replies
                return (
                  <ReplyWithNested
                    key={item.comment._id}
                    reply={item.comment}
                    onLike={onLike}
                    isLiked={item.isLiked}
                    contentAuthorId={contentAuthorId}
                    contentId={contentId}
                    onReplyClick={onReplyClick}
                    showTopLine={true}
                    hasNextSibling={nestedHasNextSibling}
                    myUserId={myUserId}
                    user={user}
                    canDeleteComment={canDeleteComment}
                    onDeleteComment={onDeleteComment}
                    expandedShowMore={expandedShowMore}
                    setExpandedShowMore={setExpandedShowMore}
                    myRepliesMap={myRepliesMap}
                  />
                )
              } else {
                return (
                  <ShowMoreRow
                    key={`show-more-${item.parentId}`}
                    count={item.count}
                    onClick={item.onClick}
                    hasNextItem={nestedHasNextSibling}
                  />
                )
              }
            })
          )}
        </>
      )}
    </>
  )
}

export function CommentItem({
  comment,
  onLike,
  isLiked = false,
  contentAuthorId,
  contentId,
  onReplyClick,
  isReply = false,
  myReply,
  onMyReplyCleared,
  myRepliesMap = {},
  onMyReplyClearedForId
}: CommentItemProps) {
  const { user } = useAuth()
  const deleteComment = useDeleteComment()
  const [showReplies, setShowReplies] = useState(false)
  const [expandedShowMore, setExpandedShowMore] = useState<Set<string>>(new Set())

  const myUserId = user?._id
  const hasReplies = comment.repliesCount > 0
  const commentUserId = comment.userId._id || comment.userId
  const isTopLevel = !comment.parentCommentId

  const canDeleteComment = (userId: string) => {
    if (!user) return false
    return userId === myUserId || 
           user.permissions?.hub?.canModerate || 
           user.permissions?.admin?.canModerateAllContent
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

  // Auto-expand replies
  useEffect(() => {
    if (hasReplies && !isReply) setShowReplies(true)
  }, [hasReplies, isReply])

  // Fetch direct replies
  const { replies: rawReplies, isLoading } = useRepliesWithSocket(
    showReplies ? comment._id : '',
    showReplies
  )

  // Process visibility
  const { visible: visibleReplies, hidden: hiddenReplies } = useMemo(() => {
    console.log('[CommentItem] Processing for:', comment.content, 'isTopLevel:', isTopLevel, 'commentUserId:', commentUserId)
    const result = processRepliesVisibility(rawReplies, myUserId, contentAuthorId, commentUserId, isTopLevel)
    console.log('[CommentItem] Result: visible:', result.visible.map((r:any) => r.content), 'hidden:', result.hidden.map((r:any) => r.content))
    return result
  }, [rawReplies, myUserId, contentAuthorId, commentUserId, isTopLevel, comment.content])

  // Add optimistic reply
  const allVisibleReplies = useMemo(() => {
    if (myReply && !visibleReplies.some((r: any) => r._id === myReply._id)) {
      return [...visibleReplies, myReply]
    }
    return visibleReplies
  }, [visibleReplies, myReply])

  // Build flat items for direct replies only (nested handled by ReplyWithNested)
  const directItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = []

    allVisibleReplies.forEach((reply) => {
      items.push({
        type: 'comment',
        comment: reply,
        isLiked: user && reply.likedBy?.includes(user._id),
        canDelete: canDeleteComment(reply.userId._id || reply.userId),
        hasReplies: reply.repliesCount > 0,
        parentId: comment._id
      })
    })

    if (hiddenReplies.length > 0) {
      if (!expandedShowMore.has(comment._id)) {
        items.push({
          type: 'show-more',
          count: hiddenReplies.length,
          onClick: () => setExpandedShowMore(prev => new Set(prev).add(comment._id)),
          parentId: comment._id
        })
      } else {
        hiddenReplies.forEach((reply) => {
          items.push({
            type: 'comment',
            comment: reply,
            isLiked: user && reply.likedBy?.includes(user._id),
            canDelete: canDeleteComment(reply.userId._id || reply.userId),
            hasReplies: reply.repliesCount > 0,
            parentId: comment._id
          })
        })
      }
    }

    return items
  }, [allVisibleReplies, hiddenReplies, expandedShowMore, user, comment._id])

  const hasAnyItems = directItems.length > 0

  return (
    <div className={`${!isReply ? 'border-b border-border' : ''}`}>
      <div className="p-4">
        {/* Parent comment */}
        <CommentRow
          comment={comment}
          onLike={onLike}
          isLiked={isLiked}
          contentAuthorId={contentAuthorId}
          contentId={contentId}
          onReplyClick={onReplyClick}
          showTopLine={false}
          showBottomLine={hasAnyItems}
          canDelete={canDeleteComment(commentUserId)}
          onDelete={() => handleDeleteComment(comment._id)}
        />

        {/* Replies */}
        {showReplies && (
          <>
            {isLoading ? (
              <div className="py-4 flex justify-center ml-[52px]">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {directItems.map((item, index) => {
                  const hasNextItem = index < directItems.length - 1
                  
                  if (item.type === 'comment') {
                    return (
                      <ReplyWithNested
                        key={item.comment._id}
                        reply={item.comment}
                        onLike={onLike}
                        isLiked={item.isLiked}
                        contentAuthorId={contentAuthorId}
                        contentId={contentId}
                        onReplyClick={onReplyClick}
                        showTopLine={true}
                        hasNextSibling={hasNextItem}
                        myUserId={myUserId}
                        user={user}
                        canDeleteComment={canDeleteComment}
                        onDeleteComment={handleDeleteComment}
                        expandedShowMore={expandedShowMore}
                        setExpandedShowMore={setExpandedShowMore}
                        myRepliesMap={myRepliesMap}
                      />
                    )
                  } else {
                    return (
                      <ShowMoreRow
                        key={`show-more-${item.parentId}`}
                        count={item.count}
                        onClick={item.onClick}
                        hasNextItem={hasNextItem}
                      />
                    )
                  }
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
