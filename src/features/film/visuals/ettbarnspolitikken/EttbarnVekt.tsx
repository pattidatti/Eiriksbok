import { useEffect, useState } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To skåler.
 * - «belonning»: gulrot og pisk. Belønningene for ett barn faller i skåla til venstre,
 *   straffene for for mange barn i skåla til høyre.
 * - «kjonn»: en vippe med gutter mot jenter. 118 mot 100 i 2010, 111,3 mot 100 i 2020.
 */

type Modus = 'belonning' | 'kjonn';

const B = 1600;
const H = 900;

const BELONNING = ['helsehjelp', 'sikrere pensjon', 'bedre sjanse til bolig'];
const STRAFF = ['bøter', 'høyere skatt', 'tvangsarbeid'];

const OVERSKRIFT: Record<Modus, string[]> = {
    belonning: ['Gulrot og pisk', 'Belønning for ett barn', 'Straff for for mange barn'],
    kjonn: [
        'Ønsket om en sønn',
        'Ett barn: mange ville ha en gutt',
        '2010: omtrent 118 gutter per 100 jenter',
        '2020: 111,3 gutter per 100 jenter',
        'En del av guttene finner ingen å gifte seg med',
    ],
};

function Gulrot({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M 0 -70 L 26 60 Q 0 90 -26 60 Z" fill="#f97316" transform="rotate(25)" />
            <path
                d="M -20 -80 Q -10 -120 6 -84 Q 20 -125 24 -78"
                fill="none"
                stroke="#16a34a"
                strokeWidth={10}
                strokeLinecap="round"
                transform="rotate(25)"
            />
        </g>
    );
}

function Pisk({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-10} y={10} width={20} height={70} rx={8} fill="#78350f" />
            <path
                d="M 0 10 Q 60 -60 -10 -90 Q -70 -110 -40 -40"
                fill="none"
                stroke="#451a03"
                strokeWidth={7}
                strokeLinecap="round"
            />
        </g>
    );
}

function Skaal({
    x,
    tittel,
    farge,
    ting,
    synlig,
    ikon,
}: {
    x: number;
    tittel: string;
    farge: string;
    ting: string[];
    synlig: boolean;
    ikon: 'gulrot' | 'pisk';
}) {
    return (
        <g>
            <rect
                x={x - 330}
                y={250}
                width={660}
                height={540}
                rx={36}
                fill="#fff"
                stroke={farge}
                strokeWidth={6}
            />
            {ikon === 'gulrot' ? <Gulrot x={x - 230} y={370} /> : <Pisk x={x - 230} y={370} />}
            <text x={x - 140} y={355} fontSize={56} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            <text x={x - 140} y={405} fontSize={32} fontWeight={600} fill="#475569">
                {ikon === 'gulrot' ? 'for dem med ett barn' : 'for dem med for mange barn'}
            </text>
            {synlig &&
                ting.map((t, i) => (
                    <motion.g
                        key={t}
                        initial={{ opacity: 0, y: -60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3 + i * 0.6,
                            type: 'spring',
                            stiffness: 140,
                            damping: 16,
                        }}
                    >
                        <rect
                            x={x - 280}
                            y={470 + i * 100}
                            width={560}
                            height={80}
                            rx={18}
                            fill={farge}
                        />
                        <text
                            x={x}
                            y={523 + i * 100}
                            fontSize={40}
                            fontWeight={800}
                            fill="#fff"
                            textAnchor="middle"
                        >
                            {t}
                        </text>
                    </motion.g>
                ))}
        </g>
    );
}

function Belonning({ beat }: { beat: number }) {
    return (
        <>
            <Skaal
                x={430}
                tittel="Gulrot"
                farge="#15803d"
                ting={BELONNING}
                synlig={beat >= 1}
                ikon="gulrot"
            />
            <Skaal
                x={1170}
                tittel="Pisk"
                farge="#b91c1c"
                ting={STRAFF}
                synlig={beat >= 2}
                ikon="pisk"
            />
        </>
    );
}

/** Vinkelen på vippa: positiv = venstre side (guttene) ned. */
function vinkelFor(beat: number) {
    if (beat === 2) return 9;
    if (beat >= 3) return 5.5;
    return 0;
}

const MIDT_X = 800;
const MIDT_Y = 620;
const ARM = 520;

/** Prikker i et rutenett over en skål: 12 per rad, nederste rad først. */
function Prikker({
    antall,
    cx,
    bunn,
    farge,
    ekstraFra,
    ekstraFarge,
}: {
    antall: number;
    cx: number;
    bunn: number;
    farge: string;
    ekstraFra?: number;
    ekstraFarge?: string;
}) {
    const per = 12;
    const d = 30;
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => {
                const r = Math.floor(i / per);
                const k = i % per;
                const fx = cx + (k - (per - 1) / 2) * d;
                const fy = bunn - 18 - r * d;
                const f = ekstraFra !== undefined && i >= ekstraFra ? ekstraFarge : farge;
                return <circle key={i} cx={fx} cy={fy} r={12} fill={f} />;
            })}
        </g>
    );
}

function Kjonn({ beat, playing }: { beat: number; playing: boolean }) {
    const vinkel = useMotionValue(vinkelFor(beat));
    const [a, setA] = useState(vinkelFor(beat));
    useMotionValueEvent(vinkel, 'change', setA);
    useEffect(() => {
        const maal = vinkelFor(beat);
        if (!playing) {
            vinkel.set(maal);
            return;
        }
        const c = animate(vinkel, maal, { duration: 1.6, type: 'spring', bounce: 0.25 });
        return () => c.stop();
    }, [beat, playing, vinkel]);

    const rad = (a * Math.PI) / 180;
    const vx = MIDT_X - ARM * Math.cos(rad);
    const vy = MIDT_Y + ARM * Math.sin(rad);
    const hx = MIDT_X + ARM * Math.cos(rad);
    const hy = MIDT_Y - ARM * Math.sin(rad);
    const gutter = beat === 2 ? 118 : beat >= 3 ? 111 : 0;
    const jenter = beat >= 2 ? 100 : 0;
    const visTall = beat >= 2;
    return (
        <>
            {/* Foten */}
            <path
                d={`M ${MIDT_X} ${MIDT_Y} L ${MIDT_X - 80} 830 L ${MIDT_X + 80} 830 Z`}
                fill="#94a3b8"
            />
            <line
                x1={vx}
                y1={vy}
                x2={hx}
                y2={hy}
                stroke="#475569"
                strokeWidth={18}
                strokeLinecap="round"
            />
            <circle cx={MIDT_X} cy={MIDT_Y} r={16} fill="#334155" />
            {/* Skålene henger flatt under hver ende. */}
            <rect x={vx - 210} y={vy - 10} width={420} height={20} rx={10} fill="#1d4ed8" />
            <rect x={hx - 210} y={hy - 10} width={420} height={20} rx={10} fill="#db2777" />
            {beat <= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <circle
                        cx={vx}
                        cy={vy - 130}
                        r={40}
                        fill={beat === 1 ? '#1d4ed8' : '#cbd5e1'}
                    />
                    <rect
                        x={vx - 45}
                        y={vy - 90}
                        width={90}
                        height={80}
                        rx={30}
                        fill={beat === 1 ? '#1d4ed8' : '#cbd5e1'}
                    />
                    <text
                        x={vx}
                        y={vy - 195}
                        fontSize={44}
                        fontWeight={900}
                        fill="#1e3a8a"
                        textAnchor="middle"
                    >
                        {beat === 1 ? 'en gutt' : 'sønn?'}
                    </text>
                    {beat === 1 && (
                        <text
                            x={hx - 60}
                            y={hy - 60}
                            fontSize={32}
                            fontWeight={700}
                            fill="#9d174d"
                            textAnchor="middle"
                        >
                            en forsker: flere jentebabyer ble drept
                        </text>
                    )}
                </motion.g>
            )}
            {visTall && (
                <>
                    <Prikker
                        antall={gutter}
                        cx={vx}
                        bunn={vy - 10}
                        farge="#1d4ed8"
                        ekstraFra={beat >= 4 ? 100 : undefined}
                        ekstraFarge="#f59e0b"
                    />
                    <Prikker antall={jenter} cx={hx} bunn={hy - 10} farge="#db2777" />
                    <text
                        x={vx}
                        y={vy + 70}
                        fontSize={44}
                        fontWeight={900}
                        fill="#1e3a8a"
                        textAnchor="middle"
                    >
                        {beat === 2 ? 'ca. 118 gutter' : '111,3 gutter'}
                    </text>
                    <text
                        x={hx}
                        y={hy + 70}
                        fontSize={44}
                        fontWeight={900}
                        fill="#9d174d"
                        textAnchor="middle"
                    >
                        100 jenter
                    </text>
                </>
            )}
        </>
    );
}

function Forklaring({ beat }: { beat: number }) {
    if (beat < 4) return null;
    return (
        <div className="absolute left-[3%] bottom-[5%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-1">
            <div className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <span
                    className="inline-block rounded-full"
                    style={{ width: 18, height: 18, background: '#f59e0b' }}
                />
                flere gutter enn jenter
            </div>
        </div>
    );
}

export function EttbarnVekt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'belonning';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#fff7ed' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'belonning' ? (
                    <Belonning beat={beat} />
                ) : (
                    <Kjonn beat={beat} playing={playing} />
                )}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl text-center"
                        style={{ maxWidth: '86%' }}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'kjonn' && <Forklaring beat={beat} />}
        </div>
    );
}
