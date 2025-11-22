import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ============================================
// USER BADGE HOOKS
// ============================================

/**
 * Get my badges
 */
export function useMyBadges() {
  return useQuery({
    queryKey: ['myBadges'],
    queryFn: async () => {
      const { data } = await api.get('/badges/my-badges')
      return data
    }
  })
}

/**
 * Get user badges (public)
 */
export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      const { data } = await api.get(`/badges/user/${userId}`)
      return data
    },
    enabled: !!userId
  })
}

/**
 * Get my pinned badges
 */
export function useMyPinnedBadges() {
  return useQuery({
    queryKey: ['myPinnedBadges'],
    queryFn: async () => {
      const { data } = await api.get('/badges/pinned')
      return data
    }
  })
}

/**
 * Pin a badge
 */
export function usePinBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { data } = await api.post(`/badges/pin/${badgeId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBadges'] })
      queryClient.invalidateQueries({ queryKey: ['myPinnedBadges'] })
    }
  })
}

/**
 * Unpin a badge
 */
export function useUnpinBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { data } = await api.delete(`/badges/pin/${badgeId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBadges'] })
      queryClient.invalidateQueries({ queryKey: ['myPinnedBadges'] })
    }
  })
}

/**
 * Toggle badge visibility
 */
export function useToggleBadgeVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { data } = await api.patch(`/badges/visibility/${badgeId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBadges'] })
    }
  })
}

/**
 * Manually check badges (trigger badge calculation)
 */
export function useCheckBadges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/badges/check')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBadges'] })
      queryClient.invalidateQueries({ queryKey: ['myPinnedBadges'] })
    }
  })
}

// ============================================
// ADMIN BADGE HOOKS
// ============================================

/**
 * Get all badges (admin)
 */
export function useAllBadges(filters?: {
  category?: string
  type?: string
  rarity?: string
  isActive?: boolean
}) {
  const queryString = new URLSearchParams(
    Object.entries(filters || {}).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return useQuery({
    queryKey: ['allBadges', filters],
    queryFn: async () => {
      const { data } = await api.get(`/badges/admin/all?${queryString}`)
      return data
    }
  })
}

/**
 * Get single badge (admin)
 */
export function useBadge(badgeId: string) {
  return useQuery({
    queryKey: ['badge', badgeId],
    queryFn: async () => {
      const { data } = await api.get(`/badges/admin/${badgeId}`)
      return data
    },
    enabled: !!badgeId
  })
}

/**
 * Get badge statistics (admin)
 */
export function useBadgeStatistics() {
  return useQuery({
    queryKey: ['badgeStatistics'],
    queryFn: async () => {
      const { data } = await api.get('/badges/admin/stats')
      return data
    }
  })
}

/**
 * Create badge (admin)
 */
export function useCreateBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (badgeData: any) => {
      const { data } = await api.post('/badges/admin/create', badgeData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBadges'] })
      queryClient.invalidateQueries({ queryKey: ['badgeStatistics'] })
    }
  })
}

/**
 * Update badge (admin)
 */
export function useUpdateBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ badgeId, updates }: { badgeId: string; updates: any }) => {
      const { data } = await api.put(`/badges/admin/${badgeId}`, updates)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allBadges'] })
      queryClient.invalidateQueries({ queryKey: ['badge', variables.badgeId] })
    }
  })
}

/**
 * Delete badge (admin)
 */
export function useDeleteBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { data } = await api.delete(`/badges/admin/${badgeId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBadges'] })
      queryClient.invalidateQueries({ queryKey: ['badgeStatistics'] })
    }
  })
}

/**
 * Manually award badge to user (admin)
 */
export function useAwardBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, badgeId, note }: { userId: string; badgeId: string; note?: string }) => {
      const { data } = await api.post('/badges/admin/award', { userId, badgeId, note })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBadges'] })
    }
  })
}

/**
 * Remove badge from user (admin)
 */
export function useRemoveBadgeFromUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, badgeId }: { userId: string; badgeId: string }) => {
      const { data } = await api.delete('/badges/admin/remove', { data: { userId, badgeId } })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBadges'] })
    }
  })
}
