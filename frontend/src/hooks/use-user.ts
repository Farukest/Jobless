'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserStats {
  jHub: {
    contentsCreated: number
  }
  jStudio: {
    requestsSubmitted: number
  }
  jAcademy: {
    coursesCreated: number
  }
  jAlpha: {
    alphasSubmitted: number
  }
  jInfo: {
    engagementsGiven: number
  }
  overall: {
    jRankPoints: number
    contributionScore: number
  }
}

export interface UserActivity {
  type: string
  module: string
  description: string
  timestamp: string
  status: string
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/users/stats')
      return data.data
    },
  })
}

export function useUserActivity(page: number = 1, limit: number = 20) {
  return useQuery<{
    data: UserActivity[]
    count: number
    total: number
    page: number
    pages: number
  }>({
    queryKey: ['user', 'activity', page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/users/activity?page=${page}&limit=${limit}`)
      return data
    },
  })
}
