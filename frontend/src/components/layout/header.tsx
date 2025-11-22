'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '../ui/logo'
import { ThemeToggle } from '../ui/theme-toggle'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/hooks/use-auth'
import { cn, userHasAnyRole } from '@/lib/utils'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigation = [
    { name: 'Hub', href: '/hub', roles: ['member'] },
    { name: 'Studio', href: '/studio', roles: ['member'] },
    { name: 'Academy', href: '/academy', roles: ['member'] },
    { name: 'Info', href: '/info', roles: ['member'] },
    { name: 'Alpha', href: '/alpha', roles: ['member'] },
  ]

  const filteredNavigation = navigation.filter(item => {
    if (!isAuthenticated) return false
    if (!user) return false
    return item.roles.some(role => user.roles?.some((r: any) => r.name === role || r === role))
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card border border-border hover:bg-accent h-9 px-3"
                            >
                              Connect Wallet
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                            >
                              Wrong network
                            </button>
                          )
                        }

                        return (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card border border-border hover:bg-accent h-9 px-3"
                            >
                              {chain.hasIcon && chain.iconUrl && (
                                <Image
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                />
                              )}
                              <span className="text-xs">{chain.name}</span>
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card border border-border hover:bg-accent h-9 px-3"
                            >
                              <span className="text-xs font-mono">{account.displayName}</span>
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Link
                  href="/center/profile"
                  onClick={(e) => {
                    // Only prevent default on left click (button 0)
                    // Allow middle-click (button 1) and right-click (button 2) to work normally
                    if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault()
                      setIsDropdownOpen(!isDropdownOpen)
                    }
                  }}
                  onMouseDown={(e) => {
                    // Prevent dropdown from opening on middle-click
                    if (e.button === 1) {
                      e.stopPropagation()
                    }
                  }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors overflow-hidden"
                >
                  {user?.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.displayName || 'Profile'}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user?.displayName?.[0]?.toUpperCase() || user?.walletAddress?.slice(2, 4).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                    <Link
                      href="/center/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>

                    {userHasAnyRole(user, ['admin', 'super_admin']) && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors border-t border-border"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
