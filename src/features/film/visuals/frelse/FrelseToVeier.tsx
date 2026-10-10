import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Boble, Figur, Flate, Tekst } from './felles';

/**
 * To svar side om side.
 * - `start`: presten med gaven som kommer ovenfra, og munken som jobber med seg selv.
 * - `problem`: hva mennesket skal bli fri fra: skyld (en tung bør) eller kretsløpet.
 */

interface Props {
    modus?: 'start' | 'problem';
}

/** En gave med sløyfe. */
function Gave({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-50} y={-40} width={100} height={80} rx={8} fill="#6366f1" />
            <rect x={-10} y={-40} width={20} height={80} fill="#fde68a" />
            <rect x={-50} y={-8} width={100} height={16} fill="#fde68a" />
            <path d="M 0 -40 C -30 -80 -50 -50 0 -40 C 50 -50 30 -80 0 -40" fill="#fbbf24" />
        </g>
    );
}

function Start({ beat }: { beat: number }) {
    const munk = beat >= 2;
    return (
        <>
            {/* Venstre: kirken */}
            <rect x={60} y={60} width={700} height={720} rx={28} fill="#e0e7ff" />
            <path d="M 260 640 L 260 400 L 410 290 L 560 400 L 560 640 Z" fill="#c7d2fe" />
            <rect x={400} y={210} width={20} height={90} fill="#a5b4fc" />
            <rect x={380} y={235} width={60} height={18} fill="#a5b4fc" />
            <Tekst x={410} y={130} str={40} farge="#3730a3">
                Presten
            </Tekst>
            <Figur x={410} y={720} farge="#1e1b4b" />
            {/* Strålen og gaven som kommer ovenfra */}
            <motion.path
                d="M 360 60 L 460 60 L 520 560 L 300 560 Z"
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 0.45 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <motion.g
                initial={{ y: -260, opacity: 0 }}
                animate={{ y: beat >= 1 ? 0 : -260, opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
            >
                <Gave x={410} y={520} />
            </motion.g>
            <Boble x={410} y={330} b={560} tekst="Ingenting du kan gjøre" vis={beat === 0} />
            {/* Betaling krysses ut */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
            >
                <rect
                    x={560}
                    y={440}
                    width={150}
                    height={70}
                    rx={12}
                    fill="#fff"
                    stroke="#94a3b8"
                    strokeWidth={3}
                />
                <text
                    x={635}
                    y={488}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#475569"
                >
                    betale?
                </text>
                <path
                    d="M 565 445 L 705 505 M 705 445 L 565 505"
                    stroke="#dc2626"
                    strokeWidth={9}
                    strokeLinecap="round"
                />
            </motion.g>

            {/* Høyre: munken */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: munk ? 1 : 0.15 }}
                transition={{ duration: 0.8 }}
            >
                <rect x={840} y={60} width={700} height={720} rx={28} fill="#fef3c7" />
                <Tekst x={1190} y={130} str={40} farge="#92400e">
                    Munken
                </Tekst>
                <Figur x={1190} y={700} farge="#c2410c" sitter />
                {/* Dagene som går: én sol per dag */}
                {Array.from({ length: 7 }, (_, i) => (
                    <motion.circle
                        key={i}
                        cx={950 + i * 80}
                        cy={250}
                        r={22}
                        fill="#f59e0b"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0 }}
                        transition={{ delay: beat >= 3 ? i * 0.45 : 0, duration: 0.3 }}
                    />
                ))}
                <Tekst x={1190} y={330} str={34} farge="#92400e" vis={beat >= 3}>
                    dag etter dag
                </Tekst>
                {/* Arbeidet inne i ham: en ring som fylles */}
                <motion.circle
                    cx={1190}
                    cy={560}
                    r={150}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={12}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 3 ? 1 : beat >= 2 ? 0.2 : 0 }}
                    transition={{ duration: beat >= 3 ? 3 : 1 }}
                    style={{ rotate: -90, transformOrigin: '1190px 560px' }}
                />
            </motion.g>

            {/* Spørsmålet i midten */}
            <motion.g
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: beat >= 4 ? 1 : 0, y: beat >= 4 ? 0 : 20 }}
                transition={{ duration: 0.6 }}
            >
                <rect x={450} y={790} width={700} height={90} rx={24} fill="#0f172a" />
                <text
                    x={800}
                    y={850}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#fff"
                >
                    Hvem gjør jobben?
                </text>
            </motion.g>
        </>
    );
}

function Problem({ beat }: { beat: number }) {
    return (
        <>
            <Tekst x={800} y={110} str={56}>
                Fri fra hva?
            </Tekst>
            {/* Venstre: skyld som en tung bør */}
            <rect x={80} y={170} width={680} height={560} rx={28} fill="#e0e7ff" />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0.15 }}
                transition={{ duration: 0.6 }}
            >
                <Figur x={420} y={660} farge="#1e1b4b" />
                <motion.g
                    initial={{ y: -200 }}
                    animate={{ y: beat >= 1 ? 0 : -200 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.3 }}
                >
                    <path
                        d="M 330 520 Q 420 380 510 520 Q 520 560 420 565 Q 320 560 330 520 Z"
                        fill="#475569"
                    />
                    <text
                        x={420}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fff"
                    >
                        skyld
                    </text>
                </motion.g>
                <Tekst x={420} y={250} str={42} farge="#3730a3" vis={beat >= 1}>
                    Kristne: synd og skyld
                </Tekst>
            </motion.g>

            {/* Høyre: kretsløpet */}
            <rect x={840} y={170} width={680} height={560} rx={28} fill="#fce7f3" />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0.15 }}
                transition={{ duration: 0.6 }}
            >
                <Tekst x={1180} y={250} str={42} farge="#9d174d" vis={beat >= 2}>
                    Født om og om igjen
                </Tekst>
                <circle cx={1180} cy={490} r={170} fill="none" stroke="#f9a8d4" strokeWidth={16} />
                <motion.g
                    animate={{ rotate: beat >= 2 ? 360 : 0 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '1180px 490px' }}
                >
                    <circle cx={1180} cy={320} r={22} fill="#be185d" />
                    <path d="M 1350 470 l 20 30 l 20 -30 Z" fill="#be185d" />
                    <path d="M 1010 510 l -20 -30 l -20 30 Z" fill="#be185d" />
                </motion.g>
                <text
                    x={1180}
                    y={500}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#9d174d"
                >
                    født · dør · født
                </text>
            </motion.g>

            {/* Ordet som ikke passer */}
            <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0.8 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                style={{ transformOrigin: '800px 810px' }}
            >
                <rect
                    x={430}
                    y={760}
                    width={740}
                    height={100}
                    rx={24}
                    fill="#fff"
                    stroke="#0f172a"
                    strokeWidth={4}
                />
                <text
                    x={800}
                    y={826}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    «Frelse»? Ordet passer ikke for alle
                </text>
            </motion.g>
        </>
    );
}

export function FrelseToVeier({ beat, props }: VisualProps<Props>) {
    return (
        <Flate>{props.modus === 'problem' ? <Problem beat={beat} /> : <Start beat={beat} />}</Flate>
    );
}
