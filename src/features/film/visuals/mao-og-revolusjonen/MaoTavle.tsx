import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * 2D-tavler til Mao-filmen.
 * - «prisen»: folkemøtet og prisen for landreformen. Bare tall og følger, aldri vold.
 * - «partiet»: ettpartistaten. Partiet i midten med tråder ut til alt.
 * - «dom»: strateg mot administrator.
 */

type Modus = 'prisen' | 'partiet' | 'dom';

const B = 1600;
const H = 900;

export function MaoTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'partiet';
    const mork = modus === 'prisen';
    return (
        <div
            className={`absolute inset-0 overflow-hidden ${mork ? 'bg-slate-900' : 'bg-gradient-to-b from-amber-50 to-orange-50'}`}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'prisen' && <Prisen beat={beat} />}
                {modus === 'partiet' && <Partiet beat={beat} />}
                {modus === 'dom' && <Dom beat={beat} />}
            </svg>
        </div>
    );
}

function Vis({
    synlig,
    children,
    varighet = 0.7,
}: {
    synlig: boolean;
    children: React.ReactNode;
    varighet?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: varighet }}
        >
            {children}
        </motion.g>
    );
}

function Person({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-46} r={16} fill={farge} />
            <path d="M -22 0 Q -22 -26 0 -26 Q 22 -26 22 0 Z" fill={farge} />
        </g>
    );
}

/* ---------- Prisen ---------- */

function Prisen({ beat }: { beat: number }) {
    const ring = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2;
                return { x: 560 + Math.cos(a) * 300, y: 520 + Math.sin(a) * 190 };
            }),
        []
    );
    return (
        <>
            <Vis synlig={beat <= 1}>
                <text
                    x={560}
                    y={120}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#fff"
                >
                    Folkemøtet
                </text>
                {ring.map((p, i) => (
                    <Person key={i} x={p.x} y={p.y} farge="#64748b" />
                ))}
                {ring
                    .filter((_, i) => i % 3 === 0)
                    .map((p, i) => (
                        <motion.text
                            key={i}
                            x={p.x + 18}
                            y={p.y - 80}
                            fontSize={44}
                            fontWeight={900}
                            fill="#fca5a5"
                            animate={{ opacity: beat === 0 ? [0.2, 1, 0.2] : 0 }}
                            transition={{
                                duration: 1.2,
                                repeat: beat === 0 ? Infinity : 0,
                                delay: i * 0.2,
                            }}
                        >
                            !
                        </motion.text>
                    ))}
                <g>
                    <Person x={560} y={540} farge="#e2e8f0" s={1.5} />
                </g>
                <text
                    x={560}
                    y={600}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#e2e8f0"
                >
                    godseieren
                </text>
            </Vis>
            <Vis synlig={beat <= 1}>
                <g transform="translate(1000 300)">
                    <rect
                        width={520}
                        height={130}
                        rx={24}
                        fill="#1e293b"
                        stroke="#475569"
                        strokeWidth={3}
                    />
                    <text x={30} y={60} fontSize={36} fontWeight={800} fill="#fff">
                        Landsbyen roper
                    </text>
                    <text x={30} y={104} fontSize={36} fontWeight={800} fill="#fff">
                        anklagene sine
                    </text>
                </g>
            </Vis>
            <Vis synlig={beat === 1}>
                <g transform="translate(1000 470)">
                    <rect width={520} height={110} rx={24} fill="#7f1d1d" />
                    <text
                        x={260}
                        y={70}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Mange henrettet
                    </text>
                </g>
            </Vis>
            <Vis synlig={beat === 2} varighet={1}>
                <text
                    x={800}
                    y={360}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#fca5a5"
                >
                    Flere millioner
                </text>
                <text
                    x={800}
                    y={460}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={800}
                    fill="#fff"
                >
                    drept i borgerkrigen og årene etter
                </text>
                <text
                    x={800}
                    y={560}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={600}
                    fill="#94a3b8"
                >
                    Anslag: ingen vet sikkert hvor mange
                </text>
            </Vis>
            <Vis synlig={beat >= 3} varighet={1}>
                <rect x={80} y={180} width={680} height={540} rx={40} fill="#166534" />
                <rect x={840} y={180} width={680} height={540} rx={40} fill="#7f1d1d" />
                <text
                    x={420}
                    y={430}
                    textAnchor="middle"
                    fontSize={84}
                    fontWeight={900}
                    fill="#fff"
                >
                    Frigjøring
                </text>
                <text
                    x={420}
                    y={520}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={700}
                    fill="#bbf7d0"
                >
                    jord til de fattige
                </text>
                <text
                    x={1180}
                    y={430}
                    textAnchor="middle"
                    fontSize={84}
                    fontWeight={900}
                    fill="#fff"
                >
                    Terror
                </text>
                <text
                    x={1180}
                    y={520}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={700}
                    fill="#fecaca"
                >
                    død for mange godseiere
                </text>
                <text
                    x={800}
                    y={810}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill="#fff"
                >
                    på én gang
                </text>
            </Vis>
        </>
    );
}

/* ---------- Partiet ---------- */

const NODER = [
    { id: 'aviser', x: 320, y: 230, tittel: 'Avisene', tekst: 'skriver det partiet vil', fra: 2 },
    {
        id: 'skoler',
        x: 1280,
        y: 230,
        tittel: 'Skolene',
        tekst: 'kommunismen og Maos tanker',
        fra: 3,
    },
    { id: 'kunst', x: 320, y: 700, tittel: 'Kunsten', tekst: 'glade arbeidere og bønder', fra: 4 },
    {
        id: 'valg',
        x: 1270,
        y: 700,
        tittel: 'Ett parti',
        tekst: 'farlig å kritisere Mao',
        fra: 4,
    },
];

function Partiet({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g
                        key="sitat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <rect x={180} y={260} width={1240} height={380} rx={40} fill="#7f1d1d" />
                        <text
                            x={800}
                            y={420}
                            textAnchor="middle"
                            fontSize={68}
                            fontWeight={900}
                            fill="#fff"
                        >
                            «Den politiske makten
                        </text>
                        <text
                            x={800}
                            y={510}
                            textAnchor="middle"
                            fontSize={68}
                            fontWeight={900}
                            fill="#fff"
                        >
                            kommer fra geværet.»
                        </text>
                        <text
                            x={800}
                            y={590}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={700}
                            fill="#fecaca"
                        >
                            Mao Zedong, 1938
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {beat >= 1 && (
                <>
                    {NODER.map((n) => (
                        <motion.line
                            key={n.id}
                            x1={800}
                            y1={465}
                            x2={n.x}
                            y2={n.y}
                            stroke="#b91c1c"
                            strokeWidth={beat >= 5 ? 12 : 8}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: beat >= n.fra ? 1 : 0 }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                        />
                    ))}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <circle cx={800} cy={465} r={150} fill="#b91c1c" />
                        <path
                            transform="translate(800 400) scale(3)"
                            d="M0,-10 L2.9,-3.1 L9.5,-3.1 L4.2,1.2 L5.9,8.1 L0,4 L-5.9,8.1 L-4.2,1.2 L-9.5,-3.1 L-2.9,-3.1 Z"
                            fill="#facc15"
                        />
                        <text
                            x={800}
                            y={500}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#fff"
                        >
                            PARTIET
                        </text>
                        <text
                            x={800}
                            y={550}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#fecaca"
                        >
                            styrer alt
                        </text>
                    </motion.g>
                    {NODER.map((n) => (
                        <Vis key={n.id} synlig={beat >= n.fra}>
                            <rect
                                x={n.x - 280}
                                y={n.y - 80}
                                width={560}
                                height={160}
                                rx={28}
                                fill="#fff"
                                stroke={beat === n.fra || beat >= 5 ? '#b91c1c' : '#e2e8f0'}
                                strokeWidth={5}
                            />
                            <Ikon id={n.id} x={n.x - 210} y={n.y} />
                            <text
                                x={n.x - 150}
                                y={n.y - 8}
                                fontSize={44}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {n.tittel}
                            </text>
                            <text
                                x={n.x - 150}
                                y={n.y + 40}
                                fontSize={28}
                                fontWeight={600}
                                fill="#475569"
                            >
                                {n.tekst}
                            </text>
                        </Vis>
                    ))}
                </>
            )}
            <Vis synlig={beat >= 5}>
                <rect x={250} y={812} width={1100} height={76} rx={38} fill="#0f172a" />
                <text
                    x={800}
                    y={862}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#fff"
                >
                    Bygd med vilje for å holde partiet ved makten
                </text>
            </Vis>
        </>
    );
}

function Ikon({ id, x, y }: { id: string; x: number; y: number }) {
    const farge = '#b91c1c';
    if (id === 'aviser')
        return (
            <g transform={`translate(${x} ${y})`}>
                <rect
                    x={-34}
                    y={-40}
                    width={68}
                    height={80}
                    rx={6}
                    fill="none"
                    stroke={farge}
                    strokeWidth={6}
                />
                {[-22, -6, 10, 26].map((ly) => (
                    <line
                        key={ly}
                        x1={-22}
                        y1={ly}
                        x2={22}
                        y2={ly}
                        stroke={farge}
                        strokeWidth={5}
                    />
                ))}
            </g>
        );
    if (id === 'skoler')
        return (
            <g transform={`translate(${x} ${y})`}>
                <path d="M -40 -10 L 0 -34 L 40 -10 L 0 14 Z" fill={farge} />
                <path
                    d="M -24 0 L -24 22 Q 0 38 24 22 L 24 0"
                    fill="none"
                    stroke={farge}
                    strokeWidth={6}
                />
            </g>
        );
    if (id === 'kunst')
        return (
            <g transform={`translate(${x} ${y})`}>
                <rect
                    x={-38}
                    y={-34}
                    width={76}
                    height={68}
                    rx={4}
                    fill="none"
                    stroke={farge}
                    strokeWidth={6}
                />
                <circle cx={-12} cy={-10} r={8} fill={farge} />
                <path d="M -32 28 L -6 4 L 10 18 L 32 -6 L 32 28 Z" fill={farge} />
            </g>
        );
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-34}
                y={-28}
                width={68}
                height={60}
                rx={6}
                fill="none"
                stroke={farge}
                strokeWidth={6}
            />
            <line x1={-44} y1={-40} x2={44} y2={44} stroke={farge} strokeWidth={8} />
        </g>
    );
}

/* ---------- Dom ---------- */

function Dom({ beat }: { beat: number }) {
    const venstre = ['Vant borgerkrigen', 'Holdt landet samlet', 'Bygde en stat av ruinene'];
    const hoyre = ['Forsto ikke økonomi', 'Lyttet ikke til ekspertene', 'Kommunismen styrte'];
    const kolonne = (
        x: number,
        tittel: string,
        under: string,
        punkter: string[],
        fra: number,
        farge: string,
        tegn: string
    ) => (
        <Vis synlig={beat >= fra}>
            <rect
                x={x}
                y={90}
                width={680}
                height={730}
                rx={40}
                fill="#fff"
                stroke={beat === fra || beat === fra + 1 ? farge : '#e2e8f0'}
                strokeWidth={6}
            />
            <text
                x={x + 340}
                y={200}
                textAnchor="middle"
                fontSize={72}
                fontWeight={900}
                fill={farge}
            >
                {tittel}
            </text>
            <text
                x={x + 340}
                y={260}
                textAnchor="middle"
                fontSize={32}
                fontWeight={600}
                fill="#475569"
            >
                {under}
            </text>
            {punkter.map((p, i) => (
                <Vis key={p} synlig={beat >= fra + 1}>
                    <g transform={`translate(${x + 60} ${380 + i * 140})`}>
                        <circle cx={30} cy={-12} r={34} fill={farge} />
                        <text
                            x={30}
                            y={2}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#fff"
                        >
                            {tegn}
                        </text>
                        <text x={90} y={2} fontSize={40} fontWeight={800} fill="#0f172a">
                            {p}
                        </text>
                    </g>
                </Vis>
            ))}
        </Vis>
    );
    return (
        <>
            {kolonne(80, 'Strateg', 'legger planer for å vinne', venstre, 0, '#15803d', '✓')}
            {kolonne(
                840,
                'Administrator',
                'sjef for den daglige driften',
                hoyre,
                2,
                '#b91c1c',
                '✗'
            )}
        </>
    );
}
