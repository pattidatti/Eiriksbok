import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Merke, Tekst } from './felles';

/**
 * Analysen: en side i en novelle med to lag. Øverst ligger motivet (det som skjer), under
 * ligger temaet (det teksten egentlig handler om). Lupa leter, og spørsmålene kommer etter tur.
 */

const B = 1600;
const H = 900;

const SPORSMAL = [
    { tekst: 'Hva er konflikten?', fraBeat: 3 },
    { tekst: 'Hvordan utvikler hovedpersonen seg?', fraBeat: 3 },
    { tekst: 'Hva sier teksten om det å være menneske?', fraBeat: 4 },
];

export function NovelleLupe({ beat }: VisualProps) {
    // Lupa flytter seg: midt på siden, opp til motivet, ned til temaet, så til tittelen.
    const lupe = [
        { x: 420, y: 470 },
        { x: 420, y: 370 },
        { x: 420, y: 640 },
        { x: 420, y: 640 },
        { x: 420, y: 200 },
    ][Math.min(beat, 4)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e9e1cf' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                <defs>
                    <clipPath id="nl-side">
                        <rect x={120} y={120} width={600} height={720} rx={14} />
                    </clipPath>
                </defs>

                {/* Siden */}
                <rect
                    x={120}
                    y={120}
                    width={600}
                    height={720}
                    rx={14}
                    fill="#ffffff"
                    stroke="#b8ab8c"
                    strokeWidth={3}
                />
                <g clipPath="url(#nl-side)">
                    {/* Tittel */}
                    <rect
                        x={200}
                        y={170}
                        width={440}
                        height={56}
                        rx={10}
                        fill={beat >= 4 ? '#fde68a' : '#f1f5f9'}
                        style={{ transition: 'fill 0.6s' }}
                    />
                    <text
                        x={420}
                        y={210}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Tittel
                    </text>
                    {/* Motivet: det som står i teksten */}
                    <rect
                        x={120}
                        y={260}
                        width={600}
                        height={240}
                        fill={beat === 1 ? '#ccfbf1' : '#ffffff'}
                        style={{ transition: 'fill 0.6s' }}
                    />
                    {Array.from({ length: 5 }, (_, i) => (
                        <rect
                            key={i}
                            x={170}
                            y={290 + i * 40}
                            width={420 + ((i * 53) % 80)}
                            height={12}
                            rx={6}
                            fill="#94a3b8"
                        />
                    ))}
                    {/* Temaet: laget under */}
                    <motion.rect
                        x={120}
                        y={520}
                        width={600}
                        height={320}
                        initial={false}
                        animate={{ fill: beat >= 2 ? '#1e3a5f' : '#f8fafc' }}
                        transition={{ duration: 0.8 }}
                    />
                    {beat < 2 &&
                        Array.from({ length: 6 }, (_, i) => (
                            <rect
                                key={i}
                                x={170}
                                y={550 + i * 40}
                                width={380 + ((i * 41) % 110)}
                                height={12}
                                rx={6}
                                fill="#cbd5e1"
                            />
                        ))}
                    {beat >= 2 && (
                        <Tekst
                            x={420}
                            y={700}
                            fs={110}
                            farge="#fbbf24"
                            vekt={900}
                            forsinkelse={0.5}
                        >
                            ?
                        </Tekst>
                    )}
                </g>

                {/* Lupa */}
                <motion.g
                    initial={false}
                    animate={{ x: lupe.x, y: lupe.y }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                >
                    <circle
                        cx={0}
                        cy={0}
                        r={95}
                        fill="#ffffff"
                        fillOpacity={0.15}
                        stroke="#334155"
                        strokeWidth={16}
                    />
                    <line
                        x1={68}
                        y1={68}
                        x2={150}
                        y2={150}
                        stroke="#334155"
                        strokeWidth={26}
                        strokeLinecap="round"
                    />
                </motion.g>

                {/* Høyre side: forklaringene */}
                {beat === 0 && (
                    <Merke
                        x={1170}
                        y={450}
                        tekst="To ting å lete etter"
                        fs={52}
                        fyll="#0f172a"
                        farge="#ffffff"
                    />
                )}
                {beat >= 1 && (
                    <g>
                        <Merke
                            x={1170}
                            y={200}
                            tekst="Motiv"
                            fs={56}
                            fyll="#0f766e"
                            farge="#ffffff"
                        />
                        <Tekst x={1170} y={290} fs={34} farge="#134e4a" vekt={700}>
                            det konkrete som skjer
                        </Tekst>
                    </g>
                )}
                {beat >= 2 && beat < 3 && (
                    <g>
                        <Merke
                            x={1170}
                            y={480}
                            tekst="Tema"
                            fs={56}
                            fyll="#1e3a5f"
                            farge="#ffffff"
                        />
                        <Tekst x={1170} y={570} fs={34} farge="#1e3a5f" vekt={700}>
                            det teksten egentlig handler om
                        </Tekst>
                    </g>
                )}
                {beat >= 3 && (
                    <g>
                        <Merke
                            x={1170}
                            y={400}
                            tekst="Tema: spør deg selv"
                            fs={44}
                            fyll="#1e3a5f"
                            farge="#ffffff"
                        />
                        {SPORSMAL.filter((s) => beat >= s.fraBeat).map((s, i) => (
                            <Merke
                                key={s.tekst}
                                x={1150}
                                y={500 + i * 95}
                                tekst={s.tekst}
                                fs={32}
                                fyll="#dbeafe"
                                farge="#0f172a"
                                forsinkelse={beat === s.fraBeat ? 0.3 + i * 0.5 : 0}
                            />
                        ))}
                    </g>
                )}
                {beat >= 4 && (
                    <Merke
                        x={1170}
                        y={800}
                        tekst="Tittelen gir ofte et hint"
                        fs={36}
                        fyll="#fde68a"
                        farge="#78350f"
                        forsinkelse={1.4}
                    />
                )}
            </svg>
        </div>
    );
}
