'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Comment, useDeleteComment } from '@/hooks/use-hub'
import { useAuth } from '@/hooks/use-auth'

interface CommentItemProps {
  comment: Comment
  onLike?: (commentId: string) => void
  isLiked?: boolean
  contentAuthorId?: string // ID of the content's author (for highlighting author replies)
  commentDetailUrl?: string // URL to comment detail page (for middle-click support)
  onReplyClick?: (comment: Comment) => void // Quick reply via modal
}

export function CommentItem({ comment, onLike, isLiked = false, contentAuthorId, commentDetailUrl, onReplyClick }: CommentItemProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  // Check if current user can delete (author or moderator)
  const canDelete = user && (
    comment.userId._id === user._id ||
    user.permissions?.canModerateContent
  )

  // Truncate long content
  const shouldTruncate = comment.content.length > 200
  const displayContent = isExpanded || !shouldTruncate
    ? comment.content
    : comment.content.slice(0, 200) + '...'

  const handleDelete = () => {
    deleteComment(comment._id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
      }
    })
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

  // Close options menu when clicking outside
  useEffect(() => {
    if (!showOptionsMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.options-menu-container')) {
        setShowOptionsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  return (
    <div className="flex gap-3 p-4 border-b border-border hover:bg-muted/30 transition-colors">
      {/* Comment Avatar */}
      <Link
        href={`/center/profile/${comment.userId?._id}`}
        className="flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {comment.userId?.profileImage ? (
          <Image
            src={comment.userId.profileImage}
            alt={comment.userId.displayName || 'User'}
            width={40}
            height={40}
            className="rounded-lg"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {(comment.userId?.displayName || comment.userId?.twitterUsername || 'U')[0].toUpperCase()}
            </span>
          </div>
        )}
      </Link>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link
            href={`/center/profile/${comment.userId?._id}`}
            className="font-semibold text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {comment.userId?.displayName || 'Anonymous'}
          </Link>
          {comment.userId?.twitterUsername && (
            <span className="text-muted-foreground text-xs">@{comment.userId.twitterUsername}</span>
          )}
          <span className="text-muted-foreground text-xs">·</span>
          {commentDetailUrl ? (
            <Link
              href={commentDetailUrl}
              className="text-muted-foreground text-xs hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {formatTimestamp(comment.createdAt)}
            </Link>
          ) : (
            <span className="text-muted-foreground text-xs">
              {formatTimestamp(comment.createdAt)}
            </span>
          )}
          {comment.isEdited && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs italic">edited</span>
            </>
          )}

          {/* Three-dot menu (only for author or moderator) */}
          {canDelete && (
            <div className="ml-auto relative options-menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowOptionsMenu(!showOptionsMenu)
                }}
                className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                title="More options"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {/* Options dropdown */}
              {showOptionsMenu && (
                <div
                  className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowOptionsMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-2">
          {commentDetailUrl ? (
            <Link
              href={commentDetailUrl}
              className="text-sm whitespace-pre-wrap block hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {displayContent}
            </Link>
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {displayContent}
            </p>
          )}
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="text-xs text-primary hover:underline mt-1"
            >
              {isExpanded ? 'Show less' : 'View more'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 text-muted-foreground">
          {/* Reply Icon - Opens modal/quick reply */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReplyClick?.(comment)
            }}
            className="flex items-center gap-1 text-xs hover:text-blue-500 transition-colors group"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {comment.repliesCount > 0 && <span className="group-hover:text-blue-500">{comment.repliesCount}</span>}
          </button>

          {/* Like */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike?.(comment._id)
            }}
            className={`flex items-center gap-1 text-xs hover:text-red-500 transition-colors ${
              isLiked ? 'text-red-500' : ''
            }`}
          >
            <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-card rounded-lg border border-border p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Comment?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {comment.repliesCount > 0
                  ? `This will also delete ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'} to this comment.`
                  : 'This action cannot be undone.'
                }
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
