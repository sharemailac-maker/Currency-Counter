import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send, Mail, Globe, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? (window.location.origin || window.location.href) : '';
  const shareTitle = 'Currency Counter - Fast Offline Cash Denomination Calculator';
  const shareText = 'Count cash denominations, calculate totals, convert currencies, and maintain ledgers 100% offline with Currency Counter:';

  const handleCopyLink = async () => {
    await copyToClipboard(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } catch {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      action: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${appUrl}`)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.814h.005c3.18 0 5.767-2.586 5.768-5.766 0-1.54-.599-2.988-1.688-4.077-1.09-1.088-2.537-1.723-4.085-1.723zm7.195 9.873c-.297.837-1.464 1.533-2.394 1.733-.637.137-1.472.247-4.269-.91-3.576-1.479-5.882-5.111-6.06-5.347-.179-.236-1.455-1.936-1.455-3.692 0-1.756.918-2.621 1.244-2.977.327-.356.712-.445.95-.445.237 0 .474.002.682.012.219.01.513-.083.803.613.297.712 1.01 2.463 1.099 2.641.089.178.148.386.03.623-.119.237-.178.386-.356.593-.178.208-.374.464-.534.623-.178.178-.364.372-.156.728.208.356.924 1.523 1.982 2.465 1.362 1.213 2.511 1.589 2.868 1.767.356.178.563.149.771-.089.208-.237.89-1.038 1.127-1.394.237-.356.475-.297.794-.178.319.119 2.022.953 2.37 1.127.348.174.58.261.666.409.086.148.086.861-.211 1.698z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      color: 'bg-sky-500 hover:bg-sky-600 text-white',
      textColor: 'text-sky-700 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      color: 'bg-stone-900 hover:bg-stone-800 text-white',
      textColor: 'text-stone-900 dark:text-stone-200',
      bgColor: 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Email',
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${appUrl}`)}`;
        window.location.href = url;
      },
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  return (
    <div
      id="share-app-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-share-app-card"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Share This App
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Share with colleagues, tellers, shopkeepers, or friends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Quick Copy Link Bar */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Copy Web App Link
            </label>
            <div className="flex items-center gap-2">
              <button
                id="btn-modal-copy-link"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 dark:text-emerald-400">Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-500" />
                    <span>Copy App Link</span>
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  id="btn-modal-system-share"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-98 cursor-pointer shrink-0 shadow-xs"
                  title="More device share options"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">More...</span>
                </button>
              )}
            </div>
          </div>

          {/* Social Media Channels Grid */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-2">
              Share via Social Media & Messaging
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {shareOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={opt.action}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs ${opt.bgColor}`}
                >
                  <div className={`p-2 rounded-lg ${opt.color} shrink-0`}>
                    {opt.icon}
                  </div>
                  <div className="text-left min-w-0">
                    <span className={`block text-xs font-bold truncate ${opt.textColor}`}>
                      {opt.name}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-0.5">
                      Share <ExternalLink className="w-2.5 h-2.5 inline" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
