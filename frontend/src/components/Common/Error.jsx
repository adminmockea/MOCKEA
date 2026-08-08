import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router';
import { 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiArrowLeft, 
  FiHome, 
  FiLock, 
  FiFileText, 
  FiChevronDown, 
  FiChevronUp 
} from 'react-icons/fi';
import { logErrorToBackend } from '../../utils/errorLogger';

const Error = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const [showDetails, setShowDetails] = useState(false);

  // Determine dynamic error properties based on caught error type
  let statusCode = 500;
  let title = "Oops! Something went wrong.";
  let description = "We're experiencing some technical difficulties on our end. Please try refreshing the page or come back later.";
  let Icon = FiAlertTriangle;
  let iconTextColor = "text-rose-400";
  let shadowColor = "rgba(248,113,113,0.5)";
  let is404 = false;
  let isChunkError = false;
  let exceptionText = '';
  let stackText = '';

  if (isRouteErrorResponse(error)) {
    statusCode = error.status || 404;
    if (error.status === 404) {
      is404 = true;
      title = "Page Not Found";
      description = "The page you are looking for doesn't exist, has been removed, or the URL might be misspelled.";
      Icon = FiFileText;
      iconTextColor = "text-amber-400";
      shadowColor = "rgba(251,191,36,0.4)";
    } else if (error.status === 403 || error.status === 401) {
      title = "Access Denied";
      description = "You do not have permission to access this resource or your session may have expired.";
      Icon = FiLock;
      iconTextColor = "text-rose-400";
      shadowColor = "rgba(244,63,94,0.4)";
    } else {
      title = `Error ${error.status}: ${error.statusText || 'Route Error'}`;
      description = "An unexpected error occurred while navigating to this page.";
    }

    exceptionText = typeof error.data === 'string'
      ? error.data
      : (error.data?.message || error.statusText || `Route error ${error.status}`);
    stackText = error.data?.stack || `React Router caught status ${error.status} (${error.statusText || 'No status text'})`;

  } else if (error instanceof Error) {
    const message = error.message || '';
    isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('dynamic import');

    if (isChunkError) {
      statusCode = "503";
      title = "Update Required / Connection Issue";
      description = "A new version of the app may be available, or your network connection was interrupted while loading application assets.";
      Icon = FiRefreshCw;
      iconTextColor = "text-sky-400";
      shadowColor = "rgba(56,189,248,0.4)";
    } else {
      title = error.name ? `${error.name}: Application Error` : "Application Error";
      description = error.message || "An unexpected rendering exception occurred.";
    }

    exceptionText = error.message || error.name || String(error);
    stackText = error.stack || 'No extended stack trace available for this error.';

  } else if (error) {
    exceptionText = typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);
    stackText = 'No stack trace available for non-Error object.';
  } else {
    // When rendered directly via route element (e.g. <Route path="*" element={<Error />} />) where no error object is thrown by React Router
    statusCode = 404;
    is404 = true;
    title = "Page Not Found";
    description = "The page you are looking for doesn't exist, has been removed, or the URL might be misspelled.";
    Icon = FiFileText;
    iconTextColor = "text-amber-400";
    shadowColor = "rgba(251,191,36,0.4)";
    exceptionText = `No route matches URL "${typeof window !== 'undefined' ? window.location.pathname : ''}"`;
    stackText = 'Rendered via 404 Catch-All Route.';
  }

  useEffect(() => {
    // Log non-404 route errors to backend
    if (!is404) {
      logErrorToBackend(error || new window.Error("Unknown React Router rendering error"), {
        path: window.location.href,
        method: 'CLIENT_ROUTE_ERROR',
        status: typeof statusCode === 'number' ? statusCode : 500
      });
    }

    // Automatically reload once if dynamic import chunk failed to load
    if (isChunkError) {
      const reloadKey = `chunk_reload_${window.location.pathname}`;
      const hasReloaded = sessionStorage.getItem(reloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    }
  }, [error, is404, isChunkError, statusCode]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Blur */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 rounded-full blur-[150px] pointer-events-none transition-colors duration-500 opacity-20"
        style={{ backgroundColor: shadowColor }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl w-full bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/50 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, -4, 4, -4, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-neutral-700 shadow-inner"
        >
          <Icon className={`text-5xl ${iconTextColor}`} style={{ filter: `drop-shadow(0 0 12px ${shadowColor})` }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-neutral-400 mb-6 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Dynamic Accordion Diagnostic Info */}
        {exceptionText && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full mb-8 border border-neutral-700/50 rounded-2xl bg-neutral-900/60 overflow-hidden text-left"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex justify-between items-center px-5 py-4 text-xs font-semibold text-neutral-400 hover:text-slate-200 hover:bg-neutral-800/40 transition-colors font-mono cursor-pointer"
            >
              <span className="text-rose-400/90 font-bold uppercase tracking-wider">DIAGNOSTIC REPORT</span>
              {showDetails ? <FiChevronUp className="text-base" /> : <FiChevronDown className="text-base" />}
            </button>

            {showDetails && (
              <div className="px-5 pb-5 border-t border-neutral-800/50 pt-4">
                <div className="text-xs text-rose-300 font-semibold mb-2 font-mono break-words">
                  Exception: {exceptionText}
                </div>
                <pre className="text-[10px] text-neutral-500 font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all leading-relaxed bg-black/40 p-4 rounded-xl border border-neutral-800/40">
                  {stackText}
                </pre>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {is404 ? (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-neutral-900 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FiHome className="text-lg" />
              Go to Home
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-neutral-900 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FiRefreshCw className="text-lg" />
              Try Again
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-700/40 text-white rounded-xl font-semibold hover:bg-neutral-600/50 transition-all duration-300 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            Go Back
          </button>
        </motion.div>

        {/* Dynamic error code background text */}
        <div className="absolute bottom-4 right-6 opacity-10 font-mono text-6xl font-black pointer-events-none select-none">
          {statusCode}
        </div>
      </motion.div>
    </div>
  );
};

export default Error;

