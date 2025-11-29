# 🚀 HIZLI TEST REHBERİ - JOBLESS PLATFORM

## 📋 Test İçin Hazırlanan Cüzdanlar

| # | Cüzdan Adresi | Rol | Test Önceliği |
|---|--------------|-----|---------------|
| 1 | `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9` | **super_admin** ✅ | 🔴 Kritik |
| 2 | `0x2ed164398ae3724502e68ce7a3936bb7b0b128af` | **admin** | 🔴 Kritik |
| 3 | `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625` | **content_creator + mentor** | 🟡 Orta |
| 4 | `0xa58168607931de106c4d8330b8fd99489667b210` | **learner + requester** | 🟡 Orta |
| 5 | `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8` | **scout** | 🟢 Normal |
| 6 | `0x8da45512ab9158796d06beaab0e545d33c23d484` | **member** | 🟢 Normal |

---

## ⚡ HIZLI TEST SENARYOLARI

### 🔴 TEST 1: SUPER ADMIN (5 Dakika)
**Cüzdan:** `0x78c1e25054e8a3f1bc7f9d16f4e5dac0ba415cf9`

#### Yapılacaklar:
1. **Login:** http://localhost:3000/login
2. **Admin Panel:** http://localhost:3000/admin/dashboard
   - Stats kartlarını gör
3. **Kullanıcı Yönetimi:** http://localhost:3000/admin/users
   - Bir kullanıcı bul
   - Role değiştir
4. **İçerik Yönetimi:** http://localhost:3000/admin/content
   - Content listesini gör
   - Bir tane moderate et (approve/reject)
5. **Analytics:** http://localhost:3000/admin/analytics
   - Stats görünüyor mu kontrol et

**Beklenen:** Her şeye erişim olmalı, hiçbir kısıtlama yok.

---

### 🔴 TEST 2: ADMIN (3 Dakika)
**Cüzdan:** `0x2ed164398ae3724502e68ce7a3936bb7b0b128af`

#### Yapılacaklar:
1. **Login:** http://localhost:3000/login
2. **Admin Panel:** http://localhost:3000/admin/dashboard
   - Dashboard'u görebiliyor mu?
3. **Users Sayfası:** http://localhost:3000/admin/users
   - Kullanıcıları görebiliyor mu?
   - **KONTROL:** Edit butonu çalışmıyor olmalı (403 hata)
4. **Content Sayfası:** http://localhost:3000/admin/content
   - İçerikleri görebiliyor mu?
   - **KONTROL:** Moderate edemez (super_admin gerekli)

**Beklenen:** Görüntüleyebilir ama düzenleyemez.

---

### 🟡 TEST 3: CONTENT CREATOR + MENTOR (10 Dakika)
**Cüzdan:** `0xf69c19f9b8f616c8fa3c6b67ba500d5dcbc17625`

#### Yapılacaklar:
1. **Hub - İçerik Oluştur:** http://localhost:3000/hub/create
   - Video oluştur
   - Title: "Test Video"
   - Description: "Test açıklaması"
   - Submit et

2. **My Content:** http://localhost:3000/hub/my-content
   - Oluşturduğun içeriği gör

3. **Academy - Kurs Oluştur:** http://localhost:3000/academy/create
   - Yeni kurs oluştur
   - Title: "Test Kursu"
   - Category: Design
   - Submit et

4. **My Courses:** http://localhost:3000/academy/my-courses
   - "Created Courses" sekmesini gör
   - Oluşturduğun kursu gör

5. **Admin Panel:** http://localhost:3000/admin
   - **KONTROL:** Erişim YOK (403 veya redirect)

**Beklenen:** İçerik ve kurs oluşturabilir, admin panele ERİŞEMEZ.

---

### 🟡 TEST 4: LEARNER + REQUESTER (8 Dakika)
**Cüzdan:** `0xa58168607931de106c4d8330b8fd99489667b210`

#### Yapılacaklar:
1. **Academy - Kurslara Bak:** http://localhost:3000/academy/courses
   - Kurs listesini gör
   - Bir kursa enroll ol

2. **My Courses:** http://localhost:3000/academy/my-courses
   - Enrolled kursları gör

3. **Studio - İstek Oluştur:** http://localhost:3000/studio/create
   - Request type: Video Edit
   - Title: "Test Video Düzenleme"
   - Submit et

4. **My Requests:** http://localhost:3000/studio/my-requests
   - Oluşturduğun isteği gör

5. **Hub - İçerik Oluştur:** http://localhost:3000/hub/create
   - **KONTROL:** Erişim YOK (content_creator değil)

**Beklenen:** Kurs alabilir, studio isteği oluşturabilir, HUB'da içerik oluşturamaz.

---

### 🟢 TEST 5: SCOUT (5 Dakika)
**Cüzdan:** `0xa59a01b0ddc8fc239c01ccaba94d431004c169b8`

#### Yapılacaklar:
1. **Alpha - Paylaş:** http://localhost:3000/alpha/submit
   - Title: "Test NFT Mint"
   - Description: "Test alpha"
   - Alpha type: NFT Mint
   - Potential: 4/4
   - Risk: Low
   - Submit et

2. **My Alphas:** http://localhost:3000/alpha/my-alphas
   - Paylaştığın alpha'yı gör
   - Stats kontrol et

3. **Hub - İçerik Oluştur:** http://localhost:3000/hub/create
   - **KONTROL:** Erişim YOK

4. **Studio - İstek Oluştur:** http://localhost:3000/studio/create
   - **KONTROL:** Erişim YOK

**Beklenen:** Sadece alpha paylaşabilir, diğer platformlarda içerik oluşturamaz.

---

### 🟢 TEST 6: MEMBER (3 Dakika)
**Cüzdan:** `0x8da45512ab9158796d06beaab0e545d33c23d484`

#### Yapılacaklar:
1. **Ana Sayfa:** http://localhost:3000/
   - Giriş yapıldı mı kontrol et

2. **Hub - İçerikleri Gör:** http://localhost:3000/hub
   - İçerikleri görebiliyor mu?
   - Like yapabiliyor mu?
   - **KONTROL:** "Create Content" butonu YOK

3. **Academy - Kursları Gör:** http://localhost:3000/academy
   - Kursları görebiliyor mu?
   - **KONTROL:** Enroll olamaz (learner değil)

4. **Alpha - Feedı Gör:** http://localhost:3000/alpha/feed
   - Alpha posts'ları görebiliyor mu?
   - Vote yapabiliyor mu?
   - **KONTROL:** "Submit Alpha" butonu YOK

5. **Admin Panel:** http://localhost:3000/admin
   - **KONTROL:** Erişim YOK

6. **Profile:** http://localhost:3000/center/profile
   - Profilini görebiliyor mu?
   - Stats görünüyor mu?

**Beklenen:** Sadece görüntüleyebilir, hiçbir şey oluşturamaz, admin panele ERİŞEMEZ.

---

## ✅ TEST KONTROL LİSTESİ

### Kritik Kontroller:

- [ ] Super admin tüm sayfalara erişebiliyor
- [ ] Admin kullanıcıları görebiliyor ama düzenleyemiyor
- [ ] Content creator içerik oluşturabiliyor
- [ ] Mentor kurs oluşturabiliyor
- [ ] Learner kursa enroll olabiliyor
- [ ] Requester studio isteği oluşturabiliyor
- [ ] Scout alpha paylaşabiliyor
- [ ] Member sadece görebiliyor, oluşturamıyor
- [ ] Yetkisiz sayfalar 403 veriyor veya redirect ediyor
- [ ] Her rol sadece yetkisi olan işlemleri yapabiliyor

---

## 🐛 Hata Bulursan:

1. Ekran görüntüsü al
2. Hangi cüzdan/rol ile test ettiğini not et
3. Hangi sayfada hata olduğunu not et
4. Browser console'dan hata mesajını kopyala
5. Network sekmesinden API yanıtını kontrol et

---

## 📝 Test Notları:

- Her testten önce logout yap ve yeni cüzdan ile giriş yap
- Browser cache'ini temizle (Ctrl+F5)
- Backend ve frontend serverlarının çalıştığından emin ol
- MongoDB'nin çalıştığından emin ol

**Test Tarihi:** ________________

**Test Eden:** ________________

**Sonuç:** ⬜ Başarılı  ⬜ Hatalı

**Notlar:**
____________________________________________
____________________________________________
____________________________________________
