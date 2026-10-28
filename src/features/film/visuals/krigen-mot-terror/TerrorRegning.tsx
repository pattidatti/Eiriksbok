import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Regningen for krigene, tre felt som fylles ett per beat. Beat 0: pengebunker som stables
 * opp. Beat 1: mennesker som går ut av bildet, på flukt. Beat 2: en tidslinje fra 2001 til
 * 2021 som fylles. Feltet som leses nå lyser, de forrige dempes.
 */

const BUNKER = 14;
const FLYKTNINGER = 18;

export function TerrorRegning({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 to-amber-50 flex flex-col px-[4%] pt-[3%] pb-[3%]">
            <div className="self-center px-6 py-2 rounded-2xl shadow-xl bg-white font-display font-bold text-3xl text-slate-900">
                Hva kostet krigene?
            </div>
            <div className="flex-1 grid grid-cols-3 gap-5 mt-5">
                <Felt synlig={beat >= 0} naa={beat === 0}>
                    <Penger />
                    <Tall verdi={8000} enhet="milliarder dollar" tekst="brukte USA på krigene" />
                </Felt>
                <Felt synlig={beat >= 1} naa={beat === 1}>
                    <Flukt />
                    <Tall verdi={38} enhet="millioner mennesker" tekst="måtte flykte hjemmefra" />
                </Felt>
                <Felt synlig={beat >= 2} naa={beat === 2}>
                    <Tidslinje />
                    <Tall
                        verdi={20}
                        enhet="år i Afghanistan"
                        tekst="den lengste krigen i USAs historie"
                        omtrent={false}
                    />
                </Felt>
            </div>
        </div>
    );
}

function Felt({ synlig, naa, children }: { synlig: boolean; naa: boolean; children: ReactNode }) {
    if (!synlig) return <div />;
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: naa ? 1 : 0.55, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-3xl bg-white shadow-lg flex flex-col items-center justify-between px-4 pt-4 pb-5 ${
                naa ? 'ring-4 ring-slate-800/70' : ''
            }`}
        >
            {children}
        </motion.div>
    );
}

function Tall({
    verdi,
    enhet,
    tekst,
    omtrent = true,
}: {
    verdi: number;
    enhet: string;
    tekst: string;
    omtrent?: boolean;
}) {
    return (
        <div className="text-center">
            <div className="text-5xl font-black text-slate-900 tabular-nums">
                {omtrent && <span className="text-3xl text-slate-500">ca. </span>}
                <TelleTall verdi={verdi} forsinkelse={0.4} />
            </div>
            <div className="text-2xl font-bold text-slate-800 leading-tight">{enhet}</div>
            <div className="text-xl font-semibold text-slate-500 leading-snug mt-1">{tekst}</div>
        </div>
    );
}

/** Seddelbunker som stables opp nedenfra. */
function Penger() {
    return (
        <div className="relative" style={{ width: 200, height: 210 }}>
            {Array.from({ length: BUNKER }, (_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3 + i * 0.12,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="absolute rounded-md border-2 border-emerald-900/50"
                    style={{
                        left: 20 + (i % 2) * 12,
                        bottom: i * 14,
                        width: 150,
                        height: 14,
                        background: i % 2 ? '#15803d' : '#16a34a',
                    }}
                />
            ))}
        </div>
    );
}

/** Små mennesker som går ut av feltet mot høyre, rad for rad. */
function Flukt() {
    return (
        <div className="relative overflow-hidden" style={{ width: 240, height: 210 }}>
            {Array.from({ length: FLYKTNINGER }, (_, i) => {
                const rad = i % 3;
                const start = -30 - Math.floor(i / 3) * 42;
                return (
                    <motion.svg
                        key={i}
                        viewBox="0 0 20 40"
                        width={20}
                        height={40}
                        className="absolute"
                        style={{ top: 20 + rad * 62 }}
                        initial={{ x: start }}
                        animate={{ x: start + 300 }}
                        transition={{
                            duration: 7,
                            delay: 0.2 + rad * 0.3,
                            ease: 'linear',
                            repeat: Infinity,
                        }}
                    >
                        <circle cx={10} cy={6} r={5} fill="#475569" />
                        <rect x={4} y={13} width={12} height={16} rx={4} fill="#475569" />
                        <rect x={5} y={28} width={4} height={11} rx={2} fill="#475569" />
                        <rect x={11} y={28} width={4} height={11} rx={2} fill="#475569" />
                    </motion.svg>
                );
            })}
        </div>
    );
}

/** En linje fra 2001 til 2021 som fylles, med ett merke per år. */
function Tidslinje() {
    return (
        <div className="flex flex-col justify-center w-full px-2" style={{ height: 210 }}>
            <div className="relative h-8 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-amber-600"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.4, delay: 0.4, ease: 'easeInOut' }}
                />
                {Array.from({ length: 19 }, (_, i) => (
                    <div
                        key={i}
                        className="absolute inset-y-0 w-0.5 bg-white/70"
                        style={{ left: `${((i + 1) / 20) * 100}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-2 text-2xl font-black text-slate-700">
                <span>2001</span>
                <span>2021</span>
            </div>
        </div>
    );
}
