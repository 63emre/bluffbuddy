# 10 - Buddy Bluff: Resmi Oyun Kılavuzu

> **Sahip:** Tüm Geliştiriciler  
> **Son Güncelleme:** Şubat 2026  
> **Durum:** Resmi Kurallar v0.1.0

---

**Buddy Bluff**, 4 kişilik, dostlukların sınırlarını zorlayan, hafıza, strateji ve blöf üzerine kurulu rekabetçi bir kart oyunudur.

> **Motto:** *"Kendini koru, rakibine kazık at!"*

---

## İçindekiler

1. [Oyunun Amacı](#1-oyunun-amacı)
2. [Kart Puanları (Cezalar)](#2-kart-puanları-cezalar)
3. [Kurulum (Setup)](#3-kurulum-setup)
4. [Oyun Alanı Terimleri](#4-oyun-alanı-terimleri)
5. [Oynayış Kuralları](#5-oynayış-kuralları)
6. [Mühür (Kilitleme) Mekaniği](#6-mühür-kilitleme-mekaniği)
7. [İleri Düzey Stratejiler](#7-ileri-düzey-stratejiler)
8. [Oyun Sonu](#8-oyun-sonu)
9. [Özel Durumlar (Online)](#9-özel-durumlar-online)

---

## 1. Oyunun Amacı

Oyunun sonunda **en az ceza puanına** sahip olmak.

Bunu başarmak için:
- Elinizdeki kartları kullanarak yerdeki veya rakiplerin önündeki kartları **eşleştirmeli**
- Oluşan ceza yığınlarını rakiplerinizin önüne (**Ceza Slotuna**) yüklemelisiniz

```
┌─────────────────────────────────────────────────────────────────┐
│                    OYUNUN ÖZETİ                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   🎯 AMAÇ: En az ceza puanıyla bitirmek                         │
│                                                                  │
│   🃏 YÖNTEM:                                                     │
│      1. Elindeki kartla masadaki kartı eşleştir (RÜTBE)         │
│      2. Eşleşen kartları RAKİBİNE at (kazık!)                   │
│      3. Veya eşleşme yoksa Havuz'a kart at                      │
│                                                                  │
│   🏆 KAZANAN: En düşük ceza puanı olan oyuncu                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Kart Puanları (Cezalar)

Oyun sonunda önünüzdeki **Ceza Slotu**'nda biriken kartların puanları toplanır. Amaç puanı düşük tutmaktır.

| Kart | Puan | Açıklama |
|------|------|----------|
| **3** | 30 | ⚠️ Oyunun en tehlikeli kartı! |
| **Vale (J)** | 20 | Yüksek risk |
| **Kız (Q)** | 15 | Orta-yüksek risk |
| **As (A)** | 11 | Dikkat! |
| **Papaz (K)** | 10 | |
| **10** | 10 | |
| **9** | 9 | |
| **8** | 8 | |
| **7** | 7 | |
| **6** | 6 | |
| **5** | 5 | |
| **4** | 4 | |
| **2** | 2 | En az puanlı |

### Neden 3 En Yüksek?

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUAN MANTIGI                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   3 = 30 puan  ──► Elinde kalırsa felaket!                      │
│   J = 20 puan  ──► Hızlıca kurtul                               │
│   Q = 15 puan  ──► Orta-yüksek risk                             │
│   A = 11 puan  ──► Tehlikeli ama kullanışlı                     │
│                                                                  │
│   Bu sistem oyuncuları yüksek puanlı kartlardan                 │
│   kurtulmak için risk almaya teşvik eder!                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Kurulum (Setup)

### Genel Bilgiler

| Özellik | Değer |
|---------|-------|
| **Oyuncu Sayısı** | 4 (ideal) |
| **Deste** | Standart 52 kartlık iskambil |
| **Yön** | Saat yönünün **tersine** (counter-clockwise) |

### Başlangıç Adımları

1. Deste iyice karıştırılır
2. Oyuna **rastgele** bir oyuncu başlar
3. Masanın tam ortasına **4 adet kart** yan yana **açık** dizilir → **"Açık Orta"**
4. Kalan **48 kart**, oyunculara **3 tur** halinde dağıtılır (her turda 4'er kart)

```
               ┌─────────────────────────────────┐
               │          AÇIK ORTA              │
               │   [K♠]  [7♥]  [Q♦]  [3♣]       │
               │   (4 açık kart yan yana)        │
               └─────────────────────────────────┘

    [Oyuncu 4]                              [Oyuncu 2]
    Ceza Slotu                              Ceza Slotu
         ↑                                       ↑
         │         ┌───────────────┐             │
         │         │    HAVUZ      │             │
         │         │   (Boş)       │             │
         │         └───────────────┘             │
         ↓                                       ↓
    [Oyuncu 3]     ← ← ← ← ← ←           [Oyuncu 1]
    Ceza Slotu   (Saat yönü TERSİ)       Ceza Slotu
```

> **Not:** Açık Orta'daki kartlar eşleşip alındığında yerine yenisi konmaz, orası boş kalır.

---

## 4. Oyun Alanı Terimleri

### 4.1 Açık Orta (Open Center)

```
┌─────────────────────────────────────────────────────────────────┐
│   AÇIK ORTA                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   • Masanın ortasında başlangıçta açılan 4 kart                 │
│   • Herkesin erişimine açık                                     │
│   • Tek kullanımlık slotlar (alınınca kapanır, yenisi gelmez)   │
│                                                                  │
│   Başlangıç:  [K♠]  [7♥]  [Q♦]  [3♣]                           │
│   Sonra:      [  ]  [7♥]  [  ]  [3♣]  (K ve Q alındı)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Havuz (The Pool / Ortak Yığın)

```
┌─────────────────────────────────────────────────────────────────┐
│   HAVUZ                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   • Oyuncuların eşleşme yapamadığı kartları attığı yığın        │
│   • Stratejik olarak da kart atılabilir                         │
│   • LIFO (Son giren ilk çıkar)                                  │
│   • Sadece EN ÜSTTEKİ KART görünür ve alınabilir                │
│   • Altındaki kartlar "gömülü" sayılır                          │
│                                                                  │
│        ┌─────┐                                                   │
│        │ 9♥  │ ← Sadece bu kart alınabilir                      │
│        │ 5♦  │ ← Gömülü (ulaşılamaz)                            │
│        │ K♣  │ ← Gömülü                                         │
│        │ ... │                                                   │
│        └─────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Ceza Slotu (Penalty Slot)

```
┌─────────────────────────────────────────────────────────────────┐
│   CEZA SLOTU                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   • Her oyuncunun önündeki kişisel alan                         │
│   • Size "atılan kazıklar" burada birikir                       │
│   • LIFO mantığı (sadece en üstteki grup erişilebilir)          │
│   • Oyun sonunda buradaki kartların puanları toplanır           │
│                                                                  │
│   Örnek: Ali'nin Ceza Slotu                                     │
│        ┌─────┐                                                   │
│        │ J♠  │ ← En üst grup (eşleştirilebilir)                 │
│        │ J♥  │                                                   │
│        │─────│ ← Grup sınırı                                    │
│        │ 9♦  │ ← Alt grup (J'ler alınırsa açığa çıkar)          │
│        │ 9♣  │                                                   │
│        └─────┘                                                   │
│        = 20 + 20 + 9 + 9 = 58 ceza puanı                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Oynayış Kuralları

Sırası gelen oyuncu elindeki **bir kartı** kullanarak şu **iki hamleden birini** yapmak zorundadır:

### A. Eşleştirme ve Ceza Verme (Kazık Atma) 🎯

Elinizdeki bir kartın **rütbesi** (sayısal değeri) ile masadaki bir kart eşleşiyorsa bu hamleyi yapabilirsiniz.

> **Önemli:** Renk/simge önemli değil, sadece **RÜTBE** eşleşmeli!

#### Nerelerden Eşleştirme Yapılabilir?

```
┌─────────────────────────────────────────────────────────────────┐
│              EŞLEŞTİRME ÖNCELİK SIRASI                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1️⃣  AÇIK ORTA'dan alma                                        │
│       Elinde Q var, Açık Orta'da da Q var → Eşleştir!           │
│                                                                  │
│   2️⃣  HAVUZ'dan alma (sadece en üst kart)                       │
│       Havuz'un tepesindeki kart elinle eşleşiyorsa al           │
│       NOT: Havuzda üst üste aynı kartlar varsa hepsini al!      │
│                                                                  │
│   3️⃣  CEZA SLOTLARINDAN çalma/ekleme                            │
│       Herhangi bir oyuncunun (kendin dahil) ceza slotunun       │
│       en üstündeki kartla eşleşiyorsan:                         │
│       • EKLEME: Kartını üstüne bırak (cezasını artır)           │
│       • TAŞIMA: Kartları al, başka oyuncuya taşı                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Eşleşme Örnekleri

**Örnek 1 - Açık Orta'dan Alma:**
```
Elinde: [Q♥]
Açık Orta: [K♠] [7♥] [Q♦] [3♣]
                      ↑
                   Eşleşme!

Aksiyon: Q♥ + Q♦ alınır → Rakibin ceza slotuna atılır
Sonuç: Açık Orta'da Q'nun yeri boş kalır
```

**Örnek 2 - Havuz'dan Alma:**
```
Elinde: [5♣]
Havuz tepesi: [5♦]

Aksiyon: 5♣ + 5♦ alınır → İstediğin oyuncunun ceza slotuna at
```

**Örnek 3 - Sıralı Havuz Alma:**
```
Elinde: [2♥]
Havuz (üstten alta): [2♦] [2♠] [K♣] ...
                      ↑    ↑
                   Sıralı 2'ler!

Aksiyon: Elindeki 2♥ ile havuzdaki TÜM sıralı 2'leri al
         2♥ + 2♦ + 2♠ = 3 kart → Rakibe kazık!
```

**Örnek 4 - Ceza Slotundan Çalma:**
```
Mert'in Ceza Slotu:
┌─────┐
│ A♠  │ ← En üst
│ A♥  │
└─────┘

Elinde: [A♦]

Aksiyon Seçenekleri:
1. EKLEME: A♦'yi Mert'in üstüne koy (cezası +11)
2. TAŞIMA: A♦ + A♠ + A♥ al → Ayşe'ye at (3 As = 33 puan!)
```

#### Kritik Kurallar

| Kural | Açıklama |
|-------|----------|
| **Hedef Kısıtlaması YOK** | Cezayı istediğin oyuncuya atabilirsin, önünde ne olursa olsun |
| **Kendine Atabilirsin** | Stratejik olarak kendi önüne de koyabilirsin |
| **Soğan Kabuğu (Sıyırma)** | Ceza slotundan sadece en üst grup alınır |
| **Kendi Cezanı Savunma** | Önündeki kartları alıp başkasına atabilirsin (Kontra Atak!) |

#### Soğan Kabuğu (Sıyırma) Mantığı 🧅

Ceza Slotundan kart alırken, **sadece en üstteki eşleşen rütbe grubunu** alırsınız.

```
┌─────────────────────────────────────────────────────────────────┐
│              SIYIRMA (SOĞAN KABUĞU) ÖRNEĞİ                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Rakibin Ceza Slotu:                                           │
│        ┌─────┐                                                   │
│        │ J♠  │ ← En üst grup (Vale'ler)                         │
│        │ J♥  │                                                   │
│        │─────│                                                   │
│        │ 9♦  │ ← Alt grup (9'lar) - ŞİMDİLİK KORUNUYOR          │
│        │ 9♣  │                                                   │
│        └─────┘                                                   │
│                                                                  │
│   Elinde: [J♦]                                                  │
│                                                                  │
│   Aksiyon: J♦ + J♠ + J♥ al (Vale'leri sıyırdın)                 │
│                                                                  │
│   Rakibin YENİ Ceza Slotu:                                      │
│        ┌─────┐                                                   │
│        │ 9♦  │ ← Artık 9'lar açığa çıktı!                       │
│        │ 9♣  │   Rakip savunmasız!                              │
│        └─────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### B. Havuza Kart Atma (Pas Geçme) 📤

Eğer elinizdeki kartlarla **hiçbir yerde** eşleşme yapamıyorsanız (veya stratejik olarak yapmak istemiyorsanız):

1. Elinizden bir kart seçin
2. Havuz'un en tepesine **açık** olarak atın
3. Bu kart artık bir sonraki oyuncu için hedef olabilir

```
┌─────────────────────────────────────────────────────────────────┐
│              HAVUZA ATMA                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Elinde: [3♠, J♥, 7♦, 4♣]                                      │
│                                                                  │
│   Açık Orta:  [K♠] [  ] [Q♦] [  ]  (eşleşme yok)               │
│   Havuz:      [A♣]                  (eşleşme yok)               │
│   Ceza Slotları: (eşleşme yok)                                  │
│                                                                  │
│   Zorunlu Hamle: Havuza bir kart at                             │
│                                                                  │
│   ⚠️ STRATEJİ:                                                   │
│   • 7♦ veya 4♣ at (düşük puanlı)                                │
│   • 3♠ ATMA! (30 puan, birisi alırsa sana atabilir)             │
│   • J♥ riskli (20 puan)                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Mühür (Kilitleme) Mekaniği

Bu oyunun **en stratejik** kuralıdır!

### Mühür Nedir?

Mühürlenen kartlar ve onların altında kalan tüm kartlar **dokunulmaz** hale gelir:
- ❌ Alınamaz
- ❌ Taşınamaz
- ❌ Değiştirilemez

**O ceza puanları oyun sonuna kadar o oyuncuya kilitlenmiştir!**

### Altın Soru 🔑

> *"Ceza slotunun tepesindeki bu kartı eşleştirip alabilecek 'Anahtar Kart' şu an evrende ulaşılabilir durumda mı?"*

**Cevap HAYIR ise → O slot MÜHÜRLENMİŞTİR!**

### Mühür Türleri

#### 1️⃣ Tam Mühür (4 Kart Kuralı)

Bir Ceza Slotu'nda aynı rütbeden **4 kart** üst üste gelirse, seri tamamlanır.

```
┌─────────────────────────────────────────────────────────────────┐
│              TAM MÜHÜR ÖRNEĞİ                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Ali'nin Ceza Slotu:                                           │
│        ┌─────┐                                                   │
│        │ K♠  │                                                   │
│        │ K♥  │  4 tane Papaz = TAM MÜHÜR! 🔒                    │
│        │ K♦  │                                                   │
│        │ K♣  │                                                   │
│        │─────│                                                   │
│        │ 9♦  │ ← Bunlar da artık kilitli                        │
│        │ 5♣  │                                                   │
│        └─────┘                                                   │
│                                                                  │
│   Neden? Destede 5. bir Papaz olamayacağı için kimse bu         │
│   kartları alamaz. Grup ve altındakiler sonsuza dek kilitli!    │
│                                                                  │
│   Ali'nin KİLİTLİ cezası: 10+10+10+10+9+5 = 54 puan            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2️⃣ Kayıp Kart Mühürü (Ulaşılamazlık Kuralı)

Bir kartın mühürlenmesi için **4 tane olması GEREKMEZ!** Eşleşebilecek kartlar "ulaşılamaz" durumdaysa, tepedeki kartlar (1 tane bile olsa) mühür sayılır.

**Senaryo A - Havuzun Dibine Gömülme:**
```
┌─────────────────────────────────────────────────────────────────┐
│              HAVUZ GÖMME MÜHÜRÜ                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Durumu takip et:                                              │
│   • 2 tane As Havuz'a atıldı ve üstüne başka kartlar geldi      │
│   • 1 tane As başka bir ceza slotunun altında (gömülü)          │
│                                                                  │
│   Havuz:           Ayşe'nin Ceza Slotu:                         │
│   ┌─────┐          ┌─────┐                                       │
│   │ 7♦  │ ← Tepede │ A♥  │ ← TEK AS! (elde veya görünürde)      │
│   │ Q♣  │          └─────┘                                       │
│   │ A♠  │ ← Gömülü (ulaşılamaz)                                 │
│   │ A♦  │ ← Gömülü (ulaşılamaz)                                 │
│   │ ... │                                                        │
│   └─────┘                                                        │
│                                                                  │
│   4. As nerede? → Mert'in ceza slotunun ALTında (gömülü)!       │
│                                                                  │
│   SONUÇ: Ayşe'nin tek As'ı MÜHÜRLENDİ! 🔒                       │
│   Çünkü eşleştirebilecek hiçbir As ulaşılabilir değil.          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Senaryo B - Başka Slotun Altına Kaynama:**
```
┌─────────────────────────────────────────────────────────────────┐
│              ÇAPRAZ MÜHÜRLEME                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Ali'nin Slotu:        Ayşe'nin Slotu:                         │
│   ┌─────┐               ┌─────┐                                  │
│   │ Q♠  │ ← 2 Kız       │ J♥  │ ← En üst (Vale)                 │
│   │ Q♥  │               │ Q♦  │ ← Gömülü Kız!                   │
│   └─────┘               │ Q♣  │ ← Gömülü Kız!                   │
│                         └─────┘                                  │
│                                                                  │
│   Ali'nin Kızları mühürlü mü?                                   │
│   • 4 Kız var destede                                           │
│   • 2 tanesi Ali'de (üstte, görünür)                            │
│   • 2 tanesi Ayşe'de (Vale'nin altında, ulaşılamaz)             │
│                                                                  │
│   SONUÇ: Ali'nin 2 Kız'ı MÜHÜRLENDİ! 🔒                         │
│   Kimse Kız oynayıp bunları alamaz.                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kritik Uyarı: Mühür İspatı ve Hafıza 🧠

**Buddy Bluff bir HAFIZA oyunudur!**

```
┌─────────────────────────────────────────────────────────────────┐
│              HAFIZA KURALI                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ❌ Bir oyuncu "Bu kart mühürlü" dedi diye havuz               │
│      karıştırılmaz veya kontrol edilmez!                        │
│                                                                  │
│   ✅ Eğer bir kartın eşinin havuzda gömülü olduğunu             │
│      BİLİYORSANIZ, o karta dokunmazsınız (çünkü mühürlüdür)     │
│                                                                  │
│   ✅ Eğer rakip hafızasına güvenmeyip hamle yapmaya             │
│      çalışırsa ve eşleştiremezse, zaten fiziksel olarak         │
│      hamle yapamamış olur                                       │
│                                                                  │
│   🔑 ALTIN KURAL: Havuza asla bakılmaz!                         │
│      Mühür durumu, kartlar oynandıkça kendiliğinden ortaya çıkar│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. İleri Düzey Stratejiler

### 7.1 Dost Kazığı 🎯

Genelde kazanmaya en yakın (puanı en az) oyuncuya yüklenmek oyunun doğasında vardır.

```
Puan durumu: Ali=45, Ayşe=30, Mert=60, Sen=50

Strateji: Ayşe'ye kazık at! (En az puanlı, kazanıyor)
```

### 7.2 Hafıza Takibi 🧠

Havuza hangi kartların atıldığını takip etmek **hayati önem** taşır.

```
┌─────────────────────────────────────────────────────────────────┐
│              HAFIZA TAKİBİ ÖRNEĞİ                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Gözlemlerin:                                                  │
│   • A♠ havuza atıldı (3. turda)                                 │
│   • A♦ havuza atıldı (5. turda)                                 │
│   • A♣ Mert'in cezasının altında gömülü                         │
│                                                                  │
│   Elinde: A♥ (tek ulaşılabilir As!)                             │
│                                                                  │
│   STRATEJİ: Rakibin önüne tek As koy → OTOMATİK MÜHÜR!          │
│   11 puan rakibe kilitlendi!                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Kendi Kendini Mühürleme (Self-Sealing) 🛡️

Eğer önünüzde yüksek puanlı kartlar varsa ve bunların başkası tarafından alınıp size daha büyük bir yığınla dönmesinden korkuyorsanız:

```
┌─────────────────────────────────────────────────────────────────┐
│              SELF-SEALING STRATEJİSİ                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Durumun:                                                      │
│   • Önünde 2 tane 3'lü var (60 puan!)                           │
│   • Elinde 1 tane 3'lü var                                      │
│   • 4. 3'lü havuzda gömülü (biliyorsun)                         │
│                                                                  │
│   RİSK: Rakip 2 tane 3'lüyü alıp + kendi kartlarıyla            │
│         sana 90+ puanlık yığın atabilir!                        │
│                                                                  │
│   ÇÖZÜM: Elindeki 3'lüyü KENDİ önüne koy                        │
│          3 tane 3'lü + ulaşılamaz 4. = MÜHÜR! 🔒                │
│                                                                  │
│   SONUÇ: 90 puan sende kilitlendi AMA                           │
│          en azından daha fazla büyümeyecek!                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Strateji Özet Tablosu

| Strateji | Ne Zaman | Risk |
|----------|----------|------|
| **Dost Kazığı** | Rakip kazanıyorken | Düşük |
| **Hafıza Mühürü** | Kartları takip ettiysen | Orta |
| **Self-Sealing** | Büyük yığın büyüyecekken | Yüksek |
| **Soğan Sıyırma** | Rakibin altını açmak için | Orta |
| **Kontra Atak** | Önündeki kartları savunmak için | Orta |

---

## 8. Oyun Sonu

### Bitiş Koşulu

Tüm oyuncuların elindeki kartlar bittiğinde oyun sona erer.

> **Not:** Oyun 3 tur halinde oynanır. Her turda 4 kart dağıtılır, eller boşaldığında yeni tur başlar. 3. tur bitince oyun biter.

### Puan Hesaplama

1. Herkes önündeki **tüm kartların** (mühürlü veya değil) puanlarını toplar
2. En **az puana** sahip olan kazanır!

```
═══════════════════════════════════════════════════════════════════
                    OYUN SONU HESAPLAMA
═══════════════════════════════════════════════════════════════════

Ali'nin Ceza Slotu:                     Ayşe'nin Ceza Slotu:
┌─────┐                                 ┌─────┐
│ K♠  │ 10                              │ 3♠  │ 30  🔒 Mühürlü
│ K♥  │ 10  🔒 Mühürlü                  │ 3♥  │ 30  🔒
│ K♦  │ 10  🔒                          │ 3♦  │ 30  🔒
│ K♣  │ 10  🔒                          └─────┘
│ 9♦  │ 9   🔒                          
└─────┘                                 Toplam: 90 puan

Toplam: 49 puan

Mert'in Ceza Slotu:                     Zeynep'in Ceza Slotu:
┌─────┐                                 ┌─────┐
│ J♠  │ 20                              │ 7♦  │ 7
│ J♥  │ 20                              │ 5♣  │ 5
│ 2♦  │ 2                               │ 2♠  │ 2
└─────┘                                 └─────┘

Toplam: 42 puan                         Toplam: 14 puan

═══════════════════════════════════════════════════════════════════
                         SONUÇLAR
═══════════════════════════════════════════════════════════════════

🥇 1. Zeynep: 14 puan  ──► KAZANAN!
🥈 2. Mert:   42 puan
🥉 3. Ali:    49 puan
💀 4. Ayşe:   90 puan  ──► (3'lü felaketi!)

═══════════════════════════════════════════════════════════════════
```

---

## 9. Özel Durumlar (Online)

### 9.1 Bağlantı Kopması

- **30 saniye** içinde yeniden bağlanırsa oyuna devam eder
- 30 saniye geçerse **bot devralır**
- Bot güvenli oynar (riskli hamlelerden kaçınır)

### 9.2 Zaman Aşımı

- Her oyuncunun **30 saniye** düşünme süresi var
- Süre dolunca otomatik olarak Havuz'a rastgele düşük puanlı kart atılır

### 9.3 Beraberlik

Aynı puana sahip oyuncular **aynı sırayı paylaşır** ve ELO eşit dağılır.

---

## Hızlı Referans Kartı

### Puanlar

| Kart | Puan |
|------|------|
| 3 | 30 ⚠️ |
| J | 20 |
| Q | 15 |
| A | 11 |
| K | 10 |
| 10 | 10 |
| 2-9 | Yazılı değer |

### Eylemler

| Eylem | Açıklama |
|-------|----------|
| **Eşleştir** | Aynı rütbeyi bul → Ceza olarak at |
| **Havuza At** | Eşleşme yoksa kart at |

### Eşleşme Yerleri (Öncelik Sırası)

| Sıra | Yer | Özellik |
|------|-----|---------|
| 1 | Açık Orta | 4 slot, tek kullanımlık |
| 2 | Havuz | Sadece en üst kart (sıralılar dahil) |
| 3 | Ceza Slotları | Sadece en üst grup |

### Mühür Kuralları

| Durum | Sonuç |
|-------|-------|
| 4 aynı kart üst üste | Tam Mühür 🔒 |
| Eşi ulaşılamaz (havuzda gömülü / başka slotta gömülü) | Kayıp Kart Mühürü 🔒 |

---

*Doküman Versiyonu: 1.0 | Son Güncelleme: Şubat 2026*
