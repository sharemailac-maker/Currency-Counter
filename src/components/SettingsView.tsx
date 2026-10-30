import React, { useState, useEffect, useRef } from 'react';
import { CountryCurrency, Denomination, SavedTally, ActiveCalculatorType, FinancialCalculatorType } from '../types';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Download, 
  Upload, 
  Coins, 
  Check, 
  Sparkles,
  ShieldCheck,
  Share2,
  MessageSquare,
  Heart,
  PlusCircle,
  Users,
  RefreshCw,
  Activity,
  Calculator,
  PiggyBank,
  TrendingUp,
  CalendarClock,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';
import { FeedbackModal } from './FeedbackModal';
import { ShareAppModal } from './ShareAppModal';
import { GiftFooter } from './GiftFooter';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { LanguageSettingsSection } from './LanguageSettingsSection';
import { useLanguage } from '../i18n/LanguageContext';
import { getCachedHitStats, fetchLatestHitCount, AnonymousHitStats } from '../utils/anonymousHitCounter';
import { 
  getActiveCalculator, 
  setActiveCalculator, 
  isCalculatorEnabled, 
  setCalculatorEnabled, 
  getSelectedCalculator, 
  setSelectedCalculator 
} from '../utils/calculatorSettings';
import { safeJsonParse, cleanPrototypePollution } from '../utils/security';
import { APP_VERSION } from '../utils/appVersion';
import { checkForAppUpdates, reloadAndApplyUpdate } from '../utils/appUpdate';

interface SettingsViewProps {
  soundEnabled: boolean;
  onToggleSound: (val: boolean) => void;
  selectedCountry: CountryCurrency;
  onOpenCountryModal: () => void;
  customDenominations: Record<string, Denomination[]>;
  onDeleteCustomDenomination: (countryId: string, denomId: string) => void;
  onOpenCustomDenomModal?: () => void;
  savedTallies: SavedTally[];
  onImportTallies: (imported: SavedTally[]) => void;
  onClearAllTallies: () => void;
  onResetActiveCounter: () => void;
  activeCalculator?: ActiveCalculatorType;
  onCalculatorChanged?: (calc: ActiveCalculatorType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  soundEnabled,
  onToggleSound,
  selectedCountry,
  onOpenCountryModal,
  customDenominations,
  onDeleteCustomDenomination,
  onOpenCustomDenomModal,
  savedTallies,
  onImportTallies,
  onClearAllTallies,
  onResetActiveCounter,
  activeCalculator: controlledCalculator,
  onCalculatorChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { t } = useLanguage();

  // Active Financial Calculator State (Permanently ON, change via V Drop-down)
  const [internalCalculator, setInternalCalculator] = useState<ActiveCalculatorType>(() => {
    const active = getActiveCalculator();
    return active !== 'none' ? active : 'fd';
  });
  const currentActiveCalc = controlledCalculator !== undefined && controlledCalculator !== 'none'
    ? controlledCalculator
    : internalCalculator;
  const selectedCalcType: FinancialCalculatorType = currentActiveCalc !== 'none' ? currentActiveCalc : 'fd';

  // Dropdown open states for collapsible sections
  const [isOtherCalcsDropdownOpen, setIsOtherCalcsDropdownOpen] = useState(false);
  const [isDataManagementDropdownOpen, setIsDataManagementDropdownOpen] = useState(false);

  const handleSelectCalculatorType = (calc: FinancialCalculatorType) => {
    setSelectedCalculator(calc);
    setCalculatorEnabled(true);
    setInternalCalculator(calc);
    setActiveCalculator(calc);
    onCalculatorChanged?.(calc);
  };

  // Anonymous user visit hit count state
  const [hitStats, setHitStats] = useState<AnonymousHitStats>(getCachedHitStats);
  const [isRefreshingHits, setIsRefreshingHits] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchLatestHitCount().then((stats) => {
      if (isMounted) setHitStats(stats);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshHits = async () => {
    setIsRefreshingHits(true);
    try {
      const updated = await fetchLatestHitCount();
      setHitStats(updated);
    } finally {
      setTimeout(() => setIsRefreshingHits(false), 500);
    }
  };

  // App Update State
  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false);
  const [appUpdateMessage, setAppUpdateMessage] = useState<string | null>(null);

  const handleUpdateApp = async () => {
    setIsCheckingAppUpdate(true);
    try {
      const res = await checkForAppUpdates();
      setAppUpdateMessage(res.message);
      setTimeout(() => {
        setAppUpdateMessage(null);
      }, 5000);
    } finally {
      setIsCheckingAppUpdate(false);
    }
  };

  // Modals state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      tallies: savedTallies,
      customDenominations,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `cash_counter_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup with strict validation and prototype pollution defense
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Defense: Reject oversized files to prevent memory exhaustion
    if (file.size > 5 * 1024 * 1024) {
      setImportStatus('File too large (max 5MB)');
      setTimeout(() => setImportStatus(null), 3000);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = safeJsonParse<any>(content, null);

        if (!parsed) {
          setImportStatus('Invalid or corrupt backup JSON');
          setTimeout(() => setImportStatus(null), 3000);
          return;
        }

        const rawList: unknown[] = Array.isArray(parsed.tallies)
          ? parsed.tallies
          : Array.isArray(parsed)
          ? parsed
          : [];

        // Validate each tally structure to ensure clean data
        const validatedTallies: SavedTally[] = rawList
          .filter((item): item is SavedTally => {
            if (!item || typeof item !== 'object') return false;
            const obj = item as Record<string, unknown>;
            return (
              typeof obj.id === 'string' &&
              typeof obj.countryId === 'string' &&
              typeof obj.totalAmount === 'number' &&
              !isNaN(obj.totalAmount) &&
              typeof obj.counts === 'object' &&
              obj.counts !== null
            );
          })
          .map((item) => cleanPrototypePollution(item));

        if (validatedTallies.length > 0) {
          onImportTallies(validatedTallies);
          setImportStatus(`Successfully restored ${validatedTallies.length} tallies!`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('No valid tally records found in file');
          setTimeout(() => setImportStatus(null), 3000);
        }
      } catch {
        setImportStatus('Error reading file safely');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // List of all custom denominations
  const customDenomsList = Object.entries(customDenominations).flatMap(([countryId, list]) =>
    ((list || []) as Denomination[]).map((d) => ({ countryId, denom: d }))
  );

  return (
    <div className="max-w-3xl w-full mx-auto px-3 sm:px-4 py-4 pb-28 text-stone-900 dark:text-stone-100 animate-in fade-in duration-200">
      {/* Header card with 100% Offline Narration Merged */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                {t.settings.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{t.settings.offlineBadge || '100% Offline'}</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              {t.settings.offlineDescription}
            </p>
          </div>
        </div>

        {/* Permanent Top-Right App Icon with Update App trigger */}
        <button
          type="button"
          onClick={handleUpdateApp}
          className="pl-2 border-l border-stone-200 dark:border-stone-800 ml-1 shrink-0 flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition active:scale-95 group self-start"
          title={`Currency Counter v${APP_VERSION} • Click to update app`}
        >
          <img
            src="/app-icon.png"
            alt="Currency Counter App Icon"
            className="w-8 h-8 rounded-lg object-cover border border-amber-400/60 shadow-xs ring-1 ring-black/10 group-hover:border-amber-400"
          />
        </button>
      </div>

      <div className="space-y-4">
        {/* Multi-Language Support & Language Packs (User Requested) */}
        <LanguageSettingsSection />

        {/* Audio / Tactile Feedback Settings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>{t.settings.audioHeader}</span>
          </h2>

          <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {t.settings.audioLabel}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {t.settings.audioDescription}
              </p>
            </div>

            <button
              id="btn-toggle-sound-settings"
              onClick={() => {
                const next = !soundEnabled;
                onToggleSound(next);
                if (next) playChimeSound(true);
              }}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                soundEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? t.settings.enabled : t.settings.muted}</span>
            </button>
          </div>
        </div>

        {/* Other Calculators for Conversion Section (Permanently ON with V Drop-down to Change) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Other Calculators
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    {selectedCalcType === 'fd' && <PiggyBank className="w-3.5 h-3.5" />}
                    {selectedCalcType === 'sip' && <TrendingUp className="w-3.5 h-3.5" />}
                    {selectedCalcType === 'rd' && <CalendarClock className="w-3.5 h-3.5" />}
                    {selectedCalcType === 'loan_emi' && <Calculator className="w-3.5 h-3.5" />}
                    <span>
                      {selectedCalcType === 'fd' && 'Fixed Deposit (FD)'}
                      {selectedCalcType === 'sip' && 'SIP Calculator'}
                      {selectedCalcType === 'rd' && 'Recurring Deposit (RD)'}
                      {selectedCalcType === 'loan_emi' && 'Loan EMI Calculator'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  Supplementary calculators for Conversion section (Currency converter is always active).
                </p>
              </div>
            </div>

            {/* "V" Drop-down toggle button matching Language Settings */}
            <button
              type="button"
              id="btn-other-calcs-dropdown"
              onClick={() => setIsOtherCalcsDropdownOpen((prev) => !prev)}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80"
              aria-expanded={isOtherCalcsDropdownOpen}
              title={isOtherCalcsDropdownOpen ? 'Collapse Calculator Options' : 'Change Active Calculator'}
            >
              <span className="text-xs font-semibold hidden sm:inline">
                {isOtherCalcsDropdownOpen ? 'Hide' : 'Change'}
              </span>
              {isOtherCalcsDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>

          {/* Collapsible Drop-down Content */}
          {isOtherCalcsDropdownOpen && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-0.5">
                <span>Select active calculator for Conversion section:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">1 active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'fd' as const,
                    title: 'Fixed Deposit (FD) Calculator',
                    desc: 'Simple or compounding interest (monthly, quarterly, half-yearly, yearly)',
                    icon: PiggyBank,
                  },
                  {
                    id: 'sip' as const,
                    title: 'SIP (Systematic Investment) Plan',
                    desc: 'Monthly SIP wealth compounding, expected return & wealth growth',
                    icon: TrendingUp,
                  },
                  {
                    id: 'rd' as const,
                    title: 'Recurring Deposit (RD) Calculator',
                    desc: 'Monthly RD deposit with simple or quarterly/annual compounding',
                    icon: CalendarClock,
                  },
                  {
                    id: 'loan_emi' as const,
                    title: 'Loan EMI Calculator',
                    desc: 'Reducing balance EMI or flat simple interest with copy & 1-page print',
                    icon: Calculator,
                  },
                ].map((calc) => {
                  const isSelected = selectedCalcType === calc.id;
                  const Icon = calc.icon;
                  return (
                    <button
                      key={calc.id}
                      type="button"
                      onClick={() => handleSelectCalculatorType(calc.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'bg-stone-50/80 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-950 dark:text-emerald-200' : 'text-stone-900 dark:text-white'
                          }`}>
                            {calc.title}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                          {calc.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add/Manage Custom Currency (User Requested) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                    {t.settings.customCurrencyHeader || 'Add/Manage Custom Currency'}
                  </h2>
                  {customDenomsList.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                      {customDenomsList.length} Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t.settings.customCurrencyDesc}
                </p>
              </div>
            </div>

            {onOpenCustomDenomModal && (
              <button
                id="btn-settings-add-custom-denom"
                onClick={onOpenCustomDenomModal}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.settings.addCustomBtn || 'Add/Manage Custom Currency'}</span>
              </button>
            )}
          </div>

          {customDenomsList.length === 0 ? (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-500 text-center border border-dashed border-stone-200 dark:border-stone-700">
              <span>{t.settings.noCustomDenoms || 'No custom currency or denominations added yet.'}</span>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
              {customDenomsList.map(({ countryId, denom }) => (
                <div key={`${countryId}-${denom.id}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {denom.label}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {denom.type}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ({countryId})
                    </span>
                  </div>

                  <button
                    id={`btn-delete-custom-${denom.id}`}
                    type="button"
                    onClick={() => {
                      setDeleteConfirmModal({
                        isOpen: true,
                        title: 'Delete Custom Currency?',
                        description: `Are you sure you want to delete custom denomination "${denom.label}" (${countryId})?`,
                        confirmLabel: 'Delete',
                        onConfirm: () => onDeleteCustomDenomination(countryId, denom.id),
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                    title="Delete custom denomination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share This App (Link is hidden, only button visible which opens modal with all options) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                {t.settings.shareAppHeader}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t.settings.shareAppDesc}
              </p>
            </div>
          </div>

          <button
            id="btn-share-app"
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.settings.shareAppBtn}</span>
          </button>
        </div>

        {/* Feedback & Suggestions (Pop-up Window Trigger) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                {t.settings.feedbackHeader}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t.settings.feedbackDesc}
              </p>
            </div>
          </div>

          <button
            id="btn-open-feedback-popup"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.settings.feedbackBtn}</span>
          </button>
        </div>

        {/* Update App & Version Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                  {t.settings.updateAppHeader || 'Update App'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {appUpdateMessage || (t.settings.updateAppDesc || 'Check for new features, currency additions, and offline cache updates')}
              </p>
            </div>
          </div>

          <button
            id="btn-update-app-settings"
            onClick={handleUpdateApp}
            disabled={isCheckingAppUpdate}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingAppUpdate ? 'animate-spin' : ''}`} />
            <span>
              {isCheckingAppUpdate
                ? (t.settings.updateAppChecking || 'Checking...')
                : (t.settings.updateAppBtn || 'Update App')}
            </span>
          </button>
        </div>

        {/* Data Management & Offline Backup (with V Drop-down) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  {t.settings.dataManagementHeader}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  {t.settings.dataManagementDesc}
                </p>
              </div>
            </div>

            {/* "V" Drop-down toggle button matching Language Settings */}
            <button
              type="button"
              id="btn-data-management-dropdown"
              onClick={() => setIsDataManagementDropdownOpen((prev) => !prev)}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80"
              aria-expanded={isDataManagementDropdownOpen}
              title={isDataManagementDropdownOpen ? 'Collapse Data Management' : 'Expand Data Management'}
            >
              <span className="text-xs font-semibold hidden sm:inline">
                {isDataManagementDropdownOpen ? 'Hide' : 'Manage'}
              </span>
              {isDataManagementDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>

          {/* Collapsible Drop-down Content */}
          {isDataManagementDropdownOpen && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3 animate-in fade-in duration-150">
              {importStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="btn-settings-export-json"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{t.settings.exportBackupBtn}</span>
                </button>

                <button
                  id="btn-settings-import-json"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{t.settings.importBackupBtn}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setDeleteConfirmModal({
                      isOpen: true,
                      title: 'Reset Counter Counts?',
                      description: `Are you sure you want to reset all active cash denomination counts for ${selectedCountry.countryName} to 0?`,
                      confirmLabel: 'Reset All',
                      onConfirm: onResetActiveCounter,
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  {t.settings.resetCountsBtn}
                </button>

                <button
                  onClick={() => {
                    setDeleteConfirmModal({
                      isOpen: true,
                      title: 'Clear All Saved Tallies?',
                      description: 'Are you sure you want to permanently clear all historical cash tallies across all dates, months, and years? This cannot be undone.',
                      confirmLabel: 'Clear All',
                      onConfirm: onClearAllTallies,
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  {t.settings.clearTalliesBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Total App Users/Visitors Counter (Moved to Last) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                {t.settings.anonymousUserCount || 'Total App Users/Visitors'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 dark:text-emerald-400">
              {hitStats.totalHits.toLocaleString()}
            </div>

            <button
              id="btn-refresh-anonymous-hits"
              onClick={handleRefreshHits}
              disabled={isRefreshingHits}
              title="Refresh total app users/visitors count"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingHits ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Footer: Gift from Yatinkumar Chauhan */}
        <GiftFooter />
      </div>

      {/* In-app action confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmModal.onConfirm}
        title={deleteConfirmModal.title}
        description={deleteConfirmModal.description}
        confirmLabel={deleteConfirmModal.confirmLabel}
      />

      {/* Pop-up Window for Feedback and Suggestions */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Pop-up Window for Share This App (where social media & copy link all options are visible) */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
