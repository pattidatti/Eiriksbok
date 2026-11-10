import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Tallene i svindelfilmen, i 2D (SVG 1600x900). To moduser:
 * - millioner: 962 millioner kroner i 2025, over halvparten der kunden selv ble lurt til å
 *   betale, og låsen som står urørt.
 * - unge: Økokrim ser flere unge, helt ned i 15 år, via Snapchat og TikTok. Europol: under 35.
 */

type Modus = 'millioner' | 'unge';

function Vis({ vis, children }: { vis: boolean; children: ReactNode }) {
    return (
        <AnimatePresence>
            {vis && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function T({
    x,
    y,
    children,
    str = 40,
    farge = '#f8fafc',
    vekt = 800,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

/** En haug med sedler. Utellbar med vilje: den viser mye, ikke et antall. */
const SEDLER: { x: number; y: number; rot: number; forsinkelse: number }[] = [];
for (let rad = 0; rad < 9; rad++) {
    const antall = 17 - rad;
    for (let k = 0; k < antall; k++) {
        const r = Math.sin((rad * 31 + k) * 91.7) * 0.5 + 0.5;
        SEDLER.push({
            x: 800 + (k - (antall - 1) / 2) * 50 + (r - 0.5) * 12,
            y: 850 - rad * 25 + (r - 0.5) * 6,
            rot: (r - 0.5) * 24,
            forsinkelse: SEDLER.length * 0.012,
        });
    }
}

function Millioner({ beat }: { beat: number }) {
    const b = Math.min(beat, 2);
    return (
        <>
            <Vis vis={b === 0}>
                <T x={800} y={120} str={52} farge="#cbd5e1">
                    Svindlet fra kunder i norske banker, 2025
                </T>
                <T x={800} y={290} str={170} vekt={900} farge="#fbbf24">
                    <TelleTall verdi={962} varighet={2.2} />
                </T>
                <T x={800} y={370} str={60} vekt={800}>
                    millioner kroner
                </T>
                {b === 0 &&
                    SEDLER.map((s, i) => (
                        <motion.rect
                            key={i}
                            x={s.x - 24}
                            y={s.y - 12}
                            width={48}
                            height={24}
                            rx={3}
                            fill={i % 3 === 0 ? '#15803d' : i % 3 === 1 ? '#16a34a' : '#22c55e'}
                            stroke="#052e16"
                            strokeWidth={2}
                            transform={`rotate(${s.rot} ${s.x} ${s.y})`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + s.forsinkelse, duration: 0.3 }}
                        />
                    ))}
            </Vis>

            <Vis vis={b === 1}>
                <T x={800} y={150} str={52} farge="#cbd5e1">
                    Svindel i andre halvår av 2025
                </T>
                <T x={800} y={290} str={64} vekt={900} farge="#fbbf24">
                    Over halvparten:
                </T>
                <T x={800} y={370} str={52} vekt={800}>
                    kunden ble lurt til å betale selv
                </T>
                {/* Stolpen: fylt til midten, og videre med en fade. Hvor langt over vet vi ikke. */}
                <defs>
                    <linearGradient id="svindel-over" x1="0" x2="1">
                        <stop offset="0" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="1" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <rect x={200} y={480} width={1200} height={120} rx={20} fill="#334155" />
                {b === 1 && (
                    <motion.rect
                        x={200}
                        y={480}
                        height={120}
                        rx={20}
                        fill="#f59e0b"
                        initial={{ width: 0 }}
                        animate={{ width: 600 }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                    />
                )}
                <rect x={790} y={480} width={240} height={120} fill="url(#svindel-over)" />
                <line
                    x1={800}
                    y1={450}
                    x2={800}
                    y2={630}
                    stroke="#f8fafc"
                    strokeWidth={6}
                    strokeDasharray="14 10"
                />
                <T x={800} y={690} str={40} farge="#f8fafc">
                    halvparten
                </T>
            </Vis>

            <Vis vis={b === 2}>
                <T x={800} y={130} str={64} vekt={900}>
                    De lurer mennesker
                </T>
                {/* Låsen: hel og grønn. */}
                <g transform="translate(480 470)">
                    <path
                        d="M -70 -40 L -70 -110 A 70 70 0 0 1 70 -110 L 70 -40"
                        fill="none"
                        stroke="#5eead4"
                        strokeWidth={26}
                    />
                    <rect x={-120} y={-50} width={240} height={190} rx={24} fill="#0d9488" />
                    <circle cx={0} cy={30} r={22} fill="#042f2e" />
                    <rect x={-8} y={30} width={16} height={60} fill="#042f2e" />
                </g>
                <T x={480} y={720} str={42} farge="#5eead4">
                    Låsen er oftest hel
                </T>
                {/* Mennesket: målet. */}
                <g transform="translate(1120 470)">
                    <circle cx={0} cy={-80} r={60} fill="#f87171" />
                    <path d="M -110 140 Q -110 0 0 0 Q 110 0 110 140 Z" fill="#f87171" />
                    <circle
                        cx={0}
                        cy={20}
                        r={200}
                        fill="none"
                        stroke="#f87171"
                        strokeWidth={6}
                        strokeDasharray="20 16"
                    />
                </g>
                <T x={1120} y={760} str={42} farge="#fca5a5">
                    Målet er deg
                </T>
            </Vis>
        </>
    );
}

/* ---------- unge ---------- */

const AKSE = { x0: 220, x1: 1380, y: 640, fra: 5, til: 45 };
const alderX = (a: number) =>
    AKSE.x0 + ((a - AKSE.fra) / (AKSE.til - AKSE.fra)) * (AKSE.x1 - AKSE.x0);

function App({ x, navn, farge }: { x: number; navn: string; farge: string }) {
    return (
        <g>
            <rect x={x - 150} y={250} width={300} height={170} rx={30} fill={farge} />
            <T x={x} y={320} str={46} vekt={900} farge="#0f172a">
                {navn}
            </T>
            <T x={x} y={380} str={28} vekt={700} farge="#0f172a">
                Lettjente penger
            </T>
            <T x={x} y={410} str={28} vekt={700} farge="#0f172a">
                uten risiko!
            </T>
        </g>
    );
}

function Unge({ beat }: { beat: number }) {
    const b = Math.min(beat, 3);
    const overskrift = [
        'Økokrim: stadig flere unge blir rekruttert',
        'Noen er helt ned i 15 år',
        'Vanligst: via sosiale medier',
        'Europol: ofte folk under 35 år',
    ][b];
    return (
        <>
            <motion.g
                key={overskrift}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <T x={800} y={130} str={58} vekt={900}>
                    {overskrift}
                </T>
            </motion.g>

            {/* Beat 0: rekrutteringen øker. Ingen tall, bare retningen. */}
            <Vis vis={b === 0}>
                <motion.path
                    d="M 420 700 L 1200 320"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={22}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: b === 0 ? 1 : 0 }}
                    transition={{ duration: 1.6, ease: 'easeOut' }}
                />
                <path d="M 1150 300 L 1250 270 L 1215 368 Z" fill="#fbbf24" />
                <T x={640} y={330} str={48} vekt={900} farge="#fbbf24" anker="end">
                    stadig flere
                </T>
                <T x={360} y={790} str={36} farge="#94a3b8" anker="start">
                    unge som blir rekruttert
                </T>
            </Vis>

            {/* Alderslinja. */}
            <Vis vis={b >= 1 && b !== 2}>
                <line
                    x1={AKSE.x0}
                    y1={AKSE.y}
                    x2={AKSE.x1}
                    y2={AKSE.y}
                    stroke="#cbd5e1"
                    strokeWidth={6}
                />
                {Array.from({ length: 9 }, (_, i) => AKSE.fra + i * 5).map((a) => (
                    <line
                        key={a}
                        x1={alderX(a)}
                        y1={AKSE.y - 14}
                        x2={alderX(a)}
                        y2={AKSE.y + 14}
                        stroke="#cbd5e1"
                        strokeWidth={4}
                    />
                ))}
                <T x={AKSE.x1 + 40} y={AKSE.y + 14} str={36} farge="#cbd5e1" anker="start">
                    år
                </T>
                <T x={alderX(15)} y={AKSE.y + 70} str={44} vekt={900} farge="#fbbf24">
                    15
                </T>
                <g transform={`translate(${alderX(15)} ${AKSE.y - 110})`}>
                    <circle cx={0} cy={-36} r={24} fill="#fbbf24" />
                    <path d="M -40 50 Q -40 -8 0 -8 Q 40 -8 40 50 Z" fill="#fbbf24" />
                </g>
            </Vis>

            <Vis vis={b === 2}>
                <App x={560} navn="Snapchat" farge="#fde047" />
                <App x={1040} navn="TikTok" farge="#e2e8f0" />
            </Vis>

            <Vis vis={b === 3}>
                <defs>
                    <linearGradient id="svindel-band" x1="0" x2="1">
                        <stop offset="0" stopColor="#ef4444" stopOpacity={0} />
                        <stop offset="0.25" stopColor="#ef4444" stopOpacity={0.55} />
                        <stop offset="1" stopColor="#ef4444" stopOpacity={0.55} />
                    </linearGradient>
                </defs>
                <rect
                    x={AKSE.x0}
                    y={AKSE.y - 220}
                    width={alderX(35) - AKSE.x0}
                    height={220}
                    fill="url(#svindel-band)"
                />
                <line
                    x1={alderX(35)}
                    y1={AKSE.y - 240}
                    x2={alderX(35)}
                    y2={AKSE.y + 20}
                    stroke="#ef4444"
                    strokeWidth={6}
                />
                <T x={alderX(35)} y={AKSE.y + 70} str={44} vekt={900} farge="#f87171">
                    35
                </T>
                <T x={alderX(24)} y={AKSE.y - 250} str={38} vekt={800} farge="#fecaca">
                    Også mindreårige
                </T>
            </Vis>
        </>
    );
}

export function SvindelTall({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'millioner';
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #0f172a, #172554)' }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="h-full w-full"
            >
                {modus === 'millioner' ? <Millioner beat={beat} /> : <Unge beat={beat} />}
            </svg>
        </div>
    );
}
