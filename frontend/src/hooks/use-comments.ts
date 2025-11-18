import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useContentComments = (contentId: string) => {
  return useQuery({
    queryKey: ['content-comments', contentId],
    queryFn: async () => {
      const response = await api.get(`/content-comments/${contentId}`)
      return response.data
    },
    enabled: !!contentId,
  })
}

export const useCreateContentComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contentId, comment, parentCommentId }: any) => {
      const response = await api.post(`/content-comments/${contentId}`, {
        comment,
        parentCommentId,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-comments', variables.contentId] })
    },
  })
}

export const useAlphaComments = (alphaPostId: string) => {
  return useQuery({
    queryKey: ['alpha-comments', alphaPostId],
    queryFn: async () => {
      const response = await api.get(`/alpha-comments/${alphaPostId}`)
      return response.data
    },
    enabled: !!alphaPostId,
  })
}

export const useCreateAlphaComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ alphaPostId, comment }: any) => {
      const response = await api.post(`/alpha-comments/${alphaPostId}`, { comment })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alpha-comments', variables.alphaPostId] })
    },
  })
}
