'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '@/contexts/socket-context'

type RoomType = 'content' | 'course' | 'alpha'

interface LikeUpdateData {
  contentId?: string
  courseId?: string
  postId?: string
  likesCount: number
  isLiked: boolean
}

interface BookmarkUpdateData {
  contentId?: string
  courseId?: string
  bookmarksCount: number
  isBookmarked: boolean
}

interface ViewUpdateData {
  contentId?: string
  courseId?: string
  postId?: string
  viewsCount: number
}

/**
 * Hook to listen for real-time engagement updates
 * Automatically joins room on mount and leaves on unmount
 */
export function useEngagementListener(
  roomType: RoomType,
  id: string,
  enabled: boolean = true
) {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !isConnected || !socket || !id) {
      return
    }

    // Join the room
    joinRoom(roomType, id)

    // Listen for like updates
    const handleLikeUpdate = (data: LikeUpdateData) => {
      console.log(`[WebSocket] Like update received for ${roomType}:`, data)

      if (roomType === 'content' && data.contentId === id) {
        queryClient.setQueryData(['hub', 'content', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              likesCount: data.likesCount,
              isLiked: data.isLiked
            }
          }
        })
      } else if (roomType === 'course' && data.courseId === id) {
        queryClient.setQueryData(['academy', 'course', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              likesCount: data.likesCount,
              isLiked: data.isLiked
            }
          }
        })
      } else if (roomType === 'alpha' && data.postId === id) {
        queryClient.setQueryData(['alpha', 'post', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              likesCount: data.likesCount,
              isLiked: data.isLiked
            }
          }
        })
      }
    }

    // Listen for bookmark updates
    const handleBookmarkUpdate = (data: BookmarkUpdateData) => {
      console.log(`[WebSocket] Bookmark update received for ${roomType}:`, data)

      if (roomType === 'content' && data.contentId === id) {
        queryClient.setQueryData(['hub', 'content', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              bookmarksCount: data.bookmarksCount,
              isBookmarked: data.isBookmarked
            }
          }
        })
      } else if (roomType === 'course' && data.courseId === id) {
        queryClient.setQueryData(['academy', 'course', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              bookmarksCount: data.bookmarksCount,
              isBookmarked: data.isBookmarked
            }
          }
        })
      }
    }

    // Listen for view updates
    const handleViewUpdate = (data: ViewUpdateData) => {
      console.log(`[WebSocket] View update received for ${roomType}:`, data)

      if (roomType === 'content' && data.contentId === id) {
        queryClient.setQueryData(['hub', 'content', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              viewsCount: data.viewsCount
            }
          }
        })
      } else if (roomType === 'course' && data.courseId === id) {
        queryClient.setQueryData(['academy', 'course', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              viewsCount: data.viewsCount
            }
          }
        })
      } else if (roomType === 'alpha' && data.postId === id) {
        queryClient.setQueryData(['alpha', 'post', id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              viewsCount: data.viewsCount
            }
          }
        })
      }
    }

    // Attach listeners
    socket.on('likeUpdate', handleLikeUpdate)
    socket.on('bookmarkUpdate', handleBookmarkUpdate)
    socket.on('viewUpdate', handleViewUpdate)

    // Cleanup
    return () => {
      socket.off('likeUpdate', handleLikeUpdate)
      socket.off('bookmarkUpdate', handleBookmarkUpdate)
      socket.off('viewUpdate', handleViewUpdate)
      leaveRoom(roomType, id)
    }
  }, [socket, isConnected, roomType, id, enabled, joinRoom, leaveRoom, queryClient])
}
