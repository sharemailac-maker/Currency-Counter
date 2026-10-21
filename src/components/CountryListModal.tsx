import React, { useState, useMemo } from 'react';
import { CountryCurrency } from '../types';
import { COUNTRIES } from '../data/currencies';
import { Search, X, Check, Globe, ArrowRight, Banknote, Coins } from 'lucide-react';

interface CountryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountryId: string;
  onSelectCountry: (country: CountryCurrency, launchImmediately?: boolean) => void;
}

export const CountryListModal: React.FC<CountryListModalProps> = ({
  isOpen,
  onClose,
  selectedCountryId,
  onSelectCountry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Strictly all supported countries sorted alphabetically, filtered only by search query (no regions)
  const filteredCountries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return COUNTRIES;

    return COUNTRIES.filter((c) => {
      return (
        c.countryName.toLowerCase().includes(q) ||
        c.currencyName.toLowerCase().includes(q) ||
        c.currencyCode.toLowerCase().includes(q) ||
        c.currencySymbol.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-all-countries-list-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-all-countries-list-content"
        className="w-full max-w-xl bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between gap-3 bg-stone-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  Select Country
                </h2>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                Select any country to view on the 3D Earth ball or count cash
              </p>
            </div>
          </div>

          <button
            id="btn-close-all-countries-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 bg-stone-950/50 border-b border-stone-800">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-all-countries"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by country, currency (e.g. Bharat, USD, EUR, INR, ¥)..."
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 bg-stone-900/90 rounded-xl border border-stone-700 text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs p-1"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 px-1">
            <span>Showing {filteredCountries.length} of {COUNTRIES.length} countries</span>
            <span>Sorted Alphabetically</span>
          </div>
        </div>

        {/* Countries Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-800/80 p-2 sm:p-3 space-y-1">
          {filteredCountries.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs sm:text-sm">
              No matching country or currency found for &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = c.id === selectedCountryId;
              const notesCount = c.denominations.filter((d) => d.type === 'note').length;
              const coinsCount = c.denominations.filter((d) => d.type === 'coin').length;

              return (
                <div
                  key={c.id}
                  id={`country-list-item-${c.id}`}
                  onClick={() => {
                    onSelectCountry(c, false);
                    onClose();
                  }}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-950/40 border border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                      : 'hover:bg-stone-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl sm:text-3xl leading-none shrink-0">{c.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {c.countryName}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-emerald-400 font-semibold">
                          {c.currencyCode} ({c.currencySymbol})
                        </span>
                        <span>•</span>
                        <span className="truncate">{c.currencyName}</span>
                        <span>•</span>
                        <span className="text-stone-500 flex items-center gap-1">
                          <span>{notesCount}n</span>
                          <span>/</span>
                          <span>{coinsCount}c</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`btn-view-globe-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(c, false);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-stone-700 transition"
                      title="Center on Globe"
                    >
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Globe</span>
                    </button>

                    <button
                      id={`btn-count-cash-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(c, true);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                      title={`Count ${c.currencyCode} cash`}
                    >
                      <span>Count</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>{COUNTRIES.length} total legal tender currencies</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
