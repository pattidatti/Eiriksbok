import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Maktens poler, tegnet som et nettverk. Små prikker er land, store sirkler er poler
 * (maktsentre), og strekene viser hvem landene trekkes mot.
 * «poler»: én pol, så to (bipolar), landene velger side, Sovjetunionen forsvinner, og USA
 * står alene med baser over hele kloden.
 * «ideer»: Fukuyama i 1989, tautrekkingen mellom ideene, og landene som skal følge etter.
 * «etter»: etter 2008 vokser Kina og Russland fram, og USA er ikke lenger alene.
 */

type Modus = 'poler' | 'ideer' | 'etter';

const B = 1600;
const H = 900;
const MIDT = { x: 800, y: 480 };

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const LAND = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2 + frø(i) * 0.12;
    const r = 0.78 + frø(i + 50) * 0.22;
    return { x: MIDT.x + Math.cos(a) * 620 * r, y: MIDT.y + Math.sin(a) * 300 * r };
});

const FARGE = {
    usa: '#2563eb',
    sovjet: '#dc2626',
    noytral: '#475569',
    land: '#94a3b8',
    kina: '#ca8a04',
    russland: '#b91c1c',
};

interface Pol {
    id: string;
    navn: string;
    farge: string;
    x: number;
    y: number;
    r: number;
}

function polerFor(modus: Modus, beat: number): Pol[] {
    if (modus === 'poler') {
        if (beat === 0) return [{ id: 'usa', navn: 'Pol', farge: FARGE.noytral, x: MIDT.x, y: MIDT.y, r: 80 }];
        if (beat <= 2)
            return [
                { id: 'usa', navn: 'USA', farge: FARGE.usa, x: 520, y: MIDT.y, r: 80 },
                { id: 'sovjet', navn: 'Sovjetunionen', farge: FARGE.sovjet, x: 1080, y: MIDT.y, r: 80 },
            ];
        return [
            { id: 'usa', navn: 'USA', farge: FARGE.usa, x: MIDT.x, y: MIDT.y, r: 105 },
            { id: 'sovjet', navn: '', farge: FARGE.sovjet, x: 1080, y: MIDT.y, r: 0 },
        ];
    }
    // etter
    if (beat === 0) return [{ id: 'usa', navn: 'USA', farge: FARGE.usa, x: MIDT.x, y: MIDT.y, r: 105 }];
    return [
        { id: 'usa', navn: 'USA', farge: FARGE.usa, x: 470, y: MIDT.y, r: beat >= 2 ? 82 : 100 },
        { id: 'kina', navn: 'Kina', farge: FARGE.kina, x: 1130, y: 420, r: 82 },
        { id: 'russland', navn: 'Russland', farge: FARGE.russland, x: 820, y: 640, r: 64 },
    ];
}

/** Hvilken pol landet trekkes mot. */
function polForLand(modus: Modus, beat: number, i: number, poler: Pol[]): Pol | null {
    const land = LAND[i];
    if (modus === 'poler') {
        if (beat === 1) return null;
        if (beat === 2) return land.x < 800 ? poler[0] : poler[1];
        return poler[0];
    }
    if (beat === 0) return poler[0];
    let best = poler[0];
    let bestD = Infinity;
    for (const p of poler) {
        const d = Math.hypot(p.x - land.x, p.y - land.y) / p.r;
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    return best;
}

export function UnipolarPoler({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'poler';
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-100">
            {modus === 'ideer' ? <Ideer beat={beat} /> : <Nettverk modus={modus} beat={beat} />}
        </div>
    );
}

function Nettverk({ modus, beat }: { modus: Modus; beat: number }) {
    const poler = polerFor(modus, beat);
    const baser = modus === 'poler' && beat >= 4;
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {LAND.map((l, i) => {
                    const p = polForLand(modus, beat, i, poler);
                    const synlig = p && p.r > 0;
                    return (
                        <motion.line
                            key={`s${i}`}
                            x1={l.x}
                            y1={l.y}
                            initial={false}
                            animate={{
                                x2: synlig ? p.x : l.x,
                                y2: synlig ? p.y : l.y,
                                opacity: synlig ? 0.55 : 0,
                            }}
                            transition={{ duration: 1.2, delay: (i % 11) * 0.05 }}
                            stroke={synlig ? p.farge : FARGE.land}
                            strokeWidth={3}
                        />
                    );
                })}
                {LAND.map((l, i) => {
                    const p = polForLand(modus, beat, i, poler);
                    const farge = p && p.r > 0 && !(modus === 'poler' && beat === 0) ? p.farge : FARGE.land;
                    return (
                        <motion.circle
                            key={`l${i}`}
                            cx={l.x}
                            cy={l.y}
                            r={13}
                            initial={false}
                            animate={{ fill: farge }}
                            transition={{ duration: 0.9, delay: (i % 11) * 0.05 }}
                            stroke="#ffffff"
                            strokeWidth={3}
                        />
                    );
                })}
                {baser &&
                    LAND.filter((_, i) => i % 3 === 0).map((l, i) => (
                        <motion.path
                            key={`b${i}`}
                            d={`M ${l.x} ${l.y - 40} l 14 24 l -28 0 Z`}
                            fill={FARGE.usa}
                            stroke="#ffffff"
                            strokeWidth={3}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.12 }}
                        />
                    ))}
                {poler.map((p) => (
                    <g key={p.id}>
                        <motion.circle
                            initial={false}
                            animate={{ cx: p.x, cy: p.y, r: p.r, fill: p.farge }}
                            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
                            stroke="#ffffff"
                            strokeWidth={6}
                        />
                        {p.r > 0 && (
                            <motion.text
                                key={`${p.id}-${p.navn}-${p.x}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                x={p.x}
                                y={p.navn.length > 6 ? p.y + p.r + 40 : p.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill={p.navn.length > 6 ? p.farge : '#ffffff'}
                                stroke={p.navn.length > 6 ? '#ffffff' : 'none'}
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {p.navn}
                            </motion.text>
                        )}
                    </g>
                ))}
                {modus === 'etter' && beat >= 2 && (
                    <motion.path
                        d="M 445 395 L 480 450 L 455 490 L 495 560"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.9, delay: 0.8 }}
                    />
                )}
            </svg>
            <AnimatePresence>
                {modus === 'poler' && beat === 0 && <Brikke key="p0" tekst="En pol = et maktsentrum" />}
                {modus === 'poler' && beat === 1 && <Brikke key="p1" tekst="Bipolar: to poler" />}
                {modus === 'poler' && beat === 2 && <Brikke key="p2" tekst="Land etter land valgte side" />}
                {modus === 'poler' && beat === 3 && <Brikke key="p3" tekst="Unipolar: én pol" />}
                {modus === 'poler' && beat === 4 && <Brikke key="p4" tekst="Største økonomi, baser over hele kloden" />}
                {modus === 'etter' && beat === 0 && <Brikke key="e0" tekst="Historiens slutt?" strek />}
                {modus === 'etter' && beat === 1 && <Brikke key="e1" tekst="Kina og Russland vokser fram" />}
                {modus === 'etter' && beat === 2 && <Brikke key="e2" tekst="Ikke lenger bare én supermakt" farge="rod" />}
            </AnimatePresence>
        </>
    );
}

/** Fukuyama og kampen mellom ideer. */
function Ideer({ beat }: { beat: number }) {
    // Knuten i tauet: midt på til beat 2, så dras den mot høyre.
    const knute = beat >= 2 ? 1080 : 800;
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <AnimatePresence>
                    {beat <= 1 && (
                        <motion.g
                            key="ark"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.7 }}
                        >
                            <rect x={480} y={170} width={640} height={600} rx={18} fill="#ffffff" stroke="#0f172a" strokeWidth={5} />
                            <text x={800} y={260} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                                1989
                            </text>
                            <text x={800} y={320} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                                Francis Fukuyama
                            </text>
                            {[0, 1, 2, 3].map((i) => (
                                <rect key={i} x={560} y={380 + i * 44} width={i === 3 ? 300 : 480} height={14} rx={7} fill="#cbd5e1" />
                            ))}
                            {beat === 1 && (
                                <motion.text
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring' }}
                                    style={{ transformOrigin: '800px 650px' }}
                                    x={800}
                                    y={680}
                                    textAnchor="middle"
                                    fontSize={58}
                                    fontWeight={900}
                                    fill="#1d4ed8"
                                >
                                    Historiens slutt?
                                </motion.text>
                            )}
                        </motion.g>
                    )}
                </AnimatePresence>

                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <line x1={420} y1={470} x2={1140} y2={470} stroke="#a16207" strokeWidth={14} strokeLinecap="round" />
                        <motion.g initial={{ x: 0 }} animate={{ x: knute - 800 }} transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.3 }}>
                            <circle cx={800} cy={470} r={26} fill="#0f172a" />
                        </motion.g>
                        <line x1={800} y1={420} x2={800} y2={520} stroke="#0f172a" strokeWidth={4} strokeDasharray="10 8" />
                        <motion.rect
                            x={40}
                            y={380}
                            width={380}
                            height={180}
                            rx={20}
                            fill={FARGE.sovjet}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 2.2, duration: 1 }}
                        />
                        <text x={230} y={478} textAnchor="middle" dominantBaseline="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                            Kommunisme
                        </text>
                        <rect x={1140} y={380} width={430} height={180} rx={20} fill={FARGE.usa} />
                        <text x={1355} y={448} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                            Demokrati og
                        </text>
                        <text x={1355} y={498} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                            markedsøkonomi
                        </text>
                    </motion.g>
                )}

                {beat >= 3 &&
                    Array.from({ length: 22 }, (_, i) => {
                        const fraX = 200 + (i % 11) * 110;
                        const fraY = i < 11 ? 680 : 780;
                        const tilX = 1120 + (i % 6) * 70;
                        const tilY = 640 + Math.floor(i / 6) * 55;
                        return (
                            <motion.circle
                                key={i}
                                r={16}
                                stroke="#ffffff"
                                strokeWidth={3}
                                initial={{ cx: fraX, cy: fraY, fill: FARGE.land }}
                                animate={{ cx: tilX, cy: tilY, fill: FARGE.usa }}
                                transition={{ duration: 1.6, delay: 0.3 + i * 0.12 }}
                            />
                        );
                    })}

                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Ikonkort x={140} y={110} tittel="Stemme" ikon="urne" />
                        <Ikonkort x={540} y={110} tittel="Handle" ikon="handel" />
                        <text x={1200} y={200} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
                            = alt ordner seg?
                        </text>
                    </motion.g>
                )}
            </svg>
            <AnimatePresence>
                {beat === 0 && <Brikke key="i0" tekst="I Vesten: jubel" />}
                {beat === 2 && <Brikke key="i2" tekst="Kampen mellom ideer er avgjort?" />}
                {beat === 3 && <Brikke key="i3" tekst="Resten av verden følger etter?" />}
            </AnimatePresence>
        </>
    );
}

function Ikonkort({ x, y, tittel, ikon }: { x: number; y: number; tittel: string; ikon: 'urne' | 'handel' }) {
    return (
        <g>
            <rect x={x} y={y} width={340} height={150} rx={20} fill="#ffffff" stroke="#0f172a" strokeWidth={4} />
            {ikon === 'urne' ? (
                <g transform={`translate(${x + 40} ${y + 35})`}>
                    <rect x={0} y={30} width={80} height={60} rx={6} fill="#2563eb" />
                    <rect x={20} y={24} width={40} height={8} fill="#0f172a" />
                    <rect x={28} y={0} width={24} height={30} fill="#f8fafc" stroke="#0f172a" strokeWidth={3} />
                </g>
            ) : (
                <g transform={`translate(${x + 40} ${y + 35})`}>
                    <circle cx={22} cy={45} r={22} fill="#ca8a04" />
                    <circle cx={58} cy={45} r={22} fill="#eab308" stroke="#ffffff" strokeWidth={3} />
                    <text x={58} y={54} textAnchor="middle" fontSize={26} fontWeight={900} fill="#ffffff">
                        $
                    </text>
                </g>
            )}
            <text x={x + 225} y={y + 88} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                {tittel}
            </text>
        </g>
    );
}

function Brikke({ tekst, farge, strek }: { tekst: string; farge?: 'rod'; strek?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            <span className="relative">
                {tekst}
                {strek && (
                    <motion.span
                        className="absolute left-0 top-1/2 h-1.5 bg-red-600 rounded"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1.6, duration: 0.8 }}
                    />
                )}
            </span>
        </motion.div>
    );
}
