import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Norge med kommunene som skiller seg ut.
 * «kommuner»: Træna, Frøya, Gamvik og Båtsfjord med høyest andel, Rindal med lavest, og
 * fella: en høy andel i en liten kommune er bare noen hundre mennesker.
 * «oslo»: bydelene i Oslo mot Rindal. Utvalget du velger, gir tallet du får.
 */

type Modus = 'kommuner' | 'oslo';

const B = 1600;
const H = 900;
const NORGE = 578;
const UTSNITT: Utsnitt = [
    [3.5, 57.6],
    [31.5, 71.3],
];

const HOY = '#ea580c';
const LAV = '#2563eb';

interface Nal {
    id: string;
    ll: [number, number];
    tekst: string;
    farge: string;
    fraBeat: number;
    dx: number;
    dy: number;
    anker: 'start' | 'end' | 'middle';
    liten?: boolean;
}

const KOMMUNER: Nal[] = [
    { id: 'traena', ll: [12.1, 66.5], tekst: 'Træna 32 %', farge: HOY, fraBeat: 1, dx: -28, dy: 0, anker: 'end', liten: true },
    { id: 'froya', ll: [8.7, 63.73], tekst: 'Frøya 31 %', farge: HOY, fraBeat: 2, dx: -28, dy: -8, anker: 'end' },
    { id: 'gamvik', ll: [28.2, 71.04], tekst: 'Gamvik 31 %', farge: HOY, fraBeat: 2, dx: -28, dy: -6, anker: 'end', liten: true },
    { id: 'batsfjord', ll: [29.72, 70.63], tekst: 'Båtsfjord 31 %', farge: HOY, fraBeat: 2, dx: -40, dy: 62, anker: 'middle', liten: true },
    { id: 'rindal', ll: [9.2, 63.06], tekst: 'Rindal 5 %', farge: LAV, fraBeat: 2, dx: 26, dy: 22, anker: 'start' },
];

const OSLO_NALER: Nal[] = [
    { id: 'oslo', ll: [10.75, 59.91], tekst: 'Oslo', farge: HOY, fraBeat: 0, dx: 28, dy: 8, anker: 'start' },
    { id: 'rindal', ll: [9.2, 63.06], tekst: 'Rindal', farge: LAV, fraBeat: 3, dx: 26, dy: 10, anker: 'start' },
];

const TITLER: Record<Modus, string[]> = {
    kommuner: [
        'Hvor bor innvandrerne?',
        'Størst andel: Træna',
        'Høyest og lavest',
        'Små kommuner',
        'Andel og antall',
        'Andel og antall',
    ],
    oslo: ['Jo mindre område', 'Bydeler i Oslo', 'Bydeler i Oslo', 'Velg utvalget, få tallet', 'Bydel eller Rindal: ingen viser hele bildet'],
};

function Soyle({ etikett, verdi, farge, forsinkelse = 0 }: { etikett: string; verdi: number; farge: string; forsinkelse?: number }) {
    const bredde = 110;
    return (
        <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse }}
            className="flex items-center gap-3 mb-3"
        >
            <div className="text-slate-800 font-bold text-right shrink-0" style={{ width: 160, fontSize: 19 }}>
                {etikett}
            </div>
            <div className="relative rounded-full bg-slate-200 shrink-0" style={{ height: 22, width: bredde }}>
                <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: farge }}
                    initial={{ width: 0 }}
                    animate={{ width: (verdi / 50) * bredde }}
                    transition={{ delay: forsinkelse + 0.2, duration: 1 }}
                />
            </div>
            <span className="font-black tabular-nums whitespace-nowrap" style={{ fontSize: 22, color: farge }}>
                {String(verdi).replace('.', ',')} %
            </span>
        </motion.div>
    );
}

function Panel({ children, bred = false }: { children: React.ReactNode; bred?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={{ right: '3%', top: '22%', width: bred ? '44%' : '38%' }}
        >
            {children}
        </motion.div>
    );
}

function KommunePanel({ beat }: { beat: number }) {
    if (beat <= 2)
        return (
            <Panel key="andel">
                <div className="text-slate-500 font-bold mb-2" style={{ fontSize: 20 }}>
                    andel innvandrere, 2026
                </div>
                <div className="font-black text-slate-900" style={{ fontSize: 34 }}>
                    Hele landet: 17,5 %
                </div>
                {beat >= 1 && (
                    <div className="font-black mt-2" style={{ fontSize: 30, color: HOY }}>
                        Høyest: Træna, 32 %
                    </div>
                )}
                {beat >= 2 && (
                    <div className="font-black mt-2" style={{ fontSize: 30, color: LAV }}>
                        Lavest: Rindal, 5 %
                    </div>
                )}
            </Panel>
        );
    if (beat === 3)
        return (
            <Panel key="sma">
                <div className="font-black text-slate-900 mb-3" style={{ fontSize: 32 }}>
                    Små kommuner
                </div>
                {['Træna', 'Gamvik', 'Båtsfjord'].map((n) => (
                    <div key={n} className="font-bold text-slate-700" style={{ fontSize: 28 }}>
                        {n}
                    </div>
                ))}
                <div className="text-slate-500 font-bold mt-3" style={{ fontSize: 22 }}>
                    få innbyggere
                </div>
            </Panel>
        );
    if (beat === 4)
        return (
            <Panel key="antall">
                <div className="text-slate-500 font-bold" style={{ fontSize: 22 }}>
                    høy andel i en liten kommune (2023)
                </div>
                <div className="font-black text-slate-900 mt-1" style={{ fontSize: 34 }}>
                    =
                </div>
                <div className="font-black mt-1" style={{ fontSize: 34, color: HOY }}>
                    100 til 600 innvandrere
                </div>
            </Panel>
        );
    return (
        <Panel key="ord">
            <div className="font-black text-slate-900" style={{ fontSize: 32 }}>
                Andel
            </div>
            <div className="text-slate-600 font-bold mb-4" style={{ fontSize: 24 }}>
                hvor stor del av innbyggerne
            </div>
            <div className="font-black text-slate-900" style={{ fontSize: 32 }}>
                Antall
            </div>
            <div className="text-slate-600 font-bold" style={{ fontSize: 24 }}>
                hvor mange personer
            </div>
        </Panel>
    );
}

function OsloPanel({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <Panel key="niva">
                <div className="flex flex-col gap-3 font-black" style={{ fontSize: 32 }}>
                    <span className="text-slate-900">Hele landet</span>
                    <span className="text-slate-700 pl-8">en kommune</span>
                    <span className="pl-16" style={{ color: HOY }}>
                        en bydel
                    </span>
                </div>
                <div className="text-slate-500 font-bold mt-3" style={{ fontSize: 22 }}>
                    mindre område, kan gi større utslag
                </div>
            </Panel>
        );
    return (
        <Panel key="bydeler" bred>
            <div className="text-slate-500 font-bold mb-3" style={{ fontSize: 20 }}>
                andel innvandrere
            </div>
            <Soyle etikett="Stovner" verdi={43} farge={HOY} />
            {beat >= 2 && (
                <>
                    <Soyle etikett="Søndre Nordstrand" verdi={40} farge={HOY} forsinkelse={0.2} />
                    <Soyle etikett="Grorud" verdi={40} farge={HOY} forsinkelse={0.5} />
                </>
            )}
            {beat >= 3 && <Soyle etikett="Rindal" verdi={5} farge={LAV} forsinkelse={0.3} />}
            {beat >= 4 && <Soyle etikett="Hele landet" verdi={17.5} farge="#475569" forsinkelse={0.3} />}
        </Panel>
    );
}

export function InnvandringKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kommuner';
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 110],
                    [900, H - 30],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const naler = modus === 'kommuner' ? KOMMUNER : OSLO_NALER;
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={Number(g.id) === NORGE ? '#fdf4e3' : '#e7e5e4'}
                        stroke="#a8a29e"
                        strokeWidth={1}
                    />
                ))}
                {naler
                    .filter((n) => n.fraBeat <= beat)
                    .map((n) => {
                        const [x, y] = p(n.ll);
                        const fremhev = modus === 'kommuner' && beat === 3 ? !!n.liten : true;
                        const demp = modus === 'kommuner' && beat >= 3 && !fremhev;
                        return (
                            <motion.g
                                key={n.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: demp ? 0.3 : 1 }}
                                transition={{ delay: n.fraBeat === beat ? 0.4 : 0 }}
                            >
                                {modus === 'kommuner' && beat === 3 && n.liten && (
                                    <circle cx={x} cy={y} r={30} fill="none" stroke={n.farge} strokeWidth={5} />
                                )}
                                <circle cx={x} cy={y} r={15} fill={n.farge} stroke="#fff" strokeWidth={5} />
                                <text
                                    x={x + n.dx}
                                    y={y + n.dy + 11}
                                    textAnchor={n.anker}
                                    fontSize={34}
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
                {modus === 'kommuner' ? (
                    <KommunePanel key={`k${beat <= 2 ? 0 : beat}`} beat={beat} />
                ) : (
                    <OsloPanel key={`o${beat === 0 ? 0 : 1}`} beat={beat} />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold shadow-xl whitespace-nowrap"
                    style={{ fontSize: 28 }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
