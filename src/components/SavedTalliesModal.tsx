import React from 'react';
import { SavedTally } from '../types';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Clock, 
  Calendar, 
  FileCheck,
  Building2,
  User,
  MessageSquareText
} from 'lucide-react';

interface SavedTalliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tallies: SavedTally[];
  onLoadTally: (tally: SavedTally) => void;
  onDeleteTally: (id: string) => void;
  onClearAllTallies: () => void;
}

export const SavedTalliesModal: React.FC<SavedTalliesModalProps> = ({
  isOpen,
  onClose,
  tallies,
  onLoadTally,
  onDeleteTally,
  onClearAllTallies,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-saved-tallies-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-saved-tallies-content"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                Saved Cash Tallies
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Offline history saved on this device
              </p>
            </div>
          </div>
          <button
            id="btn-close-saved-tallies"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-stone-100 dark:divide-stone-800/60">
          {tallies.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">
              <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No saved tallies found</p>
              <p className="text-xs text-stone-500 mt-1">
                Save a cash count from the counter to view history and reload previous tallies anytime.
              </p>
            </div>
          ) : (
            tallies.map((tally) => {
              const dateStr = new Date(tally.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = new Date(tally.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={tally.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-snug">
                        {tally.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr} at {timeStr}</span>
                        </span>
                        {tally.department && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {tally.department}
                          </span>
                        )}
                        {tally.employeeName && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {tally.employeeName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {tally.currencySymbol} {tally.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {tally.totalPieces} pieces ({tally.totalNotes}n, {tally.totalCoins}c)
                      </div>
                    </div>
                  </div>

                  {tally.remark && (
                    <div className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-1">
                      <MessageSquareText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <span className="font-medium italic leading-relaxed">"{tally.remark}"</span>
                    </div>
                  )}

                  <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg italic line-clamp-1">
                    "{tally.amountInWords}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      id={`btn-delete-tally-${tally.id}`}
                      onClick={() => onDeleteTally(tally.id)}
                      className="px-2.5 py-1 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      id={`btn-load-tally-${tally.id}`}
                      onClick={() => {
                        onLoadTally(tally);
                        onClose();
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Load in Counter</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {tallies.length > 0 && (
          <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
            <span className="text-xs text-stone-500">
              Total {tallies.length} saved {tallies.length === 1 ? 'record' : 'records'}
            </span>
            <button
              id="btn-clear-all-tallies"
              onClick={onClearAllTallies}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition cursor-pointer"
            >
              Clear All Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
