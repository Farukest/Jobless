'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/use-admin'
import { usePublicConfigs } from '@/hooks/use-configs'
import { AdminLayout } from '@/components/admin/admin-layout'
import { userHasAnyRole } from '@/lib/utils'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'

export default function AdminSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const { data: settingsData, isLoading } = useSiteSettings()
  const { data: configs, refetch: refetchConfigs } = usePublicConfigs()
  const updateSettings = useUpdateSiteSettings()

  // Active tab from URL or default to 'general'
  const activeTab = searchParams.get('tab') || 'general'

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

  // System Config state
  const [systemConfig, setSystemConfig] = useState({
    hub_limits: {
      home_page_limit: 24,
      feed_page_limit: 10,
      content_title_max_length: 200,
      content_body_max_length: 20000,
    },
    points_config: {
      content_created: 10,
      content_featured: 50,
      engagement_given: 2,
      engagement_received: 1,
      alpha_validated: 25,
      course_completed: 30,
      production_completed: 20,
      daily_login: 1,
    },
    max_file_sizes: {
      image: 5242880,
      video: 104857600,
      document: 10485760,
      audio: 52428800,
    },
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

  // Load system config from configs
  useEffect(() => {
    if (configs) {
      setSystemConfig({
        hub_limits: configs.hub_limits || systemConfig.hub_limits,
        points_config: configs.points_config || systemConfig.points_config,
        max_file_sizes: configs.max_file_sizes || systemConfig.max_file_sizes,
      })
    }
  }, [configs])

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

  const handleSystemConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Update hub_limits
      await api.put('/admin/system-config/hub_limits', {
        value: systemConfig.hub_limits
      })

      // Update points_config
      await api.put('/admin/system-config/points_config', {
        value: systemConfig.points_config
      })

      // Update max_file_sizes
      await api.put('/admin/system-config/max_file_sizes', {
        value: systemConfig.max_file_sizes
      })

      // Invalidate configs cache to force fresh fetch (correct queryKey!)
      await queryClient.invalidateQueries({ queryKey: ['public-configs'] })

      toast.success('System configuration updated successfully')
    } catch (error) {
      toast.error('Failed to update system configuration')
    }
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

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      id: 'system',
      label: 'System Config',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-muted-foreground">Configure your Jobless platform</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border mb-6">
            <nav className="flex gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={`/admin/settings?tab=${tab.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* General Tab */}
              {activeTab === 'general' && (
                <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Modules Tab */}
              {activeTab === 'modules' && (
                <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Theme Tab */}
              {activeTab === 'theme' && (
                <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* System Config Tab */}
              {activeTab === 'system' && (
                <form onSubmit={handleSystemConfigSubmit} className="space-y-6">
                  {/* Hub Limits */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-2xl font-bold mb-4">Hub Limits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Home Page Limit</label>
                        <input
                          type="number"
                          value={systemConfig.hub_limits.home_page_limit}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            hub_limits: { ...prev.hub_limits, home_page_limit: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Feed Page Limit</label>
                        <input
                          type="number"
                          value={systemConfig.hub_limits.feed_page_limit}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            hub_limits: { ...prev.hub_limits, feed_page_limit: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title Max Length (characters)</label>
                        <input
                          type="number"
                          value={systemConfig.hub_limits.content_title_max_length}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            hub_limits: { ...prev.hub_limits, content_title_max_length: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Body Max Length (characters)</label>
                        <input
                          type="number"
                          value={systemConfig.hub_limits.content_body_max_length}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            hub_limits: { ...prev.hub_limits, content_body_max_length: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Points Config */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-2xl font-bold mb-4">Points Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Content Created</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.content_created}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, content_created: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Content Featured</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.content_featured}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, content_featured: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Engagement Given</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.engagement_given}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, engagement_given: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Engagement Received</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.engagement_received}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, engagement_received: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Alpha Validated</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.alpha_validated}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, alpha_validated: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Course Completed</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.course_completed}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, course_completed: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Production Completed</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.production_completed}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, production_completed: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Daily Login</label>
                        <input
                          type="number"
                          value={systemConfig.points_config.daily_login}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            points_config: { ...prev.points_config, daily_login: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Max File Sizes */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-2xl font-bold mb-4">Max File Sizes (bytes)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Image (5MB = 5242880)</label>
                        <input
                          type="number"
                          value={systemConfig.max_file_sizes.image}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            max_file_sizes: { ...prev.max_file_sizes, image: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Video (100MB = 104857600)</label>
                        <input
                          type="number"
                          value={systemConfig.max_file_sizes.video}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            max_file_sizes: { ...prev.max_file_sizes, video: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Document (10MB = 10485760)</label>
                        <input
                          type="number"
                          value={systemConfig.max_file_sizes.document}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            max_file_sizes: { ...prev.max_file_sizes, document: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Audio (50MB = 52428800)</label>
                        <input
                          type="number"
                          value={systemConfig.max_file_sizes.audio}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            max_file_sizes: { ...prev.max_file_sizes, audio: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                    >
                      Save System Config
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
