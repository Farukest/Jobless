# JOBLESS ECOSYSTEM - UML SCHEMA V1

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     JOBLESS ECOSYSTEM                            │
│                                                                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐    │
│  │  J Center │  │   J Hub   │  │ J Studio │  │  J Academy │    │
│  │ (Profile) │  │ (Content) │  │ (Design) │  │ (Education)│    │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬─────┘    │
│        │              │              │                │          │
│        └──────────────┴──────────────┴────────────────┘          │
│                              │                                    │
│        ┌─────────────────────┴─────────────────────┐            │
│        │                                             │            │
│  ┌─────┴─────┐                              ┌───────┴──────┐    │
│  │  J Info   │                              │   J Alpha    │    │
│  │(Engagement)│                              │  (Research)  │    │
│  └───────────┘                              └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                             │
┌───────▼─────────┐                      ┌───────────▼──────────┐
│  Authentication │                      │    Blockchain Layer   │
│  - Twitter OAuth│                      │    - Base Network     │
│  - Wallet (EVM) │                      │    - Smart Contracts  │
└─────────────────┘                      └──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   MongoDB Database  │
                    │   - Users           │
                    │   - Content         │
                    │   - Transactions    │
                    └─────────────────────┘
```

## 1. USER & ROLE SYSTEM

### User Entity
```
User {
  _id: ObjectId

  // Authentication
  twitterId: String (unique)
  twitterUsername: String
  twitterAccessToken: String (encrypted)
  twitterRefreshToken: String (encrypted)
  twitterTokenExpiry: Date

  walletAddress: String (unique, optional)
  walletChainId: Number
  walletConnectedAt: Date
  whitelistWallets: [String] // Multiple wallets for presales

  // Profile
  profileImage: String
  displayName: String
  bio: String
  joinedAt: Date
  lastLogin: Date

  // Roles (array - user can have multiple roles)
  roles: [String] // ['member', 'content_creator', 'admin', 'super_admin', 'scout', 'mentor']

  // Permissions (dynamic - set by Super Admin)
  permissions: {
    canAccessJHub: Boolean
    canAccessJStudio: Boolean
    canAccessJAcademy: Boolean
    canAccessJInfo: Boolean
    canAccessJAlpha: Boolean
    canCreateContent: Boolean
    canModerateContent: Boolean
    canManageUsers: Boolean
    canManageRoles: Boolean
    canManageSiteSettings: Boolean
    customPermissions: [String]
  }

  // Stats
  jRankPoints: Number (optional - for gamification)
  contributionScore: Number
  contentCreated: Number
  interactionsGiven: Number

  // Settings
  theme: String // 'light' | 'dark'
  emailNotifications: Boolean

  status: String // 'active' | 'suspended' | 'banned'
  isEmailVerified: Boolean
  isTwitterVerified: Boolean
  isWalletVerified: Boolean
}
```

### Role Definitions
```
SuperAdmin {
  - Full system access
  - Manage all users, roles, permissions
  - Configure site settings (header, footer, theme)
  - Manage all content across all modules
  - View analytics and reports
  - Deploy smart contracts
  - Token distribution management
}

Admin {
  - Configurable permissions (set by Super Admin)
  - Can manage content creators
  - Moderate content
  - View reports
  - Manage J Info activities
}

ContentCreator {
  - Create content in J Hub
  - Submit production requests to J Studio
  - Access J Alpha for research
  - Participate in J Info engagement
}

Scout (J Alpha specific) {
  - Research and submit alpha opportunities
  - Vote on other alphas
  - Earn points for validated alphas
}

Mentor (J Academy specific) {
  - Create and deliver courses
  - Manage learners
  - Track student progress
}

Learner (J Academy specific) {
  - Enroll in courses
  - Track learning progress
  - Request new courses
}

Requester (J Academy specific) {
  - Request new educational content
  - Suggest course topics
}

Member {
  - Basic access to authorized modules
  - Can become Content Creator
}
```

## 2. J CENTER (User Profile Management)

### ProfileActivity
```
ProfileActivity {
  _id: ObjectId
  userId: ObjectId (ref: User)

  activityType: String // 'content_created', 'interaction_given', 'course_completed', etc.
  moduleSource: String // 'j_hub', 'j_studio', 'j_academy', 'j_info', 'j_alpha'

  description: String
  relatedEntityId: ObjectId
  relatedEntityType: String

  points: Number
  timestamp: Date
}
```

### UserStats
```
UserStats {
  _id: ObjectId
  userId: ObjectId (ref: User)

  // J Hub Stats
  hubContentsCreated: Number
  hubContentsViewed: Number

  // J Studio Stats
  studioRequestsSubmitted: Number
  studioRequestsCompleted: Number
  studioTasksCompleted: Number // If user is designer/editor

  // J Academy Stats
  coursesCreated: Number // If mentor
  coursesCompleted: Number // If learner
  coursesRequested: Number // If requester

  // J Info Stats
  tweetsSubmitted: Number
  interactionsGiven: Number
  interactionsReceived: Number

  // J Alpha Stats
  alphasSubmitted: Number // If scout
  alphasValidated: Number
  votesGiven: Number

  lastUpdated: Date
}
```

## 3. J HUB (Content Hub)

### Content
```
Content {
  _id: ObjectId

  authorId: ObjectId (ref: User)

  title: String (required)
  description: String
  contentType: String // 'video', 'thread', 'podcast', 'guide', 'tutorial'

  // Content Body
  body: String // Rich text or markdown
  mediaUrls: [{
    type: String // 'image', 'video', 'audio', 'document'
    url: String
    thumbnail: String
    duration: Number // For video/audio
    size: Number
  }]

  // Metadata
  tags: [String]
  category: String // 'airdrop', 'defi', 'nft', 'node', 'trading', etc.
  difficulty: String // 'beginner', 'intermediate', 'advanced'

  // Engagement
  views: Number
  likes: Number
  bookmarks: Number

  // Status
  status: String // 'draft', 'published', 'archived'
  publishedAt: Date
  createdAt: Date
  updatedAt: Date

  // Moderation
  moderatedBy: ObjectId (ref: User)
  moderatedAt: Date
  moderationNotes: String

  isFeatured: Boolean
  isPinned: Boolean
}
```

### ContentComment
```
ContentComment {
  _id: ObjectId
  contentId: ObjectId (ref: Content)
  userId: ObjectId (ref: User)

  comment: String
  parentCommentId: ObjectId (ref: ContentComment) // For nested comments

  likes: Number

  createdAt: Date
  updatedAt: Date

  status: String // 'active', 'deleted', 'moderated'
}
```

## 4. J STUDIO (Production Request System)

### ProductionRequest
```
ProductionRequest {
  _id: ObjectId

  requesterId: ObjectId (ref: User)

  requestType: String // 'cover_design', 'video_edit', 'logo_design', 'animation', etc.
  platform: String // 'twitter', 'farcaster', 'youtube', etc.

  title: String
  description: String
  requirements: String

  referenceFiles: [{
    url: String
    type: String
    name: String
  }]

  // Assignment
  assignedTo: ObjectId (ref: User) // Designer or Editor
  assignedAt: Date

  // Proposal
  proposalDescription: String
  proposalDeadline: Date
  proposalSubmittedAt: Date

  // Delivery
  deliveryFiles: [{
    url: String
    type: String
    name: String
    version: Number
  }]
  deliveredAt: Date

  // Feedback
  feedback: String
  rating: Number // 1-5

  // Status
  status: String // 'pending', 'proposal_sent', 'in_progress', 'delivered', 'completed', 'cancelled'

  // Points/Rewards
  pointsAwarded: Number

  createdAt: Date
  updatedAt: Date
}
```

### StudioMember
```
StudioMember {
  _id: ObjectId
  userId: ObjectId (ref: User)

  specialty: String // 'graphic_designer', 'video_editor', 'animator', '3d_artist'
  skills: [String]

  portfolio: [{
    title: String
    description: String
    mediaUrl: String
    projectDate: Date
  }]

  // Stats
  requestsCompleted: Number
  averageRating: Number
  totalPointsEarned: Number

  availability: String // 'available', 'busy', 'unavailable'

  joinedAt: Date
  isActive: Boolean
}
```

## 5. J ACADEMY (Education Platform)

### Course
```
Course {
  _id: ObjectId

  mentorId: ObjectId (ref: User)

  title: String
  description: String
  shortDescription: String

  category: String // 'design', 'video_editing', 'crypto_twitter', 'defi', 'node_setup', 'ai_tools'
  difficulty: String // 'beginner', 'intermediate', 'advanced'

  thumbnailUrl: String

  // Course Content
  modules: [{
    title: String
    description: String
    order: Number
    lessons: [{
      title: String
      contentType: String // 'video', 'text', 'quiz', 'assignment'
      contentUrl: String
      duration: Number // in minutes
      order: Number
    }]
  }]

  // Metadata
  duration: Number // Total duration in hours
  language: String
  prerequisites: [String]

  // Enrollment
  enrolledCount: Number
  completedCount: Number

  // Live Session (optional)
  isLiveSession: Boolean
  sessionDate: Date
  sessionLink: String
  maxParticipants: Number

  // Status
  status: String // 'draft', 'published', 'archived'
  publishedAt: Date
  createdAt: Date
  updatedAt: Date

  // Engagement
  averageRating: Number
  reviewsCount: Number
}
```

### CourseEnrollment
```
CourseEnrollment {
  _id: ObjectId

  courseId: ObjectId (ref: Course)
  learnerId: ObjectId (ref: User)

  enrolledAt: Date
  startedAt: Date
  completedAt: Date

  progress: Number // Percentage 0-100
  currentModule: Number
  currentLesson: Number

  completedLessons: [ObjectId]

  // Engagement
  rating: Number
  review: String
  reviewedAt: Date

  status: String // 'enrolled', 'in_progress', 'completed', 'dropped'
}
```

### CourseRequest
```
CourseRequest {
  _id: ObjectId

  requesterId: ObjectId (ref: User)

  title: String
  description: String
  category: String

  upvotes: Number
  upvotedBy: [ObjectId] // ref: User

  // Response
  assignedMentorId: ObjectId (ref: User)
  resultingCourseId: ObjectId (ref: Course)

  status: String // 'pending', 'approved', 'in_development', 'completed', 'rejected'

  createdAt: Date
  updatedAt: Date
}
```

## 6. J INFO (Interaction Center)

### EngagementPost
```
EngagementPost {
  _id: ObjectId

  submitterId: ObjectId (ref: User)

  platform: String // 'twitter', 'farcaster', etc.
  postUrl: String
  postType: String // 'tweet', 'cast', etc.

  campaignName: String // e.g., 'Kaito Quest #5'
  engagementType: String // 'like', 'retweet', 'comment', 'mention', etc.
  requiredActions: [String] // ['like', 'retweet', 'comment']

  description: String

  // Tracking
  submittedAt: Date
  engagementCount: Number
  participants: [{
    userId: ObjectId (ref: User)
    proofUrl: String // Their own tweet/interaction link
    engagedAt: Date
    pointsEarned: Number
  }]

  // Status
  status: String // 'active', 'completed', 'expired'
  expiresAt: Date

  // Moderation
  isVerified: Boolean
  verifiedBy: ObjectId (ref: User)
}
```

### UserEngagement
```
UserEngagement {
  _id: ObjectId

  userId: ObjectId (ref: User)
  engagementPostId: ObjectId (ref: EngagementPost)

  proofUrl: String
  screenshot: String

  engagedAt: Date
  verifiedAt: Date

  pointsEarned: Number

  status: String // 'pending', 'verified', 'rejected'
}
```

## 7. J ALPHA (Research & Alpha Hub)

### AlphaPost
```
AlphaPost {
  _id: ObjectId

  scoutId: ObjectId (ref: User)

  category: String // 'airdrop_radar', 'testnet_tracker', 'memecoin_calls', 'defi_signals'

  // Project Info
  projectName: String
  projectDescription: String
  blockchain: String

  potentialRating: String // 'low', 'medium', 'high', 'very_high'
  riskRating: String // 'low', 'medium', 'high'

  // Details
  details: String // Rich text
  requirements: String
  deadline: Date

  links: [{
    type: String // 'website', 'twitter', 'discord', 'docs'
    url: String
  }]

  // Engagement
  views: Number

  // Voting
  bullishVotes: Number
  bearishVotes: Number
  voters: [{
    userId: ObjectId (ref: User)
    vote: String // 'bullish' | 'bearish'
    votedAt: Date
  }]

  // Comments
  commentsCount: Number

  // Status
  status: String // 'pending', 'published', 'validated', 'rejected', 'archived'
  validatedAt: Date
  validatedBy: ObjectId (ref: User)

  // Tracking
  outcome: String // 'success', 'failure', 'ongoing'
  outcomeNotes: String

  createdAt: Date
  updatedAt: Date

  tags: [String]
}
```

### AlphaComment
```
AlphaComment {
  _id: ObjectId

  alphaPostId: ObjectId (ref: AlphaPost)
  userId: ObjectId (ref: User)

  comment: String

  likes: Number

  createdAt: Date
  status: String // 'active', 'deleted'
}
```

## 8. ADMIN & SITE MANAGEMENT

### SiteSettings
```
SiteSettings {
  _id: ObjectId

  // Header
  header: {
    logoUrl: String
    logoText: String
    navigationItems: [{
      label: String
      url: String
      order: Number
      isExternal: Boolean
      showForRoles: [String]
    }]
  }

  // Footer
  footer: {
    logoUrl: String
    description: String
    socialLinks: [{
      platform: String // 'twitter', 'github', 'discord', 'telegram'
      url: String
      icon: String
    }]
    footerLinks: [{
      title: String
      links: [{
        label: String
        url: String
      }]
    }]
  }

  // Theme
  theme: {
    primaryColor: String
    secondaryColor: String
    accentColor: String
    customCSS: String
  }

  // Modules
  modules: {
    jHub: {
      enabled: Boolean
      requiredRoles: [String]
      settings: Object
    }
    jStudio: {
      enabled: Boolean
      requiredRoles: [String]
      settings: Object
    }
    jCenter: {
      enabled: Boolean
      settings: Object
    }
    jAcademy: {
      enabled: Boolean
      requiredRoles: [String]
      settings: Object
    }
    jInfo: {
      enabled: Boolean
      requiredRoles: [String]
      settings: Object
    }
    jAlpha: {
      enabled: Boolean
      requiredRoles: [String]
      settings: Object
    }
  }

  // General
  siteName: String
  siteDescription: String
  maintenanceMode: Boolean

  updatedBy: ObjectId (ref: User)
  updatedAt: Date
}
```

### AdminLog
```
AdminLog {
  _id: ObjectId

  adminId: ObjectId (ref: User)
  action: String // 'user_updated', 'content_deleted', 'role_changed', 'settings_updated'

  targetType: String // 'user', 'content', 'course', etc.
  targetId: ObjectId

  changes: Object // Before and after values

  ipAddress: String
  userAgent: String

  timestamp: Date
}
```

## 9. BLOCKCHAIN INTEGRATION

### TokenTransaction
```
TokenTransaction {
  _id: ObjectId

  userId: ObjectId (ref: User)

  transactionType: String // 'reward', 'airdrop', 'presale', 'stake', 'claim'

  amount: Number
  tokenSymbol: String

  walletAddress: String

  // Blockchain
  chainId: Number
  txHash: String
  blockNumber: Number

  // Smart Contract
  contractAddress: String

  // Related Activity
  relatedModule: String // 'j_info', 'j_studio', 'j_alpha', etc.
  relatedEntityId: ObjectId

  status: String // 'pending', 'processing', 'completed', 'failed'

  createdAt: Date
  processedAt: Date

  errorMessage: String
}
```

### SmartContract
```
SmartContract {
  _id: ObjectId

  name: String
  contractType: String // 'token', 'distribution', 'staking', 'presale'

  chainId: Number
  chainName: String // 'Base'
  contractAddress: String

  abi: Object

  deployedBy: ObjectId (ref: User)
  deployedAt: Date
  deployTxHash: String

  isActive: Boolean

  metadata: Object
}
```

## 10. NOTIFICATION SYSTEM

### Notification
```
Notification {
  _id: ObjectId

  userId: ObjectId (ref: User)

  type: String // 'info', 'success', 'warning', 'engagement', 'system'
  category: String // 'content', 'course', 'production_request', 'alpha', 'engagement'

  title: String
  message: String

  relatedModule: String
  relatedEntityId: ObjectId
  relatedEntityType: String

  actionUrl: String

  isRead: Boolean
  readAt: Date

  createdAt: Date
}
```

## DATABASE RELATIONSHIPS

```
User (1) ──→ (N) Content [J Hub]
User (1) ──→ (N) ProductionRequest [J Studio]
User (1) ──→ (N) Course [J Academy - as Mentor]
User (1) ──→ (N) CourseEnrollment [J Academy - as Learner]
User (1) ──→ (N) EngagementPost [J Info]
User (1) ──→ (N) AlphaPost [J Alpha - as Scout]
User (1) ──→ (N) TokenTransaction [Blockchain]
User (1) ──→ (N) Notification
User (1) ──→ (1) UserStats

Content (1) ──→ (N) ContentComment
Course (1) ──→ (N) CourseEnrollment
EngagementPost (1) ──→ (N) UserEngagement
AlphaPost (1) ──→ (N) AlphaComment
```

## API ENDPOINTS STRUCTURE (Planned)

### Authentication
- POST /api/auth/twitter/login
- POST /api/auth/twitter/callback
- POST /api/auth/wallet/connect
- POST /api/auth/wallet/verify
- POST /api/auth/logout
- GET /api/auth/me

### J Center (Profile)
- GET /api/profile/:userId
- PUT /api/profile/update
- GET /api/profile/stats
- GET /api/profile/activity
- POST /api/profile/wallet/add
- DELETE /api/profile/wallet/remove

### J Hub (Content)
- GET /api/hub/content (with filters, pagination)
- GET /api/hub/content/:id
- POST /api/hub/content
- PUT /api/hub/content/:id
- DELETE /api/hub/content/:id
- POST /api/hub/content/:id/comment
- GET /api/hub/content/:id/comments

### J Studio (Production)
- GET /api/studio/requests
- GET /api/studio/requests/:id
- POST /api/studio/requests
- PUT /api/studio/requests/:id
- POST /api/studio/requests/:id/proposal
- POST /api/studio/requests/:id/deliver

### J Academy
- GET /api/academy/courses
- GET /api/academy/courses/:id
- POST /api/academy/courses
- PUT /api/academy/courses/:id
- POST /api/academy/courses/:id/enroll
- PUT /api/academy/enrollment/:id/progress
- POST /api/academy/course-requests
- GET /api/academy/my-courses

### J Info (Engagement)
- GET /api/info/posts
- GET /api/info/posts/:id
- POST /api/info/posts
- POST /api/info/posts/:id/engage
- GET /api/info/my-engagements

### J Alpha (Research)
- GET /api/alpha/posts
- GET /api/alpha/posts/:id
- POST /api/alpha/posts
- PUT /api/alpha/posts/:id
- POST /api/alpha/posts/:id/vote
- POST /api/alpha/posts/:id/comment
- GET /api/alpha/posts/:id/comments

### Admin
- GET /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- PUT /api/admin/users/:id/roles
- PUT /api/admin/users/:id/permissions
- GET /api/admin/settings
- PUT /api/admin/settings
- GET /api/admin/logs
- GET /api/admin/analytics

### Blockchain
- GET /api/blockchain/transactions
- POST /api/blockchain/distribute
- GET /api/blockchain/contracts

---

## SECURITY CONSIDERATIONS

1. **Authentication Security**
   - Twitter OAuth tokens encrypted at rest
   - Wallet signatures verified on server
   - JWT tokens with short expiry
   - Refresh token rotation
   - CSRF protection

2. **Data Validation**
   - Input sanitization for all user inputs
   - MongoDB injection prevention
   - XSS prevention (escape HTML)
   - File upload validation (type, size, malware scan)

3. **Access Control**
   - Role-based middleware
   - Permission-based route protection
   - Resource ownership verification
   - Rate limiting on all endpoints

4. **Blockchain Security**
   - Smart contract audited
   - Reentrancy guards
   - Access control on contract functions
   - Event logging for all transactions

---

## FRONTEND ROUTING STRUCTURE

```
/ (Home - Public landing)
/login (Twitter + Wallet Auth)

/center (J Center - User Profile)
  /center/profile
  /center/stats
  /center/activity
  /center/settings

/hub (J Hub - Content)
  /hub/feed
  /hub/create
  /hub/content/:id
  /hub/my-content

/studio (J Studio - Production)
  /studio/requests
  /studio/create-request
  /studio/request/:id
  /studio/my-requests
  /studio/team (for designers/editors)

/academy (J Academy - Education)
  /academy/courses
  /academy/course/:id
  /academy/my-courses
  /academy/create-course (mentor only)
  /academy/requests

/info (J Info - Engagement)
  /info/feed
  /info/submit
  /info/my-engagements

/alpha (J Alpha - Research)
  /alpha/feed
  /alpha/submit (scout only)
  /alpha/post/:id
  /alpha/my-alphas

/admin (Admin Panel - Role-based)
  /admin/dashboard
  /admin/users
  /admin/content
  /admin/roles
  /admin/permissions
  /admin/settings
  /admin/analytics
  /admin/logs
```

---

*This UML schema serves as the foundation for the Jobless Ecosystem. All modules are interconnected through the User entity and share common patterns for content creation, moderation, and engagement tracking.*

**Version:** 1.0
**Created:** 2025-11-17
**Status:** Foundation Complete - Ready for Implementation
