'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '../ui/logo'
import { ThemeToggle } from '../ui/theme-toggle'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

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
    return item.roles.some(role => user.roles?.includes(role))
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
              <Link
                href="/center/profile"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Profile
              </Link>
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
