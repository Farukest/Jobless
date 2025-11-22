'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton, ProfileSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { api } from '@/lib/api'
import { BadgeGrid } from '@/components/badges/badge-display'

interface UserProfile {
  _id: string
  displayName?: string
  twitterUsername?: string
  profileImage?: string
  bio?: string
  walletAddress?: string
  roles?: Array<{
    _id: string
    name: string
    displayName: string
  }>
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
  jRankPoints?: number
  contributionScore?: number
  contentCreated?: number
  interactionsGiven?: number
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<any[]>([])
  const [badgeStats, setBadgeStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Redirect to own profile page if viewing own profile
  useEffect(() => {
    if (currentUser && userId === currentUser._id) {
      router.push('/center/profile')
    }
  }, [currentUser, userId, router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return
      if (currentUser && userId === currentUser._id) return // Skip fetch if redirecting

      try {
        setIsLoading(true)

        // Fetch user profile
        const { data } = await api.get(`/users/profile/${userId}`)
        setUser(data.data)

        // Fetch user badges
        try {
          const badgesRes = await api.get(`/users/${userId}/badges?onlyVisible=true`)
          setBadges(badgesRes.data.data || [])
        } catch (err) {
          console.error('Failed to fetch badges:', err)
        }

        // Fetch badge stats
        try {
          const statsRes = await api.get(`/users/${userId}/badges/stats`)
          setBadgeStats(statsRes.data.data)
        } catch (err) {
          console.error('Failed to fetch badge stats:', err)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, currentUser])

  if (authLoading || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="space-y-8">
              <ProfileSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error || !user) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The user profile you're looking for doesn't exist.
              </p>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Check if viewing own profile
  const isOwnProfile = currentUser?._id === userId

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-8">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>

            {/* Profile Header */}
            <div className="bg-card rounded-lg border border-border p-8 relative">
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/center/profile')}
                  className="absolute top-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Edit Profile
                </button>
              )}

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.displayName || 'Profile'}
                      width={128}
                      height={128}
                      className="rounded-lg border-2 border-border object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                      <span className="text-4xl text-muted-foreground">
                        {(user.displayName || user.twitterUsername || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {user.displayName || user.twitterUsername || 'Anonymous User'}
                    </h1>
                    {user.twitterUsername && (
                      <p className="text-muted-foreground mt-1">@{user.twitterUsername}</p>
                    )}
                    {user.walletAddress && (
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </p>
                    )}
                  </div>

                  {user.bio && <p className="text-muted-foreground">{user.bio}</p>}

                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map((role: any, index: number) => (
                      <span
                        key={role._id || role.name || index}
                        className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                      >
                        {role.displayName || role.name || role}
                      </span>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-2">
                    {user.socialLinks?.twitter && (
                      <a
                        href={`https://twitter.com/${user.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-[#1DA1F2] hover:opacity-80 flex items-center justify-center transition-opacity"
                        title={`@${user.socialLinks.twitter}`}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}

                    {user.socialLinks?.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-[#0A66C2] hover:opacity-80 flex items-center justify-center transition-opacity"
                        title="LinkedIn"
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}

                    {user.socialLinks?.github && (
                      <a
                        href={user.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-foreground hover:opacity-80 flex items-center justify-center transition-opacity"
                        title="GitHub"
                      >
                        <svg className="w-4 h-4 text-background" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">J-Rank Points</p>
                    <p className="text-4xl font-bold mt-2">{user.jRankPoints || 0}</p>
                  </div>
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contribution Score</p>
                    <p className="text-4xl font-bold mt-2">{user.contributionScore || 0}</p>
                  </div>
                  <div className="h-16 w-16 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Collection */}
            {badges.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Badge Collection</h2>
                <BadgeGrid badges={badges} size="md" />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Total Badges</p>
                    <p className="text-2xl font-bold">{badges.length}</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Common</p>
                    <p className="text-2xl font-bold text-gray-500">
                      {badges.filter((b: any) => b.badgeId && b.badgeId.rarity === 'common').length}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Rare</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {badges.filter((b: any) => b.badgeId && b.badgeId.rarity === 'rare').length}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Epic</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {badges.filter((b: any) => b.badgeId && b.badgeId.rarity === 'epic').length}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Legendary</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {badges.filter((b: any) => b.badgeId && b.badgeId.rarity === 'legendary').length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Module Activity */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Module Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">J Hub</span>
                    <span className="text-2xl font-bold">{user.contentCreated || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Contents Created</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">J Info</span>
                    <span className="text-2xl font-bold">{user.interactionsGiven || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Engagements Given</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
