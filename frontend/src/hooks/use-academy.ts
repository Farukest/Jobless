'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Course {
  _id: string
  mentorId: {
    _id: string
    displayName?: string
    twitterUsername?: string
    profileImage?: string
  }
  title: string
  description: string
  shortDescription: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  thumbnailUrl?: string
  status: 'draft' | 'active' | 'coming_soon' | 'archived'
  enrollmentCount: number
  totalModules: number
  totalLessons: number
  estimatedDuration: number
  pointsCost: number
  tags: string[]
  learningObjectives: string[]
  prerequisites: string[]
  createdAt: string
  updatedAt: string
}

export interface CourseEnrollment {
  _id: string
  courseId: Course
  learnerId: string
  status: 'active' | 'completed' | 'dropped'
  enrolledAt: string
  completedAt?: string
  progress: number
  currentModule?: number
  currentLesson?: number
  lastAccessedAt: string
  certificateIssued: boolean
}

export interface MyCoursesData {
  enrollments: CourseEnrollment[]
  createdCourses: Course[]
  stats: {
    totalEnrolled: number
    inProgress: number
    completed: number
    dropped: number
    pointsSpent: number
    totalCreated: number
    totalStudents: number
    activeCourses: number
    pointsEarned: number
  }
}

// Fetch user's courses (enrollments and created courses)
export function useMyCourses() {
  return useQuery<{
    data: MyCoursesData
  }>({
    queryKey: ['academy', 'my-courses'],
    queryFn: async () => {
      const { data } = await api.get('/academy/my-courses')
      return data
    },
  })
}

// Fetch single course by ID
export function useCourse(id: string) {
  return useQuery<{
    data: Course
  }>({
    queryKey: ['academy', 'course', id],
    queryFn: async () => {
      const { data } = await api.get(`/academy/courses/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Enroll in a course
export function useEnrollCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/academy/courses/${courseId}/enroll`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'courses'] })
    },
  })
}

// Drop a course
export function useDropCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data } = await api.put(`/academy/enrollments/${enrollmentId}/drop`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
    },
  })
}

export interface CourseFilters {
  page?: number
  limit?: number
  category?: string
  difficulty?: string
  status?: string
  price?: string
  search?: string
}

// Fetch courses with filters
export function useCourses(filters: CourseFilters = {}) {
  return useQuery<{
    data: Course[]
    count: number
    total: number
    page: number
    pages: number
  }>({
    queryKey: ['academy', 'courses', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.category) params.append('category', filters.category)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.status) params.append('status', filters.status)
      if (filters.price) params.append('price', filters.price)
      if (filters.search) params.append('search', filters.search)

      const { data } = await api.get(`/academy/courses?${params.toString()}`)
      return data
    },
  })
}

// Create a new course
export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseData: any) => {
      const { data } = await api.post('/academy/courses', courseData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'courses'] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
    },
  })
}

// Update a course
export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseData: any) => {
      const { data } = await api.put(`/academy/courses/${courseId}`, courseData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'courses'] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
    },
  })
}

// Enroll in a course (alternative name for consistency)
export function useEnrollInCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/academy/courses/${courseId}/enroll`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'courses'] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
    },
  })
}

// Delete a course (mentors only)
export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.delete(`/academy/courses/${courseId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy', 'courses'] })
      queryClient.invalidateQueries({ queryKey: ['academy', 'my-courses'] })
    },
  })
}
