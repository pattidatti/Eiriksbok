import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Dragonadene som et snitt gjennom husene i en gate: soldatene flytter inn, maten, pengene
 * og møblene forsvinner, familien gir opp troen, og soldatene går videre til neste hus.
 * Ingen vold vises, bare det tomme huset. «virket» viser en hel landsby som skifter farge.
 */

type Modus = 'dragonader' | 'virket';

const PROTESTANT = '#0f766e';
const KATOLSK = '#7e22ce';
const SOLDAT = '#1e3a8a';

const PERSON =
    'M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-4 8h8a2 2 0 0 1 2 2v5h-2.5v7h-7v-7H6v-5a2 2 0 0 1 2-2Z';

const BAKKE = 800;
const HUS_B = 280;
const HUS_H = 400;
const husX = (i: number) => 330 + i * 312;

function Person({ x, y, s, farge }: { x: number; y: number; s: number; farge: string }) {
    return (
        <g transform={`translate(${x - 12 * s} ${y - 24 * s}) scale(${s})`}>
            <path d={PERSON} fill={farge} />
        </g>
    );
}

/** En soldat til hest, vendt mot høyre. */
function Rytter({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} ${BAKKE})`}>
            {/* Hesten */}
            <rect x={-70} y={-110} width={130} height={50} rx={22} fill="#5b3a1f" />
            <rect
                x={40}
                y={-160}
                width={34}
                height={70}
                rx={12}
                fill="#5b3a1f"
                transform="rotate(20 57 -125)"
            />
            <rect x={56} y={-172} width={48} height={26} rx={10} fill="#5b3a1f" />
            {[-58, -30, 18, 44].map((lx) => (
                <rect key={lx} x={lx} y={-66} width={12} height={66} rx={4} fill="#4a2f18" />
            ))}
            <path d="M -70 -100 Q -100 -90 -96 -50" stroke="#3b2412" strokeWidth={10} fill="none" />
            {/* Rytteren */}
            <rect x={-26} y={-190} width={40} height={84} rx={12} fill={SOLDAT} />
            <circle cx={-6} cy={-208} r={18} fill="#e8c39e" />
            <rect x={-30} y={-232} width={48} height={14} rx={6} fill="#b91c1c" />
            <line x1={10} y1={-180} x2={40} y2={-250} stroke="#334155" strokeWidth={6} />
        </g>
    );
}

function Hus({
    i,
    katolsk,
    tomt,
    mat,
    familie,
}: {
    i: number;
    katolsk: boolean;
    tomt: boolean;
    mat: boolean;
    familie: boolean;
}) {
    const x = husX(i);
    const top = BAKKE - HUS_H;
    const farge = katolsk ? KATOLSK : PROTESTANT;
    return (
        <g>
            {/* Taket */}
            <motion.polygon
                points={`${x - 20},${top} ${x + HUS_B / 2},${top - 110} ${x + HUS_B + 20},${top}`}
                initial={false}
                animate={{ fill: katolsk ? '#6b21a8' : '#7c4a2a' }}
                transition={{ duration: 1 }}
            />
            {katolsk && (
                <motion.g
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <rect
                        x={x + HUS_B / 2 - 5}
                        y={top - 170}
                        width={10}
                        height={60}
                        fill="#fde68a"
                    />
                    <rect
                        x={x + HUS_B / 2 - 22}
                        y={top - 152}
                        width={44}
                        height={10}
                        fill="#fde68a"
                    />
                </motion.g>
            )}
            {/* Rommet (fronten er skåret bort) */}
            <motion.rect
                x={x}
                y={top}
                width={HUS_B}
                height={HUS_H}
                initial={false}
                animate={{ fill: katolsk ? '#f3e8ff' : '#ccfbf1' }}
                stroke={farge}
                strokeWidth={8}
                transition={{ duration: 1 }}
            />
            {/* Skapet */}
            <motion.g
                initial={false}
                animate={{ opacity: tomt ? 0 : 1, rotate: tomt ? -14 : 0, y: tomt ? 30 : 0 }}
                transition={{ duration: 1 }}
                style={{ transformOrigin: `${x + 230}px ${BAKKE}px` }}
            >
                <rect x={x + 200} y={BAKKE - 190} width={64} height={186} rx={6} fill="#8b5a2b" />
                <line
                    x1={x + 232}
                    y1={BAKKE - 186}
                    x2={x + 232}
                    y2={BAKKE - 8}
                    stroke="#5b3a1f"
                    strokeWidth={4}
                />
            </motion.g>
            {/* Bordet med brød og pengekiste */}
            <motion.g
                initial={false}
                animate={{ opacity: tomt ? 0 : 1, y: tomt ? 40 : 0 }}
                transition={{ duration: 1, delay: 0.4 }}
            >
                <rect x={x + 30} y={BAKKE - 96} width={150} height={14} fill="#8b5a2b" />
                <rect x={x + 40} y={BAKKE - 82} width={12} height={80} fill="#6b4428" />
                <rect x={x + 158} y={BAKKE - 82} width={12} height={80} fill="#6b4428" />
            </motion.g>
            <motion.g
                initial={false}
                animate={{ opacity: mat ? 1 : 0, x: mat ? 0 : -110, y: mat ? 0 : -60 }}
                transition={{ duration: 1.2 }}
            >
                <ellipse cx={x + 70} cy={BAKKE - 110} rx={28} ry={14} fill="#d97706" />
                <rect x={x + 112} y={BAKKE - 128} width={50} height={32} rx={4} fill="#78350f" />
                {[0, 1, 2].map((k) => (
                    <circle
                        key={k}
                        cx={x + 124 + k * 13}
                        cy={BAKKE - 134}
                        r={8}
                        fill="#eab308"
                        stroke="#a16207"
                        strokeWidth={2}
                    />
                ))}
            </motion.g>
            {/* Familien */}
            <motion.g
                initial={false}
                animate={{ x: tomt ? -10 : 0, opacity: familie ? 1 : 0 }}
                transition={{ duration: 1 }}
            >
                {[
                    { dx: 60, s: 6.4 },
                    { dx: 115, s: 7 },
                    { dx: 160, s: 4.6 },
                ].map((p, k) => (
                    <Person
                        key={k}
                        x={x + (tomt ? 40 + k * 34 : p.dx)}
                        y={BAKKE - 4}
                        s={tomt ? p.s * 0.8 : p.s}
                        farge={farge}
                    />
                ))}
            </motion.g>
        </g>
    );
}

function Gata({ beat }: { beat: number }) {
    const ryttere = beat >= 1;
    // Hvilket hus soldatene er i: 0 til og med beat 3, så 1.
    const husNr = beat >= 4 ? 1 : 0;
    const inne = beat >= 2;
    const soldatX = husX(husNr) + HUS_B - 60;
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <Hus
                    key={i}
                    i={i}
                    katolsk={i === 0 && beat >= 4}
                    tomt={i === 0 && beat >= 3}
                    mat={!(i === 0 && beat >= 2)}
                    familie
                />
            ))}
            {/* To dragoner rir inn i gata. Når de har flyttet inn, står hestene utenfor bildet. */}
            <motion.g
                initial={{ x: -400, opacity: 0 }}
                animate={{
                    x: ryttere && !inne ? 170 : inne ? 260 : -400,
                    opacity: ryttere && !inne ? 1 : 0,
                }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            >
                <Rytter x={0} />
                <g transform="translate(-140 0)">
                    <Rytter x={0} />
                </g>
            </motion.g>
            {/* Soldatene inne i huset */}
            <AnimatePresence>
                {inne && (
                    <motion.g
                        key="soldater"
                        initial={{ opacity: 0, x: soldatX - 40 }}
                        animate={{ opacity: 1, x: soldatX }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.6, ease: 'easeInOut' }}
                    >
                        <Person x={0} y={BAKKE - 4} s={5.8} farge={SOLDAT} />
                        <Person x={-56} y={BAKKE - 4} s={5.8} farge={SOLDAT} />
                        <rect
                            x={-74}
                            y={BAKKE - 150}
                            width={36}
                            height={10}
                            rx={4}
                            fill="#b91c1c"
                        />
                        <rect
                            x={-18}
                            y={BAKKE - 150}
                            width={36}
                            height={10}
                            rx={4}
                            fill="#b91c1c"
                        />
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

const LANDSBY_KOL = 8;
const LANDSBY_RAD = 4;
/** Rekkefølgen husene skifter i: 12 først (Poitou), så en hel rad, så resten opp til 24 av 32. */
function katolskeHus(beat: number): Set<number> {
    const ut = new Set<number>();
    const forste = [0, 3, 5, 6, 9, 10, 13, 15, 16, 18, 21, 22];
    const raden = [24, 25, 26, 27, 28, 29, 30, 31];
    const siste = [1, 11, 19, 20];
    forste.forEach((n) => ut.add(n));
    if (beat >= 1) raden.forEach((n) => ut.add(n));
    if (beat >= 2) siste.forEach((n) => ut.add(n));
    return ut;
}

function Landsby({ beat }: { beat: number }) {
    const katolske = katolskeHus(beat);
    const celleB = 140;
    const celleH = 150;
    const x0 = 60;
    const y0 = 180;
    return (
        <>
            {Array.from({ length: LANDSBY_KOL * LANDSBY_RAD }, (_, n) => {
                const k = n % LANDSBY_KOL;
                const r = Math.floor(n / LANDSBY_KOL);
                const x = x0 + k * celleB;
                const y = y0 + r * celleH;
                const er = katolske.has(n);
                const forsinkelse = r === 3 && beat === 1 ? 0.2 : (n % 12) * 0.12;
                return (
                    <g key={n}>
                        <motion.polygon
                            points={`${x},${y + 40} ${x + 50},${y} ${x + 100},${y + 40}`}
                            initial={false}
                            animate={{ fill: er ? '#6b21a8' : '#7c4a2a' }}
                            transition={{ duration: 0.8, delay: forsinkelse }}
                        />
                        <motion.rect
                            x={x + 8}
                            y={y + 40}
                            width={84}
                            height={70}
                            initial={false}
                            animate={{ fill: er ? '#e9d5ff' : '#99f6e4' }}
                            stroke={er ? KATOLSK : PROTESTANT}
                            strokeWidth={5}
                            transition={{ duration: 0.8, delay: forsinkelse }}
                        />
                    </g>
                );
            })}
            {/* Soldatene som er på vei, langt borte */}
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g
                        key="ryttere"
                        initial={{ opacity: 0, x: 1700 }}
                        animate={{ opacity: 1, x: 1300 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 3 }}
                    >
                        <g transform="translate(0 -60) scale(0.5) scale(-1 1)">
                            <Rytter x={0} />
                        </g>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    dragonader: [
        'Ludvig 14., fra 1681',
        'Dragoner: soldater til hest',
        'Familien må gi mat og penger',
        'Møblene selges eller knuses',
        'Mannen gir opp troen. Videre til neste hus.',
    ],
    virket: ['Poitou, 1681', '1685: hele landsbyer gir seg', 'Tre av fire ga opp troen'],
};

export function HugenotteneGate({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'dragonader';
    const lapp = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-amber-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <rect x={0} y={BAKKE} width={1600} height={140} fill="#a8a29e" />
                {modus === 'dragonader' ? <Gata beat={beat} /> : <Landsby beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-slate-900/90 text-white font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            {modus === 'dragonader' && (
                <div className="absolute top-[16%] right-[3%] flex flex-col items-end gap-2 text-xl md:text-2xl font-bold">
                    <span
                        className="px-3 py-1 rounded-xl bg-white/90"
                        style={{ color: PROTESTANT }}
                    >
                        ■ hugenotter
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white/90" style={{ color: KATOLSK }}>
                        ■ har gitt opp troen
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white/90" style={{ color: SOLDAT }}>
                        ■ dragoner
                    </span>
                </div>
            )}
            {modus === 'virket' && beat === 0 && (
                <div className="absolute right-[2%] top-[30%] w-[24%]">
                    <Teller verdi={38000} etikett="nye katolikker i Poitou, på noen få måneder" />
                </div>
            )}
            {modus === 'virket' && beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4, type: 'spring' }}
                    className="absolute right-[2%] top-[30%] w-[24%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-5xl md:text-6xl font-black" style={{ color: KATOLSK }}>
                        3 av 4
                    </div>
                    <div className="text-lg md:text-xl font-semibold text-slate-600">
                        ga opp troen på grunn av dragonadene
                    </div>
                </motion.div>
            )}
        </div>
    );
}
