'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function AlphaPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

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
            <h1 className="text-4xl font-bold tracking-tight mb-2">J Alpha</h1>
            <p className="text-muted-foreground">Early opportunities and community intelligence</p>
          </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Airdrop Radar</h3>
            <p className="text-sm text-muted-foreground">
              Early airdrop opportunities and farming strategies
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Testnet Tracker</h3>
            <p className="text-sm text-muted-foreground">
              Active testnets and points programs
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Memecoin Calls</h3>
            <p className="text-sm text-muted-foreground">
              Early memecoin gems and trading opportunities
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">DeFi Signals</h3>
            <p className="text-sm text-muted-foreground">
              High-yield opportunities and protocol launches
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How J Alpha Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  1
                </div>
                <h3 className="font-semibold">Submit Alpha</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11">
                Share early opportunities you discover with the community
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  2
                </div>
                <h3 className="font-semibold">Community Votes</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11">
                Members vote bullish or bearish on each opportunity
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  3
                </div>
                <h3 className="font-semibold">Track & Earn</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-11">
                Earn reputation and rewards for accurate alpha calls
              </p>
            </div>
          </div>
        </div>

        {/* Rating System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Potential Rating</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Very High</span>
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-green-500" />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High</span>
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-blue-500" />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium</span>
                <div className="flex items-center gap-1">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-yellow-500" />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Rating</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">High Risk</span>
                <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                  High
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium Risk</span>
                <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                  Medium
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Risk</span>
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                  Low
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-muted-foreground">Active Alphas</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold mb-2">0%</p>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-muted-foreground">Top Scouts</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-2">J Alpha is launching soon</h3>
              <p className="text-sm text-muted-foreground">
                We're building a community-driven alpha sharing platform. Submit opportunities, track outcomes,
                and build your reputation as a top scout. Early contributors will earn special recognition
                and enhanced rewards.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  )
}
