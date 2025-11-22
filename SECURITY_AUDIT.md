# SECURITY AUDIT - Jobless Platform

## Overview
Comprehensive security analysis of all user input points in the Jobless platform to prevent XSS, injection attacks, and other vulnerabilities while maintaining usability.

---

## CRITICAL VULNERABILITIES FOUND

### 1. XSS (Cross-Site Scripting) - CRITICAL ❌
**Status:** No sanitization implemented anywhere
**Risk:** Attackers can inject malicious scripts in title, body, description fields

### 2. Content Length Validation - HIGH ❌
**Status:** Body fields have NO maxLength validation
**Risk:** DDoS attacks via extremely large payloads

### 3. URL Validation - MEDIUM ❌
**Status:** mediaUrls, links arrays not validated
**Risk:** SSRF attacks, malicious redirect injection

---

## DATABASE INSERTION POINTS (User Input)

### 1. HUB CONTENT (`hub.controller.ts`)

#### createContent (Line 183-263) - CRITICAL ❌
**User Input Fields:**
```typescript
- title          // ❌ NO SANITIZATION (maxLength: 200 ✅)
- description    // ❌ NO SANITIZATION
- body           // ❌ NO SANITIZATION, NO MAXLENGTH
- mediaUrls      // ❌ NO URL VALIDATION
- tags           // ⚠️ Array - needs validation
- category       // ✅ Validated against config
- contentType    // ✅ Validated against config
```

**Required Validations:**
1. ✅ Keep: Category/type validation (already good)
2. ❌ ADD: HTML sanitization for title, description, body
3. ❌ ADD: Body maxLength validation (from `hub_limits.content_body_max_length`)
4. ❌ ADD: URL format validation for mediaUrls
5. ❌ ADD: Tag array validation (max count, length per tag)

#### updateContent (Line 270-325) - CRITICAL ❌
**Same fields as createContent** - needs same validation

---

### 2. COMMENTS (`comment.controller.ts`)

#### createComment (Line 98-169) - HIGH ❌
**User Input Fields:**
```typescript
- content        // ❌ NO SANITIZATION, NO MAXLENGTH
- contentType    // ✅ Validated against whitelist
- parentCommentId // ✅ Validated (exists check)
```

**Required Validations:**
1. ✅ Keep: contentType whitelist (already good)
2. ❌ ADD: HTML sanitization for content field
3. ❌ ADD: MaxLength validation (suggest 2000 chars for comments)
4. ❌ ADD: Rate limiting (prevent spam)

#### updateComment (Line 176-213) - HIGH ❌
**Same content field** - needs same validation

---

### 3. ALPHA POSTS (`alpha.controller.ts`)

#### createAlphaPost (Line 116-210) - CRITICAL ❌
**User Input Fields:**
```typescript
- projectName         // ❌ NO SANITIZATION
- projectDescription  // ❌ NO SANITIZATION
- details             // ❌ NO SANITIZATION, NO MAXLENGTH
- requirements        // ❌ NO SANITIZATION
- links               // ❌ NO URL VALIDATION
- tags                // ⚠️ Array - needs validation
- category            // ✅ Validated against whitelist
- potentialRating     // ✅ Validated against enum
- riskRating          // ✅ Validated against enum
```

**Required Validations:**
1. ✅ Keep: Enum validations (already good)
2. ❌ ADD: HTML sanitization for text fields
3. ❌ ADD: MaxLength for details field (suggest 10000 chars)
4. ❌ ADD: URL validation for links array
5. ❌ ADD: Tag array validation

#### updateAlphaPost (Line 217-278) - CRITICAL ❌
**Same fields** - needs same validation

---

### 4. USER PROFILE (`user.controller.ts`)

#### updateProfile (Line 43-66) - MEDIUM ❌
**User Input Fields:**
```typescript
- displayName    // ❌ NO SANITIZATION (but less risky)
- bio            // ❌ NO SANITIZATION, NO MAXLENGTH
- theme          // ✅ Low risk (enum)
```

**Required Validations:**
1. ⚠️ SANITIZE: displayName (strip HTML tags, keep text only)
2. ❌ ADD: HTML sanitization for bio
3. ❌ ADD: MaxLength for bio (suggest 500 chars)
4. ❌ ADD: DisplayName pattern validation (alphanumeric + spaces + basic punctuation)

#### addWhitelistWallet (Line 247-285) - LOW ✅
**Validation Status:** ✅ Already validates Ethereum address format

---

### 5. ACADEMY - COURSES (`academy.controller.ts`)

#### createCourse (Line 113-166) - CRITICAL ❌
**User Input Fields:**
```typescript
- title               // ❌ NO SANITIZATION
- description         // ❌ NO SANITIZATION, NO MAXLENGTH
- shortDescription    // ❌ NO SANITIZATION
- modules             // ⚠️ Complex object array - needs deep validation
- prerequisites       // ⚠️ Array - needs validation
- sessionLink         // ❌ NO URL VALIDATION
- category            // ⚠️ Needs validation against config
- difficulty          // ⚠️ Needs validation
```

**Required Validations:**
1. ❌ ADD: HTML sanitization for title, descriptions
2. ❌ ADD: MaxLength for description (suggest 5000 chars)
3. ❌ ADD: Module object validation (title, content sanitization)
4. ❌ ADD: URL validation for sessionLink
5. ❌ ADD: Category/difficulty validation against config

#### updateCourse (Line 173-241) - CRITICAL ❌
**Same fields** - needs same validation

#### updateEnrollmentProgress (Line 307-382) - MEDIUM ❌
**User Input Fields:**
```typescript
- review         // ❌ NO SANITIZATION
- rating         // ✅ Should validate 1-5 range
```

**Required Validations:**
1. ❌ ADD: HTML sanitization for review
2. ❌ ADD: MaxLength for review (suggest 1000 chars)
3. ❌ ADD: Rating range validation (1-5)

---

### 6. ACADEMY - COURSE REQUESTS (`academy.controller.ts`)

#### createCourseRequest (Line 430-447) - MEDIUM ❌
**User Input Fields:**
```typescript
- title          // ❌ NO SANITIZATION
- description    // ❌ NO SANITIZATION
- category       // ⚠️ Needs validation
```

**Required Validations:**
1. ❌ ADD: HTML sanitization
2. ❌ ADD: MaxLength for description (suggest 1000 chars)
3. ❌ ADD: Category validation against config

---

### 7. STUDIO - PRODUCTION REQUESTS (`studio.controller.ts`)

#### createRequest (Line 79-119) - MEDIUM ❌
**User Input Fields:**
```typescript
- title             // ❌ NO SANITIZATION
- description       // ❌ NO SANITIZATION
- requirements      // ❌ NO SANITIZATION
- referenceFiles    // ⚠️ Array of URLs - needs validation
- requestType       // ✅ Validated against config
- platform          // ✅ Validated against config
```

**Required Validations:**
1. ✅ Keep: Type/platform validation (already good)
2. ❌ ADD: HTML sanitization for text fields
3. ❌ ADD: MaxLength for description, requirements
4. ❌ ADD: URL validation for referenceFiles

#### submitProposal (Line 126-156) - MEDIUM ❌
**User Input Fields:**
```typescript
- proposalDescription  // ❌ NO SANITIZATION
- proposalDeadline     // ✅ Date validation via new Date()
```

**Required Validations:**
1. ❌ ADD: HTML sanitization
2. ❌ ADD: MaxLength (suggest 2000 chars)

#### submitFeedback (Line 238-276) - MEDIUM ❌
**User Input Fields:**
```typescript
- feedback       // ❌ NO SANITIZATION
- rating         // ❌ NO VALIDATION
```

**Required Validations:**
1. ❌ ADD: HTML sanitization
2. ❌ ADD: MaxLength (suggest 1000 chars)
3. ❌ ADD: Rating range validation (1-5)

---

## SECURITY IMPLEMENTATION PLAN

### Phase 1: Input Sanitization Helper (IMMEDIATE)

**Create:** `backend/src/utils/sanitize-helper.ts`

**Functions to implement:**
```typescript
1. sanitizeHTML(input: string) → string
   - Strip ALL HTML tags
   - Preserve plain text only
   - Use: title, displayName, simple text fields

2. sanitizeRichText(input: string) → string
   - Allow safe HTML subset (p, br, strong, em, ul, ol, li, a)
   - Strip dangerous tags (script, iframe, object, embed)
   - Sanitize attributes (only href for <a>, remove onclick, etc.)
   - Use: body, description, bio fields

3. validateURL(url: string) → boolean
   - Check valid URL format
   - Whitelist protocols: http, https only
   - Block: javascript:, data:, file: protocols
   - Optional: Domain whitelist for external links

4. validateURLArray(urls: any[]) → boolean
   - Validate array structure
   - Validate each URL
   - Max array length

5. validateTagArray(tags: any[]) → boolean
   - Max 10 tags
   - Each tag max 30 chars
   - Alphanumeric + underscore only

6. enforceMaxLength(input: string, maxLength: number) → string
   - Trim to maxLength
   - Add validation error if exceeded
```

### Phase 2: Apply to ALL Controllers (IMMEDIATE)

**Pattern to follow:**
```typescript
import { sanitizeHelper } from '../utils/sanitize-helper'

export const createContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Extract input
  const { title, body, description, mediaUrls, tags } = req.body

  // 2. Validate required fields (BEFORE sanitization)
  if (!title || !body) {
    throw new AppError('Title and body are required', 400)
  }

  // 3. Sanitize inputs
  const sanitizedTitle = sanitizeHelper.sanitizeHTML(title.trim())
  const sanitizedBody = sanitizeHelper.sanitizeRichText(body.trim())
  const sanitizedDescription = description
    ? sanitizeHelper.sanitizeRichText(description.trim())
    : undefined

  // 4. Validate lengths (from config)
  const hubLimits = await configHelper.get('hub_limits')
  if (sanitizedTitle.length > hubLimits.content_title_max_length) {
    throw new AppError(`Title too long (max ${hubLimits.content_title_max_length} chars)`, 400)
  }
  if (sanitizedBody.length > hubLimits.content_body_max_length) {
    throw new AppError(`Body too long (max ${hubLimits.content_body_max_length} chars)`, 400)
  }

  // 5. Validate arrays
  if (mediaUrls && !sanitizeHelper.validateURLArray(mediaUrls)) {
    throw new AppError('Invalid media URLs', 400)
  }
  if (tags && !sanitizeHelper.validateTagArray(tags)) {
    throw new AppError('Invalid tags (max 10, alphanumeric, 30 chars each)', 400)
  }

  // 6. Create with sanitized data
  const content = await Content.create({
    title: sanitizedTitle,
    body: sanitizedBody,
    description: sanitizedDescription,
    mediaUrls: mediaUrls || [],
    tags: tags || [],
    // ...
  })
})
```

### Phase 3: Database Schema Updates (OPTIONAL)

**Add maxLength to models:**
```typescript
// Content.model.ts
body: {
  type: String,
  maxlength: 20000,  // Add this
  trim: true
}

// Comment.model.ts
content: {
  type: String,
  maxlength: 2000,   // Add this
  trim: true
}
```

---

## VALIDATION RULES SUMMARY

### Text Fields

| Field Type | Sanitization | Max Length | Validation |
|------------|--------------|------------|------------|
| **Title** | Strip HTML | 200 | Required, non-empty |
| **Short Description** | Strip HTML | 500 | Optional |
| **Description** | Rich text | 1000-5000 | Required |
| **Body/Content** | Rich text | Config-based | Required |
| **Comment** | Rich text | 2000 | Required, non-empty |
| **Bio** | Rich text | 500 | Optional |
| **Review/Feedback** | Rich text | 1000 | Optional |
| **Display Name** | Strip HTML | 50 | Alphanumeric + spaces |

### Arrays

| Array Type | Validation |
|------------|------------|
| **mediaUrls** | URL format, https/http only, max 10 |
| **links** | URL format, https/http only, max 10 |
| **tags** | Max 10, alphanumeric+underscore, 30 chars each |
| **prerequisites** | Max 20, string type, 100 chars each |

### Numeric Fields

| Field | Range |
|-------|-------|
| **rating** | 1-5 (integer) |
| **progress** | 0-100 (integer) |

---

## NOT TO VALIDATE (Keep as-is)

✅ **Already validated fields:**
- contentType (whitelist)
- category (config validation)
- difficulty (enum validation)
- potentialRating (enum validation)
- riskRating (enum validation)
- status (enum validation)
- theme (enum validation)
- walletAddress (regex validation)

✅ **System-controlled fields:**
- userId (from req.user)
- createdAt, updatedAt (automatic)
- authorId, scoutId, mentorId (from authentication)

---

## IMPORTANT: NOT OVERLY RESTRICTIVE

### DO NOT BLOCK:
1. **Markdown formatting** - Allow in rich text fields
2. **Line breaks** - Essential for readability
3. **Special characters** - Allow in appropriate contexts (quotes, apostrophes, etc.)
4. **Multiple languages** - Support UTF-8, emojis
5. **URLs in text** - Allow as plain text, validate when in URL arrays
6. **Code snippets** - If user pastes code in body, allow (but escape HTML)

### BALANCE:
- **Security:** Prevent XSS, injection, DDoS
- **Usability:** Don't break legitimate use cases
- **Professional:** Validate professionally without being annoying

---

## IMPLEMENTATION ORDER (Priority)

### IMMEDIATE (Cannot deploy without):
1. ✅ Create sanitize-helper.ts
2. ✅ Apply to hub.controller.ts (createContent, updateContent)
3. ✅ Apply to comment.controller.ts (createComment, updateComment)

### HIGH PRIORITY (Deploy within 24h):
4. ✅ Apply to alpha.controller.ts
5. ✅ Apply to academy.controller.ts
6. ✅ Apply to studio.controller.ts
7. ✅ Apply to user.controller.ts

### MEDIUM PRIORITY (Next sprint):
8. ⚠️ Add schema-level maxLength validations
9. ⚠️ Implement rate limiting for comment/post creation
10. ⚠️ Add CSRF protection

---

## TESTING CHECKLIST

After implementation, test with:

### XSS Attempts:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<iframe src="javascript:alert('XSS')"></iframe>
```
**Expected:** All stripped/escaped, plain text only

### Long Content:
```
Body with 50,000 characters...
```
**Expected:** Error message "Body too long (max 20000 chars)"

### Malicious URLs:
```
javascript:alert('XSS')
data:text/html,<script>alert('XSS')</script>
file:///etc/passwd
```
**Expected:** Rejected with "Invalid URL" error

### Legitimate Content:
```markdown
# My Tutorial

Here's how to use **Node.js**:

1. Install Node
2. Run `npm install`
3. Profit!

Check out: https://nodejs.org
```
**Expected:** Accepted and displayed correctly

---

## LIBRARIES TO USE

### Backend:
```bash
npm install dompurify isomorphic-dompurify validator
```

**DOMPurify:** Best-in-class HTML sanitization
**validator:** URL, email, pattern validation

---

**Last Updated:** 2025-01-22
**Status:** AUDIT COMPLETE - READY FOR IMPLEMENTATION
