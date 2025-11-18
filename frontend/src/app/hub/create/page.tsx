'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs, formatAsOptions } from '@/hooks/use-configs'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function CreateContentPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, hasPermission } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: '',
    category: '',
    difficulty: 'beginner',
    body: '',
    status: 'draft' as 'draft' | 'published',
  })

  // Dynamic config options
  const contentTypes = formatAsOptions(configs?.content_types)
  const categories = formatAsOptions(configs?.content_categories)
  const difficulties = formatAsOptions(configs?.difficulty_levels)

  // Set default values when configs load
  useEffect(() => {
    if (configs && !formData.contentType) {
      setFormData((prev) => ({
        ...prev,
        contentType: configs.content_types?.[0] || '',
        category: configs.content_categories?.[0] || '',
      }))
    }
  }, [configs, formData.contentType])

  // Permission check: must have canCreateContent permission
  useEffect(() => {
    if (!authLoading && !configsLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasPermission('canCreateContent')) {
        toast.error('You need content creator permission to create content')
        router.push('/hub')
      }
    }
  }, [authLoading, configsLoading, isAuthenticated, hasPermission, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.body || !formData.body.trim()) {
      toast.error('Please enter content body')
      return
    }

    setIsSubmitting(true)

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const payload = {
        ...formData,
        tags: tagsArray,
        mediaUrls: [], // File upload can be implemented later
      }

      const { data } = await api.post('/hub/content', payload)

      toast.success(
        formData.status === 'published' ? 'Content published successfully!' : 'Content saved as draft!'
      )

      router.push('/hub')
    } catch (error: any) {
      console.error('Error creating content:', error)
      toast.error(error.response?.data?.message || 'Failed to create content')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || configsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Create Content</h1>
            <p className="text-muted-foreground">Share your knowledge with the community</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-8">
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter content title"
                className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of your content"
                rows={3}
                className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Content Type, Category, Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium mb-2">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="contentType"
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {difficulties.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Body */}
            <div className="mb-6">
              <label htmlFor="body" className="block text-sm font-medium mb-2">
                Content Body <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Write your content here..."
                rows={15}
                className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Markdown is supported. Use headings, lists, code blocks, etc.
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., defi, trading, tutorial)"
                className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">Separate tags with commas</p>
            </div>

            {/* Media URLs (Placeholder) */}
            <div className="mb-6">
              <label htmlFor="mediaUrls" className="block text-sm font-medium mb-2">
                Media Upload
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-background">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">
                  File upload coming soon
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                {formData.status === 'draft'
                  ? 'Save as draft to continue editing later'
                  : 'Publish to make it visible to everyone'}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Saving...
                  </span>
                ) : formData.status === 'published' ? (
                  'Publish Content'
                ) : (
                  'Save Draft'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/hub')}
                disabled={isSubmitting}
                className="px-6 py-3 bg-card border border-border text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
