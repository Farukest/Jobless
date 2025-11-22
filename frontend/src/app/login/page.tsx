'use client'

import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Logo } from '@/components/ui/logo'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    // When wallet connects, show the signature modal instead of auto-signing
    if (isConnected && address && !isAuthenticating && !showSignModal) {
      setShowSignModal(true)
    }
  }, [isConnected, address])

  const handleSendSignRequest = async () => {
    if (!address || !isConnected) return

    setIsVerifying(true)

    try {
      const message = `Sign this message to authenticate with Jobless.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`
      const signature = await signMessageAsync({ message })

      const { data } = await api.post('/auth/wallet/connect', {
        walletAddress: address,
        signature,
        message,
      })

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      // Invalidate auth query to force refetch with new tokens
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })

      toast.success('Login successful!')
      router.push('/')
    } catch (error: any) {
      console.error('Auth error:', error)

      if (error.code === 'ACTION_REJECTED') {
        toast.error('Signature cancelled')
      } else {
        toast.error(error.response?.data?.message || 'Authentication failed')
      }

      setIsVerifying(false)
      setShowSignModal(false)
    }
  }

  const handleTwitterLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/twitter`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome to Jobless</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the ecosystem
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleTwitterLogin}
            className="w-full inline-flex items-center justify-center gap-3 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#1DA1F2] text-white hover:bg-[#1a8cd8] h-12 px-4 py-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Continue with Twitter
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="w-full">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
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
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-3 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card border border-border hover:bg-accent h-12 px-4 py-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Connect Wallet
                      </button>
                    ) : null}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>

          {isAuthenticating && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-sm font-medium">Authenticating...</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Signature Request Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Sign message</h3>
              <p className="text-sm text-muted-foreground">
                Signatures are used to verify your ownership and to confirm wallet compatibility. New users will receive two signature requests.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Get your Jobless key</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    {!isVerifying ? (
                      'Signing is free and will not send a transaction.'
                    ) : (
                      <>
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></span>
                        Verify that you own this wallet
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSendSignRequest}
              disabled={isVerifying}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send request
            </button>

            {!isVerifying && (
              <button
                onClick={() => setShowSignModal(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
