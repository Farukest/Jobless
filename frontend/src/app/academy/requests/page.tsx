'use client'

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function CourseRequestsPage() {
  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Course Requests</h1>
          <p className="text-muted-foreground mb-8">Browse and vote on requested courses</p>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground">Course requests will be listed here</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
