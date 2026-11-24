export const ADSENSE_PUBLISHER_ID = 'pub-4754025584591104';
export const ADSENSE_CLIENT_ID = 'ca-pub-4754025584591104';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
export const ADSENSE_SLOT_ID = env?.VITE_ADSENSE_SLOT_ID?.trim() || '';

const STORAGE_KEY_OFFLINE_ONLY = 'currency_counter_offline_only_v1';
const ADSENSE_SCRIPT_ID = 'google-adsense-script';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function getOfflineOnlyMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_OFFLINE_ONLY) === 'true';
  } catch {
    return false;
  }
}

export function setOfflineOnlyMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_ONLY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('offline_mode_changed', { detail: { enabled } }));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function isDeviceOnline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine !== false;
}

export function canServeOnlineAds(): boolean {
  return isDeviceOnline() && !getOfflineOnlyMode();
}

let scriptPromise: Promise<boolean> | null = null;

/**
 * Loads Google AdSense script dynamically ONLY when the user is online
 * and has not enabled Offline Mode. Never blocks or errors when offline.
 */
export function loadAdSenseScript(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (!canServeOnlineAds()) {
    return Promise.resolve(false);
  }

  const existing =
    (document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null) ||
    (document.querySelector('script[src*="adsbygoogle.js"]') as HTMLScriptElement | null);
  if (existing) {
    return Promise.resolve(true);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<boolean>((resolve) => {
    try {
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT_ID)}`;

      script.onload = () => {
        try {
          window.adsbygoogle = window.adsbygoogle || [];
        } catch {
          // Ignore adblocker or runtime restriction
        }
        resolve(true);
      };

      script.onerror = () => {
        scriptPromise = null;
        resolve(false);
      };

      document.head.appendChild(script);
    } catch {
      scriptPromise = null;
      resolve(false);
    }
  });

  return scriptPromise;
}

export function pushAdSlot(): void {
  if (typeof window === 'undefined' || !canServeOnlineAds()) return;
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    // Silently ignore if blocked by privacy extension or offline
  }
}
