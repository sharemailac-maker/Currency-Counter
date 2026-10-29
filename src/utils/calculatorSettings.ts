import { ActiveCalculatorType, FinancialCalculatorType } from '../types';

export const STORAGE_KEY_CALCULATOR_ENABLED = 'cc_calculator_enabled_v3';
export const STORAGE_KEY_SELECTED_CALCULATOR = 'cc_selected_calculator_v3';
export const LEGACY_STORAGE_KEY_CALCULATOR = 'cc_active_conversion_calculator';

/**
 * Returns true if other calculators are enabled.
 * DEFAULT IS ENABLED. Can be disabled or re-enabled by the user anytime from Settings.
 */
export function isCalculatorEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_CALCULATOR_ENABLED);
    if (val !== null) {
      return val === 'true';
    }
    // Default is ENABLED
    return true;
  } catch {
    return true;
  }
}

export function setCalculatorEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_CALCULATOR_ENABLED, String(enabled));
    if (!enabled) {
      localStorage.setItem(LEGACY_STORAGE_KEY_CALCULATOR, 'none');
    } else {
      localStorage.setItem(LEGACY_STORAGE_KEY_CALCULATOR, getSelectedCalculator());
    }
  } catch (err) {
    console.error('Failed to set calculator enabled flag', err);
  }
}

export function getSelectedCalculator(): FinancialCalculatorType {
  try {
    const val = localStorage.getItem(STORAGE_KEY_SELECTED_CALCULATOR);
    if (val === 'fd' || val === 'sip' || val === 'rd' || val === 'loan_emi') {
      return val;
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY_CALCULATOR);
    if (legacy === 'fd' || legacy === 'sip' || legacy === 'rd' || legacy === 'loan_emi') {
      return legacy;
    }
    return 'fd';
  } catch {
    return 'fd';
  }
}

export function setSelectedCalculator(type: FinancialCalculatorType): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_CALCULATOR, type);
    if (isCalculatorEnabled()) {
      localStorage.setItem(LEGACY_STORAGE_KEY_CALCULATOR, type);
    }
  } catch (err) {
    console.error('Failed to set selected calculator preference', err);
  }
}

export function getActiveCalculator(): ActiveCalculatorType {
  return isCalculatorEnabled() ? getSelectedCalculator() : 'none';
}

export function setActiveCalculator(type: ActiveCalculatorType): void {
  if (type === 'none') {
    setCalculatorEnabled(false);
  } else {
    setCalculatorEnabled(true);
    setSelectedCalculator(type);
  }
}
