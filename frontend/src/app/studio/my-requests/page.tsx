'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyStudioRequests, useAssignedRequests, ProductionRequest } from '@/hooks/use-studio'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import Image from 'next/image'

const requestTypes = [
  { value: '', label: 'All Types' },
  { value: 'cover_design', label: 'Cover Design' },
  { value: 'video_edit', label: 'Video Edit' },
  { value: 'logo_design', label: 'Logo Design' },
  { value: 'animation', label: 'Animation' },
  { value: 'banner_design', label: 'Banner Design' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'other', label: 'Other' },
]

const statuses = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface RequestCardProps {
  request: ProductionRequest
  onClick: () => void
}

function RequestCard({ request, onClick }: RequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'proposal_sent':
        return 'text-blue-500 bg-blue-500/10'
      case 'in_progress':
        return 'text-purple-500 bg-purple-500/10'
      case 'delivered':
        return 'text-orange-500 bg-orange-500/10'
      case 'completed':
        return 'text-green-500 bg-green-500/10'
      case 'cancelled':
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
      className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">{request.title}</h3>
        </div>
      </div>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{request.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {request.requestType.replace(/_/g, ' ')}
        </span>
        {request.platform && (
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            {request.platform}
          </span>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        {request.pointsAwarded > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-yellow-500">{request.pointsAwarded} J-Points</span>
          </div>
        )}

        {request.proposalDeadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Deadline: {formatDate(request.proposalDeadline)}</span>
          </div>
        )}

        {request.assignedTo && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Assigned to:</span>
            <div className="flex items-center gap-2">
              {request.assignedTo.profileImage ? (
                <Image
                  src={request.assignedTo.profileImage}
                  alt={request.assignedTo.displayName || 'Designer'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">
                    {(request.assignedTo.displayName || request.assignedTo.twitterUsername || 'D')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">
                {request.assignedTo.displayName || request.assignedTo.twitterUsername}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Created {formatDate(request.createdAt)}</span>
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

export default function MyRequestsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'my-requests' | 'assigned'>('my-requests')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: myRequests, isLoading: myRequestsLoading } = useMyStudioRequests()
  const { data: assignedRequests, isLoading: assignedRequestsLoading } = useAssignedRequests()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Filter requests based on selected filters
  const filterRequests = (requests: ProductionRequest[] | undefined) => {
    if (!requests) return []

    return requests.filter((request) => {
      const statusMatch = !statusFilter || request.status === statusFilter
      const typeMatch = !typeFilter || request.requestType === typeFilter
      return statusMatch && typeMatch
    })
  }

  const currentRequests = activeTab === 'my-requests' ? myRequests?.data : assignedRequests?.data
  const filteredRequests = filterRequests(currentRequests)
  const isLoading = activeTab === 'my-requests' ? myRequestsLoading : assignedRequestsLoading

  // Calculate stats for my requests
  const myRequestsData = myRequests?.data || []
  const totalRequests = myRequestsData.length
  const activeRequests = myRequestsData.filter(
    (r) => r.status === 'in_progress' || r.status === 'proposal_sent' || r.status === 'delivered'
  ).length
  const completedRequests = myRequestsData.filter((r) => r.status === 'completed').length
  const totalPointsSpent = myRequestsData.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)

  // Calculate stats for assigned requests
  const assignedRequestsData = assignedRequests?.data || []
  const totalAssigned = assignedRequestsData.length
  const activeAssigned = assignedRequestsData.filter(
    (r) => r.status === 'in_progress' || r.status === 'delivered'
  ).length
  const completedAssigned = assignedRequestsData.filter((r) => r.status === 'completed').length
  const totalPointsEarned = assignedRequestsData.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0)

  const handleRequestClick = (requestId: string) => {
    router.push(`/studio/request/${requestId}`)
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Requests</h1>
            <p className="text-muted-foreground">Manage your production requests and assignments</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => {
                setActiveTab('my-requests')
                setStatusFilter('')
                setTypeFilter('')
              }}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'my-requests'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Requests
              {activeTab === 'my-requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('assigned')
                setStatusFilter('')
                setTypeFilter('')
              }}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'assigned'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Assigned to Me
              {activeTab === 'assigned' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {activeTab === 'my-requests' ? (
              <>
                <StatsCard
                  title="Total Requests"
                  value={totalRequests}
                  color="bg-blue-500/10"
                  icon={
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Active Requests"
                  value={activeRequests}
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
                  value={completedRequests}
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
                  title="Points Spent"
                  value={totalPointsSpent}
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
                  title="Total Assigned"
                  value={totalAssigned}
                  color="bg-blue-500/10"
                  icon={
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Active Work"
                  value={activeAssigned}
                  color="bg-purple-500/10"
                  icon={
                    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
                <StatsCard
                  title="Completed"
                  value={completedAssigned}
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
                  title="Points Earned"
                  value={totalPointsEarned}
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

          {/* Filters */}
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
              <div>
                <label className="block text-sm font-medium mb-2">Request Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {requestTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Requests Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {activeTab === 'my-requests' ? 'My Requests' : 'Assigned to Me'}
              </h2>
              {filteredRequests && (
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filteredRequests && filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    onClick={() => handleRequestClick(request._id)}
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">No requests found</p>
                  <p className="text-muted-foreground">
                    {statusFilter || typeFilter
                      ? 'Try adjusting your filters to see more requests.'
                      : activeTab === 'my-requests'
                      ? 'You haven\'t created any requests yet.'
                      : 'You don\'t have any assigned requests yet.'}
                  </p>
                  {activeTab === 'my-requests' && !statusFilter && !typeFilter && (
                    <button
                      onClick={() => router.push('/studio')}
                      className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                    >
                      Create Request
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
