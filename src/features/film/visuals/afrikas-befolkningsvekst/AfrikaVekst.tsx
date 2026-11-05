import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Tallene for veksten, tegnet som søyler og ruter.
 * «fart»: Niger 2014 mot 2024, skolen med 100 elever, 3,8 prosent i året og 750 000 nye barn.
 * «afrika»: folketallet i Afrika i 1950 og 2024, og FNs prognose for 2050 og 2100.
 * «niger-japan»: to land som går hver sin vei fram mot 2050.
 * «fattige»: hva veksten krever, fattigdom i Niger, og andel mot antall fattige.
 * Prognoser er tegnet stiplet og lysere enn tall som er målt.
 */

type Modus = 'fart' | 'afrika' | 'niger-japan' | 'fattige';

const B = 1600;
const H = 900;
const BUNN = 760;

const OVERSKRIFT: Record<Modus, string[]> = {
    fart: [
        'Folketallet i Niger',
        'Tenk deg en skole (sammenligning)',
        'Høyest vekst i verden (2020)',
        'Hvert år',
    ],
    afrika: [
        'Hva er en prognose?',
        'Folk i Afrika',
        'Folk i Afrika',
        'Folk i Afrika: FNs prognose',
    ],
    'niger-japan': [
        'To land, to veier',
        'Niger: nesten dobbelt så mange',
        'Japan: færre',
        'En prognose er ikke en fasit',
    ],
    fattige: [
        'Flere barn hvert år krever mer',
        'Niger',
        'Andelen fattige falt',
        'Men antallet fattige økte',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: '4%' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

interface Soyle {
    x: number;
    verdi: number;
    etikett: string;
    tall: string;
    farge: string;
    prognose?: boolean;
    vis: boolean;
}

/** Søyler med felles skala. Tall over søylen, etikett under bunnlinja. */
function Soyler({
    soyler,
    maks,
    hoyde = 520,
    bredde = 170,
    usikker = false,
}: {
    soyler: Soyle[];
    maks: number;
    hoyde?: number;
    bredde?: number;
    usikker?: boolean;
}) {
    return (
        <>
            {soyler.map((s) => {
                const h = (s.verdi / maks) * hoyde;
                return (
                    <g key={s.etikett}>
                        <text
                            x={s.x}
                            y={BUNN + 56}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#334155"
                        >
                            {s.etikett}
                        </text>
                        {s.vis && (
                            <>
                                <motion.rect
                                    x={s.x - bredde / 2}
                                    width={bredde}
                                    rx={10}
                                    initial={{ y: BUNN, height: 0 }}
                                    animate={{ y: BUNN - h, height: h }}
                                    transition={{
                                        duration: 1.1,
                                        delay: 0.3,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    fill={s.prognose ? `${s.farge}55` : s.farge}
                                    stroke={s.farge}
                                    strokeWidth={s.prognose ? 6 : 0}
                                    strokeDasharray={s.prognose ? '16 10' : undefined}
                                />
                                <motion.text
                                    x={s.x}
                                    y={BUNN - h - 22}
                                    textAnchor="middle"
                                    fontSize={46}
                                    fontWeight={900}
                                    fill="#0f172a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    {s.tall}
                                    {usikker && s.prognose ? ' ?' : ''}
                                </motion.text>
                            </>
                        )}
                    </g>
                );
            })}
            <line x1={120} x2={1480} y1={BUNN} y2={BUNN} stroke="#334155" strokeWidth={4} />
        </>
    );
}

function Tegnforklaring({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    return (
        <div
            className="absolute left-[3%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-1 text-xl font-bold text-slate-700"
            style={{ top: '14%' }}
        >
            <div className="flex items-center gap-3">
                <span
                    className="inline-block rounded"
                    style={{ width: 26, height: 18, background: '#ea580c' }}
                />
                målt
            </div>
            <div className="flex items-center gap-3">
                <span
                    className="inline-block rounded"
                    style={{
                        width: 26,
                        height: 18,
                        background: '#ea580c55',
                        border: '3px dashed #ea580c',
                    }}
                />
                prognose
            </div>
        </div>
    );
}

function Kort({
    tall,
    under,
    farge = '#0f172a',
}: {
    tall: ReactNode;
    under: string;
    farge?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="px-8 py-5 rounded-3xl bg-white/95 shadow-2xl text-center"
            style={{ minWidth: 300, maxWidth: 440 }}
        >
            <div
                className="font-black tabular-nums"
                style={{ fontSize: 72, lineHeight: 1.05, color: farge }}
            >
                {tall}
            </div>
            <div className="text-2xl font-bold text-slate-600 mt-1">{under}</div>
        </motion.div>
    );
}

function Fart({ beat }: { beat: number }) {
    if (beat >= 2) {
        return (
            <div className="absolute inset-0 flex items-center justify-center gap-10">
                <Kort
                    tall={beat >= 3 ? <TelleTall verdi={750000} /> : '3,8 %'}
                    under={
                        beat >= 3
                            ? 'nye barn som trenger skole og helsehjelp'
                            : 'befolkningsvekst i året i Niger'
                    }
                    farge="#c2410c"
                />
            </div>
        );
    }
    if (beat === 1) {
        // 100 gamle elever i et rutenett, og 41 nye som kommer til.
        const rute = 44;
        const kol = 20;
        const x0 = (B - kol * rute) / 2;
        const ruter: { x: number; y: number; ny: boolean; i: number }[] = [];
        for (let i = 0; i < 141; i++)
            ruter.push({
                x: x0 + (i % kol) * rute,
                y: 230 + Math.floor(i / kol) * rute,
                ny: i >= 100,
                i,
            });
        return (
            <>
                <svg
                    viewBox={`0 0 ${B} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full"
                >
                    {ruter.map((r) => (
                        <motion.rect
                            key={r.i}
                            x={r.x}
                            y={r.y}
                            width={rute - 8}
                            height={rute - 8}
                            rx={8}
                            fill={r.ny ? '#ea580c' : '#94a3b8'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: r.ny && r.i === 140 ? 0.45 : 1 }}
                            transition={{ delay: r.ny ? 0.8 + (r.i - 100) * 0.04 : 0 }}
                        />
                    ))}
                </svg>
                <div className="absolute left-[3%] bottom-[5%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-1 text-xl font-bold text-slate-700">
                    <div className="flex items-center gap-3">
                        <span
                            className="inline-block rounded"
                            style={{ width: 22, height: 22, background: '#94a3b8' }}
                        />
                        100 elever
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className="inline-block rounded"
                            style={{ width: 22, height: 22, background: '#ea580c' }}
                        />
                        nesten 41 nye på ti år
                    </div>
                </div>
            </>
        );
    }
    const soyler: Soyle[] = [
        { x: 560, verdi: 100, etikett: '2014', tall: 'folketallet', farge: '#94a3b8', vis: true },
        {
            x: 1040,
            verdi: 141,
            etikett: '2024',
            tall: '+ nesten 41 %',
            farge: '#ea580c',
            vis: true,
        },
    ];
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            <Soyler soyler={soyler} maks={141} hoyde={460} bredde={260} />
        </svg>
    );
}

function Afrika({ beat }: { beat: number }) {
    const soyler: Soyle[] = [
        {
            x: 340,
            verdi: 0.23,
            etikett: '1950',
            tall: '230 mill.',
            farge: '#ea580c',
            vis: beat >= 1,
        },
        { x: 680, verdi: 1.5, etikett: '2024', tall: '1,5 mrd.', farge: '#ea580c', vis: beat >= 2 },
        {
            x: 1020,
            verdi: 2.5,
            etikett: '2050',
            tall: 'nesten 2,5 mrd.',
            farge: '#ea580c',
            prognose: true,
            vis: beat >= 3,
        },
        {
            x: 1360,
            verdi: 3.8,
            etikett: '2100',
            tall: '3,8 mrd.',
            farge: '#ea580c',
            prognose: true,
            vis: beat >= 3,
        },
    ];
    return (
        <>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Soyler soyler={soyler} maks={3.8} hoyde={520} bredde={200} />
            </svg>
            {beat === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="px-8 py-5 rounded-3xl bg-white/95 shadow-2xl text-center"
                        style={{ maxWidth: 620 }}
                    >
                        <div className="text-4xl font-black text-slate-900">Prognose</div>
                        <div className="text-2xl font-bold text-slate-600 mt-2">
                            en beregning av hvordan noe trolig blir i framtiden
                        </div>
                    </motion.div>
                </div>
            )}
            <Tegnforklaring synlig={beat >= 3} />
        </>
    );
}

function NigerJapan({ beat }: { beat: number }) {
    const usikker = beat >= 3;
    const soyler: Soyle[] = [
        { x: 330, verdi: 27, etikett: '2024', tall: '27', farge: '#ea580c', vis: beat >= 1 },
        {
            x: 560,
            verdi: 52,
            etikett: '2050',
            tall: 'ca. 52',
            farge: '#ea580c',
            prognose: true,
            vis: beat >= 1,
        },
        {
            x: 1040,
            verdi: 124,
            etikett: '2024 ',
            tall: 'ca. 124',
            farge: '#2563eb',
            vis: beat >= 2,
        },
        {
            x: 1270,
            verdi: 105,
            etikett: '2050 ',
            tall: '105',
            farge: '#2563eb',
            prognose: true,
            vis: beat >= 2,
        },
    ];
    return (
        <>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Soyler soyler={soyler} maks={124} hoyde={480} bredde={180} usikker={usikker} />
                <text
                    x={445}
                    y={BUNN + 116}
                    textAnchor="middle"
                    fontSize={48}
                    fontWeight={900}
                    fill="#c2410c"
                >
                    Niger
                </text>
                <text
                    x={1155}
                    y={BUNN + 116}
                    textAnchor="middle"
                    fontSize={48}
                    fontWeight={900}
                    fill="#1d4ed8"
                >
                    Japan
                </text>
            </svg>
            <div
                className="absolute right-[3%] px-4 py-2 rounded-xl bg-white/90 text-xl font-bold text-slate-600"
                style={{ top: '14%' }}
            >
                millioner mennesker
            </div>
        </>
    );
}

function Fattige({ beat }: { beat: number }) {
    if (beat === 0) {
        const ting = ['Skoler', 'Lærere', 'Leger', 'Mat'];
        return (
            <div className="absolute inset-0 flex items-center justify-center gap-6">
                {ting.map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.6 }}
                        className="px-7 py-6 rounded-3xl bg-white/95 shadow-2xl text-center"
                        style={{ minWidth: 180 }}
                    >
                        <div className="text-5xl font-black text-orange-700">+</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{t}</div>
                    </motion.div>
                ))}
            </div>
        );
    }
    if (beat === 1) {
        return (
            <div className="absolute inset-0 flex items-center justify-center gap-10">
                <Kort tall="ca. 41 %" under="andel fattige i 2021" farge="#c2410c" />
                <Kort tall="61 år" under="så lenge folk i snitt kan regne med å leve" />
            </div>
        );
    }
    // To paneler: andel (prosent av folket) og antall (millioner mennesker). Ulik nevner, egne akser.
    const andel: Soyle[] = [
        { x: 280, verdi: 54, etikett: '2005', tall: 'ca. 54 %', farge: '#64748b', vis: true },
        { x: 560, verdi: 45, etikett: '2014', tall: '45 %', farge: '#64748b', vis: true },
    ];
    const antall: Soyle[] = [
        {
            x: 1040,
            verdi: 6.8,
            etikett: '2005 ',
            tall: '6,8 mill.',
            farge: '#c2410c',
            vis: beat >= 3,
        },
        {
            x: 1320,
            verdi: 8.2,
            etikett: '2014 ',
            tall: '8,2 mill.',
            farge: '#c2410c',
            vis: beat >= 3,
        },
    ];
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            <rect x={100} y={150} width={640} height={720} rx={30} fill="#ffffffcc" />
            <rect x={860} y={150} width={640} height={720} rx={30} fill="#ffffffcc" />
            <text x={420} y={210} textAnchor="middle" fontSize={40} fontWeight={900} fill="#334155">
                Andel av folket
            </text>
            <text
                x={1180}
                y={210}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#334155"
            >
                Antall mennesker
            </text>
            <Soyler soyler={andel} maks={54} hoyde={420} bredde={170} />
            <Soyler soyler={antall} maks={8.2} hoyde={420} bredde={170} />
        </svg>
    );
}

export function AfrikaVekst({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'fart';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #fff7ed 0%, #fde9c7 100%)' }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${modus === 'fattige' ? Math.min(beat, 2) : modus === 'fart' ? beat : 0}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                >
                    {modus === 'fart' && <Fart beat={beat} />}
                    {modus === 'afrika' && <Afrika beat={beat} />}
                    {modus === 'niger-japan' && <NigerJapan beat={beat} />}
                    {modus === 'fattige' && <Fattige beat={beat} />}
                </motion.div>
            </AnimatePresence>
            <Overskrift tekst={tekst} />
        </div>
    );
}
