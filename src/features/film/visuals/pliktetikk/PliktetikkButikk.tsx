import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Tekst, Vis } from './felles';

/**
 * Butikkeieren. Han gir barnet riktige penger tilbake. Er han ærlig for ryktets skyld, er
 * handlingen «i tråd med plikt» og uten moralsk verdi. Gjør han det mot sin egen lyst, er den
 * «av plikt», og diamanten lyser. Til slutt: kjærlighet mot plikt.
 */

function Diamant({ x, y, lys }: { x: number; y: number; lys: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <motion.circle r={110} fill="#bae6fd" initial={{ opacity: 0 }} animate={{ opacity: lys ? 0.7 : 0 }} transition={{ duration: 0.8 }} />
            <path d="M -70 -30 L -40 -70 L 40 -70 L 70 -30 L 0 70 Z" fill={lys ? '#38bdf8' : '#cbd5e1'} stroke={lys ? '#0369a1' : '#94a3b8'} strokeWidth={5} />
            <path d="M -70 -30 L 70 -30 M -40 -70 L -20 -30 L 0 70 L 20 -30 L 40 -70" fill="none" stroke={lys ? '#e0f2fe' : '#e2e8f0'} strokeWidth={4} />
        </g>
    );
}

function Hjerte({ x, y }: { x: number; y: number }) {
    return (
        <path
            transform={`translate(${x} ${y}) scale(1.6)`}
            d="M 0 30 C -60 -10 -40 -55 0 -30 C 40 -55 60 -10 0 30 Z"
            fill="#e11d48"
        />
    );
}

export function PliktetikkButikk({ beat }: VisualProps) {
    const tittel = [
        'Butikkeieren lurer aldri',
        'Hvorfor er han ærlig?',
        'I tråd med plikt',
        'Av plikt',
        'Plikt eller kjærlighet?',
    ][Math.min(beat, 4)];
    const pengerGitt = beat === 0 || beat >= 3;
    return (
        <Flate bakgrunn="#fdf4e7">
            <motion.text
                key={tittel}
                x={800}
                y={95}
                textAnchor="middle"
                fontSize={54}
                fontWeight={800}
                fill="#7c2d12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
                {tittel}
            </motion.text>

            <Vis vis={beat <= 3}>
                {/* Hyller bak disken */}
                {[230, 330].map((y) => (
                    <g key={y}>
                        <rect x={140} y={y} width={560} height={14} fill="#92400e" />
                        {Array.from({ length: 8 }, (_, i) => (
                            <rect key={i} x={160 + i * 66} y={y - 56} width={48} height={56} rx={6} fill={['#f59e0b', '#16a34a', '#dc2626', '#2563eb'][(i + y) % 4]} />
                        ))}
                    </g>
                ))}
                <Figur x={420} y={640} farge="#7c2d12" skala={1.5} />
                {/* Disken */}
                <rect x={100} y={580} width={900} height={200} rx={14} fill="#b45309" />
                <rect x={100} y={570} width={900} height={24} rx={8} fill="#92400e" />
                <Figur x={860} y={800} farge="#0ea5e9" skala={0.95} />
                <Tekst x={1010} y={760} str={30} farge="#0c4a6e" vis={beat === 0}>
                    et barn
                </Tekst>
                {/* Vekslepengene */}
                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        r={22}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={false}
                        animate={{ cx: pengerGitt ? 740 + i * 40 : 520 + i * 40, cy: 560 }}
                        transition={{ duration: 1, delay: i * 0.15 }}
                    />
                ))}
            </Vis>

            {/* Ryktet */}
            <Vis vis={beat === 1 || beat === 2}>
                <Kort x={1250} y={260} tekst="Ryktet mitt" str={40} farge="#ffffff" kant="#cbd5e1" />
                <circle cx={1080} cy={330} r={14} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
                <circle cx={1040} cy={360} r={9} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
                {[1150, 1260, 1370].map((x) => (
                    <Figur key={x} x={x} y={800} farge="#64748b" skala={0.8} />
                ))}
                <Tekst x={1260} y={580} str={28} farge="#475569">
                    de andre kundene
                </Tekst>
            </Vis>
            <Vis vis={beat === 2}>
                <rect x={1050} y={380} width={420} height={120} rx={20} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={4} />
                <Tekst x={1260} y={432} str={30} farge="#334155" vekt={700}>
                    for sin egen skyld
                </Tekst>
                <Tekst x={1260} y={478} str={30} farge="#334155">
                    Kant: Ingen moralsk verdi
                </Tekst>
            </Vis>

            {/* Av plikt */}
            <Vis vis={beat === 3}>
                <Kort x={1250} y={260} tekst="Lyst til å lure" str={36} farge="#fee2e2" kant="#fca5a5" tekstFarge="#991b1b" />
                <line x1={1090} y1={260} x2={1410} y2={260} stroke="#dc2626" strokeWidth={8} />
                <Diamant x={1250} y={500} lys={beat === 3} />
                <Tekst x={1250} y={680} str={34} farge="#0369a1">
                    en moralsk diamant
                </Tekst>
            </Vis>

            {/* Kjærlighet eller plikt */}
            <Vis vis={beat >= 4}>
                <Hjerte x={480} y={430} />
                <Tekst x={480} y={620} str={40} farge="#9f1239">
                    av kjærlighet
                </Tekst>
                <Tekst x={480} y={675} str={32} farge="#9f1239" vekt={700}>
                    eller vennskap
                </Tekst>
                <Diamant x={1120} y={430} lys />
                <Tekst x={1120} y={620} str={40} farge="#0369a1">
                    av plikt
                </Tekst>
                <Tekst x={800} y={445} str={44} farge="#475569">
                    eller
                </Tekst>
                <Tekst x={800} y={800} str={36} farge="#7c2d12" vekt={700}>
                    Mange beundrer heller den som gjør godt av kjærlighet
                </Tekst>
            </Vis>
        </Flate>
    );
}
