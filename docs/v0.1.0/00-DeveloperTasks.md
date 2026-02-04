# 00 - Developer Task Assignment (v0.1.0)

> **Proje:** BluffBuddy Online  
> **Versiyon:** 0.1.0  
> **Son Güncelleme:** Şubat 2026  
> **Durum:** Sprint Planlama

---

## Genel Bakış

Bu doküman, BluffBuddy Online v0.1.0 backend geliştirmesi için **3 geliştirici** arasındaki görev dağılımını tanımlar.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER ASSIGNMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   🔴 DEV 1: Infrastructure & DevOps                             │
│       Sunucu, ağ, dağıtım, monitoring                           │
│                                                                  │
│   🟢 DEV 2: Game Engine & Core Logic                            │
│       Oyun motoru, state machine, anti-cheat                    │
│                                                                  │
│   🔵 DEV 3: Data & Social Features                              │
│       Veritabanı, sosyal özellikler, monetizasyon               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Developer 1: Infrastructure & DevOps

### Sorumluluk Alanları
- Sunucu kurulumu ve konfigürasyonu
- Docker ve konteyner yönetimi
- Redis kurulumu ve yönetimi
- Networking ve Socket.io altyapısı
- CI/CD pipeline
- Logging ve monitoring
- CDN/Asset hosting

### İlgili Dokümanlar
| Doküman | Öncelik | Açıklama |
|---------|---------|----------|
| `01-Infrastructure.md` | 🔴 Kritik | Sunucu seçimi, OS optimizasyonları |
| `05-Networking.md` | 🔴 Kritik | Socket.io konfigürasyonu, Clock Sync |
| `09-Deployment.md` | 🔴 Kritik | Docker, CI/CD, CDN |

### Sprint Görevleri

#### Hafta 1-2: Altyapı Kurulumu
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Hetzner CPX21 sunucu provizyon | 🔴 Kritik | 2 saat | ⬜ |
| Linux kernel optimizasyonları (`sysctl.conf`) | 🔴 Kritik | 1 saat | ⬜ |
| Docker & Docker Compose kurulumu | 🔴 Kritik | 1 saat | ⬜ |
| **Redis kurulumu (ZORUNLU)** | 🔴 Kritik | 2 saat | ⬜ |
| Firewall (ufw) konfigürasyonu | 🟡 Yüksek | 1 saat | ⬜ |
| SSH key-based authentication | 🟡 Yüksek | 30 dk | ⬜ |

#### Hafta 2-3: Networking
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Socket.io server konfigürasyonu | 🔴 Kritik | 4 saat | ⬜ |
| **Clock Sync implementasyonu** | 🔴 Kritik | 6 saat | ⬜ |
| Rate limiting middleware | 🟡 Yüksek | 3 saat | ⬜ |
| Connection lifecycle handlers | 🟡 Yüksek | 4 saat | ⬜ |
| Reconnection strategy | 🟡 Yüksek | 4 saat | ⬜ |

#### Hafta 3-4: Deployment & Monitoring
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Dockerfile (multi-stage build) | 🔴 Kritik | 2 saat | ⬜ |
| docker-compose.yml (app + Redis) | 🔴 Kritik | 2 saat | ⬜ |
| Pino logging konfigürasyonu | 🟡 Yüksek | 2 saat | ⬜ |
| Health check endpoints | 🟡 Yüksek | 1 saat | ⬜ |
| **Cloudflare R2 asset hosting** | 🟡 Yüksek | 3 saat | ⬜ |
| UptimeRobot monitoring | 🟢 Normal | 30 dk | ⬜ |
| GitHub Actions CI/CD | 🟢 Normal | 4 saat | ⬜ |

### Kritik Notlar (DEV 1 için)

> ⚠️ **Redis ZORUNLU!** 
> Oyun state'i sadece RAM'de tutulursa sunucu çökmesinde veri kaybı olur.
> Redis'i Docker Compose içinde mandatory olarak konfigüre et.

> ⚠️ **Clock Sync ZORUNLU!**
> Mobile ağlarda latency değişken. `serverTime` offset hesaplaması olmadan
> oyuncular haksız yere turn timeout alır.

---

## 🟢 Developer 2: Game Engine & Core Logic

### Sorumluluk Alanları
- Oyun motoru implementasyonu
- State machine yönetimi
- Mühür (Seal) algoritması
- Eşleştirme sistemi (oyuncu seçimi ile)
- Puanlama sistemi
- ELO rating sistemi
- Anti-cheat (State Masking, Bot Detection)

### İlgili Dokümanlar
| Doküman | Öncelik | Açıklama |
|---------|---------|----------|
| `03-GameEngine.md` | 🔴 Kritik | Oyun motoru detayları |
| `10-GameRules.md` | 🔴 Kritik | Oyun kuralları (Türkçe) |
| `06-ELO-Rating.md` | 🟡 Yüksek | ELO sistemi, Bot Detection |

### Sprint Görevleri

#### Hafta 1-2: Core Game Engine
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Card types & deck generation | 🔴 Kritik | 2 saat | ⬜ |
| Fisher-Yates shuffle (crypto-secure) | 🔴 Kritik | 1 saat | ⬜ |
| State Machine (phases) | 🔴 Kritik | 6 saat | ⬜ |
| Card dealing (3 tur × 4 kart) | 🔴 Kritik | 2 saat | ⬜ |
| Turn management (counter-clockwise) | 🔴 Kritik | 3 saat | ⬜ |

#### Hafta 2-3: Matching & Seal
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| **Match detection (OYUNCU SEÇİMİ)** | 🔴 Kritik | 8 saat | ⬜ |
| Valid moves listesi oluşturma | 🔴 Kritik | 4 saat | ⬜ |
| Target selection timeout handling | 🔴 Kritik | 3 saat | ⬜ |
| **Mühür algoritması** | 🔴 Kritik | 10 saat | ⬜ |
| Cascade seal detection | 🔴 Kritik | 4 saat | ⬜ |
| Onion skin (sıyırma) logic | 🟡 Yüksek | 3 saat | ⬜ |

#### Hafta 3-4: Anti-Cheat & Scoring
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| **Memory Penalty (sealed stack hit)** | 🔴 Kritik | 4 saat | ⬜ |
| State masking (client'a ne gönderilir) | 🔴 Kritik | 4 saat | ⬜ |
| **Bot Detection Service** | 🟡 Yüksek | 6 saat | ⬜ |
| Final score calculation | 🟡 Yüksek | 2 saat | ⬜ |
| ELO calculation (4-player FFA) | 🟡 Yüksek | 4 saat | ⬜ |
| Collusion detection (basic) | 🟢 Normal | 4 saat | ⬜ |

### Kritik Notlar (DEV 2 için)

> ⚠️ **OYUNCU SEÇİMİ ZORUNLU!**
> Eşleşme sisteminde strict priority KALDIRILDI.
> Birden fazla hedef varsa oyuncuya seçim sunulmalı.
> Bu oyunun stratejik derinliği için kritik!

> ⚠️ **MEMORY PENALTY ZORUNLU!**
> Mühürlü stack'e hamle yapan oyuncuya hata dönme!
> Kartı sessizce havuza at. Bu "hafıza oyunu" mekaniği.

> ⚠️ **DIRECTION: COUNTER-CLOCKWISE!**
> Tüm turn ve penalty slot taramaları saat yönünün TERSİNE.

---

## 🔵 Developer 3: Data & Social Features

### Sorumluluk Alanları
- Firestore şema tasarımı
- Firebase Auth entegrasyonu
- Arkadaşlık sistemi
- Parti sistemi
- **Chat sistemi (Quick Chat + Emoji)**
- Presence sistemi
- Replay sistemi
- IAP doğrulama

### İlgili Dokümanlar
| Doküman | Öncelik | Açıklama |
|---------|---------|----------|
| `02-Architecture.md` | 🔴 Kritik | Modül yapısı |
| `04-Database.md` | 🔴 Kritik | Firestore şeması |
| `07-Social-Features.md` | 🟡 Yüksek | Sosyal özellikler, Chat |
| `08-Monetization.md` | 🟢 Normal | IAP sistemi |

### Sprint Görevleri

#### Hafta 1-2: Auth & Database
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Firebase Admin SDK kurulumu | 🔴 Kritik | 2 saat | ⬜ |
| JWT validation guard | 🔴 Kritik | 3 saat | ⬜ |
| Firestore connection service | 🔴 Kritik | 2 saat | ⬜ |
| Users collection şema | 🔴 Kritik | 3 saat | ⬜ |
| Matches collection şema | 🟡 Yüksek | 2 saat | ⬜ |
| **Redis game state persistence** | 🔴 Kritik | 6 saat | ⬜ |

#### Hafta 2-3: Social Features
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| Friends system (add/remove/block) | 🟡 Yüksek | 6 saat | ⬜ |
| Friend request flow | 🟡 Yüksek | 4 saat | ⬜ |
| Party system (create/invite/leave) | 🟡 Yüksek | 6 saat | ⬜ |
| **Quick Chat Service** | 🟡 Yüksek | 4 saat | ⬜ |
| **Emoji Reaction Service** | 🟡 Yüksek | 2 saat | ⬜ |
| Chat rate limiting | 🟡 Yüksek | 2 saat | ⬜ |
| Presence tracking | 🟢 Normal | 4 saat | ⬜ |

#### Hafta 3-4: Persistence & Replay
| Görev | Öncelik | Süre | Durum |
|-------|---------|------|-------|
| **Game state hydration (restart)** | 🔴 Kritik | 6 saat | ⬜ |
| Replay data structure | 🟢 Normal | 3 saat | ⬜ |
| Replay storage (Firestore) | 🟢 Normal | 3 saat | ⬜ |
| Match history retrieval | 🟢 Normal | 2 saat | ⬜ |
| Leaderboard queries | 🟢 Normal | 3 saat | ⬜ |
| IAP validation (Apple/Google) | 🟢 Normal | 8 saat | ⬜ |

### Kritik Notlar (DEV 3 için)

> ⚠️ **REDIS GAME STATE PERSISTENCE!**
> DEV 1 Redis'i kuracak, sen persistence logic'i yazacaksın.
> Her 5 saniyede game state Redis'e yazılmalı.
> Server restart'ta Redis'ten hydrate edilmeli.

> ⚠️ **CHAT SİSTEMİ ZORUNLU!**
> Blöf oyununda sosyal etkileşim kritik.
> v0.1.0 için Quick Chat + Emoji yeterli (free text yok).

---

## Ortak Görevler (Tüm Developerlar)

| Görev | Sorumlular | Öncelik | Süre |
|-------|------------|---------|------|
| Unit test yazımı | Herkes | 🟡 Yüksek | Continuous |
| Code review | Herkes | 🟡 Yüksek | Continuous |
| Dokümantasyon güncelleme | Herkes | 🟢 Normal | Continuous |
| Daily standup | Herkes | 🟢 Normal | 15 dk/gün |

---

## Bağımlılık Matrisi

Bazı görevler diğerlerine bağımlıdır:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DEV 1: Redis Kurulumu                                         │
│           │                                                      │
│           ├──► DEV 3: Redis Persistence Logic                   │
│           │                                                      │
│           └──► DEV 2: State Masking (Redis'e bağımlı)           │
│                                                                  │
│   DEV 1: Socket.io Kurulumu                                     │
│           │                                                      │
│           ├──► DEV 2: Game Gateway Events                       │
│           │                                                      │
│           └──► DEV 3: Social Gateway Events                     │
│                                                                  │
│   DEV 3: Auth Guard                                             │
│           │                                                      │
│           └──► DEV 1 & DEV 2: Authenticated endpoints           │
│                                                                  │
│   DEV 2: Match Detection                                        │
│           │                                                      │
│           └──► DEV 2: Memory Penalty Logic                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint Timeline

```
Week 1-2: Foundation
├── DEV 1: Server + Redis + Docker
├── DEV 2: Core game engine + State machine
└── DEV 3: Auth + Firestore + Users

Week 2-3: Core Features
├── DEV 1: Socket.io + Clock Sync
├── DEV 2: Matching + Seal algorithm
└── DEV 3: Social features + Chat

Week 3-4: Polish & Integration
├── DEV 1: CI/CD + Monitoring + CDN
├── DEV 2: Anti-cheat + Bot detection + ELO
└── DEV 3: Persistence + Replay + IAP

Week 4: Testing & Bug Fixes
├── ALL: Integration testing
├── ALL: Load testing (250 CCU)
└── ALL: Bug fixes
```

---

## Öncelik Açıklaması

| Sembol | Anlam | Açıklama |
|--------|-------|----------|
| 🔴 Kritik | P0 | Oyun çalışmaz, blocker |
| 🟡 Yüksek | P1 | Önemli özellik, MVP için gerekli |
| 🟢 Normal | P2 | Nice to have, ertelenebilir |

---

## İletişim

| Kanal | Kullanım |
|-------|----------|
| Slack #bluffbuddy-dev | Günlük iletişim |
| GitHub Issues | Bug tracking, feature requests |
| Daily Standup | 10:00 her gün |
| Weekly Review | Cuma 16:00 |

---

## Checklist: Sprint Başlangıcı

- [ ] Tüm developerlar dokümanları okudu
- [ ] DEV 1: Hetzner hesabı hazır
- [ ] DEV 3: Firebase projesi oluşturuldu
- [ ] Git repo erişimleri verildi
- [ ] Development environment kuruldu (local)
- [ ] İlk daily standup yapıldı

---

*Bu doküman sprint süresince güncellenir. Son güncelleme: Şubat 2026*

