import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Tekst, Vis } from './felles';

/**
 * Menneskerettighetene som et skjold. Bak det står mennesker av alle slag. På skjoldet står
 * Grunnloven § 93. Til slutt kommer makten mot skjoldet og stopper.
 */

const MX = 800;

const FOLK = [
    { x: 330, farge: '#9f1239', hud: '#e0b98a', s: 1 },
    { x: 450, farge: '#1e40af', hud: '#8d5a3b', s: 0.8 },
    { x: 560, farge: '#065f46', hud: '#f1d1b0', s: 1.1 },
    { x: 1040, farge: '#6d28d9', hud: '#5c3a24', s: 0.95 },
    { x: 1150, farge: '#b45309', hud: '#e0b98a', s: 0.7 },
    { x: 1270, farge: '#0e7490', hud: '#c68e63', s: 1.05 },
];

export function PliktetikkSkjold({ beat }: VisualProps) {
    const makt = beat >= 3;
    return (
        <Flate bakgrunn="#eff6ff">
            <Tekst x={800} y={80} str={52} farge="#1e3a8a">
                {['Menneskerettigheter', 'For alle, uansett', 'Grunnloven § 93', 'Et skjold mot makten'][Math.min(beat, 3)]}
            </Tekst>

            {FOLK.map((f, i) => (
                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.15 }}>
                    <Figur x={f.x} y={840} farge={f.farge} hud={f.hud} skala={f.s * 1.25} />
                </motion.g>
            ))}

            {/* Skjoldet */}
            <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} style={{ transformOrigin: `${MX}px 460px`, transformBox: 'view-box' }}>
                <path d={`M ${MX - 200} 170 L ${MX + 200} 170 L ${MX + 200} 480 Q ${MX + 200} 690 ${MX} 790 Q ${MX - 200} 690 ${MX - 200} 480 Z`} fill="#1e40af" stroke="#1e3a8a" strokeWidth={10} />
                <path d={`M ${MX - 170} 200 L ${MX + 170} 200 L ${MX + 170} 480 Q ${MX + 170} 665 ${MX} 755 Q ${MX - 170} 665 ${MX - 170} 480 Z`} fill="#2563eb" />
            </motion.g>
            <Tekst x={MX} y={300} str={34} farge="#ffffff" vis={beat <= 1}>
                Rettigheter
            </Tekst>
            <Tekst x={MX} y={350} str={34} farge="#ffffff" vis={beat <= 1}>
                og friheter
            </Tekst>
            <Tekst x={MX} y={520} str={30} farge="#bfdbfe" vis={beat === 1}>
                menneskeverd
            </Tekst>
            <Tekst x={MX} y={560} str={30} farge="#bfdbfe" vis={beat === 1}>
                over enhver pris
            </Tekst>
            <Vis vis={beat >= 2}>
                <text x={MX} y={290} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    § 93
                </text>
                {['Forbudt: tortur', 'Forbudt: slaveri', 'Forbudt: tvangsarbeid'].map((t, i) => (
                    <Tekst key={t} x={MX} y={380 + i * 70} str={32} farge="#ffffff" forsinkelse={0.3 + i * 0.4}>
                        {t}
                    </Tekst>
                ))}
                <Tekst x={MX} y={640} str={26} farge="#bfdbfe" forsinkelse={1.6}>
                    uten unntak
                </Tekst>
            </Vis>

            {/* Uansett */}
            <Vis vis={beat === 1}>
                <Kort x={330} y={480} tekst="kjønn" str={34} farge="#ffffff" kant="#93c5fd" tekstFarge="#1e3a8a" />
                <Kort x={500} y={360} tekst="klasse" str={34} farge="#ffffff" kant="#93c5fd" tekstFarge="#1e3a8a" />
                <Kort x={1150} y={420} tekst="bakgrunn" str={34} farge="#ffffff" kant="#93c5fd" tekstFarge="#1e3a8a" />
            </Vis>

            {/* Makten mot skjoldet */}
            {[0, 1, 2].map((i) => (
                <motion.g
                    key={i}
                    initial={{ x: 700, opacity: 0 }}
                    animate={{ x: makt ? 0 : 700, opacity: makt ? 1 : 0 }}
                    transition={{ duration: 1.2, delay: makt ? i * 0.35 : 0, ease: 'easeOut' }}
                >
                    <path d={`M 1440 ${300 + i * 160} L 1060 ${300 + i * 160}`} stroke="#b91c1c" strokeWidth={16} strokeLinecap="round" />
                    <polygon points={`1020,${300 + i * 160} 1070,${272 + i * 160} 1070,${328 + i * 160}`} fill="#b91c1c" />
                </motion.g>
            ))}
            <Kort x={1400} y={220} tekst="MAKT" str={40} farge="#b91c1c" kant="#b91c1c" tekstFarge="#ffffff" vis={makt} />
        </Flate>
    );
}
