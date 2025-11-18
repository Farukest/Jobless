'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface ProductionRequest {
  _id: string
  requesterId: {
    _id: string
    name?: string
    displayName?: string
  }
  requestType: string
  platform?: string
  title: string
  description: string
  requirements?: string
  assignedTo?: {
    _id: string
    name?: string
    displayName?: string
  }
  assignedAt?: string
  proposalDescription?: string
  proposalDeadline?: string
  proposalSubmittedAt?: string
  deliveredAt?: string
  feedback?: string
  rating?: number
  status: 'pending' | 'proposal_sent' | 'in_progress' | 'delivered' | 'completed' | 'cancelled'
  pointsAwarded: number
  referenceFiles: Array<{
    url: string
    type: string
    name: string
  }>
  deliveryFiles: Array<{
    url: string
    type: string
    name: string
    version: number
  }>
  createdAt: string
}

export default function AdminProductionPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  const [requests, setRequests] = useState<ProductionRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.roles?.includes('admin') && !user?.roles?.includes('super_admin')))) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && (user.roles?.includes('admin') || user.roles?.includes('super_admin'))) {
      fetchRequests()
    }
  }, [isAuthenticated, user, currentPage, selectedStatus, selectedType, searchQuery])

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (selectedType !== 'all') {
        params.append('requestType', selectedType)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await api.get(`/studio/requests?${params.toString()}`)

      if (response.data?.requests) {
        setRequests(response.data.requests)
        setTotal(response.data.pagination?.total || 0)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }

      setLoadingRequests(false)
    } catch (err: any) {
      console.error('Error fetching production requests:', err)
      toast.error(err.message || 'Failed to load production requests')
      setLoadingRequests(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this production request?')) {
      return
    }

    try {
      await api.put(`/studio/requests/${requestId}`, { status: 'cancelled' })
      toast.success('Request cancelled successfully')
      fetchRequests()
    } catch (err: any) {
      console.error('Error cancelling request:', err)
      toast.error(err.message || 'Failed to cancel request')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this production request? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/studio/requests/${requestId}`)
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

  if (!isAuthenticated || !user || (!user.roles?.includes('admin') && !user.roles?.includes('super_admin'))) {
    return null
  }

  const requestTypes = [
    'cover_design',
    'video_edit',
    'logo_design',
    'animation',
    'banner_design',
    'thumbnail',
    'other'
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">J Studio Production Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all production requests
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search production requests..."
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
                <option value="pending">Pending</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                {requestTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">
              {requests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Proposal Sent</p>
            <p className="text-2xl font-bold text-blue-500">
              {requests.filter(r => r.status === 'proposal_sent').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-purple-500">
              {requests.filter(r => r.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-orange-500">
              {requests.filter(r => r.status === 'delivered').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">
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
                  <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Platform</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Assigned To</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Points/Rating</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRequests ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No production requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.description}
                          </p>
                          {request.requirements && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Requirements: {request.requirements.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {request.requesterId?.name || request.requesterId?.displayName || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                          {request.requestType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm capitalize">
                          {request.platform || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {request.assignedTo?.name || request.assignedTo?.displayName || '-'}
                        </p>
                        {request.assignedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.assignedAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : request.status === 'proposal_sent'
                            ? 'bg-blue-500/10 text-blue-500'
                            : request.status === 'in_progress'
                            ? 'bg-purple-500/10 text-purple-500'
                            : request.status === 'delivered'
                            ? 'bg-orange-500/10 text-orange-500'
                            : request.status === 'completed'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>🎯 {request.pointsAwarded} points</p>
                          {request.rating && (
                            <p>⭐ {request.rating.toFixed(1)}/5</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/studio/${request._id}`)}
                            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          >
                            View Details
                          </button>
                          {request.status !== 'cancelled' && request.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelRequest(request._id)}
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              Cancel
                            </button>
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

        {/* Additional Info Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Production Request Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">📝 Request Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cover Design</li>
                <li>• Video Editing</li>
                <li>• Logo Design</li>
                <li>• Animation</li>
                <li>• Banner Design</li>
                <li>• Thumbnail</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">🔄 Workflow Stages</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Pending → Awaiting assignment</li>
                <li>2. Proposal Sent → Waiting approval</li>
                <li>3. In Progress → Being worked on</li>
                <li>4. Delivered → Awaiting feedback</li>
                <li>5. Completed → Finished & rated</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">🎯 Point System</h4>
              <p className="text-sm text-muted-foreground">
                Points are awarded based on:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• Request complexity</li>
                <li>• Quality of delivery</li>
                <li>• Timeliness</li>
                <li>• Client satisfaction rating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
