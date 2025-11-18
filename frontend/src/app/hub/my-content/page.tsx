'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function MyContentPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [contents, setContents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchMyContent()
    }
  }, [user])

  const fetchMyContent = async () => {
    try {
      const response = await api.get(`/hub/content?authorId=${user?._id}`)
      setContents(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch content')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">My Content</h1>
              <p className="text-muted-foreground">Manage your published content</p>
            </div>
            <Link
              href="/hub/create"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
            >
              Create New
            </Link>
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : contents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((content) => (
                <div
                  key={content._id}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                >
                  <h3 className="text-xl font-bold mb-2">{content.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{content.description}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.status === 'published'
                          ? 'bg-green-500/10 text-green-500'
                          : content.status === 'draft'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {content.status}
                    </span>
                    <Link
                      href={`/hub/content/${content._id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any content yet</p>
              <Link
                href="/hub/create"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
              >
                Create Your First Content
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
