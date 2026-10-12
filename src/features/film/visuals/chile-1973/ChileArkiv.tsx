import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To snitt i SVG:
 * «arven»: en vekt med de to synene på Pinochet-tiden, og en stemmeurne som er låst.
 * «stadion»: nasjonalstadionet sett ovenfra. Portene stenges, og tribunene fylles av prikker.
 * «arkiv»: et hemmelig CIA-dokument. Først er alt sladdet og USA nekter, så blir det
 * gjort kjent, og de svarte feltene glir bort så eleven ser hva som faktisk sto der.
 */

type Modus = 'arven' | 'arkiv' | 'stadion';

const B = 1600;
const H = 900;

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    stadion: [
        { tekst: 'Et stadion blir et fengsel', rod: true },
        { tekst: 'Tusenvis samlet', rod: true },
    ],
    arven: [
        { tekst: 'Var det bra for Chile?' },
        { tekst: 'Noen: rikere på sikt' },
        { tekst: 'Andre: større forskjeller' },
        { tekst: 'Folket fikk aldri stemme', rod: true },
    ],
    arkiv: [
        { tekst: 'USA nekter i lang tid' },
        { tekst: 'Dokumentene blir kjent' },
        { tekst: 'Svart på hvitt', rod: true },
        { tekst: 'Grav i arkivene' },
    ],
};

export function ChileArkiv({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'arkiv';
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f5f1e8' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'arven' && <Vekt beat={beat} />}
                {modus === 'arkiv' && <Dokument beat={beat} />}
                {modus === 'stadion' && <Stadion beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** En vektskål som henger i armen og får et skilt med ett av synene. */
function Skål({
    x,
    y,
    topp,
    tekst,
    farge,
    vis,
}: {
    x: number;
    y: number;
    topp: number;
    tekst: string[];
    farge: string;
    vis: boolean;
}) {
    return (
        <motion.g
            animate={{ y: y - topp }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
        >
            <line x1={x} y1={topp} x2={x - 120} y2={topp + 190} stroke="#57534e" strokeWidth={4} />
            <line x1={x} y1={topp} x2={x + 120} y2={topp + 190} stroke="#57534e" strokeWidth={4} />
            <path
                d={`M ${x - 150} ${topp + 190} Q ${x} ${topp + 270} ${x + 150} ${topp + 190} Z`}
                fill="#a8a29e"
                stroke="#57534e"
                strokeWidth={5}
            />
            <AnimatePresence>
                {vis && (
                    <motion.g
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect
                            x={x - 140}
                            y={topp + 70}
                            width={280}
                            height={tekst.length * 46 + 30}
                            rx={14}
                            fill={farge}
                        />
                        {tekst.map((l, i) => (
                            <text
                                key={i}
                                x={x}
                                y={topp + 112 + i * 46}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                {l}
                            </text>
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
        </motion.g>
    );
}

/** Vekta: venstre skål tynges ned av «rikere», så tar høyre skål igjen med «forskjeller». */
function Vekt({ beat }: { beat: number }) {
    const cx = 800;
    const topp = 230;
    const vinkel = beat === 1 ? -9 : 0;
    const arm = 360;
    const rad = (vinkel * Math.PI) / 180;
    const venstreY = topp - Math.sin(rad) * arm;
    const høyreY = topp + Math.sin(rad) * arm;
    return (
        <g>
            <rect x={cx - 14} y={topp} width={28} height={430} fill="#57534e" />
            <rect x={cx - 140} y={topp + 420} width={280} height={30} rx={10} fill="#44403c" />
            <motion.g
                animate={{ rotate: vinkel }}
                transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                style={{ transformOrigin: `${cx}px ${topp}px`, transformBox: 'view-box' }}
            >
                <rect
                    x={cx - arm - 10}
                    y={topp - 8}
                    width={arm * 2 + 20}
                    height={16}
                    rx={8}
                    fill="#44403c"
                />
            </motion.g>
            <circle cx={cx} cy={topp} r={22} fill="#1c1917" />
            <Skål
                x={cx - arm}
                y={venstreY}
                topp={topp}
                tekst={['Rikere', 'på sikt?']}
                farge="#15803d"
                vis={beat >= 1}
            />
            <Skål
                x={cx + arm}
                y={høyreY}
                topp={topp}
                tekst={['Fattig og rik', 'lenger fra', 'hverandre']}
                farge="#b91c1c"
                vis={beat >= 2}
            />
            {beat === 0 && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    x={cx}
                    y={topp + 150}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#78716c"
                >
                    ?
                </motion.text>
            )}
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.g
                        key="urne"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        style={{ transformOrigin: `${cx}px 560px`, transformBox: 'view-box' }}
                    >
                        <rect
                            x={cx - 220}
                            y={430}
                            width={440}
                            height={300}
                            rx={20}
                            fill="#ffffff"
                            stroke="#1e293b"
                            strokeWidth={6}
                        />
                        <rect
                            x={cx - 150}
                            y={480}
                            width={300}
                            height={130}
                            rx={10}
                            fill="#cbd5e1"
                            stroke="#1e293b"
                            strokeWidth={5}
                        />
                        <rect x={cx - 90} y={500} width={180} height={14} rx={7} fill="#1e293b" />
                        <text
                            x={cx}
                            y={575}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#1e293b"
                        >
                            VALG
                        </text>
                        <path
                            d={`M ${cx - 140} 480 L ${cx + 140} 610 M ${cx + 140} 480 L ${cx - 140} 610`}
                            stroke="#dc2626"
                            strokeWidth={18}
                            strokeLinecap="round"
                        />
                        <text
                            x={cx}
                            y={680}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#b91c1c"
                        >
                            Ingen fikk protestere
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const LINJER = [
    'Stans alle lån til Chile',
    'Betal sjåførene for å streike',
    'Press ned prisen på kobber',
    'Gi penger til aviser som sprer frykt',
];

/** Det hemmelige dokumentet. Sladden glir bort på beat 2. */
function Dokument({ beat }: { beat: number }) {
    const x = 470;
    const y = 150;
    const b = 660;
    const åpen = beat >= 2;
    return (
        <g>
            {/* Arkivbokser bak */}
            {beat >= 3 &&
                [0, 1, 2, 3, 4].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                    >
                        <rect
                            x={i < 2 ? 90 + i * 170 : 1170 + (i - 2) * 120}
                            y={i < 2 ? 520 : 560}
                            width={i < 2 ? 150 : 105}
                            height={i < 2 ? 200 : 160}
                            rx={8}
                            fill="#d6c7a1"
                            stroke="#8b7a55"
                            strokeWidth={4}
                        />
                        <rect
                            x={i < 2 ? 125 + i * 170 : 1190 + (i - 2) * 120}
                            y={i < 2 ? 560 : 590}
                            width={i < 2 ? 80 : 65}
                            height={30}
                            rx={4}
                            fill="#fafaf9"
                        />
                    </motion.g>
                ))}
            <motion.g
                animate={{ rotate: beat >= 3 ? -3 : 0 }}
                style={{ transformOrigin: `${x + b / 2}px ${y + 330}px`, transformBox: 'view-box' }}
            >
                <rect
                    x={x}
                    y={y}
                    width={b}
                    height={680}
                    fill="#fffdf7"
                    stroke="#a8a29e"
                    strokeWidth={5}
                />
                <text x={x + 50} y={y + 75} fontSize={44} fontWeight={900} fill="#0f172a">
                    CIA
                </text>
                <text
                    x={x + b - 50}
                    y={y + 75}
                    textAnchor="end"
                    fontSize={30}
                    fontWeight={800}
                    fill="#b91c1c"
                >
                    HEMMELIG
                </text>
                <text x={x + 50} y={y + 140} fontSize={32} fontWeight={700} fill="#334155">
                    Om: Chile
                </text>
                {LINJER.map((l, i) => {
                    const ly = y + 220 + i * 110;
                    return (
                        <g key={l}>
                            <text x={x + 50} y={ly} fontSize={34} fontWeight={700} fill="#0f172a">
                                {l}
                            </text>
                            <motion.rect
                                x={x + 40}
                                y={ly - 42}
                                height={60}
                                fill="#0f172a"
                                initial={{ width: b - 80 }}
                                animate={{ width: åpen ? 0 : b - 80 }}
                                transition={{
                                    delay: åpen ? 0.4 + i * 0.5 : 0,
                                    duration: 0.7,
                                    ease: 'easeInOut',
                                }}
                            />
                        </g>
                    );
                })}
            </motion.g>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Stempel
                        key="nei"
                        tekst="«Vi blandet oss ikke inn»"
                        farge="#1e3a8a"
                        x={x + b / 2}
                        y={y + 650}
                    />
                )}
                {beat >= 1 && (
                    <Stempel
                        key="kjent"
                        tekst="GJORT KJENT"
                        farge="#b91c1c"
                        x={x + b / 2}
                        y={y + 650}
                    />
                )}
            </AnimatePresence>
        </g>
    );
}

function Stempel({ tekst, farge, x, y }: { tekst: string; farge: string; x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
        >
            <g transform={`rotate(-8 ${x} ${y})`}>
                <rect
                    x={x - 290}
                    y={y - 50}
                    width={580}
                    height={90}
                    rx={12}
                    fill="#ffffff"
                    fillOpacity={0.85}
                    stroke={farge}
                    strokeWidth={8}
                />
                <text
                    x={x}
                    y={y + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={farge}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** Prikkene på tribunene: jevnt fordelt i ringen mellom banen og ytterkanten. */
const FANGER = Array.from({ length: 34 * 12 }, (_, i) => {
    const rad = Math.floor(i / 34);
    const a = ((i % 34) / 34) * Math.PI * 2 + (rad % 2) * 0.09;
    const k = 0.66 + (rad / 12) * 0.3;
    return { x: 800 + Math.cos(a) * 520 * k, y: 500 + Math.sin(a) * 300 * k, rad };
});

/** Nasjonalstadionet ovenfra. Beat 0: portene stenges. Beat 1: tribunene fylles. */
function Stadion({ beat }: { beat: number }) {
    const porter = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    return (
        <g>
            <ellipse
                cx={800}
                cy={500}
                rx={540}
                ry={320}
                fill="#94a3b8"
                stroke="#475569"
                strokeWidth={8}
            />
            <ellipse cx={800} cy={500} rx={520} ry={300} fill="#cbd5e1" />
            <ellipse
                cx={800}
                cy={500}
                rx={330}
                ry={175}
                fill="#4d7c0f"
                stroke="#e2e8f0"
                strokeWidth={10}
            />
            <ellipse
                cx={800}
                cy={500}
                rx={250}
                ry={110}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={4}
            />
            <line x1={800} y1={325} x2={800} y2={675} stroke="#e2e8f0" strokeWidth={4} />
            {porter.map((a, i) => (
                <motion.rect
                    key={i}
                    x={800 + Math.cos(a) * 530 - 40}
                    y={500 + Math.sin(a) * 310 - 14}
                    width={80}
                    height={28}
                    rx={6}
                    fill="#1e293b"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.3, type: 'spring' }}
                    style={{
                        transformOrigin: `${800 + Math.cos(a) * 530}px ${500 + Math.sin(a) * 310}px`,
                        transformBox: 'view-box',
                    }}
                />
            ))}
            {beat >= 1 &&
                FANGER.map((f, i) => (
                    <motion.circle
                        key={i}
                        cx={f.x}
                        cy={f.y}
                        r={7}
                        fill="#334155"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + (i % 34) * 0.05 + f.rad * 0.08 }}
                    />
                ))}
            <motion.g
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <rect
                    x={600}
                    y={455}
                    width={400}
                    height={90}
                    rx={14}
                    fill="#ffffff"
                    fillOpacity={0.92}
                />
                <text
                    x={800}
                    y={502}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Nasjonalstadionet
                </text>
            </motion.g>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.text
                        key="tusenvis"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        x={800}
                        y={880}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#7f1d1d"
                    >
                        Tusenvis som var uenige med Pinochet
                    </motion.text>
                )}
            </AnimatePresence>
        </g>
    );
}
