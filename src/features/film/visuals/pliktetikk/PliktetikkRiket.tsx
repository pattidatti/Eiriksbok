import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Tekst, Vis } from './felles';

/**
 * Formålenes rike: en ring av mennesker rundt de felles lovene. Alle lager lovene og er bundet
 * av dem. Så trådene mellom dem: alle er mål, ingen bare middel. Til slutt blir ringen et
 * ideal, og du står utenfor og går mot den.
 */

const MX = 800;
const MY = 500;
const R = 300;
const N = 10;
const FARGER = ['#9f1239', '#1e40af', '#065f46', '#7c2d12', '#6d28d9', '#0e7490', '#b45309', '#334155', '#be185d', '#15803d'];

const PLASS = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: MX + Math.cos(a) * R * 1.45, y: MY + Math.sin(a) * R * 0.95 };
});

export function PliktetikkRiket({ beat }: VisualProps) {
    const ideal = beat >= 3;
    return (
        <Flate bakgrunn="#f0fdf4">
            <Tekst x={800} y={80} str={52} farge="#14532d">
                {['Formålenes rike', 'Alle lager lovene, alle følger dem', 'Alle er mål, aldri bare midler', 'Et ideal: handle som om vi var der'][Math.min(beat, 3)]}
            </Tekst>

            <motion.g initial={false} animate={{ opacity: ideal ? 0.35 : 1 }} transition={{ duration: 0.8 }}>
                {/* Trådene mellom alle */}
                {PLASS.map((a, i) =>
                    PLASS.slice(i + 1).map((b, j) => (
                        <motion.line
                            key={`${i}-${j}`}
                            x1={a.x}
                            y1={a.y - 60}
                            x2={b.x}
                            y2={b.y - 60}
                            stroke="#22c55e"
                            strokeWidth={3}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 2 ? 0.45 : 0 }}
                            transition={{ duration: 0.6, delay: beat >= 2 ? (i + j) * 0.04 : 0 }}
                        />
                    ))
                )}
                {/* Pilene til og fra lovene */}
                {PLASS.map((p, i) => (
                    <motion.line
                        key={i}
                        x1={p.x}
                        y1={p.y - 60}
                        x2={MX + (p.x - MX) * 0.3}
                        y2={MY + (p.y - 60 - MY) * 0.3}
                        stroke="#ca8a04"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat === 1 ? 1 : 0 }}
                        transition={{ duration: 0.7, delay: beat === 1 ? i * 0.1 : 0 }}
                    />
                ))}
                <motion.ellipse
                    cx={MX}
                    cy={MY}
                    rx={R * 1.45}
                    ry={R * 0.95}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth={6}
                    strokeDasharray={ideal ? '18 16' : '0'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
                {PLASS.map((p, i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}>
                        <Figur x={p.x} y={p.y + 40} farge={FARGER[i]} skala={0.7} />
                    </motion.g>
                ))}
                <Kort x={MX} y={MY} tekst="Felles lover" str={40} farge="#fefce8" kant="#ca8a04" tekstFarge="#713f12" vis={beat >= 1} />
            </motion.g>

            <Vis vis={beat === 2}>
                <Kort x={MX} y={MY + 90} tekst="Ingen lyver, stjeler eller utnytter" str={30} farge="#ffffff" kant="#86efac" tekstFarge="#14532d" />
            </Vis>

            {/* Du, på vei mot idealet */}
            <motion.g initial={{ opacity: 0, x: 0 }} animate={{ opacity: ideal ? 1 : 0, x: ideal ? 120 : 0 }} transition={{ duration: 2.4, ease: 'easeOut' }}>
                <Figur x={60} y={860} farge="#7c3aed" skala={1.1} />
                <text x={60} y={680} textAnchor="middle" fontSize={34} fontWeight={800} fill="#6d28d9" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    deg
                </text>
            </motion.g>
        </Flate>
    );
}
