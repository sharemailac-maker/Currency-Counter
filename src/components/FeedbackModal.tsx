import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Check, ShieldCheck, Info } from 'lucide-react';
import { safeJsonParse } from '../utils/security';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingFeedback {
  id: string;
  name: string;
  topic: string;
  contactEmail: string;
  feedback: string;
  timestamp: string;
}

const STORAGE_KEY_FEEDBACK_QUEUE = 'offline_feedback_queue';

// Secure server-side proxy endpoint: developer email and API credentials are kept 100% on the server
const SECURE_FEEDBACK_ENDPOINT = '/api/feedback';

const FIXED_FEEDBACK_TOPIC = 'Suggestion/Feedback of Currency Counter app';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const topic = FIXED_FEEDBACK_TOPIC;
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'offline_queued'>('idle');

  // Listen for online events to automatically sync any queued offline feedback
  useEffect(() => {
    const handleOnline = async () => {
      try {
        const queue = safeJsonParse<PendingFeedback[]>(
          localStorage.getItem(STORAGE_KEY_FEEDBACK_QUEUE),
          [],
          (d) => Array.isArray(d)
        );
        if (queue.length === 0) return;

        const remainingQueue: PendingFeedback[] = [];
        for (const item of queue) {
          try {
            const res = await fetch(SECURE_FEEDBACK_ENDPOINT, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                name: item.name,
                contactEmail: item.contactEmail,
                topic: item.topic,
                feedback: item.feedback,
                timestamp: item.timestamp
              }),
            });
            if (!res.ok) remainingQueue.push(item);
          } catch {
            remainingQueue.push(item);
          }
        }
        if (remainingQueue.length > 0) {
          localStorage.setItem(STORAGE_KEY_FEEDBACK_QUEUE, JSON.stringify(remainingQueue));
        } else {
          localStorage.removeItem(STORAGE_KEY_FEEDBACK_QUEUE);
        }
      } catch {
        // Silently keep offline queue safe
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim() || !message.trim()) return;

    // Validate email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      return;
    }

    setSubmitting(true);

    const payload: PendingFeedback = {
      id: `fb-${Date.now()}`,
      name: name.trim(),
      topic,
      contactEmail: contactEmail.trim(),
      feedback: message.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(SECURE_FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          contactEmail: contactEmail.trim(),
          topic,
          feedback: message.trim(),
          timestamp: payload.timestamp
        }),
      });

      if (response.ok || response.status === 200) {
        setStatus('success');
        setName('');
        setContactEmail('');
        setMessage('');
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      // Offline fallback: store in local storage queue
      try {
        const queue = safeJsonParse<PendingFeedback[]>(
          localStorage.getItem(STORAGE_KEY_FEEDBACK_QUEUE),
          [],
          (d) => Array.isArray(d)
        );
        queue.push(payload);
        localStorage.setItem(STORAGE_KEY_FEEDBACK_QUEUE, JSON.stringify(queue.slice(0, 50)));
      } catch {
        // storage quota fallback
      }
      setStatus('offline_queued');
      setName('');
      setContactEmail('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStatus('idle');
    onClose();
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div
        id="modal-feedback-card"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Feedback & Suggestions
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Share your ideas, changes requested, or notes
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {status === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm">Feedback Sent Successfully!</span>
              </div>
              <p className="leading-relaxed">
                Thank you! Your feedback has been transmitted directly to the developer team.
              </p>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Send Another Note
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'offline_queued' && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="font-bold text-sm">Saved Offline</span>
              </div>
              <p>You appear to be offline. Your feedback is safely stored and will automatically transmit once your device reconnects to the internet.</p>
              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={handleResetAndClose}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-feedback-modal-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Topic (Fixed to Suggestion/Feedback of Currency Counter app) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Topic
                  </label>
                  <div
                    id="fixed-feedback-modal-topic"
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{FIXED_FEEDBACK_TOPIC}</span>
                  </div>
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Your Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-feedback-modal-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                  A valid email address is required so the team can reply to your inquiry.
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="input-feedback-modal-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your feedback, requested changes, or appreciation note..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Required Specific Disclaimer */}
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Disclaimer:</span> Developer will receive your feedback and suggestions but not necessarily take it seriously for any changes in the app.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-modal-feedback"
                  type="submit"
                  disabled={submitting || !name.trim() || !contactEmail.trim() || !message.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
