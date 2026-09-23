import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C19] text-[#E2E8F0] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <span className="text-2xl text-rose-400">⚠️</span>
          </div>
          <h1 className="text-xl font-black text-white mb-2 font-mono">1XLMZALIT - UCL 2026/2027</h1>
          <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
            حدث خطأ غير متوقع أثناء تحميل الصفحة. يرجى إعادة تحميل التطبيق للمتابعة.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-2.5 bg-[#00E5FF] hover:bg-[#38bdf8] text-[#04101e] font-black rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-95 transition cursor-pointer text-sm"
          >
            إعادة تحميل التطبيق (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
