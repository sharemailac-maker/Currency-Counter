import React from 'react';
import { CountryCurrency } from '../types';
import { 
  ChevronDown, 
  RotateCcw, 
  History, 
  Download, 
  PlusCircle,
  Globe2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import { reloadAndApplyUpdate } from '../utils/appUpdate';

interface HeaderProps {
  currentCountry: CountryCurrency;
  onOpenCountryModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenCustomDenomModal: () => void;
  onBackToGlobe?: () => void;
  onReset: () => void;
  hasActiveCounts: boolean;
  savedCountCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentCountry,
  onOpenCountryModal,
  onOpenHistoryModal,
  onOpenCustomDenomModal,
  onBackToGlobe,
  onReset,
  hasActiveCounts,
  savedCountCount,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { t } = useLanguage();

  // Handle instant app update directly without redirecting to settings
  const handleInstantUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch {
      // Ignore offline error
    }
    reloadAndApplyUpdate();
  };

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#120626] via-[#1d0d47] to-[#0d0422] text-stone-100 shadow-xl border-b border-purple-500/30 relative overflow-hidden">
      {/* Fantastic Galaxy Nebula Glow & Stardust in Header */}
      <div className="absolute -top-6 left-1/5 w-64 h-20 bg-fuchsia-600/25 blur-2xl pointer-events-none" />
      <div className="absolute -top-6 right-1/4 w-64 h-20 bg-cyan-500/20 blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-10 w-32 h-12 bg-indigo-500/20 blur-xl pointer-events-none" />

      {/* Galaxy-like Stars Floating in Header Bar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <span className="absolute top-2 left-[12%] text-[9px] text-fuchsia-300/80 animate-twinkle-fast">✦</span>
        <span className="absolute bottom-2 left-[28%] text-[7px] text-cyan-200/70 animate-twinkle-medium">★</span>
        <span className="absolute top-1.5 left-[48%] text-[10px] text-amber-200/80 animate-twinkle-slow">✦</span>
        <span className="absolute bottom-2.5 left-[68%] text-[8px] text-purple-200/90 animate-twinkle-fast">✦</span>
        <span className="absolute top-2 right-[18%] text-[7px] text-cyan-300/80 animate-twinkle-medium">★</span>
        <span className="absolute bottom-1.5 right-[6%] text-[10px] text-fuchsia-200/75 animate-twinkle-slow">✦</span>
        <span className="absolute top-3 left-[82%] w-1 h-1 rounded-full bg-white/80 animate-twinkle-fast shadow-[0_0_4px_#fff]" />
        <span className="absolute bottom-3 left-[38%] w-1 h-1 rounded-full bg-cyan-300/90 animate-twinkle-medium shadow-[0_0_4px_#22d3ee]" />
      </div>

      {/* Top Banner with App Branding & Utilities */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Authentic App Icon Avatar */}
          <div className="relative shrink-0">
            <img
              src="/app-icon.png"
              alt="Bank Box"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-amber-400/60 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/30"
            />
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] font-black bg-stone-900/90 text-amber-300 border border-amber-500/50 shadow-xs">
              {currentCountry.currencySymbol}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base text-white tracking-tight leading-none truncate flex items-center gap-1.5">
                <span>{t.header.title}</span>
                <span className="text-[10px] text-amber-300/90 animate-twinkle-fast">✦</span>
              </h1>
            </div>
            <p className="text-xs text-purple-200/70 truncate mt-0.5">
              {currentCountry.countryName} • {t.header.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Back to Earth Globe button */}
          {onBackToGlobe && (
            <button
              id="btn-switch-to-earth-globe"
              onClick={onBackToGlobe}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs flex items-center gap-1.5 transition active:scale-95 border border-stone-700"
              title="Switch Country via Circular Earth World Map"
            >
              <Globe2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.header.earthMap}</span>
            </button>
          )}

          {/* History / Saved Tallies */}
          <button
            id="btn-open-saved-tallies"
            onClick={onOpenHistoryModal}
            className="relative p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition active:scale-95 border border-stone-700"
            title={t.header.savedTallies}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t.header.savedTallies}</span>
            {savedCountCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 ml-0.5">
                {savedCountCount}
              </span>
            )}
          </button>

          {/* Reset Current Count */}
          <button
            id="btn-reset-counter"
            onClick={onReset}
            disabled={!hasActiveCounts}
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition active:scale-95 border ${
              hasActiveCounts
                ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border-rose-800'
                : 'bg-stone-800/50 text-stone-500 border-stone-800 cursor-not-allowed'
            }`}
            title={t.header.clearCounts}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.header.clearCounts}</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              id="btn-install-pwa"
              onClick={install}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.header.installApp}</span>
            </button>
          )}

          {/* Permanent Top-Right App Icon - Instant App Update without redirecting to settings */}
          <div className="pl-1 border-l border-white/20 ml-0.5 shrink-0" title="Update App">
            <button
              id="btn-instant-app-update"
              onClick={handleInstantUpdate}
              className="flex items-center justify-center rounded-lg border border-amber-300/70 hover:border-amber-300 active:scale-95 transition cursor-pointer shadow-xs focus:outline-hidden"
              title="Update App"
              aria-label="Update app instantly"
            >
              <img
                src="/app-icon.png"
                alt="Update App"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-black/20"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Country Selection Button Bar */}
      <div className="bg-stone-800/90 border-t border-stone-700/60 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-300 font-medium">
              {t.header.selectedCountry}:
            </span>
            {onBackToGlobe && (
              <button
                onClick={onBackToGlobe}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                {t.header.viewOnEarth}
              </button>
            )}
          </div>

          <button
            id="btn-select-country"
            onClick={onOpenCountryModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-950 text-stone-100 text-sm font-semibold border border-stone-600 shadow-sm transition active:scale-98"
          >
            <span className="text-xl leading-none">{currentCountry.flag}</span>
            <span className="text-emerald-400 font-bold">{currentCountry.countryName}</span>
            <span className="text-stone-400 text-xs">({currentCountry.currencyCode} - {currentCountry.currencySymbol})</span>
            <ChevronDown className="w-4 h-4 text-stone-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
