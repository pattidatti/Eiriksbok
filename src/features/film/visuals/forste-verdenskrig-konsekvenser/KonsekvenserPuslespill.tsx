import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Europa som et puslespill etter første verdenskrig. Keiserrikene er store brikker som
 * sprekker opp: bitene glir litt fra hverandre og får egne farger og navn.
 * - fall: de fire keiserrikene faller ett etter ett.
 * - tyskland: Tyskland mister Alsace-Lorraine i vest og land i øst, og koloniene.
 * - nye: Wilsons plan, de nye landene i øst, og folk på feil side av grensen.
 * - stemmerett: landene der kvinner fikk stemme, Norge først.
 * Landene tegnes med dagens grenser, omtrent, og det står i hjørnet.
 */

type Modus = 'fall' | 'tyskland' | 'nye' | 'stemmerett';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: [LngLat, LngLat] = [
    [-11, 29],
    [50, 66],
];
/** Det fine kartet bare der kartet zoomer inn på Tyskland. */
const TYSK_UTSNITT: Utsnitt = [
    [1, 45],
    [25, 57],
];

const LAND_GRA = '#e7e2d6';
const KANT = '#a8a08a';
const KEISER = '#c2410c';
const KEISER_LYS = '#fdba74';

interface Bit {
    navn: string;
    land: string[];
    farge: string;
    /** Hvor navnet står. */
    ll: LngLat;
    /** Mandatområde: skravert i britisk og fransk farge. */
    mandat?: boolean;
}

interface Rike {
    navn: string;
    ll: LngLat;
    fallBeat: number;
    biter: Bit[];
}

const RIKER: Rike[] = [
    {
        navn: 'DET TYSKE KEISERRIKET',
        ll: [10.3, 51.4],
        fallBeat: 1,
        biter: [{ navn: 'REPUBLIKK', land: ['276'], farge: '#fde68a', ll: [10.3, 51.4] }],
    },
    {
        navn: 'ØSTERRIKE-UNGARN',
        ll: [17.6, 47.4],
        fallBeat: 2,
        biter: [
            { navn: 'Østerrike', land: ['040'], farge: '#fca5a5', ll: [14.2, 47.55] },
            { navn: 'Ungarn', land: ['348'], farge: '#a7f3d0', ll: [19.4, 47.1] },
            { navn: 'Tsjekkoslovakia', land: ['203', '703'], farge: '#bfdbfe', ll: [17.2, 49.6] },
            { navn: 'Jugoslavia', land: ['705', '191', '070'], farge: '#ddd6fe', ll: [16.6, 44.6] },
        ],
    },
    {
        navn: 'DET OSMANSKE RIKET',
        ll: [36, 38.2],
        fallBeat: 3,
        biter: [
            { navn: 'Tyrkia', land: ['792'], farge: '#fecdd3', ll: [33.5, 39.2] },
            { navn: 'Syria', land: ['760', '422'], farge: '', ll: [38.6, 35.2], mandat: true },
            { navn: 'Irak', land: ['368'], farge: '', ll: [43.6, 33.2], mandat: true },
            { navn: 'Palestina', land: ['376', '275', '400'], farge: '', ll: [35.6, 30.9], mandat: true },
        ],
    },
    {
        navn: 'DET RUSSISKE KEISERRIKET',
        ll: [37, 57.5],
        fallBeat: 5,
        biter: [
            { navn: 'SOVJETUNIONEN', land: ['643', '112', '804'], farge: '#f87171', ll: [38, 55.5] },
            { navn: 'Polen', land: ['616'], farge: '#c7d2fe', ll: [19.4, 52.2] },
            { navn: 'Finland', land: ['246'], farge: '#bae6fd', ll: [26.2, 62.6] },
            { navn: 'Estland', land: ['233'], farge: '#99f6e4', ll: [25.6, 58.8] },
            { navn: 'Latvia', land: ['428'], farge: '#fef08a', ll: [25.4, 56.9] },
            { navn: 'Litauen', land: ['440'], farge: '#d9f99d', ll: [23.8, 55.3] },
        ],
    },
];

/** Tyskland i 1914, omtrent: det vestre området som gikk til Frankrike og det østre som gikk til Polen. */
const ALSACE: LngLat[] = [
    [5.9, 49.5],
    [6.4, 49.47],
    [7.0, 49.15],
    [8.2, 48.97],
    [7.6, 48.0],
    [7.55, 47.6],
    [7.1, 47.5],
    [6.85, 47.8],
    [6.85, 48.3],
    [6.3, 48.6],
    [5.9, 49.0],
    [5.9, 49.5],
];
const OSTOMRADET: LngLat[] = [
    [15.8, 52.3],
    [16.3, 51.6],
    [17.5, 51.3],
    [18.2, 51.4],
    [18.8, 52.3],
    [19.3, 53.0],
    [19.0, 53.8],
    [18.6, 54.4],
    [18.3, 54.8],
    [17.0, 54.6],
    [16.8, 54.0],
    [16.0, 53.4],
    [15.8, 52.9],
    [15.8, 52.3],
];

/** Det som var tysk i 1914 og fortsatt var tysk etter freden, men ligger i dagens Polen og Russland. */
const TYSK_REST: LngLat[][] = [
    [
        [14.2, 53.9],
        [16.5, 54.6],
        [17.0, 54.6],
        [16.8, 54.0],
        [16.0, 53.4],
        [15.8, 52.9],
        [15.8, 52.3],
        [16.3, 51.6],
        [17.5, 51.3],
        [18.2, 51.4],
        [18.6, 50.2],
        [17.7, 50.1],
        [16.4, 50.6],
        [15.0, 51.0],
        [14.7, 51.8],
        [14.6, 52.6],
        [14.2, 53.9],
    ],
    [
        [18.6, 54.4],
        [19.6, 54.45],
        [21.0, 54.9],
        [22.8, 54.4],
        [22.7, 53.9],
        [21.5, 53.4],
        [19.8, 53.3],
        [19.3, 53.0],
        [19.0, 53.8],
        [18.6, 54.4],
    ],
];

const NYE: { navn: string; land: string[]; farge: string; ll: LngLat }[] = [
    { navn: 'Polen', land: ['616'], farge: '#c7d2fe', ll: [20.6, 51.7] },
    { navn: 'Tsjekkoslovakia', land: ['203', '703'], farge: '#bfdbfe', ll: [17.0, 49.55] },
    { navn: 'Jugoslavia', land: ['705', '191', '070', '688', '499', '807'], farge: '#ddd6fe', ll: [18.8, 44.0] },
    { navn: 'Finland', land: ['246'], farge: '#bae6fd', ll: [26.2, 62.6] },
    { navn: 'Estland', land: ['233'], farge: '#99f6e4', ll: [25.6, 58.8] },
    { navn: 'Latvia', land: ['428'], farge: '#fef08a', ll: [25.4, 56.9] },
    { navn: 'Litauen', land: ['440'], farge: '#d9f99d', ll: [23.8, 55.3] },
];

/** Folk på feil side: hvor de bor, og hvilket folk de hører til. */
const MINORITETER: { ll: LngLat; etikett: string; farge: string; anker: 'start' | 'end'; dy: number }[] = [
    { ll: [17.2, 53.6], etikett: 'tyskere i Polen', farge: '#b45309', anker: 'start', dy: -40 },
    { ll: [14.4, 50.2], etikett: 'tyskere i Tsjekkoslovakia', farge: '#b45309', anker: 'start', dy: 50 },
    { ll: [23.6, 46.6], etikett: 'ungarere i Romania', farge: '#047857', anker: 'start', dy: 50 },
];

const STEMME: { id: string; navn: string; beat: number; ll: LngLat; ar?: string }[] = [
    { id: '578', navn: 'Norge', beat: 1, ll: [9.5, 61.2], ar: '1913' },
    { id: '826', navn: 'Storbritannia', beat: 2, ll: [-2.2, 53.4] },
    { id: '276', navn: 'Tyskland', beat: 2, ll: [10.3, 51.2] },
    { id: '040', navn: 'Østerrike', beat: 2, ll: [14.4, 47.5] },
];

function utsikt(modus: Modus, beat: number): { se: LngLat; zoom: number } {
    if (modus === 'tyskland') return { se: [12.6, 51], zoom: beat >= 3 ? 1.7 : 2.4 };
    if (modus === 'nye') {
        if (beat <= 1) return { se: [19.5, 50.5], zoom: 1.25 };
        if (beat <= 3) return { se: [22, 54], zoom: 1.3 };
        return { se: [20, 50.5], zoom: 1.6 };
    }
    if (modus === 'fall' && beat === 2) return { se: [17.5, 47], zoom: 2.3 };
    if (modus === 'fall' && (beat === 3 || beat === 4)) return { se: [36, 36], zoom: 1.8 };
    if (modus === 'stemmerett') return { se: [9, 53], zoom: 1.3 };
    return { se: [19.5, 48], zoom: 1 };
}

const TITLER: Record<Modus, string[]> = {
    fall: ['Fire keiserriker i 1914', 'Tyskland', 'Østerrike-Ungarn', 'Det osmanske riket', 'Det osmanske riket', 'Russland'],
    tyskland: ['Tyskland i 1914', 'Alsace-Lorraine', 'Landet i øst', 'Koloniene'],
    nye: ['Wilsons plan', 'Nasjonal selvbestemmelse', 'Nye land i øst', 'Hvor skal grensene gå?', 'Folk på feil side', 'Nye konflikter'],
    stemmerett: ['Hvem får stemme?', 'Norge, 1913', 'Rett etter krigen', 'Tilbake som husmor?'],
};

export function KonsekvenserPuslespill({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus;
    const { geographies } = useFilmVerden(modus === 'tyskland' ? TYSK_UTSNITT : undefined);
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
    const polygon = (pts: LngLat[]) => 'M ' + pts.map((q) => p(q).join(' ')).join(' L ') + ' Z';

    const { se, zoom } = utsikt(modus, beat);
    const [sx, sy] = p(se);
    const w = B / zoom;
    const h = H / zoom;
    const viewBox = `${sx - w / 2} ${sy - h / 2} ${w} ${h}`;
    const k = 1 / zoom;

    const land = useMemo(
        () =>
            geographies.map((g) => {
                const id = String((g as { id?: string | number }).id ?? '');
                return { id, d: sti(g as never) ?? '', c: sti.centroid(g as never) };
            }),
        [geographies, sti]
    );

    /** Hvor mye en bit glir ut fra midten av riket når det sprekker. */
    const glid = (rike: Rike, bit: Bit): [number, number] => {
        const [rx, ry] = p(rike.ll);
        const [bx, by] = p(bit.ll);
        const dx = bx - rx;
        const dy = by - ry;
        const l = Math.hypot(dx, dy) || 1;
        return [(dx / l) * 14, (dy / l) * 14];
    };

    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe2ef' }}>
            <motion.svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                initial={false}
                animate={{ viewBox }}
                transition={{ duration: 2.2, ease: [0.45, 0, 0.2, 1] }}
                viewBox={viewBox}
            >
                <defs>
                    <pattern id="kp-mandat" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="18" height="18" fill="#93c5fd" />
                        <rect width="9" height="18" fill="#fca5a5" />
                    </pattern>
                    <marker id="kp-pil" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                    </marker>
                </defs>

                {/* Bakgrunnen: alle land i grått, unntatt dem modusen tegner selv. */}
                {land.map((l, i) => (
                    <path
                        key={i}
                        d={l.d}
                        fill={bakgrunnsfarge(modus, beat, l.id)}
                        stroke={KANT}
                        strokeWidth={1.2 * k}
                        style={{ transition: 'fill 1s' }}
                    />
                ))}

                {modus === 'fall' &&
                    RIKER.map((rike) => {
                        const falt = beat >= rike.fallBeat;
                        return rike.biter.map((bit) => {
                            const [dx, dy] = falt && rike.biter.length > 1 ? glid(rike, bit) : [0, 0];
                            const fyll = !falt ? KEISER_LYS : bit.mandat ? 'url(#kp-mandat)' : bit.farge;
                            return (
                                <motion.g
                                    key={bit.navn}
                                    initial={false}
                                    animate={{ x: dx, y: dy }}
                                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                                >
                                    {land
                                        .filter((l) => bit.land.includes(l.id))
                                        .map((l) => (
                                            <path
                                                key={l.id}
                                                d={l.d}
                                                fill={fyll}
                                                stroke={falt ? '#ffffff' : KEISER}
                                                strokeWidth={(falt ? 3 : 1.6) * k}
                                                style={{ transition: 'fill 1s' }}
                                            />
                                        ))}
                                </motion.g>
                            );
                        });
                    })}

                {modus === 'tyskland' && (
                    <>
                        {TYSK_REST.map((r, i) => (
                            <path key={i} d={polygon(r)} fill={KEISER_LYS} stroke={KEISER} strokeWidth={1.2 * k} />
                        ))}
                        <path
                            d={polygon(ALSACE)}
                            fill={beat >= 1 ? '#93c5fd' : KEISER_LYS}
                            stroke={beat >= 1 ? '#1d4ed8' : KEISER}
                            strokeWidth={2.5 * k}
                            style={{ transition: 'fill 1s' }}
                        />
                        <path
                            d={polygon(OSTOMRADET)}
                            fill={beat >= 2 ? '#c7d2fe' : KEISER_LYS}
                            stroke={beat >= 2 ? '#4338ca' : KEISER}
                            strokeWidth={2.5 * k}
                            style={{ transition: 'fill 1s' }}
                        />
                    </>
                )}

                {modus === 'fall' && <FallEtiketter beat={beat} p={p} k={k} />}
                {modus === 'tyskland' && <TysklandEtiketter beat={beat} p={p} k={k} />}
                {modus === 'nye' && (
                    <NyeEtiketter
                        beat={beat}
                        p={p}
                        k={k}
                        grenser={land.filter((l) => NYE.some((n) => n.land.includes(l.id))).map((l) => l.d)}
                    />
                )}
                {modus === 'stemmerett' && <StemmeEtiketter beat={beat} p={p} k={k} />}
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

            {modus === 'nye' && beat <= 1 && <Wilson beat={beat} />}
            {modus === 'fall' && (beat === 3 || beat === 4) && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="absolute rounded-2xl bg-white/95 shadow-2xl px-5 py-3 flex items-center gap-4"
                    style={{ bottom: '7%', right: '3%' }}
                >
                    <div className="rounded-lg" style={{ width: 48, height: 48, background: 'repeating-linear-gradient(45deg, #93c5fd 0 9px, #fca5a5 9px 18px)' }} />
                    <div>
                        <div className="text-2xl font-black text-slate-900">Mandatområder</div>
                        <div className="text-lg font-bold text-slate-600">delt mellom Storbritannia og Frankrike</div>
                    </div>
                </motion.div>
            )}
            {modus === 'tyskland' && beat >= 3 && <Kolonier />}
            {modus === 'stemmerett' && beat >= 2 && <Usa />}
            {modus === 'stemmerett' && beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-7 py-5 flex items-center gap-5"
                    style={{ top: '30%', left: '50%', marginLeft: -320, width: 640 }}
                >
                    <svg viewBox="-50 -50 100 100" style={{ width: 90, height: 90, flexShrink: 0 }}>
                        <rect x={-38} y={-10} width={76} height={52} rx={6} fill="#1e3a8a" />
                        <rect x={-20} y={-14} width={40} height={6} rx={2} fill="#0f172a" />
                        <motion.rect
                            x={-14}
                            width={28}
                            height={34}
                            rx={3}
                            fill="#ffffff"
                            stroke="#334155"
                            strokeWidth={2}
                            initial={{ y: -48 }}
                            animate={{ y: -30 }}
                            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
                        />
                    </svg>
                    <div>
                        <div className="text-xl font-bold text-slate-500">Det gamle argumentet</div>
                        <div className="text-3xl font-black text-slate-900 leading-tight relative">
                            Kvinner passer ikke til å være med og bestemme
                            <motion.div
                                className="absolute left-0 bg-red-600"
                                style={{ top: '50%', height: 6 }}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 1.8, duration: 0.8 }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
            {modus === 'stemmerett' && beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute rounded-2xl bg-white/95 shadow-2xl px-6 py-3 text-2xl font-bold text-slate-800"
                    style={{ bottom: '6%', right: '3%', maxWidth: 520 }}
                >
                    Mange kvinner måtte likevel tilbake til husmorrollen da mennene kom hjem.
                </motion.div>
            )}

            <div className="absolute text-sm font-semibold text-slate-700 rounded-lg bg-white/85 px-2 py-0.5" style={{ bottom: '2%', left: '2%' }}>
                Omtrentlig: kartet viser dagens grenser
            </div>
        </div>
    );
}

function bakgrunnsfarge(modus: Modus, beat: number, id: string) {
    if (modus === 'fall') return LAND_GRA;
    if (modus === 'tyskland') {
        if (id === '276') return KEISER_LYS;
        if (id === '250') return beat >= 1 ? '#dbeafe' : LAND_GRA;
        if (id === '616') return beat >= 2 ? '#e0e7ff' : LAND_GRA;
        return LAND_GRA;
    }
    if (modus === 'nye') {
        const nytt = NYE.find((n) => n.land.includes(id));
        if (nytt && beat >= 2) return nytt.farge;
        if (beat >= 4 && id === '642') return '#fef3c7';
        if (id === '276' || id === '348') return beat >= 4 ? '#e7d8c4' : LAND_GRA;
        return LAND_GRA;
    }
    // stemmerett
    const s = STEMME.find((x) => x.id === id);
    if (s && beat >= s.beat) return beat >= 3 ? '#fcd34d' : '#fbbf24';
    return LAND_GRA;
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

/** En krone. Faller av og blir grå når riket faller. */
function Krone({ x, y, k, falt }: { x: number; y: number; k: number; falt: boolean }) {
    const s = 26 * k;
    return (
        <motion.g
            initial={false}
            animate={{ opacity: falt ? 0 : 1 }}
            transition={{ duration: 0.8 }}
        >
            <path
                d={`M ${x - s} ${y} L ${x - s} ${y - s * 1.1} L ${x - s * 0.5} ${y - s * 0.5} L ${x} ${y - s * 1.3} L ${x + s * 0.5} ${y - s * 0.5} L ${x + s} ${y - s * 1.1} L ${x + s} ${y} Z`}
                fill="#facc15"
                stroke="#92400e"
                strokeWidth={3 * k}
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

function FallEtiketter({ beat, p, k }: { beat: number; p: P; k: number }) {
    return (
        <>
            {RIKER.map((rike) => {
                const falt = beat >= rike.fallBeat;
                const [x, y] = p(rike.ll);
                const iFokus = rike.fallBeat === beat || (rike.fallBeat === 3 && beat === 4);
                // Når kartet zoomer inn på ett rike, vises bare navnene i det riket.
                const visNavn = beat <= 1 || iFokus;
                return (
                    <g key={rike.navn}>
                        <Krone x={x} y={y - 34 * k} k={k} falt={falt} />
                        {!falt && (beat <= 1 || beat === 5) && <Merke x={x} y={y + 6 * k} tekst={rike.navn} k={k} farge="#7c2d12" storrelse={30} />}
                        {falt &&
                            visNavn &&
                            rike.biter.map((bit, i) => {
                                if (rike.fallBeat === 3 && bit.navn === 'Tyrkia' && beat < 4) return null;
                                const [bx, by] = p(bit.ll);
                                return (
                                    <motion.g
                                        key={bit.navn}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.35, duration: 0.6 }}
                                    >
                                        <Merke
                                            x={bx}
                                            y={by}
                                            tekst={bit.navn}
                                            k={k}
                                            storrelse={bit.navn === bit.navn.toUpperCase() ? 32 : 28}
                                        />
                                    </motion.g>
                                );
                            })}
                    </g>
                );
            })}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
                    <Merke
                        x={p([32.5, 41.3])[0]}
                        y={p([32.5, 41.3])[1]}
                        tekst="Atatürk: ny republikk"
                        k={k}
                        farge="#9f1239"
                        storrelse={24}
                    />
                </motion.g>
            )}
        </>
    );
}

function TysklandEtiketter({ beat, p, k }: { beat: number; p: P; k: number }) {
    const [ax, ay] = p([7.1, 48.6]);
    const [ox, oy] = p([17.6, 53.0]);
    return (
        <>
            <Merke x={p([10.4, 51.0])[0]} y={p([10.4, 51.0])[1]} tekst="TYSKLAND" k={k} farge="#7c2d12" storrelse={30} />
            {beat === 0 && <Merke x={p([3.2, 46.6])[0]} y={p([3.2, 46.6])[1]} tekst="FRANKRIKE" k={k} farge="#64748b" storrelse={24} />}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}>
                    <path
                        d={`M ${ax - 10 * k} ${ay + 6 * k} L ${ax - 90 * k} ${ay + 60 * k}`}
                        stroke="#334155"
                        strokeWidth={5 * k}
                        markerEnd="url(#kp-pil)"
                    />
                    <Merke x={ax - 100 * k} y={ay + 100 * k} tekst="Alsace-Lorraine til Frankrike" k={k} anker="middle" farge="#1d4ed8" storrelse={24} />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}>
                    <path
                        d={`M ${ox + 10 * k} ${oy} L ${ox + 90 * k} ${oy + 30 * k}`}
                        stroke="#334155"
                        strokeWidth={5 * k}
                        markerEnd="url(#kp-pil)"
                    />
                    <Merke x={ox + 100 * k} y={oy + 40 * k} tekst="til Polen" k={k} anker="start" farge="#4338ca" storrelse={26} />
                </motion.g>
            )}
        </>
    );
}

function NyeEtiketter({ beat, p, k, grenser }: { beat: number; p: P; k: number; grenser: string[] }) {
    return (
        <>
            {beat === 3 &&
                grenser.map((d, i) => (
                    <motion.path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={6 * k}
                        strokeDasharray={`${14 * k} ${10 * k}`}
                        initial={{ strokeDashoffset: 0, opacity: 0 }}
                        animate={{ strokeDashoffset: -240 * k, opacity: [0, 1, 0.5, 1] }}
                        transition={{ strokeDashoffset: { duration: 4, repeat: Infinity, ease: 'linear' }, opacity: { duration: 2, delay: i * 0.25 } }}
                    />
                ))}
            {beat >= 2 &&
                NYE.map((n, i) => {
                    // Når folkegruppene vises, tar merket deres plassen til navnet.
                    if (beat >= 4 && n.navn === 'Tsjekkoslovakia') return null;
                    const [x, y] = p(n.ll);
                    return (
                        <motion.g key={n.navn} initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 1 : 0.8 }} transition={{ delay: beat === 2 ? 0.3 + i * 0.6 : 0, duration: 0.5 }}>
                            <Merke x={x} y={y} tekst={n.navn} k={k} storrelse={30} />
                        </motion.g>
                    );
                })}
            {beat >= 4 &&
                MINORITETER.map((m, i) => {
                    const [x, y] = p(m.ll);
                    return (
                        <motion.g key={m.etikett} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.8, duration: 0.6 }}>
                            {beat >= 5 && (
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    fill="#dc2626"
                                    initial={{ r: 20 * k, opacity: 0.4 }}
                                    animate={{ r: [20 * k, 60 * k, 20 * k], opacity: [0.45, 0.1, 0.45] }}
                                    transition={{ duration: 2.2, repeat: Infinity }}
                                />
                            )}
                            <Folk x={x} y={y} k={k} farge={m.farge} />
                            <Merke x={x - 26 * k} y={y + m.dy * k} tekst={m.etikett} k={k} anker={m.anker} farge={m.farge} storrelse={30} />
                        </motion.g>
                    );
                })}
        </>
    );
}

/** Tre små mennesker. */
function Folk({ x, y, k, farge }: { x: number; y: number; k: number; farge: string }) {
    return (
        <g>
            {[-1, 0, 1].map((i) => (
                <g key={i} transform={`translate(${x + i * 18 * k} ${y + (i === 0 ? -6 : 0) * k})`}>
                    <circle cx={0} cy={-14 * k} r={6 * k} fill={farge} stroke="#fff" strokeWidth={2 * k} />
                    <path
                        d={`M ${-8 * k} ${10 * k} Q ${-8 * k} ${-6 * k} 0 ${-6 * k} Q ${8 * k} ${-6 * k} ${8 * k} ${10 * k} Z`}
                        fill={farge}
                        stroke="#fff"
                        strokeWidth={2 * k}
                    />
                </g>
            ))}
        </g>
    );
}

function StemmeEtiketter({ beat, p, k }: { beat: number; p: P; k: number }) {
    return (
        <>
            {STEMME.filter((s) => beat >= s.beat).map((s, i) => {
                const [x, y] = p(s.ll);
                return (
                    <motion.g key={s.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.5, duration: 0.6 }} style={{ transformOrigin: `${x}px ${y}px` }}>
                        <Merke x={x} y={y} tekst={s.ar ? `${s.navn}, ${s.ar}` : s.navn} k={k} farge="#78350f" storrelse={26} />
                    </motion.g>
                );
            })}
        </>
    );
}

function Wilson({ beat }: { beat: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-7 py-5"
            style={{ right: '4%', top: '18%', width: 470 }}
        >
            <div className="text-xl font-bold text-slate-500">Woodrow Wilson, USA</div>
            <div className="text-4xl font-black text-slate-900 mt-1">14 punkter</div>
            <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {Array.from({ length: 14 }, (_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, backgroundColor: beat >= 1 && i === 0 ? '#2563eb' : '#cbd5e1' }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="rounded-full"
                        style={{ width: 34, height: 34 }}
                    />
                ))}
            </div>
            {beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 text-2xl font-black text-blue-700 leading-tight"
                >
                    Nasjonal selvbestemmelse:
                    <div className="text-xl font-bold text-slate-700 mt-1">hvert folk sitt eget land</div>
                </motion.div>
            )}
        </motion.div>
    );
}

function Kolonier() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-7 py-4 flex items-center gap-5"
            style={{ bottom: '7%', right: '4%' }}
        >
            <svg viewBox="-40 -40 80 80" style={{ width: 70, height: 70 }}>
                <circle r={34} fill="#bae6fd" stroke="#0369a1" strokeWidth={4} />
                <path d="M -18 -20 Q -2 -26 6 -12 Q 14 4 2 22 Q -10 10 -20 -4 Z" fill="#a3a3a3" />
                <line x1={-30} y1={-30} x2={30} y2={30} stroke="#dc2626" strokeWidth={8} strokeLinecap="round" />
                <line x1={30} y1={-30} x2={-30} y2={30} stroke="#dc2626" strokeWidth={8} strokeLinecap="round" />
            </svg>
            <div>
                <div className="text-3xl font-black text-slate-900">Alle koloniene</div>
                <div className="text-xl font-bold text-slate-500">utenfor Europa: borte</div>
            </div>
        </motion.div>
    );
}

function Usa() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="absolute rounded-2xl bg-amber-400 shadow-2xl px-5 py-3 text-3xl font-black text-amber-950"
            style={{ left: '3%', top: '45%' }}
        >
            ← USA
        </motion.div>
    );
}
