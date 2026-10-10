import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Tekst } from './felles';

/**
 * De tre yngre trossamfunnene og mormonismens tre nivåer. Beat 0 viser hvor de tre kommer fra.
 * Så reiser alle de døde seg opp til et av tre nivåer (oppstandelsen er en gave), og til slutt
 * lyser det øverste nivået, opphøyelsen, med de fire kravene.
 */

const OPPHAV = [
    { navn: 'Mormonisme', fra: 'kristendommen', x: 330, farge: '#8b5cf6' },
    { navn: 'Jehovas vitner', fra: 'kristendommen', x: 800, farge: '#0ea5e9' },
    { navn: "Bahá'í", fra: 'sjia-islam', x: 1270, farge: '#14b8a6' },
];

const NIVA = [
    { navn: 'Opphøyelse', y: 210 },
    { navn: 'Andre nivå', y: 400 },
    { navn: 'Tredje nivå', y: 590 },
];

const KRAV = ['tro', 'dåp', 'holde budene', 'gifte seg i tempelet'];

function Opphav() {
    return (
        <>
            <Tekst x={800} y={120} str={52}>
                Tre yngre trossamfunn
            </Tekst>
            {OPPHAV.map((o, i) => (
                <motion.g
                    key={o.navn}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.7 }}
                >
                    <rect
                        x={o.x - 200}
                        y={560}
                        width={400}
                        height={130}
                        rx={26}
                        fill="#fff"
                        stroke="#cbd5e1"
                        strokeWidth={4}
                    />
                    <text
                        x={o.x}
                        y={642}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill="#475569"
                    >
                        {o.fra}
                    </text>
                    <path d={`M ${o.x} 555 L ${o.x} 400`} stroke={o.farge} strokeWidth={10} />
                    <path d={`M ${o.x - 22} 420 L ${o.x} 385 L ${o.x + 22} 420 Z`} fill={o.farge} />
                    <rect x={o.x - 200} y={240} width={400} height={130} rx={26} fill={o.farge} />
                    <text
                        x={o.x}
                        y={322}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fff"
                    >
                        {o.navn}
                    </text>
                </motion.g>
            ))}
            <Tekst x={800} y={800} str={34} farge="#64748b" forsinkelse={2.5}>
                vokste fram fra
            </Tekst>
        </>
    );
}

function Nivaer({ beat }: { beat: number }) {
    // Hvor mange som ender på hvert nivå (bare en tegning, ikke tall fra virkeligheten).
    const folk = [0, 0, 1, 1, 1, 2, 2, 2, 2];
    const oppe = beat >= 2;
    return (
        <>
            <Tekst x={560} y={90} str={46} farge="#5b21b6">
                {beat >= 3 ? 'Helt til topps: opphøyelse' : 'Alle står opp, på tre nivåer'}
            </Tekst>
            {NIVA.map((n, i) => (
                <g key={n.navn}>
                    <motion.rect
                        x={140}
                        y={n.y}
                        width={840}
                        height={130}
                        rx={20}
                        initial={false}
                        animate={{ fill: beat >= 3 && i === 0 ? '#fde68a' : '#ede9fe' }}
                        transition={{ duration: 0.6 }}
                    />
                    <text x={170} y={n.y + 50} fontSize={30} fontWeight={800} fill="#5b21b6">
                        {n.navn}
                    </text>
                </g>
            ))}
            {/* Bakken der de døde ligger */}
            <rect x={140} y={790} width={840} height={70} rx={14} fill="#a8a29e" />
            <text x={560} y={837} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fff">
                de døde
            </text>
            {folk.map((niva, i) => {
                const x = 420 + (i % 5) * 110 + (niva === 0 ? 0 : (i % 2) * 40);
                const mal = NIVA[niva].y + 125;
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ y: oppe ? mal - 790 : 0, opacity: oppe || beat >= 1 ? 1 : 0.4 }}
                        transition={{ duration: 1.6, delay: oppe ? i * 0.12 : 0, ease: 'easeOut' }}
                    >
                        <Figur x={x} y={790} farge="#6d28d9" skala={0.55} />
                    </motion.g>
                );
            })}
            {/* Gaven: pila opp */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <rect
                    x={1060}
                    y={380}
                    width={440}
                    height={170}
                    rx={26}
                    fill="#fff"
                    stroke="#8b5cf6"
                    strokeWidth={5}
                />
                <text
                    x={1280}
                    y={450}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#5b21b6"
                >
                    Oppstandelsen
                </text>
                <text
                    x={1280}
                    y={505}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#475569"
                >
                    en gave alle får
                </text>
            </motion.g>
            {/* Kravene for toppen */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <text x={1060} y={250} fontSize={36} fontWeight={900} fill="#0f172a">
                    Du må:
                </text>
                {KRAV.map((k, i) => (
                    <motion.g
                        key={k}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: beat >= 3 ? 1 : 0, x: beat >= 3 ? 0 : 30 }}
                        transition={{ delay: 0.3 + i * 0.7 }}
                    >
                        <rect
                            x={1060}
                            y={290 + i * 120}
                            width={470}
                            height={96}
                            rx={20}
                            fill="#fff"
                            stroke="#f59e0b"
                            strokeWidth={4}
                        />
                        <path
                            d={`M ${1090} ${338 + i * 120} l 16 18 l 30 -36`}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth={9}
                            strokeLinecap="round"
                        />
                        <text
                            x={1150}
                            y={351 + i * 120}
                            fontSize={36}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {k}
                        </text>
                    </motion.g>
                ))}
            </motion.g>
        </>
    );
}

export function FrelseNivaer({ beat }: VisualProps) {
    return <Flate bakgrunn="#f5f3ff">{beat === 0 ? <Opphav /> : <Nivaer beat={beat} />}</Flate>;
}
