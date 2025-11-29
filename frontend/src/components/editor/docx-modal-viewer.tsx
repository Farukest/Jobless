'use client'

import { useEffect, useState } from 'react'

interface DocxModalProps {
  url?: string
  name?: string
}

export default function DocxModalViewer() {
  const [isOpen, setIsOpen] = useState(false)
  const [docUrl, setDocUrl] = useState('')
  const [docName, setDocName] = useState('')
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double')
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    const handleOpenModal = (event: any) => {
      const { url, name } = event.detail
      setDocUrl(url)
      setDocName(name)
      setIsOpen(true)
    }

    window.addEventListener('openDocxModal', handleOpenModal)

    return () => {
      window.removeEventListener('openDocxModal', handleOpenModal)
    }
  }, [])

  useEffect(() => {
    // Disable body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setZoom(100)
    setViewMode('double')
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = docUrl
    link.download = docName
    link.click()
  }

  const handlePrint = () => {
    const iframe = document.getElementById('docx-iframe') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print()
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleZoomReset = () => {
    setZoom(100)
  }

  if (!isOpen) return null

  // Use Google Docs Viewer for DOCX files
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* Modal Container */}
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-background border border-border rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0"
              viewBox="0 0 384 512"
              fill="currentColor"
            >
              <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48z" />
            </svg>
            <h3 className="text-lg font-semibold text-foreground truncate">{docName}</h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 px-2 py-1 bg-background border border-border rounded-lg">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'single'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Single page view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="6" y="4" width="12" height="16" strokeWidth="2" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('double')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'double'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Two page view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="8" height="16" strokeWidth="2" rx="1" />
                  <rect x="13" y="4" width="8" height="16" strokeWidth="2" rx="1" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-background border border-border rounded-lg">
              <button
                onClick={handleZoomOut}
                className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-w-[3rem]"
                title="Reset zoom"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted transition-colors"
              title="Print"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            <button
              onClick={handleClose}
              className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden bg-muted p-4">
          <div
            className={`h-full transition-all duration-300 ${
              viewMode === 'double' ? 'max-w-[1600px]' : 'max-w-[800px]'
            } mx-auto`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              className={`h-full bg-white rounded-lg shadow-2xl overflow-hidden ${
                viewMode === 'double' ? 'book-view' : ''
              }`}
            >
              {/* Google Docs Viewer iframe */}
              <iframe
                id="docx-iframe"
                src={viewerUrl}
                className="w-full h-full border-0"
                title={docName}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>

        {/* Footer with page info (optional) */}
        <div className="px-4 py-2 border-t border-border bg-card text-center text-sm text-muted-foreground">
          Use scroll or keyboard arrows to navigate • Press ESC to close
        </div>
      </div>

      {/* ESC key handler */}
      <div
        className="fixed inset-0 -z-10"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClose()
          }
        }}
      />

      <style jsx>{`
        .book-view {
          display: flex;
          justify-content: center;
          perspective: 1500px;
        }

        .book-view iframe {
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
