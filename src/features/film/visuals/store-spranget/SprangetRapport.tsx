import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Løgnen om avlingene, tegnet som snitt.
 * «kjede»: en trapp fra landsbyen opp til Beijing. Kornsekkene blir flere for hvert trinn.
 * «korn»: rapporten på papiret mot den ekte haugen. Kornet sendes bort, landsbyen blir tom.
 * «kurve»: kornproduksjonen 1956-1963, tegnet fram år for år.
 */

type Modus = 'kjede' | 'korn' | 'kurve';

const B = 1600;
const H = 900;

function Sekk({
    x,
    y,
    s = 1,
    farge = '#d4a35a',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -26 30 Q -32 -6 -16 -22 L -10 -30 L 10 -30 L 16 -22 Q 32 -6 26 30 Z"
                fill={farge}
                stroke="#78350f"
                strokeWidth={3}
            />
            <path d="M -12 -26 L 12 -26" stroke="#78350f" strokeWidth={4} />
        </g>
    );
}

/** Sekker stablet i en pyramide, nederst først. */
function Stabel({
    x,
    y,
    antall,
    s = 1,
    farge,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    antall: number;
    s?: number;
    farge?: string;
    forsinkelse?: number;
}) {
    const plass: [number, number][] = [];
    let rad = 0;
    let igjen = antall;
    let bredde = Math.max(1, Math.ceil((Math.sqrt(8 * antall + 1) - 1) / 2));
    while (igjen > 0) {
        const n = Math.min(bredde, igjen);
        for (let i = 0; i < n; i++) plass.push([(i - (n - 1) / 2) * 56 * s, -rad * 52 * s]);
        igjen -= n;
        bredde -= 1;
        rad += 1;
        if (bredde < 1) bredde = 1;
    }
    return (
        <g>
            <AnimatePresence>
                {plass.map(([dx, dy], i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ delay: forsinkelse + i * 0.07 }}
                    >
                        <Sekk x={x + dx} y={y + dy - 30 * s} s={s} farge={farge} />
                    </motion.g>
                ))}
            </AnimatePresence>
        </g>
    );
}

function Kjede({ beat }: { beat: number }) {
    const trinn = [
        { navn: 'Landsbyen', x: 230, y: 790, sekker: 2 },
        { navn: 'Distriktet', x: 610, y: 640, sekker: 4 },
        { navn: 'Provinsen', x: 990, y: 490, sekker: 7 },
        { navn: 'Beijing', x: 1370, y: 340, sekker: 11 },
    ];
    return (
        <g>
            {trinn.map((t, i) => {
                const aktiv = beat === 1 ? i === 0 : beat >= 2 || (beat === 0 && i === 3);
                const sekker = beat >= 2 ? t.sekker : i === 0 && beat >= 1 ? 2 : 0;
                return (
                    <g key={t.navn} opacity={aktiv ? 1 : 0.45}>
                        <rect x={t.x - 170} y={t.y} width={340} height={H - t.y} fill="#e7e0d2" />
                        <rect x={t.x - 170} y={t.y} width={340} height={14} fill="#a8a29e" />
                        <text
                            x={t.x}
                            y={t.y + 70}
                            textAnchor="middle"
                            className="font-display"
                            fontSize={44}
                            fontWeight={800}
                            fill="#1c1917"
                        >
                            {t.navn}
                        </text>
                        <Stabel
                            x={t.x}
                            y={t.y}
                            antall={sekker}
                            s={0.9}
                            forsinkelse={beat >= 2 ? 0.5 + i * 0.8 : 0.3}
                        />
                    </g>
                );
            })}
            {/* Pilene: rapporten går oppover og vokser */}
            {beat >= 2 &&
                trinn
                    .slice(0, 3)
                    .map((t, i) => (
                        <motion.path
                            key={t.navn}
                            d={`M ${t.x + 120} ${t.y - 210} Q ${t.x + 200} ${t.y - 300} ${trinn[i + 1].x - 120} ${trinn[i + 1].y - 260}`}
                            fill="none"
                            stroke="#b91c1c"
                            strokeWidth={8}
                            strokeLinecap="round"
                            markerEnd="url(#sp-pil)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.2 + i * 0.8, duration: 0.7 }}
                        />
                    ))}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g
                        key="mal"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect x={1180} y={130} width={380} height={130} rx={18} fill="#b91c1c" />
                        <text
                            x={1370}
                            y={190}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#fff"
                        >
                            MÅL: REKORD
                        </text>
                        <text
                            x={1370}
                            y={235}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={600}
                            fill="#fecaca"
                        >
                            umulig å nå
                        </text>
                        <text
                            x={560}
                            y={300}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={800}
                            fill="#1c1917"
                        >
                            Hvem tør å si det?
                        </text>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g
                        key="stempel"
                        initial={{ opacity: 0, scale: 1.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 15 }}
                        style={{ transformOrigin: '380px 520px' }}
                    >
                        <g transform="rotate(-10 380 520)">
                            <rect
                                x={160}
                                y={460}
                                width={440}
                                height={120}
                                rx={14}
                                fill="#fff"
                                fillOpacity={0.85}
                                stroke="#b91c1c"
                                strokeWidth={8}
                            />
                            <text
                                x={380}
                                y={540}
                                textAnchor="middle"
                                fontSize={62}
                                fontWeight={900}
                                fill="#b91c1c"
                            >
                                SABOTØR?
                            </text>
                        </g>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="rekord"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect x={1140} y={70} width={440} height={110} rx={18} fill="#ca8a04" />
                        <text
                            x={1360}
                            y={142}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#fff"
                        >
                            REKORDAVLING!
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/** Kornet som sendes bort. Sekkene glir fra landsbyen mot byen og skipet. */
function Korn({ beat }: { beat: number }) {
    const ekte = [0, 1, 2, 3];
    // Hvor hver av de fire ekte sekkene står per beat: i landsbyen, i byen, på skipet eller borte.
    const mål = (i: number): { x: number; y: number; o: number } => {
        const hjemme = { x: 300 + (i % 2) * 70 - 35, y: 730 - Math.floor(i / 2) * 60, o: 1 };
        if (beat === 0) return hjemme;
        if (i === 0 && beat === 2) return hjemme;
        if (i === 0 && beat >= 3) return { ...hjemme, o: 0 };
        if (i === 1) return { x: 1180, y: 410, o: 1 };
        if (i === 2) return { x: 1260, y: 410, o: 1 };
        return { x: 1250, y: 760, o: 1 };
    };
    return (
        <g>
            {/* Landsbyen */}
            <rect x={130} y={780} width={360} height={120} fill="#c9b48a" />
            <path
                d="M 180 780 L 180 660 L 260 610 L 340 660 L 340 780 Z"
                fill="#d6c3a0"
                stroke="#78350f"
                strokeWidth={4}
            />
            <text x={310} y={860} textAnchor="middle" fontSize={40} fontWeight={800} fill="#1c1917">
                Landsbyen
            </text>
            {/* Byen */}
            <g>
                {[0, 1, 2, 3].map((i) => (
                    <rect
                        key={i}
                        x={1080 + i * 80}
                        y={300 - (i % 2) * 70}
                        width={70}
                        height={160 + (i % 2) * 70}
                        fill="#94a3b8"
                        stroke="#475569"
                        strokeWidth={3}
                    />
                ))}
                <text
                    x={1240}
                    y={520}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#1c1917"
                >
                    Byene
                </text>
            </g>
            {/* Skipet til andre land */}
            <g>
                <rect x={1000} y={830} width={600} height={70} fill="#7dd3fc" />
                <path d="M 1120 790 L 1400 790 L 1370 835 L 1150 835 Z" fill="#475569" />
                <text
                    x={1260}
                    y={890}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#0c4a6e"
                >
                    Til andre land
                </text>
            </g>
            {/* Rapporten på papiret */}
            <motion.g animate={{ opacity: beat >= 2 ? 0.35 : 1 }} transition={{ duration: 0.8 }}>
                <rect
                    x={110}
                    y={90}
                    width={460}
                    height={380}
                    rx={14}
                    fill="#fefce8"
                    stroke="#a16207"
                    strokeWidth={4}
                    strokeDasharray={beat >= 2 ? '18 12' : undefined}
                />
                <text
                    x={340}
                    y={150}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={800}
                    fill="#713f12"
                >
                    På papiret
                </text>
                <Stabel x={340} y={440} antall={10} s={0.8} farge="#fde68a" />
            </motion.g>
            {beat >= 2 && (
                <motion.text
                    x={340}
                    y={300}
                    textAnchor="middle"
                    fontSize={52}
                    fontWeight={900}
                    fill="#b91c1c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    transform="rotate(-12 340 300)"
                >
                    FANTES IKKE
                </motion.text>
            )}
            {/* Statens krav */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <path
                    d="M 520 640 Q 800 520 1020 430"
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={10}
                    strokeLinecap="round"
                    markerEnd="url(#sp-pil)"
                />
                <path
                    d="M 520 720 Q 820 740 1080 780"
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={10}
                    strokeLinecap="round"
                    markerEnd="url(#sp-pil)"
                />
                <text
                    x={690}
                    y={510}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#b91c1c"
                >
                    Staten krever mer
                </text>
            </motion.g>
            {ekte.map((i) => {
                const m = mål(i);
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ x: m.x, y: m.y, opacity: m.o }}
                        transition={{ duration: 1.6, delay: 0.3 + i * 0.25, ease: 'easeInOut' }}
                    >
                        <Sekk x={0} y={0} s={0.9} />
                    </motion.g>
                );
            })}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g
                        key="igjen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1 }}
                    >
                        <rect x={90} y={500} width={440} height={80} rx={14} fill="#b91c1c" />
                        <text
                            x={310}
                            y={553}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#fff"
                        >
                            Igjen: nesten ingenting
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="bark"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: -60 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <rect
                            x={120}
                            y={490}
                            width={400}
                            height={130}
                            rx={18}
                            fill="#fff"
                            stroke="#78350f"
                            strokeWidth={4}
                        />
                        {/* Bark */}
                        {[0, 1, 2].map((i) => (
                            <rect
                                key={i}
                                x={150 + i * 34}
                                y={515}
                                width={24}
                                height={80}
                                rx={8}
                                fill="#78350f"
                            />
                        ))}
                        {/* Gress */}
                        {[0, 1, 2, 3, 4].map((i) => (
                            <path
                                key={i}
                                d={`M ${300 + i * 22} 600 Q ${292 + i * 22} 550 ${308 + i * 22} ${515 + (i % 2) * 15}`}
                                stroke="#65a30d"
                                strokeWidth={7}
                                fill="none"
                                strokeLinecap="round"
                            />
                        ))}
                        <text
                            x={450}
                            y={572}
                            fontSize={30}
                            fontWeight={800}
                            fill="#1c1917"
                            textAnchor="middle"
                        >
                            bark
                        </text>
                        <text
                            x={450}
                            y={606}
                            fontSize={30}
                            fontWeight={800}
                            fill="#1c1917"
                            textAnchor="middle"
                        >
                            gress
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const DATA = [
    { år: 1956, verdi: 192 },
    { år: 1957, verdi: 195 },
    { år: 1958, verdi: 200 },
    { år: 1959, verdi: 170 },
    { år: 1960, verdi: 143 },
    { år: 1961, verdi: 148 },
    { år: 1962, verdi: 160 },
    { år: 1963, verdi: 170 },
];
const X0 = 220;
const X1 = 1480;
const Y0 = 780;
const Y1 = 210;
const MAKS = 220;
const px = (i: number) => X0 + (i * (X1 - X0)) / (DATA.length - 1);
const py = (verdi: number) => Y0 - (verdi / MAKS) * (Y0 - Y1);

function Kurve({ beat }: { beat: number }) {
    const synlig = [2, 3, 4, 7][Math.min(beat, 3)];
    const punkter = DATA.map((d, i) => [px(i), py(d.verdi)] as const);
    const lengder = punkter.map((p, i) =>
        i === 0 ? 0 : Math.hypot(p[0] - punkter[i - 1][0], p[1] - punkter[i - 1][1])
    );
    const total = lengder.reduce((a, b) => a + b, 0);
    const opp = lengder.slice(0, synlig + 1).reduce((a, b) => a + b, 0);
    const d = punkter.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    return (
        <g>
            <text x={X0 + 80} y={135} fontSize={46} fontWeight={800} fill="#1c1917">
                Korn høstet i Kina, millioner tonn
            </text>
            {/* Hungersnøden 1959-1961 */}
            <motion.rect
                x={px(3) - 40}
                y={Y1}
                width={px(5) - px(3) + 80}
                height={Y0 - Y1}
                fill="#fecaca"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 0.7 : 0 }}
                transition={{ duration: 0.8 }}
            />
            {beat >= 1 && (
                <text
                    x={(px(3) + px(5)) / 2}
                    y={Y1 + 40}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#991b1b"
                >
                    Hungersnød
                </text>
            )}
            {[0, 50, 100, 150, 200].map((t) => (
                <g key={t}>
                    <line x1={X0} x2={X1} y1={py(t)} y2={py(t)} stroke="#cbd5e1" strokeWidth={2} />
                    <text x={X0 - 20} y={py(t) + 10} textAnchor="end" fontSize={26} fill="#64748b">
                        {t}
                    </text>
                </g>
            ))}
            {DATA.map((dd, i) => (
                <text
                    key={dd.år}
                    x={px(i)}
                    y={Y0 + 50}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#334155"
                >
                    {dd.år}
                </text>
            ))}
            {beat >= 3 && (
                <motion.line
                    x1={px(2)}
                    x2={X1}
                    y1={py(200)}
                    y2={py(200)}
                    stroke="#0d9488"
                    strokeWidth={4}
                    strokeDasharray="14 10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                />
            )}
            <motion.path
                d={d}
                fill="none"
                stroke="#b45309"
                strokeWidth={10}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: opp / total }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
            {DATA.map((dd, i) => {
                const vis = i <= synlig;
                const uthev =
                    (beat === 0 && i === 2) ||
                    (beat === 1 && i === 3) ||
                    (beat === 2 && i === 4) ||
                    (beat >= 3 && (i === 7 || i === 2));
                return (
                    <motion.g
                        key={dd.år}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: vis ? 1 : 0 }}
                        transition={{ delay: vis ? 0.9 : 0 }}
                    >
                        <circle
                            cx={px(i)}
                            cy={py(dd.verdi)}
                            r={uthev ? 16 : 10}
                            fill={i >= 3 && i <= 5 ? '#dc2626' : '#b45309'}
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        {uthev && (
                            <g>
                                <rect
                                    x={px(i) - 70}
                                    y={py(dd.verdi) - 92}
                                    width={140}
                                    height={60}
                                    rx={12}
                                    fill="#1c1917"
                                />
                                <text
                                    x={px(i)}
                                    y={py(dd.verdi) - 50}
                                    textAnchor="middle"
                                    fontSize={36}
                                    fontWeight={900}
                                    fill="#fff"
                                >
                                    {dd.verdi}
                                </text>
                            </g>
                        )}
                    </motion.g>
                );
            })}
        </g>
    );
}

export function SprangetRapport({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kjede';
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-stone-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker
                        id="sp-pil"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                    </marker>
                </defs>
                {modus === 'kjede' && <Kjede beat={beat} />}
                {modus === 'korn' && <Korn beat={beat} />}
                {modus === 'kurve' && <Kurve beat={beat} />}
            </svg>
        </div>
    );
}
