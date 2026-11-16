import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hundre blomster-hagen i Mao-filmen.
 * - «blomster»: Hundre blomster-kampanjen. Blomstene er tanker som får blomstre.
 * - «fellen»: anti-høyrekampanjen. Et nett legger seg over blomstene.
 */

type Modus = 'blomster' | 'fellen';

const B = 1600;
const H = 900;

export function MaoBlomster({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const felle = props.modus === 'fellen';
    return (
        <div
            className={`absolute inset-0 overflow-hidden ${felle ? 'bg-slate-900' : 'bg-gradient-to-b from-amber-50 to-orange-50'}`}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Blomster beat={beat} felle={felle} />
            </svg>
        </div>
    );
}

function Vis({ synlig, children }: { synlig: boolean; children: React.ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.7 }}
        >
            {children}
        </motion.g>
    );
}

/* ---------- Blomster og fellen ---------- */

const BLOMST_FARGER = ['#e11d48', '#f59e0b', '#db2777', '#f97316', '#a855f7', '#ef4444'];

function Blomster({ beat, felle }: { beat: number; felle: boolean }) {
    const blomster = useMemo(
        () =>
            Array.from({ length: 34 }, (_, i) => ({
                x: 90 + (i % 17) * 88 + (Math.floor(i / 17) % 2) * 44,
                y: 730 + Math.floor(i / 17) * 70,
                h: 110 + ((i * 37) % 70),
                farge: BLOMST_FARGER[i % BLOMST_FARGER.length],
            })),
        []
    );
    const blomstrer = felle || beat >= 1;
    const visner = felle && beat >= 1;
    const bobler = [
        { x: 300, y: 300, tekst: 'Professorer', fra: 2 },
        { x: 800, y: 250, tekst: 'Journalister', fra: 2 },
        { x: 1300, y: 300, tekst: 'Folk i staten', fra: 2 },
        { x: 360, y: 470, tekst: 'Partiets feil', fra: 3 },
        { x: 800, y: 420, tekst: 'Korrupsjon', fra: 3 },
        { x: 1240, y: 470, tekst: 'Folk holdes nede', fra: 3 },
    ];
    const tittel = felle
        ? ['Anti-høyrekampanjen', 'Hundretusener arrestert', 'Brukt som en felle'][
              Math.min(beat, 2)
          ]
        : [
              '1956: Si hva du mener!',
              '«La hundre blomster blomstre»',
              'Kritikken kommer',
              'Kritikken er sterk',
              'De stolte på Maos ord',
          ][Math.min(beat, 4)];
    return (
        <>
            <rect x={0} y={700} width={B} height={200} fill={felle ? '#1e293b' : '#d9c79e'} />
            {blomster.map((b, i) => (
                <motion.g key={i} initial={false} animate={{ opacity: 1 }}>
                    <motion.line
                        x1={b.x}
                        x2={b.x}
                        y1={b.y}
                        initial={{ y2: b.y }}
                        animate={{ y2: b.y - (blomstrer ? b.h : 20) * (visner ? 0.55 : 1) }}
                        transition={{ duration: 1.2, delay: (i % 9) * 0.06 }}
                        stroke={visner ? '#475569' : '#15803d'}
                        strokeWidth={6}
                    />
                    <motion.circle
                        cx={b.x}
                        initial={{ cy: b.y, r: 0 }}
                        animate={{
                            cy: b.y - (blomstrer ? b.h : 20) * (visner ? 0.55 : 1),
                            r: blomstrer ? (visner ? 12 : 22) : 0,
                            fill: visner ? '#64748b' : b.farge,
                        }}
                        transition={{ duration: 1.2, delay: (i % 9) * 0.06 }}
                    />
                </motion.g>
            ))}
            {!felle &&
                bobler.map((b) => (
                    <Vis key={b.tekst} synlig={beat >= b.fra}>
                        <rect
                            x={b.x - 190}
                            y={b.y - 50}
                            width={380}
                            height={90}
                            rx={45}
                            fill={b.fra === 3 ? '#7f1d1d' : '#ffffff'}
                            stroke="#0f172a"
                            strokeWidth={beat === b.fra ? 4 : 2}
                        />
                        <path
                            d={`M ${b.x - 20} ${b.y + 38} L ${b.x} ${b.y + 70} L ${b.x + 20} ${b.y + 38} Z`}
                            fill={b.fra === 3 ? '#7f1d1d' : '#ffffff'}
                        />
                        <text
                            x={b.x}
                            y={b.y + 12}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill={b.fra === 3 ? '#fff' : '#0f172a'}
                        >
                            {b.tekst}
                        </text>
                    </Vis>
                ))}
            {/* Skyggen som venter over blomstene */}
            {!felle && (
                <motion.rect
                    x={0}
                    y={0}
                    width={B}
                    height={H}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 4 ? 0.35 : 0 }}
                    transition={{ duration: 1.5 }}
                />
            )}
            {!felle && (
                <Vis synlig={beat === 0}>
                    <rect x={300} y={300} width={1000} height={260} rx={40} fill="#b91c1c" />
                    <text
                        x={800}
                        y={410}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Mao ber kritikere og
                    </text>
                    <text
                        x={800}
                        y={490}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fff"
                    >
                        alle som skriver, si fra
                    </text>
                </Vis>
            )}
            {felle && <Nett />}
            <AnimatePresence mode="wait">
                <motion.g
                    key={tittel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect
                        x={800 - 560}
                        y={50}
                        width={1120}
                        height={110}
                        rx={30}
                        fill={felle ? '#7f1d1d' : '#ffffff'}
                        opacity={0.96}
                    />
                    <text
                        x={800}
                        y={125}
                        textAnchor="middle"
                        fontSize={58}
                        fontWeight={900}
                        fill={felle ? '#fff' : '#0f172a'}
                    >
                        {tittel}
                    </text>
                </motion.g>
            </AnimatePresence>
        </>
    );
}

/** Nettet som faller ned over blomstene. */
function Nett() {
    const linjer = useMemo(() => Array.from({ length: 22 }, (_, i) => 40 + i * 72), []);
    return (
        <motion.g
            initial={{ opacity: 0, translateY: -500 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
        >
            {linjer.map((x) => (
                <line
                    key={`v${x}`}
                    x1={x}
                    y1={240}
                    x2={x + 60}
                    y2={880}
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
            ))}
            {[300, 420, 540, 660, 780].map((y) => (
                <line
                    key={`h${y}`}
                    x1={0}
                    y1={y}
                    x2={B}
                    y2={y + 30}
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
            ))}
            <line x1={0} y1={240} x2={B} y2={240} stroke="#cbd5e1" strokeWidth={10} />
        </motion.g>
    );
}
