import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Hakk, Skjold, SvgOverskrift } from './felles';
import { tekstBredde } from './maal';

/**
 * Norgeskartet til politi-filmen, med et panel til høyre.
 * «distrikter»: 54 politidistrikter før 2002 blir 12, med Politidirektoratet over.
 * «hamar»: Spesialenheten står utenfor politiet, med hovedkontor på Hamar.
 * «tillit»: 73 prosent har høy tillit i 2025, størst i Oslo og lavest i Finnmark.
 */

type Modus = 'distrikter' | 'hamar' | 'tillit';
type LngLat = [number, number];

const NORGE = '578';
const UTSNITT: Utsnitt = [
    [-2, 54],
    [36, 72],
];
const HAMAR: LngLat = [11.07, 60.79];
const OSLO: LngLat = [10.75, 59.91];
const FINNMARK: LngLat = [25.5, 69.9];

const OVERSKRIFT: Record<Modus, string[]> = {
    distrikter: ['Før 2002: 54 politidistrikter', 'Siden 2016: tolv', 'Hvem leder?'],
    hamar: ['Politifolk kan gjøre feil', 'Spesialenheten, fra 2005', 'Politiet etterforsker ikke seg selv', 'Utenfor politiet', 'Når noen dør eller blir alvorlig skadet'],
    tillit: ['Politiet trenger folks tillit', 'Tillit til politiet i 2025', 'Tillit til politiet i 2025', 'Hvor er tilliten størst?'],
};

export function PolitietKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'distrikter';
    const { geographies } = useFilmVerden(UTSNITT);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 130],
                    [700, 880],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [4.5, 57.9],
                        [31.2, 71.2],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3ef' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Land geographies={geographies} sti={sti} />
                <rect x={760} y={130} width={810} height={740} rx={30} fill="#ffffff" opacity={0.9} />
                {modus === 'distrikter' && <Distrikter beat={beat} />}
                {modus === 'hamar' && <Hamar beat={beat} p={p} />}
                {modus === 'tillit' && <Tillit beat={beat} p={p} />}
                <SvgOverskrift tekst={tekst} />
            </svg>
        </div>
    );
}

function Distrikter({ beat }: { beat: number }) {
    const mange = beat === 0;
    const antall = mange ? 54 : 12;
    const kol = mange ? 9 : 4;
    const steg = mange ? 82 : 150;
    const s = mange ? 0.75 : 1.25;
    const x0 = mange ? 1165 - (kol - 1) * steg * 0.5 : 1165 - (kol - 1) * steg * 0.5;
    const y0 = beat >= 2 ? 470 : mange ? 270 : 360;
    return (
        <>
            {Array.from({ length: antall }, (_, i) => {
                const x = x0 + (i % kol) * steg;
                const y = y0 + Math.floor(i / kol) * (mange ? 92 : 125);
                return (
                    <motion.g
                        key={`${antall}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * (mange ? 0.02 : 0.06), duration: 0.3 }}
                    >
                        <Skjold x={x} y={y} s={s} />
                    </motion.g>
                );
            })}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <rect x={940} y={180} width={450} height={90} rx={20} fill="#1e3a8a" />
                    <text x={1165} y={240} textAnchor="middle" fontSize={38} fontWeight={800} fill="#ffffff">
                        Politidirektoratet
                    </text>
                    {[0, 1, 2, 3].map((k) => (
                        <line key={k} x1={1165} y1={270} x2={x0 + k * steg} y2={y0 - 60} stroke="#1e3a8a" strokeWidth={4} />
                    ))}
                    <text x={1165} y={830} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">
                        Hvert distrikt: en politimester
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={1165} y={800} textAnchor="middle" fontSize={40} fontWeight={800} fill="#1e3a8a">
                    12 politidistrikter
                </motion.text>
            )}
            {beat === 0 && (
                <text x={1165} y={820} textAnchor="middle" fontSize={40} fontWeight={800} fill="#475569">
                    54 politidistrikter
                </text>
            )}
        </>
    );
}

function Boks({ x, y, b, h, farge, tittel, tekst }: { x: number; y: number; b: number; h: number; farge: string; tittel: string; tekst?: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect x={x} y={y} width={b} height={h} rx={22} fill={farge} />
            <text x={x + b / 2} y={y + (tekst ? h / 2 - 6 : h / 2 + 14)} textAnchor="middle" fontSize={38} fontWeight={800} fill="#ffffff">
                {tittel}
            </text>
            {tekst && (
                <text x={x + b / 2} y={y + h / 2 + 40} textAnchor="middle" fontSize={30} fontWeight={600} fill="#e2e8f0">
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

function Pin({ ll, p, farge, tekst, dx, dy }: { ll: LngLat; p: (ll: LngLat) => [number, number]; farge: string; tekst: string; dx: number; dy: number }) {
    const [x, y] = p(ll);
    const b = tekstBredde(tekst, 34) + 50;
    const kx = x + dx;
    const ky = y + dy;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <line x1={x} y1={y} x2={kx} y2={ky} stroke={farge} strokeWidth={4} />
            <circle cx={x} cy={y} r={13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <rect x={kx - b / 2} y={ky - 36} width={b} height={72} rx={18} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={kx} y={ky + 12} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                {tekst}
            </text>
        </motion.g>
    );
}

function Hamar({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    return (
        <>
            <Boks x={810} y={190} b={380} h={250} farge="#1e3a8a" tittel="Politiet" />
            <g opacity={0.9}>
                {[0, 1, 2].map((i) => (
                    <Skjold key={i} x={900 + i * 100} y={395} s={0.8} farge="#3b82f6" />
                ))}
            </g>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={780} y={500} width={440} height={90} rx={20} fill="#fee2e2" stroke="#dc2626" strokeWidth={4} />
                    <text x={1000} y={557} textAnchor="middle" fontSize={34} fontWeight={800} fill="#991b1b">
                        Også de kan bryte loven
                    </text>
                </motion.g>
            )}
            {beat >= 1 && (
                <Boks x={1215} y={190} b={340} h={250} farge="#0f766e" tittel="Spesialenheten" tekst="fra 1. januar 2005" />
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path d="M 1380 440 L 1380 500 L 1000 500 L 1000 450" fill="none" stroke="#0f766e" strokeWidth={7} />
                    <path d="M 1000 446 l -18 30 l 36 0 Z" fill="#0f766e" />
                    <text x={1190} y={550} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                        etterforsker
                    </text>
                </motion.g>
            )}
            {beat >= 3 && <Pin ll={HAMAR} p={p} farge="#0f766e" tekst="Hovedkontor: Hamar" dx={250} dy={-30} />}
            {beat >= 3 && beat < 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={810} y={620} width={720} height={90} rx={20} fill="#ccfbf1" />
                    <text x={1170} y={678} textAnchor="middle" fontSize={34} fontWeight={800} fill="#115e59">
                        Egen enhet, utenfor resten av politiet
                    </text>
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={810} y={610} width={720} height={200} rx={20} fill="#ffffff" stroke="#0f766e" strokeWidth={6} />
                    <text x={1170} y={672} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0f172a">
                        Alle saker der noen dør eller
                    </text>
                    <text x={1170} y={722} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0f172a">
                        blir alvorlig skadet i møte med politiet
                    </text>
                    <text x={1170} y={776} textAnchor="middle" fontSize={30} fontWeight={600} fill="#475569">
                        også når ingen er mistenkt
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Tillit({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const x0 = 830;
    const bredde = 670;
    return (
        <>
            {beat === 0 && (
                <>
                    {['Melde fra om lovbrudd', 'Fortelle hva de har sett', 'Følge ordrer'].map((t, i) => (
                        <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.4 }}>
                            <Hakk x={x0 + 30} y={290 + i * 140} r={28} />
                            <text x={x0 + 80} y={302 + i * 140} fontSize={40} fontWeight={800} fill="#0f172a">
                                {t}
                            </text>
                        </motion.g>
                    ))}
                    <text x={x0 + 335} y={780} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                        Ellers blir jobben vanskelig
                    </text>
                </>
            )}
            {beat >= 1 && (
                <>
                    <text x={x0 + bredde / 2} y={330} textAnchor="middle" fontSize={130} fontWeight={900} fill="#0f766e">
                        73 %
                    </text>
                    <rect x={x0} y={390} width={bredde} height={70} rx={20} fill="#e2e8f0" />
                    <motion.rect x={x0} y={390} height={70} rx={20} fill="#0d9488" initial={{ width: 0 }} animate={{ width: bredde * 0.73 }} transition={{ duration: 1.3 }} />
                    <text x={x0 + bredde / 2} y={520} textAnchor="middle" fontSize={32} fontWeight={700} fill="#334155">
                        svært eller ganske høy tillit
                    </text>
                </>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={x0} y={580} width={bredde} height={200} rx={22} fill="#ffffff" stroke="#0d9488" strokeWidth={6} />
                    <text x={x0 + 40} y={655} fontSize={40} fontWeight={900} fill="#0f766e">
                        ▲ 3 prosentpoeng
                    </text>
                    <text x={x0 + 40} y={705} fontSize={32} fontWeight={700} fill="#334155">
                        mer enn året før
                    </text>
                    <text x={x0 + 40} y={752} fontSize={32} fontWeight={700} fill="#334155">
                        Høyest siden målingen startet i 2022
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <>
                    <Pin ll={OSLO} p={p} farge="#0d9488" tekst="Oslo: størst" dx={150} dy={60} />
                    <Pin ll={FINNMARK} p={p} farge="#d97706" tekst="Finnmark: lavest" dx={-150} dy={120} />
                    <text x={x0 + bredde / 2} y={660} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        Tilliten varierer i landet
                    </text>
                </>
            )}
        </>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === NORGE ? '#fde68a' : '#ece6d6'}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                />
            ))}
        </>
    );
});
