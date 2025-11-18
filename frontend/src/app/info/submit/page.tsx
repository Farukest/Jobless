'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function InfoSubmitPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    platform: '',
    postUrl: '',
    campaignName: '',
    engagementType: 'like',
    requiredActions: [] as string[],
    description: '',
    expiresAt: '',
  })

  // Dynamic config options
  const platforms = configs?.platforms || []
  const availableActions = configs?.required_actions || []

  // Set default platform when configs load
  useEffect(() => {
    if (configs && !formData.platform) {
      setFormData((prev) => ({
        ...prev,
        platform: configs.platforms?.[0] || 'twitter',
      }))
    }
  }, [configs, formData.platform])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post('/info/posts', {
        ...formData,
        requiredActions: formData.requiredActions.length > 0 ? formData.requiredActions : ['like'],
      })

      toast.success('Engagement post submitted successfully')
      router.push('/info')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit engagement post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAction = (action: string) => {
    if (formData.requiredActions.includes(action)) {
      setFormData({
        ...formData,
        requiredActions: formData.requiredActions.filter((a) => a !== action),
      })
    } else {
      setFormData({
        ...formData,
        requiredActions: [...formData.requiredActions, action],
      })
    }
  }

  if (isLoading || configsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
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
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Submit Engagement Post</h1>
            <p className="text-muted-foreground">Share your post for community engagement support</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {platforms.map((platform: string) => (
                  <option key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Post URL *</label>
              <input
                type="url"
                value={formData.postUrl}
                onChange={(e) => setFormData({ ...formData, postUrl: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://twitter.com/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name *</label>
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Kaito Quest #5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Required Actions</label>
              <div className="space-y-2">
                {availableActions.map((action: string) => (
                  <label key={action} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiredActions.includes(action)}
                      onChange={() => toggleAction(action)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="capitalize">{action.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              {availableActions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">Loading available actions...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Additional details about this engagement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Post'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/info')}
                className="px-6 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 font-medium"
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
