import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { Overskrift } from './Overskrift';

/**
 * Leiren sett ovenfra.
 * - leir: hæren kommer, voll og palisade, telt på rekker, sykehus/teglovn/bakeri, veier og bro
 * - koloni: 25 år, sluttpakken, jorda og byen Köln
 */

type Modus = 'leir' | 'koloni';

const GRESS = '#b5c98a';
const JORD = '#a16207';
const PALISADE = '#5b3a1e';
const VEI = '#d6c7a1';
const ELV = '#60a5fa';

// Leiren: et rektangel midt i bildet.
const L = { x: 470, y: 250, b: 660, h: 520 };

const ramme = `M ${L.x} ${L.y} L ${L.x + L.b} ${L.y} L ${L.x + L.b} ${L.y + L.h} L ${L.x} ${L.y + L.h} Z`;

function Telt() {
    const telt = [];
    for (let r = 0; r < 6; r++) {
        for (let k = 0; k < 10; k++) {
            const x = L.x + 60 + k * 58 + (k >= 5 ? 22 : 0);
            const y = L.y + 50 + r * 46 + (r >= 3 ? 150 : 0);
            telt.push({ x, y, d: (r * 10 + k) * 0.015 });
        }
    }
    return (
        <>
            {telt.map((t, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: t.d, duration: 0.3 }}
                >
                    <path
                        d={`M ${t.x} ${t.y + 30} L ${t.x + 21} ${t.y} L ${t.x + 42} ${t.y + 30} Z`}
                        fill="#efe3c4"
                        stroke="#b49b6a"
                        strokeWidth={2}
                    />
                </motion.g>
            ))}
        </>
    );
}

function Bygg({
    x,
    y,
    tekst,
    farge,
    forsinkelse,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    forsinkelse: number;
}) {
    const b = tekst.length * 21 + 40;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={x - b / 2}
                y={y - 34}
                width={b}
                height={64}
                rx={10}
                fill={farge}
                stroke="#1f2937"
                strokeWidth={3}
            />
            <text x={x} y={y + 10} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

function Royk({ x, y }: { x: number; y: number }) {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={x}
                    r={14}
                    fill="#94a3b8"
                    initial={{ cy: y, opacity: 0 }}
                    animate={{ cy: [y, y - 70], opacity: [0.7, 0], r: [10, 26] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
                />
            ))}
        </>
    );
}

function Leir({ beat }: { beat: number }) {
    const midtY = L.y + L.h / 2;
    return (
        <>
            {/* Elva til høyre */}
            <path
                d="M 1390 0 Q 1340 300 1420 520 Q 1480 720 1400 900 L 1500 900 Q 1580 720 1520 520 Q 1440 300 1490 0 Z"
                fill={ELV}
            />
            {/* Veien inn fra venstre */}
            <rect x={0} y={midtY - 22} width={L.x} height={44} fill={VEI} />
            {beat === 0 &&
                Array.from({ length: 24 }, (_, i) => (
                    <motion.rect
                        key={i}
                        width={16}
                        height={16}
                        y={midtY - 18 + (i % 2) * 20}
                        fill="#b91c1c"
                        initial={{ x: -40 - Math.floor(i / 2) * 26 }}
                        animate={{ x: 700 - Math.floor(i / 2) * 26 }}
                        transition={{ duration: 5, ease: 'easeOut' }}
                    />
                ))}
            {beat >= 1 && (
                <>
                    {/* Vollen av jord, og palisaden oppå */}
                    <motion.path
                        d={ramme}
                        fill="none"
                        stroke={JORD}
                        strokeWidth={34}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                    <motion.path
                        d={ramme}
                        fill="none"
                        stroke={PALISADE}
                        strokeWidth={8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, delay: 0.8, ease: 'easeInOut' }}
                    />
                    {/* Porter */}
                    <rect x={L.x - 24} y={midtY - 26} width={48} height={52} fill={VEI} />
                    <rect x={L.x + L.b - 24} y={midtY - 26} width={48} height={52} fill={VEI} />
                    <rect
                        x={L.x + 40}
                        y={midtY - 20}
                        width={L.b - 80}
                        height={40}
                        fill={VEI}
                        opacity={0.8}
                    />
                </>
            )}
            {beat === 1 && (
                <>
                    <Merke x={L.x + L.b / 2} y={L.y - 52} tekst="voller" />
                    <Merke x={L.x + L.b / 2} y={L.y + L.h + 70} tekst="palisade av tømmerstokker" />
                </>
            )}
            {beat >= 2 && <Telt />}
            {beat >= 3 && (
                <>
                    <Bygg x={L.x + 120} y={midtY} tekst="sykehus" farge="#0f766e" forsinkelse={0} />
                    <Bygg
                        x={L.x + L.b / 2 + 10}
                        y={midtY}
                        tekst="teglovn"
                        farge="#9a3412"
                        forsinkelse={0.5}
                    />
                    <Bygg
                        x={L.x + L.b - 110}
                        y={midtY}
                        tekst="bakeri"
                        farge="#a16207"
                        forsinkelse={1}
                    />
                    <Royk x={L.x + L.b / 2 + 10} y={midtY - 40} />
                </>
            )}
            {beat >= 4 && (
                <>
                    <motion.rect
                        x={L.x + L.b + 20}
                        y={midtY - 22}
                        height={44}
                        fill={VEI}
                        initial={{ width: 0 }}
                        animate={{ width: 1600 - L.x - L.b - 20 }}
                        transition={{ duration: 2 }}
                    />
                    {/* Broa over elva */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        <rect
                            x={1360}
                            y={midtY - 34}
                            width={190}
                            height={68}
                            fill="#8b5a2b"
                            stroke="#3f2a14"
                            strokeWidth={4}
                        />
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <line
                                key={i}
                                x1={1380 + i * 30}
                                y1={midtY - 34}
                                x2={1380 + i * 30}
                                y2={midtY + 34}
                                stroke="#3f2a14"
                                strokeWidth={3}
                            />
                        ))}
                        <Merke x={1455} y={midtY - 64} tekst="bro" />
                    </motion.g>
                    <motion.rect
                        x={L.x + L.b / 2 - 22}
                        y={L.y + L.h + 20}
                        width={44}
                        fill={VEI}
                        initial={{ height: 0 }}
                        animate={{ height: 900 - L.y - L.h - 20 }}
                        transition={{ duration: 2, delay: 0.4 }}
                    />
                    <Merke x={260} y={midtY - 52} tekst="vei" />
                </>
            )}
        </>
    );
}

function Merke({ x, y, tekst }: { x: number; y: number; tekst: string }) {
    const b = tekst.length * 22 + 40;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={x - b / 2}
                y={y - 34}
                width={b}
                height={56}
                rx={12}
                fill="#ffffff"
                opacity={0.92}
            />
            <text x={x} y={y + 6} textAnchor="middle" fontSize={34} fontWeight={800} fill="#1f2937">
                {tekst}
            </text>
        </motion.g>
    );
}

// ---------- Koloni ----------

function Koloni({ beat }: { beat: number }) {
    const aar = Array.from({ length: 25 }, (_, i) => i);
    return (
        <>
            {beat <= 1 && (
                <g>
                    {aar.map((i) => (
                        <motion.rect
                            key={i}
                            x={200 + i * 48}
                            y={420}
                            width={40}
                            height={70}
                            rx={6}
                            fill="#b91c1c"
                            initial={{ opacity: 0.15 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 0 ? 0.6 + i * 0.12 : 0, duration: 0.2 }}
                        />
                    ))}
                    <text x={200} y={560} fontSize={40} fontWeight={700} fill="#475569">
                        år 1
                    </text>
                    <text
                        x={1392}
                        y={560}
                        fontSize={40}
                        fontWeight={700}
                        fill="#475569"
                        textAnchor="end"
                    >
                        år 25
                    </text>
                </g>
            )}
            {beat >= 2 && (
                <>
                    {/* Jorda: åkerlapper som legges ut */}
                    {Array.from({ length: 24 }, (_, i) => {
                        const k = i % 8;
                        const r = Math.floor(i / 8);
                        const x = 120 + k * 175;
                        const y = 230 + r * 210;
                        const midt = beat >= 3 && k >= 3 && k <= 4;
                        return (
                            <motion.rect
                                key={i}
                                x={x}
                                y={y}
                                width={160}
                                height={190}
                                rx={6}
                                fill={midt ? '#e7e5e4' : ['#d9b45a', '#9bb563', '#c9a14a'][i % 3]}
                                stroke="#78350f"
                                strokeWidth={2}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === 2 ? i * 0.06 : 0, duration: 0.4 }}
                            />
                        );
                    })}
                </>
            )}
            {beat >= 3 && (
                <>
                    {/* Byen i midten: hus på rekker */}
                    {Array.from({ length: 18 }, (_, i) => {
                        const x = 650 + (i % 3) * 105;
                        const y = 255 + Math.floor(i / 3) * 100;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                                <rect
                                    x={x}
                                    y={y + 20}
                                    width={60}
                                    height={46}
                                    fill="#fef3c7"
                                    stroke="#78350f"
                                    strokeWidth={2}
                                />
                                <path
                                    d={`M ${x - 6} ${y + 22} L ${x + 30} ${y} L ${x + 66} ${y + 22} Z`}
                                    fill="#c2410c"
                                />
                            </motion.g>
                        );
                    })}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <rect x={575} y={790} width={450} height={78} rx={16} fill="#1f2937" />
                        <text
                            x={800}
                            y={843}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#fff"
                        >
                            Köln, år 50 evt.
                        </text>
                    </motion.g>
                </>
            )}
        </>
    );
}

const ETIKETTER: Record<Modus, string[]> = {
    leir: [
        'Hæren kommer fram',
        'Voll og palisade',
        'Åtte soldater i hvert telt',
        'En hel liten by',
        'Veier og broer',
    ],
    koloni: ['25 år i tjeneste', 'Sluttpakken', 'Og jord!', 'Köln: grunnlagt for veteraner'],
};

export function LegionenLeir({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'leir';
    const liste = ETIKETTER[modus];
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'leir' ? GRESS : '#f5f0e1' }}
        >
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'leir' ? <Leir beat={beat} /> : <Koloni beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
            {modus === 'koloni' && beat === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ top: '64%' }}
                >
                    <Teller verdi={12000} etikett="sestertser under Augustus" />
                </motion.div>
            )}
        </div>
    );
}
