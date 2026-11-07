import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Nord-Europa. «handel»: vikingene seiler til de kristne landene. «tryggvason»:
 * Olav Tryggvasons påbud, kirka på Moster og reisen langs kysten. «knut»: Knuts sølv til
 * norske stormenn, Olav jaget ut, og Stiklestad 1030.
 */

type Modus = 'handel' | 'tryggvason' | 'knut';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [-12, 47],
    [32, 72],
];

const ID = { norge: 578, danmark: 208 };
/** Kristne land som vikingene møtte. Tegnes bare som én gruppe, uten navn. */
const KRISTNE = new Set([826, 372, 250, 276, 56, 528]);

const MOSTER: LngLat = [5.37, 59.7];
const STIKLESTAD: LngLat = [11.56, 63.8];
const DANMARK: LngLat = [9.3, 56.1];
const ENGLAND: LngLat = [-1.6, 52.6];

const RUTE_VEST: LngLat[] = [
    [5.2, 60.3],
    [2.5, 59.2],
    [-0.5, 56.8],
    [-1.2, 54.9],
];
const RUTE_SOR: LngLat[] = [
    [10.4, 59.2],
    [8.6, 57.9],
    [7.2, 55.6],
    [5.6, 53.6],
];
const KYSTEN: LngLat[] = [
    [10.6, 59.4],
    [8.3, 58.0],
    [5.7, 58.8],
    [5.0, 59.7],
    [4.8, 61.0],
    [5.6, 62.3],
    [7.8, 63.2],
    [10.0, 63.9],
    [11.6, 65.2],
    [13.0, 66.6],
];
/** Misjon: kors som dukker opp langs kysten og innover i landet (illustrasjon, ikke et antall). */
const MISJON: LngLat[] = [
    [10.7, 59.6],
    [6.4, 58.6],
    [5.8, 61.2],
    [8.8, 61.6],
    [10.6, 63.0],
    [12.8, 65.8],
];
const STORMENN: LngLat[] = [
    [10.7, 59.9],
    [6.2, 60.9],
    [10.4, 63.4],
    [13.3, 66.2],
];

export function KristningenKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'handel';
    const { geographies } = useFilmVerden(UTSNITT);

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-8, 50],
                        [24, 70.5],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => {
        const xy = pts.map(p);
        let d = `M ${xy[0][0]} ${xy[0][1]}`;
        for (let i = 1; i < xy.length; i++) {
            const [x0, y0] = xy[i - 1];
            const [x1, y1] = xy[i];
            d += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
        }
        const siste = xy[xy.length - 1];
        return `${d} L ${siste[0]} ${siste[1]}`;
    };

    const fyll = (id: number) => {
        if (id === ID.norge) {
            if (modus === 'knut' && beat === 3) return '#d6d3d1';
            if (modus === 'tryggvason' && beat >= 5) return '#fca5a5';
            return '#fde7c7';
        }
        if (modus === 'handel' && beat >= 1 && KRISTNE.has(id)) return '#facc15';
        if (modus === 'knut' && id === ID.danmark) return '#fca5a5';
        return '#efeadf';
    };

    const kort = kortFor(modus, beat);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#bcd7ea' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} fyll={fyll} />

                {modus === 'handel' && (
                    <>
                        {[RUTE_VEST, RUTE_SOR].map((r, i) => (
                            <motion.path
                                key={i}
                                d={linje(r)}
                                fill="none"
                                stroke="#1e3a8a"
                                strokeWidth={6}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2.4, delay: 0.4 + i * 0.6 }}
                            />
                        ))}
                        {[RUTE_VEST, RUTE_SOR].map((r, i) => (
                            <Skip key={`s${i}`} punkt={p(r[r.length - 1])} />
                        ))}
                        <Etikett punkt={p([3.5, 50.2])} tekst="kristne land" farge="#854d0e" synlig={beat >= 1} />
                        <Etikett punkt={p([9.5, 61.6])} tekst="Norge" synlig />
                        {beat >= 2 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                style={{ transformOrigin: `${p([8, 60.2])[0]}px ${p([8, 60.2])[1]}px` }}
                            >
                                <Kors punkt={p([8, 60.2])} />
                            </motion.g>
                        )}
                    </>
                )}

                {modus === 'tryggvason' && (
                    <>
                        <Etikett punkt={p([13.2, 61.2])} tekst="Norge" synlig={beat === 0 || beat === 2} />
                        {beat === 0 && (
                            <motion.path
                                d={`M ${p([9.3, 63.6])[0] - 40} ${p([9.3, 63.6])[1]} l 0 -40 l 20 18 l 20 -30 l 20 30 l 20 -18 l 0 40 Z`}
                                fill="#facc15"
                                stroke="#92400e"
                                strokeWidth={4}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            />
                        )}
                        {beat === 1 &&
                            MISJON.map((m, i) => (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.4 + i * 0.45 }}
                                >
                                    <g transform={`translate(${p(m)[0]} ${p(m)[1]})`}>
                                        <path d="M 0 -18 v 36 M -12 -6 h 24" stroke="#92400e" strokeWidth={7} strokeLinecap="round" />
                                    </g>
                                </motion.g>
                            ))}
                        {beat === 2 && (
                            <g transform="translate(70 300)">
                                {['dåp', 'faste', 'begravelse'].map((t, i) => (
                                    <motion.g
                                        key={t}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 + i * 0.6 }}
                                    >
                                        <rect x={i * 190} y={0} width={170} height={150} rx={18} fill="#ffffff" stroke="#92400e" strokeWidth={4} />
                                        <Ikon type={i} x={i * 190 + 85} y={58} />
                                        <text x={i * 190 + 85} y={130} textAnchor="middle" fontSize={26} fontWeight={800} fill="#0f172a">
                                            {t}
                                        </text>
                                    </motion.g>
                                ))}
                            </g>
                        )}
                        {beat >= 3 && (
                            <g>
                                <Kirke punkt={p(MOSTER)} />
                                <Etikett punkt={[p(MOSTER)[0] - 30, p(MOSTER)[1] + 64]} tekst="Moster" anker="end" synlig />
                            </g>
                        )}
                        {beat >= 4 && (
                            <motion.path
                                d={linje(KYSTEN)}
                                fill="none"
                                stroke="#9a3412"
                                strokeWidth={7}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 4, ease: 'easeInOut' }}
                            />
                        )}
                        {beat >= 5 && (
                            <motion.rect
                                x={0}
                                y={0}
                                width={B}
                                height={H}
                                fill="none"
                                stroke="#b91c1c"
                                strokeWidth={18}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                                transition={{ duration: 1.5, delay: 2.5 }}
                            />
                        )}
                    </>
                )}

                {modus === 'knut' && (
                    <>
                        <Etikett punkt={p([13.2, 61.2])} tekst="Norge" synlig={beat === 0 || beat >= 4} />
                        <Etikett punkt={[p(DANMARK)[0] + 30, p(DANMARK)[1] + 70]} tekst="Knut den Mektige" farge="#991b1b" anker="start" synlig={beat <= 2} />
                        {beat <= 2 && (
                            <path
                                d={`M ${p(DANMARK)[0] - 26} ${p(DANMARK)[1] - 6} l 0 -26 l 13 12 l 13 -20 l 13 20 l 13 -12 l 0 26 Z`}
                                fill="#facc15"
                                stroke="#92400e"
                                strokeWidth={3}
                            />
                        )}
                        {beat >= 1 &&
                            beat <= 2 &&
                            STORMENN.map((m, i) => (
                                <Mynt key={i} fra={p(DANMARK)} til={p(m)} forsinkelse={i * 0.5} />
                            ))}
                        {beat >= 1 && beat <= 2 && (
                            <Etikett punkt={p([-3, 60.6])} tekst="engelske sølvmynter" farge="#475569" synlig />
                        )}
                        {beat === 2 && (
                            <>
                                <Skriftrull punkt={p([8.5, 62.2])} />
                                <Etikett punkt={[p([8.5, 62.2])[0] - 50, p([8.5, 62.2])[1] + 12]} tekst="norske kilder" anker="end" synlig />
                                <Skriftrull punkt={p(ENGLAND)} />
                                <Etikett punkt={[p(ENGLAND)[0], p(ENGLAND)[1] + 70]} tekst="engelske kilder" synlig />
                            </>
                        )}
                        {beat === 3 && (
                            <g>
                                <motion.path
                                    d={`M ${p([11, 63.2])[0]} ${p([11, 63.2])[1]} Q ${p([17, 66])[0]} ${p([17, 66])[1]} ${p([24, 64])[0]} ${p([24, 64])[1]}`}
                                    fill="none"
                                    stroke="#475569"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.6 }}
                                />
                                <Etikett punkt={p([19, 67.4])} tekst="jaget ut" farge="#475569" synlig />
                                <motion.path
                                    d={`M ${p([24, 62.6])[0]} ${p([24, 62.6])[1]} Q ${p([17, 61.8])[0]} ${p([17, 61.8])[1]} ${p([11.6, 63.4])[0]} ${p([11.6, 63.4])[1]}`}
                                    fill="none"
                                    stroke="#991b1b"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.6, delay: 2.2 }}
                                />
                                <Etikett punkt={p([19.5, 61.2])} tekst="tilbake i 1030" farge="#991b1b" synlig />
                            </g>
                        )}
                        {beat >= 4 && (
                            <g>
                                <Sverd punkt={p(STIKLESTAD)} />
                                <Etikett punkt={[p(STIKLESTAD)[0] + 40, p(STIKLESTAD)[1] + 12]} tekst="Stiklestad" anker="start" synlig />
                                <Etikett punkt={[p(STIKLESTAD)[0] + 40, p(STIKLESTAD)[1] + 56]} tekst="29. juli 1030" farge="#991b1b" anker="start" synlig />
                            </g>
                        )}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                {kort && (
                    <motion.div
                        key={kort.tittel}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute rounded-2xl bg-white/95 shadow-xl text-slate-900"
                        style={{ left: '3%', top: '6%', padding: '14px 22px', maxWidth: '40%' }}
                    >
                        <div className="text-3xl font-black">{kort.tittel}</div>
                        {kort.tekst && <div className="text-2xl font-semibold text-slate-600 mt-1">{kort.tekst}</div>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function kortFor(modus: Modus, beat: number): { tittel: string; tekst?: string } | null {
    if (modus === 'handel') {
        if (beat === 0) return { tittel: 'Ut for å handle' };
        if (beat === 1) return { tittel: 'Rikere og bedre organisert' };
        return { tittel: 'Lurt å komme overens', tekst: 'med de kristne' };
    }
    if (modus === 'tryggvason') {
        return [
            { tittel: 'Olav Tryggvason', tekst: 'konge fra ca. 995 til 1000' },
            { tittel: 'Kirkebygging og misjon', tekst: 'spre troen til nye mennesker' },
            { tittel: 'Påbud', tekst: 'dåp, faste og kristen begravelse' },
            { tittel: 'Kirke på Moster', tekst: 'i Sunnhordland' },
            { tittel: '«La deg døpe, eller slåss mot meg.»', tekst: 'ifølge sagaen' },
            { tittel: 'De fleste valgte dåpen', tekst: 'men motstanden vokste' },
        ][Math.min(beat, 5)];
    }
    return [
        { tittel: 'Knut den Mektige', tekst: 'danskekongen legger planer' },
        { tittel: 'Bestikkelser', tekst: 'betaling i det skjulte' },
        { tittel: 'Hvordan vet vi det?', tekst: 'norske og engelske kilder' },
        { tittel: 'Olav jaget ut', tekst: 'tilbake i 1030' },
        { tittel: 'Slaget på Stiklestad' },
    ][Math.min(beat, 4)];
}

const Land = memo(function Land({
    geographies,
    sti,
    fyll,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    fyll: (id: number) => string;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={`${g.id ?? 'x'}-${i}`}
                    d={sti(g as never) ?? ''}
                    fill={fyll(Number(g.id))}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                    style={{ transition: 'fill 0.8s' }}
                />
            ))}
        </>
    );
});

function Etikett({
    punkt,
    tekst,
    farge = '#0f172a',
    anker = 'middle',
    synlig,
}: {
    punkt: [number, number];
    tekst: string;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    synlig: boolean;
}) {
    return (
        <motion.text
            x={punkt[0]}
            y={punkt[1]}
            textAnchor={anker}
            fontSize={40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Skip({ punkt }: { punkt: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.6 }}
            transform={`translate(${punkt[0]} ${punkt[1]})`}
        >
            <path d="M -34 0 Q 0 18 34 0 L 28 -6 Q 0 8 -28 -6 Z" fill="#78350f" />
            <line x1={0} x2={0} y1={2} y2={-44} stroke="#78350f" strokeWidth={4} />
            <rect x={-18} y={-40} width={36} height={28} fill="#dc2626" stroke="#7f1d1d" strokeWidth={2} />
        </motion.g>
    );
}

function Kors({ punkt }: { punkt: [number, number] }) {
    return (
        <g transform={`translate(${punkt[0]} ${punkt[1]})`}>
            <circle r={44} fill="#fff" stroke="#b45309" strokeWidth={5} />
            <path d="M 0 -28 v 56 M -20 -10 h 40" stroke="#b45309" strokeWidth={10} strokeLinecap="round" />
        </g>
    );
}

function Kirke({ punkt }: { punkt: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
        >
            <g transform={`translate(${punkt[0]} ${punkt[1]})`}>
                <circle r={9} fill="#0f172a" />
                <g transform="translate(-36 -86)">
                    <rect x={0} y={30} width={56} height={40} fill="#92400e" stroke="#451a03" strokeWidth={3} />
                    <path d="M -6 32 L 28 6 L 62 32 Z" fill="#451a03" />
                    <path d="M 28 -24 v 30 M 18 -14 h 20" stroke="#451a03" strokeWidth={5} strokeLinecap="round" />
                </g>
            </g>
        </motion.g>
    );
}

function Skriftrull({ punkt }: { punkt: [number, number] }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <g transform={`translate(${punkt[0]} ${punkt[1]})`}>
                <rect x={-30} y={-26} width={60} height={46} rx={5} fill="#fef3c7" stroke="#92400e" strokeWidth={4} />
                <path d="M -18 -12 h 36 M -18 0 h 36 M -18 12 h 24" stroke="#92400e" strokeWidth={3} />
            </g>
        </motion.g>
    );
}

function Sverd({ punkt }: { punkt: [number, number] }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <g transform={`translate(${punkt[0]} ${punkt[1]})`}>
                <circle r={14} fill="#991b1b" stroke="#fff" strokeWidth={4} />
                <g transform="translate(0 -30) rotate(45)">
                    <rect x={-4} y={-46} width={8} height={56} fill="#e2e8f0" stroke="#0f172a" strokeWidth={2} />
                    <rect x={-16} y={8} width={32} height={7} fill="#0f172a" />
                    <rect x={-4} y={15} width={8} height={16} fill="#b45309" />
                </g>
            </g>
        </motion.g>
    );
}

/** Mynter som går i en strøm fra Knut til en stormann. */
function Mynt({
    fra,
    til,
    forsinkelse,
}: {
    fra: [number, number];
    til: [number, number];
    forsinkelse: number;
}) {
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    return (
        <g>
            <line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke="#94a3b8"
                strokeWidth={3}
                opacity={0.6}
            />
            <circle cx={til[0]} cy={til[1]} r={11} fill="#334155" stroke="#fff" strokeWidth={3} />
            {[0, 1, 2].map((k) => (
                <motion.circle
                    key={k}
                    cx={fra[0]}
                    cy={fra[1]}
                    r={11}
                    fill="#e2e8f0"
                    stroke="#64748b"
                    strokeWidth={3}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ x: [0, dx], y: [0, dy], opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: 2.4,
                        delay: forsinkelse + k * 0.8,
                        repeat: Infinity,
                        repeatDelay: 0.4,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </g>
    );
}

/** Små tegninger: vann (dåp), en tom skål (faste), et gravkors (begravelse). */
function Ikon({ type, x, y }: { type: number; x: number; y: number }) {
    if (type === 0)
        return (
            <path
                d={`M ${x} ${y - 34} C ${x + 22} ${y - 6} ${x + 26} ${y + 8} ${x} ${y + 22} C ${x - 26} ${y + 8} ${x - 22} ${y - 6} ${x} ${y - 34} Z`}
                fill="#38bdf8"
                stroke="#0369a1"
                strokeWidth={3}
            />
        );
    if (type === 1)
        return (
            <path
                d={`M ${x - 36} ${y - 6} L ${x + 36} ${y - 6} Q ${x + 30} ${y + 24} ${x} ${y + 24} Q ${x - 30} ${y + 24} ${x - 36} ${y - 6} Z`}
                fill="#e7e5e4"
                stroke="#57534e"
                strokeWidth={4}
            />
        );
    return (
        <g>
            <path d={`M ${x} ${y - 34} v 52 M ${x - 16} ${y - 18} h 32`} stroke="#57534e" strokeWidth={8} strokeLinecap="round" />
            <path d={`M ${x - 36} ${y + 24} Q ${x} ${y + 6} ${x + 36} ${y + 24} Z`} fill="#78716c" />
        </g>
    );
}
