import { safeJsonParse } from './security';

export const STORAGE_KEY_REMARKS = 'currency_counter_remembered_remarks_v1';
export const STORAGE_KEY_AUTO_REMEMBER = 'currency_counter_auto_remember_remark_v1';
export const STORAGE_KEY_EMPLOYEES = 'currency_counter_remembered_employees_v1';
export const STORAGE_KEY_DEPARTMENTS = 'currency_counter_remembered_departments_v1';
export const STORAGE_KEY_LAST_EMPLOYEE = 'currency_counter_last_employee_v1';
export const STORAGE_KEY_LAST_DEPT = 'currency_counter_last_department_v1';

export const DEFAULT_REMARKS: string[] = [
  'Daily Cash Register Closing',
  'EOD Till Balance & Reconciliation',
  'Petty Cash Expense Audit',
  'Vault Safe Drop & Audit',
  'Shift Handover Cash Balance',
  'Daily Cash Inflow - Counter Sales',
  'Bank Deposit Verification Slip',
  'Department Cash Float Replenishment',
  'Weekly Financial Audit Balance',
  'Mid-day Safe Clearance',
];

export const DEFAULT_DEPARTMENTS: string[] = [
  'Accounts & Finance',
  'Treasury / Vault',
  'Front Desk & Cashier',
  'Retail & Sales Counter',
  'F&B / Restaurant Cashier',
  'Billing & Collections',
  'Operations & Logistics',
  'Admin & Petty Cash',
];

export const DEFAULT_EMPLOYEES: string[] = [
  'Rajesh Kumar (Acc-01)',
  'Priya Sharma (Treasury)',
  'Amit Patel (Cashier-1)',
  'Neha Gupta (Audit)',
  'Vikram Singh (FrontDesk)',
  'Ananya Roy (Billing)',
  'Sunil Verma (Operations)',
  'Pooja Nair (Retail-Till)',
];

export function getRememberedRemarks(): string[] {
  const parsed = safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEY_REMARKS),
    DEFAULT_REMARKS,
    (d) => Array.isArray(d) && d.length > 0
  );
  return parsed;
}

export function saveRememberedRemark(remark: string): void {
  const trimmed = remark.trim();
  if (!trimmed) return;
  try {
    const current = getRememberedRemarks();
    // Move to front, remove duplicates
    const updated = [trimmed, ...current.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_REMARKS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save remembered remark', err);
  }
}

export function deleteRememberedRemark(remark: string): void {
  try {
    const current = getRememberedRemarks();
    const updated = current.filter((r) => r.toLowerCase() !== remark.toLowerCase());
    localStorage.setItem(STORAGE_KEY_REMARKS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete remembered remark', err);
  }
}

export function getAutoRememberPreference(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_REMEMBER);
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
}

export function setAutoRememberPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_REMEMBER, String(enabled));
  } catch (err) {
    console.error('Failed to set auto-remember preference', err);
  }
}

export function getRememberedEmployees(): string[] {
  return safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEY_EMPLOYEES),
    DEFAULT_EMPLOYEES,
    (d) => Array.isArray(d) && d.length > 0
  );
}

export function saveRememberedEmployee(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    const current = getRememberedEmployees();
    const updated = [trimmed, ...current.filter((e) => e.toLowerCase() !== trimmed.toLowerCase())].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_LAST_EMPLOYEE, trimmed);
  } catch (err) {
    console.error('Failed to save remembered employee', err);
  }
}

export function getRememberedDepartments(): string[] {
  return safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEY_DEPARTMENTS),
    DEFAULT_DEPARTMENTS,
    (d) => Array.isArray(d) && d.length > 0
  );
}

export function saveRememberedDepartment(dept: string): void {
  const trimmed = dept.trim();
  if (!trimmed) return;
  try {
    const current = getRememberedDepartments();
    const updated = [trimmed, ...current.filter((d) => d.toLowerCase() !== trimmed.toLowerCase())].slice(0, 25);
    localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_LAST_DEPT, trimmed);
  } catch (err) {
    console.error('Failed to save remembered department', err);
  }
}
