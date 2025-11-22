'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useCourseRequests, useCreateCourseRequest, useVoteCourseRequest, type CourseRequest } from '@/hooks/use-academy'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'
import {
  ThumbsUp,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react'

export default function CourseRequestsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'design'
  })

  const { data: requestsData, isLoading: requestsLoading } = useCourseRequests({
    status: statusFilter || undefined,
    sortBy: 'votes',
    sortOrder: 'desc'
  })
  const createRequest = useCreateCourseRequest()
  const voteRequest = useVoteCourseRequest()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (!mounted || authLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Skeleton className="h-10 w-64 mb-8" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const requests = requestsData?.data || []

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createRequest.mutateAsync(newRequest)
      toast.success('Course request submitted successfully')
      setShowCreateModal(false)
      setNewRequest({ title: '', description: '', category: 'design' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit course request')
    }
  }

  const handleVote = async (requestId: string, hasVoted: boolean) => {
    if (hasVoted) {
      toast.error('You have already voted for this request')
      return
    }

    try {
      await voteRequest.mutateAsync(requestId)
      toast.success('Vote submitted successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to vote')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'approved':
        return 'bg-green-500/10 text-green-500'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500'
      case 'completed':
        return 'bg-purple-500/10 text-purple-500'
      case 'rejected':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Play className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  // Calculate stats
  const pendingRequests = requests.filter((r) => r.status === 'pending').length
  const approvedRequests = requests.filter((r) => r.status === 'approved').length
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress').length
  const completedRequests = requests.filter((r) => r.status === 'completed').length

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Course Requests</h1>
              <p className="text-muted-foreground">Browse and vote on community-requested courses</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Request Course
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
              <p className="text-2xl font-bold">{requests.length}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingRequests}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-500">{inProgressRequests}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-purple-500">{completedRequests}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by status:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                In Progress
              </button>
            </div>
          </div>

          {/* Requests List */}
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No course requests yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to request a course that you'd like to see in the academy!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Request a Course
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const hasVoted = user && request.voters.includes(user._id)
                return (
                  <div
                    key={request._id}
                    className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{request.title}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span>{request.status.replace('_', ' ').toUpperCase()}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Category:</span>
                            <span className="capitalize">{request.category.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Requested by:</span>
                            <span>{request.requesterId.displayName || request.requesterId.twitterUsername || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(request._id, hasVoted || false)}
                          disabled={hasVoted || voteRequest.isPending}
                          className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${
                            hasVoted
                              ? 'bg-primary/20 text-primary cursor-not-allowed'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                          <span>{request.votes}</span>
                          <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                        </button>
                      </div>

                      {request.assignedMentor && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Assigned to:</span>
                          <span className="font-medium text-foreground">
                            {request.assignedMentor.displayName || request.assignedMentor.twitterUsername}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Create Request Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Request a Course</h2>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Course Title</label>
                    <input
                      type="text"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Advanced Photoshop Techniques"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-32"
                      placeholder="Describe what you'd like to learn in this course..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newRequest.category}
                      onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="design">Design</option>
                      <option value="video_editing">Video Editing</option>
                      <option value="crypto_twitter">Crypto Twitter</option>
                      <option value="defi">DeFi</option>
                      <option value="node_setup">Node Setup</option>
                      <option value="ai_tools">AI Tools</option>
                      <option value="trading">Trading</option>
                      <option value="development">Development</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createRequest.isPending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
