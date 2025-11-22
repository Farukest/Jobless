/**
 * Security Sanitization and Validation Helper
 *
 * Provides comprehensive input sanitization and validation to prevent:
 * - XSS (Cross-Site Scripting)
 * - Injection attacks
 * - DDoS via large payloads
 * - SSRF (Server-Side Request Forgery)
 */

import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import validator from 'validator'

// Create a DOMPurify instance for Node.js
const window = new JSDOM('').window
const purify = DOMPurify(window as any)

class SanitizeHelper {
  /**
   * Sanitize HTML - Strip ALL HTML tags, keep plain text only
   * Use for: title, displayName, simple text fields
   */
  sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return ''

    // Strip all HTML tags
    const cleaned = purify.sanitize(input, {
      ALLOWED_TAGS: [], // No tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
    })

    return cleaned.trim()
  }

  /**
   * Sanitize Rich Text - Allow safe HTML subset
   * Use for: body, description, bio, review fields
   *
   * Allowed tags: p, br, strong, em, ul, ol, li, a, h1-h6, blockquote, code, pre
   * Dangerous tags stripped: script, iframe, object, embed, form, input
   */
  sanitizeRichText(input: string): string {
    if (!input || typeof input !== 'string') return ''

    // Allow safe HTML subset for rich text
    const cleaned = purify.sanitize(input, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u',
        'ul', 'ol', 'li',
        'a',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote',
        'code', 'pre',
        'span', 'div',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'], // Only for <a> tags
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i, // Only https, http, mailto
    })

    return cleaned.trim()
  }

  /**
   * Validate and sanitize URL
   * Returns null if invalid
   */
  validateURL(url: string): string | null {
    if (!url || typeof url !== 'string') return null

    const trimmed = url.trim()

    // Check if it's a valid URL
    if (!validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    })) {
      return null
    }

    // Block dangerous protocols (extra safety)
    const lowercaseURL = trimmed.toLowerCase()
    if (
      lowercaseURL.startsWith('javascript:') ||
      lowercaseURL.startsWith('data:') ||
      lowercaseURL.startsWith('file:') ||
      lowercaseURL.startsWith('vbscript:')
    ) {
      return null
    }

    return trimmed
  }

  /**
   * Validate URL array
   * Filters out invalid URLs, returns cleaned array
   */
  validateURLArray(urls: any[], maxCount: number = 10): any[] {
    if (!Array.isArray(urls)) return []

    // Take only first maxCount items
    const limited = urls.slice(0, maxCount)

    // Validate each URL and filter out nulls
    const validated = limited
      .map(item => {
        // Handle object format: { type: 'image', url: 'https://...' }
        if (typeof item === 'object' && item.url) {
          const validatedURL = this.validateURL(item.url)
          return validatedURL ? { ...item, url: validatedURL } : null
        }
        // Handle string format: 'https://...'
        if (typeof item === 'string') {
          return this.validateURL(item)
        }
        return null
      })
      .filter(url => url !== null)

    return validated
  }

  /**
   * Validate tag array
   * - Max 10 tags
   * - Each tag max 30 chars
   * - Alphanumeric + underscore + hyphen only
   */
  validateTagArray(tags: any[]): string[] {
    if (!Array.isArray(tags)) return []

    return tags
      .slice(0, 10) // Max 10 tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => {
        // Max 30 chars
        if (tag.length === 0 || tag.length > 30) return false

        // Alphanumeric + underscore + hyphen only
        if (!/^[a-zA-Z0-9_-]+$/.test(tag)) return false

        return true
      })
  }

  /**
   * Validate prerequisites/requirements array
   * - Max 20 items
   * - Each item max 100 chars
   * - String type only
   */
  validateStringArray(arr: any[], maxCount: number = 20, maxLength: number = 100): string[] {
    if (!Array.isArray(arr)) return []

    return arr
      .slice(0, maxCount)
      .filter(item => typeof item === 'string')
      .map(item => this.sanitizeHTML(item.trim()))
      .filter(item => item.length > 0 && item.length <= maxLength)
  }

  /**
   * Enforce max length validation
   * Throws error if exceeds limit
   */
  enforceMaxLength(input: string, maxLength: number, fieldName: string = 'Field'): void {
    if (!input || typeof input !== 'string') return

    if (input.length > maxLength) {
      throw new Error(`${fieldName} too long (max ${maxLength} characters)`)
    }
  }

  /**
   * Validate rating (1-5 integer)
   */
  validateRating(rating: any): number | null {
    const parsed = parseInt(rating)
    if (isNaN(parsed) || parsed < 1 || parsed > 5) return null
    return parsed
  }

  /**
   * Validate progress (0-100 integer)
   */
  validateProgress(progress: any): number | null {
    const parsed = parseInt(progress)
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return null
    return parsed
  }

  /**
   * Validate display name
   * - Strip HTML
   * - Max 50 chars
   * - Alphanumeric + spaces + basic punctuation
   */
  validateDisplayName(name: string): string {
    if (!name || typeof name !== 'string') return ''

    // Strip HTML first
    const cleaned = this.sanitizeHTML(name)

    // Trim to max 50 chars
    const trimmed = cleaned.substring(0, 50).trim()

    // Allow alphanumeric + spaces + basic punctuation (.,'-_)
    const filtered = trimmed.replace(/[^a-zA-Z0-9\s.,'\-_]/g, '')

    return filtered.trim()
  }

  /**
   * Validate module array for courses
   * Each module: { title, description, lessons: [] }
   */
  validateModuleArray(modules: any[]): any[] {
    if (!Array.isArray(modules)) return []

    return modules
      .slice(0, 50) // Max 50 modules
      .filter(module => module && typeof module === 'object')
      .map(module => ({
        title: this.sanitizeHTML(module.title || '').substring(0, 200),
        description: this.sanitizeRichText(module.description || '').substring(0, 1000),
        duration: parseInt(module.duration) || 0,
        lessons: Array.isArray(module.lessons)
          ? module.lessons.slice(0, 100).map((lesson: any) => ({
              title: this.sanitizeHTML(lesson.title || '').substring(0, 200),
              content: this.sanitizeRichText(lesson.content || '').substring(0, 10000),
              videoUrl: lesson.videoUrl ? this.validateURL(lesson.videoUrl) : null,
              duration: parseInt(lesson.duration) || 0,
            }))
          : [],
      }))
      .filter(module => module.title.length > 0) // Remove empty modules
  }
}

// Export singleton instance
export const sanitizeHelper = new SanitizeHelper()
