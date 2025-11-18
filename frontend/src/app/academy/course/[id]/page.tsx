'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useCourse, useEnrollCourse } from '@/hooks/use-academy'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading, error, refetch } = useCourse(id)
  const { mutate: enrollCourse, isPending: isEnrolling } = useEnrollCourse()

  const [showWaitlist, setShowWaitlist] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleEnroll = () => {
    if (!user) {
      toast.error('Please login to enroll')
      return
    }

    const course = data?.data
    if (!course) return

    // Check if user has enough points
    if (course.pointsCost > 0 && (user.jRankPoints || 0) < course.pointsCost) {
      toast.error(`Insufficient J-Points. You need ${course.pointsCost} J-Points to enroll.`)
      return
    }

    enrollCourse(id, {
      onSuccess: () => {
        toast.success('Successfully enrolled in course!')
        refetch()
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to enroll in course')
      },
    })
  }

  const handleWaitlist = () => {
    toast.success('Added to waitlist! We\'ll notify you when the course is available.')
    setShowWaitlist(false)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'text-green-500 bg-green-500/10'
      case 'coming_soon':
        return 'text-blue-500 bg-blue-500/10'
      case 'archived':
      case 'draft':
        return 'text-gray-500 bg-gray-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-500 bg-green-500/10'
      case 'intermediate':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'advanced':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  if (authLoading || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full mb-6" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The course you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/academy')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Academy
              </button>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!data?.data) {
    return null
  }

  const course = data.data
  const isAuthor = user?._id === course.mentorId._id
  const isPublished = course.status === 'published'
  const isArchived = course.status === 'archived'
  const canEnroll = isPublished && !isAuthor

  // Mock enrollment data - in real implementation, this would come from the API
  const enrollment = null // Will be populated from API when enrolled
  const isEnrolled = false // Check from API response
  const enrollmentProgress = 0
  const currentModuleName = 'Introduction to Design'
  const currentLessonName = 'Lesson 1: Getting Started'

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/academy')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Academy
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Hero Section */}
              <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
                {/* Course Image */}
                {course.thumbnailUrl ? (
                  <div className="relative w-full h-80 bg-muted">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-primary/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                )}

                <div className="p-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {course.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {course.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl font-bold mb-4">{course.title}</h1>

                  {/* Short Description */}
                  <p className="text-lg text-muted-foreground mb-6">{course.shortDescription}</p>

                  {/* Course Stats */}
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-t border-border pt-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>{course.enrollmentCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{course.estimatedDuration || 0} hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>{course.totalModules || 0} modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                        />
                      </svg>
                      <span>{course.totalLessons || 0} lessons</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card rounded-lg border border-border p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-muted-foreground">{course.description}</div>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="bg-card rounded-lg border border-border p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Mock data - replace with actual course.learningOutcomes */}
                  {[
                    'Master the fundamentals of design',
                    'Create professional designs',
                    'Understand color theory and typography',
                    'Build a design portfolio',
                    'Work with industry-standard tools',
                    'Apply design principles in real projects',
                  ].map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <div className="bg-card rounded-lg border border-border p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
                <div className="space-y-3">
                  {/* Mock data - replace with actual course.syllabus */}
                  {[
                    {
                      module: 'Introduction to Design',
                      lessons: ['Getting Started', 'Design Principles', 'Tools Overview'],
                    },
                    {
                      module: 'Color Theory',
                      lessons: ['Understanding Color', 'Color Palettes', 'Practical Applications'],
                    },
                    {
                      module: 'Typography',
                      lessons: ['Font Basics', 'Hierarchy', 'Pairing Fonts'],
                    },
                    {
                      module: 'Layout Design',
                      lessons: ['Grid Systems', 'Spacing', 'Composition'],
                    },
                  ].map((module, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-3 font-medium flex items-center justify-between">
                        <span>
                          Module {index + 1}: {module.module}
                        </span>
                        <span className="text-sm text-muted-foreground">{module.lessons.length} lessons</span>
                      </div>
                      <div className="divide-y divide-border">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="px-4 py-3 flex items-center gap-3 text-sm">
                            <svg
                              className="w-4 h-4 text-muted-foreground flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div className="bg-card rounded-lg border border-border p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {/* Mock data - replace with actual course.prerequisites */}
                  {['Basic computer skills', 'No prior design experience required', 'Willingness to learn'].map(
                    (prereq, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{prereq}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Mentor Info */}
              <div className="bg-card rounded-lg border border-border p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">Your Instructor</h2>
                <div className="flex items-start gap-4">
                  {course.mentorId.profileImage ? (
                    <Image
                      src={course.mentorId.profileImage}
                      alt={course.mentorId.displayName || 'Instructor'}
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-medium text-muted-foreground">
                        {(course.mentorId.displayName || course.mentorId.twitterUsername || 'M')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {course.mentorId.displayName || course.mentorId.twitterUsername || 'Anonymous'}
                    </h3>
                    {course.mentorId.twitterUsername && (
                      <p className="text-sm text-muted-foreground mb-3">@{course.mentorId.twitterUsername}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {/* Mock bio - replace with actual mentor bio */}
                      Professional designer with 10+ years of experience. Passionate about teaching and helping others
                      grow their design skills.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviews Section (Placeholder) */}
              <div className="bg-card rounded-lg border border-border p-8">
                <h2 className="text-2xl font-bold mb-4">Student Reviews</h2>
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to review this course after completing it
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Enrollment Card */}
                <div className="bg-card rounded-lg border border-border p-6">
                  {/* Price */}
                  <div className="mb-6">
                    {course.pointsCost === 0 ? (
                      <div className="text-3xl font-bold text-green-500">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{course.pointsCost}</span>
                        <span className="text-muted-foreground">J-Points</span>
                      </div>
                    )}
                  </div>

                  {/* Enrolled Status with Progress */}
                  {isEnrolled && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Your Progress</span>
                        <span className="text-sm text-muted-foreground">{enrollmentProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${enrollmentProgress}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">Current Module:</div>
                      <div className="font-medium text-sm mb-3">{currentModuleName}</div>
                      <div className="text-sm text-muted-foreground mb-1">Current Lesson:</div>
                      <div className="font-medium text-sm">{currentLessonName}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isAuthor ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/academy/course/${id}/edit`)}
                        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                      >
                        Edit Course
                      </button>
                      <button
                        onClick={() => router.push(`/academy/course/${id}/students`)}
                        className="w-full px-4 py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
                      >
                        View Students
                      </button>
                    </div>
                  ) : isEnrolled ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/academy/course/${id}/learn`)}
                        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                      >
                        Continue Learning
                      </button>
                      {enrollmentProgress === 100 && (
                        <button className="w-full px-4 py-3 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition-colors">
                          Mark as Complete
                        </button>
                      )}
                    </div>
                  ) : canEnroll ? (
                    <button
                      onClick={handleEnroll}
                      disabled={
                        isEnrolling || (course.pointsCost > 0 && (user?.jRankPoints || 0) < course.pointsCost)
                      }
                      className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEnrolling
                        ? 'Enrolling...'
                        : course.pointsCost === 0
                          ? 'Enroll for Free'
                          : `Enroll for ${course.pointsCost} J-Points`}
                    </button>
                  ) : isArchived ? (
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-md p-4 text-center">
                      <p className="text-gray-500 font-medium">Course Archived</p>
                      <p className="text-sm text-muted-foreground mt-1">This course is no longer available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-center">
                        <p className="text-blue-500 font-medium">Coming Soon</p>
                        <p className="text-sm text-muted-foreground mt-1">This course is not yet available</p>
                      </div>
                      <button
                        onClick={handleWaitlist}
                        className="w-full px-4 py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  )}

                  {/* Insufficient Points Warning */}
                  {!isAuthor &&
                    !isEnrolled &&
                    canEnroll &&
                    course.pointsCost > 0 &&
                    (user?.jRankPoints || 0) < course.pointsCost && (
                      <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-500">Insufficient J-Points</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You need {course.pointsCost - (user?.jRankPoints || 0)} more J-Points to enroll
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Course Includes */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-4">This course includes:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{course.estimatedDuration || 0} hours of video content</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Access on mobile and desktop</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </div>

                {/* Related Courses (Placeholder) */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-4">Related Courses</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="flex gap-3 p-3 rounded-md border border-border hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="w-16 h-16 rounded bg-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1 truncate">Related Course {index + 1}</h4>
                          <p className="text-xs text-muted-foreground">By Instructor Name</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
