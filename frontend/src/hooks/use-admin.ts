import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useAdminLogs = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['admin-logs', page, limit],
    queryFn: async () => {
      const response = await api.get(`/admin-logs?page=${page}&limit=${limit}`)
      return response.data
    },
  })
}

export const useAllUsers = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}`)
      return response.data
    },
  })
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const response = await api.put(`/admin/users/${userId}/roles`, { roles })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: any }) => {
      const response = await api.put(`/admin/users/${userId}/permissions`, { permissions })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, ...data }: { userId: string; [key: string]: any }) => {
      const response = await api.put(`/admin/users/${userId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export const useAdminAnalytics = (period = '30d') => {
  return useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const response = await api.get(`/admin/analytics?period=${period}`)
      return response.data
    },
  })
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await api.get('/configs/site-settings')
      return response.data
    },
  })
}

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await api.put('/configs/site-settings', settings)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] })
    },
  })
}
