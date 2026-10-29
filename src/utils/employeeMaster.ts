import { MasterEmployee } from '../types';
import { safeJsonParse } from './security';

export const STORAGE_KEY_MASTER_EMPLOYEES = 'currency_counter_master_employees_v2';
export const STORAGE_KEY_MASTER_DEPARTMENTS = 'currency_counter_master_departments_v2';
export const STORAGE_KEY_MASTER_REMARKS = 'currency_counter_master_remarks_v2';

export const DEFAULT_MASTER_REMARKS: string[] = [
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
  'Vendor Cash Advance Settlement',
  'Weekend Vault Re-verification',
];

export const DEFAULT_MASTER_DEPARTMENTS: string[] = [
  'Accounts & Finance',
  'Treasury / Vault',
  'Front Desk & Cashier',
  'Retail & Sales Counter',
  'Billing & Collections',
  'Operations & Logistics',
  'F&B / Restaurant Cashier',
  'Admin & Petty Cash',
  'Internal Audit & Compliance',
];

export const INITIAL_DEFAULT_EMPLOYEES: MasterEmployee[] = [
  { id: 'emp-101', employeeCode: 'ACC-01', name: 'Rajesh Kumar', department: 'Accounts & Finance', designation: 'Senior Accountant' },
  { id: 'emp-102', employeeCode: 'TRS-02', name: 'Priya Sharma', department: 'Treasury / Vault', designation: 'Treasury Officer' },
  { id: 'emp-103', employeeCode: 'CSH-03', name: 'Amit Patel', department: 'Retail & Sales Counter', designation: 'Head Cashier' },
  { id: 'emp-104', employeeCode: 'AUD-04', name: 'Neha Gupta', department: 'Internal Audit & Compliance', designation: 'Internal Auditor' },
  { id: 'emp-105', employeeCode: 'FDK-05', name: 'Vikram Singh', department: 'Front Desk & Cashier', designation: 'Front Desk Lead' },
  { id: 'emp-106', employeeCode: 'BIL-06', name: 'Ananya Roy', department: 'Billing & Collections', designation: 'Billing Supervisor' },
  { id: 'emp-107', employeeCode: 'OPS-07', name: 'Sunil Verma', department: 'Operations & Logistics', designation: 'Operations Manager' },
  { id: 'emp-108', employeeCode: 'RTL-08', name: 'Pooja Nair', department: 'Retail & Sales Counter', designation: 'Cashier' },
  { id: 'emp-109', employeeCode: 'ACC-09', name: 'Karthik Rao', department: 'Accounts & Finance', designation: 'Financial Analyst' },
  { id: 'emp-110', employeeCode: 'TRS-10', name: 'Meera Iyer', department: 'Treasury / Vault', designation: 'Vault Custodian' },
  { id: 'emp-111', employeeCode: 'ADM-11', name: 'Deepak Joshi', department: 'Admin & Petty Cash', designation: 'Petty Cash Custodian' },
  { id: 'emp-112', employeeCode: 'CSH-12', name: 'Sneha Kulkarni', department: 'F&B / Restaurant Cashier', designation: 'POS Cashier' },
];

/* ------------------- MASTER EMPLOYEES CRUD ------------------- */

export function getMasterEmployees(): MasterEmployee[] {
  return safeJsonParse<MasterEmployee[]>(
    localStorage.getItem(STORAGE_KEY_MASTER_EMPLOYEES),
    INITIAL_DEFAULT_EMPLOYEES,
    (d) => Array.isArray(d) && d.length > 0
  );
}

export function saveMasterEmployees(employees: MasterEmployee[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MASTER_EMPLOYEES, JSON.stringify(employees));
  } catch (err) {
    console.error('Failed to save master employees', err);
  }
}

export function addMasterEmployee(emp: Omit<MasterEmployee, 'id'> & { id?: string }): MasterEmployee {
  const current = getMasterEmployees();
  const newEmp: MasterEmployee = {
    id: emp.id || `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: emp.name.trim(),
    department: emp.department.trim() || 'General',
    employeeCode: emp.employeeCode?.trim() || undefined,
    designation: emp.designation?.trim() || undefined,
    phone: emp.phone?.trim() || undefined,
    email: emp.email?.trim() || undefined,
  };
  const updated = [newEmp, ...current];
  saveMasterEmployees(updated);

  // If department isn't in master departments, add it automatically
  if (newEmp.department) {
    addMasterDepartment(newEmp.department);
  }

  return newEmp;
}

export function updateMasterEmployee(id: string, updates: Partial<MasterEmployee>): boolean {
  const current = getMasterEmployees();
  const index = current.findIndex((e) => e.id === id);
  if (index === -1) return false;

  current[index] = {
    ...current[index],
    ...updates,
    name: updates.name ? updates.name.trim() : current[index].name,
    department: updates.department ? updates.department.trim() : current[index].department,
  };

  saveMasterEmployees(current);

  if (updates.department) {
    addMasterDepartment(updates.department);
  }

  return true;
}

export function deleteMasterEmployee(id: string): boolean {
  const current = getMasterEmployees();
  const filtered = current.filter((e) => e.id !== id);
  if (filtered.length === current.length) return false;
  saveMasterEmployees(filtered);
  return true;
}

export function deleteMultipleMasterEmployees(ids: string[]): number {
  if (!ids || ids.length === 0) return 0;
  const idSet = new Set(ids);
  const current = getMasterEmployees();
  const filtered = current.filter((e) => !idSet.has(e.id));
  const removedCount = current.length - filtered.length;
  if (removedCount > 0) {
    saveMasterEmployees(filtered);
  }
  return removedCount;
}

export function clearAllMasterEmployees(): void {
  saveMasterEmployees([]);
}

/* ------------------- MASTER DEPARTMENTS CRUD ------------------- */

export function getMasterDepartments(): string[] {
  return safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEY_MASTER_DEPARTMENTS),
    DEFAULT_MASTER_DEPARTMENTS,
    (d) => Array.isArray(d) && d.length > 0
  );
}

export function saveMasterDepartments(depts: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MASTER_DEPARTMENTS, JSON.stringify(depts));
  } catch (err) {
    console.error('Failed to save master departments', err);
  }
}

export function addMasterDepartment(deptName: string): boolean {
  const clean = deptName.trim();
  if (!clean) return false;
  const current = getMasterDepartments();
  if (current.some((d) => d.toLowerCase() === clean.toLowerCase())) return false;
  const updated = [...current, clean];
  saveMasterDepartments(updated);
  return true;
}

export function updateMasterDepartment(oldName: string, newName: string): boolean {
  const cleanNew = newName.trim();
  if (!cleanNew) return false;
  const current = getMasterDepartments();
  const index = current.findIndex((d) => d.toLowerCase() === oldName.trim().toLowerCase());
  if (index === -1) return false;
  current[index] = cleanNew;
  saveMasterDepartments(current);

  // Also update any employees assigned to this old department name
  const employees = getMasterEmployees();
  let empUpdated = false;
  const updatedEmps = employees.map((emp) => {
    if (emp.department.toLowerCase() === oldName.trim().toLowerCase()) {
      empUpdated = true;
      return { ...emp, department: cleanNew };
    }
    return emp;
  });
  if (empUpdated) {
    saveMasterEmployees(updatedEmps);
  }

  return true;
}

export function deleteMasterDepartment(deptName: string): boolean {
  const current = getMasterDepartments();
  const filtered = current.filter((d) => d.toLowerCase() !== deptName.trim().toLowerCase());
  if (filtered.length === current.length) return false;
  saveMasterDepartments(filtered);
  return true;
}

export function deleteMultipleMasterDepartments(deptNames: string[]): number {
  if (!deptNames || deptNames.length === 0) return 0;
  const nameSet = new Set(deptNames.map((n) => n.trim().toLowerCase()));
  const current = getMasterDepartments();
  const filtered = current.filter((d) => !nameSet.has(d.trim().toLowerCase()));
  const removedCount = current.length - filtered.length;
  if (removedCount > 0) {
    saveMasterDepartments(filtered);
  }
  return removedCount;
}

/* ------------------- MASTER REMARKS / NARRATIONS CRUD ------------------- */

export function getMasterRemarks(): string[] {
  return safeJsonParse<string[]>(
    localStorage.getItem(STORAGE_KEY_MASTER_REMARKS),
    DEFAULT_MASTER_REMARKS,
    (d) => Array.isArray(d) && d.length > 0
  );
}

export function saveMasterRemarks(remarks: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MASTER_REMARKS, JSON.stringify(remarks));
  } catch (err) {
    console.error('Failed to save master remarks', err);
  }
}

export function addMasterRemark(remarkText: string): boolean {
  const clean = remarkText.trim();
  if (!clean) return false;
  const current = getMasterRemarks();
  if (current.some((r) => r.toLowerCase() === clean.toLowerCase())) return false;
  const updated = [clean, ...current];
  saveMasterRemarks(updated);
  return true;
}

export function updateMasterRemark(oldRemark: string, newRemark: string): boolean {
  const clean = newRemark.trim();
  if (!clean) return false;
  const current = getMasterRemarks();
  const index = current.findIndex((r) => r.toLowerCase() === oldRemark.trim().toLowerCase());
  if (index === -1) return false;
  current[index] = clean;
  saveMasterRemarks(current);
  return true;
}

export function deleteMasterRemark(remarkText: string): boolean {
  const current = getMasterRemarks();
  const filtered = current.filter((r) => r.toLowerCase() !== remarkText.trim().toLowerCase());
  if (filtered.length === current.length) return false;
  saveMasterRemarks(filtered);
  return true;
}

/* ------------------- SEARCH & AUTOCOMPLETE HELPER ------------------- */

export function searchMasterEmployees(query: string, limit = 8): MasterEmployee[] {
  const q = query.trim().toLowerCase();
  const employees = getMasterEmployees();
  if (!q) {
    return employees.slice(0, limit);
  }

  // Exact starts-with gets highest priority, then contains
  return employees
    .filter((emp) => {
      const nameMatch = emp.name.toLowerCase().includes(q);
      const codeMatch = emp.employeeCode?.toLowerCase().includes(q);
      const deptMatch = emp.department.toLowerCase().includes(q);
      return nameMatch || codeMatch || deptMatch;
    })
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) || a.employeeCode?.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q) || b.employeeCode?.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

/* ------------------- GENERATE 500+ SAMPLE EMPLOYEES ------------------- */

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Amit', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepak',
  'Divya', 'Gaurav', 'Harish', 'Ishaan', 'Jaya', 'Karan', 'Kavita', 'Manish',
  'Meera', 'Mohit', 'Neha', 'Nikhil', 'Pankaj', 'Pooja', 'Pranav', 'Priya',
  'Rahul', 'Rajesh', 'Riya', 'Rohan', 'Rohit', 'Sanjay', 'Santosh', 'Shilpa',
  'Shivam', 'Sneha', 'Sunil', 'Suresh', 'Swati', 'Tanvi', 'Tarun', 'Varun',
  'Vikas', 'Vikram', 'Vinay', 'Yash', 'Anil', 'Ashok', 'Komal', 'Radha',
  'John', 'David', 'Sarah', 'Michael', 'Emily', 'Robert', 'Lisa', 'Daniel'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Iyer', 'Reddy',
  'Joshi', 'Nair', 'Kulkarni', 'Mehta', 'Rao', 'Shah', 'Chauhan', 'Agarwal',
  'Mishra', 'Pandey', 'Bhat', 'Deshmukh', 'Saxena', 'Bose', 'Mukherjee', 'Roy',
  'Pillai', 'Menon', 'Chatterjee', 'Das', 'Sen', 'Banerjee', 'Ghosh', 'Malhotra',
  'Bhardwaj', 'Kapoor', 'Khanna', 'Chopra', 'Bakshi', 'Sethi', 'Bhatia', 'Jain',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor'
];

const DEPARTMENT_ROLES: Record<string, { prefix: string; roles: string[] }> = {
  'Accounts & Finance': {
    prefix: 'ACC',
    roles: ['Chief Accountant', 'Senior Accountant', 'Staff Accountant', 'Accounts Executive', 'Ledger Clerk', 'Billing Officer'],
  },
  'Treasury / Vault': {
    prefix: 'TRS',
    roles: ['Treasury Manager', 'Vault Custodian', 'Treasury Officer', 'Currency Chest Assistant', 'Senior Cash Officer'],
  },
  'Retail & Sales Counter': {
    prefix: 'RTL',
    roles: ['Counter Supervisor', 'Lead Cashier', 'Retail Cashier', 'Point of Sale Operator', 'Senior Teller'],
  },
  'Front Desk & Cashier': {
    prefix: 'FDK',
    roles: ['Front Desk Executive', 'Reception Cashier', 'Front Office Supervisor', 'Guest Billing Clerk'],
  },
  'Billing & Collections': {
    prefix: 'BIL',
    roles: ['Collections Officer', 'Billing Specialist', 'Recovery Agent', 'Receivables Clerk', 'Credit Controller'],
  },
  'Operations & Logistics': {
    prefix: 'OPS',
    roles: ['Operations Supervisor', 'Dispatch Officer', 'Logistics Coordinator', 'Cash Transit Handler'],
  },
  'Internal Audit & Compliance': {
    prefix: 'AUD',
    roles: ['Senior Auditor', 'Internal Auditor', 'Audit Associate', 'Risk Analyst', 'Compliance Officer'],
  },
  'Admin & Petty Cash': {
    prefix: 'ADM',
    roles: ['Admin Officer', 'Petty Cash Custodian', 'Facility Coordinator', 'Office Administrator'],
  },
};

export function generate100SampleEmployees(count = 100): MasterEmployee[] {
  const departments = Object.keys(DEPARTMENT_ROLES);
  const result: MasterEmployee[] = [];
  let seq = 1001;

  for (let i = 0; i < count; i++) {
    const deptName = departments[i % departments.length];
    const deptConfig = DEPARTMENT_ROLES[deptName];
    const firstName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 11 + Math.floor(i / 13)) % LAST_NAMES.length];
    const role = deptConfig.roles[i % deptConfig.roles.length];
    const code = `${deptConfig.prefix}-${seq}`;

    result.push({
      id: `emp-seed-${seq}`,
      employeeCode: code,
      name: `${firstName} ${lastName}`,
      department: deptName,
      designation: role,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@enterprise.com`,
    });

    seq++;
  }

  return result;
}

export function generate500PlusSampleEmployees(count = 525): MasterEmployee[] {
  return generate100SampleEmployees(count);
}
