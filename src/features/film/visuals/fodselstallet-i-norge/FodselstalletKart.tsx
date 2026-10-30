import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart med fruktbarhetstall. «norge»: fylkene artikkelen nevner, som nåler på Norge.
 * «innvandrere»: Norge og landene til tre grupper innvandrerkvinner. «verden»: verdens
 * snitt, Sør-Europa, Kina og Afrika. Søylene til høyre viser tallene mot linja for 2,1.
 */

type Modus = 'norge' | 'innvandrere' | 'verden';

const B = 1600;
const H = 900;

const NORGE = 578;
const UKRAINA = 804;
const SYRIA = 760;
const ERITREA = 232;
const KINA = 156;
const SOR_EUROPA = [300, 380, 724];
const AFRIKA = [
    12, 24, 72, 108, 120, 132, 140, 148, 174, 178, 180, 204, 226, 231, 232, 262, 266, 270, 288, 324, 384, 404, 426, 430,
    434, 450, 454, 466, 478, 480, 504, 508, 516, 562, 566, 624, 646, 686, 694, 706, 710, 716, 728, 729, 732, 748, 768,
    788, 800, 818, 834, 854, 894,
];

const UTSNITT_NORGE: Utsnitt = [
    [3, 57.5],
    [31.5, 71.3],
];

interface Nal {
    ll: [number, number];
    tekst: string;
    fraBeat: number;
    dx: number;
    dy: number;
}

interface Soyle {
    etikett: string;
    verdi: number;
    tekst: string;
    fraBeat: number;
    farge: string;
}

interface Oppsett {
    hjorner: [[number, number], [number, number]];
    fin: boolean;
    land: (beat: number) => Record<number, string>;
    naler: Nal[];
    soyler: Soyle[];
    tittel: string[];
    notat?: { fraBeat: number; tekst: string; oppe?: boolean };
}

const OPPSETT: Record<Modus, Oppsett> = {
    norge: {
        hjorner: UTSNITT_NORGE,
        fin: true,
        land: () => ({ [NORGE]: '#fde7c8' }),
        naler: [
            { ll: [6.0, 58.9], tekst: 'Rogaland', fraBeat: 0, dx: -24, dy: 10 },
            { ll: [10.5, 61.4], tekst: 'Innlandet', fraBeat: 1, dx: -28, dy: -10 },
            { ll: [10.75, 59.91], tekst: 'Oslo', fraBeat: 2, dx: 26, dy: 12 },
            { ll: [25.0, 69.9], tekst: 'Finnmark', fraBeat: 3, dx: 0, dy: 62 },
        ],
        soyler: [
            { etikett: 'Rogaland 2025', verdi: 1.65, tekst: '1,65', fraBeat: 0, farge: '#0d9488' },
            { etikett: 'Innlandet 2025', verdi: 1.54, tekst: '1,40 → 1,54', fraBeat: 1, farge: '#16a34a' },
            { etikett: 'Oslo 2024', verdi: 1.31, tekst: '1,31', fraBeat: 2, farge: '#2563eb' },
            { etikett: 'Finnmark 1968', verdi: 3.4, tekst: '3,4', fraBeat: 3, farge: '#b45309' },
        ],
        tittel: ['Høyest: Rogaland', 'Økte mest: Innlandet', 'Lavest på Østlandet: Oslo', 'Finnmark i 1968'],
    },
    innvandrere: {
        hjorner: [
            [-12, 5],
            [62, 70],
        ],
        fin: false,
        land: (beat) => {
            const f: Record<number, string> = { [NORGE]: '#db2777' };
            if (beat >= 2) f[UKRAINA] = '#2563eb';
            if (beat >= 3) {
                f[SYRIA] = '#b45309';
                f[ERITREA] = '#7c2d12';
            }
            return f;
        },
        naler: [
            { ll: [9, 61], tekst: 'Norge', fraBeat: 0, dx: -30, dy: -20 },
            { ll: [31, 49], tekst: 'Ukraina', fraBeat: 2, dx: 0, dy: -36 },
            { ll: [38.5, 35], tekst: 'Syria', fraBeat: 3, dx: 30, dy: 0 },
            { ll: [39, 15.3], tekst: 'Eritrea', fraBeat: 3, dx: 30, dy: 10 },
        ],
        soyler: [
            { etikett: 'Innvandrerkvinner', verdi: 1.44, tekst: '1,44', fraBeat: 1, farge: '#db2777' },
            { etikett: 'Fra Ukraina', verdi: 0.88, tekst: '0,88', fraBeat: 2, farge: '#2563eb' },
            { etikett: 'Fra Syria', verdi: 2.34, tekst: '2,34', fraBeat: 3, farge: '#b45309' },
            { etikett: 'Fra Eritrea', verdi: 2.81, tekst: '2,81', fraBeat: 3, farge: '#7c2d12' },
        ],
        notat: { fraBeat: 4, tekst: 'Også i hjemlandene blir det født færre barn', oppe: true },
        tittel: ['Innvandrere i Norge', 'Færre barn enn resten, for første gang', 'Svært ulikt fra land til land', 'Svært ulikt fra land til land', 'Færre barn også i landene de kommer fra'],
    },
    verden: {
        hjorner: [
            [-125, -40],
            [175, 68],
        ],
        fin: false,
        land: (beat) => {
            const f: Record<number, string> = { [NORGE]: '#db2777' };
            if (beat >= 1) for (const id of SOR_EUROPA) f[id] = '#2563eb';
            if (beat >= 2) {
                f[KINA] = '#7c3aed';
                for (const id of AFRIKA) f[id] = '#ea580c';
            }
            return f;
        },
        naler: [
            { ll: [12.5, 41.9], tekst: 'Italia', fraBeat: 1, dx: -6, dy: 58 },
            { ll: [-4, 40], tekst: 'Spania', fraBeat: 1, dx: -20, dy: 10 },
            { ll: [22, 39], tekst: 'Hellas', fraBeat: 1, dx: 20, dy: -28 },
            { ll: [104, 35], tekst: 'Kina', fraBeat: 2, dx: 0, dy: -30 },
            { ll: [20, 5], tekst: 'Afrika', fraBeat: 2, dx: 0, dy: 10 },
        ],
        soyler: [
            { etikett: 'Hele verden', verdi: 2.24, tekst: '2,24', fraBeat: 0, farge: '#475569' },
            { etikett: 'Hellas, Italia, Spania (har vært)', verdi: 1.25, tekst: '1,2 til 1,3', fraBeat: 1, farge: '#2563eb' },
            { etikett: 'Kina', verdi: 1.02, tekst: '1,02', fraBeat: 2, farge: '#7c3aed' },
            { etikett: 'Afrika', verdi: 4, tekst: 'nær 4', fraBeat: 2, farge: '#ea580c' },
        ],
        notat: { fraBeat: 3, tekst: 'Rike land får som regel færre barn enn fattige' },
        tittel: ['Hele verden i 2025', 'Sør-Europa: har vært svært lavt', 'Kina og Afrika', 'Rike land får færre barn'],
    },
};

const KART_X1 = 980;

function Soyler({ soyler, beat }: { soyler: Soyle[]; beat: number }) {
    const synlige = soyler.filter((s) => s.fraBeat <= beat);
    const MAKS = 4;
    const bredde = 190;
    if (!synlige.length) return null;
    return (
        <div className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-4" style={{ right: '3%', top: '14%', width: '36%' }}>
            <div className="text-xl font-bold text-slate-500 mb-2">barn per kvinne</div>
            {synlige.map((s) => (
                <motion.div key={s.etikett} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: s.fraBeat === beat ? 0.5 : 0 }} className="mb-3">
                    <div className="text-xl font-bold text-slate-700 whitespace-nowrap">{s.etikett}</div>
                    <div className="flex items-center gap-3">
                        <div className="relative rounded-full bg-slate-200 shrink-0" style={{ height: 20, width: bredde }}>
                            <motion.div
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{ background: s.farge }}
                                initial={{ width: 0 }}
                                animate={{ width: (s.verdi / MAKS) * bredde }}
                                transition={{ delay: s.fraBeat === beat ? 0.7 : 0, duration: 1 }}
                            />
                            <div className="absolute bg-red-600" style={{ left: (2.1 / MAKS) * bredde, width: 4, top: -6, bottom: -6 }} />
                        </div>
                        <span className="text-2xl font-black text-slate-900 tabular-nums whitespace-nowrap">{s.tekst}</span>
                    </div>
                </motion.div>
            ))}
            <div className="flex items-center gap-2 text-lg font-bold text-red-600">
                <span className="inline-block bg-red-600" style={{ width: 4, height: 22 }} />
                2,1 = erstatningsnivået
            </div>
        </div>
    );
}

function Notat({ notat, beat }: { notat?: Oppsett['notat']; beat: number }) {
    if (!notat || beat < notat.fraBeat) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute px-5 py-3 rounded-2xl bg-slate-900 text-amber-200 text-2xl font-black whitespace-nowrap"
            style={notat.oppe ? { left: '3%', top: '14%' } : { left: '3%', bottom: '5%' }}
        >
            {notat.tekst}
        </motion.div>
    );
}

export function FodselstalletKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'norge';
    const o = OPPSETT[modus];
    const { geographies } = useFilmVerden(o.fin ? o.hjorner : undefined);
    const projeksjon = useMemo<GeoProjection>(() => {
        const p = modus === 'verden' ? geoNaturalEarth1() : geoMercator();
        return p.fitExtent(
            [
                [40, 160],
                [KART_X1, H - 30],
            ],
            { type: 'MultiPoint', coordinates: o.hjorner } as never
        );
    }, [modus, o.hjorner]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const farger = o.land(beat);
    const tittel = o.tittel[Math.min(beat, o.tittel.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: farger[id] ?? '#f1ede4' }}
                            transition={{ duration: 0.9 }}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}
                {o.naler
                    .filter((n) => n.fraBeat <= beat)
                    .map((n) => {
                        const [x, y] = projeksjon(n.ll) as [number, number];
                        return (
                            <motion.g key={n.tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: n.fraBeat === beat ? 0.4 : 0 }}>
                                {modus !== 'verden' && <circle cx={x} cy={y} r={14} fill="#fff" stroke="#0f172a" strokeWidth={6} />}
                                <text
                                    x={x + n.dx}
                                    y={y + n.dy}
                                    textAnchor={n.dx > 0 ? 'start' : n.dx < 0 ? 'end' : 'middle'}
                                    fontSize={38}
                                    fontWeight={900}
                                    fill="#0f172a"
                                    stroke="#fff"
                                    strokeWidth={8}
                                    paintOrder="stroke"
                                >
                                    {n.tekst}
                                </text>
                            </motion.g>
                        );
                    })}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
            <Soyler soyler={o.soyler} beat={beat} />
            <Notat notat={o.notat} beat={beat} />
        </div>
    );
}
