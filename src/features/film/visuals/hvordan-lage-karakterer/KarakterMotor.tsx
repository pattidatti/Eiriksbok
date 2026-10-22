import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift, Person } from './felles';

/**
 * Motoren: det Elias VIL (bli usynlig, gå mot skyggen) og det han TRENGER (bli sett, gå mot
 * lyset). To tau drar i ham fra hver sin kant, og fjæra mellom dem er spenningen.
 */

function Fjaer({ fra, til, y, strekk }: { fra: number; til: number; y: number; strekk: boolean }) {
    const n = 14;
    const pkt: string[] = [];
    for (let i = 0; i <= n; i++) {
        const x = fra + ((til - fra) * i) / n;
        const dy = i === 0 || i === n ? 0 : i % 2 ? -26 : 26;
        pkt.push(`${x} ${y + dy}`);
    }
    return (
        <motion.polyline
            points={pkt.join(' ')}
            fill="none"
            stroke="#ea580c"
            strokeWidth={8}
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: strekk ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        />
    );
}

export function KarakterMotor({ beat }: VisualProps) {
    const vil = beat >= 2;
    const trenger = beat >= 3;
    const spenning = beat >= 4;
    // Elias flyttes litt mot den siden som drar sist.
    const eliasX = beat === 2 ? 720 : beat === 3 ? 880 : 800;
    const overskrift = [
        'Trinn 3: Motoren',
        'Vil ha og trenger',
        'Elias VIL: være usynlig',
        'Elias TRENGER: å bli sett',
        'Gapet skaper spenning',
    ][Math.min(beat, 4)];

    return (
        <div
            className="absolute inset-0"
            style={{
                background:
                    'linear-gradient(90deg, #334155 0%, #64748b 45%, #fef3c7 60%, #fde68a 100%)',
            }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <rect
                    x={430}
                    y={30}
                    width={740}
                    height={90}
                    rx={24}
                    fill="#ffffff"
                    opacity={0.92}
                />
                <Overskrift tekst={overskrift} />

                {/* Motoren som går rundt fra start */}
                <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                    style={{ transformOrigin: '800px 815px' }}
                    opacity={beat <= 1 ? 1 : 0.35}
                >
                    {Array.from({ length: 8 }, (_, i) => {
                        const a = (i / 8) * Math.PI * 2;
                        return (
                            <rect
                                key={i}
                                x={800 + Math.cos(a) * 62 - 14}
                                y={815 + Math.sin(a) * 62 - 14}
                                width={28}
                                height={28}
                                fill="#f59e0b"
                            />
                        );
                    })}
                    <circle cx={800} cy={815} r={58} fill="#f59e0b" />
                    <circle cx={800} cy={815} r={22} fill="#78350f" />
                </motion.g>

                {/* Tauet mot skyggen (vil) */}
                <motion.line
                    x1={eliasX - 40}
                    y1={470}
                    x2={170}
                    y2={470}
                    stroke="#0f172a"
                    strokeWidth={10}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: vil ? 1 : 0, x1: eliasX - 40 }}
                />
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }}>
                    <text
                        x={120}
                        y={300}
                        fontSize={64}
                        fontWeight={900}
                        fill="#ffffff"
                        className="font-display"
                    >
                        VIL
                    </text>
                    <text x={120} y={350} fontSize={32} fill="#e2e8f0">
                        det han ønsker selv
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: vil ? 1 : 0 }}>
                    <text x={120} y={560} fontSize={40} fontWeight={800} fill="#ffffff">
                        være usynlig,
                    </text>
                    <text x={120} y={610} fontSize={40} fontWeight={800} fill="#ffffff">
                        være i fred
                    </text>
                </motion.g>

                {/* Tauet mot lyset (trenger) */}
                <motion.line
                    x1={eliasX + 40}
                    y1={470}
                    x2={1430}
                    y2={470}
                    stroke="#92400e"
                    strokeWidth={10}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: trenger ? 1 : 0, x1: eliasX + 40 }}
                />
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }}>
                    <text
                        x={1480}
                        y={300}
                        fontSize={64}
                        fontWeight={900}
                        fill="#78350f"
                        textAnchor="end"
                        className="font-display"
                    >
                        TRENGER
                    </text>
                    <text x={1480} y={350} fontSize={32} fill="#92400e" textAnchor="end">
                        det han egentlig mangler
                    </text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: trenger ? 1 : 0 }}>
                    <text
                        x={1480}
                        y={560}
                        fontSize={40}
                        fontWeight={800}
                        fill="#78350f"
                        textAnchor="end"
                    >
                        bli sett for
                    </text>
                    <text
                        x={1480}
                        y={610}
                        fontSize={40}
                        fontWeight={800}
                        fill="#78350f"
                        textAnchor="end"
                    >
                        den han er
                    </text>
                </motion.g>

                {/* Elias i midten */}
                <motion.g
                    animate={{ x: eliasX - 800 }}
                    transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                >
                    <Person x={800} y={600} r={70} farge="#b91c1c" />
                    {spenning && (
                        <motion.g
                            animate={{ x: [-4, 4, -4] }}
                            transition={{ repeat: Infinity, duration: 0.25 }}
                        >
                            <Fjaer fra={690} til={910} y={680} strekk={spenning} />
                        </motion.g>
                    )}
                </motion.g>
            </svg>
        </div>
    );
}
