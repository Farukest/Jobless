'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface EngagementPost {
  _id: string
  platform: 'twitter' | 'farcaster'
  postUrl: string
  campaignName: string
  engagementType: string
  status: 'active' | 'completed' | 'expired'
  isVerified: boolean
  submitterId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
}

export interface UserEngagement {
  post: EngagementPost
  engagement?: {
    userId: string
    proofUrl: string
    engagedAt: string
    pointsEarned: number
  }
}

// Get user's own engagement participations
export function useMyEngagements() {
  return useQuery<{
    data: UserEngagement[]
    count: number
    total: number
    page: number
    pages: number
    totalPointsEarned: number
  }>({
    queryKey: ['info', 'my-engagements'],
    queryFn: async () => {
      const { data } = await api.get('/info/my-engagements')
      return data
    },
  })
}

export const useUserEngagements = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['user-engagements', page],
    queryFn: async () => {
      const response = await api.get(`/user-engagements?page=${page}&limit=${limit}`)
      return response.data
    },
  })
}

export const useCreateEngagement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { engagementPostId: string; proofUrl: string; screenshot?: string }) => {
      const response = await api.post('/user-engagements', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-engagements'] })
    },
  })
}
