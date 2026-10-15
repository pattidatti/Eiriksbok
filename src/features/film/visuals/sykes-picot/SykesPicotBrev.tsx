import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De tre løftene britene ga, som tre brev på et bord. Beat 0: tre lukkede brev. Beat 1-3: ett brev
 * åpnes om gangen, med hvem det gikk til og hva det lovet. Beat 4: brevene løftes opp, og tre streker
 * møtes i det samme området: Palestina, lovet bort to ganger.
 */

const B = 1600;
const H = 900;

const BREV = [
    {
        år: '1915-16',
        fra: 'McMahon',
        til: 'Husain i Mekka',
        lofte: ['«Dere skal få', 'styre dere selv»'],
        farge: '#15803d',
        lys: '#dcfce7',
    },
    {
        år: '1916',
        fra: 'Sykes',
        til: 'Picot',
        lofte: ['«Vi deler', 'Midtøsten mellom oss»'],
        farge: '#1d4ed8',
        lys: '#dbeafe',
        hemmelig: true,
    },
    {
        år: '1917',
        fra: 'Balfour',
        til: 'Rothschild',
        lofte: ['«Et jødisk hjemland', 'i Palestina»'],
        farge: '#7c3aed',
        lys: '#ede9fe',
    },
];

const UNDERTEKST = ['Tre løfter fra britene', 'Til araberne', 'Til franskmennene', 'Til jødene'];

const KORT_B = 420;
const KORT_H = 470;
const MÅL: [number, number] = [800, 770];

export function SykesPicotBrev({ beat }: VisualProps) {
    const samlet = beat >= 4;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e7dcc6' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Treverket i bordet */}
                {Array.from({ length: 9 }, (_, i) => (
                    <line
                        key={i}
                        x1={0}
                        x2={B}
                        y1={60 + i * 100}
                        y2={70 + i * 100}
                        stroke="#d6c7a8"
                        strokeWidth={3}
                    />
                ))}

                {samlet && (
                    <>
                        {BREV.map((b, i) => (
                            <motion.path
                                key={b.fra}
                                d={`M ${100 + i * 480 + KORT_B / 2} 470 Q ${100 + i * 480 + KORT_B / 2} 680 ${MÅL[0]} ${MÅL[1] - 60}`}
                                fill="none"
                                stroke={b.farge}
                                strokeWidth={10}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, delay: 0.6 + i * 0.3 }}
                            />
                        ))}
                        <motion.g
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.9, type: 'spring', stiffness: 200, damping: 16 }}
                            style={{ transformOrigin: `${MÅL[0]}px ${MÅL[1]}px` }}
                        >
                            <rect
                                x={MÅL[0] - 330}
                                y={MÅL[1] - 64}
                                width={660}
                                height={128}
                                rx={28}
                                fill="#b91c1c"
                            />
                            <text
                                x={MÅL[0]}
                                y={MÅL[1] - 14}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                Det samme området
                            </text>
                            <text
                                x={MÅL[0]}
                                y={MÅL[1] + 38}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill="#fee2e2"
                            >
                                Palestina: lovet bort to ganger
                            </text>
                        </motion.g>
                    </>
                )}

                {BREV.map((b, i) => {
                    const apent = beat >= i + 1;
                    const aktiv = beat === i + 1;
                    const x = 100 + i * 480;
                    const y = samlet ? 40 : 170;
                    const skala = samlet ? 0.92 : aktiv ? 1.06 : 1;
                    return (
                        <motion.g
                            key={b.fra}
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.25, duration: 0.6 }}
                        >
                            <motion.g
                                initial={false}
                                animate={{ x: 0, y: y - 170, scale: skala }}
                                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                style={{
                                    transformOrigin: `${x + KORT_B / 2}px ${170 + KORT_H / 2}px`,
                                }}
                            >
                                <rect
                                    x={x + 8}
                                    y={178}
                                    width={KORT_B}
                                    height={KORT_H}
                                    rx={14}
                                    fill="#00000022"
                                />
                                <rect
                                    x={x}
                                    y={170}
                                    width={KORT_B}
                                    height={KORT_H}
                                    rx={14}
                                    fill={apent ? b.lys : '#fffbeb'}
                                    stroke={apent ? b.farge : '#a16207'}
                                    strokeWidth={aktiv ? 9 : 5}
                                    style={{ transition: 'fill 0.6s' }}
                                />
                                {!apent && (
                                    <>
                                        <path
                                            d={`M ${x} 170 L ${x + KORT_B / 2} 360 L ${x + KORT_B} 170`}
                                            fill="none"
                                            stroke="#a16207"
                                            strokeWidth={5}
                                        />
                                        <circle
                                            cx={x + KORT_B / 2}
                                            cy={360}
                                            r={34}
                                            fill="#991b1b"
                                        />
                                        <text
                                            x={x + KORT_B / 2}
                                            y={530}
                                            textAnchor="middle"
                                            fontSize={72}
                                            fontWeight={900}
                                            fill="#a16207"
                                        >
                                            {i + 1}
                                        </text>
                                    </>
                                )}
                                {apent && (
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <text
                                            x={x + KORT_B / 2}
                                            y={250}
                                            textAnchor="middle"
                                            fontSize={64}
                                            fontWeight={900}
                                            fill={b.farge}
                                        >
                                            {b.år}
                                        </text>
                                        <text
                                            x={x + KORT_B / 2}
                                            y={320}
                                            textAnchor="middle"
                                            fontSize={36}
                                            fontWeight={800}
                                            fill="#1f2937"
                                        >
                                            {b.fra}
                                        </text>
                                        <text
                                            x={x + KORT_B / 2}
                                            y={362}
                                            textAnchor="middle"
                                            fontSize={30}
                                            fontWeight={600}
                                            fill="#475569"
                                        >
                                            til {b.til}
                                        </text>
                                        <line
                                            x1={x + 50}
                                            x2={x + KORT_B - 50}
                                            y1={400}
                                            y2={400}
                                            stroke={b.farge}
                                            strokeWidth={4}
                                        />
                                        {b.lofte.map((linje, j) => (
                                            <text
                                                key={j}
                                                x={x + KORT_B / 2}
                                                y={468 + j * 50}
                                                textAnchor="middle"
                                                fontSize={38}
                                                fontWeight={800}
                                                fill="#111827"
                                            >
                                                {linje}
                                            </text>
                                        ))}
                                        {b.hemmelig && (
                                            <motion.g
                                                initial={{ opacity: 0, scale: 2 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    delay: 0.9,
                                                    type: 'spring',
                                                    stiffness: 260,
                                                    damping: 14,
                                                }}
                                                style={{
                                                    transformOrigin: `${x + KORT_B / 2}px 595px`,
                                                }}
                                            >
                                                <g transform={`rotate(-8 ${x + KORT_B / 2} 595)`}>
                                                    <rect
                                                        x={x + KORT_B / 2 - 110}
                                                        y={566}
                                                        width={220}
                                                        height={58}
                                                        rx={8}
                                                        fill="none"
                                                        stroke="#b91c1c"
                                                        strokeWidth={6}
                                                    />
                                                    <text
                                                        x={x + KORT_B / 2}
                                                        y={608}
                                                        textAnchor="middle"
                                                        fontSize={36}
                                                        fontWeight={900}
                                                        fill="#b91c1c"
                                                    >
                                                        HEMMELIG
                                                    </text>
                                                </g>
                                            </motion.g>
                                        )}
                                    </motion.g>
                                )}
                            </motion.g>
                        </motion.g>
                    );
                })}

                {beat <= 3 && (
                    <motion.text
                        key={beat}
                        x={beat === 0 ? B / 2 : 100 + (beat - 1) * 480 + KORT_B / 2}
                        y={780}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill="#1f2937"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        {UNDERTEKST[beat]}
                    </motion.text>
                )}
            </svg>
        </div>
    );
}
