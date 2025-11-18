import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

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
