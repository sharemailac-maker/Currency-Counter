import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookmarkCheck,
  History,
  User,
  Building2,
  MessageSquareText,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { CountryCurrency, MasterEmployee } from '../types';
import { formatCurrencyAmount } from '../utils/formatters';
import {
  getRememberedRemarks,
  saveRememberedRemark,
  deleteRememberedRemark,
  getAutoRememberPreference,
  setAutoRememberPreference,
  saveRememberedEmployee,
  saveRememberedDepartment,
  STORAGE_KEY_LAST_EMPLOYEE,
  STORAGE_KEY_LAST_DEPT,
} from '../utils/tallyMetadata';
import {
  getMasterEmployees,
  getMasterDepartments,
  getMasterRemarks,
  searchMasterEmployees,
} from '../utils/employeeMaster';
import { getCompanyMode } from '../utils/companyMode';

export interface SaveTallyFormData {
  title: string;
  remark?: string;
  employeeName?: string;
  department?: string;
}

interface SaveTallyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryCurrency;
  totalAmount: number;
  totalPieces: number;
  onConfirmSave: (data: SaveTallyFormData) => void;
  companyModeEnabled?: boolean;
}

export const SaveTallyDialog: React.FC<SaveTallyDialogProps> = ({
  isOpen,
  onClose,
  country,
  totalAmount,
  totalPieces,
  onConfirmSave,
  companyModeEnabled,
}) => {
  const isCompanyMode = companyModeEnabled !== undefined ? companyModeEnabled : getCompanyMode();
  const defaultTitle = `Cash Count - ${new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} (${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})`;

  const [title, setTitle] = useState(defaultTitle);
  const [remark, setRemark] = useState('');
  const [autoRememberRemark, setAutoRememberRemark] = useState(getAutoRememberPreference);
  const [rememberedRemarks, setRememberedRemarks] = useState<string[]>([]);
  const [masterDepartments, setMasterDepartments] = useState<string[]>([]);

  // Employee & Department state
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<MasterEmployee | null>(null);

  // Auto-populate / Typeahead state for 500+ employees
  const [employeeSuggestions, setEmployeeSuggestions] = useState<MasterEmployee[]>([]);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const employeeInputContainerRef = useRef<HTMLDivElement>(null);

  const [showAllRemarks, setShowAllRemarks] = useState(false);

  // Load remembered metadata when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(
        `Cash Count - ${new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })} (${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})`
      );
      // Combine master remarks with remembered
      const allRemarks = Array.from(new Set([...getRememberedRemarks(), ...getMasterRemarks()]));
      setRememberedRemarks(allRemarks);
      setMasterDepartments(getMasterDepartments());
      setAutoRememberRemark(getAutoRememberPreference());

      // Pre-fill last employee and department if available
      const lastEmp = localStorage.getItem(STORAGE_KEY_LAST_EMPLOYEE) || '';
      const lastDept = localStorage.getItem(STORAGE_KEY_LAST_DEPT) || '';
      if (!employeeName && lastEmp) setEmployeeName(lastEmp);
      if (!department && lastDept) setDepartment(lastDept);

      setIsEmployeeDropdownOpen(false);
      setSelectedStaff(null);
    }
  }, [isOpen]);

  // Handle outside click for employee dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeInputContainerRef.current &&
        !employeeInputContainerRef.current.contains(event.target as Node)
      ) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update employee suggestions on type
  const handleEmployeeInputChange = (val: string) => {
    setEmployeeName(val);
    setSelectedStaff(null);
    if (val.trim().length >= 1) {
      const results = searchMasterEmployees(val, 8);
      setEmployeeSuggestions(results);
      setIsEmployeeDropdownOpen(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setEmployeeSuggestions([]);
      setIsEmployeeDropdownOpen(false);
    }
  };

  // Select an employee from autocomplete -> AUTO POPULATES DEPARTMENT
  const handleSelectStaff = (staff: MasterEmployee) => {
    setEmployeeName(staff.name);
    setDepartment(staff.department); // Auto-populate department!
    setSelectedStaff(staff);
    setIsEmployeeDropdownOpen(false);
  };

  // Keyboard navigation for dropdown
  const handleEmployeeKeyDown = (e: React.KeyboardEvent) => {
    if (!isEmployeeDropdownOpen || employeeSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < employeeSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : employeeSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < employeeSuggestions.length) {
        e.preventDefault();
        handleSelectStaff(employeeSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsEmployeeDropdownOpen(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim() || defaultTitle;
    const cleanRemark = remark.trim();
    const cleanEmployee = isCompanyMode ? employeeName.trim() : '';
    const cleanDept = isCompanyMode ? department.trim() : '';

    // Auto-remember remark if option is checked
    if (cleanRemark && autoRememberRemark) {
      saveRememberedRemark(cleanRemark);
    }

    // Auto-remember employee and department only in company mode
    if (isCompanyMode) {
      if (cleanEmployee) {
        saveRememberedEmployee(cleanEmployee);
      }
      if (cleanDept) {
        saveRememberedDepartment(cleanDept);
      }
    }

    setAutoRememberPreference(autoRememberRemark);

    onConfirmSave({
      title: cleanTitle,
      remark: cleanRemark || undefined,
      employeeName: isCompanyMode && cleanEmployee ? cleanEmployee : undefined,
      department: isCompanyMode && cleanDept ? cleanDept : undefined,
    });
    onClose();
  };

  const handleSelectRemark = (selected: string) => {
    setRemark(selected);
  };

  const handleDeleteRemarkItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    deleteRememberedRemark(item);
    setRememberedRemarks((prev) => prev.filter((r) => r !== item));
  };

  const displayedRemarks = showAllRemarks ? rememberedRemarks : rememberedRemarks.slice(0, 6);

  // Quick initial suggestions for employees
  const quickStaffPicks = getMasterEmployees().slice(0, 4);

  return (
    <div
      id="modal-save-tally-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-save-tally-content"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Save Cash Tally
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isCompanyMode
                  ? 'Record for company ledger, departmental audit & report'
                  : 'Save cash count with narration to your history ledger'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-save-dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-400 block text-[11px] font-medium">Counted Total</span>
              <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                {formatCurrencyAmount(totalAmount, country, true)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-400 block text-[11px] font-medium">Pieces / Currency</span>
              <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                {totalPieces} pcs • {country.currencyCode}
              </span>
            </div>
          </div>

          {/* Title / Reference */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Title / Reference
            </label>
            <input
              id="input-save-tally-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Cash Register Closing"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/90 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Remarks & Auto-Remember Feature */}
          <div className="space-y-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <MessageSquareText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Remarks & Narration</span>
              </label>

              {/* Auto-Remember Option */}
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-600 dark:text-stone-300 select-none hover:text-amber-600 dark:hover:text-amber-400 transition">
                <input
                  id="checkbox-auto-remember-remark"
                  type="checkbox"
                  checked={autoRememberRemark}
                  onChange={(e) => setAutoRememberRemark(e.target.checked)}
                  className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="font-semibold">Auto-remember remark</span>
              </label>
            </div>

            <textarea
              id="input-save-tally-remark"
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add accounting narration (e.g. EOD Till Balance, Vault Drop, Petty Cash Reconciled...)"
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />

            {/* Quick-Pick Remembered Remarks Chips */}
            {rememberedRemarks.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <History className="w-3 h-3 text-amber-500" />
                    <span>Quick-Pick Remarks:</span>
                  </span>
                  {rememberedRemarks.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllRemarks(!showAllRemarks)}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {showAllRemarks ? 'Show Less' : `View All (${rememberedRemarks.length})`}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {displayedRemarks.map((item) => {
                    const isSelected = remark.trim() === item.trim();
                    return (
                      <span
                        key={item}
                        onClick={() => handleSelectRemark(item)}
                        className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500'
                        }`}
                        title="Click to use this remark"
                      >
                        <span className="truncate max-w-[200px]">{item}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRemarkItem(e, item)}
                          className="opacity-40 group-hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition"
                          title="Remove from remembered list"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Multi-Employee & Department Attribution with Auto-Populate (Only in Company/Firm Mode) */}
          {isCompanyMode && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Accountant & Department Attribution</span>
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  Type 2 letters to auto-populate from staff directory
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accounting Employee with Instant Smart Typeahead */}
                <div className="relative" ref={employeeInputContainerRef}>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between mb-1">
                    <span>Accountant / Staff Name</span>
                    {selectedStaff && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Auto-linked</span>
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      id="input-save-tally-employee"
                      type="text"
                      autoComplete="off"
                      value={employeeName}
                      onChange={(e) => handleEmployeeInputChange(e.target.value)}
                      onKeyDown={handleEmployeeKeyDown}
                      onFocus={() => {
                        if (employeeName.trim().length >= 1) {
                          const res = searchMasterEmployees(employeeName, 8);
                          setEmployeeSuggestions(res);
                          setIsEmployeeDropdownOpen(res.length > 0);
                        }
                      }}
                      placeholder="Enter letters (e.g. Raj, 102, Priya)..."
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/90 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    {employeeName && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmployeeName('');
                          setSelectedStaff(null);
                          setIsEmployeeDropdownOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Instant Suggestions Dropdown from Staff Directory */}
                  {isEmployeeDropdownOpen && employeeSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-blue-300 dark:border-blue-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-[10px] text-blue-700 dark:text-blue-300 font-semibold px-2 flex items-center justify-between">
                        <span>Matches in Master Directory</span>
                        <span>Click to Auto-Populate</span>
                      </div>

                      {employeeSuggestions.map((staff, idx) => (
                        <div
                          key={staff.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectStaff(staff);
                          }}
                          className={`p-2 cursor-pointer transition flex items-center justify-between text-xs ${
                            highlightedIndex === idx
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                              : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.employeeCode && (
                                <span className="font-mono text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
                                  {staff.employeeCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">
                              {staff.designation || 'Staff Accountant'}
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 ml-2">
                            {staff.department}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Staff Suggestion Chips */}
                  {!selectedStaff && quickStaffPicks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {quickStaffPicks.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelectStaff(emp)}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 truncate max-w-[130px] cursor-pointer"
                          title={`Click to set ${emp.name} & ${emp.department}`}
                        >
                          {emp.name.split(' ')[0]} ({emp.department.split(' ')[0]})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Department / Cost Center */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Department</span>
                  </label>
                  <input
                    id="input-save-tally-department"
                    type="text"
                    list="list-master-departments"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Accounts & Finance"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/90 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="list-master-departments">
                    {masterDepartments.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>

                  {/* Quick department chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {masterDepartments.slice(0, 3).map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setDepartment(dept)}
                        className="px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 truncate max-w-[130px] cursor-pointer"
                      >
                        {dept.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-save-tally"
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Save & Record Tally</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
