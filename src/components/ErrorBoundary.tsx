import * as React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      window.location.reload();
    } catch {
      // Fallback
    }
  };

  handleHardReset = () => {
    try {
      localStorage.removeItem('minipos_auth_user');
      window.location.href = window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
              ប្រព័ន្ធកំពុងដំណើរការឡើងវិញ
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              ប្រព័ន្ធបានការពារសុវត្ថិភាពទិន្នន័យរបស់អ្នក។ សូមចុចប៊ូតុង Refresh ឬចូលឡើងវិញដើម្បីបន្តប្រើប្រាស់។
            </p>

            {this.state.error && (
              <div className="bg-slate-950/60 border border-slate-700/50 rounded-2xl p-3.5 mb-6 text-left overflow-hidden">
                <div className="text-[11px] font-mono text-red-400 break-words line-clamp-3">
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="error-boundary-refresh-btn"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ផ្ទុកឡើងវិញ (Refresh)</span>
              </button>

              <button
                type="button"
                id="error-boundary-reset-auth-btn"
                onClick={this.handleHardReset}
                className="w-full sm:w-auto px-5 py-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-4 h-4" />
                <span>ចូលឡើងវិញ (Re-login)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
