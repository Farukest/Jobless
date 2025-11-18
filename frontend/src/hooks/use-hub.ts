'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Content {
  _id: string
  authorId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  title: string
  description?: string
  contentType: 'video' | 'thread' | 'podcast' | 'guide' | 'tutorial'
  body?: string
  mediaUrls: Array<{
    type: 'image' | 'video' | 'audio' | 'document'
    url: string
    thumbnail?: string
    duration?: number
    size?: number
  }>
  tags: string[]
  category: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  views: number
  likes: number
  bookmarks: number
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  isFeatured: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface HubFilters {
  page?: number
  limit?: number
  category?: string
  contentType?: string
  difficulty?: string
  tags?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useHubContent(filters: HubFilters = {}) {
  return useQuery<{
    data: Content[]
    count: number
    total: number
    page: number
    pages: number
  }>({
    queryKey: ['hub', 'content', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.category) params.append('category', filters.category)
      if (filters.contentType) params.append('contentType', filters.contentType)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.tags) params.append('tags', filters.tags)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const { data } = await api.get(`/hub/content?${params.toString()}`)
      return data
    },
  })
}

export function useFeaturedContent(limit: number = 5) {
  return useQuery<{
    data: Content[]
    count: number
  }>({
    queryKey: ['hub', 'featured', limit],
    queryFn: async () => {
      const { data } = await api.get(`/hub/featured?limit=${limit}`)
      return data
    },
  })
}

export function useContent(id: string) {
  return useQuery<{
    data: Content
  }>({
    queryKey: ['hub', 'content', id],
    queryFn: async () => {
      const { data } = await api.get(`/hub/content/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post(`/hub/content/${contentId}/like`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub', 'content'] })
    },
  })
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post(`/hub/content/${contentId}/bookmark`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub', 'content'] })
    },
  })
}
