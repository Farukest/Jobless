# ENGAGEMENT SYSTEM REFACTORING - DETAYLI PLAN

> **Amaç:** Like, Bookmark, View sistemini array-based'den separate collection'a taşıma
> **Sebep:** Scalability (1000+ engagement desteği), Real-time updates, Analytics

---

## 📊 MEVCUT DURUM ANALİZİ

### Etkilenen Modeller:

1. **Content (Hub)** - `backend/src/models/Content.model.ts`
   - ❌ `likes: Number`
   - ❌ `likedBy: ObjectId[]`
   - ❌ `bookmarks: Number`
   - ❌ `bookmarkedBy: ObjectId[]`
   - ❌ `views: Number`
   - ✅ `commentsCount: Number` (değişmeyecek)

2. **Course (Academy)** - `backend/src/models/Course.model.ts`
   - ❌ `views: Number` (yok şu an, eklenecek)
   - ✅ `enrolledCount, completedCount` (değişmeyecek)

3. **AlphaPost (Alpha)** - `backend/src/models/AlphaPost.model.ts`
   - ❌ `views: Number`
   - ✅ `bullishVotes, bearishVotes` (özel sistem - değişmeyecek)
   - ✅ `voters: []` (özel sistem - değişmeyecek)

4. **Comment Models**
   - `Comment.model.ts`
   - `ContentComment.model.ts`
   - `AlphaComment.model.ts`
   - ❌ `likes: Number`
   - ❌ `likedBy: ObjectId[]`

### Mevcut API Endpoints:

**Hub:**
- ✅ `POST /api/hub/content/:id/like` (toggleLike)
- ✅ `POST /api/hub/content/:id/bookmark` (toggleBookmark)
- ⚠️ View tracking: `getContent()` içinde `views++` yapıyor

**Academy:**
- ❌ View tracking yok

**Alpha:**
- ❌ View tracking yok

**Comments:**
- ❌ Like endpoints yok

### Frontend Hooks:

- ✅ `useToggleLike()` - `frontend/src/hooks/use-hub.ts`
- ✅ `useToggleBookmark()` - `frontend/src/hooks/use-hub.ts`
- ❌ Real-time updates yok

---

## 🎯 YENİ SİSTEM MİMARİSİ

### Yeni Modeller (3 adet):

#### 1. `Like.model.ts` - Universal Like System
```typescript
{
  userId: ObjectId,
  targetId: ObjectId,
  targetType: 'hub_content' | 'course' | 'alpha_post' | 'comment',
  createdAt: Date
}
// Indexes:
// - { userId: 1, targetId: 1, targetType: 1 } - unique
// - { targetId: 1, targetType: 1, createdAt: -1 }
// - { userId: 1, createdAt: -1 }
```

#### 2. `Bookmark.model.ts` - Universal Bookmark System
```typescript
{
  userId: ObjectId,
  targetId: ObjectId,
  targetType: 'hub_content' | 'course' | 'alpha_post',
  createdAt: Date
}
// Indexes:
// - { userId: 1, targetId: 1, targetType: 1 } - unique
// - { userId: 1, createdAt: -1 }
```

#### 3. `View.model.ts` - Universal View Tracking
```typescript
{
  userId: ObjectId (nullable - anonymous views),
  targetId: ObjectId,
  targetType: 'hub_content' | 'course' | 'alpha_post',
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
// Indexes:
// - { targetId: 1, targetType: 1, createdAt: -1 }
// - { userId: 1, createdAt: -1 } (partial - where userId exists)
// - { ipAddress: 1, targetId: 1, createdAt: -1 }
```

### Model Güncellemeleri:

**Content.model.ts:**
```typescript
// REMOVE:
- likedBy: ObjectId[]
- bookmarkedBy: ObjectId[]

// RENAME:
- likes → likesCount
- bookmarks → bookmarksCount
- views → viewsCount

// KEEP:
- commentsCount
```

**Course.model.ts:**
```typescript
// ADD:
+ likesCount: Number (default: 0)
+ bookmarksCount: Number (default: 0)
+ viewsCount: Number (default: 0)

// KEEP:
- enrolledCount
- completedCount
- reviewsCount
```

**AlphaPost.model.ts:**
```typescript
// RENAME:
- views → viewsCount

// ADD:
+ likesCount: Number (default: 0)
+ commentsCount: Number (default: 0)

// KEEP (özel voting sistemi):
- bullishVotes
- bearishVotes
- voters: []
```

**Comment/ContentComment/AlphaComment:**
```typescript
// REMOVE:
- likedBy: ObjectId[]

// RENAME:
- likes → likesCount
```

---

## 🔧 BACKEND DEĞİŞİKLİKLERİ

### PHASE 1: Model Oluşturma

**Dosyalar:**
1. `backend/src/models/Like.model.ts` - YENİ
2. `backend/src/models/Bookmark.model.ts` - YENİ
3. `backend/src/models/View.model.ts` - YENİ

**Aksiyonlar:**
- [x] 3 yeni model oluştur
- [x] Indexleri ekle
- [x] Export'ları güncelle

---

### PHASE 2: Service Layer (Business Logic)

**Dosya:** `backend/src/services/engagement.service.ts` - YENİ

```typescript
class EngagementService {
  // Like Operations
  async toggleLike(userId, targetId, targetType)
  async getLikeStatus(userId, targetId, targetType)
  async getLikesCount(targetId, targetType)

  // Bookmark Operations
  async toggleBookmark(userId, targetId, targetType)
  async getBookmarkStatus(userId, targetId, targetType)
  async getBookmarksCount(targetId, targetType)

  // View Operations
  async trackView(userId, targetId, targetType, ipAddress, userAgent)
  async getViewsCount(targetId, targetType)
  async getUniqueViewsCount(targetId, targetType)

  // Batch Operations (optimize edilmiş)
  async getLikeStatusBatch(userId, targets: Array<{targetId, targetType}>)
  async getBookmarkStatusBatch(userId, targets)
}
```

**Aksiyonlar:**
- [ ] Service class oluştur
- [ ] Transaction support ekle (like + counter update atomic olmalı)
- [ ] Error handling

---

### PHASE 3: Controller Güncellemeleri

#### 3.1 Hub Controller - `backend/src/controllers/hub.controller.ts`

**Değişiklikler:**

**BEFORE:**
```typescript
export const toggleLike = async (req, res) => {
  const content = await Content.findById(id)
  const hasLiked = content.likedBy.includes(userId)
  if (hasLiked) {
    content.likedBy.pull(userId)
    content.likes -= 1
  } else {
    content.likedBy.push(userId)
    content.likes += 1
  }
  await content.save()
}
```

**AFTER:**
```typescript
import { EngagementService } from '../services/engagement.service'

export const toggleLike = async (req, res) => {
  const result = await EngagementService.toggleLike(
    req.user._id,
    req.params.id,
    'hub_content'
  )

  // Emit WebSocket event
  req.io.to(`content:${req.params.id}`).emit('likeUpdate', {
    contentId: req.params.id,
    likesCount: result.likesCount,
    isLiked: result.isLiked
  })

  res.json({ success: true, data: result })
}
```

**Güncellenecek Fonksiyonlar:**
- [x] `toggleLike` → Service kullan + WebSocket
- [x] `toggleBookmark` → Service kullan + WebSocket
- [x] `getContent` → View tracking service kullan + WebSocket
- [x] `getAllContents` → Batch like/bookmark status ekle (optimize)

#### 3.2 Academy Controller - `backend/src/controllers/academy.controller.ts`

**Eklenecek Fonksiyonlar:**
- [ ] `toggleLike` - YENİ
- [ ] `toggleBookmark` - YENİ
- [ ] `getCourse` → View tracking ekle

#### 3.3 Alpha Controller - `backend/src/controllers/alpha.controller.ts`

**Eklenecek Fonksiyonlar:**
- [ ] `toggleLike` - YENİ (voting sistemine ek olarak)
- [ ] `getAlphaPost` → View tracking ekle

#### 3.4 Comment Controller - `backend/src/controllers/comment.controller.ts`

**Eklenecek Fonksiyonlar:**
- [ ] `toggleLike` - YENİ

---

### PHASE 4: Routes Güncellemeleri

#### 4.1 Hub Routes - `backend/src/routes/hub.routes.ts`

**Mevcut:**
```typescript
router.post('/content/:id/like', protect, toggleLike)
router.post('/content/:id/bookmark', protect, toggleBookmark)
```

**Değişiklik yok** (controller içi değişti)

#### 4.2 Academy Routes - `backend/src/routes/academy.routes.ts`

**Ekle:**
```typescript
router.post('/courses/:id/like', protect, toggleLike)
router.post('/courses/:id/bookmark', protect, toggleBookmark)
```

#### 4.3 Alpha Routes - `backend/src/routes/alpha.routes.ts`

**Ekle:**
```typescript
router.post('/posts/:id/like', protect, toggleLike)
```

#### 4.4 Comment Routes - `backend/src/routes/comment.routes.ts`

**Ekle:**
```typescript
router.post('/:id/like', protect, toggleLike)
```

---

### PHASE 5: WebSocket Entegrasyonu

**Dosya:** `backend/src/socket/index.ts` - YENİ

```typescript
import { Server } from 'socket.io'

export const setupSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join content room
    socket.on('join:content', (contentId) => {
      socket.join(`content:${contentId}`)
    })

    // Leave content room
    socket.on('leave:content', (contentId) => {
      socket.leave(`content:${contentId}`)
    })
  })

  return io
}
```

**Server entegrasyonu:** `backend/src/server.ts`
```typescript
import { setupSocketIO } from './socket'

const httpServer = createServer(app)
const io = setupSocketIO(httpServer)

// Middleware: socket.io'yu req'e ekle
app.use((req, res, next) => {
  req.io = io
  next()
})
```

**Events:**
- `likeUpdate` - { contentId, likesCount, isLiked }
- `bookmarkUpdate` - { contentId, bookmarksCount, isBookmarked }
- `viewUpdate` - { contentId, viewsCount }

---

## 🎨 FRONTEND DEĞİŞİKLİKLERİ

### PHASE 6: WebSocket Client Setup

**Dosya:** `frontend/src/lib/socket.ts` - YENİ

```typescript
import { io } from 'socket.io-client'

export const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
  autoConnect: false
})

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}
```

---

### PHASE 7: Hooks Güncellemeleri

#### 7.1 Hub Hooks - `frontend/src/hooks/use-hub.ts`

**Mevcut:**
```typescript
export function useToggleLike() {
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post(`/hub/content/${contentId}/like`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub', 'content'] })
    },
  })
}
```

**YENİ (Optimistic Update + WebSocket):**
```typescript
export function useToggleLike(contentId: string) {
  const queryClient = useQueryClient()

  // WebSocket dinle
  useEffect(() => {
    socket.on('likeUpdate', (data) => {
      if (data.contentId === contentId) {
        queryClient.setQueryData(['hub', 'content', contentId], (old) => ({
          ...old,
          data: {
            ...old.data,
            likesCount: data.likesCount
          }
        }))
      }
    })

    socket.emit('join:content', contentId)

    return () => {
      socket.emit('leave:content', contentId)
    }
  }, [contentId])

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/hub/content/${contentId}/like`)
      return data
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries(['hub', 'content', contentId])
      const previous = queryClient.getQueryData(['hub', 'content', contentId])

      queryClient.setQueryData(['hub', 'content', contentId], (old: any) => ({
        ...old,
        data: {
          ...old.data,
          likesCount: old.data.isLiked
            ? old.data.likesCount - 1
            : old.data.likesCount + 1,
          isLiked: !old.data.isLiked
        }
      }))

      return { previous }
    },
    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['hub', 'content', contentId], context.previous)
    }
  })
}
```

**Değişiklikler:**
- [ ] `useToggleLike` → Optimistic update + WebSocket
- [ ] `useToggleBookmark` → Optimistic update + WebSocket
- [ ] `useContent` → isLiked, isBookmarked backend'den gelecek

#### 7.2 Academy Hooks - `frontend/src/hooks/use-academy.ts`

**Ekle:**
- [ ] `useToggleLike` - YENİ
- [ ] `useToggleBookmark` - YENİ

#### 7.3 Alpha Hooks - `frontend/src/hooks/use-alpha.ts`

**Ekle:**
- [ ] `useToggleLike` - YENİ

---

### PHASE 8: API Response Güncellemeleri

**Backend Response Format:**

**BEFORE:**
```json
{
  "data": {
    "_id": "123",
    "title": "Content",
    "likes": 45,
    "likedBy": ["user1", "user2", ...],
    "views": 150
  }
}
```

**AFTER:**
```json
{
  "data": {
    "_id": "123",
    "title": "Content",
    "likesCount": 45,
    "bookmarksCount": 12,
    "viewsCount": 150,
    "isLiked": true,
    "isBookmarked": false
  }
}
```

**Controller'da hesaplama:**
```typescript
export const getContent = async (req, res) => {
  const content = await Content.findById(id)

  // Get user's engagement status
  const [isLiked, isBookmarked] = await Promise.all([
    Like.exists({ userId: req.user._id, targetId: id, targetType: 'hub_content' }),
    Bookmark.exists({ userId: req.user._id, targetId: id, targetType: 'hub_content' })
  ])

  res.json({
    data: {
      ...content.toObject(),
      isLiked: !!isLiked,
      isBookmarked: !!isBookmarked
    }
  })
}
```

---

## 📦 MİGRATİON SCRIPT

**Dosya:** `backend/src/scripts/migrate-engagement.ts`

```typescript
import { Content, Like, Bookmark } from '../models'

export const migrateEngagement = async () => {
  console.log('Starting engagement migration...')

  // 1. Migrate Hub Content Likes
  const contents = await Content.find({ 'likedBy.0': { $exists: true } })

  for (const content of contents) {
    const likes = content.likedBy.map(userId => ({
      userId,
      targetId: content._id,
      targetType: 'hub_content',
      createdAt: content.createdAt // fallback timestamp
    }))

    if (likes.length > 0) {
      await Like.insertMany(likes, { ordered: false })
      console.log(`Migrated ${likes.length} likes for content ${content._id}`)
    }
  }

  // 2. Migrate Hub Content Bookmarks
  // ... similar

  // 3. Update Content model (remove arrays)
  await Content.updateMany({}, {
    $rename: {
      likes: 'likesCount',
      bookmarks: 'bookmarksCount',
      views: 'viewsCount'
    },
    $unset: { likedBy: '', bookmarkedBy: '' }
  })

  console.log('Migration completed!')
}
```

**Çalıştırma:**
```bash
cd backend && npx ts-node src/scripts/migrate-engagement.ts
```

---

## ✅ TEST PLANI

### Unit Tests:

**Dosyalar:**
- `backend/src/tests/services/engagement.service.test.ts`
- `backend/src/tests/models/Like.model.test.ts`

**Test Cases:**
1. Like toggle (add → remove → add)
2. Bookmark toggle
3. View tracking (unique vs total)
4. Concurrent like/unlike (race condition)
5. Counter sync (Like.count vs Content.likesCount)

### Integration Tests:

**Dosyalar:**
- `backend/src/tests/integration/hub-engagement.test.ts`

**Test Cases:**
1. POST /hub/content/:id/like → 200 OK
2. Check isLiked status in GET /hub/content/:id
3. WebSocket event emission
4. Optimistic update rollback on error

### E2E Tests:

**Dosyalar:**
- `frontend/cypress/e2e/hub-engagement.cy.ts`

**Test Cases:**
1. Click like button → count increases → real-time update
2. Unlike → count decreases
3. Bookmark → check in "My Bookmarks" page
4. Multiple users liking same content (WebSocket sync)

---

## 📋 UYGULAMA SIRASI (STEP BY STEP)

### ✅ STEP 1: Backend Model Layer (1-2 saat)
- [ ] `Like.model.ts` oluştur
- [ ] `Bookmark.model.ts` oluştur
- [ ] `View.model.ts` oluştur
- [ ] Index'leri ekle
- [ ] Test et (insert/find)

### ✅ STEP 2: Service Layer (2-3 saat)
- [ ] `engagement.service.ts` oluştur
- [ ] Like, Bookmark, View fonksiyonları
- [ ] Transaction support
- [ ] Unit testler yaz

### ✅ STEP 3: Hub Controller Refactor (2 saat)
- [ ] `toggleLike` güncelle (service kullan)
- [ ] `toggleBookmark` güncelle
- [ ] `getContent` güncelle (isLiked, isBookmarked ekle)
- [ ] `getAllContents` → batch status
- [ ] Test et (Postman)

### ✅ STEP 4: WebSocket Backend (1 saat)
- [ ] `socket/index.ts` oluştur
- [ ] Server.ts entegrasyonu
- [ ] Controller'larda emit ekle
- [ ] Test et (Postman + Socket.io client)

### ✅ STEP 5: Migration Script (1 saat)
- [ ] `migrate-engagement.ts` yaz
- [ ] Test database'de dene
- [ ] Production database'de çalıştır

### ✅ STEP 6: Frontend WebSocket Setup (30 dakika)
- [ ] `lib/socket.ts` oluştur
- [ ] Socket.io-client kur
- [ ] Connection test

### ✅ STEP 7: Hub Hooks Refactor (2 saat)
- [ ] `useToggleLike` → Optimistic + WebSocket
- [ ] `useToggleBookmark` → Optimistic + WebSocket
- [ ] Test et (frontend)

### ✅ STEP 8: Academy & Alpha Genişletme (3-4 saat)
- [ ] Academy like/bookmark endpoints
- [ ] Alpha like endpoints
- [ ] Comment like endpoints
- [ ] Frontend hooks

### ✅ STEP 9: Testing & Bug Fixes (2-3 saat)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Bug fixes

### ✅ STEP 10: Documentation (1 saat)
- [ ] CLAUDE.md güncelle
- [ ] API_ENDPOINTS.md güncelle
- [ ] README'ye WebSocket bilgisi ekle

---

## 📊 TOPLAM SÜRE TAHMİNİ

- Backend: 8-10 saat
- Frontend: 3-4 saat
- Testing: 2-3 saat
- Documentation: 1 saat

**TOPLAM: 14-18 saat** (2-3 iş günü)

---

## ⚠️ RİSKLER & MİTİGASYON

### Risk 1: Migration sırasında data loss
**Mitigasyon:**
- Önce test database'de dene
- Backup al
- Rollback script hazırla

### Risk 2: Counter sync bozulması (Like.count ≠ Content.likesCount)
**Mitigasyon:**
- Transaction kullan (Mongoose session)
- Cron job ile daily sync check
- Admin dashboard'a counter repair tool

### Risk 3: WebSocket bağlantı kopması
**Mitigasyon:**
- Reconnection logic
- Fallback: polling (her 5 saniye)
- Optimistic update zaten client-side'da çalışır

### Risk 4: Performance (binlerce like sorgusu)
**Mitigasyon:**
- Index'ler optimize
- Batch operations (getAllContents için)
- Cache layer (Redis) - future improvement

---

## 🚀 DEPLOYMENT PLANI

### Stage 1: Development
- [ ] Tüm değişiklikleri dev branch'te yap
- [ ] Local test
- [ ] Code review

### Stage 2: Staging
- [ ] Staging database'e deploy
- [ ] Migration çalıştır
- [ ] QA testing

### Stage 3: Production
- [ ] Production database backup
- [ ] Migration çalıştır (off-peak hours)
- [ ] Frontend deploy
- [ ] Monitor errors (24 saat)
- [ ] Rollback plan hazır

---

## 📝 NOTLAR

1. **WebSocket zorunlu değil:** İlk aşamada skip edilebilir, sadece polling ile başlanabilir
2. **View tracking:** IP-based unique view tracking optional (privacy concerns)
3. **Analytics:** View/Like data'yı analytics service'e stream et (future)
4. **Rate limiting:** Like spam prevention (max 10 like/dakika per user)

---

**Hazırlayan:** Claude Code
**Tarih:** 2025-01-20
**Durum:** Plan hazır, onay bekleniyor
