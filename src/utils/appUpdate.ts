import { APP_VERSION } from './appVersion';

/**
 * Checks for available service worker or web application updates.
 */
export async function checkForAppUpdates(): Promise<{ updated: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { updated: false, message: `Version ${APP_VERSION} is active.` };
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }

    return {
      updated: false,
      message: `You are on the latest version (v${APP_VERSION}). All offline tools are up to date!`,
    };
  } catch {
    return {
      updated: false,
      message: `Running 100% offline with version v${APP_VERSION}.`,
    };
  }
}

/**
 * Forces a fresh re-fetch of application assets and reloads the window.
 */
export function reloadAndApplyUpdate(): void {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (!name.includes('currency-counter')) {
            caches.delete(name);
          }
        });
      });
    }
  } catch {
    // Ignore cache error
  }

  window.location.reload();
}
