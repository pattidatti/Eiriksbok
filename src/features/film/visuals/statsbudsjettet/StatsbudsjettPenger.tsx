import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Pengene i statsbudsjettet. Fire moduser:
 * - inntekter: søylen for det som kommer inn fylles med skatt, så oljefond. Ut er like høy.
 * - maaler: handlingsregelen som en måler fra 0 til 4 prosent av fondet. Grensen på 3, bruken på 2,7.
 * - poster: utgiftene i 2026 som et felt der arealet er riktig. Folketrygden står tom til sist.
 * - folketrygd: folketrygden fylles, og halvparten av den er alderspensjon.
 */

type Modus = 'inntekter' | 'maaler' | 'poster' | 'folketrygd';

const OVERSKRIFT: Record<Modus, string[]> = {
    inntekter: [
        'Hvor kommer pengene fra?',
        'Skatter og avgifter',
        'Skattene er ikke nok',
        'Oljefondet',
        'Budsjettet skal gå i null',
    ],
    maaler: [
        'Handlingsregelen, fra 2001',
        'Grensen: 3 prosent av fondet',
        'Forslaget for 2027',
        'Under grensen',
    ],
    poster: [
        'Utgifter i 2026, i milliarder kroner',
        'Kommuner og fylker',
        'Sykehusene og forsvaret',
        'Veier, forskning og bistand',
        'Politiet, barnetrygden og alt annet',
        'Den største posten mangler',
    ],
    folketrygd: [
        'Folketrygden: 744 milliarder',
        'Omtrent en tredel av hele budsjettet',
        'Omtrent halvparten: alderspensjon',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <Flate>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 18 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold shadow-xl"
                        style={{ fontSize: 30 }}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Flate>
    );
}

function Svg({ children }: { children: ReactNode }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
        >
            {children}
        </svg>
    );
}

const fram = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

// ---------- inntekter ----------

const SOYLE = { x: 640, w: 280, topp: 170, bunn: 820 };
const SKATT = 0.74;

function Inntekter({ beat }: { beat: number }) {
    const h = SOYLE.bunn - SOYLE.topp;
    const skattH = h * SKATT;
    const oljeH = h - skattH;
    const SLAG = ['Skatt på inntekt og formue', 'Arbeidsgiveravgift', 'Trygdeavgift', 'Moms'];
    return (
        <Svg>
            <text
                x={SOYLE.x + SOYLE.w / 2}
                y={SOYLE.bunn + 52}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#0f172a"
            >
                Inn
            </text>
            <rect
                x={SOYLE.x}
                y={SOYLE.topp}
                width={SOYLE.w}
                height={h}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={4}
                strokeDasharray="14 10"
            />
            <motion.rect
                x={SOYLE.x}
                width={SOYLE.w}
                fill="#ea580c"
                initial={{ y: SOYLE.bunn, height: 0 }}
                animate={{ y: SOYLE.bunn - skattH, height: skattH }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            <text
                x={SOYLE.x + SOYLE.w / 2}
                y={SOYLE.bunn - skattH / 2}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#fff"
            >
                Skatter og
            </text>
            <text
                x={SOYLE.x + SOYLE.w / 2}
                y={SOYLE.bunn - skattH / 2 + 42}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#fff"
            >
                avgifter
            </text>
            {beat >= 1 && (
                <motion.text
                    {...fram}
                    x={SOYLE.x + SOYLE.w / 2}
                    y={SOYLE.bunn - skattH / 2 + 100}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#ffedd5"
                >
                    nesten 3/4
                </motion.text>
            )}
            <AnimatePresence>
                {beat >= 1 &&
                    SLAG.map((s, i) => (
                        <motion.g
                            key={s}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.5 }}
                        >
                            <rect
                                x={90}
                                y={360 + i * 92}
                                width={500}
                                height={70}
                                rx={16}
                                fill="#fff7ed"
                                stroke="#ea580c"
                                strokeWidth={3}
                            />
                            <text
                                x={340}
                                y={360 + i * 92 + 46}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#7c2d12"
                            >
                                {s}
                            </text>
                        </motion.g>
                    ))}
            </AnimatePresence>
            {beat === 2 && (
                <motion.g {...fram}>
                    <rect
                        x={SOYLE.x}
                        y={SOYLE.topp}
                        width={SOYLE.w}
                        height={oljeH}
                        fill="#fee2e2"
                        stroke="#dc2626"
                        strokeWidth={5}
                    />
                    <text
                        x={SOYLE.x + SOYLE.w / 2}
                        y={SOYLE.topp + oljeH / 2 + 14}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#b91c1c"
                    >
                        Mangler
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g {...fram}>
                    <motion.rect
                        x={SOYLE.x}
                        width={SOYLE.w}
                        fill="#0d9488"
                        initial={{ y: SOYLE.topp + oljeH, height: 0 }}
                        animate={{ y: SOYLE.topp, height: oljeH }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                    <text
                        x={SOYLE.x + SOYLE.w / 2}
                        y={SOYLE.topp + oljeH / 2 - 4}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Oljefondet
                    </text>
                    <text
                        x={SOYLE.x + SOYLE.w / 2}
                        y={SOYLE.topp + oljeH / 2 + 38}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#ccfbf1"
                    >
                        omtrent 1/4
                    </text>
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g {...fram} transition={{ duration: 0.8 }}>
                    <text
                        x={1030}
                        y={SOYLE.topp + h / 2 + 30}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        =
                    </text>
                    <motion.rect
                        x={1140}
                        width={SOYLE.w}
                        fill="#475569"
                        initial={{ y: SOYLE.bunn, height: 0 }}
                        animate={{ y: SOYLE.topp, height: h }}
                        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                    />
                    <text
                        x={1140 + SOYLE.w / 2}
                        y={SOYLE.topp + h / 2}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Det staten
                    </text>
                    <text
                        x={1140 + SOYLE.w / 2}
                        y={SOYLE.topp + h / 2 + 42}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                    >
                        bruker
                    </text>
                    <text
                        x={1140 + SOYLE.w / 2}
                        y={SOYLE.bunn + 52}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Ut
                    </text>
                </motion.g>
            )}
        </Svg>
    );
}

// ---------- måler ----------

const MALER = { cx: 800, cy: 700, r: 440, maks: 4 };

function punkt(prosent: number, r: number) {
    const a = Math.PI - (prosent / MALER.maks) * Math.PI;
    return { x: MALER.cx + r * Math.cos(a), y: MALER.cy - r * Math.sin(a) };
}

function bue(fra: number, til: number, r: number) {
    const a = punkt(fra, r);
    const b = punkt(til, r);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

function Maaler({ beat }: { beat: number }) {
    const mal = beat >= 2 ? 2.7 : 0;
    const [verdi, setVerdi] = useState(0);
    useEffect(() => {
        const c = animate(verdi, mal, {
            duration: 2,
            ease: [0.3, 1.2, 0.4, 1],
            onUpdate: setVerdi,
        });
        return () => c.stop();
        // Målet styrer animasjonen; startverdien er der nålen står.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mal]);
    const nal = punkt(verdi, MALER.r - 70);
    return (
        <Svg>
            <path d={bue(0, 4, MALER.r)} fill="none" stroke="#e2e8f0" strokeWidth={70} />
            {beat >= 1 && (
                <motion.path
                    {...fram}
                    d={bue(3, 4, MALER.r)}
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth={70}
                />
            )}
            {[0, 1, 2, 3, 4].map((p) => {
                const a = punkt(p, MALER.r - 50);
                const b = punkt(p, MALER.r + 50);
                const t = punkt(p, MALER.r + 100);
                return (
                    <g key={p}>
                        <line
                            x1={a.x}
                            y1={a.y}
                            x2={b.x}
                            y2={b.y}
                            stroke="#334155"
                            strokeWidth={5}
                        />
                        <text
                            x={t.x}
                            y={t.y + 14}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#334155"
                        >
                            {p} %
                        </text>
                    </g>
                );
            })}
            {beat >= 1 && (
                <motion.g {...fram}>
                    <line
                        {...(() => {
                            const a = punkt(3, MALER.r - 60);
                            const b = punkt(3, MALER.r + 60);
                            return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
                        })()}
                        stroke="#dc2626"
                        strokeWidth={12}
                    />
                    <text
                        x={1360}
                        y={300}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#b91c1c"
                    >
                        Grensen
                    </text>
                </motion.g>
            )}
            <line
                x1={MALER.cx}
                y1={MALER.cy}
                x2={nal.x}
                y2={nal.y}
                stroke="#0f172a"
                strokeWidth={14}
                strokeLinecap="round"
            />
            <circle cx={MALER.cx} cy={MALER.cy} r={30} fill="#0f172a" />
            <text
                x={MALER.cx}
                y={MALER.cy + 110}
                textAnchor="middle"
                fontSize={32}
                fontWeight={700}
                fill="#475569"
            >
                Hvor stor del av oljefondet staten bruker
            </text>
            {beat >= 2 && (
                <motion.g {...fram} transition={{ delay: 1.2 }}>
                    <rect
                        x={610}
                        y={430}
                        width={380}
                        height={130}
                        rx={20}
                        fill="#fff"
                        stroke="#0d9488"
                        strokeWidth={5}
                    />
                    <text
                        x={800}
                        y={485}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        608,4 milliarder
                    </text>
                    <text
                        x={800}
                        y={535}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={beat >= 3 ? '#0f766e' : '#475569'}
                    >
                        {beat >= 3 ? '= 2,7 prosent' : 'kroner i 2027'}
                    </text>
                </motion.g>
            )}
        </Svg>
    );
}

// ---------- poster (arealriktig felt) ----------

interface Post {
    id: string;
    linjer: string[];
    verdi: number;
    farge: string;
    fraBeat: number;
}

const FOLKETRYGD: Post = {
    id: 'ft',
    linjer: ['Folketrygden'],
    verdi: 744,
    farge: '#ea580c',
    fraBeat: 99,
};
const POSTER: Post[] = [
    { id: 'annet', linjer: ['Alt annet'], verdi: 466, farge: '#64748b', fraBeat: 4 },
    { id: 'kom', linjer: ['Kommuner', 'og fylker'], verdi: 259, farge: '#2563eb', fraBeat: 1 },
    { id: 'syk', linjer: ['Sykehusene'], verdi: 237, farge: '#dc2626', fraBeat: 2 },
    { id: 'fors', linjer: ['Forsvaret'], verdi: 180, farge: '#4d7c0f', fraBeat: 2 },
    { id: 'vei', linjer: ['Veier og', 'jernbane'], verdi: 98, farge: '#7c3aed', fraBeat: 3 },
    {
        id: 'uni',
        linjer: ['Universiteter,', 'høyskoler', 'og forskning:'],
        verdi: 65,
        farge: '#0891b2',
        fraBeat: 3,
    },
    { id: 'bist', linjer: ['Bistand:'], verdi: 54, farge: '#db2777', fraBeat: 3 },
    { id: 'pol', linjer: ['Politiet:'], verdi: 32, farge: '#1e3a8a', fraBeat: 4 },
    {
        id: 'barn',
        linjer: ['Barnetrygd og', 'kontantstøtte:'],
        verdi: 30,
        farge: '#ca8a04',
        fraBeat: 4,
    },
];
const TOTAL = POSTER.reduce((s, p) => s + p.verdi, 0) + FOLKETRYGD.verdi;

interface Boks {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Squarified treemap: legger postene i et rektangel slik at arealet er riktig og boksene nær kvadrater. */
function squarify(verdier: number[], omr: Boks): Boks[] {
    const sum = verdier.reduce((a, b) => a + b, 0);
    const skala = (omr.w * omr.h) / sum;
    const arealer = verdier.map((v) => v * skala);
    const ut: Boks[] = [];
    let rest = { ...omr };
    let i = 0;
    const verst = (rad: number[], side: number) => {
        const s = rad.reduce((a, b) => a + b, 0);
        const maks = Math.max(...rad);
        const min = Math.min(...rad);
        return Math.max((side * side * maks) / (s * s), (s * s) / (side * side * min));
    };
    while (i < arealer.length) {
        const side = Math.min(rest.w, rest.h);
        const rad = [arealer[i]];
        let j = i + 1;
        while (j < arealer.length && verst([...rad, arealer[j]], side) <= verst(rad, side)) {
            rad.push(arealer[j]);
            j++;
        }
        const s = rad.reduce((a, b) => a + b, 0);
        if (rest.w >= rest.h) {
            const bredde = s / rest.h;
            let y = rest.y;
            rad.forEach((a) => {
                const h = a / bredde;
                ut.push({ x: rest.x, y, w: bredde, h });
                y += h;
            });
            rest = { x: rest.x + bredde, y: rest.y, w: rest.w - bredde, h: rest.h };
        } else {
            const hoyde = s / rest.w;
            let x = rest.x;
            rad.forEach((a) => {
                const w = a / hoyde;
                ut.push({ x, y: rest.y, w, h: hoyde });
                x += w;
            });
            rest = { x: rest.x, y: rest.y + hoyde, w: rest.w, h: rest.h - hoyde };
        }
        i = j;
    }
    return ut;
}

const FELT: Boks = { x: 60, y: 135, w: 1130, h: 730 };

function Felt({ modus, beat }: { modus: 'poster' | 'folketrygd'; beat: number }) {
    const ftBredde = (FOLKETRYGD.verdi / TOTAL) * FELT.w;
    const ftBoks: Boks = { x: FELT.x, y: FELT.y, w: ftBredde, h: FELT.h };
    const bokser = useMemo(
        () =>
            squarify(
                POSTER.map((p) => p.verdi),
                { x: FELT.x + ftBredde, y: FELT.y, w: FELT.w - ftBredde, h: FELT.h }
            ),
        [ftBredde]
    );
    const ftFylt = modus === 'folketrygd';
    return (
        <Svg>
            {POSTER.map((p, i) => {
                const b = bokser[i];
                const fylt = modus === 'folketrygd' || beat >= p.fraBeat;
                const dempet = modus === 'folketrygd';
                const liten = b.w < 170 || b.h < 120;
                const str = liten
                    ? Math.min(34, (b.w - 12) / 2)
                    : Math.min(
                          34,
                          (b.w - 16) / (Math.max(...p.linjer.map((l) => l.length), 3) * 0.56)
                      );
                const linjeH = str * 1.1;
                const midtY = b.y + b.h / 2 - ((p.linjer.length + 1) * linjeH) / 2 + str;
                return (
                    <g key={p.id}>
                        <motion.rect
                            x={b.x + 3}
                            y={b.y + 3}
                            width={b.w - 6}
                            height={b.h - 6}
                            rx={8}
                            initial={false}
                            animate={{
                                fill: fylt ? p.farge : '#f1f5f9',
                                opacity: dempet ? 0.35 : 1,
                            }}
                            transition={{ duration: 0.8 }}
                            stroke="#cbd5e1"
                            strokeWidth={fylt ? 0 : 2}
                        />
                        {fylt && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: dempet ? 0.5 : 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {!liten &&
                                    p.linjer.map((l, k) => (
                                        <text
                                            key={k}
                                            x={b.x + b.w / 2}
                                            y={midtY + k * linjeH}
                                            textAnchor="middle"
                                            fontSize={str}
                                            fontWeight={800}
                                            fill="#fff"
                                        >
                                            {l.replace(/:$/, '')}
                                        </text>
                                    ))}
                                <text
                                    x={b.x + b.w / 2}
                                    y={
                                        liten
                                            ? b.y + b.h / 2 + str * 0.4
                                            : midtY + p.linjer.length * linjeH + 4
                                    }
                                    textAnchor="middle"
                                    fontSize={liten ? str : str * 1.2}
                                    fontWeight={900}
                                    fill="#fff"
                                >
                                    {p.verdi}
                                </text>
                            </motion.g>
                        )}
                        {p.id === 'fors' && modus === 'poster' && beat === 2 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                <rect
                                    x={b.x + 10}
                                    y={b.y + 10}
                                    width={b.w - 20}
                                    height={50}
                                    rx={10}
                                    fill="#fff"
                                />
                                <text
                                    x={b.x + b.w / 2}
                                    y={b.y + 46}
                                    textAnchor="middle"
                                    fontSize={29}
                                    fontWeight={800}
                                    fill="#365314"
                                >
                                    Økt mye etter 2022
                                </text>
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {/* Forklaring til de små boksene, til høyre for feltet. */}
            {POSTER.filter((_p, i) => bokser[i].w < 170 || bokser[i].h < 120)
                .filter((p) => modus === 'folketrygd' || beat >= p.fraBeat)
                .map((p, k) => (
                    <motion.g
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: modus === 'folketrygd' ? 0.5 : 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect
                            x={1220}
                            y={170 + k * 130}
                            width={40}
                            height={40}
                            rx={6}
                            fill={p.farge}
                        />
                        {p.linjer.map((l, j) => (
                            <text
                                key={j}
                                x={1272}
                                y={200 + k * 130 + j * 36}
                                fontSize={33}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                {j === p.linjer.length - 1 ? `${l} ${p.verdi}` : l}
                            </text>
                        ))}
                    </motion.g>
                ))}
            {/* Folketrygden: tomt felt til den kommer. */}
            <motion.rect
                x={ftBoks.x + 3}
                y={ftBoks.y + 3}
                width={ftBoks.w - 6}
                height={ftBoks.h - 6}
                rx={10}
                initial={false}
                animate={{ fill: ftFylt ? FOLKETRYGD.farge : '#ffffff' }}
                transition={{ duration: 1.2 }}
                stroke={ftFylt ? FOLKETRYGD.farge : '#94a3b8'}
                strokeWidth={4}
                strokeDasharray={ftFylt ? undefined : '16 12'}
            />
            {!ftFylt && beat >= 5 && (
                <motion.text
                    {...fram}
                    x={ftBoks.x + ftBoks.w / 2}
                    y={ftBoks.y + ftBoks.h / 2 + 70}
                    textAnchor="middle"
                    fontSize={220}
                    fontWeight={900}
                    fill="#ea580c"
                >
                    ?
                </motion.text>
            )}
            {ftFylt && beat >= 2 && (
                <motion.rect
                    x={ftBoks.x + 3}
                    width={ftBoks.w - 6}
                    fill="#9a3412"
                    initial={{ y: ftBoks.y + ftBoks.h - 3, height: 0 }}
                    animate={{ y: ftBoks.y + ftBoks.h / 2, height: ftBoks.h / 2 - 3 }}
                    transition={{ duration: 1.2 }}
                />
            )}
            {ftFylt && (
                <motion.g {...fram} transition={{ delay: 0.5 }}>
                    <text
                        x={ftBoks.x + ftBoks.w / 2}
                        y={ftBoks.y + 120}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Folketrygden
                    </text>
                    <text
                        x={ftBoks.x + ftBoks.w / 2}
                        y={ftBoks.y + 230}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#fff"
                    >
                        744
                    </text>
                </motion.g>
            )}
            {ftFylt && beat === 1 && (
                <motion.g {...fram} transition={{ delay: 0.4 }}>
                    {['Alderspensjon', 'Uføretrygd', 'Sykepenger', 'og mer'].map((t, k) => (
                        <text
                            key={t}
                            x={ftBoks.x + ftBoks.w / 2}
                            y={ftBoks.y + 420 + k * 54}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#ffedd5"
                        >
                            {t}
                        </text>
                    ))}
                </motion.g>
            )}
            {ftFylt && beat >= 2 && (
                <motion.g {...fram} transition={{ delay: 1.2 }}>
                    <text
                        x={ftBoks.x + ftBoks.w / 2}
                        y={ftBoks.y + ftBoks.h * 0.75}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill="#fff"
                    >
                        Alderspensjon
                    </text>
                    <text
                        x={ftBoks.x + ftBoks.w / 2}
                        y={ftBoks.y + ftBoks.h * 0.75 + 50}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fed7aa"
                    >
                        omtrent halvparten
                    </text>
                </motion.g>
            )}
        </Svg>
    );
}

export function StatsbudsjettPenger({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'inntekter';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            {modus === 'inntekter' && <Inntekter beat={beat} />}
            {modus === 'maaler' && <Maaler beat={beat} />}
            {(modus === 'poster' || modus === 'folketrygd') && <Felt modus={modus} beat={beat} />}
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
