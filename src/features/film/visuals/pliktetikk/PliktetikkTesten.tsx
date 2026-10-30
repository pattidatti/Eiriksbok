import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Tekst, Vis } from './felles';

/**
 * Kants test, steg for steg. Til venstre stegene som lyser opp etter tur. Til høyre: regelen,
 * så alle som følger den, så ordet «løfte» som sprekker, og plikten som står igjen.
 */

const STEG = ['Finn regelen', 'Alle gjør det', 'Henger det sammen?'];
const MX = 1010;

function aktivtSteg(beat: number) {
    if (beat <= 0) return -1;
    if (beat === 1) return 0;
    if (beat === 2) return 1;
    return 2;
}

export function PliktetikkTesten({ beat }: VisualProps) {
    const aktiv = aktivtSteg(beat);
    return (
        <Flate bakgrunn="#f5f3ff">
            {/* Stegene */}
            {STEG.map((s, i) => {
                const paa = i === aktiv;
                const ferdig = i < aktiv;
                return (
                    <motion.g key={s} initial={false} animate={{ opacity: aktiv < 0 ? 0.35 : paa || ferdig ? 1 : 0.4 }}>
                        <rect
                            x={50}
                            y={210 + i * 190}
                            width={400}
                            height={140}
                            rx={24}
                            fill={paa ? '#6d28d9' : '#ffffff'}
                            stroke="#6d28d9"
                            strokeWidth={4}
                        />
                        <circle cx={115} cy={280 + i * 190} r={38} fill={paa ? '#ffffff' : '#ede9fe'} />
                        <text x={115} y={295 + i * 190} textAnchor="middle" fontSize={42} fontWeight={900} fill="#6d28d9" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                            {i + 1}
                        </text>
                        <text x={170} y={292 + i * 190} fontSize={i === 2 ? 27 : 32} fontWeight={800} fill={paa ? '#ffffff' : '#4c1d95'} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                            {s}
                        </text>
                    </motion.g>
                );
            })}
            <Tekst x={240} y={130} str={44} farge="#4c1d95">
                Kants test
            </Tekst>

            {/* Beat 0: loven */}
            <Vis vis={beat === 0}>
                <rect x={520} y={250} width={980} height={400} rx={32} fill="#ffffff" stroke="#c4b5fd" strokeWidth={5} />
                {['Handl bare etter den regelen', 'som du samtidig kan ville', 'at skal bli en lov for alle.'].map((l, i) => (
                    <Tekst key={l} x={MX} y={380 + i * 85} str={54} farge="#2e1065" forsinkelse={i * 0.4}>
                        {l}
                    </Tekst>
                ))}
            </Vis>

            {/* Beat 1: regelen til én person */}
            <Vis vis={beat === 1}>
                <Figur x={MX} y={800} farge="#475569" skala={1.6} />
                <rect x={MX - 400} y={250} width={800} height={150} rx={30} fill="#ffffff" stroke="#c4b5fd" strokeWidth={5} />
                <Tekst x={MX} y={315} str={40} farge="#2e1065">
                    Jeg kan bryte et løfte
                </Tekst>
                <Tekst x={MX} y={370} str={40} farge="#2e1065">
                    når det passer meg.
                </Tekst>
            </Vis>

            {/* Beat 2: alle gjør det */}
            {Array.from({ length: 36 }, (_, i) => {
                const k = i % 12;
                const r = Math.floor(i / 12);
                const x = 560 + k * 82 + (r % 2) * 40;
                const y = 460 + r * 130;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 1 : 0 }}
                        transition={{ duration: 0.4, delay: beat === 2 ? i * 0.05 : 0 }}
                    >
                        <Figur x={x} y={y + 120} farge={['#6d28d9', '#0369a1', '#9f1239', '#065f46'][i % 4]} skala={0.6} />
                    </motion.g>
                );
            })}
            <Tekst x={MX} y={330} str={56} farge="#2e1065" vis={beat === 2}>
                Alle bryter løfter
            </Tekst>
            <Tekst x={MX} y={400} str={36} farge="#6d28d9" vis={beat === 2} vekt={700}>
                når det passer dem
            </Tekst>

            {/* Beat 3-4: ordet løfte sprekker */}
            <Vis vis={beat >= 3}>
                <motion.g initial={false} animate={{ x: beat >= 3 ? -40 : 0, y: beat >= 4 ? 30 : 0, rotate: beat >= 3 ? -6 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: `${MX - 150}px 360px`, transformBox: 'view-box' }}>
                    <text x={MX - 30} y={400} textAnchor="end" fontSize={150} fontWeight={900} fill="#6d28d9" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        LØF
                    </text>
                </motion.g>
                <motion.g initial={false} animate={{ x: beat >= 3 ? 40 : 0, y: beat >= 4 ? 60 : 0, rotate: beat >= 3 ? 8 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ transformOrigin: `${MX + 150}px 360px`, transformBox: 'view-box' }}>
                    <text x={MX - 10} y={400} textAnchor="start" fontSize={150} fontWeight={900} fill="#6d28d9" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                        TE
                    </text>
                </motion.g>
                <path d={`M ${MX - 20} 250 L ${MX + 10} 310 L ${MX - 25} 350 L ${MX + 5} 420`} fill="none" stroke="#dc2626" strokeWidth={8} strokeLinecap="round" />
                <Tekst x={MX} y={560} str={42} farge="#b91c1c" vis={beat === 3}>
                    Ingen ville stolt på noen
                </Tekst>
                <Tekst x={MX} y={560} str={42} farge="#b91c1c" vis={beat >= 4}>
                    Regelen ødelegger seg selv
                </Tekst>
            </Vis>
            <motion.g
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: beat >= 4 ? 1 : 0, scale: beat >= 4 ? 1 : 1.5 }}
                transition={{ type: 'spring', stiffness: 160, damping: 15, delay: beat >= 4 ? 1.2 : 0 }}
                style={{ transformOrigin: `${MX}px 720px`, transformBox: 'view-box' }}
            >
                <rect x={MX - 330} y={660} width={660} height={120} rx={26} fill="#15803d" />
                <text x={MX} y={740} textAnchor="middle" fontSize={52} fontWeight={900} fill="#ffffff" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    Plikt: Hold løfter
                </text>
            </motion.g>
        </Flate>
    );
}
