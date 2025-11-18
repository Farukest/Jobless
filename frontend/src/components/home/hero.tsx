'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Build, Learn, and Grow
            <br />
            <span className="text-muted-foreground">in Web3</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A comprehensive ecosystem for content creators, designers, learners, and researchers
            in the Web3 space.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
            >
              Learn More
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    title: 'J Hub',
    description: 'Access exclusive content, guides, and earning strategies from the community.',
  },
  {
    title: 'J Studio',
    description: 'Get professional design and video services from expert creators.',
  },
  {
    title: 'J Academy',
    description: 'Learn from industry experts and become a Web3 producer.',
  },
  {
    title: 'J Info',
    description: 'Coordinate community engagement and grow together.',
  },
  {
    title: 'J Alpha',
    description: 'Discover early-stage projects and investment opportunities.',
  },
  {
    title: 'J Center',
    description: 'Manage your profile, track progress, and showcase contributions.',
  },
]
