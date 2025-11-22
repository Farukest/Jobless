'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useStudioMembers, type StudioMember } from '@/hooks/use-studio'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Star,
  Award,
  CheckCircle,
  Clock,
  Palette,
  Video,
  Sparkles,
  Box,
  Filter,
  ExternalLink
} from 'lucide-react'

export default function StudioTeamPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  const { data: membersData, isLoading: membersLoading } = useStudioMembers({
    specialty: specialtyFilter || undefined
  })

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

  const members = membersData?.data || []

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case 'graphic_designer':
        return <Palette className="w-5 h-5" />
      case 'video_editor':
        return <Video className="w-5 h-5" />
      case 'animator':
        return <Sparkles className="w-5 h-5" />
      case '3d_artist':
        return <Box className="w-5 h-5" />
      default:
        return <Users className="w-5 h-5" />
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500/10 text-green-500'
      case 'busy':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'unavailable':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  // Calculate stats
  const totalMembers = members.length
  const availableMembers = members.filter((m) => m.availability === 'available').length
  const totalProjects = members.reduce((sum, m) => sum + m.requestsCompleted, 0)
  const avgRating = members.length > 0
    ? (members.reduce((sum, m) => sum + m.averageRating, 0) / members.length).toFixed(1)
    : '0.0'

  // Sort members by rating
  const sortedMembers = [...members].sort((a, b) => b.averageRating - a.averageRating)

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Studio Team</h1>
            <p className="text-muted-foreground">Browse our talented designers, editors, and creators</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Members</p>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Available Now</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{availableMembers}</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Projects Completed</p>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                <p className="text-2xl font-bold text-blue-500">{totalProjects}</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold text-yellow-500">{avgRating}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by specialty:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpecialtyFilter('')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  specialtyFilter === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSpecialtyFilter('graphic_designer')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  specialtyFilter === 'graphic_designer' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Graphic Designers
              </button>
              <button
                onClick={() => setSpecialtyFilter('video_editor')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  specialtyFilter === 'video_editor' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Video Editors
              </button>
              <button
                onClick={() => setSpecialtyFilter('animator')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  specialtyFilter === 'animator' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Animators
              </button>
            </div>
          </div>

          {/* Team Members Grid */}
          {membersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-6">
                  {specialtyFilter
                    ? 'No team members found with this specialty. Try adjusting your filters.'
                    : 'Our studio team is currently being assembled. Check back soon!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedMembers.map((member, index) => (
                <div
                  key={member._id}
                  className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                >
                  {/* Member Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                      {member.userId.profileImage ? (
                        <img
                          src={member.userId.profileImage}
                          alt={member.userId.displayName || 'Member'}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        getSpecialtyIcon(member.specialty)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold truncate">
                          {member.userId.displayName || member.userId.twitterUsername || 'Anonymous'}
                        </h3>
                        {index < 3 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-xs font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Top {index + 1}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {member.specialty.replace('_', ' ')}
                      </p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getAvailabilityColor(member.availability)}`}>
                        <Clock className="w-3 h-3" />
                        <span className="capitalize">{member.availability}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {member.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 5 && (
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            +{member.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Projects</p>
                      <p className="text-lg font-bold">{member.requestsCompleted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <p className="text-lg font-bold">{member.averageRating.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Points</p>
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-blue-500" />
                        <p className="text-lg font-bold">{member.totalPointsEarned}</p>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Preview */}
                  {member.portfolio.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Recent Work:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {member.portfolio.slice(0, 3).map((item, idx) => (
                          <a
                            key={idx}
                            href={item.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-secondary rounded-md overflow-hidden hover:opacity-80 transition-opacity group relative"
                          >
                            <img
                              src={item.mediaUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Member since {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
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
