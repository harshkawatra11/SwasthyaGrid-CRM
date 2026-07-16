<div align="center">

<br/>

# SwasthyaGrid Intake

### *The Facility Data Portal Behind SwasthyaGrid AI*

**Role-Based · Facility-Scoped · Firestore-Live**

Built for **GDG BuildWithAI 2025** · The Answer to "Where Does the Data Come From?"

<br/>

[![Live App](https://img.shields.io/badge/Live_App-swasthyagrid--crm.vercel.app-3f6b4a?style=for-the-badge&logo=vercel&logoColor=white)](https://swasthyagrid-crm.vercel.app)
[![Firestore](https://img.shields.io/badge/Data-Firestore_(shared)-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](#-architecture)
[![Companion](https://img.shields.io/badge/Companion_App-SwasthyaGrid_AI-b5502e?style=for-the-badge&logo=google&logoColor=white)](https://swasthyagrid.vercel.app)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase Admin](https://img.shields.io/badge/Firebase_Admin_SDK-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](#-architecture)

<br/>

[Overview](#-overview) · [Live Deployment](#-live-deployment) · [Architecture](#-architecture) · [Security Model](#-security-model) · [Quickstart](#-running-locally) · [Deploy](#-deployment)

</div>

---

## 🌐 Live Deployment

> **This is not a mockup.** SwasthyaGrid Intake is a fully functional, production-deployed facility data portal, sharing a live Firestore database with the SwasthyaGrid AI operations console.

| Component | Technology | Status |
| :--- | :--- | :--- |
| **App** | Next.js 15 on **Vercel** | 🟢 [swasthyagrid-crm.vercel.app](https://swasthyagrid-crm.vercel.app) |
| **Data store** | **Firestore** (`swasthyagrid-ai-54886`, shared with SwasthyaGrid AI) | 🟢 Live, deny-all client rules |
| **Auth** | Session JWT + bcrypt, server-verified | 🟢 Role-scoped (`facility` / `admin`) |
| **Data access** | Firebase **Admin SDK**, dedicated service account | 🟢 `roles/datastore.user` only |
| **Companion console** | [SwasthyaGrid AI](https://swasthyagrid.vercel.app) reads the same Firestore | 🟢 Edits here sync there within ~20s |

---

## 📖 Overview

**SwasthyaGrid AI** answers *what will happen, why, and what to do about it* — but every forecast needs a source. **SwasthyaGrid Intake** is that source: the structured portal PHC and CHC staff log into each morning to report medicine stock, bed occupancy, doctor attendance, and patient footfall.

| Role | Who | What they see |
|:---|:---|:---|
| 🏥 **Facility** | PHC / CHC staff | Their own facility only — inventory, beds, doctors, footfall, editable |
| 🏛️ **Admin** | District administrator | A read-only roster across every facility — last-report time, critical medicine counts, bed occupancy |

> *"The data behind the district's eyes."*

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────┐
                    │      PHC / CHC Staff Member       │
                    │        (Browser, any device)      │
                    └──────────────┬────────────────────┘
                                   │ HTTPS
                    ┌──────────────▼────────────────────┐
                    │   Next.js 15 (Vercel)              │
                    │   /login  /dashboard  /admin        │
                    │   middleware.ts — session guard     │
                    └──────────────┬────────────────────┘
                                   │ Server-side only
                    ┌──────────────▼────────────────────┐
                    │   API Routes (Node runtime)         │
                    │   /api/auth/*  /api/facility        │
                    │   /api/medicines  /api/beds          │
                    │   /api/doctors  /api/footfall         │
                    │   /api/admin/overview                │
                    └──────────────┬────────────────────┘
                                   │ Firebase Admin SDK
                                   │ (bypasses client rules)
                    ┌──────────────▼────────────────────┐
                    │   Firestore  (swasthyagrid-ai-54886)│
                    │   facilities · medicine_stock        │
                    │   beds · doctors · footfall_today     │
                    │   crm_users                           │
                    └──────────────┬────────────────────┘
                                   │ google-cloud-firestore
                                   │ (TTL-refreshed reads)
                    ┌──────────────▼────────────────────┐
                    │   SwasthyaGrid AI Backend            │
                    │   FastAPI on Cloud Run               │
                    │   → forecasts, recommendations,      │
                    │     the district map, all recompute  │
                    │     from what staff just entered      │
                    └────────────────────────────────────┘
```

**The loop that matters:** a facility edits a medicine count here → it's written to Firestore → SwasthyaGrid AI's `DistrictRepository` picks it up on its next refresh (≤20s TTL) → the forecast engine recomputes days-remaining and risk → the recommendation engine regenerates transfer suggestions → the district map and Ask SwasthyaGrid all reflect it. No manual sync step, no redeploy.

---

## 🔐 Security Model

Firebase Authentication and Identity Platform were not enabled when this was built, so the security model is deliberately **server-only and defense-in-depth**, not client-SDK-based:

| Layer | Enforcement |
|:---|:---|
| **Firestore rules** | `firestore.rules` — **deny all** direct client reads/writes. Every access goes through this app's API routes. |
| **Data access** | Only the Firebase **Admin SDK**, from a dedicated `crm-intake` service account scoped to `roles/datastore.user`, ever touches Firestore. |
| **Session** | HS256 JWT in an `httpOnly`, `secure`, `sameSite=lax` cookie — never readable by client JS. |
| **Facility isolation** | Every data API derives `facility_id` from the verified session token — **never** from the request body. A facility session cannot structurally address another facility's documents. |
| **Route protection** | `middleware.ts` guards `/dashboard`, `/admin`, and every data API; role mismatches (a facility session hitting `/admin`) are redirected/403'd before any handler runs. |
| **Passwords** | `bcryptjs`, 10 rounds. No plaintext password is ever stored or logged. |

---

## 🖥️ Screens

| Route | Role | Purpose |
|:---|:---|:---|
| `/login` | Public | Facility ID + password |
| `/dashboard` | Facility | Medicine inventory (live days-remaining as you type), bed occupancy stepper, doctor present/absent toggle, today's footfall breakdown |
| `/admin` | Admin | Cross-facility roster — critical medicine counts, bed occupancy, last-report time (facilities silent >24h are flagged stale) |

Every save is optimistic-UI + a toast confirmation, and stamps `updated_at` / `updated_by` on the Firestore document — the audit trail referenced in the SwasthyaGrid AI Q&A story.

---

## 🖥️ Running Locally

### Prerequisites
- Node.js 18+
- A Firebase/GCP service account JSON with `roles/datastore.user` on the shared Firestore project

### Setup

```bash
npm install

cp .env.example .env.local
# FIREBASE_SERVICE_ACCOUNT — base64-encode your service account JSON:
#   [Convert]::ToBase64String([IO.File]::ReadAllBytes("key.json"))   (PowerShell)
#   base64 -w0 key.json                                              (Linux/macOS)
# SESSION_SECRET — openssl rand -hex 32

npm run dev
```

Open → **[http://localhost:3000](http://localhost:3000)**

### Seeding demo accounts

```bash
node scripts/seed-users.mjs
```

Creates facility logins (`phc-rural-14`, `phc-sector-12`, `chc-east`) and one `district-admin` account, all under a shared demo password printed to the console — **never committed to source**.

District data itself (`facilities`, `medicine_stock`, `beds`, `doctors`) is seeded from the main SwasthyaGrid repo's `backend/scripts/setup_firestore.py`, so both apps start from the same state.

---

## 🌩️ Deployment

```bash
vercel link --project swasthyagrid-crm
vercel env add FIREBASE_SERVICE_ACCOUNT production   # paste base64 value
vercel env add SESSION_SECRET production
vercel deploy --prod
```

### Environment Variables

| Variable | Description |
|:---|:---|
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (`crm-intake@<project>.iam.gserviceaccount.com`, `roles/datastore.user` only) |
| `SESSION_SECRET` | Random 64-hex-char secret signing session JWTs (`openssl rand -hex 32`) |

---

## 📁 Project Structure

```
ai-healthcare-crm/
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── (portal)/
│   │   │   ├── dashboard/page.tsx     # Facility intake workspace
│   │   │   └── admin/page.tsx         # District roster (read-only)
│   │   └── api/
│   │       ├── auth/{login,logout}/route.ts
│   │       ├── facility/route.ts      # Own-facility bundle (GET)
│   │       ├── medicines/route.ts     # Add medicine (POST)
│   │       ├── medicines/[id]/route.ts # Update medicine (PATCH)
│   │       ├── beds/route.ts          # Update bed count (PATCH)
│   │       ├── doctors/[id]/route.ts  # Toggle attendance (PATCH)
│   │       ├── footfall/route.ts      # Today's footfall (PUT)
│   │       └── admin/overview/route.ts # Cross-facility roster (GET, admin-only)
│   ├── components/Topbar.tsx
│   ├── lib/
│   │   ├── firebaseAdmin.ts           # Server-only Firestore access
│   │   └── session.ts                 # JWT create/verify
│   └── middleware.ts                  # Route + role guard
├── scripts/seed-users.mjs             # Demo account seeding (local only)
├── firestore.rules                    # Deny-all — enforcement lives server-side
└── .env.example
```

---

## 🚀 Roadmap

- [ ] SMS / WhatsApp intake fallback for facilities without reliable internet
- [ ] Cloud Translation — form and toasts localized per facility's language
- [ ] Speech-to-Text voice entry for low-literacy data entry
- [ ] Migrate to Firebase Auth + client-scoped security rules once Identity Platform is enabled
- [ ] Approval-velocity monitoring, transit reconciliation on the SwasthyaGrid AI side

---

<div align="center">

*SwasthyaGrid Intake — because a forecast is only as honest as the data it starts from.*

**[swasthyagrid-crm.vercel.app](https://swasthyagrid-crm.vercel.app) · Companion to [SwasthyaGrid AI](https://swasthyagrid.vercel.app) · Built for GDG BuildWithAI 2025**

</div>
