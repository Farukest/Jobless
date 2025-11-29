'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import for Quill (client-side only)
const QuillEditor = dynamic(() => import('@/components/editor/quill-editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  ),
})

export default function TestEditorPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [editorContent, setEditorContent] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY RETURNS
  const handleEditorChange = useCallback((content: string, delta: any, source: string, editor: any) => {
    setEditorContent(content)
  }, [])

  const handleSave = useCallback(() => {
    if (editorContent && editorContent.trim() !== '<p><br></p>') {
      console.log('Saved HTML:', editorContent)
      alert('Check console for saved HTML content')
    } else {
      alert('Editor is empty!')
    }
  }, [editorContent])

  const handleClear = useCallback(() => {
    setEditorContent('')
  }, [])

  // Client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading until mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Quill Editor Test</h1>
              <p className="text-muted-foreground">
                Test and experiment with Quill.js - The powerful rich text editor used by Medium & LinkedIn
              </p>
            </div>
            <Link
              href="/hub/feed"
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back to Feed
            </Link>
          </div>

          {/* Instructions */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Quill Instructions:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><span className="font-medium text-foreground">Type freely</span> - smooth, continuous writing experience</li>
              <li><span className="font-medium text-foreground">Paste images</span> directly from clipboard (Ctrl+V)</li>
              <li>Use <span className="font-medium text-foreground">toolbar</span> for all formatting options</li>
              <li><span className="font-medium text-foreground">Ctrl+B</span> Bold, <span className="font-medium text-foreground">Ctrl+I</span> Italic</li>
              <li>Click <span className="font-medium text-foreground">image icon</span> to add image URL or upload</li>
              <li>Click <span className="font-medium text-foreground">video icon</span> to embed videos</li>
              <li>Easy <span className="font-medium text-foreground">code blocks</span> - no getting stuck!</li>
            </ul>
          </div>
        </div>

        {/* Editor Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Editor Header */}
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold">Quill Rich Text Editor</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-background border border-border rounded hover:bg-muted transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
              >
                Save (Console)
              </button>
            </div>
          </div>

          {/* Editor */}
          <div>
            <QuillEditor
              value={editorContent}
              onChange={handleEditorChange}
              placeholder="Start typing... Use toolbar for formatting, paste images directly with Ctrl+V!"
              minHeight={500}
            />
          </div>
        </div>

        {/* Current Data Preview */}
        {editorContent && editorContent.trim() !== '<p><br></p>' && editorContent.trim() !== '' && (
          <div className="mt-8 bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Generated HTML:</h3>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-96">
              {editorContent}
            </pre>
          </div>
        )}

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Quill Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✓ Smooth rich text editing</li>
              <li>✓ Headers (H1, H2, H3, H4)</li>
              <li>✓ Lists (bullet & numbered) with indent</li>
              <li>✓ Bold, Italic, Underline, Strike</li>
              <li>✓ Text colors & background colors</li>
              <li>✓ Code blocks (easy to use!)</li>
              <li>✓ Blockquotes</li>
              <li>✓ Links</li>
              <li>✓ Images (paste from clipboard!)</li>
              <li>✓ Video embeds</li>
              <li>✓ Text alignment</li>
              <li>✓ Clear formatting button</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Test Checklist:</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>□ Type text - check smooth typing</li>
              <li>□ Paste image from clipboard (Ctrl+V)</li>
              <li>□ Use toolbar buttons</li>
              <li>□ Try keyboard shortcuts (Ctrl+B, Ctrl+I)</li>
              <li>□ Add code block - type and exit easily</li>
              <li>□ Create lists & indent them</li>
              <li>□ Change text colors</li>
              <li>□ Add links</li>
              <li>□ Test text alignment</li>
              <li>□ Switch themes (light/dark)</li>
              <li>□ Save and check HTML output</li>
            </ul>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2 text-primary">Why Quill?</h3>
          <p className="text-sm text-muted-foreground">
            Quill is used by <span className="font-medium text-foreground">Medium</span>, <span className="font-medium text-foreground">LinkedIn</span>, and <span className="font-medium text-foreground">Grammarly</span>.
            It's battle-tested, performant, and provides the smoothest editing experience without the complexity of block-based editors.
          </p>
        </div>
      </div>
    </div>
  )
}
