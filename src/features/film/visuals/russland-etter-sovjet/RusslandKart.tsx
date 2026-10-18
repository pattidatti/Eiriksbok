import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoConicConformal, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Brikke, GassRor, GassStil, RUSSLAND_ROD } from './felles';

/**
 * Kartet i Russland-filmen, i fem modus:
 * «sammenbrudd»: Sovjetunionen som én rød flate, flagget tas ned i Moskva, femten land.
 * «gass»: røret gjennom Ukraina, så Nord Stream på bunnen av Østersjøen, utenom naboene.
 * «nato»: landene i øst går inn i NATO i 1999 og 2004, og hvordan det ser ut fra Kreml.
 * «opptrapping»: Georgia 2008, Krim 2014, Ukraina 2022, mens gassen renner videre.
 * «svar»: sanksjoner, gassen kuttes, Finland og Sverige blir med i NATO.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'sammenbrudd' | 'gass' | 'nato' | 'opptrapping' | 'svar';

const RUSSLAND = 643;
const UKRAINA = 804;
const GEORGIA = 268;
const FINLAND = 246;
const SVERIGE = 752;
const TYSKLAND = 276;
const HVITERUSSLAND = 112;

/** De femten sovjetrepublikkene, med en egen farge hver når de blir egne land. */
const SOVJET: [number, string][] = [
    [643, RUSSLAND_ROD],
    [804, '#facc15'],
    [112, '#86efac'],
    [498, '#c4b5fd'],
    [233, '#7dd3fc'],
    [428, '#fda4af'],
    [440, '#bef264'],
    [268, '#fdba74'],
    [51, '#f9a8d4'],
    [31, '#5eead4'],
    [398, '#93c5fd'],
    [860, '#fcd34d'],
    [795, '#a5b4fc'],
    [417, '#6ee7b7'],
    [762, '#fca5a5'],
];
const SOVJET_IDER = SOVJET.map(([id]) => id);

const NATO_FOR = [840, 124, 826, 250, 276, 380, 528, 56, 442, 208, 578, 352, 620, 300, 792, 724];
const NATO_1999 = [616, 203, 348];
const NATO_2004 = [233, 428, 440, 703, 705, 642, 100];
/** Land som kom med etter 2004, så kartet i 2022 er riktig. Filmen nevner dem ikke. */
const NATO_SENERE = [8, 191, 499, 807];
const OSTBLOKK = [...NATO_1999, ...NATO_2004, 112, 804, 498];

/** Krim hørte til Ukraina. Kartet tegner halvøya som russisk, så vi tegner den over. */
const KRIM = poly([
    [33.4, 46.1],
    [34.6, 46.2],
    [35.5, 45.6],
    [36.7, 45.5],
    [36.5, 45.1],
    [35.2, 44.7],
    [33.5, 44.35],
    [32.4, 45.35],
]);
/** Grove omriss av de to områdene Georgia mistet kontrollen over i 2008. */
const SOR_OSSETIA = poly([
    [43.55, 42.55],
    [44.3, 42.75],
    [44.6, 42.45],
    [44.25, 42.1],
    [43.7, 42.15],
]);
const ABKHASIA = poly([
    [40.0, 43.4],
    [40.9, 43.55],
    [42.1, 43.2],
    [42.0, 42.75],
    [41.55, 42.6],
    [40.6, 43.0],
]);

function poly(punkter: LngLat[]) {
    return { type: 'Polygon', coordinates: [[...punkter, punkter[0]]] };
}

const STED = {
    moskva: [37.6, 55.75] as LngLat,
    kyiv: [30.5, 50.45] as LngLat,
    tbilisi: [44.8, 41.7] as LngLat,
    gassfelt: [72, 64] as LngLat,
    vyborg: [28.7, 60.7] as LngLat,
    greifswald: [13.6, 54.1] as LngLat,
};

/** Røret gjennom Ukraina og Nord Stream, som punktlister. */
const ROR_UKRAINA: LngLat[] = [
    [44, 56],
    [37.6, 52],
    [31, 50],
    [24, 48.8],
    [17.2, 48.6],
    [12, 50],
];
const ROR_NORDSTREAM: LngLat[] = [
    [36, 59],
    [28.7, 60.7],
    [24, 59.6],
    [19.5, 57.2],
    [15.5, 55],
    [13.6, 54.1],
];
const ROR_SVAR: LngLat[] = [
    [36, 56],
    [28, 54],
    [20, 52.6],
    [12, 51.5],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    nato: '#60a5fa',
    natoNy: '#1d4ed8',
    ost: '#fecaca',
    ukraina: '#facc15',
    blek: '#e7e5e4',
    sanksjon: '#78716c',
};

/** Punkter over hele utsnittet. To hjørner er ikke nok i en kjegleprojeksjon, for breddegradene bøyer seg. */
function rutenett(a: LngLat, b: LngLat): LngLat[] {
    const ut: LngLat[] = [];
    for (let i = 0; i <= 8; i++)
        for (let j = 0; j <= 4; j++) ut.push([a[0] + ((b[0] - a[0]) * i) / 8, a[1] + ((b[1] - a[1]) * j) / 4]);
    return ut;
}

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, rot: number) =>
        geoConicConformal()
            .rotate([-rot, 0])
            .parallels([45, 65])
            .fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: rutenett(a, b) } as never
            );
    switch (modus) {
        case 'sammenbrudd':
            return utsnitt([22, 37], [125, 70], 72);
        case 'gass':
            return utsnitt([4, 44], [62, 63], 32);
        case 'nato':
            return utsnitt([-8, 40], [56, 64], 25);
        case 'opptrapping':
            return utsnitt([23, 41], [48, 54], 36);
        case 'svar':
            return utsnitt([-6, 44], [52, 70], 22);
    }
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    const sovjet = SOVJET.find(([s]) => s === id);
    if (modus === 'sammenbrudd') {
        if (!sovjet) return FARGE.land;
        if (beat <= 1) return RUSSLAND_ROD;
        if (beat === 2) return sovjet[1];
        return id === RUSSLAND ? RUSSLAND_ROD : FARGE.blek;
    }
    if (modus === 'gass') {
        if (id === RUSSLAND) return RUSSLAND_ROD;
        if (id === UKRAINA) return beat === 1 ? FARGE.ukraina : '#fde68a';
        if (id === TYSKLAND && beat >= 2) return '#d6d3d1';
        return FARGE.land;
    }
    if (modus === 'nato') {
        if (id === RUSSLAND) return beat === 3 ? '#7f1d1d' : RUSSLAND_ROD;
        if (NATO_FOR.includes(id)) return FARGE.nato;
        if (beat >= 1 && (NATO_1999.includes(id) || NATO_2004.includes(id))) return FARGE.natoNy;
        if (OSTBLOKK.includes(id)) return FARGE.ost;
        return FARGE.land;
    }
    if (modus === 'opptrapping') {
        if (id === RUSSLAND || id === HVITERUSSLAND) return id === RUSSLAND ? RUSSLAND_ROD : '#fca5a5';
        if (id === GEORGIA) return beat <= 1 ? '#fdba74' : '#fed7aa';
        if (id === UKRAINA) return beat >= 2 ? FARGE.ukraina : '#fef3c7';
        return FARGE.land;
    }
    // svar
    if (id === RUSSLAND) return FARGE.sanksjon;
    if (id === UKRAINA) return FARGE.ukraina;
    if (id === FINLAND || id === SVERIGE) return beat >= 3 ? FARGE.natoNy : beat === 2 ? '#a5f3fc' : FARGE.land;
    if ([...NATO_FOR, ...NATO_1999, ...NATO_2004, ...NATO_SENERE].includes(id)) return FARGE.nato;
    return FARGE.land;
}

export function RusslandKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sammenbrudd';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pkt: LngLat[]) => {
        const xy = pkt.map(p);
        return xy.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    };
    const krimFarge =
        modus === 'opptrapping' && beat >= 3
            ? RUSSLAND_ROD
            : modus === 'svar'
              ? '#d6a10a'
              : fargeFor(modus, beat, UKRAINA);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <GassStil />
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                    tykk={modus === 'sammenbrudd' && beat <= 1 ? SOVJET_IDER : []}
                />
                {modus !== 'sammenbrudd' && (
                    <path
                        d={sti(KRIM as never) ?? ''}
                        fill={krimFarge}
                        stroke={FARGE.kant}
                        strokeWidth={1}
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                )}

                {modus === 'sammenbrudd' && (
                    <>
                        {beat === 0 && <Etikett pos={p([80, 61])} tekst="Sovjetunionen" stor farge="#7f1d1d" />}
                        {beat === 1 && <Flaggstang pos={p(STED.moskva)} />}
                        {beat >= 1 && <Nål pos={p(STED.moskva)} tekst="Moskva" under={beat === 1} />}
                        {beat === 2 && (
                            <>
                                <Etikett pos={p([31, 49])} tekst="Ukraina" />
                                <Etikett pos={p([67, 48])} tekst="Kasakhstan" />
                                <Etikett pos={p([24.5, 57])} tekst="Baltikum" />
                                <Etikett pos={p([62, 39])} tekst="Usbekistan" />
                                <Etikett pos={p([44, 41.5])} tekst="Kaukasus" />
                            </>
                        )}
                        {beat >= 2 && <Etikett pos={p([95, 63])} tekst="Russland" stor farge="#7f1d1d" />}
                    </>
                )}

                {modus === 'gass' && (
                    <>
                        <Nål pos={p(STED.moskva)} tekst="Moskva" />
                        {beat === 0 && <Gassfelt pos={p([52, 60])} />}
                        {beat >= 1 && (
                            <GassRor d={linje(ROR_UKRAINA)} playing={playing} bredde={16} />
                        )}
                        {beat >= 1 && <Etikett pos={p([31, 47.6])} tekst="Ukraina" farge="#854d0e" />}
                        {beat >= 2 && (
                            <GassRor d={linje(ROR_NORDSTREAM)} playing={playing} farge="#38bdf8" bredde={16} forsinkelse={0.4} />
                        )}
                        {beat >= 2 && <Etikett pos={p([12.5, 57.6])} tekst="Nord Stream, 2011" farge="#075985" />}
                        {beat >= 2 && <Etikett pos={p([10.5, 51.4])} tekst="Tyskland" />}
                    </>
                )}

                {modus === 'nato' && (
                    <>
                        <Etikett pos={p([44, 61])} tekst="Russland" stor farge="#7f1d1d" />
                        {beat === 0 && <Etikett pos={p([2, 47])} tekst="NATO" stor farge="#1e3a8a" />}
                        {beat === 1 && <Etikett pos={p([19, 50.6])} tekst="1999" stor farge="#1e3a8a" />}
                        {beat === 1 && <Etikett pos={p([24, 58.6])} tekst="2004" stor farge="#1e3a8a" />}
                        {beat === 1 && <Etikett pos={p([25, 44])} tekst="2004" stor farge="#1e3a8a" />}
                        {beat === 2 &&
                            ([
                                [19.5, 52],
                                [24.5, 56.5],
                                [25, 45.6],
                                [17, 47.5],
                            ] as LngLat[]).map((ll, i) => <Skjold key={i} pos={p(ll)} forsinkelse={0.3 + i * 0.25} />)}
                        {beat === 3 &&
                            ([
                                [16, 52],
                                [20, 56.5],
                                [22, 45.5],
                            ] as LngLat[]).map((ll, i) => (
                                <Pil key={i} fra={p(ll)} til={p([ll[0] + 11, ll[1] + 1])} farge="#1d4ed8" forsinkelse={i * 0.3} />
                            ))}
                        {beat >= 3 && <Nål pos={p(STED.moskva)} tekst="Moskva" />}
                    </>
                )}

                {modus === 'opptrapping' && (
                    <>
                        <Etikett pos={p([43.5, 51.5])} tekst="Russland" stor farge="#7f1d1d" />
                        {beat <= 1 && <Pil fra={p([45, 46.5])} til={p([43.9, 42.6])} farge={RUSSLAND_ROD} />}
                        <Etikett pos={p([42.3, 41.2])} tekst={beat <= 1 ? 'Georgia 2008' : 'Georgia'} farge="#9a3412" dy={34} />
                        {beat >= 1 && (
                            <>
                                <path d={sti(SOR_OSSETIA as never) ?? ''} fill={RUSSLAND_ROD} opacity={0.85} />
                                <path d={sti(ABKHASIA as never) ?? ''} fill={RUSSLAND_ROD} opacity={0.85} />
                            </>
                        )}
                        {beat === 1 && <Etikett pos={p([44.3, 43.4])} tekst="Sør-Ossetia" farge="#7f1d1d" dy={-8} liten />}
                        {beat === 1 && <Etikett pos={p([40.2, 44.3])} tekst="Abkhasia" farge="#7f1d1d" dy={-8} liten />}
                        {beat >= 2 && <Etikett pos={p([29, 48.6])} tekst={beat === 5 ? 'Ukraina 2022' : 'Ukraina 2014'} stor farge="#854d0e" />}
                        {beat >= 2 && <Nål pos={p(STED.kyiv)} tekst="Kyiv" under />}
                        {beat >= 3 && <Etikett pos={p([34.2, 44.2])} tekst="Krim" farge="#7f1d1d" dy={20} />}
                        {beat === 4 && <GassRor d={linje([[45, 48.5], [38, 47.6], [32, 47.4], [23.5, 47.6]])} playing={playing} bredde={14} />}
                        {beat === 5 &&
                            ([
                                [[31.2, 53.6], [31.0, 51.3]],
                                [[40.6, 50.4], [37.4, 49.6]],
                                [[38.8, 47.5], [36.9, 47.9]],
                                [[34.1, 45.7], [33.8, 46.9]],
                            ] as [LngLat, LngLat][]).map(([a, b], i) => (
                                <Pil key={i} fra={p(a)} til={p(b)} farge={RUSSLAND_ROD} forsinkelse={0.3 + i * 0.35} />
                            ))}
                    </>
                )}

                {modus === 'svar' && (
                    <>
                        <Etikett pos={p([42, 60])} tekst="Russland" stor farge="#292524" />
                        {beat === 0 && <Gjerde d={sti(geographies.find((g) => Number(g.id) === RUSSLAND) as never) ?? ''} />}
                        {beat === 0 && <Selskaper fra={p([40, 56])} til={p([12, 52])} />}
                        {beat >= 1 && <GassRor d={linje(ROR_SVAR)} playing={playing} stoppet bredde={14} />}
                        {beat >= 1 && <Kryss pos={p([24.5, 53.3])} />}
                        {beat >= 2 && <Etikett pos={p([28, 66])} tekst={beat >= 3 ? 'Finland 2023' : 'Finland?'} farge="#1e3a8a" />}
                        {beat >= 2 && <Etikett pos={p([12.5, 59.5])} tekst={beat >= 3 ? 'Sverige 2024' : 'Sverige?'} farge="#1e3a8a" />}
                        {beat === 4 && <Etikett pos={p([31.5, 49])} tekst="Ukraina" stor farge="#854d0e" />}
                    </>
                )}
            </svg>

            <AnimatePresence>
                {modus === 'sammenbrudd' && beat === 0 && <Brikke key="a0" tekst="Juledag, 25. desember 1991" />}
                {modus === 'sammenbrudd' && beat === 1 && <Brikke key="a1" tekst="Flagget tas ned for siste gang" farge="rod" />}
                {modus === 'sammenbrudd' && beat === 2 && <Brikke key="a2" tekst="Femten nye land" />}
                {modus === 'sammenbrudd' && beat === 3 && <Brikke key="a3" tekst="For mange russere: et nederlag" farge="rod" />}
                {modus === 'gass' && beat === 0 && <Brikke key="g0" tekst="Se på hva de bygger" farge="mork" />}
                {modus === 'gass' && beat === 1 && <Brikke key="g1" tekst="Gassen går gjennom Ukraina" />}
                {modus === 'gass' && beat === 2 && <Brikke key="g2" tekst="Nytt rør på havbunnen" />}
                {modus === 'gass' && beat === 3 && <Brikke key="g3" tekst="Gassen kan gå utenom naboene" farge="rod" />}
                {modus === 'nato' && beat === 0 && <Brikke key="n0" tekst="Grensene flytter seg" />}
                {modus === 'nato' && beat === 1 && <Brikke key="n1" tekst="Inn i NATO: 1999 og 2004" />}
                {modus === 'nato' && beat === 2 && <Brikke key="n2" tekst="De ville ha beskyttelse" />}
                {modus === 'nato' && beat === 3 && <Brikke key="n3" tekst="Sett fra Kreml: fienden kommer nærmere" farge="rod" />}
                {modus === 'nato' && beat === 4 && <Brikke key="n4" tekst="Ingen stat kan ta land med makt" farge="mork" />}
                {modus === 'opptrapping' && beat === 0 && <Brikke key="o0" tekst="Steg 1: Georgia, 2008" farge="rod" />}
                {modus === 'opptrapping' && beat === 1 && <Brikke key="o1" tekst="Fem dager. Vesten kjøper gass som før" />}
                {modus === 'opptrapping' && beat === 2 && <Brikke key="o2" tekst="Ukraina, 2014: opprør" />}
                {modus === 'opptrapping' && beat === 3 && <Brikke key="o3" tekst="Steg 2: Krim, 18. mars 2014" farge="rod" />}
                {modus === 'opptrapping' && beat === 4 && <Brikke key="o4" tekst="Sanksjoner, men gassen renner" />}
                {modus === 'opptrapping' && beat === 5 && <Brikke key="o5" tekst="Steg 3: 24. februar 2022" farge="rod" />}
                {modus === 'svar' && beat === 0 && <Brikke key="s0" tekst="Sanksjoner: selskaper drar" />}
                {modus === 'svar' && beat === 1 && <Brikke key="s1" tekst="Europa kutter gassen" />}
                {modus === 'svar' && beat === 2 && <Brikke key="s2" tekst="Finland og Sverige søker om NATO" />}
                {modus === 'svar' && beat === 3 && <Brikke key="s3" tekst="Med i NATO" />}
                {modus === 'svar' && beat === 4 && <Brikke key="s4" tekst="Per 2026: ingen varig fred" farge="mork" />}
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
        tykk,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
        tykk: number[];
    }) {
        return (
            <>
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    const fyll = farge(id);
                    // Når Sovjetunionen er én flate, skjuler vi grensene inni den.
                    const skjult = tykk.includes(id);
                    return (
                        <path
                            key={i}
                            d={sti(g as never) ?? ''}
                            fill={fyll}
                            stroke={skjult ? fyll : FARGE.kant}
                            strokeWidth={skjult ? 1.5 : 1}
                            style={{ transition: 'fill 1.1s ease, stroke 1.1s ease' }}
                        />
                    );
                })}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    liten,
    dy = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    liten?: boolean;
    dy?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 56 : liten ? 32 : 40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Nål({ pos, tekst, under }: { pos: [number, number]; tekst: string; under?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <circle cx={pos[0]} cy={pos[1]} r={11} fill="#0f172a" stroke="#ffffff" strokeWidth={4} />
            <text
                x={pos[0]}
                y={pos[1] + (under ? 52 : -26)}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
}) {
    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: forsinkelse, ease: 'easeOut' }}
            />
            <motion.path
                d="M -10 -22 L 30 0 L -10 22 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1 }}
            />
        </g>
    );
}

/** Flaggstang i Moskva der det røde flagget glir ned. */
function Flaggstang({ pos }: { pos: [number, number] }) {
    const [x, y] = [pos[0] + 40, pos[1] - 10];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <rect x={x - 3} y={y - 230} width={7} height={230} fill="#334155" stroke="#ffffff" strokeWidth={2} />
            <motion.g initial={{ y: 0 }} animate={{ y: 160 }} transition={{ delay: 0.8, duration: 4.5, ease: 'easeInOut' }}>
                <rect x={x + 4} y={y - 226} width={120} height={78} fill="#dc2626" stroke="#ffffff" strokeWidth={3} />
                {/* Stjerne, hammer og sigd */}
                <path d={`M ${x + 24} ${y - 216} l 3 6 7 1 -5 4 2 7 -7 -4 -7 4 2 -7 -5 -4 7 -1 Z`} fill="#facc15" />
                <path d={`M ${x + 14} ${y - 190} a 13 13 0 1 0 22 -6`} fill="none" stroke="#facc15" strokeWidth={4} />
                <path d={`M ${x + 15} ${y - 172} L ${x + 35} ${y - 192} M ${x + 30} ${y - 197} L ${x + 40} ${y - 187}`} stroke="#facc15" strokeWidth={4} />
            </motion.g>
        </motion.g>
    );
}

/** Et gassfelt: tre tårn med en flamme på toppen. */
function Gassfelt({ pos }: { pos: [number, number] }) {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {[0, 1, 2].map((i) => {
                const x = pos[0] - 70 + i * 70;
                const y = pos[1];
                return (
                    <g key={i}>
                        <path d={`M ${x - 18} ${y + 40} L ${x} ${y - 50} L ${x + 18} ${y + 40} Z`} fill="none" stroke="#1e293b" strokeWidth={6} />
                        <path d={`M ${x - 10} ${y} L ${x + 10} ${y} M ${x - 14} ${y + 20} L ${x + 14} ${y + 20}`} stroke="#1e293b" strokeWidth={5} />
                        <path d={`M ${x} ${y - 52} q -12 -20 0 -40 q 12 20 0 40`} fill="#f59e0b" stroke="#ffffff" strokeWidth={3} />
                    </g>
                );
            })}
            <text
                x={pos[0]}
                y={pos[1] + 92}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#7f1d1d"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Gass og olje
            </text>
        </motion.g>
    );
}

function Kryss({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
            stroke="#b91c1c"
            strokeWidth={16}
            strokeLinecap="round"
        >
            <line x1={pos[0] - 34} y1={pos[1] - 34} x2={pos[0] + 34} y2={pos[1] + 34} />
            <line x1={pos[0] + 34} y1={pos[1] - 34} x2={pos[0] - 34} y2={pos[1] + 34} />
        </motion.g>
    );
}

/** Et skjold over et nytt NATO-land: beskyttelse. */
function Skjold({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.path
            d={`M ${x} ${y - 38} L ${x + 32} ${y - 26} Q ${x + 30} ${y + 18} ${x} ${y + 38} Q ${x - 30} ${y + 18} ${x - 32} ${y - 26} Z`}
            fill="#1e40af"
            stroke="#ffffff"
            strokeWidth={5}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        />
    );
}

/** Et stiplet gjerde rundt Russland: sanksjonene. */
function Gjerde({ d }: { d: string }) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke="#0f172a"
            strokeWidth={7}
            strokeDasharray="18 12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
        />
    );
}

/** Små firmabygg som flytter ut av Russland mot vest. */
function Selskaper({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    return (
        <g>
            {Array.from({ length: 7 }, (_, i) => {
                const dy = (i - 3) * 34;
                return (
                    <motion.g
                        key={i}
                        initial={{ x: fra[0], y: fra[1] + dy, opacity: 0 }}
                        animate={{ x: til[0] + (i % 2) * 30, y: til[1] + dy, opacity: [0, 1, 1, 0.9] }}
                        transition={{ delay: 0.8 + i * 0.25, duration: 2.6, ease: 'easeInOut' }}
                    >
                        <rect x={-16} y={-14} width={32} height={28} rx={3} fill="#f8fafc" stroke="#0f172a" strokeWidth={4} />
                        <rect x={-8} y={-6} width={6} height={6} fill="#0f172a" />
                        <rect x={3} y={-6} width={6} height={6} fill="#0f172a" />
                    </motion.g>
                );
            })}
        </g>
    );
}
