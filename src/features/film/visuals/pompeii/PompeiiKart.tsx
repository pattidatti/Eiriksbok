import { AnimatePresence, motion } from 'framer-motion';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';

/**
 * Kart over Napolibukta, forenklet. «byer»: Vesuv og de fire byene som ble begravd.
 * «plinius»: Misenum, der Plinius den yngre så utbruddet over bukta. «onkel»: flåten fra
 * Misenum seiler mot Stabiae, der Plinius den eldre døde.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'byer' | 'plinius' | 'onkel';

const VEST = 13.82;
const OST = 14.76;
const SOR = 40.56;
const NORD = 40.96;
const xy = ([lng, lat]: LngLat): [number, number] => [
    ((lng - VEST) / (OST - VEST)) * B,
    ((NORD - lat) / (NORD - SOR)) * H,
];

/** Land rundt bukta: fra Punta Campanella langs kysten til Misenum, rundt kanten og tilbake. */
const LAND: LngLat[] = [
    [14.33, 40.57],
    [14.375, 40.627],
    [14.43, 40.66],
    [14.475, 40.695],
    [14.47, 40.735],
    [14.44, 40.757],
    [14.37, 40.785],
    [14.345, 40.803],
    [14.3, 40.825],
    [14.25, 40.838],
    [14.2, 40.81],
    [14.16, 40.8],
    [14.12, 40.82],
    [14.09, 40.79],
    [14.07, 40.775],
    [14.03, 40.8],
    [13.95, 40.82],
    [13.8, 40.84],
    [13.8, 40.98],
    [14.78, 40.98],
    [14.78, 40.66],
    [14.6, 40.63],
    [14.49, 40.625],
    [14.4, 40.6],
];
const CAPRI: LngLat[] = [
    [14.19, 40.555],
    [14.22, 40.565],
    [14.26, 40.555],
    [14.25, 40.54],
    [14.2, 40.54],
];

const VESUV: LngLat = [14.426, 40.821];
const BYER: { navn: string; p: LngLat; fra: number; side: 'v' | 'h'; dy?: number }[] = [
    { navn: 'Pompeii', p: [14.485, 40.749], fra: 1, side: 'h' },
    { navn: 'Herculaneum', p: [14.348, 40.806], fra: 2, side: 'v' },
    { navn: 'Oplontis', p: [14.452, 40.757], fra: 2, side: 'v', dy: 18 },
    { navn: 'Stabiae', p: [14.49, 40.70], fra: 2, side: 'h' },
];
const MISENUM: LngLat = [14.08, 40.78];

const sti = (pts: LngLat[]) => 'M' + pts.map((p) => xy(p).join(',')).join('L') + 'Z';

function Merke({ p, navn, side, farge = '#1e293b', dy = 0 }: { p: LngLat; navn: string; side: 'v' | 'h'; farge?: string; dy?: number }) {
    const [x, y] = xy(p);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <circle cx={x} cy={y} r={13} fill={farge} stroke="#fff" strokeWidth={4} />
            <text
                x={side === 'h' ? x + 24 : x - 24}
                y={y + 11 + dy}
                textAnchor={side === 'h' ? 'start' : 'end'}
                fontSize={36}
                fontWeight={800}
                fill="#0f172a"
                stroke="#f8f5ec"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
}

function Fjell({ morkt }: { morkt: boolean }) {
    const [x, y] = xy(VESUV);
    return (
        <g>
            <path d={`M${x - 70},${y + 40} L${x - 16},${y - 34} L${x + 16},${y - 34} L${x + 70},${y + 40} Z`} fill="#7c6a55" stroke="#4a3d30" strokeWidth={3} />
            <motion.ellipse
                cx={x}
                cy={y - 110}
                rx={80}
                ry={60}
                fill="#57514b"
                initial={{ opacity: 0 }}
                animate={{ opacity: morkt ? 0.9 : 0 }}
                transition={{ duration: 1.2 }}
            />
            <motion.rect
                x={x - 9}
                y={y - 110}
                width={18}
                height={78}
                fill="#57514b"
                initial={{ opacity: 0 }}
                animate={{ opacity: morkt ? 0.9 : 0 }}
                transition={{ duration: 1.2 }}
            />
            <text x={x} y={y + 80} textAnchor="middle" fontSize={38} fontWeight={900} fill="#7c2d12" stroke="#f8f5ec" strokeWidth={8} paintOrder="stroke">
                Vesuv
            </text>
        </g>
    );
}

const OVERSKRIFT: Record<Modus, (string | null)[]> = {
    byer: ['Napolibukta i Sør-Italia', 'Pompeii', 'Fire byer begravd', 'Samme fjell, samme døgn'],
    plinius: ['Hvem så det?', 'Plinius den yngre, 17-18 år', 'På andre siden av bukta', 'Brev til Tacitus'],
    onkel: ['Flåten i Misenum', 'Ut for å se og redde', 'Rett mot utbruddet', 'Plinius den eldre dør i Stabiae'],
};

export function PompeiiKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'byer';
    const overskrift = OVERSKRIFT[modus][Math.min(beat, 3)];
    const [mx, my] = xy(MISENUM);
    const [vx, vy] = xy(VESUV);
    const [sx, sy] = xy(BYER[3].p);
    const visByer = modus === 'byer' ? BYER.filter((b) => b.fra <= beat) : modus === 'onkel' && beat >= 3 ? [BYER[3]] : [];
    const visMisenum = modus !== 'byer' && (modus === 'onkel' || beat >= 1);
    const rute = `M${mx + 20},${my + 10} Q${(mx + sx) / 2},${sy + 150} ${sx - 22},${sy + 6}`;
    return (
        <div className="absolute inset-0 bg-[#bfd9e6]">
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <rect width={B} height={H} fill="#bfd9e6" />
                <path d={sti(LAND)} fill="#e9e1c8" stroke="#a89f84" strokeWidth={3} />
                <path d={sti(CAPRI)} fill="#e9e1c8" stroke="#a89f84" strokeWidth={3} />
                <text x={xy([14.2, 40.7])[0]} y={xy([14.2, 40.7])[1]} textAnchor="middle" fontSize={34} fontStyle="italic" fill="#3b6c86" opacity={0.8}>
                    Napolibukta
                </text>
                <Fjell morkt={modus === 'onkel' ? beat >= 2 : modus === 'plinius' ? beat >= 2 : false} />
                {modus === 'byer' && beat >= 3 && (
                    <motion.ellipse
                        cx={(vx + sx) / 2 + 10}
                        cy={(vy + sy) / 2}
                        rx={260}
                        ry={200}
                        fill="#78716c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.28 }}
                        transition={{ duration: 1.4 }}
                    />
                )}
                {modus === 'plinius' && beat >= 2 && (
                    <motion.line
                        x1={mx + 18}
                        y1={my}
                        x2={vx - 60}
                        y2={vy - 30}
                        stroke="#b45309"
                        strokeWidth={5}
                        strokeDasharray="16 12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                {modus === 'onkel' && beat >= 1 && (
                    <motion.path
                        d={rute}
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth={7}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 2 ? 1 : 0.45 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                )}
                {modus === 'onkel' &&
                    [0, 1, 2].map((i) => (
                        <motion.path
                            key={i}
                            d={`M${mx + 40 + i * 34},${my + 40 + i * 16} l26,0 l-6,12 l-14,0 Z M${mx + 53 + i * 34},${my + 40 + i * 16} l0,-24 l14,18 Z`}
                            fill="#1e3a8a"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat === 0 ? 1 : 0.35 }}
                        />
                    ))}
                <AnimatePresence>
                    {visByer.map((b) => (
                        <Merke key={b.navn} p={b.p} navn={b.navn} side={b.side} dy={b.dy} farge={modus === 'onkel' ? '#991b1b' : '#1e293b'} />
                    ))}
                    {visMisenum && <Merke key="misenum" p={MISENUM} navn={modus === 'plinius' ? 'Plinius den yngre' : 'Misenum'} side="h" farge="#1d4ed8" dy={-34} />}
                </AnimatePresence>
                {modus === 'plinius' && beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={mx - 30} y={my + 50} width={86} height={60} rx={6} fill="#fff" stroke="#1d4ed8" strokeWidth={4} />
                        <path d={`M${mx - 30},${my + 50} L${mx + 13},${my + 86} L${mx + 56},${my + 50}`} fill="none" stroke="#1d4ed8" strokeWidth={4} />
                    </motion.g>
                )}
            </svg>
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
            <Oversiktskart
                utsnitt={[
                    [VEST, SOR],
                    [OST, NORD],
                ]}
                omrade={[
                    [6, 36.5],
                    [19, 47.5],
                ]}
                plassering="nede-venstre"
                etikett="Italia"
            />
        </div>
    );
}
