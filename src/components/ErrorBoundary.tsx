import React from 'react';
import { Emoji3D } from './Emoji3D';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const rawMsg = error instanceof Error ? error.message : String(error || '');
    return {
      hasError: true,
      errorMessage: rawMsg.slice(0, 300),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('App ErrorBoundary caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-amber-400/40 p-6 text-center shadow-2xl space-y-4">
            <div className="flex justify-center" aria-hidden="true">
              <Emoji3D emoji="🛠️" className="w-12 h-12" />
            </div>
            <h1 className="font-kids text-2xl font-bold text-amber-300">
              Piccolo intoppo tecnico
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              I progressi salvati sul dispositivo sono al sicuro. Tocca il pulsante qui sotto per ricaricare subito l&apos;app.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold text-sm cursor-pointer shadow-lg hover:brightness-105 transition"
            >
              Ricarica Il Mio Mondo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
