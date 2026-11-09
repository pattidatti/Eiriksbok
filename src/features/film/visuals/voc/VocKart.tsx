import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoEquirectangular, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over VOC sin verden. «kapplop»: Portugal og Spania styrer sjøveien til Asia, og
 * Nederland kjemper mot Spania. «monopol»: alt øst for Kapp det gode håp er VOC sitt.
 * «asia»: Batavia, Krydderøyene og handelspostene fra Persia til Japan. «rute»: reisen
 * fra Amsterdam rundt Afrika til Batavia, med Kappstaden underveis.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'kapplop' | 'monopol' | 'asia' | 'rute';

const AMSTERDAM: LngLat = [4.9, 52.37];
const LISBOA: LngLat = [-9.14, 38.72];
const KAPP: LngLat = [18.47, -34.36];
const KAPPSTADEN: LngLat = [18.42, -33.92];
const BATAVIA: LngLat = [106.85, -6.2];
const BANDA: LngLat = [129.9, -4.53];
const AMBON: LngLat = [128.18, -3.7];
const MALAKKA: LngLat = [102.25, 2.2];
const CEYLON: LngLat = [80.7, 7.6];
const INDIA: LngLat = [80.2, 13.1];
const PERSIA: LngLat = [56.27, 27.18];
const KINA: LngLat = [113.26, 23.13];
const DEJIMA: LngLat = [129.87, 32.74];

/** Sjøveien rundt Afrika. Punktene ligger i havet, så linja aldri går over land. */
const UT_TIL_KAPP: LngLat[] = [
    [4.0, 52.0],
    [1.5, 51.0],
    [-4.0, 49.6],
    [-12.0, 44.0],
    [-16.0, 32.0],
    [-20.0, 20.0],
    [-20.0, 8.0],
    [-9.0, -2.0],
    [3.0, -12.0],
    [8.0, -22.0],
    [12.0, -32.0],
    [18.4, -36.8],
];
const KAPP_TIL_BATAVIA: LngLat[] = [
    [25.0, -38.0],
    [45.0, -36.0],
    [70.0, -28.0],
    [95.0, -14.0],
    [104.0, -8.2],
    [106.0, -5.6],
];
const PORTUGISISK: LngLat[] = [
    [-10.5, 38.0],
    [-14.0, 30.0],
    [-20.0, 18.0],
    [-19.0, 6.0],
    [-8.0, 0.0],
    [4.0, -10.0],
    [10.0, -22.0],
    [15.0, -34.0],
    [20.0, -37.0],
    [32.0, -34.0],
    [45.0, -22.0],
    [55.0, -5.0],
    [65.0, 8.0],
    [74.0, 14.0],
    [79.0, 5.0],
    [92.0, 4.0],
    [100.0, 3.5],
];

/** Alle land som hører til hvert rike. ISO 3166-1 numerisk. */
const PORTUGAL = '620';
const SPANIA = '724';
const NEDERLAND = '528';

const VID: [LngLat, LngLat] = [
    [-26, -44],
    [150, 60],
];
const ASIA: [LngLat, LngLat] = [
    [40, -16],
    [146, 44],
];

const OVERSKRIFTER: Record<Modus, string[]> = {
    kapplop: [
        '1500-tallet: Portugal og Spania styrer sjøveien',
        'Monopol: bare én får selge',
        'Nederland i krig mot Spania',
        'Nederland vil bryte monopolet',
    ],
    monopol: [
        'VOC: monopol øst for Kapp det gode håp',
        'Andre nederlendere fikk ikke handle her',
        'Monopol i 21 år, til å begynne med',
    ],
    asia: [
        '1619: Batavia, i dag Jakarta',
        'Hovedbasen styrer Krydderøyene',
        '1641: Malakka blir tatt fra Portugal',
        'India og Ceylon',
        'Persia og Kina',
        'Japan: Dejima',
    ],
    rute: [
        'Ut fra Nederland, særlig Amsterdam',
        'Rundt Afrika og over Det indiske hav',
        '1652: Kappstaden',
        'Tur-retur: nesten ett år',
    ],
};

export function VocKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'kapplop';
    const asia = modus === 'asia';
    const utsnitt: Utsnitt | undefined = asia ? ASIA : undefined;
    const { geographies } = useFilmVerden(utsnitt);

    const projeksjon: GeoProjection = useMemo(() => {
        const [sv, no] = asia ? ASIA : VID;
        return geoEquirectangular().fitExtent(
            [
                [30, 120],
                [B - 30, H - 20],
            ],
            { type: 'MultiPoint', coordinates: [sv, no] } as never
        );
    }, [asia]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) =>
        `M ${pts
            .map((ll) =>
                p(ll)
                    .map((n) => n.toFixed(1))
                    .join(' ')
            )
            .join(' L ')}`;

    const farger: Record<string, string> = {};
    if (modus === 'kapplop') {
        farger[PORTUGAL] = '#ea580c';
        farger[SPANIA] = '#ea580c';
        if (beat >= 2) farger[NEDERLAND] = '#2563eb';
    } else {
        farger[NEDERLAND] = '#2563eb';
    }

    const tekst = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    return (
        <div className="absolute inset-0 bg-[#cfe3f0] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'monopol' && <Ostsone p={p} beat={beat} />}
                <Land geographies={geographies} sti={sti} farger={farger} />

                {modus === 'kapplop' && <Kapplop p={p} linje={linje} beat={beat} />}
                {modus === 'monopol' && <Monopol p={p} beat={beat} />}
                {modus === 'asia' && <Asia p={p} beat={beat} />}
                {modus === 'rute' && <Rute p={p} linje={linje} beat={beat} />}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Kapplop({ p, linje, beat }: { p: P; linje: (pts: LngLat[]) => string; beat: number }) {
    const krydder = p([125, -2]);
    return (
        <>
            {/* Portugisernes sjøvei til Asia */}
            <motion.path
                d={linje(PORTUGISISK)}
                fill="none"
                stroke="#ea580c"
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, opacity: beat >= 3 ? 0.35 : 1 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
            />
            <Prikk pt={p(LISBOA)} farge="#ea580c" />
            <Etikett pt={p([-4, 40])} tekst="Portugal og Spania" dx={-20} dy={70} anker="start" />

            {/* Krydderet i øst: alle vil dit */}
            <g transform={`translate(${krydder[0]} ${krydder[1]})`}>
                <circle r={beat >= 1 ? 46 : 30} fill="#dc2626" opacity={0.18} />
                <circle r={13} fill="#b91c1c" stroke="#fff" strokeWidth={4} />
                <Etikett pt={[0, 0]} tekst="Krydderet" dy={-28} />
            </g>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Etikett
                        pt={p([62, 8])}
                        tekst="Mest Portugal og Spania"
                        dy={-26}
                        farge="#c2410c"
                    />
                </motion.g>
            )}

            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Prikk pt={p(AMSTERDAM)} farge="#2563eb" />
                    <Etikett pt={p(AMSTERDAM)} tekst="Nederland" dx={24} dy={-14} anker="start" />
                    {/* Krigen mellom Nederland og Spania */}
                    <Kryss pt={p([0, 46])} />
                    <Etikett
                        pt={p([0, 46])}
                        tekst="krig"
                        dx={36}
                        dy={12}
                        anker="start"
                        farge="#b91c1c"
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.path
                    d={linje([...UT_TIL_KAPP, ...KAPP_TIL_BATAVIA, [118, -6], [125, -3]])}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3.5, ease: 'easeInOut' }}
                />
            )}
        </>
    );
}

/** Feltet øst for Kapp det gode håp, under landene. */
function Ostsone({ p, beat }: { p: P; beat: number }) {
    const hjorner: LngLat[] = [
        [KAPP[0], -44],
        [KAPP[0], 30],
        [60, 30],
        [60, 50],
        [150, 50],
        [150, -44],
    ];
    return (
        <motion.path
            d={`M ${hjorner.map((ll) => p(ll).join(' ')).join(' L ')} Z`}
            fill="#f59e0b"
            initial={{ opacity: 0 }}
            animate={{ opacity: beat >= 1 ? 0.4 : 0.25 }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Monopol({ p, beat }: { p: P; beat: number }) {
    const [kx, ky] = p(KAPP);
    const [, topp] = p([KAPP[0], 30]);
    return (
        <>
            <motion.line
                x1={kx}
                x2={kx}
                y1={ky + 60}
                y2={topp}
                stroke="#b45309"
                strokeWidth={6}
                strokeDasharray="18 12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />
            <g transform={`translate(${kx} ${ky})`}>
                <motion.circle
                    r={16}
                    fill="#b45309"
                    stroke="#fff"
                    strokeWidth={5}
                    animate={{ scale: beat === 1 ? [1, 1.5, 1] : 1 }}
                    transition={{ duration: 1.4, repeat: beat === 1 ? Infinity : 0 }}
                />
            </g>
            <Etikett pt={[kx, ky]} tekst="Kapp det gode håp" dx={-26} dy={12} anker="end" />
            <Prikk pt={p(AMSTERDAM)} farge="#2563eb" />
            <Etikett pt={p(AMSTERDAM)} tekst="Nederland" dx={-24} dy={8} anker="end" />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Etikett pt={p([95, 0])} tekst="Bare VOC" dy={0} storrelse={64} farge="#92400e" />
            </motion.g>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Etikett
                        pt={p([-6, 4])}
                        tekst="Andre nederlendere: stopp"
                        dy={0}
                        farge="#b91c1c"
                    />
                    <Kryss pt={p([6, -12])} />
                </motion.g>
            )}
            {beat >= 2 && <Merke pt={p([95, -24])} tekst="21 år" />}
        </>
    );
}

function Asia({ p, beat }: { p: P; beat: number }) {
    const steder: {
        pt: LngLat;
        navn: string;
        fra: number;
        dx: number;
        dy: number;
        anker?: 'start' | 'end' | 'middle';
    }[] = [
        { pt: BATAVIA, navn: 'Batavia', fra: 0, dx: 0, dy: 50 },
        { pt: BANDA, navn: 'Banda', fra: 1, dx: 22, dy: 44, anker: 'start' },
        { pt: AMBON, navn: 'Ambon', fra: 1, dx: -20, dy: -24, anker: 'end' },
        { pt: MALAKKA, navn: 'Malakka', fra: 2, dx: -22, dy: -14, anker: 'end' },
        { pt: INDIA, navn: 'India', fra: 3, dx: 24, dy: -10, anker: 'start' },
        { pt: CEYLON, navn: 'Ceylon', fra: 3, dx: -22, dy: 30, anker: 'end' },
        { pt: PERSIA, navn: 'Persia', fra: 4, dx: 0, dy: -26 },
        { pt: KINA, navn: 'Kina', fra: 4, dx: -22, dy: -14, anker: 'end' },
        { pt: DEJIMA, navn: 'Dejima', fra: 5, dx: -22, dy: 10, anker: 'end' },
    ];
    const bat = p(BATAVIA);
    return (
        <>
            {/* Linjer fra hovedbasen ut til hver post */}
            {steder
                .slice(1)
                .map((s) =>
                    beat >= s.fra ? (
                        <motion.line
                            key={`l-${s.navn}`}
                            x1={bat[0]}
                            y1={bat[1]}
                            x2={p(s.pt)[0]}
                            y2={p(s.pt)[1]}
                            stroke="#2563eb"
                            strokeWidth={4}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.45 }}
                            transition={{ duration: 1 }}
                        />
                    ) : null
                )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {beat === 2 && <Kryss pt={[p(MALAKKA)[0] + 34, p(MALAKKA)[1] + 34]} />}
                </motion.g>
            )}
            {steder.map((s) => {
                if (beat < s.fra) return null;
                const [x, y] = p(s.pt);
                const ny = s.fra === beat;
                const hoved = s.navn === 'Batavia';
                return (
                    <motion.g
                        key={s.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: ny || hoved ? 1 : 0.8 }}
                        transition={{ duration: 0.6 }}
                    >
                        {hoved ? (
                            <rect
                                x={x - 16}
                                y={y - 16}
                                width={32}
                                height={32}
                                fill="#1d4ed8"
                                stroke="#fff"
                                strokeWidth={5}
                            />
                        ) : (
                            <circle
                                r={ny ? 15 : 11}
                                cx={x}
                                cy={y}
                                fill="#2563eb"
                                stroke="#fff"
                                strokeWidth={4}
                            />
                        )}
                        <Etikett
                            pt={[x, y]}
                            tekst={s.navn}
                            dx={s.dx}
                            dy={s.dy}
                            anker={s.anker ?? 'middle'}
                            storrelse={ny || hoved ? 40 : 32}
                        />
                    </motion.g>
                );
            })}
            {beat >= 1 && beat <= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Etikett pt={p([131, -13])} tekst="Krydderøyene" dy={0} farge="#92400e" />
                </motion.g>
            )}
        </>
    );
}

function Rute({ p, linje, beat }: { p: P; linje: (pts: LngLat[]) => string; beat: number }) {
    const ut = linje(UT_TIL_KAPP);
    const videre = linje(KAPP_TIL_BATAVIA);
    return (
        <>
            <motion.path
                d={ut}
                fill="none"
                stroke="#2563eb"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, ease: 'easeInOut' }}
            />
            {beat >= 1 && (
                <motion.path
                    d={videre}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3.5, ease: 'easeInOut' }}
                />
            )}
            {beat >= 3 && (
                <motion.path
                    d={linje(
                        [...KAPP_TIL_BATAVIA]
                            .reverse()
                            .map(([x, y]) => [x, y - 4] as LngLat)
                            .concat(
                                [...UT_TIL_KAPP].reverse().map(([x, y]) => [x - 3, y] as LngLat)
                            )
                    )}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                />
            )}
            <Prikk pt={p(AMSTERDAM)} farge="#1d4ed8" />
            <Etikett pt={p(AMSTERDAM)} tekst="Amsterdam" dx={24} dy={-14} anker="start" />
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Prikk pt={p(BATAVIA)} farge="#1d4ed8" />
                    <Etikett pt={p(BATAVIA)} tekst="Batavia" dy={-26} />
                    <Etikett
                        pt={p([75, -42])}
                        tekst="Det indiske hav"
                        dy={0}
                        farge="#1e3a5f"
                        storrelse={30}
                    />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
                    <rect
                        x={p(KAPPSTADEN)[0] - 18}
                        y={p(KAPPSTADEN)[1] - 18}
                        width={36}
                        height={36}
                        fill="#b45309"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <Etikett
                        pt={p(KAPPSTADEN)}
                        tekst="Kappstaden"
                        dx={-30}
                        dy={12}
                        anker="end"
                        storrelse={40}
                    />
                </motion.g>
            )}
            {beat >= 3 && <Merke pt={p([55, 32])} tekst="Nesten ett år" />}
        </>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farger,
}: {
    geographies: unknown[];
    sti: GeoPath;
    farger: Record<string, string>;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String(Number((g as { id?: string | number }).id));
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farger[id] ?? '#f5efe0'}
                        stroke="#b9ad92"
                        strokeWidth={1}
                    />
                );
            })}
        </>
    );
});

function Prikk({ pt, farge }: { pt: [number, number]; farge: string }) {
    return <circle cx={pt[0]} cy={pt[1]} r={13} fill={farge} stroke="#fff" strokeWidth={4} />;
}

function Kryss({ pt }: { pt: [number, number] }) {
    const [x, y] = pt;
    return (
        <path
            d={`M ${x - 20} ${y - 20} L ${x + 20} ${y + 20} M ${x + 20} ${y - 20} L ${x - 20} ${y + 20}`}
            stroke="#dc2626"
            strokeWidth={10}
            strokeLinecap="round"
        />
    );
}

/** Et kort med et tall eller en tid, midt på kartet. */
function Merke({ pt, tekst }: { pt: [number, number]; tekst: string }) {
    const bredde = tekst.length * 0.58 * 56 + 60;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={pt[0] - bredde / 2}
                y={pt[1] - 50}
                width={bredde}
                height={90}
                rx={18}
                fill="#0f172a"
            />
            <text
                x={pt[0]}
                y={pt[1] + 14}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill="#fbbf24"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Etikett({
    pt,
    tekst,
    dx = 0,
    dy,
    farge = '#0f172a',
    anker = 'middle',
    storrelse = 34,
}: {
    pt: [number, number];
    tekst: string;
    dx?: number;
    dy: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
    storrelse?: number;
}) {
    return (
        <text
            x={pt[0] + dx}
            y={pt[1] + dy}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
