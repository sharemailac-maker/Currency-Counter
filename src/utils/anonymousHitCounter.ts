/**
 * Anonymous Online User Count.
 * Strict Privacy:
 * - NO personal data is collected or transmitted.
 * - Counts anonymous visits with 30-minute session windows.
 * - Guarantees monotonic non-decreasing counts.
 */

const STORAGE_KEY_CACHED_HITS = 'cc_cached_total_hits';
const SESSION_KEY_COUNTED = 'cc_session_counted';
const STORAGE_KEY_LAST_VISIT_TIME = 'cc_last_visit_time';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30-minute standard visit session timeout

let onlineListenerAttached = false;

export interface AnonymousHitStats {
  totalHits: number;
  isOnline: boolean;
}

/**
 * Returns the currently cached hit count from localStorage.
 */
export function getCachedHitStats(): AnonymousHitStats {
  let cachedTotal = 1256;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CACHED_HITS);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) cachedTotal = Math.max(cachedTotal, num);
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
 * Detects known search engine indexing bots (Googlebot, Bingbot, etc.)
 * Only actual web crawlers are skipped to prevent crawler artificial inflation.
 */
function isSearchBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = (navigator.userAgent || '').toLowerCase();
  return /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot/i.test(ua);
}

/**
 * Determines if this is a fresh visit session (not a rapid refresh within 30 mins)
 */
function isNewVisitSession(): boolean {
  try {
    // If sessionStorage already recorded visit in current active browser tab, skip re-incrementing
    if (sessionStorage.getItem(SESSION_KEY_COUNTED)) {
      return false;
    }
    // Check timestamp: if last recorded visit was within 30 minutes, treat as same session
    const lastVisitStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_TIME);
    if (lastVisitStr) {
      const lastVisitTime = parseInt(lastVisitStr, 10);
      if (!isNaN(lastVisitTime) && Date.now() - lastVisitTime < SESSION_DURATION_MS) {
        sessionStorage.setItem(SESSION_KEY_COUNTED, 'true');
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Broadcasts hit count updates across the app UI
 */
function broadcastHitUpdate(totalHits: number, isOnline = true) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cc_hits_updated', {
        detail: { totalHits, isOnline },
      })
    );
  }
}

/**
 * Counts user when visiting while online.
 * Uses 30-minute session windows so returning visitors and PWAs are counted properly.
 */
export async function recordAnonymousVisit(): Promise<AnonymousHitStats> {
  // Do not execute network requests when search engine bots inspect page
  if (isSearchBot()) {
    return getCachedHitStats();
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  // If user is currently offline, attach one-time online listener to register once reconnected
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

  const shouldIncrement = isNewVisitSession();
  let totalHits = getCachedHitStats().totalHits;

  try {
    const method = shouldIncrement ? 'POST' : 'GET';
    const body = shouldIncrement ? JSON.stringify({ clientKnownCount: totalHits }) : undefined;

    const res = await fetch('/api/hits', {
      method,
      headers: {
        'Accept': 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalHits === 'number') {
        totalHits = Math.max(totalHits, data.totalHits);
        try {
          sessionStorage.setItem(SESSION_KEY_COUNTED, 'true');
          localStorage.setItem(STORAGE_KEY_CACHED_HITS, String(totalHits));
          localStorage.setItem(STORAGE_KEY_LAST_VISIT_TIME, String(Date.now()));
        } catch {
          // Ignore
        }
        broadcastHitUpdate(totalHits, true);
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
 * Always works when online (e.g. for Settings view or Refresh button).
 */
export async function fetchLatestHitCount(): Promise<AnonymousHitStats> {
  let totalHits = getCachedHitStats().totalHits;
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
          totalHits = Math.max(totalHits, data.totalHits);
          try {
            localStorage.setItem(STORAGE_KEY_CACHED_HITS, String(totalHits));
          } catch {
            // Ignore
          }
          broadcastHitUpdate(totalHits, true);
        }
      }
    } catch {
      // Fails silently if network unavailable
    }
  }

  return {
    totalHits,
    isOnline,
  };
}
