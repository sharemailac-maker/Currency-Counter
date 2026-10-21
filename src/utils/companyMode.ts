export const STORAGE_KEY_COMPANY_MODE = 'currency_counter_company_mode_enabled_v1';

export function getCompanyMode(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_COMPANY_MODE);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setCompanyMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPANY_MODE, String(enabled));
  } catch (err) {
    console.error('Failed to save company mode preference', err);
  }
}
