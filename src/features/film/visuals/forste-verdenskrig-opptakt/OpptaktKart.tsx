import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet i opptakten til første verdenskrig, fire moduser:
 * - sarajevo: Europa, så zoom inn mot Sarajevo og Østerrike-Ungarn.
 * - stormakter: verden med de tre stormaktene, koloniene, og Tyskland som vil ha mer.
 * - balkan: det osmanske riket slipper taket, naboene vil inn, nye land vokser fram.
 * - attentat: Bosnia og Serbia, og en skisse av bilturen i Sarajevo (ingen vold vises).
 * Landene tegnes med dagens grenser, omtrent, og det står i hjørnet.
 */

type Modus = 'sarajevo' | 'stormakter' | 'balkan' | 'attentat';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const BLA = '#2563eb';
const ROD = '#dc2626';
const ROD_LYS = '#fecaca';
const LAND_GRA = '#e7e2d6';
const OSMANSK = '#0f766e';

const OU = ['040', '348', '203', '703', '705', '191', '070'];
const AFRIKA = [
    '012', '024', '204', '072', '854', '108', '120', '140', '148', '178', '180', '384', '262', '818',
    '226', '232', '231', '266', '270', '288', '324', '624', '404', '426', '430', '434', '450', '454',
    '466', '478', '504', '508', '516', '562', '566', '646', '686', '694', '706', '710', '728', '729',
    '748', '834', '768', '788', '800', '732', '894', '716',
];
const ASIA = ['356', '586', '050', '104', '144', '704', '418', '116', '458', '360', '608'];
const EUROPA = [
    '826', '372', '250', '276', '380', '724', '620', '056', '528', '442', '756', '040', '348', '203',
    '703', '705', '191', '070', '688', '499', '008', '807', '300', '100', '642', '616', '208', '752',
    '578', '246', '233', '428', '440', '112', '804', '498',
];
const BALKAN_OSMANSK = ['300', '100', '688', '499', '008', '807', '070', '-99', '383'];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    sarajevo: [
        [-11, 34],
        [48, 64],
    ],
    stormakter: [
        [-25, -36],
        [128, 64],
    ],
    balkan: [
        [11, 35],
        [35, 49],
    ],
    attentat: [
        [13.5, 41.4],
        [23.5, 46.6],
    ],
};

/** Det fine kartet bare der vi er nær nok til at det synes. */
const FINT: Partial<Record<Modus, Utsnitt>> = {
    balkan: [
        [11, 35],
        [35, 49],
    ],
    attentat: [
        [13.5, 41.4],
        [23.5, 46.6],
    ],
};

const BYER: Record<string, LngLat> = {
    sarajevo: [18.41, 43.86],
    beograd: [20.46, 44.79],
    wien: [16.37, 48.21],
};

function utsikt(modus: Modus, beat: number): { se: LngLat | null; zoom: number } {
    if (modus === 'sarajevo' && beat >= 1) return { se: [18.6, 45.2], zoom: beat >= 2 ? 2.2 : 3.4 };
    if (modus === 'stormakter' && (beat === 3 || beat === 4)) return { se: [11, 50], zoom: 3.4 };
    if (modus === 'stormakter' && beat === 1) return { se: [4, 50], zoom: 2.6 };
    if (modus === 'stormakter' && beat === 5) return { se: [-2, 36], zoom: 1.8 };
    return { se: null, zoom: 1 };
}

const TITLER: Record<Modus, string[]> = {
    sarajevo: ['Europa, 28. juni 1914', 'Sarajevo i Bosnia', 'Franz Ferdinand', '28. juni 1914'],
    stormakter: ['Europa: verdens sentrum', 'Tre av stormaktene', 'Kolonier', 'Tyskland: samlet i 1871', 'En plass i solen', 'Hvem styrer havene?'],
    balkan: ['Balkan', 'Det osmanske riket', 'Et tomrom', 'Nye land', 'Europas kruttønne'],
    attentat: ['Bosnia', 'Den sorte hånd', 'Sarajevo, 28. juni', 'Feil vei', 'To skudd'],
};

function Merke({
    x,
    y,
    tekst,
    k = 1,
    farge = '#0f172a',
    storrelse = 30,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    k?: number;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse * k}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7 * k}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

const Inn = ({ children, forsinkelse = 0 }: { children: React.ReactNode; forsinkelse?: number }) => (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: forsinkelse }}>
        {children}
    </motion.g>
);

export function OpptaktKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sarajevo';
    const { geographies } = useFilmVerden(FINT[modus]);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [20, 20],
                    [B - 20, H - 20],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const { se, zoom } = utsikt(modus, beat);
    const [sx, sy] = se ? p(se) : [B / 2, H / 2];
    const w = B / zoom;
    const h = H / zoom;
    const viewBox = `${sx - w / 2} ${sy - h / 2} ${w} ${h}`;
    const k = 1 / zoom;

    const fyll = (id: string) => {
        if (modus === 'sarajevo') {
            if (beat >= 2 && OU.includes(id)) return ROD_LYS;
            if (id === '070' && beat >= 1) return '#fde68a';
            return LAND_GRA;
        }
        if (modus === 'stormakter') {
            if (id === '826' && beat >= 1) return BLA;
            if (id === '250' && beat >= 1) return '#0891b2';
            if (id === '276' && beat >= 1) return ROD;
            if (beat === 0 && EUROPA.includes(id)) return '#fde68a';
            if (beat === 2 && (AFRIKA.includes(id) || ASIA.includes(id))) return 'url(#ok-koloni)';
            return LAND_GRA;
        }
        if (modus === 'balkan') {
            if (id === '792' && beat >= 1) return OSMANSK;
            if (BALKAN_OSMANSK.includes(id) && beat === 1) return '#5eead4';
            if (beat >= 3 && id === '688') return '#f59e0b';
            if (beat >= 3 && id === '100') return '#16a34a';
            if (beat >= 3 && id === '300') return '#0ea5e9';
            if (beat >= 2 && OU.filter((x) => x !== '070').includes(id)) return ROD_LYS;
            if (beat >= 2 && ['643', '804', '498'].includes(id)) return '#bfdbfe';
            return LAND_GRA;
        }
        // attentat
        if (id === '070') return ROD_LYS;
        if (id === '688') return '#fde68a';
        if (OU.includes(id)) return '#fee2e2';
        return LAND_GRA;
    };

    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    const morkt = (modus === 'sarajevo' && beat >= 3) || (modus === 'balkan' && beat >= 4);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe2ef' }}>
            <motion.svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                initial={false}
                animate={{ viewBox }}
                transition={{ duration: 2.4, ease: [0.45, 0, 0.2, 1] }}
                viewBox={viewBox}
            >
                <defs>
                    <pattern id="ok-koloni" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="14" height="14" fill="#fde68a" />
                        <rect width="6" height="14" fill="#d97706" />
                    </pattern>
                    <marker id="ok-pil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7f1d1d" />
                    </marker>
                    <marker id="ok-pil-bla" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e3a8a" />
                    </marker>
                </defs>
                {geographies.map((g, i) => {
                    const id = String((g as { id?: string | number }).id ?? '');
                    return (
                        <path
                            key={i}
                            d={sti(g as never) ?? ''}
                            fill={fyll(id)}
                            stroke="#a8a08a"
                            strokeWidth={1.2 * k}
                            style={{ transition: 'fill 0.9s' }}
                        />
                    );
                })}
                {modus === 'sarajevo' && <Sarajevo beat={beat} p={p} k={k} />}
                {modus === 'stormakter' && <Stormakter beat={beat} p={p} k={k} />}
                {modus === 'balkan' && <Balkan beat={beat} p={p} />}
                {modus === 'attentat' && <Bosnia beat={beat} p={p} />}
            </motion.svg>

            <motion.div
                className="absolute inset-0 bg-slate-950 pointer-events-none"
                initial={false}
                animate={{ opacity: morkt ? (modus === 'balkan' ? 0.3 : 0.55) : 0 }}
                transition={{ duration: 2 }}
            />
            <AnimatePresence>
                {modus === 'sarajevo' && beat >= 3 && (
                    <motion.div
                        key="dato"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white"
                        style={{ top: '36%', width: '80%' }}
                    >
                        <div className="font-black text-6xl">28. juni 1914</div>
                        <div className="mt-4 text-3xl font-bold text-slate-200">
                            Franz Ferdinand og Sophie blir drept
                        </div>
                    </motion.div>
                )}
                {modus === 'sarajevo' && beat === 2 && (
                    <motion.div
                        key="ff"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl bg-white/95 shadow-2xl px-6 py-4 text-slate-900 border-l-8 border-red-600"
                        style={{ left: '3%', bottom: '6%', width: 400 }}
                    >
                        <div className="font-black text-3xl">Franz Ferdinand</div>
                        <div className="text-xl font-semibold mt-1">Tronarving i Østerrike-Ungarn</div>
                        <div className="text-lg text-slate-600 mt-1">skal bli keiser en dag</div>
                    </motion.div>
                )}
                {modus === 'attentat' && beat >= 2 && <Gatene key="gatene" beat={beat} />}
            </AnimatePresence>

            {!(modus === 'sarajevo' && beat >= 3) && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${tittel}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                        style={{ top: '5%', left: '3%' }}
                    >
                        {tittel}
                    </motion.div>
                </AnimatePresence>
            )}
            <div
                className="absolute text-sm font-semibold text-slate-700 rounded-lg bg-white/85 px-2 py-0.5"
                style={{ bottom: '2%', right: '2%' }}
            >
                Omtrentlig: kartet viser dagens grenser
            </div>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Puls({ x, y, k }: { x: number; y: number; k: number }) {
    return (
        <>
            <motion.circle
                cx={x}
                cy={y}
                fill="none"
                stroke={ROD}
                strokeWidth={4 * k}
                initial={{ r: 8 * k, opacity: 1 }}
                animate={{ r: 40 * k, opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity }}
            />
            <circle cx={x} cy={y} r={10 * k} fill={ROD} stroke="#fff" strokeWidth={3 * k} />
        </>
    );
}

function Sarajevo({ beat, p, k }: { beat: number; p: P; k: number }) {
    const [x, y] = p(BYER.sarajevo);
    const [wx, wy] = p(BYER.wien);
    return (
        <>
            {beat === 0 && (
                <Inn>
                    <Merke x={p([10, 50])[0]} y={p([10, 50])[1]} tekst="EUROPA" storrelse={56} farge="#334155" />
                </Inn>
            )}
            {beat >= 1 && (
                <Inn>
                    <Puls x={x} y={y} k={k} />
                    {beat === 1 && (
                        <g transform={`translate(${x - 70 * k} ${y - 10 * k})`}>
                            <rect x={-26 * k} y={-12 * k} width={52 * k} height={24 * k} rx={7 * k} fill="#1e293b" stroke="#fff" strokeWidth={2 * k} />
                            <rect x={-10 * k} y={-8 * k} width={18 * k} height={16 * k} rx={3 * k} fill="#94a3b8" />
                        </g>
                    )}
                    {beat <= 2 && <Merke x={x + 16 * k} y={y + 44 * k} tekst="Sarajevo" k={k} storrelse={34} anker="start" />}
                </Inn>
            )}
            {beat === 1 && (
                <Inn forsinkelse={1}>
                    <Merke x={x} y={y - 60 * k} tekst="BOSNIA" k={k} storrelse={30} farge="#92400e" />
                </Inn>
            )}
            {beat === 2 && (
                <Inn>
                    <circle cx={wx} cy={wy} r={8 * k} fill="#0f172a" />
                    <Merke x={wx} y={wy - 18 * k} tekst="Wien" k={k} storrelse={28} />
                    <Merke x={p([19.5, 47.1])[0]} y={p([19.5, 47.1])[1]} tekst="ØSTERRIKE-UNGARN" k={k} storrelse={30} farge="#7f1d1d" />
                </Inn>
            )}
        </>
    );
}

function Stormakter({ beat, p, k }: { beat: number; p: P; k: number }) {
    const navn: { t: string; ll: LngLat; farge: string }[] = [
        { t: 'STORBRITANNIA', ll: [-2.5, 55.6], farge: '#1e3a8a' },
        { t: 'FRANKRIKE', ll: [2.4, 46.6], farge: '#155e75' },
        { t: 'TYSKLAND', ll: [10.4, 51.2], farge: '#7f1d1d' },
    ];
    const tysk = p([10.4, 51.2]);
    const hav: LngLat[] = [
        [-30, 50],
        [-36, 32],
        [-24, 16],
        [-14, 2],
        [17, 35],
        [-16, 54],
    ];
    return (
        <>
            {beat === 0 && (
                <Inn>
                    <Merke x={p([12, 49])[0]} y={p([12, 49])[1]} tekst="EUROPA" storrelse={48} farge="#92400e" />
                </Inn>
            )}
            {beat >= 1 && beat <= 2 &&
                navn.map((n) => (
                    <Inn key={n.t}>
                        <Merke x={p(n.ll)[0]} y={p(n.ll)[1]} tekst={n.t} k={k} storrelse={beat === 1 ? 30 : 22} farge={n.farge} />
                    </Inn>
                ))}
            {beat === 2 && (
                <Inn forsinkelse={0.8}>
                    <Merke x={p([20, 5])[0]} y={p([20, 5])[1]} tekst="NESTEN HELE AFRIKA" storrelse={34} farge="#78350f" />
                    <Merke x={p([95, 20])[0]} y={p([95, 20])[1]} tekst="STORE DELER AV ASIA" storrelse={30} farge="#78350f" />
                    <Merke x={p([20, -8])[0]} y={p([20, -8])[1]} tekst="delt mellom stormaktene" storrelse={34} farge="#334155" />
                </Inn>
            )}
            {(beat === 3 || beat === 4) && (
                <Inn>
                    <Merke x={tysk[0]} y={tysk[1]} tekst="TYSKLAND" k={k} storrelse={34} farge="#7f1d1d" />
                    <Merke x={tysk[0]} y={tysk[1] + 40 * k} tekst={beat === 3 ? 'samlet i 1871' : 'vil ha mer'} k={k} storrelse={32} farge="#334155" />
                </Inn>
            )}
            {beat === 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    {Array.from({ length: 12 }, (_, i) => {
                        const v = (i / 12) * Math.PI * 2;
                        const cx = tysk[0] + 70 * k;
                        const cy = tysk[1] - 95 * k;
                        return (
                            <line
                                key={i}
                                x1={cx + Math.cos(v) * 30 * k}
                                y1={cy + Math.sin(v) * 30 * k}
                                x2={cx + Math.cos(v) * 46 * k}
                                y2={cy + Math.sin(v) * 46 * k}
                                stroke="#f59e0b"
                                strokeWidth={6 * k}
                                strokeLinecap="round"
                            />
                        );
                    })}
                    <circle cx={tysk[0] + 70 * k} cy={tysk[1] - 95 * k} r={24 * k} fill="#facc15" stroke="#f59e0b" strokeWidth={4 * k} />
                </motion.g>
            )}
            {beat === 5 &&
                hav.map((ll, i) => {
                    const [x, y] = p(ll);
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
                            style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
                        >
                            <path
                                d={`M ${x - 60 * k} ${y} L ${x + 60 * k} ${y} L ${x + 40 * k} ${y + 32 * k} L ${x - 42 * k} ${y + 32 * k} Z`}
                                fill={BLA}
                            />
                            <rect x={x - 8 * k} y={y - 50 * k} width={16 * k} height={50 * k} fill="#1e3a8a" />
                        </motion.g>
                    );
                })}
            {beat === 5 && (
                <Inn>
                    <Merke x={p([4, 56.5])[0]} y={p([4, 56.5])[1]} tekst="STORBRITANNIA" k={k} storrelse={30} farge="#1e3a8a" anker="start" />
                    <Merke x={p([10.4, 51.2])[0]} y={p([10.4, 51.2])[1]} tekst="TYSKLAND" k={k} storrelse={24} farge="#7f1d1d" anker="start" />
                </Inn>
            )}
            {beat === 5 && (
                <Inn forsinkelse={1.6}>
                    <Merke x={p([-30, 42])[0]} y={p([-30, 42])[1]} tekst="britiske skip" k={k} storrelse={30} farge="#1e3a8a" />
                </Inn>
            )}
        </>
    );
}

function Pil({ fra, til, farge, marker }: { fra: [number, number]; til: [number, number]; farge: string; marker: string }) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2 - 60;
    return (
        <motion.path
            d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
            fill="none"
            stroke={farge}
            strokeWidth={12}
            strokeLinecap="round"
            markerEnd={`url(#${marker})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Balkan({ beat, p }: { beat: number; p: P }) {
    const midt = p([21.5, 42.6]);
    return (
        <>
            {beat === 0 && (
                <Inn>
                    <ellipse cx={midt[0]} cy={midt[1]} rx={260} ry={200} fill="none" stroke={ROD} strokeWidth={8} strokeDasharray="20 14" />
                    <Merke x={midt[0]} y={midt[1] + 8} tekst="BALKAN" storrelse={50} farge="#7f1d1d" />
                </Inn>
            )}
            {beat >= 1 && (
                <Inn>
                    <Merke x={p([33, 39.2])[0]} y={p([33, 39.2])[1]} tekst="DET OSMANSKE RIKET" storrelse={30} farge="#134e4a" />
                </Inn>
            )}
            {beat === 1 && (
                <Inn forsinkelse={0.8}>
                    <Merke x={midt[0]} y={midt[1]} tekst="styrte her lenge" storrelse={34} farge="#134e4a" />
                </Inn>
            )}
            {beat === 2 && (
                <>
                    <Pil fra={p([16.4, 47.6])} til={p([19.5, 43.6])} farge="#7f1d1d" marker="ok-pil" />
                    <Pil fra={p([33, 47.8])} til={p([24.5, 43.3])} farge="#1e3a8a" marker="ok-pil-bla" />
                    <Inn forsinkelse={0.6}>
                        <Merke x={p([17.6, 46.9])[0]} y={p([17.6, 46.9])[1]} tekst="ØSTERRIKE-UNGARN" storrelse={32} farge="#7f1d1d" />
                        <Merke x={p([31.5, 46.4])[0]} y={p([31.5, 46.4])[1]} tekst="RUSSLAND" storrelse={34} farge="#1e3a8a" />
                        <Merke x={midt[0]} y={midt[1] + 30} tekst="TOMROM" storrelse={46} farge="#334155" />
                    </Inn>
                </>
            )}
            {beat === 3 && (
                <Inn>
                    <Merke x={p([20.9, 44.1])[0]} y={p([20.9, 44.1])[1]} tekst="SERBIA" storrelse={34} farge="#78350f" />
                    <Merke x={p([25.3, 42.7])[0]} y={p([25.3, 42.7])[1]} tekst="BULGARIA" storrelse={34} farge="#14532d" />
                    <Merke x={p([22, 39.4])[0]} y={p([22, 39.4])[1]} tekst="HELLAS" storrelse={34} farge="#0c4a6e" />
                </Inn>
            )}
            {beat >= 4 && <Kruttonne x={midt[0]} y={midt[1] + 20} />}
        </>
    );
}

function Kruttonne({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            <g transform={`translate(${x} ${y})`}>
                <path d="M -70 -90 Q -95 0 -70 90 L 70 90 Q 95 0 70 -90 Z" fill="#92400e" stroke="#451a03" strokeWidth={6} />
                <rect x={-84} y={-52} width={168} height={14} fill="#451a03" />
                <rect x={-84} y={38} width={168} height={14} fill="#451a03" />
                <text x={0} y={12} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fde68a">
                    KRUTT
                </text>
                <path d="M 40 -90 Q 70 -140 110 -150" fill="none" stroke="#1c1917" strokeWidth={6} />
                <motion.path
                    d="M 110 -175 L 118 -158 L 136 -162 L 122 -148 L 136 -134 L 118 -138 L 110 -120 L 102 -138 L 84 -134 L 98 -148 L 84 -162 L 102 -158 Z"
                    fill="#facc15"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            </g>
        </motion.g>
    );
}

function Bosnia({ beat, p }: { beat: number; p: P }) {
    const [sx, sy] = p(BYER.sarajevo);
    const [sbx, sby] = p([20.9, 44.2]);
    if (beat >= 2) return null;
    return (
        <>
            <Inn>
                <Merke x={p([21.0, 43.4])[0]} y={p([21.0, 43.4])[1]} tekst="SERBIA" storrelse={40} farge="#78350f" />
            </Inn>
            {beat === 0 && (
                <Inn>
                    <Merke x={p([17.6, 44.6])[0]} y={p([17.6, 44.6])[1]} tekst="BOSNIA" storrelse={40} farge="#7f1d1d" />
                    <Merke x={p([18.6, 46.0])[0]} y={p([18.6, 46.0])[1]} tekst="ØSTERRIKE-UNGARN" storrelse={30} farge="#7f1d1d" />
                </Inn>
            )}
            {beat === 0 && (
                <Inn forsinkelse={0.8}>
                    <Merke x={p([17.6, 44.6])[0]} y={p([17.6, 44.6])[1] + 46} tekst="nylig tatt over" storrelse={30} farge="#334155" />
                </Inn>
            )}
            <circle cx={sx} cy={sy} r={12} fill={ROD} stroke="#fff" strokeWidth={4} />
            <Merke x={sx + 20} y={sy + 44} tekst="Sarajevo" storrelse={32} anker="start" />

            {beat === 1 && (
                <>
                    <motion.path
                        d={`M ${sbx} ${sby} Q ${(sbx + sx) / 2} ${(sby + sy) / 2 - 90} ${sx} ${sy}`}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={8}
                        markerEnd="url(#ok-pil)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4 }}
                    />
                    <Inn forsinkelse={1}>
                        <rect x={p([17.0, 44.6])[0] - 170} y={p([17.0, 44.6])[1] - 40} width={340} height={64} rx={14} fill="#0f172a" />
                        <text x={p([17.0, 44.6])[0]} y={p([17.0, 44.6])[1] + 4} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                            Den sorte hånd
                        </text>
                    </Inn>
                </>
            )}
        </>
    );
}

/** Skisse av bilturen i Sarajevo. Viser bilene og stedet, aldri skuddene. */
function Gatene({ beat }: { beat: number }) {
    // Bilens plass per beat: kjører langs hovedgata, så inn i en sidegate og stopper.
    const bil = beat === 2 ? { x: 520, y: 470 } : { x: 905, y: 330 };
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute rounded-3xl bg-white shadow-2xl overflow-hidden"
            style={{ right: '3%', top: '16%', width: '62%', height: '72%' }}
        >
            <svg viewBox="0 0 1200 760" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <rect width={1200} height={760} fill="#f5f0e6" />
                {/* Elva */}
                <path d="M 0 600 C 300 570, 600 640, 1200 590" fill="none" stroke="#7dd3fc" strokeWidth={60} />
                {/* Hovedgata langs elva og en sidegate */}
                <path d="M 40 490 L 1160 490" stroke="#cbd5e1" strokeWidth={70} />
                <path d="M 900 490 L 900 120" stroke="#cbd5e1" strokeWidth={60} />
                {/* Hus */}
                {[120, 300, 480, 660].map((x) => (
                    <rect key={x} x={x} y={330} width={130} height={100} rx={6} fill="#e7d9c3" stroke="#a8a29e" strokeWidth={3} />
                ))}
                {[960, 1080].map((x) => (
                    <rect key={x} x={x} y={180} width={100} height={110} rx={6} fill="#e7d9c3" stroke="#a8a29e" strokeWidth={3} />
                ))}
                <rect x={720} y={160} width={130} height={110} rx={6} fill="#e7d9c3" stroke="#a8a29e" strokeWidth={3} />
                {beat < 4 && (
                    <text x={600} y={720} textAnchor="middle" fontSize={30} fontWeight={700} fill="#64748b">
                        Skisse, ikke et nøyaktig kart
                    </text>
                )}
                {/* Bomba: bommet */}
                {beat >= 2 && beat < 4 && (
                    <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.5 }} style={{ transformOrigin: '300px 470px', transformBox: 'view-box' }}>
                        <path
                            d="M 300 420 L 312 452 L 345 445 L 322 470 L 345 495 L 312 488 L 300 520 L 288 488 L 255 495 L 278 470 L 255 445 L 288 452 Z"
                            fill="#fb923c"
                            stroke="#9a3412"
                            strokeWidth={4}
                        />
                        <rect x={110} y={535} width={380} height={62} rx={14} fill="#9a3412" />
                        <text x={300} y={579} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                            Bombe: bommet
                        </text>
                    </motion.g>
                )}
                {/* Princip ved hjørnet */}
                {beat === 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}>
                        <circle cx={985} cy={355} r={14} fill="#0f172a" />
                        <rect x={975} y={369} width={20} height={34} rx={6} fill="#0f172a" />
                        <rect x={880} y={30} width={300} height={112} rx={16} fill="#0f172a" />
                        <text x={1030} y={78} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                            Gavrilo Princip
                        </text>
                        <text x={1030} y={124} textAnchor="middle" fontSize={34} fontWeight={700} fill="#cbd5e1">
                            19 år
                        </text>
                        <line x1={1030} y1={142} x2={990} y2={340} stroke="#0f172a" strokeWidth={4} />
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
                        <path d="M 820 520 Q 900 520 900 440" fill="none" stroke="#dc2626" strokeWidth={8} markerEnd="url(#ok-gate-pil)" />
                        <text x={760} y={590} textAnchor="middle" fontSize={40} fontWeight={900} fill="#dc2626">
                            feil vei
                        </text>
                    </motion.g>
                )}
                <defs>
                    <marker id="ok-gate-pil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
                    </marker>
                </defs>
                {/* Bilen */}
                <motion.g
                    initial={{ x: 120, y: 470 }}
                    animate={{ x: bil.x, y: bil.y, rotate: beat >= 3 ? -90 : 0 }}
                    transition={{ duration: 2.6, ease: 'easeInOut' }}
                >
                    <rect x={-50} y={-22} width={100} height={44} rx={12} fill="#1e293b" />
                    <rect x={-20} y={-16} width={34} height={32} rx={5} fill="#94a3b8" />
                </motion.g>
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
                        <rect width={1200} height={760} fill="#020617" opacity={0.86} />
                        <text x={600} y={380} textAnchor="middle" fontSize={110} fontWeight={900} fill="#ffffff">
                            To skudd
                        </text>
                        <text x={600} y={450} textAnchor="middle" fontSize={40} fontWeight={700} fill="#cbd5e1">
                            startskuddet for en verdenskrig
                        </text>
                    </motion.g>
                )}
            </svg>
        </motion.div>
    );
}
