import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MasterEmployee } from '../types';
import {
  getMasterEmployees,
  saveMasterEmployees,
  addMasterEmployee,
  updateMasterEmployee,
  deleteMasterEmployee,
  deleteMultipleMasterEmployees,
  clearAllMasterEmployees,
  getMasterDepartments,
  saveMasterDepartments,
  addMasterDepartment,
  updateMasterDepartment,
  deleteMasterDepartment,
  deleteMultipleMasterDepartments,
  getMasterRemarks,
  saveMasterRemarks,
  addMasterRemark,
  updateMasterRemark,
  deleteMasterRemark,
  generate100SampleEmployees,
} from '../utils/employeeMaster';
import {
  parseEmployeeExcel,
  downloadSampleExcelTemplate,
  download100SampleEmployeesExcel,
  exportMasterEmployeesToExcel,
  ExcelImportResult,
} from '../utils/excelMaster';
import { getCompanyMode, setCompanyMode } from '../utils/companyMode';
import {
  Users,
  Building2,
  MessageSquareText,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AccountingMasterManagerProps {
  companyModeEnabled?: boolean;
  onToggleCompanyMode?: (enabled: boolean) => void;
  onDataChanged?: () => void;
}

type TabType = 'employees' | 'departments' | 'remarks';

export const AccountingMasterManager: React.FC<AccountingMasterManagerProps> = ({
  companyModeEnabled: controlledCompanyMode,
  onToggleCompanyMode,
  onDataChanged,
}) => {
  // Company Mode toggle state
  const [internalCompanyMode, setInternalCompanyMode] = useState<boolean>(getCompanyMode);
  const isCompanyMode = controlledCompanyMode !== undefined ? controlledCompanyMode : internalCompanyMode;

  // Dropdown expansion state for "v" drop-down
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleToggleMode = (newValue: boolean) => {
    setInternalCompanyMode(newValue);
    setCompanyMode(newValue);
    onToggleCompanyMode?.(newValue);
    showNotification(
      newValue
        ? 'Company/Firm Set-up Enabled: Staff directory, departments, and financial analysis unlocked!'
        : 'Company/Firm Set-up Disabled: App returned to streamlined individual counter mode.'
    );
  };

  const [activeTab, setActiveTab] = useState<TabType>('employees');

  // Master Data States
  const [employees, setEmployees] = useState<MasterEmployee[]>(() => getMasterEmployees());
  const [departments, setDepartments] = useState<string[]>(() => getMasterDepartments());
  const [remarks, setRemarks] = useState<string[]>(() => getMasterRemarks());

  // Search & Filters for Employees
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Multi-Selection State for Employees
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  // Multi-Selection State for Departments
  const [selectedDepartmentNames, setSelectedDepartmentNames] = useState<Set<string>>(new Set());

  // Add / Edit Employee Modal State
  const [employeeModal, setEmployeeModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    empId?: string;
    name: string;
    employeeCode: string;
    department: string;
    designation: string;
  }>({
    isOpen: false,
    mode: 'add',
    name: '',
    employeeCode: '',
    department: '',
    designation: '',
  });

  // Department Add / Edit State
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<{ oldName: string; newName: string } | null>(null);

  // Remark Add / Edit State
  const [newRemarkText, setNewRemarkText] = useState('');
  const [editingRemark, setEditingRemark] = useState<{ oldText: string; newText: string } | null>(null);

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelUploadPreview, setExcelUploadPreview] = useState<{
    isOpen: boolean;
    fileName: string;
    result: ExcelImportResult | null;
    replaceMode: boolean;
  }>({
    isOpen: false,
    fileName: '',
    result: null,
    replaceMode: false,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
      if (!matchesDept) return false;
      if (!q) return true;
      const nameMatch = emp.name.toLowerCase().includes(q);
      const codeMatch = emp.employeeCode?.toLowerCase().includes(q);
      const deptMatch = emp.department.toLowerCase().includes(q);
      const desigMatch = emp.designation?.toLowerCase().includes(q);
      return nameMatch || codeMatch || deptMatch || desigMatch;
    });
  }, [employees, searchQuery, filterDepartment]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Handle Multi-Selection Checkbox for Employees
  const handleToggleSelectEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllPageEmployees = () => {
    const pageIds = paginatedEmployees.map((e) => e.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedEmployeeIds.has(id));

    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Delete Selected Employees (Multiple Selection)
  const handleDeleteSelectedEmployees = () => {
    const count = selectedEmployeeIds.size;
    if (count === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${count} selected employee${count > 1 ? 's' : ''}? This makes cleaning sample data quick and easy.`
      )
    ) {
      const removed = deleteMultipleMasterEmployees(Array.from(selectedEmployeeIds));
      setEmployees(getMasterEmployees());
      setSelectedEmployeeIds(new Set());
      showNotification(`Deleted ${removed} employee${removed > 1 ? 's' : ''} from directory.`);
      onDataChanged?.();
    }
  };

  // Handle Multi-Selection for Departments
  const handleToggleSelectDepartment = (deptName: string) => {
    setSelectedDepartmentNames((prev) => {
      const next = new Set(prev);
      if (next.has(deptName)) {
        next.delete(deptName);
      } else {
        next.add(deptName);
      }
      return next;
    });
  };

  const handleDeleteSelectedDepartments = () => {
    const count = selectedDepartmentNames.size;
    if (count === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${count} selected department${count > 1 ? 's' : ''}?`
      )
    ) {
      const removed = deleteMultipleMasterDepartments(Array.from(selectedDepartmentNames));
      setDepartments(getMasterDepartments());
      setSelectedDepartmentNames(new Set());
      showNotification(`Deleted ${removed} department${removed > 1 ? 's' : ''}.`);
      onDataChanged?.();
    }
  };

  // Handle Employee Form Submit
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeModal.name.trim()) {
      showNotification('Please enter the employee name', 'error');
      return;
    }
    const dept = employeeModal.department.trim() || departments[0] || 'Accounts & Finance';

    if (employeeModal.mode === 'add') {
      const added = addMasterEmployee({
        name: employeeModal.name,
        employeeCode: employeeModal.employeeCode || undefined,
        department: dept,
        designation: employeeModal.designation || undefined,
      });
      setEmployees(getMasterEmployees());
      setDepartments(getMasterDepartments());
      showNotification(`Added "${added.name}" to ${added.department}!`);
    } else if (employeeModal.empId) {
      updateMasterEmployee(employeeModal.empId, {
        name: employeeModal.name,
        employeeCode: employeeModal.employeeCode || undefined,
        department: dept,
        designation: employeeModal.designation || undefined,
      });
      setEmployees(getMasterEmployees());
      setDepartments(getMasterDepartments());
      showNotification(`Updated details for "${employeeModal.name}"!`);
    }

    setEmployeeModal((prev) => ({ ...prev, isOpen: false }));
    onDataChanged?.();
  };

  // Handle Delete Individual Employee
  const handleDeleteEmployee = (emp: MasterEmployee) => {
    if (window.confirm(`Are you sure you want to remove ${emp.name} (${emp.department}) from the staff directory?`)) {
      deleteMasterEmployee(emp.id);
      setEmployees(getMasterEmployees());
      setSelectedEmployeeIds((prev) => {
        const next = new Set(prev);
        next.delete(emp.id);
        return next;
      });
      showNotification(`Deleted ${emp.name} from directory.`);
      onDataChanged?.();
    }
  };

  // Load 100 Sample Staff Roster (as requested: 100 employees only)
  const handleLoad100Sample = () => {
    if (
      window.confirm(
        'Load 100 realistic sample accounting staff across multiple departments? You can easily clean or delete them anytime using the multiple selection checkboxes.'
      )
    ) {
      const samples = generate100SampleEmployees(100);
      saveMasterEmployees(samples);
      setEmployees(samples);

      // Ensure departments are registered
      const depts = Array.from(new Set(samples.map((s) => s.department)));
      depts.forEach((d) => addMasterDepartment(d));
      setDepartments(getMasterDepartments());

      setSelectedEmployeeIds(new Set());
      setCurrentPage(1);
      showNotification(`Successfully loaded 100 sample employees across ${depts.length} departments!`);
      onDataChanged?.();
    }
  };

  // Handle Excel Upload Trigger
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parseResult = parseEmployeeExcel(arrayBuffer);

      setExcelUploadPreview({
        isOpen: true,
        fileName: file.name,
        result: parseResult,
        replaceMode: false,
      });
    } catch (err: any) {
      showNotification(`Failed to read file: ${err?.message || 'Invalid format'}`, 'error');
    }
    e.target.value = '';
  };

  // Confirm Excel Import
  const handleConfirmExcelImport = () => {
    if (!excelUploadPreview.result || excelUploadPreview.result.employees.length === 0) return;

    const imported = excelUploadPreview.result.employees;
    let finalEmployees: MasterEmployee[];

    if (excelUploadPreview.replaceMode) {
      finalEmployees = imported;
    } else {
      // Merge with existing
      const existing = getMasterEmployees();
      const existingKeys = new Set(existing.map((e) => `${e.name.toLowerCase()}_${e.department.toLowerCase()}`));
      const nonDuplicates = imported.filter(
        (i) => !existingKeys.has(`${i.name.toLowerCase()}_${i.department.toLowerCase()}`)
      );
      finalEmployees = [...existing, ...nonDuplicates];
    }

    saveMasterEmployees(finalEmployees);
    setEmployees(finalEmployees);

    excelUploadPreview.result.newDepartments.forEach((d) => addMasterDepartment(d));
    setDepartments(getMasterDepartments());

    setExcelUploadPreview((prev) => ({ ...prev, isOpen: false }));
    showNotification(`Successfully imported ${imported.length} employees into directory!`);
    setCurrentPage(1);
    onDataChanged?.();
  };

  // Department Operations
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const ok = addMasterDepartment(newDeptName);
    if (ok) {
      setDepartments(getMasterDepartments());
      setNewDeptName('');
      showNotification(`Added department "${newDeptName.trim()}"`);
      onDataChanged?.();
    } else {
      showNotification('Department name already exists', 'error');
    }
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.newName.trim()) return;
    const ok = updateMasterDepartment(editingDept.oldName, editingDept.newName);
    if (ok) {
      setDepartments(getMasterDepartments());
      setEmployees(getMasterEmployees());
      setEditingDept(null);
      showNotification(`Updated department to "${editingDept.newName.trim()}"`);
      onDataChanged?.();
    }
  };

  const handleDeleteDept = (dept: string) => {
    const count = employees.filter((e) => e.department === dept).length;
    const promptMsg =
      count > 0
        ? `Department "${dept}" has ${count} assigned employees. Deleting this will remove the department from the master list. Proceed?`
        : `Delete department "${dept}"?`;

    if (window.confirm(promptMsg)) {
      deleteMasterDepartment(dept);
      setDepartments(getMasterDepartments());
      setSelectedDepartmentNames((prev) => {
        const next = new Set(prev);
        next.delete(dept);
        return next;
      });
      showNotification(`Removed department "${dept}"`);
      onDataChanged?.();
    }
  };

  // Remark Operations
  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;
    const ok = addMasterRemark(newRemarkText);
    if (ok) {
      setRemarks(getMasterRemarks());
      setNewRemarkText('');
      showNotification('Added new accounting narration / remark.');
      onDataChanged?.();
    } else {
      showNotification('This remark already exists', 'error');
    }
  };

  const handleUpdateRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemark || !editingRemark.newText.trim()) return;
    const ok = updateMasterRemark(editingRemark.oldText, editingRemark.newText);
    if (ok) {
      setRemarks(getMasterRemarks());
      setEditingRemark(null);
      showNotification('Updated remark successfully.');
      onDataChanged?.();
    }
  };

  const handleDeleteRemark = (text: string) => {
    if (window.confirm(`Delete remark "${text}"?`)) {
      deleteMasterRemark(text);
      setRemarks(getMasterRemarks());
      showNotification('Remark removed.');
      onDataChanged?.();
    }
  };

  const allCurrentPageSelected =
    paginatedEmployees.length > 0 &&
    paginatedEmployees.every((emp) => selectedEmployeeIds.has(emp.id));

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Title Company/firm set-up with two lined narration and "v" drop-down */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              Company/Firm Set-up
            </h2>
            {isCompanyMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 space-y-0.5 leading-tight">
            <p>Multi-department staff directory, Excel master roster, and bulk staff management.</p>
            <p>Department-level financial tracking, employee cash tallies, and audit analysis.</p>
          </div>
        </div>

        {/* "v" Drop-down toggle after title & narration */}
        <button
          type="button"
          id="btn-company-setup-dropdown"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80"
          aria-expanded={isDropdownOpen}
          title={isDropdownOpen ? 'Collapse Company/Firm Set-up' : 'Expand Company/Firm Set-up'}
        >
          <span className="text-xs font-semibold hidden sm:inline">
            {isDropdownOpen ? 'Hide' : 'Configure'}
          </span>
          {isDropdownOpen ? (
            <ChevronUp className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          )}
        </button>
      </div>

      {/* Hidden inside "v" drop-down */}
      {isDropdownOpen && (
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in duration-200">
          {/* Individual and firm set-up switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
            <div>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                {isCompanyMode ? 'Company / Firm Mode Active' : 'Individual Counting Mode'}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                {isCompanyMode
                  ? 'Multi-department staff directory, Excel roster, and financial analysis are unlocked'
                  : 'Toggle switch to enable multi-department employee roster and financial analysis'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {isCompanyMode ? 'Firm Mode' : 'Individual'}
              </span>
              <button
                type="button"
                id="toggle-company-mode"
                onClick={() => handleToggleMode(!isCompanyMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isCompanyMode ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={isCompanyMode}
                title={isCompanyMode ? 'Switch to Individual Mode' : 'Switch to Firm/Company Mode'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isCompanyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* When enabled: Full Management Options for 500+ capacity, 100 sample template, bulk delete */}
          {isCompanyMode && (
            <div className="space-y-4 animate-in fade-in duration-200">
          {/* Tab navigation */}
          <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 self-start sm:self-auto overflow-x-auto">
            <button
              id="tab-btn-master-employees"
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Employees ({employees.length})</span>
            </button>

            <button
              id="tab-btn-master-departments"
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Departments ({departments.length})</span>
            </button>

            <button
              id="tab-btn-master-remarks"
              onClick={() => setActiveTab('remarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'remarks'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-amber-500" />
              <span>Remarks ({remarks.length})</span>
            </button>
          </div>

          {/* ======================= TAB 1: EMPLOYEES ======================= */}
          {activeTab === 'employees' && (
            <div className="space-y-3">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Search and Department Filter */}
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search staff by name, ID (e.g. EMP-101), role..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={filterDepartment}
                    onChange={(e) => {
                      setFilterDepartment(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="ALL">All Depts ({departments.length})</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toolbar Buttons: Add, Upload Excel, 100 Sample Template, Load 100 Sample */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    id="btn-master-add-employee"
                    onClick={() =>
                      setEmployeeModal({
                        isOpen: true,
                        mode: 'add',
                        name: '',
                        employeeCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                        department: departments[0] || 'Accounts & Finance',
                        designation: '',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Staff</span>
                  </button>

                  {/* Upload Master Excel */}
                  <button
                    id="btn-master-upload-excel"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                    title="Upload master Excel spreadsheet with 500+ employees capacity"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Excel</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelFileSelect}
                    className="hidden"
                  />

                  {/* Sample Template of 100 employees only */}
                  <button
                    id="btn-master-sample-template"
                    onClick={downloadSampleExcelTemplate}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Download blank sample Excel template with 100 staff format"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100-Staff Template</span>
                  </button>

                  {/* Load 100 Sample Staff (Sample template of 100 employees) */}
                  <button
                    id="btn-master-load-100-sample"
                    onClick={handleLoad100Sample}
                    className="px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Load 100 realistic sample employees across departments for fast testing"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Load 100 Sample</span>
                  </button>

                  {/* Download 100 sample file */}
                  <button
                    onClick={download100SampleEmployeesExcel}
                    className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
                    title="Download 100 Sample Spreadsheet (.xlsx) to inspect or modify"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Export current list to Excel */}
                  <button
                    onClick={() => exportMasterEmployeesToExcel(employees)}
                    className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
                    title="Export current staff directory to Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Multiple Selection Action Bar for Easy Cleaning */}
              {selectedEmployeeIds.size > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                    <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {selectedEmployeeIds.size} staff member{selectedEmployeeIds.size > 1 ? 's' : ''} selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEmployeeIds(new Set())}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <button
                      id="btn-delete-selected-employees"
                      onClick={handleDeleteSelectedEmployees}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                      title="Delete all checked employees"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedEmployeeIds.size})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Stats Bar */}
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-950/40 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800">
                <span>
                  Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> staff
                  {filterDepartment !== 'ALL' && ` in "${filterDepartment}"`}
                </span>
                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
              </div>

              {/* Employee Table with Multi-Select Checkboxes */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        {/* Select All Checkbox */}
                        <th className="py-2.5 px-3 w-8">
                          <button
                            type="button"
                            onClick={handleToggleSelectAllPageEmployees}
                            className="text-stone-500 hover:text-indigo-600 transition cursor-pointer"
                            title={allCurrentPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                          >
                            {allCurrentPageSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3">Emp ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Designation / Role</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {paginatedEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-stone-400">
                            <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
                            <p className="font-semibold">No employees match this search.</p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setFilterDepartment('ALL');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1"
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedEmployees.map((emp) => {
                          const isSelected = selectedEmployeeIds.has(emp.id);

                          return (
                            <tr
                              key={emp.id}
                              className={`transition ${
                                isSelected
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                              }`}
                            >
                              {/* Row Checkbox */}
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectEmployee(emp.id)}
                                  className="text-stone-400 hover:text-indigo-600 transition cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold text-stone-600 dark:text-stone-400">
                                {emp.employeeCode || '—'}
                              </td>
                              <td className="py-2 px-3 font-bold text-stone-900 dark:text-white">
                                {emp.name}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                                  {emp.department}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-stone-600 dark:text-stone-300">
                                {emp.designation || 'Staff Accountant'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      setEmployeeModal({
                                        isOpen: true,
                                        mode: 'edit',
                                        empId: emp.id,
                                        name: emp.name,
                                        employeeCode: emp.employeeCode || '',
                                        department: emp.department,
                                        designation: emp.designation || '',
                                      })
                                    }
                                    className="p-1 rounded text-stone-400 hover:text-blue-600 transition"
                                    title="Modify Employee"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(emp)}
                                    className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                                    title="Delete Employee"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-2.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 flex items-center justify-between text-xs">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 disabled:opacity-30 flex items-center gap-1 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + idx;
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 disabled:opacity-30 flex items-center gap-1 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB 2: DEPARTMENTS ======================= */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              {/* Add department form */}
              <form onSubmit={handleAddDepartment} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Add new department (e.g. Audit & Risk, Cash Transit, Branch-02)..."
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Department</span>
                </button>
              </form>

              {/* Department Multi-Delete Action Bar */}
              {selectedDepartmentNames.size > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    {selectedDepartmentNames.size} department{selectedDepartmentNames.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDepartmentNames(new Set())}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleDeleteSelectedDepartments}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedDepartmentNames.size})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Department list with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {departments.map((dept) => {
                  const staffCount = employees.filter((e) => e.department.toLowerCase() === dept.toLowerCase()).length;
                  const isEditing = editingDept?.oldName === dept;
                  const isChecked = selectedDepartmentNames.has(dept);

                  return (
                    <div
                      key={dept}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                        isChecked
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/70'
                      }`}
                    >
                      {isEditing ? (
                        <form onSubmit={handleUpdateDepartment} className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingDept.newName}
                            onChange={(e) => setEditingDept({ ...editingDept, newName: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 rounded border border-blue-500 text-stone-900 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDept(null)}
                            className="px-1.5 py-1 text-stone-400 hover:text-stone-600 text-xs"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectDepartment(dept)}
                              className="text-stone-400 hover:text-indigo-600 cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-stone-900 dark:text-white">{dept}</div>
                              <div className="text-[10px] text-stone-500 dark:text-stone-400">
                                {staffCount} assigned {staffCount === 1 ? 'staff member' : 'staff members'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingDept({ oldName: dept, newName: dept })}
                              className="p-1 rounded text-stone-400 hover:text-blue-600 transition"
                              title="Rename Department"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept)}
                              className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB 3: REMARKS & NARRATIONS ======================= */}
          {activeTab === 'remarks' && (
            <div className="space-y-4">
              {/* Add Remark Form */}
              <form onSubmit={handleAddRemark} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRemarkText}
                  onChange={(e) => setNewRemarkText(e.target.value)}
                  placeholder="Add accounting narration (e.g. Bank Deposit Slip, Vault Clearance, Night Audit)..."
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Remark</span>
                </button>
              </form>

              {/* Remarks List */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
                {remarks.map((item) => {
                  const isEditing = editingRemark?.oldText === item;

                  return (
                    <div key={item} className="p-3 flex items-center justify-between gap-2 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                      {isEditing ? (
                        <form onSubmit={handleUpdateRemark} className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingRemark.newText}
                            onChange={(e) => setEditingRemark({ ...editingRemark, newText: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 rounded border border-amber-500 text-stone-900 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-amber-600 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRemark(null)}
                            className="px-1.5 py-1 text-stone-400 hover:text-stone-600 text-xs"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <MessageSquareText className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                              {item}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingRemark({ oldText: item, newText: item })}
                              className="p-1 rounded text-stone-400 hover:text-amber-600 transition"
                              title="Edit Remark"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRemark(item)}
                              className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                              title="Delete Remark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {/* ======================= ADD / EDIT EMPLOYEE MODAL ======================= */}
      {employeeModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEmployeeModal((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>{employeeModal.mode === 'add' ? 'Add New Staff Member' : 'Modify Staff Details'}</span>
              </h3>
              <button
                onClick={() => setEmployeeModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeModal.name}
                  onChange={(e) => setEmployeeModal({ ...employeeModal, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Employee Code / Badge
                  </label>
                  <input
                    type="text"
                    value={employeeModal.employeeCode}
                    onChange={(e) => setEmployeeModal({ ...employeeModal, employeeCode: e.target.value })}
                    placeholder="e.g. ACC-101"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={employeeModal.designation}
                    onChange={(e) => setEmployeeModal({ ...employeeModal, designation: e.target.value })}
                    placeholder="e.g. Senior Cashier"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="modal-dept-list"
                  required
                  value={employeeModal.department}
                  onChange={(e) => setEmployeeModal({ ...employeeModal, department: e.target.value })}
                  placeholder="Select or enter department..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
                <datalist id="modal-dept-list">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEmployeeModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  {employeeModal.mode === 'add' ? 'Add to Master' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= EXCEL IMPORT PREVIEW MODAL ======================= */}
      {excelUploadPreview.isOpen && excelUploadPreview.result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExcelUploadPreview((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[88vh] overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Master Excel Spreadsheet Preview
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {excelUploadPreview.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExcelUploadPreview((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">
                    Employees Found
                  </span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                    {excelUploadPreview.result.totalParsed}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 block font-semibold">
                    Departments
                  </span>
                  <span className="text-lg font-black text-blue-800 dark:text-blue-300">
                    {excelUploadPreview.result.newDepartments.length}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center">
                  <span className="text-[10px] text-stone-500 block font-semibold">
                    Skipped Rows
                  </span>
                  <span className="text-lg font-black text-stone-700 dark:text-stone-300">
                    {excelUploadPreview.result.skipped}
                  </span>
                </div>
              </div>

              {/* Errors if any */}
              {excelUploadPreview.result.errors.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-[11px] space-y-1">
                  {excelUploadPreview.result.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Rows Preview */}
              <div>
                <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Preview first 5 recognized entries:
                </span>
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                  {excelUploadPreview.result.employees.slice(0, 5).map((emp, i) => (
                    <div key={i} className="p-2 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-stone-900 dark:text-white">{emp.name}</span>
                        {emp.employeeCode && (
                          <span className="text-stone-400 ml-1.5 font-mono">({emp.employeeCode})</span>
                        )}
                        <span className="block text-[10px] text-stone-500">{emp.designation || 'Staff'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-semibold">
                        {emp.department}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Options */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                  <input
                    type="checkbox"
                    checked={excelUploadPreview.replaceMode}
                    onChange={(e) =>
                      setExcelUploadPreview({ ...excelUploadPreview, replaceMode: e.target.checked })
                    }
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block">
                      Replace all existing staff with this Excel sheet
                    </span>
                    <span className="text-[10px] text-stone-500">
                      If unchecked, rows will be merged and existing employees will be preserved.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setExcelUploadPreview((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={excelUploadPreview.result.employees.length === 0}
                onClick={handleConfirmExcelImport}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Import ({excelUploadPreview.result.totalParsed} Staff)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
