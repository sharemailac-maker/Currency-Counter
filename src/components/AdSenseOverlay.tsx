import React, { useEffect, useRef, useState } from 'react';
import { X, WifiOff } from 'lucide-react';
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_SLOT_ID,
  canServeOnlineAds,
  loadAdSenseScript,
  pushAdSlot,
} from '../utils/adsense';

interface AdSenseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchOffline: () => void;
  autoCloseSeconds?: number;
}

export const AdSenseOverlay: React.FC<AdSenseOverlayProps> = ({
  isOpen,
  onClose,
  onSwitchOffline,
  autoCloseSeconds = 5,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(autoCloseSeconds);
  const pushedRef = useRef<boolean>(false);

  // Countdown timer: ticks down every second while overlay is open
  useEffect(() => {
    if (!isOpen) {
      pushedRef.current = false;
      setSecondsLeft(autoCloseSeconds);
      return;
    }

    setSecondsLeft(autoCloseSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoCloseSeconds]);

  // Auto-close once countdown reaches 0 so user resumes work seamlessly
  useEffect(() => {
    if (isOpen && secondsLeft <= 0) {
      onClose();
    }
  }, [isOpen, secondsLeft, onClose]);

  // Initialize AdSense slot once when overlay opens online
  useEffect(() => {
    if (!isOpen || pushedRef.current || !canServeOnlineAds()) return;
    pushedRef.current = true;
    loadAdSenseScript().then((loaded) => {
      if (loaded) {
        setTimeout(() => {
          pushAdSlot();
        }, 50);
      }
    });
  }, [isOpen]);

  // Renders nothing when closed — zero permanent ad space allocated in the app
  if (!isOpen) return null;

  return (
    <div
      id="adsense-transient-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sponsored Advertisement"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Top bar with auto-close countdown & immediate Close (X) button */}
        <div className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span className="uppercase tracking-wider text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200">
              Ad
            </span>
            <span className="font-mono text-[11px]">
              Resuming in {secondsLeft}s
            </span>
          </div>

          <button
            id="btn-close-ad-top"
            type="button"
            onClick={onClose}
            aria-label="Close advertisement"
            className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Transient Google AdSense Container */}
        <div className="p-4 flex items-center justify-center min-h-[250px] bg-stone-50 dark:bg-stone-950/60">
          <ins
            className="adsbygoogle block w-full min-h-[220px]"
            style={{ display: 'block', width: '100%', minHeight: '220px' }}
            data-ad-client={ADSENSE_CLIENT_ID}
            {...(ADSENSE_SLOT_ID ? { 'data-ad-slot': ADSENSE_SLOT_ID } : {})}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Bottom controls: instant Resume or Switch to Offline Mode */}
        <div className="px-4 py-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            id="btn-ad-use-offline"
            type="button"
            onClick={onSwitchOffline}
            className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <WifiOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Use Offline</span>
          </button>

          <button
            id="btn-ad-resume-work"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Resume Work
          </button>
        </div>
      </div>
    </div>
  );
};
