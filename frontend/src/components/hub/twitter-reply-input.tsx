'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import Image from 'next/image'

interface TwitterReplyInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  replyingTo?: string | string[] // Can be single user or array of users
  disabled?: boolean // Disable input (for deleted comments)
}

export function TwitterReplyInput({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder = 'Post your reply...',
  maxLength = 500,
  autoFocus = false,
  replyingTo,
  disabled = false
}: TwitterReplyInputProps) {
  const { user } = useAuth()
  const [isFocused, setIsFocused] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    checkTheme()

    // Watch for theme changes
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
  }, [value])

  // Force focus when autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        const emojiButton = containerRef.current?.querySelector('[data-emoji-button]')
        if (emojiButton && emojiButton.contains(e.target as Node)) {
          return
        }
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const cursorPos = textareaRef.current?.selectionStart || value.length
    const newValue = value.slice(0, cursorPos) + emojiData.emoji + value.slice(cursorPos)
    onChange(newValue)
    setShowEmojiPicker(false)

    // Keep focus and restore cursor position
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
    const selectedText = value.substring(start, end)

    if (selectedText) {
      const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end)
      onChange(newValue)

      // Restore selection
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length)
        }
      }, 0)
    } else {
      // If no selection, insert markers and place cursor between them
      const newValue = value.substring(0, start) + prefix + suffix + value.substring(end)
      onChange(newValue)

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (value.trim()) {
        onSubmit()
      }
    }
  }

  // Get user avatar URL or initial
  const getUserAvatar = () => {
    if (user?.profileImage) {
      return (
        <Image
          src={user.profileImage}
          alt={user.displayName || 'User'}
          width={40}
          height={40}
          className="rounded-lg"
        />
      )
    }

    const initial = user?.displayName?.[0]?.toUpperCase() ||
                   user?.twitterUsername?.[0]?.toUpperCase() ||
                   'U'
    return <span className="text-sm font-semibold text-primary">{initial}</span>
  }

  return (
    <div ref={containerRef} className="flex gap-3 relative">
      {/* Profile Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {getUserAvatar()}
      </div>

      {/* Input Area */}
      <div className="flex-1">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => !disabled && setIsFocused(true)}
            onBlur={(e) => {
              // Check if blur is due to clicking emoji picker or toolbar buttons
              const relatedTarget = e.relatedTarget as HTMLElement
              if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
                return
              }
              setTimeout(() => setIsFocused(value.length > 0), 100)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus={autoFocus && !disabled}
            disabled={disabled}
            className={`w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[15px] leading-relaxed min-h-[50px] ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              border: 'none',
              boxShadow: 'none'
            }}
          />
        </div>

        {/* Toolbar - Show when focused or has content (hide if disabled) */}
        {(isFocused || value.length > 0) && !disabled && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              {/* Emoji Picker Button */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  data-emoji-button
                  onClick={(e) => {
                    e.preventDefault()
                    setShowEmojiPicker(!showEmojiPicker)
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors group"
                  title="Add emoji"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji Picker Dropdown */}
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

              {/* Bold Button */}
              <button
                type="button"
                onClick={handleBold}
                onMouseDown={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Bold (Cmd/Ctrl+B)"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                </svg>
              </button>

              {/* Italic Button */}
              <button
                type="button"
                onClick={handleItalic}
                onMouseDown={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                title="Italic (Cmd/Ctrl+I)"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                </svg>
              </button>
            </div>

            {/* Character Count & Submit Button */}
            <div className="flex items-center gap-3">
              <span className={`text-xs ${
                value.length > maxLength * 0.9
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}>
                {value.length}/{maxLength}
              </span>
              <button
                onClick={onSubmit}
                disabled={!value.trim() || isSubmitting}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
