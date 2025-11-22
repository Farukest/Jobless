'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProductionRequest {
  _id: string
  requesterId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  assignedTo?: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  requestType: string
  platform?: string
  title: string
  description: string
  requirements?: string
  referenceFiles: Array<{
    url: string
    type: string
    name: string
  }>
  proposalDescription?: string
  proposalDeadline?: string
  proposalSubmittedAt?: string
  deliveryFiles: Array<{
    url: string
    type: string
    name: string
    version: number
  }>
  deliveredAt?: string
  feedback?: string
  rating?: number
  status: 'pending' | 'proposal_sent' | 'in_progress' | 'delivered' | 'completed' | 'cancelled'
  pointsAwarded: number
  createdAt: string
  updatedAt: string
}

export interface StudioFilters {
  page?: number
  limit?: number
  status?: string
  requestType?: string
  platform?: string
  assigned?: boolean
}

export function useStudioRequests(filters: StudioFilters = {}) {
  return useQuery<{
    data: ProductionRequest[]
    count: number
    total: number
    page: number
    pages: number
  }>({
    queryKey: ['studio', 'requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.status) params.append('status', filters.status)
      if (filters.requestType) params.append('requestType', filters.requestType)
      if (filters.platform) params.append('platform', filters.platform)
      if (filters.assigned) params.append('assigned', 'true')

      const { data } = await api.get(`/studio/requests?${params.toString()}`)
      return data
    },
  })
}

// Fetch single request by ID
export function useStudioRequest(id: string) {
  return useQuery<{
    data: ProductionRequest
  }>({
    queryKey: ['studio', 'request', id],
    queryFn: async () => {
      const { data } = await api.get(`/studio/requests/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Also export as useProductionRequest for backward compatibility
export const useProductionRequest = useStudioRequest

// Create a new studio request
export function useCreateStudioRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestData: any) => {
      const { data } = await api.post('/studio/requests', requestData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'requests'] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'my-requests'] })
    },
  })
}

// Also export as useCreateRequest for backward compatibility
export const useCreateRequest = useCreateStudioRequest

// Submit a proposal for a request
export function useSubmitProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, proposalData }: { requestId: string; proposalData: any }) => {
      const { data } = await api.post(`/studio/requests/${requestId}/proposal`, proposalData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'requests'] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'request', variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'my-assignments'] })
    },
  })
}

// Respond to proposal (accept or reject)
export function useRespondToProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { data } = await api.put(`/studio/requests/${requestId}/proposal-response`, { accept })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'requests'] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'request', variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'my-requests'] })
    },
  })
}

// Fetch user's own studio requests
export function useMyStudioRequests() {
  return useQuery<{
    data: ProductionRequest[]
    count: number
  }>({
    queryKey: ['studio', 'my-requests'],
    queryFn: async () => {
      const { data } = await api.get('/studio/my-requests')
      return data
    },
  })
}

// Fetch requests assigned to the current user
export function useAssignedRequests() {
  return useQuery<{
    data: ProductionRequest[]
    count: number
  }>({
    queryKey: ['studio', 'assigned-requests'],
    queryFn: async () => {
      const { data } = await api.get('/studio/assigned-requests')
      return data
    },
  })
}

// Submit feedback and rating for a completed request
export function useSubmitFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, feedbackData }: { requestId: string; feedbackData: { feedback: string; rating: number } }) => {
      const { data } = await api.post(`/studio/requests/${requestId}/feedback`, feedbackData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'requests'] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'request', variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ['studio', 'my-requests'] })
    },
  })
}

// Studio Member interfaces
export interface StudioMember {
  _id: string
  userId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  specialty: 'graphic_designer' | 'video_editor' | 'animator' | '3d_artist' | 'other'
  skills: string[]
  portfolio: Array<{
    title: string
    description?: string
    mediaUrl: string
    projectDate?: string
  }>
  requestsCompleted: number
  averageRating: number
  totalPointsEarned: number
  availability: 'available' | 'busy' | 'unavailable'
  joinedAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StudioMemberFilters {
  specialty?: string
  availability?: string
}

// Fetch studio team members
export function useStudioMembers(filters: StudioMemberFilters = {}) {
  return useQuery<{
    data: StudioMember[]
    count: number
  }>({
    queryKey: ['studio', 'members', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.specialty) params.append('specialty', filters.specialty)
      if (filters.availability) params.append('availability', filters.availability)

      const { data } = await api.get(`/studio-members?${params.toString()}`)
      return data
    },
  })
}

// Create studio member profile
export function useCreateStudioMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberData: any) => {
      const { data } = await api.post('/studio-members', memberData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'members'] })
    },
  })
}

// Update studio member profile
export function useUpdateStudioMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberData: any) => {
      const { data } = await api.put('/studio-members', memberData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'members'] })
    },
  })
}
