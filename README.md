# Sukhoi Chain

Özel bir EVM blockchain ekosistemi — Hardhat üzerine kurulu, kendi token'ı (SKH), cüzdan yönetimi ve admin paneli ile.

```
  ███████╗██╗   ██╗██╗  ██╗██╗  ██╗ ██████╗ ██╗
  ██╔════╝██║   ██║██║ ██╔╝██║  ██║██╔═══██╗██║
  ███████╗██║   ██║█████╔╝ ███████║██║   ██║██║
  ╚════██║██║   ██║██╔═██╗ ██╔══██║██║   ██║██║
  ███████║╚██████╔╝██║  ██╗██║  ██║╚██████╔╝██║
  ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
```

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm run install:all
```

### 2. Tek Komutla Başlat

```bash
npm start
```

Bu komut sırasıyla şunları başlatır:
1. 🔗 **Hardhat Blockchain Node** — `http://localhost:8545`
2. 📄 **SKH Token Kontratı Deploy** — otomatik
3. ⚡ **Backend API + WebSocket** — `http://localhost:3001`
4. 🌐 **Public Frontend** — `http://localhost:5173`
5. 🛡️ **Admin Panel** — `http://localhost:5174`

### Manuel Başlatma (Ayrı Terminaller)

```bash
# Terminal 1: Blockchain
npm run start:blockchain

# Terminal 2: Deploy (blockchain başladıktan sonra)
npm run deploy

# Terminal 3: Backend
npm run start:backend

# Terminal 4: Public Frontend
npm run start:public

# Terminal 5: Admin Panel
npm run start:admin
```

## Ağ Bilgileri

| Özellik | Değer |
|---------|-------|
| Chain ID | `19735` |
| Token İsmi | Sukhoi (SKH) |
| Toplam Arz | 1,000,000,000 SKH |
| Decimals | 18 |
| Admin Allocation | 500,000,000 SKH |
| Reserve | 500,000,000 SKH |

## Admin Paneli Girişi

```
URL:       http://localhost:5174
Kullanıcı: admin
Şifre:     sukhoi-admin-2024
```

> ⚠️ **Güvenlik**: Production'da `.env` dosyasındaki şifreyi ve JWT secret'ı değiştirin.

## Proje Yapısı

```
sukhoi-chain/
├── blockchain/          # Hardhat EVM node + SKH token kontratı
├── backend/             # Node.js API + WebSocket server
├── frontend-public/     # Kullanıcı cüzdan arayüzü
├── frontend-admin/      # Admin "Tanrı Paneli"
├── start.js             # Tek komutla tüm servisleri başlat
└── package.json         # Root orchestrator
```

## Güvenlik

- 🔒 Private key ve mnemonic hiçbir zaman backend'de saklanmaz
- 🔒 Tüm loglar otomatik olarak hassas verileri redact eder
- 🔒 Rate limiting tüm API endpoint'lerinde aktif
- 🔒 Admin endpoint'leri JWT authentication ile korunur
- 🔒 Helmet security header'ları aktif
- 🔒 CORS kısıtlamaları uygulanır
- 🔒 TX'ler client-side'da imzalanır, backend sadece relay eder

## API Endpoints

### Public
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/wallet/create` | Yeni cüzdan oluştur |
| POST | `/api/wallet/recover` | Mnemonic ile cüzdan kurtar |
| GET | `/api/wallet/:address` | Bakiye ve TX geçmişi |
| POST | `/api/tx/send` | İmzalı TX gönder |
| GET | `/api/tx/:hash` | TX detayları |
| GET | `/api/health` | Sağlık kontrolü |

### Admin (JWT Required)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/admin/login` | JWT token al |
| GET | `/api/admin/stats` | Ağ istatistikleri |
| GET | `/api/admin/wallets` | Tüm cüzdanlar |
| GET | `/api/admin/blocks` | Tüm bloklar |
| POST | `/api/admin/mint` | SKH mint et |
| POST | `/api/admin/network/control` | Ağı durdur/başlat |

### WebSocket
```
ws://localhost:3001/ws
```
Events: `new_block`, `new_transaction`, `network_status`

## Lisans

MIT
