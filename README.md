# MOCKEA — Automated IELTS & PTE Preparation Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20(React%2019%20%2B%20Express%205)-blue)](https://github.com/armanislams/MOCKEA)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)](https://www.mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Auth-Firebase%20Auth-orange)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-blueviolet)](https://ai.google.dev/)

Welcome to **MOCKEA**, an enterprise-ready, full-stack monorepo platform designed for IELTS & PTE preparation. MOCKEA features interactive practice laboratories, full-length timed mock test simulations, anti-cheat exam integrity enforcement, an automated AI evaluation engine (Gemini 2.5 Flash), an instructor review center, and a Study Buddy AI Chatbot.

---

## 🚀 Key Features & Capabilities

- **Interactive Practice Labs**: Dedicated laboratories for Reading, Listening, Writing, and Speaking modules.
- **Full-Length Timed Mock Tests**: Full 4-part simulation environment with automated Reading & Listening grading and flagged Writing & Speaking review pipelines.
- **Strict Anti-Cheat Integrity**: Fullscreen mode enforcement, copy-paste/right-click blocks, tab-switch limiters, and violation logging.
- **Automated AI Grading Engine**: Evaluates IELTS Writing essays and Speaking transcripts using Google Gemini 2.5 Flash, returning band scores (0–9 scale), criteria breakdowns (Task Achievement, Coherence, Lexical Resource, Grammar, Fluency, Pronunciation), feedback summaries, and sentence-by-sentence corrections.
- **Dual-Engine Caching (`cache.js`)**: Redis key-value caching with seamless automatic fallback to an in-memory JavaScript `Map` cache.
- **Direct-to-Cloud Signed Uploads**: Client-side speaking audio binary blobs upload directly to Cloudinary CDN via signed backend signature endpoints, bypassing Express memory overhead.
- **Multi-Role Access Control (RBAC)**: Role-based permissions (`student`, `instructor`, `admin`, `superadmin`) and multi-tier subscriptions (`Free`, `Standard`, `Premium`).
- **Telemetry & Error Logging**: Client-side error logger (`errorLogger.js`) posting crashes to a capped MongoDB TTL log collection, plus Google Analytics 4 (GA4) telemetry.

---

## 🛠️ Complete Tech Stack & Connected Services

| Layer | Technology / Service | Details / Credentials | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | SPA with Code-Splitting | Ultra-fast client build and lazy routing |
| **Styling & UI** | Tailwind CSS 4 + DaisyUI 5 | Vanilla CSS directives | Modern responsive design system & dark mode |
| **State Management** | TanStack Query 5 (React Query) | Stale-while-revalidate | Server-state caching and synchronization |
| **Backend Engine** | Node.js (ES Modules) + Express 5 | PM2 Clustering | Scalable RESTful API backend |
| **Primary Database** | MongoDB Atlas (`EcoStream`) | `cluster0.xbf1ip3.mongodb.net` | Persistent data storage for users, tests, submissions |
| **Caching Database** | Redis + In-Memory Fallback | Key-value store (`cache.js`) | Read-through cache for tests and question banks |
| **Authentication** | Firebase Auth & Admin SDK | Project ID: `eco-stream-90d55` | Identity management, Google OAuth & JWT validation |
| **AI Evaluation Engine** | Google Gemini 2.5 Flash API | `GEMINI_API_KEY` | Automated essay/speech grading & AI Chatbot tutor |
| **Media Cloud Storage** | Cloudinary CDN | Cloud: `dfcbdyhsw` | Audio recordings & resource PDF storage |
| **Analytics Telemetry** | Google Analytics 4 (`react-ga4`) | ID: `G-M2XMQ7DRWD` | Route pageviews, checkouts & anti-cheat alerts |
| **Hosting Platform** | Firebase Hosting & Vercel | `eco-stream-90d55.web.app` | Global CDN client hosting & server API hosting |

---

## 📂 Project Architecture

```text
MOCKEA/
├── README.md                      # Primary platform documentation
├── DevHandover.md                 # Technical Developer Handover Report
├── HandoverDoc.md                 # User & Operational Manual (Student/Instructor/Admin)
├── frontend/                      # React 19 / Vite Client Application
│   ├── public/                    # Static assets & icons
│   ├── src/
│   │   ├── components/            # UI Components (Common & Dashboard modules)
│   │   ├── context/               # Auth & UI React Contexts
│   │   ├── hooks/                 # Shared Custom Hooks (useAxiosSecure, useTestIntegrity, etc.)
│   │   ├── Layout/                # Layout Wrappers (RootLayout, DashboardLayout)
│   │   ├── Router/                # React Router 7 setup & Private/Admin route guards
│   │   ├── utils/                 # Analytics, alert helpers, error loggers
│   │   ├── index.css              # Tailwind CSS directives
│   │   └── main.jsx               # Application entry point
│   ├── firebase.config.js         # Frontend Firebase SDK initialization
│   ├── package.json
│   └── vite.config.js
│
└── backend/                       # Node.js / Express 5 API Server
    ├── ecosystem.config.cjs       # PM2 Process Manager clustering config
    ├── src/
    │   ├── controllers/           # API business logic controllers
    │   ├── lib/                   # Integrations (connectDB, firebase.config, aiService)
    │   ├── middlewares/           # Auth guards, CORS, API rate limiters, sanitizers
    │   ├── model/                 # Mongoose Schemas (User, Questions, MockTest, Submission, etc.)
    │   ├── routes/                # Express API endpoint declarations
    │   ├── utils/                 # Utilities (cache.js, sanitizeInput, push.js)
    │   └── index.js               # Express app entry script
    ├── package.json
    └── vercel.json                # Vercel deployment configuration
```

---

## ⚙️ Environment Configuration

Set up local `.env` files in both workspace directories before running:

### Backend `.env` (`backend/.env`)
```env
PORT=3000
DEV_URL=http://localhost:5173
DEV_URL2=http://localhost:5174
CLIENT_URL=https://eco-stream-90d55.web.app
CLIENT_URL2=https://mockea.web.app
MONGODB_URI=mongodb+srv://ecostream:password@cluster0.xbf1ip3.mongodb.net/EcoStream?appName=Cluster0
REDIS_URL=redis://localhost:6379
FIREBASE_KEY=base64_encoded_firebase_service_account_json
GEMINI_API_KEY=AIzaSy...
CLOUDINARY_CLOUD_NAME=dfcbdyhsw
CLOUDINARY_API_KEY=996644535223745
CLOUDINARY_API_SECRET=id2...
```

### Frontend `.env` (`frontend/.env`)
```env
VITE_local_url=http://localhost:3000/api/
VITE_live_url=https://ecostream-backend.vercel.app/api/
VITE_apiKey=AIzaSy...
VITE_authDomain=eco-stream-90d55.firebaseapp.com
VITE_projectId=eco-stream-90d55
VITE_storageBucket=eco-stream-90d55.firebasestorage.app
VITE_messagingSenderId=815483653834
VITE_appId=1:815483653834:web:...
VITE_measurementId=G-M2XMQ7DRWD
VITE_CLOUD_NAME=dfcbdyhsw
VITE_UPLOAD_PRESET=mockea
```

---

## 🚀 Quick Start & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/armanislams/MOCKEA.git
cd MOCKEA
```

### 2. Launch Backend API
```bash
cd backend
npm install
npm run dev
# Or run with PM2 Clustering: pm2 start ecosystem.config.cjs
```

### 3. Launch Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📚 Documentation Reference
- **Developer & Technical Handover**: Read [DevHandover.md](file:///g:/project/MOCKEA/DevHandover.md)
- **User & Administrator Manual**: Read [HandoverDoc.md](file:///g:/project/MOCKEA/HandoverDoc.md)
- **Support Contact**: `support@mockea.com`
