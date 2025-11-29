'use client'

import { useEffect, useRef, useState } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
// @ts-ignore
import Header from '@editorjs/header'
// @ts-ignore
import List from '@editorjs/list'
// @ts-ignore
import Embed from '@editorjs/embed'
// @ts-ignore
import Quote from '@editorjs/quote'
// @ts-ignore
import Delimiter from '@editorjs/delimiter'
// @ts-ignore
import Code from '@editorjs/code'
// @ts-ignore
import InlineCode from '@editorjs/inline-code'
// @ts-ignore
import LinkTool from '@editorjs/link'
import { ImageSlideTool } from './image-slide-tool'
import { DocxTool } from './docx-tool'

interface EditorJSComponentProps {
  data?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: number
}

export default function EditorJSComponent({
  data,
  onChange,
  placeholder = 'Start writing your content...',
  readOnly = false,
  minHeight = 300,
}: EditorJSComponentProps) {
  const editorRef = useRef<EditorJS | null>(null)
  const [isReady, setIsReady] = useState(false)
  const holderIdRef = useRef(`editorjs-${Math.random().toString(36).substring(7)}`)

  useEffect(() => {
    // EditorJS can only run in the browser
    if (typeof window === 'undefined') return

    // Initialize EditorJS
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: holderIdRef.current,
        autofocus: false,
        placeholder,
        readOnly,
        minHeight,
        data: data || undefined,
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
            },
          },
          embed: {
            class: Embed,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                twitter: true,
                instagram: true,
                facebook: true,
                twitch: true,
              },
            },
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: "Quote's author",
            },
          },
          delimiter: Delimiter,
          code: {
            class: Code,
            config: {
              placeholder: 'Enter code',
            },
          },
          inlineCode: {
            class: InlineCode,
          },
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/link-preview', // Optional: for link previews
            },
          },
          imageSlide: {
            class: ImageSlideTool,
          },
          docx: {
            class: DocxTool,
          },
        },
        onChange: async () => {
          if (onChange && editorRef.current) {
            try {
              const savedData = await editorRef.current.save()
              onChange(savedData)
            } catch (error) {
              console.error('EditorJS save error:', error)
            }
          }
        },
        onReady: () => {
          setIsReady(true)
        },
      })

      editorRef.current = editor
    }

    // Cleanup
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  // Update editor data when prop changes (ONLY on initial load, not on every change)
  useEffect(() => {
    if (isReady && editorRef.current && data && !editorRef.current.blocks.getBlocksCount()) {
      // Only render if editor is empty (initial load)
      editorRef.current.render(data)
    }
  }, [isReady]) // Removed 'data' from dependency to prevent re-render on every keystroke

  return (
    <div className="editorjs-wrapper">
      <div
        id={holderIdRef.current}
        className="prose prose-sm dark:prose-invert max-w-none"
        style={{ minHeight: `${minHeight}px` }}
      />

      <style jsx global>{`
        .editorjs-wrapper {
          background: transparent;
        }

        /* EditorJS container styles */
        .editorjs-wrapper > div {
          background: var(--background);
          padding: 1rem;
          color: var(--foreground);
        }

        /* Code blocks */
        .ce-code__textarea {
          background: var(--muted) !important;
          color: var(--foreground) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.375rem;
          padding: 0.75rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* Block styling */
        .ce-block__content {
          max-width: 100%;
        }

        .ce-toolbar__content {
          max-width: 100%;
        }

        /* Placeholder */
        .codex-editor__redactor {
          padding-bottom: 0 !important;
        }

        .ce-block--focused .ce-block__content,
        .ce-block--selected .ce-block__content {
          background: transparent;
        }

        /* Headers */
        .ce-header {
          color: var(--foreground);
          font-weight: 600;
        }

        /* Quote */
        .cdx-quote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          color: var(--muted-foreground);
        }

        .cdx-quote__text {
          color: var(--foreground);
          font-style: italic;
        }

        /* Lists */
        .cdx-list {
          color: var(--foreground);
        }

        /* Embed */
        .embed-tool__content {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Delimiter */
        .ce-delimiter {
          border-color: var(--border);
        }

        /* Inline code */
        .inline-code {
          background: var(--muted);
          color: var(--foreground);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }

        /* Link */
        .ce-inline-tool--link {
          color: var(--primary);
        }

        /* Toolbar */
        .ce-toolbar__plus,
        .ce-toolbar__settings-btn {
          color: var(--foreground);
          background: var(--background);
        }

        .ce-toolbar__plus:hover,
        .ce-toolbar__settings-btn:hover {
          background: var(--muted);
        }

        /* Toolbox */
        .ce-toolbox {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
        }

        .ce-toolbox__button {
          color: var(--foreground);
        }

        .ce-toolbox__button:hover {
          background: var(--muted);
        }

        /* Popover */
        .ce-popover {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          color: var(--foreground);
        }

        .ce-popover-item:hover {
          background: var(--muted);
        }

        .ce-popover-item__icon {
          background: var(--muted);
        }

        /* Conversion toolbar */
        .ce-conversion-toolbar {
          background: var(--card);
          border: 1px solid var(--border);
        }

        .ce-conversion-tool:hover {
          background: var(--muted);
        }

        /* Inline toolbar */
        .ce-inline-toolbar {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
        }

        .ce-inline-tool:hover {
          background: var(--muted);
        }
      `}</style>
    </div>
  )
}
