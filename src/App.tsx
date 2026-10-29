import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { COUNTRIES } from './data/currencies';
import { CountryCurrency, Denomination, DenominationCounts, SavedTally } from './types';
import { numberToWords } from './utils/numberToWords';
import { Header } from './components/Header';
import { DenominationRow } from './components/DenominationRow';
import { SummaryStickyBar } from './components/SummaryStickyBar';
import { CountrySelectorModal } from './components/CountrySelectorModal';
import { BreakdownModal } from './components/BreakdownModal';
import { SavedTalliesModal } from './components/SavedTalliesModal';
import { AddCustomDenominationModal } from './components/AddCustomDenominationModal';
import { SaveTallyDialog, SaveTallyFormData } from './components/SaveTallyDialog';
import { EarthGlobeLanding } from './components/EarthGlobeLanding';
import { BottomNavBar, AppNavTab } from './components/BottomNavBar';
import { HistoryView } from './components/HistoryView';
import { ConversionView } from './components/ConversionView';
import { SettingsView } from './components/SettingsView';
import { GiftFooter } from './components/GiftFooter';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Banknote, Coins, Layers, Undo2, ArrowLeftRight, FileText, Smartphone, X } from 'lucide-react';
import { playChimeSound, playTapSound } from './utils/audio';
import { usePWAInstall } from './hooks/usePWAInstall';
import { initAnalytics, trackScreenView } from './utils/analytics';
import { recordAnonymousVisit } from './utils/anonymousHitCounter';
import { getCompanyMode, setCompanyMode } from './utils/companyMode';
import { ActiveCalculatorType } from './types';
import { getActiveCalculator } from './utils/calculatorSettings';
import { safeJsonParse } from './utils/security';

const STORAGE_KEY_COUNTRY = 'currency_counter_country_id';
const STORAGE_KEY_COUNTS = 'currency_counter_counts_v1';
const STORAGE_KEY_CUSTOM_DENOMS = 'currency_counter_custom_denoms_v1';
const STORAGE_KEY_TALLIES = 'currency_counter_saved_tallies_v1';
const STORAGE_KEY_SOUND = 'currency_counter_sound_v1';

export default function App() {
  // Active Financial Calculator (FD, SIP, RD, Loan EMI)
  const [activeCalculator, setActiveCalculator] = useState<ActiveCalculatorType>(getActiveCalculator);

  // Company/Firm mode toggle state
  const [companyModeEnabled, setCompanyModeEnabled] = useState<boolean>(getCompanyMode);

  useEffect(() => {
    const onModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setCompanyModeEnabled(customEvent.detail.enabled);
      } else {
        setCompanyModeEnabled(getCompanyMode());
      }
    };
    window.addEventListener('company_mode_changed', onModeChange);
    return () => {
      window.removeEventListener('company_mode_changed', onModeChange);
    };
  }, []);

  const handleToggleCompanyMode = useCallback((enabled: boolean) => {
    setCompanyMode(enabled);
    setCompanyModeEnabled(enabled);
  }, []);

  // Current active navigation tab: 'home' | 'counter' | 'history' | 'conversion' | 'settings'
  const [currentTab, setCurrentTab] = useState<AppNavTab>('home');

  // PWA Offline Install Hook & Timed Prompt (insisting for installation when using via browser link)
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Only insist on installation if using through a web browser link (not standalone)
    const isDismissed = sessionStorage.getItem('pwa_install_prompt_dismissed');
    if (isInstalled || isDismissed) return;

    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  // Initialize privacy-friendly Google Analytics 4 & anonymous hit count
  useEffect(() => {
    initAnalytics();
    recordAnonymousVisit();
  }, []);

  // Track high-level view navigation (Counter, History, Conversion, Settings)
  useEffect(() => {
    trackScreenView(currentTab);
  }, [currentTab]);

  // 1. Country Selection (Default to Bharat / India, with all global list sorted alphabetically)
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrency>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_COUNTRY);
    if (savedId) {
      const match = COUNTRIES.find((c) => c.id === savedId);
      if (match) return match;
    }
    // Default is Bharat (India)
    return COUNTRIES.find((c) => c.id === 'IN') || COUNTRIES[0];
  });

  // Sound effects enabled preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? saved === 'true' : true;
  });

  // 2. Custom Denominations added by user (Hardened against tampering)
  const [customDenominations, setCustomDenominations] = useState<Record<string, Denomination[]>>(() => {
    return safeJsonParse<Record<string, Denomination[]>>(
      localStorage.getItem(STORAGE_KEY_CUSTOM_DENOMS),
      {}
    );
  });

  // 3. Counts for denominations (stored per country id)
  const [allCountryCounts, setAllCountryCounts] = useState<Record<string, DenominationCounts>>(() => {
    return safeJsonParse<Record<string, DenominationCounts>>(
      localStorage.getItem(STORAGE_KEY_COUNTS),
      {}
    );
  });

  // 4. Saved Tallies History (Date, Month, and Multi-Year organized)
  const [savedTallies, setSavedTallies] = useState<SavedTally[]>(() => {
    return safeJsonParse<SavedTally[]>(
      localStorage.getItem(STORAGE_KEY_TALLIES),
      [],
      (data) => Array.isArray(data)
    );
  });

  // Filter Tabs in Counter: 'all' | 'notes' | 'coins'
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'coins'>('all');

  // Modal States
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Generic in-app confirmation modal state for deletions
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  });

  // Selected Tally for receipt modal view
  const [receiptTally, setReceiptTally] = useState<SavedTally | null>(null);

  // Undo Clear State
  const [undoState, setUndoState] = useState<{
    counts: DenominationCounts;
    countryId: string;
  } | null>(null);

  // Save current country selection to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUNTRY, selectedCountry.id);
  }, [selectedCountry.id]);

  // Save counts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(allCountryCounts));
  }, [allCountryCounts]);

  // Save custom denoms to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOM_DENOMS, JSON.stringify(customDenominations));
  }, [customDenominations]);

  // Save tallies to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TALLIES, JSON.stringify(savedTallies));
  }, [savedTallies]);

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
  }, [soundEnabled]);

  // Current active denominations list (standard in-circulation only + user custom)
  // All delisted options are removed; only active in-circulation currencies exist.
  // All notes are listed first (highest to lowest), followed by all coins (highest to lowest)
  const activeDenominations = useMemo(() => {
    const customForCountry = customDenominations[selectedCountry.id] || [];
    const base = [...selectedCountry.denominations, ...customForCountry];
    const notesList = base.filter((d) => d.type === 'note').sort((a, b) => b.value - a.value);
    const coinsList = base.filter((d) => d.type === 'coin').sort((a, b) => b.value - a.value);
    return [...notesList, ...coinsList];
  }, [selectedCountry, customDenominations]);

  // Current counts for active country
  const currentCounts = useMemo(() => {
    return allCountryCounts[selectedCountry.id] || {};
  }, [allCountryCounts, selectedCountry.id]);

  // Update count for a denomination
  const handleCountChange = useCallback((id: string, count: number) => {
    setUndoState(null);
    playTapSound(soundEnabled);
    setAllCountryCounts((prev) => {
      const countryCounts = { ...(prev[selectedCountry.id] || {}) };
      if (count === 0) {
        delete countryCounts[id];
      } else {
        countryCounts[id] = count;
      }
      return {
        ...prev,
        [selectedCountry.id]: countryCounts,
      };
    });
  }, [selectedCountry.id, soundEnabled]);

  // Clear current country counts (opens elegant in-app confirmation modal)
  const handleReset = useCallback(() => {
    const currentCountryCounts = allCountryCounts[selectedCountry.id];
    const hasExistingPieces = Object.values(currentCountryCounts || {}).some((v) => Number(v) > 0);
    
    // If there are counts, open the confirmation dialog
    if (hasExistingPieces) {
      setIsResetModalOpen(true);
    } else {
      // If already 0 pieces, directly reset cleanly
      setAllCountryCounts((prev) => ({
        ...prev,
        [selectedCountry.id]: {},
      }));
    }
  }, [allCountryCounts, selectedCountry.id]);

  // Execute reset after confirmation
  const handleConfirmReset = useCallback(() => {
    const currentCountryCounts = allCountryCounts[selectedCountry.id];
    if (currentCountryCounts && Object.keys(currentCountryCounts).length > 0) {
      setUndoState({
        counts: { ...currentCountryCounts },
        countryId: selectedCountry.id,
      });
    }

    setAllCountryCounts((prev) => ({
      ...prev,
      [selectedCountry.id]: {},
    }));
  }, [allCountryCounts, selectedCountry.id]);

  // Undo Reset
  const handleUndo = useCallback(() => {
    if (undoState && undoState.countryId === selectedCountry.id) {
      setAllCountryCounts((prev) => ({
        ...prev,
        [selectedCountry.id]: undoState.counts,
      }));
      setUndoState(null);
    }
  }, [undoState, selectedCountry.id]);

  // Add custom denomination
  const handleAddCustomDenomination = useCallback((denom: Denomination) => {
    setCustomDenominations((prev) => ({
      ...prev,
      [selectedCountry.id]: [...(prev[selectedCountry.id] || []), denom],
    }));
  }, [selectedCountry.id]);

  // Delete custom denomination
  const handleDeleteCustomDenomination = useCallback((countryId: string, denomId: string) => {
    setCustomDenominations((prev) => ({
      ...prev,
      [countryId]: (prev[countryId] || []).filter((d) => d.id !== denomId),
    }));
    // Also remove count if any
    setAllCountryCounts((prev) => {
      const countryCounts = { ...(prev[countryId] || {}) };
      delete countryCounts[denomId];
      return {
        ...prev,
        [countryId]: countryCounts,
      };
    });
  }, []);

  // Calculations
  const notes = useMemo(() => activeDenominations.filter((d) => d.type === 'note'), [activeDenominations]);
  const coins = useMemo(() => activeDenominations.filter((d) => d.type === 'coin'), [activeDenominations]);

  const { totalAmount, totalNotes, totalCoins, totalPieces } = useMemo(() => {
    let amount = 0;
    let nCnt = 0;
    let cCnt = 0;

    activeDenominations.forEach((d) => {
      const c = currentCounts[d.id] || 0;
      if (c > 0) {
        amount += c * d.value;
        if (d.type === 'note') nCnt += c;
        else cCnt += c;
      }
    });

    return {
      totalAmount: Math.round((amount + Number.EPSILON) * 100) / 100,
      totalNotes: nCnt,
      totalCoins: cCnt,
      totalPieces: nCnt + cCnt,
    };
  }, [activeDenominations, currentCounts]);

  const amountInWords = useMemo(() => {
    return numberToWords(totalAmount, selectedCountry);
  }, [totalAmount, selectedCountry]);

  // Save current tally to history
  const handleConfirmSaveTally = useCallback(
    (data: string | SaveTallyFormData) => {
      playChimeSound(soundEnabled);
      const title = typeof data === 'string' ? data : data.title;
      const remark = typeof data === 'object' ? data.remark : undefined;
      const employeeName = typeof data === 'object' ? data.employeeName : undefined;
      const department = typeof data === 'object' ? data.department : undefined;

      const newTally: SavedTally = {
        id: `tally-${Date.now()}`,
        countryId: selectedCountry.id,
        countryName: selectedCountry.countryName,
        currencyCode: selectedCountry.currencyCode,
        currencySymbol: selectedCountry.currencySymbol,
        timestamp: Date.now(),
        title,
        remark,
        employeeName,
        department,
        counts: { ...currentCounts },
        totalAmount,
        totalNotes,
        totalCoins,
        totalPieces,
        amountInWords,
        notesSummary: `${totalPieces} pieces (${totalNotes} notes, ${totalCoins} coins)`,
      };

      setSavedTallies((prev) => [newTally, ...prev]);
    },
    [
      selectedCountry,
      currentCounts,
      totalAmount,
      totalNotes,
      totalCoins,
      totalPieces,
      amountInWords,
      soundEnabled,
    ]
  );

  // Load a saved tally and switch to Counter
  const handleLoadTally = useCallback((tally: SavedTally) => {
    const country = COUNTRIES.find((c) => c.id === tally.countryId);
    if (country) {
      setSelectedCountry(country);
    }
    setAllCountryCounts((prev) => ({
      ...prev,
      [tally.countryId]: { ...tally.counts },
    }));
    setCurrentTab('counter');
  }, []);

  // Delete a saved tally (with in-app confirmation modal)
  const handleDeleteTally = useCallback(
    (id: string) => {
      const target = savedTallies.find((t) => t.id === id);
      const label = target ? `"${target.title}"` : 'this record';
      setDeleteConfirmState({
        isOpen: true,
        title: 'Delete Saved Tally?',
        description: `Are you sure you want to delete ${label} from your saved historical cash tallies? This cannot be undone.`,
        confirmLabel: 'Delete',
        onConfirm: () => {
          setSavedTallies((prev) => prev.filter((t) => t.id !== id));
        },
      });
    },
    [savedTallies]
  );

  // Clear all tallies (with in-app confirmation modal)
  const handleClearAllTallies = useCallback(() => {
    if (savedTallies.length === 0) return;
    setDeleteConfirmState({
      isOpen: true,
      title: 'Clear All Historical Tallies?',
      description: `Are you sure you want to permanently delete all ${savedTallies.length} saved cash records across all dates, months, and years? This cannot be undone.`,
      confirmLabel: 'Clear All',
      onConfirm: () => {
        setSavedTallies([]);
      },
    });
  }, [savedTallies.length]);

  // Filtered denomination list for current active tab
  const displayedDenominations = useMemo(() => {
    if (activeTab === 'notes') return notes;
    if (activeTab === 'coins') return coins;
    return activeDenominations;
  }, [activeTab, notes, coins, activeDenominations]);

  const hasCounts = totalPieces > 0;

  // Handle country selection from Earth globe
  const handleSelectCountryFromEarth = useCallback((country: CountryCurrency) => {
    setSelectedCountry(country);
    setCurrentTab('counter');
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans">
      {/* Top Header & Country Switcher (Always accessible on Counter, History, Conversion, Settings) */}
      {currentTab !== 'home' && (
        <Header
          currentCountry={selectedCountry}
          onOpenCountryModal={() => setIsCountryModalOpen(true)}
          onOpenHistoryModal={() => setCurrentTab('history')}
          onOpenCustomDenomModal={() => setIsCustomModalOpen(true)}
          onBackToGlobe={() => setCurrentTab('home')}
          onReset={handleReset}
          hasActiveCounts={hasCounts}
          savedCountCount={savedTallies.length}
        />
      )}

      {/* Undo Notification Banner */}
      {undoState && currentTab === 'counter' && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top-2">
          <span>All counts were cleared.</span>
          <button
            id="btn-undo-clear"
            onClick={handleUndo}
            className="flex items-center gap-1 bg-stone-900 text-white px-2.5 py-1 rounded-md text-xs font-bold hover:bg-stone-800 transition active:scale-95"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Clear</span>
          </button>
        </div>
      )}

      {/* TAB 1: HOME (Interactive Circular Earth Globe & Alphabetical Country Launcher) */}
      {currentTab === 'home' && (
        <div className="pb-16 flex-1 flex flex-col">
          <EarthGlobeLanding
            selectedCountry={selectedCountry}
            onSelectCountryAndLaunch={handleSelectCountryFromEarth}
            onResumeCalculator={() => setCurrentTab('counter')}
            hasExistingCounts={hasCounts}
          />
        </div>
      )}

      {/* TAB 2: COUNTER (Cash Denomination Tally Counter - Legal Circulation Only) */}
      {currentTab === 'counter' && (
        <div className="flex-1 pb-44 animate-in fade-in duration-150">
          <main className="max-w-4xl w-full mx-auto px-3 sm:px-4 pt-4 flex-1">
            {/* Navigation / Segmented Tabs: All, Banknotes, Coins */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center p-1 bg-stone-200/80 dark:bg-stone-900 rounded-xl border border-stone-300 dark:border-stone-800 text-xs font-semibold">
                <button
                  id="tab-all-denominations"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All ({activeDenominations.length})</span>
                </button>

                <button
                  id="tab-notes-only"
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === 'notes'
                      ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Notes ({notes.length})</span>
                </button>

                <button
                  id="tab-coins-only"
                  onClick={() => setActiveTab('coins')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    activeTab === 'coins'
                      ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Coins ({coins.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('conversion')}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition flex items-center gap-1"
                  title="Convert this cash total to another currency"
                >
                  <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Convert</span>
                </button>

                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {hasCounts ? `${totalPieces} pcs` : '0 pcs'}
                </span>
              </div>
            </div>

            {/* Denominations List: All notes first, then all coins */}
            <div className="space-y-2.5">
              {activeTab === 'all' && notes.length > 0 && (
                <div className="flex items-center gap-2 pt-1 pb-0.5 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <Banknote className="w-4 h-4" />
                    <span>Banknotes ({notes.length})</span>
                  </div>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
                </div>
              )}

              {displayedDenominations.map((denom, idx) => {
                const isFirstCoinInAll =
                  activeTab === 'all' &&
                  denom.type === 'coin' &&
                  (idx === 0 || displayedDenominations[idx - 1]?.type === 'note');

                return (
                  <React.Fragment key={denom.id}>
                    {isFirstCoinInAll && (
                      <div className="flex items-center gap-2 pt-4 pb-0.5 px-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          <Coins className="w-4 h-4" />
                          <span>Coins ({coins.length})</span>
                        </div>
                        <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
                      </div>
                    )}
                    <DenominationRow
                      denomination={denom}
                      country={selectedCountry}
                      count={currentCounts[denom.id] || 0}
                      onCountChange={handleCountChange}
                      onDeleteCustom={
                        denom.isCustom
                          ? (id) => handleDeleteCustomDenomination(selectedCountry.id, id)
                          : undefined
                      }
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Quick Help Tip */}
            <div className="mt-8 mb-4 p-4 rounded-xl bg-stone-200/50 dark:bg-stone-900/50 border border-stone-300/60 dark:border-stone-800/80 text-center text-xs text-stone-500 dark:text-stone-400">
              <p>
                In-Circulation Cash Counter for <strong>{selectedCountry.countryName}</strong> • Tap <span className="font-mono font-bold">+N</span> for instant bundles • Tap <span className="font-bold">Slip / Share</span> to copy or print deposit slip.
              </p>
            </div>

            {/* Dedicated Footer: Gift from Yatinkumar Chauhan */}
            <GiftFooter className="mb-4" />
          </main>

          {/* Sticky Summary Bar (Positioned above bottom nav dock) */}
          <SummaryStickyBar
            country={selectedCountry}
            totalAmount={totalAmount}
            totalNotes={totalNotes}
            totalCoins={totalCoins}
            totalPieces={totalPieces}
            amountInWords={amountInWords}
            onOpenBreakdown={() => setIsBreakdownModalOpen(true)}
            onSaveTally={() => setIsSaveDialogOpen(true)}
            onReset={handleReset}
            hasCounts={hasCounts}
          />
        </div>
      )}

      {/* TAB 3: HISTORY (Date, Month, and Year-wise views for multi-year tracking) */}
      {currentTab === 'history' && (
        <div className="flex-1 pb-16">
          <HistoryView
            tallies={savedTallies}
            onLoadTally={handleLoadTally}
            onDeleteTally={handleDeleteTally}
            onClearAllTallies={handleClearAllTallies}
            onSelectReceiptTally={(tally) => setReceiptTally(tally)}
            allCountries={COUNTRIES}
            companyModeEnabled={companyModeEnabled}
          />
        </div>
      )}

      {/* TAB 4: CONVERSION (Currency Converter & Financial Calculators) */}
      {currentTab === 'conversion' && (
        <div className="flex-1 pb-16">
          <ConversionView
            currentCountry={selectedCountry}
            allCountries={COUNTRIES}
            counterTotalAmount={totalAmount}
            onNavigateToCounter={() => setCurrentTab('counter')}
            activeCalculator={activeCalculator}
            onNavigateToSettings={() => setCurrentTab('settings')}
          />
        </div>
      )}

      {/* TAB 5: SETTINGS (Audio feedback, custom denominations, financial calculator selection, backup) */}
      {currentTab === 'settings' && (
        <div className="flex-1 pb-16">
          <SettingsView
            soundEnabled={soundEnabled}
            onToggleSound={setSoundEnabled}
            selectedCountry={selectedCountry}
            onOpenCountryModal={() => setIsCountryModalOpen(true)}
            customDenominations={customDenominations}
            onDeleteCustomDenomination={handleDeleteCustomDenomination}
            onOpenCustomDenomModal={() => setIsCustomModalOpen(true)}
            savedTallies={savedTallies}
            onImportTallies={(imported) => setSavedTallies((prev) => [...imported, ...prev])}
            onClearAllTallies={handleClearAllTallies}
            onResetActiveCounter={handleReset}
            activeCalculator={activeCalculator}
            onCalculatorChanged={setActiveCalculator}
          />
        </div>
      )}

      {/* Bottom Navigation Dock (Home, Counter, History, Conversion, Settings) */}
      <BottomNavBar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          playTapSound(soundEnabled);
          setCurrentTab(tab);
        }}
        activeCountsPieces={totalPieces}
        savedTalliesCount={savedTallies.length}
      />

      {/* Country Selector Modal */}
      <CountrySelectorModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryId={selectedCountry.id}
        onSelectCountry={(c) => {
          setSelectedCountry(c);
          setUndoState(null);
        }}
      />

      {/* Breakdown / Deposit Slip Modal */}
      {isBreakdownModalOpen && (
        <BreakdownModal
          isOpen={true}
          onClose={() => setIsBreakdownModalOpen(false)}
          country={selectedCountry}
          denominations={activeDenominations}
          counts={currentCounts}
          totalAmount={totalAmount}
          totalNotes={totalNotes}
          totalCoins={totalCoins}
          totalPieces={totalPieces}
          amountInWords={amountInWords}
        />
      )}

      {/* Receipt Breakdown for a Historical Tally */}
      {receiptTally && (
        <BreakdownModal
          isOpen={true}
          onClose={() => setReceiptTally(null)}
          title={receiptTally.title}
          remark={receiptTally.remark}
          employeeName={receiptTally.employeeName}
          department={receiptTally.department}
          country={
            COUNTRIES.find((c) => c.id === receiptTally.countryId) || {
              ...selectedCountry,
              countryName: receiptTally.countryName,
              currencyCode: receiptTally.currencyCode,
              currencySymbol: receiptTally.currencySymbol,
            }
          }
          denominations={
            (COUNTRIES.find((c) => c.id === receiptTally.countryId)?.denominations || activeDenominations)
          }
          counts={receiptTally.counts}
          totalAmount={receiptTally.totalAmount}
          totalNotes={receiptTally.totalNotes}
          totalCoins={receiptTally.totalCoins}
          totalPieces={receiptTally.totalPieces}
          amountInWords={receiptTally.amountInWords}
        />
      )}

      {/* Saved Tallies Quick Modal (kept for legacy shortcuts) */}
      <SavedTalliesModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        tallies={savedTallies}
        onLoadTally={(t) => {
          handleLoadTally(t);
          setIsHistoryModalOpen(false);
        }}
        onDeleteTally={handleDeleteTally}
        onClearAllTallies={handleClearAllTallies}
      />

      {/* Add Custom Denomination Modal */}
      <AddCustomDenominationModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        country={selectedCountry}
        onAddDenomination={handleAddCustomDenomination}
      />

      {/* Save Tally Dialog */}
      <SaveTallyDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        country={selectedCountry}
        totalAmount={totalAmount}
        totalPieces={totalPieces}
        onConfirmSave={handleConfirmSaveTally}
        companyModeEnabled={companyModeEnabled}
      />

      {/* Reset Counter Confirmation Dialog (non-blocking in-app modal) */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        country={selectedCountry}
        totalPieces={totalPieces}
      />

      {/* Delete / Clear Action Confirmation Dialog (non-blocking in-app modal) */}
      <DeleteConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmState.onConfirm}
        title={deleteConfirmState.title}
        description={deleteConfirmState.description}
        confirmLabel={deleteConfirmState.confirmLabel}
      />

      {/* PWA Offline Install Timed Banner (Insisting for installation when accessing via link) */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl bg-stone-900/95 backdrop-blur-md border border-amber-400/60 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/app-icon.png"
                  alt="Currency Counter"
                  className="w-10 h-10 rounded-xl object-cover border border-amber-400/70 shadow-xs shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Install for Regular Offline Usage</h4>
                  <p className="text-[11px] text-stone-300 leading-snug mt-0.5">
                    You are accessing via browser link. Install this app to your device home screen for 100% offline cash counting anytime!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowInstallPrompt(false);
                  sessionStorage.setItem('pwa_install_prompt_dismissed', 'true');
                }}
                className="text-stone-400 hover:text-white p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Specific Instructions Accordion */}
            {showIOSInstructions && (
              <div className="mt-3 p-2.5 rounded-xl bg-stone-800/90 border border-stone-700 text-[11px] text-stone-200 space-y-1">
                <p className="font-bold text-amber-400">How to install on iOS Safari:</p>
                <p>1. Tap the <span className="font-semibold text-white">Share</span> icon (square with arrow ↑) in Safari.</p>
                <p>2. Scroll down and tap <span className="font-semibold text-white">&apos;Add to Home Screen&apos;</span>.</p>
                <p>3. Tap <span className="font-semibold text-white">&apos;Add&apos;</span> to launch 100% offline anytime.</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowInstallPrompt(false);
                  sessionStorage.setItem('pwa_install_prompt_dismissed', 'true');
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-300 hover:text-white hover:bg-stone-800 transition"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  if (isIOS) {
                    setShowIOSInstructions((prev) => !prev);
                  } else {
                    install();
                    setShowInstallPrompt(false);
                    sessionStorage.setItem('pwa_install_prompt_dismissed', 'true');
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isIOS ? (showIOSInstructions ? 'Hide Guide' : 'Install Guide') : 'Install App'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
