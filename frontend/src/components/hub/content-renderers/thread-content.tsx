'use client'

import { useState } from 'react'

interface ThreadContentProps {
  content: any
}

export function ThreadContent({ content }: ThreadContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const bodyText = content.body || ''
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
