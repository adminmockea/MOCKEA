# MOCKEA Frontend Client

This is the web frontend client for **MOCKEA**, built with React 19, Vite 6, Tailwind CSS 4, and DaisyUI 5. It delivers an interactive user interface for IELTS & PTE preparation, including practice laboratories, full-length timed mock test environments with anti-cheat monitoring, instructor review centers, and a Study Buddy AI Chatbot.

---

## 🛠️ Tech Stack & Key Libraries

- **Framework & Build Tool**: React 19 + Vite 6 (SPA with **Route-Level Code-Splitting** / Lazy Loading)
- **Routing**: React Router 7 with route guards (`PrivateRoute`, `AdminRoute`, `InstructorRoute`)
- **Styling**: Tailwind CSS 4 + DaisyUI 5 (Vanilla CSS tokens, responsive dark theme support)
- **State & Server Cache**: TanStack Query 5 (React Query) with custom wrappers ([useAdminQuery.jsx](file:///g:/project/MOCKEA/frontend/src/hooks/useAdminQuery.jsx))
- **Authentication**: Firebase Web SDK with automatic Axios ID Token refresh interceptors ([useAxiosSecure.jsx](file:///g:/project/MOCKEA/frontend/src/hooks/useAxiosSecure.jsx))
- **Animations**: Framer Motion & GSAP for smooth UI transitions and dialog modals
- **Audio Control**: Howler.js for listening audio playback
- **Telemetry & Analytics**: Google Analytics 4 (`react-ga4`, ID: `G-M2XMQ7DRWD`) and client error logger ([errorLogger.js](file:///g:/project/MOCKEA/frontend/src/utils/errorLogger.js))
- **Direct Audio Uploads**: Signed binary audio uploads to Cloudinary CDN for speaking responses

---

## 📂 Frontend Directory Structure

```text
frontend/
├── public/                    # Favicons, logos, static assets
├── src/
│   ├── main.jsx               # Entry point mounting React app & Providers
│   ├── index.css              # Global CSS & Tailwind directives
│   ├── firebase.config.js     # Firebase Web SDK initialization
│   ├── components/            # UI Components
│   │   ├── Auth/              # Login, Register, Social Login buttons
│   │   ├── Common/            # Reusable widgets (PageHeader, TableShell, AdminModal, TestShell, alerts)
│   │   ├── Dashboard/         # Student, Instructor & Admin dashboard views
│   │   ├── Home/              # Landing page sections, pricing, hero, features
│   │   └── Shared/            # Navbar, Footer, Loading Skeletons
│   ├── context/               # React Contexts (AuthProvider, ThemeProvider)
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useAxiosSecure.jsx # Axios instance with Firebase Bearer token injection
│   │   ├── useUserProfile.jsx # Cached user profile hook
│   │   ├── useTestIntegrity.jsx# Anti-cheat fullscreen & tab-switch tracker
│   │   ├── useCountdown.jsx   # Precision exam countdown timer
│   │   └── useAdminQuery.jsx  # React Query administrative data wrapper
│   ├── Layout/                # Layout containers (RootLayout, DashboardLayout, HomeLayout)
│   ├── Router/                # Application route definitions & access guards
│   └── utils/                 # Utilities (analytics.js, errorLogger.js, fcm.js)
├── package.json
└── vite.config.js             # Vite build & proxy configuration
```

---

## ⚙️ Environment Variables (`frontend/.env`)

```env
VITE_local_url=http://localhost:3000/api/
VITE_live_url=https://ecostream-backend.vercel.app/api/
VITE_live_url2=https://mockea.web.app/

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

## 🚀 Running the Client Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start Development Server** (Vite HMR):
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
   Generates optimized assets in `dist/` with route-level chunk splitting.
