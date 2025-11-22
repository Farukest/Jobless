'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/use-admin'
import { AdminLayout } from '@/components/admin/admin-layout'
import { userHasAnyRole } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const { data: settingsData, isLoading } = useSiteSettings()
  const updateSettings = useUpdateSiteSettings()

  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    maintenanceMode: false,
    headerText: '',
    footerText: '',
    features: {
      jHub: { enabled: true },
      jStudio: { enabled: true },
      jAcademy: { enabled: true },
      jAlpha: { enabled: true },
      jInfo: { enabled: true },
    },
    themeColors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
    },
    navigation: [] as any[],
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!userHasAnyRole(user, ['admin', 'super_admin'])) {
      router.push('/')
      return
    }
  }, [mounted, authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (settingsData?.data) {
      setFormData({
        siteName: settingsData.data.siteName || '',
        siteDescription: settingsData.data.siteDescription || '',
        maintenanceMode: settingsData.data.maintenanceMode || false,
        headerText: settingsData.data.headerText || '',
        footerText: settingsData.data.footerText || '',
        features: settingsData.data.features || {
          jHub: { enabled: true },
          jStudio: { enabled: true },
          jAcademy: { enabled: true },
          jAlpha: { enabled: true },
          jInfo: { enabled: true },
        },
        themeColors: settingsData.data.themeColors || {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
        },
        navigation: settingsData.data.navigation || [],
      })
    }
  }, [settingsData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateSettings.mutateAsync(formData)
      toast.success('Settings updated successfully')
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleToggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: {
          ...prev.features[feature as keyof typeof prev.features],
          enabled: !prev.features[feature as keyof typeof prev.features].enabled,
        },
      },
    }))
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !userHasAnyRole(user, ['admin', 'super_admin'])) {
    return null
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Site Settings</h1>
            <p className="text-muted-foreground">Configure your Jobless platform</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* General Settings */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Name</label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => setFormData(prev => ({ ...prev, siteName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-background border border-border"
                      placeholder="Jobless"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Description</label>
                    <textarea
                      value={formData.siteDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, siteDescription: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-background border border-border"
                      rows={3}
                      placeholder="Web3 social platform for learning and earning"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="maintenanceMode" className="text-sm font-medium">
                      Maintenance Mode
                    </label>
                  </div>
                </div>
              </div>

              {/* Header & Footer */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Header & Footer</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Header Text</label>
                    <input
                      type="text"
                      value={formData.headerText}
                      onChange={(e) => setFormData(prev => ({ ...prev, headerText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-background border border-border"
                      placeholder="Welcome to Jobless"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Footer Text</label>
                    <input
                      type="text"
                      value={formData.footerText}
                      onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-background border border-border"
                      placeholder="© 2024 Jobless. All rights reserved."
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Platform Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">J Hub</p>
                      <p className="text-sm text-muted-foreground">Content sharing platform</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('jHub')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.features.jHub?.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.features.jHub?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">J Studio</p>
                      <p className="text-sm text-muted-foreground">Creative production requests</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('jStudio')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.features.jStudio?.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.features.jStudio?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">J Academy</p>
                      <p className="text-sm text-muted-foreground">Online learning courses</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('jAcademy')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.features.jAcademy?.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.features.jAcademy?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">J Alpha</p>
                      <p className="text-sm text-muted-foreground">Early project discovery</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('jAlpha')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.features.jAlpha?.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.features.jAlpha?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">J Info</p>
                      <p className="text-sm text-muted-foreground">Social engagement support</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('jInfo')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.features.jInfo?.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.features.jInfo?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Colors */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Theme Colors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.themeColors.primary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          themeColors: { ...prev.themeColors, primary: e.target.value }
                        }))}
                        className="h-10 w-20 rounded border border-border"
                      />
                      <input
                        type="text"
                        value={formData.themeColors.primary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          themeColors: { ...prev.themeColors, primary: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 rounded-md bg-background border border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.themeColors.secondary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          themeColors: { ...prev.themeColors, secondary: e.target.value }
                        }))}
                        className="h-10 w-20 rounded border border-border"
                      />
                      <input
                        type="text"
                        value={formData.themeColors.secondary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          themeColors: { ...prev.themeColors, secondary: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 rounded-md bg-background border border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettings.isPending}
                  className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
