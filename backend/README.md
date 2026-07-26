# MOCKEA Backend API Server

This is the backend REST API server for **MOCKEA**, built with Node.js (ES Modules) and Express 5. It powers user authentication sync, database interactions, automated AI grading via Google Gemini 2.5 Flash, Cloudinary upload signature generation, multi-tier rate limiting, process clustering via PM2, and caching.

---

## 🛠️ Backend Stack & Architecture

- **Runtime**: Node.js v18+ (ES Modules: `"type": "module"`)
- **Framework**: Express.js v5
- **Primary Database**: MongoDB Atlas via Mongoose ODM (`minPoolSize: 10`, `maxPoolSize: 300`)
- **Caching Layer**: Redis Client with automatic in-memory JavaScript `Map` cache fallback ([cache.js](file:///g:/project/MOCKEA/backend/src/utils/cache.js))
- **Authentication**: Firebase Admin SDK (`firebase-admin`) verifying client JWTs and managing user claims
- **AI Evaluation Service**: Google Gemini 2.5 Flash API ([aiService.js](file:///g:/project/MOCKEA/backend/src/lib/aiService.js))
- **Media CDN Uploads**: Cloudinary SDK generating signed signatures for direct client-to-cloud audio uploads
- **Security & Middleware**: Global rate limiting ([apiRateLimiter.js](file:///g:/project/MOCKEA/backend/src/middlewares/apiRateLimiter.js)), NoSQL & XSS input sanitization ([sanitize.js](file:///g:/project/MOCKEA/backend/src/middlewares/sanitize.js)), IP Blocker ([ipBlocker.js](file:///g:/project/MOCKEA/backend/src/middlewares/ipBlocker.js))
- **Process Clustering**: PM2 Process Manager ([ecosystem.config.cjs](file:///g:/project/MOCKEA/backend/ecosystem.config.cjs)) running in cluster mode across available CPU cores

---

## 📂 Directory Structure

```text
backend/
├── ecosystem.config.cjs       # PM2 process manager configuration
├── vercel.json                # Vercel serverless deployment config
├── src/
│   ├── index.js               # Express application entry point
│   ├── controllers/           # Route logic controllers
│   │   ├── analytics.controller.js
│   │   ├── booking.controller.js
│   │   ├── chatbot.controller.js
│   │   ├── errorLog.controller.js
│   │   ├── mockTest.controller.js
│   │   ├── pricing.controller.js
│   │   ├── publicMockTest.controller.js
│   │   ├── questions.controller.js
│   │   ├── resource.controller.js
│   │   ├── submissions.controller.js
│   │   ├── superAdmin.controller.js
│   │   ├── trainer.controller.js
│   │   └── user.controller.js
│   ├── lib/                   # Core connections & integrations
│   │   ├── aiService.js       # Gemini 2.5 Flash REST evaluation service
│   │   ├── connectDB.js       # Mongoose MongoDB connection pool
│   │   └── firebase.config.js # Firebase Admin SDK initialization
│   ├── middlewares/           # Middleware pipeline
│   │   ├── apiRateLimiter.js  # Sliding-window rate limiter
│   │   ├── errorHandler.js   # Global error handling middleware
│   │   ├── ipBlocker.js       # IP blacklist blocking middleware
│   │   ├── sanitize.js        # NoSQL injection & XSS sanitizer
│   │   └── verifyUserToken.js # Firebase JWT authorization middleware
│   ├── model/                 # Mongoose Data Schemas
│   │   ├── User.js, Questions.js, MockTest.js, PracticeSubmission.js
│   │   ├── MockTestResult.js, Resource.js, ChatbotSettings.js
│   │   ├── UserChatbotUsage.js, Pricing.js, Trainer.js, ErrorLog.js
│   └── routes/                # Express API router definitions
└── package.json
```

---

## 📡 API Endpoint Summary

All routes are mounted under `/api` in `src/index.js`:

| Endpoint Prefix | Description | Auth Guards |
| :--- | :--- | :--- |
| `/api/user` | Account registration sync, role lookups, plan updates, bans | `verifyUserToken` |
| `/api/questions` | Question banks, passage management, answer evaluation | `verifyUserToken`, `Admin` |
| `/api/mock-tests` | Full 4-part mock test creation, start session, finalize | `verifyUserToken` |
| `/api/public-mock-tests` | Public test library preview for guests | None |
| `/api/submissions` | Practice lab submissions, Cloudinary signatures, grading | `verifyUserToken` |
| `/api/chatbot` | Study Buddy AI chatbot interaction & quota management | None / User |
| `/api/resources` | Study guides, PDF downloads, resource cards | None / Admin |
| `/api/error-logs` | Client-side & server-side error logging | None (write) / Admin (read) |

---

## ⚙️ Environment Variables (`backend/.env`)

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

---

## 🚀 Running the Server Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start in Development Mode** (Nodemon auto-reload):
   ```bash
   npm run dev
   ```
3. **Start in Clustered Production Mode** (PM2):
   ```bash
   pm2 start ecosystem.config.cjs
   ```
