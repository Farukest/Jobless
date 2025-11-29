'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface QuillEditorProps {
  value?: string
  onChange?: (content: string, delta: any, source: string, editor: any) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: number
}

export default function QuillEditor({
  value = '',
  onChange,
  placeholder = 'Compose an epic...',
  readOnly = false,
  minHeight = 500,
}: QuillEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'code-block',
    'script', 'direction', 'size', 'color', 'background', 'font', 'align'
  ]

  if (!mounted) {
    return (
      <div style={{ minHeight: `${minHeight}px` }} className="bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: `${minHeight}px` }}
      />

      <style jsx global>{`
        /* Minimal theme overrides for dark mode */
        .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }

        .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }

        .ql-snow .ql-picker-label {
          color: hsl(var(--foreground));
        }

        .ql-toolbar.ql-snow {
          background: hsl(var(--card));
          border-color: hsl(var(--border));
        }

        .ql-container.ql-snow {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }

        .ql-editor {
          color: hsl(var(--foreground));
        }

        .ql-snow .ql-picker-options {
          background: hsl(var(--card));
          border-color: hsl(var(--border));
        }

        .ql-snow .ql-picker-item {
          color: hsl(var(--foreground));
        }

        .ql-snow .ql-picker-item:hover {
          background: hsl(var(--muted));
        }

        .ql-snow .ql-tooltip {
          background: hsl(var(--card));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }

        .ql-snow .ql-tooltip input[type="text"] {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }

        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}
