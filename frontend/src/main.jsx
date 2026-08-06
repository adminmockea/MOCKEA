import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import router from './Router/router.jsx'
import { ToastContainer } from 'react-toastify'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthProvider from './context/Provider/AuthProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx'
import { setupGlobalErrorLogging } from './utils/errorLogger.js'

// Unregister broken or leftover service workers (e.g., sw.js) interfering with localhost fetches
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
      if (scriptURL.endsWith('/sw.js') || (scriptURL.includes('sw.js') && !scriptURL.includes('firebase-messaging-sw.js'))) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[ServiceWorker] Unregistered broken SW:', scriptURL);
            window.location.reload();
          }
        });
      }
    }
  });
}

// Initialize global client error interceptors
setupGlobalErrorLogging();

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router}/>          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
