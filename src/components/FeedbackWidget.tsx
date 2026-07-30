import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getFirebase } from '../lib/firebaseLazy';
import { useSettings } from '../hooks/useSettings';

const RATE_LIMIT_MS = 60 * 1000; // 1 minute
const STORAGE_KEY = 'last_feedback_time';

export const FeedbackWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'rate_limited'>('idle');
    const { settings } = useSettings();

    // Check rate limit on mount and whenever modal opens
    useEffect(() => {
        if (isOpen) {
            checkRateLimit();
        }
    }, [isOpen]);

    const checkRateLimit = () => {
        const lastTime = localStorage.getItem(STORAGE_KEY);
        if (lastTime) {
            const diff = Date.now() - parseInt(lastTime);
            if (diff < RATE_LIMIT_MS) {
                setStatus('rate_limited');
                return false;
            }
        }
        if (status === 'rate_limited' || status === 'success') {
            setStatus('idle');
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        if (!checkRateLimit()) {
            setStatus('rate_limited');
            return;
        }

        setStatus('sending');

        try {
            // Firebase hentes først når eleven faktisk sender inn, ikke ved
            // montering. Widgeten ligger i Layout og lastes på hver sidevisning.
            const { db, ref, push, serverTimestamp } = await getFirebase();
            await push(ref(db, 'feedback'), {
                message: message.trim(),
                url: window.location.href,
                timestamp: serverTimestamp(),
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                userAgent: navigator.userAgent,
                dyslexicMode: settings.dyslexicMode,
                type: 'user_feedback'
            });

            // Set rate limit
            localStorage.setItem(STORAGE_KEY, Date.now().toString());

            setStatus('success');
            setMessage('');

            // Close after delay
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
            }, 2000);

        } catch (error) {
            console.error("Feedback error:", error);
            setStatus('error');
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none p-4"
                    >
                        {/* High Contrast Background: White in Light, Slate-900 in Dark */}
                        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-slate-200 dark:border-slate-800 overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                                    Tilbakemelding
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 bg-white dark:bg-slate-950">
                                {status === 'success' ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-8 text-center"
                                    >
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Takk for bidraget!</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Din tilbakemelding er sendt og blir lest.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="feedback-msg" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Melding
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    id="feedback-msg"
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Hva tenker du på? Fant du en feil? Forslag?"
                                                    className="w-full min-h-[120px] p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                                                    required
                                                    disabled={status === 'sending' || status === 'rate_limited'}
                                                />
                                            </div>
                                        </div>

                                        {/* Status Messages */}
                                        {status === 'rate_limited' && (
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                <p>Du sender meldinger litt for fort. Vennligst vent litt før du sender neste.</p>
                                            </div>
                                        )}

                                        {status === 'error' && (
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                <p>Noe gikk galt. Sjekk internettforbindelsen din og prøv igjen.</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsOpen(false)}
                                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                                            >
                                                Avbryt
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!message.trim() || status === 'sending' || status === 'rate_limited'}
                                                className="relative px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                {status === 'sending' ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Sender...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Send</span>
                                                        <Send size={16} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Footer / Context info (Subtle) */}
                            {status !== 'success' && (
                                <div className="px-6 py-3 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-text-muted">
                                    <span>Inkluderer automatisk sideinfo</span>
                                    <span className="opacity-50">Eiriksbok v0.1</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* Trigger Button - Renders inline in Header */}
            <button
                onClick={() => setIsOpen(true)}
                className="group relative p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-black/5"
                aria-label="Gi tilbakemelding"
                title="Gi tilbakemelding"
            >
                <div className="absolute inset-0 bg-blue-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                <MessageSquare size={20} className="relative z-10" />
            </button>

            {/* Modal - Rendered via Portal to escape Header stacking context */}
            {createPortal(modalContent, document.body)}
        </>
    );
};
