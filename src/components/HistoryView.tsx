import React, { useState, useMemo, useEffect } from 'react';
import { SavedTally, CountryCurrency, TallySortOption } from '../types';
import { 
  Calendar, 
  Search, 
  RotateCcw, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  User,
  ArrowUpDown,
  Filter,
  MessageSquareText,
  Eye,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrencyAmount } from '../utils/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { GiftFooter } from './GiftFooter';
import { DepartmentAnalysisView } from './DepartmentAnalysisView';
import { getCompanyMode } from '../utils/companyMode';

interface HistoryViewProps {
  tallies: SavedTally[];
  onLoadTally: (tally: SavedTally) => void;
  onDeleteTally: (id: string) => void;
  onClearAllTallies: () => void;
  onSeedSampleTallies?: () => void;
  onSelectReceiptTally: (tally: SavedTally) => void;
  allCountries: CountryCurrency[];
  companyModeEnabled?: boolean;
}

type HistoryGrouping = 'date' | 'month' | 'year' | 'departments';

export const HistoryView: React.FC<HistoryViewProps> = ({
  tallies,
  onLoadTally,
  onDeleteTally,
  onClearAllTallies,
  onSelectReceiptTally,
  companyModeEnabled,
}) => {
  const isCompanyMode = companyModeEnabled !== undefined ? companyModeEnabled : getCompanyMode();
  const [activeGrouping, setActiveGrouping] = useState<HistoryGrouping>('date');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isCompanyMode && activeGrouping === 'departments') {
      setActiveGrouping('date');
    }
  }, [isCompanyMode, activeGrouping]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'yesterday' | 'this-week' | 'this-month' | 'this-year'>('all');
  const [sortBy, setSortBy] = useState<TallySortOption>('date-desc');
  const [copiedTallyId, setCopiedTallyId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Toggle group expansion
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  // Distinct currencies present in history
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    tallies.forEach((t) => set.add(t.currencyCode));
    return Array.from(set).sort();
  }, [tallies]);

  // Distinct departments present in history
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    tallies.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [tallies]);

  // Distinct employees present in history
  const availableEmployees = useMemo(() => {
    const set = new Set<string>();
    tallies.forEach((t) => {
      if (t.employeeName) set.add(t.employeeName);
    });
    return Array.from(set).sort();
  }, [tallies]);

  // Filtered and sorted tallies by search, department, employee, timeframe & currency
  const filteredTallies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    const result = tallies.filter((t) => {
      const matchCurrency = selectedCurrencyFilter === 'ALL' || t.currencyCode === selectedCurrencyFilter;
      const matchDept = !isCompanyMode || selectedDeptFilter === 'ALL' || (t.department || '') === selectedDeptFilter;
      const matchEmp = !isCompanyMode || selectedEmployeeFilter === 'ALL' || (t.employeeName || '') === selectedEmployeeFilter;

      // Timeframe matching
      const tDate = new Date(t.timestamp);
      let matchTimeframe = true;
      if (timeframeFilter === 'today') {
        matchTimeframe = tDate.toDateString() === todayStr;
      } else if (timeframeFilter === 'yesterday') {
        matchTimeframe = tDate.toDateString() === yesterdayStr;
      } else if (timeframeFilter === 'this-week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchTimeframe = t.timestamp >= weekAgo.getTime();
      } else if (timeframeFilter === 'this-month') {
        matchTimeframe = tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
      } else if (timeframeFilter === 'this-year') {
        matchTimeframe = tDate.getFullYear() === now.getFullYear();
      }

      // Search matching across title, employee, department, remark, country, currency, summary
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.remark && t.remark.toLowerCase().includes(q)) ||
        (t.employeeName && t.employeeName.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        t.countryName.toLowerCase().includes(q) ||
        t.currencyCode.toLowerCase().includes(q) ||
        (t.notesSummary && t.notesSummary.toLowerCase().includes(q));

      return matchCurrency && matchDept && matchEmp && matchTimeframe && matchSearch;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.timestamp - b.timestamp;
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        case 'employee-asc':
          return (a.employeeName || '').localeCompare(b.employeeName || '');
        case 'department-asc':
          return (a.department || '').localeCompare(b.department || '');
        case 'date-desc':
        default:
          return b.timestamp - a.timestamp;
      }
    });
  }, [
    tallies, 
    searchQuery, 
    selectedCurrencyFilter, 
    selectedDeptFilter, 
    selectedEmployeeFilter, 
    timeframeFilter, 
    sortBy
  ]);

  // Copy tally summary to clipboard
  const handleCopySummary = async (tally: SavedTally) => {
    const remarkStr = tally.remark ? `\nRemark: ${tally.remark}` : '';
    const empStr = tally.employeeName ? `\nStaff: ${tally.employeeName}` : '';
    const deptStr = tally.department ? `\nDepartment: ${tally.department}` : '';
    const text = `Cash Tally: ${tally.title}${deptStr}${empStr}${remarkStr}\nDate: ${new Date(tally.timestamp).toLocaleString()}\nTotal: ${tally.currencySymbol}${tally.totalAmount.toLocaleString()} (${tally.currencyCode})\nPieces: ${tally.totalPieces} (${tally.totalNotes} notes, ${tally.totalCoins} coins)\nIn Words: ${tally.amountInWords}`;
    await copyToClipboard(text);
    setCopiedTallyId(tally.id);
    setTimeout(() => setCopiedTallyId(null), 2000);
  };

  // Export tallies to CSV with Employee, Department, Remarks
  const handleExportCSV = () => {
    if (tallies.length === 0) return;
    const headers = [
      'ID', 
      'Date', 
      'Time', 
      'Title', 
      'Employee / Cashier', 
      'Department', 
      'Remarks / Narration', 
      'Country', 
      'Currency', 
      'Total Amount', 
      'Total Notes', 
      'Total Coins', 
      'Total Pieces', 
      'Amount in Words'
    ];
    const rows = tallies.map((t) => {
      const d = new Date(t.timestamp);
      return [
        `"${t.id}"`,
        `"${d.toISOString().split('T')[0]}"`,
        `"${d.toLocaleTimeString()}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.employeeName || '').replace(/"/g, '""')}"`,
        `"${(t.department || '').replace(/"/g, '""')}"`,
        `"${(t.remark || '').replace(/"/g, '""')}"`,
        `"${t.countryName}"`,
        `"${t.currencyCode}"`,
        t.totalAmount,
        t.totalNotes,
        t.totalCoins,
        t.totalPieces,
        `"${t.amountInWords.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cash_tally_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group by Date (YYYY-MM-DD)
  const dateGroups = useMemo(() => {
    const groups: Record<string, { label: string; dateObj: Date; tallies: SavedTally[]; totalByCurrency: Record<string, number> }> = {};
    const todayStr = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    filteredTallies.forEach((t) => {
      const d = new Date(t.timestamp);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      let label = d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      if (d.toDateString() === todayStr) {
        label = `Today (${label})`;
      } else if (d.toDateString() === yesterdayStr) {
        label = `Yesterday (${label})`;
      }

      if (!groups[dateKey]) {
        groups[dateKey] = { label, dateObj: d, tallies: [], totalByCurrency: {} };
      }
      groups[dateKey].tallies.push(t);
      groups[dateKey].totalByCurrency[t.currencyCode] = (groups[dateKey].totalByCurrency[t.currencyCode] || 0) + t.totalAmount;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, val]) => ({ key, ...val }));
  }, [filteredTallies]);

  // Group by Month (YYYY-MM)
  const monthGroups = useMemo(() => {
    const groups: Record<string, { label: string; year: number; month: number; tallies: SavedTally[]; totalByCurrency: Record<string, number>; totalPieces: number }> = {};

    filteredTallies.forEach((t) => {
      const d = new Date(t.timestamp);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = { label, year: d.getFullYear(), month: d.getMonth(), tallies: [], totalByCurrency: {}, totalPieces: 0 };
      }
      groups[monthKey].tallies.push(t);
      groups[monthKey].totalByCurrency[t.currencyCode] = (groups[monthKey].totalByCurrency[t.currencyCode] || 0) + t.totalAmount;
      groups[monthKey].totalPieces += t.totalPieces;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, val]) => ({ key, ...val }));
  }, [filteredTallies]);

  // Group by Year (YYYY)
  const yearGroups = useMemo(() => {
    const groups: Record<string, { year: number; tallies: SavedTally[]; totalByCurrency: Record<string, number>; totalPieces: number; monthCounts: Record<number, number> }> = {};

    filteredTallies.forEach((t) => {
      const d = new Date(t.timestamp);
      const year = d.getFullYear();
      const yearKey = String(year);

      if (!groups[yearKey]) {
        groups[yearKey] = { year, tallies: [], totalByCurrency: {}, totalPieces: 0, monthCounts: {} };
      }
      groups[yearKey].tallies.push(t);
      groups[yearKey].totalByCurrency[t.currencyCode] = (groups[yearKey].totalByCurrency[t.currencyCode] || 0) + t.totalAmount;
      groups[yearKey].totalPieces += t.totalPieces;
      const m = d.getMonth();
      groups[yearKey].monthCounts[m] = (groups[yearKey].monthCounts[m] || 0) + t.totalAmount;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([key, val]) => ({ key, ...val }));
  }, [filteredTallies]);

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 pb-28 text-stone-900 dark:text-stone-100 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>{isCompanyMode ? 'Enterprise Cash Ledger' : 'Cash Tally Ledger'}</span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {isCompanyMode
                  ? 'Enterprise ledger with staff sorting, department remarks, and multi-year financial analysis'
                  : 'Historical cash tallies ledger with daily, monthly, and multi-year summaries'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {tallies.length > 0 && (
              <button
                id="btn-export-history-csv"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export CSV audit spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}

            {tallies.length > 0 && (
              <button
                id="btn-clear-all-tallies-history"
                onClick={onClearAllTallies}
                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Clear all saved tallies"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Permanent Top-Right App Icon */}
            <div className="pl-1 border-l border-stone-200 dark:border-stone-800 ml-0.5 shrink-0" title="Currency Counter">
              <img
                src="/app-icon.png"
                alt="Currency Counter"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-400/60 shadow-xs ring-1 ring-black/10"
              />
            </div>
          </div>
        </div>

        {/* Compact High-Speed Toolbar: Eye View Dropdown, Sort, Filters, and Search */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Eye Icon View Mode Selector Dropdown */}
            <div className="relative">
              <button
                id="btn-eye-view-dropdown"
                type="button"
                onClick={() => setIsViewMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-xs font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer shadow-2xs shrink-0"
                title="View Mode: Click to switch between Day, Month, Year, and Department"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>
                  {activeGrouping === 'date' && '📅 Day'}
                  {activeGrouping === 'month' && '🗓️ Month'}
                  {activeGrouping === 'year' && '📈 Year'}
                  {activeGrouping === 'departments' && '🏢 Dept'}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>

              {isViewMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsViewMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[170px] bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>View Mode</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setActiveGrouping('date'); setIsViewMenuOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold transition cursor-pointer ${
                        activeGrouping === 'date'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>📅</span>
                        <span>Day (Daily)</span>
                      </span>
                      {activeGrouping === 'date' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveGrouping('month'); setIsViewMenuOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold transition cursor-pointer ${
                        activeGrouping === 'month'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🗓️</span>
                        <span>Month-wise</span>
                      </span>
                      {activeGrouping === 'month' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveGrouping('year'); setIsViewMenuOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold transition cursor-pointer ${
                        activeGrouping === 'year'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>📈</span>
                        <span>Year-wise</span>
                      </span>
                      {activeGrouping === 'year' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    {isCompanyMode && (
                      <button
                        type="button"
                        onClick={() => { setActiveGrouping('departments'); setIsViewMenuOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold transition cursor-pointer ${
                          activeGrouping === 'departments'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🏢</span>
                          <span>Dept Analysis</span>
                        </span>
                        {activeGrouping === 'departments' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sort with price/amount symbols High and Low */}
            {activeGrouping !== 'departments' && (
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  id="select-history-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as TallySortOption)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer text-xs"
                  title="Sort records"
                >
                  <option value="date-desc">⏱️ Newest (↓)</option>
                  <option value="date-asc">⏳ Oldest (↑)</option>
                  <option value="amount-desc">💰 High ▼ Amount</option>
                  <option value="amount-asc">💵 Low ▲ Amount</option>
                  {isCompanyMode && <option value="employee-asc">👤 Staff (A-Z)</option>}
                  {isCompanyMode && <option value="department-asc">🏢 Dept (A-Z)</option>}
                </select>
              </div>
            )}

            {/* Timeframe Filter */}
            {activeGrouping !== 'departments' && (
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  value={timeframeFilter}
                  onChange={(e) => setTimeframeFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer text-xs"
                  title="Filter by timeframe"
                >
                  <option value="all">⏱️ All Dates</option>
                  <option value="today">📅 Today</option>
                  <option value="yesterday">🗓️ Yesterday</option>
                  <option value="this-week">📊 This Week</option>
                  <option value="this-month">🗓️ This Month</option>
                  <option value="this-year">📈 This Year</option>
                </select>
              </div>
            )}

            {/* Department Filter (Only in Company/Firm Mode) */}
            {activeGrouping !== 'departments' && isCompanyMode && availableDepartments.length > 0 && (
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer text-xs max-w-[120px] truncate"
                  title="Filter by Department"
                >
                  <option value="ALL">🏢 All Depts</option>
                  {availableDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Filter (Only in Company/Firm Mode) */}
            {activeGrouping !== 'departments' && isCompanyMode && availableEmployees.length > 0 && (
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  value={selectedEmployeeFilter}
                  onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer text-xs max-w-[130px] truncate"
                  title="Filter by Staff"
                >
                  <option value="ALL">👤 All Staff ({availableEmployees.length})</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Currency Filter */}
            {activeGrouping !== 'departments' && availableCurrencies.length > 1 && (
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-xs">💱</span>
                <select
                  value={selectedCurrencyFilter}
                  onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer text-xs"
                  title="Filter by Currency"
                >
                  <option value="ALL">All Currencies</option>
                  {availableCurrencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filter Button */}
            {activeGrouping !== 'departments' && (selectedDeptFilter !== 'ALL' || selectedEmployeeFilter !== 'ALL' || timeframeFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
              <button
                onClick={() => {
                  setSelectedDeptFilter('ALL');
                  setSelectedEmployeeFilter('ALL');
                  setTimeframeFilter('all');
                  setSearchQuery('');
                  setSortBy('date-desc');
                }}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer px-1.5 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Reset all filters"
              >
                ✖️ Reset
              </button>
            )}
          </div>

          {/* Right: Search Query */}
          <div className="relative flex-1 sm:max-w-xs min-w-[140px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. DEPARTMENT FINANCIAL ANALYSIS VIEW */}
      {activeGrouping === 'departments' && (
        <DepartmentAnalysisView tallies={tallies} onSelectTally={onLoadTally} />
      )}

      {/* Empty State */}
      {activeGrouping !== 'departments' && filteredTallies.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
            {searchQuery || selectedDeptFilter !== 'ALL' || selectedEmployeeFilter !== 'ALL'
              ? 'No matching tallies found'
              : 'No saved tallies yet'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            {searchQuery || selectedDeptFilter !== 'ALL' || selectedEmployeeFilter !== 'ALL'
              ? 'Try resetting your search query, department, or staff filter.'
              : 'Save cash counting tallies in the Counter view to build a permanent day, month, and multi-year ledger with remarks.'}
          </p>
        </div>
      )}

      {/* 1. DATE-WISE (DAILY) VIEW */}
      {activeGrouping === 'date' && dateGroups.length > 0 && (
        <div className="space-y-4">
          {dateGroups.map((group) => {
            const isCollapsed = expandedGroups[group.key] === false;

            return (
              <div
                key={group.key}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden"
              >
                {/* Date Group Header */}
                <div
                  onClick={() => toggleGroup(group.key)}
                  className="px-4 py-3 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-white">
                      {group.label}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      {group.tallies.length} {group.tallies.length === 1 ? 'submission' : 'submissions'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {Object.entries(group.totalByCurrency).map(([curr, amt]) => (
                        <span key={curr} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mr-2">
                          {curr} {amt.toLocaleString()}
                        </span>
                      ))}
                    </div>
                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {/* Tallies inside this date */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 divide-y divide-stone-100 dark:divide-stone-800/80 space-y-3">
                    {group.tallies.map((tally) => (
                      <TallyCard
                        key={tally.id}
                        tally={tally}
                        onLoad={() => onLoadTally(tally)}
                        onDelete={() => onDeleteTally(tally.id)}
                        onCopy={() => handleCopySummary(tally)}
                        onReceipt={() => onSelectReceiptTally(tally)}
                        isCopied={copiedTallyId === tally.id}
                        isCompanyMode={isCompanyMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MONTH-WISE VIEW */}
      {activeGrouping === 'month' && monthGroups.length > 0 && (
        <div className="space-y-4">
          {monthGroups.map((month) => {
            const isCollapsed = expandedGroups[month.key] === false;

            return (
              <div
                key={month.key}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden"
              >
                {/* Month Group Header */}
                <div
                  onClick={() => toggleGroup(month.key)}
                  className="p-4 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                        <span>{month.label}</span>
                        <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
                          ({month.tallies.length} tallies, {month.totalPieces.toLocaleString()} pieces)
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {Object.entries(month.totalByCurrency).map(([curr, amt]) => (
                          <div
                            key={curr}
                            className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs"
                          >
                            Total {curr}: {amt.toLocaleString()}
                          </div>
                        ))}
                      </div>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>
                </div>

                {/* Tallies inside this month */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 divide-y divide-stone-100 dark:divide-stone-800/80 space-y-3">
                    {month.tallies.map((tally) => (
                      <TallyCard
                        key={tally.id}
                        tally={tally}
                        onLoad={() => onLoadTally(tally)}
                        onDelete={() => onDeleteTally(tally.id)}
                        onCopy={() => handleCopySummary(tally)}
                        onReceipt={() => onSelectReceiptTally(tally)}
                        isCopied={copiedTallyId === tally.id}
                        isCompanyMode={isCompanyMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. YEAR-WISE VIEW (MULTI-YEAR TRACKING) */}
      {activeGrouping === 'year' && yearGroups.length > 0 && (
        <div className="space-y-5">
          {yearGroups.map((yearGroup) => {
            const isCollapsed = expandedGroups[yearGroup.key] === false;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const maxMonthVal = Math.max(...(Object.values(yearGroup.monthCounts) as number[]), 1);

            return (
              <div
                key={yearGroup.key}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden"
              >
                {/* Year Header Summary Card */}
                <div
                  onClick={() => toggleGroup(yearGroup.key)}
                  className="p-4 sm:p-5 bg-stone-50/90 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                          {yearGroup.year}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          Annual Summary
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {yearGroup.tallies.length} total sessions recorded in {yearGroup.year} across {yearGroup.totalPieces.toLocaleString()} pieces
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {Object.entries(yearGroup.totalByCurrency).map(([curr, amt]) => (
                          <div key={curr} className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {curr} {amt.toLocaleString()}
                          </div>
                        ))}
                      </div>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>

                  {/* 12-Month Distribution Mini-Bar Chart */}
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700/60">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium mb-1.5">
                      <span>Monthly Cash Velocity ({yearGroup.year})</span>
                      <span>Total: {yearGroup.tallies.length} counts</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 h-10 items-end">
                      {monthNames.map((mName, mIdx) => {
                        const val = yearGroup.monthCounts[mIdx] || 0;
                        const heightPct = val > 0 ? Math.max(15, Math.round((val / maxMonthVal) * 100)) : 6;

                        return (
                          <div key={mName} className="flex flex-col items-center h-full justify-end group relative">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-xs transition-all ${
                                val > 0
                                  ? 'bg-emerald-500 dark:bg-emerald-400 group-hover:bg-emerald-600'
                                  : 'bg-stone-200 dark:bg-stone-700'
                              }`}
                              title={`${mName} ${yearGroup.year}: ${val.toLocaleString()}`}
                            />
                            <span className="text-[9px] text-stone-400 dark:text-stone-500 mt-1">
                              {mName[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tallies list for this year */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 divide-y divide-stone-100 dark:divide-stone-800/80 space-y-3">
                    {yearGroup.tallies.map((tally) => (
                      <TallyCard
                        key={tally.id}
                        tally={tally}
                        onLoad={() => onLoadTally(tally)}
                        onDelete={() => onDeleteTally(tally.id)}
                        onCopy={() => handleCopySummary(tally)}
                        onReceipt={() => onSelectReceiptTally(tally)}
                        isCopied={copiedTallyId === tally.id}
                        isCompanyMode={isCompanyMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dedicated Footer: Gift from Yatinkumar Chauhan */}
      <GiftFooter />
    </div>
  );
};

// Sub-component for individual tally card with Employee, Department, and Remark display
interface TallyCardProps {
  tally: SavedTally;
  onLoad: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onReceipt: () => void;
  isCopied: boolean;
  isCompanyMode?: boolean;
}

const TallyCard: React.FC<TallyCardProps> = ({
  tally,
  onLoad,
  onDelete,
  onCopy,
  onReceipt,
  isCopied,
  isCompanyMode,
}) => {
  const date = new Date(tally.timestamp);
  const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="pt-3 first:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          {/* Header row: Title, Department badge, Staff badge, Date/Time */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 dark:text-white text-sm">
              {tally.title}
            </span>

            {isCompanyMode && tally.department && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-600" />
                <span>{tally.department}</span>
              </span>
            )}

            {isCompanyMode && tally.employeeName && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" />
                <span>{tally.employeeName}</span>
              </span>
            )}

            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateFormatted} at {timeFormatted}
            </span>
          </div>

          {/* Amount & pieces */}
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {tally.currencySymbol} {tally.totalAmount.toLocaleString()}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              📦 {tally.totalPieces} pcs ({tally.totalNotes}n + {tally.totalCoins}c)
            </span>
          </div>

          {/* Remarks / Narration Box */}
          {tally.remark && (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40 w-fit max-w-full">
              <MessageSquareText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="font-medium text-[11px] leading-relaxed">
                {tally.remark}
              </span>
            </div>
          )}

          {tally.amountInWords && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic mt-1 line-clamp-1">
              "{tally.amountInWords}"
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 mt-1 sm:mt-0">
          <button
            onClick={onLoad}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
            title="Load this tally into active Counter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load</span>
          </button>

          <button
            onClick={onReceipt}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition cursor-pointer"
            title="View printable receipt breakdown"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition cursor-pointer"
            title="Copy summary to clipboard"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition cursor-pointer"
            title="Delete this tally"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
