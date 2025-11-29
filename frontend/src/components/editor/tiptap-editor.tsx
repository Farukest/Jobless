'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { useCallback } from 'react'

interface TipTapEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
}

export default function TipTapEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handlePaste: (view, event) => {
        // Handle image paste from clipboard
        const items = event.clipboardData?.items
        if (!items) return false

        for (let i = 0; i < items.length; i++) {
          const item = items[i]

          // Handle image paste
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault()
            const blob = item.getAsFile()
            if (blob) {
              const reader = new FileReader()
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string
                editor?.chain().focus().setImage({ src: dataUrl }).run()
              }
              reader.readAsDataURL(blob)
            }
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
  })

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addYouTube = useCallback(() => {
    const url = window.prompt('Enter YouTube URL:')
    if (url) {
      editor?.commands.setYoutubeVideo({ src: url })
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* TipTap Editor Styles */}
      <style jsx global>{`
        /* Code blocks in TipTap */
        .ProseMirror pre {
          background: var(--muted);
          color: var(--foreground);
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .ProseMirror pre code {
          background: none;
          color: inherit;
          font-size: 0.875rem;
          padding: 0;
        }

        /* Inline code */
        .ProseMirror code {
          background: var(--muted);
          color: var(--foreground);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 0.875em;
        }

        /* Blockquotes */
        .ProseMirror blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: var(--muted-foreground);
        }

        /* Headings */
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }

        /* Lists */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        /* Links */
        .ProseMirror a {
          color: var(--primary);
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a:hover {
          opacity: 0.8;
        }

        /* Images */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        /* YouTube embeds */
        .ProseMirror iframe {
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('italic') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('strike') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Numbered List"
          >
            1. List
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Code & Quote */}
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('code') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Inline Code"
          >
            {'</>'}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('codeBlock') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Code Block"
          >
            Code
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors ${
              editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Quote"
          >
            " "
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Media */}
          <button
            onClick={addImage}
            className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
            title="Add Image"
          >
            🖼️ Image
          </button>
          <button
            onClick={addYouTube}
            className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
            title="Add YouTube Video"
          >
            📹 Video
          </button>
          <button
            onClick={addLink}
            className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
            title="Add Link"
          >
            🔗 Link
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
