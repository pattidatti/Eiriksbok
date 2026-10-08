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
 * Maktvekta: kongen i den ene skåla, parlamentet i den andre. Hele filmen handler om
 * hvem som veier tyngst, så vekta kommer tilbake gjennom hele fortellingen. Hvert steg
 * sier hvordan vekta står, hvem som sitter i kongeskåla, hvor fullt parlamentet er,
 * og et ekstra bilde for det stemmen forteller (Gud, mynter, soldater, loven ...).
 */

type Konge = 'karl' | 'fange' | 'tom' | 'cromwell' | 'karl2';
type Ekstra =
    | 'gud'
    | 'mynter'
    | 'janei'
    | 'folk'
    | 'strafford'
    | 'forhandle'
    | 'soldater'
    | 'republikk'
    | 'speil'
    | 'lov'
    | 'vilkar'
    | 'sporsmal';

interface Steg {
    fraBeat: number;
    /** Grader. Negativt = kongen veier tyngst (venstre skål ned). */
    vipp: number;
    konge: Konge;
    /** Hvor fullt parlamentet er, 0-1. */
    fylt: number;
    ekstra?: Ekstra;
    merkelapp?: string;
    /** Navnet under parlamentet, f.eks. «Restparlamentet». */
    parlamentNavn?: string;
}

const B = 1600;
const H = 900;
const PIVOT: [number, number] = [800, 470];
const ARM = 420;
const KJEDE = 110;
const PLASSER = 12;

const GULL = '#ca8a04';
const KONGEFARGE = '#7e22ce';
const PARLAMENTSFARGE = '#0f766e';

export function BorgerkrigenVekt({ beat, props }: VisualProps<{ steg: Steg[] }>) {
    const steg = [...props.steg].reverse().find((s) => beat >= s.fraBeat) ?? props.steg[0];

    // Vippen glir mot målet (fjær), og verdien leses inn i state hvert bilde.
    const vippMv = useMotionValue(0);
    const [vipp, setVipp] = useState(0);
    useMotionValueEvent(vippMv, 'change', setVipp);
    useEffect(() => {
        const a = animate(vippMv, steg.vipp, { type: 'spring', stiffness: 40, damping: 9 });
        return () => a.stop();
    }, [steg.vipp, vippMv]);

    // Vinkelen dempes litt, så skålene aldri går ut av bildet.
    const rad = (vipp * 0.75 * Math.PI) / 180;
    const ende = (side: -1 | 1): [number, number] => [
        PIVOT[0] + side * ARM * Math.cos(rad),
        PIVOT[1] + side * ARM * Math.sin(rad),
    ];
    const [vx, vy] = ende(-1);
    const [hx, hy] = ende(1);
    const venstre: [number, number] = [vx, vy + KJEDE];
    const hoyre: [number, number] = [hx, hy + KJEDE];
    const fulle = Math.round(steg.fylt * PLASSER);
    const ekstra = steg.ekstra;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-stone-50 to-stone-200 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Gud: lysstråler ned på kongen */}
                <motion.g
                    animate={{ opacity: ekstra === 'gud' ? 1 : 0 }}
                    transition={{ duration: 1.2 }}
                >
                    {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
                        <polygon
                            key={i}
                            points={`${venstre[0] + i * 12},-20 ${venstre[0] + i * 12 + 10},-20 ${venstre[0] + i * 48 + 30},${venstre[1] - 60} ${venstre[0] + i * 48 - 30},${venstre[1] - 60}`}
                            fill="#fde68a"
                            opacity={0.45}
                        />
                    ))}
                </motion.g>

                {/* Stativet */}
                <rect x={770} y={PIVOT[1]} width={60} height={360} rx={10} fill="#78350f" />
                <rect x={640} y={820} width={320} height={40} rx={12} fill="#57290c" />
                <circle cx={PIVOT[0]} cy={PIVOT[1]} r={26} fill="#92400e" />

                {/* Loven over begge */}
                <AnimatePresence>
                    {(ekstra === 'lov' || ekstra === 'vilkar') && (
                        <motion.g
                            key="lov"
                            initial={{ opacity: 0, y: -60 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                        >
                            <rect x={650} y={195} width={300} height={120} rx={16} fill="#1e293b" />
                            <rect x={662} y={207} width={276} height={96} rx={10} fill="#f8fafc" />
                            <line
                                x1={800}
                                y1={207}
                                x2={800}
                                y2={303}
                                stroke="#1e293b"
                                strokeWidth={4}
                            />
                            <text
                                x={800}
                                y={275}
                                textAnchor="middle"
                                fontSize={60}
                                fontWeight={900}
                                fill="#1e293b"
                            >
                                LOVEN
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Bjelken */}
                <line
                    x1={vx}
                    y1={vy}
                    x2={hx}
                    y2={hy}
                    stroke="#78350f"
                    strokeWidth={22}
                    strokeLinecap="round"
                />
                {[
                    [vx, vy, venstre],
                    [hx, hy, hoyre],
                ].map(([x, y, p], i) => {
                    const [px, py] = p as [number, number];
                    return (
                        <g key={i} stroke="#57290c" strokeWidth={4}>
                            <line x1={x as number} y1={y as number} x2={px - 150} y2={py} />
                            <line x1={x as number} y1={y as number} x2={px + 150} y2={py} />
                        </g>
                    );
                })}

                {/* Venstre skål: kongen */}
                <g transform={`translate(${venstre[0]} ${venstre[1]})`}>
                    <KongeSkal konge={steg.konge} ekstra={ekstra} />
                    <Skal />
                    <text
                        y={84}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={KONGEFARGE}
                    >
                        {KONGENAVN[steg.konge]}
                    </text>
                </g>

                {/* Høyre skål: parlamentet */}
                <g transform={`translate(${hoyre[0]} ${hoyre[1]})`}>
                    <Parlament fulle={fulle} folk={ekstra === 'folk'} />
                    <Skal />
                    <text
                        y={84}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={PARLAMENTSFARGE}
                    >
                        {steg.parlamentNavn ?? 'Parlamentet'}
                    </text>
                </g>

                {/* Mynter som kongen trenger */}
                <AnimatePresence>
                    {(ekstra === 'mynter' || ekstra === 'janei') && (
                        <motion.g
                            key="mynter"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {ekstra === 'mynter' ? (
                                <g transform="translate(610 800)">
                                    {Array.from({ length: 9 }, (_, i) => (
                                        <motion.ellipse
                                            key={i}
                                            cx={(i % 3) * 46 - 46}
                                            rx={34}
                                            ry={12}
                                            fill={GULL}
                                            stroke="#713f12"
                                            strokeWidth={3}
                                            initial={{ cy: -300, opacity: 0 }}
                                            animate={{ cy: -Math.floor(i / 3) * 18, opacity: 1 }}
                                            transition={{
                                                delay: 0.3 + i * 0.18,
                                                type: 'spring',
                                                stiffness: 160,
                                                damping: 14,
                                            }}
                                        />
                                    ))}
                                    <text
                                        y={-90}
                                        textAnchor="middle"
                                        fontSize={44}
                                        fontWeight={900}
                                        fill="#713f12"
                                    >
                                        Penger?
                                    </text>
                                </g>
                            ) : (
                                <Skattepil fra={hoyre} til={venstre} />
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Ja eller nei over parlamentet */}
                <AnimatePresence>
                    {ekstra === 'janei' && (
                        <motion.g
                            key="janei"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ transformOrigin: `${hoyre[0]}px ${hoyre[1] - 330}px` }}
                        >
                            <Knapp
                                x={hoyre[0] - 80}
                                y={hoyre[1] - 330}
                                farge="#16a34a"
                                tekst="JA"
                            />
                            <Knapp
                                x={hoyre[0] + 80}
                                y={hoyre[1] - 330}
                                farge="#dc2626"
                                tekst="NEI"
                            />
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Soldater som marsjerer inn mot parlamentet */}
                <AnimatePresence>
                    {ekstra === 'soldater' && (
                        <motion.g key="soldater" exit={{ opacity: 0 }}>
                            {Array.from({ length: 5 }, (_, i) => (
                                <motion.g
                                    key={i}
                                    initial={{ x: B + 120 + i * 70 }}
                                    animate={{ x: hoyre[0] + 185 + i * 44 }}
                                    transition={{ duration: 2.2, delay: i * 0.15, ease: 'easeOut' }}
                                >
                                    <Figur y={hoyre[1] - 10} farge="#b91c1c" hjelm />
                                </motion.g>
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Forhandle? */}
                <AnimatePresence>
                    {ekstra === 'forhandle' && (
                        <motion.g
                            key="forhandle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <path
                                d={`M ${hoyre[0] - 120} ${hoyre[1] - 240} Q 800 ${Math.min(venstre[1], hoyre[1]) - 300} ${venstre[0] + 110} ${venstre[1] - 230}`}
                                fill="none"
                                stroke={PARLAMENTSFARGE}
                                strokeWidth={6}
                                strokeDasharray="14 12"
                            />
                            <Boble
                                x={800}
                                y={Math.min(venstre[1], hoyre[1]) - 230}
                                tekst="Skal vi forhandle?"
                            />
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Spørsmål: hva kommer nå? */}
                <AnimatePresence>
                    {ekstra === 'sporsmal' && (
                        <motion.text
                            key="sporsmal"
                            x={800}
                            y={330}
                            textAnchor="middle"
                            fontSize={200}
                            fontWeight={900}
                            fill="#0f766e"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ transformOrigin: '800px 260px' }}
                        >
                            ?
                        </motion.text>
                    )}
                </AnimatePresence>

                {/* Vilkår: skrevne regler ved siden av kongen */}
                <AnimatePresence>
                    {ekstra === 'vilkar' && (
                        <motion.g
                            key="vilkar"
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <rect
                                x={70}
                                y={300}
                                width={190}
                                height={250}
                                rx={14}
                                fill="#fffbeb"
                                stroke="#92400e"
                                strokeWidth={5}
                            />
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <line
                                    key={i}
                                    x1={95}
                                    x2={235 - (i % 2) * 40}
                                    y1={350 + i * 30}
                                    y2={350 + i * 30}
                                    stroke="#92400e"
                                    strokeWidth={6}
                                    strokeLinecap="round"
                                />
                            ))}
                            <text
                                x={165}
                                y={330}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={900}
                                fill="#92400e"
                            >
                                VILKÅR
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>

            <AnimatePresence mode="wait">
                {steg.merkelapp && (
                    <motion.div
                        key={steg.merkelapp}
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-[10%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/95 shadow-xl text-slate-900 font-black text-2xl md:text-4xl whitespace-nowrap"
                    >
                        {steg.merkelapp}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const KONGENAVN: Record<Konge, string> = {
    karl: 'Kongen',
    fange: 'Kongen, fanget',
    tom: 'Ingen konge',
    cromwell: 'Cromwell',
    karl2: 'Karl 2.',
};

/** Selve skåla. Innholdet tegnes over den, med origo midt på kanten. */
function Skal() {
    return <path d="M -160 0 Q 0 70 160 0 Z" fill="#a16207" stroke="#713f12" strokeWidth={5} />;
}

function KongeSkal({ konge, ekstra }: { konge: Konge; ekstra?: Ekstra }) {
    const tronFarge = konge === 'tom' ? '#94a3b8' : KONGEFARGE;
    return (
        <g>
            {/* Tronen */}
            <rect
                x={-62}
                y={-210}
                width={124}
                height={190}
                rx={14}
                fill={tronFarge}
                opacity={0.9}
            />
            <rect x={-80} y={-70} width={160} height={50} rx={10} fill={tronFarge} />
            <AnimatePresence mode="wait">
                {konge !== 'tom' && (
                    <motion.g
                        key={konge}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                    >
                        <Figur
                            y={-60}
                            s={1.5}
                            farge={
                                konge === 'cromwell'
                                    ? '#334155'
                                    : konge === 'fange'
                                      ? '#64748b'
                                      : '#1e1b4b'
                            }
                            krone={konge === 'karl' || konge === 'karl2' || konge === 'fange'}
                            kroneFarge={konge === 'fange' ? '#94a3b8' : GULL}
                        />
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Ekko av kongen bak Cromwell */}
            <AnimatePresence>
                {ekstra === 'speil' && (
                    <motion.g
                        key="speil"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        exit={{ opacity: 0 }}
                    >
                        <Krone x={0} y={-270} s={1.6} farge="none" strek={GULL} />
                        <text
                            y={-340}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={900}
                            fill={GULL}
                        >
                            som kongen
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Republikk: kronen er strøket */}
            <AnimatePresence>
                {(ekstra === 'republikk' || ekstra === 'sporsmal') && (
                    <motion.g
                        key="rep"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Krone x={170} y={-150} s={1.8} farge={GULL} strek="#713f12" />
                        <line
                            x1={100}
                            y1={-200}
                            x2={240}
                            y2={-100}
                            stroke="#dc2626"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                        <line
                            x1={240}
                            y1={-200}
                            x2={100}
                            y2={-100}
                            stroke="#dc2626"
                            strokeWidth={14}
                            strokeLinecap="round"
                        />
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Strafford: kongens mann, som parlamentet tar */}
            <AnimatePresence>
                {ekstra === 'strafford' && (
                    <motion.g
                        key="strafford"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.g
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ duration: 1.6, delay: 2.2 }}
                        >
                            <Figur x={128} y={-20} s={1} farge="#64748b" />
                        </motion.g>
                        <text
                            x={128}
                            y={-140}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={900}
                            fill="#334155"
                            stroke="#ffffff"
                            strokeWidth={7}
                            paintOrder="stroke"
                        >
                            Strafford
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const TYPER = [
    { farge: '#7c3aed', navn: 'adel' },
    { farge: '#f8fafc', navn: 'biskoper' },
    { farge: '#2563eb', navn: 'valgte' },
];

function Parlament({ fulle, folk }: { fulle: number; folk: boolean }) {
    return (
        <g>
            {/* Bygningen */}
            <polygon
                points="-150,-250 0,-310 150,-250"
                fill="#d6d3d1"
                stroke="#78716c"
                strokeWidth={4}
            />
            <rect
                x={-150}
                y={-250}
                width={300}
                height={230}
                fill="#e7e5e4"
                stroke="#78716c"
                strokeWidth={4}
            />
            <rect x={-130} y={-140} width={260} height={18} fill="#a8a29e" />
            <rect x={-130} y={-48} width={260} height={18} fill="#a8a29e" />
            {Array.from({ length: PLASSER }, (_, i) => {
                const rad = Math.floor(i / 6);
                const x = -105 + (i % 6) * 42;
                const y = rad === 0 ? -150 : -58;
                const vis = i < fulle;
                const farge = folk ? TYPER[i % 3].farge : PARLAMENTSFARGE;
                return (
                    <g
                        key={i}
                        style={{
                            opacity: vis ? 1 : 0,
                            transform: `translateY(${vis ? 0 : 14}px)`,
                            transition: `opacity 500ms ease ${i * 60}ms, transform 500ms ease ${i * 60}ms`,
                        }}
                    >
                        <Figur x={x} y={y} s={0.75} farge={farge} mitra={folk && i % 3 === 1} />
                    </g>
                );
            })}
            <AnimatePresence>
                {folk && (
                    <motion.g
                        key="forklaring"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {TYPER.map((t, i) => (
                            <g key={t.navn} transform={`translate(175 ${-250 + i * 46})`}>
                                <circle r={14} fill={t.farge} stroke="#334155" strokeWidth={3} />
                                <text x={20} y={10} fontSize={28} fontWeight={800} fill="#1e293b">
                                    {t.navn}
                                </text>
                            </g>
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/** Enkel figur: kropp og hode. Origo er føttene. */
function Figur({
    x = 0,
    y = 0,
    s = 1,
    farge,
    krone,
    kroneFarge = GULL,
    hjelm,
    mitra,
}: {
    x?: number;
    y?: number;
    s?: number;
    farge: string;
    krone?: boolean;
    kroneFarge?: string;
    hjelm?: boolean;
    mitra?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -24 0 L -20 -52 Q 0 -66 20 -52 L 24 0 Z"
                fill={farge}
                stroke="#1e293b"
                strokeWidth={3}
            />
            <circle cy={-76} r={17} fill="#f5d0a9" stroke="#1e293b" strokeWidth={3} />
            {krone && <Krone x={0} y={-96} s={0.55} farge={kroneFarge} strek="#713f12" />}
            {hjelm && (
                <path
                    d="M -19 -80 Q 0 -104 19 -80 Z"
                    fill="#64748b"
                    stroke="#1e293b"
                    strokeWidth={3}
                />
            )}
            {mitra && (
                <path
                    d="M -12 -90 L 0 -116 L 12 -90 Z"
                    fill="#f8fafc"
                    stroke="#1e293b"
                    strokeWidth={3}
                />
            )}
        </g>
    );
}

function Krone({
    x,
    y,
    s,
    farge,
    strek,
}: {
    x: number;
    y: number;
    s: number;
    farge: string;
    strek: string;
}) {
    return (
        <path
            transform={`translate(${x} ${y}) scale(${s})`}
            d="M -40 20 L -40 -20 L -20 0 L 0 -30 L 20 0 L 40 -20 L 40 20 Z"
            fill={farge}
            stroke={strek}
            strokeWidth={6}
            strokeLinejoin="round"
        />
    );
}

function Knapp({ x, y, farge, tekst }: { x: number; y: number; farge: string; tekst: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-66}
                y={-36}
                width={132}
                height={72}
                rx={20}
                fill={farge}
                stroke="#1e293b"
                strokeWidth={4}
            />
            <text y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
        </g>
    );
}

function Boble({ x, y, tekst }: { x: number; y: number; tekst: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-190}
                y={-40}
                width={380}
                height={80}
                rx={40}
                fill="#ffffff"
                stroke={PARLAMENTSFARGE}
                strokeWidth={5}
            />
            <text y={14} textAnchor="middle" fontSize={38} fontWeight={900} fill={PARLAMENTSFARGE}>
                {tekst}
            </text>
        </g>
    );
}

/** Skatt går fra parlamentet til kongen, men bare gjennom parlamentets ja. */
function Skattepil({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const d = `M ${fra[0] - 60} ${fra[1] - 200} Q 800 ${Math.min(fra[1], til[1]) - 380} ${til[0] + 60} ${til[1] - 240}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={GULL}
                strokeWidth={10}
                strokeDasharray="4 18"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
            <text
                x={800}
                y={Math.min(fra[1], til[1]) - 230}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#713f12"
            >
                skatt
            </text>
        </g>
    );
}
