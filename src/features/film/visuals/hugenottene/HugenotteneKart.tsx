import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over Frankrike og nabolandene: reformasjonen som kommer fra Tyskland, Paris i 1572,
 * byene der drapene spredte seg, og flukten ut av landet etter 1685.
 * Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'hvem' | 'hoffet' | 'natten' | 'flukt' | 'gave';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const PROTESTANT = '#0f766e';
const KATOLSK = '#7e22ce';
const ROD = '#b91c1c';
const LAND = '#f5efe0';

const FRANKRIKE = '250';
const TYSKLAND = '276';
const STORBRITANNIA = '826';
const NEDERLAND = '528';
const SVEITS = '756';

const PARIS: LngLat = [2.35, 48.86];
const LYON: LngLat = [4.84, 45.76];
const BOURGES: LngLat = [2.4, 47.08];
const ROUEN: LngLat = [1.1, 49.44];
const LONDON: LngLat = [-0.13, 51.51];
const AMSTERDAM: LngLat = [4.9, 52.37];
const GENEVE: LngLat = [6.14, 46.2];
const BERLIN: LngLat = [13.4, 52.52];

/** Handelsbyer der hugenottene sto sterkt (bare som prikker, uten navn). */
const BYER: LngLat[] = [
    PARIS,
    LYON,
    ROUEN,
    [-1.15, 46.16],
    [4.36, 43.84],
    [3.88, 43.61],
    [-0.58, 44.84],
    [1.9, 47.9],
    [1.44, 43.6],
    [-0.37, 49.18],
    [0.34, 46.58],
    [4.83, 44.93],
    [2.0, 44.35],
];

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    hvem: [
        [{ tekst: 'Reformasjonen' }, { tekst: 'Fra Tyskland til Frankrike', farge: PROTESTANT }],
        [{ tekst: 'Jean Calvin' }, { tekst: 'Franskmann og reformator', farge: PROTESTANT }],
        [{ tekst: 'Hugenotter' }, { tekst: 'trolig: forbundsfeller', farge: PROTESTANT }],
        [
            { tekst: 'Aldri flertallet' },
            { tekst: 'Handelsfolk og håndverkere i byene', farge: PROTESTANT },
            { tekst: 'Noen adelsfolk', farge: PROTESTANT },
        ],
        [
            { tekst: 'Penger', farge: PROTESTANT },
            { tekst: 'Kunnskap', farge: PROTESTANT },
            { tekst: 'Våpen', farge: ROD },
        ],
    ],
    hoffet: [
        [{ tekst: 'Fra 1562' }, { tekst: 'Religionskriger', farge: ROD }],
        [{ tekst: 'Katarina av Medici' }, { tekst: 'Kongens mor', farge: KATOLSK }],
        [
            { tekst: 'Gaspard de Coligny' },
            { tekst: 'Hugenottleder', farge: PROTESTANT },
            { tekst: 'Nær kong Karl 9.', farge: KATOLSK },
        ],
        [{ tekst: 'Første forsøk' }, { tekst: 'Coligny blir bare lettere såret', farge: ROD }],
        [{ tekst: '«De planlegger opprør»' }, { tekst: 'Kongen gir ordre', farge: ROD }],
    ],
    natten: [
        [{ tekst: '24. august 1572' }, { tekst: 'Bartolomeusdagen', farge: ROD }],
        [],
        [{ tekst: 'Drapene sprer seg' }, { tekst: 'Lyon, Bourges, Rouen', farge: ROD }],
        [],
        [{ tekst: 'Bartolomeusnatten' }, { tekst: 'eller blodbryllupet i Paris', farge: ROD }],
    ],
    flukt: [
        [{ tekst: 'Flukt i det skjulte' }, { tekst: 'Smuglere viser veien', farge: PROTESTANT }],
        [],
        [{ tekst: 'Fra nord og vest' }, { tekst: 'England og Nederland', farge: PROTESTANT }],
        [{ tekst: 'Fra sør' }, { tekst: 'Genève i Sveits', farge: PROTESTANT }],
        [{ tekst: 'Videre' }, { tekst: 'Brandenburg i Tyskland', farge: PROTESTANT }],
        [
            { tekst: 'Enda lenger' },
            { tekst: 'Nord-Amerika', farge: PROTESTANT },
            { tekst: 'Sverige', farge: PROTESTANT },
            { tekst: 'Sør-Afrika', farge: PROTESTANT },
        ],
    ],
    gave: [
        [{ tekst: 'En gave' }, { tekst: 'Håndverkere, særlig tekstil', farge: PROTESTANT }],
        [
            { tekst: 'Leger, lærere, soldater', farge: PROTESTANT },
            { tekst: 'Bygger opp Tyskland etter trettiårskrigen', farge: PROTESTANT },
        ],
        [{ tekst: 'Frankrike taper' }, { tekst: 'Henter møbelsnekkere fra Tyskland', farge: ROD }],
    ],
};

interface Rute {
    fra: LngLat;
    til: LngLat;
    fraBeat: number;
    /** Ruta vises til og med denne beaten. */
    tilBeat?: number;
    tekst?: string;
    /** Hvor navnet står i forhold til pilspissen. */
    side?: 'over' | 'under' | 'hoyre';
    farge: string;
    bue?: number;
}

/** Ruter per modus. Ruter som går ut av kartet ender ved kanten med navnet der. */
const RUTER: Record<Modus, Rute[]> = {
    hvem: [
        {
            fra: [11.5, 51.2],
            til: [3.2, 47.6],
            fraBeat: 0,
            tilBeat: 2,
            farge: PROTESTANT,
            bue: -60,
        },
    ],
    hoffet: [],
    natten: [
        { fra: PARIS, til: LYON, fraBeat: 2, farge: ROD, bue: 40 },
        { fra: PARIS, til: BOURGES, fraBeat: 2, farge: ROD, bue: -20 },
        { fra: PARIS, til: ROUEN, fraBeat: 2, farge: ROD, bue: -20 },
    ],
    flukt: [
        {
            fra: [0.2, 47.5],
            til: LONDON,
            fraBeat: 2,
            tekst: 'England',
            farge: PROTESTANT,
            bue: -60,
        },
        {
            fra: [2.6, 49.6],
            til: AMSTERDAM,
            fraBeat: 2,
            tekst: 'Nederland',
            farge: PROTESTANT,
            bue: 50,
        },
        { fra: [3.9, 44.0], til: GENEVE, fraBeat: 3, tekst: 'Genève', farge: PROTESTANT, bue: 50 },
        { fra: GENEVE, til: BERLIN, fraBeat: 4, tekst: 'Brandenburg', farge: PROTESTANT, bue: -80 },
        {
            fra: [-1.2, 46.2],
            til: [-8.6, 45.2],
            fraBeat: 5,
            tekst: 'Nord-Amerika',
            farge: PROTESTANT,
            bue: -30,
        },
        {
            fra: AMSTERDAM,
            til: [13.2, 55.2],
            fraBeat: 5,
            tekst: 'Sverige',
            side: 'over',
            farge: PROTESTANT,
            bue: -40,
        },
        {
            fra: [3.9, 43.6],
            til: [4.4, 42.3],
            fraBeat: 5,
            tekst: 'Sør-Afrika',
            side: 'hoyre',
            farge: PROTESTANT,
            bue: 20,
        },
    ],
    gave: [{ fra: BERLIN, til: PARIS, fraBeat: 2, tekst: 'Møbelsnekkere', farge: ROD, bue: 70 }],
};

function landfarge(modus: Modus, beat: number, id: string): string {
    if (modus === 'hvem') {
        if (id === TYSKLAND && beat === 0) return '#99f6e4';
        if (id === FRANKRIKE) return beat >= 1 ? '#e9d5ff' : LAND;
    }
    if (modus === 'hoffet' || modus === 'natten') {
        if (id === FRANKRIKE) return '#ede4f7';
    }
    if (modus === 'flukt') {
        if (id === FRANKRIKE) return '#ede4f7';
        if ((id === STORBRITANNIA || id === NEDERLAND) && beat >= 2) return '#99f6e4';
        if (id === SVEITS && beat >= 3) return '#99f6e4';
        if (id === TYSKLAND && beat >= 4) return '#99f6e4';
    }
    if (modus === 'gave') {
        if (id === TYSKLAND || id === STORBRITANNIA || id === NEDERLAND || id === SVEITS)
            return '#99f6e4';
        if (id === FRANKRIKE) return beat >= 2 ? '#fecaca' : '#ede4f7';
    }
    return LAND;
}

export function HugenotteneKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'hvem';
    const { geographies } = useAtlasWorld();
    const nærme = modus === 'hoffet' || modus === 'natten';

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [1000, 860],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: nærme
                        ? [
                              [-4.8, 42.3],
                              [8.2, 51.2],
                          ]
                        : [
                              [-9, 41.2],
                              [16.5, 57.2],
                          ],
                } as never
            ),
        [nærme]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const ruter = RUTER[modus].filter((r) => beat >= r.fraBeat && beat <= (r.tilBeat ?? Infinity));
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    const visByer = modus === 'hvem' && beat >= 3;
    const parisRod = modus === 'natten' || (modus === 'hoffet' && beat >= 4);
    const andreByer = modus === 'natten' && beat >= 2;

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />

                {modus === 'hvem' && beat <= 2 && (
                    <>
                        <Navn pos={p([10.4, 51.6])} tekst="TYSKLAND" />
                        <Navn pos={p([2.4, 46.6])} tekst="FRANKRIKE" />
                    </>
                )}
                {modus === 'flukt' && beat <= 1 && <Navn pos={p([2.4, 46.6])} tekst="FRANKRIKE" />}

                {visByer &&
                    BYER.map((ll, i) => {
                        const [x, y] = p(ll);
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={12}
                                fill={PROTESTANT}
                                stroke="#ffffff"
                                strokeWidth={3}
                                initial={{ opacity: 0, scale: 0.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.12 }}
                                style={{ transformOrigin: `${x}px ${y}px` }}
                            />
                        );
                    })}

                {/* Flyktninger som prikker langs grensa (flukten i det skjulte) */}
                {modus === 'flukt' && beat <= 1 && <Flyktninger p={p} />}

                {ruter.map((r, i) => (
                    <RuteTegning key={`${modus}-${i}`} r={r} fra={p(r.fra)} til={p(r.til)} />
                ))}

                {(modus === 'hoffet' || modus === 'natten') && (
                    <By
                        pos={p(PARIS)}
                        tekst="Paris"
                        farge={parisRod ? ROD : '#0f172a'}
                        puls={parisRod}
                    />
                )}
                {modus === 'hoffet' && beat >= 1 && <Hoffet beat={beat} />}
                {andreByer &&
                    [
                        { ll: LYON, tekst: 'Lyon' },
                        { ll: BOURGES, tekst: 'Bourges' },
                        { ll: ROUEN, tekst: 'Rouen' },
                    ].map((b) => (
                        <By key={b.tekst} pos={p(b.ll)} tekst={b.tekst} farge={ROD} puls={false} />
                    ))}
                {modus === 'gave' && (
                    <By pos={p(PARIS)} tekst="Paris" farge={KATOLSK} puls={false} />
                )}
            </svg>

            <div className="absolute right-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${modus}-${beat}-${k.tekst}`}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                                delay: i * 0.45,
                                type: 'spring',
                                stiffness: 160,
                                damping: 20,
                            }}
                            className={
                                i === 0 && !k.farge
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-2xl md:text-3xl shadow-xl'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-xl md:text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : undefined}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                    {modus === 'natten' && beat === 1 && (
                        <motion.div key="paris" className="flex flex-col items-start gap-3">
                            <Teller
                                verdi={3000}
                                etikett="drept i Paris"
                                prefiks="ca. "
                                tone="rod"
                            />
                        </motion.div>
                    )}
                    {modus === 'natten' && beat === 3 && (
                        <motion.div key="landet" className="flex flex-col items-start gap-3">
                            <Teller
                                verdi={7000}
                                etikett="drept i hele landet"
                                prefiks="ca. "
                                tone="rod"
                            />
                            <div className="px-4 py-2 rounded-xl bg-white/95 text-slate-700 font-bold text-xl md:text-2xl">
                                Flere tusen tvunget til å bli katolikker
                            </div>
                        </motion.div>
                    )}
                    {modus === 'flukt' && beat === 1 && (
                        <motion.div key="flukt" className="flex flex-col items-start gap-3">
                            <Teller
                                verdi={200000}
                                etikett="flyktet"
                                prefiks="opptil "
                                tone="gronn"
                            />
                            <div className="px-4 py-2 rounded-xl bg-white/95 text-slate-700 font-bold text-xl md:text-2xl">
                                1685-1715
                            </div>
                        </motion.div>
                    )}
                    {modus === 'flukt' && beat === 3 && (
                        <motion.div key="geneve" className="flex flex-col items-start gap-3">
                            <Teller
                                verdi={350}
                                etikett="til Genève hver dag i 1687"
                                prefiks="opptil "
                                tone="gronn"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    modus,
    beat,
}: {
    geographies: unknown[];
    sti: GeoPath;
    modus: Modus;
    beat: number;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: unknown }).id ?? '');
                return (
                    <motion.path
                        key={i}
                        d={sti(g as never) ?? ''}
                        initial={false}
                        animate={{ fill: landfarge(modus, beat, id) }}
                        transition={{ duration: 1 }}
                        stroke="#b9ad92"
                        strokeWidth={1.5}
                    />
                );
            })}
        </>
    );
});

function Navn({ pos, tekst }: { pos: [number, number]; tekst: string }) {
    return (
        <text
            x={pos[0]}
            y={pos[1]}
            textAnchor="middle"
            fontSize={36}
            fontWeight={900}
            letterSpacing={6}
            fill="#57534e"
            opacity={0.8}
        >
            {tekst}
        </text>
    );
}

function By({
    pos,
    tekst,
    farge,
    puls,
}: {
    pos: [number, number];
    tekst: string;
    farge: string;
    puls: boolean;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            {puls && (
                <motion.circle
                    cx={pos[0]}
                    cy={pos[1]}
                    r={20}
                    fill="none"
                    stroke={farge}
                    strokeWidth={5}
                    animate={{ r: [20, 60], opacity: [0.9, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
            <circle cx={pos[0]} cy={pos[1]} r={15} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={pos[0]}
                y={pos[1] - 30}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Flyktninger({ p }: { p: (ll: LngLat) => [number, number] }) {
    // Små grupper som beveger seg fra midten av landet mot grensene.
    const grupper: { fra: LngLat; til: LngLat }[] = [
        { fra: [0.5, 46.5], til: [-1.5, 48.6] },
        { fra: [2.2, 47.2], til: [3.4, 50.3] },
        { fra: [3.4, 44.6], til: [6.0, 46.0] },
        { fra: [1.0, 45.0], til: [5.6, 45.4] },
        { fra: [2.9, 48.2], til: [6.4, 48.8] },
    ];
    return (
        <>
            {grupper.map((g, i) => {
                const [x1, y1] = p(g.fra);
                const [x2, y2] = p(g.til);
                return (
                    <motion.circle
                        key={i}
                        r={10}
                        fill={PROTESTANT}
                        stroke="#ffffff"
                        strokeWidth={3}
                        initial={{ cx: x1, cy: y1, opacity: 0 }}
                        animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 0.6 }}
                    />
                );
            })}
        </>
    );
}

function RuteTegning({ r, fra, til }: { r: Rute; fra: [number, number]; til: [number, number] }) {
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const len = Math.hypot(dx, dy) || 1;
    const bue = r.bue ?? 50;
    const midt: [number, number] = [
        (fra[0] + til[0]) / 2 + (-dy / len) * bue,
        (fra[1] + til[1]) / 2 + (dx / len) * bue,
    ];
    const d = `M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`;
    // Retning ved slutten av kurven, til pilspissen.
    const vx = til[0] - midt[0];
    const vy = til[1] - midt[1];
    const vinkel = (Math.atan2(vy, vx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={r.farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                <polygon
                    points="0,-14 24,0 0,14"
                    fill={r.farge}
                    transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                />
                {r.tekst && (
                    <text
                        x={r.side === 'hoyre' ? til[0] + 30 : til[0]}
                        y={
                            r.side === 'hoyre'
                                ? til[1] + 10
                                : r.side === 'over'
                                  ? til[1] - 26
                                  : til[1] + (vy > 0 ? 50 : -26)
                        }
                        textAnchor={r.side === 'hoyre' ? 'start' : 'middle'}
                        fontSize={32}
                        fontWeight={900}
                        fill={r.farge}
                        stroke="#ffffff"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        {r.tekst}
                    </text>
                )}
            </motion.g>
        </g>
    );
}

/** Hoffet i Paris: Katarina, kongen og Coligny, og hvem som drar i hvem. */
function Hoffet({ beat }: { beat: number }) {
    const KONGEN: [number, number] = [470, 600];
    const KATARINA: [number, number] = [220, 600];
    const COLIGNY: [number, number] = [720, 600];
    const figur = (
        pos: [number, number],
        farge: string,
        navn: string,
        krone: boolean,
        saaret = false
    ) => (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={64} fill={farge} stroke="#ffffff" strokeWidth={6} />
            <circle cx={pos[0]} cy={pos[1] - 16} r={22} fill="#f5e1c8" />
            <path
                d={`M ${pos[0] - 36} ${pos[1] + 40} Q ${pos[0]} ${pos[1] + 2} ${pos[0] + 36} ${pos[1] + 40} Z`}
                fill="#f5e1c8"
            />
            {krone && (
                <path
                    d={`M ${pos[0] - 26} ${pos[1] - 64} L ${pos[0] - 26} ${pos[1] - 92} L ${pos[0] - 13} ${pos[1] - 78} L ${pos[0]} ${pos[1] - 98} L ${pos[0] + 13} ${pos[1] - 78} L ${pos[0] + 26} ${pos[1] - 92} L ${pos[0] + 26} ${pos[1] - 64} Z`}
                    fill="#d4a017"
                    stroke="#7a5a00"
                    strokeWidth={3}
                />
            )}
            {saaret && (
                <motion.circle
                    cx={pos[0]}
                    cy={pos[1]}
                    r={74}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={8}
                    strokeDasharray="14 10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            <text
                x={pos[0]}
                y={pos[1] + 108}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
    return (
        <g>
            <rect x={80} y={430} width={780} height={340} rx={30} fill="#ffffff" opacity={0.85} />
            {/* Coligny har kongens øre: en tykk linje mellom dem */}
            {beat >= 2 && (
                <motion.line
                    x1={KONGEN[0] + 64}
                    y1={KONGEN[1]}
                    x2={COLIGNY[0] - 64}
                    y2={COLIGNY[1]}
                    stroke={PROTESTANT}
                    strokeWidth={beat >= 4 ? 3 : 14}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
            {beat >= 4 && (
                <motion.path
                    d={`M ${KATARINA[0] + 64} ${KATARINA[1] - 20} Q 345 520 ${KONGEN[0] - 70} ${KONGEN[1] - 20}`}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4 }}
                />
            )}
            {figur(KATARINA, KATOLSK, 'Katarina', false)}
            {beat >= 2 && figur(KONGEN, beat >= 4 ? ROD : KATOLSK, 'Karl 9.', true)}
            {beat >= 2 && figur(COLIGNY, PROTESTANT, 'Coligny', false, beat >= 3)}
        </g>
    );
}
