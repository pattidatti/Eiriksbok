import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Pil, Tekst, Vis } from './felles';

/**
 * Hvor kommer moralen fra? Først ovenfra, fra Gud og Bibelen. Så snur Kant pila: den kommer
 * fra fornuften inne i hvert menneske. Alle har fornuft, og alle når den samme loven. Til
 * slutt: autonom, du lager loven og følger den selv.
 */

function Lys({ x, y, vis, forsinkelse = 0 }: { x: number; y: number; vis: boolean; forsinkelse?: number }) {
    return (
        <motion.circle
            cx={x}
            cy={y}
            r={34}
            fill="#fde047"
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 0.9 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        />
    );
}

const RAD = [260, 440, 620, 980, 1160, 1340];
const FARGER = ['#9f1239', '#1e40af', '#065f46', '#7c2d12', '#6d28d9', '#334155'];

export function PliktetikkFornuft({ beat }: VisualProps) {
    const overskrift = [
        'Før: Moralen kommer fra Gud',
        'Kant: Moralen kommer fra fornuften',
        'Alle har fornuft',
        'Autonom = selv-lovgivende',
    ][Math.min(beat, 3)];
    return (
        <Flate bakgrunn="#fefce8">
            <motion.text
                key={overskrift}
                x={800}
                y={95}
                textAnchor="middle"
                fontSize={54}
                fontWeight={800}
                fill="#713f12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
                {overskrift}
            </motion.text>

            {/* Beat 0: Bibelen ovenfra, regelen ned til mennesket */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 0 ? 1 : beat === 1 ? 0.2 : 0 }} transition={{ duration: 0.6 }}>
                <circle cx={800} cy={250} r={90} fill="#fef08a" />
                <rect x={730} y={200} width={140} height={110} rx={10} fill="#78350f" />
                <rect x={796} y={200} width={8} height={110} fill="#451a03" />
                <Tekst x={800} y={360} str={30} farge="#78350f">
                    Bibelen
                </Tekst>
                <Pil x1={800} y1={390} x2={800} y2={520} farge="#a16207" tykk={10} />
                <Kort x={1150} y={460} vis={beat === 0} tekst="Du skal ikke stjele" str={36} farge="#fff7ed" kant="#f59e0b" tekstFarge="#78350f" />
            </motion.g>

            {/* Mennesket i midten (beat 0 og 1) */}
            <Vis vis={beat <= 1}>
                <Figur x={800} y={800} farge="#475569" skala={1.5} />
                <Lys x={800} y={623} vis={beat === 1} />
            </Vis>
            <Vis vis={beat === 1}>
                <Pil x1={860} y1={600} x2={1080} y2={430} farge="#ca8a04" tykk={10} />
                <Kort x={1230} y={380} tekst="Hva er rett?" str={40} farge="#fef9c3" kant="#ca8a04" tekstFarge="#713f12" />
                <Tekst x={420} y={600} str={34} farge="#713f12">
                    fornuften:
                </Tekst>
                <Tekst x={420} y={650} str={34} farge="#713f12">
                    evnen til å tenke
                </Tekst>
            </Vis>

            {/* Beat 2: alle har fornuft, samme lov */}
            <Vis vis={beat === 2}>
                <Kort x={800} y={300} tekst="Den samme moralske loven" str={42} farge="#fef9c3" kant="#ca8a04" tekstFarge="#713f12" />
                {RAD.map((x, i) => (
                    <g key={x}>
                        <motion.line
                            x1={x}
                            y1={590}
                            x2={800}
                            y2={345}
                            stroke="#eab308"
                            strokeWidth={5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: beat === 2 ? 1 : 0 }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                        />
                        <Figur x={x} y={800} farge={FARGER[i]} skala={1.2} />
                        <Lys x={x} y={658} vis={beat === 2} forsinkelse={i * 0.15} />
                    </g>
                ))}
            </Vis>

            {/* Beat 3: lager loven og følger den */}
            <Vis vis={beat >= 3}>
                <Figur x={520} y={800} farge="#475569" skala={1.5} />
                <Lys x={520} y={623} vis={beat >= 3} />
                <rect x={930} y={330} width={360} height={300} rx={20} fill="#fffbeb" stroke="#ca8a04" strokeWidth={5} />
                <Tekst x={1110} y={400} str={44} farge="#713f12">
                    Loven
                </Tekst>
                {[450, 500, 550, 600].map((y) => (
                    <line key={y} x1={980} y1={y} x2={1240} y2={y} stroke="#e7cf8a" strokeWidth={8} strokeLinecap="round" />
                ))}
                <motion.path
                    d="M 600 560 Q 760 360 920 400"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                    transition={{ duration: 1 }}
                />
                <motion.path
                    d="M 920 600 Q 760 760 610 700"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                    transition={{ duration: 1, delay: 1 }}
                />
                <Tekst x={760} y={360} str={36} farge="#15803d" forsinkelse={0.6}>
                    lager
                </Tekst>
                <Tekst x={790} y={800} str={36} farge="#1d4ed8" forsinkelse={1.6}>
                    følger
                </Tekst>
            </Vis>
        </Flate>
    );
}
