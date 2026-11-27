import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import { initClientSecurityShield } from './utils/security';

// Initialize client-side security armor (anti-prototype pollution & tampering)
initClientSecurityShield();

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  declare props: Readonly<{children: ReactNode}>;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Recovered from runtime UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold text-emerald-400 mb-2">Currency Counter</h1>
          <p className="text-sm text-stone-300 max-w-md mb-4">
            Cash Denomination Counter &amp; Financial Calculators for 47+ countries.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer"
          >
            Reload App
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

// Register offline service worker for standalone PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch((err) => {
        console.log('SW registration note:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
