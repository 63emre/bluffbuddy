# BluffBuddy Online v0.1.0 - Teknik Dokümantasyon

> **Buddy Bluff**: Dostlukların sınırlarını zorlayan, hafıza, strateji ve blöf üzerine kurulu 4 kişilik rekabetçi kart oyunu.

---

## 📋 Proje Özeti

BluffBuddy 
Bu versiyon (v0.1.0), **backend-only** bir implementasyon olup, aşağıdaki hedefleri karşılamak üzere tasarlanmıştır:

| Metrik | Hedef |
|--------|-------|
| Eşzamanlı Kullanıcı (CCU) | 250 |
| Aylık Bütçe | €12 (Hetzner Cloud) |
| Sunucu | CPX21 (3 vCPU, 4GB RAM) |
| Mimari | Otoriter Sunucu (Authoritative Server) |

---

## 🏗️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend Framework | NestJS (Node.js) |
| Gerçek Zamanlı İletişim | Socket.io |
| Veritabanı | Firebase Firestore |
| Kimlik Doğrulama | Firebase Auth + JWT |
| Konteynerizasyon | Docker |
| Hosting | Hetzner Cloud (CPX21) |

---

## 📚 Dokümantasyon Haritası

Bu klasördeki tüm teknik dokümanlar aşağıda listelenmiştir. Her doküman belirli bir alan için derinlemesine bilgi içerir.

### Türkçe Dokümanlar
| Dosya | Açıklama |
|-------|----------|
| [README.md](./README.md) | Bu dosya - Proje özeti ve yönlendirme |
| [00-DeveloperTasks.md](./00-DeveloperTasks.md) | 🆕 **Görev dağılımı - 3 Developer için sprint planı** |
| [10-GameRules.md](./10-GameRules.md) | Oyun kuralları, kart puanları, mühür mekaniği |

### İngilizce Dokümanlar (Technical)
| Dosya | Açıklama |
|-------|----------|
| [01-Infrastructure.md](./01-Infrastructure.md) | Sunucu seçimi, kapasite planlaması, **Redis (ZORUNLU)** |
| [02-Architecture.md](./02-Architecture.md) | NestJS modüler yapı, SOLID prensipleri, modül tanımları |
| [03-GameEngine.md](./03-GameEngine.md) | Oyun motoru, **oyuncu seçimi**, **memory penalty** |
| [04-Database.md](./04-Database.md) | Firestore şema tasarımı, **Redis persistence** |
| [05-Networking.md](./05-Networking.md) | WebSocket protokolü, **Clock Sync**, rate limiting |
| [06-ELO-Rating.md](./06-ELO-Rating.md) | 4 kişilik ELO sistemi, **Bot Detection** |
| [07-Social-Features.md](./07-Social-Features.md) | Arkadaş sistemi, parti, **Chat System** |
| [08-Monetization.md](./08-Monetization.md) | IAP doğrulama, Apple/Google entegrasyonu |
| [09-Deployment.md](./09-Deployment.md) | Docker, logging, CI/CD, **CDN Asset Hosting** |

### ⚠️ v0.1.0 Kritik Güncellemeler

| Değişiklik | Durum | Açıklama |
|------------|-------|----------|
| Redis ZORUNLU | ✅ Eklendi | Crash recovery için mandatory |
| Oyuncu Seçimi | ✅ Eklendi | Birden fazla hedef varsa oyuncu seçer |
| Memory Penalty | ✅ Eklendi | Mühürlü stack'e hamle = kart havuza |
| Chat System | ✅ Eklendi | Quick Chat + Emoji (free text yok) |
| Bot Detection | ✅ Eklendi | Reaction time analizi |
| Clock Sync | ✅ Eklendi | Latency compensation |
| CDN Assets | ✅ Eklendi | Cloudflare R2 önerisi |

---

## 👥 Geliştirici Rolleri ve Sorumluluklar

> 📋 Detaylı görev listesi için: [00-DeveloperTasks.md](./00-DeveloperTasks.md)

### 🔴 Developer 1: Altyapı & DevOps
**Odak Alanı:** Sunucu, ağ, dağıtım

**İlgili Dokümanlar:**
- `01-Infrastructure.md` - Sunucu kurulumu, **Redis**
- `05-Networking.md` - Socket.io, **Clock Sync**
- `09-Deployment.md` - Docker, CI/CD, **CDN**

**Sorumluluklar:**
- Hetzner CPX21 sunucu kurulumu ve konfigürasyonu
- **Redis kurulumu (ZORUNLU - crash recovery)**
- Linux kernel optimizasyonları (`sysctl.conf`)
- Docker imaj oluşturma ve deployment
- Socket.io bağlantı yönetimi
- **Clock synchronization (latency compensation)**
- Rate limiting implementasyonu
- **Cloudflare R2 asset hosting**
- Log yönetimi (Pino)

---

### 🟢 Developer 2: Oyun Motoru & Core Logic
**Odak Alanı:** Oyun mantığı, state management

**İlgili Dokümanlar:**
- `03-GameEngine.md` - Oyun motoru detayları
- `10-GameRules.md` - Oyun kuralları (Türkçe)
- `06-ELO-Rating.md` - Derecelendirme sistemi, **Bot Detection**

**Sorumluluklar:**
- `GameEngineService` implementasyonu
- State Machine (WAITING → DEALING → PLAYER_TURN → RESOLVING → GAME_OVER)
- Mühür (Seal) algoritması
- **Kart eşleştirme (OYUNCU SEÇİMİ ile)**
- **Memory Penalty (mühürlü stack hata = kart havuza)**
- ELO puanlama sistemi
- **Bot Detection Service**
- Anti-cheat (State Masking)

---

### 🔵 Developer 3: Veri & Sosyal Özellikler
**Odak Alanı:** Veritabanı, sosyal, monetizasyon

**İlgili Dokümanlar:**
- `02-Architecture.md` - Modül yapısı
- `04-Database.md` - Firestore şeması, **Redis persistence**
- `07-Social-Features.md` - Sosyal özellikler, **Chat System**
- `08-Monetization.md` - IAP sistemi

**Sorumluluklar:**
- Firestore şema implementasyonu
- **Redis game state persistence (crash recovery)**
- `AuthModule` ve Firebase entegrasyonu
- `SocialModule` (arkadaşlar, parti, presence)
- **Chat System (Quick Chat + Emoji)**
- `IapModule` (satın alma doğrulama)
- Replay sistemi
- Transaction yönetimi (ACID)

---

## 🚀 Hızlı Başlangıç

```bash
# Repoyu klonla
git clone https://github.com/63emre/bluffbuddy.git
cd bluffbuddy/backend

# Bağımlılıkları yükle
npm install

# Environment değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle (Firebase credentials, vb.)

# Development modunda çalıştır
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 📁 Backend Klasör Yapısı (Hedef)

```
backend/
├── src/
│   ├── main.ts                    # Uygulama giriş noktası
│   ├── app.module.ts              # Root module
│   │
│   ├── auth/                      # 🔵 AuthModule
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   │
│   ├── game/                      # 🟢 GameModule
│   │   ├── game.module.ts
│   │   ├── game.gateway.ts        # WebSocket Gateway
│   │   ├── game-engine.service.ts # Core game logic
│   │   ├── room-manager.service.ts
│   │   ├── state-machine/
│   │   │   ├── game-state.ts
│   │   │   └── transitions.ts
│   │   ├── mechanics/
│   │   │   ├── seal.service.ts    # Mühür algoritması
│   │   │   ├── matching.service.ts
│   │   │   └── scoring.service.ts
│   │   └── dto/
│   │
│   ├── persistence/               # 🔵 PersistenceModule
│   │   ├── persistence.module.ts
│   │   ├── firestore.service.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── match.repository.ts
│   │       └── leaderboard.repository.ts
│   │
│   ├── social/                    # 🔵 SocialModule
│   │   ├── social.module.ts
│   │   ├── friends.service.ts
│   │   ├── party.service.ts
│   │   ├── presence.service.ts
│   │   └── dto/
│   │
│   ├── iap/                       # 🔵 IapModule
│   │   ├── iap.module.ts
│   │   ├── iap.service.ts
│   │   ├── apple-verify.service.ts
│   │   └── google-verify.service.ts
│   │
│   └── common/                    # Shared utilities
│       ├── filters/
│       ├── pipes/
│       ├── interceptors/
│       └── constants/
│
├── test/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🔗 Önemli Bağlantılar

- **Ana Oyun Kuralları:** [../GameLogic.md](../GameLogic.md)
- **Hetzner Cloud:** https://www.hetzner.com/cloud
- **NestJS Docs:** https://docs.nestjs.com
- **Socket.io Docs:** https://socket.io/docs/v4
- **Firebase Firestore:** https://firebase.google.com/docs/firestore

---

## 📝 Versiyon Geçmişi

| Versiyon | Tarih | Açıklama |
|----------|-------|----------|
| v0.1.0 | 2026-02 | İlk backend implementasyonu, temel oyun mekaniği |

---

## ⚠️ Önemli Notlar

1. **Otoriter Mimari:** Tüm oyun durumu sunucuda tutulur. İstemci sadece görünür veriyi alır.
2. **Bütçe Kısıtı:** €12/ay limiti içinde kalınmalı. Firestore okuma/yazma optimizasyonu kritik.
3. **Anti-Cheat:** State masking zorunlu. Rakip elleri asla istemciye gönderme.
4. **Hafıza Oyunu:** Mühür durumu istemciye bildirilmez. Oyuncu kendi takip etmeli.

---

*Bu doküman BluffBuddy Online v0.1.0 için hazırlanmıştır. Güncellemeler için commit geçmişini kontrol edin.* 