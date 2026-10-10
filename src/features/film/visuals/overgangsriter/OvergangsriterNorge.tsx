import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Norge: andelen som konfirmeres i kirken har falt fra 93 til rundt 48 prosent, mens
 * 80,4 prosent av de døde fortsatt begraves i kirkens regi.
 */

const B = 1600;
const H = 900;
const BUNN = 760;
const SKALA = 5; // piksler per prosent

function Stolpe({
    x,
    prosent,
    tekst,
    aar,
    farge,
    vist,
    lys,
}: {
    x: number;
    prosent: number;
    tekst: string;
    aar: string;
    farge: string;
    vist: boolean;
    lys: boolean;
}) {
    const h = vist ? prosent * SKALA : 0;
    return (
        <motion.g
            initial={false}
            animate={{ opacity: lys ? 1 : 0.35 }}
            transition={{ duration: 0.5 }}
        >
            <rect
                x={x - 90}
                y={BUNN - 100 * SKALA}
                width={180}
                height={100 * SKALA}
                rx={14}
                fill="#e2e8f0"
            />
            <motion.rect
                x={x - 90}
                width={180}
                rx={14}
                fill={farge}
                initial={{ y: BUNN, height: 0 }}
                animate={{ y: BUNN - h, height: h }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.text
                x={x}
                textAnchor="middle"
                fontSize={58}
                fontWeight={900}
                fill="#0f172a"
                initial={{ opacity: 0, y: BUNN - 20 }}
                animate={{ opacity: vist ? 1 : 0, y: BUNN - h - 22 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
                {tekst}
            </motion.text>
            <text
                x={x}
                y={BUNN + 56}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#334155"
            >
                {aar}
            </text>
        </motion.g>
    );
}

export function OvergangsriterNorge({ beat }: VisualProps) {
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={800}
                    y={70}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Norge: kirken når livet begynner og slutter
                </text>
                <text
                    x={420}
                    y={160}
                    opacity={beat === 4 ? 0 : 1}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#4338ca"
                >
                    Femtenåringer konfirmert i kirken
                </text>
                <text
                    x={1250}
                    y={160}
                    opacity={beat === 4 ? 0 : 1}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#7c2d12"
                >
                    Døde begravet i kirkens regi
                </text>
                <line
                    x1={830}
                    y1={140}
                    x2={830}
                    y2={BUNN + 70}
                    stroke="#cbd5e1"
                    strokeWidth={4}
                    strokeDasharray="12 10"
                />
                <Stolpe
                    x={300}
                    prosent={93}
                    tekst="93 %"
                    aar="1960"
                    farge="#6366f1"
                    vist={beat >= 1}
                    lys={beat !== 3}
                />
                <Stolpe
                    x={540}
                    prosent={48}
                    tekst="ca. 48 %"
                    aar="2023"
                    farge="#6366f1"
                    vist={beat >= 2}
                    lys={beat !== 3}
                />
                <Stolpe
                    x={1250}
                    prosent={80.4}
                    tekst="80,4 %"
                    aar="2024"
                    farge="#b45309"
                    vist={beat >= 3}
                    lys={beat !== 2}
                />
                {beat >= 2 && (
                    <motion.path
                        d="M 395 320 C 440 340, 470 400, 480 470"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    />
                )}
            </svg>
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute"
                    style={{ left: '31%', top: '21%' }}
                >
                    <Teller
                        verdi={13800}
                        etikett="humanistisk konfirmasjon, 2022"
                        prefiks="ca. "
                        forsinkelse={1.4}
                    />
                </motion.div>
            )}
            {beat === 4 && (
                <div
                    className="absolute inset-x-0 flex justify-around"
                    style={{ top: '15%', paddingLeft: '4%', paddingRight: '4%' }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-5 py-3 rounded-2xl bg-indigo-600 text-white text-xl md:text-3xl font-display font-black shadow-xl whitespace-nowrap"
                    >
                        Færre når livet begynner
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="px-5 py-3 rounded-2xl bg-amber-700 text-white text-xl md:text-3xl font-display font-black shadow-xl whitespace-nowrap"
                    >
                        De fleste når det slutter
                    </motion.div>
                </div>
            )}
        </div>
    );
}
