'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useMyAlphas, useDeleteAlphaPost, type AlphaPost } from '@/hooks/use-alpha'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react'

export default function MyAlphasPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: alphasData, isLoading: postsLoading } = useMyAlphas()
  const deletePost = useDeleteAlphaPost()
  const [mounted, setMounted] = useState(false)

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

  const posts = alphasData?.data || []
  const count = alphasData?.count || 0

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this alpha post? This action cannot be undone.')) {
      return
    }

    try {
      await deletePost.mutateAsync(postId)
      toast.success('Alpha post deleted successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete alpha post')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'expired':
        return 'bg-gray-500/10 text-gray-500'
      case 'verified':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'expired':
        return <AlertCircle className="w-4 h-4" />
      case 'verified':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPotentialRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
        return 'bg-gray-500'
      case 2:
        return 'bg-yellow-500'
      case 3:
        return 'bg-blue-500'
      case 4:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRiskRatingColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/10 text-green-500'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'high':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">My Alpha Posts</h1>
              <p className="text-muted-foreground">Manage and track your submitted alpha opportunities</p>
            </div>
            <Link
              href="/alpha/submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Submit New Alpha
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-2xl font-bold text-green-500">
                {posts.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Verified</p>
              <p className="text-2xl font-bold text-blue-500">
                {posts.filter((p) => p.status === 'verified').length}
              </p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Views</p>
              <p className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + (p.viewCount || 0), 0)}
              </p>
            </div>
          </div>

          {/* Posts List */}
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No alpha posts yet</h3>
                <p className="text-muted-foreground mb-6">
                  Share your alpha opportunities with the community and help others find the next big thing.
                </p>
                <Link
                  href="/alpha/submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Submit Your First Alpha
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/alpha/post/${post._id}`}
                          className="text-xl font-semibold hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                          <span>{post.status.toUpperCase()}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mb-3">
                        {post.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {post.alphaType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Potential:</span>
                      <div className={`w-16 h-2 ${getPotentialRatingColor(post.potentialRating)} rounded-full`} />
                      <span className="text-xs font-medium">{post.potentialRating}/4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Risk:</span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRiskRatingColor(post.riskRating)}`}>
                        {post.riskRating.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>{post.bullishVotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span>{post.bearishVotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/alpha/post/${post._id}`}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(post._id)}
                        disabled={deletePost.isPending}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
