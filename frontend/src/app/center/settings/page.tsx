'use client'

import { useAuth, User } from '@/hooks/use-auth'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/providers/theme-provider'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  Mail,
  Wallet,
  Shield,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'

interface ProfileUpdateData {
  displayName?: string
  bio?: string
  theme?: 'light' | 'dark' | 'system'
  emailNotifications?: boolean
}

interface WalletData {
  address: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [newWallet, setNewWallet] = useState('')
  const [whitelistedWallets, setWhitelistedWallets] = useState<string[]>([])

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isAddingWallet, setIsAddingWallet] = useState(false)
  const [removingWallet, setRemovingWallet] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setSelectedTheme(user.theme === 'light' || user.theme === 'dark' ? user.theme : 'system')
      // Fetch whitelisted wallets from user data
      setWhitelistedWallets(user.whitelistWallets || [])
    }
  }, [user])

  // Profile update mutation
  const updateProfile = async (data: ProfileUpdateData) => {
    setIsSavingProfile(true)
    try {
      const response = await api.put('/users/profile', data)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated successfully')

      // Update theme if changed
      if (data.theme) {
        setTheme(data.theme)
      }

      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
      throw error
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Add wallet mutation
  const addWallet = async (address: string) => {
    setIsAddingWallet(true)
    try {
      const response = await api.post('/users/wallet', { walletAddress: address })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setWhitelistedWallets([...whitelistedWallets, address.toLowerCase()])
      setNewWallet('')
      toast.success('Wallet added successfully')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to add wallet')
      throw error
    } finally {
      setIsAddingWallet(false)
    }
  }

  // Remove wallet mutation
  const removeWallet = async (address: string) => {
    setRemovingWallet(address)
    try {
      await api.delete(`/users/wallet/${address}`)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setWhitelistedWallets(whitelistedWallets.filter(w => w !== address))
      toast.success('Wallet removed successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to remove wallet')
      throw error
    } finally {
      setRemovingWallet(null)
    }
  }

  const handleSaveProfile = async () => {
    await updateProfile({
      displayName,
      bio,
      theme: selectedTheme,
      emailNotifications,
    })
  }

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWallet.trim()) {
      toast.error('Please enter a wallet address')
      return
    }

    // Basic validation for Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newWallet.trim())) {
      toast.error('Please enter a valid Ethereum address')
      return
    }

    await addWallet(newWallet.trim())
  }

  if (authLoading || !user) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-12 w-48 mb-8" />
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Profile Information</h2>
                    <p className="text-sm text-muted-foreground">
                      Update your profile details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {bio.length}/500 characters
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedTheme(option.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTheme === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${
                          selectedTheme === option.value ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <p className={`text-sm font-medium ${
                          selectedTheme === option.value ? 'text-primary' : 'text-foreground'
                        }`}>
                          {option.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notifications Settings */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your notification preferences
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about your activity via email
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailNotifications ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Wallet Management */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Wallet Management</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage whitelisted wallet addresses
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Current Primary Wallet */}
                {user.walletAddress && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Primary Wallet
                        </p>
                        <p className="font-mono text-sm">
                          {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                )}

                {/* Add Wallet Form */}
                <form onSubmit={handleAddWallet} className="space-y-3">
                  <label className="block text-sm font-medium">
                    Add Whitelisted Wallet
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isAddingWallet}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isAddingWallet ? (
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add
                    </button>
                  </div>
                </form>

                {/* Whitelisted Wallets List */}
                {whitelistedWallets.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Whitelisted Wallets</p>
                    {whitelistedWallets.map((wallet) => (
                      <div
                        key={wallet}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-mono text-sm">
                          {wallet.slice(0, 8)}...{wallet.slice(-6)}
                        </p>
                        <button
                          onClick={() => removeWallet(wallet)}
                          disabled={removingWallet === wallet}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingWallet === wallet ? (
                            <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      No whitelisted wallets added yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Account Status</h2>
                    <p className="text-sm text-muted-foreground">
                      View your account information
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Account ID</p>
                    <p className="font-mono text-sm">{user._id}</p>
                  </div>

                  {user.twitterUsername && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Twitter</p>
                      <p className="text-sm">@{user.twitterUsername}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">J-Rank Points</p>
                    <p className="text-2xl font-bold">{user.jRankPoints || 0}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Contribution Score</p>
                    <p className="text-2xl font-bold">{user.contributionScore || 0}</p>
                  </div>
                </div>

                {/* Roles */}
                {user.roles && user.roles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
