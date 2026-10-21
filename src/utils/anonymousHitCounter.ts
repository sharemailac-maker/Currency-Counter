/**
 * Anonymous User & Visit Hit Counter.
 * Strict Privacy Policy:
 * - NO personal data is collected or transmitted.
 * - NO user identifiers, IP addresses, cookies, or device fingerprinting.
 * - Only records raw anonymous hit increments whenever users visit the app.
 */

const STORAGE_KEY_CACHED_HITS = 'cc_cached_total_hits';
const STORAGE_KEY_DEVICE_VISITS = 'cc_anonymous_device_visits';
const STORAGE_KEY_LAST_VISIT = 'cc_anonymous_last_visit';
const SESSION_KEY_COUNTED = 'cc_session_counted';

export interface AnonymousHitStats {
  totalHits: number;
  deviceVisits: number;
  lastVisit: string | null;
  isOnline: boolean;
}

/**
 * Returns the currently cached hit statistics from localStorage.
 */
export function getCachedHitStats(): AnonymousHitStats {
  let cachedTotal = 1248;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CACHED_HITS);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) cachedTotal = num;
    }
  } catch {
    // LocalStorage unavailable
  }

  let deviceVisits = 1;
  try {
    const savedVisits = localStorage.getItem(STORAGE_KEY_DEVICE_VISITS);
    if (savedVisits) {
      const num = parseInt(savedVisits, 10);
      if (!isNaN(num) && num > 0) deviceVisits = num;
    }
  } catch {
    // LocalStorage unavailable
  }

  let lastVisit: string | null = null;
  try {
    lastVisit = localStorage.getItem(STORAGE_KEY_LAST_VISIT);
  } catch {
    // Ignore
  }

  return {
    totalHits: cachedTotal,
    deviceVisits,
    lastVisit,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

/**
 * Records an anonymous hit for the current session/visit.
 * Purely increments an aggregate counter; zero personal information collected.
 */
export async function recordAnonymousVisit(): Promise<AnonymousHitStats> {
  const nowStr = new Date().toISOString();
  let deviceVisits = 1;

  try {
    const prevVisits = parseInt(localStorage.getItem(STORAGE_KEY_DEVICE_VISITS) || '0', 10);
    deviceVisits = isNaN(prevVisits) ? 1 : prevVisits + 1;
    localStorage.setItem(STORAGE_KEY_DEVICE_VISITS, String(deviceVisits));
    localStorage.setItem(STORAGE_KEY_LAST_VISIT, nowStr);
  } catch {
    // Ignore
  }

  // Check if session has already pinged the hit counter to prevent duplicate refreshes
  let alreadySessionCounted = false;
  try {
    alreadySessionCounted = Boolean(sessionStorage.getItem(SESSION_KEY_COUNTED));
    sessionStorage.setItem(SESSION_KEY_COUNTED, 'true');
  } catch {
    // Ignore
  }

  let totalHits = getCachedHitStats().totalHits;

  try {
    // Call server to record anonymous hit (or just fetch if already counted this session)
    const method = alreadySessionCounted ? 'GET' : 'POST';
    const res = await fetch('/api/hits', {
      method,
      headers: {
        'Accept': 'application/json',
      },
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
    // Network offline; local count is preserved
  }

  return {
    totalHits,
    deviceVisits,
    lastVisit: nowStr,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
  };
}

/**
 * Fetches the latest global hit count from the server without incrementing.
 */
export async function fetchLatestHitCount(): Promise<AnonymousHitStats> {
  let totalHits = getCachedHitStats().totalHits;
  const current = getCachedHitStats();

  try {
    const res = await fetch('/api/hits', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
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

  return {
    ...current,
    totalHits,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
  };
}
