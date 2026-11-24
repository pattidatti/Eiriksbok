import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Norge med geopolitiske briller: kart til venstre, tekst og stolper til høyre.
 *
 * Beat 0: Norge, «småstat?». Beat 1: hva en småstat er. Beat 2: åttende største i Europa,
 * lang kyst, hav, olje og gass. Beat 3: grensene mot Sverige og Finland som stolper.
 * Beat 4: grensen mot Russland, kortest. Beat 5: stormakt, Murmansk og Nordflåten.
 */

type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [-2, 56],
    [44, 72],
];
const ID = { norge: '578', sverige: '752', finland: '246', russland: '643' };
const FARGER = { norge: '#3b82f6', sverige: '#facc15', finland: '#2dd4bf', russland: '#ef4444' };

const GRENSER = [
    { navn: 'Sverige', km: 1630, farge: FARGER.sverige, fra: 3 },
    { navn: 'Finland', km: 736, farge: FARGER.finland, fra: 3 },
    { navn: 'Russland', km: 198, farge: FARGER.russland, fra: 4 },
];

const Land = memo(function Land({
    geographies,
    sti,
    farge,
    kyst,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farge: (id: string) => string;
    kyst: boolean;
}) {
    return (
        <g>
            {geographies.map((g, i) => {
                const id = String(g.id ?? '');
                return (
                    <path
                        key={`${id}-${i}`}
                        d={sti(g as never) ?? ''}
                        fill={farge(id)}
                        stroke={kyst && id === ID.norge ? '#1e3a8a' : '#ffffff'}
                        strokeWidth={kyst && id === ID.norge ? 3 : 0.8}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </g>
    );
});

function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    str = 34,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={800}
            fill={farge}
            style={{
                paintOrder: 'stroke',
                stroke: '#ffffff',
                strokeWidth: 9,
                strokeLinejoin: 'round',
            }}
        >
            {tekst}
        </text>
    );
}

function Panel({ beat }: { beat: number }) {
    const venstre = 980;
    if (beat <= 2) {
        const innhold: { tittel: string; linjer: string[] }[] = [
            { tittel: 'Norge: en småstat?', linjer: ['Norge blir ofte regnet', 'som en småstat'] },
            {
                tittel: 'Småstat',
                linjer: [
                    'Et selvstendig land som er lite',
                    'sammenlignet med andre:',
                    '· folketall',
                    '· økonomi',
                    '· militær makt',
                    'Ingen fast grense',
                ],
            },
            {
                tittel: 'Men også:',
                linjer: [
                    '8. største land i Europa i areal',
                    'Lang kyst og mye hav',
                    'Store ressurser av olje og gass',
                ],
            },
        ];
        const k = innhold[beat];
        return (
            <AnimatePresence mode="wait">
                <motion.g
                    key={beat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <rect
                        x={venstre}
                        y={150}
                        width={590}
                        height={110 + k.linjer.length * 54}
                        rx={24}
                        fill="#ffffff"
                        opacity={0.95}
                    />
                    <text x={venstre + 30} y={218} fontSize={44} fontWeight={900} fill="#0f172a">
                        {k.tittel}
                    </text>
                    {k.linjer.map((l, i) => (
                        <text
                            key={l}
                            x={venstre + 30}
                            y={280 + i * 54}
                            fontSize={32}
                            fontWeight={i === k.linjer.length - 1 && beat === 1 ? 800 : 600}
                            fill={i === k.linjer.length - 1 && beat === 1 ? '#b91c1c' : '#334155'}
                        >
                            {l}
                        </text>
                    ))}
                </motion.g>
            </AnimatePresence>
        );
    }
    const maks = 1630;
    const bredde = 380;
    return (
        <g>
            <rect
                x={venstre}
                y={150}
                width={590}
                height={beat >= 5 ? 640 : 520}
                rx={24}
                fill="#ffffff"
                opacity={0.95}
            />
            <text x={venstre + 30} y={214} fontSize={42} fontWeight={900} fill="#0f172a">
                Grensene til Norge
            </text>
            {GRENSER.map((g, i) => {
                if (beat < g.fra) return null;
                const y = 270 + i * 110;
                const w = (g.km / maks) * bredde;
                return (
                    <g key={g.navn}>
                        <text
                            x={venstre + 30}
                            y={y + 22}
                            fontSize={30}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {g.navn}
                        </text>
                        <motion.rect
                            x={venstre + 30}
                            y={y + 38}
                            height={40}
                            rx={8}
                            fill={g.farge}
                            stroke="#0f172a"
                            strokeWidth={2}
                            initial={{ width: 0 }}
                            animate={{ width: w }}
                            transition={{ duration: 1.2, delay: 0.2 }}
                        />
                        <text
                            x={venstre + 30 + w + 14}
                            y={y + 70}
                            fontSize={30}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {g.km} km
                        </text>
                    </g>
                );
            })}
            {beat >= 4 && (
                <text x={venstre + 30} y={630} fontSize={28} fontWeight={800} fill="#b91c1c">
                    Kortest, men får mest oppmerksomhet
                </text>
            )}
            {beat >= 5 && (
                <g>
                    <text x={venstre + 30} y={690} fontSize={28} fontWeight={700} fill="#334155">
                        Russland er en stormakt, og Murmansk
                    </text>
                    <text x={venstre + 30} y={732} fontSize={28} fontWeight={700} fill="#334155">
                        og Nordflåten ligger så nær
                    </text>
                </g>
            )}
        </g>
    );
}

export function GeopolitikkNorge({ beat }: VisualProps) {
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [20, 30],
                    [960, H - 20],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [2, 57.5],
                        [40, 57.5],
                        [40, 71.5],
                        [2, 71.5],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const farge = (id: string) => {
        if (id === ID.norge) return FARGER.norge;
        if (beat >= 3 && id === ID.sverige) return FARGER.sverige;
        if (beat >= 3 && id === ID.finland) return FARGER.finland;
        if (beat >= 4 && id === ID.russland) return FARGER.russland;
        return '#e2e8f0';
    };
    const murmansk = p([33.08, 68.97]);
    const grense = p([30.2, 69.4]);
    const no = p([9, 61.2]);
    const se = p([15.5, 63.2]);
    const fi = p([26.5, 63]);
    const ru = p([33.5, 61.6]);
    const hav = p([7, 66]);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#dbeafe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <filter id="geo-norge-hav" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="22" />
                    </filter>
                </defs>
                {beat === 2 && (
                    <motion.ellipse
                        cx={hav[0]}
                        cy={hav[1]}
                        rx={170}
                        ry={290}
                        fill="#0ea5e9"
                        filter="url(#geo-norge-hav)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                    />
                )}
                <Land geographies={geographies} sti={sti} farge={farge} kyst={beat === 2} />
                <Etikett x={no[0]} y={no[1]} tekst="Norge" farge="#1e3a8a" str={40} />
                {beat === 2 && (
                    <Etikett
                        x={hav[0] + 60}
                        y={hav[1] - 140}
                        tekst="Hav, olje og gass"
                        farge="#075985"
                        str={32}
                    />
                )}
                {beat >= 3 && <Etikett x={se[0]} y={se[1]} tekst="Sverige" farge="#854d0e" />}
                {beat >= 3 && <Etikett x={fi[0]} y={fi[1]} tekst="Finland" farge="#115e59" />}
                {beat >= 4 && (
                    <Etikett
                        x={ru[0]}
                        y={ru[1]}
                        tekst={beat >= 5 ? 'Russland: stormakt' : 'Russland'}
                        farge="#991b1b"
                    />
                )}
                {beat >= 4 && (
                    <circle
                        cx={grense[0]}
                        cy={grense[1]}
                        r={28}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={6}
                    >
                        <animate
                            attributeName="r"
                            values="22;40;22"
                            dur="1.6s"
                            repeatCount="indefinite"
                        />
                    </circle>
                )}
                {beat >= 5 && (
                    <g>
                        <circle
                            cx={murmansk[0]}
                            cy={murmansk[1]}
                            r={14}
                            fill="#16a34a"
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                        <Etikett
                            x={murmansk[0] - 190}
                            y={murmansk[1] + 56}
                            tekst="Murmansk og Nordflåten"
                            farge="#15803d"
                            str={28}
                        />
                    </g>
                )}
                <Panel beat={beat} />
            </svg>
        </div>
    );
}
