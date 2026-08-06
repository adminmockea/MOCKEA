import React from 'react';
import { logErrorToBackend } from '../../utils/errorLogger';
import { FiRefreshCw, FiAlertTriangle, FiHome, FiChevronDown, FiChevronUp } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Send error report to backend with component stack trace
    logErrorToBackend(error, {
      path: window.location.href,
      method: 'CLIENT_RENDER',
      status: 500,
      componentStack: errorInfo.componentStack
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
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Sleek glassmorphism error panel
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-tr from-gray-950 via-slate-900 to-indigo-950 text-white font-sans overflow-y-auto">
          {/* Glowing backdrops */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Animated Danger Badge */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-500/10 animate-bounce">
                <FiAlertTriangle className="text-4xl text-rose-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                  Application Ran Into An Issue
                </h1>
                <p className="text-slate-400 text-base max-w-md mx-auto">
                  A rendering exception occurred on this page. We've automatically logged the issue for our engineers to investigate.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center w-full pt-2">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FiRefreshCw className="text-lg animate-spin" style={{ animationDuration: '3s' }} />
                  Reload App
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 font-semibold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FiHome className="text-lg" />
                  Go to Home
                </button>
              </div>

              {/* Technical Details Accordion */}
              {this.state.error && (
                <div className="w-full border border-white/5 rounded-2xl bg-black/30 overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    className="w-full flex justify-between items-center px-5 py-4 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="font-mono text-rose-400/90">TECHNICAL DIAGNOSTIC LOG</span>
                    {this.state.showDetails ? <FiChevronUp className="text-base" /> : <FiChevronDown className="text-base" />}
                  </button>

                  {this.state.showDetails && (
                    <div className="px-5 pb-5 text-left border-t border-white/5">
                      <div className="text-xs text-rose-300 font-semibold mb-2 font-mono truncate">
                        Exception: {this.state.error?.name || "Error"}
                      </div>
                      <pre className="text-[10px] text-slate-500 font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
