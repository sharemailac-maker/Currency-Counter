import { APP_VERSION } from './appVersion';

const STORAGE_KEY_VISIT_COUNT = 'currency_counter_device_visits_v2';
const STORAGE_KEY_SUPPRESSED_VERSION = 'currency_counter_feedback_suppressed_version';
const SESSION_KEY_INITIALIZED = 'currency_counter_visit_session_init';
const SESSION_KEY_DISMISSED = 'currency_counter_feedback_prompt_session_dismissed';

/**
 * Increments the device visit count on new sessions.
 * Returns the current total visit count for this device.
 */
export function trackDeviceVisit(): number {
  if (typeof window === 'undefined') return 1;

  try {
    let visits = parseInt(localStorage.getItem(STORAGE_KEY_VISIT_COUNT) || '0', 10);
    if (isNaN(visits) || visits < 0) visits = 0;

    // Check if this browser tab/session already registered the visit
    const sessionActive = sessionStorage.getItem(SESSION_KEY_INITIALIZED);
    if (!sessionActive) {
      visits += 1;
      localStorage.setItem(STORAGE_KEY_VISIT_COUNT, String(visits));
      sessionStorage.setItem(SESSION_KEY_INITIALIZED, 'true');
    }

    return visits;
  } catch {
    return 1;
  }
}

/**
 * Returns current visit count without incrementing.
 */
export function getDeviceVisitCount(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const visits = parseInt(localStorage.getItem(STORAGE_KEY_VISIT_COUNT) || '0', 10);
    return isNaN(visits) ? 0 : visits;
  } catch {
    return 0;
  }
}

/**
 * Determines whether the in-app feedback reminder prompt should be displayed.
 * Condition: User is using/visiting app for MORE than once (visits > 1),
 * not suppressed for current app version, and not dismissed in current session.
 */
export function shouldShowFeedbackPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const visits = getDeviceVisitCount();
    // Only show if user has visited more than once
    if (visits <= 1) {
      return false;
    }

    // Check if user chose "Do not remind me again" for this app version
    const suppressedVersion = localStorage.getItem(STORAGE_KEY_SUPPRESSED_VERSION);
    if (suppressedVersion === APP_VERSION) {
      return false;
    }

    // Check if user dismissed for current session
    if (sessionStorage.getItem(SESSION_KEY_DISMISSED) === 'true') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Saves user response when dismissing or interacting with the prompt.
 * If doNotRemindAgain is true, permanently suppresses prompt until the next app version update.
 */
export function recordFeedbackPromptChoice(doNotRemindAgain: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    if (doNotRemindAgain) {
      localStorage.setItem(STORAGE_KEY_SUPPRESSED_VERSION, APP_VERSION);
    }
    sessionStorage.setItem(SESSION_KEY_DISMISSED, 'true');
  } catch {
    // Ignore storage issues
  }
}
