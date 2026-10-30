import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate, Kort, Pil, Tekst, Vis } from './felles';

/**
 * To typer påbud. Til venstre det hypotetiske: «Hvis du vil ..., må du ...». Tar du bort
 * målet, faller regelen. Til høyre det kategoriske: et påbud som står alene, uansett mål.
 */

const V = 420;
const H = 1180;

function Boks({
    x,
    y,
    over,
    tekst,
    farge,
    dempet,
}: {
    x: number;
    y: number;
    over: string;
    tekst: string;
    farge: string;
    dempet: boolean;
}) {
    return (
        <motion.g initial={false} animate={{ opacity: dempet ? 0.35 : 1 }} transition={{ duration: 0.6 }}>
            <rect x={x - 300} y={y - 70} width={600} height={140} rx={24} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={x - 270} y={y - 18} fontSize={30} fontWeight={800} fill={farge} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                {over}
            </text>
            <motion.text
                key={tekst}
                x={x - 270}
                y={y + 40}
                fontSize={40}
                fontWeight={800}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
                {tekst}
            </motion.text>
        </motion.g>
    );
}

function Piano({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-150} y={-40} width={300} height={90} rx={8} fill="#1f2937" />
            {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={-140 + i * 28} y={-28} width={26} height={70} fill="#f8fafc" />
            ))}
            {[0, 1, 3, 4, 5, 7, 8].map((i) => (
                <rect key={i} x={-122 + i * 28} y={-28} width={16} height={42} fill="#111827" />
            ))}
        </g>
    );
}

export function PliktetikkPabud({ beat }: VisualProps) {
    const eksempel = beat >= 1;
    const utenMal = beat >= 2;
    return (
        <Flate bakgrunn="#f8fafc">
            <Tekst x={800} y={90} str={54} farge="#0f172a">
                To typer påbud
            </Tekst>
            <line x1={800} y1={140} x2={800} y2={860} stroke="#e2e8f0" strokeWidth={4} />

            {/* Hypotetisk */}
            <Tekst x={V} y={190} str={42} farge="#0369a1">
                Hypotetisk
            </Tekst>
            <Boks
                x={V}
                y={330}
                over="HVIS du vil"
                tekst={eksempel ? 'bli en god pianist,' : 'oppnå noe,'}
                farge="#0369a1"
                dempet={false}
            />
            <Pil x1={V} y1={410} x2={V} y2={480} farge="#0369a1" tykk={8} />
            <Boks
                x={V}
                y={570}
                over="MÅ du"
                tekst={eksempel ? 'øve hver dag.' : 'gjøre noe.'}
                farge="#0369a1"
                dempet={utenMal}
            />
            <Vis vis={eksempel && !utenMal}>
                <Piano x={V} y={760} />
            </Vis>
            {/* Uten målet faller regelen */}
            <motion.line
                x1={V - 300}
                y1={330}
                x2={V + 300}
                y2={330}
                stroke="#dc2626"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: utenMal ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            />
            <Tekst x={V} y={730} str={34} farge="#b91c1c" vis={utenMal}>
                Bryr du deg ikke om piano?
            </Tekst>
            <Tekst x={V} y={785} str={34} farge="#0f172a" vis={utenMal}>
                Da gjelder ikke regelen.
            </Tekst>

            {/* Kategorisk */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0.18 }} transition={{ duration: 0.6 }}>
                <Tekst x={H} y={190} str={42} farge="#9f1239">
                    Kategorisk
                </Tekst>
                <Tekst x={H} y={250} str={28} farge="#9f1239" vekt={700}>
                    gjelder alltid, uten unntak
                </Tekst>
            </motion.g>
            <motion.g
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0.7 }}
                transition={{ type: 'spring', stiffness: 160, damping: 15 }}
                style={{ transformOrigin: `${H}px 420px`, transformBox: 'view-box' }}
            >
                <rect x={H - 300} y={340} width={600} height={160} rx={28} fill="#9f1239" />
                <text x={H} y={445} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ffffff" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    {beat >= 4 ? 'VÆR ÆRLIG' : 'GJØR DET'}
                </text>
            </motion.g>
            <Vis vis={beat >= 4}>
                <Kort x={H - 160} y={640} tekst="vil ha kunder" str={30} farge="#fff1f2" kant="#fda4af" tekstFarge="#881337" />
                <Kort x={H + 160} y={640} tekst="vil ikke" str={30} farge="#fff1f2" kant="#fda4af" tekstFarge="#881337" />
                <Pil x1={H - 160} y1={600} x2={H - 60} y2={515} farge="#9f1239" tykk={6} />
                <Pil x1={H + 160} y1={600} x2={H + 60} y2={515} farge="#9f1239" tykk={6} />
                <Tekst x={H} y={780} str={40} farge="#881337">
                    Moralen er målet i seg selv
                </Tekst>
            </Vis>
        </Flate>
    );
}
