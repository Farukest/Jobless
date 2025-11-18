'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { ThemeProvider, useTheme } from '@/components/providers/theme-provider'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import '@rainbow-me/rainbowkit/styles.css'

// Wallet listener component to handle disconnect and account changes
function WalletListener({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [previousAddress, setPreviousAddress] = useState<string | undefined>(undefined)
  const [wasConnected, setWasConnected] = useState(false)

  useEffect(() => {
    // Track if wallet was connected before
    if (isConnected) {
      setWasConnected(true)
      setPreviousAddress(address)
    }

    // Only clear auth if wallet was connected before but now disconnected
    // This prevents clearing auth on initial page load
    if (!isConnected && wasConnected && localStorage.getItem('accessToken')) {
      console.log('🔴 Wallet disconnected - clearing auth cache')
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setWasConnected(false)
      setPreviousAddress(undefined)
      router.push('/login')
    }
  }, [isConnected, address, wasConnected, queryClient, router])

  useEffect(() => {
    // Wallet address changed (switched accounts)
    // Only trigger if both addresses exist and are different
    if (address && previousAddress && address.toLowerCase() !== previousAddress.toLowerCase() && localStorage.getItem('accessToken')) {
      console.log('🔄 Wallet address changed - clearing auth cache')
      console.log('Previous:', previousAddress)
      console.log('New:', address)
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setPreviousAddress(address)
      router.push('/login')
    }
  }, [address, previousAddress, queryClient, router])

  return <>{children}</>
}

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveTheme = mounted ? (resolvedTheme || theme) : 'dark'
  const isDark = effectiveTheme === 'dark'

  return (
    <RainbowKitProvider
      modalSize="compact"
      theme={isDark ? darkTheme({
        accentColor: 'hsl(var(--primary))',
        accentColorForeground: 'hsl(var(--primary-foreground))',
        borderRadius: 'small',
        fontStack: 'system',
        overlayBlur: 'small',
      }) : lightTheme({
        accentColor: 'hsl(var(--primary))',
        accentColorForeground: 'hsl(var(--primary-foreground))',
        borderRadius: 'small',
        fontStack: 'system',
        overlayBlur: 'small',
      })}
    >
      <WalletListener>
        {children}
      </WalletListener>
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                },
                success: {
                  icon: (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        className="animate-[dash_0.6s_ease-in-out]"
                        style={{
                          strokeDasharray: 20,
                          strokeDashoffset: 20,
                          animation: 'dash 0.6s ease-in-out forwards',
                        }}
                      />
                      <style jsx>{`
                        @keyframes dash {
                          to {
                            stroke-dashoffset: 0;
                          }
                        }
                      `}</style>
                    </svg>
                  ),
                },
                error: {
                  icon: (
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                        className="animate-[scale_0.3s_ease-in-out]"
                      />
                    </svg>
                  ),
                },
              }}
            />
          </RainbowKitWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
