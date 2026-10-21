import React, { useState } from 'react';
import { Denomination, CountryCurrency, DenominationType } from '../types';
import { X, Plus, Banknote, Coins } from 'lucide-react';

interface AddCustomDenominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryCurrency;
  onAddDenomination: (denomination: Denomination) => void;
}

export const AddCustomDenominationModal: React.FC<AddCustomDenominationModalProps> = ({
  isOpen,
  onClose,
  country,
  onAddDenomination,
}) => {
  const [type, setType] = useState<DenominationType>('note');
  const [value, setValue] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (!label || label.startsWith(country.currencySymbol)) {
      setLabel(`${country.currencySymbol}${val} ${type === 'note' ? 'Note' : 'Coin'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    const finalLabel = label.trim() || `${country.currencySymbol}${num} Custom`;
    const newDenom: Denomination = {
      id: `custom-${Date.now()}`,
      type,
      value: num,
      label: finalLabel,
      subtitle: `Custom ${type}`,
      isCustom: true,
      colorBg: type === 'note' ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-yellow-50 dark:bg-yellow-950/30',
      colorBorder: type === 'note' ? 'border-amber-400' : 'border-yellow-400',
      colorText: type === 'note' ? 'text-amber-900 dark:text-amber-200' : 'text-yellow-900 dark:text-yellow-200',
    };

    onAddDenomination(newDenom);
    setValue('');
    setLabel('');
    setError('');
    onClose();
  };

  return (
    <div
      id="modal-add-custom-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-add-custom-content"
        className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
      >
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 dark:text-white">
            Add Custom Denomination
          </h2>
          <button
            id="btn-close-custom-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Selector: Note vs Coin */}
          <div>
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 block mb-1.5">
              Denomination Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-type-note"
                onClick={() => setType('note')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition ${
                  type === 'note'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Banknote</span>
              </button>

              <button
                type="button"
                id="btn-type-coin"
                onClick={() => setType('coin')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border transition ${
                  type === 'coin'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Coin</span>
              </button>
            </div>
          </div>

          {/* Numeric Value */}
          <div>
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 block mb-1">
              Numeric Value ({country.currencySymbol})
            </label>
            <input
              id="input-custom-denom-value"
              type="number"
              step="any"
              min="0.001"
              value={value}
              onChange={handleValueChange}
              placeholder="e.g. 1000 or 0.25"
              autoFocus
              required
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          {/* Display Label */}
          <div>
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 block mb-1">
              Display Label (optional)
            </label>
            <input
              id="input-custom-denom-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`e.g. ${country.currencySymbol}${value || '1000'}`}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            id="btn-submit-custom-denom"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Currency List</span>
          </button>
        </form>
      </div>
    </div>
  );
};
