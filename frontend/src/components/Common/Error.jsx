import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useRouteError } from 'react-router';
import { FiAlertTriangle, FiRefreshCw, FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { logErrorToBackend } from '../../utils/errorLogger';

const Error = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the caught route error to backend
    logErrorToBackend(error || new window.Error("Unknown React Router rendering error"), {
      path: window.location.href,
      method: 'CLIENT_ROUTE_ERROR',
      status: 500
    });

    // Automatically reload the page once if a chunk failed to load (guarded to prevent infinite reload loops)
    const errorMessage = error?.message || String(error || '');
    const isChunkError =
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('dynamic import');

    if (isChunkError) {
      const reloadKey = `chunk_reload_${window.location.pathname}`;
      const hasReloaded = sessionStorage.getItem(reloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-error/5 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl w-full bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/50 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, -5, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-neutral-700 shadow-inner"
        >
          <FiAlertTriangle className="text-5xl text-error drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Oops! Something went wrong.
          </h1>
          <p className="text-neutral-400 mb-6 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            We're experiencing some technical difficulties on our end. Please try refreshing the page or come back later.
          </p>
        </motion.div>

        {/* Dynamic Accordion Diagnostic Info */}
        {error && (
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
                <div className="text-xs text-rose-300 font-semibold mb-2 font-mono truncate">
                  Exception: {error.message || String(error)}
                </div>
                <pre className="text-[10px] text-neutral-500 font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all leading-relaxed bg-black/40 p-4 rounded-xl border border-neutral-800/40">
                  {error.stack || 'No extended stack trace available for this error.'}
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
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-neutral-900 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FiRefreshCw className="text-lg" />
            Try Again
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-700/40 text-white rounded-xl font-semibold hover:bg-neutral-600/50 transition-all duration-300 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            Go Back
          </button>
        </motion.div>

        {/* Decorative error code subtle text */}
        <div className="absolute bottom-4 right-6 opacity-10 font-mono text-6xl font-black pointer-events-none select-none">
          500
        </div>
      </motion.div>
    </div>
  );
};

export default Error;
