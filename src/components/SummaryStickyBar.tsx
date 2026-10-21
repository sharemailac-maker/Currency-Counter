import React from 'react';
import { CountryCurrency } from '../types';
import { formatCurrencyAmount } from '../utils/formatters';
import { 
  FileText, 
  BookmarkCheck, 
  RotateCcw, 
  Banknote, 
  Coins
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SummaryStickyBarProps {
  country: CountryCurrency;
  totalAmount: number;
  totalNotes: number;
  totalCoins: number;
  totalPieces: number;
  amountInWords: string;
  onOpenBreakdown: () => void;
  onSaveTally: () => void;
  onReset: () => void;
  hasCounts: boolean;
}

export const SummaryStickyBar: React.FC<SummaryStickyBarProps> = ({
  country,
  totalAmount,
  totalNotes,
  totalCoins,
  totalPieces,
  amountInWords,
  onOpenBreakdown,
  onSaveTally,
  onReset,
  hasCounts,
}) => {
  const { t } = useLanguage();

  return (
    <div
      id="summary-sticky-bar"
      className="fixed bottom-[52px] sm:bottom-[54px] left-0 right-0 z-30 bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#f59e0b] text-white border-t border-amber-300/40 shadow-[0_-8px_30px_rgba(234,88,12,0.45)] relative overflow-hidden"
    >
      {/* Radiant Saffron Sheen & Stardust Highlights */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-200/90 to-transparent pointer-events-none" />
      <div className="absolute -top-10 left-1/4 w-48 h-20 bg-yellow-300/20 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-48 h-20 bg-orange-700/30 rounded-full blur-xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 relative z-10">
        {/* Direct Fully Visible Amount in Words Banner */}
        <div className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/20 text-xs text-amber-100 mb-1.5 backdrop-blur-xs">
          <span className="text-amber-300 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0 pt-0.5">
            {t.counter.amountInWords}:
          </span>
          <span className="text-white font-bold italic drop-shadow-xs text-xs sm:text-[13px] leading-relaxed break-words flex-1">
            {hasCounts ? amountInWords : 'Zero'}
          </span>
        </div>

        {/* Primary Row: Pieces Badge, Direct Visible Grand Total, Action Buttons */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Vintage App Icon + Saffron Grand Total */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <img
              src="/app-icon.png"
              alt="Bank Box"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border-2 border-amber-200/80 shadow-md ring-1 ring-black/20 hidden sm:block shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-amber-100 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-md text-[11px] border border-white/20 backdrop-blur-xs">
                  <span className="font-bold text-white">{totalPieces} {t.summary.pieces}</span>
                  <span className="text-amber-200/90 font-mono">
                    ({totalNotes}n + {totalCoins}c)
                  </span>
                </span>
              </div>

              {/* Saffron Grand Total Amount: Always directly visible, high contrast */}
              <div 
                id="counter-grand-total"
                className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-baseline gap-1 mt-0.5 drop-shadow-xs"
              >
                <span className="text-amber-200 text-lg font-black">{country.currencySymbol}</span>
                <span className="truncate">
                  {formatCurrencyAmount(totalAmount, country, false)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Clear, Save Tally, Slip / Share) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Clear Button */}
            {hasCounts && (
              <button
                id="btn-bottom-clear"
                onClick={onReset}
                className="p-2 sm:p-2.5 rounded-xl bg-black/30 hover:bg-black/45 text-white text-xs font-bold border border-white/25 active:scale-95 transition shadow-xs cursor-pointer"
                title={t.counter.clearAll}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Save Tally Button */}
            <button
              id="btn-save-tally"
              onClick={onSaveTally}
              disabled={!hasCounts}
              className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border ${
                hasCounts
                  ? 'bg-amber-950/70 hover:bg-amber-950 text-amber-100 hover:text-white border-amber-300/40 shadow-sm cursor-pointer'
                  : 'bg-black/20 text-amber-200/40 border-white/10 cursor-not-allowed'
              }`}
            >
              <BookmarkCheck className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">{t.summary.save}</span>
            </button>

            {/* Counting / Tally Slip Button */}
            <button
              id="btn-view-slip"
              onClick={onOpenBreakdown}
              disabled={!hasCounts}
              title="Generate Counting Slip / Tally Slip"
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                hasCounts
                  ? 'bg-stone-950 hover:bg-black text-amber-300 border border-amber-300/60 shadow-black/40 cursor-pointer'
                  : 'bg-black/25 text-amber-200/40 border-white/10 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.summary.breakdown}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
