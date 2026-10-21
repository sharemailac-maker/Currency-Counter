import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { CountryCurrency } from '../types';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  country: CountryCurrency;
  totalPieces: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  country,
  totalPieces,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-reset-confirm-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-reset-confirm-content"
        className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 text-center animate-in zoom-in-95 duration-150 relative"
      >
        <button
          id="btn-close-reset-modal"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <RotateCcw className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-stone-900 dark:text-white">
          Reset Counter?
        </h3>

        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
          Clear all {totalPieces > 0 ? `${totalPieces} active items` : 'counts'} for{' '}
          <strong className="text-stone-800 dark:text-stone-200">
            {country.flag} {country.countryName} ({country.currencyCode})
          </strong>
          ? All denomination counters will be set to 0.
        </p>

        <div className="flex items-center gap-2 mt-5">
          <button
            id="btn-cancel-reset"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-reset"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
