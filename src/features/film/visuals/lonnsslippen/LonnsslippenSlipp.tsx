import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Lønnsslippen til Ida, linje for linje. Fire moduser:
 * - linjer: slippen fylles ut, fra timer og timelønn til nettolønn.
 * - ferie: feriepengelinja nederst, og hvordan 1 346 kroner er regnet ut.
 * - trygd: en slipp om noen år, med trygdeavgift som går til folketrygden.
 * - sjekk: fem spørsmål som krysses av mot linjene på slippen.
 */

type Modus = 'linjer' | 'ferie' | 'trygd' | 'sjekk';

type LinjeId = 'timer' | 'sats' | 'brutto' | 'skatt' | 'netto' | 'ferie';

interface Linje {
    id: LinjeId;
    tekst: string;
    belop: string;
    tone?: 'rod' | 'gronn';
}

const IDAS_LINJER: Linje[] = [
    { id: 'timer', tekst: 'Timer', belop: '80' },
    { id: 'sats', tekst: 'Timelønn', belop: '165 kr' },
    { id: 'brutto', tekst: 'Bruttolønn', belop: '13 200 kr' },
    { id: 'skatt', tekst: 'Skattetrekk', belop: '−6 600 kr', tone: 'rod' },
    { id: 'netto', tekst: 'Nettolønn til konto', belop: '6 600 kr', tone: 'gronn' },
    { id: 'ferie', tekst: 'Feriepenger tjent opp', belop: '1 346 kr' },
];

const OVERSKRIFT: Record<Modus, string[]> = {
    linjer: [
        'Lønnsslippen',
        'Timer og timelønn',
        'Lønnen og trekket',
        'Det som er igjen',
        'Kvitteringen din',
    ],
    ferie: [
        'Feriepenger',
        'Minst 10,2 prosent',
        'Idas feriepenger',
        'Med tariffavtale: 12 prosent',
    ],
    trygd: [
        'En del av trekket: trygdeavgift',
        'Trygdeavgift går til folketrygden',
        'Det folketrygden betaler',
        'Satsene i 2026',
        'Tjener du lite: ingen trygdeavgift',
    ],
    sjekk: [
        'Fem spørsmål til slippen',
        'Timer og timelønn',
        'Brutto og skatt',
        'Trukket 50 prosent?',
        'Feriepenger',
    ],
};

/** Hvilke linjer som er med, og hvilke som lyser, i hver beat. */
function linjerFor(modus: Modus, beat: number): { vis: LinjeId[]; lys: LinjeId[] } {
    const alle = IDAS_LINJER.map((l) => l.id);
    if (modus === 'linjer') {
        const vis: LinjeId[][] = [
            [],
            ['timer', 'sats'],
            ['timer', 'sats', 'brutto', 'skatt'],
            ['timer', 'sats', 'brutto', 'skatt', 'netto'],
        ];
        const lys: LinjeId[][] = [[], ['timer', 'sats'], ['brutto', 'skatt'], ['netto'], []];
        return { vis: beat >= 4 ? vis[3] : vis[beat], lys: lys[Math.min(beat, 4)] };
    }
    if (modus === 'ferie') return { vis: alle, lys: beat <= 2 ? ['ferie'] : [] };
    if (modus === 'sjekk') {
        const lys: LinjeId[][] = [[], ['timer', 'sats'], ['brutto', 'skatt'], ['skatt'], ['ferie']];
        return { vis: alle, lys: lys[Math.min(beat, 4)] };
    }
    return { vis: [], lys: [] };
}

function Papir({ children, tittel }: { children: ReactNode; tittel: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, rotate: -3, y: 20 }}
            animate={{ opacity: 1, rotate: -1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="absolute rounded-xl bg-white shadow-2xl border border-slate-200"
            style={{ left: 50, top: 92, width: 430, height: 450, padding: '18px 26px' }}
        >
            <div className="flex items-baseline justify-between border-b-2 border-slate-800 pb-2">
                <div className="text-2xl font-black tracking-wide text-slate-900">LØNNSSLIPP</div>
                <div className="text-lg font-semibold text-slate-500">{tittel}</div>
            </div>
            {children}
        </motion.div>
    );
}

function Rad({ l, lys, synlig }: { l: Linje; lys: boolean; synlig: boolean }) {
    const farge = l.tone === 'rod' ? '#dc2626' : l.tone === 'gronn' ? '#0f766e' : '#0f172a';
    return (
        <motion.div
            initial={false}
            animate={{
                opacity: synlig ? 1 : 0.12,
                backgroundColor: lys ? 'rgba(250, 204, 21, 0.45)' : 'rgba(250, 204, 21, 0)',
            }}
            transition={{ duration: 0.5 }}
            className={`flex justify-between items-baseline rounded-lg px-2 ${l.id === 'netto' || l.id === 'ferie' ? 'mt-3 border-t border-slate-300 pt-2' : 'mt-1'}`}
            style={{ height: l.id === 'netto' || l.id === 'ferie' ? 56 : 44 }}
        >
            <span className="text-xl font-semibold text-slate-700">{l.tekst}</span>
            <span className="text-2xl font-black tabular-nums" style={{ color: farge }}>
                {synlig ? l.belop : ''}
            </span>
        </motion.div>
    );
}

function Boks({
    children,
    fra,
    tone = 'vanlig',
}: {
    children: ReactNode;
    fra?: number;
    tone?: 'vanlig' | 'gull' | 'gronn' | 'rod';
}) {
    const k = {
        vanlig: 'border-slate-300 text-slate-800',
        gull: 'border-amber-500 text-amber-800',
        gronn: 'border-teal-500 text-teal-800',
        rod: 'border-red-500 text-red-700',
    }[tone];
    return (
        <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: fra ?? 0 }}
            className={`rounded-2xl bg-white shadow-xl border-2 px-5 py-3 ${k}`}
        >
            {children}
        </motion.div>
    );
}

function Hoyre({ children }: { children: ReactNode }) {
    return (
        <div className="absolute flex flex-col gap-4" style={{ left: 530, top: 110, width: 420 }}>
            {children}
        </div>
    );
}

function IdasSlipp({ modus, beat }: { modus: Modus; beat: number }) {
    const { vis, lys } = linjerFor(modus, beat);
    return (
        <Papir tittel="Juli · Ida">
            <div className="text-lg text-slate-500 mt-1 mb-2">Kiosken ved stranda</div>
            {IDAS_LINJER.filter((l) => modus !== 'linjer' || l.id !== 'ferie').map((l) => (
                <Rad key={l.id} l={l} lys={lys.includes(l.id)} synlig={vis.includes(l.id)} />
            ))}
        </Papir>
    );
}

function Linjer({ beat }: { beat: number }) {
    return (
        <>
            <IdasSlipp modus="linjer" beat={beat} />
            <Hoyre>
                {beat >= 1 && (
                    <Boks>
                        <div className="text-2xl font-bold">Øverst: hva du har jobbet</div>
                    </Boks>
                )}
                {beat >= 2 && (
                    <Boks tone="rod">
                        <div className="text-2xl font-bold">
                            Så: lønnen og det som er trukket fra
                        </div>
                    </Boks>
                )}
                {beat >= 3 && (
                    <Boks tone="gronn">
                        <div className="text-2xl font-bold">
                            Nederst: det som kommer inn på kontoen
                        </div>
                    </Boks>
                )}
                {beat >= 4 && (
                    <Boks tone="gull">
                        <div className="text-2xl font-bold">
                            Ingen lønnsslipp? Si fra til arbeidsgiveren.
                        </div>
                    </Boks>
                )}
            </Hoyre>
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: -8 }}
                    className="absolute rounded-xl border-4 border-teal-600 bg-white/80 text-teal-700 font-black text-3xl px-4 py-1"
                    style={{ left: 250, top: 452 }}
                >
                    KVITTERING
                </motion.div>
            )}
        </>
    );
}

function Ferie({ beat }: { beat: number }) {
    return (
        <>
            <IdasSlipp modus="ferie" beat={beat} />
            <Hoyre>
                <Boks>
                    <div className="text-2xl font-bold">Tjent opp i år, utbetalt neste år</div>
                </Boks>
                {beat >= 1 && (
                    <Boks tone="gull">
                        <div className="text-xl font-semibold">Ferieloven, de fleste:</div>
                        <div className="text-4xl font-black">minst 10,2 %</div>
                    </Boks>
                )}
                {beat >= 2 && (
                    <Boks tone="gronn">
                        <div className="text-xl font-semibold">10,2 % av 13 200 kr</div>
                        <div className="text-4xl font-black">= 1 346 kr</div>
                    </Boks>
                )}
                {beat >= 3 && (
                    <Boks>
                        <div className="text-xl font-semibold">
                            Fem ukers ferie med tariffavtale:
                        </div>
                        <div className="text-4xl font-black">12 %</div>
                    </Boks>
                )}
            </Hoyre>
        </>
    );
}

const TRYGD_RADER = ['Bruttolønn', 'Skattetrekk', 'Trygdeavgift'];

function Trygd({ beat }: { beat: number }) {
    return (
        <>
            <Papir tittel="Om noen år">
                <div className="text-lg text-slate-500 mt-1 mb-2">Med vanlig skattekort</div>
                {TRYGD_RADER.map((r) => (
                    <motion.div
                        key={r}
                        initial={false}
                        animate={{
                            backgroundColor:
                                r === 'Trygdeavgift'
                                    ? 'rgba(250, 204, 21, 0.45)'
                                    : 'rgba(250, 204, 21, 0)',
                        }}
                        className="flex justify-between items-center rounded-lg px-2 mt-2"
                        style={{ height: 52 }}
                    >
                        <span className="text-xl font-semibold text-slate-700">{r}</span>
                        <span className="rounded bg-slate-200" style={{ width: 110, height: 18 }} />
                    </motion.div>
                ))}
                {beat >= 3 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-5 px-2"
                    >
                        <div className="flex justify-between text-xl font-semibold text-slate-700 mt-1">
                            <span>Mellom 17 og 69 år</span>
                            <span className="text-2xl font-black text-slate-900">7,6 %</span>
                        </div>
                        <div className="flex justify-between text-xl font-semibold text-slate-700 mt-2">
                            <span>Under 17 år</span>
                            <span className="text-2xl font-black text-slate-900">5,1 %</span>
                        </div>
                    </motion.div>
                )}
            </Papir>
            <Hoyre>
                {beat >= 1 && (
                    <Boks tone="gull">
                        <div className="text-xl font-semibold">
                            Trygdeavgiften er med på å betale for
                        </div>
                        <div className="text-3xl font-black">Folketrygden</div>
                    </Boks>
                )}
                {beat >= 2 &&
                    [
                        ['Sykepenger', 'når du er syk'],
                        ['Dagpenger', 'hvis du mister jobben'],
                        ['Alderspensjon', 'når du blir gammel'],
                    ].map(([t, u], i) => (
                        <Boks key={t} fra={i * 0.5} tone="gronn">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-2xl font-black">{t}</span>
                                <span className="text-lg font-semibold text-slate-600">{u}</span>
                            </div>
                        </Boks>
                    ))}
                {beat >= 4 && (
                    <Boks tone="rod">
                        <div className="text-xl font-bold">
                            Under 99 650 kr i året: ingen trygdeavgift
                        </div>
                    </Boks>
                )}
            </Hoyre>
        </>
    );
}

const SPORSMAL = [
    'Stemmer timene?',
    'Stemmer timelønnen?',
    'Brutto og skattetrekk?',
    'Trukket 50 %? Sjekk frikortet',
    'Feriepenger så langt?',
];
/** Hvor mange spørsmål som er krysset av i hver beat. */
const KRYSSET = [0, 2, 3, 4, 5];

function Sjekk({ beat }: { beat: number }) {
    const n = KRYSSET[Math.min(beat, 4)];
    return (
        <>
            <IdasSlipp modus="sjekk" beat={beat} />
            <div
                className="absolute rounded-2xl bg-white shadow-xl border-2 border-slate-300 px-5 py-4"
                style={{ left: 530, top: 110, width: 420 }}
            >
                {SPORSMAL.map((s, i) => (
                    <div key={s} className="flex items-center gap-3" style={{ height: 62 }}>
                        <span
                            className="flex items-center justify-center rounded-lg border-2 text-2xl font-black"
                            style={{
                                width: 36,
                                height: 36,
                                borderColor: i < n ? '#0d9488' : '#94a3b8',
                                color: '#0d9488',
                                background: i < n ? '#ccfbf1' : 'white',
                            }}
                        >
                            {i < n ? '✓' : i + 1}
                        </span>
                        <span
                            className="text-2xl font-bold"
                            style={{ color: i < n ? '#0f172a' : '#64748b' }}
                        >
                            {s}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}

export function LonnsslippenSlipp({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'linjer';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate bakgrunn="linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 100%)">
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-display font-black text-4xl text-slate-900"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'linjer' && <Linjer beat={beat} />}
            {modus === 'ferie' && <Ferie beat={beat} />}
            {modus === 'trygd' && <Trygd beat={beat} />}
            {modus === 'sjekk' && <Sjekk beat={beat} />}
        </Flate>
    );
}
