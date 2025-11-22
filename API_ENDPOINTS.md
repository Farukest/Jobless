# JOBLESS PLATFORM - COMPLETE API ENDPOINTS SPECIFICATION

This document lists ALL required API endpoints based on STRUCTURE.md and jobless_project.pdf.

---

## API STRUCTURE OVERVIEW

**Base URL:** `/api`

**Authentication:**
- All protected routes require `Authorization: Bearer {token}` header
- Token obtained from `/api/auth/twitter/callback` or `/api/auth/wallet/connect`

**Role-Based Access Control:**
- Roles: `member`, `admin`, `super_admin`, `content_creator`, `designer`, `video_editor`, `requester`, `learner`, `mentor`, `scout`
- Middleware: `protect` (authentication), `authorize(...roles)` (role-based)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/auth/twitter` | Public | Redirect to Twitter OAuth | - | Redirect to Twitter |
| GET | `/auth/twitter/callback` | Public | Twitter OAuth callback | - | Redirect to frontend with tokens |
| POST | `/auth/wallet/connect` | Public | Connect wallet (login/signup) | `walletAddress`, `signature`, `message` | `{ accessToken, refreshToken, user }` |
| POST | `/auth/wallet/verify` | Private | Link wallet to authenticated user | `walletAddress`, `signature`, `message` | `{ user }` |
| POST | `/auth/refresh` | Public | Refresh access token | `refreshToken` | `{ accessToken, refreshToken }` |
| GET | `/auth/me` | Private | Get current user | - | `{ user }` |
| POST | `/auth/logout` | Private | Logout user | - | `{ message }` |

### User Profile Routes (`/api/users`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/users/profile` | Private (All) | Get own profile | - | `{ user, stats, activity }` |
| PUT | `/users/profile` | Private (All) | Update profile (displayName, bio) | `displayName`, `bio` | `{ user }` |
| PUT | `/users/profile-picture` | Private (All) | Update profile picture | `imageUrl` | `{ user }` |
| GET | `/users/settings` | Private (All) | Get user settings | - | `{ settings }` |
| PUT | `/users/settings` | Private (All) | Update settings | `theme`, `emailNotifications`, `whitelistWallets` | `{ settings }` |
| GET | `/users/stats` | Private (All) | Get user stats | Query: `range` (7d, 30d, 90d, all) | `{ stats, charts }` |
| GET | `/users/activity` | Private (All) | Get activity history | Query: `type`, `from`, `to`, `page`, `limit` | `{ activities, total, page }` |

### Social Links Routes (`/api/social-links`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| POST | `/social-links/link` | Private (All) | Link social account (Twitter manual) | `platform`, `username` | `{ user }` |
| DELETE | `/social-links/unlink/:platform` | Private (All) | Unlink social account | - | `{ user }` |
| GET | `/auth/linkedin` | Private (All) | Redirect to LinkedIn OAuth | Query: `token` (JWT) | Redirect to LinkedIn |
| GET | `/auth/linkedin/callback` | Public | LinkedIn OAuth callback | - | Link account and redirect |
| GET | `/auth/github` | Private (All) | Redirect to GitHub OAuth | Query: `token` (JWT) | Redirect to GitHub |
| GET | `/auth/github/callback` | Public | GitHub OAuth callback | - | Link account and redirect |

---

## 2. J HUB (Content Management)

### Content Routes (`/api/hub/content`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/hub/content` | Private (All) | Get all content (with filters) | Query: `type`, `category`, `difficulty`, `search`, `sort`, `page`, `limit` | `{ content[], total, page }` |
| GET | `/hub/content/:id` | Private (All) | Get single content | - | `{ content, author, comments }` |
| POST | `/hub/content` | Private (All) | Create content | `title`, `description`, `type`, `category`, `difficulty`, `thumbnail`, `tags`, `body/url`, `status` | `{ content }` |
| PUT | `/hub/content/:id` | Private (Owner/Admin) | Update content | Same as POST | `{ content }` |
| DELETE | `/hub/content/:id` | Private (Owner/Admin) | Delete content | - | `{ message }` |
| GET | `/hub/my-content` | Private (All) | Get user's own content | Query: `status`, `type`, `search`, `sort` | `{ content[], total }` |
| POST | `/hub/content/:id/like` | Private (All) | Like content | - | `{ likes }` |
| DELETE | `/hub/content/:id/like` | Private (All) | Unlike content | - | `{ likes }` |
| POST | `/hub/content/:id/bookmark` | Private (All) | Bookmark content | - | `{ message }` |
| DELETE | `/hub/content/:id/bookmark` | Private (All) | Remove bookmark | - | `{ message }` |
| POST | `/hub/content/:id/report` | Private (All) | Report content | `reason`, `details` | `{ message }` |

### Content Comments Routes (`/api/hub/content/:contentId/comments`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/hub/content/:contentId/comments` | Private (All) | Get comments for content | Query: `sort`, `page`, `limit` | `{ comments[], total }` |
| POST | `/hub/content/:contentId/comments` | Private (All) | Add comment | `text`, `parentId?` | `{ comment }` |
| PUT | `/hub/content/:contentId/comments/:commentId` | Private (Owner) | Update comment | `text` | `{ comment }` |
| DELETE | `/hub/content/:contentId/comments/:commentId` | Private (Owner/Admin) | Delete comment | - | `{ message }` |
| POST | `/hub/content/:contentId/comments/:commentId/like` | Private (All) | Like comment | - | `{ likes }` |
| DELETE | `/hub/content/:contentId/comments/:commentId/like` | Private (All) | Unlike comment | - | `{ likes }` |
| POST | `/hub/content/:contentId/comments/:commentId/report` | Private (All) | Report comment | `reason` | `{ message }` |

---

## 3. J STUDIO (Design & Video Requests)

### Production Request Routes (`/api/studio/requests`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/studio/requests` | Private (All) | Get all requests | Query: `type`, `status`, `priority`, `search`, `sort`, `page` | `{ requests[], total }` |
| GET | `/studio/requests/:id` | Private (All) | Get single request | - | `{ request, requester, assignedTo, files, comments }` |
| POST | `/studio/requests` | Private (All) | Create request | `title`, `description`, `type`, `priority`, `deadline`, `files`, `requirements`, `referenceUrls`, `projectName?` | `{ request }` |
| PUT | `/studio/requests/:id` | Private (Owner) | Update request (only if Open) | Same as POST | `{ request }` |
| DELETE | `/studio/requests/:id` | Private (Owner/Admin) | Cancel/Delete request | - | `{ message }` |
| GET | `/studio/my-requests` | Private (All) | Get user's requests | Query: `as` (requester/claimer), `status`, `type` | `{ requests[], total }` |
| POST | `/studio/requests/:id/claim` | Private (Designer/Editor) | Claim request | - | `{ request }` |
| POST | `/studio/requests/:id/unclaim` | Private (Designer/Editor, Owner) | Unclaim request | - | `{ request }` |
| POST | `/studio/requests/:id/submit` | Private (Claimer) | Submit work | `files[]`, `notes` | `{ request }` |
| POST | `/studio/requests/:id/complete` | Private (Requester) | Mark as completed | - | `{ request }` |
| POST | `/studio/requests/:id/revision` | Private (Requester) | Request revision | `feedback` | `{ request }` |
| POST | `/studio/requests/:id/reassign` | Private (Admin) | Reassign request | `userId`, `note?` | `{ request }` |
| PUT | `/studio/requests/:id/priority` | Private (Admin) | Change priority | `priority` | `{ request }` |

### Studio Team Routes (`/api/studio/team`)

| Method | Endpoint | Access | Description | Query | Response |
|--------|----------|--------|-------------|-------|----------|
| GET | `/studio/team` | Private (All) | Get studio team members | Query: `role` (designer/editor), `search`, `sort` | `{ members[], stats }` |
| GET | `/studio/team/:userId` | Private (All) | Get team member profile | - | `{ member, portfolio, stats }` |

### Request Comments Routes (`/api/studio/requests/:requestId/comments`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/studio/requests/:requestId/comments` | Private (All) | Get comments | - | `{ comments[] }` |
| POST | `/studio/requests/:requestId/comments` | Private (All) | Add comment | `text` | `{ comment }` |
| DELETE | `/studio/requests/:requestId/comments/:commentId` | Private (Owner/Admin) | Delete comment | - | `{ message }` |

---

## 4. J ACADEMY (Courses & Learning)

### Course Routes (`/api/academy/courses`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/academy/courses` | Private (All) | Get all courses | Query: `category`, `difficulty`, `format`, `status`, `free`, `search`, `sort`, `page` | `{ courses[], total }` |
| GET | `/academy/courses/:id` | Private (All) | Get course details | - | `{ course, mentor, curriculum, reviews, enrolled }` |
| POST | `/academy/courses` | Private (Mentor/Admin) | Create course | `title`, `description`, `thumbnail`, `introVideo`, `category`, `difficulty`, `format`, `duration`, `language`, `maxStudents`, `pricing`, `curriculum[]`, `requirements`, `learningOutcomes`, `schedule?` | `{ course }` |
| PUT | `/academy/courses/:id` | Private (Mentor-Owner/Admin) | Update course | Same as POST | `{ course }` |
| DELETE | `/academy/courses/:id` | Private (Mentor-Owner/Admin) | Delete course | - | `{ message }` |
| GET | `/academy/my-courses` | Private (Learner) | Get enrolled courses | Query: `status` (inProgress/completed/wishlist) | `{ courses[], progress }` |
| POST | `/academy/courses/:id/enroll` | Private (All) | Enroll in course | - | `{ enrollment }` |
| POST | `/academy/courses/:id/review` | Private (Enrolled) | Add review | `rating`, `text` | `{ review }` |
| POST | `/academy/courses/:id/announcement` | Private (Mentor-Owner) | Post announcement | `title`, `message` | `{ announcement }` |
| GET | `/academy/courses/:id/students` | Private (Mentor-Owner/Admin) | Get enrolled students | - | `{ students[], stats }` |
| POST | `/academy/courses/:id/certificate` | Private (Learner, completed) | Download certificate | - | `{ certificateUrl }` |

### Course Request Routes (`/api/academy/requests`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/academy/requests` | Private (All) | Get course requests | Query: `status`, `category`, `sort` | `{ requests[], total }` |
| GET | `/academy/requests/:id` | Private (All) | Get request details | - | `{ request, votes, comments, mentorInterests }` |
| POST | `/academy/requests` | Private (Requester) | Create course request | `topic`, `description`, `category`, `format`, `estimatedInterested` | `{ request }` |
| PUT | `/academy/requests/:id` | Private (Requester-Owner) | Update request | Same as POST | `{ request }` |
| DELETE | `/academy/requests/:id` | Private (Requester-Owner/Admin) | Delete request | - | `{ message }` |
| POST | `/academy/requests/:id/vote` | Private (All) | Upvote request | - | `{ votes }` |
| DELETE | `/academy/requests/:id/vote` | Private (All) | Remove vote | - | `{ votes }` |
| POST | `/academy/requests/:id/interest` | Private (Mentor) | Express interest to teach | `message` | `{ interest }` |
| PUT | `/academy/requests/:id/status` | Private (Admin) | Change request status | `status` | `{ request }` |

---

## 5. J INFO (Engagement Tracking)

### Engagement Routes (`/api/info/engagements`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/info/engagements` | Private (All) | Get user's engagements | Query: `status`, `platform`, `type`, `from`, `to`, `page` | `{ engagements[], total, stats }` |
| GET | `/info/engagements/:id` | Private (All) | Get engagement details | - | `{ engagement }` |
| POST | `/info/engagements` | Private (All) | Submit engagement | `platform`, `type`, `proofUrl`, `screenshot?`, `campaign?`, `notes?` | `{ engagement }` |
| DELETE | `/info/engagements/:id` | Private (Owner) | Delete submission (if pending) | - | `{ message }` |
| GET | `/info/campaigns` | Private (All) | Get active campaigns | - | `{ campaigns[] }` |
| GET | `/info/leaderboard` | Private (All) | Get leaderboard | Query: `range` | `{ leaderboard[], userRank }` |
| GET | `/info/stats` | Private (All) | Get engagement stats | - | `{ totalSubmissions, approvalRate, totalPoints, rank }` |
| POST | `/info/export` | Private (All) | Export engagement history | - | CSV file |

### Admin Engagement Management (`/api/admin/engagements`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/engagements` | Private (Admin) | Get all engagements | Query: `status`, `platform`, `type`, `user`, `from`, `to` | `{ engagements[], total, stats }` |
| PUT | `/admin/engagements/:id/approve` | Private (Admin) | Approve engagement | `points?`, `note?` | `{ engagement }` |
| PUT | `/admin/engagements/:id/reject` | Private (Admin) | Reject engagement | `reason` | `{ engagement }` |
| DELETE | `/admin/engagements/:id` | Private (Admin) | Delete engagement | - | `{ message }` |

### Campaign Management (`/api/admin/campaigns`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/campaigns` | Private (Admin) | Get all campaigns | - | `{ campaigns[] }` |
| POST | `/admin/campaigns` | Private (Admin) | Create campaign | `name`, `platform`, `description`, `pointsPerEngagement`, `startDate`, `endDate` | `{ campaign }` |
| PUT | `/admin/campaigns/:id` | Private (Admin) | Update campaign | Same as POST | `{ campaign }` |
| DELETE | `/admin/campaigns/:id` | Private (Admin) | Delete campaign | - | `{ message }` |

---

## 6. J ALPHA (Early Project Research)

### Alpha Post Routes (`/api/alpha/posts`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/alpha/posts` | Private (All) | Get alpha feed | Query: `category`, `risk`, `status`, `verified`, `search`, `sort`, `page` | `{ posts[], total }` |
| GET | `/alpha/posts/:id` | Private (All) | Get alpha details | - | `{ post, scout, reactions, comments, updates }` |
| POST | `/alpha/posts` | Private (Scout/Admin) | Submit alpha | `title`, `projectName`, `category`, `chain`, `website`, `twitter`, `discord`, `docs`, `description`, `risk`, `deadline?`, `tags`, `verified` | `{ post }` |
| PUT | `/alpha/posts/:id` | Private (Scout-Owner/Admin) | Update alpha | Same as POST | `{ post }` |
| DELETE | `/alpha/posts/:id` | Private (Scout-Owner/Admin) | Delete alpha | - | `{ message }` |
| GET | `/alpha/my-alphas` | Private (Scout) | Get user's alphas | Query: `status`, `category`, `sort` | `{ posts[], stats }` |
| POST | `/alpha/posts/:id/react` | Private (All) | Add reaction (🔥👀⚠️✅) | `type` | `{ reactions }` |
| DELETE | `/alpha/posts/:id/react` | Private (All) | Remove reaction | - | `{ reactions }` |
| POST | `/alpha/posts/:id/bookmark` | Private (All) | Bookmark alpha | - | `{ message }` |
| DELETE | `/alpha/posts/:id/bookmark` | Private (All) | Remove bookmark | - | `{ message }` |
| POST | `/alpha/posts/:id/report` | Private (All) | Report alpha (scam/spam) | `reason`, `details` | `{ message }` |
| POST | `/alpha/posts/:id/update` | Private (Scout-Owner) | Add update | `text` | `{ update }` |
| PUT | `/alpha/posts/:id/status` | Private (Scout-Owner/Admin) | Update status | `status` (Active/Completed/Dead) | `{ post }` |

### Alpha Comments Routes (`/api/alpha/posts/:postId/comments`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/alpha/posts/:postId/comments` | Private (All) | Get comments | Query: `sort` | `{ comments[] }` |
| POST | `/alpha/posts/:postId/comments` | Private (All) | Add comment | `text`, `parentId?` | `{ comment }` |
| PUT | `/alpha/posts/:postId/comments/:commentId` | Private (Owner) | Update comment | `text` | `{ comment }` |
| DELETE | `/alpha/posts/:postId/comments/:commentId` | Private (Owner/Admin) | Delete comment | - | `{ message }` |
| POST | `/alpha/posts/:postId/comments/:commentId/like` | Private (All) | Like comment | - | `{ likes }` |

### Admin Alpha Management (`/api/admin/alpha`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/alpha` | Private (Admin) | Get all alphas for moderation | Query: `status`, `category`, `verified`, `reported` | `{ posts[], total }` |
| PUT | `/admin/alpha/:id/verify` | Private (Admin) | Verify alpha | `note?` | `{ post }` |
| PUT | `/admin/alpha/:id/feature` | Private (Admin) | Feature alpha | - | `{ post }` |
| PUT | `/admin/alpha/:id/unfeature` | Private (Admin) | Unfeature alpha | - | `{ post }` |
| DELETE | `/admin/alpha/:id` | Private (Admin) | Remove alpha | `reason?` | `{ message }` |
| POST | `/admin/alpha/:id/ban-author` | Private (Admin) | Ban scout | - | `{ message }` |

---

## 7. ADMIN PANEL - User & Role Management

### User Management (`/api/admin/users`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/users` | Private (Admin) | Get all users | Query: `role`, `status`, `search`, `joinedFrom`, `joinedTo`, `sort`, `page` | `{ users[], total, stats }` |
| GET | `/admin/users/:id` | Private (Admin) | Get user details | - | `{ user, activity, stats }` |
| PUT | `/admin/users/:id/roles` | Private (Admin) | Update user roles | `roles[]` | `{ user }` |
| PUT | `/admin/users/:id/status` | Private (Admin) | Change user status | `status` (active/suspended/banned) | `{ user }` |
| DELETE | `/admin/users/:id` | Private (Super Admin) | Delete user | - | `{ message }` |
| POST | `/admin/users` | Private (Super Admin) | Create user manually | `username`, `email`, `role` | `{ user }` |
| POST | `/admin/users/export` | Private (Admin) | Export user list | Query filters | CSV file |

### Role Management (`/api/admin/roles`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/roles` | Private (Super Admin) | Get all roles | - | `{ roles[] }` |
| GET | `/admin/roles/:id` | Private (Super Admin) | Get role details | - | `{ role, users[], permissions }` |
| POST | `/admin/roles` | Private (Super Admin) | Create role | `name`, `key`, `description`, `permissions[]` | `{ role }` |
| PUT | `/admin/roles/:id` | Private (Super Admin) | Update role | Same as POST | `{ role }` |
| DELETE | `/admin/roles/:id` | Private (Super Admin) | Delete role (if no users) | - | `{ message }` |
| PUT | `/admin/roles/:id/permissions` | Private (Super Admin) | Update permissions | `permissions[]` | `{ role }` |

### Permission Management (`/api/admin/permissions`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/permissions` | Private (Super Admin) | Get all permissions | Query: `module` | `{ permissions[] }` |
| POST | `/admin/permissions` | Private (Super Admin) | Create permission | `name`, `key`, `module`, `description` | `{ permission }` |
| PUT | `/admin/permissions/:id` | Private (Super Admin) | Update permission | Same as POST | `{ permission }` |
| GET | `/admin/permissions/:id/roles` | Private (Super Admin) | Get roles with permission | - | `{ roles[] }` |

---

## 8. ADMIN PANEL - Dynamic Content Management

### Hub Content Types (`/api/admin/hub-content-types`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/hub-content-types` | Private (Admin) | Get all content types | - | `{ types[] }` |
| POST | `/admin/hub-content-types` | Private (Admin) | Create content type | `name`, `key`, `description?`, `icon?`, `active` | `{ type }` |
| PUT | `/admin/hub-content-types/:id` | Private (Admin) | Update content type | Same as POST | `{ type }` |
| PUT | `/admin/hub-content-types/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ type }` |
| DELETE | `/admin/hub-content-types/:id` | Private (Super Admin) | Delete type (if unused) | - | `{ message }` |

### Studio Request Types (`/api/admin/studio-request-types`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/studio-request-types` | Private (Admin) | Get all request types | - | `{ types[] }` |
| POST | `/admin/studio-request-types` | Private (Admin) | Create request type | `name`, `key`, `description?`, `assignedRole`, `icon?`, `active` | `{ type }` |
| PUT | `/admin/studio-request-types/:id` | Private (Admin) | Update request type | Same as POST | `{ type }` |
| PUT | `/admin/studio-request-types/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ type }` |
| DELETE | `/admin/studio-request-types/:id` | Private (Super Admin) | Delete type (if unused) | - | `{ message }` |

### Academy Categories (`/api/admin/academy-categories`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/academy-categories` | Private (Admin) | Get all categories | - | `{ categories[] }` |
| POST | `/admin/academy-categories` | Private (Admin) | Create category | `name`, `key`, `description`, `icon?`, `color?`, `active` | `{ category }` |
| PUT | `/admin/academy-categories/:id` | Private (Admin) | Update category | Same as POST | `{ category }` |
| PUT | `/admin/academy-categories/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ category }` |
| DELETE | `/admin/academy-categories/:id` | Private (Super Admin) | Delete category (if no courses) | - | `{ message }` |

### Info Platforms (`/api/admin/info-platforms`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/info-platforms` | Private (Admin) | Get all platforms | - | `{ platforms[] }` |
| POST | `/admin/info-platforms` | Private (Admin) | Create platform | `name`, `key`, `description?`, `website?`, `logo?`, `icon?`, `active` | `{ platform }` |
| PUT | `/admin/info-platforms/:id` | Private (Admin) | Update platform | Same as POST | `{ platform }` |
| PUT | `/admin/info-platforms/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ platform }` |
| DELETE | `/admin/info-platforms/:id` | Private (Super Admin) | Delete platform (if unused) | - | `{ message }` |

### Info Engagement Types (`/api/admin/info-engagement-types`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/info-engagement-types` | Private (Admin) | Get all engagement types | - | `{ types[] }` |
| POST | `/admin/info-engagement-types` | Private (Admin) | Create engagement type | `name`, `key`, `description?`, `defaultPoints`, `icon?`, `requiresProofUrl`, `requiresScreenshot`, `active` | `{ type }` |
| PUT | `/admin/info-engagement-types/:id` | Private (Admin) | Update engagement type | Same as POST | `{ type }` |
| PUT | `/admin/info-engagement-types/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ type }` |
| DELETE | `/admin/info-engagement-types/:id` | Private (Super Admin) | Delete type (if unused) | - | `{ message }` |

### Alpha Categories (`/api/admin/alpha-categories`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/alpha-categories` | Private (Admin) | Get all categories | - | `{ categories[] }` |
| POST | `/admin/alpha-categories` | Private (Admin) | Create category | `name`, `key`, `description`, `icon?`, `color?`, `defaultRisk`, `active` | `{ category }` |
| PUT | `/admin/alpha-categories/:id` | Private (Admin) | Update category | Same as POST | `{ category }` |
| PUT | `/admin/alpha-categories/:id/toggle` | Private (Admin) | Activate/Deactivate | - | `{ category }` |
| DELETE | `/admin/alpha-categories/:id` | Private (Super Admin) | Delete category (if no posts) | - | `{ message }` |
| GET | `/admin/alpha-categories/:id/stats` | Private (Admin) | Get category stats | - | `{ totalPosts, successRate }` |

---

## 9. ADMIN PANEL - Content Moderation

### Hub Content Moderation (`/api/admin/content`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/content` | Private (Admin) | Get all content for moderation | Query: `status` (pending/published/rejected/reported), `type`, `author`, `from`, `to` | `{ content[], total }` |
| PUT | `/admin/content/:id/approve` | Private (Admin) | Approve content | - | `{ content }` |
| PUT | `/admin/content/:id/reject` | Private (Admin) | Reject content | `reason` | `{ content }` |
| PUT | `/admin/content/:id/feature` | Private (Admin) | Feature content | - | `{ content }` |
| DELETE | `/admin/content/:id` | Private (Admin) | Delete content | - | `{ message }` |

### Academy Course Moderation (`/api/admin/courses`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/courses` | Private (Admin) | Get all courses | Query: `status`, `mentor`, `category` | `{ courses[], total }` |
| PUT | `/admin/courses/:id/approve` | Private (Admin) | Approve course | - | `{ course }` |
| PUT | `/admin/courses/:id/reject` | Private (Admin) | Reject course | `reason` | `{ course }` |
| PUT | `/admin/courses/:id/feature` | Private (Admin) | Feature course | - | `{ course }` |
| PUT | `/admin/courses/:id/archive` | Private (Admin) | Archive course | - | `{ course }` |
| DELETE | `/admin/courses/:id` | Private (Admin) | Delete course | - | `{ message }` |
| GET | `/admin/courses/:id/students` | Private (Admin) | Get course students | - | `{ students[] }` |
| POST | `/admin/courses/:id/announcement` | Private (Admin) | Send announcement | `message` | `{ message }` |

### Studio Production Moderation (`/api/admin/production`)

| Method | Endpoint | Access | Description | Request Body/Query | Response |
|--------|----------|--------|-------------|---------------------|----------|
| GET | `/admin/production` | Private (Admin) | Get all production requests | Query: `status`, `type`, `requester`, `assignedTo` | `{ requests[], total, stats }` |
| PUT | `/admin/production/:id/reassign` | Private (Admin) | Reassign request | `userId`, `note?` | `{ request }` |
| PUT | `/admin/production/:id/priority` | Private (Admin) | Change priority | `priority` | `{ request }` |
| PUT | `/admin/production/:id/status` | Private (Admin) | Change status | `status` | `{ request }` |
| DELETE | `/admin/production/:id` | Private (Admin) | Delete request | - | `{ message }` |

---

## 10. ADMIN PANEL - Analytics & Logs

### Analytics (`/api/admin/analytics`)

| Method | Endpoint | Access | Description | Query | Response |
|--------|----------|--------|-------------|-------|----------|
| GET | `/admin/analytics/overview` | Private (Admin) | Get platform overview stats | `range` (7d/30d/90d/1y/all) | `{ users, content, engagement, stats }` |
| GET | `/admin/analytics/users` | Private (Admin) | Get user analytics | `range` | `{ registrations, activeUsers, byRole, bySource }` |
| GET | `/admin/analytics/content` | Private (Admin) | Get content analytics | `range` | `{ byType, byCategory, topContent }` |
| GET | `/admin/analytics/courses` | Private (Admin) | Get course analytics | `range` | `{ enrollments, byCategory, topCourses, completionRate }` |
| GET | `/admin/analytics/studio` | Private (Admin) | Get studio analytics | `range` | `{ byType, completionTime, topDesigners }` |
| GET | `/admin/analytics/engagement` | Private (Admin) | Get engagement analytics | `range` | `{ byPlatform, approvalRate, totalPoints }` |
| GET | `/admin/analytics/alpha` | Private (Admin) | Get alpha analytics | `range` | `{ byCategory, successRate, topScouts }` |
| POST | `/admin/analytics/export` | Private (Admin) | Export analytics report | `range`, `modules[]` | PDF/CSV file |

### Admin Logs (`/api/admin/logs`)

| Method | Endpoint | Access | Description | Query | Response |
|--------|----------|--------|-------------|-------|----------|
| GET | `/admin/logs` | Private (Super Admin) | Get admin activity logs | Query: `actionType`, `adminUser`, `from`, `to`, `page` | `{ logs[], total }` |
| POST | `/admin/logs/export` | Private (Super Admin) | Export logs | Query filters | CSV file |

---

## 11. ADMIN PANEL - Site Settings

### Site Settings (`/api/admin/settings`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| GET | `/admin/settings` | Private (Super Admin) | Get all site settings | - | `{ settings }` |
| PUT | `/admin/settings/general` | Private (Super Admin) | Update general settings | `siteName`, `siteUrl`, `description`, `logo`, `favicon`, `language`, `maintenanceMode` | `{ settings }` |
| PUT | `/admin/settings/auth` | Private (Super Admin) | Update auth settings | `enableTwitterOAuth`, `twitterApiKey`, `twitterApiSecret`, `enableFarcasterOAuth`, `farcasterApiKey` | `{ settings }` |
| PUT | `/admin/settings/email` | Private (Super Admin) | Update email settings | `smtpServer`, `smtpPort`, `smtpUsername`, `smtpPassword`, `fromEmail`, `fromName` | `{ settings }` |
| POST | `/admin/settings/email/test` | Private (Super Admin) | Test email configuration | - | `{ message }` |
| PUT | `/admin/settings/points` | Private (Super Admin) | Update points system | `hubContentPoints`, `academyCoursePoints`, `infoEngagementPoints`, `alphaSubmissionPoints`, `enableLeaderboard` | `{ settings }` |
| PUT | `/admin/settings/moderation` | Private (Super Admin) | Update moderation settings | `requireContentApproval`, `requireCourseApproval`, `requireAlphaApproval`, `bannedWords[]` | `{ settings }` |
| PUT | `/admin/settings/uploads` | Private (Super Admin) | Update file upload limits | `maxAvatarSize`, `maxContentImageSize`, `maxVideoSize`, `maxFileSize` | `{ settings }` |
| PUT | `/admin/settings/api` | Private (Super Admin) | Update API settings | `enablePublicAPI`, `apiRateLimit` | `{ settings }` |
| POST | `/admin/settings/api/generate-key` | Private (Super Admin) | Generate new API key | - | `{ apiKey }` |
| POST | `/admin/settings/reset` | Private (Super Admin) | Reset to defaults | - | `{ settings }` |

---

## 12. NOTIFICATIONS

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Access | Description | Query | Response |
|--------|----------|--------|-------------|-------|----------|
| GET | `/notifications` | Private (All) | Get user notifications | Query: `type`, `unread`, `page` | `{ notifications[], total, unreadCount }` |
| PUT | `/notifications/:id/read` | Private (All) | Mark as read | - | `{ notification }` |
| PUT | `/notifications/read-all` | Private (All) | Mark all as read | - | `{ message }` |
| DELETE | `/notifications/:id` | Private (All) | Delete notification | - | `{ message }` |
| DELETE | `/notifications` | Private (All) | Delete selected | `ids[]` | `{ message }` |

---

## 13. FILE UPLOAD

### Upload Routes (`/api/upload`)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| POST | `/upload/profile-picture` | Private (All) | Upload profile picture | `file` (multipart) | `{ url }` |
| POST | `/upload/content-image` | Private (All) | Upload content image | `file` (multipart) | `{ url }` |
| POST | `/upload/content-video` | Private (All) | Upload content video | `file` (multipart) | `{ url }` |
| POST | `/upload/course-thumbnail` | Private (Mentor) | Upload course thumbnail | `file` (multipart) | `{ url }` |
| POST | `/upload/course-video` | Private (Mentor) | Upload course video | `file` (multipart) | `{ url }` |
| POST | `/upload/studio-files` | Private (All) | Upload studio request files | `files[]` (multipart) | `{ urls[] }` |
| POST | `/upload/engagement-screenshot` | Private (All) | Upload engagement proof | `file` (multipart) | `{ url }` |

---

## VALIDATION RULES SUMMARY

### Common Validations

- **Email:** Valid email format
- **URL:** Valid URL format (http/https)
- **Wallet Address:** Valid Ethereum address (0x...)
- **Text Fields:** Trim whitespace, max length enforced
- **File Uploads:** File type, file size validation
- **Dates:** Valid date format, future/past restrictions
- **Numbers:** Min/max range validation
- **Arrays:** Max items limit

### Role-Based Access Patterns

```typescript
// Public routes (no auth)
- /api/auth/twitter
- /api/auth/twitter/callback
- /api/auth/wallet/connect
- /api/auth/refresh

// All authenticated users
router.use(protect)

// Specific roles only
router.use(authorize('admin', 'super_admin'))

// Owner or Admin
if (userId !== ownerId && !userRoles.includes('admin')) {
  throw new AppError('Unauthorized', 403)
}

// Content creator can publish immediately, others draft only
if (!userRoles.includes('content_creator')) {
  content.status = 'draft'
}
```

---

## API RESPONSE FORMATS

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## TOTAL ENDPOINT COUNT

- **Auth & User Management:** 13 endpoints
- **J Hub (Content):** 17 endpoints
- **J Studio (Production):** 15 endpoints
- **J Academy (Courses):** 17 endpoints
- **J Info (Engagement):** 13 endpoints
- **J Alpha (Research):** 18 endpoints
- **Admin User/Role/Permission:** 15 endpoints
- **Admin Dynamic Content:** 30 endpoints (6 types × 5 operations)
- **Admin Content Moderation:** 14 endpoints
- **Admin Analytics & Logs:** 9 endpoints
- **Admin Settings:** 12 endpoints
- **Notifications:** 5 endpoints
- **File Upload:** 7 endpoints

**TOTAL: ~185 API endpoints**

---

**END OF API ENDPOINTS SPECIFICATION**
