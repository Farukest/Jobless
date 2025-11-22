'use client'

import badgeData from './badge-data.json'

// Badge shape component props
interface BadgeShapeProps {
  className?: string
  gradientId: string
  gradientStart: string
  gradientEnd: string
}

// Generic badge component that renders from JSON data
function createBadgeComponent(svgContent: string): React.FC<BadgeShapeProps> {
  return function BadgeComponent({ className, gradientId, gradientStart, gradientEnd }: BadgeShapeProps) {
    // Replace GRADIENT placeholder with actual gradient reference
    const processedSvg = svgContent.replace(/GRADIENT/g, `url(#${gradientId})`)

    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: processedSvg }} />
      </svg>
    )
  }
}

// Export function to get badge shape component
export function getBadgeShape(iconName: string): React.ComponentType<BadgeShapeProps> {
  const svgContent = (badgeData as Record<string, { svg: string }>)[iconName]?.svg

  if (!svgContent) {
    // Return placeholder for unknown badges
    return function PlaceholderBadge({ className, gradientId, gradientStart, gradientEnd }: BadgeShapeProps) {
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill={`url(#${gradientId})`} stroke="#4B5563" strokeWidth="2"/>
          <text x="50" y="55" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">?</text>
        </svg>
      )
    }
  }

  return createBadgeComponent(svgContent)
}
