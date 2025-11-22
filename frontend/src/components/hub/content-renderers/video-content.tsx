'use client'

interface VideoContentProps {
  content: any
}

export function VideoContent({ content }: VideoContentProps) {
  // Extract YouTube/Vimeo ID from URL if needed
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
  }

  // Check if body contains a video URL
  const videoUrl = content.body?.match(/(https?:\/\/[^\s]+)/)?.[0]
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No video URL provided</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Description/Notes */}
      {content.description && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Video Description</h3>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>
      )}

      {/* Additional Content Body (if not just URL) */}
      {content.body && !content.body.match(/^https?:\/\//) && (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{content.body}</div>
        </div>
      )}
    </div>
  )
}
