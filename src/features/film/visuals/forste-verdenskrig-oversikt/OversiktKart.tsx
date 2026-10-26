import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Medaljong } from './OversiktFettere';
import type { VisualProps } from '../../types';

/**
 * Europa under første verdenskrig, fire moduser:
 * - allianser: de to lagene fargelegges, og løftene mellom dem lyser som en lenke.
 * - sarajevo: kartet zoomer inn på Sarajevo, så går kjedereaksjonen fra hovedstad til hovedstad.
 * - fronter: Vestfronten, Østfronten, Alpene, Midtøsten, Afrika og ubåtene rundt Storbritannia.
 * - imperier: de fire imperiene som falt, to og to.
 * Landene tegnes med dagens grenser, omtrent, og det står i hjørnet.
 */

type Modus = 'allianser' | 'sarajevo' | 'fronter' | 'imperier';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: [LngLat, LngLat] = [
    [-11, 34],
    [48, 64],
];

const BLA = '#2563eb';
const BLA_LYS = '#93c5fd';
const ROD = '#dc2626';
const ROD_LYS = '#fca5a5';
const LAND_GRA = '#e7e2d6';

/** Landene med dagens grenser som ligger omtrent der rikene lå i 1914. */
const ENTENTE = ['250', '826', '372', '643', '112', '804', '246', '233', '428', '440', '688'];
const ENTENTE_SENERE = ['380'];
const SENTRAL = ['276', '040', '348', '203', '703', '705', '191', '070', '792', '760', '368', '422', '376', '400', '275'];
const SENTRAL_STOTTE = ['100'];

const IMPERIER: { navn: string; land: string[]; ll: LngLat; gruppe: 0 | 1 }[] = [
    { navn: 'TYSKLAND', land: ['276'], ll: [10.2, 51.2], gruppe: 0 },
    { navn: 'ØSTERRIKE-UNGARN', land: ['040', '348', '203', '703', '705', '191', '070'], ll: [17.5, 47.6], gruppe: 0 },
    { navn: 'DET OSMANSKE RIKET', land: ['792', '760', '368', '422', '376', '400', '275'], ll: [35.5, 38.6], gruppe: 1 },
    { navn: 'RUSSLAND', land: ['643', '112', '804', '246', '233', '428', '440'], ll: [38, 56], gruppe: 1 },
];

const BYER: Record<string, LngLat> = {
    sarajevo: [18.41, 43.86],
    wien: [16.37, 48.21],
    beograd: [20.46, 44.79],
    petersburg: [30.3, 59.94],
    berlin: [13.4, 52.52],
    paris: [2.35, 48.86],
    london: [-0.13, 51.5],
    konstantinopel: [28.98, 41.01],
};
const BYNAVN: Record<string, string> = {
    wien: 'Wien',
    beograd: 'Beograd',
    petersburg: 'St. Petersburg',
    berlin: 'Berlin',
    paris: 'Paris',
    london: 'London',
};

/** Kjedereaksjonen, hovedstad for hovedstad. */
const KJEDE: [string, string][] = [
    ['sarajevo', 'wien'],
    ['wien', 'beograd'],
    ['beograd', 'petersburg'],
    ['petersburg', 'berlin'],
    ['berlin', 'paris'],
    ['paris', 'london'],
];

/** Løftene innenfor hvert lag. */
const LOFTER: { fra: string; til: string; farge: string }[] = [
    { fra: 'london', til: 'paris', farge: BLA },
    { fra: 'paris', til: 'petersburg', farge: BLA },
    { fra: 'berlin', til: 'wien', farge: ROD },
    { fra: 'wien', til: 'konstantinopel', farge: ROD },
];

/** Fronten i vest, omtrent, fra kysten i nord til Sveits i sør. */
const VESTFRONT: LngLat[] = [
    [2.72, 51.15],
    [2.85, 50.55],
    [2.75, 50.02],
    [3.35, 49.4],
    [4.8, 49.2],
    [5.55, 48.92],
    [6.6, 48.6],
    [7.05, 47.85],
    [7.15, 47.5],
];
/** Fronten i øst, omtrent, fra Østersjøen til Svartehavet. */
const ØSTFRONT: LngLat[] = [
    [23.8, 57.0],
    [26.0, 55.6],
    [25.8, 53.6],
    [25.2, 51.6],
    [25.4, 49.8],
    [26.6, 48.2],
    [27.6, 46.6],
    [28.8, 45.4],
];
/** Fronten i Alpene mellom Italia og Østerrike-Ungarn, omtrent. */
const ALPEFRONT: LngLat[] = [
    [10.4, 46.7],
    [11.6, 46.9],
    [12.8, 46.6],
    [13.5, 46.2],
    [13.6, 45.7],
];
const ANGREP: LngLat[] = [
    [7.2, 50.9],
    [4.6, 50.3],
    [2.9, 49.25],
];
const UBATER: LngLat[] = [
    [-8.5, 50.4],
    [-7.6, 56.4],
    [1.8, 57.4],
    [-4.8, 48.6],
];

/** Fellen: krangelen starter i Østerrike-Ungarn og Serbia og sprer seg utover, sekunder etter start. */
function spredning(id: string) {
    if (['040', '348', '203', '703', '705', '191', '070', '688'].includes(id)) return 0.3;
    if (['643', '112', '804', '246', '233', '428', '440', '276'].includes(id)) return 1.8;
    return 3.3;
}

/** Hvor kameraet ser (sentrum) og hvor nært (zoom), per modus og beat. */
function utsikt(modus: Modus, beat: number): { se: LngLat; zoom: number } {
    if (modus === 'sarajevo' && beat <= 2) return { se: [18.6, 44.6], zoom: 2.6 };
    if (modus === 'fronter' && beat <= 2) return { se: [4.6, 49.7], zoom: 2.6 };
    return { se: [18.5, 50.5], zoom: 1 };
}

const TITLER: Record<Modus, string[]> = {
    allianser: ['Europa i 1914', 'Ententen', 'Sentralmaktene', 'Løfter om hjelp', 'En felle'],
    sarajevo: ['Sarajevo, 28. juni 1914', 'Franz Ferdinand', 'Skuddene', 'Kjedereaksjonen', '«Lyset slukkes over hele Europa»'],
    fronter: ['Høsten 1914', 'Vestfronten', 'Verdun og Somme, 1916', 'Østfronten', 'Krig på mange fronter', 'Ubåtkrig'],
    imperier: ['11. november 1918', 'Fire imperier gikk i oppløsning', 'Fire imperier gikk i oppløsning', 'Fire imperier gikk i oppløsning', 'Keiseren og tsaren'],
};

export function OversiktKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus;
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [20, 20],
                    [B - 20, H - 20],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((q) => p(q).join(' ')).join(' L ');

    const { se, zoom } = utsikt(modus, beat);
    const [sx, sy] = p(se);
    const w = B / zoom;
    const h = H / zoom;
    const viewBox = `${sx - w / 2} ${sy - h / 2} ${w} ${h}`;
    /** Skrift og streker i samme størrelse på skjermen uansett zoom. */
    const k = 1 / zoom;

    const fyll = (id: string) => {
        if (id === '616' && (modus === 'allianser' ? beat >= 2 : modus === 'imperier')) return 'url(#vk-delt)';
        if (modus === 'allianser') {
            if (beat >= 4 && (ENTENTE.includes(id) || SENTRAL.includes(id))) return ENTENTE.includes(id) ? BLA : ROD;
            if (beat >= 1 && ENTENTE.includes(id)) return BLA_LYS;
            if (beat >= 1 && ENTENTE_SENERE.includes(id)) return '#dbeafe';
            if (beat >= 2 && SENTRAL.includes(id)) return ROD_LYS;
            if (beat >= 2 && SENTRAL_STOTTE.includes(id)) return '#fee2e2';
            return LAND_GRA;
        }
        if (modus === 'sarajevo') {
            if (beat >= 3 && ENTENTE.includes(id)) return '#bfdbfe';
            if (beat >= 3 && SENTRAL.includes(id)) return '#fecaca';
            if (id === '070') return '#fde68a';
            return LAND_GRA;
        }
        if (modus === 'imperier') {
            const imp = IMPERIER.find((i) => i.land.includes(id));
            if (!imp) return LAND_GRA;
            const falt = (imp.gruppe === 0 && beat >= 2) || (imp.gruppe === 1 && beat >= 3);
            if (falt) return '#a8a29e';
            return imp.gruppe === 0 ? ROD_LYS : imp.navn === 'RUSSLAND' ? BLA_LYS : ROD_LYS;
        }
        // fronter
        if (ENTENTE.includes(id) || ENTENTE_SENERE.includes(id)) return '#dbeafe';
        if (SENTRAL.includes(id) || SENTRAL_STOTTE.includes(id)) return '#fee2e2';
        return LAND_GRA;
    };

    const morkt = modus === 'sarajevo' && beat >= 4;
    const titler = TITLER[modus];

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
                    <pattern id="vk-delt" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="16" height="16" fill={BLA_LYS} />
                        <rect width="8" height="16" fill={ROD_LYS} />
                    </pattern>
                    <marker id="vk-kjede" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                    </marker>
                    <marker id="vk-pil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
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
                            style={{ transition: 'fill 0.9s', transitionDelay: modus === 'allianser' && beat >= 4 ? `${spredning(id)}s` : '0s' }}
                        />
                    );
                })}

                {modus === 'allianser' && <Allianser beat={beat} p={p} />}
                {modus === 'sarajevo' && <Sarajevo beat={beat} p={p} k={k} />}
                {modus === 'fronter' && <Fronter beat={beat} p={p} k={k} linje={linje} />}
                {modus === 'imperier' && <Imperier beat={beat} p={p} />}
            </motion.svg>

            {/* Lyset slukkes: kartet mørkner. */}
            <motion.div
                className="absolute inset-0 bg-slate-950 pointer-events-none"
                initial={false}
                animate={{ opacity: morkt ? 0.72 : 0 }}
                transition={{ duration: 3 }}
            />
            <AnimatePresence>
                {morkt && (
                    <motion.div
                        key="sitat"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="absolute left-1/2 -translate-x-1/2 text-center text-white"
                        style={{ top: '34%', width: '78%' }}
                    >
                        <div className="font-black text-4xl leading-tight">
                            «Lyset slukkes over hele Europa.
                            <br />
                            Vi vil ikke se det tennes igjen i vår levetid.»
                        </div>
                        <div className="mt-5 text-xl font-semibold text-slate-300">
                            Edward Grey, britisk utenriksminister, 3. august 1914
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!morkt && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${Math.min(beat, titler.length - 1)}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                        style={{ top: '5%', left: '3%' }}
                    >
                        {titler[Math.min(beat, titler.length - 1)]}
                    </motion.div>
                </AnimatePresence>
            )}
            {modus === 'imperier' && beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute flex gap-6 rounded-3xl bg-white/95 shadow-2xl px-6 py-4"
                    style={{ bottom: '5%', left: '3%' }}
                >
                    {[
                        { navn: 'Keiser Wilhelm II', land: 'Tyskland' },
                        { navn: 'Tsar Nicholas II', land: 'Russland' },
                    ].map((m) => (
                        <div key={m.navn} className="flex flex-col items-center">
                            <svg viewBox="-130 -130 260 260" style={{ width: 110, height: 110, filter: 'grayscale(1)', opacity: 0.75 }}>
                                <Medaljong x={0} y={0} farge="#57534e" />
                                <line x1={-80} y1={-80} x2={80} y2={80} stroke={ROD} strokeWidth={16} strokeLinecap="round" />
                                <line x1={80} y1={-80} x2={-80} y2={80} stroke={ROD} strokeWidth={16} strokeLinecap="round" />
                            </svg>
                            <div className="text-xl font-black text-slate-900 mt-1">{m.navn}</div>
                            <div className="text-base font-bold text-slate-500">mistet makta</div>
                        </div>
                    ))}
                </motion.div>
            )}
            <div className="absolute text-sm font-semibold text-slate-700 rounded-lg bg-white/85 px-2 py-0.5" style={{ top: '2%', right: '2%' }}>
                Omtrentlig: kartet viser dagens grenser, ikke grensene i 1914
            </div>
        </div>
    );
}


type P = (ll: LngLat) => [number, number];

function Merke({
    x,
    y,
    tekst,
    k = 1,
    anker = 'middle',
    farge = '#0f172a',
    storrelse = 30,
}: {
    x: number;
    y: number;
    tekst: string;
    k?: number;
    anker?: 'start' | 'middle' | 'end';
    farge?: string;
    storrelse?: number;
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

function Allianser({ beat, p }: { beat: number; p: P }) {
    const navn: { t: string; ll: LngLat; fra: number; farge: string }[] = [
        { t: 'FRANKRIKE', ll: [1.2, 46.3], fra: 1, farge: '#1e3a8a' },
        { t: 'STORBRITANNIA', ll: [-2.6, 53.2], fra: 1, farge: '#1e3a8a' },
        { t: 'RUSSLAND', ll: [36, 57.5], fra: 1, farge: '#1e3a8a' },
        { t: 'TYSKLAND', ll: [9.4, 49.3], fra: 2, farge: '#7f1d1d' },
        { t: 'ØSTERRIKE-UNGARN', ll: [17.2, 46.6], fra: 2, farge: '#7f1d1d' },
        { t: 'OSMANSKE RIKET', ll: [35, 39], fra: 2, farge: '#7f1d1d' },
        { t: 'ITALIA, fra 1915', ll: [13.2, 42.2], fra: 1, farge: '#1e3a8a' },
        { t: 'POLEN: delt mellom rikene', ll: [20.5, 52.6], fra: 2, farge: '#334155' },
    ];
    return (
        <>
            {navn
                .filter((n) => beat >= n.fra)
                .map((n) => {
                    const [x, y] = p(n.ll);
                    return (
                        <motion.g key={n.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                            <Merke x={x} y={y} tekst={n.t} farge={n.farge} storrelse={28} />
                        </motion.g>
                    );
                })}
            {beat >= 3 &&
                LOFTER.map((l, i) => {
                    const [x1, y1] = p(BYER[l.fra]);
                    const [x2, y2] = p(BYER[l.til]);
                    return (
                        <motion.line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={beat >= 4 ? '#f59e0b' : l.farge}
                            strokeWidth={beat >= 4 ? 10 : 7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: i * 0.35 }}
                        />
                    );
                })}
            {beat >= 3 &&
                ['london', 'paris', 'petersburg', 'berlin', 'wien', 'konstantinopel'].map((b) => {
                    const [x, y] = p(BYER[b]);
                    return <circle key={b} cx={x} cy={y} r={11} fill="#0f172a" stroke="#fff" strokeWidth={4} />;
                })}
            {beat >= 4 && (
                <motion.circle
                    cx={p(BYER.sarajevo)[0]}
                    cy={p(BYER.sarajevo)[1]}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={6}
                    initial={{ r: 10, opacity: 1 }}
                    animate={{ r: 140, opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                />
            )}
        </>
    );
}

function Sarajevo({ beat, p, k }: { beat: number; p: P; k: number }) {
    const [sx, sy] = p(BYER.sarajevo);
    return (
        <>
            {beat <= 2 && (
                <motion.circle
                    cx={sx}
                    cy={sy}
                    fill="none"
                    stroke={beat === 2 ? ROD : '#b45309'}
                    strokeWidth={5 * k}
                    initial={{ r: 6 * k, opacity: 1 }}
                    animate={{ r: 60 * k, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
            )}
            <circle cx={sx} cy={sy} r={12 * k} fill={beat === 2 ? ROD : '#b45309'} stroke="#fff" strokeWidth={4 * k} />
            {beat <= 2 && <Merke x={sx - 16 * k} y={sy - 22 * k} tekst="Sarajevo" k={k} anker="end" storrelse={40} />}
            {beat <= 2 && (
                <>
                    <Merke x={p([16.2, 45.9])[0]} y={p([16.2, 45.9])[1]} tekst="ØSTERRIKE-UNGARN" k={k} farge="#64748b" storrelse={26} />
                    <Merke x={p([21.3, 44.6])[0]} y={p([21.3, 44.6])[1]} tekst="SERBIA" k={k} farge="#64748b" storrelse={26} />
                </>
            )}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Merke x={sx} y={sy + 50 * k} tekst="Franz Ferdinand, arving til tronen" k={k} storrelse={30} farge="#7c2d12" />
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Merke x={sx} y={sy + 50 * k} tekst="Gavrilo Princip, serbisk nasjonalist" k={k} storrelse={30} farge="#7f1d1d" />
                </motion.g>
            )}
            {beat >= 3 &&
                KJEDE.map(([fra, til], i) => {
                    const [x1, y1] = p(BYER[fra]);
                    const [x2, y2] = p(BYER[til]);
                    return (
                        <motion.line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#b91c1c"
                            strokeWidth={8}
                            markerEnd="url(#vk-kjede)"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: beat >= 4 ? 0.5 : 1 }}
                            transition={{ duration: 0.9, delay: 0.5 + i * 0.9 }}
                        />
                    );
                })}
            {beat === 3 &&
                Object.keys(BYNAVN).map((b) => {
                    const i = KJEDE.findIndex(([, til]) => til === b);
                    const [x, y] = p(BYER[b]);
                    const venstre = b === 'london' || b === 'paris';
                    return (
                        <motion.g key={b} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 + i * 0.9 }}>
                            <circle cx={x} cy={y} r={12} fill="#fbbf24" stroke="#7c2d12" strokeWidth={4} />
                            <Merke x={venstre ? x - 20 : x + 20} y={y + 10} tekst={BYNAVN[b]} anker={venstre ? 'end' : 'start'} storrelse={28} />
                        </motion.g>
                    );
                })}
        </>
    );
}

function Fronter({ beat, p, k, linje }: { beat: number; p: P; k: number; linje: (pts: LngLat[]) => string }) {
    const [px, py] = p(BYER.paris);
    const vest = linje(VESTFRONT);
    const nord = p(VESTFRONT[0]);
    const sor = p(VESTFRONT[VESTFRONT.length - 1]);
    const zoomet = beat <= 2;
    return (
        <>
            {/* Angrepet mot Paris som stanser */}
            <motion.path
                d={linje(ANGREP)}
                fill="none"
                stroke="#475569"
                strokeWidth={16 * k}
                strokeLinecap="round"
                markerEnd="url(#vk-pil)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: beat === 0 ? 0.9 : 0 }}
                transition={{ pathLength: { duration: 2.4, delay: 0.5 }, opacity: { duration: 0.7 } }}
            />
            {beat === 0 && (
                <motion.line
                    x1={px + 6 * k}
                    y1={py - 52 * k}
                    x2={px + 62 * k}
                    y2={py - 14 * k}
                    stroke={ROD}
                    strokeWidth={10 * k}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                />
            )}
            <circle cx={px} cy={py} r={11 * k} fill="#0f172a" stroke="#fff" strokeWidth={4 * k} />
            {zoomet && <Merke x={px - 18 * k} y={py + 36 * k} tekst="Paris" k={k} anker="end" storrelse={32} />}

            {/* Vestfronten */}
            <motion.path
                d={vest}
                fill="none"
                stroke="#7c2d12"
                strokeWidth={(zoomet ? 11 : 9) * k}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
            />
            {beat >= 1 && zoomet && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}>
                    <Merke x={nord[0] - 18 * k} y={nord[1] - 14 * k} tekst="Nordsjøen" k={k} anker="end" farge="#1e3a5f" storrelse={28} />
                    <Merke x={sor[0] + 18 * k} y={sor[1] + 10 * k} tekst="Sveits" k={k} anker="start" farge="#1e3a5f" storrelse={28} />
                </motion.g>
            )}
            {beat === 2 &&
                [
                    { t: 'Verdun', ll: [5.39, 49.16] as LngLat },
                    { t: 'Somme', ll: [2.7, 49.95] as LngLat },
                ].map((s, i) => {
                    const [x, y] = p(s.ll);
                    return (
                        <motion.g key={s.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.8 }}>
                            <motion.circle
                                cx={x}
                                cy={y}
                                fill={ROD}
                                initial={{ r: 8 * k, opacity: 0.5 }}
                                animate={{ r: [8 * k, 30 * k, 8 * k], opacity: [0.6, 0.15, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <circle cx={x} cy={y} r={9 * k} fill={ROD} stroke="#fff" strokeWidth={3 * k} />
                            <Merke x={i === 0 ? x + 20 * k : x - 20 * k} y={y - 16 * k} tekst={s.t} k={k} anker={i === 0 ? 'start' : 'end'} farge="#7f1d1d" storrelse={32} />
                        </motion.g>
                    );
                })}
            {beat >= 3 && <Merke x={p([0.5, 47.6])[0]} y={p([0.5, 47.6])[1]} tekst="Vestfronten" farge="#7c2d12" storrelse={26} />}

            {/* Østfronten */}
            <motion.path
                d={linje(ØSTFRONT)}
                fill="none"
                stroke="#7c2d12"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 3.5, ease: 'easeInOut', delay: 0.6 }}
            />
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                    <Merke x={p([29.5, 52.6])[0]} y={p([29.5, 52.6])[1]} tekst="Østfronten" anker="start" farge="#7c2d12" storrelse={30} />
                </motion.g>
            )}

            {/* Alpene, Midtøsten og Afrika */}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <path d={linje(ALPEFRONT)} fill="none" stroke="#7c2d12" strokeWidth={9} strokeLinecap="round" />
                    <Merke x={p([10.6, 44.6])[0]} y={p([10.6, 44.6])[1]} tekst="Alpene, 3000 m" anker="end" farge="#7c2d12" storrelse={26} />
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}>
                    <circle cx={p([40, 34.6])[0]} cy={p([40, 34.6])[1]} r={14} fill={ROD} stroke="#fff" strokeWidth={4} />
                    <Merke x={p([40, 34.6])[0]} y={p([40, 34.6])[1] - 26} tekst="Midtøsten" farge="#7f1d1d" storrelse={30} />
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.8 }}>
                    <circle cx={p([10, 35])[0]} cy={p([10, 35])[1]} r={14} fill={ROD} stroke="#fff" strokeWidth={4} />
                    <Merke x={p([10, 35])[0] + 24} y={p([10, 35])[1] + 10} tekst="Koloniene i Afrika ↓" anker="start" farge="#7f1d1d" storrelse={30} />
                </motion.g>
            )}

            {/* Ubåtene rundt Storbritannia */}
            {beat >= 5 &&
                UBATER.map((u, i) => {
                    const [x, y] = p(u);
                    return (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.4 }}>
                            <Ubat x={x} y={y} />
                        </motion.g>
                    );
                })}
            {beat >= 5 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                    <Merke x={p([-9.5, 53.5])[0]} y={p([-9.5, 53.5])[1]} tekst="Tyske ubåter" anker="end" farge="#0f172a" storrelse={30} />
                </motion.g>
            )}
        </>
    );
}

function Ubat({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={0} rx={30} ry={8} fill="#334155" stroke="#fff" strokeWidth={2.5} />
            <rect x={-6} y={-17} width={12} height={11} rx={2} fill="#334155" stroke="#fff" strokeWidth={2.5} />
        </g>
    );
}

function Imperier({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {IMPERIER.map((imp) => {
                const [x, y] = p(imp.ll);
                const falt = (imp.gruppe === 0 && beat >= 2) || (imp.gruppe === 1 && beat >= 3);
                const vis = beat >= 1;
                if (!vis) return null;
                return (
                    <g key={imp.navn}>
                        <Merke x={x} y={y} tekst={imp.navn} farge={falt ? '#44403c' : '#7f1d1d'} storrelse={imp.navn.length > 12 ? 24 : 30} />
                        {falt && (
                            <motion.g initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ transformOrigin: `${x}px ${y + 40}px` }}>
                                <line x1={x - 26} y1={y + 18} x2={x + 26} y2={y + 66} stroke={ROD} strokeWidth={9} strokeLinecap="round" />
                                <line x1={x + 26} y1={y + 18} x2={x - 26} y2={y + 66} stroke={ROD} strokeWidth={9} strokeLinecap="round" />
                            </motion.g>
                        )}
                    </g>
                );
            })}
        </>
    );
}

