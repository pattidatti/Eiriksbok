import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { QIBLA_GRADER } from './data';

/**
 * Bønneretningene sett fra Norge. Mekka, Jerusalem og Bahjí ligger langt fra hverandre, men
 * fra Norge peker alle tre omtrent mot sørøst (Bønnekompasset: 139 og 138 grader).
 * Pilene er retninger fra Norge, ikke ruter noe har flyttet seg langs.
 *
 * «abraham»: jødedommen og Jerusalem, så islam og Mekka.
 * «bahai»: de tre nyere bevegelsene, så Bahjí nær Akko, og alle tre retningene til slutt.
 */

type Modus = 'abraham' | 'bahai';

const B = 1600;
const H = 900;

const NORGE: [number, number] = [10.75, 59.9];

interface Sted {
    id: string;
    navn: string;
    under: string;
    ll: [number, number];
    farge: string;
    side: 'h' | 'v';
    dy: number;
}

const STEDER: Record<string, Sted> = {
    jerusalem: {
        id: 'jerusalem',
        navn: 'Jerusalem',
        under: 'jødedommen',
        ll: [35.23, 31.78],
        farge: '#2563eb',
        side: 'v',
        dy: 22,
    },
    mekka: {
        id: 'mekka',
        navn: 'Mekka',
        under: 'islam',
        ll: [39.83, 21.42],
        farge: '#059669',
        side: 'h',
        dy: 10,
    },
    bahji: {
        id: 'bahji',
        navn: 'Bahjí, nær Akko',
        under: "bahá'í",
        ll: [35.09, 32.94],
        farge: '#0d9488',
        side: 'h',
        dy: -34,
    },
};

/** Hvilke steder og piler som vises på hver beat. */
function oppsett(modus: Modus, beat: number) {
    if (modus === 'abraham') {
        const steder = beat >= 2 ? ['jerusalem', 'mekka'] : ['jerusalem'];
        const piler = beat >= 2 ? ['jerusalem', 'mekka'] : beat >= 1 ? ['jerusalem'] : [];
        return { steder, piler, nåler: beat >= 2 ? [QIBLA_GRADER] : [] };
    }
    if (beat <= 1) return { steder: [], piler: [], nåler: [] };
    if (beat <= 3) return { steder: ['bahji'], piler: beat >= 3 ? ['bahji'] : [], nåler: [] };
    return {
        steder: ['jerusalem', 'mekka', 'bahji'],
        piler: ['jerusalem', 'mekka', 'bahji'],
        nåler: [QIBLA_GRADER, 138],
    };
}

const TEKST: Record<Modus, string[]> = {
    abraham: [
        'Jødedommen: morgen, ettermiddag og kveld',
        'Ansiktet mot Jerusalem',
        'Fra Norge: begge mot sørøst',
        'Langt fra hverandre, ulike steder',
    ],
    bahai: [
        'Tre nyere bevegelser',
        'Hvor de kommer fra',
        "Bahá'í: tre bønner, du velger én",
        'Mot graven ved Bahjí',
        'Tre steder, nesten samme retning',
    ],
};

const BEVEGELSER = [
    { navn: "Bahá'í", fra: 'fra sjia-islam', farge: '#0d9488' },
    { navn: 'Mormonismen', fra: 'fra kristendommen', farge: '#7c3aed' },
    { navn: 'Jehovas vitner', fra: 'fra kristendommen', farge: '#0284c7' },
];

function Kompass({ nåler }: { nåler: number[] }) {
    const cx = 1420;
    const cy = 700;
    const r = 120;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <circle cx={cx} cy={cy} r={r + 26} fill="#ffffff" stroke="#334155" strokeWidth={4} />
            {['N', 'Ø', 'S', 'V'].map((b, i) => {
                const a = (i * Math.PI) / 2;
                return (
                    <text
                        key={b}
                        x={cx + Math.sin(a) * (r - 4)}
                        y={cy - Math.cos(a) * (r - 4) + 11}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={900}
                        fill="#334155"
                    >
                        {b}
                    </text>
                );
            })}
            {nåler.map((g, i) => {
                const a = (g * Math.PI) / 180;
                const x2 = cx + Math.sin(a) * (r - 34);
                const y2 = cy - Math.cos(a) * (r - 34);
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={x2}
                        y2={y2}
                        stroke={i === 0 ? '#dc2626' : '#0d9488'}
                        strokeWidth={i === 0 ? 10 : 6}
                        strokeLinecap="round"
                    />
                );
            })}
            <circle cx={cx} cy={cy} r={9} fill="#0f172a" />
            <text
                x={cx}
                y={cy + r + 70}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#0f172a"
            >
                Sett fra Norge
            </text>
        </motion.g>
    );
}

export function BonnKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'abraham';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 150],
                    [B - 60, H - 20],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-25, 14],
                        [80, 67],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const { steder, piler, nåler } = oppsett(modus, beat);
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const norge = p(NORGE);
    const dempet = modus === 'bahai' && beat <= 1;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bfdbfe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <marker
                        id="bonn-pil"
                        viewBox="0 0 10 10"
                        refX="7"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#0f172a" />
                    </marker>
                </defs>
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={String(g.id) === '578' ? '#fecaca' : '#f5f0e6'}
                        stroke="#a8a29e"
                        strokeWidth={1}
                    />
                ))}
                {!dempet && (
                    <g>
                        <circle
                            cx={norge[0]}
                            cy={norge[1]}
                            r={14}
                            fill="#dc2626"
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        <text
                            x={norge[0] - 26}
                            y={norge[1] + 10}
                            textAnchor="end"
                            fontSize={38}
                            fontWeight={900}
                            fill="#991b1b"
                            stroke="#ffffff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Norge
                        </text>
                    </g>
                )}
                {piler.map((id) => {
                    const d =
                        sti({ type: 'LineString', coordinates: [NORGE, STEDER[id].ll] } as never) ??
                        '';
                    return (
                        <motion.path
                            key={`pil-${id}`}
                            d={d}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth={6}
                            strokeLinecap="round"
                            markerEnd="url(#bonn-pil)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 0.97 }}
                            transition={{ duration: 1.4 }}
                        />
                    );
                })}
                {steder.map((id) => {
                    const s = STEDER[id];
                    const [x, y] = p(s.ll);
                    const ax = s.side === 'h' ? x + 26 : x - 26;
                    const anker = s.side === 'h' ? 'start' : 'end';
                    const lys = modus === 'abraham' && beat === 3;
                    return (
                        <motion.g
                            key={id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            {lys && (
                                <circle cx={x} cy={y} r={30} fill={s.farge} opacity={0.3}>
                                    <animate
                                        attributeName="r"
                                        values="18;44;18"
                                        dur="2.4s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}
                            <circle
                                cx={x}
                                cy={y}
                                r={13}
                                fill={s.farge}
                                stroke="#fff"
                                strokeWidth={4}
                            />
                            <text
                                x={ax}
                                y={y + s.dy}
                                textAnchor={anker}
                                fontSize={36}
                                fontWeight={900}
                                fill="#0f172a"
                                stroke="#ffffff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {s.navn}
                            </text>
                            <text
                                x={ax}
                                y={y + s.dy + 36}
                                textAnchor={anker}
                                fontSize={30}
                                fontWeight={800}
                                fill={s.farge}
                                stroke="#ffffff"
                                strokeWidth={7}
                                paintOrder="stroke"
                            >
                                {s.under}
                            </text>
                        </motion.g>
                    );
                })}
                {nåler.length > 0 && <Kompass nåler={nåler} />}
                {dempet && (
                    <g>
                        <rect x={0} y={0} width={B} height={H} fill="#f8fafc" opacity={0.75} />
                        {BEVEGELSER.map((b, i) => {
                            const x = 330 + i * 470;
                            return (
                                <motion.g
                                    key={b.navn}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.3, duration: 0.5 }}
                                >
                                    <rect
                                        x={x - 210}
                                        y={360}
                                        width={420}
                                        height={beat >= 1 ? 210 : 140}
                                        rx={26}
                                        fill={b.farge}
                                    />
                                    <text
                                        x={x}
                                        y={448}
                                        textAnchor="middle"
                                        fontSize={46}
                                        fontWeight={900}
                                        fill="#ffffff"
                                    >
                                        {b.navn}
                                    </text>
                                    {beat >= 1 && (
                                        <text
                                            x={x}
                                            y={530}
                                            textAnchor="middle"
                                            fontSize={34}
                                            fontWeight={700}
                                            fill="#ffffff"
                                        >
                                            {b.fra}
                                        </text>
                                    )}
                                </motion.g>
                            );
                        })}
                    </g>
                )}
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
