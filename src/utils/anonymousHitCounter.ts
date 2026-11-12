/**
 * App Users / Visitors Counter.
 * Clean, direct visitor counting:
 * - Every app opening visit hits +1 in the counter.
 * - Same user visiting the app again hits +1 every time.
 * - All complex sub-rules, session timeouts, and restrictions have been removed.
 */

const STORAGE_KEY_CACHED_HITS = 'cc_cached_total_hits';

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
 * Records every app opening visit (+1 count every time).
 * Same user visiting again will increment +1.
 * Extra sub-rules and restrictions have been removed.
 */
export async function recordAnonymousVisit(): Promise<AnonymousHitStats> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  // If currently offline, attach one-time listener to hit counter once reconnected
  if (!isOnline) {
    if (typeof window !== 'undefined') {
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

  let totalHits = getCachedHitStats().totalHits;

  try {
    const res = await fetch('/api/hits', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientKnownCount: totalHits }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalHits === 'number') {
        totalHits = Math.max(totalHits, data.totalHits);
        try {
          localStorage.setItem(STORAGE_KEY_CACHED_HITS, String(totalHits));
        } catch {
          // Ignore storage quota
        }
        broadcastHitUpdate(totalHits, true);
      }
    }
  } catch {
    // Offline / network failure: cached value retained
  }

  return {
    totalHits,
    isOnline: true,
  };
}

/**
 * Fetches the latest hit count from the server without incrementing.
 * Used for Settings refresh button.
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
