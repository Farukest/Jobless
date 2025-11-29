'use client'

import { useAuth } from '@/hooks/use-auth'
import {
  useUserStats,
  useUserActivity,
  useMyZoneFeed,
  useMyFeed,
  useCommentedFeed,
  useLikedFeed,
  ProfileFeedContent,
} from '@/hooks/use-user'
import { useMyBadges, useMyPinnedBadges, usePinBadge, useUnpinBadge } from '@/hooks/use-badges'
import { Skeleton, ProfileSkeleton, CardSkeleton, TwitterFeedSkeleton } from '@/components/ui/skeleton'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { BadgeDisplay, PinnedBadges, BadgeGrid } from '@/components/badges/badge-display'
import { getBadgeShape } from '@/components/badges/badge-shapes'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/lib/socket'
import { TwitterStyleContent } from '@/components/hub/twitter-style-content'
import { TwitterReplyInput } from '@/components/hub/twitter-reply-input'
import { useToggleLike, useToggleBookmark, useCreateComment } from '@/hooks/use-hub'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const queryClient = useQueryClient()
  const observerTarget = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Badge hooks
  const { data: badges } = useMyBadges()
  const { data: pinnedBadges } = useMyPinnedBadges()
  const { mutate: pinBadge } = usePinBadge()
  const { mutate: unpinBadge } = useUnpinBadge()
  const [showAllBadges, setShowAllBadges] = useState(false)
  const [badgeRarityFilter, setBadgeRarityFilter] = useState<string | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedDisplayName, setEditedDisplayName] = useState('')
  const [editedBio, setEditedBio] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Social links state
  const [unlinkingPlatform, setUnlinkingPlatform] = useState<string | null>(null)

  // Feed system state
  type FeedTab = 'my-zone' | 'my-feed' | 'commented' | 'liked'
  const [activeTab, setActiveTab] = useState<FeedTab>('my-feed')
  const [selectedContent, setSelectedContent] = useState<ProfileFeedContent | null>(null)
  const [commentText, setCommentText] = useState('')

  // Feed data hooks
  const myZoneFeed = useMyZoneFeed(user?._id, activeTab === 'my-zone')
  const myFeed = useMyFeed(user?._id, activeTab === 'my-feed')
  const commentedFeed = useCommentedFeed(user?._id, activeTab === 'commented')
  const likedFeed = useLikedFeed(user?._id, activeTab === 'liked')

  // Engagement mutations
  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleBookmark } = useToggleBookmark()
  const { mutate: createComment, isPending: isSubmittingComment } = useCreateComment()

  // Client-side mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Initialize edit fields when user data loads or edit mode changes
  useEffect(() => {
    if (user && isEditing) {
      setEditedDisplayName(user.displayName || '')
      setEditedBio(user.bio || '')
    }
  }, [user, isEditing])

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedDisplayName(user?.displayName || '')
    setEditedBio(user?.bio || '')
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const response = await api.put('/users/profile', {
        displayName: editedDisplayName,
        bio: editedBio,
      })

      if (response.data.success) {
        toast.success('Profile updated successfully')
        await refreshUser()
        setIsEditing(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileImageClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleUnlinkSocial = async (platform: 'linkedin' | 'github' | 'twitter') => {
    setUnlinkingPlatform(platform)
    try {
      await api.delete(`/social-links/unlink/${platform}`)
      toast.success(`${platform} account unlinked successfully`)
      await refreshUser()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to unlink ${platform} account`)
    } finally {
      setUnlinkingPlatform(null)
    }
  }

  const handleDisconnectAuth = async (authType: 'twitter' | 'wallet') => {
    const authName = authType === 'twitter' ? 'Twitter' : 'Wallet'
    if (!confirm(`Are you sure you want to disconnect ${authName} authentication? You must have at least one authentication method.`)) {
      return
    }

    try {
      await api.delete(`/social-links/auth/${authType}`)
      toast.success(`${authName} authentication disconnected successfully`)
      await refreshUser()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to disconnect ${authName}`)
    }
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      // Upload image
      const formData = new FormData()
      formData.append('image', file)

      const uploadResponse = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = uploadResponse.data.data.url

      // Update profile with new image
      const updateResponse = await api.put('/users/profile-picture', {
        imageUrl,
      })

      if (updateResponse.data.success) {
        toast.success('Profile image updated successfully')
        await refreshUser()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload profile image')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Feed handlers
  const handleCommentClick = (content: ProfileFeedContent) => {
    setSelectedContent(content)
    setCommentText('')
  }

  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedContent) return

    createComment(
      {
        contentType: 'hub_content',
        contentId: selectedContent._id,
        content: commentText.trim(),
      },
      {
        onSuccess: () => {
          setCommentText('')
          setSelectedContent(null)
          // WebSocket will handle comment count update
        },
      }
    )
  }

  // Get active feed data
  const getActiveFeed = () => {
    switch (activeTab) {
      case 'my-zone':
        return myZoneFeed
      case 'my-feed':
        return myFeed
      case 'commented':
        return commentedFeed
      case 'liked':
        return likedFeed
    }
  }

  const activeFeed = getActiveFeed()
  const allContents =
    activeTab === 'commented'
      ? [] // Commented feed has different structure
      : activeFeed.data?.pages.flatMap((page) => page.data) || []

  // Infinite scroll observer
  useEffect(() => {
    if (!activeFeed.hasNextPage || activeFeed.isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          activeFeed.fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [activeFeed.hasNextPage, activeFeed.isFetchingNextPage, activeFeed.fetchNextPage])

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!user?._id) return

    const socket = getSocket()

    // Like update
    const handleLikeUpdate = (data: { contentId: string; likesCount: number }) => {
      // Update all feed queries
      const feedTypes = ['my-zone', 'my-feed', 'liked']
      feedTypes.forEach((feedType) => {
        queryClient.setQueryData(['user', 'feed', feedType, user._id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((content: ProfileFeedContent) =>
                content._id === data.contentId ? { ...content, likesCount: data.likesCount } : content
              ),
            })),
          }
        })
      })
    }

    // Bookmark update
    const handleBookmarkUpdate = (data: { contentId: string; bookmarksCount: number }) => {
      const feedTypes = ['my-zone', 'my-feed', 'liked']
      feedTypes.forEach((feedType) => {
        queryClient.setQueryData(['user', 'feed', feedType, user._id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((content: ProfileFeedContent) =>
                content._id === data.contentId ? { ...content, bookmarksCount: data.bookmarksCount } : content
              ),
            })),
          }
        })
      })
    }

    // Comment created
    const handleCommentCreated = (data: { contentId: string }) => {
      const feedTypes = ['my-zone', 'my-feed', 'commented', 'liked']
      feedTypes.forEach((feedType) => {
        queryClient.setQueryData(['user', 'feed', feedType, user._id], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((content: any) =>
                content._id === data.contentId || content.content?._id === data.contentId
                  ? {
                      ...content,
                      commentsCount: ((content.commentsCount || content.content?.commentsCount) || 0) + 1,
                    }
                  : content
              ),
            })),
          }
        })
      })
    }

    socket.on('hub:likeUpdate', handleLikeUpdate)
    socket.on('hub:bookmarkUpdate', handleBookmarkUpdate)
    socket.on('hub:commentCreated', handleCommentCreated)

    return () => {
      socket.off('hub:likeUpdate', handleLikeUpdate)
      socket.off('hub:bookmarkUpdate', handleBookmarkUpdate)
      socket.off('hub:commentCreated', handleCommentCreated)
    }
  }, [queryClient, user?._id])

  if (authLoading || !user) {
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

  const statCards = [
    {
      label: 'J Hub',
      value: stats?.jHub.contentsCreated || 0,
      description: 'Contents Created',
      color: 'text-blue-500',
    },
    {
      label: 'J Studio',
      value: stats?.jStudio.requestsSubmitted || 0,
      description: 'Requests Submitted',
      color: 'text-purple-500',
    },
    {
      label: 'J Academy',
      value: stats?.jAcademy.coursesCreated || 0,
      description: 'Courses Created',
      color: 'text-green-500',
    },
    {
      label: 'J Alpha',
      value: stats?.jAlpha.alphasSubmitted || 0,
      description: 'Alphas Submitted',
      color: 'text-orange-500',
    },
    {
      label: 'J Info',
      value: stats?.jInfo.engagementsGiven || 0,
      description: 'Engagements Given',
      color: 'text-pink-500',
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-card rounded-lg border border-border p-8 relative">
            {/* Logout Button */}
            <button
              onClick={async () => {
                // Clear auth tokens
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')

                // Disconnect wallet using wagmi
                const { disconnect } = await import('wagmi')
                try {
                  disconnect()
                } catch (e) {
                  // Wallet might not be connected
                }

                // Redirect to login
                router.push('/login')
              }}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />

              <div className="flex-shrink-0 relative group">
                <div
                  onClick={handleProfileImageClick}
                  className="cursor-pointer relative"
                  title="Click to upload new profile image"
                >
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.displayName || 'Profile'}
                      width={128}
                      height={128}
                      className="rounded-lg border-2 border-border group-hover:opacity-75 transition-opacity object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-border group-hover:opacity-75 transition-opacity">
                      <span className="text-4xl text-muted-foreground">
                        {(user.displayName || user.twitterUsername || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={editedDisplayName}
                            onChange={(e) => setEditedDisplayName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter display name"
                            maxLength={50}
                          />
                        </div>
                        {user.twitterUsername && (
                          <p className="text-muted-foreground">@{user.twitterUsername}</p>
                        )}
                        {user.walletAddress && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-3xl font-bold tracking-tight">
                            {user.displayName || user.twitterUsername || 'Anonymous User'}
                          </h1>
                          <button
                            onClick={handleEditClick}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="Edit profile"
                          >
                            <svg
                              className="w-5 h-5 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </div>
                        {user.twitterUsername && (
                          <p className="text-muted-foreground mt-1">@{user.twitterUsername}</p>
                        )}
                        {user.walletAddress && (
                          <p className="text-sm text-muted-foreground mt-1 font-mono">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                      placeholder="Tell us about yourself"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {editedBio.length}/500 characters
                    </p>
                  </div>
                ) : (
                  user.bio && <p className="text-muted-foreground">{user.bio}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {user.roles?.map((role: any) => (
                    <span
                      key={role._id || role.name}
                      className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                    >
                      {role.displayName || role.name || role}
                    </span>
                  ))}
                </div>

                {/* Pinned Badges */}
                {pinnedBadges?.data && pinnedBadges.data.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Pinned Badges</p>
                    <PinnedBadges badges={pinnedBadges.data} />
                  </div>
                )}


                {/* Social Links */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Twitter */}
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        if (user.socialLinks?.twitter) {
                          const confirmed = window.confirm('Do you want to unlink your Twitter account?')
                          if (confirmed) await handleUnlinkSocial('twitter')
                        } else {
                          const username = window.prompt('Enter your Twitter username (without @):')
                          if (username?.trim()) {
                            setUnlinkingPlatform('twitter')
                            try {
                              await api.post('/social-links/link', { platform: 'twitter', username: username.trim() })
                              toast.success('Twitter linked successfully')
                              await refreshUser()
                            } catch (error: any) {
                              toast.error(error.response?.data?.message || 'Failed to link Twitter')
                            } finally {
                              setUnlinkingPlatform(null)
                            }
                          }
                        }
                      }}
                      disabled={unlinkingPlatform === 'twitter'}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-50 ${
                        user.socialLinks?.twitter
                          ? 'bg-[#1DA1F2] hover:opacity-80'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${user.socialLinks?.twitter ? 'text-white' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </button>
                    {user.socialLinks?.twitter && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        @{user.socialLinks.twitter}
                      </div>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        if (user.socialLinks?.linkedin) {
                          const confirmed = window.confirm('Do you want to unlink your LinkedIn account?')
                          if (confirmed) await handleUnlinkSocial('linkedin')
                        } else {
                          // Redirect to OAuth with JWT token in query
                          const token = localStorage.getItem('accessToken')
                          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/linkedin?token=${token}`
                        }
                      }}
                      disabled={unlinkingPlatform === 'linkedin'}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-50 ${
                        user.socialLinks?.linkedin
                          ? 'bg-[#0A66C2] hover:opacity-80'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${user.socialLinks?.linkedin ? 'text-white' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </button>
                    {user.socialLinks?.linkedin && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {user.socialLinks.linkedin}
                      </div>
                    )}
                  </div>

                  {/* GitHub */}
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        if (user.socialLinks?.github) {
                          const confirmed = window.confirm('Do you want to unlink your GitHub account?')
                          if (confirmed) await handleUnlinkSocial('github')
                        } else {
                          // Redirect to OAuth with JWT token in query
                          const token = localStorage.getItem('accessToken')
                          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github?token=${token}`
                        }
                      }}
                      disabled={unlinkingPlatform === 'github'}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-50 ${
                        user.socialLinks?.github
                          ? 'bg-foreground hover:opacity-80'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${user.socialLinks?.github ? 'text-background' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </button>
                    {user.socialLinks?.github && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {user.socialLinks.github}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Badge Gallery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Badge Collection</h2>
              {badges?.data && badges.data.length > 8 && (
                <button
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="text-sm text-primary hover:underline"
                >
                  {showAllBadges ? 'Show Less' : `View All (${badges?.data.length || 0})`}
                </button>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              {badges && badges.data && badges.data.length > 0 ? (() => {
                // Filter badges by rarity if filter is active
                const filteredBadges = badgeRarityFilter
                  ? badges.data.filter((b: any) => b.badgeId && b.badgeId.rarity === badgeRarityFilter)
                  : badges.data

                const displayBadges = showAllBadges ? filteredBadges : filteredBadges.slice(0, 8)

                return (
                  <BadgeGrid
                    badges={displayBadges}
                    size="md"
                    onBadgeClick={(badge) => {
                      // TODO: Show badge detail modal
                      console.log('Badge clicked:', badge)
                    }}
                  />
                )
              })() : (() => {
                const ShieldShape = getBadgeShape('Rookie')
                return (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 opacity-30">
                      <ShieldShape
                        className="w-full h-full"
                        gradientId="profile-empty-badge"
                        gradientStart="#6b7280"
                        gradientEnd="#9ca3af"
                      />
                    </div>
                    <p className="text-muted-foreground">No badges earned yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete activities to earn your first badge!
                    </p>
                  </div>
                )
              })()}
            </div>

            {badges?.data && badges.data.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div
                  onClick={() => setBadgeRarityFilter(badgeRarityFilter === null ? null : null)}
                  className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${
                    badgeRarityFilter === null ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Total Badges</p>
                  <p className="text-2xl font-bold">{badges.data.length}</p>
                </div>
                <div
                  onClick={() => setBadgeRarityFilter(badgeRarityFilter === 'common' ? null : 'common')}
                  className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-gray-500 ${
                    badgeRarityFilter === 'common' ? 'border-gray-500 ring-2 ring-gray-500/20' : 'border-border'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Common</p>
                  <p className="text-2xl font-bold text-gray-500">
                    {badges.data.filter((b: any) => b.badgeId && b.badgeId.rarity === 'common').length}
                  </p>
                </div>
                <div
                  onClick={() => setBadgeRarityFilter(badgeRarityFilter === 'rare' ? null : 'rare')}
                  className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-blue-500 ${
                    badgeRarityFilter === 'rare' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Rare</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {badges.data.filter((b: any) => b.badgeId && b.badgeId.rarity === 'rare').length}
                  </p>
                </div>
                <div
                  onClick={() => setBadgeRarityFilter(badgeRarityFilter === 'epic' ? null : 'epic')}
                  className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-purple-500 ${
                    badgeRarityFilter === 'epic' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-border'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Epic</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {badges.data.filter((b: any) => b.badgeId && b.badgeId.rarity === 'epic').length}
                  </p>
                </div>
                <div
                  onClick={() => setBadgeRarityFilter(badgeRarityFilter === 'legendary' ? null : 'legendary')}
                  className={`bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-yellow-500 ${
                    badgeRarityFilter === 'legendary' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-border'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Legendary</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {badges.data.filter((b: any) => b.badgeId && b.badgeId.rarity === 'legendary').length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">J-Rank Points</p>
                  <p className="text-4xl font-bold mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      stats?.overall.jRankPoints || 0
                    )}
                  </p>
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
                  <p className="text-4xl font-bold mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      stats?.overall.contributionScore || 0
                    )}
                  </p>
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

          {/* Module Stats */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Module Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
              ) : (
                statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                  >
                    <p className={`text-sm font-medium ${stat.color}`}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personal Progress Map */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Personal Progress Map</h2>
            <div className="bg-card rounded-lg border border-border p-8">
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* J Hub Progress */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-500">J Hub</h3>
                        <span className="text-sm text-muted-foreground">{stats?.jHub.contentsCreated || 0} contents</span>
                      </div>
                      <div className="w-full bg-muted rounded-lg h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-lg transition-all"
                          style={{ width: `${Math.min(100, ((stats?.jHub.contentsCreated || 0) / 10) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.jHub.contentsCreated === 0 ? 'Start by creating your first content' : `Great! Keep creating quality content`}
                      </p>
                    </div>
                  </div>

                  {/* J Studio Progress */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-purple-500">J Studio</h3>
                        <span className="text-sm text-muted-foreground">{stats?.jStudio.requestsSubmitted || 0} requests</span>
                      </div>
                      <div className="w-full bg-muted rounded-lg h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-lg transition-all"
                          style={{ width: `${Math.min(100, ((stats?.jStudio.requestsSubmitted || 0) / 5) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.jStudio.requestsSubmitted === 0 ? 'Request professional visual content' : `Continue collaborating with designers`}
                      </p>
                    </div>
                  </div>

                  {/* J Academy Progress */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-green-500">J Academy</h3>
                        <span className="text-sm text-muted-foreground">{stats?.jAcademy.coursesCreated || 0} courses</span>
                      </div>
                      <div className="w-full bg-muted rounded-lg h-2">
                        <div
                          className="bg-green-500 h-2 rounded-lg transition-all"
                          style={{ width: `${Math.min(100, ((stats?.jAcademy.coursesCreated || 0) / 3) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.jAcademy.coursesCreated === 0 ? 'Learn and teach in J Academy' : `Keep sharing knowledge`}
                      </p>
                    </div>
                  </div>

                  {/* J Alpha Progress */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-orange-500">J Alpha</h3>
                        <span className="text-sm text-muted-foreground">{stats?.jAlpha.alphasSubmitted || 0} alphas</span>
                      </div>
                      <div className="w-full bg-muted rounded-lg h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-lg transition-all"
                          style={{ width: `${Math.min(100, ((stats?.jAlpha.alphasSubmitted || 0) / 10) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.jAlpha.alphasSubmitted === 0 ? 'Scout and share alpha opportunities' : `Excellent scouting work!`}
                      </p>
                    </div>
                  </div>

                  {/* J Info Progress */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-pink-500">J Info</h3>
                        <span className="text-sm text-muted-foreground">{stats?.jInfo.engagementsGiven || 0} engagements</span>
                      </div>
                      <div className="w-full bg-muted rounded-lg h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-lg transition-all"
                          style={{ width: `${Math.min(100, ((stats?.jInfo.engagementsGiven || 0) / 20) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.jInfo.engagementsGiven === 0 ? 'Support the community with engagements' : `Community champion!`}
                      </p>
                    </div>
                  </div>

                  {/* Overall Progress Summary */}
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">Overall Progress</h3>
                        <p className="text-sm text-muted-foreground">
                          You are actively using {[
                            stats?.jHub.contentsCreated,
                            stats?.jStudio.requestsSubmitted,
                            stats?.jAcademy.coursesCreated,
                            stats?.jAlpha.alphasSubmitted,
                            stats?.jInfo.engagementsGiven
                          ].filter(v => v && v > 0).length} out of 5 Jobless modules
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{stats?.overall.jRankPoints || 0}</p>
                        <p className="text-xs text-muted-foreground">J-Rank Points</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Feed (4 Tabs) */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Content Feed</h2>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-border mb-6">
              {user?.permissions?.canCreateContent && (
                <button
                  onClick={() => setActiveTab('my-zone')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'my-zone'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Zone
                </button>
              )}
              <button
                onClick={() => setActiveTab('my-feed')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'my-feed'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                My Feed
              </button>
              <button
                onClick={() => setActiveTab('commented')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'commented'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Commented
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'liked'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Liked
              </button>
            </div>

            {/* Feed Content */}
            {activeFeed.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TwitterFeedSkeleton key={i} />
                ))}
              </div>
            ) : activeTab === 'commented' ? (
              // Commented Feed - Thread View
              commentedFeed.data?.pages[0]?.data && commentedFeed.data.pages[0].data.length > 0 ? (
                <div className="space-y-6">
                  {commentedFeed.data.pages.flatMap((page) => page.data).map((threadData) => (
                    <div key={threadData.contentId} className="bg-card border border-border rounded-lg p-4">
                      {/* Thread Items */}
                      {threadData.thread.map((item, index) => (
                        <div key={index} className="flex gap-3 mb-2">
                          {/* Left column - Avatar + Vertical Line */}
                          <div className="flex flex-col items-center" style={{ width: '40px' }}>
                            {item.data.authorId?.profileImage || item.data.userId?.profileImage ? (
                              <Image
                                src={item.data.authorId?.profileImage || item.data.userId?.profileImage}
                                alt={item.data.authorId?.displayName || item.data.userId?.displayName || 'User'}
                                width={40}
                                height={40}
                                className="rounded-lg"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {((item.data.authorId?.displayName || item.data.userId?.displayName) || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            {/* Vertical line (same horizontal level) */}
                            {index < threadData.thread.length - 1 && (
                              <div className="w-0.5 bg-border flex-1 my-2" style={{ minHeight: '20px' }}></div>
                            )}
                          </div>

                          {/* Right column - Content/Comment */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {item.data.authorId?.displayName || item.data.userId?.displayName || 'Anonymous'}
                              </span>
                              {(item.data.authorId?.twitterUsername || item.data.userId?.twitterUsername) && (
                                <span className="text-muted-foreground text-xs">
                                  @{item.data.authorId?.twitterUsername || item.data.userId?.twitterUsername}
                                </span>
                              )}
                              {item.isUserComment && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  You
                                </span>
                              )}
                            </div>

                            {/* Content based on type */}
                            {item.type === 'content' ? (
                              <Link
                                href={`/hub/content/${item.data._id}`}
                                className="text-sm font-medium hover:underline cursor-pointer"
                              >
                                {item.data.title}
                              </Link>
                            ) : (
                              <p className="text-sm">{item.data.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {commentedFeed.isFetchingNextPage && (
                    <div className="py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {/* Intersection observer target */}
                  <div ref={observerTarget} className="h-4" />

                  {/* End of feed */}
                  {!commentedFeed.hasNextPage && (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      You've reached the end
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                  <p className="text-muted-foreground">No commented posts yet</p>
                </div>
              )
            ) : (
              // Standard Feeds (My Zone, My Feed, Liked)
              allContents.length > 0 ? (
                <div className="space-y-3">
                  {allContents.map((content) => (
                    <TwitterStyleContent
                      key={content._id}
                      content={content}
                      onLike={() => toggleLike(content._id)}
                      onBookmark={() => toggleBookmark(content._id)}
                      onComment={() => handleCommentClick(content)}
                      showFullContent={false}
                    />
                  ))}

                  {/* Loading indicator */}
                  {activeFeed.isFetchingNextPage && (
                    <div className="py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {/* Intersection observer target */}
                  <div ref={observerTarget} className="h-4" />

                  {/* End of feed */}
                  {!activeFeed.hasNextPage && (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      You've reached the end
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === 'my-zone' && 'No content created yet'}
                    {activeTab === 'my-feed' && 'No recommended content yet. Start interacting with content to get personalized recommendations.'}
                    {activeTab === 'liked' && 'No liked posts yet'}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Comment Modal */}
      {selectedContent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedContent(null)}
        >
          <div
            className="bg-card rounded-xl border border-border max-w-xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => {
              e.stopPropagation()
              const textarea = e.currentTarget.querySelector('textarea')
              if (textarea && !window.getSelection()?.toString()) {
                textarea.focus()
              }
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedContent(null)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Info & Comment Input */}
            <div className="p-4">
              {/* Content Section */}
              <div className="flex gap-3 mb-2">
                {/* Left column - Avatar + Vertical Line */}
                <div className="flex flex-col items-center" style={{ width: '40px' }}>
                  {selectedContent.authorId?.profileImage ? (
                    <Image
                      src={selectedContent.authorId.profileImage}
                      alt={selectedContent.authorId.displayName || 'User'}
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {(selectedContent.authorId?.displayName || selectedContent.authorId?.twitterUsername || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Vertical line */}
                  <div className="w-0.5 bg-border flex-1 my-2" style={{ minHeight: '20px' }}></div>
                </div>

                {/* Right column - Content info */}
                <div className="flex-1 min-w-0">
                  {/* Content header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{selectedContent.authorId?.displayName || 'Anonymous'}</span>
                    {selectedContent.authorId?.twitterUsername && (
                      <span className="text-muted-foreground text-xs">@{selectedContent.authorId.twitterUsername}</span>
                    )}
                  </div>

                  {/* Content title */}
                  <p className="text-sm font-medium mb-2">{selectedContent.title}</p>

                  {/* Replying to indicator */}
                  <div className="text-xs text-muted-foreground mb-2">
                    Replying to{' '}
                    {selectedContent.authorId?._id ? (
                      <Link
                        href={`/center/profile/${selectedContent.authorId._id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{selectedContent.authorId?.twitterUsername || selectedContent.authorId?.displayName || 'user'}
                      </Link>
                    ) : (
                      <span className="text-primary">@{selectedContent.authorId?.twitterUsername || selectedContent.authorId?.displayName || 'user'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input Section */}
              <TwitterReplyInput
                value={commentText}
                onChange={setCommentText}
                onSubmit={handleSubmitComment}
                isSubmitting={isSubmittingComment}
                placeholder="Post your comment..."
                currentUser={user}
              />
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
