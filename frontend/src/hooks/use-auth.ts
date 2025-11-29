'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export interface User {
  _id: string
  twitterId?: string
  twitterUsername?: string
  walletAddress?: string
  displayName?: string
  profileImage?: string
  bio?: string
  roles: string[]
  permissions: {
    hub: {
      canAccess: boolean
      canCreate: boolean
      canModerate: boolean
      allowedContentTypes: string[]
    }
    studio: {
      canAccess: boolean
      canCreateRequest: boolean
      canClaimRequest: boolean
      allowedRequestTypes: string[]
    }
    academy: {
      canAccess: boolean
      canEnroll: boolean
      canTeach: boolean
      canCreateCourseRequest: boolean
      allowedCourseCategories: string[]
    }
    info: {
      canAccess: boolean
      canSubmitEngagement: boolean
      allowedPlatforms: string[]
      allowedEngagementTypes: string[]
    }
    alpha: {
      canAccess: boolean
      canSubmitAlpha: boolean
      canModerate: boolean
      allowedAlphaCategories: string[]
    }
    admin: {
      canManageUsers: boolean
      canManageRoles: boolean
      canManageSiteSettings: boolean
      canModerateAllContent: boolean
    }
  }
  theme: 'light' | 'dark'
  jRankPoints?: number
  contributionScore?: number
  whitelistWallets?: string[]
}

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data.user
    },
    enabled: hasToken,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - balance between performance and security
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/login')
      toast.success('Logged out successfully')
    },
    onError: () => {
      toast.error('Failed to logout')
    },
  })

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  /**
   * Check if user has a specific permission
   * Supports both modern nested format (e.g., 'hub.canCreate') and backward compatibility
   */
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false

    // Modern nested format: 'module.permission' (e.g., 'hub.canCreate')
    if (permission.includes('.')) {
      const [module, key] = permission.split('.')
      const modulePerms = user.permissions[module as keyof typeof user.permissions] as any
      return modulePerms?.[key] ?? false
    }

    // Backward compatibility: map old flat keys to new nested structure
    const legacyMapping: Record<string, string> = {
      canAccessJHub: 'hub.canAccess',
      canAccessJStudio: 'studio.canAccess',
      canAccessJAcademy: 'academy.canAccess',
      canAccessJInfo: 'info.canAccess',
      canAccessJAlpha: 'alpha.canAccess',
      canCreateContent: 'hub.canCreate',
      canModerateContent: 'hub.canModerate',
      canManageUsers: 'admin.canManageUsers',
      canManageRoles: 'admin.canManageRoles',
      canManageSiteSettings: 'admin.canManageSiteSettings',
      canEnrollCourses: 'academy.canEnroll',
      canTeachCourses: 'academy.canTeach',
      canSubmitProposals: 'alpha.canSubmitAlpha',
    }

    const modernKey = legacyMapping[permission]
    if (modernKey) {
      return hasPermission(modernKey)
    }

    return false
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    refreshUser,
    hasRole: (role: string) => user?.roles?.some((r: any) => r.name === role || r === role) ?? false,
    hasPermission,
  }
}
