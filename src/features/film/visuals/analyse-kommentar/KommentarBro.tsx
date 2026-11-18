import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate16x9, Kort, Kryss, SKRIFT } from './felles';

/**
 * Broen metaforen bygger: egenskaper fra bildet (sirkuset, Botox) flyttes over til saken
 * (forhandlingene, tekster skrevet av maskin). Patos-modusen viser leseren som blir truffet
 * i hjertet, mens veien til hodet (bevisene) står ubrukt.
 */

type Modus = 'sirkus' | 'botox' | 'patos';

const BAK = 'radial-gradient(ellipse at 50% 35%, #1e3a5f 0%, #0b1324 80%)';

function Tekst({
    x,
    y,
    tekst,
    fs = 40,
    farge = '#f8fafc',
    vekt = 800,
}: {
    x: number;
    y: number;
    tekst: string;
    fs?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={fs}
            fontWeight={vekt}
            fill={farge}
            fontFamily={SKRIFT}
        >
            {tekst}
        </text>
    );
}

/** En pil som tegnes opp. */
function Pil({
    d,
    farge,
    forsinkelse = 0,
    bredde = 10,
}: {
    d: string;
    farge: string;
    forsinkelse?: number;
    bredde?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: forsinkelse, ease: 'easeInOut' }}
        />
    );
}

/* ---------------- Sirkuset ---------------- */

function Telt({ x }: { x: number }) {
    const striper = [0, 1, 2, 3, 4, 5];
    return (
        <g>
            {/* Veggene */}
            {striper.map((i) => (
                <rect
                    key={i}
                    x={x - 150 + i * 50}
                    y={430}
                    width={50}
                    height={210}
                    fill={i % 2 === 0 ? '#dc2626' : '#fef2f2'}
                />
            ))}
            {/* Inngangen */}
            <path d={`M ${x - 45} 640 L ${x} 520 L ${x + 45} 640 Z`} fill="#1e1b4b" />
            {/* Taket */}
            <path d={`M ${x - 180} 440 L ${x} 270 L ${x + 180} 440 Z`} fill="#fbbf24" />
            <path d={`M ${x - 60} 440 L ${x} 270 L ${x + 60} 440 Z`} fill="#dc2626" />
            {/* Flagget */}
            <line x1={x} y1={270} x2={x} y2={215} stroke="#e2e8f0" strokeWidth={5} />
            <path d={`M ${x} 215 L ${x + 48} 228 L ${x} 242 Z`} fill="#22c55e" />
        </g>
    );
}

function Mote({ x, aktiv }: { x: number; aktiv: boolean }) {
    const stoler = [
        [-170, 0],
        [170, 0],
        [-80, -85],
        [80, -85],
        [-80, 85],
        [80, 85],
    ];
    return (
        <g>
            {aktiv && <ellipse cx={x} cy={540} rx={250} ry={150} fill="#fbbf24" opacity={0.18} />}
            {stoler.map(([dx, dy], i) => (
                <circle key={i} cx={x + dx} cy={540 + dy} r={30} fill="#64748b" />
            ))}
            <ellipse cx={x} cy={540} rx={170} ry={90} fill="#92400e" />
            <ellipse cx={x} cy={532} rx={160} ry={80} fill="#b45309" />
            {/* Papirer og en myntstabel på bordet */}
            <rect x={x - 110} y={505} width={70} height={46} rx={4} fill="#f8fafc" />
            <rect x={x + 40} y={500} width={70} height={46} rx={4} fill="#f8fafc" />
            {[0, 1, 2].map((i) => (
                <ellipse
                    key={i}
                    cx={x}
                    cy={548 - i * 9}
                    rx={24}
                    ry={9}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={2}
                />
            ))}
        </g>
    );
}

function Sirkus({ beat }: { beat: number }) {
    const flyttet = beat >= 3;
    return (
        <>
            <Kort
                x={800}
                y={36}
                linjer={['«Budsjettforhandlingene er et sirkus»']}
                fs={44}
                fyll="#fef3c7"
            />
            <Telt x={380} />
            <Tekst x={380} y={720} tekst="Sirkus" fs={44} farge="#fbbf24" />
            <Mote x={1220} aktiv={beat === 1 || beat >= 4} />
            <Tekst x={1220} y={760} tekst="Budsjettforhandlingene" fs={40} />
            {beat === 1 && (
                <Kort
                    x={1220}
                    y={250}
                    linjer={['Politikerne skal bli enige om', 'hva pengene skal brukes til']}
                    fs={36}
                    fyll="#e2e8f0"
                />
            )}
            {beat >= 3 && <Pil d="M 560 470 Q 800 330 1030 470" farge="#fbbf24" />}
            {beat >= 3 && <path d="M 1030 470 l -40 -4 l 22 -32 Z" fill="#fbbf24" />}
            {beat >= 2 &&
                [
                    { ord: 'kaos', x: 275 },
                    { ord: 'tull', x: 485 },
                ].map((o, i) => (
                    <motion.g
                        key={o.ord}
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: flyttet ? 840 : 0 }}
                        transition={{
                            duration: flyttet ? 1.4 : 0.5,
                            delay: flyttet ? 0.4 + i * 0.25 : i * 0.4,
                        }}
                    >
                        <Kort
                            x={o.x}
                            y={170}
                            linjer={[o.ord]}
                            fs={44}
                            fyll="#f97316"
                            farge="#ffffff"
                        />
                    </motion.g>
                ))}
            {beat >= 4 && (
                <Kort
                    x={800}
                    y={240}
                    linjer={['Sagt uten å si det']}
                    fs={38}
                    fyll="#22c55e"
                    farge="#052e16"
                />
            )}
        </>
    );
}

/* ---------------- Botox ---------------- */

function Kalkulator({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 60} y={y - 80} width={120} height={160} rx={14} fill="#94a3b8" />
            <rect x={x - 45} y={y - 65} width={90} height={34} rx={5} fill="#d9f99d" />
            {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={x - 45 + c * 32}
                        y={y - 20 + r * 30}
                        width={24}
                        height={22}
                        rx={4}
                        fill="#475569"
                    />
                ))
            )}
        </g>
    );
}

function Assistent({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <circle cx={x} cy={y - 40} r={36} fill="#94a3b8" />
            <path
                d={`M ${x - 65} ${y + 80} Q ${x - 65} ${y + 5} ${x} ${y + 5} Q ${x + 65} ${y + 5} ${x + 65} ${y + 80} Z`}
                fill="#94a3b8"
            />
        </g>
    );
}

/** En panne med rynker: ikonet for Botox. */
function Panne({ x, y, glatt = false }: { x: number; y: number; glatt?: boolean }) {
    return (
        <g>
            <ellipse cx={x} cy={y} rx={95} ry={80} fill="#f2c6a8" />
            {!glatt &&
                [-30, 0, 30].map((dy) => (
                    <path
                        key={dy}
                        d={`M ${x - 55} ${y + dy - 20} Q ${x} ${y + dy - 34} ${x + 55} ${y + dy - 20}`}
                        fill="none"
                        stroke="#b07a5c"
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                ))}
            {/* Øyenbrynene */}
            <path
                d={`M ${x - 60} ${y + 45} Q ${x - 35} ${y + 35} ${x - 12} ${y + 45}`}
                fill="none"
                stroke="#5b3a29"
                strokeWidth={7}
                strokeLinecap="round"
            />
            <path
                d={`M ${x + 12} ${y + 45} Q ${x + 35} ${y + 35} ${x + 60} ${y + 45}`}
                fill="none"
                stroke="#5b3a29"
                strokeWidth={7}
                strokeLinecap="round"
            />
        </g>
    );
}

function Ark({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 85} y={y - 105} width={170} height={210} rx={8} fill="#f8fafc" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect
                    key={i}
                    x={x - 60}
                    y={y - 75 + i * 28}
                    width={i === 5 ? 70 : 120}
                    height={10}
                    rx={5}
                    fill="#94a3b8"
                />
            ))}
        </g>
    );
}

function Botox({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Kort
                    x={800}
                    y={60}
                    linjer={['Hvorfor akkurat dette bildet?']}
                    fs={46}
                    fyll="#fef3c7"
                />
                {[
                    { x: 360, navn: 'Kalkulator', ikon: <Kalkulator x={360} y={430} /> },
                    { x: 800, navn: 'Assistent', ikon: <Assistent x={800} y={430} /> },
                    { x: 1240, navn: 'Botox', ikon: <Panne x={1240} y={430} /> },
                ].map((k, i) => (
                    <motion.g
                        key={k.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.4, duration: 0.5 }}
                    >
                        <rect
                            x={k.x - 170}
                            y={290}
                            width={340}
                            height={360}
                            rx={24}
                            fill="#ffffff"
                            opacity={0.08}
                        />
                        {k.ikon}
                        <Tekst x={k.x} y={610} tekst={k.navn} fs={42} />
                    </motion.g>
                ))}
            </>
        );
    }
    return (
        <>
            <Kort
                x={800}
                y={40}
                linjer={['Metaforen flytter egenskapene']}
                fs={42}
                fyll="#fef3c7"
            />
            {/* Venstre: bildet */}
            <Panne x={380} y={260} />
            <Tekst x={380} y={385} tekst="Botox" fs={44} farge="#fbbf24" />
            {['kunstig', 'jålete', 'giftig'].map((o, i) => (
                <Kort
                    key={o}
                    x={380}
                    y={430 + i * 100}
                    linjer={[o]}
                    fs={40}
                    fyll="#fecaca"
                    forsinkelse={0.3 + i * 0.4}
                />
            ))}
            {/* Høyre: tekster skrevet av maskin */}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Pil d="M 560 520 L 990 520" farge="#fbbf24" forsinkelse={0.2} />
                    <path d="M 1010 520 l -40 -24 l 0 48 Z" fill="#fbbf24" />
                    <Ark x={1220} y={250} />
                    <Tekst x={1220} y={400} tekst="Tekst skrevet av maskin" fs={36} />
                    <Kort
                        x={1220}
                        y={430}
                        linjer={['kanskje pen, uten grammatikkfeil']}
                        fs={34}
                        fyll="#bbf7d0"
                        forsinkelse={0.8}
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <Kort
                    x={1220}
                    y={560}
                    linjer={['Skribenten: død inni,', 'mangler sjel og varme']}
                    fs={38}
                    fyll="#dc2626"
                    farge="#ffffff"
                    forsinkelse={0.2}
                />
            )}
        </>
    );
}

/* ---------------- Patos ---------------- */

function Patos({ beat }: { beat: number }) {
    const hx = 1100;
    return (
        <>
            <Kort x={800} y={36} linjer={['Patos: å spille på følelsene']} fs={44} fyll="#fecaca" />
            {/* Metaforen */}
            <Panne x={330} y={420} />
            <Tekst x={330} y={545} tekst="KI = Botox" fs={42} farge="#fbbf24" />

            {/* Leseren */}
            <circle cx={hx} cy={290} r={95} fill="#cbd5e1" />
            <path
                d={`M ${hx - 170} 820 Q ${hx - 170} 410 ${hx} 410 Q ${hx + 170} 410 ${hx + 170} 820 Z`}
                fill="#cbd5e1"
            />
            {/* Øynene */}
            <circle cx={hx - 32} cy={295} r={10} fill="#0f172a" />
            <circle cx={hx + 32} cy={295} r={10} fill="#0f172a" />
            {/* Øyenbryn: rolige, så skeptiske fra beat 1 */}
            <motion.path
                animate={{
                    d:
                        beat >= 1
                            ? `M ${hx - 58} 262 L ${hx - 12} 274`
                            : `M ${hx - 58} 268 L ${hx - 12} 268`,
                }}
                stroke="#0f172a"
                strokeWidth={8}
                strokeLinecap="round"
                transition={{ duration: 0.5 }}
            />
            <motion.path
                animate={{
                    d:
                        beat >= 1
                            ? `M ${hx + 12} 258 L ${hx + 58} 246`
                            : `M ${hx + 12} 268 L ${hx + 58} 268`,
                }}
                stroke="#0f172a"
                strokeWidth={8}
                strokeLinecap="round"
                transition={{ duration: 0.5 }}
            />
            {/* Hjertet */}
            <circle cx={hx} cy={560} r={78} fill="#ef4444" opacity={0.25}>
                <animate attributeName="r" values="62;84;62" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <path
                d={`M ${hx} 600 C ${hx - 70} 550 ${hx - 55} 500 ${hx - 25} 500 C ${hx - 10} 500 ${hx} 512 ${hx} 524 C ${hx} 512 ${hx + 10} 500 ${hx + 25} 500 C ${hx + 55} 500 ${hx + 70} 550 ${hx} 600 Z`}
                fill="#dc2626"
            />

            {/* Veien til hjertet */}
            <Pil d={`M 440 470 Q 700 560 ${hx - 90} 555`} farge="#ef4444" bredde={12} />
            <path d={`M ${hx - 80} 556 l -40 -22 l 2 46 Z`} fill="#ef4444" />
            <Tekst x={700} y={650} tekst="følelser" fs={40} farge="#fca5a5" />

            {beat === 1 && (
                <Kort
                    x={1400}
                    y={180}
                    linjer={['Skepsis:', 'du blir mistenksom']}
                    fs={34}
                    fyll="#fef3c7"
                />
            )}

            {/* Veien til hodet, som ikke brukes */}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <path
                        d={`M 430 360 Q 700 230 ${hx - 110} 290`}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={8}
                        strokeDasharray="18 14"
                    />
                    <Tekst x={640} y={225} tekst="bevis" fs={40} farge="#94a3b8" />
                    <Kryss x={740} y={212} r={20} />
                    <Kort
                        x={540}
                        y={740}
                        linjer={['Følelsen gjør jobben']}
                        fs={44}
                        fyll="#dc2626"
                        farge="#ffffff"
                        forsinkelse={0.5}
                    />
                </motion.g>
            )}
        </>
    );
}

export function KommentarBro({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sirkus';
    return (
        <Flate16x9 bakgrunn={BAK}>
            {modus === 'sirkus' && <Sirkus beat={beat} />}
            {modus === 'botox' && <Botox beat={beat} />}
            {modus === 'patos' && <Patos beat={beat} />}
        </Flate16x9>
    );
}
