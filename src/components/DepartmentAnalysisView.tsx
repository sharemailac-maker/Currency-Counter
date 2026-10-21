import React, { useState, useMemo } from 'react';
import { SavedTally, DepartmentFinancialSummary } from '../types';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Filter, 
  PieChart, 
  ArrowUpDown, 
  CheckCircle2, 
  Coins, 
  Sparkles,
  Search,
  Layers,
  Clock
} from 'lucide-react';
import { formatCurrencyAmount } from '../utils/formatters';

interface DepartmentAnalysisViewProps {
  tallies: SavedTally[];
  onSelectTally?: (tally: SavedTally) => void;
}

type PeriodFilter = 'all' | 'this-year' | 'last-year' | 'this-month' | 'custom';

export const DepartmentAnalysisView: React.FC<DepartmentAnalysisViewProps> = ({
  tallies,
  onSelectTally,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'departments' | 'monthly-yearly' | 'employees'>('departments');

  // Available distinct years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    tallies.forEach((t) => {
      years.add(String(new Date(t.timestamp).getFullYear()));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [tallies]);

  // Distinct departments
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    tallies.forEach((t) => {
      depts.add(t.department || 'General Accounting');
    });
    return Array.from(depts).sort();
  }, [tallies]);

  // Filter tallies by period selection
  const filteredTallies = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return tallies.filter((t) => {
      const d = new Date(t.timestamp);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth();

      // Period filter
      if (selectedPeriod === 'this-year' && tYear !== currentYear) return false;
      if (selectedPeriod === 'last-year' && tYear !== currentYear - 1) return false;
      if (selectedPeriod === 'this-month' && (tYear !== currentYear || tMonth !== currentMonth)) return false;
      if (selectedPeriod === 'custom') {
        if (selectedYear !== 'ALL' && String(tYear) !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && String(tMonth) !== selectedMonth) return false;
      }

      // Department filter
      if (selectedDeptFilter !== 'ALL') {
        const dept = t.department || 'General Accounting';
        if (dept !== selectedDeptFilter) return false;
      }

      return true;
    });
  }, [tallies, selectedPeriod, selectedYear, selectedMonth, selectedDeptFilter]);

  // Aggregate by Department
  const departmentSummaries = useMemo(() => {
    const map: Record<string, {
      totalAmount: number;
      tallyCount: number;
      totalPieces: number;
      currencyCode: string;
      currencySymbol: string;
      employeesSet: Set<string>;
      recentRemarks: string[];
    }> = {};

    let grandTotal = 0;

    filteredTallies.forEach((t) => {
      const dept = t.department || 'General Accounting';
      if (!map[dept]) {
        map[dept] = {
          totalAmount: 0,
          tallyCount: 0,
          totalPieces: 0,
          currencyCode: t.currencyCode,
          currencySymbol: t.currencySymbol,
          employeesSet: new Set<string>(),
          recentRemarks: [],
        };
      }
      map[dept].totalAmount += t.totalAmount;
      map[dept].tallyCount += 1;
      map[dept].totalPieces += t.totalPieces;
      grandTotal += t.totalAmount;
      if (t.employeeName) {
        map[dept].employeesSet.add(t.employeeName);
      }
      if (t.remark && !map[dept].recentRemarks.includes(t.remark)) {
        map[dept].recentRemarks.push(t.remark);
      }
    });

    const list: (DepartmentFinancialSummary & { recentRemarks: string[] })[] = Object.entries(map).map(
      ([dept, data]) => ({
        department: dept,
        totalAmount: data.totalAmount,
        tallyCount: data.tallyCount,
        totalPieces: data.totalPieces,
        currencySymbol: data.currencySymbol,
        currencyCode: data.currencyCode,
        employees: Array.from(data.employeesSet),
        avgTallyAmount: data.tallyCount > 0 ? Math.round(data.totalAmount / data.tallyCount) : 0,
        sharePercentage: grandTotal > 0 ? (data.totalAmount / grandTotal) * 100 : 0,
        recentRemarks: data.recentRemarks.slice(0, 3),
      })
    );

    // Sort descending by total financial volume
    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTallies]);

  // Monthly breakdown for selected year
  const monthlyDeptTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activeYearStr = selectedPeriod === 'custom' ? selectedYear : selectedPeriod === 'last-year' ? String(new Date().getFullYear() - 1) : '2026';

    const yearTallies = tallies.filter((t) => String(new Date(t.timestamp).getFullYear()) === activeYearStr);

    // month index -> { monthName, total, byDept: Record<string, number> }
    return months.map((name, idx) => {
      const inMonth = yearTallies.filter((t) => new Date(t.timestamp).getMonth() === idx);
      const total = inMonth.reduce((acc, t) => acc + t.totalAmount, 0);
      const byDept: Record<string, number> = {};
      inMonth.forEach((t) => {
        const d = t.department || 'General Accounting';
        byDept[d] = (byDept[d] || 0) + t.totalAmount;
      });
      return {
        monthIndex: idx,
        monthName: name,
        total,
        tallyCount: inMonth.length,
        byDept,
      };
    });
  }, [tallies, selectedPeriod, selectedYear]);

  // Aggregate by Employee (For >25 accounting employees tracking)
  const employeeSummaries = useMemo(() => {
    const map: Record<string, {
      name: string;
      department: string;
      totalAmount: number;
      tallyCount: number;
      totalPieces: number;
      currencySymbol: string;
      latestTimestamp: number;
      topRemark: string;
    }> = {};

    filteredTallies.forEach((t) => {
      const empName = t.employeeName || 'Unassigned Staff';
      if (!map[empName]) {
        map[empName] = {
          name: empName,
          department: t.department || 'General Accounting',
          totalAmount: 0,
          tallyCount: 0,
          totalPieces: 0,
          currencySymbol: t.currencySymbol,
          latestTimestamp: t.timestamp,
          topRemark: t.remark || t.title,
        };
      }
      map[empName].totalAmount += t.totalAmount;
      map[empName].tallyCount += 1;
      map[empName].totalPieces += t.totalPieces;
      if (t.timestamp > map[empName].latestTimestamp) {
        map[empName].latestTimestamp = t.timestamp;
        if (t.remark) map[empName].topRemark = t.remark;
      }
    });

    let list = Object.values(map);

    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase().trim();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
    }

    return list.sort((a, b) => b.tallyCount - a.tallyCount || b.totalAmount - a.totalAmount);
  }, [filteredTallies, employeeSearch]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalAmount = filteredTallies.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPieces = filteredTallies.reduce((sum, t) => sum + t.totalPieces, 0);
    const uniqueEmployees = new Set(filteredTallies.map((t) => t.employeeName).filter(Boolean)).size;
    const uniqueDepts = departmentSummaries.length;
    const currency = filteredTallies[0]?.currencySymbol || '₹';

    return {
      totalAmount,
      totalPieces,
      tallyCount: filteredTallies.length,
      uniqueEmployees,
      uniqueDepts,
      currency,
    };
  }, [filteredTallies, departmentSummaries]);

  // Export Department Financial Report to CSV
  const handleExportDepartmentCSV = () => {
    if (departmentSummaries.length === 0) return;

    const headers = [
      'Department',
      'Total Cash Handled',
      'Total Tally Submissions',
      'Share of Financial Flow (%)',
      'Avg Tally Size',
      'Total Pieces',
      'Active Staff Count',
      'Contributing Staff List',
      'Common Remarks',
    ];

    const rows = departmentSummaries.map((d) => [
      `"${d.department}"`,
      d.totalAmount,
      d.tallyCount,
      `"${d.sharePercentage.toFixed(1)}%"`,
      d.avgTallyAmount,
      d.totalPieces,
      d.employees.length,
      `"${d.employees.join('; ')}"`,
      `"${d.recentRemarks.join(' | ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.join('\n')];
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `department_financial_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDepartmentColor = (dept: string, index: number) => {
    const colors = [
      { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', light: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', light: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
      { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', light: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      { bg: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', light: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
      { bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', light: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
      { bg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', light: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
      { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', light: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Control Panel */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Department Financial Overview & Analytics</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Comparative financial cash-flow analysis across departments & 25+ daily accounting employees
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDepartmentCSV}
              disabled={departmentSummaries.length === 0}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Export Department Financial Analysis as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Dept Report</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriod === 'all'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSelectedPeriod('this-year')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriod === 'this-year'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setSelectedPeriod('this-month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriod === 'this-month'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('last-year')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriod === 'last-year'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Last Year (2025)
            </button>
            <button
              onClick={() => setSelectedPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriod === 'custom'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Custom Month/Year
            </button>
          </div>

          {/* Sub-selectors for Custom Month / Year & Department */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPeriod === 'custom' && (
              <>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="ALL">All Months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                    <option key={m} value={String(idx)}>{m}</option>
                  ))}
                </select>
              </>
            )}

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-hidden"
            >
              <option value="ALL">All Departments ({availableDepartments.length})</option>
              {availableDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">Total Cash Audited</span>
          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {kpis.currency} {kpis.totalAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">
            {kpis.totalPieces.toLocaleString()} pieces verified
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">Submissions Recorded</span>
          <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white mt-0.5 block">
            {kpis.tallyCount} Tallies
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">
            Across {kpis.uniqueDepts} departments
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">Accounting Employees</span>
          <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
            {kpis.uniqueEmployees} Active Staff
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">
            Submitting data daily
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">Average Tally Size</span>
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
            {kpis.currency} {kpis.tallyCount > 0 ? Math.round(kpis.totalAmount / kpis.tallyCount).toLocaleString() : 0}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">
            Per cashier / accountant count
          </span>
        </div>
      </div>

      {/* Sub-Navigation: Departments Overview | Monthly & Yearly Trends | Employees Breakdown */}
      <div className="flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === 'departments'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          🏢 Department Comparison ({departmentSummaries.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly-yearly')}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === 'monthly-yearly'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          📊 Monthly & Yearly Trends
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === 'employees'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          👥 Accounting Staff ({employeeSummaries.length})
        </button>
      </div>

      {/* 1. DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="space-y-3">
          {departmentSummaries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
              No department records match the selected period. Try choosing "All Time".
            </div>
          ) : (
            departmentSummaries.map((dept, idx) => {
              const theme = getDepartmentColor(dept.department, idx);

              return (
                <div
                  key={dept.department}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${theme.light} flex items-center justify-center font-bold text-xs ${theme.text}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                          {dept.department}
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          {dept.tallyCount} submissions • {dept.employees.length} active employee{dept.employees.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline sm:items-end flex-col text-left sm:text-right">
                      <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                        {dept.currencySymbol} {dept.totalAmount.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {dept.sharePercentage.toFixed(1)}% of total cash volume • avg {dept.currencySymbol}{dept.avgTallyAmount.toLocaleString()}/tally
                      </span>
                    </div>
                  </div>

                  {/* Volume Share Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${theme.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(5, Math.min(100, dept.sharePercentage))}%` }}
                    />
                  </div>

                  {/* Active Employees & Common Remarks */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-stone-400 font-medium">Accounting Staff:</span>
                      {dept.employees.slice(0, 4).map((emp) => (
                        <span
                          key={emp}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-medium"
                        >
                          {emp.split(' ')[0]}
                        </span>
                      ))}
                      {dept.employees.length > 4 && (
                        <span className="text-[10px] text-stone-400">+{dept.employees.length - 4} more</span>
                      )}
                    </div>

                    {dept.recentRemarks.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 italic truncate max-w-md">
                        <span className="not-italic text-stone-400 text-[10px]">Remark:</span>
                        <span className="truncate">"{dept.recentRemarks[0]}"</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. MONTHLY & YEARLY TRENDS TAB */}
      {activeTab === 'monthly-yearly' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Monthly Financial Flow by Department ({selectedPeriod === 'custom' ? selectedYear : '2026'})
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tracking cash handling velocity across 12 calendar months
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {monthlyDeptTrends.map((month) => {
              const hasActivity = month.total > 0;
              const maxMonthTotal = Math.max(...monthlyDeptTrends.map((m) => m.total), 1);
              const pct = (month.total / maxMonthTotal) * 100;

              return (
                <div
                  key={month.monthName}
                  className={`p-3 rounded-xl border transition ${
                    hasActivity
                      ? 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60'
                      : 'bg-stone-50/40 dark:bg-stone-800/20 border-dashed border-stone-200 dark:border-stone-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200 w-10">
                        {month.monthName}
                      </span>
                      {hasActivity && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                          {month.tallyCount} tallies
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      {kpis.currency} {month.total.toLocaleString()}
                    </span>
                  </div>

                  {hasActivity && (
                    <>
                      <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden mb-2">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>

                      {/* Department Breakdown for this month */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(month.byDept).map(([deptName, deptAmt]) => (
                          <span
                            key={deptName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[10px] text-stone-600 dark:text-stone-300"
                          >
                            <span className="font-medium">{deptName.split(' ')[0]}:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {kpis.currency}{deptAmt.toLocaleString()}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACCOUNTING EMPLOYEES TAB (Supporting >25 Employees Daily Submissions) */}
      {activeTab === 'employees' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Accounting Employees Activity Ledger</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Staff submissions, audit reconciliation counts & last active timestamp
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search staff or department..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 font-semibold">
                  <th className="py-2 px-2.5">Staff / Employee</th>
                  <th className="py-2 px-2.5">Department</th>
                  <th className="py-2 px-2.5 text-center">Tallies</th>
                  <th className="py-2 px-2.5 text-right">Cash Reconciled</th>
                  <th className="py-2 px-2.5 hidden sm:table-cell">Recent Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {employeeSummaries.map((emp, idx) => (
                  <tr key={emp.name} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                    <td className="py-2.5 px-2.5">
                      <div className="font-semibold text-stone-900 dark:text-white">
                        {emp.name}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1 sm:hidden">
                        {new Date(emp.latestTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-medium border border-stone-200 dark:border-stone-700">
                        {emp.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-bold text-stone-800 dark:text-stone-200">
                      {emp.tallyCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {emp.currencySymbol} {emp.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5 hidden sm:table-cell text-stone-500 dark:text-stone-400 text-[11px] truncate max-w-xs italic">
                      "{emp.topRemark}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
