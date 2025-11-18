# JOBLESS PLATFORM STRUCTURE

## User Roles

### 1. Base Roles
- **user** - Temel kullanıcı rolü (tüm Jobless üyeleri)
- **admin** - Platform yöneticileri
- **super_admin** - Tam yetkili platform yöneticisi

### 2. J Hub Roles (İçerik Merkezi)
- **content_creator** - İçerik üreten Jobless üyeleri
  - Video içerik üreticileri
  - Thread yazarları
  - Podcast yapımcıları
  - Guide ve tutorial yazarları

### 3. J Studio Roles (Görsel İçerik Merkezi)
- **designer** - Görsel tasarım yapan Jobless tasarımcıları
  - Cover tasarımı
  - Logo tasarımı
  - Banner tasarımı
  - Social media görselleri
- **video_editor** - Video düzenleme yapan editörler
  - Twitter/Farcaster içerik videoları
  - Promotional videolar
  - Content montajı

### 4. J Academy Roles (Eğitim Platformu)
- **requester** - Eğitim programı talep eden topluluk üyeleri
  - Eğitim talebi oluşturur
  - Üyeleri teşvik eder
- **learner** - Eğitim alan Jobless üyeleri
  - Online/offline eğitimlere katılır
  - Sertifika kazanır
- **mentor** - Eğitim veren uzmanlar
  - Jobless tarafından doğrulanır
  - Photoshop & Tasarım
  - Video Edit
  - Kripto Twitter & Kişisel Marka
  - Web3 Araştırma & DeFi
  - Node Kurulum & Validatör
  - AI Araçları

### 5. J Info Roles (Etkileşim Merkezi)
- Özel rol yok - Tüm kullanıcılar katılabilir
- Sosyal medya etkileşim desteği
- Kaito, WallChain, Cookie, Zama vb. platform destekleri

### 6. J Alpha Roles (Erken Proje Araştırma)
- **scout** - Alpha caller'lar, erken proje araştırmacıları
  - Airdrop Radar
  - Testnet Tracker
  - Memecoin Calls
  - DeFi Signals

---

## Total Roles: 10

1. user
2. admin
3. super_admin
4. content_creator
5. designer
6. video_editor
7. requester
8. learner
9. mentor
10. scout

---

## Platform Pages & URLs

### 1. PUBLIC PAGES (Giriş Yapmadan Erişilebilir)
- `/` - Ana sayfa (Landing page)
- `/login` - Giriş sayfası (Twitter/Farcaster OAuth)
- `/about` - Hakkımızda
- `/terms` - Kullanım şartları
- `/privacy` - Gizlilik politikası

### 2. J CENTER (Kullanıcı Profil Merkezi)

- `/center` - Dashboard/Genel bakış (All authenticated users)
- `/center/profile` - Profil düzenleme (All authenticated users)
- `/center/settings` - Ayarlar (All authenticated users)
- `/center/stats` - İstatistikler (All authenticated users)
- `/center/activity` - Aktivite geçmişi (All authenticated users)

### 3. J HUB (İçerik Merkezi)

- `/hub` - Hub ana sayfa (All authenticated users)
- `/hub/content/:id` - İçerik detay sayfası (All authenticated users)
- `/hub/create` - Yeni içerik oluştur (All authenticated users - content_creator can publish immediately, others draft only)
- `/hub/my-content` - Benim içeriklerim (All authenticated users)

### 4. J STUDIO (Görsel İçerik Merkezi)

- `/studio` - Studio ana sayfa (All authenticated users)
- `/studio/create` - Yeni üretim talebi oluştur (All authenticated users)
- `/studio/request/:id` - Talep detay sayfası (All authenticated users - only designer/video_editor can claim)
- `/studio/my-requests` - Benim taleplerim (All authenticated users)
- `/studio/team` - Studio ekibi (All authenticated users)

### 5. J ACADEMY (Eğitim Platformu)

- `/academy` - Academy ana sayfa (All authenticated users)
- `/academy/courses` - Tüm kurslar (All authenticated users)
- `/academy/course/:id` - Kurs detay sayfası (All authenticated users)
- `/academy/my-courses` - Kayıtlı olduğum kurslar (All authenticated users - learner)
- `/academy/create` - Yeni kurs oluştur (mentor, admin, super_admin only)
- `/academy/requests` - Eğitim talepleri (All authenticated users - only requester can create request)

### 6. J INFO (Etkileşim Merkezi)

- `/info` - Info ana sayfa (All authenticated users)
- `/info/submit` - Yeni etkileşim gönderisi ekle (All authenticated users)
- `/info/my-engagements` - Benim etkileşimlerim (All authenticated users)

### 7. J ALPHA (Erken Proje Araştırma)

- `/alpha` - Alpha ana sayfa (All authenticated users)
- `/alpha/feed` - Alpha akışı (All authenticated users)
- `/alpha/post/:id` - Alpha post detay (All authenticated users)
- `/alpha/submit` - Yeni alpha gönder (scout, admin, super_admin only)
- `/alpha/my-alphas` - Benim alpha'larım (scout, admin, super_admin only)

### 8. ADMIN PANEL

- `/admin` - Admin dashboard redirect (admin, super_admin only)
- `/admin/dashboard` - Admin ana dashboard (admin, super_admin only)
- `/admin/users` - Kullanıcı yönetimi (admin, super_admin only)
- `/admin/roles` - Rol yönetimi (super_admin only)
- `/admin/permissions` - İzin yönetimi (super_admin only)
- `/admin/content` - J Hub içerik moderasyonu (admin, super_admin only)
- `/admin/courses` - J Academy kurs yönetimi (admin, super_admin only)
- `/admin/production` - J Studio üretim talepleri yönetimi (admin, super_admin only)
- `/admin/engagement` - J Info etkileşim yönetimi (admin, super_admin only)
- `/admin/alpha` - J Alpha post moderasyonu (admin, super_admin only)
- `/admin/analytics` - Platform analitiği (admin, super_admin only)
- `/admin/settings` - Site ayarları (super_admin only)
- `/admin/logs` - Admin log kayıtları (super_admin only)

### 9. NOTIFICATIONS & MISC

- `/notifications` - Bildirimler sayfası (All authenticated users)

---

## Total Pages: ~40

**Public Pages:** 5
**J Center Pages:** 5
**J Hub Pages:** 4
**J Studio Pages:** 5
**J Academy Pages:** 6
**J Info Pages:** 3
**J Alpha Pages:** 5
**Admin Pages:** 13
**Misc Pages:** 1

---

## Page Form & Input Structures

### 1. PUBLIC PAGES

#### `/` - Ana Sayfa (Landing Page)
**Access:** Public (Giriş gerekmez)

**Elements:**
- **BUTTON:** "Giriş Yap" → Redirects to `/login`
- **BUTTON:** "Hakkımızda" → Redirects to `/about`
- **STATIC CONTENT:** Platform tanıtımı, özellikler
- **NO FORMS**

#### `/login` - Giriş Sayfası
**Access:** Public

**Authentication Methods:**
- **BUTTON:** "Continue with Twitter" → OAuth redirect to `/api/auth/twitter`
- **BUTTON:** "Connect Wallet" → Opens RainbowKit modal for wallet connection

**Wallet Authentication Flow:**
- When wallet connected → Signature request modal appears
- **MODAL:** Sign message modal
  - **TEXT (read-only):** Message to sign (includes wallet address + timestamp)
  - **BUTTON:** "Send request" → Triggers wallet signature
  - **BUTTON:** "Cancel" → Close modal
- **SIGNATURE:** User signs message via wallet
- **API:** POST `/auth/wallet/connect` with signature
- **TOKENS:** Store accessToken + refreshToken in localStorage
- **REDIRECT:** After successful auth → `/` (home page)

**NO MANUAL INPUT FIELDS** (OAuth + Wallet signature only)

#### `/about` - Hakkımızda
**Access:** Public

**Elements:**
- **STATIC CONTENT:** Platform hakkında bilgi
- **NO FORMS**

#### `/terms` - Kullanım Şartları
**Access:** Public

**Elements:**
- **STATIC CONTENT:** Kullanım koşulları
- **NO FORMS**

#### `/privacy` - Gizlilik Politikası
**Access:** Public

**Elements:**
- **STATIC CONTENT:** Gizlilik bildirimi
- **NO FORMS**

---

### 2. J CENTER (Kullanıcı Profil Merkezi)

#### `/center` - Dashboard/Genel Bakış
**Access:** All authenticated users

**Display Elements:**
- **CARD:** Profil özeti (avatar, username, bio)
- **CARD:** İstatistikler widget (puanlar, rozetler)
- **CARD:** Son aktiviteler (timeline)
- **CARD:** Roller ve yetkiler
- **CARD:** Hızlı aksiyonlar (shortcuts to modules)
- **NO FORMS** (Display only)

**Quick Actions:**
- **BUTTON:** "Edit Profile" → `/center/profile`
- **BUTTON:** "View Stats" → `/center/stats`
- **BUTTON:** "Settings" → `/center/settings`

#### `/center/profile` - Profil Sayfası
**Access:** All authenticated users

**Profile Header Section:**
- **BUTTON (top-right):** Logout button → Clears tokens, disconnects wallet, redirects to `/login`
- **PROFILE IMAGE (clickable):**
  - **INPUT (file, hidden):** Image upload (jpg, png, max 5MB)
  - **ACTION:** Click image → Triggers file input
  - **API:** POST `/upload/profile-picture` → PUT `/users/profile-picture`
  - **LOADING STATE:** Spinner overlay during upload

**Edit Mode Toggle:**
- **BUTTON (icon):** Edit profile icon → Toggles edit mode
- **BUTTON:** "Save Changes" (visible in edit mode) → Saves profile data
- **BUTTON:** "Cancel" (visible in edit mode) → Discards changes

**Editable Fields (when in edit mode):**
- **INPUT (text):** Display Name (max 50 chars)
- **TEXTAREA:** Bio (max 500 chars, character counter shown)

**Read-Only Display:**
- **TEXT:** Twitter username (from OAuth, shown as @username)
- **TEXT:** Wallet address (truncated format: 0x1234...5678)
- **BADGES:** User roles (displayed as colored pills)

**Social Links Section:**
- **BUTTON (Twitter):** Link/Unlink Twitter profile
  - IF not linked → Prompt for username input → POST `/social-links/link`
  - IF linked → Confirm unlink → DELETE `/social-links/unlink/twitter`
  - Shows username on hover
- **BUTTON (LinkedIn):** Link/Unlink LinkedIn
  - IF not linked → OAuth redirect to `/api/auth/linkedin?token=JWT`
  - IF linked → Confirm unlink → DELETE `/social-links/unlink/linkedin`
- **BUTTON (GitHub):** Link/Unlink GitHub
  - IF not linked → OAuth redirect to `/api/auth/github?token=JWT`
  - IF linked → Confirm unlink → DELETE `/social-links/unlink/github`

**Stats Overview:**
- **CARD:** J-Rank Points (display only)
- **CARD:** Contribution Score (display only)

**Module Activity Stats:**
- **CARDS (5):** J Hub, J Studio, J Academy, J Alpha, J Info
  - Display: Module name, count, description
  - No edit functionality

**Personal Progress Map:**
- **PROGRESS BARS (5):** One for each module
  - Visual progress indicator
  - Percentage based on activity
  - Display only

**Recent Activity:**
- **LIST:** Activity timeline
  - Module, status, description, timestamp
  - **PAGINATION:** Previous/Next buttons
  - **SELECT:** Page navigation

**API Calls:**
- PUT `/users/profile` → Update displayName, bio
- POST `/upload/profile-picture` → Upload image
- PUT `/users/profile-picture` → Set new profile image URL
- POST `/social-links/link` → Link social account
- DELETE `/social-links/unlink/{platform}` → Unlink social account

**Validation:**
- Display name: max 50 chars
- Bio: max 500 chars, real-time character count
- Profile image: max 5MB, image formats only

#### `/center/settings` - Ayarlar
**Access:** All authenticated users

**Form Elements:**
- **SECTION:** Wallet Addresses
  - **INPUT (text):** Ethereum wallet address (optional, validation: 0x...)
  - **INPUT (text):** Solana wallet address (optional, validation: base58)
  - **INPUT (text):** Other chain addresses (optional)
  - **BUTTON:** "Add Wallet"
  - **BUTTON:** "Remove Wallet"

- **SECTION:** Whitelist Settings
  - **INPUT (text):** Discord username (optional)
  - **INPUT (text):** Telegram username (optional)
  - **CHECKBOX:** "Include me in whitelist campaigns"

- **SECTION:** Notification Preferences
  - **CHECKBOX:** Email notifications
  - **CHECKBOX:** Platform notifications
  - **CHECKBOX:** Hub content updates
  - **CHECKBOX:** Academy course updates
  - **CHECKBOX:** Alpha signals

- **SECTION:** Privacy
  - **RADIO:** Profile visibility (Public / Private / Friends only)
  - **CHECKBOX:** "Show my activity on feed"

- **BUTTON:** "Save All Settings"
- **BUTTON:** "Reset to Defaults"

**Actions:**
- **UPDATE:** User settings
- **CREATE:** New wallet address
- **DELETE:** Wallet address

#### `/center/stats` - İstatistikler
**Access:** All authenticated users

**Display Elements:**
- **CHART:** Aktivite grafiği (son 30 gün)
- **STAT CARD:** Total points earned
- **STAT CARD:** Content contributions (J Hub)
- **STAT CARD:** Courses completed (J Academy)
- **STAT CARD:** Engagement count (J Info)
- **STAT CARD:** Alpha submissions (J Alpha)
- **STAT CARD:** Studio requests completed
- **BADGE DISPLAY:** Earned badges/achievements
- **LEADERBOARD:** Ranking (optional)

**Filter Elements:**
- **SELECT:** Time range (7 days, 30 days, 90 days, All time)
- **SELECT:** Stats type (All, Hub, Academy, Info, Alpha, Studio)
- **NO EDIT FORMS** (Display only)

#### `/center/activity` - Aktivite Geçmişi
**Access:** All authenticated users

**Display Elements:**
- **TIMELINE:** Activity feed (chronological)
- **ACTIVITY ITEM:** Each activity with timestamp, type, description

**Filter Elements:**
- **INPUT (search):** Search activities (text)
- **SELECT:** Activity type (All, Hub, Academy, Info, Alpha, Studio, Profile)
- **DATE PICKER:** Date range filter (from - to)
- **BUTTON:** "Clear Filters"

**Pagination:**
- **BUTTON:** "Load More"
- **SELECT:** Items per page (10, 25, 50)

---

### 3. J HUB (İçerik Merkezi)

#### `/hub` - Hub Ana Sayfa
**Access:** All authenticated users

**Display Elements:**
- **GRID/LIST:** Content cards (title, thumbnail, author, views, likes)

**Filter & Search:**
- **INPUT (search):** Search content (title, tags, author)
- **SELECT:** Content type (All, Video, Thread, Podcast, Guide, Tutorial)
- **SELECT:** Category filter (multiple categories)
- **SELECT:** Difficulty (All, Beginner, Intermediate, Advanced)
- **SELECT:** Sort by (Newest, Most Viewed, Most Liked, Trending)
- **DATE PICKER:** Date range filter
- **BUTTON:** "Clear Filters"

**Actions:**
- **BUTTON:** "Create Content" → `/hub/create` (visible to all users)
- **CLICK:** Content card → `/hub/content/:id`

**Pagination:**
- **PAGINATION:** Page numbers
- **SELECT:** Items per page (12, 24, 48)

#### `/hub/content/:id` - İçerik Detay Sayfası
**Access:** All authenticated users

**Display Elements:**
- **MEDIA PLAYER:** Video/Podcast player (if applicable)
- **RICH TEXT:** Content body (for threads, guides, tutorials)
- **INFO:** Title, author, publish date, views, category, difficulty
- **TAGS:** Content tags (clickable)
- **AUTHOR CARD:** Author info with follow button

**Interaction Elements:**
- **BUTTON:** Like/Unlike (heart icon + count)
- **BUTTON:** Bookmark/Save
- **BUTTON:** Share (social media share options)
- **BUTTON:** Report (flag inappropriate content)

**Comments Section:**
- **TEXTAREA:** Add comment (max 1000 chars)
- **BUTTON:** "Post Comment"
- **COMMENT LIST:** Existing comments (nested replies support)
- **BUTTON (per comment):** Like, Reply, Report
- **SELECT:** Sort comments (Newest, Oldest, Most Liked)

**Role-Based Actions:**
- **IF author OR admin/super_admin:**
  - **BUTTON:** "Edit Content" → Edit mode
  - **BUTTON:** "Delete Content" → Confirmation modal

#### `/hub/create` - Yeni İçerik Oluştur
**Access:** All authenticated users

**Role-Based Behavior:**
- **content_creator** → Can publish immediately
- **Other roles** → Draft only (pending admin approval)

**Form Elements:**
- **INPUT (text):** Title (required, max 200 chars)
- **TEXTAREA:** Description (required, max 2000 chars)
- **SELECT:** Content type (Video, Thread, Podcast, Guide, Tutorial)
- **SELECT:** Category (required, dynamic based on platform categories)
- **SELECT:** Difficulty level (Beginner, Intermediate, Advanced)
- **INPUT (file):** Thumbnail image (optional, jpg/png, max 2MB)
- **INPUT (tags):** Tags (comma separated, max 10 tags)

**Conditional Fields (based on content type):**
- **IF Video:**
  - **INPUT (url):** Video URL (YouTube, Vimeo, etc.) (required)
  - **INPUT (number):** Duration (minutes) (optional)

- **IF Podcast:**
  - **INPUT (url):** Podcast URL (Spotify, Apple, etc.) (required)
  - **INPUT (number):** Duration (minutes) (optional)

- **IF Thread/Guide/Tutorial:**
  - **RICH TEXT EDITOR:** Content body (required, min 100 chars)
    - Formatting: Bold, Italic, Headers, Lists, Links, Code blocks
    - Image upload support (inline images)

**Action Buttons:**
- **BUTTON:** "Save as Draft" (available to all)
- **BUTTON:** "Publish" (for content_creator role)
- **BUTTON:** "Submit for Review" (for other roles)
- **BUTTON:** "Cancel" → Confirmation if unsaved changes

**Validation:**
- Real-time character count
- Required field validation
- URL validation
- Image size/format validation

#### `/hub/my-content` - Benim İçeriklerim
**Access:** All authenticated users

**Display Elements:**
- **TABS:** Published / Drafts / Pending Review / Rejected
- **GRID/LIST:** User's content items

**Filter & Search:**
- **INPUT (search):** Search my content
- **SELECT:** Content type filter
- **SELECT:** Sort by (Newest, Oldest, Most Viewed)
- **DATE PICKER:** Date range

**Actions (per content):**
- **BUTTON:** "Edit" → Edit mode
- **BUTTON:** "Delete" → Confirmation modal
- **BUTTON:** "View Stats" → Content analytics
- **BUTTON:** "Duplicate" → Create copy

---

### 4. J STUDIO (Görsel İçerik Merkezi)

#### `/studio` - Studio Ana Sayfa
**Access:** All authenticated users

**Display Elements:**
- **TABS:**
  - "All Requests" (default)
  - "My Requests" (user's own requests)
  - "Available Jobs" (for designers/video_editors)

**Filter & Search:**
- **INPUT (search):** Search requests (title, description)
- **SELECT:** Request type (All, Cover, Logo, Banner, Social Media, Video Edit)
- **SELECT:** Status (All, Open, In Progress, Completed, Cancelled)
- **SELECT:** Priority (All, Low, Medium, High, Urgent)
- **DATE PICKER:** Date range filter
- **BUTTON:** "Clear Filters"

**Display Cards (per request):**
- Title, type, status, priority, requester, deadline
- **BUTTON:** "View Details" → `/studio/request/:id`

**Actions:**
- **BUTTON:** "Create New Request" → `/studio/create`

**Role-Based Display:**
- **IF designer OR video_editor:**
  - Show "Available Jobs" tab
  - Show "Claim Request" button on open requests

#### `/studio/create` - Yeni Üretim Talebi Oluştur
**Access:** All authenticated users

**Form Elements:**
- **INPUT (text):** Request title (required, max 150 chars)
- **TEXTAREA:** Description (required, max 2000 chars)
- **SELECT:** Request type (required)
  - Cover Design
  - Logo Design
  - Banner Design
  - Social Media Graphics
  - Video Editing
  - Other
- **SELECT:** Priority (Low, Medium, High, Urgent)
- **DATE PICKER:** Deadline (required, must be future date)
- **INPUT (file):** Reference files/images (optional, multiple files, max 10MB total)
  - Accepted: jpg, png, pdf, ai, psd, mp4, mov
- **TEXTAREA:** Technical requirements (optional, max 1000 chars)
  - Dimensions, format, color scheme, etc.
- **INPUT (url):** Reference URLs (optional, comma separated)
- **CHECKBOX:** "I need this for a specific project"
  - **IF checked:** **INPUT (text):** Project name

**Action Buttons:**
- **BUTTON:** "Submit Request"
- **BUTTON:** "Save as Draft"
- **BUTTON:** "Cancel"

**Validation:**
- Required fields
- File size/type validation
- Date validation (deadline > today)

#### `/studio/request/:id` - Talep Detay Sayfası
**Access:** All authenticated users (view), role-based actions

**Display Elements:**
- **INFO SECTION:** Title, type, status, priority, deadline
- **REQUESTER INFO:** Avatar, name, contact
- **DESCRIPTION:** Full request description
- **TECHNICAL REQUIREMENTS:** Specifications
- **REFERENCE FILES:** Download links
- **REFERENCE URLS:** Clickable links
- **STATUS TIMELINE:** Request history (created, claimed, submitted, completed)

**Comment/Discussion Section:**
- **TEXTAREA:** Add comment/question
- **BUTTON:** "Post Comment"
- **COMMENT LIST:** Discussion thread

**Role-Based Actions:**

**IF Requester (owner):**
- **BUTTON:** "Edit Request" (only if status = Open)
- **BUTTON:** "Cancel Request" → Confirmation modal
- **BUTTON:** "Mark as Completed" (if status = Submitted)
- **BUTTON:** "Request Revision" (if status = Submitted)

**IF designer OR video_editor (not claimed):**
- **BUTTON:** "Claim This Request" (if status = Open)

**IF designer OR video_editor (claimed by user):**
- **INPUT (file):** Upload deliverable files (multiple, max 50MB)
- **TEXTAREA:** Delivery notes
- **BUTTON:** "Submit Work"
- **BUTTON:** "Unclaim Request" (if status = In Progress)

**IF admin OR super_admin:**
- **BUTTON:** "Reassign Request" → Modal with user selector
- **BUTTON:** "Change Priority"
- **BUTTON:** "Delete Request"

#### `/studio/my-requests` - Benim Taleplerim
**Access:** All authenticated users

**Display Elements:**
- **TABS:**
  - "Requests I Made" (as requester)
  - "Requests I Claimed" (as designer/editor)

**Filter & Search:**
- **INPUT (search):** Search
- **SELECT:** Status filter
- **SELECT:** Type filter
- **DATE PICKER:** Date range

**Actions (per request):**
- **BUTTON:** "View Details"
- **BUTTON:** "Edit" (if owner and status = Open)
- **BUTTON:** "Cancel" (if owner)

#### `/studio/team` - Studio Ekibi
**Access:** All authenticated users

**Display Elements:**
- **TABS:**
  - "Designers"
  - "Video Editors"

**Team Member Cards:**
- Avatar, name, specialization, completed projects count
- **BUTTON:** "View Profile"
- **BADGE:** Top contributor (if applicable)

**Filter:**
- **INPUT (search):** Search team members
- **SELECT:** Specialization filter
- **SELECT:** Sort by (Name, Projects Completed, Rating)

**Stats:**
- **STAT CARD:** Total designers
- **STAT CARD:** Total video editors
- **STAT CARD:** Total projects completed

---

### 5. J ACADEMY (Eğitim Platformu)

#### `/academy` - Academy Ana Sayfa
**Access:** All authenticated users

**Display Elements:**
- **HERO SECTION:** Featured courses (slider/carousel)
- **COURSE GRID:** All available courses
- **STATS:** Total courses, total students, total mentors

**Filter & Search:**
- **INPUT (search):** Search courses (title, description, mentor)
- **SELECT:** Category (All, Photoshop & Design, Video Edit, Crypto Twitter, Web3, Node Setup, AI Tools)
- **SELECT:** Difficulty (All, Beginner, Intermediate, Advanced)
- **SELECT:** Format (All, Online, Offline, Hybrid)
- **SELECT:** Status (All, Upcoming, Ongoing, Completed)
- **CHECKBOX:** "Free courses only"
- **BUTTON:** "Clear Filters"

**Actions:**
- **BUTTON:** "Browse All Courses" → `/academy/courses`
- **BUTTON:** "My Courses" → `/academy/my-courses`
- **BUTTON:** "Request a Course" → `/academy/requests` (for requesters)
- **BUTTON:** "Create Course" → `/academy/create` (for mentors)

#### `/academy/courses` - Tüm Kurslar
**Access:** All authenticated users

**Display Elements:**
- **GRID:** Course cards (thumbnail, title, mentor, duration, price, rating, student count)

**Filter & Search:**
(Same as `/academy` main page)

**Sort Options:**
- **SELECT:** Sort by (Newest, Most Popular, Highest Rated, Price Low-High, Price High-Low)

**Pagination:**
- **PAGINATION:** Page numbers
- **SELECT:** Courses per page (12, 24, 48)

**Actions (per course):**
- **CLICK:** Course card → `/academy/course/:id`

#### `/academy/course/:id` - Kurs Detay Sayfası
**Access:** All authenticated users

**Display Elements:**
- **HEADER:** Course title, thumbnail/cover image
- **INFO:** Category, difficulty, format, duration, price
- **MENTOR CARD:** Avatar, name, bio, courses taught
- **TABS:**
  - **Overview:** Course description, what you'll learn, requirements
  - **Curriculum:** Lesson/module list with durations
  - **Reviews:** Student reviews and ratings
  - **Announcements:** Course updates from mentor

**Enrollment Section:**
- **IF not enrolled:**
  - **BUTTON:** "Enroll Now" (if free) → Immediate enrollment
  - **BUTTON:** "Purchase Course" (if paid) → Payment modal
  - **DISPLAY:** Price, discount (if any)

- **IF enrolled:**
  - **BUTTON:** "Continue Learning" → Course player/materials
  - **PROGRESS BAR:** Course completion percentage
  - **BUTTON:** "Download Certificate" (if completed)

**Review Section (if enrolled):**
- **RATING:** Star rating (1-5 stars)
- **TEXTAREA:** Review text (max 1000 chars)
- **BUTTON:** "Submit Review"

**Role-Based Actions:**

**IF mentor (owner):**
- **BUTTON:** "Edit Course" → Edit mode
- **BUTTON:** "Manage Students" → Student list
- **BUTTON:** "Post Announcement"
- **BUTTON:** "Delete Course" → Confirmation

**IF admin OR super_admin:**
- **BUTTON:** "Approve/Reject Course"
- **BUTTON:** "Feature Course" → Add to homepage
- **BUTTON:** "Archive Course"

#### `/academy/my-courses` - Kayıtlı Olduğum Kurslar
**Access:** All authenticated users (learner role)

**Display Elements:**
- **TABS:**
  - "In Progress" (enrolled, not completed)
  - "Completed" (finished courses)
  - "Wishlist" (saved for later)

**Course Cards:**
- Thumbnail, title, mentor, progress bar, last accessed date
- **BUTTON:** "Continue" → Course player
- **BUTTON:** "View Certificate" (if completed)
- **BUTTON:** "Remove from List"

**Filter & Sort:**
- **INPUT (search):** Search my courses
- **SELECT:** Sort by (Recently Accessed, Progress, Enrollment Date)

#### `/academy/create` - Yeni Kurs Oluştur
**Access:** mentor role only

**Form Elements:**

**SECTION:** Basic Information
- **INPUT (text):** Course title (required, max 150 chars)
- **TEXTAREA:** Short description (required, max 500 chars)
- **RICH TEXT EDITOR:** Full description (required, min 200 chars)
- **INPUT (file):** Course thumbnail/cover (required, jpg/png, max 2MB)
- **INPUT (file):** Course intro video (optional, mp4, max 100MB)

**SECTION:** Course Details
- **SELECT:** Category (required)
  - Photoshop & Tasarım
  - Video Edit
  - Kripto Twitter & Kişisel Marka
  - Web3 Araştırma & DeFi
  - Node Kurulum & Validatör
  - AI Araçları
- **SELECT:** Difficulty level (Beginner, Intermediate, Advanced)
- **SELECT:** Format (Online, Offline, Hybrid)
- **INPUT (number):** Total duration (hours) (required)
- **INPUT (text):** Language (default: TR)
- **INPUT (number):** Max students (optional, 0 = unlimited)

**SECTION:** Pricing
- **RADIO:** Pricing type (Free / Paid)
- **IF Paid:**
  - **INPUT (number):** Price (required, min: 0)
  - **INPUT (number):** Discount percentage (optional, 0-100)

**SECTION:** Curriculum Builder
- **BUTTON:** "Add Module/Section"
- **PER MODULE:**
  - **INPUT (text):** Module title
  - **BUTTON:** "Add Lesson"
  - **PER LESSON:**
    - **INPUT (text):** Lesson title
    - **INPUT (number):** Duration (minutes)
    - **SELECT:** Type (Video, Reading, Quiz, Assignment)
    - **INPUT (file/url):** Content upload/link
    - **CHECKBOX:** "Preview lesson" (free preview)
  - **DRAG & DROP:** Reorder lessons
- **DRAG & DROP:** Reorder modules

**SECTION:** Requirements & Learning Outcomes
- **TEXTAREA:** Prerequisites (max 1000 chars)
- **TEXTAREA:** What students will learn (bulleted list, max 2000 chars)
- **TEXTAREA:** Who this course is for (max 1000 chars)

**SECTION:** Schedule (for live/offline courses)
- **DATE PICKER:** Start date
- **DATE PICKER:** End date
- **TIME PICKER:** Class times (if applicable)
- **INPUT (text):** Location (for offline courses)

**Action Buttons:**
- **BUTTON:** "Save as Draft"
- **BUTTON:** "Submit for Review" (admin approval required)
- **BUTTON:** "Publish" (if mentor has permission)
- **BUTTON:** "Cancel"

**Validation:**
- Required field checks
- Curriculum must have at least 1 module and 3 lessons
- File size/type validation
- Date validation (start < end)

#### `/academy/requests` - Eğitim Talepleri
**Access:** All authenticated users

**Role-Based Views:**

**FOR requesters:**
- **BUTTON:** "Create New Request" → Request form modal

**Request Form (requester role):**
- **INPUT (text):** Requested course topic (required, max 150 chars)
- **TEXTAREA:** Why this course is needed (required, max 1000 chars)
- **SELECT:** Category (same as course categories)
- **SELECT:** Preferred format (Online, Offline, Hybrid, No Preference)
- **INPUT (number):** Estimated interested members (optional)
- **BUTTON:** "Submit Request"

**Display Elements:**
- **LIST:** Course requests (sorted by votes)
- **PER REQUEST:**
  - Title, description, category, requester, vote count, status
  - **BUTTON:** "Upvote" (all users can vote)
  - **BUTTON:** "Comment" → Discussion thread
  - **IF requester (owner):**
    - **BUTTON:** "Edit Request"
    - **BUTTON:** "Delete Request"
  - **IF mentor:**
    - **BUTTON:** "I can teach this" → Express interest
  - **IF admin:**
    - **SELECT:** Change status (Pending, Approved, In Development, Fulfilled, Rejected)

**Filter & Sort:**
- **INPUT (search):** Search requests
- **SELECT:** Status filter
- **SELECT:** Category filter
- **SELECT:** Sort by (Most Voted, Newest, Most Discussed)

---

### 6. J INFO (Etkileşim Merkezi)

#### `/info` - Info Ana Sayfa
**Access:** All authenticated users

**Display Elements:**
- **HERO SECTION:** Active campaigns banner
- **CAMPAIGN CARDS:** Current engagement opportunities
  - Platform name (Kaito, WallChain, Cookie, Zama, etc.)
  - Task description
  - Points/rewards
  - Deadline
  - **BUTTON:** "Participate" → Task details

**Stats Dashboard:**
- **STAT CARD:** Total engagements by user
- **STAT CARD:** Points earned
- **STAT CARD:** Active campaigns
- **STAT CARD:** Leaderboard rank

**Recent Engagements:**
- **LIST:** User's recent submissions (last 10)
- Status badges (Pending, Approved, Rejected)

**Actions:**
- **BUTTON:** "Submit Engagement" → `/info/submit`
- **BUTTON:** "My Engagements" → `/info/my-engagements`

#### `/info/submit` - Yeni Etkileşim Gönderisi Ekle
**Access:** All authenticated users

**Form Elements:**
- **SELECT:** Platform (required)
  - Kaito
  - WallChain
  - Cookie
  - Zama
  - Twitter/X General
  - Farcaster
  - Discord
  - Other

- **SELECT:** Engagement type (required)
  - Tweet/Post
  - Retweet/Recast
  - Like/React
  - Comment/Reply
  - Follow
  - Join Community
  - Other

- **INPUT (url):** Proof URL (required)
  - Tweet URL, post link, screenshot link, etc.
  - Validation: Must be valid URL

- **INPUT (text):** Campaign/Task reference (optional)
  - If submitting for specific campaign

- **TEXTAREA:** Additional notes (optional, max 500 chars)

- **INPUT (file):** Screenshot proof (optional but recommended, jpg/png, max 5MB)

**Action Buttons:**
- **BUTTON:** "Submit for Review"
- **BUTTON:** "Cancel"

**Validation:**
- Required fields
- URL format validation
- File size/type check
- Duplicate submission check (same URL)

#### `/info/my-engagements` - Benim Etkileşimlerim
**Access:** All authenticated users

**Display Elements:**
- **TABS:**
  - "All" (all submissions)
  - "Pending" (awaiting review)
  - "Approved" (accepted)
  - "Rejected" (declined)

**Engagement List:**
- **TABLE/CARDS:** Submission history
  - Columns: Platform, Type, Submitted Date, Status, Points Earned, Proof Link
  - **BUTTON (per row):** "View Details" → Modal with full info
  - **IF Rejected:** Show rejection reason

**Filter & Search:**
- **INPUT (search):** Search submissions
- **SELECT:** Platform filter
- **SELECT:** Type filter
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Sort Options:**
- **SELECT:** Sort by (Newest, Oldest, Points High-Low, Status)

**Stats Summary:**
- **STAT:** Total submissions
- **STAT:** Approval rate (%)
- **STAT:** Total points earned
- **STAT:** Current rank

**Export:**
- **BUTTON:** "Export to CSV" (download submission history)

---

### 7. J ALPHA (Erken Proje Araştırma)

#### `/alpha` - Alpha Ana Sayfa
**Access:** All authenticated users

**Display Elements:**
- **HERO:** Latest alpha highlights (featured posts)
- **TABS:**
  - "All Alphas"
  - "Airdrop Radar"
  - "Testnet Tracker"
  - "Memecoin Calls"
  - "DeFi Signals"

**Quick Stats:**
- **STAT:** Total alpha posts (last 7 days)
- **STAT:** Active projects tracked
- **STAT:** Success rate (%)

**Actions:**
- **BUTTON:** "View Feed" → `/alpha/feed`
- **BUTTON:** "Submit Alpha" → `/alpha/submit` (scout role)
- **BUTTON:** "My Alphas" → `/alpha/my-alphas`

#### `/alpha/feed` - Alpha Akışı
**Access:** All authenticated users

**Display Elements:**
- **FEED:** Alpha post cards (reverse chronological)
- **PER POST:**
  - Title, category badge, project name, scout avatar/name
  - Description preview (truncated)
  - Tags, timestamp, view count, reaction count
  - **BUTTON:** "Read More" → `/alpha/post/:id`
  - **BUTTON:** Reactions (🔥 Fire, 👀 Eyes, ⚠️ Warning, ✅ Verified)
  - **BUTTON:** Bookmark

**Filter & Search:**
- **INPUT (search):** Search alphas (title, project, tags)
- **SELECT:** Category (All, Airdrop, Testnet, Memecoin, DeFi)
- **SELECT:** Risk level (All, Low, Medium, High)
- **SELECT:** Status (All, Active, Completed, Dead)
- **CHECKBOX:** "Verified only" (admin/scout verified)
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Sort Options:**
- **SELECT:** Sort by (Newest, Most Viewed, Most Reactions, Trending)

**Pagination:**
- **INFINITE SCROLL** or **PAGINATION**

#### `/alpha/post/:id` - Alpha Post Detay
**Access:** All authenticated users

**Display Elements:**
- **HEADER:** Title, category badge, status badge
- **PROJECT INFO:**
  - Project name, website, socials (Twitter, Discord, etc.)
  - Chain/blockchain
  - Launch date (if applicable)
- **RICH TEXT CONTENT:** Full alpha description
  - Research details
  - Steps to participate
  - Requirements
  - Potential rewards
  - Risk assessment
- **TAGS:** Clickable tags
- **SCOUT INFO:** Author card (avatar, name, reputation, verified badge)
- **METADATA:** Posted date, last updated, views, reactions

**Interaction Elements:**
- **REACTIONS:** 🔥👀⚠️✅ (click to react, see count)
- **BUTTON:** Bookmark/Save
- **BUTTON:** Share (Twitter, copy link)
- **BUTTON:** Report (flag inappropriate/scam)

**Updates Section:**
- **LIST:** Chronological updates from scout
- **IF post owner (scout):**
  - **TEXTAREA:** Add update
  - **BUTTON:** "Post Update"

**Discussion/Comments:**
- **TEXTAREA:** Add comment (max 1000 chars)
- **BUTTON:** "Post Comment"
- **COMMENT LIST:** Nested comments/replies
- **BUTTON (per comment):** Like, Reply, Report

**Role-Based Actions:**

**IF scout (owner):**
- **BUTTON:** "Edit Post" → Edit mode
- **SELECT:** Update status (Active, Completed, Dead)
- **BUTTON:** "Delete Post" → Confirmation

**IF admin OR super_admin:**
- **BUTTON:** "Verify Post" → Add verified badge
- **BUTTON:** "Feature Post" → Pin to top
- **BUTTON:** "Remove Post"

#### `/alpha/submit` - Yeni Alpha Gönder
**Access:** scout role only

**Form Elements:**

**SECTION:** Project Information
- **INPUT (text):** Alpha title (required, max 150 chars)
- **INPUT (text):** Project name (required, max 100 chars)
- **SELECT:** Category (required)
  - Airdrop Radar
  - Testnet Tracker
  - Memecoin Call
  - DeFi Signal
- **SELECT:** Blockchain/Chain (required)
  - Ethereum, Solana, Arbitrum, Base, etc.
- **INPUT (url):** Project website (optional)
- **INPUT (url):** Twitter/X URL (optional)
- **INPUT (url):** Discord invite (optional)
- **INPUT (url):** Documentation URL (optional)

**SECTION:** Alpha Details
- **RICH TEXT EDITOR:** Full description (required, min 200 chars)
  - What is the project?
  - How to participate?
  - Requirements (wallet, Discord, Twitter, etc.)
  - Potential rewards
  - Deadlines/timeline
- **SELECT:** Risk level (Low, Medium, High) (required)
- **DATE PICKER:** Deadline (optional)
- **INPUT (tags):** Tags (comma separated, max 10)

**SECTION:** Verification
- **CHECKBOX:** "I have verified this information"
- **CHECKBOX:** "I am not affiliated with this project" (anti-shill)
- **TEXTAREA:** Verification notes (optional, for transparency)

**Action Buttons:**
- **BUTTON:** "Submit Alpha" (pending admin review)
- **BUTTON:** "Save as Draft"
- **BUTTON:** "Cancel"

**Validation:**
- Required field checks
- URL format validation
- Minimum content length
- Tag limit enforcement

#### `/alpha/my-alphas` - Benim Alpha'larım
**Access:** scout role only

**Display Elements:**
- **TABS:**
  - "Published" (approved alphas)
  - "Drafts" (unpublished)
  - "Pending Review" (awaiting approval)
  - "Rejected" (declined by admin)

**Alpha List:**
- **TABLE/CARDS:** User's alpha submissions
  - Title, category, status, views, reactions, posted date
  - **BUTTON:** "View" → `/alpha/post/:id`
  - **BUTTON:** "Edit" (if draft or owner)
  - **BUTTON:** "Delete" → Confirmation
  - **IF Rejected:** Show rejection reason

**Filter & Sort:**
- **INPUT (search):** Search my alphas
- **SELECT:** Category filter
- **SELECT:** Status filter
- **DATE PICKER:** Date range
- **SELECT:** Sort by (Newest, Most Viewed, Most Reactions)

**Stats Summary:**
- **STAT:** Total alphas posted
- **STAT:** Total views
- **STAT:** Total reactions
- **STAT:** Success rate (active/completed vs dead)

---

### 8. ADMIN PANEL

#### `/admin/dashboard` - Admin Ana Dashboard
**Access:** admin & super_admin only

**Display Elements:**

**Stats Overview:**
- **STAT CARD:** Total users
- **STAT CARD:** New users (last 7 days)
- **STAT CARD:** Total content (Hub)
- **STAT CARD:** Pending approvals (all modules)
- **STAT CARD:** Active courses
- **STAT CARD:** Studio requests (open)
- **STAT CARD:** Alpha posts (last 7 days)
- **STAT CARD:** Engagement submissions (pending)

**Charts:**
- **LINE CHART:** User growth (last 30 days)
- **BAR CHART:** Content by module
- **PIE CHART:** User role distribution

**Recent Activity Feed:**
- **LIST:** Latest platform activities (last 20)
  - User registrations
  - Content publications
  - Course enrollments
  - etc.

**Quick Actions:**
- **BUTTON:** "Manage Users" → `/admin/users`
- **BUTTON:** "Moderate Content" → `/admin/content`
- **BUTTON:** "View Reports" → `/admin/analytics`

**NO FORMS** (Dashboard display only)

#### `/admin/users` - Kullanıcı Yönetimi
**Access:** admin & super_admin only

**Display Elements:**
- **TABLE:** User list
  - Columns: Avatar, Username, Email/Social, Roles, Status, Joined Date, Last Active, Actions

**Filter & Search:**
- **INPUT (search):** Search users (username, email, Twitter, Farcaster)
- **SELECT:** Role filter (All, User, Content Creator, Designer, etc.)
- **SELECT:** Status filter (All, Active, Suspended, Banned)
- **DATE PICKER:** Joined date range
- **BUTTON:** "Clear Filters"

**Sort Options:**
- **SELECT:** Sort by (Newest, Username A-Z, Last Active, Role)

**Actions (per user):**
- **BUTTON:** "View Profile" → User detail modal
- **BUTTON:** "Edit Roles" → Role assignment modal
- **BUTTON:** "Suspend/Activate" → Toggle user status
- **BUTTON (super_admin only):** "Delete User" → Confirmation

**Bulk Actions:**
- **CHECKBOX:** Select multiple users
- **SELECT:** Bulk action (Assign Role, Suspend, Export)
- **BUTTON:** "Apply"

**Create User (super_admin only):**
- **BUTTON:** "Add User Manually" → User creation modal
- **MODAL FORM:**
  - **INPUT (text):** Username
  - **INPUT (email):** Email
  - **SELECT:** Initial role
  - **BUTTON:** "Create"

**Export:**
- **BUTTON:** "Export User List" → CSV download

#### `/admin/roles` - Rol Yönetimi
**Access:** super_admin only

**Display Elements:**
- **TABLE:** Role list
  - Columns: Role Name, Description, User Count, Permissions, Actions

**Actions (per role):**
- **BUTTON:** "View Details" → Role detail modal
- **BUTTON:** "Edit Permissions" → Permission editor
- **BUTTON (super_admin only):** "Delete Role" → Confirmation (if no users)

**Create Role:**
- **BUTTON:** "Create New Role" → Role creation modal
- **MODAL FORM:**
  - **INPUT (text):** Role name (required, unique)
  - **INPUT (text):** Role key (required, unique, lowercase_underscore)
  - **TEXTAREA:** Description (optional)
  - **CHECKBOX GROUP:** Permissions (select from available permissions)
  - **BUTTON:** "Create Role"

**Permission Editor Modal:**
- **CHECKBOX GROUP:** All available permissions organized by module
  - J Hub: create_content, edit_own_content, delete_own_content, publish_immediately, etc.
  - J Studio: create_request, claim_request, submit_work, etc.
  - J Academy: create_course, enroll_course, issue_certificate, etc.
  - J Info: submit_engagement, approve_engagement, etc.
  - J Alpha: submit_alpha, verify_alpha, feature_alpha, etc.
  - Admin: manage_users, manage_roles, view_analytics, etc.
- **BUTTON:** "Save Permissions"
- **BUTTON:** "Cancel"

#### `/admin/permissions` - İzin Yönetimi
**Access:** super_admin only

**Display Elements:**
- **TABLE:** Permission list
  - Columns: Permission Name, Key, Module, Description, Assigned Roles, Actions

**Filter:**
- **SELECT:** Module filter (All, Hub, Studio, Academy, Info, Alpha, Admin)
- **INPUT (search):** Search permissions

**Actions (per permission):**
- **BUTTON:** "Edit" → Edit permission modal
- **BUTTON:** "View Roles" → List of roles with this permission

**Create Permission:**
- **BUTTON:** "Create New Permission" → Permission creation modal
- **MODAL FORM:**
  - **INPUT (text):** Permission name (required)
  - **INPUT (text):** Permission key (required, unique, lowercase_underscore)
  - **SELECT:** Module (required)
  - **TEXTAREA:** Description (required)
  - **BUTTON:** "Create Permission"

#### `/admin/content` - J Hub İçerik Moderasyonu
**Access:** admin & super_admin

**Display Elements:**
- **TABS:**
  - "Pending Review" (awaiting approval)
  - "Published" (approved content)
  - "Rejected" (declined content)
  - "Reported" (flagged by users)

**Table View:**
- **TABLE:** Content list
  - Columns: Thumbnail, Title, Author, Type, Category, Submitted Date, Status, Actions

**Filter & Search:**
- **INPUT (search):** Search content (title, author, tags)
- **SELECT:** Content type filter
- **SELECT:** Category filter
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Actions (per content):**
- **BUTTON:** "View" → Content preview modal
- **BUTTON:** "Approve" → Publish content (if pending)
- **BUTTON:** "Reject" → Rejection modal (requires reason)
- **BUTTON:** "Edit" → Edit content
- **BUTTON:** "Delete" → Confirmation modal
- **BUTTON:** "Feature" → Add to featured/homepage

**Rejection Modal:**
- **TEXTAREA:** Rejection reason (required, will be sent to author)
- **CHECKBOX:** "Notify author via email"
- **BUTTON:** "Confirm Rejection"

**Bulk Actions:**
- **CHECKBOX:** Select multiple content items
- **SELECT:** Bulk action (Approve, Reject, Delete, Feature)
- **BUTTON:** "Apply"

#### `/admin/courses` - J Academy Kurs Yönetimi
**Access:** admin & super_admin

**Display Elements:**
- **TABS:**
  - "All Courses"
  - "Pending Approval"
  - "Published"
  - "Drafts"
  - "Archived"

**Table View:**
- **TABLE:** Course list
  - Columns: Thumbnail, Title, Mentor, Category, Students, Status, Created Date, Actions

**Filter & Search:**
- **INPUT (search):** Search courses (title, mentor, description)
- **SELECT:** Category filter
- **SELECT:** Status filter
- **SELECT:** Format filter (Online, Offline, Hybrid)
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Actions (per course):**
- **BUTTON:** "View" → Course detail page
- **BUTTON:** "Approve" → Publish course (if pending)
- **BUTTON:** "Reject" → Rejection modal
- **BUTTON:** "Edit" → Edit course
- **BUTTON:** "Archive" → Archive course
- **BUTTON:** "Feature" → Add to featured courses
- **BUTTON:** "Delete" → Confirmation modal

**Course Detail Modal/Page:**
- Full course information
- Curriculum view
- Student list (enrolled users)
- **BUTTON:** "Export Student List" → CSV
- **BUTTON:** "Send Announcement to Students" → Email/notification

**Bulk Actions:**
- **CHECKBOX:** Select multiple courses
- **SELECT:** Bulk action (Approve, Archive, Feature)
- **BUTTON:** "Apply"

#### `/admin/production` - J Studio Üretim Talepleri Yönetimi
**Access:** admin & super_admin

**Display Elements:**
- **TABS:**
  - "All Requests"
  - "Open" (unclaimed)
  - "In Progress" (claimed, being worked on)
  - "Submitted" (awaiting requester approval)
  - "Completed"
  - "Cancelled"

**Table View:**
- **TABLE:** Production request list
  - Columns: Title, Type, Requester, Assigned To, Priority, Status, Deadline, Actions

**Filter & Search:**
- **INPUT (search):** Search requests (title, requester, assigned)
- **SELECT:** Type filter
- **SELECT:** Status filter
- **SELECT:** Priority filter
- **DATE PICKER:** Deadline range
- **BUTTON:** "Clear Filters"

**Actions (per request):**
- **BUTTON:** "View" → Request detail modal
- **BUTTON:** "Reassign" → Assign to different designer/editor
- **BUTTON:** "Change Priority" → Update priority
- **BUTTON:** "Change Status" → Manual status update
- **BUTTON:** "Delete" → Confirmation modal

**Reassign Modal:**
- **SELECT:** Assign to user (filter by role: designer/video_editor)
- **TEXTAREA:** Reassignment note (optional)
- **BUTTON:** "Reassign"

**Stats Summary:**
- **STAT:** Total requests
- **STAT:** Average completion time
- **STAT:** Completion rate (%)
- **STAT:** Active designers/editors

#### `/admin/engagement` - J Info Etkileşim Yönetimi
**Access:** admin & super_admin

**Display Elements:**
- **TABS:**
  - "Pending Review" (awaiting approval)
  - "Approved"
  - "Rejected"
  - "All Submissions"

**Table View:**
- **TABLE:** Engagement submission list
  - Columns: User, Platform, Type, Proof URL, Submitted Date, Status, Points, Actions

**Filter & Search:**
- **INPUT (search):** Search submissions (user, URL)
- **SELECT:** Platform filter
- **SELECT:** Type filter
- **SELECT:** Status filter
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Actions (per submission):**
- **BUTTON:** "View Proof" → Open URL in new tab / view screenshot
- **BUTTON:** "Approve" → Approve submission modal
- **BUTTON:** "Reject" → Rejection modal
- **BUTTON:** "Delete" → Confirmation

**Approve Modal:**
- **INPUT (number):** Points to award (default: campaign points)
- **TEXTAREA:** Admin note (optional)
- **BUTTON:** "Confirm Approval"

**Reject Modal:**
- **TEXTAREA:** Rejection reason (required, visible to user)
- **BUTTON:** "Confirm Rejection"

**Bulk Actions:**
- **CHECKBOX:** Select multiple submissions
- **SELECT:** Bulk action (Approve, Reject, Delete)
- **BUTTON:** "Apply"

**Stats:**
- **STAT:** Total submissions (all time)
- **STAT:** Pending review count
- **STAT:** Approval rate (%)
- **STAT:** Total points awarded

**Campaign Management:**
- **BUTTON:** "Manage Campaigns" → Campaign list
- **BUTTON:** "Create Campaign" → Campaign creation form
  - **INPUT (text):** Campaign name
  - **SELECT:** Platform
  - **TEXTAREA:** Description
  - **INPUT (number):** Points per engagement
  - **DATE PICKER:** Start/End dates
  - **BUTTON:** "Create"

#### `/admin/alpha` - J Alpha Post Moderasyonu
**Access:** admin & super_admin

**Display Elements:**
- **TABS:**
  - "Pending Review" (awaiting approval)
  - "Published"
  - "Rejected"
  - "Reported" (flagged by users)
  - "Featured"

**Table View:**
- **TABLE:** Alpha post list
  - Columns: Title, Scout, Category, Risk Level, Status, Views, Reactions, Submitted Date, Actions

**Filter & Search:**
- **INPUT (search):** Search alphas (title, project, scout)
- **SELECT:** Category filter
- **SELECT:** Risk level filter
- **SELECT:** Status filter
- **CHECKBOX:** "Verified only"
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Actions (per alpha):**
- **BUTTON:** "View" → Alpha detail page
- **BUTTON:** "Approve" → Publish alpha
- **BUTTON:** "Reject" → Rejection modal
- **BUTTON:** "Verify" → Add verified badge
- **BUTTON:** "Feature" → Pin to top of feed
- **BUTTON:** "Unfeature" → Remove from featured
- **BUTTON:** "Delete" → Confirmation modal
- **BUTTON:** "Ban Author" → Suspend scout (if scam/spam)

**Verification Modal:**
- **CHECKBOX:** "Mark as verified"
- **TEXTAREA:** Verification note (internal, optional)
- **BUTTON:** "Verify"

**Rejection Modal:**
- **TEXTAREA:** Rejection reason (required)
- **CHECKBOX:** "This is spam/scam" (flag author)
- **BUTTON:** "Confirm Rejection"

**Bulk Actions:**
- **CHECKBOX:** Select multiple alphas
- **SELECT:** Bulk action (Approve, Verify, Feature, Delete)
- **BUTTON:** "Apply"

**Stats:**
- **STAT:** Total alpha posts
- **STAT:** Pending review
- **STAT:** Success rate (active/completed)
- **STAT:** Flagged/reported count

#### `/admin/analytics` - Platform Analitiği
**Access:** admin & super_admin

**Display Elements:**

**Time Range Selector:**
- **SELECT:** Time range (Last 7 days, Last 30 days, Last 90 days, Last year, All time, Custom)
- **IF Custom:**
  - **DATE PICKER:** Start date
  - **DATE PICKER:** End date
  - **BUTTON:** "Apply"

**Overview Stats:**
- **STAT CARD:** Total users (with growth %)
- **STAT CARD:** Active users (with growth %)
- **STAT CARD:** Total content (all modules)
- **STAT CARD:** Platform engagement rate

**Charts & Graphs:**

**User Analytics:**
- **LINE CHART:** User registration trend
- **PIE CHART:** User role distribution
- **BAR CHART:** Users by acquisition source (Twitter, Farcaster)
- **TABLE:** Top contributors (most active users)

**Content Analytics (J Hub):**
- **LINE CHART:** Content creation trend
- **PIE CHART:** Content by type (video, thread, podcast, guide)
- **BAR CHART:** Content by category
- **TABLE:** Top content (most viewed, most liked)

**Course Analytics (J Academy):**
- **LINE CHART:** Course enrollment trend
- **BAR CHART:** Enrollments by course category
- **TABLE:** Top courses (most students, highest rated)
- **STAT:** Average course completion rate

**Studio Analytics:**
- **LINE CHART:** Request volume trend
- **PIE CHART:** Request by type
- **BAR CHART:** Average completion time by type
- **TABLE:** Top designers/editors (most completed)

**Engagement Analytics (J Info):**
- **LINE CHART:** Submission trend
- **PIE CHART:** Submissions by platform
- **BAR CHART:** Approval rate by platform
- **STAT:** Total points awarded

**Alpha Analytics:**
- **LINE CHART:** Alpha post trend
- **PIE CHART:** Alpha by category
- **BAR CHART:** Success rate by category (active/completed vs dead)
- **TABLE:** Top scouts (most posts, highest engagement)

**Export:**
- **BUTTON:** "Export Analytics Report" → PDF/CSV download

**NO FORMS** (Display and analytics only)

#### `/admin/settings` - Site Ayarları
**Access:** super_admin only

**Form Elements:**

**SECTION:** General Settings
- **INPUT (text):** Site name (default: "Jobless")
- **INPUT (url):** Site URL
- **TEXTAREA:** Site description (for SEO)
- **INPUT (file):** Site logo (jpg/png, max 1MB)
- **INPUT (file):** Site favicon (ico/png, max 100KB)
- **SELECT:** Default language (TR, EN)
- **CHECKBOX:** "Maintenance mode" (disable public access)

**SECTION:** Authentication Settings
- **CHECKBOX:** "Enable Twitter OAuth"
- **INPUT (text):** Twitter API Key (if enabled)
- **INPUT (text):** Twitter API Secret (if enabled)
- **CHECKBOX:** "Enable Farcaster OAuth"
- **INPUT (text):** Farcaster API Key (if enabled)

**SECTION:** Email Settings
- **INPUT (text):** SMTP Server
- **INPUT (number):** SMTP Port
- **INPUT (text):** SMTP Username
- **INPUT (password):** SMTP Password
- **INPUT (email):** From email address
- **INPUT (text):** From name
- **BUTTON:** "Test Email Configuration" → Send test email

**SECTION:** Points & Rewards System
- **INPUT (number):** Points for content creation (Hub)
- **INPUT (number):** Points for course completion (Academy)
- **INPUT (number):** Points per engagement (Info)
- **INPUT (number):** Points for alpha submission (Alpha)
- **CHECKBOX:** "Enable leaderboard"

**SECTION:** Content Moderation
- **CHECKBOX:** "Require approval for new content (Hub)"
- **CHECKBOX:** "Require approval for new courses (Academy)"
- **CHECKBOX:** "Require approval for alpha posts (Alpha)"
- **TEXTAREA:** Banned words list (comma separated)

**SECTION:** File Upload Limits
- **INPUT (number):** Max avatar size (MB)
- **INPUT (number):** Max content image size (MB)
- **INPUT (number):** Max video size (MB)
- **INPUT (number):** Max file size (general) (MB)

**SECTION:** API Settings
- **CHECKBOX:** "Enable public API"
- **INPUT (text):** API rate limit (requests/hour)
- **BUTTON:** "Generate New API Key"
- **BUTTON:** "View API Documentation"

**Action Buttons:**
- **BUTTON:** "Save All Settings"
- **BUTTON:** "Reset to Defaults" → Confirmation modal
- **BUTTON:** "Cancel"

**Validation:**
- Required field checks
- URL format validation
- Email format validation
- Number range validation

#### `/admin/logs` - Admin Log Kayıtları
**Access:** super_admin only

**Display Elements:**
- **TABLE:** Admin action log
  - Columns: Timestamp, Admin User, Action Type, Target, Details, IP Address

**Filter & Search:**
- **INPUT (search):** Search logs (admin, action, target)
- **SELECT:** Action type filter
  - All
  - User Management (create, edit, delete, suspend user)
  - Role Management (create, edit, delete role)
  - Content Moderation (approve, reject, delete content)
  - Course Management (approve, archive course)
  - Settings Changed
  - Login/Logout
- **SELECT:** Admin user filter (dropdown of all admins)
- **DATE PICKER:** Date range
- **BUTTON:** "Clear Filters"

**Sort:**
- **SELECT:** Sort by (Newest, Oldest, Admin, Action Type)

**Pagination:**
- **PAGINATION:** Page numbers
- **SELECT:** Logs per page (25, 50, 100, 200)

**Export:**
- **BUTTON:** "Export Logs" → CSV download (filtered results)

**NO EDIT FORMS** (Logs are read-only)

**Auto-Logging:**
- All admin actions are automatically logged
- Includes: timestamp, admin user ID, action type, affected resource, IP address, user agent

---

### 9. NOTIFICATIONS & MISC

#### `/notifications` - Bildirimler Sayfası
**Access:** All authenticated users

**Display Elements:**
- **TABS:**
  - "All" (all notifications)
  - "Unread" (unread only)
  - "Hub" (J Hub notifications)
  - "Academy" (J Academy notifications)
  - "Studio" (J Studio notifications)
  - "Info" (J Info notifications)
  - "Alpha" (J Alpha notifications)
  - "System" (platform announcements)

**Notification List:**
- **LIST:** Notification items (reverse chronological)
- **PER NOTIFICATION:**
  - Icon (based on type)
  - Title/message
  - Timestamp (relative: "2 hours ago")
  - **BADGE:** "New" (if unread)
  - **CLICK:** Notification → Mark as read + redirect to related page

**Notification Types & Examples:**
- **Hub:** "Your content 'Title' was approved"
- **Hub:** "New comment on your post"
- **Hub:** "Someone liked your content"
- **Academy:** "New course available in your category"
- **Academy:** "Course enrollment confirmed"
- **Academy:** "New lesson added to your course"
- **Studio:** "Your design request was claimed by [Designer]"
- **Studio:** "New work submitted for your request"
- **Info:** "Your engagement was approved (+50 points)"
- **Alpha:** "New alpha in category you follow"
- **Alpha:** "Update on alpha: [Title]"
- **System:** "Platform maintenance scheduled"

**Actions:**
- **BUTTON:** "Mark All as Read"
- **BUTTON (per notification):** "Delete" (remove notification)
- **CHECKBOX (per notification):** Select for bulk action

**Bulk Actions:**
- **CHECKBOX:** Select multiple notifications
- **SELECT:** Bulk action (Mark as Read, Delete)
- **BUTTON:** "Apply"

**Filter:**
- **SELECT:** Notification type filter
- **DATE PICKER:** Date range

**Settings (Inline):**
- **LINK:** "Notification Settings" → `/center/settings` (notification preferences section)

**Pagination:**
- **INFINITE SCROLL** or **BUTTON:** "Load More"

---

## FORM VALIDATION RULES (Global)

### Input Types:
- **text:** Max length specified, trim whitespace
- **email:** Valid email format (regex)
- **url:** Valid URL format (http/https)
- **number:** Min/max range, integer or decimal
- **file:** File type (extension), file size limit
- **date:** Valid date format, future/past restrictions
- **time:** Valid time format (HH:MM)

### Required Fields:
- Show red asterisk (*) next to label
- Display error message on blur if empty
- Prevent form submission if required fields empty

### Real-Time Validation:
- Username availability (debounced check)
- Email format (instant)
- URL format (instant)
- Character count (live counter)
- File size/type (on file select)

### Error Display:
- Inline error messages (below input)
- Red border on invalid inputs
- Clear, actionable error messages
- Summary of errors at top of form (if multiple)

### Success Feedback:
- Green checkmark for valid inputs
- Success toast/notification on form submit
- Redirect or content update on success

---

## ROLE-BASED FORM ACCESS SUMMARY

| Page | All Users | Content Creator | Designer | Video Editor | Requester | Learner | Mentor | Scout | Admin | Super Admin |
|------|-----------|-----------------|----------|--------------|-----------|---------|--------|-------|-------|-------------|
| `/hub/create` | Draft only | Publish | Draft only | Draft only | Draft only | Draft only | Draft only | Draft only | Full | Full |
| `/studio/create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/studio/request/:id` (claim) | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/academy/create` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| `/academy/requests` (create) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/info/submit` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/alpha/submit` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## CRUD OPERATIONS SUMMARY

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| **J Center** | Profile setup (auto on first login) | ✅ All users (own profile) | ✅ All users (own profile) | ❌ (account deactivation only) |
| **J Hub** | ✅ All users (content_creator can publish) | ✅ All users | ✅ Owner/Admin | ✅ Owner/Admin |
| **J Studio** | ✅ All users (requests) | ✅ All users | ✅ Owner/Admin | ✅ Owner/Admin |
| **J Academy** | ✅ Mentor (courses), Requester (requests) | ✅ All users | ✅ Mentor (own courses)/Admin | ✅ Mentor/Admin |
| **J Info** | ✅ All users (engagements) | ✅ All users | ❌ (read-only after submit) | ❌ (admin can delete) |
| **J Alpha** | ✅ Scout (alphas) | ✅ All users | ✅ Scout (own alphas)/Admin | ✅ Scout (own)/Admin |
| **Admin Panel** | ✅ Admin/Super Admin (users, roles, etc.) | ✅ Admin/Super Admin | ✅ Admin/Super Admin | ✅ Super Admin only |

---

**END OF FORM & INPUT STRUCTURE DOCUMENTATION**