'use client'

interface PodcastContentProps {
  content: any
}

export function PodcastContent({ content }: PodcastContentProps) {
  // Extract audio URL from body
  const audioUrl = content.body?.match(/(https?:\/\/[^\s]+\.(mp3|wav|ogg))/)?.[0]

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-border">
        {audioUrl ? (
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-sm text-muted-foreground">No audio URL provided</p>
          </div>
        )}
      </div>

      {/* Episode Description */}
      {content.description && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Episode Description</h3>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>
      )}

      {/* Show Notes / Timestamps */}
      {content.body && !content.body.match(/^https?:\/\//) && (
        <div className="space-y-2">
          <h3 className="font-semibold">Show Notes</h3>
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
            <div className="whitespace-pre-wrap">{content.body}</div>
          </div>
        </div>
      )}
    </div>
  )
}
