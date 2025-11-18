'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs, formatAsOptions } from '@/hooks/use-configs'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function AlphaSubmitPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, hasRole } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    category: '',
    blockchain: '',
    potentialRating: 'medium',
    riskRating: 'medium',
    details: '',
    requirements: '',
    deadline: '',
    websiteUrl: '',
    twitterUrl: '',
    discordUrl: '',
    docsUrl: '',
    telegramUrl: '',
    tags: '',
    status: 'pending' as 'pending' | 'published' | 'archived',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const isScout = hasRole('scout')

  // Dynamic config options
  const alphaTypes = formatAsOptions(configs?.alpha_categories)
  const potentialRatings = formatAsOptions(configs?.potential_ratings)
  const riskRatings = formatAsOptions(configs?.risk_ratings)
  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  // Helper for rating display
  const getRatingDots = (value: string) => {
    const map: Record<string, number> = { low: 1, medium: 2, high: 3, very_high: 4 }
    return map[value] || 2
  }

  // Set default values when configs load
  useEffect(() => {
    if (configs && !formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: configs.alpha_categories?.[0] || '',
      }))
    }
  }, [configs, formData.category])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required'
    } else if (formData.projectName.length > 100) {
      newErrors.projectName = 'Project name must be less than 100 characters'
    }

    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Project description is required'
    }

    if (!formData.blockchain.trim()) {
      newErrors.blockchain = 'Blockchain is required'
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Details are required'
    }

    // URL validations
    const urlFields = ['websiteUrl', 'twitterUrl', 'discordUrl', 'docsUrl', 'telegramUrl']
    urlFields.forEach((field) => {
      const value = formData[field as keyof typeof formData]
      if (value && typeof value === 'string' && value.trim()) {
        try {
          new URL(value)
        } catch {
          newErrors[field] = 'Please enter a valid URL'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()

    if (!isScout) {
      toast.error('You need scout role to submit alpha posts')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setIsSubmitting(true)

    try {
      // Build links array
      const links = []
      if (formData.websiteUrl) links.push({ type: 'website', url: formData.websiteUrl })
      if (formData.twitterUrl) links.push({ type: 'twitter', url: formData.twitterUrl })
      if (formData.discordUrl) links.push({ type: 'discord', url: formData.discordUrl })
      if (formData.docsUrl) links.push({ type: 'docs', url: formData.docsUrl })
      if (formData.telegramUrl) links.push({ type: 'telegram', url: formData.telegramUrl })

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const payload = {
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        category: formData.category,
        blockchain: formData.blockchain,
        potentialRating: formData.potentialRating,
        riskRating: formData.riskRating,
        details: formData.details,
        requirements: formData.requirements || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        links,
        tags: tagsArray,
        status: saveAsDraft ? 'pending' : formData.status,
      }

      const { data } = await api.post('/alpha/posts', payload)

      toast.success(
        saveAsDraft
          ? 'Alpha post saved as draft!'
          : formData.status === 'published'
          ? 'Alpha post published successfully!'
          : 'Alpha post submitted successfully!'
      )

      // Redirect to the created post page
      router.push(`/alpha/post/${data.data._id}`)
    } catch (error: any) {
      console.error('Error creating alpha post:', error)
      toast.error(error.response?.data?.message || 'Failed to create alpha post')
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

  // Role check: User must be authenticated and have scout role
  if (!authLoading && isAuthenticated && !isScout) {
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
                <h2 className="text-2xl font-bold mb-2">Scout Role Required</h2>
                <p className="text-muted-foreground mb-6">
                  You need to have the scout role to submit alpha opportunities.
                </p>

                <div className="bg-muted rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3">How to become a scout:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Build your reputation by actively participating in the community</li>
                    <li>Demonstrate your ability to identify quality opportunities</li>
                    <li>Request scout role from the admin team</li>
                    <li>Get approved based on your track record and contributions</li>
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
                    onClick={() => router.push('/alpha')}
                    className="px-6 py-3 bg-card border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
                  >
                    Back to Alpha
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Submit Alpha</h1>
            <p className="text-muted-foreground">Share early opportunities with the community</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="bg-card rounded-lg border border-border p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Basic Information</h2>

              {/* Project Name */}
              <div className="mb-6">
                <label htmlFor="projectName" className="block text-sm font-medium mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="e.g., ZkSync Era Airdrop"
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.projectName ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                  required
                />
                {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
                <p className="text-xs text-muted-foreground mt-1">Maximum 100 characters</p>
              </div>

              {/* Project Description */}
              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-sm font-medium mb-2">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  placeholder="Brief overview of the opportunity..."
                  rows={3}
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.projectDescription ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  required
                />
                {errors.projectDescription && (
                  <p className="text-red-500 text-xs mt-1">{errors.projectDescription}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Brief summary shown in alpha cards</p>
              </div>

              {/* Category and Blockchain */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Alpha Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {alphaTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="blockchain" className="block text-sm font-medium mb-2">
                    Blockchain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="blockchain"
                    name="blockchain"
                    value={formData.blockchain}
                    onChange={handleChange}
                    placeholder="e.g., Ethereum, Arbitrum, Solana"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.blockchain ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                    required
                  />
                  {errors.blockchain && <p className="text-red-500 text-xs mt-1">{errors.blockchain}</p>}
                </div>
              </div>

              {/* Full Details */}
              <div className="mb-6">
                <label htmlFor="details" className="block text-sm font-medium mb-2">
                  Full Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="Detailed explanation of the opportunity, what makes it interesting, potential rewards, and any important information users should know..."
                  rows={8}
                  className={`w-full px-4 py-2 rounded-md bg-background border ${
                    errors.details ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  required
                />
                {errors.details && <p className="text-red-500 text-xs mt-1">{errors.details}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Provide comprehensive details. Markdown is supported.
                </p>
              </div>
            </div>

            {/* Ratings Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Ratings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Potential Rating */}
                <div>
                  <label htmlFor="potentialRating" className="block text-sm font-medium mb-2">
                    Potential Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="potentialRating"
                    name="potentialRating"
                    value={formData.potentialRating}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {potentialRatings.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(getRatingDots(formData.potentialRating))].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            formData.potentialRating === 'very_high'
                              ? 'bg-green-500'
                              : formData.potentialRating === 'high'
                              ? 'bg-blue-500'
                              : formData.potentialRating === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Rating */}
                <div>
                  <label htmlFor="riskRating" className="block text-sm font-medium mb-2">
                    Risk Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="riskRating"
                    name="riskRating"
                    value={formData.riskRating}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {riskRatings.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        formData.riskRating === 'high'
                          ? 'bg-red-500/10 text-red-500'
                          : formData.riskRating === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}
                    >
                      {formData.riskRating.charAt(0).toUpperCase() + formData.riskRating.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements & Deadline Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">
                Requirements & Timeline
              </h2>

              {/* Requirements */}
              <div className="mb-6">
                <label htmlFor="requirements" className="block text-sm font-medium mb-2">
                  Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="What users need to do to participate (e.g., Connect wallet, Complete testnet tasks, Hold specific tokens, etc.)"
                  rows={5}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  List what users need to do. Leave empty if none.
                </p>
              </div>

              {/* Deadline */}
              <div className="mb-6">
                <label htmlFor="deadline" className="block text-sm font-medium mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When does this opportunity expire? Leave empty if no deadline.
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Project Links</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Website URL */}
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://project.com"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.websiteUrl ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.websiteUrl && <p className="text-red-500 text-xs mt-1">{errors.websiteUrl}</p>}
                </div>

                {/* Twitter URL */}
                <div>
                  <label htmlFor="twitterUrl" className="block text-sm font-medium mb-2">
                    Twitter URL
                  </label>
                  <input
                    type="url"
                    id="twitterUrl"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    placeholder="https://twitter.com/project"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.twitterUrl ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.twitterUrl && <p className="text-red-500 text-xs mt-1">{errors.twitterUrl}</p>}
                </div>

                {/* Discord URL */}
                <div>
                  <label htmlFor="discordUrl" className="block text-sm font-medium mb-2">
                    Discord URL
                  </label>
                  <input
                    type="url"
                    id="discordUrl"
                    name="discordUrl"
                    value={formData.discordUrl}
                    onChange={handleChange}
                    placeholder="https://discord.gg/project"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.discordUrl ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.discordUrl && <p className="text-red-500 text-xs mt-1">{errors.discordUrl}</p>}
                </div>

                {/* Docs URL */}
                <div>
                  <label htmlFor="docsUrl" className="block text-sm font-medium mb-2">
                    Documentation URL
                  </label>
                  <input
                    type="url"
                    id="docsUrl"
                    name="docsUrl"
                    value={formData.docsUrl}
                    onChange={handleChange}
                    placeholder="https://docs.project.com"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.docsUrl ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.docsUrl && <p className="text-red-500 text-xs mt-1">{errors.docsUrl}</p>}
                </div>

                {/* Telegram URL */}
                <div className="md:col-span-2">
                  <label htmlFor="telegramUrl" className="block text-sm font-medium mb-2">
                    Telegram URL
                  </label>
                  <input
                    type="url"
                    id="telegramUrl"
                    name="telegramUrl"
                    value={formData.telegramUrl}
                    onChange={handleChange}
                    placeholder="https://t.me/project"
                    className={`w-full px-4 py-2 rounded-md bg-background border ${
                      errors.telegramUrl ? 'border-red-500' : 'border-border'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.telegramUrl && <p className="text-red-500 text-xs mt-1">{errors.telegramUrl}</p>}
                </div>
              </div>
            </div>

            {/* Tags & Status Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Additional Information</h2>

              {/* Tags */}
              <div className="mb-6">
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="airdrop, layer2, zk-rollup, high-potential"
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated tags for better discoverability
                </p>
              </div>

              {/* Status */}
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
                  {formData.status === 'pending' && 'Save as pending for review before publishing'}
                  {formData.status === 'published' && 'Publish to make it visible to all community members'}
                  {formData.status === 'archived' && 'Archive to hide from alpha listings'}
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
                  <p className="font-medium text-blue-500 mb-1">Quality Alpha Guidelines</p>
                  <p className="text-muted-foreground">
                    Provide accurate, well-researched information. Include all relevant links and details. High-quality
                    alpha submissions increase your scout reputation and earn community recognition.
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
                    Submitting...
                  </span>
                ) : formData.status === 'published' ? (
                  'Submit & Publish'
                ) : (
                  'Submit Alpha'
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
                onClick={() => router.push('/alpha')}
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
