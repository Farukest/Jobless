# Comment System - Case Studies


## CASE 1: Basit - Sadece benim yorumum
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
```

---

## CASE 2: Benim yorumuma tek cevap
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
├── Baskasi cevap B (A'ya, ilk)        ← Otomatik goster
```

---

## CASE 3: Benim yorumuma birden fazla cevap (benim cevabim yok)
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
├── Baskasi cevap B (A'ya, ilk)        ← Otomatik goster
└── "Show 2 more"                      ← Baskasi cevap C, D (A'ya)
```

---

## CASE 4: Benim yorumuma cevaplar + benim cevabim da var (benim cevabim ortada)
Kronoloji: B, C, BenimD, E
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
├── Baskasi cevap B (A'ya, ilk)        ← Otomatik goster
├── Benim cevabim D (A'ya)             ← Otomatik goster
└── "Show 2 more"                      ← Baskasi cevap C, E (A'ya)
```

---

## CASE 5: Baskasinin yorumuna benim cevabim
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
└── Benim cevabim B (A'ya)             ← Otomatik goster
```

---

## CASE 6a: Benim cevabima gelenler - "Show more" sonda
Kronoloji: BenimB, C(ilk), BenimD, E
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
├── Benim cevabim B (A'ya)             ← Otomatik goster
├── Baskasi cevap C (B'ye, ilk)        ← Otomatik goster
├── Benim cevabim D (B'ye)             ← Otomatik goster
└── "Show 1 more"                      ← Baskasi cevap E (B'ye)
```

---

## CASE 6b: Benim cevabima gelenler - "Show more" basta
Kronoloji: BenimB, E, C(ilk sonra geldi), BenimD
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
├── Benim cevabim B (A'ya)             ← Otomatik goster
├── "Show 1 more"                      ← Baskasi cevap E (B'ye)
├── Baskasi cevap C (B'ye, ilk)        ← Otomatik goster
└── Benim cevabim D (B'ye)             ← Otomatik goster
```

---

## CASE 6c: Benim cevabima gelenler - "Show more" ortada
Kronoloji: BenimB, C(ilk), E, F, BenimD
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
├── Benim cevabim B (A'ya)             ← Otomatik goster
├── Baskasi cevap C (B'ye, ilk)        ← Otomatik goster
├── "Show 2 more"                      ← Baskasi cevap E, F (B'ye)
└── Benim cevabim D (B'ye)             ← Otomatik goster
```

---

## CASE 7: Derin nested - zincirleme cevaplar
Kronoloji: A, B, BenimC, D, BenimE
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
├── Baskasi cevap B (A'ya, ilk)        ← Otomatik goster
├── Benim cevabim C (B'ye)             ← Otomatik goster
├── Baskasi cevap D (C'ye, ilk)        ← Otomatik goster
└── Benim cevabim E (D'ye)             ← Otomatik goster
```

---

## CASE 8: Baskasinin yorumuna ben ve baskalari - karisik sira
Kronoloji: A, G, BenimB, H, C, BenimD, E, F
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
├── "Show 2 more"                      ← Baskasi cevap G, H (A'ya) - ben cevap vermemisim
├── Benim cevabim B (A'ya)             ← Otomatik goster
├── Baskasi cevap C (B'ye, ilk)        ← Otomatik goster
├── Benim cevabim D (B'ye)             ← Otomatik goster
└── "Show 2 more"                      ← Baskasi cevap E, F (B'ye)
```

---

## CASE 9: Post'a birden fazla yorum dali - karisik kronoloji
Kronoloji: BenimA, D, B, BenimG, C, E, F, H, BenimI, J
```
├── Benim yorumum A (POST'a)           ← Otomatik goster
├── Baskasi cevap B (A'ya, ilk)        ← Otomatik goster
└── "Show 1 more"                      ← Baskasi cevap C (A'ya)

├── Baskasi yorumu D (POST'a)          ← Otomatik goster
(Baskasi cevap E, F (D'ye)             ← GOSTERILMEZ - ben yokum bu dalda)

├── Benim yorumum G (POST'a)           ← Otomatik goster
├── Baskasi cevap H (G'ye, ilk)        ← Otomatik goster
├── Benim cevabim I (G'ye)             ← Otomatik goster
└── Baskasi cevap J (I'ya, ilk)        ← Otomatik goster
```

---

## CASE 10: En karmasik - Her seviyede "Show more" farkli pozisyonlarda
Kronoloji: A, M, BenimB, N, L, C, BenimJ, H, BenimD, I, E, BenimF, G, K
```
├── Baskasi yorumu A (POST'a)          ← Otomatik goster
├── "Show 2 more"                      ← Baskasi cevap M, N (A'ya)
├── Benim cevabim B (A'ya)             ← Otomatik goster
├── "Show 1 more"                      ← Baskasi cevap L (B'ye)
├── Baskasi cevap C (B'ye, ilk)        ← Otomatik goster
├── Benim cevabim J (B'ye)             ← Otomatik goster
├── Baskasi cevap K (J'ye, ilk)        ← Otomatik goster
├── "Show 1 more"                      ← Baskasi cevap H (B'ye)
├── Benim cevabim D (C'ye)             ← Otomatik goster
├── "Show 1 more"                      ← Baskasi cevap I (D'ye)
├── Baskasi cevap E (D'ye, ilk)        ← Otomatik goster
├── Benim cevabim F (D'ye)             ← Otomatik goster
└── Baskasi cevap G (F'ye, ilk)        ← Otomatik goster
```

---

## ONEMLI NOTLAR

1. **"Show X more" sayisi** = Gizlenen baskalarinin cevap sayisi (benim cevaplarım dahil degil)
2. **Kronolojik sira** = Speifik case : Posta atılan direkt yorumlarda ilk benim yorumlar yeniden eskiye doğru.
3. **Kronolojik sira** = Geri kalan sıralama ise diğer tüm yorumlar eskiden yeniye doğru sıralanır
4. **"Show X more" pozisyonu** = Gizlenen yorumlarin kronolojik siradaki yeri
5. **GOSTERILMEZ** = Baskasinin yorumuna baskasinin cevabi ve ben o dalda hic yoksam. yorum altında 1 more reply gibi bir bölüm olmaz.
6. **ILK cevap** = Benim yorumuma gelen kronolojik olarak ilk cevap (kim yazmis olursa olsun)
7. **Yeni sayfa ile websocket ekleme çıkarma davranışı** = her zaman aynıdır.
8. **optmistic update ve eklenme istenmiyor** = her zaman servisten gelen cevapla aynı olması için optimistik update yok
9. **show more reply** = birtek blok halinde gereken yerlerde ( aralarda )  kullanılır commentin altına koyulmaz.

---

## ANALIZ - Gosterilecek Yorumlar

1. **POST'a direkt atilan tum yorumlar** (benim veya baskasinin) - %100 gösterilir hidden edilemez
2. ilk posta comment kime ait olursa olsun zaten gösteriliyor
eğer posta comment post sahibine aitse authorun o commentine atılan ilk yorum her zaman göstrerilir
eğer posta comment post sahibine ait değilse zaten gösteriliyor ama buna yapılan ilk yorum benim veya post sahibinin ise gösterilir. ( ben bu posta atılan commente 2. yorumu yaptıysam ve 1.yorumu author yaptıysa. authorun comment gösterilir. ben zaten hertürlü her yaptığım comment de gösteriliyorum biliyorsun kurallardan.
3. **POST'a direkt atilan tum yorumlara gelen ilk cevaplar** (post sahibinden ise) - %100 gösterilir hidden edilemez - vertical bağ ile gösterilir
4. **Benim yorumlarım** (her seviyede) - %100 gösterilir hidden edilemez
5. **Benim yorumuma gelen ILK cevap** - burada benim yorumum ve ona gelen ilk cevap vertical çizgi ile bağlı şekilde %100 gösterilir hidden edilemez

## ANALIZ - "Show X more" Icindekiler

- **Benim yorumuma gelen 2., 3., ... cevaplar** (benim cevaplarım HARIC)
- **bir X yorumuna yorum C attım. benim C'den önce ve sonra X'e gelen diğer tüm cevaplar 1.,2., 3., ... cevaplar kronolojik olarak ( aşağıda belirttim )** (benim cevaplarım HARIC. bu zaten böler)
- Kronolojik pozisyonda gosterilir (araya giren benim cevaplarım show more'u bolebilir)

## ANALIZ - Gosterilmeyenler

- **Baskasinin yorumuna baskasinin cevabi** (ben o dalda hic yoksam. başkasının yorumu ile bağ kurmadıysam)

---

## INTERFACE

```typescript
interface CommentDisplay {
  _id: string
  content: string
  author: { _id: string, username: string, avatar?: string }
  parentId: string | null
  createdAt: Date

  show: boolean
  showReason:
    | 'my_comment'                 // Benim yorumum
    | 'post_direct'                // POST'a direkt yorum
    | 'first_reply_to_mine'        // Benim yorumuma ilk cevap
    | 'my_reply'                   // Benim cevabim
    | 'first_reply_to_my_reply'    // Benim cevabima ilk cevap
    | 'i_replied_to_this'          // Ben buna cevap verdim
    | 'hidden'                     // Gosterilmez (show more icinde)
}

interface HiddenGroup {
  afterCommentId: string           // Hangi comment'ten sonra gosterilecek
  parentId: string                 // Hangi yoruma cevaplar bunlar
  count: number                    // Kac tane gizli
  commentIds: string[]             // Gizli comment ID'leri
}

interface CommentThreadResponse {
  comments: CommentDisplay[]       // Sirali, gosterilecekler + hidden olanlar
  hiddenGroups: HiddenGroup[]      // "Show X more" butonlari icin pozisyon bilgisi
}
```
