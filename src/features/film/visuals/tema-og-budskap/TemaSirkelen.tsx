import { motion } from 'framer-motion';
import { Contrast, Flag, Gem, Heading, type LucideIcon } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Den hermeneutiske sirkelen, i to modus:
 * - sirkel: helheten i midten og delene rundt. En prikk går fram og tilbake mellom dem.
 * - spor: de fire sporene (tittel, start og slutt, kontraster, symboler) rundt temaet.
 */

type Modus = 'sirkel' | 'spor';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const CX = 800;
const CY = 470;

const DELER = [
    { tekst: 'Ordvalg', vinkel: -150 },
    { tekst: 'Titler', vinkel: -30 },
    { tekst: 'Kontraster', vinkel: 90 },
];
const R = 340;

const pos = (vinkel: number, r: number) => ({
    x: CX + Math.cos((vinkel * Math.PI) / 180) * r,
    y: CY + Math.sin((vinkel * Math.PI) / 180) * r * 0.82,
});

function Sirkel({ beat, playing }: { beat: number; playing: boolean }) {
    const helhetTekst = beat >= 3 ? 'Ny helhet' : 'Helheten';
    const fram = pos(DELER[1].vinkel, R - 150);
    return (
        <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {/* Ringen */}
            <ellipse
                cx={CX}
                cy={CY}
                rx={R}
                ry={R * 0.82}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth={8}
                strokeDasharray="22 16"
            />
            {[0, 120, 240].map((v) => {
                const p = pos(v - 60, R);
                const rot = v - 60 + 90;
                return (
                    <polygon
                        key={v}
                        points="0,-20 26,0 0,20"
                        fill="#8b5cf6"
                        transform={`translate(${p.x} ${p.y}) rotate(${rot})`}
                    />
                );
            })}
            {/* Linjer mellom helheten og delene */}
            {beat >= 3 &&
                DELER.map((d) => {
                    const p = pos(d.vinkel, R);
                    return (
                        <motion.line
                            key={d.tekst}
                            x1={CX}
                            y1={CY}
                            x2={p.x}
                            y2={p.y}
                            stroke="#7c3aed"
                            strokeWidth={5}
                            strokeOpacity={0.5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    );
                })}
            {beat >= 3 && (
                <motion.circle
                    r={18}
                    fill="#f59e0b"
                    initial={{ cx: CX, cy: CY }}
                    animate={
                        playing
                            ? { cx: [CX, fram.x, CX], cy: [CY, fram.y, CY] }
                            : { cx: CX, cy: CY }
                    }
                    transition={{
                        duration: 2.4,
                        repeat: playing ? Infinity : 0,
                        ease: 'easeInOut',
                    }}
                />
            )}
            <motion.g
                initial={false}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <circle cx={CX} cy={CY} r={130} fill={beat >= 1 ? '#7c3aed' : '#e2e8f0'} />
                <text
                    x={CX}
                    y={CY + 16}
                    textAnchor="middle"
                    fontSize={beat >= 3 ? 38 : 44}
                    fontWeight={900}
                    fill="#ffffff"
                    style={FONT}
                >
                    {helhetTekst}
                </text>
            </motion.g>
            {DELER.map((d, i) => {
                const p = pos(d.vinkel, R);
                return (
                    <motion.g
                        key={d.tekst}
                        initial={false}
                        animate={{ opacity: beat >= 2 ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: beat === 2 ? i * 0.6 : 0 }}
                    >
                        <rect
                            x={p.x - 140}
                            y={p.y - 44}
                            width={280}
                            height={88}
                            rx={44}
                            fill="#ffffff"
                            stroke="#7c3aed"
                            strokeWidth={4}
                        />
                        <text
                            x={p.x}
                            y={p.y + 14}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#4c1d95"
                            style={FONT}
                        >
                            {d.tekst}
                        </text>
                    </motion.g>
                );
            })}
            {beat < 4 && (
                <motion.text
                    key={beat}
                    x={CX}
                    y={84}
                    textAnchor="middle"
                    fontSize={42}
                    fontWeight={800}
                    fill="#1e293b"
                    style={FONT}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {
                        [
                            'Rundt i en sirkel',
                            'Les hele teksten én gang',
                            'Så detaljene',
                            'Fram og tilbake',
                        ][beat]
                    }
                </motion.text>
            )}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect x={CX - 400} y={34} width={800} height={86} rx={43} fill="#1e293b" />
                    <text
                        x={CX}
                        y={92}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#ffffff"
                        style={FONT}
                    >
                        Den hermeneutiske sirkelen
                    </text>
                </motion.g>
            )}
        </svg>
    );
}

const SPOR: { tekst: string; under: string; ikon: LucideIcon; x: number; y: number }[] = [
    { tekst: 'Tittelen', under: 'en gave fra forfatteren', ikon: Heading, x: 330, y: 250 },
    { tekst: 'Starten og slutten', under: 'konflikten og løsningen', ikon: Flag, x: 1270, y: 250 },
    { tekst: 'Kontraster', under: 'lys og mørke, rik og fattig', ikon: Contrast, x: 330, y: 690 },
    { tekst: 'Symboler', under: 'ting som betyr mer', ikon: Gem, x: 1270, y: 690 },
];

function Spor({ beat }: { beat: number }) {
    return (
        <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
        >
            {SPOR.map((s, i) => {
                const vist = beat >= i + 1;
                return vist ? (
                    <motion.line
                        key={`l${i}`}
                        x1={s.x}
                        y1={s.y}
                        x2={CX}
                        y2={CY}
                        stroke="#7c3aed"
                        strokeWidth={5}
                        strokeOpacity={0.45}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                ) : null;
            })}
            <circle cx={CX} cy={CY} r={120} fill="#7c3aed" />
            <text
                x={CX}
                y={CY + 16}
                textAnchor="middle"
                fontSize={46}
                fontWeight={900}
                fill="#ffffff"
                style={FONT}
            >
                Temaet
            </text>
            {SPOR.map((s, i) => {
                const vist = beat >= i + 1;
                const fokus = beat === i + 1;
                const Ikon = s.ikon;
                return (
                    <motion.g
                        key={s.tekst}
                        initial={false}
                        animate={{ opacity: vist ? 1 : 0.18 }}
                        transition={{ duration: 0.5 }}
                    >
                        <rect
                            x={s.x - 250}
                            y={s.y - 90}
                            width={500}
                            height={180}
                            rx={30}
                            fill="#ffffff"
                            stroke={fokus ? '#f59e0b' : '#c4b5fd'}
                            strokeWidth={fokus ? 8 : 4}
                        />
                        <Ikon
                            x={s.x - 220}
                            y={s.y - 62}
                            width={64}
                            height={64}
                            color="#7c3aed"
                            strokeWidth={2.2}
                        />
                        <text
                            x={s.x - 140}
                            y={s.y - 14}
                            fontSize={36}
                            fontWeight={900}
                            fill="#1e293b"
                            style={FONT}
                        >
                            {s.tekst}
                        </text>
                        <text
                            x={s.x - 140}
                            y={s.y + 38}
                            fontSize={28}
                            fontWeight={600}
                            fill="#64748b"
                            style={FONT}
                        >
                            {s.under}
                        </text>
                    </motion.g>
                );
            })}
            <text
                x={CX}
                y={84}
                textAnchor="middle"
                fontSize={42}
                fontWeight={800}
                fill="#1e293b"
                style={FONT}
            >
                Sporene som peker mot temaet
            </text>
        </svg>
    );
}

export function TemaSirkelen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sirkel';
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            {modus === 'sirkel' ? <Sirkel beat={beat} playing={playing} /> : <Spor beat={beat} />}
        </div>
    );
}
