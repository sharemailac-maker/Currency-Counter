import React from 'react';
import { 
  Globe2, 
  Calculator, 
  History, 
  ArrowLeftRight, 
  Settings 
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export type AppNavTab = 'home' | 'counter' | 'history' | 'conversion' | 'settings';

interface BottomNavBarProps {
  currentTab: AppNavTab;
  onChangeTab: (tab: AppNavTab) => void;
  activeCountsPieces?: number;
  savedTalliesCount?: number;
}

interface TabThemeConfig {
  activeText: string;
  activeBg: string;
  activeBorder: string;
  badgeBg: string;
  activeGlow: string;
  topAccent: string;
}

const TAB_THEMES: Record<AppNavTab, TabThemeConfig> = {
  // Saffron theme for Counter tab as requested
  counter: {
    activeText: 'text-orange-600 dark:text-orange-400 font-bold',
    activeBg: 'bg-orange-50 dark:bg-orange-950/60',
    activeBorder: 'border-orange-300 dark:border-orange-500/50',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-600',
    activeGlow: 'shadow-[0_0_14px_rgba(249,115,22,0.35)]',
    topAccent: 'from-amber-500 via-orange-500 to-amber-600',
  },
  // Light bright celestial cyan for Home/Globe tab
  home: {
    activeText: 'text-cyan-600 dark:text-cyan-400 font-bold',
    activeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
    activeBorder: 'border-cyan-300 dark:border-cyan-500/50',
    badgeBg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    activeGlow: 'shadow-[0_0_14px_rgba(6,182,212,0.35)]',
    topAccent: 'from-cyan-400 via-sky-500 to-blue-500',
  },
  // Light bright vibrant emerald for History tab
  history: {
    activeText: 'text-emerald-600 dark:text-emerald-400 font-bold',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    activeBorder: 'border-emerald-300 dark:border-emerald-500/50',
    badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    activeGlow: 'shadow-[0_0_14px_rgba(16,185,129,0.35)]',
    topAccent: 'from-emerald-400 via-teal-500 to-green-500',
  },
  // Light bright royal violet/purple for Conversion tab
  conversion: {
    activeText: 'text-purple-600 dark:text-purple-400 font-bold',
    activeBg: 'bg-purple-50 dark:bg-purple-950/60',
    activeBorder: 'border-purple-300 dark:border-purple-500/50',
    badgeBg: 'bg-gradient-to-r from-purple-500 to-fuchsia-600',
    activeGlow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]',
    topAccent: 'from-purple-400 via-fuchsia-500 to-indigo-500',
  },
  // Light bright warm rose/coral for Settings tab
  settings: {
    activeText: 'text-rose-600 dark:text-rose-400 font-bold',
    activeBg: 'bg-rose-50 dark:bg-rose-950/60',
    activeBorder: 'border-rose-300 dark:border-rose-500/50',
    badgeBg: 'bg-gradient-to-r from-rose-500 to-pink-600',
    activeGlow: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]',
    topAccent: 'from-rose-400 via-pink-500 to-amber-500',
  },
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onChangeTab,
  activeCountsPieces = 0,
  savedTalliesCount = 0,
}) => {
  const currentTheme = TAB_THEMES[currentTab] || TAB_THEMES.counter;
  const { t } = useLanguage();

  const navItems: { id: AppNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | null }[] = [
    {
      id: 'home',
      label: t.nav.home,
      icon: Globe2,
    },
    {
      id: 'counter',
      label: t.nav.counter,
      icon: Calculator,
      badge: activeCountsPieces > 0 ? activeCountsPieces : null,
    },
    {
      id: 'history',
      label: t.nav.history,
      icon: History,
      badge: savedTalliesCount > 0 ? savedTalliesCount : null,
    },
    {
      id: 'conversion',
      label: t.nav.conversion,
      icon: ArrowLeftRight,
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: Settings,
    },
  ];

  return (
    <nav
      id="bottom-app-navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200"
    >
      {/* Light bright dynamic ambient top accent line matching the current tab */}
      <div className={`h-[2.5px] w-full bg-gradient-to-r ${currentTheme.topAccent} transition-all duration-300`} />

      <div className="max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const itemTheme = TAB_THEMES[item.id];

          return (
            <button
              key={item.id}
              id={`btn-bottom-nav-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? `${itemTheme.activeText}`
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium'
              }`}
            >
              {/* Active subtle illuminated background pill with theme border and soft glow */}
              {isActive && (
                <div
                  className={`absolute inset-0 ${itemTheme.activeBg} border ${itemTheme.activeBorder} ${itemTheme.activeGlow} rounded-xl -z-10 transition-all duration-200`}
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-xs' : ''}`} />
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full ${
                      isActive ? itemTheme.badgeBg : 'bg-stone-600'
                    } text-white text-[10px] font-bold flex items-center justify-center shadow-xs`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-0.5 tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
