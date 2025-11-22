'use client'

interface DefaultContentProps {
  content: any
}

export function DefaultContent({ content }: DefaultContentProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap">{content.body}</div>
    </div>
  )
}
