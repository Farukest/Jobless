# 🧪 JOBLESS PLATFORM - KAPSAMLI TEST SENARYOLARI

## 📌 Test Cüzdan Adresleri ve Rolleri

| Cüzdan Adresi | Rol(ler) | Test Önceliği |
|--------------|----------|---------------|
| `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9` | **super_admin** | 🔴 Kritik |
| `0x2ed164398ae3724502e68ce7a3936bb7b0b128af` | **admin** | 🔴 Kritik |
| `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625` | **content_creator + mentor** | 🟡 Orta |
| `0xa58168607931de106c4d8330b8fd99489667b210` | **learner + requester** | 🟡 Orta |
| `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8` | **scout** | 🟢 Normal |
| `0x8da45512ab9158796d06beaab0e545d33c23d484` | **member** | 🟢 Normal |

---

## 🔴 TEST 1: SUPER ADMIN (Tüm Yetkiler)
**Cüzdan:** `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9`

### 📍 Test Adımları:

#### 1. Giriş ve Dashboard
- [ ] `http://localhost:3000/login` - Cüzdan ile giriş yap
- [ ] Ana sayfaya yönlendiğini kontrol et
- [ ] Header'da profil bilgilerini gör
- [ ] "Admin" butonu görünür mü kontrol et

#### 2. Admin Panel Erişimi
- [ ] `http://localhost:3000/admin` - Admin panele gir
- [ ] `http://localhost:3000/admin/dashboard` - Dashboard yükleniyor mu?
  - [ ] Stats kartları görünüyor mu? (Total Users, Active Users, etc.)
  - [ ] Recent Activity listesi var mı?

#### 3. Kullanıcı Yönetimi
- [ ] `http://localhost:3000/admin/users` - Kullanıcı listesi
  - [ ] Tüm kullanıcılar listelenmiş mi?
  - [ ] Search çalışıyor mu?
  - [ ] Filter (status, role) çalışıyor mu?
  - [ ] **TEST:** Bir kullanıcıya "Edit" tırolkla
  - [ ] **TEST:** Role değiştir (örn: member → content_creator)
  - [ ] **TEST:** Permissions düzenle
  - [ ] **TEST:** Status değiştir (active/suspended/banned)

#### 4. Rol Yönetimi
- [ ] `http://localhost:3000/admin/roles` - Rol yönetimi
  - [ ] Tüm roller görünüyor mu?
  - [ ] Her rolün izinleri listelenmiş mi?
  - [ ] **TEST:** Yeni rol ekle butonu var mı?
  - [ ] **TEST:** Rol izinlerini düzenle

#### 5. İzin Yönetimi
- [ ] `http://localhost:3000/admin/permissions` - İzin yönetimi
  - [ ] Tüm izin kategorileri görünüyor mu?
  - [ ] **TEST:** Role göre filtreleme çalışıyor mu?
  - [ ] Permission kartları doğru renklerde mi?

#### 6. İçerik Yönetimi (J Hub)
- [ ] `http://localhost:3000/admin/content` - Hub içerik yönetimi
  - [ ] Tüm içerikler listelenmiş mi?
  - [ ] **TEST:** Filter (content type, status) çalışıyor mu?
  - [ ] **TEST:** Search çalışıyor mu?
  - [ ] **TEST:** Content moderate et (Approve/Reject/Delete)
  - [ ] **TEST:** Content feature et

#### 7. Kurs Yönetimi (J Academy)
- [ ] `http://localhost:3000/admin/courses` - Kurs yönetimi
  - [ ] Tüm kurslar listelenmiş mi?
  - [ ] **TEST:** Kurs approve/reject
  - [ ] **TEST:** Kurs sil
  - [ ] **TEST:** Kurs düzenle

#### 8. Studio İstekleri
- [ ] `http://localhost:3000/admin/studio-requests` - Studio istekleri
  - [ ] Tüm production requests görünüyor mu?
  - [ ] **TEST:** Status filter çalışıyor mu?
  - [ ] **TEST:** Request type filter çalışıyor mu?
  - [ ] **TEST:** İstek iptal et
  - [ ] **TEST:** İstek sil

#### 9. Info Engagements
- [ ] `http://localhost:3000/admin/engagements` - Engagement yönetimi
  - [ ] Tüm engagement posts görünüyor mu?
  - [ ] **TEST:** Post verify et
  - [ ] **TEST:** Engagement onay/red
  - [ ] **TEST:** Post sil

#### 10. Alpha Posts
- [ ] `http://localhost:3000/admin/alpha-posts` - Alpha post yönetimi
  - [ ] Tüm alpha posts görünüyor mu?
  - [ ] **TEST:** Post verify et
  - [ ] **TEST:** Post moderate et
  - [ ] **TEST:** Post sil

#### 11. Analytics
- [ ] `http://localhost:3000/admin/analytics` - Analytics sayfası
  - [ ] User stats görünüyor mu?
  - [ ] Engagement stats görünüyor mu?
  - [ ] Period filter (7d, 30d, 90d) çalışıyor mu?

#### 12. Settings
- [ ] `http://localhost:3000/admin/settings` - Site ayarları
  - [ ] Settings formu görünüyor mu?
  - [ ] **TEST:** Ayarları güncelle
  - [ ] **TEST:** Değişiklikler kaydediliyor mu?

#### 13. Logs
- [ ] `http://localhost:3000/admin/logs` - Admin logları
  - [ ] Activity logs görünüyor mu?
  - [ ] Log filtreleme çalışıyor mu?
  - [ ] Admin actions loglanıyor mu?

---

## 🔴 TEST 2: ADMIN (Admin Paneli Erişimi)
**Cüzdan:** `0x2ed164398ae3724502e68ce7a3936bb7b0b128af`

### 📍 Test Adımları:

#### 1. Giriş ve Yetki Kontrolü
- [ ] `http://localhost:3000/login` - Giriş yap
- [ ] "Admin" butonu görünür mü?
- [ ] Admin panele erişebiliyor mu?

#### 2. Admin Sayfaları Erişimi (Sadece Görüntüleme)
- [ ] `http://localhost:3000/admin/dashboard` - Erişebiliyor mu?
- [ ] `http://localhost:3000/admin/users` - Listeyi görebiliyor mu?
  - [ ] **KONTROL:** Edit butonları ÇALIŞMAMALI (yetkisiz)
  - [ ] **KONTROL:** Delete butonları ÇALIŞMAMALI (yetkisiz)
- [ ] `http://localhost:3000/admin/content` - İçerikleri görebiliyor mu?
  - [ ] **KONTROL:** Moderate edemez (super_admin gerekli)
- [ ] `http://localhost:3000/admin/analytics` - Analytics görebiliyor mu?

#### 3. Yetkisiz İşlemler (Hata Vermeli)
- [ ] **TEST:** Kullanıcı rolü değiştirmeye çalış → 403 Forbidden
- [ ] **TEST:** Content silmeye çalış → 403 Forbidden
- [ ] **TEST:** Settings değiştirmeye çalış → 403 Forbidden

---

## 🟡 TEST 3: CONTENT CREATOR + MENTOR
**Cüzdan:** `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625`

### 📍 Test Adımları:

#### 1. J Hub - İçerik Oluşturma
- [ ] `http://localhost:3000/hub` - Hub ana sayfa
- [ ] `http://localhost:3000/hub/create` - İçerik oluştur sayfası
  - [ ] **TEST:** Video oluştur
    - [ ] Title, Description, thumbnail, video URL gir
    - [ ] Category seç
    - [ ] **KONTROL:** "Create Video" butonu aktif mi?
    - [ ] Submit et ve kaydedildiğini gör
  - [ ] **TEST:** Thread oluştur
    - [ ] Content yaz
    - [ ] Images ekle
    - [ ] Submit et
  - [ ] **TEST:** Podcast oluştur
    - [ ] Title, description, audio URL gir
    - [ ] Submit et

#### 2. My Content - Kendi İçeriklerini Yönet
- [ ] `http://localhost:3000/hub/my-content` - Kendi içeriklerim
  - [ ] Oluşturduğun içerikler listede mi?
  - [ ] **TEST:** İçerik düzenle
  - [ ] **TEST:** İçerik sil
  - [ ] Stats görünüyor mu? (likes, bookmarks, views)

#### 3. J Academy - Kurs Oluşturma (Mentor Yetkisi)
- [ ] `http://localhost:3000/academy` - Academy ana sayfa
- [ ] `http://localhost:3000/academy/create` - Kurs oluştur
  - [ ] **TEST:** Yeni kurs oluştur
    - [ ] Title, description, category, difficulty seç
    - [ ] Learning objectives ekle
    - [ ] Prerequisites ekle
    - [ ] Points cost belirle
    - [ ] Submit et
  - [ ] **KONTROL:** "Create Course" butonu görünüyor mu?

#### 4. My Courses - Oluşturduğum Kurslar
- [ ] `http://localhost:3000/academy/my-courses` - Kurslarım
  - [ ] "Created Courses" sekmesi var mı?
  - [ ] Oluşturduğun kurslar listede mi?
  - [ ] **TEST:** Kurs düzenle
  - [ ] **TEST:** Kurs modülleri ekle

#### 5. Yetkisiz Alanlar (Erişemez)
- [ ] `http://localhost:3000/admin` → 403 veya login'e redirect
- [ ] `http://localhost:3000/admin/users` → Erişim YOK

---

## 🟡 TEST 4: LEARNER + REQUESTER
**Cüzdan:** `0xa58168607931de106c4d8330b8fd99489667b210`

### 📍 Test Adımları:

#### 1. J Academy - Kurs Alma (Learner)
- [ ] `http://localhost:3000/academy` - Academy ana sayfa
- [ ] `http://localhost:3000/academy/courses` - Kursları gör
  - [ ] Tüm aktif kurslar listede mi?
  - [ ] **TEST:** Kursa enroll ol
    - [ ] Kurs detayına git
    - [ ] "Enroll" butonu görünüyor mu?
    - [ ] Click ve kayıt ol
    - [ ] Points düşüyor mu?
  - [ ] **TEST:** Enrolled kursları gör
    - [ ] My Courses sayfasında görünüyor mu?
    - [ ] Progress tracking çalışıyor mu?

#### 2. Course Requests - Kurs İsteği
- [ ] `http://localhost:3000/academy/requests` - Kurs istekleri
  - [ ] **TEST:** Yeni kurs iste
    - [ ] "Request Course" butonuna tıkla
    - [ ] Title, description, category gir
    - [ ] Submit et
  - [ ] **TEST:** Kurs isteğine oy ver
    - [ ] Vote butonu çalışıyor mu?
    - [ ] Vote sayısı artıyor mu?

#### 3. J Studio - İstek Oluşturma (Requester)
- [ ] `http://localhost:3000/studio` - Studio ana sayfa
- [ ] `http://localhost:3000/studio/create` - İstek oluştur
  - [ ] **TEST:** Production request oluştur
    - [ ] Request type seç (cover_design, video_edit, etc.)
    - [ ] Title, description gir
    - [ ] Platform seç
    - [ ] Requirements yaz
    - [ ] Reference files yükle
    - [ ] Submit et

#### 4. My Requests - İsteklerimi Gör
- [ ] `http://localhost:3000/studio/my-requests` - İsteklerim
  - [ ] Oluşturduğun requests listede mi?
  - [ ] **TEST:** Request detayına git
  - [ ] **TEST:** Proposal kabul et/reddet
  - [ ] **TEST:** Delivery'yi onayla
  - [ ] **TEST:** Feedback ver ve rate et

#### 5. Yetkisiz İşlemler
- [ ] `http://localhost:3000/hub/create` → Erişim YOK (content_creator değil)
- [ ] `http://localhost:3000/academy/create` → Erişim YOK (mentor değil)
- [ ] `http://localhost:3000/admin` → Erişim YOK

---

## 🟢 TEST 5: SCOUT (Alpha Paylaşma)
**Cüzdan:** `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8`

### 📍 Test Adımları:

#### 1. J Alpha - Alpha Paylaşma
- [ ] `http://localhost:3000/alpha` - Alpha ana sayfa
- [ ] `http://localhost:3000/alpha/submit` - Alpha paylaş
  - [ ] **TEST:** Yeni alpha oluştur
    - [ ] Title, description gir
    - [ ] Alpha type seç (nft_mint, token_launch, etc.)
    - [ ] Contract address, token info gir
    - [ ] Potential rating seç (1-4)
    - [ ] Risk rating seç (low, medium, high)
    - [ ] Submit et

#### 2. My Alphas - Paylaştığım Alphalar
- [ ] `http://localhost:3000/alpha/my-alphas` - Alphalarım
  - [ ] Paylaştığın alphas listede mi?
  - [ ] Stats görünüyor mu? (bullish/bearish votes, views)
  - [ ] **TEST:** Alpha sil
  - [ ] Status görünüyor mu? (active, verified, expired)

#### 3. Alpha Feed - Tüm Alphalar
- [ ] `http://localhost:3000/alpha/feed` - Alpha feed
  - [ ] Tüm alphalar listede mi?
  - [ ] **TEST:** Alpha'ya oy ver (bullish/bearish)
  - [ ] **TEST:** Alpha detayına git
  - [ ] **TEST:** Comment yaz

#### 4. Yetkisiz İşlemler
- [ ] `http://localhost:3000/hub/create` → Erişim YOK
- [ ] `http://localhost:3000/academy/create` → Erişim YOK
- [ ] `http://localhost:3000/studio/create` → Erişim YOK (requester değil)

---

## 🟢 TEST 6: MEMBER (Sadece Temel Yetkiler)
**Cüzdan:** `0x8da45512ab9158796d06beaab0e545d33c23d484`

### 📍 Test Adımları:

#### 1. Temel Erişim Kontrolleri
- [ ] `http://localhost:3000/login` - Giriş yap
- [ ] `http://localhost:3000/` - Ana sayfa görünüyor mu?
- [ ] Header'da profil var mı?

#### 2. Görüntüleme Yetkileri (Sadece Okuma)
- [ ] `http://localhost:3000/hub` - Hub içeriklerini görebiliyor mu?
  - [ ] İçerikleri görebiliyor
  - [ ] **TEST:** Like/Bookmark yapabiliyor mu?
  - [ ] **TEST:** Comment yazabiliyor mu?
  - [ ] **KONTROL:** "Create Content" butonu YOK

- [ ] `http://localhost:3000/academy` - Kursları görebiliyor mu?
  - [ ] Kurs listesini görebiliyor
  - [ ] **KONTROL:** Kursa enroll olamaz (learner değil)
  - [ ] **KONTROL:** "Create Course" butonu YOK

- [ ] `http://localhost:3000/studio` - Studio requests görebiliyor mu?
  - [ ] Requests listesini görebiliyor
  - [ ] **KONTROL:** Request oluşturamaz (requester değil)
  - [ ] **KONTROL:** Proposal submit edemez

- [ ] `http://localhost:3000/alpha` - Alpha posts görebiliyor mu?
  - [ ] Alpha feed'i görebiliyor
  - [ ] **KONTROL:** Alpha submit edemez (scout değil)
  - [ ] **TEST:** Vote yapabiliyor mu?

#### 3. Profile Yönetimi
- [ ] `http://localhost:3000/center/profile` - Profil sayfası
  - [ ] Kendi profilini görebiliyor mu?
  - [ ] **TEST:** Display name değiştir
  - [ ] **TEST:** Bio güncelle
  - [ ] Stats görünüyor mu? (J-Rank Points, Contribution Score)

#### 4. Yetkisiz İşlemler (Tümü Erişim YOK)
- [ ] `http://localhost:3000/admin` → 403 veya redirect
- [ ] `http://localhost:3000/hub/create` → 403 veya buton görünmez
- [ ] `http://localhost:3000/academy/create` → 403 veya buton görünmez
- [ ] `http://localhost:3000/studio/create` → 403 veya buton görünmez
- [ ] `http://localhost:3000/alpha/submit` → 403 veya buton görünmez

---

## 🎯 ÖNEMLİ TEST NOKTALARI

### ✅ Her Test İçin Kontrol Edilmesi Gerekenler:

1. **Authentication**
   - [ ] Cüzdan ile giriş çalışıyor mu?
   - [ ] Token doğru şekilde kaydediliyor mu?
   - [ ] Logout çalışıyor mu?

2. **Authorization**
   - [ ] Doğru roller doğru sayfalara erişebiliyor mu?
   - [ ] Yetkisiz sayfalar 403 veriyor mu?
   - [ ] Butonlar role göre görünüyor/gizleniyor mu?

3. **Data Fetching**
   - [ ] API'ler doğru veri dönüyor mu?
   - [ ] Loading states çalışıyor mu?
   - [ ] Error handling doğru mu?

4. **CRUD Operations**
   - [ ] Create çalışıyor mu?
   - [ ] Read çalışıyor mu?
   - [ ] Update çalışıyor mu?
   - [ ] Delete çalışıyor mu?

5. **UI/UX**
   - [ ] Sayfalar donmuyor mu?
   - [ ] Redirect'ler hızlı mı?
   - [ ] Loading spinners görünüyor mu?
   - [ ] Toast notifications çalışıyor mu?

---

## 📊 Test Sonuç Formu

Her test tamamlandıkında işaretleyin:

| Test | Cüzdan | Durum | Hatalar | Notlar |
|------|--------|-------|---------|--------|
| Super Admin | 0x78c1...5cf9 | ⬜ Başarılı ⬜ Hatalı | | |
| Admin | 0x2ed1...28af | ⬜ Başarılı ⬜ Hatalı | | |
| Content Creator + Mentor | 0xf69c...7625 | ⬜ Başarılı ⬜ Hatalı | | |
| Learner + Requester | 0xa581...b210 | ⬜ Başarılı ⬜ Hatalı | | |
| Scout | 0xa59a...69b8 | ⬜ Başarılı ⬜ Hatalı | | |
| Member | 0x8da4...d484 | ⬜ Başarılı ⬜ Hatalı | | |

---

## 🐛 Hata Raporu Şablonu

Bir hata bulunduğunda:

```
🐛 HATA RAPORU

Tarih: [Tarih]
Test: [Test numarası ve adı]
Cüzdan: [0x...]
Sayfa: [URL]
Beklenen Davranış: [Ne olmalıydı]
Gerçek Davranış: [Ne oldu]
Hata Mesajı: [Varsa]
Adımlar:
1. [İlk adım]
2. [İkinci adım]
3. [Hata oluştuğu adım]

Ekran Görüntüsü: [Varsa]
```

---

## 📝 NOTLAR

- Her testten önce cache temizle (Ctrl+F5)
- Her rol değişikliğinde logout yap ve tekrar giriş yap
- Backend loglarını takip et
- Frontend console'u açık tut (F12)
- Network sekmesinden API çağrılarını kontrol et

**Test Başlangıç:** [Tarih/Saat]
**Test Bitiş:** [Tarih/Saat]
**Test Eden:** [İsim]
