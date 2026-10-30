import React, { useState, useMemo } from 'react';
import { CountryCurrency, Denomination, DenominationCounts } from '../types';
import { formatCurrencyAmount, generateCashSlipText } from '../utils/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { useLanguage } from '../i18n/LanguageContext';
import { escapeHtml } from '../utils/security';
import { 
  X, 
  Copy, 
  Check, 
  Printer, 
  Banknote, 
  Coins,
  MessageSquareText
} from 'lucide-react';

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryCurrency;
  denominations: Denomination[];
  counts: DenominationCounts;
  totalAmount: number;
  totalNotes: number;
  totalCoins: number;
  totalPieces: number;
  amountInWords: string;
  title?: string;
  remark?: string;
  employeeName?: string;
  department?: string;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  isOpen,
  onClose,
  country,
  denominations,
  counts,
  totalAmount,
  totalNotes,
  totalCoins,
  totalPieces,
  amountInWords,
  title,
  remark,
  employeeName,
  department,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Automatically calculate background layout to fit all rows & columns onto 1 page
  const {
    notes,
    coins,
    totalNotePieces,
    totalNoteAmount,
    totalCoinPieces,
    totalCoinAmount,
    effectiveIsTwoCol,
    notesCol1,
    notesCol2,
    notesCol1Pieces,
    notesCol1Amount,
    notesCol2Pieces,
    notesCol2Amount,
    isVeryLong,
  } = useMemo(() => {
    const n = denominations.filter((d) => d.type === 'note' && (counts[d.id] || 0) > 0);
    const c = denominations.filter((d) => d.type === 'coin' && (counts[d.id] || 0) > 0);
    const nPcs = n.reduce((sum, d) => sum + (counts[d.id] || 0), 0);
    const nAmt = n.reduce((sum, d) => sum + (counts[d.id] || 0) * d.value, 0);
    const cPcs = c.reduce((sum, d) => sum + (counts[d.id] || 0), 0);
    const cAmt = c.reduce((sum, d) => sum + (counts[d.id] || 0) * d.value, 0);

    // Auto-fit rule running in background:
    // If both notes and coins exist or more than 6 rows, format into 2 columns side-by-side
    // so all rows and columns fit on a single page without vertical spill.
    const isTwoCol = (n.length > 0 && c.length > 0) || n.length > 6 || c.length > 6;

    let col1 = n;
    let col2: Denomination[] = [];
    if (c.length === 0 && n.length > 6 && isTwoCol) {
      col1 = n.slice(0, Math.ceil(n.length / 2));
      col2 = n.slice(Math.ceil(n.length / 2));
    }

    return {
      notes: n,
      coins: c,
      totalNotePieces: nPcs,
      totalNoteAmount: nAmt,
      totalCoinPieces: cPcs,
      totalCoinAmount: cAmt,
      effectiveIsTwoCol: isTwoCol,
      notesCol1: col1,
      notesCol2: col2,
      notesCol1Pieces: col1.reduce((s, d) => s + (counts[d.id] || 0), 0),
      notesCol1Amount: col1.reduce((s, d) => s + (counts[d.id] || 0) * d.value, 0),
      notesCol2Pieces: col2.reduce((s, d) => s + (counts[d.id] || 0), 0),
      notesCol2Amount: col2.reduce((s, d) => s + (counts[d.id] || 0) * d.value, 0),
      isVeryLong: (n.length + c.length) > 12,
    };
  }, [denominations, counts]);

  // Date and Time string for slip
  const currentDateTime = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} ${d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, []);

  const handleCopyText = async () => {
    let text = generateCashSlipText(country, denominations, counts, title || t.breakdown.title || 'Cash Tally Slip', amountInWords);
    if (department || employeeName || remark) {
      const extraMeta: string[] = [];
      if (department) extraMeta.push(`Department: ${department}`);
      if (employeeName) extraMeta.push(`Accounting Staff: ${employeeName}`);
      if (remark) extraMeta.push(`Remarks: ${remark}`);
      text = extraMeta.join('\n') + '\n\n' + text;
    }
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const slip = document.getElementById('printable-receipt-slip');
    if (!slip) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      const printWidth = effectiveIsTwoCol ? '680px' : '460px';

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title || 'Cash Tally Slip')} - ${escapeHtml(country.countryName)} (${escapeHtml(country.currencyCode)})</title>
  <style>
    @page {
      size: portrait;
      margin: 6mm 8mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100% !important;
      height: 100% !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #111111 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 3mm 4mm;
    }
    .receipt-box {
      width: 100%;
      max-width: ${printWidth};
      border: 1.5px solid #222;
      border-radius: 6px;
      padding: ${isVeryLong ? '8px 12px' : '12px 14px'};
      background: #ffffff;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-before: avoid !important;
      break-before: avoid !important;
      font-size: ${isVeryLong ? '10px' : '11px'};
      line-height: 1.25;
      margin: 0 auto;
    }
    .receipt-box * {
      color: #111111 !important;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .flex { display: flex; }
    .inline-flex { display: inline-flex; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1 1 0%; }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-1 { gap: 4px; }
    .gap-1\\.5 { gap: 6px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .gap-6 { gap: 24px; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-black { font-weight: 900; }
    .font-medium { font-weight: 500; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-wide { letter-spacing: 0.025em; }
    
    /* Table styles for rows and columns */
    table { width: 100%; border-collapse: collapse; }
    th {
      background-color: #f3f4f6 !important;
      border-bottom: 1.5px solid #374151 !important;
      padding: ${isVeryLong ? '2px 4px' : '3.5px 5px'};
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: ${isVeryLong ? '2px 4px' : '3px 5px'};
      border-bottom: 1px solid #e5e7eb;
    }
    .table-subtotal {
      background-color: #f9fafb !important;
      font-weight: 700;
      border-top: 1.5px solid #d1d5db;
      border-bottom: 1.5px solid #d1d5db;
    }
    .meta-box {
      background-color: #f9fafb !important;
      border: 1px solid #e5e7eb;
    }

    /* Borders */
    .border { border: 1px solid #e5e7eb; }
    .border-b { border-bottom: 1px solid #e5e7eb; }
    .border-t { border-top: 1px solid #e5e7eb; }
    .border-t-2 { border-top: 2px solid #111; }
    .border-dashed { border-style: dashed; }
    .border-stone-200 { border-color: #e5e7eb; }
    .border-stone-300 { border-color: #d1d5db; }
    .border-stone-400 { border-color: #9ca3af; }
    .border-stone-700 { border-color: #374151; }

    /* Spacings */
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .px-1 { padding-left: 4px; padding-right: 4px; }
    .px-1\\.5 { padding-left: 6px; padding-right: 6px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .px-2\\.5 { padding-left: 10px; padding-right: 10px; }
    .p-1 { padding: 4px; }
    .p-1\\.5 { padding: 6px; }
    .p-2 { padding: 8px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-1\\.5 { margin-bottom: 6px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-2\\.5 { margin-bottom: 10px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-1\\.5 { margin-top: 6px; }
    .mt-2 { margin-top: 8px; }
    .mt-2\\.5 { margin-top: 10px; }
    .mt-3 { margin-top: 12px; }
    .pb-1 { padding-bottom: 4px; }
    .pb-2 { padding-bottom: 8px; }
    .pb-2\\.5 { padding-bottom: 10px; }
    .pb-3 { padding-bottom: 12px; }
    .pt-1 { padding-top: 4px; }
    .pt-1\\.5 { padding-top: 6px; }
    .pt-2 { padding-top: 8px; }
    .pt-2\\.5 { padding-top: 10px; }
    .pt-3 { padding-top: 12px; }
    .pt-4 { padding-top: 16px; }
    .w-full { width: 100%; }
    .rounded { border-radius: 4px; }
    .rounded-xl { border-radius: 8px; }
    .overflow-hidden { overflow: hidden; }
    .leading-relaxed { line-height: 1.4; }
    .block { display: block; }
    svg { display: inline-block; vertical-align: middle; }
  </style>
</head>
<body>
  <div class="receipt-box font-mono">
    ${slip.innerHTML}
  </div>
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // cleanup safely
          }
        }, 1500);
      }, 300);
    } catch {
      window.print();
    }
  };

  // Helper to render a structured tabular grid of denomination rows & columns
  const renderDenominationTable = (
    tableTitle: string,
    icon: React.ReactNode,
    items: Denomination[],
    tableSubtotalPieces: number,
    tableSubtotalAmount: number
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center justify-between font-sans">
          <div className="flex items-center gap-1">
            {icon}
            <span>{tableTitle}</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium font-mono">
            {items.length} {items.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-900/90 text-[10px] text-stone-600 dark:text-stone-400 font-bold uppercase tracking-wider border-b border-stone-300 dark:border-stone-700">
                <th className="py-1 px-2 text-left">{t.breakdown.denomination || 'Denomination'}</th>
                <th className="py-1 px-2 text-center">{t.breakdown.count || 'Count (Pcs)'}</th>
                <th className="py-1 px-2 text-right">{t.breakdown.amount || 'Amount'} ({country.currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 dark:divide-stone-800/70 font-mono text-xs">
              {items.map((d) => {
                const c = counts[d.id] || 0;
                const sub = c * d.value;
                return (
                  <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40">
                    <td className="py-1 px-2 font-bold text-stone-800 dark:text-stone-200">
                      {country.currencySymbol}{d.value}
                    </td>
                    <td className="py-1 px-2 text-center font-semibold text-stone-600 dark:text-stone-400">
                      × {c}
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-stone-900 dark:text-white">
                      {formatCurrencyAmount(sub, country, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="table-subtotal bg-stone-50 dark:bg-stone-900/80 font-mono text-xs font-bold border-t border-stone-300 dark:border-stone-700">
                <td className="py-1 px-2 text-stone-600 dark:text-stone-400">
                  {t.breakdown.subtotal || 'Subtotal'}
                </td>
                <td className="py-1 px-2 text-center text-stone-700 dark:text-stone-300">
                  {tableSubtotalPieces} pcs
                </td>
                <td className="py-1 px-2 text-right text-stone-950 dark:text-white">
                  {formatCurrencyAmount(tableSubtotalAmount, country, true)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-breakdown-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-breakdown-content"
        className={`w-full ${effectiveIsTwoCol ? 'max-w-3xl' : 'max-w-lg'} bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[94vh] overflow-hidden transition-all duration-150`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{country.flag}</span>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                {title || t.breakdown.title || 'Cash Tally Slip'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {country.countryName} • {country.currencyCode} ({country.currencySymbol})
              </p>
            </div>
          </div>
          <button
            id="btn-close-breakdown"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable / Viewable Receipt Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 text-xs sm:text-sm font-sans">
          {/* Slip Container with Receipt Border */}
          <div
            id="printable-receipt-slip"
            className="p-3.5 sm:p-5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 font-mono"
          >
            {/* Receipt Header with App Name, Country, Title & Date */}
            <div className="text-center pb-2.5 mb-2.5 border-b border-dashed border-stone-300 dark:border-stone-700">
              {/* App Branding */}
              <div className="text-[13px] font-black tracking-wider text-stone-900 dark:text-white uppercase">
                CURRENCY COUNTER
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide">
                Cash & Coin Teller • 100% Offline
              </div>

              {/* Slip Title */}
              <div className="font-bold text-sm sm:text-base text-stone-900 dark:text-white mt-1.5 uppercase tracking-wide">
                {title || t.breakdown.title || 'CASH TALLY SLIP'}
              </div>

              {/* Country & Currency Details */}
              <div className="meta-box mt-2 py-1.5 px-2.5 bg-stone-100 dark:bg-stone-900/90 rounded border border-stone-200 dark:border-stone-800 text-left text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Country:</span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {country.countryName} {country.flag}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Currency:</span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {country.currencyCode} ({country.currencySymbol})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Date/Time:</span>
                    <span className="text-stone-800 dark:text-stone-200">
                      {currentDateTime}
                    </span>
                  </div>
                  {(department || employeeName) && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Staff / Dept:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {[employeeName, department].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remark */}
              {remark && (
                <div className="mt-1.5 text-[11px] font-sans italic text-amber-900 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-1.5 rounded border border-amber-200/50 dark:border-amber-900/40 text-left flex items-start gap-1">
                  <MessageSquareText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span>"{remark}"</span>
                </div>
              )}
            </div>

            {/* Denomination Rows and Columns Section */}
            {effectiveIsTwoCol ? (
              // 2-Column Side-by-Side Accounting Layout (Optimal for 1-Page Fit)
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.length > 0 && coins.length > 0 ? (
                  <>
                    <div>
                      {renderDenominationTable(
                        t.breakdown.banknotes || 'Banknotes',
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />,
                        notes,
                        totalNotePieces,
                        totalNoteAmount
                      )}
                    </div>
                    <div>
                      {renderDenominationTable(
                        t.breakdown.coins || 'Coins',
                        <Coins className="w-3.5 h-3.5 text-amber-500" />,
                        coins,
                        totalCoinPieces,
                        totalCoinAmount
                      )}
                    </div>
                  </>
                ) : notesCol2.length > 0 ? (
                  // Notes split into 2 columns
                  <>
                    <div>
                      {renderDenominationTable(
                        `${t.breakdown.banknotes || 'Banknotes'} (1)`,
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />,
                        notesCol1,
                        notesCol1Pieces,
                        notesCol1Amount
                      )}
                    </div>
                    <div>
                      {renderDenominationTable(
                        `${t.breakdown.banknotes || 'Banknotes'} (2)`,
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />,
                        notesCol2,
                        notesCol2Pieces,
                        notesCol2Amount
                      )}
                    </div>
                  </>
                ) : (
                  // Single set
                  <div className="sm:col-span-2">
                    {renderDenominationTable(
                      notes.length > 0 ? (t.breakdown.banknotes || 'Banknotes') : (t.breakdown.coins || 'Coins'),
                      notes.length > 0 ? <Banknote className="w-3.5 h-3.5 text-emerald-500" /> : <Coins className="w-3.5 h-3.5 text-amber-500" />,
                      notes.length > 0 ? notes : coins,
                      notes.length > 0 ? totalNotePieces : totalCoinPieces,
                      notes.length > 0 ? totalNoteAmount : totalCoinAmount
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Single-Column Structured Table Layout
              <div>
                {notes.length > 0 &&
                  renderDenominationTable(
                    t.breakdown.banknotes || 'Banknotes',
                    <Banknote className="w-3.5 h-3.5 text-emerald-500" />,
                    notes,
                    totalNotePieces,
                    totalNoteAmount
                  )}
                {coins.length > 0 &&
                  renderDenominationTable(
                    t.breakdown.coins || 'Coins',
                    <Coins className="w-3.5 h-3.5 text-amber-500" />,
                    coins,
                    totalCoinPieces,
                    totalCoinAmount
                  )}
              </div>
            )}

            {/* Grand Total Row */}
            <div className="mt-2.5 pt-2.5 border-t-2 border-stone-300 dark:border-stone-700 space-y-1 font-mono">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-medium">{t.breakdown.totalPieces || 'Total Pieces'}:</span>
                <span>
                  <strong className="font-bold text-stone-800 dark:text-stone-200">{totalPieces}</strong> ({totalNotes} {t.summary.notes || 'Notes'}, {totalCoins} {t.summary.coins || 'Coins'})
                </span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-black text-stone-950 dark:text-white">
                <span>{t.breakdown.grandTotal || 'Grand Total'}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-right">
                  {formatCurrencyAmount(totalAmount, country, true)}
                </span>
              </div>
            </div>

            {/* In Words */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-stone-300 dark:border-stone-700 font-sans text-xs">
              <span className="text-stone-400 font-medium block mb-0.5">{t.summary.inWords || 'In Words'}:</span>
              <p className="font-semibold text-stone-800 dark:text-stone-200 italic leading-relaxed">
                {amountInWords}
              </p>
            </div>

            {/* Cashier & Authorized Signature Lines (Standard for Bank / Audit Slip) */}
            <div className="mt-3 pt-3 border-t border-dashed border-stone-300 dark:border-stone-700 font-sans text-[11px] text-stone-600 dark:text-stone-400">
              <div className="grid grid-cols-2 gap-6 pt-3">
                <div className="text-center border-t border-stone-400 dark:border-stone-600 pt-1">
                  <span className="font-semibold">{t.breakdown.cashierSignature || 'Cashier / Teller Signature'}</span>
                </div>
                <div className="text-center border-t border-stone-400 dark:border-stone-600 pt-1">
                  <span className="font-semibold">{t.breakdown.authorizedSign || 'Authorized Verifier Signature'}</span>
                </div>
              </div>
            </div>

            {/* Receipt Slip Footer with App Name & Country */}
            <div className="mt-2.5 pt-2 border-t border-dashed border-stone-300 dark:border-stone-700 text-center text-[10px] text-stone-500 font-sans">
              <div className="font-semibold text-stone-800 dark:text-stone-200">
                Calculated via Currency Counter • 100% Offline • https://currency-counter.ai.studio
              </div>
              <div className="text-stone-500 mt-0.5">
                {country.countryName} {country.flag} • Official Cash Denomination Slip
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 flex items-center justify-between gap-2">
          <button
            id="btn-print-slip"
            onClick={handlePrint}
            title="Print Cash Tally Slip"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>{t.breakdown.printSlip || 'Print Slip'}</span>
          </button>

          <button
            id="btn-copy-slip"
            onClick={handleCopyText}
            className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{t.breakdown.copied || 'Copied Tally Slip!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.breakdown.copyText || 'Copy Tally Slip'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
