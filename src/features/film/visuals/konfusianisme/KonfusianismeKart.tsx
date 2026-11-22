import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landmark, Users, GraduationCap, Scale } from 'lucide-react';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Kart til konfusianisme-filmen.
 * - «aristoteles»: Kina og Hellas, i hver sin ende av verden, med det samme spørsmålet.
 * - «idag»: nykonfusianismen, blandingen av tradisjoner, statens kontroll og tankegangen
 *   i Øst-Asia. Øst-Asia er en uskarp sky, ikke en grense.
 */
type Modus = 'aristoteles' | 'idag';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const HELLAS = '300';

const UTSNITT: Record<Modus, Utsnitt | undefined> = {
    aristoteles: undefined,
    idag: [
        [86, 14],
        [148, 50],
    ],
};
const RAMME: Record<Modus, [LngLat, LngLat]> = {
    aristoteles: [
        [-8, 8],
        [150, 58],
    ],
    idag: [
        [86, 14],
        [148, 50],
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    aristoteles: [
        'Dygdsetikk: moral bygd på gode egenskaper',
        'Hver sin ende av verden',
        'Det samme spørsmålet',
    ],
    idag: [
        'Song-dynastiet: nykonfusianismen',
        'I dag: sjelden alene',
        'Staten holder kontroll',
        'Tankegangen i Øst-Asia',
    ],
};

const Land = memo(function Land({
    geographies,
    sti,
    farger,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farger: Record<string, string>;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String(g.id);
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farger[id] ?? '#e9e1cf'}
                        stroke="#b3a789"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </>
    );
});

function Nal({
    x,
    y,
    navn,
    under,
    farge,
    venstre = false,
}: {
    x: number;
    y: number;
    navn: string;
    under: string;
    farge: string;
    venstre?: boolean;
}) {
    const bredde = Math.max(navn.length * 0.58 * 44, under.length * 0.56 * 28) + 50;
    const kx = venstre ? x - 40 - bredde : x + 40;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <circle cx={x} cy={y} r={14} fill={farge} stroke="#fff" strokeWidth={4} />
            <line
                x1={x}
                y1={y}
                x2={venstre ? x - 40 : x + 40}
                y2={y}
                stroke={farge}
                strokeWidth={4}
            />
            <rect
                x={kx}
                y={y - 58}
                width={bredde}
                height={110}
                rx={18}
                fill="#fffdf7"
                opacity={0.96}
            />
            <text x={kx + 25} y={y - 8} fontSize={44} fontWeight={900} fill={farge}>
                {navn}
            </text>
            <text x={kx + 25} y={y + 34} fontSize={28} fontWeight={700} fill="#44403c">
                {under}
            </text>
        </motion.g>
    );
}

export function KonfusianismeKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'aristoteles';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 60],
                    [B - 60, H - 30],
                ],
                { type: 'MultiPoint', coordinates: RAMME[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const liste = OVERSKRIFT[modus];

    const farger: Record<string, string> = {};
    if (modus === 'aristoteles') {
        farger[KINA] = '#f2c879';
        if (beat >= 1) farger[HELLAS] = '#93c5fd';
    } else {
        farger[KINA] = beat === 2 ? '#d6b3b3' : '#f2c879';
    }

    const kina = p([116.5, 36]);
    const hellas = p([22.5, 39]);
    const midtKina = p([104, 33]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#d7e6ea' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                fontFamily="Inter, sans-serif"
            >
                <defs>
                    <filter id="konf-sky" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={40} />
                    </filter>
                </defs>
                <Land geographies={geographies} sti={sti} farger={farger} />

                {modus === 'idag' && beat >= 3 && (
                    <motion.ellipse
                        cx={p([120, 33])[0]}
                        cy={p([120, 33])[1]}
                        rx={520}
                        ry={300}
                        fill="#b45309"
                        filter="url(#konf-sky)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 1.2 }}
                    />
                )}

                {modus === 'aristoteles' && (
                    <Nal
                        x={kina[0]}
                        y={kina[1]}
                        navn="Konfucius"
                        under="Kina"
                        farge="#9f1d1d"
                        venstre
                    />
                )}
                {modus === 'aristoteles' && beat >= 1 && (
                    <Nal
                        x={hellas[0]}
                        y={hellas[1]}
                        navn="Aristoteles"
                        under="Hellas"
                        farge="#1d4ed8"
                    />
                )}
                {modus === 'aristoteles' && beat === 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        <rect
                            x={580}
                            y={600}
                            width={500}
                            height={84}
                            rx={18}
                            fill="#1c1917"
                            opacity={0.88}
                        />
                        <text
                            x={830}
                            y={655}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#fde68a"
                        >
                            visste ikke om hverandre
                        </text>
                    </motion.g>
                )}
            </svg>

            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />

            <AnimatePresence>
                {modus === 'aristoteles' && beat === 0 && (
                    <motion.div
                        key="dygd"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute left-[5%] bottom-[10%] px-6 py-4 rounded-2xl bg-[#fffdf7]/95 shadow-xl"
                    >
                        <div className="text-2xl font-semibold text-stone-500">
                            Ikke: følg reglene
                        </div>
                        <div className="text-3xl font-black text-stone-900">
                            Men: bli et godt menneske
                        </div>
                    </motion.div>
                )}
                {modus === 'aristoteles' && beat === 2 && (
                    <motion.div
                        key="spm"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute inset-x-0 bottom-[9%] flex justify-center"
                    >
                        <div className="px-8 py-5 rounded-3xl bg-stone-900/90 text-amber-50 text-4xl font-black text-center">
                            Hva slags menneske bør jeg bli?
                        </div>
                    </motion.div>
                )}
                {modus === 'aristoteles' && (
                    <div className="absolute right-[2%] bottom-[2%] px-3 py-1 rounded-lg bg-white/80 text-lg font-semibold text-stone-600">
                        Kartet har dagens grenser
                    </div>
                )}

                {modus === 'idag' && beat === 0 && (
                    <motion.div
                        key="song"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute left-[4%] bottom-[8%] px-6 py-4 rounded-2xl bg-[#fffdf7]/95 shadow-xl"
                    >
                        <div className="text-4xl font-black text-red-800">960 til 1279</div>
                        <div className="text-2xl font-bold text-stone-700">
                            Nytt spørsmål i læren:
                        </div>
                        <div className="text-2xl font-bold text-stone-700">
                            hva består verden av?
                        </div>
                    </motion.div>
                )}
                {modus === 'idag' && beat === 1 && (
                    <motion.div
                        key="flette"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[3%] bottom-[6%] rounded-3xl bg-[#fffdf7]/95 shadow-xl p-3"
                    >
                        <Flette />
                    </motion.div>
                )}
                {modus === 'idag' && beat === 2 && (
                    <motion.div
                        key="stat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute left-[4%] bottom-[9%] px-6 py-4 rounded-2xl bg-[#fffdf7]/95 shadow-xl"
                        style={{ maxWidth: 440 }}
                    >
                        <div className="flex items-center gap-3 text-3xl font-black text-red-800">
                            <Landmark className="w-9 h-9" /> Myndighetene
                        </div>
                        <div className="text-2xl font-bold text-stone-700">
                            bestemmer hva som regnes som vanlig religion
                        </div>
                    </motion.div>
                )}
                {modus === 'idag' && beat >= 3 && (
                    <motion.div
                        key="tanke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-[6%] flex justify-center gap-4"
                    >
                        {[
                            { ikon: Users, tekst: 'Du skylder familien noe' },
                            { ikon: GraduationCap, tekst: 'Utdanning betyr alt' },
                            { ikon: Scale, tekst: 'Mest makt, mest ansvar' },
                        ].map(({ ikon: Ikon, tekst }, i) => (
                            <motion.div
                                key={tekst}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 1 }}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#fffdf7]/95 shadow-xl text-2xl font-black text-stone-900"
                            >
                                <Ikon className="w-8 h-8 text-amber-700" /> {tekst}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {modus === 'idag' && beat >= 3 && (
                    <motion.div
                        key="oa"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute right-[6%] top-[24%] px-4 py-2 rounded-xl bg-amber-700/90 text-3xl font-black text-white"
                    >
                        Øst-Asia
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'idag' && (beat === 0 || beat === 2) && (
                <MerkeKina x={midtKina[0]} y={midtKina[1]} />
            )}
        </div>
    );
}

/** «Kina» midt i landet, i prosent av flaten så det følger SVG-en. */
function MerkeKina({ x, y }: { x: number; y: number }) {
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
            fontFamily="Inter, sans-serif"
        >
            <text
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill="#7c2d12"
                opacity={0.75}
            >
                Kina
            </text>
        </svg>
    );
}

/** Fire tråder som flettes til ett tau: folk blander tradisjonene uten å velge én. */
function Flette() {
    const traader = [
        { navn: 'folketro', farge: '#15803d' },
        { navn: 'daoisme', farge: '#0d9488' },
        { navn: 'buddhisme', farge: '#d97706' },
        { navn: 'konfusianisme', farge: '#9f1d1d' },
    ];
    return (
        <svg width={520} height={250} viewBox="0 0 520 250">
            {traader.map((t, i) => {
                const y0 = 30 + i * 60;
                const d = `M 240 ${y0} C 310 ${y0}, 320 125, 370 125 S 430 ${250 - y0}, 500 125`;
                return (
                    <g key={t.navn}>
                        <text
                            x={226}
                            y={y0 + 9}
                            textAnchor="end"
                            fontSize={26}
                            fontWeight={800}
                            fill={t.farge}
                        >
                            {t.navn}
                        </text>
                        <motion.path
                            d={d}
                            stroke={t.farge}
                            strokeWidth={10}
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.3 + i * 0.5, duration: 1.2 }}
                        />
                    </g>
                );
            })}
        </svg>
    );
}
