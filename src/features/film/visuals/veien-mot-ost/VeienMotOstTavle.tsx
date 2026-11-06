import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To tavler i SVG.
 *
 * «bytte»: handelen på elvene. Skipet ligger midt på elva. Varene går sørover i øverste
 * rad (pelsverk, sverd, mennesker, honning og voks), sølvet kommer tilbake i nederste.
 * Beat 0: handel eller plyndring. Beat 3: ordet slave.
 *
 * «rurik»: en tidslinje fra 862 til 1598. Krøniken, Rurik i Novgorod, stammene som ba
 * skandinavene styre, og slekten som varte i mer enn 700 år.
 */

type Modus = 'bytte' | 'rurik';

const B = 1600;
const H = 900;

export function VeienMotOstTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bytte';
    return (
        <div className="absolute inset-0 bg-[#f5efe2] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'bytte' ? <Bytte beat={beat} /> : <Rurik beat={beat} />}
            </svg>
        </div>
    );
}

function Tekst({
    x,
    y,
    tekst,
    storrelse = 40,
    farge = '#0f172a',
    vekt = 900,
    anker = 'middle',
    synlig = true,
    kursiv = false,
}: {
    x: number;
    y: number;
    tekst: string;
    storrelse?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    synlig?: boolean;
    kursiv?: boolean;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={vekt}
            fontStyle={kursiv ? 'italic' : 'normal'}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

/* ---------------- bytte ---------------- */

type Vare = {
    id: string;
    navn: string;
    fraBeat: number;
    ikon: 'pels' | 'sverd' | 'lenke' | 'honning' | 'voks';
};

const VARER: Vare[] = [
    { id: 'pels', navn: 'pelsverk', fraBeat: 1, ikon: 'pels' },
    { id: 'sverd', navn: 'sverd', fraBeat: 1, ikon: 'sverd' },
    { id: 'slaver', navn: 'mennesker', fraBeat: 2, ikon: 'lenke' },
    { id: 'honning', navn: 'honning', fraBeat: 4, ikon: 'honning' },
    { id: 'voks', navn: 'voks', fraBeat: 4, ikon: 'voks' },
];

function Ikon({ type }: { type: Vare['ikon'] }) {
    if (type === 'pels')
        return (
            <g>
                <path
                    d="M -40 -20 Q -48 10 -30 34 L 30 34 Q 48 10 40 -20 Q 20 -34 0 -24 Q -20 -34 -40 -20 Z"
                    fill="#8b5a2b"
                />
                <path d="M -24 0 Q 0 12 24 0" stroke="#5b3417" strokeWidth={5} fill="none" />
            </g>
        );
    if (type === 'sverd')
        return (
            <g transform="rotate(-35)">
                <rect
                    x={-6}
                    y={-46}
                    width={12}
                    height={66}
                    rx={3}
                    fill="#94a3b8"
                    stroke="#475569"
                    strokeWidth={3}
                />
                <rect x={-26} y={18} width={52} height={10} rx={4} fill="#78350f" />
                <rect x={-5} y={28} width={10} height={20} fill="#78350f" />
            </g>
        );
    if (type === 'lenke')
        return (
            <g fill="none" stroke="#7f1d1d" strokeWidth={9}>
                <ellipse cx={-24} cy={0} rx={22} ry={14} />
                <ellipse cx={4} cy={0} rx={22} ry={14} />
                <ellipse cx={32} cy={0} rx={22} ry={14} />
            </g>
        );
    if (type === 'honning')
        return (
            <g>
                <path
                    d="M -26 -20 L 26 -20 L 32 30 Q 0 42 -32 30 Z"
                    fill="#d97706"
                    stroke="#92400e"
                    strokeWidth={4}
                />
                <rect x={-30} y={-32} width={60} height={14} rx={4} fill="#92400e" />
            </g>
        );
    return (
        <g>
            <rect
                x={-14}
                y={-26}
                width={28}
                height={60}
                rx={4}
                fill="#fde68a"
                stroke="#b45309"
                strokeWidth={4}
            />
            <path d="M 0 -26 Q 10 -40 0 -50 Q -10 -40 0 -26" fill="#f59e0b" />
        </g>
    );
}

function Mynt({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: forsinkelse }}
        >
            <circle cx={x} cy={y} r={30} fill="#cbd5e1" stroke="#64748b" strokeWidth={5} />
            <circle cx={x} cy={y} r={18} fill="none" stroke="#94a3b8" strokeWidth={4} />
        </motion.g>
    );
}

function Bytte({ beat }: { beat: number }) {
    const synligeVarer = VARER.filter((v) => beat >= v.fraBeat);
    const slaveFokus = beat === 2 || beat === 3;
    return (
        <g>
            {/* Nord og sør */}
            <rect x={0} y={0} width={300} height={H} fill="#dfe8d3" />
            <rect x={B - 300} y={0} width={300} height={H} fill="#eddcb8" />
            <Tekst x={150} y={70} tekst="NORD" storrelse={44} farge="#166534" />
            <Tekst x={150} y={120} tekst="elveriket" storrelse={32} farge="#166534" vekt={700} />
            <Tekst x={B - 150} y={70} tekst="SØR" storrelse={44} farge="#78350f" />
            <Tekst
                x={B - 150}
                y={120}
                tekst="Bysants og Bulgar"
                storrelse={32}
                farge="#78350f"
                vekt={700}
            />

            {/* Elva og skipet */}
            <rect x={300} y={480} width={B - 600} height={60} fill="#93c5fd" />
            <g transform="translate(800 495)">
                <path d="M -150 0 L 150 0 Q 130 40 0 44 Q -130 40 -150 0 Z" fill="#7c4a24" />
                <path d="M 150 0 Q 175 -20 170 -54" stroke="#5b3417" strokeWidth={10} fill="none" />
                <path
                    d="M -150 0 Q -175 -20 -170 -54"
                    stroke="#5b3417"
                    strokeWidth={10}
                    fill="none"
                />
                {[-100, -50, 0, 50, 100].map((x) => (
                    <circle
                        key={x}
                        cx={x}
                        cy={4}
                        r={16}
                        fill={x % 100 === 0 ? '#b91c1c' : '#f5efe2'}
                        stroke="#5b3417"
                        strokeWidth={4}
                    />
                ))}
            </g>

            {/* Beat 0: handel eller plyndring */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <rect
                    x={440}
                    y={180}
                    width={300}
                    height={110}
                    rx={20}
                    fill="#ffffff"
                    stroke="#166534"
                    strokeWidth={5}
                />
                <Tekst x={590} y={235} tekst="handle" storrelse={52} farge="#166534" />
                <rect
                    x={860}
                    y={180}
                    width={300}
                    height={110}
                    rx={20}
                    fill="#ffffff"
                    stroke="#b91c1c"
                    strokeWidth={5}
                />
                <Tekst x={1010} y={235} tekst="plyndre" storrelse={52} farge="#b91c1c" />
                <Tekst
                    x={800}
                    y={340}
                    tekst="de samme folkene"
                    storrelse={36}
                    farge="#334155"
                    vekt={700}
                />
            </motion.g>

            {/* Varene sørover */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <Tekst x={800} y={160} tekst="SØROVER" storrelse={36} farge="#78350f" />
                <path d="M 340 200 L 1240 200" stroke="#78350f" strokeWidth={8} />
                <path d="M 1240 182 L 1272 200 L 1240 218 Z" fill="#78350f" />
            </motion.g>
            {synligeVarer.map((v, i) => {
                const x = 400 + i * 200;
                const slave = v.ikon === 'lenke';
                const dempet = slaveFokus && !slave;
                return (
                    <motion.g
                        key={v.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: dempet ? 0.35 : 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect
                            x={x - 90}
                            y={240}
                            width={180}
                            height={160}
                            rx={18}
                            fill={slave ? '#fee2e2' : '#ffffff'}
                            stroke={slave ? '#b91c1c' : '#cbd5e1'}
                            strokeWidth={slave ? 6 : 3}
                        />
                        <g transform={`translate(${x} 292)`}>
                            <Ikon type={v.ikon} />
                        </g>
                        {v.id === 'sverd' && (
                            <Tekst
                                x={x}
                                y={354}
                                tekst="frankiske"
                                storrelse={22}
                                farge="#64748b"
                                vekt={800}
                            />
                        )}
                        <Tekst
                            x={x}
                            y={v.id === 'sverd' ? 382 : 372}
                            tekst={v.navn}
                            storrelse={28}
                            farge={slave ? '#7f1d1d' : '#334155'}
                            vekt={800}
                        />
                    </motion.g>
                );
            })}

            {/* Beat 3: ordet slave */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <rect
                    x={430}
                    y={580}
                    width={740}
                    height={250}
                    rx={24}
                    fill="#ffffff"
                    stroke="#7f1d1d"
                    strokeWidth={6}
                />
                <Tekst x={800} y={650} tekst="slave" storrelse={72} farge="#7f1d1d" kursiv />
                <Tekst
                    x={800}
                    y={720}
                    tekst="ordet kommer fra latin"
                    storrelse={34}
                    farge="#334155"
                    vekt={700}
                />
                <Tekst
                    x={800}
                    y={775}
                    tekst="først: slaviske krigsfanger solgt som treller"
                    storrelse={30}
                    farge="#334155"
                    vekt={700}
                />
            </motion.g>

            {/* Sølvet tilbake */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 5 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <path d="M 1260 680 L 360 680" stroke="#475569" strokeWidth={8} />
                <path d="M 360 662 L 328 680 L 360 698 Z" fill="#475569" />
                <Tekst
                    x={800}
                    y={630}
                    tekst="TILBAKE: SØLV I FORM AV MYNTER"
                    storrelse={36}
                    farge="#475569"
                />
                {beat >= 5 &&
                    Array.from({ length: 9 }, (_, i) => (
                        <Mynt
                            key={i}
                            x={1180 - i * 100}
                            y={760 + (i % 2) * 40}
                            forsinkelse={i * 0.15}
                        />
                    ))}
            </motion.g>
        </g>
    );
}

/* ---------------- rurik ---------------- */

const AR0 = 862;
const AR1 = 1598;
const X0 = 220;
const X1 = 1380;
const LY = 560;
const xFor = (ar: number) => X0 + ((ar - AR0) / (AR1 - AR0)) * (X1 - X0);

function Rurik({ beat }: { beat: number }) {
    return (
        <g>
            {/* Beat 0: krøniken */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? 1 : beat >= 1 ? 0.0 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <g transform="translate(800 330)">
                    <path
                        d="M -230 -150 Q -115 -180 0 -140 L 0 150 Q -115 110 -230 140 Z"
                        fill="#fef3c7"
                        stroke="#78350f"
                        strokeWidth={6}
                    />
                    <path
                        d="M 230 -150 Q 115 -180 0 -140 L 0 150 Q 115 110 230 140 Z"
                        fill="#fef3c7"
                        stroke="#78350f"
                        strokeWidth={6}
                    />
                    {[-80, -40, 0, 40, 80].map((y) => (
                        <g key={y}>
                            <rect
                                x={-200}
                                y={y}
                                width={170}
                                height={8}
                                fill="#b45309"
                                opacity={0.5}
                            />
                            <rect
                                x={30}
                                y={y}
                                width={170}
                                height={8}
                                fill="#b45309"
                                opacity={0.5}
                            />
                        </g>
                    ))}
                </g>
                <Tekst x={800} y={560} tekst="Nestorkrøniken" storrelse={64} farge="#78350f" />
                <Tekst
                    x={800}
                    y={630}
                    tekst="skrevet av en munk i Kyiv"
                    storrelse={36}
                    farge="#334155"
                    vekt={700}
                />
            </motion.g>

            {/* Tidslinja */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <line
                    x1={X0 - 40}
                    y1={LY}
                    x2={X1 + 40}
                    y2={LY}
                    stroke="#cbd5e1"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                {[1000, 1100, 1200, 1300, 1400, 1500].map((ar) => (
                    <g key={ar}>
                        <line
                            x1={xFor(ar)}
                            y1={LY - 14}
                            x2={xFor(ar)}
                            y2={LY + 14}
                            stroke="#94a3b8"
                            strokeWidth={4}
                        />
                        <Tekst
                            x={xFor(ar)}
                            y={LY + 50}
                            tekst={String(ar)}
                            storrelse={26}
                            farge="#64748b"
                            vekt={700}
                        />
                    </g>
                ))}
                <circle cx={X0} cy={LY} r={22} fill="#b91c1c" stroke="#fff" strokeWidth={5} />
                <Tekst x={X0} y={LY + 64} tekst="862" storrelse={44} farge="#7f1d1d" />
                <Tekst
                    x={X0}
                    y={LY - 140}
                    tekst="Rurik kalles"
                    storrelse={40}
                    farge="#7f1d1d"
                    anker="start"
                />
                <Tekst
                    x={X0}
                    y={LY - 92}
                    tekst="til Novgorod"
                    storrelse={40}
                    farge="#7f1d1d"
                    anker="start"
                />
            </motion.g>

            {/* Beat 2: stammene */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                {[
                    { x: 880, navn: 'slaviske stammer', farge: '#5b21b6' },
                    { x: 1260, navn: 'finske stammer', farge: '#166534' },
                ].map((s) => (
                    <g key={s.navn}>
                        {[-60, 0, 60].map((dx) => (
                            <g key={dx}>
                                <circle cx={s.x + dx} cy={180} r={20} fill={s.farge} />
                                <rect
                                    x={s.x + dx - 22}
                                    y={204}
                                    width={44}
                                    height={60}
                                    rx={14}
                                    fill={s.farge}
                                />
                            </g>
                        ))}
                        <Tekst x={s.x} y={310} tekst={s.navn} storrelse={34} farge={s.farge} />
                    </g>
                ))}
                <path
                    d="M 760 250 Q 600 260 520 400"
                    stroke="#334155"
                    strokeWidth={7}
                    fill="none"
                />
                <path d="M 505 392 L 520 420 L 538 394 Z" fill="#334155" />
                <Tekst
                    x={1070}
                    y={380}
                    tekst="skal ha bedt skandinavene herske"
                    storrelse={34}
                    farge="#334155"
                    vekt={800}
                />
                <Tekst
                    x={1070}
                    y={425}
                    tekst="og skape orden"
                    storrelse={34}
                    farge="#334155"
                    vekt={800}
                />
            </motion.g>

            {/* Beat 3-4: slekten */}
            <motion.line
                x1={X0}
                y1={LY}
                y2={LY}
                stroke="#b45309"
                strokeWidth={22}
                strokeLinecap="round"
                initial={{ x2: X0, opacity: 0 }}
                animate={{ x2: beat >= 3 ? X1 : X0, opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
            />
            <Tekst
                x={800}
                y={LY - 60}
                tekst="rurikidene"
                storrelse={54}
                farge="#78350f"
                synlig={beat >= 3}
                kursiv
            />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <circle cx={X1} cy={LY} r={22} fill="#0f172a" stroke="#fff" strokeWidth={5} />
                <Tekst x={X1} y={LY + 64} tekst="1598" storrelse={44} farge="#0f172a" />
                <Tekst x={X1} y={LY - 140} tekst="tsar Fjodor dør" storrelse={40} anker="end" />
                <Tekst
                    x={X1}
                    y={LY - 92}
                    tekst="sønn av Ivan den grusomme"
                    storrelse={30}
                    farge="#334155"
                    anker="end"
                    vekt={700}
                />
                <rect x={560} y={700} width={480} height={110} rx={24} fill="#78350f" />
                <Tekst x={800} y={756} tekst="mer enn 700 år" storrelse={56} farge="#ffffff" />
            </motion.g>
        </g>
    );
}
