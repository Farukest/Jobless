'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useCourses } from '@/hooks/use-academy'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function AcademyPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: coursesData, isLoading: coursesLoading } = useCourses({
    page: 1,
    limit: 6,
    status: 'active'
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-10 w-64 mb-8" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">J Academy</h1>
            <p className="text-muted-foreground">Learn and grow with structured courses and mentorship</p>
          </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/academy/courses')}
            className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Browse Courses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Structured learning paths for Web3 topics
            </p>
            <p className="text-primary font-medium">View All Courses →</p>
          </button>

          {user?.roles?.includes('mentor') && (
            <button
              onClick={() => router.push('/academy/create')}
              className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Course</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your expertise with the community
              </p>
              <p className="text-primary font-medium">Start Creating →</p>
            </button>
          )}

          <button
            onClick={() => router.push('/academy/my-courses')}
            className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">My Courses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track your learning progress
            </p>
            <p className="text-primary font-medium">View Progress →</p>
          </button>
        </div>

        {/* Featured Courses */}
        {coursesLoading ? (
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : coursesData && coursesData.data.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Active Courses</h2>
              <button
                onClick={() => router.push('/academy/courses')}
                className="text-primary hover:underline font-medium"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coursesData.data.slice(0, 3).map((course: any) => (
                <div
                  key={course._id}
                  onClick={() => router.push(`/academy/course/${course._id}`)}
                  className="bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                >
                  <div className="aspect-video w-full bg-muted relative">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-muted-foreground/20"
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
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.shortDescription || course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {course.category}
                      </span>
                      <span className="text-muted-foreground">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Popular Categories */}
        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-2xl font-bold mb-6">Popular Learning Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Design',
              'Video Editing',
              'Crypto Twitter',
              'DeFi',
              'Node Setup',
              'AI Tools',
              'Trading',
              'Development',
            ].map((topic) => (
              <div
                key={topic}
                className="px-4 py-3 rounded-md border border-border hover:border-primary/50 transition-colors text-center"
              >
                <span className="text-sm font-medium">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How J Academy Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Choose a Course</h3>
              <p className="text-sm text-muted-foreground">
                Browse our catalog and select courses that match your learning goals
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Learn at Your Pace</h3>
              <p className="text-sm text-muted-foreground">
                Access course materials, complete lessons, and practice with hands-on exercises
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Earn & Grow</h3>
              <p className="text-sm text-muted-foreground">
                Complete courses to earn certificates and build your Web3 skill set
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  )
}
