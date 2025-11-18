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
    canAccessJHub: boolean
    canAccessJStudio: boolean
    canAccessJAcademy: boolean
    canAccessJInfo: boolean
    canAccessJAlpha: boolean
    canCreateContent: boolean
    canModerateContent: boolean
    canManageUsers: boolean
    canManageRoles: boolean
    canManageSiteSettings: boolean
    customPermissions: string[]
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

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    refreshUser,
    hasRole: (role: string) => user?.roles?.includes(role) ?? false,
    hasPermission: (permission: keyof User['permissions']) => user?.permissions?.[permission] ?? false,
  }
}
