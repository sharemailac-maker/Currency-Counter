import React, { useState } from 'react';
import { MessageSquare, X, CheckSquare, Square } from 'lucide-react';
import { recordFeedbackPromptChoice } from '../utils/feedbackReminder';

interface FeedbackPromptBannerProps {
  onOpenFeedback: () => void;
  onDismiss: () => void;
}

export const FeedbackPromptBanner: React.FC<FeedbackPromptBannerProps> = ({
  onOpenFeedback,
  onDismiss,
}) => {
  const [doNotRemind, setDoNotRemind] = useState<boolean>(false);

  const handleClose = () => {
    recordFeedbackPromptChoice(doNotRemind);
    onDismiss();
  };

  const handleOpenFeedback = () => {
    recordFeedbackPromptChoice(doNotRemind);
    onOpenFeedback();
    onDismiss();
  };

  return (
    <div
      role="alert"
      id="in-app-feedback-prompt"
      className="fixed bottom-24 sm:bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-45 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="p-4 rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md border border-amber-400/70 shadow-2xl space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                Please share your suggestions/feedback to developer.
              </h4>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Your ideas help improve calculation tools, notes, and currency support for everyone.
              </p>
            </div>
          </div>

          <button
            id="btn-close-feedback-prompt"
            onClick={handleClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checkbox: Do not remind me again */}
        <div className="pt-1 flex items-center justify-between gap-3 flex-wrap border-t border-stone-800">
          <label
            htmlFor="cb-do-not-remind"
            onClick={() => setDoNotRemind(!doNotRemind)}
            className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-300 hover:text-stone-100 transition py-1"
          >
            <button
              type="button"
              id="cb-do-not-remind"
              aria-checked={doNotRemind}
              role="checkbox"
              className="text-amber-400 focus:outline-none"
            >
              {doNotRemind ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
            </button>
            <span className="text-[11px] sm:text-xs">Do not remind me again</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer font-medium"
            >
              Later
            </button>
            <button
              id="btn-action-share-feedback"
              onClick={handleOpenFeedback}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share Feedback</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
