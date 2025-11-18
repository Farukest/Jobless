'use client'

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function StudioTeamPage() {
  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Studio Team</h1>
          <p className="text-muted-foreground mb-8">Browse our talented designers and editors</p>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground">Team members will be displayed here</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
