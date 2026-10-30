import React, { useState } from 'react';
import { MessageSquare, X, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { recordFeedbackPromptChoice } from '../utils/feedbackReminder';
import { checkForAppUpdates } from '../utils/appUpdate';
import { APP_VERSION } from '../utils/appVersion';

interface FeedbackPromptBannerProps {
  onOpenFeedback: () => void;
  onDismiss: () => void;
}

export const FeedbackPromptBanner: React.FC<FeedbackPromptBannerProps> = ({
  onOpenFeedback,
  onDismiss,
}) => {
  const [doNotRemind, setDoNotRemind] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const handleClose = () => {
    recordFeedbackPromptChoice(doNotRemind);
    onDismiss();
  };

  const handleOpenFeedback = () => {
    recordFeedbackPromptChoice(doNotRemind);
    onOpenFeedback();
    onDismiss();
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await checkForAppUpdates();
      setUpdateMessage(res.message);
      setTimeout(() => {
        setUpdateMessage(null);
      }, 4000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div
      role="alert"
      id="in-app-feedback-prompt"
      className="fixed bottom-24 sm:bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-45 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="p-4 rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md border border-amber-400/70 shadow-2xl space-y-3">
        {/* Header row with App Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5" title={`Currency Counter v${APP_VERSION}`}>
              <img
                src="/app-icon.png"
                alt="Currency Counter"
                className="w-10 h-10 rounded-xl object-cover border border-amber-400/80 shadow-md ring-1 ring-black/20"
              />
              <span
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-amber-500 text-stone-950 shadow-xs"
                title="Feedback"
              >
                <MessageSquare className="w-2.5 h-2.5" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 font-mono">
                  v{APP_VERSION}
                </span>
                <span className="text-[10px] text-stone-400">Feedback Request</span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight leading-snug mt-0.5">
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

        {/* Update Notification Banner Status (if triggered) */}
        {updateMessage && (
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="leading-tight">{updateMessage}</span>
          </div>
        )}

        {/* Checkbox: Do not remind me again & Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-stone-800">
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
              className="text-amber-400 focus:outline-none cursor-pointer"
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
            {/* Update App Button with Update Icon */}
            <button
              id="btn-notification-update-app"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              title={`Check & Update App (v${APP_VERSION})`}
              className="px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Update App</span>
              <span className="sm:hidden">Update</span>
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
