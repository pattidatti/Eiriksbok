import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Merke, Tekst } from './felles';

/**
 * Kart over hvor novellen kommer fra.
 * «italia»: ordet novella (nyhet) og de korte fortellingene i prosa i Italia.
 * «dekameron»: Boccaccios rammefortelling. Sju kvinner og tre menn flykter fra pesten og forteller 100 historier.
 * «norge»: Kiellands tre samlinger, gjennombruddet i Norge.
 */

type Modus = 'italia' | 'dekameron' | 'norge';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const ITALIA = '380';
const NORGE = '578';

const RAMMER: Record<Modus, [LngLat, LngLat]> = {
    italia: [
        [-4, 36],
        [30, 49],
    ],
    dekameron: [
        [-4, 36],
        [30, 49],
    ],
    norge: [
        [-6, 56.5],
        [32, 71.5],
    ],
};

export function NovelleKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'italia';
    const ramme = RAMMER[modus];
    const { geographies } = useFilmVerden([
        [ramme[0][0] - 3, ramme[0][1] - 3],
        [ramme[1][0] + 3, ramme[1][1] + 3],
    ]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [20, 20],
                    [B - 20, H - 20],
                ],
                { type: 'MultiPoint', coordinates: ramme } as never
            ),
        [ramme]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const fremhev = modus === 'norge' ? NORGE : ITALIA;
    const visFremhev = modus === 'norge' ? true : modus === 'dekameron' || beat >= 1;
    const land = useMemo(
        () =>
            geographies.map((g, i) => ({
                key: i,
                d: sti(g as never) ?? '',
                fremhevet: String(g.id) === fremhev,
            })),
        [geographies, sti, fremhev]
    );
    const p = (ll: LngLat) => proj(ll) as [number, number];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#c5d9e8' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                <g opacity={modus === 'dekameron' ? 0.2 : 1} style={{ transition: 'opacity 0.8s' }}>
                    {land.map((l) => (
                        <path
                            key={l.key}
                            d={l.d}
                            fill={visFremhev && l.fremhevet ? '#f2c879' : '#e6dfcd'}
                            stroke="#9c937c"
                            strokeWidth={1.5}
                            style={{ transition: 'fill 0.8s' }}
                        />
                    ))}
                </g>
                {modus === 'italia' && <Italia beat={beat} p={p} />}
                {modus === 'dekameron' && <Dekameron beat={beat} />}
                {modus === 'norge' && <Norge beat={beat} p={p} />}
            </svg>
        </div>
    );
}

/* ---------------------------------------------------------------- italia */

function Italia({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const [ix, iy] = p([12.5, 42.6]);
    return (
        <>
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    <rect x={430} y={300} width={740} height={300} rx={36} fill="#0f172a" />
                    <text
                        x={800}
                        y={420}
                        textAnchor="middle"
                        fontSize={96}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        novella
                    </text>
                    <Tekst x={800} y={520} fs={48} farge="#ffffff" forsinkelse={1}>
                        betyr «nyhet»
                    </Tekst>
                </motion.g>
            )}
            {beat >= 1 && (
                <>
                    <Merke
                        x={ix}
                        y={iy - 230}
                        tekst="Italia, 1200- og 1300-tallet"
                        fs={44}
                        fyll="#7c2d12"
                        farge="#ffffff"
                    />
                    {beat === 1 &&
                        [
                            [-260, 40],
                            [210, -40],
                            [-120, 200],
                            [260, 170],
                        ].map(([dx, dy], i) => (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.4 }}
                            >
                                <Ark x={ix + dx} y={iy + dy} />
                            </motion.g>
                        ))}
                </>
            )}
            {beat === 2 && <ProsaVers />}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    <rect x={340} y={640} width={920} height={170} rx={30} fill="#0f172a" />
                    <text
                        x={800}
                        y={712}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        Novelle = en kort fortelling i prosa
                    </text>
                    <Tekst x={800} y={772} fs={32} farge="#ffffff" vekt={600} forsinkelse={0.6}>
                        slik bruker vi ordet i dag
                    </Tekst>
                </motion.g>
            )}
        </>
    );
}

/** Et lite ark med tekstlinjer: en kort fortelling. */
function Ark({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x - 45} ${y - 55})`}>
            <rect width={90} height={110} rx={6} fill="#ffffff" stroke="#9c937c" strokeWidth={2} />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect
                    key={i}
                    x={14}
                    y={18 + i * 18}
                    width={62 - (i === 4 ? 24 : 0)}
                    height={6}
                    rx={3}
                    fill="#94a3b8"
                />
            ))}
        </g>
    );
}

/** Prosa (linjer som går helt ut) mot vers (korte linjer). */
function ProsaVers() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <g>
                <rect
                    x={180}
                    y={560}
                    width={560}
                    height={280}
                    rx={22}
                    fill="#ffffff"
                    stroke="#0f766e"
                    strokeWidth={5}
                />
                <text
                    x={460}
                    y={620}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f766e"
                >
                    Prosa
                </text>
                {[0, 1, 2, 3].map((i) => (
                    <rect
                        key={i}
                        x={220}
                        y={655 + i * 36}
                        width={i === 3 ? 300 : 480}
                        height={12}
                        rx={6}
                        fill="#94a3b8"
                    />
                ))}
            </g>
            <g>
                <rect
                    x={860}
                    y={560}
                    width={560}
                    height={280}
                    rx={22}
                    fill="#e7e5e4"
                    stroke="#a8a29e"
                    strokeWidth={4}
                />
                <text
                    x={1140}
                    y={620}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#57534e"
                >
                    Vers (dikt)
                </text>
                {[0, 1, 2, 3].map((i) => (
                    <rect
                        key={i}
                        x={1000}
                        y={655 + i * 36}
                        width={[220, 170, 240, 150][i]}
                        height={12}
                        rx={6}
                        fill="#a8a29e"
                    />
                ))}
            </g>
        </motion.g>
    );
}

/* ---------------------------------------------------------------- dekameron */

const BY = { x: 400, y: 560 };
const BAKKE = { x: 1150, y: 600 };

function Dekameron({ beat }: { beat: number }) {
    const ute = beat >= 1;
    const folk = Array.from({ length: 10 }, (_, i) => {
        const kvinne = i < 7;
        const vinkel = (i / 10) * Math.PI * 2;
        return {
            kvinne,
            inne: { x: BY.x - 90 + (i % 5) * 45, y: BY.y + 10 + Math.floor(i / 5) * 50 },
            ute: { x: BAKKE.x + Math.cos(vinkel) * 150, y: BAKKE.y + 40 + Math.sin(vinkel) * 70 },
        };
    });
    return (
        <>
            <Merke
                x={800}
                y={90}
                tekst="Dekameronen, ca. 1353 · Giovanni Boccaccio"
                fs={40}
                fyll="#0f172a"
                farge="#ffffff"
            />

            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Bok x={800} y={470} />
                    <Merke
                        x={800}
                        y={760}
                        tekst="Den første novellesamlingen"
                        fs={44}
                        fyll="#fde68a"
                        farge="#78350f"
                    />
                </motion.g>
            )}

            {beat >= 1 && (
                <>
                    {/* Byen med pesten */}
                    <g>
                        <rect
                            x={BY.x - 170}
                            y={BY.y - 160}
                            width={340}
                            height={300}
                            rx={10}
                            fill="#3f3f46"
                        />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <rect
                                key={i}
                                x={BY.x - 170 + i * 72}
                                y={BY.y - 195}
                                width={50}
                                height={40}
                                fill="#3f3f46"
                            />
                        ))}
                        <text
                            x={BY.x}
                            y={BY.y - 220}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#7f1d1d"
                        >
                            Byen: pesten herjer
                        </text>
                    </g>
                    {/* Pila ut */}
                    {beat === 1 && (
                        <motion.path
                            d={`M ${BY.x + 190} ${BY.y - 40} Q 780 ${BY.y - 160} ${BAKKE.x - 200} ${BY.y - 40}`}
                            fill="none"
                            stroke="#7c2d12"
                            strokeWidth={8}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.4 }}
                        />
                    )}
                    {/* Bakken utenfor */}
                    <ellipse cx={BAKKE.x} cy={BAKKE.y + 60} rx={300} ry={140} fill="#bbd59a" />
                    {/* Folkene: sju kvinner og tre menn */}
                    {folk.map((f, i) => {
                        const mal = ute ? f.ute : f.inne;
                        return (
                            <motion.g
                                key={i}
                                initial={false}
                                animate={{ x: mal.x, y: mal.y }}
                                transition={{ duration: 1.6, delay: i * 0.08, ease: 'easeInOut' }}
                            >
                                <circle
                                    cx={0}
                                    cy={-34}
                                    r={13}
                                    fill={f.kvinne ? '#be185d' : '#1d4ed8'}
                                />
                                <path
                                    d="M -17 12 Q -17 -22 0 -22 Q 17 -22 17 12 Z"
                                    fill={f.kvinne ? '#be185d' : '#1d4ed8'}
                                />
                            </motion.g>
                        );
                    })}
                    {beat === 1 && (
                        <g>
                            <Merke
                                x={BAKKE.x - 120}
                                y={BAKKE.y + 250}
                                tekst="sju kvinner"
                                fs={34}
                                fyll="#fce7f3"
                                farge="#831843"
                                forsinkelse={1.4}
                            />
                            <Merke
                                x={BAKKE.x + 140}
                                y={BAKKE.y + 250}
                                tekst="tre menn"
                                fs={34}
                                fyll="#dbeafe"
                                farge="#1e3a8a"
                                forsinkelse={1.6}
                            />
                        </g>
                    )}
                </>
            )}

            {beat >= 2 && <Historier beat={beat} />}
        </>
    );
}

function Bok({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -230 -150 Q -115 -180 0 -150 L 0 150 Q -115 120 -230 150 Z"
                fill="#fffbeb"
                stroke="#78350f"
                strokeWidth={6}
            />
            <path
                d="M 230 -150 Q 115 -180 0 -150 L 0 150 Q 115 120 230 150 Z"
                fill="#fffbeb"
                stroke="#78350f"
                strokeWidth={6}
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                    <rect
                        x={-200}
                        y={-110 + i * 40}
                        width={160}
                        height={10}
                        rx={5}
                        fill="#a8a29e"
                    />
                    <rect x={40} y={-110 + i * 40} width={160} height={10} rx={5} fill="#a8a29e" />
                </g>
            ))}
        </g>
    );
}

/** 100 historier som små ark i et rutenett, og rammen rundt dem. */
function Historier({ beat }: { beat: number }) {
    const x0 = 1020;
    const y0 = 165;
    const s = 26;
    return (
        <g>
            <rect
                x={x0 - 30}
                y={y0 - 30}
                width={10 * s + 50}
                height={10 * s + 50}
                rx={14}
                fill="#fffbeb"
                opacity={0.95}
            />
            {Array.from({ length: 100 }, (_, i) => (
                <motion.rect
                    key={i}
                    x={x0 + (i % 10) * s}
                    y={y0 + Math.floor(i / 10) * s}
                    width={s - 8}
                    height={s - 8}
                    rx={3}
                    fill="#b45309"
                    initial={{ opacity: beat === 2 ? 0 : 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: beat === 2 ? 0.3 + i * 0.03 : 0 }}
                />
            ))}
            <Merke
                x={BAKKE.x}
                y={470}
                tekst="100 historier"
                fs={40}
                fyll="#b45309"
                farge="#ffffff"
            />
            {beat >= 3 && (
                <g>
                    <motion.rect
                        x={BAKKE.x - 340}
                        y={y0 - 50}
                        width={680}
                        height={BAKKE.y + 210 - y0 + 50}
                        rx={22}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={12}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6 }}
                    />
                    <Merke
                        x={BAKKE.x}
                        y={BAKKE.y + 250}
                        tekst="Rammen: flukten fra pesten"
                        fs={36}
                        fyll="#0f172a"
                        farge="#ffffff"
                        forsinkelse={1.2}
                    />
                </g>
            )}
        </g>
    );
}

/* ---------------------------------------------------------------- norge */

const SAMLINGER = [
    { tittel: 'Novelletter', aar: '1879', fraBeat: 1, farge: '#7c2d12' },
    { tittel: 'Nye Novelletter', aar: '', fraBeat: 2, farge: '#1e3a5f' },
    { tittel: 'To Novelletter', aar: '', fraBeat: 2, farge: '#14532d' },
];

function Norge({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const [nx, ny] = p([1.5, 63.2]);
    return (
        <>
            <Merke x={nx} y={ny} tekst="Norge" fs={46} fyll="#ffffff" />
            <Merke
                x={nx}
                y={ny + 90}
                tekst="slutten av 1800-tallet"
                fs={34}
                fyll="#7c2d12"
                farge="#ffffff"
                forsinkelse={0.5}
            />
            {beat >= 1 && (
                <g>
                    <Tekst x={1220} y={170} fs={42} farge="#0f172a">
                        Alexander Kielland
                    </Tekst>
                    {SAMLINGER.filter((s) => beat >= s.fraBeat).map((s, i) => (
                        <motion.g
                            key={s.tittel}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: beat === s.fraBeat ? 0.3 + i * 0.5 : 0,
                            }}
                        >
                            <rect
                                x={960}
                                y={230 + i * 150}
                                width={520}
                                height={120}
                                rx={12}
                                fill={s.farge}
                            />
                            <rect
                                x={960}
                                y={230 + i * 150}
                                width={26}
                                height={120}
                                rx={6}
                                fill="#000000"
                                opacity={0.25}
                            />
                            <text
                                x={1230}
                                y={300 + i * 150 - (s.aar ? 10 : 0)}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#fef3c7"
                            >
                                {s.tittel}
                            </text>
                            {s.aar && (
                                <text
                                    x={1230}
                                    y={335 + i * 150}
                                    textAnchor="middle"
                                    fontSize={28}
                                    fontWeight={700}
                                    fill="#fde68a"
                                >
                                    {s.aar}
                                </text>
                            )}
                        </motion.g>
                    ))}
                </g>
            )}
            {beat >= 3 && (
                <Merke
                    x={1190}
                    y={760}
                    tekst="Høydepunkter i norsk novellekunst på 1800-tallet"
                    fs={26}
                    fyll="#fde68a"
                    farge="#78350f"
                />
            )}
        </>
    );
}
