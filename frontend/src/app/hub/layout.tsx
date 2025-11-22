'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/hub'
  const isFeed = pathname === '/hub/feed'

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Fixed Header */}
        <div className="container mx-auto px-4 pt-8 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">J Hub</h1>
                <p className="text-muted-foreground">Discover and share valuable content</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button
                onClick={() => router.push('/hub')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isHome
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => router.push('/hub/feed')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isFeed
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Feed
              </button>
            </div>
          </div>
        </div>

        {/* Page Content - each page controls its own container width */}
        {children}
      </div>
    </AuthenticatedLayout>
  )
}
