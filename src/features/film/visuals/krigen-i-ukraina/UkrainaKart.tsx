import { memo, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoConicConformal, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { KRIM, rammePunkter, type LngLat } from '../../kart/grenser';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Brikke } from './felles';

/**
 * Kartet i Ukraina-filmen, i fire moduser:
 * «invasjon»: natt, byene lyser, piler fra nord, øst og sør (24. februar 2022).
 * «retninger»: to uskarpe skyer, russisk i øst og sør, ukrainsk i vest. Putin: ett folk.
 * «krim»: Krim tas og annekteres i 2014, og krigen i Donetsk og Luhansk.
 * «front»: Kyiv, Mariupol, Kharkiv og Kherson, de fire regionene og det Russland holder.
 *
 * Krim tegnes alltid selv, oppå verdenskartet, i Ukrainas farge til det blir tatt.
 */

const B = 1600;
const H = 900;
type Modus = 'invasjon' | 'retninger' | 'krim' | 'front';

const UKRAINA = 804;
const RUSSLAND = 643;
const HVITERUSSLAND = 112;

const UTSNITT: Utsnitt = [
    [20.5, 43.6],
    [41.5, 53.4],
];

function poly(punkter: LngLat[]) {
    return { type: 'Polygon', coordinates: [[...punkter, punkter[0]]] };
}

/** Grove, uskarpe områder. Ingen skarpe grenser: artikkelen gir ingen. */
const OST_SOR = poly([
    [33.2, 52.6],
    [41, 50.4],
    [40.6, 46.6],
    [36, 46.2],
    [33.8, 45.9],
    [30.2, 45.9],
    [29.6, 46.9],
    [31.6, 47.8],
    [33.6, 49.6],
]);
const VEST = poly([
    [21.8, 52.4],
    [27.6, 52.2],
    [28.4, 49.6],
    [27, 48],
    [24, 47.6],
    [21.8, 48.2],
]);
const DONBAS = poly([
    [36.7, 49.9],
    [38, 50.2],
    [39.9, 49.9],
    [40.3, 49.3],
    [39.9, 48.6],
    [40, 47.9],
    [38.3, 47.1],
    [37.3, 47],
    [36.9, 47.6],
    [36.6, 48.3],
    [37.3, 49],
]);
/** De fire regionene Russland erklærte som sine 30. september 2022, grovt. */
const FIRE_REGIONER = poly([
    [32.3, 47.3],
    [33.3, 47.1],
    [34.6, 47.9],
    [35.4, 48.1],
    [36.6, 48.3],
    [37.3, 49],
    [36.7, 49.9],
    [38, 50.2],
    [39.9, 49.9],
    [40.3, 49.3],
    [39.9, 48.6],
    [40, 47.9],
    [38.3, 47.1],
    [37, 46.6],
    [35.2, 46.2],
    [33.6, 46.1],
    [31.8, 46.3],
]);
/** Det Russland har holdt siden 2023, grovt. Klippes etter Ukraina og Krim. */
const HOLDT = poly([
    [31.8, 46.45],
    [33.4, 46.8],
    [34.6, 47.35],
    [35.6, 47.6],
    [36.7, 47.75],
    [37.6, 48.0],
    [37.9, 48.6],
    [38.1, 49.0],
    [37.9, 49.45],
    [38.3, 49.95],
    [41, 49.9],
    [41, 46.5],
    [36.5, 43.5],
    [31.5, 43.5],
]);
const KHARKIV_OMRADE = poly([
    [35.6, 50.4],
    [37.6, 50.4],
    [38.1, 49.5],
    [37.6, 49.0],
    [36.3, 49.2],
]);
const KHERSON_OMRADE = poly([
    [32.0, 47.5],
    [33.6, 47.6],
    [33.9, 46.9],
    [32.6, 46.55],
    [31.9, 46.7],
]);

const BY = {
    kyiv: [30.52, 50.45] as LngLat,
    kharkiv: [36.23, 49.99] as LngLat,
    odesa: [30.73, 46.48] as LngLat,
    lviv: [24.03, 49.84] as LngLat,
    dnipro: [35.05, 48.46] as LngLat,
    mariupol: [37.55, 47.1] as LngLat,
    kherson: [32.62, 46.64] as LngLat,
};

const DAG = {
    hav: '#cfe3f0',
    land: '#efe7d6',
    kant: '#b9ad92',
    ukraina: '#fde68a',
    russland: '#fecaca',
    rod: '#b91c1c',
};
const NATT = {
    hav: '#0b1220',
    land: '#1e293b',
    kant: '#475569',
    ukraina: '#334155',
    russland: '#2a1d24',
};

function lagProjeksjon(modus: Modus) {
    const [a, b]: [LngLat, LngLat] =
        modus === 'krim'
            ? [
                  [28.5, 43.8],
                  [41.5, 51],
              ]
            : [
                  [21.5, 44],
                  [41, 53],
              ];
    return geoConicConformal()
        .rotate([-31, 0])
        .parallels([44, 52])
        .fitExtent(
            [
                [60, 150],
                [B - 60, H - 30],
            ],
            rammePunkter(a, b) as never
        );
}

function landFarge(modus: Modus, beat: number, id: number): string {
    if (modus === 'invasjon') {
        if (id === UKRAINA) return NATT.ukraina;
        if (id === RUSSLAND) return NATT.russland;
        return NATT.land;
    }
    if (id === UKRAINA) return DAG.ukraina;
    if (id === RUSSLAND) {
        if (modus === 'retninger') return beat >= 3 ? '#fca5a5' : DAG.land;
        return DAG.russland;
    }
    if (id === HVITERUSSLAND && modus === 'front') return '#f1e4e4';
    return DAG.land;
}

export function UkrainaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'invasjon';
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const natt = modus === 'invasjon';
    const ukrainaGeo = geographies.find((g) => Number(g.id) === UKRAINA);
    const ukrainaD = ukrainaGeo ? (sti(ukrainaGeo as never) ?? '') : '';
    const krimD = sti(KRIM as never) ?? '';
    const d = (g: object) => sti(g as never) ?? '';

    const krimFarge = natt
        ? NATT.ukraina
        : (modus === 'krim' && beat >= 1) || modus === 'front'
          ? DAG.rod
          : DAG.ukraina;

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: natt ? NATT.hav : DAG.hav, transition: 'background 1s' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id="ukr-klipp">
                        <path d={ukrainaD} />
                        <path d={krimD} />
                    </clipPath>
                    <filter id="ukr-sky" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="38" />
                    </filter>
                    <filter id="ukr-glod" x="-200%" y="-200%" width="500%" height="500%">
                        <feGaussianBlur stdDeviation="9" />
                    </filter>
                    <pattern
                        id="ukr-skravur"
                        width="18"
                        height="18"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="18" height="18" fill="#dc2626" opacity={0.25} />
                        <rect width="7" height="18" fill="#b91c1c" opacity={0.75} />
                    </pattern>
                    <marker
                        id="ukr-pil"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
                    </marker>
                    <marker
                        id="ukr-pil-gra"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                </defs>

                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => landFarge(modus, beat, id)}
                    kant={natt ? NATT.kant : DAG.kant}
                    nokkel={`${modus}-${modus === 'retninger' ? Math.min(beat, 3) : 0}`}
                />
                <path
                    d={krimD}
                    fill={krimFarge}
                    stroke={natt ? NATT.kant : DAG.kant}
                    strokeWidth={1.2}
                    style={{ transition: 'fill 1.1s ease' }}
                />
                {/* Ukrainas grense, tydelig */}
                <path
                    d={ukrainaD}
                    fill="none"
                    stroke={natt ? '#facc15' : '#a16207'}
                    strokeWidth={natt ? 2.5 : 3}
                    opacity={0.9}
                />

                {modus === 'invasjon' && <Invasjon beat={beat} p={p} />}
                {modus === 'retninger' && <Retninger beat={beat} p={p} d={d} />}
                {modus === 'krim' && <KrimLag beat={beat} p={p} d={d} />}
                {modus === 'front' && <Front beat={beat} p={p} d={d} />}
            </svg>

            {modus === 'invasjon' && (
                <Oversiktskart
                    utsnitt={[
                        [21.5, 44],
                        [41, 53],
                    ]}
                    omrade={[
                        [-12, 34],
                        [60, 68],
                    ]}
                    synlig={beat === 0}
                    etikett="Europa"
                    plassering="nede-venstre"
                />
            )}

            <AnimatePresence mode="wait">
                <Brikke key={`${modus}-${beat}`} {...brikke(modus, beat)} />
            </AnimatePresence>
        </div>
    );
}

function brikke(modus: Modus, beat: number): { tekst: string; farge?: 'rod' | 'mork' | 'gul' } {
    const lister: Record<Modus, { tekst: string; farge?: 'rod' | 'mork' | 'gul' }[]> = {
        invasjon: [
            { tekst: 'Natt til torsdag 24. februar 2022', farge: 'mork' },
            { tekst: 'Russiske soldater: fra nord', farge: 'rod' },
            { tekst: 'Fra nord, øst og sør samtidig', farge: 'rod' },
            { tekst: 'Russland hadde nektet for angrepsplaner', farge: 'mork' },
        ],
        retninger: [
            { tekst: 'Ukraina: ett land, to retninger' },
            { tekst: 'Øst og sør, ifølge leksikonet' },
            { tekst: 'Vest, ifølge leksikonet' },
            { tekst: 'Mange i Russland: landene hører sammen', farge: 'rod' },
            { tekst: 'Putin, 2021: russere og ukrainere er ett folk', farge: 'rod' },
        ],
        krim: [
            { tekst: 'Russiske soldater tar kontroll over Krim', farge: 'rod' },
            { tekst: 'Mars 2014: Russland annekterer Krim', farge: 'rod' },
            { tekst: 'Annektere: ta et område fra et annet land', farge: 'mork' },
            { tekst: 'Fra april 2014: krig i øst' },
            { tekst: 'Over 14 000 drept, 2014 til 2022 (FN)', farge: 'mork' },
        ],
        front: [
            { tekst: 'Leksikonet: målet var trolig ny ledelse i Kyiv' },
            { tekst: 'Mars 2022: russiske styrker trekker seg fra Kyiv' },
            { tekst: 'Mariupol: de ukrainske soldatene ga seg i mai 2022', farge: 'rod' },
            { tekst: 'Høsten 2022: Ukraina tar tilbake områder', farge: 'gul' },
            { tekst: '30. september 2022: fire regioner erklært russiske', farge: 'rod' },
            { tekst: 'Etter 2022: fronten flytter seg lite', farge: 'mork' },
        ],
    };
    const l = lister[modus];
    return l[Math.min(beat, l.length - 1)];
}

type P = (ll: LngLat) => [number, number];

function Invasjon({ beat, p }: { beat: number; p: P }) {
    const byer: [LngLat, string][] = [
        [BY.kyiv, 'Kyiv'],
        [BY.kharkiv, 'Kharkiv'],
        [BY.odesa, 'Odesa'],
        [BY.lviv, 'Lviv'],
        [BY.dnipro, 'Dnipro'],
    ];
    const piler: { fra: LngLat; til: LngLat; fraBeat: number }[] = [
        { fra: [28.4, 52.2], til: [29.9, 50.9], fraBeat: 1 },
        { fra: [32.6, 52.9], til: [31.6, 51.3], fraBeat: 1 },
        { fra: [39.2, 50.9], til: [36.9, 50.15], fraBeat: 2 },
        { fra: [34.1, 45.6], til: [33.8, 47.0], fraBeat: 2 },
    ];
    return (
        <g>
            {byer.map(([ll, navn]) => {
                const [x, y] = p(ll);
                return (
                    <g key={navn}>
                        <circle
                            cx={x}
                            cy={y}
                            r={22}
                            fill="#fde68a"
                            opacity={0.55}
                            filter="url(#ukr-glod)"
                        />
                        <circle cx={x} cy={y} r={6} fill="#fef3c7" />
                    </g>
                );
            })}
            {beat >= 1 &&
                byer.map(([ll, navn]) => {
                    const [x, y] = p(ll);
                    return (
                        <g key={`b-${navn}`}>
                            <circle cx={x} cy={y} r={30} fill="#f97316" opacity={0.6}>
                                <animate
                                    attributeName="opacity"
                                    values="0.15;0.7;0.15"
                                    dur="1.6s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    );
                })}
            {piler
                .filter((pl) => beat >= pl.fraBeat)
                .map((pl, i) => (
                    <Pil
                        key={i}
                        fra={p(pl.fra)}
                        til={p(pl.til)}
                        forsinkelse={0.2 + (i % 2) * 0.4}
                    />
                ))}
            <Etikett pos={p([30.52, 50.45])} tekst="Kyiv" dy={46} natt />
            <Etikett pos={p([31.5, 48.4])} tekst="UKRAINA" stor natt farge="#fde68a" />
            {beat >= 1 && <Etikett pos={p([38.5, 52.3])} tekst="Russland" natt farge="#fca5a5" />}
        </g>
    );
}

function Retninger({ beat, p, d }: { beat: number; p: P; d: (g: object) => string }) {
    return (
        <g>
            <g clipPath="url(#ukr-klipp)">
                <Vis vis={beat >= 1}>
                    <path d={d(OST_SOR)} fill="#f97316" opacity={0.75} filter="url(#ukr-sky)" />
                </Vis>
                <Vis vis={beat >= 2}>
                    <path d={d(VEST)} fill="#2563eb" opacity={0.7} filter="url(#ukr-sky)" />
                </Vis>
            </g>
            <Etikett pos={p(BY.kyiv)} tekst="Kyiv" dy={-36} liten />
            <circle cx={p(BY.kyiv)[0]} cy={p(BY.kyiv)[1]} r={9} fill="#0f172a" />
            {beat === 0 && <Etikett pos={p([31.2, 48.6])} tekst="UKRAINA" stor farge="#854d0e" />}
            {beat >= 1 && (
                <>
                    <Etikett pos={p([36.4, 48.3])} tekst="Mange snakker russisk" farge="#9a3412" />
                    <Etikett
                        pos={p([36.4, 48.3])}
                        tekst="vil ha tettere samarbeid med Russland"
                        farge="#9a3412"
                        liten
                        dy={44}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Etikett pos={p([25.4, 49.2])} tekst="Oftest ukrainsk" farge="#1e3a8a" />
                    <Etikett
                        pos={p([25.4, 49.2])}
                        tekst="ser mot EU og NATO"
                        farge="#1e3a8a"
                        liten
                        dy={44}
                    />
                </>
            )}
            {beat >= 3 && <Etikett pos={p([39.6, 51.0])} tekst="Russland" stor farge="#7f1d1d" />}
            <Etikett
                pos={p([25, 45])}
                tekst="Omtrentlig, ingen skarpe grenser"
                liten
                farge="#475569"
            />
        </g>
    );
}

function KrimLag({ beat, p, d }: { beat: number; p: P; d: (g: object) => string }) {
    return (
        <g>
            {beat === 0 && (
                <path d={d(KRIM)} fill="none" stroke="#dc2626" strokeWidth={6}>
                    <animate
                        attributeName="stroke-opacity"
                        values="0.2;1;0.2"
                        dur="1.4s"
                        repeatCount="indefinite"
                    />
                </path>
            )}
            <Vis vis={beat >= 3}>
                <g clipPath="url(#ukr-klipp)">
                    <path d={d(DONBAS)} fill="url(#ukr-skravur)" />
                </g>
                <Etikett pos={p([37.6, 48.1])} tekst="Donetsk" />
                <Etikett pos={p([39.3, 49.2])} tekst="Luhansk" />
            </Vis>
            <Etikett
                pos={p([34.2, 45.1])}
                tekst="Krim"
                stor
                farge={beat >= 1 ? '#7f1d1d' : '#0f172a'}
            />
            {beat >= 1 && (
                <Etikett
                    pos={p([34.2, 45.1])}
                    tekst="annektert av Russland"
                    liten
                    farge="#7f1d1d"
                    dy={50}
                />
            )}
            <Etikett pos={p([31, 49.6])} tekst="Ukraina" stor farge="#854d0e" />
            <circle cx={p(BY.kyiv)[0]} cy={p(BY.kyiv)[1]} r={9} fill="#0f172a" />
            <Etikett pos={p(BY.kyiv)} tekst="Kyiv" liten dy={-34} />
            <Etikett pos={p([39.6, 50.9])} tekst="Russland" farge="#7f1d1d" />
            {beat === 2 && <Forbudt pos={[300, 700]} />}
            {beat === 3 && (
                <Etikett
                    pos={p([38.4, 47.3])}
                    tekst="Væpnede grupper, støttet av Russland"
                    liten
                    farge="#7f1d1d"
                    dy={40}
                />
            )}
            {beat >= 3 && (
                <Etikett pos={[1480, 870]} tekst="Omtrentlig" liten farge="#475569" anker="end" />
            )}
        </g>
    );
}

function Front({ beat, p, d }: { beat: number; p: P; d: (g: object) => string }) {
    const kyiv = p(BY.kyiv);
    return (
        <g>
            <Vis vis={beat === 4}>
                <g clipPath="url(#ukr-klipp)">
                    <path d={d(FIRE_REGIONER)} fill="#dc2626" opacity={0.18} />
                </g>
                <path
                    d={d(FIRE_REGIONER)}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={4}
                    strokeDasharray="14 10"
                    clipPath="url(#ukr-klipp)"
                />
                <Etikett
                    pos={p([36.4, 46.9])}
                    tekst="fire regioner, men ingen helt under russisk kontroll"
                    liten
                    farge="#7f1d1d"
                />
            </Vis>
            <Vis vis={beat >= 5}>
                <g clipPath="url(#ukr-klipp)">
                    <path d={d(HOLDT)} fill="#dc2626" opacity={0.7} />
                </g>
                <Etikett
                    pos={p([36.2, 46.6])}
                    tekst="Russisk kontroll siden 2023:"
                    farge="#7f1d1d"
                />
                <Etikett
                    pos={p([36.2, 46.6])}
                    dy={46}
                    tekst="litt under 20 prosent"
                    farge="#7f1d1d"
                />
            </Vis>
            <Vis vis={beat === 3}>
                <g clipPath="url(#ukr-klipp)">
                    <path
                        d={d(KHARKIV_OMRADE)}
                        fill="#16a34a"
                        opacity={0.75}
                        filter="url(#ukr-sky)"
                    />
                    <path
                        d={d(KHERSON_OMRADE)}
                        fill="#16a34a"
                        opacity={0.75}
                        filter="url(#ukr-sky)"
                    />
                </g>
                <Etikett pos={p(BY.kharkiv)} tekst="Kharkiv" dy={-40} farge="#14532d" />
                <Etikett pos={p(BY.kherson)} tekst="Kherson" dy={44} farge="#14532d" />
            </Vis>

            {beat === 0 && <Pil fra={p([30.0, 52.6])} til={p([30.45, 50.85])} />}
            {beat === 1 && <Pil fra={p([30.45, 50.95])} til={p([30.0, 52.7])} gra />}
            <circle cx={kyiv[0]} cy={kyiv[1]} r={beat <= 1 ? 14 : 9} fill="#0f172a" />
            {beat <= 1 && <Stjerne x={kyiv[0]} y={kyiv[1]} />}
            <Etikett
                pos={kyiv}
                tekst="Kyiv"
                dy={beat <= 1 ? 52 : -34}
                stor={beat <= 1}
                liten={beat > 1}
            />

            {beat === 2 && (
                <g>
                    <circle
                        cx={p(BY.mariupol)[0]}
                        cy={p(BY.mariupol)[1]}
                        r={46}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={8}
                        strokeDasharray="12 9"
                    />
                    <circle cx={p(BY.mariupol)[0]} cy={p(BY.mariupol)[1]} r={10} fill="#7f1d1d" />
                    <Etikett pos={p(BY.mariupol)} tekst="Mariupol" dy={84} farge="#7f1d1d" />
                </g>
            )}
            {beat !== 4 && beat < 5 && (
                <Etikett pos={p([31.4, 48.6])} tekst="Ukraina" stor farge="#854d0e" />
            )}
            {beat >= 4 && (
                <Etikett pos={[1480, 870]} tekst="Omtrentlig" liten farge="#475569" anker="end" />
            )}
        </g>
    );
}

function Vis({ vis, children }: { vis: boolean; children: ReactNode }) {
    if (!vis) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
            {children}
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    forsinkelse = 0.2,
    gra,
}: {
    fra: [number, number];
    til: [number, number];
    forsinkelse?: number;
    gra?: boolean;
}) {
    return (
        <motion.path
            d={`M ${fra[0].toFixed(1)} ${fra[1].toFixed(1)} L ${til[0].toFixed(1)} ${til[1].toFixed(1)}`}
            fill="none"
            stroke={gra ? '#64748b' : '#dc2626'}
            strokeWidth={16}
            strokeLinecap="round"
            markerEnd={gra ? 'url(#ukr-pil-gra)' : 'url(#ukr-pil)'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, delay: forsinkelse, ease: 'easeInOut' }}
        />
    );
}

function Stjerne({ x, y }: { x: number; y: number }) {
    const pkt = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 30 : 12;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');
    return <polygon points={pkt} fill="#facc15" stroke="#0f172a" strokeWidth={3} />;
}

function Forbudt({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <rect
                x={x - 230}
                y={y - 70}
                width={560}
                height={140}
                rx={22}
                fill="#ffffff"
                stroke="#b91c1c"
                strokeWidth={5}
            />
            <g stroke="#dc2626" strokeWidth={12} strokeLinecap="round">
                <line x1={x - 190} y1={y - 30} x2={x - 130} y2={y + 30} />
                <line x1={x - 130} y1={y - 30} x2={x - 190} y2={y + 30} />
            </g>
            <text x={x - 100} y={y - 8} fontSize={36} fontWeight={800} fill="#0f172a">
                Forbudt etter
            </text>
            <text x={x - 100} y={y + 38} fontSize={36} fontWeight={800} fill="#0f172a">
                internasjonale regler
            </text>
        </motion.g>
    );
}

const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
        kant,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        kant: string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={kant}
                        strokeWidth={1}
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) =>
        a.nokkel === b.nokkel &&
        a.geographies === b.geographies &&
        a.sti === b.sti &&
        a.kant === b.kant
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    liten,
    dy = 0,
    natt,
    anker = 'middle',
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    liten?: boolean;
    dy?: number;
    natt?: boolean;
    anker?: 'middle' | 'end';
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={stor ? 56 : liten ? 36 : 42}
            fontWeight={900}
            fill={natt && farge === '#0f172a' ? '#f8fafc' : farge}
            stroke={natt ? '#0b1220' : '#ffffff'}
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}
