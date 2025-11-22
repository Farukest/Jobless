'use client'

import { useState } from 'react'

interface GuideContentProps {
  content: any
}

export function GuideContent({ content }: GuideContentProps) {
  // If no body, show empty state
  if (!content.body || content.body.trim().length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No content available</p>
        </div>
      </div>
    )
  }

  // Extract sections from body (by ## headings)
  const sections = content.body.split(/(?=^##\s)/m).filter((s: string) => s.trim()) || []
  const [activeSection, setActiveSection] = useState(0)

  // Parse section title
  const getSectionTitle = (section: string) => {
    const match = section.match(/^##\s+(.+)$/m)
    return match ? match[1] : 'Section'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Table of Contents - Sidebar */}
      {sections.length > 1 && (
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-4">
            <h3 className="font-semibold mb-3 text-sm">Table of Contents</h3>
            <nav className="space-y-1">
              {sections.map((section: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveSection(index)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}. {getSectionTitle(section)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={sections.length > 1 ? 'lg:col-span-3' : 'lg:col-span-4'}>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {sections.length > 0 ? (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="whitespace-pre-wrap">{sections[activeSection]}</div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="whitespace-pre-wrap">{content.body}</div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {sections.length > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {activeSection + 1} / {sections.length}
            </span>
            <button
              onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
              disabled={activeSection === sections.length - 1}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
