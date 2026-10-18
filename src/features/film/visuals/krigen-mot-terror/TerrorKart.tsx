import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart til 11. september og krigen mot terror. Ingen fly i lufta og ingen vold: stedene
 * vises som punkter, og de døde som hvite minnepunkter.
 * «usa»: de fire stedene 11. september. «sovjet»: Afghanistan-krigen der al-Qaida vokste fram.
 * «motiv»: soldatene i Saudi-Arabia, jihad og planleggingen. «irak»: invasjonen i 2003 og
 * påstandene som var feil. «kaos»: borgerkrigen og IS. «omdomme»: Abu Ghraib og Guantanamo.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'usa' | 'sovjet' | 'motiv' | 'irak' | 'kaos' | 'omdomme';

const USA = 840;
const AFGHANISTAN = 4;
const SAUDI = 682;
const IRAK = 368;
const SOVJET = [643, 804, 112, 233, 428, 440, 498, 268, 51, 31, 398, 860, 795, 762, 417];

const AFG_KANT: LngLat = [63.5, 35.8];

const STED = {
    newYork: [-74.0, 40.7] as LngLat,
    pentagon: [-77.06, 38.87] as LngLat,
    pennsylvania: [-78.9, 40.05] as LngLat,
    kabul: [69.2, 34.5] as LngLat,
    afghanistan: [66, 33.5] as LngLat,
    saudi: [45, 24] as LngLat,
    egypt: [31, 27] as LngLat,
    bagdad: [44.4, 33.3] as LngLat,
    guantanamo: [-75.1, 20] as LngLat,
    abuGhraib: [44.1, 33.3] as LngLat,
    usa: [-98, 39] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    usa: '#93c5fd',
    usaSterk: '#2563eb',
    afghanistan: '#f59e0b',
    taliban: '#57534e',
    sovjet: '#dc2626',
    saudi: '#16a34a',
    irak: '#ea580c',
    kaos: '#9a3412',
    graa: '#cbd5e1',
    medfolelse: '#4ade80',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, p: GeoProjection) =>
        p.fitExtent(
            [
                [60, 60],
                [B - 60, H - 60],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'usa') return utsnitt([-82.5, 37.2], [-70.5, 42.6], geoMercator());
    if (modus === 'sovjet' || modus === 'motiv')
        return utsnitt([20, 10], [84, 50], geoMercator());
    if (modus === 'irak' || modus === 'kaos') return utsnitt([8, 19], [74, 43], geoMercator());
    return utsnitt([-118, 8], [62, 58], geoNaturalEarth1());
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'usa':
            return id === USA ? '#f5f0e4' : FARGE.land;
        case 'sovjet':
            if (id === AFGHANISTAN) return FARGE.afghanistan;
            if (beat >= 1 && beat <= 3 && SOVJET.includes(id)) return FARGE.sovjet;
            if (beat === 3 && id === SAUDI) return FARGE.saudi;
            return FARGE.land;
        case 'motiv':
            if (id === SAUDI && beat <= 1) return FARGE.saudi;
            if (id === AFGHANISTAN) return beat >= 2 ? FARGE.taliban : FARGE.afghanistan;
            return FARGE.land;
        case 'irak':
            if (id === IRAK) return FARGE.irak;
            if (beat >= 4 && id === AFGHANISTAN) return FARGE.afghanistan;
            return FARGE.land;
        case 'kaos':
            if (id === IRAK) return beat >= 2 ? FARGE.kaos : FARGE.irak;
            return FARGE.land;
        case 'omdomme':
            if (id === USA) return beat >= 4 ? FARGE.graa : FARGE.usa;
            if (beat >= 1 && id === IRAK) return FARGE.irak;
            return FARGE.land;
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    usa: [
        { tekst: 'New York, 11. september 2001' },
        { tekst: 'World Trade Center' },
        { tekst: '19 menn kaprer fire fly' },
        { tekst: 'Tre steder, fire fly' },
        { tekst: 'Nesten 3000 døde', rod: true },
    ],
    sovjet: [
        { tekst: 'Al-Qaida: ledet av Osama bin Laden' },
        { tekst: '1979: Sovjet invaderer Afghanistan', rod: true },
        { tekst: 'Krigere strømmer til' },
        { tekst: 'Penger og våpen fra USA og Saudi-Arabia' },
        { tekst: '1989: Sovjet trekker seg ut' },
    ],
    motiv: [
        { tekst: 'Gulfkrigen, 1990' },
        { tekst: 'Jihad = hellig krig', rod: true },
        { tekst: 'Planlagt i hemmelighet i flere år' },
        { tekst: 'Øvde i flysimulatorer' },
    ],
    irak: [
        { tekst: 'Irak, mars 2003' },
        { tekst: 'Påstand 1' },
        { tekst: 'Påstand 2' },
        { tekst: 'Begge var feil', rod: true },
        { tekst: 'Saddam: fiende av al-Qaida' },
    ],
    kaos: [
        { tekst: 'Saddam Hussein styrtes' },
        { tekst: 'Gammelt hat bryter ut' },
        { tekst: 'Ingen plan for etterpå: borgerkrig', rod: true },
        { tekst: 'IS vokser fram', rod: true },
    ],
    omdomme: [
        { tekst: 'Hele verdens medfølelse' },
        { tekst: 'Abu Ghraib: fanger mishandlet', rod: true },
        { tekst: 'Guantanamo: fanget uten rettssak', rod: true },
        { tekst: 'Mange hadde ikke gjort noe galt' },
        { tekst: 'Medfølelsen forsvinner', rod: true },
    ],
};

export function TerrorKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'usa';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'usa' && <Usa beat={beat} p={p} />}
                {modus === 'sovjet' && <Sovjet beat={beat} p={p} />}
                {modus === 'motiv' && <Motiv beat={beat} p={p} />}
                {modus === 'irak' && <Irak beat={beat} p={p} />}
                {modus === 'kaos' && <Kaos beat={beat} p={p} />}
                {modus === 'omdomme' && <Omdomme beat={beat} p={p} />}
            </svg>

            {modus === 'usa' && beat === 2 && <FireFly />}
            {modus === 'usa' && beat === 4 && (
                <div className="absolute bottom-[10%] right-[8%]">
                    <Teller verdi={3000} etikett="mennesker mistet livet" forsinkelse={0.6} tone="rod" />
                </div>
            )}
            {modus === 'irak' && beat >= 1 && <Pastander beat={beat} />}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Usa({ beat, p }: { beat: number; p: P }) {
    const steder: { pos: LngLat; navn: string; dx: number; dy: number }[] = [
        { pos: STED.newYork, navn: 'World Trade Center: to fly', dx: 40, dy: 90 },
        { pos: STED.pentagon, navn: 'Pentagon', dx: 0, dy: 80 },
        { pos: STED.pennsylvania, navn: 'Åker i Pennsylvania', dx: -40, dy: -80 },
    ];
    return (
        <>
            {beat <= 1 && <Etikett pos={p(STED.newYork)} tekst="New York" dy={-80} dx={beat === 1 ? 90 : 0} stor />}
            {beat >= 2 && (
                <>
                    <Etikett pos={p([-81, 41.3])} tekst="USA" farge="#475569" stor />
                    <Etikett pos={p([-77.3, 38.0])} tekst="Washington" farge="#475569" dy={60} />
                </>
            )}
            {steder.map((s, i) => {
                const vis = i === 0 || beat >= 2;
                if (!vis) return null;
                return (
                    <g key={s.navn}>
                        <Minnepunkt pos={p(s.pos)} minne={beat >= 4} forsinkelse={beat === 2 ? i * 0.5 : 0} />
                        {beat >= 3 && (
                            <Etikett
                                pos={p(s.pos)}
                                tekst={s.navn}
                                dy={s.dy}
                                dx={s.dx}
                                forsinkelse={i * 0.6}
                            />
                        )}
                    </g>
                );
            })}
            {beat === 0 && <Puls pos={p(STED.newYork)} farge="#b91c1c" />}
            {beat === 1 && <Taarn pos={p(STED.newYork)} />}
        </>
    );
}

function Sovjet({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            <Etikett pos={p(STED.afghanistan)} tekst="Afghanistan" farge="#78350f" dy={70} />
            {beat === 0 && <Puls pos={p(STED.afghanistan)} farge={FARGE.afghanistan} />}
            {beat >= 1 && beat <= 3 && (
                <Etikett pos={p([60, 41.5])} tekst="Sovjetunionen" farge="#7f1d1d" stor />
            )}
            {beat === 1 && <Pil fra={p([66, 42])} til={p(STED.kabul)} farge={FARGE.sovjet} bue={0.1} />}
            {beat === 2 && (
                <>
                    <Pil fra={p(STED.egypt)} til={p(AFG_KANT)} farge="#15803d" bue={-0.15} />
                    <Pil fra={p([48, 27])} til={p(AFG_KANT)} farge="#15803d" bue={0.12} forsinkelse={0.5} />
                    <Pil fra={p([36, 37])} til={p(AFG_KANT)} farge="#15803d" bue={-0.1} forsinkelse={1} />
                </>
            )}
            {beat === 3 && <Etikett pos={p(STED.saudi)} tekst="Saudi-Arabia" farge="#14532d" dy={70} />}
            {beat === 3 && (
                <>
                    <Pil fra={p([21, 33])} til={p(AFG_KANT)} farge={FARGE.usaSterk} bue={-0.12} />
                    <Etikett pos={p([21, 33])} tekst="USA" farge={FARGE.usaSterk} dx={70} dy={-50} />
                    <Pil fra={p([48, 27])} til={p(AFG_KANT)} farge="#15803d" bue={0.12} forsinkelse={0.6} />
                </>
            )}
            {beat === 4 && (
                <>
                    <Pil fra={p(STED.kabul)} til={p([66, 44])} farge="#7f1d1d" bue={-0.1} />
                    <Etikett pos={p([66, 44])} tekst="Sovjet ut" farge="#7f1d1d" dx={150} dy={10} />
                    <Pil fra={p(STED.afghanistan)} til={p([22, 40])} farge="#0f172a" bue={0.15} forsinkelse={1.6} />
                    <Etikett pos={p([24, 43])} tekst="Nytt mål: Vesten" farge="#0f172a" dx={160} forsinkelse={2.6} />
                </>
            )}
        </>
    );
}

function Motiv({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {beat <= 1 && <Etikett pos={p(STED.saudi)} tekst="Saudi-Arabia" farge="#14532d" dy={beat === 0 ? 130 : 70} />}
            <Etikett pos={p(STED.afghanistan)} tekst="Afghanistan" farge="#78350f" dy={70} />
            {beat === 0 && (
                <>
                    <Pil fra={p([21, 34])} til={p([44, 26])} farge={FARGE.usaSterk} bue={-0.15} />
                    <Soldater pos={p([45, 25.5])} />
                    <Etikett pos={p([21, 34])} tekst="USA" farge={FARGE.usaSterk} dx={70} dy={-50} />
                </>
            )}
            {beat === 1 && (
                <>
                    <Pil fra={p(STED.afghanistan)} til={p([21, 38])} farge="#b91c1c" bue={0.15} />
                    <Etikett pos={p([21, 38])} tekst="mot USA" farge="#b91c1c" dx={90} dy={-50} forsinkelse={1.4} />
                </>
            )}
            {beat >= 2 && (
                <Etikett pos={p(STED.afghanistan)} tekst="Taliban gir dem frirom" farge="#292524" dy={150} forsinkelse={0.4} />
            )}
            {beat >= 2 && <Puls pos={p(STED.afghanistan)} farge="#292524" />}
            {beat === 3 && <Simulator pos={p([56, 40])} />}
        </>
    );
}

function Irak({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            <Etikett pos={p(STED.bagdad)} tekst="Irak" farge="#7c2d12" stor dy={-20} />
            {beat === 0 && (
                <>
                    <Pil fra={p([27, 38])} til={p(STED.bagdad)} farge={FARGE.usaSterk} bue={-0.15} />
                    <Etikett pos={p([27, 38])} tekst="USA" farge={FARGE.usaSterk} dx={70} dy={-50} />
                </>
            )}
            {beat >= 4 && (
                <>
                    <Etikett pos={p(STED.afghanistan)} tekst="Afghanistan" farge="#78350f" dy={80} />
                    <Minnepunkt pos={p(STED.afghanistan)} rod />
                    <Etikett pos={p(STED.afghanistan)} tekst="al-Qaida" farge="#7f1d1d" dy={-50} />
                    <Brudd fra={p(STED.bagdad)} til={p(STED.afghanistan)} />
                </>
            )}
        </>
    );
}

/** Sprekker som går ut fra Bagdad, og IS som en mørk flekk som sprer seg. */
function Kaos({ beat, p }: { beat: number; p: P }) {
    const [bx, by] = p(STED.bagdad);
    const sprekker = [
        [
            [0, 0],
            [-60, -70],
            [-90, -160],
        ],
        [
            [0, 0],
            [80, -50],
            [120, -140],
        ],
        [
            [0, 0],
            [-40, 80],
            [-130, 130],
        ],
        [
            [0, 0],
            [90, 60],
            [140, 150],
        ],
    ];
    return (
        <>
            <Etikett pos={p([44, 30.5])} tekst="Irak" farge="#7c2d12" stor dy={40} />
            {beat === 0 && <Skilt pos={[bx, by]} />}
            {beat >= 1 &&
                sprekker.map((s, i) => (
                    <motion.path
                        key={i}
                        d={`M ${s.map(([x, y]) => `${bx + x} ${by + y}`).join(' L ')}`}
                        fill="none"
                        stroke="#1c1917"
                        strokeWidth={beat >= 2 ? 10 : 6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: i * 0.3 }}
                    />
                ))}
            {beat >= 3 && (
                <>
                    <motion.circle
                        cx={bx - 70}
                        cy={by - 90}
                        fill="#0c0a09"
                        initial={{ r: 0, opacity: 0.8 }}
                        animate={{ r: 150, opacity: 0.7 }}
                        transition={{ duration: 3, ease: 'easeOut' }}
                    />
                    <Etikett pos={[bx - 70, by - 90]} tekst="IS" farge="#ffffff" stor forsinkelse={1} mork />
                </>
            )}
        </>
    );
}

function Omdomme({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            <Etikett pos={p(STED.usa)} tekst="USA" farge="#1e3a8a" stor />
            {beat <= 3 && (
                <motion.circle
                    cx={p(STED.usa)[0]}
                    cy={p(STED.usa)[1]}
                    fill="none"
                    stroke={FARGE.medfolelse}
                    strokeWidth={10}
                    initial={{ r: 120, opacity: 0.9 }}
                    animate={{ r: 300, opacity: 0 }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
                />
            )}
            {beat === 0 && (
                <>
                    {[
                        [10, 50],
                        [-50, -10],
                        [100, 30],
                        [40, 0],
                    ].map(([lng, lat], i) => (
                        <Pil
                            key={i}
                            fra={p([lng, lat])}
                            til={p(STED.usa)}
                            farge="#16a34a"
                            bue={0.12}
                            forsinkelse={i * 0.4}
                        />
                    ))}
                </>
            )}
            {beat >= 1 && (
                <>
                    <Minnepunkt pos={p(STED.abuGhraib)} rod />
                    <Etikett pos={p(STED.abuGhraib)} tekst="Abu Ghraib" farge="#7c2d12" dy={-60} />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Minnepunkt pos={p(STED.guantanamo)} rod />
                    <Etikett pos={p(STED.guantanamo)} tekst="Guantanamo, Cuba" farge="#7f1d1d" dy={60} />
                </>
            )}
            {beat === 3 && <Etikett pos={p([-40, 25])} tekst="Uskyldige bak gitter" farge="#7f1d1d" />}
        </>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
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
    dx = 0,
    dy = 0,
    forsinkelse = 0,
    mork,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dx?: number;
    dy?: number;
    forsinkelse?: number;
    mork?: boolean;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
            x={pos[0] + dx}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 56 : 40}
            fontWeight={900}
            fill={farge}
            stroke={mork ? '#0c0a09' : '#ffffff'}
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

/** Et sted. Som minne blir det et hvitt punkt med en stille glød. */
function Minnepunkt({
    pos,
    minne,
    rod,
    forsinkelse = 0,
}: {
    pos: [number, number];
    minne?: boolean;
    rod?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 16 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            {minne && <circle cx={pos[0]} cy={pos[1]} r={46} fill="#ffffff" opacity={0.45} />}
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={minne ? 24 : 20}
                fill={minne ? '#ffffff' : rod ? '#b91c1c' : '#334155'}
                stroke={minne ? '#94a3b8' : '#ffffff'}
                strokeWidth={6}
                style={{ transition: 'fill 1s ease' }}
            />
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -22 -14 L 6 0 L -22 14 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.5 }}
            />
        </g>
    );
}

function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 40, opacity: 0.9 }}
            animate={{ r: 200, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}

/** Tre blå soldatmerker i Saudi-Arabia, med årstallet. */
function Soldater({ pos }: { pos: [number, number] }) {
    return (
        <g>
            {[-50, 0, 50].map((dx, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + i * 0.25, type: 'spring' }}
                >
                    <circle cx={pos[0] + dx} cy={pos[1] - 18} r={13} fill={FARGE.usaSterk} stroke="#fff" strokeWidth={4} />
                    <rect x={pos[0] + dx - 14} y={pos[1] - 4} width={28} height={36} rx={8} fill={FARGE.usaSterk} stroke="#fff" strokeWidth={4} />
                </motion.g>
            ))}
            <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                x={pos[0]}
                y={pos[1] + 80}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#1e3a8a"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Amerikanske soldater
            </motion.text>
        </g>
    );
}

/** En enkel flysimulator: skjerm med horisont og en spak. */
function Simulator({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect x={x - 130} y={y - 90} width={260} height={170} rx={18} fill="#1e293b" stroke="#fff" strokeWidth={6} />
            <rect x={x - 110} y={y - 72} width={220} height={65} fill="#7dd3fc" />
            <rect x={x - 110} y={y - 7} width={220} height={65} fill="#a16207" />
            <line x1={x - 110} y1={y - 7} x2={x + 110} y2={y - 7} stroke="#fff" strokeWidth={4} />
            <path d={`M ${x - 40} ${y - 7} L ${x} ${y - 22} L ${x + 40} ${y - 7}`} fill="none" stroke="#facc15" strokeWidth={6} />
            <rect x={x - 8} y={y + 80} width={16} height={50} fill="#334155" />
            <circle cx={x} cy={y + 80} r={16} fill="#dc2626" />
        </motion.g>
    );
}

/** En brutt linje mellom to steder: ingen kobling. */
function Brudd({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const mx = (fra[0] + til[0]) / 2;
    const my = Math.min(fra[1], til[1]) - 140;
    const kx = mx;
    const ky = (fra[1] + til[1]) / 2 - 70;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke="#7f1d1d"
                strokeWidth={6}
                strokeDasharray="18 16"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.3 }}
            />
            <motion.g
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: 'spring' }}
                style={{ transformOrigin: `${kx}px ${ky}px` }}
                stroke="#b91c1c"
                strokeWidth={14}
                strokeLinecap="round"
            >
                <line x1={kx - 36} y1={ky - 36} x2={kx + 36} y2={ky + 36} />
                <line x1={kx + 36} y1={ky - 36} x2={kx - 36} y2={ky + 36} />
            </motion.g>
        </g>
    );
}

/** Fire fly som ikoner under brikken: «fire fly», uten at noe flyr. */
function FireFly() {
    return (
        <div className="absolute top-[19%] left-1/2 -translate-x-1/2 flex gap-4">
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.3, type: 'spring' }}
                    className="w-16 h-16 rounded-2xl bg-white/95 shadow-lg flex items-center justify-center"
                >
                    <Plane className="w-9 h-9 text-slate-700" />
                </motion.div>
            ))}
        </div>
    );
}

/** De to påstandene som kort. På beat 3 får begge et rødt FEIL-stempel. */
function Pastander({ beat }: { beat: number }) {
    const kort = [
        { tittel: 'Masseødeleggelsesvåpen', tekst: 'våpen som kan drepe svært mange på en gang', fra: 1 },
        { tittel: 'Samarbeid med al-Qaida', tekst: 'Saddam og terrorgruppa på samme lag', fra: 2 },
    ];
    return (
        <div className="absolute left-[3%] top-[22%] flex flex-col gap-6 w-[36%]">
            {kort.map(
                (k) =>
                    beat >= k.fra && (
                        <motion.div
                            key={k.tittel}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                            className="relative rounded-2xl bg-white/95 shadow-xl px-5 py-4"
                        >
                            <div className="text-2xl font-black text-slate-900">{k.tittel}</div>
                            <div className="text-lg font-semibold text-slate-500 mt-1">{k.tekst}</div>
                            {beat >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
                                    animate={{ opacity: 1, scale: 1, rotate: -10 }}
                                    transition={{ delay: k.fra === 1 ? 0.6 : 1.3, type: 'spring', stiffness: 260, damping: 16 }}
                                    className="absolute right-3 -bottom-5 border-[5px] border-red-600 text-red-600 rounded-xl px-3 py-0.5 text-2xl font-black tracking-widest bg-white"
                                >
                                    FEIL
                                </motion.div>
                            )}
                        </motion.div>
                    )
            )}
        </div>
    );
}

/** Tvillingtårnene som to stille søyler ved New York. */
function Taarn({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
        >
            <rect x={x - 150} y={y - 190} width={34} height={170} fill="#475569" stroke="#fff" strokeWidth={4} />
            <rect x={x - 108} y={y - 184} width={34} height={164} fill="#475569" stroke="#fff" strokeWidth={4} />
            <text x={x - 112} y={y + 20} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                Tvillingtårnene
            </text>
        </motion.g>
    );
}

/** Et navneskilt for Saddam i Bagdad som faller og blekner: han er styrtet. */
function Skilt({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ rotate: 0, y: 0, opacity: 1 }}
            animate={{ rotate: 0, y: 160, opacity: 0 }}
            transition={{ delay: 2.4, duration: 1.4, ease: 'easeIn' }}
            style={{ transformOrigin: `${x}px ${y + 10}px` }}
        >
            <rect x={x - 6} y={y - 120} width={12} height={130} fill="#44403c" />
            <rect x={x - 170} y={y - 190} width={340} height={80} rx={14} fill="#ffffff" stroke="#7c2d12" strokeWidth={6} />
            <text x={x} y={y - 140} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight={900} fill="#7c2d12">
                Saddam Hussein
            </text>
        </motion.g>
    );
}
