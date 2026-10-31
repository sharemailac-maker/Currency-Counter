/**
 * Anonymous Online User Count.
 * Strict Privacy:
 * - NO personal data is collected or transmitted.
 * - Counts only when user gets online.
 * - No device visit counters or identifiers.
 */

const STORAGE_KEY_CACHED_HITS = 'cc_cached_total_hits';
const SESSION_KEY_COUNTED = 'cc_session_counted';

let onlineListenerAttached = false;

export interface AnonymousHitStats {
  totalHits: number;
  isOnline: boolean;
}

/**
 * Returns the currently cached hit count from localStorage.
 */
export function getCachedHitStats(): AnonymousHitStats {
  let cachedTotal = 1253;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CACHED_HITS);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) cachedTotal = num;
    }
  } catch {
    // LocalStorage unavailable
  }

  return {
    totalHits: cachedTotal,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

/**
 * Detects search crawlers, headless audit tools, and bots (Googlebot, Bingbot, Lighthouse, etc.)
 * Crawlers should never execute analytics/hit registration XHRs during page indexing.
 */
function isSearchBotOrCrawler(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (navigator.webdriver) return true;
  const ua = navigator.userAgent || '';
  return /bot|crawler|spider|crawling|googlebot|bingbot|lighthouse|mediapartners|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|headlesschrome/i.test(ua);
}

/**
 * Counts user ONLY when online.
 * If offline, waits until user gets online to register the count.
 */
export async function recordAnonymousVisit(): Promise<AnonymousHitStats> {
  // Do not execute network XHRs when Googlebot or search crawlers inspect page resources
  if (isSearchBotOrCrawler()) {
    return getCachedHitStats();
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  // If user is currently offline, attach one-time online listener
  if (!isOnline) {
    if (typeof window !== 'undefined' && !onlineListenerAttached) {
      onlineListenerAttached = true;
      window.addEventListener(
        'online',
        () => {
          recordAnonymousVisit();
        },
        { once: true }
      );
    }
    return getCachedHitStats();
  }

  // Check if session was already counted to avoid multiple increments on fast re-renders
  let alreadySessionCounted = false;
  try {
    alreadySessionCounted = Boolean(sessionStorage.getItem(SESSION_KEY_COUNTED));
  } catch {
    // Ignore
  }

  let totalHits = getCachedHitStats().totalHits;

  try {
    const method = alreadySessionCounted ? 'GET' : 'POST';
    const res = await fetch('/api/hits', {
      method,
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalHits === 'number') {
        totalHits = data.totalHits;
        try {
          sessionStorage.setItem(SESSION_KEY_COUNTED, 'true');
          localStorage.setItem(STORAGE_KEY_CACHED_HITS, String(totalHits));
        } catch {
          // Ignore
        }
      }
    }
  } catch {
    // Network offline; cached value preserved
  }

  return {
    totalHits,
    isOnline: true,
  };
}

/**
 * Fetches the latest global user count from the server without incrementing.
 */
export async function fetchLatestHitCount(): Promise<AnonymousHitStats> {
  let totalHits = getCachedHitStats().totalHits;
  if (isSearchBotOrCrawler()) {
    return { totalHits, isOnline: true };
  }
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  if (isOnline) {
    try {
      const res = await fetch('/api/hits', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.totalHits === 'number') {
          totalHits = data.totalHits;
          try {
            localStorage.setItem(STORAGE_KEY_CACHED_HITS, String(totalHits));
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Fails silently if offline
    }
  }

  return {
    totalHits,
    isOnline,
  };
}
