'use client'

import { cn } from '@/lib/utils'
import { getBadgeShape } from './badge-shapes'

interface BadgeDisplayProps {
  iconName: string
  displayName: string
  color: string
  gradientStart?: string
  gradientEnd?: string
  animationType: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showGlow?: boolean
  className?: string
  onClick?: () => void
}

export function BadgeDisplay({
  iconName,
  displayName,
  color,
  gradientStart,
  gradientEnd,
  animationType,
  rarity,
  size = 'md',
  showName = true,
  showGlow = true,
  className,
  onClick
}: BadgeDisplayProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-24 h-24 text-4xl'
  }

  const nameSizeClasses = {
    sm: 'text-[10px] max-w-[60px]',
    md: 'text-xs max-w-[80px]',
    lg: 'text-sm max-w-[100px]',
    xl: 'text-base max-w-[120px]'
  }

  // Rarity border styles
  const rarityStyles = {
    common: 'border-2 border-gray-400/30',
    rare: 'border-2 border-blue-400/50 shadow-sm shadow-blue-400/20',
    epic: 'border-2 border-purple-500/60 shadow-md shadow-purple-500/30',
    legendary: 'border-3 border-yellow-400/80 shadow-lg shadow-yellow-400/50'
  }

  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    glow: 'animate-glow',
    shimmer: 'animate-shimmer',
    sparkle: 'animate-sparkle',
    wave: 'animate-wave',
    bounce: 'animate-bounce',
    rotate: 'animate-spin-slow',
    flash: 'animate-flash',
    flip: 'animate-flip',
    scan: 'animate-scan',
    divine: 'animate-divine',
    float: 'animate-float'
  }

  // Get appropriate badge shape
  const BadgeShape = getBadgeShape(iconName)
  const uniqueGradientId = `badge-gradient-${iconName.replace(/\s/g, '-')}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2',
        onClick && 'cursor-pointer hover:scale-110 transition-all duration-300',
        className
      )}
      onClick={onClick}
      title={displayName}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          'relative',
          sizeClasses[size]
        )}
        style={{ color: color }}
      >
        {/* Custom SVG Badge Shape */}
        <BadgeShape
          className="w-full h-full"
          gradientId={uniqueGradientId}
          gradientStart={gradientStart || color}
          gradientEnd={gradientEnd || color}
        />
      </div>

      {showName && (
        <span className={cn(
          'text-center font-medium truncate leading-tight',
          nameSizeClasses[size]
        )}>
          {displayName}
        </span>
      )}
    </div>
  )
}

// Badge Grid Component
interface BadgeGridProps {
  badges: Array<{
    _id: string
    badgeId: {
      iconName: string
      displayName: string
      color: string
      gradientStart?: string
      gradientEnd?: string
      animationType: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      description: string
    }
    earnedAt: string
    isPinned?: boolean
  }>
  onBadgeClick?: (badge: any) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function BadgeGrid({ badges, onBadgeClick, size = 'md', className }: BadgeGridProps) {
  if (!badges || badges.length === 0) {
    const ShieldShape = getBadgeShape('Rookie')
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 flex items-center justify-center mb-4 opacity-30">
          <ShieldShape
            className="w-full h-full"
            gradientId="empty-badge-gradient"
            gradientStart="#6b7280"
            gradientEnd="#9ca3af"
          />
        </div>
        <p className="text-muted-foreground text-sm">No badges earned yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete activities to earn badges!
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-4',
      size === 'sm' && 'grid-cols-6 md:grid-cols-8',
      size === 'md' && 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
      size === 'lg' && 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
      size === 'xl' && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      className
    )}>
      {badges.filter((userBadge) => userBadge.badgeId).map((userBadge) => (
        <BadgeDisplay
          key={userBadge._id}
          iconName={userBadge.badgeId.iconName}
          displayName={userBadge.badgeId.displayName}
          color={userBadge.badgeId.color}
          gradientStart={userBadge.badgeId.gradientStart}
          gradientEnd={userBadge.badgeId.gradientEnd}
          animationType={userBadge.badgeId.animationType}
          rarity={userBadge.badgeId.rarity}
          size={size}
          onClick={() => onBadgeClick?.(userBadge)}
        />
      ))}
    </div>
  )
}

// Pinned Badges Component (for profile display)
export function PinnedBadges({ badges, className }: { badges: any[], className?: string }) {
  if (!badges || badges.length === 0) return null

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {badges.filter((userBadge) => userBadge.badgeId).slice(0, 3).map((userBadge) => (
        <BadgeDisplay
          key={userBadge._id}
          iconName={userBadge.badgeId.iconName}
          displayName={userBadge.badgeId.displayName}
          color={userBadge.badgeId.color}
          gradientStart={userBadge.badgeId.gradientStart}
          gradientEnd={userBadge.badgeId.gradientEnd}
          animationType={userBadge.badgeId.animationType}
          rarity={userBadge.badgeId.rarity}
          size="md"
          showName={false}
        />
      ))}
    </div>
  )
}
