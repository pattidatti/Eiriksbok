import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { Overskrift } from './Overskrift';

/**
 * Kart over Europa og Middelhavet.
 * - sprak: latin fra Roma blir vulgærlatin, blander seg med språkene i hver del av riket og
 *   blir de romanske språkene
 * - veier: hovedveiene fra Roma, fra Persiabukta til Skottland (forenklet, ikke eksakte traseer)
 */

type Modus = 'sprak' | 'veier';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const ROD = '#9f1239';
const VEI = '#78350f';

const ROMA: LngLat = [12.5, 41.9];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    sprak: [
        [-10, 35],
        [30, 53],
    ],
    veier: [
        [-9, 26],
        [50, 58],
    ],
};

const SPRAK = [
    { id: '250', navn: 'fransk', ll: [2.4, 46.8] as LngLat, farge: '#2563eb' },
    { id: '724', navn: 'spansk', ll: [-3.8, 39.6] as LngLat, farge: '#ea580c' },
    { id: '380', navn: 'italiensk', ll: [13.4, 42.6] as LngLat, farge: '#16a34a' },
    { id: '620', navn: 'portugisisk', ll: [-8.1, 38.4] as LngLat, farge: '#9333ea' },
    { id: '642', navn: 'rumensk', ll: [25, 45.9] as LngLat, farge: '#0891b2' },
];

const SMA = [
    { navn: 'katalansk', ll: [1.6, 41.9] as LngLat },
    { navn: 'sardisk', ll: [9, 40] as LngLat },
    { navn: 'galisisk', ll: [-7.8, 42.9] as LngLat },
];

/** Forenklede hovedveier fra Roma. Punktene er byer langs veien. */
const VEIENE: LngLat[][] = [
    // Nord gjennom Gallia til Britannia og Skottland
    [ROMA, [10.9, 44.6], [4.8, 45.7], [2.3, 48.8], [-0.1, 51.5], [-1.1, 54], [-3.6, 56.2]],
    // Vest til Spania
    [ROMA, [10.9, 44.6], [4.8, 45.7], [3, 43.2], [1.2, 41.1], [-3.7, 40.4], [-6, 37.4]],
    // Øst over Hellas til Lilleasia, Syria og Persiabukta
    [ROMA, [17.9, 40.6], [22.9, 40.6], [29, 41], [32.9, 39.9], [36.2, 36.2], [40.6, 34.4], [44.4, 33.1], [47.8, 30.4]],
    // Nordøst mot Donau
    [ROMA, [10.9, 44.6], [13.8, 45.6], [16.4, 48.2], [20.5, 44.8]],
];

export function ArvenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sprak';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 150],
                    [B - 30, H - 30],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const land = (id: string) =>
        geographies.find((g) => String((g as { id?: unknown }).id) === id) as never;
    const roma = p(ROMA);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3ef' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <Land geographies={geographies} sti={sti} />

                {modus === 'sprak' && geographies.length > 0 && (
                    <>
                        {SPRAK.map((s) => {
                            const farget =
                                (s.id === '380' && beat <= 1) || (beat === 2 && s.id !== '380') || beat >= 3;
                            const farge = beat >= 3 ? s.farge : beat === 2 ? '#fda4af' : '#fecdd3';
                            return (
                                <motion.path
                                    key={s.id}
                                    d={sti(land(s.id)) ?? ''}
                                    initial={false}
                                    animate={{ fill: farget ? farge : '#f5efe0', fillOpacity: beat >= 3 ? 0.75 : 1 }}
                                    transition={{ duration: 1.2 }}
                                    stroke={beat >= 3 ? s.farge : '#b9ad92'}
                                    strokeWidth={2}
                                />
                            );
                        })}
                        {beat === 2 &&
                            SPRAK.filter((s) => s.id !== '380').map((s, i) => (
                                <Bane key={s.id} fra={roma} til={p(s.ll)} farge={ROD} forsinkelse={i * 0.3} />
                            ))}
                        {beat === 2 &&
                            SPRAK.filter((s) => s.id !== '380').map((s, i) => (
                                <Pluss key={s.id} pos={p(s.ll)} forsinkelse={1.4 + i * 0.3} />
                            ))}
                        {beat >= 3 &&
                            SPRAK.map((s, i) => (
                                <Navn
                                    key={s.id}
                                    pos={p(s.ll)}
                                    tekst={beat >= 4 ? s.navn : '?'}
                                    farge={s.farge}
                                    forsinkelse={beat === 4 ? i * 0.35 : 0}
                                />
                            ))}
                        {beat >= 4 &&
                            SMA.map((s, i) => (
                                <Navn key={s.navn} pos={p(s.ll)} tekst={s.navn} farge="#334155" liten forsinkelse={2 + i * 0.4} />
                            ))}
                    </>
                )}

                {modus === 'veier' &&
                    VEIENE.map((v, i) => (
                        <Vei
                            key={i}
                            punkter={v.map(p)}
                            andel={beat === 0 ? 0.35 : 1}
                            forsinkelse={i * 0.25}
                            reise={beat >= 3}
                        />
                    ))}
                {modus === 'veier' && beat >= 2 && (
                    <>
                        <Pin pos={p([47.8, 30.4])} tekst="Persiabukta" over={false} />
                        <Pin pos={p([-3.6, 56.2])} tekst="Skottland" over />
                    </>
                )}

                {(modus === 'veier' || beat <= 2) && <Pin pos={roma} tekst="Roma" over={modus === 'veier'} hoved />}

                {modus === 'sprak' && beat <= 1 && (
                    <Boble pos={roma} tekst={beat === 0 ? 'latin' : 'vulgærlatin'} />
                )}
            </svg>

            <Overskrift tekst={overskrift(modus, beat)} />

            {modus === 'sprak' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute px-6 py-3 rounded-2xl bg-slate-900 text-white text-3xl font-black shadow-xl"
                    style={{ right: '4%', bottom: '8%' }}
                >
                    Rundt 700-tallet
                </motion.div>
            )}
            {modus === 'sprak' && beat >= 5 && (
                <div className="absolute" style={{ right: '4%', bottom: '8%' }}>
                    <Teller verdi={900} prefiks="over " etikett="millioner med romansk morsmål" tone="rod" />
                </div>
            )}
            {modus === 'veier' && beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ left: '4%', bottom: '8%' }}
                >
                    <div className="text-3xl font-black text-slate-900">ca. 700 år</div>
                    <div className="text-lg font-semibold text-slate-500">fram til år 395</div>
                </motion.div>
            )}
            {modus === 'veier' && (
                <div className="absolute text-sm font-semibold text-slate-600" style={{ right: '2%', bottom: '2%' }}>
                    Forenklet: noen av hovedveiene
                </div>
            )}
        </div>
    );
}

function overskrift(modus: Modus, beat: number) {
    if (modus === 'sprak') {
        return ['Romerne snakket latin', 'Vulgærlatin: folkets språk', 'Latin blandes med språkene der', 'Egne språk', 'De romanske språkene', 'Over 900 millioner'][
            Math.min(beat, 5)
        ];
    }
    return ['Alle veier fører til Roma', 'Et nett av hovedveier', 'Fra Persiabukta til Skottland', 'Raskt og trygt'][Math.min(beat, 3)];
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill="#f5efe0" stroke="#b9ad92" strokeWidth={1.5} />
            ))}
        </>
    );
});

function Pin({ pos, tekst, over, hoved }: { pos: [number, number]; tekst: string; over: boolean; hoved?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <circle cx={pos[0]} cy={pos[1]} r={hoved ? 16 : 13} fill={hoved ? ROD : VEI} stroke="#fff" strokeWidth={4} />
            <text
                x={pos[0]}
                y={pos[1] + (over ? -30 : 52)}
                textAnchor="middle"
                fontSize={hoved ? 40 : 36}
                fontWeight={900}
                fill={hoved ? ROD : VEI}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Navn({
    pos,
    tekst,
    farge,
    liten,
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge: string;
    liten?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            key={tekst}
            x={pos[0]}
            y={pos[1] + (liten ? 12 : 14)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
            textAnchor="middle"
            fontSize={liten ? 32 : 40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={liten ? 6 : 9}
            paintOrder="stroke"
                    >
            {tekst}
        </motion.text>
    );
}

function Boble({ pos, tekst }: { pos: [number, number]; tekst: string }) {
    const b = tekst.length * 24 + 50;
    return (
        <motion.g key={tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect x={pos[0] - b / 2 + 60} y={pos[1] - 150} width={b} height={74} rx={36} fill="#ffffff" stroke={ROD} strokeWidth={5} />
            <path d={`M ${pos[0] + 30} ${pos[1] - 78} L ${pos[0] + 10} ${pos[1] - 30} L ${pos[0] + 60} ${pos[1] - 78} Z`} fill="#ffffff" stroke={ROD} strokeWidth={5} />
            <text x={pos[0] + 60} y={pos[1] - 100} textAnchor="middle" fontSize={42} fontWeight={900} fill={ROD}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Pluss({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={28} fill="#ffffff" stroke={ROD} strokeWidth={5} />
            <path
                d={`M ${pos[0] - 14} ${pos[1]} L ${pos[0] + 14} ${pos[1]} M ${pos[0]} ${pos[1] - 14} L ${pos[0]} ${pos[1] + 14}`}
                stroke={ROD}
                strokeWidth={6}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

function Bane({
    fra,
    til,
    farge,
    forsinkelse,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse: number;
}) {
    const midt: [number, number] = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 - 70];
    return (
        <motion.path
            d={`M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`}
            fill="none"
            stroke={farge}
            strokeWidth={6}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ delay: forsinkelse, duration: 1.2 }}
        />
    );
}

function Vei({
    punkter,
    andel,
    forsinkelse,
    reise,
}: {
    punkter: [number, number][];
    andel: number;
    forsinkelse: number;
    reise: boolean;
}) {
    const d = punkter.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
    const fra = punkter[0];
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={VEI}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: andel }}
                transition={{ delay: forsinkelse, duration: 1.6, ease: 'easeInOut' }}
            />
            {reise &&
                [0, 1].map((k) => (
                    <motion.circle
                        key={k}
                        r={10}
                        fill="#facc15"
                        stroke={VEI}
                        strokeWidth={3}
                        initial={{ cx: fra[0], cy: fra[1] }}
                        animate={{
                            cx: (k ? [...punkter].reverse() : punkter).map((q) => q[0]),
                            cy: (k ? [...punkter].reverse() : punkter).map((q) => q[1]),
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: k * 2.5 }}
                    />
                ))}
        </g>
    );
}
