import React, { useState } from 'react';
import { Denomination, CountryCurrency } from '../types';
import { formatCurrencyAmount } from '../utils/formatters';
import { Plus, Minus, X, Trash2, Coins, Banknote } from 'lucide-react';

interface DenominationRowProps {
  denomination: Denomination;
  country: CountryCurrency;
  count: number;
  onCountChange: (id: string, count: number) => void;
  onDeleteCustom?: (id: string) => void;
}

export const DenominationRow: React.FC<DenominationRowProps> = ({
  denomination,
  country,
  count,
  onCountChange,
  onDeleteCustom,
}) => {
  const [showQuickSteppers, setShowQuickSteppers] = useState(false);
  const subtotal = count * denomination.value;
  const isCounted = count > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // numbers only
    if (raw === '') {
      onCountChange(denomination.id, 0);
    } else {
      const val = parseInt(raw, 10);
      onCountChange(denomination.id, isNaN(val) ? 0 : Math.min(val, 999999));
    }
  };

  const handleIncrement = (amount: number) => {
    onCountChange(denomination.id, Math.min(count + amount, 999999));
  };

  const handleDecrement = (amount: number = 1) => {
    onCountChange(denomination.id, Math.max(0, count - amount));
  };

  // Denomination number with currency symbol (e.g. ₹500, $100, €50, 25¢)
  // Strips redundant suffix words like "Coin" or "Note" so only the clean value is shown
  const denomNumber = denomination.label
    .replace(/\s+(Coin|Note|Banknote)$/i, '')
    .trim();

  // Description below the denomination number (e.g. "Stone grey note", "12-sided bimetallic")
  const descriptionText =
    denomination.subtitle ||
    (denomination.type === 'note'
      ? `${country.currencyName} Banknote`
      : `${country.currencyName} Coin`);

  return (
    <div
      id={`denom-row-${denomination.id}`}
      className={`rounded-xl border transition-all ${
        isCounted
          ? 'bg-white dark:bg-stone-900 border-emerald-400 dark:border-emerald-600 shadow-xs ring-1 ring-emerald-400/20'
          : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      } py-2 px-2.5 sm:py-2.5 sm:px-3.5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        {/* Left: Note or Coin Symbol with Denomination Number and Description below */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Note or Coin Symbol */}
          {denomination.type === 'note' ? (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs select-none transition-colors relative ${
                denomination.colorBg || 'bg-emerald-50 dark:bg-emerald-950/40'
              } ${denomination.colorBorder || 'border-emerald-300 dark:border-emerald-800'}`}
              title="Banknote"
            >
              {/* Note Security Thread Representation */}
              <div className="absolute top-1 bottom-1 left-2 w-[1px] bg-stone-400/30 dark:bg-stone-600/40 border-dashed" />
              <Banknote
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  denomination.colorText || 'text-emerald-700 dark:text-emerald-300'
                }`}
              />
            </div>
          ) : (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-2xs select-none transition-colors ${
                denomination.colorBg || 'bg-amber-50 dark:bg-amber-950/40'
              } ${denomination.colorBorder || 'border-amber-400 dark:border-amber-600'}`}
              title="Coin"
            >
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            </div>
          )}

          {/* Denomination Number on top, Description below */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base tracking-tight">
                {denomNumber}
              </span>
              {denomination.status === 'rare' && (
                <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Rare
                </span>
              )}
              {denomination.isCustom && (
                <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Custom
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {descriptionText}
            </p>
          </div>
        </div>

        {/* Center & Right: Counter Controls and Subtotal */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Input & Quick Stepper */}
          <div className="flex items-center gap-1.5">
            {/* Minus Button */}
            <button
              id={`btn-minus-${denomination.id}`}
              onClick={() => handleDecrement(1)}
              disabled={count <= 0}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${
                count > 0
                  ? 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 active:scale-95'
                  : 'bg-stone-100 dark:bg-stone-800/40 text-stone-300 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed'
              }`}
              title="Decrease count by 1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Numeric Input Field */}
            <div className="relative">
              <input
                id={`input-count-${denomination.id}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={count === 0 ? '' : count}
                placeholder="0"
                onChange={handleInputChange}
                onFocus={(e) => e.target.select()}
                className={`w-20 sm:w-24 h-9 text-center font-mono font-bold text-base rounded-lg border focus:outline-hidden transition ${
                  isCounted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-extrabold ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:border-emerald-500'
                }`}
              />
              {count > 0 && (
                <button
                  id={`btn-clear-${denomination.id}`}
                  onClick={() => onCountChange(denomination.id, 0)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
                  title="Clear count"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Plus Button */}
            <button
              id={`btn-plus-${denomination.id}`}
              onClick={() => handleIncrement(1)}
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition active:scale-95 shadow-2xs"
              title="Increase count by 1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Quick Multi-Add Stepper Toggle */}
            <button
              id={`btn-stepper-toggle-${denomination.id}`}
              onClick={() => setShowQuickSteppers(!showQuickSteppers)}
              className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded border transition ${
                showQuickSteppers
                  ? 'bg-stone-800 text-white border-stone-700'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
              title="Toggle quick add buttons"
            >
              +N
            </button>
          </div>

          {/* Subtotal Display */}
          <div className="text-right min-w-[100px] sm:min-w-[120px]">
            <div className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-semibold">
              Subtotal
            </div>
            <div
              className={`font-mono font-bold text-sm sm:text-base tracking-tight ${
                isCounted
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-stone-400 dark:text-stone-600'
              }`}
            >
              {formatCurrencyAmount(subtotal, country, true)}
            </div>
          </div>

          {/* Delete custom denomination if applicable */}
          {denomination.isCustom && onDeleteCustom && (
            <button
              id={`btn-delete-custom-${denomination.id}`}
              onClick={() => onDeleteCustom(denomination.id)}
              className="p-1 text-rose-400 hover:text-rose-600 transition"
              title="Delete custom denomination"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Quick Steppers (+5, +10, +20, +50, +100) */}
      {showQuickSteppers && (
        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-end gap-1.5 text-xs animate-in slide-in-from-top-1 duration-150">
          <span className="text-[11px] text-stone-400 mr-1">Quick add:</span>
          {[2, 5, 10, 20, 50, 100].map((step) => (
            <button
              key={step}
              id={`btn-step-${denomination.id}-${step}`}
              onClick={() => handleIncrement(step)}
              className="px-2 py-1 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 dark:bg-stone-800 dark:hover:bg-emerald-950 dark:text-stone-300 dark:hover:text-emerald-300 rounded font-mono font-medium text-xs transition active:scale-95 border border-stone-200 dark:border-stone-700"
            >
              +{step}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
