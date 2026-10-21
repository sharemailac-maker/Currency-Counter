import React, { useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageCode } from '../i18n/types';
import { 
  Languages, 
  Download, 
  Upload, 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Package,
  BookOpen,
  X,
  AlertCircle
} from 'lucide-react';

export const LanguageSettingsSection: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    langMeta,
    supportedLanguages,
    downloadLanguagePack,
    downloadAllLanguagePacks,
    downloadAppGuide,
    importCustomLanguagePack,
    isCustomPackActive,
  } = useLanguage();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importCustomLanguagePack(content);
      showNotification(res.message, res.success ? 'success' : 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const indianLanguages = supportedLanguages.filter((l) => l.region.includes('India'));
  const globalLanguages = supportedLanguages.filter((l) => !l.region.includes('India'));

  return (
    <div
      id="section-language-settings"
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header with Title, Narration and "v" Drop-down toggle like Company/firm setup */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Languages className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              {t.settings.languageHeader || 'Multi-Language Support & Language Packs'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
              <span>{langMeta.flag}</span>
              <span>{langMeta.nativeName}</span>
              {isCustomPackActive && <span className="text-[9px] text-amber-600 dark:text-amber-400">(Custom)</span>}
            </span>
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 space-y-0.5 leading-tight">
            <p>Select national (Hindi & regional Indian languages) or global languages for instant offline use.</p>
            <p>Download offline language packs and app user guide for staff training without scrolling.</p>
          </div>
        </div>

        {/* "v" Drop-down toggle button matching Company/firm setup */}
        <button
          type="button"
          id="btn-language-setup-dropdown"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80"
          aria-expanded={isDropdownOpen}
          title={isDropdownOpen ? 'Collapse Language Settings' : 'Expand Language Settings'}
        >
          <span className="text-xs font-semibold hidden sm:inline">
            {isDropdownOpen ? 'Hide' : 'Configure'}
          </span>
          {isDropdownOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          )}
        </button>
      </div>

      {/* Collapsible Drop-down Content - Compact without unnecessary scrolling */}
      {isDropdownOpen && (
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in duration-150">
          {/* Language Dropdown Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
              <span>Choose App Language (भाषा चुनें):</span>
              <span className="text-[11px] font-normal text-stone-500">
                Active: {langMeta.nativeName} ({langMeta.name})
              </span>
            </label>
            <div className="relative">
              <select
                id="select-app-language"
                value={language}
                onChange={(e) => {
                  const newCode = e.target.value as LanguageCode;
                  setLanguage(newCode);
                  const selected = supportedLanguages.find((l) => l.code === newCode);
                  if (selected) {
                    showNotification(`Language switched to ${selected.nativeName} (${selected.name})`);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/90 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-10"
              >
                <optgroup label="── India National & Regional Languages ──">
                  {indianLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName} — {l.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Global / International Languages ──">
                  {globalLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName} — {l.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Offline Actions Grid - Compact & Highly Functional */}
          <div>
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Offline Language Packs & Guide (Download for Offline Usage)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Download Current Language Pack */}
              <button
                type="button"
                id="btn-download-active-pack"
                onClick={() => {
                  downloadLanguagePack(language);
                  showNotification(`Downloaded ${langMeta.name} Language Pack JSON for offline use`);
                }}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                      {langMeta.nativeName} Pack (.json)
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      Full translation for offline backup
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Save ↓
                </span>
              </button>

              {/* Download Offline App User Guide */}
              <button
                type="button"
                id="btn-download-app-guide"
                onClick={() => {
                  downloadAppGuide(language);
                  showNotification(`Downloaded App Guide in ${langMeta.nativeName}`);
                }}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                      App Function Guide (.txt)
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      Staff training & functions guide
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Save ↓
                </span>
              </button>

              {/* Download All 12 Language Packs */}
              <button
                type="button"
                id="btn-download-all-packs"
                onClick={() => {
                  downloadAllLanguagePacks();
                  showNotification('Downloaded all 12 language packs bundle');
                }}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                      All 12 Packs Bundle (.json)
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      Hindi, Gujarati, Marathi, Tamil, etc.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Save ↓
                </span>
              </button>

              {/* Import Custom Language Pack */}
              <button
                type="button"
                id="btn-import-custom-pack"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                      Import Custom Pack
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      Upload modified JSON dictionary
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Upload ↑
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
