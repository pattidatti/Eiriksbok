import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../types';
import { formatTall } from './format';

interface Steg {
    fraBeat: number;
    total: number;
    farget: number;
    farge?: string;
    restFarge?: string;
    tittel: string;
    fargeEtikett?: string;
    restEtikett?: string;
}

interface Props {
    figur?: 'prikk' | 'person';
    steg: Steg[];
}

const PERSON =
    'M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-4 8h8a2 2 0 0 1 2 2v5h-2.5v7h-7v-7H6v-5a2 2 0 0 1 2-2Z';

/**
 * Ett merke per menneske (eller plass). Tellingen er ekte: 2200 prikker er 2200
 * mennesker. Stegene bytter hvor mange som vises og hvor mange som er farget.
 */
export function Prikkfelt({ beat, props }: VisualProps<Props>) {
    const steg = [...props.steg].reverse().find((s) => beat >= s.fraBeat) ?? props.steg[0];
    const maks = Math.max(...props.steg.map((s) => s.total), 1);
    const person = props.figur === 'person';

    // Rutenett i 16:9 som rommer det største steget.
    const { kol, rad } = useMemo(() => {
        const forhold = person ? 2.4 : 1.9;
        const kol = Math.ceil(Math.sqrt(maks * forhold));
        return { kol, rad: Math.ceil(maks / kol) };
    }, [maks, person]);

    const B = 1600;
    const H = 760;
    const celle = Math.min((B - 160) / kol, (H - 40) / rad);
    const x0 = (B - celle * kol) / 2;
    const y0 = 20 + (H - 40 - celle * rad) / 2;
    const r = celle * (person ? 0.46 : 0.36);

    const [montert, setMontert] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMontert(true), 50);
        return () => clearTimeout(t);
    }, []);
    const prikker = useMemo(() => Array.from({ length: maks }, (_, i) => i), [maks]);
    const rest = steg.total - steg.farget;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-sky-50 flex flex-col">
            <div className="h-[16%] flex items-end justify-center">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={steg.tittel}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-3xl md:text-5xl font-black text-slate-900 text-center px-4"
                    >
                        {steg.tittel}
                    </motion.h2>
                </AnimatePresence>
            </div>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="flex-1 w-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {prikker.map((i) => {
                    const cx = x0 + (i % kol) * celle + celle / 2;
                    const cy = y0 + Math.floor(i / kol) * celle + celle / 2;
                    const synlig = montert && i < steg.total;
                    const farget = montert && i < steg.farget;
                    const farge = farget
                        ? (steg.farge ?? '#2563eb')
                        : (steg.restFarge ?? '#cbd5e1');
                    const forsinkelse = Math.min(1.6, (i / Math.max(1, steg.total)) * 1.6);
                    const stil = {
                        opacity: synlig ? 1 : 0,
                        fill: farge,
                        transition: `opacity 400ms ease ${synlig ? forsinkelse : 0}s, fill 500ms ease ${forsinkelse * 0.6}s, transform 400ms ease`,
                        transformOrigin: `${cx}px ${cy}px`,
                        transform: synlig ? 'scale(1)' : 'scale(0.2)',
                    } as const;
                    return person ? (
                        <path
                            key={i}
                            d={PERSON}
                            transform={`translate(${cx - r} ${cy - r}) scale(${(r * 2) / 24})`}
                            style={{ ...stil, transform: undefined, transformOrigin: undefined }}
                            opacity={stil.opacity}
                        />
                    ) : (
                        <circle key={i} cx={cx} cy={cy} r={r} style={stil} />
                    );
                })}
            </svg>
            <div className="h-[14%] flex items-start justify-center gap-6 text-lg md:text-2xl font-bold">
                {steg.total > 0 && steg.farget > 0 && (
                    <Forklaring
                        farge={steg.farge ?? '#2563eb'}
                        tall={steg.farget}
                        tekst={steg.fargeEtikett}
                    />
                )}
                {rest > 0 && (
                    <Forklaring
                        farge={steg.restFarge ?? '#cbd5e1'}
                        tall={rest}
                        tekst={steg.restEtikett}
                    />
                )}
            </div>
        </div>
    );
}

function Forklaring({ farge, tall, tekst }: { farge: string; tall: number; tekst?: string }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow"
        >
            <span
                className="w-4 h-4 rounded-full"
                style={{ background: farge, transition: 'background 500ms' }}
            />
            <span className="tabular-nums text-slate-900">{formatTall(tall)}</span>
            {tekst && <span className="text-slate-500 font-semibold">{tekst}</span>}
        </motion.div>
    );
}
