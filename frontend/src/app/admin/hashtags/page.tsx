'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminHashtagsPage() {
  const [newTag, setNewTag] = useState('')
  const queryClient = useQueryClient()

  // Fetch hashtags
  const { data: hashtagsData, isLoading } = useQuery({
    queryKey: ['admin', 'hashtags'],
    queryFn: async () => {
      const { data } = await api.get('/hashtags')
      return data
    },
  })

  // Create hashtag
  const createMutation = useMutation({
    mutationFn: async (tag: string) => {
      const { data } = await api.post('/hashtags', { tag })
      return data
    },
    onSuccess: () => {
      toast.success('Hashtag created successfully')
      setNewTag('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'hashtags'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create hashtag')
    },
  })

  // Delete hashtag
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hashtags/${id}`)
    },
    onSuccess: () => {
      toast.success('Hashtag deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'hashtags'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete hashtag')
    },
  })

  const handleCreate = () => {
    if (!newTag.trim()) {
      toast.error('Tag is required')
      return
    }
    createMutation.mutate(newTag.trim())
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this hashtag?')) {
      deleteMutation.mutate(id)
    }
  }

  const hashtags = hashtagsData?.data || []

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hashtag Management</h1>
        <p className="text-muted-foreground">
          Manage available hashtags for content creation
        </p>
      </div>

      {/* Create New Hashtag */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Add New Hashtag</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Enter tag (without #)"
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={createMutation.isPending}
          />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !newTag.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Only alphanumeric, underscore, and hyphen characters allowed (max 30 chars)
        </p>
      </div>

      {/* Hashtags List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">
          All Hashtags ({hashtags.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag: any) => (
              <div
                key={hashtag._id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm"
              >
                <span className="font-medium text-primary">#{hashtag.tag}</span>
                {hashtag.usageCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({hashtag.usageCount})
                  </span>
                )}
                <button
                  onClick={() => handleDelete(hashtag._id)}
                  disabled={deleteMutation.isPending}
                  className="ml-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete hashtag"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hashtags yet. Add your first one above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
