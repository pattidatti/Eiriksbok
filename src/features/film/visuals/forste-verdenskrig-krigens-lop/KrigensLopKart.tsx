import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Krigens gang på kartet, fire moduser:
 * - schlieffen: planen. En stor pil gjennom Belgia rundt Paris, Russland langt i øst.
 * - marne: tyskerne stoppes, kappløpet mot havet, og Vestfronten tegnes fra Sveits til Flandern.
 * - fronter: kartet zoomer ut til Østfronten, Tannenberg, Alpene og Midtøsten.
 * - 1918: Michael-offensiven bøyer fronten mot Paris, så presser de hundre dagene den tilbake.
 * Landene tegnes med dagens grenser og frontene er omtrentlige. Det står i hjørnet.
 */

type Modus = 'schlieffen' | 'marne' | 'fronter' | '1918';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: [LngLat, LngLat] = [
    [-11, 34],
    [48, 64],
];

const BLA_LYS = '#a5c8f7';
const ROD_LYS = '#fecaca';
const LAND_GRA = '#e7e2d6';
const ROD = '#dc2626';
const BLA = '#1d4ed8';
const FRONT = '#7c2d12';

const ALLIERTE = ['250', '826', '056', '372'];
const ALLIERTE_OST = ['643', '112', '804', '246', '233', '428', '440', '688'];
const SENTRAL = ['276', '040', '348', '203', '703', '705', '191', '070'];
const OSMANSK = ['792', '760', '368', '422', '376', '400', '275'];

const PARIS: LngLat = [2.35, 48.86];
const MARNE: LngLat = [3.4, 48.95];

/** Alle frontlinjene har ni punkt, fra kysten i nord til Sveits i sør, så de kan gli over i hverandre. */
const FRONT_1914: LngLat[] = [
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
const FRONT_MICHAEL: LngLat[] = [
    [2.72, 51.15],
    [2.6, 50.45],
    [2.6, 49.75],
    [3.25, 49.3],
    [3.8, 49.15],
    [4.8, 49.2],
    [5.55, 48.92],
    [6.6, 48.6],
    [7.15, 47.5],
];
const FRONT_HOST: LngLat[] = [
    [3.0, 51.2],
    [3.3, 50.6],
    [3.4, 50.1],
    [4.0, 49.6],
    [5.0, 49.35],
    [5.6, 49.0],
    [6.6, 48.6],
    [7.05, 47.85],
    [7.15, 47.5],
];
const FRONT_NOV: LngLat[] = [
    [3.7, 51.3],
    [3.9, 50.7],
    [4.25, 50.25],
    [4.85, 49.75],
    [5.4, 49.45],
    [5.8, 49.0],
    [6.6, 48.6],
    [7.05, 47.85],
    [7.15, 47.5],
];
/** Lengst fram i begynnelsen av september 1914, like nord og øst for Paris. */
const FRAMRYKK: LngLat[] = [
    [1.9, 50.3],
    [2.2, 49.5],
    [2.75, 49.05],
    [3.5, 48.8],
    [4.6, 48.75],
    [5.55, 48.85],
    [6.6, 48.6],
    [7.05, 47.85],
    [7.15, 47.5],
];

/** Schlieffen-planen: ned gjennom Belgia og i en bue rundt Paris. */
const PLAN: LngLat[] = [
    [6.6, 50.9],
    [5.0, 50.75],
    [3.4, 50.3],
    [2.0, 49.6],
    [1.5, 48.8],
    [2.1, 48.2],
    [3.4, 48.3],
];
const OSTFRONT: LngLat[] = [
    [21.5, 55.4],
    [22.5, 54.2],
    [21.0, 52.6],
    [21.8, 51.2],
    [23.5, 49.8],
    [25.2, 48.6],
    [26.6, 48.2],
];
const ALPEFRONT: LngLat[] = [
    [10.4, 46.7],
    [11.6, 46.9],
    [12.8, 46.6],
    [13.5, 46.2],
    [13.6, 45.7],
];
const TANNENBERG: LngLat = [20.1, 53.5];
const LAWRENCE: LngLat = [38.5, 28.5];

const TITLER: Record<Modus, string[]> = {
    schlieffen: ['August 1914', 'Paris om noen uker?', 'Schlieffen-planen', 'Gjennom Belgia, rundt Paris', 'Russland i øst', 'Nesten til Paris'],
    marne: ['Hardere motstand enn ventet', 'Slaget ved Marne, september 1914', 'Kappløpet mot havet', 'Ved Nordsjøen', 'Skyttergraver fra Sveits til havet', 'Vestfronten, 1914-1918'],
    fronter: ['Krigen i øst', 'Østfronten: mer i bevegelse', 'Tannenberg', 'Fjellkrig i Alpene', 'Opprør i Midtøsten'],
    '1918': ['Våren 1918', 'Michael-offensiven', 'Angrepet stopper opp', 'De hundre dagene', 'Tyskerne presses tilbake', 'Opprør i Tyskland'],
};

function utsikt(modus: Modus, beat: number): { se: LngLat; zoom: number } {
    if (modus === 'schlieffen') {
        if (beat === 0) return { se: [6, 50], zoom: 2.2 };
        if (beat === 4) return { se: [17, 51], zoom: 1.25 };
        return { se: [3.6, 49.6], zoom: 3.2 };
    }
    if (modus === 'marne') {
        if (beat === 0) return { se: [12, 50.5], zoom: 1.6 };
        if (beat >= 2 && beat <= 3) return { se: [3.4, 49.9], zoom: 3.2 };
        if (beat >= 4) return { se: [4.4, 49.4], zoom: 2.9 };
        return { se: [3.3, 49.3], zoom: 3.6 };
    }
    if (modus === 'fronter') {
        if (beat === 0) return { se: [14, 51], zoom: 1.5 };
        if (beat <= 2) return { se: [22, 52], zoom: 2.3 };
        if (beat === 3) return { se: [12.5, 46.3], zoom: 2.6 };
        return { se: [22, 44], zoom: 1 };
    }
    if (beat >= 5) return { se: [8, 50.8], zoom: 1.9 };
    return { se: [4.0, 49.7], zoom: 3.4 };
}

function frontFor(modus: Modus, beat: number): LngLat[] {
    if (modus !== '1918') return FRONT_1914;
    if (beat === 0) return FRONT_1914;
    if (beat <= 2) return FRONT_MICHAEL;
    if (beat === 3) return FRONT_HOST;
    return FRONT_NOV;
}

export function KrigensLopKart({ beat, props }: VisualProps<{ modus: Modus }>) {
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
    const linje = (pts: LngLat[]) => 'M ' + pts.map((q) => p(q).map((n) => n.toFixed(1)).join(' ')).join(' L ');

    const { se, zoom } = utsikt(modus, beat);
    const [sx, sy] = p(se);
    const w = B / zoom;
    const h = H / zoom;
    const viewBox = `${sx - w / 2} ${sy - h / 2} ${w} ${h}`;
    const k = 1 / zoom;

    const fyll = (id: string) => {
        if (ALLIERTE.includes(id)) return BLA_LYS;
        if (SENTRAL.includes(id)) return ROD_LYS;
        if (ALLIERTE_OST.includes(id)) {
            if (modus === 'schlieffen' && beat === 4) return '#7fb0f0';
            return modus === 'fronter' || modus === 'schlieffen' || modus === 'marne' ? BLA_LYS : LAND_GRA;
        }
        if (id === '380') return modus === 'fronter' ? BLA_LYS : LAND_GRA;
        if (OSMANSK.includes(id)) return modus === 'fronter' ? ROD_LYS : LAND_GRA;
        return LAND_GRA;
    };

    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e4ecf0' }}>
            <motion.svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                initial={false}
                animate={{ viewBox }}
                transition={{ duration: 2.2, ease: [0.45, 0, 0.2, 1] }}
                viewBox={viewBox}
            >
                <defs>
                    <marker id="kl-pil-rod" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={ROD} />
                    </marker>
                    <marker id="kl-pil-bla" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={BLA} />
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

                {modus === 'schlieffen' && <Schlieffen beat={beat} p={p} k={k} linje={linje} />}
                {modus === 'marne' && <Marne beat={beat} p={p} k={k} linje={linje} />}
                {modus === 'fronter' && <Fronter beat={beat} p={p} k={k} linje={linje} />}
                {modus === '1918' && <Slutt beat={beat} p={p} k={k} linje={linje} />}

                {modus !== 'schlieffen' && modus !== 'marne' && (
                    <motion.path
                        d={linje(frontFor(modus, beat))}
                        initial={false}
                        animate={{ d: linje(frontFor(modus, beat)) }}
                        transition={{ duration: 2.6, ease: 'easeInOut' }}
                        fill="none"
                        stroke={FRONT}
                        strokeWidth={9 * k}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                <Byen p={p} k={k} ll={PARIS} navn="Paris" vis={modus !== 'fronter' || beat === 0} />
            </motion.svg>

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
            <Forklaring modus={modus} />
            <div className="absolute text-sm font-semibold text-slate-700 rounded-lg bg-white/85 px-2 py-0.5" style={{ bottom: '2%', right: '2%' }}>
                Omtrentlig: dagens grenser, frontene tegnet grovt
            </div>
        </div>
    );
}

function Forklaring({ modus }: { modus: Modus }) {
    if (modus === 'fronter') return null;
    return (
        <div className="absolute flex flex-col gap-1.5 rounded-2xl bg-white/90 px-4 py-3 shadow-lg text-lg font-bold text-slate-800" style={{ bottom: '6%', left: '3%' }}>
            <div className="flex items-center gap-2">
                <span className="inline-block rounded" style={{ width: 22, height: 16, background: BLA_LYS, border: '1px solid #64748b' }} />
                De allierte
            </div>
            <div className="flex items-center gap-2">
                <span className="inline-block rounded" style={{ width: 22, height: 16, background: ROD_LYS, border: '1px solid #64748b' }} />
                Tyskland og Østerrike-Ungarn
            </div>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];
type L = (pts: LngLat[]) => string;

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
            fontSize={storrelse * 1.3 * k}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9 * k}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Inn({ children, delay = 0, vis = true }: { children: React.ReactNode; delay?: number; vis?: boolean }) {
    return (
        <AnimatePresence>
            {vis && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, delay }}>
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Byen({ p, k, ll, navn, vis }: { p: P; k: number; ll: LngLat; navn: string; vis: boolean }) {
    const [x, y] = p(ll);
    if (!vis) return null;
    return (
        <g>
            <circle cx={x} cy={y} r={10 * k} fill="#0f172a" stroke="#fff" strokeWidth={4 * k} />
            <Merke x={x - 16 * k} y={y + 10 * k} tekst={navn} k={k} anker="end" storrelse={30} />
        </g>
    );
}

function Schlieffen({ beat, p, k, linje }: { beat: number; p: P; k: number; linje: L }) {
    const [px, py] = p(PARIS);
    return (
        <>
            <Inn vis={beat <= 1}>
                <Merke x={p([10.2, 51.4])[0]} y={p([10.2, 51.4])[1]} tekst="TYSKLAND" k={k} farge="#7f1d1d" storrelse={34} />
                <Merke x={p([2.2, 47.2])[0]} y={p([2.2, 47.2])[1]} tekst="FRANKRIKE" k={k} farge="#1e3a8a" storrelse={34} />
            </Inn>
            <Inn vis={beat === 1}>
                <motion.circle
                    cx={px}
                    cy={py}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={5 * k}
                    initial={{ r: 8 * k, opacity: 1 }}
                    animate={{ r: 70 * k, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
            </Inn>
            {beat >= 2 && beat !== 4 && (
                <motion.path
                    key="plan"
                    d={linje(PLAN)}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={16 * k}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={beat >= 3 ? 'url(#kl-pil-rod)' : undefined}
                    initial={{ pathLength: 0, opacity: 0.9 }}
                    animate={{ pathLength: beat === 2 ? 0.35 : 1, opacity: beat >= 5 ? 0.25 : 0.9 }}
                    transition={{ duration: 2.6, ease: 'easeInOut' }}
                />
            )}
            <Inn vis={beat === 3} delay={0.6}>
                <Merke x={p([4.6, 50.95])[0]} y={p([4.6, 50.95])[1]} tekst="BELGIA" k={k} farge="#1e3a8a" storrelse={28} />
            </Inn>
            <Inn vis={beat === 4}>
                <Merke x={p([30, 55])[0]} y={p([30, 55])[1]} tekst="RUSSLAND" k={k} farge="#1e3a8a" storrelse={44} />
                <Merke x={p([30, 53.2])[0]} y={p([30, 53.2])[1]} tekst="«dampveivalsen»" k={k} farge="#1e3a8a" storrelse={30} />
                <Merke x={p([10.2, 51.2])[0]} y={p([10.2, 51.2])[1]} tekst="TYSKLAND" k={k} farge="#7f1d1d" storrelse={34} />
                <Merke x={p([2.2, 46.6])[0]} y={p([2.2, 46.6])[1]} tekst="FRANKRIKE" k={k} farge="#1e3a8a" storrelse={34} />
            </Inn>
            <Inn vis={beat >= 5}>
                <path d={linje(FRAMRYKK)} fill="none" stroke={ROD} strokeWidth={8 * k} strokeLinecap="round" strokeLinejoin="round" />
                <Merke x={p([4.5, 48.45])[0]} y={p([4.5, 48.45])[1]} tekst="Tyskerne lengst fram" k={k} anker="start" farge="#7f1d1d" storrelse={26} />
            </Inn>
        </>
    );
}

function Marne({ beat, p, k, linje }: { beat: number; p: P; k: number; linje: L }) {
    const [mx, my] = p(MARNE);
    const kapp = [
        { fra: [3.4, 49.5] as LngLat, til: [2.6, 50.45] as LngLat, farge: BLA, pil: 'url(#kl-pil-bla)' },
        { fra: [3.9, 49.75] as LngLat, til: [3.1, 50.85] as LngLat, farge: ROD, pil: 'url(#kl-pil-rod)' },
        { fra: [2.4, 50.2] as LngLat, til: [2.3, 50.95] as LngLat, farge: BLA, pil: 'url(#kl-pil-bla)' },
    ];
    return (
        <>
            <Inn vis={beat === 0}>
                <path d={linje(FRAMRYKK)} fill="none" stroke={ROD} strokeWidth={8 * k} strokeLinecap="round" />
                <Merke x={p([4.4, 47.6])[0]} y={p([4.4, 47.6])[1]} tekst="Franskmennene" k={k} farge="#1e3a8a" storrelse={30} />
                <path
                    d={linje([
                        [22.5, 53.2],
                        [20.0, 53.4],
                    ])}
                    fill="none"
                    stroke={BLA}
                    strokeWidth={12 * k}
                    markerEnd="url(#kl-pil-bla)"
                />
                <Merke x={p([22, 52.2])[0]} y={p([22, 52.2])[1]} tekst="Russerne angriper" k={k} farge="#1e3a8a" storrelse={28} />
            </Inn>
            <Inn vis={beat === 1}>
                <motion.path
                    initial={{ d: linje(FRAMRYKK) }}
                    animate={{ d: linje(FRONT_1914) }}
                    transition={{ duration: 3, delay: 0.8, ease: 'easeInOut' }}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={8 * k}
                    strokeLinecap="round"
                />
                <motion.circle
                    cx={mx}
                    cy={my}
                    fill="#f59e0b"
                    initial={{ r: 6 * k, opacity: 0.7 }}
                    animate={{ r: [6 * k, 34 * k, 6 * k], opacity: [0.7, 0.15, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
                <circle cx={mx} cy={my} r={8 * k} fill="#b45309" stroke="#fff" strokeWidth={3 * k} />
                <Merke x={mx + 16 * k} y={my + 32 * k} tekst="Marne" k={k} anker="start" farge="#7c2d12" storrelse={32} />
            </Inn>
            {beat >= 2 && beat <= 3 &&
                kapp.map((a, i) => (
                    <motion.path
                        key={i}
                        d={linje([a.fra, a.til])}
                        fill="none"
                        stroke={a.farge}
                        strokeWidth={12 * k}
                        strokeLinecap="round"
                        markerEnd={a.pil}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 1.1 }}
                    />
                ))}
            <Inn vis={beat === 3} delay={0.5}>
                <Merke x={p([1.6, 51.6])[0]} y={p([1.6, 51.6])[1]} tekst="Nordsjøen" k={k} farge="#1e3a5f" storrelse={32} />
            </Inn>
            {beat >= 4 && (
                <motion.path
                    d={linje(FRONT_1914)}
                    fill="none"
                    stroke={FRONT}
                    strokeWidth={(beat >= 5 ? 13 : 9) * k}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: beat >= 5 ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3.4, ease: 'easeInOut' }}
                />
            )}
            <Inn vis={beat === 4} delay={2.4}>
                <Merke x={p([2.2, 51.35])[0]} y={p([2.2, 51.35])[1]} tekst="Flandern" k={k} anker="end" farge="#1e3a5f" storrelse={28} />
                <Merke x={p([7.6, 47.2])[0]} y={p([7.6, 47.2])[1]} tekst="Sveits" k={k} anker="start" farge="#1e3a5f" storrelse={28} />
            </Inn>
            <Inn vis={beat >= 5}>
                <Merke x={p([6.4, 49.9])[0]} y={p([6.4, 49.9])[1]} tekst="VESTFRONTEN" k={k} anker="start" farge={FRONT} storrelse={34} />
                <Merke x={p([6.4, 49.45])[0]} y={p([6.4, 49.45])[1]} tekst="flytter seg knapt i fire år" k={k} anker="start" farge="#334155" storrelse={24} />
            </Inn>
        </>
    );
}

function Fronter({ beat, p, k, linje }: { beat: number; p: P; k: number; linje: L }) {
    const [tx, ty] = p(TANNENBERG);
    const [lx, ly] = p(LAWRENCE);
    return (
        <>
            <motion.path
                d={linje(OSTFRONT)}
                fill="none"
                stroke={FRONT}
                strokeWidth={9 * k}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, delay: 0.4 }}
            />
            <Inn vis={beat <= 2}>
                <Merke x={p([30, 56.5])[0]} y={p([30, 56.5])[1]} tekst="RUSSLAND" k={k} farge="#1e3a8a" storrelse={36} />
                <Merke x={p([13.2, 52.2])[0]} y={p([13.2, 52.2])[1]} tekst="TYSKLAND" k={k} farge="#7f1d1d" storrelse={30} />
                <Merke x={p([18.5, 47.2])[0]} y={p([18.5, 47.2])[1]} tekst="ØSTERRIKE-UNGARN" k={k} farge="#7f1d1d" storrelse={26} />
            </Inn>
            <Inn vis={beat === 1}>
                {[
                    { fra: [21.3, 51.8] as LngLat, til: [24.2, 51.8] as LngLat, farge: ROD, pil: 'url(#kl-pil-rod)' },
                    { fra: [26.4, 50.3] as LngLat, til: [23.4, 50.3] as LngLat, farge: BLA, pil: 'url(#kl-pil-bla)' },
                ].map((a, i) => (
                    <motion.path
                        key={i}
                        d={linje([a.fra, a.til])}
                        fill="none"
                        stroke={a.farge}
                        strokeWidth={10 * k}
                        markerEnd={a.pil}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 1, 0] }}
                        transition={{ duration: 3, delay: i * 1.2, repeat: Infinity, repeatDelay: 0.6 }}
                    />
                ))}
            </Inn>
            <Inn vis={beat === 2}>
                <motion.circle
                    cx={tx}
                    cy={ty}
                    fill={ROD}
                    initial={{ r: 6 * k, opacity: 0.6 }}
                    animate={{ r: [6 * k, 30 * k, 6 * k], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
                <circle cx={tx} cy={ty} r={9 * k} fill={ROD} stroke="#fff" strokeWidth={3 * k} />
                <Merke x={tx - 18 * k} y={ty - 18 * k} tekst="Tannenberg: tysk seier" k={k} anker="end" farge="#7f1d1d" storrelse={28} />
            </Inn>
            <Inn vis={beat >= 3}>
                <path d={linje(ALPEFRONT)} fill="none" stroke={FRONT} strokeWidth={9 * k} strokeLinecap="round" />
            </Inn>
            <Inn vis={beat === 3} delay={0.4}>
                <Merke x={p([12.4, 43.6])[0]} y={p([12.4, 43.6])[1]} tekst="ITALIA" k={k} farge="#1e3a8a" storrelse={30} />
                <Merke x={p([14.6, 47.6])[0]} y={p([14.6, 47.6])[1]} tekst="ØSTERRIKE" k={k} farge="#7f1d1d" storrelse={30} />
                <Merke x={p([9.6, 46.0])[0]} y={p([9.6, 46.0])[1]} tekst="Alpene" k={k} anker="end" farge={FRONT} storrelse={28} />
            </Inn>
            <Inn vis={beat >= 4} delay={0.3}>
                <Merke x={p([34, 39])[0]} y={p([34, 39])[1]} tekst="DET OSMANSKE RIKET" k={k} farge="#7f1d1d" storrelse={26} />
                <motion.circle
                    cx={lx}
                    cy={ly}
                    fill="#f59e0b"
                    initial={{ r: 8, opacity: 0.6 }}
                    animate={{ r: [8, 40, 8], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx={lx} cy={ly} r={12} fill="#b45309" stroke="#fff" strokeWidth={4} />
                <Merke x={lx - 22} y={ly + 10} tekst="Lawrence og arabiske stammer" anker="end" farge="#7c2d12" storrelse={28} />
                <Merke x={p([0.6, 47.0])[0]} y={p([0.6, 47.0])[1]} tekst="Vestfronten" farge={FRONT} storrelse={26} />
                <Merke x={p([30.5, 49.6])[0]} y={p([30.5, 49.6])[1]} tekst="Østfronten" anker="start" farge={FRONT} storrelse={26} />
            </Inn>
        </>
    );
}

function Slutt({ beat, p, k, linje }: { beat: number; p: P; k: number; linje: L }) {
    const [px, py] = p(PARIS);
    return (
        <>
            <Inn vis={beat === 1}>
                {[
                    [
                        [3.6, 50.0],
                        [2.7, 49.55],
                    ],
                    [
                        [4.4, 49.6],
                        [3.6, 49.2],
                    ],
                ].map((a, i) => (
                    <motion.path
                        key={i}
                        d={linje(a as LngLat[])}
                        fill="none"
                        stroke={ROD}
                        strokeWidth={12 * k}
                        markerEnd="url(#kl-pil-rod)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, delay: 0.4 + i * 0.6 }}
                    />
                ))}
                <motion.circle
                    cx={px}
                    cy={py}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={5 * k}
                    initial={{ r: 8 * k, opacity: 1 }}
                    animate={{ r: 60 * k, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
            </Inn>
            <Inn vis={beat === 2} delay={0.6}>
                <g transform={`translate(${p([2.9, 49.5])[0]} ${p([2.9, 49.5])[1]})`}>
                    <circle r={20 * k} fill="#fff" stroke={ROD} strokeWidth={5 * k} />
                    <line x1={-11 * k} y1={0} x2={11 * k} y2={0} stroke={ROD} strokeWidth={6 * k} strokeLinecap="round" />
                </g>
                <Merke x={p([3.5, 50.25])[0]} y={p([3.5, 50.25])[1]} tekst="utslitte soldater, lite forsyninger" k={k} anker="start" farge="#7f1d1d" storrelse={24} />
            </Inn>
            {beat >= 3 && beat <= 4 &&
                [
                    [
                        [2.4, 49.9],
                        [3.6, 50.15],
                    ],
                    [
                        [2.9, 49.25],
                        [4.2, 49.55],
                    ],
                    [
                        [3.9, 49.0],
                        [5.0, 49.2],
                    ],
                ].map((a, i) => (
                    <motion.path
                        key={`${beat}-${i}`}
                        d={linje(a as LngLat[])}
                        fill="none"
                        stroke={BLA}
                        strokeWidth={12 * k}
                        markerEnd="url(#kl-pil-bla)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, delay: 0.3 + i * 0.5 }}
                    />
                ))}
            <Inn vis={beat === 3} delay={1.2}>
                {(
                    [
                        [2.1, 49.55],
                        [2.6, 49.1],
                        [3.4, 48.85],
                    ] as LngLat[]
                ).map((ll, i) => (
                    <Stridsvogn key={i} x={p(ll)[0]} y={p(ll)[1]} k={k} />
                ))}
                <Merke x={p([3.3, 48.3])[0]} y={p([3.3, 48.3])[1]} tekst="stridsvogner og amerikanske soldater" k={k} anker="end" farge="#1e3a8a" storrelse={22} />
            </Inn>
            <Inn vis={beat >= 5}>
                <Merke x={p([10.5, 51.4])[0]} y={p([10.5, 51.4])[1]} tekst="TYSKLAND" k={k} farge="#7f1d1d" storrelse={34} />
                <Merke x={p([10.5, 50.3])[0]} y={p([10.5, 50.3])[1]} tekst="Matrosene gjør opprør" k={k} farge="#7f1d1d" storrelse={26} />
                <Merke x={p([10.5, 49.6])[0]} y={p([10.5, 49.6])[1]} tekst="Keiseren flykter" k={k} farge="#7f1d1d" storrelse={26} />
            </Inn>
        </>
    );
}

function Stridsvogn({ x, y, k }: { x: number; y: number; k: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${k})`}>
            <path d="M -26 6 L -18 -8 L 18 -8 L 26 6 Z" fill="#334155" stroke="#fff" strokeWidth={3} />
            <rect x={-8} y={-16} width={16} height={9} rx={2} fill="#334155" stroke="#fff" strokeWidth={3} />
        </g>
    );
}
