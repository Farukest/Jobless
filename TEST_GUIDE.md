# 🧪 JOBLESS PLATFORM - TEST KILAVUZU

## 📌 Test Öncesi Hazırlık

### 1. Test Verisini Oluştur

Test senaryolarını çalıştırmadan önce örnek veri oluşturun:

```bash
# Backend ve Frontend'i başlat
cd backend && npm run dev
cd frontend && npm run dev

# Test verisini oluştur (ayrı terminal)
node backend/seed-test-data.js
```

**Oluşturulan Test Verisi:**
- ✅ 3 J Hub content (1 video, 1 thread, 1 podcast)
- ✅ 2 J Academy course (Photoshop, Video Editing)
- ✅ 2 J Alpha post (DeFi ve NFT projeleri)
- ✅ 2 J Studio production request (Logo ve Video)
- ✅ 1 J Info engagement post (Twitter campaign)

### 2. Test Kullanıcıları ve Rolleri

| Cüzdan | Rol | Amaç |
|--------|-----|------|
| `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9` | super_admin | Tüm admin işlemleri |
| `0x2ed164398ae3724502e68ce7a3936bb7b0b128af` | admin | Kısıtlı admin işlemleri |
| `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625` | content_creator + mentor | İçerik ve kurs oluşturma |
| `0xa58168607931de106c4d8330b8fd99489667b210` | learner + requester | Kurs alma ve studio istekleri |
| `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8` | scout | Alpha post oluşturma |
| `0x8da45512ab9158796d06beaab0e545d33c23d484` | member | Temel kullanıcı |

---

## 🔴 TEST 1: SUPER ADMIN - Platform Yönetimi

**Cüzdan:** `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9`

### A. Giriş ve Dashboard

1. **Giriş Yap**
   - `http://localhost:3000/login`
   - MetaMask ile cüzdanı bağla
   - ✅ Ana sayfaya yönlendi mi?

2. **Dashboard Kontrolleri**
   - `http://localhost:3000/admin/dashboard`
   - ✅ Total Users, Active Users kartları görünüyor mu?
   - ✅ Recent Activity listesi var mı?
   - ✅ System Status göstergeler aktif mi?

### B. İçerik Yönetimi (VERİ VAR)

3. **J Hub Content Management**
   - `http://localhost:3000/admin/content`
   - ✅ 3 içerik görünüyor mu? (1 video, 1 thread, 1 podcast)
   - ✅ Filter çalışıyor mu?
     - Content Type: Video seç → Sadece video göster
     - Status: Published seç → 2 published content
     - Status: Draft seç → 1 draft content
   - ✅ Search çalışıyor mu?
     - "Web3" ara → "Getting Started with Web3 Development" bulmalı
   - ✅ **Moderate Et:**
     - Draft content'i seç
     - "Approve" tıkla → Status published olmalı
   - ✅ **Feature Et:**
     - Bir content'i feature et
     - `isFeatured: true` olmalı

### C. Kurs Yönetimi (VERİ VAR)

4. **J Academy Course Management**
   - `http://localhost:3000/admin/courses`
   - ✅ 2 kurs görünüyor mu? (Photoshop, Premiere Pro)
   - ✅ Filter çalışıyor mu?
     - Category: Design → Photoshop kursu
     - Difficulty: Advanced → Premiere Pro kursu
   - ✅ Kurs detaylarını göster
     - Enrolled count: 15 (Photoshop), 8 (Premiere Pro)
     - Average rating görünüyor mu?

### D. Alpha Post Yönetimi (VERİ VAR)

5. **J Alpha Post Management**
   - `http://localhost:3000/admin/alpha-posts`
   - ✅ 2 alpha post görünüyor mu?
   - ✅ Filter çalışıyor mu?
     - Status: Published → "DefiSwap Protocol"
     - Status: Pending → "NFT Marketplace X"
   - ✅ **Verify Et:**
     - Pending post'u seç
     - "Approve" tıkla → Status published olmalı

### E. Studio İstekleri (VERİ VAR)

6. **J Studio Production Requests**
   - `http://localhost:3000/admin/studio-requests`
   - ✅ 2 request görünüyor mu? (Logo, Video)
   - ✅ Filter çalışıyor mu?
     - Request Type: Logo Design
     - Status: Open
   - ✅ Request detaylarını göster
     - Budget, deadline görünüyor mu?

### F. Engagement Yönetimi (VERİ VAR)

7. **J Info Engagement Posts**
   - `http://localhost:3000/admin/engagements`
   - ✅ 1 engagement post görünüyor mu?
   - ✅ Status: Active
   - ✅ Platform: Twitter
   - ✅ Engagement count: 25

### G. Kullanıcı Yönetimi

8. **User Management**
   - `http://localhost:3000/admin/users`
   - ✅ Tüm 7 test kullanıcısı görünüyor mu?
   - ✅ **Role Filter:**
     - Role: super_admin → 1 kullanıcı (sen)
     - Role: content_creator → 1 kullanıcı
   - ✅ **Edit User:**
     - Bir kullanıcı seç
     - "Manage Roles" tıkla
     - ✅ Mevcut roller seçili geliyor mu?
     - Role ekle/çıkar
     - Save → Değişiklikler kaydedildi mi?

### H. Rol Yönetimi

9. **Role Management**
   - `http://localhost:3000/admin/roles`
   - ✅ Tüm 8 sistem rolü görünüyor mu?
   - ✅ Her rolün capabilities listesi var mı?
   - ✅ User count doğru mu?
   - ✅ **Yeni Rol Oluştur:**
     - "Create New Role" buton görünüyor mu? (Sadece super_admin)
     - Tıkla
     - ✅ Permission groups görünüyor mu?
       - Platform Access (5)
       - Content Permissions (2)
       - Academy Permissions (2)
       - Studio Permissions (2)
       - Alpha Permissions (1)
       - Admin Permissions (3)
     - Rol oluştur (örn: "test_role")
     - ✅ Başarıyla oluşturuldu mu?

---

## 🟡 TEST 2: CONTENT CREATOR - İçerik Oluşturma

**Cüzdan:** `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625`

### A. J Hub - Content Creation

1. **Yeni Video Oluştur**
   - `http://localhost:3000/hub/create`
   - ✅ Content Type: Video seç
   - Title: "Test Video Content"
   - Description: "This is a test video"
   - Video URL: "https://youtube.com/watch?v=test"
   - Category: Development
   - ✅ "Create Video" butonu var mı?
   - Submit → Başarıyla oluşturuldu mu?

2. **My Content**
   - `http://localhost:3000/hub/my-content`
   - ✅ Oluşturduğun 4 content görünüyor mu? (3 seed + 1 yeni)
   - ✅ Stats görünüyor mu? (views, likes, bookmarks)
   - ✅ Edit/Delete butonları çalışıyor mu?

### B. J Academy - Course Creation (Mentor Role)

3. **Yeni Kurs Oluştur**
   - `http://localhost:3000/academy/create`
   - ✅ "Create Course" butonu görünüyor mu? (Mentor yetkisi)
   - Title: "Test Course"
   - Description: "Test description"
   - Category: AI Tools
   - Difficulty: Beginner
   - Submit → Başarıyla oluşturuldu mu?

4. **My Courses**
   - `http://localhost:3000/academy/my-courses`
   - ✅ "Created Courses" sekmesi var mı?
   - ✅ Oluşturduğun 3 kurs görünüyor mu? (2 seed + 1 yeni)

---

## 🟡 TEST 3: SCOUT - Alpha Post

**Cüzdan:** `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8`

### A. J Alpha - Project Submission

1. **Yeni Alpha Post**
   - `http://localhost:3000/alpha/submit`
   - ✅ Form görünüyor mu?
   - Project Name: "Test DeFi Project"
   - Description: "Test project description"
   - Category: Airdrop Radar
   - Blockchain: Solana
   - Potential Rating: High (4)
   - Risk Rating: Low
   - Submit → Başarıyla oluşturuldu mu?

2. **My Alphas**
   - `http://localhost:3000/alpha/my-alphas`
   - ✅ 3 alpha post görünüyor mu? (2 seed + 1 yeni)
   - ✅ Status: Pending (yeni), Published (seed)

---

## 🟢 TEST 4: LEARNER - Course Enrollment

**Cüzdan:** `0xa58168607931de106c4d8330b8fd99489667b210`

### A. J Academy - Browse & Enroll

1. **Kurs Listesi**
   - `http://localhost:3000/academy/courses`
   - ✅ 3 kurs görünüyor mu?
   - ✅ Filter çalışıyor mu?
     - Category: Design → Photoshop
     - Difficulty: Beginner

2. **Kursa Kayıt Ol**
   - Bir kursa tıkla
   - "Enroll" butonu var mı?
   - Enroll → Başarıyla kaydoldu mu?
   - ✅ Enrolled count arttı mı?

3. **My Courses**
   - `http://localhost:3000/academy/my-courses`
   - ✅ "Enrolled Courses" sekmesi var mı?
   - ✅ Kayıt olduğun kurs görünüyor mu?

### B. J Studio - Create Request

4. **Production Request**
   - `http://localhost:3000/studio/create`
   - Request Type: Banner Design
   - Title: "Test Banner Request"
   - Description: "Need a banner for Twitter"
   - Budget: 200
   - Submit → Başarıyla oluşturuldu mu?

5. **My Requests**
   - `http://localhost:3000/studio/my-requests`
   - ✅ 3 request görünüyor mu? (2 seed + 1 yeni)

---

## 📋 Test Özeti Checklist

### Veri Oluşturma ✅
- [x] Seed script çalıştırıldı
- [x] 3 Hub content oluşturuldu
- [x] 2 Academy course oluşturuldu
- [x] 2 Alpha post oluşturuldu
- [x] 2 Studio request oluşturuldu
- [x] 1 Engagement post oluşturuldu

### Admin Tests
- [ ] Dashboard yükleniyor
- [ ] Content filtering çalışıyor
- [ ] Course management çalışıyor
- [ ] Alpha moderation çalışıyor
- [ ] User role editing çalışıyor
- [ ] New role creation çalışıyor (permissions dahil)

### Creator Tests
- [ ] Video creation çalışıyor
- [ ] Course creation çalışıyor (mentor)
- [ ] My content görünüyor

### Scout Tests
- [ ] Alpha post creation çalışıyor
- [ ] My alphas görünüyor

### Learner Tests
- [ ] Course enrollment çalışıyor
- [ ] Studio request creation çalışıyor

---

## 🚨 Sorun Giderme

### Veri Görünmüyor?
```bash
# Veritabanını kontrol et
mongosh
use jobless
db.contents.countDocuments()
db.courses.countDocuments()
db.alphaposts.countDocuments()
```

### Seed Tekrar Çalıştır
```bash
# Mevcut test datasını temizle (OPSIYONEL)
mongosh jobless --eval "db.contents.deleteMany({title: /Test/})"

# Yeniden seed et
node backend/seed-test-data.js
```

### API Hataları
- Backend loglara bak: `cd backend && npm run dev`
- Frontend console'u kontrol et (F12)
- Network tab'de request/response'lara bak

---

**Not:** Test verisi oluşturulduktan sonra filtreleme, search ve CRUD işlemlerini test edebilirsiniz!
