'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { api } from '@/lib/api'
import Image from 'next/image'

interface User {
  _id: string
  displayName?: string
  twitterUsername?: string
  profileImage?: string
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  autoFocus?: boolean
  className?: string
}

export function MentionTextarea({
  value,
  onChange,
  placeholder = 'Post your reply...',
  maxLength = 500,
  rows = 1,
  autoFocus = false,
  className = '',
}: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const [searchQuery, setSearchQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  // Detect @ mention
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    // Check if we're in a mention context
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      const hasSpace = textAfterAt.includes(' ')

      if (!hasSpace && textAfterAt.length >= 0) {
        setMentionStart(lastAtIndex)
        setSearchQuery(textAfterAt)
        setShowSuggestions(true)
        searchUsers(textAfterAt)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }, [value])

  const searchUsers = async (query: string) => {
    if (query.length === 0) {
      // Show all users if just typed @
      try {
        const { data } = await api.get(`/users/search?q=a&limit=10`)
        setSuggestions(data.data)
      } catch (error) {
        setSuggestions([])
      }
      return
    }

    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=10`)
      setSuggestions(data.data)
    } catch (error) {
      setSuggestions([])
    }
  }

  const insertMention = (user: User) => {
    if (mentionStart === -1) return

    const username = user.twitterUsername || user.displayName || 'user'
    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(textareaRef.current?.selectionStart || 0)
    const newValue = `${beforeMention}@${username} ${afterMention}`

    onChange(newValue)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(0)

    // Focus textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + username.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault()
      insertMention(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden text-sm ${className}`}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
        >
          {suggestions.map((user, index) => (
            <button
              key={user._id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.displayName || 'User'}
                  width={32}
                  height={32}
                  className="rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {(user.displayName || user.twitterUsername || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user.displayName || 'Anonymous'}
                </p>
                {user.twitterUsername && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.twitterUsername}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
