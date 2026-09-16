<p align="center">
  <img src="public/favicon.svg" alt="LinkMind AI" width="120" height="120" />
</p>

<h1 align="center">LinkMind AI</h1>
<h3 align="center">AI URL Shortener & Realtime Analytics Platform</h3>

<p align="center">
  <em>Enterprise-grade link intelligence platform powered by Gemini AI, realtime Socket.IO telemetry, and a production-hardened MERN stack.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/platform-Vercel%20%7C%20Railway%20%7C%20Render-blueviolet?style=flat-square" alt="Platform" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Live Demo](#-live-demo)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)
- [Security](#-security)
- [AI Features](#-ai-features)
- [Realtime Engine](#-realtime-engine)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 🧠 Overview

**LinkMind AI** is a production-grade, full-stack SaaS platform that redefines URL shortening with AI-powered analytics, realtime visitor telemetry, and enterprise-level security.

Built on the **MERN stack** with **TypeScript** end-to-end, it combines sub-5ms Redis-cached redirections, Socket.IO live dashboards, Gemini AI traffic intelligence, and a comprehensive admin moderation system — all wrapped in a polished glassmorphism UI.

### What makes LinkMind AI different?

- 🔗 **Not just a URL shortener** — it's a complete link intelligence platform
- 📊 **Realtime analytics** — live click streams, visitor counters, and timeline charts powered by Socket.IO
- 🤖 **AI-driven insights** — Gemini generates actionable marketing recommendations from your traffic data
- 🛡️ **Enterprise security** — CSRF protection, HttpOnly JWT cookies, RBAC, rate limiting, and Helmet headers
- ⚡ **Redis-powered performance** — BullMQ queue-based click processing with <4ms cache-hit redirections
- 🌐 **GeoIP tracking** — real geographic visitor data via MaxMind integration

---

## ✨ Features

### Core Link Management
| Feature | Description |
|---------|-------------|
| **URL Shortening** | Generate compact, trackable short links with auto-generated codes |
| **Custom Aliases** | Create branded vanity URLs (`/r/my-brand`) with unique constraint validation |
| **QR Code Generation** | Automatic vector QR code generation for every shortened link |
| **Campaign Grouping** | Organize links into named campaigns for segmented analytics |
| **Password Protection** | Secure sensitive links behind password-gated unlock pages |
| **Expiration System** | Set auto-expiry dates with cron-based archival processing |
| **Burn-After-Click** | One-time-use links that self-destruct after first access |
| **Favorites & Archive** | Star important links and archive inactive ones |
| **Bulk Export** | Download click history as timestamped CSV or nested JSON |

### 📊 Analytics & Monitoring
| Feature | Description |
|---------|-------------|
| **Realtime Click Tracking** | Live click events streamed to dashboards via Socket.IO |
| **Visitor Demographics** | Device type, OS, browser, country, city breakdown |
| **Traffic Timeline** | Interactive Recharts visualizations with hourly distribution |
| **Referrer Analysis** | Track inbound traffic sources and referral channels |
| **Unique vs Total Clicks** | Deduplicated visitor metrics with IP-based uniqueness |
| **Active Visitor Counter** | Live global connected-user count broadcast in realtime |
| **GeoIP Resolution** | Real city/country/timezone mapping via MaxMind `geoip-lite` |

### 🔐 Authentication & Security
| Feature | Description |
|---------|-------------|
| **JWT HttpOnly Cookies** | Secure, non-JavaScript-accessible token storage |
| **Refresh Token Flow** | Automatic silent token refresh with 7-day sliding sessions |
| **CSRF Protection** | Double-submit cookie pattern (`XSRF-TOKEN` header validation) |
| **Helmet Headers** | Comprehensive HTTP security headers |
| **CORS Policy** | Configurable cross-origin protection |
| **Rate Limiting** | Granular DDoS protection across auth, API, redirect, and AI endpoints |
| **RBAC** | Role-based access control (`user` / `admin`) with middleware guards |
| **Developer API Keys** | SHA-256 hashed API keys with expiration and `lastUsedAt` tracking |

### 🛡️ Admin Dashboard
| Feature | Description |
|---------|-------------|
| **User Management** | View, suspend, and manage all registered users |
| **Global Analytics** | Platform-wide click metrics and user activity overview |
| **Audit Logs** | Comprehensive administrative action logging with auto-rotation |
| **Suspicious Link Monitoring** | Review and moderate flagged or problematic links |
| **Protected Routes** | Admin-only pages gated by RBAC middleware |

### 🤖 AI Intelligence
| Feature | Description |
|---------|-------------|
| **Gemini-Powered Insights** | Deep traffic analysis with actionable marketing recommendations |
| **Engagement Analysis** | AI evaluates click patterns, device ecosystems, and referral quality |
| **Peak Time Detection** | Identifies optimal posting windows from hourly activity profiles |
| **Growth Tactics** | Concrete, data-driven suggestions for campaign optimization |
| **Smart Fallbacks** | Heuristic analytics engine when Gemini API is unavailable |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | Component-based UI framework |
| **TypeScript** | End-to-end type safety |
| **Redux Toolkit** | Global state management with slices |
| **Tailwind CSS v4** | Utility-first responsive styling |
| **Framer Motion** | Smooth page transitions and micro-animations |
| **Recharts** | Interactive data visualization charts |
| **Lucide React** | Modern icon system |
| **Axios** | HTTP client with interceptor support |
| **Socket.IO Client** | Realtime WebSocket communication |
| **React Router v7** | Client-side routing with protected routes |
| **Zod** | Runtime schema validation |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | REST API framework |
| **TypeScript** | Server-side type safety |
| **MongoDB + Mongoose** | Document database with compound indexes |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **Socket.IO** | Realtime bidirectional event communication |
| **Redis (ioredis)** | High-performance caching layer |
| **BullMQ** | Background job queue for click telemetry |
| **Helmet** | HTTP security headers |
| **Cookie Parser** | Secure cookie management |
| **Express Rate Limit** | DDoS and abuse protection |
| **bcryptjs** | Password hashing with salt rounds |
| **node-cron** | Background scheduled maintenance tasks |
| **qrcode** | QR code generation library |
| **geoip-lite** | MaxMind GeoIP database integration |
| **esbuild** | Ultra-fast production bundler |

### AI & Intelligence
| Technology | Purpose |
|-----------|---------|
| **Google Gemini API** | `gemini-3.5-flash` model for traffic intelligence |
| **@google/genai** | Official Google GenAI SDK |

### Deployment
| Platform | Use |
|----------|-----|
| **Vercel** | Frontend hosting + serverless functions |
| **Railway / Render** | Backend + WebSocket hosting |
| **MongoDB Atlas** | Managed cloud database |
| **Upstash / Redis Cloud** | Managed Redis instances |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│              React 19 + Redux Toolkit + Socket.IO               │
│                    Tailwind CSS + Recharts                       │
└───────────────────────┬──────────────────┬──────────────────────┘
                        │                  │
                   REST API            WebSocket
                   (Axios)          (Socket.IO Client)
                        │                  │
┌───────────────────────▼──────────────────▼──────────────────────┐
│                     EXPRESS SERVER (Node.js)                     │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Helmet     │  │   CORS       │  │   Cookie Parser        │  │
│  │   Security   │  │   Policy     │  │   + CSRF Shield        │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              RATE LIMITERS (Per-Route Granularity)          │ │
│  │   Global: 200/15m │ Auth: 15/15m │ AI: 10/15m │ 300/15m   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Auth    │ │  Links   │ │ Campaign │ │  Admin   │           │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│  ┌────▼────────────▼────────────▼────────────▼─────┐            │
│  │            CONTROLLER LAYER                      │            │
│  │   Auth │ Links │ Campaigns │ Analytics │ Admin   │            │
│  └──────────────────────┬──────────────────────────┘            │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────┐            │
│  │              SERVICE LAYER                       │            │
│  │   AI Service │ Redis │ Queue (BullMQ) │ Cron    │            │
│  └──────────────────────┬──────────────────────────┘            │
└─────────────────────────┼──────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │   MongoDB   │ │    Redis    │ │  Gemini AI  │
   │   Atlas     │ │   Cache     │ │   Engine    │
   │             │ │  + BullMQ   │ │             │
   │  • Users    │ │  • Link     │ │  • Traffic  │
   │  • Links    │ │    Cache    │ │    Analysis │
   │  • Analytics│ │  • AI Cache │ │  • Growth   │
   │  • Campaigns│ │  • Pub/Sub  │ │    Tactics  │
   │  • ApiKeys  │ │  • Socket   │ │  • Peak     │
   │  • AuditLog │ │    Adapter  │ │    Times    │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Realtime Analytics Flow

```
User clicks /r/:shortCode
        │
        ▼
  Rate Limiter Check (300/15min)
        │
        ▼
  Redis Cache Lookup (<4ms)  ──── Cache Miss ───▶  MongoDB Query
        │                                               │
        ▼                                               ▼
  Extract Visitor Metadata                        Cache Result in Redis
  (IP, User-Agent, GeoIP, Referrer)                     │
        │                                               │
        ▼                                               │
  BullMQ Queue ◀────────────────────────────────────────┘
  (Async Click Telemetry)
        │
        ▼
  MongoDB Analytics Insert
        │
        ▼
  Socket.IO Broadcast
  → "click_registered" event
  → Link room + Campaign room
  → Active visitor count update
        │
        ▼
  Dashboard Charts Update (Realtime)
```

### Authentication Lifecycle

```
Register/Login ──▶ Generate JWT Pair ──▶ Set HttpOnly Cookies
                   (access: 15m)         (Secure, SameSite)
                   (refresh: 7d)
        │
        ▼
  Protected Request ──▶ Verify Access Token
        │                      │
        │              Token Expired?
        │                 │         │
        │               Yes         No
        │                │          │
        │                ▼          ▼
        │         Verify Refresh   Proceed
        │            Token          │
        │              │            │
        │         Rotate Pair       │
        │         Set New Cookies   │
        │              │            │
        └──────────────┴────────────┘
```

---

## 📸 Screenshots

> Add screenshots of the running application here.

| View | Preview |
|------|---------|
| **Dashboard** | ![Dashboard](assets/dashboard.png) |
| **Link Analytics** | ![Analytics](assets/analytics.png) |
| **Campaign Manager** | ![Campaigns](assets/campaigns.png) |
| **Admin Panel** | ![Admin](assets/admin.png) |
| **Mobile View** | ![Mobile](assets/mobile.png) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB** (Atlas cloud or local instance)
- **Redis** (optional — enables caching, BullMQ queues, and Socket.IO scaling)
- **Gemini API Key** (optional — enables AI traffic insights)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/linkmind-ai.git
cd linkmind-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# 4. Seed the admin user (optional)
npm run seed:admin

# 5. Start the development server
npm run dev
```

The application will launch at **`http://localhost:3000`** with Vite's hot-reload development middleware enabled.

### Production Build

```bash
# Compile frontend (Vite) and backend (esbuild → CJS)
npm run build

# Launch the production server
npm run start
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/linkmind` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-super-secure-jwt-secret-key-2026` |

### Optional (Recommended for Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `APP_URL` | Public application URL | `https://linkmind.ai` |
| `GEMINI_API_KEY` | Google Gemini API key for AI insights | `API KEY` |
| `REDIS_URI` | Redis connection URL (enables caching, BullMQ, Socket.IO adapter) | `redis://user:pass@host:6379` |

```env
# ─── Server ───────────────────────────────────
NODE_ENV=production
APP_URL=https://linkmind.ai

# ─── Database ─────────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/linkmind

# ─── Authentication ───────────────────────────
JWT_SECRET=your-super-secure-jwt-secret-key-2026

# ─── AI Engine ─────────────────────────────────
GEMINI_API_KEY=AIzaSy...

# ─── Redis (Optional) ─────────────────────────
REDIS_URI=redis://default:password@redis-host:6379

# ─── Frontend ─────────────────────────────────
VITE_API_URL=https://api.linkmind.ai
```

> **Note:** If `MONGODB_URI` is not set, the app automatically falls back to an in-memory MongoDB instance via `mongodb-memory-server` for development. If `REDIS_URI` is not set, the app gracefully falls back to direct database queries and memory-based batch processing.

---

## 🔒 Security

LinkMind AI implements **multi-layer security** designed for production SaaS environments:

### Authentication Security
- **HttpOnly Cookies** — JWT tokens stored in HTTP-only cookies, preventing XSS token theft
- **Secure Flag** — Cookies marked `Secure` in production (HTTPS-only transmission)
- **SameSite Policy** — `None` in production for cross-origin support, `Lax` in development
- **Token Rotation** — Automatic access token refresh using long-lived refresh tokens
- **Password Hashing** — bcrypt with 10 salt rounds for all stored passwords

### Request Security
- **CSRF Protection** — Double-submit cookie pattern validates `XSRF-TOKEN` headers on all mutations (POST/PUT/DELETE)
- **Helmet Headers** — Comprehensive HTTP security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS** — Configurable cross-origin resource sharing policy
- **Input Validation** — Zod schemas for request payload validation

### Rate Limiting
| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| **Global API** | 200 requests | 15 minutes |
| **Auth (Login/Register)** | 15 requests | 15 minutes |
| **Gemini AI Analytics** | 10 requests | 15 minutes |
| **Link Redirects** | 300 requests | 15 minutes |

### Access Control
- **RBAC Middleware** — Role-based route protection (`user`, `admin`)
- **Admin Route Guard** — Server-side `authorize("admin")` middleware + client-side redirect
- **API Key Auth** — SHA-256 hashed developer keys with expiration support
- **Account Suspension** — Suspended users are blocked at the middleware level

---

## 🤖 AI Features

LinkMind AI integrates **Google Gemini** (`gemini-3.5-flash`) to transform raw click data into actionable intelligence:

### How It Works

1. **Data Collection** — The analytics engine aggregates click metrics including device profiles, geographic data, referral channels, and hourly activity patterns
2. **AI Analysis** — Gemini processes the anonymized dataset through a specialized marketing analysis prompt
3. **Insight Generation** — The AI produces a structured report with four key sections:
   - **Traffic Summary** — Current performance assessment and trajectory analysis
   - **Audience Demographics** — Geographic and device ecosystem breakdown
   - **Peak Time Detection** — Optimal posting windows based on hourly click distribution
   - **Growth Tactics** — Three concrete, data-driven marketing recommendations

### Intelligent Caching
- AI responses are cached in Redis for **30 minutes** using a compound hash of analytics properties
- Cache keys incorporate click totals, unique visitors, and data dimensions to auto-invalidate when metrics change meaningfully

### Graceful Fallbacks
- If the Gemini API key is not configured, a **heuristic analytics engine** generates insights using statistical analysis of available data
- Heuristic results are cached for 5 minutes and provide the same structured format

---

## ⚡ Realtime Engine

### Socket.IO Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser 1  │     │  Browser 2  │     │  Browser N  │
│  Dashboard  │     │  LinkDetail │     │  Campaign   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │ WebSocket
                           ▼
              ┌────────────────────────┐
              │     Socket.IO Server   │
              │                        │
              │  Rooms:                │
              │  • link:{linkId}       │
              │  • campaign:{campId}   │
              │                        │
              │  Events:               │
              │  • click_registered    │
              │  • active_visitors     │
              │  • join_link           │
              │  • join_campaign       │
              └───────────┬────────────┘
                          │
              ┌───────────▼────────────┐
              │  Redis Pub/Sub Adapter │
              │  (Horizontal Scaling)  │
              └────────────────────────┘
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `click_registered` | Server → Client | New click telemetry data broadcast |
| `active_visitors` | Server → Client | Updated global connected user count |
| `join_link` | Client → Server | Subscribe to a specific link's room |
| `join_campaign` | Client → Server | Subscribe to a campaign's room |

### Horizontal Scaling
- The `@socket.io/redis-adapter` enables **multi-instance deployment** where Socket.IO events sync across distributed server containers via Redis Pub/Sub

---

## 🔮 Future Roadmap

- [ ] **GeoIP Dashboard Maps** — Interactive world map visualization of visitor locations
- [ ] **AI Anomaly Detection** — Automated alerts for suspicious traffic spikes or bot activity
- [ ] **CDN Edge Caching** — Cloudflare Workers for sub-millisecond global redirections
- [ ] **Team Workspaces** — Multi-user organizations with shared link management
- [ ] **Webhook Integrations** — Real-time click notifications to Slack, Discord, and custom endpoints
- [ ] **A/B Link Testing** — Split traffic between destination URLs with statistical analysis
- [ ] **Custom Domains** — Branded short domains with automatic SSL provisioning
- [ ] **Link Scheduling** — Publish links at specific future dates/times
- [ ] **Advanced API Rate Tiers** — Usage-based API plans with quota management

---

## 👨‍💻 Author

<p align="center">
  <strong>Naresh Kamarthy</strong>
</p>

<p align="center">
  <em>MERN Stack Developer • AI Systems Engineer • React.js Developer</em>
</p>

<p align="center">
  <a href="https://github.com/naresh-kamarthy">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://www.linkedin.com/in/naresh-kamarthy-aa1239130">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://naresh-kamarthy-portfolio.vercel.app">
    <img src="https://img.shields.io/badge/Portfolio-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio" />
  </a>
</p>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ and ☕ by <strong>Naresh Kamarthy</strong></sub>
</p>

<p align="center">
  <sub>If you found this project useful, consider giving it a ⭐ on GitHub!</sub>
</p>
