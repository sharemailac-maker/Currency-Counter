import * as XLSX from 'xlsx';
import { MasterEmployee } from '../types';
import { generate100SampleEmployees } from './employeeMaster';

export interface ExcelImportResult {
  employees: MasterEmployee[];
  newDepartments: string[];
  totalParsed: number;
  skipped: number;
  errors: string[];
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file array buffer into MasterEmployee records.
 */
export function parseEmployeeExcel(data: ArrayBuffer): ExcelImportResult {
  const result: ExcelImportResult = {
    employees: [],
    newDepartments: [],
    totalParsed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      result.errors.push('The uploaded Excel file contains no worksheets.');
      return result;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to JSON array of objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      result.errors.push('Worksheet appears to be empty. Please ensure data exists below the header row.');
      return result;
    }

    const seenDepartments = new Set<string>();

    rawRows.forEach((row, idx) => {
      // Find keys case-insensitively
      const keys = Object.keys(row);
      const findValue = (matchers: string[]): string => {
        for (const key of keys) {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const m of matchers) {
            if (cleanKey === m.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return String(row[key] ?? '').trim();
            }
          }
        }
        return '';
      };

      const name = findValue(['name', 'fullname', 'employeename', 'staffname', 'accountantname', 'personname']);
      const department = findValue(['department', 'dept', 'division', 'costcentre', 'costcenter', 'branch', 'section']) || 'General';
      const employeeCode = findValue(['employeeid', 'empid', 'id', 'code', 'staffid', 'empcode', 'badge', 'badgeid']);
      const designation = findValue(['designation', 'role', 'title', 'jobtitle', 'position']);
      const email = findValue(['email', 'mail', 'emailaddress']);
      const phone = findValue(['phone', 'mobile', 'contact', 'cell', 'tel']);

      if (!name) {
        result.skipped++;
        return;
      }

      const id = `emp-upload-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
      result.employees.push({
        id,
        name,
        department,
        employeeCode: employeeCode || undefined,
        designation: designation || undefined,
        email: email || undefined,
        phone: phone || undefined,
      });

      if (department) {
        seenDepartments.add(department);
      }
    });

    result.totalParsed = result.employees.length;
    result.newDepartments = Array.from(seenDepartments);

    if (result.totalParsed === 0) {
      result.errors.push(
        'No valid employee names could be recognized. Please check that your Excel file contains a "Name" or "Employee Name" column.'
      );
    }
  } catch (err: any) {
    result.errors.push(`Failed to parse Excel file: ${err?.message || 'Unknown format or corrupted file'}`);
  }

  return result;
}

/**
 * Generates and downloads a blank/sample Excel template for bulk import.
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Employee ID': 'EMP-1001',
      'Full Name': 'Rajesh Kumar',
      'Department': 'Accounts & Finance',
      'Designation': 'Senior Accountant',
      'Email': 'rajesh.kumar@company.com',
      'Phone': '+91 98765 43210',
    },
    {
      'Employee ID': 'EMP-1002',
      'Full Name': 'Priya Sharma',
      'Department': 'Treasury / Vault',
      'Designation': 'Treasury Officer',
      'Email': 'priya.sharma@company.com',
      'Phone': '+91 98765 43211',
    },
    {
      'Employee ID': 'EMP-1003',
      'Full Name': 'Amit Patel',
      'Department': 'Retail & Sales Counter',
      'Designation': 'Head Cashier',
      'Email': 'amit.patel@company.com',
      'Phone': '+91 98765 43212',
    },
    {
      'Employee ID': 'EMP-1004',
      'Full Name': 'Neha Gupta',
      'Department': 'Internal Audit & Compliance',
      'Designation': 'Internal Auditor',
      'Email': 'neha.gupta@company.com',
      'Phone': '+91 98765 43213',
    },
    {
      'Employee ID': 'EMP-1005',
      'Full Name': 'Vikram Singh',
      'Department': 'Front Desk & Cashier',
      'Designation': 'Front Desk Supervisor',
      'Email': 'vikram.singh@company.com',
      'Phone': '+91 98765 43214',
    },
    {
      'Employee ID': 'EMP-1006',
      'Full Name': 'Ananya Roy',
      'Department': 'Billing & Collections',
      'Designation': 'Billing Officer',
      'Email': 'ananya.roy@company.com',
      'Phone': '+91 98765 43215',
    },
    {
      'Employee ID': 'EMP-1007',
      'Full Name': 'Sunil Verma',
      'Department': 'Operations & Logistics',
      'Designation': 'Cash Handler',
      'Email': 'sunil.verma@company.com',
      'Phone': '+91 98765 43216',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Employee ID
    { wch: 22 }, // Full Name
    { wch: 28 }, // Department
    { wch: 24 }, // Designation
    { wch: 28 }, // Email
    { wch: 18 }, // Phone
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff_Directory');

  XLSX.writeFile(workbook, 'Sample_Employee_Master_Template.xlsx');
}

/**
 * Generates and downloads a clean 100 employees Excel sheet ready for immediate import testing.
 */
export function download100SampleEmployeesExcel(): void {
  const sampleEmployees = generate100SampleEmployees(100);
  const rows = sampleEmployees.map((emp) => ({
    'Employee ID': emp.employeeCode || '',
    'Full Name': emp.name,
    'Department': emp.department,
    'Designation': emp.designation || '',
    'Email': emp.email || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 26 },
    { wch: 32 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_Staff_100');

  XLSX.writeFile(workbook, 'Master_100_Employees_Roster_Sample.xlsx');
}

// Keep alias for backwards compatibility
export const download500SampleEmployeesExcel = download100SampleEmployeesExcel;

/**
 * Exports current master employees to Excel (.xlsx).
 */
export function exportMasterEmployeesToExcel(employees: MasterEmployee[]): void {
  const rows = employees.map((emp) => ({
    'Employee ID': emp.employeeCode || '',
    'Full Name': emp.name,
    'Department': emp.department,
    'Designation': emp.designation || '',
    'Email': emp.email || '',
    'Phone': emp.phone || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 26 },
    { wch: 30 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  XLSX.writeFile(workbook, `Master_Employees_${new Date().toISOString().split('T')[0]}.xlsx`);
}
