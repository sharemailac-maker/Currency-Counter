/**
 * Google Analytics 4 (GA4) with strict privacy safeguards.
 * Tracks daily aggregate usage without collecting any personal data or IP addresses.
 */

const DEFAULT_MEASUREMENT_ID = 'G-1PXWTT62FY';
const env = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
const GA_MEASUREMENT_ID = (env?.VITE_GA_MEASUREMENT_ID)?.trim() || DEFAULT_MEASUREMENT_ID;

let isInitialized = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initializes Google Analytics 4 if VITE_GA_MEASUREMENT_ID is configured.
 * Automatically enables IP anonymization and disables ad personalization / signals.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID) return;
  if (isInitialized) return;

  try {
    if (typeof window.gtag === 'function') {
      isInitialized = true;
      return;
    }

    // Inject Google tag script asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };

    window.gtag('js', new Date());

    // Standard GA4 configuration
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
    });

    isInitialized = true;
  } catch {
    // Fails silently if offline or blocked
  }
}

/**
 * Track generic screen/tab transitions (e.g., 'counter', 'history', 'conversion', 'settings')
 * Sends standard GA4 page_view events for Web data stream verification.
 */
export function trackScreenView(screenName: string): void {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) return;
  try {
    const title = screenName ? (screenName.charAt(0).toUpperCase() + screenName.slice(1)) : 'Counter';
    window.gtag('event', 'page_view', {
      page_title: `${title} | Currency Counter`,
      page_location: window.location.href,
      page_path: `/#${screenName}`,
    });
  } catch {
    // Ignore tracking errors
  }
}

/**
 * Returns the currently active measurement ID if set
 */
export function getMeasurementId(): string | undefined {
  return GA_MEASUREMENT_ID;
}
