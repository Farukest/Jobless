'use client'

import { motion } from 'framer-motion'

export function Logo() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        {/* Animated J shape representing community */}
        <motion.path
          d="M20 5 C25 5, 30 8, 30 15 L30 25 C30 32, 25 35, 20 35 C15 35, 10 32, 10 25"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
        />

        {/* Community dots */}
        <motion.circle
          cx="20"
          cy="12"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.circle
          cx="25"
          cy="18"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.circle
          cx="20"
          cy="28"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
        <motion.circle
          cx="15"
          cy="22"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
        />
      </svg>

      <span className="ml-2 text-xl font-bold">Jobless</span>
    </motion.div>
  )
}
