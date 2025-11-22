'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableContentTypes: string[]
  availableCategories: string[]
}

export function CreateContentModal({
  isOpen,
  onClose,
  onSuccess,
  availableContentTypes,
  availableCategories,
}: CreateContentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    body: '',
    tags: '',
    status: 'published' as 'draft' | 'published',
    videoUrl: '', // For Video type
    podcastUrl: '', // For Podcast type
    externalUrl: '', // For Guide/Tutorial type
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Content type specific helpers
  const isVideoType = formData.contentType.toLowerCase() === 'video'
  const isPodcastType = formData.contentType.toLowerCase() === 'podcast'
  const isThreadType = formData.contentType.toLowerCase() === 'thread'
  const isGuideType = ['guide', 'tutorial'].includes(formData.contentType.toLowerCase())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.contentType) {
      toast.error('Content type is required')
      return
    }

    if (!formData.category) {
      toast.error('Category is required')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        contentType: formData.contentType,
        category: formData.category,
        difficulty: formData.difficulty,
        body: formData.body.trim() || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : [],
        status: formData.status,
        mediaUrls: [],
      }

      await api.post('/hub/content', payload)
      toast.success('Content created successfully!')
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Error creating content:', err)
      toast.error(err.response?.data?.message || 'Failed to create content')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      contentType: '',
      category: '',
      difficulty: 'beginner',
      body: '',
      tags: '',
      status: 'published',
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Create Content</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter content title"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter content description"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/500</p>
            </div>

            {/* Content Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select type</option>
                  {availableContentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Content Type Specific Fields */}
            {formData.contentType.toLowerCase() === 'video' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste YouTube or Vimeo URL
                </p>
              </div>
            )}

            {formData.contentType.toLowerCase() === 'podcast' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Audio URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/podcast.mp3"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Direct link to MP3/audio file
                </p>
              </div>
            )}

            {formData.contentType.toLowerCase() === 'thread' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thread Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  placeholder="Write each post separated by double line breaks:

Post 1 content here...

Post 2 content here...

Post 3 content here..."
                  rows={12}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate each thread post with a blank line (press Enter twice)
                </p>
              </div>
            )}

            {['guide', 'tutorial'].includes(formData.contentType.toLowerCase()) && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Guide Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  placeholder="## Introduction
Your introduction text here...

## Step 1: Setup
Instructions for step 1...

## Step 2: Implementation
Instructions for step 2..."
                  rows={15}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use ## for section headings. Each section will be navigable.
                </p>
              </div>
            )}

            {/* Default Body for other types */}
            {!['video', 'podcast', 'thread', 'guide', 'tutorial'].includes(formData.contentType.toLowerCase()) && formData.contentType && (
              <div>
                <label className="block text-sm font-medium mb-2">Content Body</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Enter content body (supports markdown)"
                  rows={8}
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter tags separated by commas (e.g., web3, blockchain, tutorial)"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
