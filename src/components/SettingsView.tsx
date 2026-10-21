import React, { useState, useEffect, useRef } from 'react';
import { CountryCurrency, Denomination, SavedTally } from '../types';
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
  Activity
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';
import { FeedbackModal } from './FeedbackModal';
import { ShareAppModal } from './ShareAppModal';
import { GiftFooter } from './GiftFooter';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { AccountingMasterManager } from './AccountingMasterManager';
import { LanguageSettingsSection } from './LanguageSettingsSection';
import { useLanguage } from '../i18n/LanguageContext';
import { getCachedHitStats, fetchLatestHitCount, AnonymousHitStats } from '../utils/anonymousHitCounter';

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
  companyModeEnabled: boolean;
  onToggleCompanyMode: (enabled: boolean) => void;
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
  companyModeEnabled,
  onToggleCompanyMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const { t } = useLanguage();

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

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.tallies)) {
          onImportTallies(parsed.tallies);
          setImportStatus(`Successfully restored ${parsed.tallies.length} tallies!`);
          setTimeout(() => setImportStatus(null), 3000);
        } else if (Array.isArray(parsed)) {
          onImportTallies(parsed);
          setImportStatus(`Successfully restored ${parsed.length} tallies!`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format');
          setTimeout(() => setImportStatus(null), 3000);
        }
      } catch {
        setImportStatus('Error reading file');
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
      {/* Header card (No narration as requested) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              {t.settings.title}
            </h1>
          </div>
        </div>

        {/* Permanent Top-Right App Icon */}
        <div className="pl-1.5 border-l border-stone-200 dark:border-stone-800 ml-1 shrink-0" title="Currency Counter">
          <img
            src="/app-icon.png"
            alt="Currency Counter"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-400/60 shadow-xs ring-1 ring-black/10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Multi-Language Support & Language Packs (User Requested) */}
        <LanguageSettingsSection />

        {/* Offline Operation & Security Guarantee */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                  {t.settings.offlineHeader}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {t.settings.offlineBadge}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                {t.settings.offlineDescription}
              </p>
            </div>
          </div>
        </div>

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

        {/* Company/Firm Set-up: 500+ Staff Directory, Excel Roster, and Dept Financial Analysis */}
        <AccountingMasterManager
          companyModeEnabled={companyModeEnabled}
          onToggleCompanyMode={onToggleCompanyMode}
        />

        {/* Custom Currency & Denominations Management */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>{t.settings.customCurrencyHeader} ({customDenomsList.length})</span>
            </h2>
            {onOpenCustomDenomModal && (
              <button
                id="btn-settings-add-custom-denom"
                onClick={onOpenCustomDenomModal}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.settings.addCustomBtn}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
            {t.settings.customCurrencyDesc}
          </p>

          {customDenomsList.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-500 text-center border border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center gap-2">
              <span>{t.settings.noCustomDenoms}</span>
              {onOpenCustomDenomModal && (
                <button
                  onClick={onOpenCustomDenomModal}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  {t.settings.createFirstCustom}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {customDenomsList.map(({ countryId, denom }) => (
                <div key={`${countryId}-${denom.id}`} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete custom denomination "${denom.label}" (${countryId})?`)) {
                        onDeleteCustomDenomination(countryId, denom.id);
                      }
                    }}
                    className="p-1.5 rounded text-stone-400 hover:text-rose-600 transition"
                    title="Delete custom denomination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

        {/* Anonymous User Count & Visit Hit Counter (User Requested) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                  {t.settings.anonymousUserCount || 'Anonymous User Count & Visits'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t.settings.anonymousUserCountDesc || 'Total anonymous visits to this app. Zero personal data collected — strictly counting anonymous hits whenever visitors open the app.'}
                </p>
              </div>
            </div>

            <button
              id="btn-refresh-anonymous-hits"
              onClick={handleRefreshHits}
              disabled={isRefreshingHits}
              title="Refresh hit counts"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingHits ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Total Hits Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                  {t.settings.totalHitsLabel || 'Total Anonymous Hits'}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 dark:text-white">
                {hitStats.totalHits.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <Activity className="w-3 h-3" />
                <span>Live aggregate visitor count</span>
              </div>
            </div>

            {/* Device Visits Card */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wide">
                  {t.settings.deviceVisitsLabel || 'Visits on This Device'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono font-bold">Local</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-stone-900 dark:text-white">
                {hitStats.deviceVisits.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                {hitStats.lastVisit ? `Last visited: ${new Date(hitStats.lastVisit).toLocaleDateString()}` : 'Current visit active'}
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {t.settings.privacyNotice || 'Strict Privacy: Zero personal data collected. No IP logging, no cookies, no advertising IDs, no personal identifiers. Only raw hit counts.'}
            </span>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t.settings.dataManagementHeader}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t.settings.dataManagementDesc}
          </p>

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
