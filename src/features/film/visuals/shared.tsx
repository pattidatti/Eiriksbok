import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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

/**
 * En fast tegneflate på 1000x562 px som skaleres til hele bildet. Lerretet er minst 1000 px
 * bredt, men kan være bredere. Uten skaleringen blir en DOM-visual med faste mål liggende i
 * øvre venstre hjørne. Tegn alt inni med vanlige px-mål for 1000x562.
 */
export function Flate({ children, bakgrunn }: { children: ReactNode; bakgrunn?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [mal, setMal] = useState({ skala: 1, x: 0, y: 0 });
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const maal = () => {
            const skala = Math.min(el.clientWidth / 1000, el.clientHeight / 562) || 1;
            // Midtstilt når bildet ikke har nøyaktig 16:9.
            setMal({ skala, x: (el.clientWidth - 1000 * skala) / 2, y: (el.clientHeight - 562 * skala) / 2 });
        };
        maal();
        const ro = new ResizeObserver(maal);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return (
        <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <div
                className="absolute origin-top-left"
                style={{
                    left: mal.x,
                    top: mal.y,
                    width: 1000,
                    height: 562,
                    transform: `scale(${mal.skala})`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
