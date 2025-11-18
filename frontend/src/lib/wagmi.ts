import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseGoerli } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Jobless Ecosystem',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, baseGoerli],
  ssr: true,
})
