'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Dynamic import for Quill (client-side only)
const QuillEditor = dynamic(() => import('../editor/quill-editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-lg" style={{ minHeight: '400px' }}>
      <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
})

interface EditorPostComposerProps {
  onPostCreated?: () => void
}

export function EditorPostComposer({ onPostCreated }: EditorPostComposerProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [editorContent, setEditorContent] = useState<string>('')

  // Fetch public configs for all dropdown options
  const { data: publicConfigs } = usePublicConfigs()

  const contentTypes = publicConfigs?.content_types || []
  const categories = publicConfigs?.content_categories || []
  const difficultyLevels = publicConfigs?.difficulty_levels || []

  // Check permissions using modern nested structure
  const canCreate = user?.permissions?.hub?.canCreate

  // Check if user can publish immediately (admin has this permission)
  const canPublish = user?.permissions?.admin?.canModerateAllContent || false

  // Don't render if no permission
  if (!canCreate) return null

  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content)
  }, [])

  const resetForm = () => {
    setTitle('')
    setContentType('')
    setCategory('')
    setDifficulty('')
    setEditorContent('')
    setIsExpanded(false)
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!contentType) {
      toast.error('Content type is required')
      return
    }
    if (!category) {
      toast.error('Category is required')
      return
    }
    if (!editorContent || editorContent.trim() === '' || editorContent.trim() === '<p><br></p>') {
      toast.error('Content is required')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        title: title.trim(),
        body: editorContent, // Save HTML content
        contentType,
        category,
        difficulty: difficulty || undefined,
      }

      const { data } = await api.post('/hub/content', payload)

      toast.success(
        canPublish
          ? 'Content published successfully!'
          : 'Content submitted for review'
      )

      resetForm()

      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error: any) {
      console.error('Content creation error:', error)
      toast.error(error.response?.data?.message || 'Failed to create content')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Composer Container */}
      <div className="bg-card border border-border rounded-lg mb-4">
        {/* Collapsed View */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="flex gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0">
              {user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.displayName || user.twitterUsername || 'User'}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {(user?.displayName || user?.twitterUsername || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center">
              <p className="text-muted-foreground">What's on your mind?</p>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title..."
              className="w-full px-0 py-2 text-xl font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
              maxLength={200}
            />

            {/* Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Content Type */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Content Type *</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="">Select type...</option>
                  {contentTypes.map((type: string) => (
                    <option key={type} value={type}>
                      {type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="">Optional...</option>
                  {difficultyLevels.map((level: string) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quill Editor */}
            <div className="rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <QuillEditor
                value={editorContent}
                onChange={handleEditorChange}
                placeholder="Start writing your content... Use toolbar for formatting, images, videos, and more."
                minHeight={400}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {canPublish ? (
                  <span className="text-green-600 dark:text-green-500 font-medium">
                    ✓ Will be published immediately
                  </span>
                ) : (
                  <span>Will be sent for review</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {canPublish ? 'Publishing...' : 'Submitting...'}
                    </span>
                  ) : (
                    <span>{canPublish ? 'Publish' : 'Submit for Review'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
