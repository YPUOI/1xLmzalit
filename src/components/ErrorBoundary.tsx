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
        <div className="min-h-screen bg-[#06141B] text-[#CCD0CF] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
          <div className="w-14 h-14 rounded-2xl bg-[#11212D] border border-[#253745] flex items-center justify-center mb-4">
            <span className="text-2xl text-rose-400">⚠️</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#CCD0CF] mb-1.5 font-mono">1XLMZALIT - UCL 2026/2027</h1>
          <p className="text-xs sm:text-sm text-[#9BA8AB] max-w-sm mb-6 leading-relaxed">
            حدث خطأ غير متوقع أثناء تحميل الصفحة. يرجى إعادة تحميل التطبيق للمتابعة.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-[#CCD0CF] hover:bg-white text-[#06141B] px-6 py-2.5 rounded-xl font-bold transition-all duration-200 cursor-pointer text-xs sm:text-sm active:scale-[0.98] shadow"
          >
            إعادة تحميل التطبيق (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
