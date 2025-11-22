'use client'

import { useState } from 'react'

interface ThreadContentProps {
  content: any
}

export function ThreadContent({ content }: ThreadContentProps) {
  const bodyText = content.body || ''

  // If no body, show empty state
  if (bodyText.trim().length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">No content available</p>
        </div>
      </div>
    )
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = bodyText.length > 280

  return (
    <div>
      {/* Long-form thread content (Twitter-style single long post) */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className={`whitespace-pre-wrap leading-relaxed ${!isExpanded && shouldTruncate ? 'line-clamp-[10]' : ''}`}>
          {bodyText}
        </div>
      </div>

      {/* Show more/less button */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:underline text-sm font-medium mt-2"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
