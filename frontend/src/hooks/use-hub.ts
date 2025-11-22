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
  viewsCount: number
  likesCount: number
  bookmarksCount: number
  isLiked?: boolean
  isBookmarked?: boolean
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
      return data.data // Backend returns { success: true, data: { isLiked, likesCount } }
    },
    onMutate: async (contentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hub', 'content', contentId] })

      // Snapshot the previous value
      const previousContent = queryClient.getQueryData<{ data: Content }>(['hub', 'content', contentId])

      // Optimistically update
      if (previousContent) {
        queryClient.setQueryData<{ data: Content }>(['hub', 'content', contentId], {
          data: {
            ...previousContent.data,
            isLiked: !previousContent.data.isLiked,
            likesCount: previousContent.data.isLiked
              ? previousContent.data.likesCount - 1
              : previousContent.data.likesCount + 1
          }
        })
      }

      return { previousContent }
    },
    onError: (err, contentId, context) => {
      // Rollback on error
      if (context?.previousContent) {
        queryClient.setQueryData(['hub', 'content', contentId], context.previousContent)
      }
    },
    onSettled: (data, error, contentId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['hub', 'content', contentId] })
      queryClient.invalidateQueries({ queryKey: ['hub', 'content'] })
    },
  })
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post(`/hub/content/${contentId}/bookmark`)
      return data.data // Backend returns { success: true, data: { isBookmarked, bookmarksCount } }
    },
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: ['hub', 'content', contentId] })

      const previousContent = queryClient.getQueryData<{ data: Content }>(['hub', 'content', contentId])

      if (previousContent) {
        queryClient.setQueryData<{ data: Content }>(['hub', 'content', contentId], {
          data: {
            ...previousContent.data,
            isBookmarked: !previousContent.data.isBookmarked,
            bookmarksCount: previousContent.data.isBookmarked
              ? previousContent.data.bookmarksCount - 1
              : previousContent.data.bookmarksCount + 1
          }
        })
      }

      return { previousContent }
    },
    onError: (err, contentId, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(['hub', 'content', contentId], context.previousContent)
      }
    },
    onSettled: (data, error, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['hub', 'content', contentId] })
      queryClient.invalidateQueries({ queryKey: ['hub', 'content'] })
    },
  })
}

// ==================== COMMENT HOOKS ====================

export interface Comment {
  _id: string
  userId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  contentType: 'hub_content' | 'alpha_post' | 'course'
  contentId: string
  content: string
  parentCommentId?: string
  likes: number
  likedBy: string[]
  repliesCount: number
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Get single comment by ID
 */
export function useCommentById(commentId: string) {
  return useQuery({
    queryKey: ['comment', commentId],
    queryFn: async () => {
      const { data } = await api.get(`/comments/single/${commentId}`)
      return data
    },
    enabled: !!commentId,
  })
}

/**
 * Get comments for content
 */
export function useComments(contentType: string, contentId: string) {
  return useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: async () => {
      const { data } = await api.get(`/comments/${contentType}/${contentId}`)
      return data
    },
    enabled: !!contentType && !!contentId,
  })
}

/**
 * Get replies for a comment
 */
export function useReplies(commentId: string) {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: async () => {
      const { data } = await api.get(`/comments/${commentId}/replies`)
      return data
    },
    enabled: !!commentId,
  })
}

/**
 * Create comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      content,
      parentCommentId
    }: {
      contentType: string
      contentId: string
      content: string
      parentCommentId?: string
    }) => {
      const { data } = await api.post(`/comments/${contentType}/${contentId}`, {
        content,
        parentCommentId
      })
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.contentType, variables.contentId]
      })

      // If this is a reply to a comment, invalidate replies
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['replies', variables.parentCommentId]
        })
      }

      // Update content's comment count
      queryClient.invalidateQueries({
        queryKey: ['hub', 'content', variables.contentId]
      })
    },
  })
}

/**
 * Toggle comment like
 */
export function useToggleCommentLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.post(`/comments/${commentId}/like`)
      return data
    },
    onSuccess: (data, commentId) => {
      // WebSocket will handle real-time updates for other clients
      // But we need optimistic update for current client

      // Update comment in comments list
      queryClient.setQueriesData({ queryKey: ['comments'] }, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((comment: any) =>
            comment._id === commentId
              ? { ...comment, likes: data.data.likes, likedBy: comment.likedBy || [] }
              : comment
          )
        }
      })

      // Update comment in replies list
      queryClient.setQueriesData({ queryKey: ['replies'] }, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((reply: any) =>
            reply._id === commentId
              ? { ...reply, likes: data.data.likes, likedBy: reply.likedBy || [] }
              : reply
          )
        }
      })

      // Update single comment if it's cached
      queryClient.setQueryData(['comment', commentId], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            likes: data.data.likes,
            likedBy: old.data.likedBy || []
          }
        }
      })
    },
  })
}

/**
 * Delete comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.delete(`/comments/${commentId}`)
      return data
    },
    onSuccess: () => {
      // WebSocket will handle real-time deletion updates
      // Just invalidate queries to refetch if needed
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['replies'] })
    },
  })
}
