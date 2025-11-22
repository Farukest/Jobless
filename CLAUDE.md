# JOBLESS PLATFORM - Claude Code Memory

> This file ensures Claude Code maintains full context about the Jobless ecosystem across all sessions.

---

## ⚠️ COMMON PITFALLS AND TESTING STRATEGIES

### Database Update Issues (Mongoose Mixed Types)

**Problem:** Mongoose doesn't detect changes to `Mixed` type fields automatically.

**What Went Wrong:**
- Used `findOneAndUpdate()` for SystemConfig updates
- Mongoose didn't save changes to `value` field (Mixed type)
- Updates appeared successful but didn't persist to database

**Solutions:**
1. **Use `updateOne` with `$set` operator:**
   ```typescript
   await SystemConfig.updateOne(
     { configKey },
     { $set: { value: newValue, isActive: true } }
   )
   ```

2. **OR use `findOne` → `markModified` → `save` pattern:**
   ```typescript
   const config = await SystemConfig.findOne({ configKey })
   config.value = newValue
   config.markModified('value')  // CRITICAL for Mixed types
   await config.save()
   ```

**Testing Strategy:**
```javascript
// ALWAYS test updates with a verification script
const result = await Model.updateOne({ key }, { $set: { value } })
const verify = await Model.findOne({ key })
console.log('Updated value:', verify.value) // Must match expected
```

---

### Cache Invalidation Issues

**Problem:** Multiple caching layers can return stale data.

**What Went Wrong:**
1. Backend `configHelper` had its own cache
2. Frontend React Query had a separate cache with different queryKey
3. Updates cleared one cache but not the other

**Critical Layers:**
- **Backend Cache:** `configHelper` singleton instance
- **Frontend Cache:** React Query with queryKey
- **Database:** The source of truth

**Solutions:**
1. **Backend:** Always clear configHelper cache after updates
   ```typescript
   await SystemConfig.updateOne(...)
   configHelper.clearCache()  // CRITICAL
   ```

2. **Frontend:** Use EXACT queryKey for invalidation
   ```typescript
   // Hook uses: queryKey: ['public-configs']
   // Invalidate with: queryKey: ['public-configs']  (NOT ['configs'])
   await queryClient.invalidateQueries({ queryKey: ['public-configs'] })
   ```

**Testing Strategy:**
```javascript
// Test the full cycle
1. Update value in database
2. Clear all caches
3. Fetch from API
4. Verify API returns new value
5. Refresh frontend
6. Verify UI shows new value
```

---

### Missing Required Fields

**Problem:** Queries filter by fields that don't exist in documents.

**What Went Wrong:**
- `configHelper.get()` queries: `{ configKey, isActive: true }`
- Old documents didn't have `isActive` field
- Query returned null even though document existed

**Solutions:**
1. **Always check schema requirements:**
   ```typescript
   // Check actual document in DB
   const doc = await Model.findOne({ key })
   console.log('Document fields:', Object.keys(doc))
   ```

2. **Set defaults on updates:**
   ```typescript
   await Model.updateOne(
     { key },
     { $set: { value, isActive: true } }  // Set ALL required fields
   )
   ```

**Testing Strategy:**
```javascript
// Verify document has all required fields
const doc = await Model.findOne({ key })
const required = ['field1', 'field2', 'isActive']
required.forEach(field => {
  if (!(field in doc)) {
    console.error(`Missing field: ${field}`)
  }
})
```

---

### Public API Endpoint Synchronization

**Problem:** Adding new configs but forgetting to expose them in public endpoint.

**What Went Wrong:**
- Added `hub_limits` to database
- Frontend expected it in `/api/configs/public`
- But endpoint only returned specific hardcoded keys
- New config was null in frontend

**Solutions:**
1. **When adding new config, update public endpoint:**
   ```typescript
   // config.controller.ts
   export const getPublicConfigs = asyncHandler(async () => {
     const publicKeys = [
       'existing_config',
       'new_config',  // ADD THIS
     ]
     // ...
   })
   ```

2. **OR use dynamic approach (fetch ALL active configs):**
   ```typescript
   const configs = await SystemConfig.find({ isActive: true })
   ```

**Testing Strategy:**
```bash
# Test public endpoint directly
curl http://localhost:5000/api/configs/public | jq '.data.new_config'
# Should NOT be null
```

---

### Pre-Implementation Testing Checklist

**Before implementing ANY database update feature:**

1. ✅ **Test the update query directly:**
   ```javascript
   // Create test script in backend/test-[feature].js
   const result = await Model.updateOne(...)
   console.log('Matched:', result.matchedCount)
   console.log('Modified:', result.modifiedCount)
   ```

2. ✅ **Verify persistence:**
   ```javascript
   // Simulate page refresh - fetch fresh from DB
   const fresh = await Model.findOne({ key })
   console.log('After refresh:', fresh.value)
   ```

3. ✅ **Test cache invalidation:**
   ```javascript
   // Clear caches and verify new value returned
   configHelper.clearCache()
   const cached = await configHelper.get(key)
   console.log('After cache clear:', cached)
   ```

4. ✅ **Test full API flow:**
   ```bash
   # POST update
   curl -X PUT localhost:5000/api/endpoint -d '{"value": "new"}'
   # GET fresh data
   curl localhost:5000/api/endpoint
   ```

5. ✅ **Test frontend React Query:**
   ```typescript
   // In browser console after update
   queryClient.invalidateQueries({ queryKey: ['key'] })
   // Manually refetch and check network tab
   ```

**Golden Rule:**
> "Database says success" ≠ "Frontend shows success"
> ALWAYS test the complete round trip: Update → Clear Caches → Fetch → Display

---

## PROJECT OVERVIEW

**Platform:** Jobless - Web3 Ecosystem for Content Creators, Designers, Learners & Researchers

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, RainbowKit (wallet connection)
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose
- Auth: Twitter OAuth 2.0, Wallet Signature (ethers.js)
- File Storage: Local uploads (backend/uploads)

**Repository Structure:**
```
/Jobless
├── frontend/          (Next.js app)
├── backend/           (Express API)
├── STRUCTURE.md       (Complete platform structure - READ THIS FIRST)
├── API_ENDPOINTS.md   (Complete API specification - ~185 endpoints)
├── jobless_project.pdf (Original project requirements - Turkish)
└── CLAUDE.md          (This memory file)
```

---

## CRITICAL RULES - ALWAYS FOLLOW

### 1. **Never Add Without Permission**
- **Turkish:** "bana sormadan ekleme yapma"
- Always show planned changes and wait for user approval ("var yaz", "evet onaylıyorum yaz", "yaz")
- NEVER create files proactively unless explicitly requested

### 2. **Match Actual Implementation**
- ALWAYS read actual code files before documenting
- NEVER invent features that don't exist in code
- Example: Profile page uses OAuth redirects, not manual URL inputs

### 3. **Use Existing Files as Reference**
- STRUCTURE.md contains ALL page structures, forms, inputs, role-based access
- API_ENDPOINTS.md contains ALL API specifications with role-based validation
- jobless_project.pdf contains original Turkish requirements

### 4. **Documentation First, Then Code**
- Document changes in STRUCTURE.md or API_ENDPOINTS.md first
- Get user approval
- Then implement the code

### 5. **Design for Both Light and Dark Themes**
- ALWAYS use Tailwind's theme-aware classes (text-foreground, bg-background, border-border, etc.)
- NEVER use hardcoded colors like text-gray-800 or bg-white
- Test color contrast in both themes
- Use opacity modifiers for subtle effects (e.g., bg-indigo-400/60)
- Examples:
  - ✅ `text-foreground` `bg-card` `border-border` `text-muted-foreground`
  - ❌ `text-black` `bg-white` `border-gray-200` `text-gray-600`

### 6. **NEVER Use Emojis in UI**
- NEVER use emojis in production UI code (❌ '⚙️', '🧩', '🎨', '⚡')
- ALWAYS design custom SVG icons instead
- Icons should be theme-aware and match platform design
- Use simple, clean SVG paths for icons
- Examples:
  - ✅ Custom SVG with `stroke="currentColor"`
  - ❌ Emoji characters in labels or buttons

---

## USER ROLES & PERMISSIONS

### 10 Total Roles:
1. **member** - Base role (all Jobless members)
2. **admin** - Platform moderator
3. **super_admin** - Full platform control
4. **content_creator** - Can publish J Hub content immediately (others draft only)
5. **designer** - Can claim J Studio design requests
6. **video_editor** - Can claim J Studio video requests
7. **requester** - Can create J Academy course requests
8. **learner** - Can enroll in J Academy courses
9. **mentor** - Can create J Academy courses
10. **scout** - Can submit J Alpha research posts

### ⚠️ CRITICAL: Permission-Based Access Control

**ALWAYS use permissions, NOT hardcoded role checks!**

```typescript
// ❌ WRONG - Hardcoded role check
if (user.roles.includes('admin') || user.roles.includes('content_creator')) {
  // Allow content creation
}

// ✅ CORRECT - Permission check (permissions is an object, not array)
if (user.permissions.canCreateContent) {
  // Allow content creation
}

// ✅ CORRECT - Multiple permissions
if (user.permissions.canModerateContent) {
  // Allow moderation
}
```

**Permission Hierarchy:**
- `super_admin` → Has ALL permissions (wraps everything)
- `admin` → Has specific permissions (canCreateContent, canModerateContent, etc.)
- `content_creator` → Has canCreateContent + canPublishImmediately
- Other roles → Have specific permissions per module

**Common Permissions:**
- `canAccessJHub`, `canCreateContent`, `canModerateContent`
- `canAccessStudio`, `canClaimStudioRequest`
- `canAccessAcademy`, `canCreateCourse`, `canEnrollCourse`
- `canAccessAlpha`, `canSubmitAlpha`
- `canAccessInfo`, `canSubmitEngagement`

### Access Control Patterns:

```typescript
// Middleware usage (backend)
router.use(protect) // All authenticated users
router.use(authorize('admin', 'super_admin')) // Admin only (legacy, use permissions in controller)

// ✅ Ownership + Permission check (CORRECT)
const isOwner = userId.toString() === ownerId.toString()
const canModerate = user.permissions.canModerateContent

if (!isOwner && !canModerate) {
  throw new AppError('Unauthorized', 403)
}

// ✅ Content status based on permission (CORRECT)
const status = user.permissions.canPublishImmediately
  ? 'published'
  : 'draft'

// Frontend permission check (permissions is an object, not array)
const canCreate = user?.permissions?.canCreateContent
const canPublish = user?.permissions?.canPublishImmediately
const canModerate = user?.permissions?.canModerateContent

{canCreate && <CreateButton />}
```

**Key Principles:**
- Ownership checks (`userId === ownerId`) are VALID and necessary
- Permission checks should be used for role-based capabilities
- Combine ownership + permission for edit/delete: "owner OR has permission"

---

## PLATFORM MODULES

### 1. J Hub (Content Center)
- **Access:** All members
- **Features:** Video, Thread, Podcast, Guide, Tutorial content
- **Special:** content_creator can publish immediately, others draft only
- **Dynamic:** Content types managed by admin at `/admin/hub-content-types`

### 2. J Studio (Design & Video Production)
- **Access:** All members can request, designer/video_editor can claim
- **Features:** Design/video request creation, claim system, file upload, delivery
- **Dynamic:** Request types managed by admin at `/admin/studio-request-types`

### 3. J Academy (Online Learning)
- **Access:** All members
- **Roles:** requester (create requests), learner (enroll), mentor (create courses)
- **Features:** Courses, enrollments, reviews, course requests with voting
- **Dynamic:** Categories managed by admin at `/admin/academy-categories`

### 4. J Info (Engagement Tracking)
- **Access:** All members
- **Features:** Submit social media engagements (Twitter, Discord, etc.), admin approval, points
- **Dynamic:** Platforms & engagement types managed by admin at `/admin/info-platforms` and `/admin/info-engagement-types`

### 5. J Alpha (Early Project Research)
- **Access:** All members view, scout/admin submit
- **Features:** Alpha posts, reactions (🔥👀⚠️✅), comments, voting (Bullish/Bearish)
- **Dynamic:** Categories managed by admin at `/admin/alpha-categories`

### 6. J Center (User Profile)
- **Access:** All members (own profile)
- **Features:** Profile editing, social links (Twitter, LinkedIn, GitHub), stats, activity

### 7. Admin Panel
- **Access:** admin (moderation), super_admin (full control)
- **Features:** User/role/permission management, content moderation, dynamic content type management, analytics, settings

---

## DYNAMIC CONTENT MANAGEMENT

Admin creates and manages dropdown/select options for:

1. **Hub Content Types** (`/admin/hub-content-types`)
   - Default: Video, Thread, Podcast, Guide, Tutorial
   - Used in: `/hub/create` content type dropdown

2. **Studio Request Types** (`/admin/studio-request-types`)
   - Default: Cover Design, Logo Design, Banner Design, Video Editing, etc.
   - Used in: `/studio/create` request type dropdown

3. **Academy Categories** (`/admin/academy-categories`)
   - Default: Photoshop, Video Edit, Crypto Twitter, Web3, Node Setup, AI Tools
   - Used in: `/academy/create` and `/academy/courses` category dropdown

4. **Info Platforms** (`/admin/info-platforms`)
   - Default: Kaito, WallChain, Cookie, Zama, Twitter/X, Farcaster, Discord
   - Used in: `/info/submit` platform dropdown

5. **Info Engagement Types** (`/admin/info-engagement-types`)
   - Default: Tweet, Retweet, Like, Comment, Follow, Join Community, Discord Role
   - Used in: `/info/submit` engagement type dropdown

6. **Alpha Categories** (`/admin/alpha-categories`)
   - Default: Airdrop Radar, Testnet Tracker, Memecoin Calls, DeFi Signals
   - Used in: `/alpha/submit` and `/alpha/feed` category dropdown/filter

**Important:** Users CANNOT create new types. Admin controls all dynamic content.

---

## BACKEND CODE STANDARDS

### Middleware Pattern:
```typescript
import { protect, authorize } from '../middleware/auth.middleware'
import { asyncHandler, AppError } from '../middleware/error-handler'

// All routes require authentication
router.use(protect)

// Specific endpoint with role check
router.post('/create', authorize('mentor', 'admin'), asyncHandler(createCourse))
```

### Controller Pattern:
```typescript
export const createContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id
  const userRoles = req.user.roles

  // Role-based logic
  let status = 'draft'
  if (userRoles.includes('content_creator')) {
    status = 'published'
  }

  const content = await Content.create({
    ...req.body,
    author: userId,
    status
  })

  res.status(201).json({ success: true, content })
})
```

### Validation Pattern:
```typescript
// Required fields
if (!title || !description || !type) {
  throw new AppError('Missing required fields', 400)
}

// Max length
if (title.length > 200) {
  throw new AppError('Title too long (max 200 chars)', 400)
}

// Owner check
if (content.author.toString() !== userId && !userRoles.includes('admin')) {
  throw new AppError('Unauthorized', 403)
}
```

### Model Pattern:
```typescript
const ContentSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // Dynamic - from HubContentType model
  status: { type: String, enum: ['draft', 'published', 'rejected'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
})
```

---

## FRONTEND CODE STANDARDS

### API Call Pattern:
```typescript
import { api } from '@/lib/api'

const { data } = await api.post('/hub/content', {
  title,
  description,
  type,
  category
})

// api.ts automatically handles:
// - Authorization header with Bearer token
// - Error handling
// - Token refresh
```

### Role-Based UI:
```tsx
const { user } = useAuth()

// Show button only for specific roles
{user?.roles?.includes('mentor') && (
  <button onClick={createCourse}>Create Course</button>
)}

// Conditional behavior
const canPublish = user?.roles?.includes('content_creator')
const buttonText = canPublish ? 'Publish' : 'Submit for Review'
```

### Form Validation:
```typescript
// Max length with live counter
<textarea
  maxLength={500}
  value={bio}
  onChange={(e) => setBio(e.target.value)}
/>
<span>{bio.length}/500</span>

// Required field
if (!title.trim()) {
  toast.error('Title is required')
  return
}
```

---

## BADGE SYSTEM (GAMIFICATION)

### Overview
Complete badge/achievement system with 88 unique badges across 6 categories. Badges are automatically awarded based on user activities and roles.

### Backend Architecture

**Models:**
- `Badge.model.ts` - Badge definitions (name, icon, rarity, criteria, etc.)
- `UserBadge.model.ts` - User-badge junction table (earned badges, pinned, visibility)

**Service:** `backend/src/services/badge.service.ts`
- `checkRoleBadges(userId)` - Awards role-based badges when user roles change
- `checkActivityBadges(userId, module)` - Checks activity badges for specific module
- `checkAllActivityBadges(userId)` - Checks all modules for badge eligibility
- `awardBadge(userId, badgeId, earnedFrom)` - Awards badge (idempotent)
- `getUserBadges(userId, onlyVisible)` - Gets user's earned badges
- `getPinnedBadges(userId)` - Gets user's pinned badges (max 3)
- `pinBadge(userId, badgeId)` - Pin badge to profile
- `unpinBadge(userId, badgeId)` - Unpin badge
- `toggleBadgeVisibility(userId, badgeId)` - Show/hide badge
- `getBadgeStats(userId)` - Get badge statistics (total, by rarity, by category)

**Badge Criteria System:**
```typescript
criteria: {
  type: 'content_count' | 'like_count' | 'alpha_count' | 'jrank_points' | etc.,
  target: number,
  operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq',
  contentType?: string,
  additionalCriteria?: { single?: boolean, requestType?: string }
}
```

**Integration Points:**
- `auth.controller.ts` - Badge check on login (line 26, 72)
- `admin.controller.ts` - Badge check on role assignment (line 244)
- Non-blocking: Uses `.catch()` to prevent badge errors from blocking user actions

### Frontend Components

**Location:** `frontend/src/components/badges/`

**Files:**
- `badge-display.tsx` - Main badge display component
  - `BadgeDisplay` - Single badge with size, rarity, glow effects
  - `BadgeGrid` - Grid layout for multiple badges
  - `PinnedBadges` - Shows pinned badges (max 3)
- `badge-shapes.tsx` - SVG badge shape definitions
  - `getBadgeShape(iconName)` - Maps badge names to SVG components
  - **Note:** SVG designs are loaded from HTML files in this directory
  - Each badge SVG accepts: `className`, `gradientId`, `gradientStart`, `gradientEnd`

**Usage in Profile Page:**
```typescript
import { BadgeDisplay, PinnedBadges, BadgeGrid } from '@/components/badges/badge-display'
import { getBadgeShape } from '@/components/badges/badge-shapes'

// Display user badges
<BadgeGrid badges={userBadges} onBadgeClick={handleBadgeClick} size="md" />

// Display pinned badges
<PinnedBadges badges={pinnedBadges} />
```

### Badge Categories (88 Total)

1. **MEMBER BADGES (15)** - `category: 'general'`
   - Rookie, Explorer, Connected, Active Member, Profile Complete, Point Collector
   - Veteran, Point Master, Contributor, Elite Member, Platform Champion
   - Legend, Early Adopter, Anniversary

2. **CONTENT CREATOR BADGES (20)** - `category: 'hub'`
   - First Post, Video Starter, Thread Weaver, Podcast Pioneer
   - Consistent Creator, Popular Post, Multi-Format, Prolific
   - Viral Hit, Content Master, Content Titan, Mega Viral, Hub Immortal

3. **DESIGNER BADGES (18)** - `category: 'studio'`
   - Design Rookie, First Delivery, Reliable Designer, Client's Favorite
   - Studio Pro, Design Veteran, Studio Elite, Design Titan, Legendary Creator

4. **SCOUT BADGES (17)** - `category: 'alpha'`
   - First Scout, Alpha Hunter, Consistent Scout, Popular Alpha
   - Active Scout, Alpha Pro, Community Favorite, Veteran Scout
   - Alpha Master, Legendary Scout

5. **ADMIN BADGES (10)** - `category: 'admin'`
   - Admin, Active Moderator, Veteran Admin, Platform Guardian

6. **SUPER ADMIN BADGES (8)** - `category: 'admin'`
   - Super Admin, Platform Architect, Platform Overlord, God Mode

### Badge Rarity & Tiers

**Rarity Levels:**
- `common` (30 badges) - Gray/Basic colors
- `rare` (18 badges) - Blue/Green colors, subtle glow
- `epic` (19 badges) - Purple/Cyan colors, medium glow
- `legendary` (11 badges) - Gold/Orange colors, strong glow + divine animation

**Tier Levels:**
- `entry` - First badges in category
- `progress` - Mid-level achievements
- `mastery` - High-level achievements
- `elite` - Top-tier achievements
- `legendary` - Ultimate achievements
- `special` - Unique/time-limited badges

### Seed Script

**File:** `backend/src/scripts/seed-badges.ts`

**Run:**
```bash
cd backend && npx ts-node src/scripts/seed-badges.ts
```

**Creates:** All 88 badges with proper icons, colors, criteria, and metadata

### API Endpoints

All badge endpoints are in the user/profile section:
- `GET /api/users/:id/badges` - Get user's badges
- `GET /api/users/:id/badges/pinned` - Get pinned badges
- `POST /api/users/badges/:badgeId/pin` - Pin a badge
- `DELETE /api/users/badges/:badgeId/pin` - Unpin a badge
- `PATCH /api/users/badges/:badgeId/visibility` - Toggle visibility
- `GET /api/users/:id/badges/stats` - Get badge statistics

---

## TWITTER OAUTH SYSTEM

### Configuration

**Backend ENV:**
```env
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_CALLBACK_URL=http://localhost:5000/api/auth/twitter/callback
APP_URL=http://localhost:3000
```

**Passport Strategy:** `backend/src/config/passport.ts`
- Uses `passport-twitter-oauth2`
- Fetches user profile with email
- Creates/updates user on authentication
- Assigns 'member' role to new users

### Authentication Flow

1. User clicks "Login with Twitter" on `/login`
2. Frontend redirects to: `http://localhost:5000/api/auth/twitter`
3. Twitter OAuth flow completes
4. Backend callback: `GET /api/auth/twitter/callback`
5. Backend generates JWT tokens (access + refresh)
6. Redirects to: `http://localhost:3000/auth/callback?accessToken=xxx&refreshToken=xxx`
7. Frontend saves tokens to localStorage
8. Frontend redirects to `/center/profile`

### Routes

**File:** `backend/src/routes/auth.routes.ts`

```typescript
// Twitter OAuth
router.get('/twitter', passport.authenticate('twitter', { scope: ['tweet.read', 'users.read'] }))
router.get('/twitter/callback', passport.authenticate('twitter', { session: false }), twitterCallback)

// Wallet auth
router.post('/wallet/connect', connectWallet)
router.post('/wallet/verify', protect, verifyWallet)

// Token management
router.post('/refresh', refreshAccessToken)
router.get('/me', protect, getCurrentUser)
router.post('/logout', protect, logout)
```

### Controller Functions

**File:** `backend/src/controllers/auth.controller.ts`

- `twitterCallback` - Handles Twitter OAuth callback, generates tokens, redirects with tokens
- `connectWallet` - Verifies wallet signature, creates/logs in user
- `verifyWallet` - Links wallet to existing authenticated user
- `refreshAccessToken` - Generates new access token from refresh token
- `getCurrentUser` - Returns authenticated user data
- `logout` - Logs out user (client-side token removal)

**Badge Integration:**
Both `twitterCallback` and `connectWallet` trigger badge checks on login (non-blocking).

### Frontend Integration

**Login Page:** `frontend/src/app/login/page.tsx`
- Twitter login button redirects to backend OAuth endpoint
- Wallet connection uses RainbowKit + ethers.js signature verification

**Auth Callback:** `frontend/src/app/auth/callback/page.tsx`
- Receives tokens from URL params
- Saves to localStorage
- Redirects to profile

**Auth Hook:** `frontend/src/hooks/use-auth.ts`
- `useAuth()` hook provides user data, login/logout functions
- Auto-fetches user data on mount
- Handles token refresh

---

## FILE STRUCTURE

### Backend Models Checklist:
- [x] User.model.ts
- [x] Role.model.ts ✅
- [x] Content.model.ts (J Hub)
- [x] ProductionRequest.model.ts (J Studio)
- [x] Course.model.ts (J Academy)
- [x] AlphaPost.model.ts (J Alpha)
- [x] EngagementPost.model.ts (J Info)
- [x] Badge.model.ts ✅ (Gamification)
- [x] UserBadge.model.ts ✅ (Gamification)
- [x] HubContentType.model.ts (Dynamic) ✅
- [x] StudioRequestType.model.ts (Dynamic) ✅
- [x] AcademyCategory.model.ts (Dynamic) ✅
- [x] InfoPlatform.model.ts (Dynamic) ✅
- [x] InfoEngagementType.model.ts (Dynamic) ✅
- [x] AlphaCategory.model.ts (Dynamic) ✅
- [ ] CourseRequest.model.ts (Academy requests)
- [ ] Enrollment.model.ts (Academy enrollments)

### Backend Services:
- [x] badge.service.ts ✅ (Badge awarding, checking, management)

### Backend Controllers:
- [x] auth.controller.ts ✅ (Twitter OAuth + Wallet auth + Badge integration)
- [x] user.controller.ts
- [x] hub.controller.ts
- [x] studio.controller.ts
- [x] academy.controller.ts
- [x] alpha.controller.ts
- [x] info.controller.ts
- [x] admin.controller.ts ✅ (Badge integration on role changes)

### Frontend Components:
- [x] `components/badges/badge-display.tsx` ✅ (Badge display, grid, pinned)
- [x] `components/badges/badge-shapes.tsx` ✅ (SVG badge shapes - load from HTML)

### Frontend Pages:
- [x] `/login` ✅ (Twitter OAuth + Wallet connection)
- [x] `/auth/callback` ✅ (OAuth callback handler)
- [x] `/center/profile` ✅ (Badge display integration)

---

## COMMON TASKS

### Adding a New Endpoint:

1. Check API_ENDPOINTS.md for specification
2. Add route in `backend/src/routes/[module].routes.ts`:
   ```typescript
   router.post('/endpoint', protect, authorize('role'), asyncHandler(controller))
   ```
3. Add controller in `backend/src/controllers/[module].controller.ts`
4. Add validation
5. Test with Postman/frontend

### Adding a New Page:

1. Check STRUCTURE.md for page structure
2. Create page in `frontend/src/app/[path]/page.tsx`
3. Add API calls using `api` from `@/lib/api`
4. Add role-based UI using `useAuth` hook
5. Test authentication and role access

### Adding a New Model:

1. Create in `backend/src/models/[Name].model.ts`
2. Follow existing model patterns
3. Add indexes for frequently queried fields
4. Add validation in schema
5. Export and use in controllers

---

## DEBUGGING CHECKLIST

When user reports issue:
1. Read the actual file first (`Read` tool)
2. Check STRUCTURE.md for expected behavior
3. Check API_ENDPOINTS.md for API spec
4. Verify role-based access is correct
5. Check validation rules
6. Test with actual user flow

---

## GIT WORKFLOW

**Current Branch:** master
**Remote:** https://github.com/Farukest/Jobless.git

### Commit Pattern:
```bash
git add [files]
git commit -m "$(cat <<'EOF'
Title of change

- Bullet point 1
- Bullet point 2

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git push
```

**Important:** Only commit when user explicitly requests it.

---

## QUICK REFERENCE

### User Says → Action:
- "yaz" / "var yaz" / "evet onaylıyorum yaz" → Implement the change
- "structure.md'ye ekle" → Update STRUCTURE.md
- "api'leri yaz" → Implement APIs from API_ENDPOINTS.md
- "bana sor" / "bana sormadan ekleme yapma" → Show plan, wait for approval

### Must Read Files:
1. **STRUCTURE.md** - Complete platform structure (2400+ lines)
2. **API_ENDPOINTS.md** - All API specifications (~185 endpoints)
3. **jobless_project.pdf** - Original Turkish requirements

### Never Forget:
- ✅ Read actual code before documenting
- ✅ Match implementation, don't invent
- ✅ Ask before adding features
- ✅ Use role-based access everywhere
- ✅ Validate all inputs
- ✅ Follow existing patterns

---

## TEST & SEED DATA

### Available Seed Scripts:

1. **Dynamic Content Seed** - `backend/src/scripts/seed-dynamic-content.ts`
   - Seeds all dropdown/select options for the platform
   - Run: `cd backend && npx ts-node src/scripts/seed-dynamic-content.ts`
   - Creates:
     - 5 Hub Content Types (Video, Thread, Podcast, Guide, Tutorial)
     - 4 Studio Request Types (Design, Video Editing, Thumbnail, Banner)
     - 5 Academy Categories (Airdrop, DeFi, NFT, Trading, Development)
     - 2 Info Platforms (Twitter, Farcaster)
     - 4 Info Engagement Types (Like, Retweet, Comment, Follow)
     - 4 Alpha Categories (Airdrop Radar, Testnet Tracker, Memecoin Calls, DeFi Signals)

2. **Test User Data Seed** - `backend/seed-test-data.js`
   - Seeds sample content for testing
   - Run: `cd backend && node seed-test-data.js`
   - Requires: Test users with specific wallet addresses
   - Creates:
     - 3 Hub content items (1 video published, 1 thread published, 1 podcast draft)
     - 2 Academy courses
     - 2 Alpha posts
     - 2 Studio production requests
     - 1 Info engagement post

### Test Workflow:

**Before Testing Any Feature:**
1. Seed dynamic content first (one-time setup)
2. Seed test data for the module you're testing
3. Login with appropriate role
4. Test the feature

**Example - Testing Hub Content Filters:**
```bash
# 1. Seed dynamic content types
cd backend && npx ts-node src/scripts/seed-dynamic-content.ts

# 2. Seed test content
cd backend && node seed-test-data.js

# 3. Open browser
# - Go to http://localhost:3000
# - Login with test user
# - Navigate to J Hub
# - Test filters: Video, Thread, Podcast, Published, Draft
```

### Current Test Data Status:
✅ Dynamic content models created and seeded
✅ Test data script available with sample content
✅ All 6 dynamic content types seeded successfully
✅ Badge system implemented (88 badges)
✅ Badge seed script ready
✅ Ready for frontend testing

---

---

## COMMENT SYSTEM & REAL-TIME FEATURES

### Comment Deletion System

**Overview:**
Complete comment deletion system with cascade delete and real-time WebSocket updates across all clients.

**Backend Implementation:**

1. **Delete Controller** - `backend/src/controllers/comment.controller.ts`
```typescript
export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Authorization: Author or moderator only
  const isAuthor = comment.userId.toString() === userId.toString()
  if (!isAuthor && !isModerator) {
    throw new AppError('Not authorized to delete this comment', 403)
  }

  // Cascade Delete Logic:
  if (!comment.parentCommentId) {
    // Parent comment - delete all replies
    const replies = await Comment.find({ parentCommentId: id })
    deletedReplies = replies.map(reply => reply._id.toString())
    await Comment.deleteMany({ parentCommentId: id })
    // Decrement content's comment count
    await Content.findByIdAndUpdate(comment.contentId, { $inc: { commentsCount: -1 } })
  } else {
    // Reply - decrement parent comment's reply count
    await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } })
  }

  // Delete the comment
  await comment.deleteOne()

  // Emit WebSocket event to all clients
  emitCommentDeleted(id, contentId, contentType, parentCommentId, deletedReplies)
})
```

2. **WebSocket Emission** - `backend/src/socket/index.ts`
```typescript
export const emitCommentDeleted = (
  commentId: string,
  contentId: string,
  contentType: string,
  parentCommentId: string | undefined,
  deletedReplies: string[]
) => {
  const data = { commentId, parentCommentId, deletedReplies }

  // Multi-room emission strategy:
  // 1. Content room - for content page listeners
  io.to(`content:${contentId}`).emit('commentDeleted', data)

  // 2. Parent comment room - for reply listeners
  if (parentCommentId) {
    io.to(`comment:${parentCommentId}`).emit('commentDeleted', data)
  }

  // 3. Own comment room - for modals open on this comment
  io.to(`comment:${commentId}`).emit('commentDeleted', data)
}
```

**Frontend Implementation:**

1. **Content Page Listener** - `frontend/src/app/hub/content/[id]/page.tsx`
```typescript
const handleCommentDeleted = (data: any) => {
  const { commentId, parentCommentId, deletedReplies } = data
  const allDeletedIds = [commentId, ...deletedReplies]

  // Remove deleted comments from cache
  queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => {
    return {
      ...old,
      count: Math.max(0, old.count - allDeletedIds.length),
      data: old.data.filter(comment => !allDeletedIds.includes(comment._id))
    }
  })

  // Update content's comment count
  queryClient.setQueryData(['hub', 'content', id], (old: any) => {
    return {
      ...old,
      data: { ...old.data, commentsCount: Math.max(0, old.data.commentsCount - 1) }
    }
  })
}

socket.on('commentDeleted', handleCommentDeleted)
```

2. **Comment Detail Page Listener** - `frontend/src/app/hub/content/[id]/comment/[commentId]/page.tsx`
```typescript
const handleCommentDeleted = (data: any) => {
  const { commentId: deletedId, deletedReplies } = data

  // If parent comment deleted, redirect to content page
  if (deletedId === commentId) {
    router.push(`/hub/content/${contentId}`)
    return
  }

  // If modal open on deleted comment, show warning
  if (replyModalComment && deletedId === replyModalComment._id) {
    setIsModalCommentDeleted(true) // Shows warning banner
  }

  // Remove deleted reply from cache
  queryClient.setQueryData(['replies', commentId], (old: any) => {
    const allDeletedIds = [deletedId, ...deletedReplies]
    return {
      ...old,
      count: Math.max(0, old.count - allDeletedIds.length),
      data: old.data.filter(reply => !allDeletedIds.includes(reply._id))
    }
  })
}
```

3. **Modal Warning UI**
```tsx
{isModalCommentDeleted && (
  <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-500">...</svg>
      <p className="text-sm text-red-500 font-medium">This comment has been deleted</p>
    </div>
    <p className="text-xs text-red-500/70 mt-1 ml-7">
      You cannot reply to a deleted comment
    </p>
  </div>
)}

<TwitterReplyInput
  disabled={isModalCommentDeleted} // Disable input
  placeholder={isModalCommentDeleted ? "Cannot reply to deleted comment" : "Post your reply..."}
/>
```

4. **Delete Hook** - `frontend/src/hooks/use-hub.ts`
```typescript
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.delete(`/comments/${commentId}`)
      return data
    },
    onSuccess: () => {
      // WebSocket handles real-time updates
      // Just invalidate queries for refetch if needed
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: ['replies'] })
    },
  })
}
```

**Key Features:**
- ✅ Cascade delete (parent deletion deletes all child replies)
- ✅ Authorization check (author or moderator only)
- ✅ Real-time WebSocket updates across all clients
- ✅ Multi-room emission (content, parent, comment rooms)
- ✅ Modal warning when replying to deleted comment
- ✅ Disabled input to prevent posting to deleted comments
- ✅ Auto-redirect if viewing deleted parent comment
- ✅ Optimistic cache updates with React Query

---

## UI/UX IMPROVEMENTS

### Three-Dot Menu for Delete Button

**Problem:** Delete button was inline with like/reply buttons, causing UI clutter.

**Solution:** Moved delete button to three-dot dropdown menu in comment header.

**Implementation** - `frontend/src/components/hub/comment-item.tsx`:
```tsx
{/* Three-dot menu (only for author or moderator) */}
{canDelete && (
  <div className="ml-auto relative options-menu-container">
    <button onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
      <svg>...</svg> {/* Three-dot icon */}
    </button>

    {/* Dropdown */}
    {showOptionsMenu && (
      <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg">
        <button onClick={() => setShowDeleteConfirm(true)}>
          <svg>...</svg> Delete
        </button>
      </div>
    )}
  </div>
)}
```

**Outside Click Detection:**
```tsx
useEffect(() => {
  if (!showOptionsMenu) return

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.options-menu-container')) {
      setShowOptionsMenu(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [showOptionsMenu])
```

### View More Button Fix

**Problem:** "View more" button was triggering both expand/collapse AND navigation to detail page (double trigger).

**Solution:** Added `e.stopPropagation()` to prevent event bubbling.

**Implementation:**
```tsx
{shouldTruncate && (
  <button
    onClick={(e) => {
      e.stopPropagation() // Prevent parent click handlers
      setIsExpanded(!isExpanded)
    }}
    className="text-xs text-primary hover:underline mt-1"
  >
    {isExpanded ? 'Show less' : 'View more'}
  </button>
)}
```

---

## MIDDLE-CLICK NAVIGATION SUPPORT

### Overview

Complete middle-click (scroll wheel) and right-click "open in new tab" support throughout the application.

**Key Principle:** All navigation links use `<Link>` component instead of `<button onClick>` for proper browser navigation support.

### CommentItem Component

**Before:**
```tsx
{onCommentClick ? (
  <button onClick={() => onCommentClick(comment._id)}>
    {comment.content}
  </button>
) : (
  <p>{comment.content}</p>
)}
```

**After:**
```tsx
interface CommentItemProps {
  commentDetailUrl?: string // New prop for detail page URL
  // Removed: onCommentClick?: (commentId: string) => void
}

{commentDetailUrl ? (
  <Link href={commentDetailUrl} onClick={(e) => e.stopPropagation()}>
    {comment.content}
  </Link>
) : (
  <p>{comment.content}</p>
)}
```

**Usage:**
```tsx
<CommentItem
  comment={comment}
  commentDetailUrl={`/hub/content/${id}/comment/${comment._id}`}
  onReplyClick={handleReplyClick}
/>
```

**All clickable elements converted to Links:**
- Profile avatar: `<Link href={/center/profile/${userId}}>`
- Profile name: `<Link href={/center/profile/${userId}}>`
- Timestamp: `<Link href={commentDetailUrl}>`
- Comment content: `<Link href={commentDetailUrl}>`

### Back Button Support

**Content Page:**
```tsx
<Link href="/hub" className="flex items-center gap-2">
  <svg>...</svg> Back
</Link>
```

**Comment Detail Page:**
```tsx
<Link href={`/hub/content/${contentId}`} className="flex items-center gap-2">
  <svg>...</svg> Back
</Link>
```

### Header Profile Icon

**Challenge:** Profile icon should open dropdown on left-click, but support middle-click navigation.

**Solution:** Smart click handling with `onClick` and `onMouseDown` events.

**Implementation** - `frontend/src/components/layout/header.tsx`:
```tsx
<Link
  href="/center/profile"
  onClick={(e) => {
    // Only prevent default on left click without modifiers
    if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setIsDropdownOpen(!isDropdownOpen) // Open dropdown
    }
    // Middle-click (button 1) and Ctrl+click navigate normally
  }}
  onMouseDown={(e) => {
    // Prevent dropdown from opening on middle-click
    if (e.button === 1) {
      e.stopPropagation()
    }
  }}
>
  {/* Profile image */}
</Link>
```

**Behavior:**
- Left-click: Open dropdown menu
- Ctrl/Cmd + left-click: Open in new tab
- Middle-click (scroll wheel): Open in new tab
- Right-click: Show "Open in new tab" context menu

### Footer Cleanup

**Removed:** "Comprehensive Web3 Ecosystem Platform" description text
**File:** `frontend/src/components/layout/footer.tsx`

```tsx
// Before
<div className="space-y-4">
  <Logo />
  <p className="text-sm text-muted-foreground">
    Comprehensive Web3 Ecosystem Platform
  </p>
</div>

// After
<div className="space-y-4">
  <Logo />
</div>
```

---

## WEBSOCKET PATTERNS & BEST PRACTICES

### ⚠️ CRITICAL: Always Follow These Patterns

**When implementing any feature with real-time updates, ALWAYS use this exact pattern:**

### Backend WebSocket Emission Pattern

**Location:** `backend/src/socket/index.ts`

```typescript
// ALWAYS create helper functions for WebSocket events
export const emitEventName = (
  contentId: string,
  count: number,
  additionalData?: any
) => {
  const data = { contentId, count, ...additionalData }

  // ALWAYS emit to appropriate rooms:
  // 1. Global module room (e.g., 'hub:eventName')
  io.emit('hub:eventName', data)

  // 2. Specific content room (if applicable)
  io.to(`content:${contentId}`).emit('eventName', data)
}

// Example: Like Update
export const emitLikeUpdate = (contentId: string, likesCount: number, isLiked?: boolean) => {
  io.emit('hub:likeUpdate', { contentId, likesCount, isLiked })
}

// Example: Comment Created
export const emitCommentCreated = (contentId: string) => {
  io.emit('hub:commentCreated', { contentId })
}
```

**Controller Usage:**
```typescript
import { emitLikeUpdate, emitCommentCreated } from '../socket/index'

// After database update
await Content.findByIdAndUpdate(id, { $inc: { likesCount: 1 } })
emitLikeUpdate(id, updatedContent.likesCount, true)
```

### Frontend WebSocket Listener Pattern

**Location:** Page components (e.g., `frontend/src/app/hub/page.tsx`, `feed/page.tsx`)

```typescript
import { getSocket } from '@/lib/socket'
import { useQueryClient } from '@tanstack/react-query'

// ALWAYS use useEffect for WebSocket listeners
useEffect(() => {
  const socket = getSocket()

  // Handler function - updates React Query cache
  const handleEventName = (data: { contentId: string; count: number }) => {
    console.log('[Page Name] Event:', data)

    // Update query cache - NEVER manual state updates
    queryClient.setQueryData(['queryKey', params], (old: any) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((item) =>
          item._id === data.contentId
            ? { ...item, count: data.count }
            : item
        ),
      }
    })
  }

  // Listen to event
  socket.on('hub:eventName', handleEventName)

  // ALWAYS cleanup
  return () => {
    socket.off('hub:eventName', handleEventName)
  }
}, [queryClient, /* dependencies */])
```

### React Query Mutation Pattern

**DO NOT manually update counts in onSuccess - Let WebSocket handle it**

```typescript
// ❌ WRONG - Double increment bug
const { mutate: createComment } = useCreateComment()

createComment(data, {
  onSuccess: () => {
    // DON'T DO THIS - WebSocket will also increment
    setCommentCount(prev => prev + 1)
  }
})

// ✅ CORRECT - Only cleanup, WebSocket updates count
const { mutate: createComment } = useCreateComment()

createComment(data, {
  onSuccess: () => {
    setCommentText('')
    setSelectedContent(null)
    // WebSocket will handle count update via hub:commentCreated event
  }
})
```

### Infinite Query WebSocket Updates

**Pattern for infinite queries (Feed pages):**

```typescript
const handleEventUpdate = (data: { contentId: string; count: number }) => {
  queryClient.setQueryData(['hub', 'feed'], (old: any) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page: FeedResponse) => ({
        ...page,
        data: page.data.map((content) =>
          content._id === data.contentId
            ? { ...content, count: data.count }
            : content
        ),
      })),
    }
  })
}
```

### Multi-Query Updates

**When event affects multiple queries (e.g., featured + all content):**

```typescript
const handleLikeUpdate = (data: { contentId: string; likesCount: number }) => {
  // Update main content query
  queryClient.setQueryData(['hub', 'content', filters], (old: any) => {
    /* update logic */
  })

  // Also update featured query
  queryClient.setQueryData(['hub', 'featured', 3], (old: any) => {
    /* update logic */
  })
}
```

### React Fragment Pattern for Multiple Root Elements

**ALWAYS use Fragment when returning multiple root elements:**

```typescript
// ❌ WRONG - Syntax error
return (
  <div className="container">...</div>
  {modal && <div>...</div>}
)

// ✅ CORRECT - Use Fragment
return (
  <>
    <div className="container">...</div>
    {modal && <div>...</div>}
  </>
)
```

### Shared Layout Pattern

**Use Next.js layout for shared headers/navigation:**

```typescript
// app/module/layout.tsx
export default function ModuleLayout({ children }) {
  return (
    <AuthenticatedLayout>
      <div className="min-h-screen">
        {/* Fixed Header + Tabs - rendered once */}
        <div className="container">
          <h1>Module Name</h1>
          <Tabs />
        </div>

        {/* Page content - changes per route */}
        {children}
      </div>
    </AuthenticatedLayout>
  )
}

// app/module/page.tsx
export default function ModulePage() {
  // NO AuthenticatedLayout here - it's in layout
  // NO header/tabs here - it's in layout
  return (
    <div className="container">
      {/* Only page-specific content */}
    </div>
  )
}
```

### Skeleton Loading Pattern

**ALWAYS match skeleton structure to actual content:**

```typescript
// Client-side mount detection
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

// Show skeleton before mount OR during loading
if (!mounted || authLoading || dataLoading) {
  return (
    <div className="container">
      {/* Match exact structure of real content */}
      <div className="filters">
        <Skeleton className="h-6 w-20" /> {/* Title */}
        <Skeleton className="h-10 w-full" /> {/* Dropdown */}
      </div>
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
```

### WebSocket Event Naming Convention

**Follow these naming patterns:**

- **Global module events:** `moduleName:eventType` (e.g., `hub:likeUpdate`, `hub:commentCreated`)
- **Room-specific events:** `eventType` (e.g., `commentDeleted`, `likeUpdate`) - emitted to specific rooms
- **Rooms:** `resourceType:resourceId` (e.g., `content:123`, `comment:456`)

### Common WebSocket Mistakes to Avoid

1. ❌ **Double increment:** Manual state update + WebSocket update
2. ❌ **Missing cleanup:** Forgetting `socket.off()` in useEffect return
3. ❌ **Wrong query key:** Cache update targets wrong query key
4. ❌ **Sync state:** Using useState instead of React Query cache
5. ❌ **Missing dependencies:** useEffect dependencies incomplete
6. ❌ **Manual navigation:** Using onClick instead of Link for navigation
7. ❌ **Missing Fragment:** Multiple root elements without Fragment wrapper

### Checklist for Any Real-time Feature

- [ ] Backend: Created helper function in `socket/index.ts`
- [ ] Backend: Called emit function after database update
- [ ] Frontend: Added WebSocket listener in useEffect
- [ ] Frontend: Updated React Query cache (not useState)
- [ ] Frontend: Added socket.off() cleanup
- [ ] Frontend: Used correct query keys
- [ ] Frontend: Removed manual state updates from onSuccess
- [ ] Frontend: Tested with multiple browser tabs
- [ ] Frontend: Used Fragment for multiple root elements
- [ ] Frontend: Used shared layout for persistent headers

---

## SHARED LAYOUT IMPLEMENTATION

### Hub Module Layout Structure

**File:** `frontend/src/app/hub/layout.tsx`

```typescript
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/hub'
  const isFeed = pathname === '/hub/feed'

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Fixed Header - rendered once, persists across tab switches */}
        <div className="container mx-auto px-4 pt-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">J Hub</h1>
            <p className="text-muted-foreground">Discover and share valuable content</p>

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button onClick={() => router.push('/hub')} className={isHome ? 'active' : ''}>
                Home
              </button>
              <button onClick={() => router.push('/hub/feed')} className={isFeed ? 'active' : ''}>
                Feed
              </button>
            </div>
          </div>
        </div>

        {/* Page Content - each page controls its own container width */}
        {children}
      </div>
    </AuthenticatedLayout>
  )
}
```

**Benefits:**
- ✅ Header doesn't re-render when switching tabs
- ✅ No layout jumping between pages
- ✅ Each page controls its own content width
- ✅ Cleaner code - no duplicate headers

**Individual Pages:**
```typescript
// app/hub/page.tsx (Home)
export default function HubPage() {
  return (
    <div className="container mx-auto px-4 max-w-7xl">
      {/* No AuthenticatedLayout - in layout.tsx */}
      {/* No header - in layout.tsx */}
      {/* Only page-specific content */}
    </div>
  )
}

// app/hub/feed/page.tsx (Feed)
export default function HubFeedPage() {
  return (
    <>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Twitter-style narrow feed */}
      </div>
      {modal && <div>...</div>} {/* Fragment allows modal outside container */}
    </>
  )
}
```

---

## FILES MODIFIED IN THIS SESSION

### Backend:
1. `backend/src/controllers/comment.controller.ts` - Delete logic with cascade
2. `backend/src/socket/index.ts` - emitCommentDeleted helper function

### Frontend Components:
1. `frontend/src/components/hub/comment-item.tsx` - Three-dot menu, Link navigation, commentDetailUrl prop
2. `frontend/src/components/hub/twitter-reply-input.tsx` - Added disabled prop
3. `frontend/src/components/layout/header.tsx` - Middle-click support for profile icon
4. `frontend/src/components/layout/footer.tsx` - Removed description text

### Frontend Pages:
1. `frontend/src/app/hub/content/[id]/page.tsx` - Delete listener, Link back button
2. `frontend/src/app/hub/content/[id]/comment/[commentId]/page.tsx` - Delete listener, modal warning, Link back button

### Frontend Hooks:
1. `frontend/src/hooks/use-hub.ts` - useDeleteComment hook

---

**Last Updated:** 2025-01-22
**Project Status:**
- ✅ All dynamic content models implemented
- ✅ Seed scripts functional (dynamic content + badges)
- ✅ Badge system fully implemented (backend + frontend)
- ✅ Twitter OAuth authentication working
- ✅ Wallet authentication working
- ✅ Badge integration on login and role changes
- ✅ Profile page shows badges (grid, pinned, stats)
- ✅ **Comment deletion system with real-time WebSocket updates**
- ✅ **Three-dot menu UI pattern for delete actions**
- ✅ **Middle-click navigation support throughout app**
- ✅ **Modal warning system for deleted comments**
- ✅ **Smart click handling for dropdown + navigation**

**Next Steps:**
- Implement remaining modules (Academy enrollment, Studio requests, etc.)
- Add edit comment functionality
- Add comment reporting system
- Implement comment moderation dashboard
