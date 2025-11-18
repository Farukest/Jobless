'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import { useStudioRequests, ProductionRequest } from '@/hooks/use-studio'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import Image from 'next/image'

function RequestCard({ request }: { request: ProductionRequest }) {
  const router = useRouter()

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

  return (
    <div
      onClick={() => router.push(`/studio/request/${request._id}`)}
      className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {request.requesterId.profileImage ? (
            <Image
              src={request.requesterId.profileImage}
              alt={request.requesterId.displayName || 'Requester'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                {(request.requesterId.displayName || request.requesterId.twitterUsername || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">
              {request.requesterId.displayName || request.requesterId.twitterUsername || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-2">{request.title}</h3>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{request.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {request.requestType.replace('_', ' ')}
        </span>
        {request.platform && (
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            {request.platform}
          </span>
        )}
      </div>

      {request.assignedTo && (
        <div className="flex items-center gap-2 pt-4 border-t border-border">
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

      {request.pointsAwarded > 0 && (
        <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium">{request.pointsAwarded} J-Points</span>
        </div>
      )}
    </div>
  )
}

export default function StudioPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: configs, isLoading: configsLoading } = usePublicConfigs()
  const [page, setPage] = useState(1)
  const [requestType, setRequestType] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')

  // Dynamic config options with "All" prepended
  const configRequestTypes = configs?.production_request_types || []
  const requestTypes = [
    { value: '', label: 'All Types' },
    ...configRequestTypes.map((type: string) => ({
      value: type,
      label: type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    })),
  ]

  const configPlatforms = configs?.platforms || []
  const platforms = [
    { value: '', label: 'All Platforms' },
    ...configPlatforms.map((plat: string) => ({
      value: plat,
      label: plat.charAt(0).toUpperCase() + plat.slice(1),
    })),
  ]

  // Status values are typically not in dynamic config since they're workflow states
  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const { data: requests, isLoading: requestsLoading } = useStudioRequests({
    page,
    limit: 12,
    requestType: requestType || undefined,
    platform: platform || undefined,
    status: status || undefined,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || configsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">J Studio</h1>
            <p className="text-muted-foreground">Production requests and creative collaboration</p>
          </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Request Type</label>
              <select
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {requestTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {platforms.map((plat) => (
                  <option key={plat.value} value={plat.value}>
                    {plat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statuses.map((stat) => (
                  <option key={stat.value} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Production Requests</h2>
            {requests && (
              <p className="text-sm text-muted-foreground">
                Showing {requests.count} of {requests.total} results
              </p>
            )}
          </div>

          {requestsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : requests && requests.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.data.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">No requests found. Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {requests && requests.pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {requests?.page} of {requests?.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(requests?.pages || 1, p + 1))}
              disabled={page === requests?.pages}
              className="px-4 py-2 rounded-md text-sm font-medium bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
      </div>
    </AuthenticatedLayout>
  )
}
