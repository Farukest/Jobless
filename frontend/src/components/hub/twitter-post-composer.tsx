'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePublicConfigs } from '@/hooks/use-configs'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface TwitterPostComposerProps {
  onPostCreated?: () => void
}

export function TwitterPostComposer({ onPostCreated }: TwitterPostComposerProps) {
  const { user } = useAuth()
  const { data: configs } = usePublicConfigs()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [contentType, setContentType] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [tags, setTags] = useState('')

  // UI states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check permissions
  const canCreate = user?.permissions?.canCreateContent

  // Check if user can publish immediately (super_admin, admin, content_creator)
  const userRoles = user?.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || []
  const canPublish = userRoles.includes('super_admin') ||
                     userRoles.includes('admin') ||
                     userRoles.includes('content_creator')

  // Don't render if no permission
  if (!canCreate) return null

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [body])

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        const emojiButton = containerRef.current?.querySelector('[data-emoji-button]')
        if (emojiButton && emojiButton.contains(e.target as Node)) return
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const cursorPos = textareaRef.current?.selectionStart || body.length
    const newValue = body.slice(0, cursorPos) + emojiData.emoji + body.slice(cursorPos)
    setBody(newValue)
    setShowEmojiPicker(false)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = cursorPos + emojiData.emoji.length
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = body.substring(start, end)

    if (selectedText) {
      const newValue = body.substring(0, start) + prefix + selectedText + suffix + body.substring(end)
      setBody(newValue)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length)
        }
      }, 0)
    } else {
      const newValue = body.substring(0, start) + prefix + suffix + body.substring(end)
      setBody(newValue)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length)
        }
      }, 0)
    }
  }

  const handleBold = () => wrapSelection('**')
  const handleItalic = () => wrapSelection('*')
  const handleCode = () => wrapSelection('`')
  const handleCodeBlock = () => wrapSelection('```\n', '\n```')

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!contentType) {
      toast.error('Content type is required')
      return
    }
    if (!category) {
      toast.error('Category is required')
      return
    }
    if (!body.trim()) {
      toast.error('Content body is required')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        contentType,
        category,
        difficulty: difficulty || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
      }

      await api.post('/hub/content', payload)

      const status = canPublish ? 'published' : 'draft'
      toast.success(canPublish
        ? 'Post published successfully!'
        : 'Post submitted for review'
      )

      // Reset form
      setTitle('')
      setBody('')
      setContentType('')
      setCategory('')
      setDifficulty('')
      setTags('')
      setIsExpanded(false)

      onPostCreated?.()
    } catch (err: any) {
      console.error('Error creating post:', err)
      toast.error(err.response?.data?.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserAvatar = () => {
    if (user?.profileImage) {
      return (
        <Image
          src={user.profileImage}
          alt={user.displayName || 'User'}
          width={48}
          height={48}
          className="rounded-lg"
        />
      )
    }

    const initial = user?.displayName?.[0]?.toUpperCase() ||
                   user?.twitterUsername?.[0]?.toUpperCase() ||
                   'U'
    return <span className="text-lg font-semibold text-primary">{initial}</span>
  }

  // Get config options
  const contentTypes = configs?.content_types || []
  const categories = configs?.content_categories || []
  const difficultyLevels = configs?.difficulty_levels || []

  // Get character limits from config (with fallbacks)
  const titleMaxLength = configs?.hub_limits?.content_title_max_length || 200
  const bodyMaxLength = configs?.hub_limits?.content_body_max_length || 20000

  return (
    <div ref={containerRef} className="bg-card border border-border rounded-lg mb-4">
      {/* Collapsed State */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="flex gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getUserAvatar()}
          </div>
          <div className="flex-1 flex items-center">
            <p className="text-muted-foreground">What's on your mind?</p>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Create Post</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Type, Category, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Content Type *</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select type...</option>
                {contentTypes.map((type: string) => (
                  <option key={type} value={type}>
                    {type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Optional...</option>
                {difficultyLevels.map((level: string) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (required)"
              maxLength={titleMaxLength}
              className="w-full px-0 py-2 bg-transparent text-xl font-semibold placeholder:text-muted-foreground resize-none outline-none border-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {title.length}/{titleMaxLength}
            </div>
          </div>

          {/* Body with Avatar */}
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {getUserAvatar()}
            </div>

            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's happening?"
                maxLength={bodyMaxLength}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[15px] leading-relaxed min-h-[100px]"
                style={{ border: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mb-3">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated: crypto, web3, tutorial)"
              className="w-full px-3 py-2 bg-muted/30 rounded-lg text-sm placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              {/* Emoji Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  data-emoji-button
                  onClick={(e) => {
                    e.preventDefault()
                    setShowEmojiPicker(!showEmojiPicker)
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                  title="Add emoji"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      searchPlaceHolder="Search emoji..."
                      theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                      height={400}
                      width={320}
                    />
                  </div>
                )}
              </div>

              {/* Bold */}
              <button
                type="button"
                onClick={handleBold}
                onMouseDown={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Bold"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                </svg>
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={handleItalic}
                onMouseDown={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Italic"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                </svg>
              </button>

              {/* Code */}
              <button
                type="button"
                onClick={handleCode}
                onMouseDown={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Inline code"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              {/* Code Block */}
              <button
                type="button"
                onClick={handleCodeBlock}
                onMouseDown={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Code block"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Character Count & Submit */}
            <div className="flex items-center gap-3">
              <span className={`text-xs ${body.length > bodyMaxLength * 0.9 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {body.length}/{bodyMaxLength}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !body.trim() || !contentType || !category || isSubmitting}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : canPublish ? 'Publish' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {!canPublish && (
            <p className="mt-3 text-xs text-muted-foreground">
              Your post will be submitted for admin review before publishing.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
