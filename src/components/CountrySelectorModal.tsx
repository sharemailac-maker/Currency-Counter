import React, { useState, useMemo } from 'react';
import { CountryCurrency } from '../types';
import { COUNTRIES } from '../data/currencies';
import { Search, X, Check, Globe } from 'lucide-react';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountryId: string;
  onSelectCountry: (country: CountryCurrency) => void;
}

const POPULAR_IDS = ['IN', 'US', 'EU', 'GB', 'RU', 'AE', 'SA', 'IL', 'CA', 'AU', 'JP', 'SG', 'CN', 'CH'];

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCountryId,
  onSelectCountry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

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
    }).sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [searchTerm]);

  const popularCountries = useMemo(() => {
    return COUNTRIES.filter((c) => POPULAR_IDS.includes(c.id)).sort((a, b) =>
      a.countryName.localeCompare(b.countryName)
    );
  }, []);

  if (!isOpen) return null;

  return (
    <div
      id="modal-country-selector-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-country-selector-content"
        className="w-full sm:max-w-lg bg-white dark:bg-stone-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                Select Country & Currency
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose your country to view authentic banknotes & coins
              </p>
            </div>
          </div>
          <button
            id="btn-close-country-modal"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Field */}
        <div className="p-3 bg-stone-50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-country"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by country, currency (e.g. Bharat, USD, INR)..."
              autoFocus
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Select Popular Chips */}
          {!searchTerm && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-stone-400 text-[11px] font-medium shrink-0 mr-0.5">
                Popular:
              </span>
              {popularCountries.map((c) => (
                <button
                  key={c.id}
                  id={`btn-quick-country-${c.id}`}
                  onClick={() => {
                    onSelectCountry(c);
                    onClose();
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
                    c.id === selectedCountryId
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.countryName.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Countries List */}
        <div className="overflow-y-auto flex-1 p-2 divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[60vh]">
          {filteredCountries.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              No matching countries found for "{searchTerm}".
            </div>
          ) : (
            filteredCountries.map((country) => {
              const isSelected = country.id === selectedCountryId;
              const notesCount = country.denominations.filter((d) => d.type === 'note').length;
              const coinsCount = country.denominations.filter((d) => d.type === 'coin').length;

              return (
                <button
                  key={country.id}
                  id={`country-item-${country.id}`}
                  onClick={() => {
                    onSelectCountry(country);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 leading-none">{country.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-900 dark:text-white text-sm truncate">
                          {country.countryName}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono font-medium">
                          {country.currencyCode} ({country.currencySymbol})
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {country.currencyName} • {notesCount} notes, {coinsCount} coins
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
