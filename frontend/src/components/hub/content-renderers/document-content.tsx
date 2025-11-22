'use client'

import { useState } from 'react'

interface DocumentContentProps {
  content: any
}

export function DocumentContent({ content }: DocumentContentProps) {
  // Extract PDF/DOC URL from body
  const docUrl = content.body?.match(/(https?:\/\/[^\s]+\.(pdf|doc|docx))/i)?.[0]

  return (
    <div className="space-y-4">
      {/* Document Viewer */}
      {docUrl ? (
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          {/* PDF Embed */}
          {docUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={`${docUrl}#toolbar=0`}
              className="w-full h-[800px]"
              title="PDF Viewer"
            />
          ) : (
            // Google Docs Viewer for DOC/DOCX
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`}
              className="w-full h-[800px]"
              title="Document Viewer"
            />
          )}

          {/* Download Button */}
          <div className="bg-muted p-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-muted-foreground">
                {docUrl.split('/').pop()?.split('?')[0] || 'Document'}
              </span>
            </div>
            <a
              href={docUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      ) : (
        // No document URL provided
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-muted-foreground">No document URL provided</p>
        </div>
      )}

      {/* Description */}
      {content.description && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">About this document</h3>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </div>
      )}
    </div>
  )
}
