'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { userHasAnyRole } from '@/lib/utils'

interface Course {
  _id: string
  mentorId: {
    _id: string
    name?: string
    displayName?: string
  }
  title: string
  description: string
  shortDescription?: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  thumbnailUrl?: string
  duration: number
  language: string
  enrolledCount: number
  completedCount: number
  isLiveSession: boolean
  sessionDate?: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  averageRating: number
  reviewsCount: number
  createdAt: string
}

interface CourseRequest {
  _id: string
  requesterId: {
    _id: string
    name?: string
    displayName?: string
  }
  title: string
  description: string
  category: string
  votes: number
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  assignedMentor?: {
    _id: string
    name?: string
    displayName?: string
  }
  createdAt: string
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const [activeTab, setActiveTab] = useState<'courses' | 'requests'>('courses')

  // Courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Course Requests state
  const [requests, setRequests] = useState<CourseRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>('all')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!userHasAnyRole(user, ['admin', 'super_admin'])) {
      router.push('/')
      return
    }
  }, [mounted, isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && userHasAnyRole(user, ['admin', 'super_admin'])) {
      if (activeTab === 'courses') {
        fetchCourses()
      } else {
        fetchRequests()
      }
    }
  }, [isAuthenticated, user, activeTab, currentPage, selectedStatus, selectedCategory, searchQuery])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await api.get(`/academy/courses?${params.toString()}`)

      if (response.data?.courses) {
        setCourses(response.data.courses)
        setTotal(response.data.pagination?.total || 0)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }

      setLoadingCourses(false)
    } catch (err: any) {
      console.error('Error fetching courses:', err)
      toast.error(err.message || 'Failed to load courses')
      setLoadingCourses(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true)

      const params = new URLSearchParams()

      if (selectedRequestStatus !== 'all') {
        params.append('status', selectedRequestStatus)
      }

      const response = await api.get(`/academy/course-requests?${params.toString()}`)

      if (response.data?.requests) {
        setRequests(response.data.requests)
      }

      setLoadingRequests(false)
    } catch (err: any) {
      console.error('Error fetching course requests:', err)
      toast.error(err.message || 'Failed to load course requests')
      setLoadingRequests(false)
    }
  }

  const handleModerate = async (courseId: string, action: 'approve' | 'archive') => {
    try {
      const data = {
        status: action === 'approve' ? 'published' : 'archived'
      }

      await api.put(`/academy/courses/${courseId}`, data)
      toast.success(`Course ${action}d successfully`)
      fetchCourses()
    } catch (err: any) {
      console.error('Error moderating course:', err)
      toast.error(err.message || 'Failed to moderate course')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also affect all enrollments.')) {
      return
    }

    try {
      await api.delete(`/academy/courses/${courseId}`)
      toast.success('Course deleted successfully')
      fetchCourses()
    } catch (err: any) {
      console.error('Error deleting course:', err)
      toast.error(err.message || 'Failed to delete course')
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.put(`/academy/course-requests/${requestId}`, { status: 'approved' })
      toast.success('Course request approved')
      fetchRequests()
    } catch (err: any) {
      console.error('Error approving request:', err)
      toast.error(err.message || 'Failed to approve request')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.put(`/academy/course-requests/${requestId}`, { status: 'rejected' })
      toast.success('Course request rejected')
      fetchRequests()
    } catch (err: any) {
      console.error('Error rejecting request:', err)
      toast.error(err.message || 'Failed to reject request')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return
    }

    try {
      await api.delete(`/academy/course-requests/${requestId}`)
      toast.success('Request deleted successfully')
      fetchRequests()
    } catch (err: any) {
      console.error('Error deleting request:', err)
      toast.error(err.message || 'Failed to delete request')
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !userHasAnyRole(user, ['admin', 'super_admin'])) {
    return null
  }

  const categories = [
    'design',
    'video_editing',
    'crypto_twitter',
    'defi',
    'node_setup',
    'ai_tools',
    'trading',
    'development',
    'other'
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">J Academy Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage courses, enrollments, and course requests
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Course Requests
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <>
            {/* Filters */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-500">
                  {courses.filter(c => c.status === 'published').length}
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {courses.filter(c => c.status === 'draft').length}
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <p className="text-2xl font-bold text-blue-500">
                  {courses.reduce((sum, c) => sum + c.enrolledCount, 0)}
                </p>
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Course</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Mentor</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Difficulty</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Stats</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCourses ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : courses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No courses found
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{course.title}</p>
                              {course.shortDescription && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {course.shortDescription}
                                </p>
                              )}
                              {course.isLiveSession && (
                                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded mt-1 inline-block">
                                  Live Session
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">
                              {course.mentorId?.name || course.mentorId?.displayName || 'Unknown'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm capitalize">
                              {course.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg ${
                              course.difficulty === 'beginner'
                                ? 'bg-green-500/10 text-green-500'
                                : course.difficulty === 'intermediate'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {course.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg ${
                              course.status === 'published'
                                ? 'bg-green-500/10 text-green-500'
                                : course.status === 'draft'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>👥 {course.enrolledCount} enrolled</p>
                              <p>✅ {course.completedCount} completed</p>
                              <p>⭐ {course.averageRating.toFixed(1)} ({course.reviewsCount})</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {course.status !== 'published' && (
                                <button
                                  onClick={() => handleModerate(course._id, 'approve')}
                                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                  Publish
                                </button>
                              )}
                              {course.status !== 'archived' && (
                                <button
                                  onClick={() => handleModerate(course._id, 'archive')}
                                  className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                >
                                  Archive
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/academy/${course._id}`)}
                                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course._id)}
                                className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {/* Request Status Filter */}
            <div className="bg-card rounded-lg border border-border p-4">
              <select
                value={selectedRequestStatus}
                onChange={(e) => setSelectedRequestStatus(e.target.value)}
                className="px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Requests Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-500">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-500">
                  {requests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-purple-500">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Request</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Requester</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Votes</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Assigned To</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRequests ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : requests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No requests found
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{request.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {request.description}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">
                              {request.requesterId?.name || request.requesterId?.displayName || 'Unknown'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm capitalize">
                              {request.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">👍 {request.votes}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg ${
                              request.status === 'pending'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : request.status === 'approved'
                                ? 'bg-green-500/10 text-green-500'
                                : request.status === 'in_progress'
                                ? 'bg-blue-500/10 text-blue-500'
                                : request.status === 'completed'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {request.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">
                              {request.assignedMentor?.name || request.assignedMentor?.displayName || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveRequest(request._id)}
                                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request._id)}
                                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRequest(request._id)}
                                className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
