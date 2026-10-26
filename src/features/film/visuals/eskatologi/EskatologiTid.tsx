import { useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tiden tegnet. «hjul»: sirkulær tid, fire faser og fire verdensaldre (yugaer). «pil»: lineær
 * tid fra skapelsen til målet. «vekt»: lys mot mørke i Persia, og ilden ved tidens ende.
 * «fortelling»: hvorfor vi trenger en slutt (mening og kontroll).
 */

type Modus = 'hjul' | 'pil' | 'vekt' | 'fortelling';

const B = 1600;
const H = 900;

const OVERSKRIFT: Record<Modus, string[]> = {
    hjul: ['Tiden som et hjul', 'Skapes, blomstrer, forfaller, går under', 'Fire verdensaldre: yugaer', 'Vi lever i kaliyuga', 'Slutten er en renselse'],
    pil: ['Tiden som en pil', 'Fra skapelsen til målet', 'Fire religioner, samme pil', 'Én sjanse'],
    vekt: ['Lys mot mørke', 'Velg side', 'Saoshyant: frelseren', 'Ilden ved tidens ende', 'Sluttpunkt + valg'],
    fortelling: ['Hvorfor slutten?', '1. Vi liker fortellinger', 'Et mål gir mening', '2. Kontroll i krisetid', 'Ikke kaos, men en plan'],
};

/** Vinkel som går rundt mens filmen spiller, og står stille på pause. */
function useVinkel(playing: boolean, fart: number) {
    const [vinkel, setVinkel] = useState(0);
    const sist = useRef<number | null>(null);
    useAnimationFrame((tid) => {
        const forrige = sist.current;
        sist.current = tid;
        if (!playing || forrige === null) return;
        setVinkel((a) => (a + ((tid - forrige) / 1000) * fart) % (Math.PI * 2));
    });
    return vinkel;
}

function bue(cx: number, cy: number, r: number, fra: number, til: number) {
    const x1 = cx + Math.cos(fra) * r;
    const y1 = cy + Math.sin(fra) * r;
    const x2 = cx + Math.cos(til) * r;
    const y2 = cy + Math.sin(til) * r;
    const stor = til - fra > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${stor} 1 ${x2} ${y2}`;
}

const tekstStil = { stroke: '#0f172a', strokeWidth: 0, paintOrder: 'stroke' as const };

function Hjul({ beat, playing }: { beat: number; playing: boolean }) {
    const cx = 800;
    const cy = 500;
    const r = 270;
    const vinkel = useVinkel(playing, beat >= 2 ? 0.5 : 0.9);
    const yuga = beat >= 2;
    const faser = yuga
        ? [
              { navn: '1. yuga', farge: '#facc15' },
              { navn: '2. yuga', farge: '#f59e0b' },
              { navn: '3. yuga', farge: '#ea580c' },
              { navn: 'kaliyuga', farge: '#b91c1c' },
          ]
        : [
              { navn: 'skapes', farge: '#38bdf8' },
              { navn: 'blomstrer', farge: '#22c55e' },
              { navn: 'forfaller', farge: '#f59e0b' },
              { navn: 'går under', farge: '#64748b' },
          ];
    const start = -Math.PI / 2;
    // Fra beat 3 står markøren i kaliyuga og går over toppen til en ny runde.
    const beatStart = useRef<{ beat: number; tid: number } | null>(null);
    const [sidenBeat, setSidenBeat] = useState(0);
    useAnimationFrame((tid) => {
        if (!beatStart.current || beatStart.current.beat !== beat) beatStart.current = { beat, tid };
        if (playing) setSidenBeat((tid - beatStart.current.tid) / 1000);
    });
    const a =
        beat === 3
            ? start + Math.PI * 1.65 + Math.min(Math.max(sidenBeat - 2, 0) * 0.25, Math.PI * 0.5)
            : beat === 4
              ? start + Math.PI * 2.15
              : start + vinkel;
    return (
        <g>
            <motion.circle
                cx={cx}
                cy={cy}
                r={r + 40}
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 4 ? 0.55 : 0 }}
                transition={{ duration: 1.2 }}
            />
            {faser.map((f, i) => {
                const fra = start + (i * Math.PI) / 2 + 0.04;
                const til = start + ((i + 1) * Math.PI) / 2 - 0.04;
                const midt = (fra + til) / 2;
                const lx = cx + Math.cos(midt) * (r + 120);
                const ly = cy + Math.sin(midt) * (r + 105) + 14;
                const fokus = beat === 3 && i === 3;
                return (
                    <g key={f.navn}>
                        <motion.path
                            d={bue(cx, cy, r, fra, til)}
                            fill="none"
                            stroke={f.farge}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1, strokeWidth: yuga ? 64 - i * 12 + (fokus ? 14 : 0) : 46 }}
                            transition={{ duration: 0.9, delay: beat === 1 || beat === 2 ? i * 0.5 : 0 }}
                        />
                        {beat >= 1 && (
                            <motion.text
                                key={`${f.navn}-${beat >= 2}`}
                                x={lx}
                                y={ly}
                                textAnchor="middle"
                                fontSize={fokus ? 50 : 42}
                                fontWeight={900}
                                fill={f.farge === '#facc15' ? '#a16207' : f.farge}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.5 }}
                                {...tekstStil}
                            >
                                {f.navn}
                            </motion.text>
                        )}
                    </g>
                );
            })}
            {beat === 2 && (
                <motion.text
                    x={cx}
                    y={cy + 70}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#334155"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.4 }}
                >
                    kortere og mindre lykkelig
                </motion.text>
            )}
            {beat === 2 && (
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                    4 verdensaldre
                </text>
            )}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    <text x={cx} y={cy - 30} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                        ny runde
                    </text>
                    <text x={cx} y={cy + 30} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                        ↻
                    </text>
                </motion.g>
            )}
            {beat === 4 && (
                <motion.text
                    x={cx}
                    y={cy + 16}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    renselse
                </motion.text>
            )}
            {beat <= 1 && (
                <motion.text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fontSize={62}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {beat === 0 ? '↻' : 'og igjen'}
                </motion.text>
            )}
            <circle
                cx={cx + Math.cos(a) * r}
                cy={cy + Math.sin(a) * r}
                r={30}
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth={8}
            />
        </g>
    );
}

const RELIGIONER = ['zoroastrismen', 'jødedommen', 'kristendommen', 'islam'];

function Pil({ beat }: { beat: number }) {
    const y = 520;
    const x0 = 170;
    const x1 = 1330;
    const mål = 1400;
    return (
        <g>
            <motion.line
                x1={x0}
                y1={y}
                x2={x1}
                y2={y}
                stroke="#0f172a"
                strokeWidth={18}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8 }}
            />
            <motion.polygon
                points={`${x1 + 50},${y} ${x1 - 10},${y - 40} ${x1 - 10},${y + 40}`}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            />
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <circle cx={x0} cy={y} r={34} fill="#38bdf8" stroke="#0f172a" strokeWidth={6} />
                    <text x={x0} y={y + 100} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0369a1">
                        skapelsen
                    </text>
                    {[90, 64, 38].map((r, i) => (
                        <circle
                            key={r}
                            cx={mål}
                            cy={y}
                            r={r}
                            fill={i % 2 ? '#fff' : '#dc2626'}
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                    ))}
                    <text x={mål} y={y + 150} textAnchor="middle" fontSize={44} fontWeight={900} fill="#b91c1c">
                        {beat >= 3 ? 'dommen' : 'slutten'}
                    </text>
                    <motion.text
                        x={800}
                        y={y + 110}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={800}
                        fill="#475569"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                    >
                        ingen ny runde
                    </motion.text>
                </motion.g>
            )}
            {beat >= 2 &&
                RELIGIONER.map((r, i) => (
                    <motion.g
                        key={r}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: beat === 2 ? 1 : 0.45, y: 0 }}
                        transition={{ delay: beat === 2 ? 0.3 + i * 0.5 : 0 }}
                    >
                        <rect x={190 + i * 300} y={y - 200} width={290} height={84} rx={42} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                        <text x={335 + i * 300} y={y - 145} textAnchor="middle" fontSize={31} fontWeight={800} fill="#0f172a">
                            {r}
                        </text>
                    </motion.g>
                ))}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.circle
                        cy={y}
                        r={26}
                        fill="#facc15"
                        stroke="#0f172a"
                        strokeWidth={6}
                        initial={{ cx: 360 }}
                        animate={{ cx: 1180 }}
                        transition={{ duration: 6, ease: 'linear' }}
                    />
                    <text x={770} y={y - 60} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                        ett liv, én sjanse
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/** Vektstang som vipper: endepunktene regnes ut, ingen rotasjon på <g>. */
function Vekt({ beat, playing }: { beat: number; playing: boolean }) {
    const cx = 800;
    const cy = 330;
    const L = 420;
    const [t, setT] = useState(0);
    useAnimationFrame((tid) => {
        if (playing) setT(tid / 1000);
    });
    const vipp = beat === 1 ? Math.sin(t * 1.6) * 0.12 : beat >= 3 ? -0.08 : 0;
    const vx = Math.cos(vipp) * L;
    const vy = Math.sin(vipp) * L;
    const venstre = { x: cx - vx, y: cy - vy };
    const hoyre = { x: cx + vx, y: cy + vy };
    const skal = (p: { x: number; y: number }, farge: string, kant: string) => (
        <g>
            <line x1={p.x} y1={p.y} x2={p.x - 90} y2={p.y + 130} stroke="#475569" strokeWidth={4} />
            <line x1={p.x} y1={p.y} x2={p.x + 90} y2={p.y + 130} stroke="#475569" strokeWidth={4} />
            <path d={`M ${p.x - 120} ${p.y + 130} Q ${p.x} ${p.y + 210} ${p.x + 120} ${p.y + 130} Z`} fill={farge} stroke={kant} strokeWidth={5} />
        </g>
    );
    return (
        <g>
            <motion.rect
                x={0}
                y={0}
                width={800}
                height={H}
                fill="#fef3c7"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat <= 1 ? 0.8 : 0.5 }}
            />
            <motion.rect
                x={800}
                y={0}
                width={800}
                height={H}
                fill="#1e1b4b"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat <= 1 ? 0.85 : 0.6 }}
            />
            <rect x={cx - 14} y={cy} width={28} height={430} fill="#475569" />
            <rect x={cx - 120} y={cy + 420} width={240} height={30} rx={8} fill="#334155" />
            <line x1={venstre.x} y1={venstre.y} x2={hoyre.x} y2={hoyre.y} stroke="#334155" strokeWidth={16} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={20} fill="#334155" />
            {skal(venstre, '#fde68a', '#ca8a04')}
            {skal(hoyre, '#312e81', '#0f172a')}
            <circle cx={venstre.x} cy={venstre.y + 110} r={40} fill="#facc15" stroke="#fff7d6" strokeWidth={10} />
            <circle cx={hoyre.x} cy={hoyre.y + 110} r={40} fill="#0f0a1f" stroke="#6d28d9" strokeWidth={6} />
            <text x={venstre.x} y={venstre.y - 120} textAnchor="middle" fontSize={44} fontWeight={900} fill="#a16207">
                Ahura Mazda
            </text>
            <text x={venstre.x} y={venstre.y - 75} textAnchor="middle" fontSize={30} fontWeight={700} fill="#78350f">
                lyset og det gode
            </text>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: beat === 0 ? 1.8 : 0 }}>
                <text x={hoyre.x} y={hoyre.y - 120} textAnchor="middle" fontSize={44} fontWeight={900} fill="#c4b5fd">
                    Angra Mainyu
                </text>
                <text x={hoyre.x} y={hoyre.y - 75} textAnchor="middle" fontSize={30} fontWeight={700} fill="#ddd6fe">
                    mørket og det onde
                </text>
            </motion.g>

            {beat === 1 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <circle cx={cx} cy={cy + 500 - 300} r={24} fill="#0f172a" />
                    <rect x={cx - 20} y={cy + 226} width={40} height={70} rx={14} fill="#0f172a" />
                    <text x={cx - 70} y={cy + 270} textAnchor="end" fontSize={60} fontWeight={900} fill="#a16207">
                        ←
                    </text>
                    <text x={cx + 70} y={cy + 270} textAnchor="start" fontSize={60} fontWeight={900} fill="#c4b5fd">
                        →
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <g>
                    {Array.from({ length: 14 }, (_, i) => {
                        const x = 160 + i * 98;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, y: 80 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: beat === 2 ? 1 + i * 0.12 : 0, duration: 0.8 }}
                            >
                                <circle cx={x} cy={800} r={13} fill="#475569" />
                                <rect x={x - 11} y={815} width={22} height={40} rx={8} fill="#475569" />
                            </motion.g>
                        );
                    })}
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <polygon
                            points={Array.from({ length: 10 }, (_, i) => {
                                const r = i % 2 ? 22 : 52;
                                const w = (i / 10) * Math.PI * 2 - Math.PI / 2;
                                return `${cx + Math.cos(w) * r},${150 + Math.sin(w) * r}`;
                            }).join(' ')}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={4}
                        />
                        {beat === 2 && (
                            <text x={cx} y={250} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                                Saoshyant
                            </text>
                        )}
                    </motion.g>
                </g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
                    <rect x={0} y={860} width={B} height={40} fill="#f97316" />
                    <motion.rect
                        x={0}
                        y={850}
                        width={B}
                        height={14}
                        fill="#fde047"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    />
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <rect x={70} y={560} width={420} height={110} rx={24} fill="#ffffff" />
                    <text x={280} y={628} textAnchor="middle" fontSize={34} fontWeight={800} fill="#15803d">
                        rettferdige: svir ikke
                    </text>
                    <rect x={1110} y={560} width={420} height={110} rx={24} fill="#ffffff" />
                    <text x={1320} y={628} textAnchor="middle" fontSize={34} fontWeight={800} fill="#c2410c">
                        løgnere: vond renselse
                    </text>
                </motion.g>
            )}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <rect x={260} y={560} width={1080} height={150} rx={28} fill="#ffffff" stroke="#0f172a" strokeWidth={4} />
                    <line x1={330} y1={640} x2={1180} y2={640} stroke="#0f172a" strokeWidth={10} />
                    <polygon points="1220,640 1170,612 1170,668" fill="#0f172a" />
                    <text x={760} y={612} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                        jødedommen · kristendommen · islam
                    </text>
                    <circle cx={1270} cy={640} r={30} fill="#dc2626" />
                </motion.g>
            )}
        </g>
    );
}

/** Tilfeldige, men faste plasser for kaos-prikkene. */
const KAOS = Array.from({ length: 36 }, (_, i) => {
    const r = (n: number) => {
        const x = Math.sin(n * 91.7 + 13.1) * 43758.5453;
        return x - Math.floor(x);
    };
    return { x: 260 + r(i) * 1080, y: 180 + r(i + 40) * 380 };
});

function Fortelling({ beat, playing }: { beat: number; playing: boolean }) {
    const y = 500;
    const [t, setT] = useState(0);
    useAnimationFrame((tid) => {
        if (playing) setT(tid / 1000);
    });
    if (beat === 0)
        return (
            <g>
                <motion.text
                    x={800}
                    y={560}
                    textAnchor="middle"
                    fontSize={300}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    ?
                </motion.text>
                {['1', '2'].map((n, i) => (
                    <motion.g key={n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 + i * 0.6 }}>
                        <circle cx={420 + i * 760} cy={470} r={80} fill="#ffffff" stroke="#334155" strokeWidth={6} />
                        <text x={420 + i * 760} y={500} textAnchor="middle" fontSize={84} fontWeight={900} fill="#334155">
                            {n}
                        </text>
                    </motion.g>
                ))}
            </g>
        );
    if (beat <= 2)
        return (
            <g>
                <line x1={200} y1={y} x2={beat === 1 ? 1050 : 1340} y2={y} stroke="#0f172a" strokeWidth={14} strokeLinecap="round" />
                {[
                    { x: 200, navn: 'begynnelse' },
                    { x: 680, navn: 'midten' },
                ].map((p) => (
                    <g key={p.navn}>
                        <circle cx={p.x} cy={y} r={28} fill="#38bdf8" stroke="#0f172a" strokeWidth={6} />
                        <text x={p.x} y={y + 90} textAnchor="middle" fontSize={42} fontWeight={800} fill="#0f172a">
                            {p.navn}
                        </text>
                    </g>
                ))}
                {beat === 1 ? (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        <text x={1200} y={y + 40} textAnchor="middle" fontSize={140} fontWeight={900} fill="#94a3b8">
                            ?
                        </text>
                        <text x={1200} y={y + 120} textAnchor="middle" fontSize={40} fontWeight={800} fill="#64748b">
                            uferdig
                        </text>
                    </motion.g>
                ) : (
                    <g>
                        <motion.circle cx={1340} cy={y} r={44} fill="#dc2626" stroke="#0f172a" strokeWidth={6} initial={{ scale: 0 }} animate={{ scale: 1 }} />
                        <text x={1340} y={y + 110} textAnchor="middle" fontSize={42} fontWeight={800} fill="#b91c1c">
                            målet
                        </text>
                        <motion.g initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                            <circle cx={960} cy={y} r={30} fill="#facc15" stroke="#0f172a" strokeWidth={6} />
                            <rect x={850} y={y - 140} width={220} height={74} rx={37} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                            <text x={960} y={y - 90} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                                ditt liv
                            </text>
                        </motion.g>
                    </g>
                )}
            </g>
        );
    const ordnet = beat >= 4;
    return (
        <g>
            {beat === 3 &&
                [
                    { x: 360, y: 230, navn: 'pest' },
                    { x: 800, y: 200, navn: 'krig' },
                    { x: 1240, y: 230, navn: 'sult' },
                ].map((o, i) => (
                    <motion.g key={o.navn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.5 }}>
                        <rect x={o.x - 100} y={o.y - 55} width={200} height={76} rx={20} fill="#7f1d1d" />
                        <text x={o.x} y={o.y} textAnchor="middle" fontSize={42} fontWeight={900} fill="#ffffff">
                            {o.navn}
                        </text>
                    </motion.g>
                ))}
            {KAOS.map((p, i) => {
                const jx = ordnet ? 0 : Math.sin(t * 3 + i) * 14;
                const jy = ordnet ? 0 : Math.cos(t * 2.6 + i * 1.7) * 14;
                const mx = 220 + i * 31;
                return (
                    <motion.circle
                        key={i}
                        r={14}
                        fill={ordnet ? '#0f766e' : '#64748b'}
                        initial={false}
                        animate={{ cx: (ordnet ? mx : p.x) + jx, cy: (ordnet ? 560 : p.y + 120) + jy }}
                        transition={ordnet ? { duration: 1.2, delay: i * 0.03 } : { duration: 0.1 }}
                    />
                );
            })}
            {ordnet && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                    <circle cx={1380} cy={560} r={44} fill="#dc2626" stroke="#0f172a" strokeWidth={6} />
                    <text x={800} y={690} textAnchor="middle" fontSize={46} fontWeight={900} fill="#0f766e">
                        en plan mot et mål
                    </text>
                    <text x={800} y={760} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                        lettere å bære
                    </text>
                </motion.g>
            )}
            {beat === 3 && (
                <motion.text x={800} y={810} textAnchor="middle" fontSize={40} fontWeight={800} fill="#475569" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                    føles som om verden går under
                </motion.text>
            )}
        </g>
    );
}

export function EskatologiTid({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hjul';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const mork = modus === 'vekt';
    return (
        <div className="absolute inset-0" style={{ background: mork ? '#f8fafc' : '#f5f1e8' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'hjul' && <Hjul beat={beat} playing={playing} />}
                {modus === 'pil' && <Pil beat={beat} />}
                {modus === 'vekt' && <Vekt beat={beat} playing={playing} />}
                {modus === 'fortelling' && <Fortelling beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '4%' }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
