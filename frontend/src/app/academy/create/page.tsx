'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs, formatAsOptions } from '@/hooks/use-configs'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function CreateCoursePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, hasRole } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    language: 'en',
    prerequisites: '',
    thumbnailUrl: '',
    maxParticipants: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    isLiveSession: false,
    sessionDate: '',
    sessionLink: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const isMentor = hasRole('mentor')

  // Dynamic config options
  const categories = formatAsOptions(configs?.course_categories)
  const difficulties = formatAsOptions(configs?.difficulty_levels)
  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  // Set default values when configs load
  useEffect(() => {
    if (configs && !formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: configs.course_categories?.[0] || '',
      }))
    }
  }, [configs, formData.category])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.shortDescription && formData.shortDescription.length > 300) {
      newErrors.shortDescription = 'Short description must be less than 300 characters'
    }

    if (formData.duration && isNaN(Number(formData.duration))) {
      newErrors.duration = 'Duration must be a valid number'
    }

    if (formData.maxParticipants && isNaN(Number(formData.maxParticipants))) {
      newErrors.maxParticipants = 'Max participants must be a valid number'
    }

    if (formData.isLiveSession) {
      if (!formData.sessionDate) {
        newErrors.sessionDate = 'Session date is required for live sessions'
      }
      if (!formData.sessionLink) {
        newErrors.sessionLink = 'Session link is required for live sessions'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()

    if (!isMentor) {
      toast.error('You need mentor role to create courses')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setIsSubmitting(true)

    try {
      const prerequisitesArray = formData.prerequisites
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      const payload = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration ? Number(formData.duration) : 0,
        language: formData.language,
        prerequisites: prerequisitesArray,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        status: saveAsDraft ? 'draft' : formData.status,
        isLiveSession: formData.isLiveSession,
        sessionDate: formData.isLiveSession && formData.sessionDate ? formData.sessionDate : undefined,
        sessionLink: formData.isLiveSession && formData.sessionLink ? formData.sessionLink : undefined,
        modules: [],
      }

      const { data } = await api.post('/academy/courses', payload)

      toast.success(
        saveAsDraft ? 'Course saved as draft!' : formData.status === 'published' ? 'Course published successfully!' : 'Course created successfully!'
      )

      // Redirect to the created course page
      router.push(`/academy/course/${data.data._id}`)
    } catch (error: any) {
      console.error('Error creating course:', error)
      toast.error(error.response?.data?.message || 'Failed to create course')
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

  // Role check: User must be authenticated and have mentor role
  if (!authLoading && isAuthenticated && !isMentor) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-card rounded-lg border border-border p-8">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-yellow-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="text-2xl font-bold mb-2">Mentor Role Required</h2>
                <p className="text-muted-foreground mb-6">
                  You need to have the mentor role to create courses in the Academy.
                </p>

                <div className="bg-muted rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3">How to become a mentor:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Build your reputation by contributing to the community</li>
                    <li>Request mentor role from the admin team</li>
                    <li>Get approved based on your expertise and contributions</li>
                  </ol>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/settings')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                  >
                    Go to Settings
                  </button>
                  <button
                    onClick={() => router.push('/academy')}
                    className="px-6 py-3 bg-card border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
                  >
                    Back to Academy
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Need help? Contact the admin team or visit our{' '}
                  <a href="/support" className="text-primary hover:underline">
                    support page
                  </a>
                  .
                </p>
              </div>
            </div>
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Create Course</h1>
            <p className="text-muted-foreground">Share your knowledge and teach others</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="bg-card rounded-lg border border-border p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Basic Information</h2>

              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to DeFi Trading"
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.title ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                  required
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                <p className="text-xs text-muted-foreground mt-1">Maximum 200 characters</p>
              </div>

              {/* Short Description */}
              <div className="mb-6">
                <label htmlFor="shortDescription" className="block text-sm font-medium mb-2">
                  Short Description
                </label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief overview of your course (shown in course cards)"
                  rows={2}
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.shortDescription ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                />
                {errors.shortDescription && <p className="text-red-500 text-xs mt-1">{errors.shortDescription}</p>}
                <p className="text-xs text-muted-foreground mt-1">Maximum 300 characters</p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of your course, what students will learn, and what to expect..."
                  rows={6}
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.description ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  required
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a comprehensive description. Markdown is supported.
                </p>
              </div>

              {/* Category, Difficulty, Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {difficulties.map((diff) => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    min="0"
                    step="0.5"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.duration ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="mb-6">
                <label htmlFor="thumbnailUrl" className="block text-sm font-medium mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/course-thumbnail.jpg"
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a direct link to your course thumbnail image
                </p>
              </div>
            </div>

            {/* Course Requirements Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Course Requirements</h2>

              {/* Prerequisites */}
              <div className="mb-6">
                <label htmlFor="prerequisites" className="block text-sm font-medium mb-2">
                  Prerequisites
                </label>
                <textarea
                  id="prerequisites"
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  placeholder="Enter each prerequisite on a new line, e.g.:&#10;Basic understanding of blockchain&#10;Familiarity with crypto wallets&#10;Access to MetaMask"
                  rows={5}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter each prerequisite on a new line. Leave empty if none.
                </p>
              </div>

              {/* Language */}
              <div className="mb-6">
                <label htmlFor="language" className="block text-sm font-medium mb-2">
                  Language
                </label>
                <input
                  type="text"
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="e.g., en, es, fr"
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: en (English). Use ISO language codes.
                </p>
              </div>
            </div>

            {/* Live Session Options */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Live Session (Optional)</h2>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isLiveSession"
                    checked={formData.isLiveSession}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-medium">This is a live session course</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Check if this course includes live sessions or webinars
                </p>
              </div>

              {formData.isLiveSession && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                  <div>
                    <label htmlFor="sessionDate" className="block text-sm font-medium mb-2">
                      Session Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="sessionDate"
                      name="sessionDate"
                      value={formData.sessionDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-md bg-background border ${
                        errors.sessionDate ? 'border-red-500' : 'border-border'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    {errors.sessionDate && <p className="text-red-500 text-xs mt-1">{errors.sessionDate}</p>}
                  </div>

                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                      min="1"
                      className={`w-full px-4 py-2 rounded-md bg-background border ${
                        errors.maxParticipants ? 'border-red-500' : 'border-border'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    {errors.maxParticipants && <p className="text-red-500 text-xs mt-1">{errors.maxParticipants}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="sessionLink" className="block text-sm font-medium mb-2">
                      Session Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="sessionLink"
                      name="sessionLink"
                      value={formData.sessionLink}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/..."
                      className={`w-full px-4 py-2 rounded-md bg-background border ${
                        errors.sessionLink ? 'border-red-500' : 'border-border'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    {errors.sessionLink && <p className="text-red-500 text-xs mt-1">{errors.sessionLink}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide the meeting link (Zoom, Google Meet, etc.)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Publication Status</h2>

              <div>
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
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.status === 'draft' && 'Save as draft to continue editing later'}
                  {formData.status === 'published' && 'Publish to make it visible to all students'}
                  {formData.status === 'archived' && 'Archive to hide from course listings'}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-500 mb-1">Note about course modules</p>
                  <p className="text-muted-foreground">
                    After creating the course, you can add modules, lessons, and detailed content from the course
                    management page.
                  </p>
                </div>
              </div>
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
                    Creating...
                  </span>
                ) : formData.status === 'published' ? (
                  'Create & Publish Course'
                ) : (
                  'Create Course'
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => router.push('/academy')}
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
