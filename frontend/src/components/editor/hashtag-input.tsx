'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface HashtagInputProps {
  value: string[]
  onChange: (hashtags: string[]) => void
  placeholder?: string
  maxTags?: number
}

interface Hashtag {
  _id: string
  tag: string
  usageCount: number
}

export default function HashtagInput({
  value = [],
  onChange,
  placeholder = 'Type # to add hashtags...',
  maxTags = 10,
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Search hashtags when user types after #
  const searchQuery = inputValue.startsWith('#') ? inputValue.slice(1) : ''

  const { data: suggestionsData } = useQuery({
    queryKey: ['hashtag-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return { data: [] }
      const { data } = await api.get(`/hashtags/search?q=${searchQuery}`)
      return data
    },
    enabled: searchQuery.length >= 1,
  })

  const suggestions = (suggestionsData?.data || [])
    .filter((h: Hashtag) => !value.includes(h.tag)) // Filter out already selected tags

  // Show suggestions when there's a # and we have results
  useEffect(() => {
    setShowSuggestions(inputValue.startsWith('#') && suggestions.length > 0)
  }, [inputValue, suggestions.length])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addHashtag = (tag: string) => {
    if (value.length >= maxTags) {
      return
    }

    if (!value.includes(tag)) {
      onChange([...value, tag])
    }

    setInputValue('')
    setShowSuggestions(false)
    setFocusedIndex(-1)
    inputRef.current?.focus()
  }

  const removeHashtag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && suggestions[focusedIndex]) {
            addHashtag(suggestions[focusedIndex].tag)
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setFocusedIndex(-1)
          break
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag on backspace when input is empty
      removeHashtag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      {/* Selected Hashtags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium text-primary"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeHashtag(tag)}
                className="text-primary hover:text-primary/80 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.startsWith('#') && suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={value.length >= maxTags ? `Maximum ${maxTags} hashtags` : placeholder}
          disabled={value.length >= maxTags}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {value.length < maxTags && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {value.length}/{maxTags}
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((hashtag: Hashtag, index: number) => (
            <button
              key={hashtag._id}
              type="button"
              onClick={() => addHashtag(hashtag.tag)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                index === focusedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">#{hashtag.tag}</span>
              </div>
              {hashtag.usageCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {hashtag.usageCount} {hashtag.usageCount === 1 ? 'use' : 'uses'}
                </span>
              )}
            </button>
          ))}

          {suggestions.length === 0 && searchQuery && (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No hashtags found for &quot;{searchQuery}&quot;
              <br />
              <span className="text-xs">Only existing hashtags are allowed</span>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-1.5 text-xs text-muted-foreground">
        Type # to search for existing hashtags. Only registered hashtags are allowed.
      </p>
    </div>
  )
}
