import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Tekst } from './felles';

/**
 * Islam: vekten på dommens dag. Gode og dårlige handlinger legges i hver sin skål, men over
 * vekten lyser barmhjertigheten, og til slutt er det Gud som har det siste ordet.
 */

const MX = 800;
const TOPP = 300;

function Skal({
    x,
    y,
    farge,
    lodd,
    etikett,
}: {
    x: number;
    y: number;
    farge: string;
    lodd: number;
    etikett: string;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <line x1={-110} y1={170} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
            <line x1={110} y1={170} x2={0} y2={0} stroke="#78716c" strokeWidth={4} />
            {Array.from({ length: lodd }, (_, i) => (
                <motion.rect
                    key={i}
                    x={-90 + (i % 4) * 46}
                    y={130 - Math.floor(i / 4) * 40}
                    width={40}
                    height={36}
                    rx={6}
                    fill={farge}
                    initial={{ opacity: 0, translateY: -200 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: i * 0.22, type: 'spring', stiffness: 120, damping: 14 }}
                />
            ))}
            <path d="M -140 170 Q 0 240 140 170 Z" fill="#a8a29e" />
            <text x={0} y={290} textAnchor="middle" fontSize={34} fontWeight={800} fill={farge}>
                {etikett}
            </text>
        </g>
    );
}

export function FrelseVekt({ beat }: VisualProps) {
    const lodd = beat >= 2;
    const tilt = lodd ? -7 : 0;
    const armX = 360;
    const rad = (tilt * Math.PI) / 180;
    const vy = TOPP - Math.sin(rad) * armX;
    const hy = TOPP + Math.sin(rad) * armX;
    const vx = MX - Math.cos(rad) * armX;
    const hx = MX + Math.cos(rad) * armX;

    return (
        <Flate bakgrunn="#ecfdf5">
            <Tekst x={MX} y={95} str={54} farge="#065f46">
                {beat >= 3
                    ? 'Gud kalles Den barmhjertige'
                    : beat >= 1
                      ? 'Dommens dag'
                      : 'Islam: en vekt'}
            </Tekst>

            {/* Barmhjertigheten: et lys over vekten */}
            <motion.circle
                cx={MX}
                cy={215}
                r={85}
                fill="#fde68a"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: beat >= 3 ? 0.85 : 0, scale: beat >= 3 ? 1 : 0.6 }}
                transition={{ duration: 1 }}
                style={{ transformOrigin: `${MX}px 215px` }}
            />

            {/* Søylen og foten */}
            <rect x={MX - 14} y={TOPP} width={28} height={480} fill="#78716c" />
            <path
                d={`M ${MX - 160} 800 L ${MX + 160} 800 L ${MX + 90} 760 L ${MX - 90} 760 Z`}
                fill="#57534e"
            />

            {/* Armen og skålene */}
            <motion.line
                stroke="#57534e"
                strokeWidth={18}
                strokeLinecap="round"
                initial={false}
                animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                transition={{ type: 'spring', stiffness: 40, damping: 10 }}
            />
            <circle cx={MX} cy={TOPP} r={22} fill="#44403c" />
            <motion.g
                initial={false}
                animate={{ x: vx, y: vy }}
                transition={{ type: 'spring', stiffness: 40, damping: 10 }}
            >
                <Skal
                    x={0}
                    y={0}
                    farge="#059669"
                    lodd={lodd ? 7 : 0}
                    etikett="det gode du gjorde"
                />
            </motion.g>
            <motion.g
                initial={false}
                animate={{ x: hx, y: hy }}
                transition={{ type: 'spring', stiffness: 40, damping: 10 }}
            >
                <Skal
                    x={0}
                    y={0}
                    farge="#b91c1c"
                    lodd={lodd ? 5 : 0}
                    etikett="det gale du gjorde"
                />
            </motion.g>

            {/* Hver enkelt og fellesskapet */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <Figur x={180} y={800} farge="#065f46" skala={0.9} />
                <Tekst x={180} y={590} str={30} farge="#065f46">
                    hver enkelt
                </Tekst>
                {[0, 1, 2].map((i) => (
                    <Figur key={i} x={1340 + i * 80} y={800} farge="#047857" skala={0.7} />
                ))}
                <Tekst x={1420} y={620} str={30} farge="#065f46">
                    fellesskapet
                </Tekst>
            </motion.g>

            <Tekst x={MX} y={870} str={36} farge="#065f46" vis={beat === 2}>
                Riktige vektskåler: ingen skal lide urett
            </Tekst>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <rect x={MX - 330} y={815} width={660} height={76} rx={20} fill="#0f172a" />
                <text
                    x={MX}
                    y={866}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={900}
                    fill="#fde68a"
                >
                    Gud har det siste ordet
                </text>
            </motion.g>
        </Flate>
    );
}
