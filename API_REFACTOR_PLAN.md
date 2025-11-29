# API REFACTOR PLAN - Modern RESTful Architecture

**Date:** 2025-01-25
**Goal:** Modernize API structure, remove duplicates, fix security issues, follow REST best practices

---

## CRITICAL ISSUES FOUND

### 1. DUPLICATE ROUTES (SECURITY RISK)
Multiple endpoints doing the same thing - confusing and potential security holes.

**Problem:**
- `comment.routes.ts` (NEW unified system)
- `contentComment.routes.ts` (OLD duplicate for hub content)
- `alphaComment.routes.ts` (OLD duplicate for alpha posts)

**Action:** ❌ DELETE `contentComment.routes.ts` and `alphaComment.routes.ts`

**Problem:**
- `info.routes.ts` (engagement posts for Info module)
- `userEngagement.routes.ts` (duplicate engagement tracking)

**Action:** ❌ DELETE `userEngagement.routes.ts` (already handled by info.routes.ts)

### 2. NAMESPACE CONFUSION

**Current Problems:**
```
/api/dynamic-content/*          → Bad naming (admin-managed content types)
/api/admin/users                → Correct (admin namespace)
/api/users/:id/badges           → Inconsistent (should be /api/badges/user/:id)
/api/badges/user/:userId        → Duplicate with above
/api/content-comments/*         → Old duplicate route
/api/alpha-comments/*           → Old duplicate route
/api/comments/*                 → NEW unified route (correct)
```

**Modern Structure (Following GitHub/Stripe pattern):**
```
# Core Resources
/api/v1/auth/*                  → Authentication & OAuth
/api/v1/users/*                 → User profiles, stats, activity
/api/v1/roles/*                 → Role management

# Platform Modules
/api/v1/hub/*                   → J Hub content & interactions
/api/v1/studio/*                → J Studio requests & proposals
/api/v1/academy/*               → J Academy courses & enrollments
/api/v1/alpha/*                 → J Alpha posts & voting
/api/v1/info/*                  → J Info engagement tracking

# Shared Resources
/api/v1/comments/*              → Universal comment system
/api/v1/badges/*                → Badge system
/api/v1/reports/*               → Report/moderation system
/api/v1/uploads/*               → File upload system
/api/v1/notifications/*         → User notifications
/api/v1/hashtags/*              → Hashtag system

# System Config (Public GET, Protected POST/PUT/DELETE)
/api/v1/configs/*               → System configurations
  GET  /hub-content-types       → Public (anyone can read)
  POST /hub-content-types       → Protected (super_admin only)
  GET  /studio-request-types    → Public
  POST /studio-request-types    → Protected

# Admin-Only Resources
/api/v1/admin/*                 → Admin panel features
  /users                        → User management
  /analytics                    → Platform analytics
  /logs                         → Admin action logs
  /settings                     → Site settings
```

### 3. SECURITY ISSUES

**Problem 1: Route-level vs Controller-level Authorization**
```typescript
// ❌ BAD - Authorization only in controller
router.get('/', getAllReports) // No middleware check
// Controller does: if (!canModerate) throw error

// ✅ GOOD - Authorization at route level
router.get('/', protect, authorize('moderator'), getAllReports)
```

**Problem 2: Role-based instead of Permission-based**
```typescript
// ❌ OLD - Hardcoded role check
router.use(authorize('admin', 'super_admin'))

// ✅ NEW - Permission check (in controller)
if (!user.permissions.admin?.canViewReports) {
  throw new AppError('Unauthorized', 403)
}
```

**Problem 3: Global middleware blocking public routes**
```typescript
// ❌ BAD - All admin routes require auth, even public GET
router.use(protect)
router.get('/hub/categories', ...) // Should be public GET

// ✅ GOOD - Mixed auth per HTTP method
router.get('/hub/categories', ...) // Public GET, no auth
router.post('/hub/categories', protect, authorize('super_admin'), ...) // Protected POST
```

---

## ROUTES TO DELETE (DUPLICATES/UNUSED)

### ❌ DELETE IMMEDIATELY:
1. **backend/src/routes/contentComment.routes.ts**
   - Reason: Replaced by unified `comment.routes.ts`
   - Used by: Probably old hub content pages
   - Migration: Frontend should use `/api/comments/hub_content/:contentId`

2. **backend/src/routes/alphaComment.routes.ts**
   - Reason: Replaced by unified `comment.routes.ts`
   - Used by: Probably old alpha post pages
   - Migration: Frontend should use `/api/comments/alpha_post/:contentId`

3. **backend/src/routes/userEngagement.routes.ts**
   - Reason: Duplicate of `info.routes.ts` engagement system
   - Used by: Unknown (check frontend)
   - Migration: Use `/api/info/posts` and `/api/info/my-engagements`

4. **backend/src/routes/jinfo.routes.ts**
   - Reason: Already disabled in index.ts
   - Status: SAFE TO DELETE

### ⚠️ REVIEW & POTENTIALLY MERGE:
5. **backend/src/routes/profileActivity.routes.ts**
   - Consider: Merge into `user.routes.ts` as `/api/users/:id/activity`
   - Current: `/api/profile-activity/*`
   - Better:  `/api/users/:id/activity`

6. **backend/src/routes/userStats.routes.ts**
   - Consider: Merge into `user.routes.ts` as `/api/users/:id/stats`
   - Current: `/api/user-stats/:userId`
   - Better:  `/api/users/:id/stats` (already exists in user.routes.ts!)
   - **Action:** ❌ DELETE (duplicate)

7. **backend/src/routes/studioMember.routes.ts**
   - Consider: Merge into `studio.routes.ts` as `/api/studio/members`
   - Current: `/api/studio-members/*`
   - Better:  `/api/studio/members`

8. **backend/src/routes/adminLog.routes.ts**
   - Consider: Move to `/api/admin/logs` (already exists in admin.routes.ts!)
   - **Action:** ❌ DELETE (duplicate)

9. **backend/src/routes/tokenTransaction.routes.ts**
   - Reason: Web3 feature not fully implemented
   - Action: Keep but mark as TODO/Future feature
   - Move to: `/api/v1/web3/transactions`

10. **backend/src/routes/smartContract.routes.ts**
    - Reason: Web3 feature not fully implemented
    - Action: Keep but mark as TODO/Future feature
    - Move to: `/api/v1/web3/contracts`

---

## MODERN API STRUCTURE

### Core Resources

#### 1. `/api/v1/auth` (auth.routes.ts) ✅ KEEP
```typescript
GET    /twitter                 → Initiate Twitter OAuth
GET    /twitter/callback        → Twitter OAuth callback
GET    /github                  → Link GitHub account
GET    /github/callback         → GitHub link callback
GET    /linkedin                → Link LinkedIn account
GET    /linkedin/callback       → LinkedIn link callback
POST   /wallet/connect          → Connect wallet (public)
POST   /wallet/verify           → Verify wallet (protected)
POST   /refresh                 → Refresh access token (public)
GET    /me                      → Get current user (protected)
POST   /logout                  → Logout (protected)
```

#### 2. `/api/v1/users` (user.routes.ts) ✅ MODERNIZE
```typescript
# Public
GET    /leaderboard             → Public leaderboard

# Protected
GET    /search                  → Search users
GET    /profile/:userId         → Get user profile (rename from /profile/:userId to /:userId)
PUT    /profile                 → Update own profile (rename to /)
PUT    /profile-picture         → Update profile picture
GET    /stats                   → Get own stats (rename to /me/stats)
GET    /activity                → Get own activity (rename to /me/activity)
POST   /wallet                  → Add wallet to whitelist
DELETE /wallet/:address         → Remove wallet

# Badge endpoints (KEEP HERE, remove from badge.routes.ts)
GET    /:userId/badges          → Get user's badges
GET    /:userId/badges/stats    → Get user's badge stats
```

#### 3. `/api/v1/roles` (role.routes.ts) ✅ KEEP
```typescript
GET    /                        → Get all roles (protected)
GET    /:id                     → Get role by ID (protected)
GET    /name/:name              → Get role by name (protected)
POST   /permissions             → Get role permissions (protected)
POST   /                        → Create role (super_admin only)
PUT    /:id                     → Update role (super_admin only)
DELETE /:id                     → Delete role (super_admin only)
```

#### 4. `/api/v1/social-links` (socialLinks.routes.ts) ✅ KEEP
```typescript
POST   /link                    → Link social account (protected)
DELETE /unlink/:platform         → Unlink social account (protected)
DELETE /auth/twitter             → Disconnect Twitter auth (protected)
DELETE /auth/wallet              → Disconnect wallet auth (protected)
```

---

### Platform Modules

#### 5. `/api/v1/hub` (hub.routes.ts) ✅ MODERNIZE
```typescript
# Public
GET    /featured                → Get featured content

# Protected
GET    /content                 → Get all content (rename to /)
GET    /content/:id             → Get single content (rename to /:id)
POST   /content                 → Create content (rename to /)
PUT    /content/:id             → Update content (rename to /:id)
DELETE /content/:id             → Delete content (rename to /:id)
GET    /my-content              → Get own content (rename to /me)
GET    /allowed-content-types   → Get allowed types for current user
POST   /upload/document         → Upload document (merge to /api/uploads?)
POST   /content/:id/like        → Toggle like (rename to /:id/like)
POST   /content/:id/bookmark    → Toggle bookmark (rename to /:id/bookmark)
PUT    /content/:id/moderate    → Moderate content (rename to /:id/moderate)
```

#### 6. `/api/v1/studio` (studio.routes.ts) ✅ MODERNIZE
```typescript
GET    /requests                → Get all requests (rename to /)
GET    /requests/:id            → Get single request (rename to /:id)
POST   /requests                → Create request (rename to /)
POST   /requests/:id/proposal   → Submit proposal (rename to /:id/proposals)
PUT    /requests/:id/proposal-response → Respond to proposal (rename to /:id/proposals/:proposalId)
POST   /requests/:id/deliver    → Deliver production (rename to /:id/delivery)
POST   /requests/:id/feedback   → Submit feedback (rename to /:id/feedback)
GET    /my-requests             → Get own requests (rename to /me/requests)
GET    /my-assignments          → Get own assignments (rename to /me/assignments)

# TODO: Merge studioMember.routes.ts
GET    /members                 → Get studio members
POST   /members                 → Add studio member
PUT    /members/:id             → Update studio member
```

#### 7. `/api/v1/academy` (academy.routes.ts) ✅ MODERNIZE
```typescript
GET    /courses                 → Get all courses (rename to /)
GET    /courses/:id             → Get single course (rename to /:id)
POST   /courses                 → Create course (rename to /)
PUT    /courses/:id             → Update course (rename to /:id)
POST   /courses/:id/like        → Toggle like (rename to /:id/like)
POST   /courses/:id/bookmark    → Toggle bookmark (rename to /:id/bookmark)
POST   /courses/:id/enroll      → Enroll in course (rename to /:id/enrollments)
PUT    /enrollment/:id/progress → Update progress (rename to /enrollments/:id/progress)
GET    /course-requests         → Get course requests (rename to /requests)
POST   /course-requests         → Create course request (rename to /requests)
GET    /my-courses              → Get own courses (rename to /me/courses)
```

#### 8. `/api/v1/alpha` (alpha.routes.ts) ✅ MODERNIZE
```typescript
GET    /posts                   → Get all posts (rename to /)
GET    /posts/:id               → Get single post (rename to /:id)
POST   /posts                   → Create post (rename to /)
PUT    /posts/:id               → Update post (rename to /:id)
DELETE /posts/:id               → Delete post (rename to /:id)
POST   /posts/:id/vote          → Vote on post (rename to /:id/vote)
POST   /posts/:id/like          → Toggle like (rename to /:id/like)
GET    /posts/:id/comments      → Get comments (use /api/comments instead)
POST   /posts/:id/comments      → Add comment (use /api/comments instead)
```

#### 9. `/api/v1/info` (info.routes.ts) ✅ MODERNIZE
```typescript
GET    /posts                   → Get all posts (rename to /)
GET    /posts/:id               → Get single post (rename to /:id)
POST   /posts                   → Create post (rename to /)
POST   /posts/:id/engage        → Submit engagement (rename to /:id/engagements)
GET    /my-engagements          → Get own engagements (rename to /me/engagements)
PUT    /posts/:id/verify        → Verify post (admin only) (rename to /:id/verify)
```

---

### Shared Resources

#### 10. `/api/v1/comments` (comment.routes.ts) ✅ KEEP & ENFORCE
```typescript
GET    /single/:id              → Get comment by ID (rename to /:id)
GET    /:commentId/replies      → Get replies (rename to /:id/replies)
GET    /:contentType/:contentId → Get comments for content
POST   /:contentType/:contentId → Create comment
PUT    /:id                     → Update comment
DELETE /:id                     → Delete comment
POST   /:id/like                → Toggle like
```
**NOTE:** Remove alpha/hub specific comment endpoints, use this unified system.

#### 11. `/api/v1/badges` (badge.routes.ts) ✅ MODERNIZE
```typescript
# User endpoints
GET    /my-badges               → Get own badges (rename to /me)
GET    /pinned                  → Get own pinned badges (rename to /me/pinned)
GET    /user/:userId            → Get user badges (rename to /users/:userId - DUPLICATE, remove)
POST   /pin/:badgeId            → Pin badge (rename to /:badgeId/pin)
DELETE /pin/:badgeId            → Unpin badge (rename to /:badgeId/pin)
PATCH  /visibility/:badgeId     → Toggle visibility (rename to /:badgeId/visibility)
POST   /check                   → Check for new badges (rename to /me/check)

# Admin endpoints (prefix with /admin)
GET    /admin/all               → Get all badge definitions (rename to /admin)
GET    /admin/stats             → Get badge statistics
GET    /admin/:badgeId          → Get badge (rename to /admin/:id)
POST   /admin/create            → Create badge (rename to /admin)
PUT    /admin/:badgeId          → Update badge (rename to /admin/:id)
DELETE /admin/:badgeId          → Delete badge (rename to /admin/:id)
POST   /admin/award             → Manually award badge (rename to /admin/award)
DELETE /admin/remove            → Remove badge from user (rename to /admin/revoke)
```

#### 12. `/api/v1/reports` (report.routes.ts) ✅ KEEP
```typescript
POST   /                        → Create report (protected)
GET    /my-reports              → Get own reports (rename to /me)
GET    /                        → Get all reports (moderator only)
GET    /:id                     → Get single report (moderator only)
PUT    /:id/review              → Review report (moderator only)
DELETE /:id                     → Delete report (moderator only)
```

#### 13. `/api/v1/uploads` (upload.routes.ts) ✅ MODERNIZE
```typescript
POST   /single                  → Upload single file (rename to /)
POST   /multiple                → Upload multiple files
POST   /image                   → Upload image with processing (rename to /images)
POST   /profile-picture         → Upload profile picture (rename to /images/profile)
POST   /content-media           → Upload content media (rename to /media)
DELETE /:filename                → Delete file
```

#### 14. `/api/v1/notifications` (notification.routes.ts) ✅ KEEP
```typescript
GET    /                        → Get user notifications
PUT    /:id/read                → Mark as read
PUT    /read-all                → Mark all as read
DELETE /:id                     → Delete notification
```

#### 15. `/api/v1/hashtags` (hashtag.routes.ts) ✅ KEEP
```typescript
# Public
GET    /                        → Get all hashtags
GET    /search                  → Search hashtags

# Admin only
POST   /                        → Create hashtag (admin)
DELETE /:id                     → Delete hashtag (admin)
```

---

### System Configuration

#### 16. `/api/v1/configs` (RENAME FROM dynamicContent.routes.ts + config.routes.ts)
```typescript
# Public GET, Protected POST/PUT/DELETE
GET    /public                  → Get public configs (from config.routes.ts)
GET    /hub-content-types       → Get hub content types (from dynamicContent)
GET    /studio-request-types    → Get studio request types (from dynamicContent)
GET    /academy-categories      → Get academy categories (from dynamicContent)
GET    /alpha-categories        → Get alpha categories (from dynamicContent)
GET    /info-platforms          → Get info platforms (from dynamicContent)
GET    /info-engagement-types   → Get info engagement types (from dynamicContent)

# Admin endpoints (super_admin only)
GET    /                        → Get all configs (from config.routes.ts)
GET    /:key                    → Get config by key
POST   /                        → Create config
PUT    /:key                    → Update config
POST   /:key/add                → Add to config list
DELETE /:key/remove             → Remove from config list
DELETE /:key                    → Delete config

# Dynamic content admin (super_admin only)
POST   /:type                   → Create item (hub-content-types, etc.)
PUT    /:type/:id               → Update item
DELETE /:type/:id               → Delete item
PATCH  /:type/:id/toggle        → Toggle item status
```
**NOTE:** Merge `dynamicContent.routes.ts` and `config.routes.ts` into one `configs.routes.ts`

---

### Admin Panel

#### 17. `/api/v1/admin` (admin.routes.ts) ✅ MODERNIZE
```typescript
# User management (super_admin only)
GET    /users                   → Get all users
GET    /users/:id               → Get user by ID
PUT    /users/:id               → Update user
DELETE /users/:id               → Delete user
PUT    /users/:id/roles         → Update user roles
PUT    /users/:id/permissions   → Update user permissions

# Site settings (super_admin only)
GET    /settings                → Get site settings
PUT    /settings                → Update site settings

# Logs (admin & super_admin)
GET    /logs                    → Get admin logs

# Analytics (admin & super_admin)
GET    /analytics               → Get platform analytics

# Engagement Criteria (admin & super_admin)
GET    /engagement-criteria     → Get all criteria
GET    /engagement-criteria/:id → Get criteria by ID
POST   /engagement-criteria     → Create criteria
PUT    /engagement-criteria/:id → Update criteria
DELETE /engagement-criteria/:id → Delete criteria
PATCH  /engagement-criteria/:id/toggle → Toggle criteria

# Hub Configuration (super_admin only) - MOVE TO /api/configs
GET    /hub/config              → Get hub config (DEPRECATED - use /api/configs)
GET    /hub/categories          → Get categories (DEPRECATED - use /api/configs/hub-content-types)
POST   /hub/categories          → Add category (DEPRECATED)
DELETE /hub/categories/:slug    → Delete category (DEPRECATED)
PUT    /hub/categories/:oldSlug → Rename category (DEPRECATED)
POST   /hub/types               → Add content type (DEPRECATED)
DELETE /hub/types/:slug          → Delete content type (DEPRECATED)
PUT    /hub/types/:oldSlug      → Rename content type (DEPRECATED)
POST   /hub/difficulty          → Add difficulty level (DEPRECATED)
DELETE /hub/difficulty/:slug     → Delete difficulty level (DEPRECATED)
PUT    /hub/difficulty/:oldSlug → Rename difficulty level (DEPRECATED)

# System Config (super_admin only) - MOVE TO /api/configs
PUT    /system-config/:configKey → Update system config (DEPRECATED - use /api/configs/:key)
```

---

### Web3 (Future)

#### 18. `/api/v1/web3/transactions` (RENAME FROM tokenTransaction.routes.ts)
```typescript
POST   /                        → Create transaction
GET    /user/:userId            → Get user transactions (rename to /users/:userId)
PUT    /:id/status              → Update transaction status (admin)
```

#### 19. `/api/v1/web3/contracts` (RENAME FROM smartContract.routes.ts)
```typescript
POST   /                        → Deploy contract (super_admin)
GET    /                        → Get all contracts
GET    /:address                → Get contract by address
PUT    /:address                → Update contract (super_admin)
```

---

## MIGRATION STEPS

### Step 1: Delete Duplicate/Unused Routes (IMMEDIATE)
1. ❌ DELETE `backend/src/routes/contentComment.routes.ts`
2. ❌ DELETE `backend/src/routes/alphaComment.routes.ts`
3. ❌ DELETE `backend/src/routes/userEngagement.routes.ts`
4. ❌ DELETE `backend/src/routes/jinfo.routes.ts`
5. ❌ DELETE `backend/src/routes/userStats.routes.ts` (duplicate of user.routes.ts stats)
6. ❌ DELETE `backend/src/routes/adminLog.routes.ts` (duplicate of admin.routes.ts logs)
7. Remove all references from `index.ts`

### Step 2: Merge Config Routes
1. Merge `dynamicContent.routes.ts` + `config.routes.ts` → `configs.routes.ts`
2. Update `/api/dynamic-content` → `/api/configs`
3. Keep both SystemConfig (DB configs) and DynamicContent (dropdown types) in same route file

### Step 3: Merge Related Routes
1. Merge `studioMember.routes.ts` → `studio.routes.ts` as `/members`
2. Merge `profileActivity.routes.ts` → `user.routes.ts` as `/:userId/activity`

### Step 4: Update Frontend API Calls
1. Search for `/api/content-comments` → Replace with `/api/comments/hub_content`
2. Search for `/api/alpha-comments` → Replace with `/api/comments/alpha_post`
3. Search for `/api/user-engagements` → Replace with `/api/info`
4. Search for `/api/dynamic-content` → Replace with `/api/configs`
5. Search for `/api/profile-activity` → Replace with `/api/users/:id/activity`
6. Search for `/api/user-stats` → Replace with `/api/users/:id/stats`
7. Search for `/api/admin-logs` → Replace with `/api/admin/logs`

### Step 5: Add Versioning (Optional but Recommended)
1. Add `/api/v1` prefix to all routes in `index.ts`
2. Update frontend base URL: `api.ts` → `baseURL: '/api/v1'`

### Step 6: Security Audit
1. Review all routes for proper `protect` middleware
2. Replace `authorize('admin', 'super_admin')` with permission checks in controllers
3. Ensure public routes (GET configs, hashtags, etc.) don't require auth
4. Test authorization on all endpoints

---

## FILES TO DELETE

```bash
# SAFE TO DELETE IMMEDIATELY
backend/src/routes/contentComment.routes.ts
backend/src/routes/alphaComment.routes.ts
backend/src/routes/userEngagement.routes.ts
backend/src/routes/jinfo.routes.ts
backend/src/routes/userStats.routes.ts
backend/src/routes/adminLog.routes.ts

# CONTROLLERS TO DELETE (if not used elsewhere)
backend/src/controllers/contentComment.controller.ts
backend/src/controllers/alphaComment.controller.ts
backend/src/controllers/userEngagement.controller.ts
backend/src/controllers/userStats.controller.ts
backend/src/controllers/adminLog.controller.ts
```

---

## FRONTEND FILES TO UPDATE

Search for these patterns in frontend:
```bash
# Old API endpoints that need updating
/api/content-comments
/api/alpha-comments
/api/user-engagements
/api/dynamic-content
/api/profile-activity
/api/user-stats
/api/admin-logs
/api/studio-members
```

Update to:
```bash
/api/comments
/api/comments
/api/info
/api/configs
/api/users/:id/activity
/api/users/:id/stats
/api/admin/logs
/api/studio/members
```

---

## MODERN API BENEFITS

✅ **Clear Namespace:** Each resource has one canonical URL
✅ **RESTful:** HTTP methods define action (GET/POST/PUT/DELETE)
✅ **Secure:** Public GET, protected write operations
✅ **No Duplicates:** One endpoint per resource
✅ **Maintainable:** Easy to understand and extend
✅ **Versioned:** `/api/v1` allows future breaking changes
✅ **Standard:** Follows GitHub, Stripe, Firebase patterns

---

## TESTING CHECKLIST

After refactor, test these scenarios:

- [ ] Public user can GET configs without authentication
- [ ] Authenticated user can create content
- [ ] Super admin can create new config types
- [ ] Comments work for hub content, alpha posts, academy courses
- [ ] Badge system works (pin, unpin, visibility)
- [ ] Reports work (create, moderate, resolve)
- [ ] Upload works (images, documents, profile pictures)
- [ ] Admin panel works (users, analytics, logs, settings)
- [ ] Notifications work (create, read, delete)
- [ ] All frontend pages load without 404 errors

---

**END OF REFACTOR PLAN**
