'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useStudioRequest, useSubmitProposal, useRespondToProposal, useSubmitFeedback } from '@/hooks/use-studio'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function StudioRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading, error, refetch } = useStudioRequest(id)
  const { mutate: submitProposal, isPending: isSubmitting } = useSubmitProposal()
  const { mutate: respondToProposal, isPending: isResponding } = useRespondToProposal()
  const { mutate: submitFeedback, isPending: isSubmittingFeedback } = useSubmitFeedback()

  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalData, setProposalData] = useState({
    proposedBudget: '',
    timeline: '',
    message: '',
    portfolioLinks: '',
  })

  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    feedback: '',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault()

    if (!proposalData.message || !proposalData.timeline) {
      toast.error('Please fill in all required fields')
      return
    }

    const proposalDescription = `
Budget: $${proposalData.proposedBudget || 'Negotiable'}
Timeline: ${proposalData.timeline}
Message: ${proposalData.message}
${proposalData.portfolioLinks ? `Portfolio Links: ${proposalData.portfolioLinks}` : ''}
    `.trim()

    submitProposal(
      {
        requestId: id,
        proposalData: {
          proposalDescription,
          proposalDeadline: proposalData.timeline,
        },
      },
      {
        onSuccess: () => {
          toast.success('Proposal submitted successfully!')
          setShowProposalForm(false)
          setProposalData({
            proposedBudget: '',
            timeline: '',
            message: '',
            portfolioLinks: '',
          })
          refetch()
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to submit proposal')
        },
      }
    )
  }

  const handleAcceptProposal = () => {
    if (!window.confirm('Are you sure you want to accept this proposal?')) {
      return
    }

    respondToProposal(
      {
        requestId: id,
        accept: true,
      },
      {
        onSuccess: () => {
          toast.success('Proposal accepted!')
          refetch()
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to accept proposal')
        },
      }
    )
  }

  const handleRejectProposal = () => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) {
      return
    }

    respondToProposal(
      {
        requestId: id,
        accept: false,
      },
      {
        onSuccess: () => {
          toast.success('Proposal rejected')
          refetch()
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to reject proposal')
        },
      }
    )
  }

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()

    if (feedbackData.rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!feedbackData.feedback.trim()) {
      toast.error('Please provide feedback')
      return
    }

    submitFeedback(
      {
        requestId: id,
        feedbackData: {
          rating: feedbackData.rating,
          feedback: feedbackData.feedback,
        },
      },
      {
        onSuccess: () => {
          toast.success('Feedback submitted successfully!')
          setShowFeedbackForm(false)
          setFeedbackData({ rating: 0, feedback: '' })
          refetch()
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to submit feedback')
        },
      }
    )
  }

  const getStatusColor = (status?: string) => {
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

  if (authLoading || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="h-96 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The request you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/studio')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Studio
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

  const request = data.data
  const isRequester = user?._id === request.requesterId._id
  const isAssignedDesigner = user?._id === request.assignedTo?._id
  const canSubmitProposal = !isRequester && request.status === 'pending' && !request.assignedTo
  const hasProposal = request.status === 'proposal_sent' && request.assignedTo

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/studio')}
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
            Back to Studio
          </button>

          {/* Request Header */}
          <div className="bg-card rounded-lg border border-border p-8 mb-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {request.requestType.replace('_', ' ')}
              </span>
              {request.platform && (
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  {request.platform}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4">{request.title}</h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-6">{request.description}</p>

            {/* Requester Info */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-3">
                {request.requesterId.profileImage ? (
                  <Image
                    src={request.requesterId.profileImage}
                    alt={request.requesterId.displayName || 'Requester'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-medium text-muted-foreground">
                      {(request.requesterId.displayName || request.requesterId.twitterUsername || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {request.requesterId.displayName || request.requesterId.twitterUsername || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Posted {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              {isRequester && request.status === 'pending' && (
                <button
                  onClick={() => router.push(`/studio/request/${id}/edit`)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Edit Request
                </button>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-card rounded-lg border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">Request Details</h2>

            {/* Requirements */}
            {request.requirements && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Requirements</h3>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{request.requirements}</div>
                </div>
              </div>
            )}

            {/* Reference Files */}
            {request.referenceFiles && request.referenceFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Reference Files</h3>
                <div className="space-y-2">
                  {request.referenceFiles.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{file.type}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Points Awarded */}
            {request.pointsAwarded > 0 && (
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{request.pointsAwarded} J-Points Awarded</span>
              </div>
            )}
          </div>

          {/* Proposals Section */}
          <div className="bg-card rounded-lg border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">Proposals</h2>

            {/* Existing Proposal */}
            {hasProposal && request.assignedTo && (
              <div className="border border-border rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {request.assignedTo.profileImage ? (
                      <Image
                        src={request.assignedTo.profileImage}
                        alt={request.assignedTo.displayName || 'Designer'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-medium text-muted-foreground">
                          {(request.assignedTo.displayName || request.assignedTo.twitterUsername || 'D')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {request.assignedTo.displayName || request.assignedTo.twitterUsername || 'Designer'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(request.proposalSubmittedAt || request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>

                {request.proposalDescription && (
                  <div className="bg-muted rounded-md p-4 mb-4">
                    <div className="whitespace-pre-wrap text-sm">{request.proposalDescription}</div>
                  </div>
                )}

                {request.proposalDeadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Deadline: {new Date(request.proposalDeadline).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Accept/Reject Buttons for Requester */}
                {isRequester && request.status === 'proposal_sent' && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      onClick={handleAcceptProposal}
                      disabled={isResponding}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResponding ? 'Processing...' : 'Accept Proposal'}
                    </button>
                    <button
                      onClick={handleRejectProposal}
                      disabled={isResponding}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResponding ? 'Processing...' : 'Reject Proposal'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No Proposals */}
            {!hasProposal && request.status === 'pending' && (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg mb-6">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-muted-foreground">No proposals yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRequester ? 'Waiting for designers to submit proposals' : 'Be the first to submit a proposal'}
                </p>
              </div>
            )}

            {/* Submit Proposal Form for Designers */}
            {canSubmitProposal && (
              <div>
                {!showProposalForm ? (
                  <button
                    onClick={() => setShowProposalForm(true)}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                  >
                    Submit Proposal
                  </button>
                ) : (
                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Proposed Budget (USD)
                      </label>
                      <input
                        type="number"
                        value={proposalData.proposedBudget}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, proposedBudget: e.target.value })
                        }
                        placeholder="e.g., 500"
                        className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty if negotiable</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Timeline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={proposalData.timeline}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, timeline: e.target.value })
                        }
                        placeholder="e.g., 3-5 days"
                        required
                        className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={proposalData.message}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, message: e.target.value })
                        }
                        placeholder="Describe your approach, experience, and why you're the right fit..."
                        required
                        rows={6}
                        className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Portfolio Links
                      </label>
                      <textarea
                        value={proposalData.portfolioLinks}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, portfolioLinks: e.target.value })
                        }
                        placeholder="Enter portfolio URLs (one per line)"
                        rows={3}
                        className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProposalForm(false)
                          setProposalData({
                            proposedBudget: '',
                            timeline: '',
                            message: '',
                            portfolioLinks: '',
                          })
                        }}
                        className="px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Status Messages */}
            {request.status === 'in_progress' && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                <p className="text-purple-500 font-medium">Work in Progress</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The designer is currently working on this request
                </p>
              </div>
            )}

            {request.status === 'delivered' && isRequester && (
              <div>
                {!showFeedbackForm ? (
                  <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                      <p className="text-orange-500 font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The work has been delivered and is awaiting review
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFeedbackForm(true)}
                      className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Submit Feedback & Complete Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="bg-card rounded-lg border border-border p-6 space-y-6">
                    <h3 className="text-xl font-semibold">Rate & Review Designer</h3>

                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <svg
                              className={`w-8 h-8 ${star <= feedbackData.rating ? 'text-yellow-500' : 'text-muted'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      {feedbackData.rating > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {feedbackData.rating} out of 5 stars
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Feedback <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={feedbackData.feedback}
                        onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                        placeholder="Share your experience working with this designer. What did they do well? Any areas for improvement?"
                        required
                        rows={6}
                        className="w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit & Complete Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFeedbackForm(false)
                          setFeedbackData({ rating: 0, feedback: '' })
                        }}
                        className="px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {request.status === 'delivered' && !isRequester && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                <p className="text-orange-500 font-medium">Delivered</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The work has been delivered and is awaiting review
                </p>
              </div>
            )}

            {request.status === 'completed' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-green-500 font-medium">Completed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This request has been successfully completed
                </p>
              </div>
            )}

            {request.status === 'cancelled' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <p className="text-red-500 font-medium">Cancelled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This request has been cancelled
                </p>
              </div>
            )}
          </div>

          {/* Feedback Section (if completed) */}
          {request.status === 'completed' && request.feedback && (
            <div className="bg-card rounded-lg border border-border p-8">
              <h2 className="text-2xl font-bold mb-6">Feedback</h2>

              {request.rating && (
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < request.rating! ? 'text-yellow-500' : 'text-muted'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {request.rating} out of 5
                  </span>
                </div>
              )}

              <div className="bg-muted rounded-md p-4">
                <p className="whitespace-pre-wrap">{request.feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
