'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  const [imagePath, setImagePath] = useState('/404/404-dark-1.svg')

  useEffect(() => {
    setMounted(true)

    // Check theme from document class
    const isDark = document.documentElement.classList.contains('dark')

    if (isDark) {
      // Random between dark-1 and dark-2
      const randomDark = Math.random() > 0.5 ? '404-dark-1.svg' : '404-dark-2.svg'
      setImagePath(`/404/${randomDark}`)
    } else {
      // Random between light-1 and light-2
      const randomLight = Math.random() > 0.5 ? '404-light-1.svg' : '404-light-2.svg'
      setImagePath(`/404/${randomLight}`)
    }

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark')
      if (isDarkNow) {
        const randomDark = Math.random() > 0.5 ? '404-dark-1.svg' : '404-dark-2.svg'
        setImagePath(`/404/${randomDark}`)
      } else {
        const randomLight = Math.random() > 0.5 ? '404-light-1.svg' : '404-light-2.svg'
        setImagePath(`/404/${randomLight}`)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Character Illustration */}
        <div className="flex justify-center">
          <Image
            src={imagePath}
            alt="404 Not Found"
            width={400}
            height={400}
            priority
            className="w-full max-w-md h-auto"
          />
        </div>

        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-foreground">404</h1>
          <div className="h-1 w-32 bg-primary mx-auto"></div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Back to Home
          </Link>
          <Link
            href="/hub"
            className="px-6 py-2.5 bg-card border border-border rounded-lg hover:bg-muted transition-colors font-medium"
          >
            Browse Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
