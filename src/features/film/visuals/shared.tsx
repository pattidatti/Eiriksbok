import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

import { formatTall } from './format';

/** Tall som teller opp fra null. */
export function TelleTall({
    verdi,
    varighet = 1.4,
    forsinkelse = 0,
}: {
    verdi: number;
    varighet?: number;
    forsinkelse?: number;
}) {
    const [vist, setVist] = useState(0);
    useEffect(() => {
        const c = animate(0, verdi, {
            duration: varighet,
            delay: forsinkelse,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (x) => setVist(Math.round(x)),
        });
        return () => c.stop();
    }, [verdi, varighet, forsinkelse]);
    return <>{formatTall(vist)}</>;
}

const TONER = {
    noytral: 'text-slate-900',
    rod: 'text-red-600',
    gronn: 'text-teal-600',
} as const;

/** Stort tall med etikett, på et hvitt kort. */
export function Teller({
    verdi,
    etikett,
    forsinkelse = 0,
    prefiks = '',
    tone = 'noytral',
}: {
    verdi: number;
    etikett: string;
    forsinkelse?: number;
    prefiks?: string;
    tone?: keyof typeof TONER;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 260, damping: 22 }}
            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center min-w-[9rem]"
        >
            <div className={`text-4xl md:text-5xl font-black tabular-nums ${TONER[tone]}`}>
                {prefiks}
                <TelleTall verdi={verdi} forsinkelse={forsinkelse} />
            </div>
            <div className="text-sm md:text-base font-semibold text-slate-500 mt-0.5">
                {etikett}
            </div>
        </motion.div>
    );
}
