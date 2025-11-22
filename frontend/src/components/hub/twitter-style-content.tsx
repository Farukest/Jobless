'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { VideoContent } from './content-renderers/video-content'
import { PodcastContent } from './content-renderers/podcast-content'
import { ThreadContent } from './content-renderers/thread-content'
import { GuideContent } from './content-renderers/guide-content'
import { DocumentContent } from './content-renderers/document-content'

interface TwitterStyleContentProps {
  content: any
  onLike?: () => void
  onBookmark?: () => void
  showFullContent?: boolean // false = preview in feed, true = full in detail
}

export function TwitterStyleContent({
  content,
  onLike,
  onBookmark,
  showFullContent = false
}: TwitterStyleContentProps) {
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)

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

  return (
    <article className="bg-card border border-border rounded-lg hover:border-primary/30 transition-colors mb-3">
      <div className="p-4">
        {/* Header: Avatar + User Info + Timestamp */}
        <div className="flex gap-3 mb-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {content.authorId?.profileImage ? (
              <Image
                src={content.authorId.profileImage}
                alt={content.authorId.displayName || 'Author'}
                width={48}
                height={48}
                className="rounded-lg hover:opacity-90 cursor-pointer transition-opacity"
                onClick={() => router.push(`/center/profile/${content.authorId._id}`)}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                <span className="text-lg font-semibold text-primary">
                  {(content.authorId?.displayName || content.authorId?.twitterUsername || (content.authorId?.walletAddress ? content.authorId.walletAddress.slice(2, 4).toUpperCase() : 'U'))[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User info + Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: Name + Username + Timestamp + Badges */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold hover:underline cursor-pointer">
                {content.authorId?.displayName ||
                 content.authorId?.twitterUsername ||
                 (content.authorId?.walletAddress ? `${content.authorId.walletAddress.slice(0, 6)}...${content.authorId.walletAddress.slice(-4)}` : 'Anonymous')}
              </span>
              {content.authorId?.twitterUsername && (
                <span className="text-muted-foreground text-sm">
                  @{content.authorId.twitterUsername}
                </span>
              )}
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm hover:underline cursor-pointer">
                {formatTimestamp(content.createdAt)}
              </span>

              {/* Badges */}
              {content.isFeatured && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                  ⭐ Featured
                </span>
              )}
              {content.isPinned && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                  📌 Pinned
                </span>
              )}
            </div>

            {/* Type + Category + Difficulty Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {content.contentType}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {content.category}
              </span>
              {content.difficulty && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
                  {content.difficulty}
                </span>
              )}
            </div>

            {/* Title (if exists and not same as body) */}
            {content.title && (
              <h2 className="text-lg font-semibold mb-2 cursor-pointer hover:underline" onClick={() => !showFullContent && router.push(`/hub/content/${content._id}`)}>
                {content.title}
              </h2>
            )}

            {/* Description */}
            {content.description && (
              <p className="text-muted-foreground text-sm mb-3">{content.description}</p>
            )}

            {/* Content Body - Type Based */}
            <div className="mb-3">
              {showFullContent ? (
                // Full content in detail page
                <>
                  {content.contentType.toLowerCase() === 'video' && <VideoContent content={content} />}
                  {content.contentType.toLowerCase() === 'podcast' && <PodcastContent content={content} />}
                  {content.contentType.toLowerCase() === 'thread' && <ThreadContent content={content} />}
                  {['guide', 'tutorial'].includes(content.contentType.toLowerCase()) && <GuideContent content={content} />}
                  {['document', 'pdf', 'doc'].includes(content.contentType.toLowerCase()) && <DocumentContent content={content} />}
                  {!['video', 'podcast', 'thread', 'guide', 'tutorial', 'document', 'pdf', 'doc'].includes(content.contentType.toLowerCase()) && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap">{content.body}</div>
                    </div>
                  )}
                </>
              ) : (
                // Preview in feed
                <div className="cursor-pointer" onClick={() => router.push(`/hub/content/${content._id}`)}>
                  {content.contentType.toLowerCase() === 'video' ? (
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : content.contentType.toLowerCase() === 'thread' ? (
                    <div className="text-sm line-clamp-3">{content.body?.split('\n\n')[0]}</div>
                  ) : (
                    <div className="text-sm line-clamp-4">{content.body}</div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {content.tags.slice(0, showFullContent ? undefined : 3).map((tag: string, index: number) => (
                  <span key={index} className="text-xs text-primary hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
                {!showFullContent && content.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{content.tags.length - 3} more</span>
                )}
              </div>
            )}

            {/* Engagement Bar (Twitter-style) */}
            <div className="flex items-center gap-6 text-muted-foreground mt-3">
              {/* Views */}
              <div className="flex items-center gap-1.5 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{content.viewsCount || 0}</span>
              </div>

              {/* Comments */}
              <button className="flex items-center gap-1.5 text-sm hover:text-blue-500 transition-colors group">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="group-hover:text-blue-500">{content.commentsCount || 0}</span>
              </button>

              {/* Like */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike?.()
                }}
                className="flex items-center gap-1.5 text-sm hover:text-red-500 transition-colors group"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="group-hover:text-red-500">{content.likesCount || 0}</span>
              </button>

              {/* Bookmark */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmark?.()
                }}
                className="flex items-center gap-1.5 text-sm hover:text-green-500 transition-colors group"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="group-hover:text-green-500">{content.bookmarksCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
