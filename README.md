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

| Layer | Technology / Service | Details / Configuration | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | SPA with Code-Splitting | Ultra-fast client build and lazy routing |
| **Styling & UI** | Tailwind CSS 4 + DaisyUI 5 | Vanilla CSS directives | Modern responsive design system & dark mode |
| **State Management** | TanStack Query 5 (React Query) | Stale-while-revalidate | Server-state caching and synchronization |
| **Backend Engine** | Node.js (ES Modules) + Express 5 | PM2 Clustering | Scalable RESTful API backend |
| **Primary Database** | MongoDB Atlas | Cluster Instance | Persistent data storage for users, tests, submissions |
| **Caching Database** | Redis + In-Memory Fallback | Key-value store (`cache.js`) | Read-through cache for tests and question banks |
| **Authentication** | Firebase Auth & Admin SDK | Firebase Project | Identity management, Google OAuth & JWT validation |
| **AI Evaluation Engine** | Google Gemini 2.5 Flash API | `GEMINI_API_KEY` | Automated essay/speech grading & AI Chatbot tutor |
| **Media Cloud Storage** | Cloudinary CDN | Cloudinary Instance | Audio recordings & resource PDF storage |
| **Analytics Telemetry** | Google Analytics 4 (`react-ga4`) | GA4 Telemetry | Route pageviews, checkouts & anti-cheat alerts |
| **Hosting Platform** | Firebase Hosting & Vercel | Production CDN & API Server | Global CDN client hosting & server API hosting |

---

## ⚙️ Environment Configuration

Set up local `.env` files in both workspace directories before running:

### Backend `.env` (`backend/.env`)
```env
PORT=3000
DEV_URL=http://localhost:5173
DEV_URL2=http://localhost:5174
CLIENT_URL=http://localhost:5173
CLIENT_URL2=http://localhost:5174
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
FIREBASE_KEY=your_base64_encoded_firebase_service_account_json
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend `.env` (`frontend/.env`)
```env
VITE_local_url=http://localhost:3000/api/
VITE_live_url=https://your-api-domain.com/api/
VITE_apiKey=your_firebase_api_key
VITE_authDomain=your-project.firebaseapp.com
VITE_projectId=your-project-id
VITE_storageBucket=your-project.firebasestorage.app
VITE_messagingSenderId=your_messaging_sender_id
VITE_appId=your_app_id
VITE_measurementId=your_ga4_measurement_id
VITE_CLOUD_NAME=your_cloudinary_cloud_name
VITE_UPLOAD_PRESET=your_upload_preset
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
