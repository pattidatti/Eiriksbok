import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fristene på en tidslinje fra dagen du fikk varen. Fire moduser:
 * - frister: reklamasjon i to år, fem år for ting som skal vare lenge (TV mot ledning).
 * - mia: garantien på ett år, Mias mobil som dør etter 13 måneder, «si fra innen rimelig tid».
 * - bevis: feil innen to år regnes som der fra kjøpet, og butikken må bevise.
 * - tolv: 14 dagers angrerett mot 12 måneder ekstra når butikken ikke har sagt fra.
 */

type Modus = 'frister' | 'mia' | 'bevis' | 'tolv';

const X0 = 200;
const X1 = 1420;
/** Lengden på aksen i måneder. */
const SPENN: Record<Modus, number> = { frister: 60, mia: 30, bevis: 30, tolv: 13 };

const OVERSKRIFT: Record<Modus, string[]> = {
    frister: ['Hvor lenge kan du klage?', 'Ting som skal vare lenge', 'TV mot ledning'],
    mia: [
        'Mias mobil',
        'Mobilen dør etter 13 måneder',
        'Si fra innen rimelig tid',
        'Klag med en gang',
    ],
    bevis: ['En regel til', 'Feil innen to år', 'Hvem må bevise?'],
    tolv: ['Butikken må si fra om angreretten', 'Glemmer butikken det'],
};

const TEAL = '#0d9488';
const MORK = '#115e59';
const GULL = '#d97706';
const ROD = '#dc2626';

function Akse({ modus }: { modus: Modus }) {
    const spenn = SPENN[modus];
    const x = (m: number) => X0 + (m / spenn) * (X1 - X0);
    const merker: [number, string][] =
        modus === 'frister'
            ? [
                  [0, 'Du fikk varen'],
                  [12, '1 år'],
                  [24, '2 år'],
                  [60, '5 år'],
              ]
            : modus === 'tolv'
              ? [[0, 'Du fikk varen']]
              : [
                    [0, 'Du fikk varen'],
                    [12, '1 år'],
                    [24, '2 år'],
                ];
    return (
        <g>
            <line x1={X0} y1={720} x2={X1 + 40} y2={720} stroke="#334155" strokeWidth={5} />
            {merker.map(([m, t]) => (
                <g key={t}>
                    <line x1={x(m)} y1={705} x2={x(m)} y2={735} stroke="#334155" strokeWidth={5} />
                    <text
                        x={x(m)}
                        y={modus === 'frister' && m === 0 ? 835 : 785}
                        textAnchor={m === 0 ? 'start' : 'middle'}
                        fontSize={38}
                        fontWeight={700}
                        fill="#334155"
                    >
                        {t}
                    </text>
                </g>
            ))}
        </g>
    );
}

/** En stolpe langs tidslinja som vokser fram fra venstre. */
function Stolpe({
    fra,
    til,
    y,
    farge,
    tekst,
    spenn,
    dempet = false,
    hoyde = 70,
}: {
    fra: number;
    til: number;
    y: number;
    farge: string;
    tekst: string;
    spenn: number;
    dempet?: boolean;
    hoyde?: number;
}) {
    const x = (m: number) => X0 + (m / spenn) * (X1 - X0);
    const bredde = Math.max(8, x(til) - x(fra));
    return (
        <g>
            <motion.rect
                x={x(fra)}
                y={y}
                height={hoyde}
                rx={14}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: bredde, opacity: dempet ? 0.3 : 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            <motion.text
                x={x(fra)}
                y={y - 18}
                fontSize={40}
                fontWeight={800}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: dempet ? 0.45 : 1 }}
                transition={{ delay: 0.3 }}
            >
                {tekst}
            </motion.text>
        </g>
    );
}

function Tv({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-80} y={-60} width={160} height={100} rx={8} fill="#1e293b" />
            <rect x={-70} y={-52} width={140} height={84} rx={4} fill="#38bdf8" />
            <rect x={-10} y={40} width={20} height={16} fill="#1e293b" />
            <rect x={-40} y={56} width={80} height={8} rx={4} fill="#1e293b" />
        </g>
    );
}

function Ledning({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -70 0 C -30 -50, 10 50, 50 0"
                fill="none"
                stroke="#1e293b"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <rect x={48} y={-14} width={34} height={28} rx={5} fill="#1e293b" />
            <rect x={80} y={-8} width={14} height={5} fill="#94a3b8" />
            <rect x={80} y={4} width={14} height={5} fill="#94a3b8" />
        </g>
    );
}

function Frister({ beat }: { beat: number }) {
    const s = SPENN.frister;
    const x = (m: number) => X0 + (m / s) * (X1 - X0);
    return (
        <g>
            <Stolpe
                fra={0}
                til={24}
                y={330}
                farge={TEAL}
                tekst="Vanlige varer: minst 2 år"
                spenn={s}
            />
            {beat >= 1 && (
                <Stolpe
                    fra={0}
                    til={60}
                    y={540}
                    farge={MORK}
                    tekst="Ting som skal vare lenge: 5 år"
                    spenn={s}
                />
            )}
            {beat >= 2 && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Ledning x={x(24) + 110} y={365} />
                        <text x={x(24) + 230} y={380} fontSize={40} fontWeight={700} fill="#1e293b">
                            Ledning
                        </text>
                    </motion.g>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Tv x={x(60) - 110} y={445} />
                        <text
                            x={x(60) - 215}
                            y={455}
                            textAnchor="end"
                            fontSize={44}
                            fontWeight={800}
                            fill="#1e293b"
                        >
                            TV
                        </text>
                    </motion.g>
                </>
            )}
        </g>
    );
}

/** Pinnen som viser når Mias mobil døde. */
function MiaPinne({ x }: { x: number }) {
    return (
        <g>
            <line x1={x} y1={300} x2={x} y2={720} stroke={ROD} strokeWidth={6} />
            <circle cx={x} cy={720} r={14} fill={ROD} />
            <rect
                x={x - 14}
                y={230}
                width={300}
                height={64}
                rx={14}
                fill="#fff"
                stroke={ROD}
                strokeWidth={4}
            />
            <text x={x + 136} y={274} textAnchor="middle" fontSize={36} fontWeight={800} fill={ROD}>
                Lader ikke
            </text>
        </g>
    );
}

function Mia({ beat }: { beat: number }) {
    const s = SPENN.mia;
    const x = (m: number) => X0 + (m / s) * (X1 - X0);
    return (
        <g>
            <Stolpe
                fra={0}
                til={12}
                y={420}
                farge={GULL}
                tekst="Garanti: 1 år"
                spenn={s}
                dempet={beat >= 1}
            />
            {beat >= 1 && (
                <>
                    <Stolpe
                        fra={0}
                        til={24}
                        y={580}
                        farge={TEAL}
                        tekst="Reklamasjon: minst 2 år"
                        spenn={s}
                        hoyde={60}
                    />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <MiaPinne x={x(13)} />
                    </motion.g>
                </>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path
                        d={`M ${x(13)} 360 L ${x(13)} 340 L ${x(15)} 340 L ${x(15)} 360`}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={5}
                    />
                    <text x={x(15) + 20} y={360} fontSize={36} fontWeight={700} fill="#1e293b">
                        {beat >= 3 ? 'Si fra: aldri under 2 måneder' : 'Si fra innen rimelig tid'}
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ transformOrigin: `${x(22)}px 470px` }}
                >
                    <rect x={x(17)} y={430} width={420} height={80} rx={20} fill={ROD} />
                    <text
                        x={x(17) + 210}
                        y={484}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Klag med en gang!
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Kort({
    x,
    tittel,
    tekst,
    farge,
}: {
    x: number;
    tittel: string;
    tekst: string;
    farge: string;
}) {
    return (
        <g>
            <rect
                x={x}
                y={150}
                width={480}
                height={140}
                rx={22}
                fill="#fff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={x + 240}
                y={207}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={farge}
            >
                {tittel}
            </text>
            <text
                x={x + 240}
                y={262}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#334155"
            >
                {tekst}
            </text>
        </g>
    );
}

function Bevis({ beat }: { beat: number }) {
    const s = SPENN.bevis;
    const x = (m: number) => X0 + (m / s) * (X1 - X0);
    return (
        <g>
            <Stolpe fra={0} til={24} y={580} farge={TEAL} tekst="Innen 2 år" spenn={s} hoyde={60} />
            <line x1={x(13)} y1={480} x2={x(13)} y2={720} stroke={ROD} strokeWidth={6} />
            <circle cx={x(13)} cy={720} r={14} fill={ROD} />
            <text x={x(13) + 20} y={500} fontSize={34} fontWeight={800} fill={ROD}>
                Feilen viser seg
            </text>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.path
                        d={`M ${x(13)} 470 C ${x(10)} 380, ${x(2)} 380, ${x(0) + 10} 500`}
                        fill="none"
                        stroke={MORK}
                        strokeWidth={7}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.1 }}
                    />
                    <path
                        d={`M ${x(0) - 6} 486 L ${x(0) + 10} 512 L ${x(0) + 30} 486`}
                        fill={MORK}
                    />
                    <text x={x(3)} y={365} fontSize={34} fontWeight={800} fill={MORK}>
                        Regnes som der fra kjøpet
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Kort x={260} tittel="Mia" tekst="må ikke bevise feilen" farge={TEAL} />
                    <Kort x={860} tittel="Butikken" tekst="må vise at hun ødela den" farge={ROD} />
                </motion.g>
            )}
        </g>
    );
}

function Tolv({ beat }: { beat: number }) {
    const s = SPENN.tolv;
    const fjorten = 14 / 30;
    const x = (m: number) => X0 + (m / s) * (X1 - X0);
    return (
        <g>
            <Stolpe
                fra={0}
                til={fjorten}
                y={360}
                farge={TEAL}
                tekst="Angrerett: 14 dager"
                spenn={s}
            />
            {beat >= 1 && (
                <>
                    <Stolpe
                        fra={fjorten}
                        til={12 + fjorten}
                        y={560}
                        farge={GULL}
                        tekst="Ingen beskjed: opptil 12 måneder ekstra"
                        spenn={s}
                    />
                    <motion.text
                        x={x(12 + fjorten)}
                        y={785}
                        textAnchor="end"
                        fontSize={38}
                        fontWeight={700}
                        fill="#334155"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        + 12 måneder
                    </motion.text>
                </>
            )}
        </g>
    );
}

export function ForbrukerTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'frister';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 bg-slate-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tittel}
                        x={800}
                        y={110}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tittel}
                    </motion.text>
                </AnimatePresence>
                <Akse modus={modus} />
                {modus === 'frister' && <Frister beat={beat} />}
                {modus === 'mia' && <Mia beat={beat} />}
                {modus === 'bevis' && <Bevis beat={beat} />}
                {modus === 'tolv' && <Tolv beat={beat} />}
            </svg>
        </div>
    );
}
