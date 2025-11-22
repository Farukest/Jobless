# JOBLESS PLATFORM - COMPLETE STRUCTURE

**Last Updated:** 2025-01-22
**Version:** 2.0 - Complete Rebuild with Real-time Features

---

## TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Role & Permission System](#role--permission-system)
3. [Authentication System](#authentication-system)
4. [Module Structure](#module-structure)
   - [J Hub - Content Center](#j-hub---content-center)
   - [J Studio - Design & Production](#j-studio---design--production)
   - [J Academy - Learning Platform](#j-academy---learning-platform)
   - [J Info - Engagement Tracking](#j-info---engagement-tracking)
   - [J Alpha - Early Project Research](#j-alpha---early-project-research)
   - [J Center - User Profile](#j-center---user-profile)
   - [Admin Panel](#admin-panel)
5. [Comment System](#comment-system)
6. [Badge System](#badge-system)
7. [WebSocket & Real-time Features](#websocket--real-time-features)
8. [Dynamic Content Management](#dynamic-content-management)
9. [Navigation & Layout](#navigation--layout)
10. [Component Library](#component-library)
11. [API Endpoints Summary](#api-endpoints-summary)

---

## PLATFORM OVERVIEW

**Jobless** is a comprehensive Web3 ecosystem platform for content creators, designers, learners, and researchers.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, React Query, Socket.IO Client
- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.IO Server
- **Authentication:** Twitter OAuth 2.0, Wallet Signature (ethers.js)
- **Real-time:** Socket.IO for live updates
- **File Storage:** Local uploads (backend/uploads)

**Core Modules:**
1. **J Hub** - Content sharing and discovery
2. **J Studio** - Design and video production requests
3. **J Academy** - Online learning and courses
4. **J Info** - Social media engagement tracking
5. **J Alpha** - Early-stage project research
6. **J Center** - User profile and achievements
7. **Admin Panel** - Platform management

---

## ROLE & PERMISSION SYSTEM

### 10 Platform Roles

| Role | Key | Description | Special Permissions |
|------|-----|-------------|---------------------|
| **Member** | `member` | Base role for all users | Access all modules |
| **Admin** | `admin` | Platform moderator | Moderate content, manage users |
| **Super Admin** | `super_admin` | Full platform control | All admin + system settings |
| **Content Creator** | `content_creator` | Hub content publisher | Publish content immediately (others draft) |
| **Designer** | `designer` | Studio design specialist | Claim design requests |
| **Video Editor** | `video_editor` | Studio video specialist | Claim video requests |
| **Requester** | `requester` | Academy course requester | Create course requests |
| **Learner** | `learner` | Academy student | Enroll in courses |
| **Mentor** | `mentor` | Academy instructor | Create and manage courses |
| **Scout** | `scout` | Alpha researcher | Submit alpha research posts |

### Permission Patterns

**Backend Middleware:**
```typescript
// All authenticated users
router.use(protect)

// Specific roles
router.use(authorize('admin', 'super_admin'))

// Owner or Admin check
if (userId !== ownerId && !userRoles.includes('admin')) {
  throw new AppError('Unauthorized', 403)
}
```

**Frontend Role Check:**
```typescript
const { user } = useAuth()

// Show button for specific roles
{user?.roles?.includes('mentor') && (
  <button>Create Course</button>
)}

// Conditional behavior
const canPublish = user?.roles?.includes('content_creator')
const status = canPublish ? 'published' : 'draft'
```

---

## AUTHENTICATION SYSTEM

### Twitter OAuth 2.0

**Flow:**
1. User clicks "Login with Twitter" → `/api/auth/twitter`
2. Twitter OAuth redirect → `http://localhost:5000/api/auth/twitter/callback`
3. Backend generates JWT tokens (access + refresh)
4. Redirect to frontend → `http://localhost:3000/auth/callback?accessToken=xxx&refreshToken=xxx`
5. Frontend saves tokens to localStorage
6. Redirect to `/center/profile`

**Backend Routes:**
```typescript
// backend/src/routes/auth.routes.ts
router.get('/twitter', passport.authenticate('twitter', { scope: ['tweet.read', 'users.read'] }))
router.get('/twitter/callback', passport.authenticate('twitter', { session: false }), twitterCallback)
```

**Frontend Pages:**
- `/login` - Login page with Twitter OAuth button
- `/auth/callback` - OAuth callback handler

### Wallet Authentication

**Flow:**
1. User connects wallet via RainbowKit
2. Frontend requests nonce → `POST /api/auth/wallet/connect`
3. User signs message with wallet
4. Frontend sends signature → `POST /api/auth/wallet/verify`
5. Backend validates signature, generates tokens
6. User logged in

**Backend Routes:**
```typescript
router.post('/wallet/connect', connectWallet)
router.post('/wallet/verify', protect, verifyWallet)
```

### Token Management

```typescript
// backend/src/routes/auth.routes.ts
router.post('/refresh', refreshAccessToken)  // Refresh access token
router.get('/me', protect, getCurrentUser)   // Get current user
router.post('/logout', protect, logout)      // Logout user
```

---

## MODULE STRUCTURE

### J HUB - CONTENT CENTER

**Purpose:** Content sharing platform for videos, threads, podcasts, guides, and tutorials.

**Access:** All members
**Special Role:** `content_creator` can publish immediately, others create drafts

#### Pages

**1. Hub Home** - `/hub`

**Layout:**
- Sticky header with filters and search
- Content grid (3 columns desktop, 2 tablet, 1 mobile)
- Infinite scroll pagination

**Features:**
- Filter by content type (Video, Thread, Podcast, Guide, Tutorial)
- Filter by category (dropdown, dynamic from admin)
- Search by title/description
- Sort by: Latest, Most Viewed, Most Liked
- Featured content carousel at top

**Content Card:**
```typescript
<div className="border rounded-lg overflow-hidden hover:shadow-lg transition-all">
  {/* Thumbnail */}
  <div className="aspect-video bg-muted relative">
    {media && <Image />}
    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
      {contentType}
    </div>
  </div>

  {/* Content Info */}
  <div className="p-4">
    <h3 className="font-semibold line-clamp-2">{title}</h3>
    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

    {/* Author */}
    <div className="flex items-center gap-2 mt-3">
      <Avatar />
      <span className="text-sm">{author.displayName}</span>
    </div>

    {/* Stats */}
    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
      <span>{viewsCount} views</span>
      <span>{likesCount} likes</span>
      <span>{commentsCount} comments</span>
    </div>
  </div>
</div>
```

**2. Content Detail** - `/hub/content/[id]`

**Layout:**
- Back button (supports middle-click)
- Content header (title, author, stats, actions)
- Content body (type-specific renderer)
- Comment section

**Content Renderers:**
- `VideoContent` - Video player with description
- `ThreadContent` - Twitter-style thread display
- `PodcastContent` - Audio player with chapters
- `GuideContent` - Rich text with sections
- `DefaultContent` - Fallback renderer

**Action Buttons:**
```typescript
<div className="flex items-center gap-4">
  <button onClick={handleLike}>
    <Heart fill={isLiked ? "currentColor" : "none"} />
    <span>{likesCount}</span>
  </button>

  <button onClick={handleBookmark}>
    <Bookmark fill={isBookmarked ? "currentColor" : "none"} />
    <span>{bookmarksCount}</span>
  </button>

  <button>
    <MessageCircle />
    <span>{commentsCount}</span>
  </button>

  <button onClick={() => navigator.share({})}>
    <Share2 />
  </button>
</div>
```

**Comment Section:**
- Twitter-style comment input
- Comment list with real-time updates
- Comment item with like, reply, delete (three-dot menu)
- Click comment to see replies

**3. Comment Detail** - `/hub/content/[id]/comment/[commentId]`

**Layout:**
- Back button to content page
- Parent comment display
- Reply input
- Replies list

**Features:**
- View single comment with all replies
- Reply to replies (nested conversations)
- Real-time reply updates via WebSocket
- Modal warning if comment deleted

**4. Create Content** - `/hub/create`

**Form Fields:**
```typescript
interface ContentForm {
  title: string           // Required, max 200 chars
  description: string     // Optional, max 500 chars
  contentType: string     // Dropdown (dynamic from admin)
  category: string        // Dropdown (dynamic from admin)
  body: string           // Optional, rich text editor
  mediaUrls: Array<{     // Multiple file upload
    type: 'image' | 'video' | 'audio' | 'document'
    url: string
    thumbnail?: string
    duration?: number
    size?: number
  }>
  tags: string[]         // Comma-separated input
  difficulty: string     // Radio: beginner, intermediate, advanced
}
```

**Submit Behavior:**
- `content_creator` → Status: `published`
- Others → Status: `draft` (requires admin approval)

**Backend API:**
```typescript
POST /api/hub/content
{
  title, description, contentType, category, body,
  mediaUrls, tags, difficulty
}

// Response
{
  success: true,
  data: content,
  message: canPublish ? "Content published!" : "Content submitted for review"
}
```

#### Real-time Features

**WebSocket Events:**
```typescript
// Like update
socket.on('likeUpdate', (data: { contentId, likesCount, isLiked, userId }) => {
  // Update like count in UI
})

// Bookmark update
socket.on('bookmarkUpdate', (data: { contentId, bookmarksCount, isBookmarked, userId }) => {
  // Update bookmark count in UI
})

// New comment
socket.on('newComment', (comment: Comment) => {
  // Add comment to list
})

// Comment deleted
socket.on('commentDeleted', (data: { commentId, deletedReplies[] }) => {
  // Remove comment from list
})
```

#### Components

**1. CommentItem** - `components/hub/comment-item.tsx`

**Props:**
```typescript
interface CommentItemProps {
  comment: Comment
  onLike?: (commentId: string) => void
  isLiked?: boolean
  contentAuthorId?: string
  commentDetailUrl?: string  // For middle-click navigation
  onReplyClick?: (comment: Comment) => void
}
```

**Features:**
- Profile avatar (Link to user profile)
- Profile name (Link to user profile)
- Timestamp (Link to comment detail if URL provided)
- Comment content (Link to comment detail if URL provided)
- Three-dot menu for delete (author or moderator only)
- Like and reply buttons
- "View more" for long comments
- Outside click detection for dropdown

**2. TwitterReplyInput** - `components/hub/twitter-reply-input.tsx`

**Props:**
```typescript
interface TwitterReplyInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  replyingTo?: string | string[]
  disabled?: boolean  // For deleted comments
}
```

**Features:**
- Auto-resize textarea
- Emoji picker
- Bold and italic formatting
- Character counter
- Cmd/Ctrl+Enter to submit
- Disabled state with warning message

---

### J STUDIO - DESIGN & PRODUCTION

**Purpose:** Design and video production request system.

**Access:** All members can request, `designer` and `video_editor` can claim

#### Pages

**1. Studio Home** - `/studio`

**Layout:**
- Tab navigation: "Browse Requests" | "My Requests" | "My Claims"
- Request grid
- Filter by request type
- Search by title

**Request Card:**
```typescript
<div className="border rounded-lg p-6">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Badge>{requestType}</Badge>
  </div>

  <div className="mt-4 flex items-center gap-2">
    <Avatar />
    <span className="text-sm">{requester.displayName}</span>
  </div>

  <div className="mt-4 flex justify-between items-center">
    <div className="text-sm text-muted-foreground">
      {deadline && `Deadline: ${formatDate(deadline)}`}
    </div>
    {canClaim && (
      <button className="btn-primary">Claim Request</button>
    )}
  </div>
</div>
```

**2. Create Request** - `/studio/create`

**Form:**
```typescript
interface StudioRequestForm {
  title: string              // Required
  description: string        // Required
  requestType: string        // Dropdown (dynamic from admin)
  referenceUrls: string[]   // Optional, multiple URL inputs
  deadline: Date            // Optional, date picker
  additionalNotes: string   // Optional, textarea
}
```

**3. Request Detail** - `/studio/requests/[id]`

**Features:**
- Request details display
- Claim button (for designers/video editors)
- File upload for deliverables
- Status tracking (pending, claimed, in progress, completed)
- Chat/comment system for Q&A

---

### J ACADEMY - LEARNING PLATFORM

**Purpose:** Online learning platform with courses and course requests.

**Access:** All members
**Special Roles:** `mentor` can create courses, `learner` can enroll, `requester` can request courses

#### Pages

**1. Academy Home** - `/academy`

**Layout:**
- Hero section with search
- Featured courses carousel
- Course grid with filters
- Categories sidebar

**Course Card:**
```typescript
<div className="border rounded-lg overflow-hidden hover:shadow-lg transition-all">
  <div className="aspect-video bg-muted">
    {thumbnail && <Image />}
  </div>

  <div className="p-4">
    <Badge>{category}</Badge>
    <h3 className="font-semibold mt-2 line-clamp-2">{title}</h3>
    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

    <div className="flex items-center gap-2 mt-3">
      <Avatar />
      <span className="text-sm">{instructor.displayName}</span>
    </div>

    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{enrolledCount} students</span>
        <span>{lessonsCount} lessons</span>
      </div>
      <Badge variant={difficulty}>{difficulty}</Badge>
    </div>
  </div>
</div>
```

**2. Course Detail** - `/academy/courses/[id]`

**Layout:**
- Course header (title, instructor, enroll button)
- Course overview tab
- Curriculum tab (lesson list)
- Reviews tab

**Enroll Button:**
- Not enrolled → "Enroll Now"
- Enrolled → "Continue Learning"
- Completed → "Review Course"

**3. Course Requests** - `/academy/requests`

**Features:**
- List of user-requested courses
- Voting system (upvote/downvote)
- Sort by votes, date
- Create new request button

**Request Card:**
```typescript
<div className="border rounded-lg p-6">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="flex flex-col items-center gap-1">
      <button onClick={handleUpvote}>
        <ChevronUp className={isUpvoted ? "text-primary" : ""} />
      </button>
      <span className="font-semibold">{votes}</span>
      <button onClick={handleDownvote}>
        <ChevronDown className={isDownvoted ? "text-primary" : ""} />
      </button>
    </div>
  </div>

  <div className="mt-4 flex items-center gap-2">
    <Avatar />
    <span className="text-sm">{requester.displayName}</span>
  </div>
</div>
```

**4. Create Course** - `/academy/create` (mentor only)

**Form:**
```typescript
interface CourseForm {
  title: string
  description: string
  category: string        // Dropdown (dynamic from admin)
  difficulty: string      // Radio: beginner, intermediate, advanced
  thumbnail: File         // Image upload
  lessons: Array<{
    title: string
    description: string
    videoUrl: string
    duration: number
    order: number
  }>
}
```

---

### J INFO - ENGAGEMENT TRACKING

**Purpose:** Track and manage social media engagements for points and rewards.

**Access:** All members

#### Pages

**1. Info Home** - `/info`

**Layout:**
- Leaderboard (top engagers)
- Submit engagement button
- My engagements list
- Filter by platform and type

**2. Submit Engagement** - `/info/submit`

**Form:**
```typescript
interface EngagementForm {
  platform: string          // Dropdown (dynamic from admin)
  engagementType: string   // Dropdown (dynamic from admin)
  url: string              // Required, proof URL
  description: string      // Optional
  screenshot: File         // Optional, proof image
}
```

**Platforms (Dynamic):**
- Twitter/X, Discord, Farcaster, Kaito, WallChain, Cookie, Zama

**Engagement Types (Dynamic):**
- Tweet, Retweet, Like, Comment, Follow, Join Community, Discord Role

**3. My Engagements** - `/info/my-engagements`

**Features:**
- List of submitted engagements
- Status badges (pending, approved, rejected)
- Points earned
- Filter by status

---

### J ALPHA - EARLY PROJECT RESEARCH

**Purpose:** Share and discover early-stage project research.

**Access:** All members view, `scout` and `admin` can submit

#### Pages

**1. Alpha Feed** - `/alpha`

**Layout:**
- Filter by category (dropdown)
- Sort by: Latest, Most Reactions, Most Comments
- Alpha post grid

**Alpha Post Card:**
```typescript
<div className="border rounded-lg p-6">
  <div className="flex justify-between items-start">
    <div>
      <Badge>{category}</Badge>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>

  {/* Project Info */}
  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
    <div>Website: <a href={projectUrl} className="text-primary">{projectUrl}</a></div>
    <div>Twitter: <a href={twitterUrl} className="text-primary">@{twitterHandle}</a></div>
  </div>

  {/* Reactions */}
  <div className="flex items-center gap-4 mt-4">
    <button onClick={() => handleReaction('fire')}>
      🔥 {reactions.fire}
    </button>
    <button onClick={() => handleReaction('eyes')}>
      👀 {reactions.eyes}
    </button>
    <button onClick={() => handleReaction('warning')}>
      ⚠️ {reactions.warning}
    </button>
    <button onClick={() => handleReaction('checkmark')}>
      ✅ {reactions.checkmark}
    </button>
  </div>

  {/* Voting */}
  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
    <button onClick={() => handleVote('bullish')} className={isBullish ? "text-green-500" : ""}>
      📈 Bullish ({bullishVotes})
    </button>
    <button onClick={() => handleVote('bearish')} className={isBearish ? "text-red-500" : ""}>
      📉 Bearish ({bearishVotes})
    </button>
  </div>

  {/* Author & Stats */}
  <div className="flex items-center justify-between mt-4">
    <div className="flex items-center gap-2">
      <Avatar />
      <span className="text-sm">{scout.displayName}</span>
    </div>
    <span className="text-sm text-muted-foreground">{commentsCount} comments</span>
  </div>
</div>
```

**2. Alpha Detail** - `/alpha/post/[id]`

**Layout:**
- Post header
- Full research content
- Reaction buttons
- Voting buttons
- Comment section

**3. Submit Alpha** - `/alpha/submit` (scout/admin only)

**Form:**
```typescript
interface AlphaPostForm {
  title: string
  description: string
  category: string       // Dropdown (dynamic from admin)
  projectName: string
  projectUrl: string
  twitterHandle: string
  content: string       // Rich text editor
  tags: string[]
}
```

**4. My Alphas** - `/alpha/my-alphas` (scout only)

**Features:**
- List of submitted alpha posts
- Edit/delete options
- View stats (reactions, votes, comments)

---

### J CENTER - USER PROFILE

**Purpose:** User profile management and achievement tracking.

**Access:** All members (own profile)

#### Pages

**1. My Profile** - `/center/profile`

**Layout:**
- Profile header (avatar, cover, display name, bio)
- Edit profile button
- Badge showcase (pinned badges + badge grid)
- Activity tabs (Content, Alpha, Engagements)

**Profile Header:**
```typescript
<div className="relative">
  {/* Cover Image */}
  <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5">
    {coverImage && <Image />}
  </div>

  {/* Profile Info */}
  <div className="container mx-auto px-4 -mt-16 relative">
    {/* Avatar */}
    <div className="w-32 h-32 rounded-lg border-4 border-background overflow-hidden">
      {profileImage ? <Image /> : <Initials />}
    </div>

    {/* Name & Bio */}
    <div className="mt-4">
      <h1 className="text-2xl font-bold">{displayName}</h1>
      {twitterUsername && <p className="text-muted-foreground">@{twitterUsername}</p>}
      {bio && <p className="mt-2">{bio}</p>}
    </div>

    {/* Social Links */}
    <div className="flex items-center gap-4 mt-4">
      {twitterUrl && <a href={twitterUrl}><Twitter /></a>}
      {linkedInUrl && <a href={linkedInUrl}><Linkedin /></a>}
      {githubUrl && <a href={githubUrl}><Github /></a>}
    </div>

    {/* Stats */}
    <div className="flex items-center gap-6 mt-4 text-sm">
      <span>{jRankPoints} J-Rank Points</span>
      <span>{badgesCount} Badges</span>
      <span>{followersCount} Followers</span>
    </div>
  </div>
</div>
```

**Badge Showcase:**
```typescript
{/* Pinned Badges (max 3) */}
<div className="mb-6">
  <h3 className="font-semibold mb-3">Pinned Badges</h3>
  <PinnedBadges badges={pinnedBadges} />
</div>

{/* All Badges Grid */}
<div>
  <h3 className="font-semibold mb-3">All Badges ({badgesCount})</h3>
  <BadgeGrid
    badges={userBadges}
    onBadgeClick={handleBadgeClick}
    size="md"
  />
</div>
```

**2. Other User Profile** - `/center/profile/[userId]`

**Features:**
- View-only profile
- See pinned badges and public badges
- View public activity
- Follow/Unfollow button (future)

**3. Profile Settings** - `/center/settings`

**Tabs:**
- Profile (edit display name, bio, avatar, cover)
- Social Links (Twitter, LinkedIn, GitHub, Website)
- Badges (pin/unpin badges, set badge visibility)
- Notifications (future)
- Privacy (future)

**Profile Edit Form:**
```typescript
interface ProfileForm {
  displayName: string
  bio: string
  profileImage: File
  coverImage: File
  twitterUsername: string
  twitterUrl: string
  linkedInUrl: string
  githubUrl: string
  websiteUrl: string
}
```

---

### ADMIN PANEL

**Purpose:** Platform management and moderation.

**Access:** `admin` and `super_admin` only

#### Navigation Sidebar

**Location:** `/admin/*` routes
**Component:** `AdminSidebar`

**Menu Items:**
```typescript
const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },

  // Content Management
  { name: 'Hub Content', href: '/admin/content', icon: FileText },
  { name: 'Alpha Posts', href: '/admin/alpha-posts', icon: TrendingUp },
  { name: 'Studio Requests', href: '/admin/studio-requests', icon: Paintbrush },
  { name: 'Academy Courses', href: '/admin/courses', icon: GraduationCap },
  { name: 'Engagements', href: '/admin/engagements', icon: Users },

  // User Management
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Roles', href: '/admin/roles', icon: Shield },
  { name: 'Permissions', href: '/admin/permissions', icon: Key },
  { name: 'Badges', href: '/admin/badges', icon: Award },

  // System
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Logs', href: '/admin/logs', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]
```

#### Pages

**1. Admin Dashboard** - `/admin/dashboard`

**Widgets:**
- Total users count
- Active users (last 30 days)
- Total content count (Hub, Alpha, Studio, Academy)
- Pending approvals count
- Recent activity feed

**2. Hub Content Management** - `/admin/content`

**Features:**
- List all Hub content (published, draft, rejected)
- Filter by status, type, category
- Search by title/author
- Approve/Reject drafts
- Edit/Delete content
- Create content (as admin)

**Actions:**
- Approve → Status: `published`
- Reject → Status: `rejected`
- Delete → Permanently remove
- Edit → Open edit modal

**3. Alpha Posts Management** - `/admin/alpha-posts`

**Features:**
- List all alpha posts
- Filter by category, author
- Edit/Delete posts
- View reactions and votes

**4. Studio Requests Management** - `/admin/studio-requests`

**Features:**
- View all requests
- Filter by type, status
- Assign to designers/editors
- Track progress

**5. Academy Courses Management** - `/admin/courses`

**Features:**
- List all courses
- Approve/Reject course submissions
- Edit/Delete courses
- View enrollment stats

**6. Engagement Management** - `/admin/engagements`

**Features:**
- List all submitted engagements
- Filter by platform, type, status
- Approve/Reject engagements
- Award points
- View proof screenshots

**Actions:**
- Approve → Status: `approved`, award points
- Reject → Status: `rejected`, reason modal

**7. User Management** - `/admin/users`

**Features:**
- List all users
- Search by name, email, wallet address
- Filter by role
- View user details
- Assign/Remove roles
- Ban/Unban users

**User Actions:**
- Edit Roles → Multi-select modal
- View Profile → Link to user profile
- Ban User → Disable account
- Reset Password → Send reset email (future)

**8. Role Management** - `/admin/roles`

**Features:**
- List all 10 roles
- View role permissions
- Edit role permissions (super_admin only)
- Assign roles to users

**Role Card:**
```typescript
<div className="border rounded-lg p-6">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold">{role.name}</h3>
      <p className="text-sm text-muted-foreground">{role.description}</p>
    </div>
    <Badge>{userCount} users</Badge>
  </div>

  <div className="mt-4">
    <h4 className="text-sm font-semibold mb-2">Permissions:</h4>
    <div className="flex flex-wrap gap-2">
      {permissions.map(perm => (
        <Badge key={perm} variant="secondary">{perm}</Badge>
      ))}
    </div>
  </div>

  {isSuperAdmin && (
    <button className="mt-4 text-sm text-primary">Edit Role</button>
  )}
</div>
```

**9. Permissions Management** - `/admin/permissions`

**Features:**
- View all permissions
- Create custom permissions (super_admin only)
- Assign permissions to roles

**Permission List:**
```typescript
const defaultPermissions = [
  'canModerateContent',
  'canManageUsers',
  'canManageRoles',
  'canViewAnalytics',
  'canManageSettings',
  'canDeleteComments',
  'canBanUsers',
]
```

**10. Badge Management** - `/admin/badges`

**Features:**
- View all 88 badges
- Filter by category, rarity, tier
- Award badges manually
- View badge stats (how many users earned)

**11. Analytics** - `/admin/analytics`

**Charts:**
- User growth over time
- Content creation trends
- Engagement metrics
- Most active users
- Popular content categories

**12. Activity Logs** - `/admin/logs`

**Features:**
- View all platform activity
- Filter by action type, user, date range
- Search logs

**Log Entry:**
```typescript
{
  timestamp: "2025-01-22T10:30:00Z",
  userId: "...",
  action: "content.create",
  resource: "content:abc123",
  details: {...},
  ipAddress: "...",
  userAgent: "..."
}
```

**13. Platform Settings** - `/admin/settings` (super_admin only)

**Tabs:**
- **General:** Platform name, logo, description
- **Authentication:** OAuth settings, wallet connection
- **Modules:** Enable/disable modules
- **Dynamic Content:** Manage dropdowns (Hub content types, Studio request types, etc.)
- **Email:** SMTP settings (future)
- **Storage:** File upload limits, allowed file types

**Dynamic Content Management:**
- Hub Content Types
- Studio Request Types
- Academy Categories
- Info Platforms
- Info Engagement Types
- Alpha Categories

---

## COMMENT SYSTEM

### Overview

Complete comment system with nested replies, real-time updates, and moderation.

### Features

- ✅ Create comments on Hub content, Alpha posts, Courses
- ✅ Reply to comments (nested conversations)
- ✅ Like comments
- ✅ Delete comments (author or moderator)
- ✅ Cascade delete (parent deletion deletes all child replies)
- ✅ Real-time WebSocket updates
- ✅ Comment detail page for viewing all replies
- ✅ Modal warning for deleted comments

### Database Model

**File:** `backend/src/models/Comment.model.ts`

```typescript
interface Comment {
  _id: string
  userId: User
  contentType: 'hub_content' | 'alpha_post' | 'course'
  contentId: string
  content: string               // Max 500 chars
  parentCommentId?: string      // For replies
  likes: number
  likedBy: string[]             // User IDs
  repliesCount: number
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

```typescript
// Get comments for content
GET /api/comments/:contentType/:contentId
// Response: { success: true, count: number, data: Comment[] }

// Get single comment
GET /api/comments/single/:commentId
// Response: { success: true, data: Comment }

// Get replies for comment
GET /api/comments/:commentId/replies
// Response: { success: true, count: number, data: Comment[] }

// Create comment
POST /api/comments/:contentType/:contentId
Body: { content: string, parentCommentId?: string }
// Response: { success: true, data: Comment }

// Like comment
POST /api/comments/:commentId/like
// Response: { success: true, data: { likes: number } }

// Delete comment
DELETE /api/comments/:commentId
// Authorization: Author or moderator only
// Cascade: Deletes all child replies
// Response: { success: true, message: "Comment deleted successfully" }
```

### Delete Logic

**Backend:** `backend/src/controllers/comment.controller.ts`

```typescript
export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Authorization check (author or moderator)
  const isAuthor = comment.userId.toString() === userId.toString()
  const isModerator = req.user.permissions.canModerateContent
  if (!isAuthor && !isModerator) {
    throw new AppError('Not authorized', 403)
  }

  // 2. Cascade delete logic
  let deletedReplies: string[] = []

  if (!comment.parentCommentId) {
    // Parent comment - delete all replies
    const replies = await Comment.find({ parentCommentId: id })
    deletedReplies = replies.map(r => r._id.toString())
    await Comment.deleteMany({ parentCommentId: id })

    // Decrement content's comment count
    await Content.findByIdAndUpdate(comment.contentId, { $inc: { commentsCount: -1 } })
  } else {
    // Reply - decrement parent's reply count
    await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } })
  }

  // 3. Delete the comment
  await comment.deleteOne()

  // 4. Emit WebSocket event
  emitCommentDeleted(id, contentId, contentType, parentCommentId, deletedReplies)

  res.status(200).json({ success: true, message: 'Comment deleted successfully' })
})
```

### WebSocket Events

**Backend:** `backend/src/socket/index.ts`

```typescript
// Multi-room emission for targeted updates
export const emitCommentDeleted = (
  commentId: string,
  contentId: string,
  contentType: string,
  parentCommentId: string | undefined,
  deletedReplies: string[]
) => {
  const data = { commentId, parentCommentId, deletedReplies }

  // 1. Content room - for content page listeners
  io.to(`content:${contentId}`).emit('commentDeleted', data)

  // 2. Parent comment room - for reply listeners
  if (parentCommentId) {
    io.to(`comment:${parentCommentId}`).emit('commentDeleted', data)
  }

  // 3. Own comment room - for modals open on this comment
  io.to(`comment:${commentId}`).emit('commentDeleted', data)
}

// Other comment events
emitNewComment(comment, contentId)           // When comment created
emitCommentLikeUpdate(commentId, likes, userId, isLiked)  // When comment liked
```

### Frontend Integration

**Content Page Listener:** `frontend/src/app/hub/content/[id]/page.tsx`

```typescript
useEffect(() => {
  const socket = getSocket()
  socket.emit('join:content', id)

  const handleCommentDeleted = (data: any) => {
    const { commentId, deletedReplies } = data
    const allDeletedIds = [commentId, ...deletedReplies]

    // Remove from cache
    queryClient.setQueryData(['comments', 'hub_content', id], (old: any) => ({
      ...old,
      count: old.count - allDeletedIds.length,
      data: old.data.filter(c => !allDeletedIds.includes(c._id))
    }))

    // Update content's comment count
    queryClient.setQueryData(['hub', 'content', id], (old: any) => ({
      ...old,
      data: { ...old.data, commentsCount: old.data.commentsCount - 1 }
    }))
  }

  socket.on('commentDeleted', handleCommentDeleted)

  return () => {
    socket.emit('leave:content', id)
    socket.off('commentDeleted', handleCommentDeleted)
  }
}, [id])
```

**Comment Detail Page:** `frontend/src/app/hub/content/[id]/comment/[commentId]/page.tsx`

```typescript
const handleCommentDeleted = (data: any) => {
  const { commentId: deletedId } = data

  // If parent comment deleted, redirect to content page
  if (deletedId === commentId) {
    router.push(`/hub/content/${contentId}`)
    return
  }

  // If modal open on deleted comment, show warning
  if (replyModalComment && deletedId === replyModalComment._id) {
    setIsModalCommentDeleted(true)
  }

  // Remove deleted reply from cache
  // ... update logic
}
```

### Modal Warning UI

**When replying to deleted comment:**

```tsx
{isModalCommentDeleted && (
  <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-500">...</svg>
      <p className="text-sm text-red-500 font-medium">
        This comment has been deleted
      </p>
    </div>
    <p className="text-xs text-red-500/70 mt-1 ml-7">
      You cannot reply to a deleted comment
    </p>
  </div>
)}

<TwitterReplyInput
  disabled={isModalCommentDeleted}
  placeholder={isModalCommentDeleted ? "Cannot reply to deleted comment" : "Post your reply..."}
/>
```

### Three-Dot Menu Pattern

**Delete button in comment header:**

```tsx
{canDelete && (
  <div className="ml-auto relative options-menu-container">
    <button onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
      <svg>...</svg> {/* Three dots */}
    </button>

    {showOptionsMenu && (
      <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg">
        <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500">
          <svg>...</svg> Delete
        </button>
      </div>
    )}
  </div>
)}
```

**Outside click detection:**

```tsx
useEffect(() => {
  if (!showOptionsMenu) return

  const handleClickOutside = (e: MouseEvent) => {
    if (!e.target.closest('.options-menu-container')) {
      setShowOptionsMenu(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [showOptionsMenu])
```

---

## BADGE SYSTEM

### Overview

Gamification system with 88 unique badges across 6 categories, automatically awarded based on user activities.

### Badge Categories

1. **Member Badges (15)** - General platform achievements
2. **Content Creator Badges (20)** - Hub content milestones
3. **Designer Badges (18)** - Studio production achievements
4. **Scout Badges (17)** - Alpha research contributions
5. **Admin Badges (10)** - Moderation and management
6. **Super Admin Badges (8)** - Platform leadership

### Rarity Levels

| Rarity | Count | Colors | Glow Effect |
|--------|-------|--------|-------------|
| Common | 30 | Gray/Basic | None |
| Rare | 18 | Blue/Green | Subtle |
| Epic | 19 | Purple/Cyan | Medium |
| Legendary | 11 | Gold/Orange | Strong + divine animation |

### Tier Levels

- `entry` - First badges in category
- `progress` - Mid-level achievements
- `mastery` - High-level achievements
- `elite` - Top-tier achievements
- `legendary` - Ultimate achievements
- `special` - Unique/time-limited badges

### Database Models

**Badge Model:** `backend/src/models/Badge.model.ts`

```typescript
interface Badge {
  _id: string
  name: string              // e.g., "Rookie"
  description: string
  icon: string              // SVG badge shape name
  category: 'general' | 'hub' | 'studio' | 'alpha' | 'admin'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  tier: 'entry' | 'progress' | 'mastery' | 'elite' | 'legendary' | 'special'
  criteria: {
    type: string            // e.g., 'content_count', 'like_count', 'jrank_points'
    target: number          // Required value
    operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq'
    contentType?: string
    additionalCriteria?: any
  }
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
}
```

**UserBadge Model:** `backend/src/models/UserBadge.model.ts`

```typescript
interface UserBadge {
  _id: string
  userId: string
  badgeId: Badge
  earnedAt: Date
  earnedFrom: string        // e.g., 'auto:content_count', 'manual:admin_award'
  isPinned: boolean         // Max 3 pinned
  isVisible: boolean        // Show on public profile
}
```

### Badge Service

**File:** `backend/src/services/badge.service.ts`

**Functions:**
```typescript
// Check and award role-based badges (called on login and role assignment)
checkRoleBadges(userId: string): Promise<void>

// Check activity badges for specific module
checkActivityBadges(userId: string, module: 'hub' | 'studio' | 'alpha'): Promise<void>

// Check all activity badges
checkAllActivityBadges(userId: string): Promise<void>

// Award badge to user (idempotent - won't duplicate)
awardBadge(userId: string, badgeId: string, earnedFrom: string): Promise<UserBadge | null>

// Get user's earned badges
getUserBadges(userId: string, onlyVisible?: boolean): Promise<UserBadge[]>

// Get pinned badges (max 3)
getPinnedBadges(userId: string): Promise<UserBadge[]>

// Pin/unpin badge
pinBadge(userId: string, badgeId: string): Promise<void>
unpinBadge(userId: string, badgeId: string): Promise<void>

// Toggle badge visibility
toggleBadgeVisibility(userId: string, badgeId: string): Promise<void>

// Get badge statistics
getBadgeStats(userId: string): Promise<{ total: number, byRarity: any, byCategory: any }>
```

### Badge Criteria Examples

```typescript
// Member Badge - Rookie (join platform)
{
  type: 'auto_awarded',
  target: 1,
  operator: 'gte'
}

// Content Creator Badge - First Post
{
  type: 'content_count',
  target: 1,
  operator: 'gte'
}

// Content Creator Badge - Viral Hit
{
  type: 'single_content_likes',
  target: 100,
  operator: 'gte'
}

// Member Badge - Point Collector
{
  type: 'jrank_points',
  target: 100,
  operator: 'gte'
}

// Admin Badge - Active Moderator
{
  type: 'moderation_actions',
  target: 50,
  operator: 'gte'
}
```

### Frontend Components

**Badge Display:** `frontend/src/components/badges/badge-display.tsx`

```typescript
// Single badge with size, rarity, glow
<BadgeDisplay badge={badge} size="md" onClick={handleClick} />

// Grid of badges
<BadgeGrid badges={badges} onBadgeClick={handleClick} size="sm" />

// Pinned badges showcase (max 3)
<PinnedBadges badges={pinnedBadges} />
```

**Badge Shapes:** `frontend/src/components/badges/badge-shapes.tsx`

```typescript
// Get SVG badge shape by icon name
const BadgeShape = getBadgeShape(badge.icon)

// Usage
<BadgeShape
  className="w-full h-full"
  gradientId={`badge-${badge._id}`}
  gradientStart={badge.colorScheme.primary}
  gradientEnd={badge.colorScheme.secondary}
/>
```

### API Endpoints

```typescript
// Get user's badges
GET /api/users/:id/badges
Query: onlyVisible (boolean)
// Response: { success: true, data: UserBadge[] }

// Get pinned badges
GET /api/users/:id/badges/pinned
// Response: { success: true, data: UserBadge[] }

// Pin badge
POST /api/users/badges/:badgeId/pin
// Response: { success: true, message: "Badge pinned" }

// Unpin badge
DELETE /api/users/badges/:badgeId/pin
// Response: { success: true, message: "Badge unpinned" }

// Toggle visibility
PATCH /api/users/badges/:badgeId/visibility
// Response: { success: true, data: { isVisible: boolean } }

// Get badge stats
GET /api/users/:id/badges/stats
// Response: { success: true, data: { total, byRarity, byCategory } }
```

### Integration Points

**1. Login** - `backend/src/controllers/auth.controller.ts`
```typescript
// After successful login
badgeService.checkRoleBadges(user._id).catch(err => console.error('Badge check error:', err))
```

**2. Role Assignment** - `backend/src/controllers/admin.controller.ts`
```typescript
// After assigning role
badgeService.checkRoleBadges(userId).catch(err => console.error('Badge check error:', err))
```

**3. Content Creation** - `backend/src/controllers/hub.controller.ts`
```typescript
// After creating content
badgeService.checkActivityBadges(userId, 'hub').catch(err => console.error('Badge check error:', err))
```

**Non-blocking:** All badge checks use `.catch()` to prevent errors from blocking user actions.

### Seed Script

**File:** `backend/src/scripts/seed-badges.ts`

**Run:**
```bash
cd backend && npx ts-node src/scripts/seed-badges.ts
```

**Creates:** All 88 badges with proper icons, colors, criteria, and metadata.

---

## WEBSOCKET & REAL-TIME FEATURES

### Server Setup

**File:** `backend/src/socket/index.ts`

**Initialization:**
```typescript
import { Server } from 'socket.io'
import http from 'http'

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
})

// Connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join content room
  socket.on('join:content', (contentId: string) => {
    socket.join(`content:${contentId}`)
  })

  // Leave content room
  socket.on('leave:content', (contentId: string) => {
    socket.leave(`content:${contentId}`)
  })

  // Join comment room
  socket.on('join:comment', (commentId: string) => {
    socket.join(`comment:${commentId}`)
  })

  // Leave comment room
  socket.on('leave:comment', (commentId: string) => {
    socket.leave(`comment:${commentId}`)
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

export { io }
```

### Client Setup

**File:** `frontend/src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
  }

  return socket
}
```

### Event Types

**1. Like Updates**
```typescript
// Backend emission
export const emitLikeUpdate = (contentId: string, likesCount: number, userId: string, isLiked: boolean) => {
  io.to(`content:${contentId}`).emit('likeUpdate', {
    contentId,
    likesCount,
    userId,
    isLiked
  })
}

// Frontend listener
socket.on('likeUpdate', (data: { contentId, likesCount, userId, isLiked }) => {
  // Update like count in UI
})
```

**2. Bookmark Updates**
```typescript
// Backend emission
export const emitBookmarkUpdate = (contentId: string, bookmarksCount: number, userId: string, isBookmarked: boolean) => {
  io.to(`content:${contentId}`).emit('bookmarkUpdate', {
    contentId,
    bookmarksCount,
    userId,
    isBookmarked
  })
}

// Frontend listener
socket.on('bookmarkUpdate', (data) => {
  // Update bookmark count in UI
})
```

**3. Comment Events**
```typescript
// New comment
export const emitNewComment = (comment: Comment, contentId: string) => {
  io.to(`content:${contentId}`).emit('newComment', comment)
}

// New reply
export const emitNewReply = (reply: Comment, parentCommentId: string) => {
  io.to(`comment:${parentCommentId}`).emit('newReply', reply)
}

// Comment like
export const emitCommentLikeUpdate = (commentId: string, likes: number, userId: string, isLiked: boolean) => {
  // Emit to all rooms that might have this comment
  io.emit('commentLikeUpdate', { commentId, likes, userId, isLiked })
}

// Comment deleted (see Comment System section)
emitCommentDeleted(commentId, contentId, contentType, parentCommentId, deletedReplies)
```

### Room Strategy

**Content Rooms:** `content:${contentId}`
- Used for: Content-level updates (likes, bookmarks, new comments)
- Joined by: Users viewing the content detail page

**Comment Rooms:** `comment:${commentId}`
- Used for: Comment-level updates (replies, likes, deletions)
- Joined by: Users viewing the comment detail page

**Multi-room Emission:**
- Allows targeted updates to specific viewers
- Reduces unnecessary network traffic
- Ensures all relevant clients receive updates

---

## DYNAMIC CONTENT MANAGEMENT

### Overview

Admin-controlled dropdown options for various platform features.

### Managed Content Types

**1. Hub Content Types** - `backend/src/models/HubContentType.model.ts`
```typescript
interface HubContentType {
  _id: string
  name: string              // e.g., "Video", "Thread"
  description: string
  isActive: boolean
  order: number
  createdAt: Date
}
```

**Default Types:** Video, Thread, Podcast, Guide, Tutorial

**Admin Page:** `/admin/settings` → Dynamic Content tab

**2. Studio Request Types** - `backend/src/models/StudioRequestType.model.ts`

**Default Types:** Cover Design, Logo Design, Banner Design, Video Editing, Thumbnail, Motion Graphics

**3. Academy Categories** - `backend/src/models/AcademyCategory.model.ts`

**Default Types:** Photoshop, Video Edit, Crypto Twitter, Web3, Node Setup, AI Tools, DeFi, NFTs

**4. Info Platforms** - `backend/src/models/InfoPlatform.model.ts`

**Default Types:** Twitter/X, Discord, Farcaster, Kaito, WallChain, Cookie, Zama

**5. Info Engagement Types** - `backend/src/models/InfoEngagementType.model.ts`

**Default Types:** Tweet, Retweet, Like, Comment, Follow, Join Community, Discord Role

**6. Alpha Categories** - `backend/src/models/AlphaCategory.model.ts`

**Default Types:** Airdrop Radar, Testnet Tracker, Memecoin Calls, DeFi Signals, NFT Launches

### API Endpoints

```typescript
// Get all types
GET /api/dynamic-content/:type
// type: 'hub-content-types' | 'studio-request-types' | 'academy-categories' | 'info-platforms' | 'info-engagement-types' | 'alpha-categories'
// Response: { success: true, data: ContentType[] }

// Create type (admin only)
POST /api/dynamic-content/:type
Body: { name, description, order }
// Response: { success: true, data: ContentType }

// Update type (admin only)
PUT /api/dynamic-content/:type/:id
Body: { name, description, isActive, order }
// Response: { success: true, data: ContentType }

// Delete type (admin only)
DELETE /api/dynamic-content/:type/:id
// Response: { success: true, message: "Type deleted" }
```

### Seed Script

**File:** `backend/src/scripts/seed-dynamic-content.ts`

**Run:**
```bash
cd backend && npx ts-node src/scripts/seed-dynamic-content.ts
```

**Creates:** All default types for all 6 categories.

### Usage in Forms

**Example - Hub Create:**
```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const { data: contentTypes } = useQuery({
  queryKey: ['hub-content-types'],
  queryFn: async () => {
    const { data } = await api.get('/dynamic-content/hub-content-types')
    return data.data
  }
})

// In form
<select name="contentType">
  {contentTypes?.map(type => (
    <option key={type._id} value={type.name}>{type.name}</option>
  ))}
</select>
```

---

## NAVIGATION & LAYOUT

### Header

**Component:** `frontend/src/components/layout/header.tsx`

**Features:**
- Sticky top positioning
- Logo (links to `/`)
- Navigation menu (Hub, Studio, Academy, Info, Alpha)
- Theme toggle (light/dark mode)
- Connect Wallet button (RainbowKit)
- Profile dropdown (supports middle-click navigation)

**Profile Dropdown:**
```tsx
<Link
  href="/center/profile"
  onClick={(e) => {
    // Left-click: Open dropdown
    if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setIsDropdownOpen(!isDropdownOpen)
    }
    // Ctrl/Cmd + click, middle-click: Navigate to profile
  }}
  onMouseDown={(e) => {
    // Prevent dropdown on middle-click
    if (e.button === 1) e.stopPropagation()
  }}
>
  {/* Profile image */}
</Link>
```

**Dropdown Menu:**
- Profile → `/center/profile`
- Admin Panel → `/admin/dashboard` (admin only)
- Logout

### Footer

**Component:** `frontend/src/components/layout/footer.tsx`

**Sections:**
- Logo
- Product links (Hub, Studio, Academy, Info, Alpha)
- Resource links (Documentation, Help, Terms, Privacy)
- Social links (Twitter, GitHub)
- Copyright notice

### Middle-Click Navigation Support

**Pattern:** All navigation links use `<Link>` component from Next.js for proper browser support.

**Supported Elements:**
- Profile avatar and name in comments
- Back buttons
- Comment content and timestamps (if detail URL provided)
- Header profile icon (with smart click handling)

**Example - Comment Navigation:**
```tsx
// Profile avatar
<Link href={`/center/profile/${userId}`} onClick={(e) => e.stopPropagation()}>
  <Avatar />
</Link>

// Timestamp
<Link href={commentDetailUrl} onClick={(e) => e.stopPropagation()}>
  {formatTimestamp(comment.createdAt)}
</Link>

// Comment content
<Link href={commentDetailUrl} onClick={(e) => e.stopPropagation()}>
  {comment.content}
</Link>
```

**Behavior:**
- Left-click: Normal navigation
- Ctrl/Cmd + click: Open in new tab
- Middle-click (scroll wheel): Open in new tab
- Right-click: Show context menu with "Open in new tab"

### Back Buttons

**Pattern:** Use `<Link>` instead of `<button onClick={() => router.push()}>`

```tsx
// Content page back to hub
<Link href="/hub" className="flex items-center gap-2">
  <svg>...</svg> Back to Hub
</Link>

// Comment detail back to content
<Link href={`/hub/content/${contentId}`} className="flex items-center gap-2">
  <svg>...</svg> Back to Content
</Link>
```

---

## COMPONENT LIBRARY

### UI Components

**Location:** `frontend/src/components/ui/`

**Components:**
- `button.tsx` - Button with variants (default, destructive, outline, ghost, link)
- `input.tsx` - Text input with label
- `textarea.tsx` - Textarea with auto-resize
- `select.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox with label
- `radio.tsx` - Radio button group
- `switch.tsx` - Toggle switch
- `badge.tsx` - Badge for labels and status
- `avatar.tsx` - User avatar with fallback
- `skeleton.tsx` - Loading skeleton
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menu
- `toast.tsx` - Toast notifications
- `tabs.tsx` - Tab navigation
- `logo.tsx` - Platform logo
- `theme-toggle.tsx` - Dark/light mode toggle

### Hub Components

**Location:** `frontend/src/components/hub/`

**Components:**
- `comment-item.tsx` - Single comment with actions
- `twitter-reply-input.tsx` - Twitter-style comment input
- `twitter-style-content.tsx` - Twitter-style content card
- `content-renderers/` - Content type specific renderers
  - `video-content.tsx` - Video player
  - `thread-content.tsx` - Twitter thread display
  - `podcast-content.tsx` - Audio player
  - `guide-content.tsx` - Rich text guide
  - `default-content.tsx` - Fallback renderer

### Badge Components

**Location:** `frontend/src/components/badges/`

**Components:**
- `badge-display.tsx` - Badge display utilities
  - `BadgeDisplay` - Single badge
  - `BadgeGrid` - Grid of badges
  - `PinnedBadges` - Pinned badges showcase
- `badge-shapes.tsx` - SVG badge shape library

### Admin Components

**Location:** `frontend/src/components/admin/`

**Components:**
- `admin-sidebar.tsx` - Admin navigation sidebar
- `create-content-modal.tsx` - Content creation modal
- `edit-role-modal.tsx` - Role editing modal

### Layout Components

**Location:** `frontend/src/components/layout/`

**Components:**
- `header.tsx` - Main header
- `footer.tsx` - Main footer
- `authenticated-layout.tsx` - Layout for authenticated pages

---

## API ENDPOINTS SUMMARY

**Full documentation:** See `API_ENDPOINTS.md` for complete API specification (~185 endpoints)

### Authentication

```
POST   /api/auth/twitter                    # Twitter OAuth login
GET    /api/auth/twitter/callback           # OAuth callback
POST   /api/auth/wallet/connect             # Wallet connect
POST   /api/auth/wallet/verify              # Verify wallet signature
POST   /api/auth/refresh                    # Refresh access token
GET    /api/auth/me                         # Get current user
POST   /api/auth/logout                     # Logout
```

### Hub Content

```
GET    /api/hub/content                     # List content (with filters)
GET    /api/hub/content/:id                 # Get single content
POST   /api/hub/content                     # Create content
PUT    /api/hub/content/:id                 # Update content
DELETE /api/hub/content/:id                 # Delete content
POST   /api/hub/content/:id/like            # Toggle like
POST   /api/hub/content/:id/bookmark        # Toggle bookmark
GET    /api/hub/featured                    # Get featured content
```

### Comments

```
GET    /api/comments/:contentType/:contentId        # Get comments
GET    /api/comments/single/:commentId              # Get single comment
GET    /api/comments/:commentId/replies             # Get replies
POST   /api/comments/:contentType/:contentId        # Create comment
POST   /api/comments/:commentId/like                # Toggle like
DELETE /api/comments/:commentId                     # Delete comment
```

### Users

```
GET    /api/users/:id                               # Get user profile
PUT    /api/users/profile                           # Update profile
GET    /api/users/:id/badges                        # Get badges
GET    /api/users/:id/badges/pinned                 # Get pinned badges
POST   /api/users/badges/:badgeId/pin               # Pin badge
DELETE /api/users/badges/:badgeId/pin               # Unpin badge
PATCH  /api/users/badges/:badgeId/visibility        # Toggle visibility
GET    /api/users/:id/badges/stats                  # Badge stats
```

### Admin

```
GET    /api/admin/users                             # List users
PUT    /api/admin/users/:id/roles                   # Update roles
DELETE /api/admin/users/:id                         # Delete user
GET    /api/admin/content                           # List all content
PUT    /api/admin/content/:id/approve               # Approve content
PUT    /api/admin/content/:id/reject                # Reject content
GET    /api/admin/analytics                         # Get analytics
GET    /api/admin/logs                              # Get activity logs
```

### Dynamic Content

```
GET    /api/dynamic-content/:type                   # Get types
POST   /api/dynamic-content/:type                   # Create type
PUT    /api/dynamic-content/:type/:id               # Update type
DELETE /api/dynamic-content/:type/:id               # Delete type
```

**Types:** `hub-content-types`, `studio-request-types`, `academy-categories`, `info-platforms`, `info-engagement-types`, `alpha-categories`

---

## SUMMARY

This document provides a complete overview of the Jobless platform structure as of 2025-01-22.

**Key Features:**
- ✅ 7 Core Modules (Hub, Studio, Academy, Info, Alpha, Center, Admin)
- ✅ 10-Role Permission System
- ✅ Dual Authentication (Twitter OAuth + Wallet)
- ✅ Comment System with Real-time Updates
- ✅ Badge System (88 badges, 6 categories)
- ✅ WebSocket Integration for Live Updates
- ✅ Dynamic Content Management (Admin-controlled dropdowns)
- ✅ Middle-Click Navigation Support
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Dark/Light Theme Support

**For detailed API documentation, see:** `API_ENDPOINTS.md`
**For implementation guide, see:** `CLAUDE.md`

---

**End of STRUCTURE.md**
