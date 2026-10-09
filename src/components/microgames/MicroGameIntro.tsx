import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Innflygingen fra artikkelen til spillet. Når eleven trykker «Spill», vokser
// plakaten fra kortets plass i artikkelen til hele skjermen - tittel og krok i
// stort, som en tittelskjerm. Imens lastes spillet og startes bak plakaten, så
// eleven aldri ser en tom ramme, en lastespinner eller 3D-scenen som hakker
// mens shaderne kompileres. Når spillet er klart, toner plakaten ut.
//
// Tegnes inne i omslaget som fyller vinduet (MicroGameBlock), så den ligger
// øverst over spillet.

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface MicroGameIntroProps {
    from: Rect | null;
    title: string;
    hook?: string;
    cover?: string;
    /** Spillet er montert. Plakaten står likevel en liten stund til, se MIN_MS. */
    ready: boolean;
    onDone: () => void;
}

/** Tittelskjermen skal få stå så lenge at den leses - men aldri holde eleven igjen. */
const MIN_MS = 1500;
/** Tid spillet får etter montering til å kompilere shadere og tegne første bilde. */
const SETTLE_MS = 700;

export function MicroGameIntro({ from, title, hook, cover, ready, onDone }: MicroGameIntroProps) {
    const reduce = useReducedMotion();
    const [born] = useState(() => performance.now());
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!ready || leaving) return;
        const wait = Math.max(SETTLE_MS, MIN_MS - (performance.now() - born));
        const t = window.setTimeout(() => setLeaving(true), wait);
        return () => window.clearTimeout(t);
    }, [ready, leaving, born]);

    const full = { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0 };
    const start = from && !reduce ? { ...from, borderRadius: 16 } : full;

    return (
        // Mørk bakgrunn dekker spillet med én gang (det monteres bak plakaten),
        // og plakaten vokser fra kortets plass oppå den.
        <motion.div
            data-mg-intro
            aria-hidden
            className="fixed inset-0 z-[90] bg-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            transition={leaving ? { duration: 0.45, ease: 'easeIn' } : { duration: 0.16 }}
            onAnimationComplete={() => {
                if (leaving) onDone();
            }}
        >
            <motion.div
                className="absolute overflow-hidden bg-slate-900"
                initial={start}
                animate={full}
                transition={{ type: 'spring', stiffness: 150, damping: 24, mass: 0.9 }}
            >
                {cover && (
                    <motion.img
                        src={cover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        initial={{ scale: 1.06 }}
                        animate={{ scale: 1.16 }}
                        transition={{ duration: 6, ease: 'linear' }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/25" />
                <motion.div
                    className="absolute inset-x-0 bottom-[14%] px-8 text-center"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: leaving ? 0 : 1, y: leaving ? -12 : 0 }}
                    transition={{ delay: leaving ? 0 : 0.25, duration: 0.5, ease: 'easeOut' }}
                >
                    <div className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white [text-wrap:balance] drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                        {title}
                    </div>
                    {hook && (
                        <div className="mx-auto mt-3 max-w-2xl text-lg sm:text-2xl font-semibold leading-snug text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                            {hook}
                        </div>
                    )}
                    {/* Lastestripe: fyller seg mens spillet gjøres klart, fullt når det er klart. */}
                    <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
                        <motion.div
                            className="h-full rounded-full bg-white"
                            initial={{ width: '8%' }}
                            animate={{ width: ready ? '100%' : '72%' }}
                            transition={{ duration: ready ? 0.4 : 2.4, ease: 'easeOut' }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
