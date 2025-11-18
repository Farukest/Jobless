'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AlphaPost {
  _id: string
  scoutId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
    reputationScore?: number
  }
  title: string
  description: string
  alphaType: 'airdrop' | 'testnet' | 'memecoin' | 'defi' | 'nft_mint' | 'other'
  potentialRating: 1 | 2 | 3 | 4
  riskRating: 'low' | 'medium' | 'high'
  status: 'active' | 'expired' | 'verified'
  bullishVotes: number
  bearishVotes: number
  viewCount: number
  resourceLinks: Array<{
    url: string
    title: string
  }>
  tags: string[]
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface AlphaFilters {
  page?: number
  limit?: number
  alphaType?: string
  potentialRating?: number
  riskRating?: string
  status?: string
  sortBy?: string
  search?: string
}

export interface AlphaStats {
  totalAlphas: number
  activeAlphas: number
  successRate: number
  topScouts: number
}

// Fetch alpha posts with filters
export function useAlphaPosts(filters: AlphaFilters = {}) {
  return useQuery<{
    data: AlphaPost[]
    count: number
    total: number
    page: number
    pages: number
    stats?: AlphaStats
  }>({
    queryKey: ['alpha', 'posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.alphaType) params.append('alphaType', filters.alphaType)
      if (filters.potentialRating) params.append('potentialRating', filters.potentialRating.toString())
      if (filters.riskRating) params.append('riskRating', filters.riskRating)
      if (filters.status) params.append('status', filters.status)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.search) params.append('search', filters.search)

      const { data } = await api.get(`/alpha/posts?${params.toString()}`)
      return data
    },
  })
}

// Fetch single alpha post by ID
export function useAlphaPost(id: string) {
  return useQuery<{
    data: AlphaPost
  }>({
    queryKey: ['alpha', 'post', id],
    queryFn: async () => {
      const { data } = await api.get(`/alpha/posts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create a new alpha post
export function useCreateAlphaPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postData: any) => {
      const { data } = await api.post('/alpha/posts', postData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'my-posts'] })
    },
  })
}

// Vote on an alpha post
export function useVoteOnAlpha(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (voteType: 'bullish' | 'bearish') => {
      const { data } = await api.post(`/alpha/posts/${postId}/vote`, { voteType })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'post', postId] })
    },
  })
}

// Fetch user's own alpha posts
export function useMyAlphas() {
  return useQuery<{
    data: AlphaPost[]
    count: number
  }>({
    queryKey: ['alpha', 'my-posts'],
    queryFn: async () => {
      const { data } = await api.get('/alpha/my-posts')
      return data
    },
  })
}

// Update an alpha post
export function useUpdateAlphaPost(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postData: any) => {
      const { data } = await api.put(`/alpha/posts/${postId}`, postData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'post', postId] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'my-posts'] })
    },
  })
}

// Delete an alpha post
export function useDeleteAlphaPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.delete(`/alpha/posts/${postId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alpha', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['alpha', 'my-posts'] })
    },
  })
}
