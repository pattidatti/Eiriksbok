import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fornorsking og forsoning. Beat 0: samisk språk og kultur strykes og byttes ut med norsk.
 * Beat 1: tidslinja med kommisjonen (2018) og rapporten (2023). Beat 2: Kirkemøtet i 2024
 * og de 29 tiltakene, ett merke per tiltak. Beat 3: spørsmålet om hvem som eier trommene.
 */

const B = 1600;
const H = 900;

function Tromme({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse rx={46} ry={36} fill="#e9cf9f" stroke="#7c4a1e" strokeWidth={5} />
            <path d="M -30 0 L 30 0 M 0 -26 L 0 26" stroke="#9a3412" strokeWidth={3} />
            <circle cx={-14} cy={-12} r={5} fill="#9a3412" />
            <circle cx={14} cy={12} r={5} fill="#9a3412" />
        </g>
    );
}

/** Ett år på tidslinja, med en kort tekst under. */
function Aar({
    x,
    aar,
    tekst,
    fra,
    beat,
    playing,
}: {
    x: number;
    aar: string;
    tekst: string[];
    fra: number;
    beat: number;
    playing: boolean;
}) {
    const vis = beat >= fra;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ delay: playing && beat === fra ? 0.5 : 0 }}
        >
            <circle cx={x} cy={300} r={20} fill="#0f172a" stroke="#fff" strokeWidth={5} />
            <text x={x} y={250} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                {aar}
            </text>
            {tekst.map((t, i) => (
                <text
                    key={t}
                    x={x}
                    y={370 + i * 42}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#334155"
                >
                    {t}
                </text>
            ))}
        </motion.g>
    );
}

export function SamiskForsoning({ beat, playing }: VisualProps) {
    const d = (s: number) => (playing ? s : 0);
    return (
        <div className="absolute inset-0 bg-[#f7f3ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {beat === 0 ? (
                    <g>
                        <text
                            x={800}
                            y={130}
                            textAnchor="middle"
                            fontSize={72}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            Fornorsking
                        </text>
                        {[
                            { y: 330, fra: 'samisk språk', til: 'norsk språk' },
                            { y: 560, fra: 'samisk kultur', til: 'norsk kultur' },
                        ].map((r, i) => (
                            <g key={r.fra}>
                                <rect
                                    x={180}
                                    y={r.y - 90}
                                    width={540}
                                    height={150}
                                    rx={24}
                                    fill="#fef3c7"
                                    stroke="#b45309"
                                    strokeWidth={4}
                                />
                                <text
                                    x={450}
                                    y={r.y + 10}
                                    textAnchor="middle"
                                    fontSize={54}
                                    fontWeight={900}
                                    fill="#92400e"
                                >
                                    {r.fra}
                                </text>
                                <motion.line
                                    x1={210}
                                    y1={r.y - 5}
                                    x2={690}
                                    y2={r.y - 5}
                                    stroke="#dc2626"
                                    strokeWidth={12}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: d(0.8), delay: d(1 + i * 1.4) }}
                                />
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: d(1.6 + i * 1.4) }}
                                >
                                    <path
                                        d={`M 760 ${r.y - 15} L 840 ${r.y - 15}`}
                                        stroke="#475569"
                                        strokeWidth={10}
                                    />
                                    <path
                                        d={`M 840 ${r.y - 40} L 880 ${r.y - 15} L 840 ${r.y + 10} Z`}
                                        fill="#475569"
                                    />
                                    <rect
                                        x={920}
                                        y={r.y - 90}
                                        width={500}
                                        height={150}
                                        rx={24}
                                        fill="#e2e8f0"
                                        stroke="#475569"
                                        strokeWidth={4}
                                    />
                                    <text
                                        x={1170}
                                        y={r.y + 10}
                                        textAnchor="middle"
                                        fontSize={54}
                                        fontWeight={900}
                                        fill="#1e293b"
                                    >
                                        {r.til}
                                    </text>
                                </motion.g>
                            </g>
                        ))}
                        <text
                            x={800}
                            y={800}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={700}
                            fill="#475569"
                        >
                            motarbeidet og byttet ut
                        </text>
                    </g>
                ) : (
                    <g>
                        <line
                            x1={160}
                            y1={300}
                            x2={1440}
                            y2={300}
                            stroke="#94a3b8"
                            strokeWidth={8}
                            strokeLinecap="round"
                        />
                        <Aar
                            x={300}
                            aar="2018"
                            tekst={['Stortinget setter', 'ned en kommisjon']}
                            fra={1}
                            beat={beat}
                            playing={playing}
                        />
                        <Aar
                            x={800}
                            aar="2023"
                            tekst={['rapporten kommer']}
                            fra={1}
                            beat={beat}
                            playing={playing}
                        />
                        <Aar
                            x={1300}
                            aar="2024"
                            tekst={['Kirkemøtet: også', 'kirken var med']}
                            fra={2}
                            beat={beat}
                            playing={playing}
                        />
                        {beat >= 2 && (
                            <g>
                                {Array.from({ length: 29 }, (_, i) => {
                                    const kol = i % 15;
                                    const rad = Math.floor(i / 15);
                                    return (
                                        <motion.circle
                                            key={i}
                                            cx={490 + kol * 44}
                                            cy={540 + rad * 52}
                                            r={17}
                                            fill="#0d9488"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: beat === 3 ? 0.35 : 1 }}
                                            transition={{ delay: beat === 2 ? d(1 + i * 0.08) : 0 }}
                                        />
                                    );
                                })}
                                <text
                                    x={800}
                                    y={690}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#0f766e"
                                    opacity={beat === 3 ? 0.35 : 1}
                                >
                                    29 tiltak for forsoning
                                </text>
                            </g>
                        )}
                        {beat >= 3 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: d(0.4) }}
                            >
                                <rect
                                    x={470}
                                    y={720}
                                    width={660}
                                    height={130}
                                    rx={30}
                                    fill="#facc15"
                                />
                                <Tromme x={560} y={785} s={0.9} />
                                <text
                                    x={890}
                                    y={802}
                                    textAnchor="middle"
                                    fontSize={46}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    Hvem eier trommene?
                                </text>
                            </motion.g>
                        )}
                    </g>
                )}
            </svg>
        </div>
    );
}
