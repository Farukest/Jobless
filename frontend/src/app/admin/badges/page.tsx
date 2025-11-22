'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  useAllBadges,
  useBadgeStatistics,
  useCreateBadge,
  useUpdateBadge,
  useDeleteBadge,
  useAwardBadge,
  useRemoveBadgeFromUser
} from '@/hooks/use-badges'
import { BadgeDisplay } from '@/components/badges/badge-display'
import toast from 'react-hot-toast'

interface BadgeFormData {
  name: string
  displayName: string
  description: string
  iconName: string
  color: string
  gradientStart?: string
  gradientEnd?: string
  animationType: string
  type: string
  category: string
  rarity: string
  tier?: string
  isActive: boolean
  requiredRoles?: string[]
  criteria?: {
    type: string
    target: number
    operator?: string
    module?: string
    timeframe?: string
  }
}

export default function AdminBadgesPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    rarity: '',
    isActive: undefined as boolean | undefined
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<any>(null)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [selectedBadgeForAward, setSelectedBadgeForAward] = useState<any>(null)

  const { data: badges, isLoading } = useAllBadges(filters)
  const { data: stats } = useBadgeStatistics()
  const { mutate: createBadge } = useCreateBadge()
  const { mutate: updateBadge } = useUpdateBadge()
  const { mutate: deleteBadge } = useDeleteBadge()
  const { mutate: awardBadge } = useAwardBadge()

  const [formData, setFormData] = useState<BadgeFormData>({
    name: '',
    displayName: '',
    description: '',
    iconName: '',
    color: '#6366f1',
    gradientStart: '',
    gradientEnd: '',
    animationType: 'pulse',
    type: 'activity',
    category: 'general',
    rarity: 'common',
    tier: 'entry',
    isActive: true,
    requiredRoles: [],
    criteria: {
      type: 'content_count',
      target: 1,
      operator: 'gte',
      module: 'hub',
      timeframe: 'all_time'
    }
  })

  const animationTypes = [
    'pulse', 'glow', 'shimmer', 'sparkle', 'wave', 'bounce',
    'rotate', 'flash', 'flip', 'scan', 'divine', 'float'
  ]

  const badgeTypes = ['role', 'activity', 'achievement', 'special']
  const categories = ['hub', 'studio', 'academy', 'alpha', 'info', 'general', 'admin']
  const rarities = ['common', 'rare', 'epic', 'legendary']
  const tiers = ['entry', 'progress', 'mastery', 'elite', 'legendary', 'special']
  const criteriaTypes = [
    'content_count', 'like_count', 'engagement_count', 'course_count',
    'enrollment_count', 'completion_count', 'alpha_count', 'comment_count',
    'jrank_points', 'contribution_score', 'time_based', 'request_count',
    'rating_avg', 'rating_count', 'vote_count', 'bullish_count',
    'days_active', 'streak_days', 'user_id_threshold'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingBadge) {
      updateBadge(
        { badgeId: editingBadge._id, updates: formData },
        {
          onSuccess: () => {
            toast.success('Badge updated successfully')
            setShowCreateModal(false)
            setEditingBadge(null)
            resetForm()
          },
          onError: () => {
            toast.error('Failed to update badge')
          }
        }
      )
    } else {
      createBadge(formData, {
        onSuccess: () => {
          toast.success('Badge created successfully')
          setShowCreateModal(false)
          resetForm()
        },
        onError: () => {
          toast.error('Failed to create badge')
        }
      })
    }
  }

  const handleDelete = (badgeId: string) => {
    if (confirm('Are you sure you want to delete this badge?')) {
      deleteBadge(badgeId, {
        onSuccess: () => {
          toast.success('Badge deleted successfully')
        },
        onError: () => {
          toast.error('Failed to delete badge')
        }
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      iconName: '',
      color: '#6366f1',
      gradientStart: '',
      gradientEnd: '',
      animationType: 'pulse',
      type: 'activity',
      category: 'general',
      rarity: 'common',
      tier: 'entry',
      isActive: true,
      requiredRoles: [],
      criteria: {
        type: 'content_count',
        target: 1,
        operator: 'gte',
        module: 'hub',
        timeframe: 'all_time'
      }
    })
  }

  if (!user?.roles?.includes('super_admin')) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">Only super admins can manage badges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Badge Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage platform badges</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true)
              setEditingBadge(null)
              resetForm()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create New Badge
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Total Badges</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBadges}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Active Badges</p>
              <p className="text-3xl font-bold mt-2 text-green-500">{stats.activeBadges}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Total Awards</p>
              <p className="text-3xl font-bold mt-2 text-blue-500">{stats.totalUserBadges}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground">Unique Recipients</p>
              <p className="text-3xl font-bold mt-2 text-purple-500">{stats.uniqueRecipients}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">All Types</option>
                {badgeTypes.map((type) => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rarity</label>
              <select
                value={filters.rarity}
                onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">All Rarities</option>
                {rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>{rarity.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => setFilters({
                  ...filters,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badge List */}
        <div className="bg-card rounded-lg border border-border p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading badges...</p>
            </div>
          ) : badges?.data && badges.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.data.map((badge: any) => (
                <div
                  key={badge._id}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <BadgeDisplay
                      iconName={badge.iconName}
                      displayName={badge.displayName}
                      color={badge.color}
                      gradientStart={badge.gradientStart}
                      gradientEnd={badge.gradientEnd}
                      animationType={badge.animationType}
                      rarity={badge.rarity}
                      size="md"
                      showName={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{badge.displayName}</h3>
                          <p className="text-xs text-muted-foreground truncate">{badge.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!badge.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {badge.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {badge.type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {badge.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${
                          badge.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                          badge.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                          badge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {badge.rarity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingBadge(badge)
                            setFormData({
                              name: badge.name,
                              displayName: badge.displayName,
                              description: badge.description,
                              iconName: badge.iconName,
                              color: badge.color,
                              gradientStart: badge.gradientStart || '',
                              gradientEnd: badge.gradientEnd || '',
                              animationType: badge.animationType,
                              type: badge.type,
                              category: badge.category,
                              rarity: badge.rarity,
                              tier: badge.tier || 'entry',
                              isActive: badge.isActive,
                              requiredRoles: badge.requiredRoles || [],
                              criteria: badge.criteria || {
                                type: 'content_count',
                                target: 1,
                                operator: 'gte',
                                module: 'hub',
                                timeframe: 'all_time'
                              }
                            })
                            setShowCreateModal(true)
                          }}
                          className="text-xs px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBadgeForAward(badge)
                            setShowAwardModal(true)
                          }}
                          className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                        >
                          Award
                        </button>
                        <button
                          onClick={() => handleDelete(badge._id)}
                          className="text-xs px-3 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No badges found</p>
            </div>
          )}
        </div>

        {/* Create/Edit Badge Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name (ID)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      required
                      placeholder="badge_name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      required
                      placeholder="Badge Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    rows={3}
                    required
                    placeholder="Badge description..."
                  />
                </div>

                {/* Visual */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Icon Name</label>
                    <input
                      type="text"
                      value={formData.iconName}
                      onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      required
                      placeholder="IconName"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Animation</label>
                    <select
                      value={formData.animationType}
                      onChange={(e) => setFormData({ ...formData, animationType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {animationTypes.map((anim) => (
                        <option key={anim} value={anim}>{anim}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 rounded-lg border border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gradient Start</label>
                    <input
                      type="color"
                      value={formData.gradientStart}
                      onChange={(e) => setFormData({ ...formData, gradientStart: e.target.value })}
                      className="w-full h-10 rounded-lg border border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gradient End</label>
                    <input
                      type="color"
                      value={formData.gradientEnd}
                      onChange={(e) => setFormData({ ...formData, gradientEnd: e.target.value })}
                      className="w-full h-10 rounded-lg border border-border"
                    />
                  </div>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {badgeTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rarity</label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {rarities.map((rarity) => (
                        <option key={rarity} value={rarity}>{rarity}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Criteria */}
                {formData.type !== 'role' && formData.criteria && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Earning Criteria</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Criteria Type</label>
                        <select
                          value={formData.criteria.type}
                          onChange={(e) => setFormData({
                            ...formData,
                            criteria: { ...formData.criteria!, type: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        >
                          {criteriaTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Target Value</label>
                        <input
                          type="number"
                          value={formData.criteria.target}
                          onChange={(e) => setFormData({
                            ...formData,
                            criteria: { ...formData.criteria!, target: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active (badge can be awarded)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingBadge(null)
                      resetForm()
                    }}
                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {editingBadge ? 'Update Badge' : 'Create Badge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
