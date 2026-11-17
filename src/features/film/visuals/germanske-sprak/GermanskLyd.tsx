import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Lydene og ordene som flytter seg. To moduser:
 *  - forskyvning: den høytyske lydforskyvningen, regel for regel, med ord der bokstaven skifter
 *  - laneord:     ordene engelsk fikk fra de nordiske innbyggerne i Danelagen, hylle for hylle
 */

type Modus = 'forskyvning' | 'laneord';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLA = '#1d4ed8';
const ROD = '#dc2626';

export function GermanskLyd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'forskyvning';
    return (
        <Flate bakgrunn={modus === 'forskyvning' ? '#fff7ed' : '#f1f5f9'}>
            <div className="absolute inset-0" style={FONT}>
                {modus === 'forskyvning' ? <Forskyvning beat={beat} /> : <Laneord beat={beat} />}
            </div>
        </Flate>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    className,
    fra = 10,
}: {
    children: ReactNode;
    forsinkelse?: number;
    className?: string;
    fra?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: fra }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ---------- forskyvning ---------- */

interface Regel {
    fra: string;
    til: string;
    beat: number;
    eksempler: { gammel: string; ny: [string, string, string] }[];
}

/** `ny` er [før, den nye lyden, etter], så den nye lyden kan utheves. */
const REGLER: Regel[] = [
    {
        fra: 'p',
        til: 'pf / f',
        beat: 2,
        eksempler: [
            { gammel: 'pepper', ny: ['', 'Pf', 'effer'] },
            { gammel: 'skip', ny: ['Schi', 'ff', ''] },
        ],
    },
    {
        fra: 't',
        til: 'ts / ss',
        beat: 3,
        eksempler: [
            { gammel: 'water', ny: ['Wa', 'ss', 'er'] },
            { gammel: 'tid', ny: ['', 'Z', 'eit'] },
        ],
    },
    {
        fra: 'k',
        til: 'ch',
        beat: 4,
        eksempler: [{ gammel: 'maken', ny: ['ma', 'ch', 'en'] }],
    },
    {
        fra: 'd',
        til: 't',
        beat: 5,
        eksempler: [{ gammel: 'dag / day', ny: ['', 'T', 'ag'] }],
    },
];

function Forskyvning({ beat }: { beat: number }) {
    const aktiv = REGLER.find((r) => r.beat === beat);
    return (
        <>
            {/* Overskrift */}
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
                <div className="text-center">
                    <div className="text-4xl font-black text-stone-900">
                        Den høytyske lydforskyvningen
                    </div>
                    <div className="text-2xl font-bold text-stone-500" style={{ minHeight: 34 }}>
                        {beat >= 1
                            ? 'rundt år 600 til 800, etter et fast mønster'
                            : 'hvorfor høres tysk annerledes ut?'}
                    </div>
                </div>
            </div>

            {/* Reglene til venstre */}
            <div
                className="absolute flex flex-col gap-3"
                style={{ left: 40, top: 140, width: 330 }}
            >
                {REGLER.map((r) => {
                    const vist = beat >= 1 && (r.fra !== 'd' || beat >= 5);
                    const kjent = beat >= r.beat;
                    const naa = beat === r.beat;
                    if (!vist) return <div key={r.fra} style={{ height: 76 }} />;
                    return (
                        <Inn key={r.fra} fra={-20}>
                            <div
                                className="flex items-center gap-4 rounded-2xl px-5"
                                style={{
                                    height: 76,
                                    background: naa ? '#fee2e2' : '#ffffff',
                                    boxShadow: naa ? '0 0 0 4px #dc2626' : '0 4px 12px #0001',
                                    transition: 'all 0.5s',
                                }}
                            >
                                <span
                                    className="text-5xl font-black"
                                    style={{ color: BLA, width: 50 }}
                                >
                                    {r.fra}
                                </span>
                                <span className="text-4xl font-black text-stone-400">→</span>
                                <span
                                    className="text-4xl font-black"
                                    style={{ color: kjent ? ROD : '#cbd5e1' }}
                                >
                                    {kjent ? r.til : '?'}
                                </span>
                            </div>
                        </Inn>
                    );
                })}
            </div>

            {/* Eksemplene til høyre */}
            <div className="absolute" style={{ left: 410, top: 140, width: 560, height: 360 }}>
                <AnimatePresence mode="wait">
                    {beat === 0 && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center gap-4"
                        >
                            <div className="flex gap-6">
                                <Bok tekst="water" farge={BLA} />
                                <Bok tekst="Wasser" farge={ROD} />
                            </div>
                            <div className="text-3xl font-black text-stone-600">
                                samme ord, ny lyd
                            </div>
                        </motion.div>
                    )}
                    {beat === 1 && (
                        <motion.div
                            key="tid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center gap-5"
                        >
                            <div
                                className="relative"
                                style={{
                                    width: 460,
                                    height: 16,
                                    background: '#e7e5e4',
                                    borderRadius: 8,
                                }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 460 }}
                                    transition={{ duration: 2.2 }}
                                    style={{ height: 16, background: ROD, borderRadius: 8 }}
                                />
                            </div>
                            <div
                                className="flex justify-between text-4xl font-black text-stone-800"
                                style={{ width: 460 }}
                            >
                                <span>600</span>
                                <span>800</span>
                            </div>
                            <div className="text-3xl font-black text-stone-600">
                                noen lyder endret seg
                            </div>
                        </motion.div>
                    )}
                    {aktiv && (
                        <motion.div
                            key={aktiv.fra}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col justify-center gap-5"
                        >
                            {aktiv.eksempler.map((e, i) => (
                                <Eksempel key={e.gammel} e={e} forsinkelse={i * 0.8} />
                            ))}
                            {aktiv.fra === 'k' && (
                                <div className="text-2xl font-bold text-stone-500 text-center">
                                    nedertysk og høytysk, betyr «gjøre»
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

function Bok({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            className="px-6 py-3 rounded-2xl bg-white shadow-xl text-5xl font-black"
            style={{ color: farge }}
        >
            {tekst}
        </div>
    );
}

function Eksempel({ e, forsinkelse }: { e: Regel['eksempler'][number]; forsinkelse: number }) {
    return (
        <div className="flex items-center justify-center gap-5">
            <Inn forsinkelse={forsinkelse}>
                <div
                    className="px-5 py-2 rounded-2xl bg-white shadow-lg text-5xl font-black"
                    style={{ color: BLA, minWidth: 200, textAlign: 'center' }}
                >
                    {e.gammel}
                </div>
            </Inn>
            <Inn forsinkelse={forsinkelse + 0.5}>
                <span className="text-5xl font-black text-stone-400">→</span>
            </Inn>
            <Inn forsinkelse={forsinkelse + 0.7}>
                <div
                    className="px-5 py-2 rounded-2xl bg-white shadow-lg text-5xl font-black text-stone-800"
                    style={{ minWidth: 200, textAlign: 'center' }}
                >
                    <span>
                        {e.ny[0]}
                        <motion.span
                            initial={{ backgroundColor: '#fde68a00' }}
                            animate={{ backgroundColor: '#fde68a' }}
                            transition={{ delay: forsinkelse + 1.1, duration: 0.5 }}
                            style={{ color: ROD, borderRadius: 8 }}
                        >
                            {e.ny[1]}
                        </motion.span>
                        {e.ny[2]}
                    </span>
                </div>
            </Inn>
        </div>
    );
}

/* ---------- laneord ---------- */

interface Hylle {
    tittel: string;
    beat: number;
    ord: { en: string; no?: string }[];
}

const HYLLER: Hylle[] = [
    { tittel: 'Pronomen', beat: 0, ord: [{ en: 'they' }, { en: 'them' }, { en: 'their' }] },
    {
        tittel: 'Ting',
        beat: 2,
        ord: [
            { en: 'egg' },
            { en: 'sister', no: 'søster' },
            { en: 'skirt', no: 'skjørt' },
            { en: 'window', no: 'vindu' },
        ],
    },
    {
        tittel: 'Hvordan noe er',
        beat: 3,
        ord: [
            { en: 'ill' },
            { en: 'odd' },
            { en: 'rotten', no: 'råtten' },
            { en: 'weak', no: 'veik' },
        ],
    },
    {
        tittel: 'Ting du gjør',
        beat: 4,
        ord: [
            { en: 'call', no: 'kalle' },
            { en: 'cast', no: 'kaste' },
            { en: 'lift', no: 'løfte' },
            { en: 'take', no: 'ta' },
        ],
    },
];

function Laneord({ beat }: { beat: number }) {
    return (
        <>
            {/* Kilden til venstre: de nordiske innbyggerne i Danelagen */}
            <div
                className="absolute flex flex-col items-center justify-center"
                style={{ left: 24, top: 40, width: 190, height: 480 }}
            >
                <div className="rounded-2xl bg-blue-700 text-white text-center px-4 py-5 shadow-xl">
                    <div className="text-3xl font-black">norrønt</div>
                    <div className="text-lg font-bold text-blue-100">fra Danelagen</div>
                </div>
                <motion.div
                    key={beat}
                    initial={{ x: -10, opacity: 0.4 }}
                    animate={{ x: 10, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-6xl font-black text-blue-700 mt-4"
                >
                    →
                </motion.div>
            </div>

            {/* Hyllene til høyre: engelsk */}
            <div
                className="absolute flex flex-col gap-3"
                style={{ left: 240, top: 26, width: 740 }}
            >
                <div className="text-3xl font-black text-orange-700">engelsk fikk</div>
                {HYLLER.map((h, hi) => {
                    const vist = beat >= h.beat;
                    const pronomen = hi === 0;
                    const glod = (pronomen && beat === 1) || beat >= 5;
                    return (
                        <div
                            key={h.tittel}
                            className="rounded-2xl px-4 flex items-center gap-3"
                            style={{
                                height: pronomen ? 100 : 88,
                                background: vist ? '#ffffff' : '#e2e8f0',
                                boxShadow: glod ? '0 0 0 4px #f59e0b' : '0 4px 12px #0001',
                                transition: 'all 0.5s',
                            }}
                        >
                            <div
                                className="text-xl font-black text-slate-500"
                                style={{ width: 150 }}
                            >
                                {vist ? h.tittel : ''}
                            </div>
                            {vist &&
                                h.ord.map((o, i) => (
                                    <motion.div
                                        key={o.en}
                                        initial={{ x: -420, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{
                                            duration: 0.9,
                                            delay: i * 0.35,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        className="text-center"
                                        style={{ minWidth: 120 }}
                                    >
                                        <div
                                            className="font-black text-orange-700"
                                            style={{ fontSize: 40 }}
                                        >
                                            {o.en}
                                        </div>
                                        {o.no && (
                                            <div className="text-xl font-bold text-blue-700">
                                                {o.no}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                        </div>
                    );
                })}
                <div style={{ height: 40 }}>
                    {beat === 1 && (
                        <Inn className="text-3xl font-black text-amber-700 text-center">
                            Sjelden: et språk låner så små og viktige ord
                        </Inn>
                    )}
                    {beat >= 5 && (
                        <Inn className="text-3xl font-black text-stone-800 text-center">
                            Hverdagsord du bruker hele tiden
                        </Inn>
                    )}
                </div>
            </div>
        </>
    );
}
