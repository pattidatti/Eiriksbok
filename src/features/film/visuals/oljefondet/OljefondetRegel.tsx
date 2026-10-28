import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Building2, Landmark, PiggyBank, ShoppingCart, Users } from 'lucide-react';
import type { VisualProps } from '../../types';
import { OljefondetFlate } from './Flate';

/**
 * Tall og tid for oljefondet. Tre moduser:
 * - tid: bruke eller spare, fondet blir til (1990, 1996, 2006), og hvem som gjør hva.
 * - prosent: fondet som 100 ruter. 4 prosent, så 3, litt mer eller mindre, og 2,8 i 2026.
 * - bors: fallet i tredje kvartal 2026 og snittet på 6,78 prosent mot regelen på 3.
 */

type Modus = 'tid' | 'prosent' | 'bors';

const OVERSKRIFT: Record<Modus, string[]> = {
    tid: ['Bruke eller spare?', 'Et fond', 'Fondet blir til', 'Statens pensjonsfond utland', 'Hvem gjør hva?'],
    prosent: ['Grensen i 2001: 4 prosent', 'Fra 2017: 3 prosent', 'Ikke helt fast', 'Statsbudsjettet 2026', 'Hele statsbudsjettet 2026'],
    bors: ['Opp og ned med børsene', 'Juli til september 2026', 'Hvorfor fondet ble mindre verdt', 'I snitt hvert år siden 1998', 'Tjent i snitt mot brukt'],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                style={{ top: 24 }}
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

const inn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
};

// ---------- tid ----------

function Valg({ beat }: { beat: number }) {
    const spar = beat >= 1;
    return (
        <motion.div key="valg" {...inn} className="absolute inset-0">
            <div className="absolute flex flex-col items-center" style={{ left: 420, top: 110 }}>
                <div
                    className="rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xl font-black"
                    style={{ width: 150, height: 150, fontSize: 30 }}
                >
                    Olje-
                    <br />
                    penger
                </div>
            </div>
            <motion.div
                className="absolute flex flex-col items-center rounded-3xl bg-white shadow-xl"
                style={{ left: 90, top: 300, width: 300, padding: 20 }}
                animate={{ opacity: spar ? 0.35 : 1, scale: spar ? 0.92 : 1 }}
            >
                <ShoppingCart size={64} className="text-slate-700" />
                <div className="text-3xl font-black text-slate-900 mt-2">Bruke nå?</div>
            </motion.div>
            <motion.div
                className="absolute flex flex-col items-center rounded-3xl bg-white shadow-xl border-4"
                style={{ left: 610, top: 300, width: 300, padding: 20 }}
                animate={{ scale: spar ? 1.08 : 1, borderColor: spar ? '#0d9488' : '#ffffff' }}
            >
                <PiggyBank size={64} className="text-teal-600" />
                <div className="text-3xl font-black text-slate-900 mt-2">Spare?</div>
                {spar && (
                    <motion.div {...inn} transition={{ delay: 0.5 }} className="text-lg font-bold text-teal-700 text-center mt-1 leading-snug">
                        Et fond: en stor pott penger satt av til et bestemt formål
                    </motion.div>
                )}
            </motion.div>
            <svg className="absolute inset-0" width={1000} height={562}>
                <path d="M 450 250 Q 330 270 260 300" stroke={spar ? '#cbd5e1' : '#64748b'} strokeWidth={6} fill="none" />
                <path d="M 550 250 Q 670 270 750 300" stroke={spar ? '#0d9488' : '#64748b'} strokeWidth={spar ? 10 : 6} fill="none" />
            </svg>
        </motion.div>
    );
}

const AAR = [
    { aar: '1990', tekst: 'Loven vedtas, 22. juni', fraBeat: 2 },
    { aar: '1996', tekst: 'De første pengene', fraBeat: 2 },
    { aar: '2006', tekst: 'Statens pensjonsfond utland', fraBeat: 3 },
];

function Tidslinje({ beat }: { beat: number }) {
    const x = (aar: number) => 110 + ((aar - 1988) / (2008 - 1988)) * 780;
    return (
        <motion.div key="tidslinje" {...inn} className="absolute inset-0">
            <svg className="absolute inset-0" width={1000} height={562}>
                <line x1={90} x2={910} y1={300} y2={300} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
            </svg>
            {AAR.map((a, i) => {
                const vis = beat >= a.fraBeat;
                const fokus = beat === a.fraBeat;
                const opp = i % 2 === 0;
                return (
                    <motion.div
                        key={a.aar}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? (fokus ? 1 : 0.6) : 0 }}
                        transition={{ delay: vis && fokus ? 0.2 + i * 0.8 : 0 }}
                        className="absolute flex flex-col items-center"
                        style={{ left: x(Number(a.aar)) - 140, width: 280, top: opp ? 130 : 290 }}
                    >
                        {!opp && <div style={{ width: 24, height: 24, borderRadius: 12, background: '#0d9488', marginBottom: 14 }} />}
                        <div className="font-display font-black text-slate-900" style={{ fontSize: 52 }}>
                            {a.aar}
                        </div>
                        <div className="text-2xl font-bold text-slate-700 text-center leading-tight">{a.tekst}</div>
                        {opp && <div style={{ width: 24, height: 24, borderRadius: 12, background: '#0d9488', marginTop: 14 }} />}
                    </motion.div>
                );
            })}
            {beat >= 3 && (
                <motion.div
                    {...inn}
                    transition={{ delay: 1.6 }}
                    className="absolute rounded-2xl bg-teal-600 text-white font-black text-3xl px-5 py-2 shadow-xl"
                    style={{ left: 600, top: 440 }}
                >
                    = oljefondet
                </motion.div>
            )}
        </motion.div>
    );
}

const ROLLER = [
    { Ikon: Users, tittel: 'Staten', tekst: 'eier fondet, altså alle oss', farge: '#0d9488' },
    { Ikon: Landmark, tittel: 'Finansdepartementet', tekst: 'bestemmer reglene', farge: '#2563eb' },
    { Ikon: Building2, tittel: 'NBIM i Norges Bank', tekst: 'kjøper og selger', farge: '#b45309' },
];

function Roller() {
    return (
        <motion.div key="roller" {...inn} className="absolute flex items-center gap-3" style={{ left: 40, top: 170 }}>
            {ROLLER.map((r, i) => (
                <div key={r.tittel} className="flex items-center gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 1.1 }}
                        className="flex flex-col items-center rounded-3xl bg-white shadow-xl"
                        style={{ width: 270, height: 240, padding: 18, borderTop: `10px solid ${r.farge}` }}
                    >
                        <r.Ikon size={60} style={{ color: r.farge }} />
                        <div className="text-2xl font-black text-slate-900 mt-3 text-center leading-tight">{r.tittel}</div>
                        <div className="text-xl font-bold text-slate-600 mt-2 text-center">{r.tekst}</div>
                    </motion.div>
                    {i < ROLLER.length - 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 1.1 }}>
                            <ArrowRight size={44} className="text-slate-500" />
                        </motion.div>
                    )}
                </div>
            ))}
        </motion.div>
    );
}

function Tid({ beat }: { beat: number }) {
    const fase = beat <= 1 ? 'valg' : beat <= 3 ? 'tid' : 'roller';
    return (
        <AnimatePresence mode="wait">
            {fase === 'valg' && <Valg key="valg" beat={beat} />}
            {fase === 'tid' && <Tidslinje key="tid" beat={beat} />}
            {fase === 'roller' && <Roller key="roller" />}
        </AnimatePresence>
    );
}

// ---------- prosent ----------

/** Hvor mye av ruta nr. i (0-99) som er farget gull på denne beaten. */
function fyllFor(i: number, beat: number, puls: boolean) {
    if (beat === 0) return i < 4 ? 1 : 0;
    if (beat === 1) return i < 3 ? 1 : 0;
    if (beat === 2) return i < 3 ? 1 : i === 3 && puls ? 1 : 0;
    // 2,8 prosent: to hele ruter og 80 prosent av den tredje.
    if (i < 2) return 1;
    if (i === 2) return 0.8;
    return 0;
}

function Ruter({ beat }: { beat: number }) {
    const STR = 36;
    const MELLOM = 4;
    return (
        <div className="absolute" style={{ left: 60, top: 110 }}>
            <div className="text-2xl font-black text-slate-700 mb-2">Hele fondet = 100 ruter</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(10, ${STR}px)`, gap: MELLOM }}>
                {Array.from({ length: 100 }, (_, i) => {
                    const fyll = fyllFor(i, beat, false);
                    const puls = beat === 2 && i === 3;
                    return (
                        <div
                            key={i}
                            className="relative rounded-md overflow-hidden"
                            style={{ width: STR, height: STR, background: fyll > 0 && fyll < 1 ? '#475569' : '#cbd5e1' }}
                        >
                            <motion.div
                                className="absolute inset-y-0 left-0"
                                initial={{ width: 0 }}
                                animate={{ width: puls ? STR : fyll * STR, opacity: puls ? 0.35 : 1 }}
                                transition={{ duration: 0.8, delay: i * 0.12 }}
                                style={{ background: '#eab308' }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Stort({ tall, tekst, farge = '#a16207' }: { tall: string; tekst: string; farge?: string }) {
    return (
        <motion.div key={tall} {...inn} transition={{ delay: 0.3 }} className="flex flex-col">
            <div className="font-display font-black leading-none" style={{ fontSize: 96, color: farge }}>
                {tall}
            </div>
            <div className="text-3xl font-bold text-slate-700 mt-2">{tekst}</div>
        </motion.div>
    );
}

function Prosent({ beat }: { beat: number }) {
    if (beat === 4) {
        return (
            <motion.div key="budsjett" {...inn} className="absolute" style={{ left: 60, top: 150, width: 880 }}>
                <div className="text-3xl font-black text-slate-900 mb-3">Over 2000 milliarder kroner</div>
                <div className="flex rounded-2xl overflow-hidden shadow-xl" style={{ height: 110 }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '27%' }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                        className="flex items-center justify-center bg-amber-500 text-white font-black text-2xl"
                    />
                    <div className="flex-1 flex items-center justify-center bg-slate-400 text-white font-black text-2xl">
                        resten, blant annet skatten vi betaler
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="mt-4 flex items-center gap-3 text-3xl font-black text-amber-700"
                >
                    <div className="rounded-md bg-amber-500" style={{ width: 36, height: 36 }} />
                    579,4 milliarder fra oljefondet
                </motion.div>
            </motion.div>
        );
    }
    return (
        <motion.div key="ruter" {...inn} className="absolute inset-0">
            <Ruter beat={beat} />
            <div className="absolute" style={{ left: 530, top: 160, width: 440 }}>
                <AnimatePresence mode="wait">
                    {beat === 0 && <Stort key="4" tall="4 %" tekst="det fondet ble regnet å tjene i et vanlig år" />}
                    {beat === 1 && <Stort key="3" tall="3 %" tekst="grensen fra 2017" />}
                    {beat === 2 && (
                        <motion.div key="fast" {...inn} className="flex flex-col gap-5">
                            <div className="rounded-3xl bg-white shadow-xl px-5 py-4">
                                <div className="text-3xl font-black text-red-600">Dårlige tider</div>
                                <div className="text-2xl font-bold text-slate-700">litt mer enn 3 prosent</div>
                            </div>
                            <div className="rounded-3xl bg-white shadow-xl px-5 py-4">
                                <div className="text-3xl font-black text-teal-600">Gode tider</div>
                                <div className="text-2xl font-bold text-slate-700">mindre</div>
                            </div>
                        </motion.div>
                    )}
                    {beat === 3 && <Stort key="2,8" tall="2,8 %" tekst="579,4 milliarder kroner fra fondet: to hele ruter og nesten en til" />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ---------- bors ----------

/** En kurve som går opp og ned. Bare en illustrasjon, ingen ekte tall. */
const KURVE = 'M 80 330 C 160 250, 220 380, 300 300 S 420 200, 500 280 S 620 380, 700 230 S 820 260, 920 180';

function Bors({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <motion.div key="kurve" {...inn} className="absolute inset-0">
                    <svg className="absolute inset-0" width={1000} height={562}>
                        <motion.path
                            d={KURVE}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={10}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 3, ease: 'easeInOut' }}
                        />
                    </svg>
                    <div className="absolute text-xl font-bold text-slate-500" style={{ left: 80, top: 470 }}>
                        Illustrasjon: aksjer går opp og ned
                    </div>
                </motion.div>
            )}
            {beat === 1 && (
                <motion.div key="fall" {...inn} className="absolute flex flex-col items-center" style={{ left: 0, right: 0, top: 160 }}>
                    <div className="flex items-center gap-4">
                        <ArrowDown size={110} strokeWidth={3} className="text-red-600" />
                        <div className="font-display font-black text-red-600 leading-none" style={{ fontSize: 120 }}>
                            670
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-800 mt-3">milliarder kroner mindre verdt</div>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div key="del" {...inn} className="absolute" style={{ left: 60, top: 170, width: 880 }}>
                    <div className="text-3xl font-black text-slate-900 mb-3">Av fallet på 670 milliarder:</div>
                    <div className="flex rounded-2xl overflow-hidden shadow-xl" style={{ height: 120 }}>
                        <div className="flex items-center justify-center bg-slate-500 text-white font-black text-3xl" style={{ width: '58%' }}>
                            kronekursen: mesteparten
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="flex-1 flex flex-col items-center justify-center bg-red-600 text-white font-black text-2xl text-center leading-tight"
                        >
                            <span>av dette investeringene:</span>
                            <span>278 milliarder</span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div key="snitt" {...inn} className="absolute flex items-end gap-16" style={{ left: 160, top: 110, height: 380 }}>
                    <div className="flex flex-col items-center">
                        <div className="font-display font-black text-teal-700" style={{ fontSize: 56 }}>
                            6,78 %
                        </div>
                        <motion.div
                            className="rounded-t-2xl bg-teal-600"
                            style={{ width: 200 }}
                            initial={{ height: 0 }}
                            animate={{ height: 6.78 * 36 }}
                            transition={{ duration: 1.4 }}
                        />
                        <div className="text-2xl font-black text-slate-800 mt-2 text-center" style={{ width: 280 }}>
                            tjent i snitt per år
                        </div>
                    </div>
                    {beat >= 4 && (
                        <motion.div {...inn} className="flex flex-col items-center">
                            <div className="font-display font-black text-amber-600" style={{ fontSize: 56 }}>
                                3 %
                            </div>
                            <motion.div
                                className="rounded-t-2xl bg-amber-500"
                                style={{ width: 200 }}
                                initial={{ height: 0 }}
                                animate={{ height: 3 * 36 }}
                                transition={{ duration: 1.2, delay: 0.3 }}
                            />
                            <div className="text-2xl font-black text-slate-800 mt-2 text-center" style={{ width: 280 }}>
                                handlingsregelen
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function OljefondetRegel({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tid';
    const linjer = OVERSKRIFT[modus];
    return (
        <OljefondetFlate bakgrunn="linear-gradient(#f8fafc, #e2e8f0)">
            {modus === 'tid' && <Tid beat={beat} />}
            {modus === 'prosent' && <Prosent beat={beat} />}
            {modus === 'bors' && <Bors beat={beat} />}
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </OljefondetFlate>
    );
}
