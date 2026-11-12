import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Etikett, Person } from './felles';
import { ADEL, B, BLEK, EMBETE, GULL, H, KIRKE, inn } from './felles2d';

/**
 * Hvem som har makten i Frankrike, som bilder i SVG. To moduser:
 * - barn: familien, Anna og Mazarin som styrer, embetsmennene og den sure adelen
 * - enevelde: Ludvig tar makten i 1661, pyramiden med Gud øverst, «Staten, det er jeg»
 */

type Modus = 'barn' | 'enevelde';

/* ---------------------------------------------------------------- barn */

function Barn({ beat }: { beat: number }) {
    const embetsmenn = useMemo(
        () => Array.from({ length: 22 }, (_, i) => ({ x: 170 + i * 58, y: 760 + (i % 2) * 18 })),
        []
    );
    const dimmet = beat >= 3 ? 0.35 : 1;
    return (
        <>
            <rect width={B} height={H} fill="#f8f1e3" />
            <motion.g animate={{ opacity: dimmet }}>
                {/* Faren */}
                <Person x={300} y={280} farge="#334155" krone opacity={beat === 0 ? 1 : 0.3} />
                <Etikett x={300} y={380} tekst="Faren: Ludvig 13." str={36} />
                {beat >= 1 && (
                    <motion.g {...inn}>
                        <Etikett x={300} y={130} tekst="død" farge={BLEK} str={34} />
                    </motion.g>
                )}
                {/* Gutten */}
                <Person x={640} y={560} farge="#1d4ed8" s={0.7} krone={beat >= 1} />
                <Etikett x={640} y={650} tekst="Ludvig, født 1638" str={36} />
                <line
                    x1={300}
                    y1={410}
                    x2={600}
                    y2={480}
                    stroke={BLEK}
                    strokeWidth={5}
                    strokeDasharray="10 10"
                />
                {beat >= 1 && (
                    <motion.g {...inn}>
                        <Etikett x={640} y={705} tekst="1643: konge" farge="#b45309" str={44} />
                    </motion.g>
                )}
                {/* Anna og Mazarin, som styrer */}
                {beat >= 2 && (
                    <motion.g {...inn} animate={{ opacity: beat >= 4 ? 0 : 1, scale: 1 }}>
                        <Person x={1010} y={420} farge="#be185d" />
                        <Etikett x={1010} y={520} tekst="Anna, moren" str={36} />
                        <Person x={1330} y={420} farge={KIRKE} />
                        <path
                            d="M 1300 352 L 1330 322 L 1360 352 Z"
                            fill={KIRKE}
                            stroke="#1e293b"
                            strokeWidth={4}
                        />
                        <Etikett x={1330} y={520} tekst="Kardinal Mazarin" str={36} />
                        <Etikett x={1170} y={250} tekst="De styrer" farge={KIRKE} str={50} />
                        <path
                            d="M 900 470 Q 800 470 740 530"
                            stroke={KIRKE}
                            strokeWidth={7}
                            fill="none"
                            strokeDasharray="14 10"
                        />
                    </motion.g>
                )}
            </motion.g>
            {beat >= 3 && (
                <motion.g {...inn}>
                    {embetsmenn.map((e, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Person x={e.x} y={e.y} farge={EMBETE} s={0.42} />
                        </motion.g>
                    ))}
                    <Etikett
                        x={800}
                        y={860}
                        tekst="Embetsmenn: styrer landet for kongen"
                        farge={EMBETE}
                        str={42}
                    />
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g {...inn}>
                    <rect
                        x={1060}
                        y={90}
                        width={500}
                        height={440}
                        rx={30}
                        fill="#ede9fe"
                        stroke={ADEL}
                        strokeWidth={6}
                    />
                    {[0, 1, 2].map((i) => (
                        <Person key={i} x={1180 + i * 130} y={300} farge={ADEL} s={0.85} />
                    ))}
                    <Etikett x={1310} y={170} tekst="Adelen" farge={ADEL} str={54} />
                    <Etikett x={1310} y={430} tekst="hertuger og grever" str={34} />
                    <Etikett x={1310} y={490} tekst="Vil bestemme selv!" farge={KIRKE} str={38} />
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------- enevelde */

function Enevelde({ beat }: { beat: number }) {
    const folk = useMemo(
        () =>
            Array.from({ length: 48 }, (_, i) => {
                const rad = Math.floor(i / 16);
                return { x: 520 + (i % 16) * 38 + (rad % 2) * 19, y: 720 + rad * 46 };
            }),
        []
    );
    if (beat <= 1)
        return (
            <>
                <rect width={B} height={H} fill="#f8f1e3" />
                <Etikett x={800} y={140} tekst="1661" farge="#b45309" str={110} />
                <Person x={470} y={560} farge="#1d4ed8" s={1.5} krone />
                <Etikett x={470} y={720} tekst="Ludvig, 22 år" str={44} />
                <Etikett x={470} y={780} tekst="vil styre selv" farge="#b45309" str={38} />
                <motion.g animate={{ opacity: beat === 0 ? 1 : 0 }}>
                    <Person x={1130} y={450} farge={KIRKE} opacity={0.4} />
                    <Etikett x={1130} y={560} tekst="Mazarin dør" farge={BLEK} str={38} />
                </motion.g>
                {beat >= 1 && (
                    <>
                        <motion.g {...inn}>
                            <Person x={1000} y={470} farge="#475569" s={0.9} />
                            {[-60, -30, 0, 30, 60].map((dx) => (
                                <rect
                                    key={dx}
                                    x={1000 + dx - 5}
                                    y={330}
                                    width={10}
                                    height={190}
                                    fill="#1e293b"
                                />
                            ))}
                            <rect x={925} y={320} width={150} height={14} fill="#1e293b" />
                            <Etikett
                                x={1000}
                                y={590}
                                tekst="Fouquet: fengsel på livstid"
                                str={34}
                            />
                        </motion.g>
                        <motion.g
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{ scale: 0.6, opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1.4 }}
                            style={{ transformOrigin: '1380px 470px' }}
                        >
                            <rect
                                x={1270}
                                y={380}
                                width={220}
                                height={170}
                                rx={16}
                                fill="#e2e8f0"
                                stroke="#475569"
                                strokeWidth={6}
                            />
                            <path
                                d="M 1260 380 L 1380 320 L 1500 380 Z"
                                fill="#cbd5e1"
                                stroke="#475569"
                                strokeWidth={6}
                            />
                        </motion.g>
                        <motion.g {...inn} transition={{ delay: 1.8 }}>
                            <Etikett x={1380} y={660} tekst="Parlamentet: svakere" str={34} />
                        </motion.g>
                    </>
                )}
            </>
        );
    return (
        <>
            <rect width={B} height={H} fill="#1e1b4b" />
            {/* Pyramiden: Gud, kongen, alle andre */}
            <motion.g animate={{ opacity: beat === 3 ? 0.35 : 1 }}>
                <g>
                    {Array.from({ length: 9 }, (_, i) => (
                        <line
                            key={i}
                            x1={800}
                            y1={110}
                            x2={800 + Math.cos((i / 8) * Math.PI) * 260}
                            y2={110 + Math.sin((i / 8) * Math.PI) * 120}
                            stroke="#fde68a"
                            strokeWidth={5}
                            opacity={0.6}
                        />
                    ))}
                    <Etikett x={800} y={125} tekst="GUD" farge="#78350f" str={60} />
                </g>
                <motion.path
                    d="M 800 250 L 800 380"
                    stroke="#fde68a"
                    strokeWidth={10}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
                <Person x={800} y={520} farge="#1d4ed8" s={1.1} krone />
                {beat < 3 && (
                    <Etikett x={800} y={620} tekst="KONGEN: all makt" farge="#b45309" str={48} />
                )}
                {folk.map((f, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.02 }}
                    >
                        <Person x={f.x} y={f.y + 40} farge="#64748b" s={0.3} />
                    </motion.g>
                ))}
                <Etikett
                    x={1310}
                    y={800}
                    tekst="alle andre"
                    farge="#334155"
                    str={36}
                    anker="start"
                />
            </motion.g>
            {beat === 2 && (
                <motion.g {...inn}>
                    <Etikett
                        x={60}
                        y={380}
                        tekst="Eneveldet:"
                        farge="#1e1b4b"
                        str={50}
                        anker="start"
                    />
                    <Etikett
                        x={60}
                        y={440}
                        tekst="én har all makt"
                        farge="#1e1b4b"
                        str={38}
                        anker="start"
                    />
                    <Etikett
                        x={60}
                        y={490}
                        tekst="og svarer bare til Gud"
                        farge="#1e1b4b"
                        str={38}
                        anker="start"
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g {...inn}>
                    <rect
                        x={200}
                        y={300}
                        width={1200}
                        height={260}
                        rx={40}
                        fill="#0f172a"
                        stroke={GULL}
                        strokeWidth={6}
                    />
                    <text
                        x={800}
                        y={460}
                        textAnchor="middle"
                        fontSize={96}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        «Staten, det er jeg.»
                    </text>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                    >
                        <rect x={520} y={600} width={560} height={80} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={655}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill={KIRKE}
                        >
                            Sa han det? Ingen vet.
                        </text>
                    </motion.g>
                </motion.g>
            )}
        </>
    );
}

export function SolkongenMakt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'barn';
    return (
        <div className="absolute inset-0 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'barn' && <Barn beat={beat} />}
                {modus === 'enevelde' && <Enevelde beat={beat} />}
            </svg>
        </div>
    );
}
