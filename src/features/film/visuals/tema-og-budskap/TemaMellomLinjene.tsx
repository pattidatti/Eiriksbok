import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To sider ved siden av hverandre. Til venstre et eventyr der moralen står rett ut på
 * siste linje. Til høyre en moderne bok der budskapet bare skimtes mellom linjene, og
 * eleven må tolke selv.
 */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const SERIF = { fontFamily: 'Georgia, serif' };

const LINJER = [0.92, 0.86, 0.95, 0.8, 0.9, 0.7, 0.93, 0.84];

function Side({
    x,
    bakgrunn,
    kant,
    tittel,
}: {
    x: number;
    bakgrunn: string;
    kant: string;
    tittel: string;
}) {
    return (
        <g>
            <rect
                x={x}
                y={150}
                width={620}
                height={640}
                rx={18}
                fill={bakgrunn}
                stroke={kant}
                strokeWidth={4}
            />
            <text
                x={x + 310}
                y={120}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#1e293b"
                style={FONT}
            >
                {tittel}
            </text>
            {LINJER.map((b, i) => (
                <rect
                    key={i}
                    x={x + 50}
                    y={200 + i * 56}
                    width={520 * b}
                    height={14}
                    rx={7}
                    fill="#cbd5e1"
                />
            ))}
        </g>
    );
}

export function TemaMellomLinjene({ beat }: VisualProps) {
    const lupeX = beat >= 2 ? 1180 : 1300;
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Side x={110} bakgrunn="#fdf6e3" kant="#d6c08a" tittel="Eventyr og fabler" />
                <Side x={870} bakgrunn="#ffffff" kant="#cbd5e1" tittel="Moderne bok" />

                {/* Moralen, rett ut på siste linje */}
                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect x={150} y={660} width={540} height={90} rx={16} fill="#b45309" />
                    <text
                        x={420}
                        y={718}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#ffffff"
                        style={FONT}
                    >
                        Moralen sies rett ut
                    </text>
                </motion.g>

                {/* Budskapet skimtes mellom linjene */}
                <motion.text
                    x={1180}
                    y={416}
                    textAnchor="middle"
                    fontSize={30}
                    fontStyle="italic"
                    fill="#7c3aed"
                    style={SERIF}
                    initial={false}
                    animate={{ opacity: beat >= 2 ? (beat >= 4 ? 0.9 : 0.45) : 0 }}
                    transition={{ duration: 1.2 }}
                >
                    budskapet?
                </motion.text>
                <motion.g
                    initial={false}
                    animate={{ x: lupeX - 1300, opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                >
                    <circle
                        cx={1300}
                        cy={404}
                        r={78}
                        fill="#ede9fe"
                        fillOpacity={0.15}
                        stroke="#334155"
                        strokeWidth={10}
                    />
                    <line
                        x1={1356}
                        y1={460}
                        x2={1420}
                        y2={524}
                        stroke="#334155"
                        strokeWidth={18}
                        strokeLinecap="round"
                    />
                </motion.g>

                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 3 ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={910}
                        y={660}
                        width={540}
                        height={90}
                        rx={16}
                        fill="#ffffff"
                        stroke="#7c3aed"
                        strokeWidth={4}
                        strokeDasharray="14 10"
                    />
                    <text
                        x={1180}
                        y={718}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#7c3aed"
                        style={FONT}
                    >
                        Ingen fasit
                    </text>
                </motion.g>
                <motion.g
                    initial={false}
                    animate={{ opacity: beat >= 4 ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect x={870} y={810} width={620} height={70} rx={35} fill="#7c3aed" />
                    <text
                        x={1180}
                        y={857}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#ffffff"
                        style={FONT}
                    >
                        Du tolker og argumenterer
                    </text>
                </motion.g>
            </svg>
        </div>
    );
}
