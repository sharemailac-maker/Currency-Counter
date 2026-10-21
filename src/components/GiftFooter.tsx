import React from 'react';
import { Heart } from 'lucide-react';

interface GiftFooterProps {
  className?: string;
}

export const GiftFooter: React.FC<GiftFooterProps> = ({ className = '' }) => {
  return (
    <div className={`mt-8 pt-4 pb-2 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-emerald-500/15 border border-amber-300/40 dark:border-amber-700/40 shadow-xs">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse shrink-0" />
        <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white tracking-wide">
          Gift from Yatinkumar Chauhan
        </span>
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse shrink-0" />
      </div>
      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 max-w-sm">
        Designed and created for fast, accurate offline cash denomination counting and teller reconciliation worldwide.
      </p>
    </div>
  );
};
