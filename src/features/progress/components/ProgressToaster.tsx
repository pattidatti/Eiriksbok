// Globalt toast-lag for XP, nivå og badges. Ligger nede til høyre,
// spring-animert, og forsvinner av seg selv. Monteres i Layout så
// belønningen synes uansett hvor i appen eleven er.

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProgressToasts } from '../useProgressToasts';
import type { ProgressToast } from '../useProgressToasts';
import { TIER_LABELS } from '../badges';

const TOAST_DURATION_MS = 4000;

const ToastCard = ({ toast }: { toast: ProgressToast }) => {
    const dismiss = useProgressToasts((s) => s.dismiss);

    useEffect(() => {
        const timer = setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [toast.id, dismiss]);

    let content: React.ReactNode;
    if (toast.type === 'xp') {
        content = (
            <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                    <p className="font-display font-bold text-slate-900">+{toast.xp} XP</p>
                    {toast.title && (
                        <p className="text-xs text-slate-500 line-clamp-1">{toast.title}</p>
                    )}
                </div>
            </div>
        );
    } else if (toast.type === 'levelup') {
        content = (
            <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                    <p className="font-display font-bold text-slate-900">
                        Nivå {toast.level}!
                    </p>
                    <p className="text-xs text-slate-500">Du har gått opp et nivå</p>
                </div>
            </div>
        );
    } else if (toast.type === 'badge') {
        content = (
            <div className="flex items-center gap-3">
                <span className="text-2xl">{toast.badge.emoji}</span>
                <div>
                    <p className="font-display font-bold text-slate-900">
                        {toast.badge.title} ({TIER_LABELS[toast.tier]})
                    </p>
                    <p className="text-xs text-slate-500">Ny utmerkelse låst opp!</p>
                </div>
            </div>
        );
    } else {
        content = (
            <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                    <p className="font-display font-bold text-slate-900">
                        Vi har talt opp alt du har gjort: +{toast.xp} XP
                    </p>
                    <p className="text-xs text-slate-500">
                        {toast.badgeCount > 0
                            ? `${toast.badgeCount} utmerkelser venter på deg`
                            : 'Fremdriften din er med videre'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
            <Link
                to="/min-laering"
                onClick={() => dismiss(toast.id)}
                className="block bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow min-w-[220px]"
            >
                {content}
            </Link>
        </motion.div>
    );
};

export const ProgressToaster = () => {
    const toasts = useProgressToasts((s) => s.toasts);
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none [&>*]:pointer-events-auto">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    );
};
