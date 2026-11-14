import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Presentasjonen sett fra arbeidsbordet: påstanden (vag mot skarp), de tre tekstene på en
 * tidslinje, tidsplanen for de cirka 10 minuttene og hva sensor ser etter.
 */

type Modus = 'pastand' | 'epoker' | 'tid' | 'sensor';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function Overskrift({ children }: { children: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <div className="text-3xl font-black text-slate-900" style={FONT}>
                {children}
            </div>
        </div>
    );
}

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

function Pastand({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Første setning</Overskrift>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: beat >= 1 ? 0.55 : 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute rounded-2xl bg-white shadow-lg px-6 py-4"
                style={{ left: 60, top: 80, width: 700 }}
            >
                <div className="text-base font-bold uppercase tracking-wider text-slate-500">
                    Vag åpning
                </div>
                <div className="text-2xl font-semibold text-slate-800 mt-1 leading-snug">
                    «Jeg skal snakke om framgang og motgang i tre tekster.»
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="absolute flex items-center gap-2"
                style={{ left: 780, top: 100 }}
            >
                <div className="rounded-full bg-red-600 text-white p-2 shadow-lg">
                    <X size={34} strokeWidth={3} />
                </div>
                <div className="text-xl font-black text-red-700 leading-tight" style={FONT}>
                    En liste,
                    <br />
                    ikke en påstand
                </div>
            </motion.div>
            {beat >= 1 && (
                <motion.div
                    {...inn}
                    className="absolute rounded-2xl bg-slate-900 shadow-xl px-6 py-5"
                    style={{ left: 60, top: 215, width: 700 }}
                >
                    <div className="text-base font-bold uppercase tracking-wider text-amber-300">
                        Skarp påstand
                    </div>
                    <div className="text-3xl font-black text-white mt-1 leading-tight" style={FONT}>
                        Framgang er ikke alltid noe du kan jobbe deg til.
                    </div>
                    {beat >= 2 && (
                        <motion.div
                            {...inn}
                            className="text-xl font-semibold text-slate-200 mt-3 leading-snug"
                        >
                            Folkediktningen lover at den smarte vinner. Noen tiår senere river
                            forfatterne det løftet i stykker.
                        </motion.div>
                    )}
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    {...inn}
                    className="absolute flex items-center gap-2"
                    style={{ left: 780, top: 250 }}
                >
                    <div className="rounded-full bg-teal-600 text-white p-2 shadow-lg">
                        <Check size={34} strokeWidth={3} />
                    </div>
                    <div className="text-xl font-black text-teal-800 leading-tight" style={FONT}>
                        Omstridt:
                        <br />
                        noen kan
                        <br />
                        være uenige
                    </div>
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    {...inn}
                    className="absolute rounded-2xl bg-amber-300 shadow-xl px-6 py-3"
                    style={{ left: 60, top: 470, width: 880 }}
                >
                    <div className="text-2xl font-black text-slate-900" style={FONT}>
                        Sensor ser etter: Du argumenterer, du gjenforteller ikke bare.
                    </div>
                </motion.div>
            )}
        </>
    );
}

const AR_FRA = 1830;
const AR_TIL = 1900;
const AKSE = { venstre: 90, hoyre: 910, y: 420 };
const arX = (ar: number) =>
    AKSE.venstre + ((ar - AR_FRA) / (AR_TIL - AR_FRA)) * (AKSE.hoyre - AKSE.venstre);

const TEKSTER = [
    {
        fraBeat: 1,
        ar: 1845,
        arTekst: '1840-tallet',
        tittel: 'Askeladden som kappåt med trollet',
        epoke: 'Folkediktning og nasjonalromantikk',
        farge: '#16a34a',
        kortX: 70,
    },
    {
        fraBeat: 2,
        ar: 1885,
        arTekst: '1885',
        tittel: 'Karens jul',
        epoke: 'Realisme og naturalisme',
        farge: '#475569',
        kortX: 375,
    },
    {
        fraBeat: 3,
        ar: 1890,
        arTekst: '1890',
        tittel: 'Sult',
        epoke: 'Nyromantikk',
        farge: '#7c3aed',
        kortX: 680,
    },
];

function Epoker({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Tre tekster, tre epoker</Overskrift>
            <svg className="absolute inset-0" width={1000} height={562} viewBox="0 0 1000 562">
                <line
                    x1={AKSE.venstre}
                    x2={AKSE.hoyre}
                    y1={AKSE.y}
                    y2={AKSE.y}
                    stroke="#334155"
                    strokeWidth={4}
                    strokeLinecap="round"
                />
                {TEKSTER.filter((t) => beat >= t.fraBeat).map((t) => (
                    <motion.g key={t.tittel} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line
                            x1={arX(t.ar)}
                            y1={AKSE.y}
                            x2={t.kortX + 125}
                            y2={282}
                            stroke={t.farge}
                            strokeWidth={3}
                        />
                        <circle cx={arX(t.ar)} cy={AKSE.y} r={10} fill={t.farge} />
                    </motion.g>
                ))}
            </svg>
            {[AR_FRA, 1850, 1875, AR_TIL].map((ar) => (
                <div
                    key={ar}
                    className="absolute text-base font-bold text-slate-500"
                    style={{ left: arX(ar) - 22, top: AKSE.y + 14, width: 44, textAlign: 'center' }}
                >
                    {ar}
                </div>
            ))}
            {TEKSTER.filter((t) => beat >= t.fraBeat).map((t) => (
                <motion.div
                    key={t.tittel}
                    {...inn}
                    className="absolute rounded-2xl bg-white shadow-xl px-4 py-3"
                    style={{
                        left: t.kortX,
                        top: 110,
                        width: 250,
                        height: 172,
                        borderTop: `8px solid ${t.farge}`,
                    }}
                >
                    <div className="text-lg font-black" style={{ color: t.farge }}>
                        {t.arTekst}
                    </div>
                    <div className="text-2xl font-black text-slate-900 leading-tight" style={FONT}>
                        {t.tittel}
                    </div>
                    <div className="text-base font-semibold text-slate-600 mt-1">{t.epoke}</div>
                </motion.div>
            ))}
            {beat >= 4 && (
                <motion.div
                    {...inn}
                    className="absolute rounded-2xl bg-amber-300 shadow-xl px-6 py-3"
                    style={{ left: 90, top: 478, width: 820 }}
                >
                    <div className="text-xl font-black text-slate-900" style={FONT}>
                        LK20: Sammenligne tekster ut fra tiden de ble skrevet i
                    </div>
                </motion.div>
            )}
        </>
    );
}

const BAR = { x: 70, y: 260, w: 860, h: 76 };
const PER_MIN = BAR.w / 10;
const DELER = [
    { fraBeat: 1, navn: 'Åpning', min: 1, tekst: 'ca. 1 min', farge: '#0ea5e9', over: true },
    { fraBeat: 2, navn: 'Askeladden', min: 2, tekst: 'ca. 2 min', farge: '#16a34a', over: false },
    {
        fraBeat: 3,
        navn: 'Karens jul',
        min: 2.5,
        tekst: 'ca. 2,5 min',
        farge: '#475569',
        over: true,
    },
    { fraBeat: 4, navn: 'Sult', min: 2.5, tekst: 'ca. 2,5 min', farge: '#7c3aed', over: false },
    {
        fraBeat: 5,
        navn: 'Avslutning',
        min: 1.5,
        tekst: 'ca. 1,5 min',
        farge: '#d97706',
        over: true,
    },
];

function Tid({ beat }: { beat: number }) {
    const deler = DELER.map((d, i) => ({
        ...d,
        start: DELER.slice(0, i).reduce((sum, x) => sum + x.min, 0),
    }));
    return (
        <>
            <Overskrift>Presentasjonen: cirka 10 minutter</Overskrift>
            <div
                className="absolute rounded-xl bg-white shadow-inner border-4 border-slate-300"
                style={{ left: BAR.x - 4, top: BAR.y - 4, width: BAR.w + 8, height: BAR.h + 8 }}
            />
            {deler
                .filter((d) => beat >= d.fraBeat)
                .map((d) => (
                    <motion.div
                        key={d.navn}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute rounded-md"
                        style={{
                            left: BAR.x + d.start * PER_MIN + 2,
                            top: BAR.y,
                            width: d.min * PER_MIN - 4,
                            height: BAR.h,
                            background: d.farge,
                            transformOrigin: 'left center',
                        }}
                    />
                ))}
            {deler
                .filter((d) => beat >= d.fraBeat)
                .map((d) => (
                    <motion.div
                        key={`${d.navn}-tekst`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="absolute text-center"
                        style={{
                            left: BAR.x + d.start * PER_MIN,
                            width: d.min * PER_MIN,
                            top: d.over ? BAR.y - 74 : BAR.y + BAR.h + 14,
                        }}
                    >
                        <div
                            className="text-xl font-black text-slate-900 leading-tight"
                            style={FONT}
                        >
                            {d.navn}
                        </div>
                        <div className="text-base font-bold" style={{ color: d.farge }}>
                            {d.tekst}
                        </div>
                    </motion.div>
                ))}
            <div
                className="absolute text-base font-bold text-slate-500"
                style={{ left: BAR.x, top: BAR.y + BAR.h + 70 }}
            >
                Start
            </div>
            <div
                className="absolute text-base font-bold text-slate-500 text-right"
                style={{ left: BAR.x + BAR.w - 140, width: 140, top: BAR.y + BAR.h + 70 }}
            >
                ca. 10 min
            </div>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 14, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: -2 }}
                    transition={{ duration: 0.6 }}
                    className="absolute rounded-2xl bg-amber-100 shadow-xl px-6 py-4"
                    style={{ left: 300, top: 420, width: 400 }}
                >
                    <div className="text-2xl font-black text-slate-900" style={FONT}>
                        Stikkord
                    </div>
                    <div className="text-lg font-semibold text-slate-700">
                        ikke et ferdigskrevet ark
                    </div>
                </motion.div>
            )}
        </>
    );
}

const KJENNETEGN = [
    {
        fraBeat: 1,
        navn: 'Argumenterer',
        sensor: 'Klar påstand, ikke bare oppsummering',
        eleven: 'Åpnet med en omstridt påstand',
    },
    {
        fraBeat: 2,
        navn: 'Form og innhold',
        sensor: 'Hva teksten sier, og hvordan',
        eleven: 'Kontrast, miljøskildring, ironi, indre monolog',
    },
    {
        fraBeat: 3,
        navn: 'Historisk kontekst',
        sensor: 'Kobler tekster til tiden de ble skrevet i',
        eleven: 'Tre epoker, og en tekst fra 2024',
    },
    {
        fraBeat: 4,
        navn: 'Helhet',
        sensor: 'Rød tråd fra start til slutt',
        eleven: 'Sirklet tilbake til påstanden',
    },
];

function Sensor({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift>Hva sensor ser etter</Overskrift>
            {KJENNETEGN.map((k, i) => {
                const vis = beat >= k.fraBeat;
                const x = 50 + (i % 2) * 460;
                const y = 92 + Math.floor(i / 2) * 225;
                return (
                    <div
                        key={k.navn}
                        className="absolute rounded-2xl shadow-lg px-5 py-4"
                        style={{
                            left: x,
                            top: y,
                            width: 440,
                            height: 205,
                            background: vis ? '#ffffff' : 'rgba(255,255,255,0.45)',
                            transition: 'background 0.5s',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="rounded-full p-1.5"
                                style={{
                                    background: vis ? '#0d9488' : '#cbd5e1',
                                    color: '#fff',
                                    transition: 'background 0.5s',
                                }}
                            >
                                <Check size={26} strokeWidth={3} />
                            </div>
                            <div className="text-2xl font-black text-slate-900" style={FONT}>
                                {k.navn}
                            </div>
                        </div>
                        <AnimatePresence>
                            {vis && (
                                <motion.div {...inn}>
                                    <div className="text-xl font-semibold text-slate-800 mt-2 leading-snug">
                                        Sensor: {k.sensor}
                                    </div>
                                    <div className="text-xl font-bold text-teal-800 mt-2 leading-snug">
                                        Eleven: {k.eleven}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </>
    );
}

export function MuntligManus({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'pastand';
    return (
        <Flate bakgrunn="#eef2f6">
            {modus === 'pastand' && <Pastand beat={beat} />}
            {modus === 'epoker' && <Epoker beat={beat} />}
            {modus === 'tid' && <Tid beat={beat} />}
            {modus === 'sensor' && <Sensor beat={beat} />}
        </Flate>
    );
}
