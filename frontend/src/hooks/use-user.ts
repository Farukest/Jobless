'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
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

// Profile Feed Types
export interface ProfileFeedContent {
  _id: string
  title: string
  description?: string
  body?: string
  contentType: string
  category: string
  difficulty?: string
  tags?: string[]
  authorId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
    walletAddress: string
  }
  viewsCount: number
  likesCount: number
  bookmarksCount: number
  commentsCount: number
  isLiked?: boolean
  isBookmarked?: boolean
  isFeatured: boolean
  isPinned: boolean
  status: string
  createdAt: string
}

export interface ProfileFeedResponse {
  success: boolean
  data: ProfileFeedContent[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

export interface CommentThreadData {
  contentId: string
  content: ProfileFeedContent
  thread: Array<{
    type: 'content' | 'comment'
    data: any
    isUserComment: boolean
  }>
}

export interface CommentedFeedResponse {
  success: boolean
  data: CommentThreadData[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

// My Zone Feed - User's own content
export function useMyZoneFeed(userId: string | undefined, enabled: boolean = true) {
  return useInfiniteQuery<ProfileFeedResponse>({
    queryKey: ['user', 'feed', 'my-zone', userId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/users/${userId}/feed/my-zone`, {
        params: { page: pageParam },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!userId,
  })
}

// My Feed - Interest-based recommendations
export function useMyFeed(userId: string | undefined, enabled: boolean = true) {
  return useInfiniteQuery<ProfileFeedResponse>({
    queryKey: ['user', 'feed', 'my-feed', userId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/users/${userId}/feed/my-feed`, {
        params: { page: pageParam },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!userId,
  })
}

// Commented Feed - Posts with comment threads
export function useCommentedFeed(userId: string | undefined, enabled: boolean = true) {
  return useInfiniteQuery<CommentedFeedResponse>({
    queryKey: ['user', 'feed', 'commented', userId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/users/${userId}/feed/commented`, {
        params: { page: pageParam },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!userId,
  })
}

// Liked Feed - Posts user liked
export function useLikedFeed(userId: string | undefined, enabled: boolean = true) {
  return useInfiniteQuery<ProfileFeedResponse>({
    queryKey: ['user', 'feed', 'liked', userId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/users/${userId}/feed/liked`, {
        params: { page: pageParam },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!userId,
  })
}
