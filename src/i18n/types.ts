export type LanguageCode = 
  | 'en' // English (Default)
  | 'hi' // हिन्दी (Hindi) - National / official lingua franca in India
  | 'gu' // ગુજરાતી (Gujarati)
  | 'mr' // मराठी (Marathi)
  | 'bn' // বাংলা (Bengali)
  | 'ta' // தமிழ் (Tamil)
  | 'te' // తెలుగు (Telugu)
  | 'kn' // ಕನ್ನಡ (Kannada)
  | 'pa' // ਪੰਜਾਬੀ (Punjabi)
  | 'es' // Español (Spanish)
  | 'fr' // Français (French)
  | 'ar'; // العربية (Arabic)

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  sizeKb: number;
  isRTL?: boolean;
}

export interface AppFunctionGuide {
  title: string;
  subtitle: string;
  overview: string;
  features: {
    name: string;
    description: string;
    tips: string[];
  }[];
  offlineNotice: string;
}

export interface TranslationDictionary {
  meta: {
    code: LanguageCode;
    name: string;
    nativeName: string;
    version: string;
  };
  common: {
    appName: string;
    appTagline: string;
    tellerTitle: string;
    cancel: string;
    confirm: string;
    close: string;
    save: string;
    reset: string;
    delete: string;
    clear: string;
    search: string;
    export: string;
    import: string;
    download: string;
    copy: string;
    share: string;
    print: string;
    total: string;
    amount: string;
    notes: string;
    coins: string;
    pieces: string;
    date: string;
    time: string;
    loading: string;
    all: string;
    success: string;
    error: string;
    active: string;
  };
  nav: {
    home: string;
    counter: string;
    history: string;
    conversion: string;
    settings: string;
  };
  header: {
    title: string;
    subtitle: string;
    earthMap: string;
    savedTallies: string;
    clearCounts: string;
    installApp: string;
    selectedCountry: string;
    viewOnEarth: string;
    language: string;
  };
  counter: {
    totalCashAmount: string;
    totalPiecesCount: string;
    amountInWords: string;
    allDenominations: string;
    notesOnly: string;
    coinsOnly: string;
    instantBundles: string;
    bundleNote: string;
    addCustomDenom: string;
    clearAll: string;
    subtotal: string;
    breakdownSlip: string;
    saveRecord: string;
    quickHelp: string;
    undoClear: string;
    undo: string;
    noteBadge: string;
    coinBadge: string;
  };
  summary: {
    totalValue: string;
    pieces: string;
    notes: string;
    coins: string;
    inWords: string;
    breakdown: string;
    save: string;
    reset: string;
  };
  breakdown: {
    title: string;
    subtitle: string;
    currency: string;
    cashierSignature: string;
    authorizedSign: string;
    printSlip: string;
    shareSlip: string;
    downloadText: string;
    copyText: string;
    copied: string;
    denomination: string;
    count: string;
    totalPieces: string;
    grandTotal: string;
    fitOnePage?: string;
    fitOnePageBadge?: string;
    fitOnePageDesc?: string;
    layoutMode?: string;
    autoLayout?: string;
    twoColumnLayout?: string;
    singleColumnLayout?: string;
    includeSignatures?: string;
    amount?: string;
    subtotal?: string;
    banknotes?: string;
    coins?: string;
  };
  saveDialog: {
    title: string;
    subtitle: string;
    tallyName: string;
    tallyNamePlaceholder: string;
    cashierName: string;
    cashierPlaceholder: string;
    department: string;
    remark: string;
    remarkPlaceholder: string;
    saveButton: string;
  };
  history: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allDates: string;
    allYears: string;
    totalRecords: string;
    grandSum: string;
    loadTally: string;
    deleteTally: string;
    clearAllTallies: string;
    noTalliesFound: string;
    date: string;
    preparedBy: string;
  };
  conversion: {
    title: string;
    subtitle: string;
    fromCurrency: string;
    toCurrency: string;
    amount: string;
    convertedResult: string;
    exchangeRate: string;
    customRate: string;
    useCustomRate: string;
    swapCurrencies: string;
    backToCounter: string;
    popularRates: string;
  };
  settings: {
    title: string;
    offlineHeader: string;
    offlineBadge: string;
    offlineDescription: string;
    audioHeader: string;
    audioLabel: string;
    audioDescription: string;
    enabled: string;
    muted: string;
    languageHeader: string;
    languageDescription: string;
    downloadPackBtn: string;
    downloadAllPacksBtn: string;
    importCustomPackBtn: string;
    downloadGuideBtn: string;
    languagePacksList: string;
    offlineReadyBadge: string;
    customCurrencyHeader: string;
    customCurrencyDesc: string;
    addCustomBtn: string;
    noCustomDenoms: string;
    createFirstCustom?: string;
    companyModeHeader: string;
    companyModeBadge: string;
    shareAppHeader: string;
    shareAppDesc: string;
    shareAppBtn: string;
    feedbackHeader: string;
    feedbackDesc: string;
    feedbackBtn: string;
    dataManagementHeader: string;
    dataManagementDesc: string;
    exportBackupBtn: string;
    importBackupBtn: string;
    resetCountsBtn: string;
    clearTalliesBtn: string;
    anonymousUserCount?: string;
    anonymousUserCountDesc?: string;
    totalHitsLabel?: string;
    deviceVisitsLabel?: string;
    privacyNotice?: string;
    updateAppHeader?: string;
    updateAppDesc?: string;
    updateAppBtn?: string;
    updateAppChecking?: string;
    updateAppLatest?: string;
  };
  guide: AppFunctionGuide;
}
