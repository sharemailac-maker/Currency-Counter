import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageMeta, TranslationDictionary } from './types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages';
import { TRANSLATIONS } from './translations';

const STORAGE_KEY_LANGUAGE = 'currency_counter_language_v1';
const STORAGE_KEY_CUSTOM_PACKS = 'currency_counter_custom_packs_v1';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: TranslationDictionary;
  langMeta: LanguageMeta;
  supportedLanguages: LanguageMeta[];
  downloadLanguagePack: (code?: LanguageCode) => void;
  downloadAllLanguagePacks: () => void;
  downloadAppGuide: (code?: LanguageCode) => void;
  importCustomLanguagePack: (jsonContent: string) => { success: boolean; message: string };
  isCustomPackActive: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customPacks, setCustomPacks] = useState<Record<string, TranslationDictionary>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_PACKS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE) as LanguageCode | null;
      if (saved && (TRANSLATIONS[saved] || customPacks[saved])) {
        return saved;
      }
    } catch {
      // ignore
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, code);
      // Set document direction for RTL (Arabic) or LTR
      const meta = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      if (meta?.isRTL) {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (meta?.isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [language]);

  const langMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = useMemo<TranslationDictionary>(() => {
    if (customPacks[language]) {
      return customPacks[language];
    }
    return TRANSLATIONS[language] || TRANSLATIONS.en;
  }, [language, customPacks]);

  // Download single language pack JSON
  const downloadLanguagePack = useCallback((code?: LanguageCode) => {
    const targetCode = code || language;
    const targetDict = customPacks[targetCode] || TRANSLATIONS[targetCode] || TRANSLATIONS.en;
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode) || langMeta;

    const exportPayload = {
      app: 'Currency Counter',
      version: '1.0',
      type: 'language_pack',
      languageCode: targetCode,
      languageName: meta.name,
      nativeName: meta.nativeName,
      region: meta.region,
      exportedAt: new Date().toISOString(),
      dictionary: targetDict,
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute('download', `currency_counter_lang_${targetCode}_${meta.name.toLowerCase()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [language, customPacks, langMeta]);

  // Download all language packs bundle JSON
  const downloadAllLanguagePacks = useCallback(() => {
    const allPacks: Record<string, unknown> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      allPacks[lang.code] = {
        meta: lang,
        dictionary: TRANSLATIONS[lang.code],
      };
    }

    const exportBundle = {
      app: 'Currency Counter',
      version: '1.0',
      type: 'all_language_packs_bundle',
      totalLanguages: SUPPORTED_LANGUAGES.length,
      exportedAt: new Date().toISOString(),
      languages: allPacks,
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute('download', `currency_counter_all_language_packs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  // Download User Guide in target language as formatted text
  const downloadAppGuide = useCallback((code?: LanguageCode) => {
    const targetCode = code || language;
    const targetDict = customPacks[targetCode] || TRANSLATIONS[targetCode] || TRANSLATIONS.en;
    const guide = targetDict.guide;

    let guideText = `=================================================================\n`;
    guideText += `${guide.title.toUpperCase()}\n`;
    guideText += `${guide.subtitle}\n`;
    guideText += `=================================================================\n\n`;
    guideText += `OVERVIEW / परिचय:\n${guide.overview}\n\n`;
    guideText += `-----------------------------------------------------------------\n`;
    guideText += `KEY FEATURES & HOW TO USE / मुख्य विशेषताएं और उपयोग विधि:\n`;
    guideText += `-----------------------------------------------------------------\n\n`;

    guide.features.forEach((feat, index) => {
      guideText += `[${index + 1}] ${feat.name}\n`;
      guideText += `${feat.description}\n`;
      guideText += `Tips / उपयोग युक्तियाँ:\n`;
      feat.tips.forEach((tip) => {
        guideText += `  • ${tip}\n`;
      });
      guideText += `\n`;
    });

    guideText += `=================================================================\n`;
    guideText += `OFFLINE & SECURITY / ऑफ़लाइन और सुरक्षा:\n`;
    guideText += `${guide.offlineNotice}\n`;
    guideText += `=================================================================\n`;
    guideText += `Currency Counter • 100% Client-Side Local Ledger\n`;

    const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `currency_counter_guide_${targetCode}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [language, customPacks]);

  // Import custom language pack
  const importCustomLanguagePack = useCallback((jsonContent: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonContent);
      let dict: TranslationDictionary | null = null;
      let code: LanguageCode | null = null;

      if (parsed.dictionary && parsed.languageCode) {
        dict = parsed.dictionary;
        code = parsed.languageCode;
      } else if (parsed.meta?.code && parsed.common && parsed.counter) {
        dict = parsed;
        code = parsed.meta.code;
      }

      if (!dict || !code) {
        return { success: false, message: 'Invalid language pack format. Missing dictionary or languageCode.' };
      }

      setCustomPacks((prev) => {
        const next = { ...prev, [code as string]: dict as TranslationDictionary };
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      setLanguage(code);
      return { success: true, message: `Successfully installed language pack for ${code.toUpperCase()}!` };
    } catch {
      return { success: false, message: 'Failed to parse JSON file. Please ensure valid JSON syntax.' };
    }
  }, [setLanguage]);

  const isCustomPackActive = Boolean(customPacks[language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        langMeta,
        supportedLanguages: SUPPORTED_LANGUAGES,
        downloadLanguagePack,
        downloadAllLanguagePacks,
        downloadAppGuide,
        importCustomLanguagePack,
        isCustomPackActive,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
