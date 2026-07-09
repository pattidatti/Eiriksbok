// Globalt toast-lag for XP, nivå og badges. Ligger oppe til høyre rett
// under toppmenyen. XP-toasts teller opp gevinsten og flyr så som en
// glødende orb inn i «Min læring»-chipen; resten fader ut av seg selv.
// Monteres i Layout så belønningen synes uansett hvor i appen eleven er.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProgressToasts } from '../useProgressToasts';
import type { ProgressToast } from '../useProgressToasts';
import { useChipPulse } from '../useChipPulse';
import { TIER_LABELS } from '../badges';
import { useCountUp } from './useCountUp';
import { XpFlight } from './XpFlight';

const TOAST_DURATION_MS = 4000;
// XP-toasts vises kortere - de avsluttes med flyturen inn i chipen
const XP_FLY_DELAY_MS = 2200;

const CARD_CLASS =
    'block bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow min-w-[220px]';

type XpToast = Extract<ProgressToast, { type: 'xp' }>;

// XP-toast med eget livsløp: vis + tell opp, kollaps, fly inn i chipen.
// Uten chip i DOM (fullskjermssider) eller med redusert bevegelse faller
// den tilbake til vanlig fade-ut.
const XpToastCard = ({ toast }: { toast: XpToast }) => {
    const dismiss = useProgressToasts((s) => s.dismiss);
    const cardRef = useRef<HTMLDivElement>(null);
    const [flight, setFlight] = useState<{ from: DOMRect; to: DOMRect } | null>(null);
    const shownXp = useCountUp(toast.xp, 700, 300);

    useEffect(() => {
        const timer = setTimeout(() => {
            const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            const target = document.getElementById('progress-chip');
            const from = cardRef.current?.getBoundingClientRect();
            if (reduced || !target || !from) {
                dismiss(toast.id);
                return;
            }
            setFlight({ from, to: target.getBoundingClientRect() });
        }, XP_FLY_DELAY_MS);
        return () => clearTimeout(timer);
    }, [toast.id, dismiss]);

    const handleLand = () => {
        useChipPulse.getState().burst(toast.xp);
        dismiss(toast.id);
    };

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={flight ? { opacity: 0, scale: 0.3 } : { opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={
                flight
                    ? { duration: 0.2, ease: 'easeIn' }
                    : { type: 'spring', stiffness: 400, damping: 28 }
            }
            className={flight ? 'pointer-events-none' : undefined}
        >
            <Link to="/min-laering" onClick={() => dismiss(toast.id)} className={CARD_CLASS}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                        <p className="font-display font-bold text-slate-900">+{shownXp} XP</p>
                        {toast.title && (
                            <p className="text-xs text-slate-500 line-clamp-1">{toast.title}</p>
                        )}
                    </div>
                </div>
            </Link>
            {flight && <XpFlight from={flight.from} to={flight.to} onLand={handleLand} />}
        </motion.div>
    );
};

const StaticToastCard = ({ toast }: { toast: Exclude<ProgressToast, XpToast> }) => {
    const dismiss = useProgressToasts((s) => s.dismiss);

    useEffect(() => {
        const timer = setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [toast.id, dismiss]);

    let content: React.ReactNode;
    if (toast.type === 'levelup') {
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
    } else if (toast.type === 'info') {
        content = (
            <div className="flex items-center gap-3">
                <span className="text-2xl">{toast.emoji}</span>
                <div>
                    <p className="font-display font-bold text-slate-900">{toast.title}</p>
                    {toast.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1">{toast.subtitle}</p>
                    )}
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
            <Link to="/min-laering" onClick={() => dismiss(toast.id)} className={CARD_CLASS}>
                {content}
            </Link>
        </motion.div>
    );
};

export const ProgressToaster = () => {
    const toasts = useProgressToasts((s) => s.toasts);
    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none [&>*]:pointer-events-auto">
            <AnimatePresence>
                {toasts.map((toast) =>
                    toast.type === 'xp' ? (
                        <XpToastCard key={toast.id} toast={toast} />
                    ) : (
                        <StaticToastCard key={toast.id} toast={toast} />
                    )
                )}
            </AnimatePresence>
        </div>
    );
};
