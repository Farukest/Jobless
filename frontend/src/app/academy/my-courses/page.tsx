'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyCourses, CourseEnrollment, Course } from '@/hooks/use-academy'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import Image from 'next/image'

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

interface EnrollmentCardProps {
  enrollment: CourseEnrollment
  onClick: () => void
}

function EnrollmentCard({ enrollment, onClick }: EnrollmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-500 bg-blue-500/10'
      case 'completed':
        return 'text-green-500 bg-green-500/10'
      case 'dropped':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
    >
      {/* Thumbnail */}
      {enrollment.courseId.thumbnailUrl ? (
        <div className="relative w-full h-48 bg-muted">
          <Image
            src={enrollment.courseId.thumbnailUrl}
            alt={enrollment.courseId.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <svg className="w-16 h-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                {enrollment.status === 'active' ? 'IN PROGRESS' : enrollment.status.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {enrollment.courseId.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{enrollment.courseId.title}</h3>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {enrollment.courseId.shortDescription || enrollment.courseId.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold text-primary">{enrollment.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </div>

        {/* Mentor Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Mentor:</span>
          <div className="flex items-center gap-2">
            {enrollment.courseId.mentorId.profileImage ? (
              <Image
                src={enrollment.courseId.mentorId.profileImage}
                alt={enrollment.courseId.mentorId.displayName || 'Mentor'}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs">
                  {(enrollment.courseId.mentorId.displayName || enrollment.courseId.mentorId.twitterUsername || 'M')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-medium">
              {enrollment.courseId.mentorId.displayName || enrollment.courseId.mentorId.twitterUsername}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Last accessed {formatDate(enrollment.lastAccessedAt)}</span>
        </div>
      </div>
    </div>
  )
}

interface TeachingCourseCardProps {
  course: Course
  onClick: () => void
}

function TeachingCourseCard({ course, onClick }: TeachingCourseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-500 bg-green-500/10'
      case 'draft':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'archived':
        return 'text-gray-500 bg-gray-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
    >
      {/* Thumbnail */}
      {course.thumbnailUrl ? (
        <div className="relative w-full h-48 bg-muted">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <svg className="w-16 h-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                {course.status.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {course.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.title}</h3>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {course.shortDescription || course.description}
        </p>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-sm font-medium">{course.enrollmentCount} Students</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-medium">{course.totalLessons} Lessons</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Created {formatDate(course.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  )
}

export default function MyCoursesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, hasRole } = useAuth()
  const [activeTab, setActiveTab] = useState<'enrollments' | 'teaching'>('enrollments')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: myCoursesData, isLoading: coursesLoading } = useMyCourses()
  const isMentor = hasRole('mentor')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Filter enrollments based on selected status
  const filterEnrollments = (enrollments: CourseEnrollment[] | undefined) => {
    if (!enrollments) return []

    return enrollments.filter((enrollment) => {
      const statusMatch = !statusFilter || enrollment.status === statusFilter
      return statusMatch
    })
  }

  const enrollments = myCoursesData?.data?.enrollments || []
  const createdCourses = myCoursesData?.data?.createdCourses || []
  const stats = myCoursesData?.data?.stats

  const filteredEnrollments = filterEnrollments(enrollments)
  const isLoading = coursesLoading

  const handleCourseClick = (courseId: string) => {
    router.push(`/academy/courses/${courseId}`)
  }

  const handleCreateCourse = () => {
    router.push('/academy/create-course')
  }

  if (authLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Courses</h1>
            <p className="text-muted-foreground">Track your learning journey and manage your courses</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => {
                setActiveTab('enrollments')
                setStatusFilter('')
              }}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'enrollments'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Enrollments
              {activeTab === 'enrollments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            {isMentor && (
              <button
                onClick={() => {
                  setActiveTab('teaching')
                  setStatusFilter('')
                }}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'teaching'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Teaching
                {activeTab === 'teaching' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {activeTab === 'enrollments' ? (
              <>
                <StatsCard
                  title="Total Enrolled"
                  value={stats?.totalEnrolled || 0}
                  color="bg-blue-500/10"
                  icon={
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="In Progress"
                  value={stats?.inProgress || 0}
                  color="bg-purple-500/10"
                  icon={
                    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Completed"
                  value={stats?.completed || 0}
                  color="bg-green-500/10"
                  icon={
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="J-Points Spent"
                  value={stats?.pointsSpent || 0}
                  color="bg-yellow-500/10"
                  icon={
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  }
                />
              </>
            ) : (
              <>
                <StatsCard
                  title="Total Courses"
                  value={stats?.totalCreated || 0}
                  color="bg-blue-500/10"
                  icon={
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Total Students"
                  value={stats?.totalStudents || 0}
                  color="bg-purple-500/10"
                  icon={
                    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Active Courses"
                  value={stats?.activeCourses || 0}
                  color="bg-green-500/10"
                  icon={
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="J-Points Earned"
                  value={stats?.pointsEarned || 0}
                  color="bg-yellow-500/10"
                  icon={
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  }
                />
              </>
            )}
          </div>

          {/* Filters - Only show for enrollments tab */}
          {activeTab === 'enrollments' && (
            <div className="bg-card rounded-lg border border-border p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {activeTab === 'enrollments' ? 'My Enrollments' : 'My Courses'}
              </h2>
              <div className="flex items-center gap-4">
                {activeTab === 'enrollments' && filteredEnrollments && (
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredEnrollments.length} {filteredEnrollments.length === 1 ? 'course' : 'courses'}
                  </p>
                )}
                {activeTab === 'teaching' && (
                  <button
                    onClick={handleCreateCourse}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                  >
                    Create New Course
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : activeTab === 'enrollments' ? (
              filteredEnrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEnrollments.map((enrollment) => (
                    <EnrollmentCard
                      key={enrollment._id}
                      enrollment={enrollment}
                      onClick={() => handleCourseClick(enrollment.courseId._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-muted-foreground mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">No enrollments found</p>
                    <p className="text-muted-foreground">
                      {statusFilter
                        ? 'Try adjusting your filters to see more courses.'
                        : "You haven't enrolled in any courses yet."}
                    </p>
                    {!statusFilter && (
                      <button
                        onClick={() => router.push('/academy')}
                        className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                      >
                        Browse Courses
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              createdCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdCourses.map((course) => (
                    <TeachingCourseCard
                      key={course._id}
                      course={course}
                      onClick={() => handleCourseClick(course._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-muted-foreground mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">No courses created yet</p>
                    <p className="text-muted-foreground">
                      Start sharing your knowledge by creating your first course.
                    </p>
                    <button
                      onClick={handleCreateCourse}
                      className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                    >
                      Create Course
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
