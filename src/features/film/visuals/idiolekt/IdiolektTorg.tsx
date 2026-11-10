import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Folk som prater, i fire moduser.
 * «lekter»: dialekt, sosiolekt og etnolekt som grupper i mengden, så ett menneske: idiolekten.
 * «spor»: et tenkt torg der tre språktrekk siler mengden ned til én person.
 * «summen»: idiolektene som sirkler som overlapper. Det felles blir dialekt og språk.
 * «endring»: en ny måte å si et ord på sprer seg fra noen få til hele gruppen.
 */

type Modus = 'lekter' | 'spor' | 'summen' | 'endring';

const B = 1600;
const H = 900;

/** Fast tilfeldighet, så bildet er likt hver gang. */
function lagRand(frø: number) {
    let s = frø;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

interface Folk {
    x: number;
    y: number;
    r1: number;
    r2: number;
    prat: boolean;
}

function lagMengde(kol: number, rader: number, x0: number, x1: number, y0: number, y1: number) {
    const rand = lagRand(7);
    const ut: Folk[] = [];
    const dx = (x1 - x0) / (kol - 1);
    const dy = (y1 - y0) / (rader - 1);
    for (let r = 0; r < rader; r++) {
        for (let k = 0; k < kol; k++) {
            ut.push({
                x: x0 + k * dx + (rand() - 0.5) * dx * 0.5 + (r % 2 ? dx * 0.25 : 0),
                y: y0 + r * dy + (rand() - 0.5) * dy * 0.4,
                r1: rand(),
                r2: rand(),
                prat: rand() < 0.12,
            });
        }
    }
    return ut;
}

export function IdiolektTorg({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lekter';
    const bakgrunn = modus === 'endring' ? '#1e1b2e' : modus === 'summen' ? '#f8fafc' : '#f4f1ea';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'lekter' && <Lekter beat={beat} />}
                {modus === 'spor' && <Spor beat={beat} />}
                {modus === 'summen' && <Summen beat={beat} />}
                {modus === 'endring' && <Endring beat={beat} />}
            </svg>
        </div>
    );
}

function Tittel({ tekst, farge = '#0f172a' }: { tekst: string; farge?: string }) {
    return (
        <motion.text
            key={tekst}
            x={B / 2}
            y={100}
            textAnchor="middle"
            fontSize={60}
            fontWeight={900}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

/** En liten figur: hode og skuldre. (x, y) er midt på kroppen. */
function Person({
    x,
    y,
    s = 1,
    farge,
    opasitet = 1,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    s?: number;
    farge: string;
    opasitet?: number;
    forsinkelse?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <motion.g
                initial={false}
                animate={{ opacity: opasitet }}
                transition={{ duration: 0.6, delay: forsinkelse }}
            >
                <motion.circle
                    cx={0}
                    cy={-20}
                    r={9}
                    initial={false}
                    animate={{ fill: farge }}
                    transition={{ duration: 0.6, delay: forsinkelse }}
                />
                <motion.path
                    d="M -12 14 L -12 -2 Q -12 -9 -5 -9 L 5 -9 Q 12 -9 12 -2 L 12 14 Z"
                    initial={false}
                    animate={{ fill: farge }}
                    transition={{ duration: 0.6, delay: forsinkelse }}
                />
            </motion.g>
        </g>
    );
}

/** Merkelapp med hvit plate. Bredden regnes ut fra teksten. */
function Lapp({
    x,
    y,
    tekst,
    farge,
    str = 36,
    fyll = '#ffffff',
    tekstFarge,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    str?: number;
    fyll?: string;
    tekstFarge?: string;
}) {
    const b = tekst.length * str * 0.56 + str * 1.2;
    const h = str * 1.6;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={h / 2}
                fill={fyll}
                stroke={farge}
                strokeWidth={4}
            />
            <text
                x={x}
                y={y + str * 0.36}
                textAnchor="middle"
                fontSize={str}
                fontWeight={800}
                fill={tekstFarge ?? farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/* ---------- lekter ---------- */

const GRA = '#94a3b8';
const TEAL = '#0f766e';
const BLA = '#2563eb';
const ORANSJE = '#c2410c';
const LILLA = '#7c3aed';

function Lekter({ beat }: { beat: number }) {
    const folk = useMemo(() => lagMengde(20, 8, 120, 1480, 250, 830), []);
    // Personen som blir «deg»: den som står nærmest dette punktet.
    const valgt = useMemo(() => {
        let best = 0;
        let d = Infinity;
        folk.forEach((f, i) => {
            const dd = (f.x - 820) ** 2 + (f.y - 560) ** 2;
            if (dd < d) {
                d = dd;
                best = i;
            }
        });
        return best;
    }, [folk]);
    const titler = [
        'Dialekt: talemålet i et område',
        'Sosiolekt og etnolekt',
        'Alle handler om grupper',
        'Idiolekt: ett menneske',
        'Et sted, eller deg',
    ];
    const iOmrade = (f: Folk) => ((f.x - 560) / 430) ** 2 + ((f.y - 540) / 270) ** 2 < 1;
    const iSosio = (f: Folk) => ((f.x - 1200) / 220) ** 2 + ((f.y - 410) / 120) ** 2 < 1;
    const iEtno = (f: Folk) => ((f.x - 1200) / 220) ** 2 + ((f.y - 700) / 110) ** 2 < 1;
    const farge = (f: Folk) => {
        if (beat === 0) return iOmrade(f) ? TEAL : GRA;
        if (beat <= 2) {
            if (iSosio(f)) return BLA;
            if (iEtno(f)) return ORANSJE;
            return beat === 2 && iOmrade(f) ? TEAL : GRA;
        }
        return GRA;
    };
    const p = folk[valgt];
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            {/* Områdene tegnes under folket. */}
            <motion.ellipse
                cx={560}
                cy={540}
                rx={430}
                ry={270}
                fill={TEAL}
                stroke={TEAL}
                strokeWidth={5}
                strokeDasharray="18 12"
                initial={false}
                animate={{
                    fillOpacity: beat === 0 || beat === 2 ? 0.14 : beat === 4 ? 0.08 : 0,
                    strokeOpacity: beat === 0 || beat === 2 ? 1 : beat === 4 ? 0.5 : 0,
                }}
                transition={{ duration: 0.6 }}
            />
            {[
                { cy: 410, ry: 120, f: BLA },
                { cy: 700, ry: 110, f: ORANSJE },
            ].map((g) => (
                <motion.ellipse
                    key={g.cy}
                    cx={1200}
                    cy={g.cy}
                    rx={220}
                    ry={g.ry}
                    fill={g.f}
                    stroke={g.f}
                    strokeWidth={5}
                    strokeDasharray="18 12"
                    initial={false}
                    animate={{
                        fillOpacity: beat === 1 || beat === 2 ? 0.14 : 0,
                        strokeOpacity: beat === 1 || beat === 2 ? 1 : 0,
                    }}
                    transition={{ duration: 0.6 }}
                />
            ))}
            {folk.map((f, i) =>
                i === valgt && beat >= 3 ? null : (
                    <Person
                        key={i}
                        x={f.x}
                        y={f.y}
                        farge={farge(f)}
                        opasitet={beat >= 3 ? (beat === 4 && iOmrade(f) ? 0.3 : 0.14) : 1}
                    />
                )
            )}
            {beat >= 3 && (
                <Inn>
                    <circle
                        cx={p.x}
                        cy={p.y - 6}
                        r={beat === 4 ? 92 : 78}
                        fill={LILLA}
                        opacity={0.15}
                    />
                    <Person x={p.x} y={p.y + 8} s={beat === 4 ? 3.2 : 2.6} farge={LILLA} />
                </Inn>
            )}
            {beat === 0 && <Lapp x={560} y={240} tekst="Dialekt: et område" farge={TEAL} />}
            {beat === 2 && <Lapp x={560} y={240} tekst="Dialekt" farge={TEAL} />}
            {(beat === 1 || beat === 2) && (
                <>
                    <Lapp x={1200} y={250} tekst="Sosiolekt: sosial gruppe" farge={BLA} />
                    <Lapp x={1200} y={850} tekst="Etnolekt: felles bakgrunn" farge={ORANSJE} />
                </>
            )}
            {beat === 3 && <Lapp x={p.x} y={p.y - 130} tekst="Idiolekt: én person" farge={LILLA} />}
            {beat === 4 && (
                <>
                    <Lapp x={480} y={700} tekst="Dialekt: et sted" farge={TEAL} str={40} />
                    <Lapp x={p.x} y={p.y - 145} tekst="Idiolekt: deg" farge={LILLA} str={44} />
                </>
            )}
        </g>
    );
}

/* ---------- spor ---------- */

const TREKK = [
    { tekst: 'Trekk 1: «æ»', x: 420 },
    { tekst: 'Trekk 2: «ikkje»', x: 800 },
    { tekst: 'Trekk 3', x: 1180 },
];

function Spor({ beat }: { beat: number }) {
    const folk = useMemo(() => lagMengde(24, 8, 110, 1490, 290, 830), []);
    const maal = useMemo(() => {
        let best = 0;
        let d = Infinity;
        folk.forEach((f, i) => {
            const dd = (f.x - 980) ** 2 + (f.y - 600) ** 2;
            if (dd < d) {
                d = dd;
                best = i;
            }
        });
        return best;
    }, [folk]);
    const t1 = (i: number) => i === maal || folk[i].r1 < 0.5;
    const t2 = (i: number) => i === maal || folk[i].r2 < 0.3;
    const lyser = (i: number) => {
        if (beat === 0) return true;
        if (beat === 1) return t1(i);
        if (beat === 2) return t1(i) && t2(i);
        return i === maal;
    };
    const titler = [
        'Et torg fullt av folk',
        'Første trekk: mange',
        'To trekk: færre',
        'Tre trekk: én person',
        'Flere trekk i samme munn',
        'Flere likheter, sterkere bevis',
    ];
    const m = folk[maal];
    if (beat >= 5) {
        const stolper = [
            { tekst: 'ett trekk', h: 90 },
            { tekst: 'to trekk', h: 220 },
            { tekst: 'flere trekk', h: 400 },
        ];
        return (
            <g>
                <Tittel tekst={titler[5]} />
                <line x1={360} y1={760} x2={1300} y2={760} stroke="#334155" strokeWidth={5} />
                <text
                    x={300}
                    y={420}
                    fontSize={36}
                    fontWeight={800}
                    fill="#475569"
                    textAnchor="middle"
                >
                    <tspan x={300}>Bevis-</tspan>
                    <tspan x={300} dy={44}>
                        kraft
                    </tspan>
                </text>
                {stolper.map((s, i) => (
                    <g key={s.tekst}>
                        <motion.rect
                            x={470 + i * 290}
                            width={180}
                            initial={{ y: 760, height: 0 }}
                            animate={{ y: 760 - s.h, height: s.h }}
                            transition={{ duration: 0.9, delay: 0.3 + i * 0.5 }}
                            fill={i === 2 ? LILLA : '#a78bfa'}
                            rx={10}
                        />
                        <text
                            x={560 + i * 290}
                            y={815}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {s.tekst}
                        </text>
                    </g>
                ))}
                <text
                    x={1300}
                    y={190}
                    textAnchor="end"
                    fontSize={28}
                    fontWeight={600}
                    fill="#64748b"
                >
                    Tenkt eksempel, ikke målte tall
                </text>
            </g>
        );
    }
    return (
        <g>
            <Tittel tekst={titler[beat]} />
            {TREKK.map((t, i) => {
                const aktiv = beat >= i + 1;
                return (
                    <g key={t.tekst}>
                        <motion.rect
                            x={t.x - 165}
                            y={160}
                            width={330}
                            height={66}
                            rx={33}
                            initial={false}
                            animate={{ fill: aktiv ? LILLA : '#e2e8f0' }}
                            transition={{ duration: 0.5 }}
                        />
                        <text
                            x={t.x}
                            y={205}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill={aktiv ? '#ffffff' : '#64748b'}
                        >
                            {t.tekst}
                        </text>
                    </g>
                );
            })}
            {beat === 4 &&
                TREKK.map((t) => (
                    <motion.line
                        key={t.x}
                        x1={t.x}
                        y1={226}
                        x2={m.x}
                        y2={m.y - 70}
                        stroke={LILLA}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                ))}
            {folk.map((f, i) =>
                i === maal && beat >= 3 ? null : (
                    <Person
                        key={i}
                        x={f.x}
                        y={f.y}
                        farge={lyser(i) && beat > 0 ? LILLA : beat === 0 ? '#64748b' : GRA}
                        opasitet={lyser(i) ? 1 : beat >= 3 ? 0.12 : 0.22}
                        forsinkelse={beat > 0 ? (f.x / B) * 0.5 : 0}
                    />
                )
            )}
            {beat === 0 &&
                folk
                    .filter((f) => f.prat)
                    .map((f, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + (i % 7) * 0.15 }}
                        >
                            <rect
                                x={f.x - 4}
                                y={f.y - 66}
                                width={34}
                                height={22}
                                rx={10}
                                fill="#ffffff"
                                stroke="#64748b"
                                strokeWidth={2}
                            />
                            <path
                                d={`M ${f.x + 2} ${f.y - 45} l -4 9 l 10 -9 z`}
                                fill="#ffffff"
                                stroke="#64748b"
                                strokeWidth={2}
                            />
                        </motion.g>
                    ))}
            {beat >= 3 && (
                <Inn>
                    <circle cx={m.x} cy={m.y - 6} r={60} fill={LILLA} opacity={0.18} />
                    <Person x={m.x} y={m.y + 6} s={2} farge={LILLA} />
                </Inn>
            )}
            {beat < 5 && (
                <text
                    x={1560}
                    y={880}
                    textAnchor="end"
                    fontSize={28}
                    fontWeight={600}
                    fill="#64748b"
                >
                    Tenkt eksempel
                </text>
            )}
        </g>
    );
}

/* ---------- summen ---------- */

const SENTER = { x: 800, y: 530 };
const N_SIRKLER = 14;
const SIRKEL_FARGER = ['#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899'];

function Summen({ beat }: { beat: number }) {
    const sirkler = useMemo(
        () =>
            Array.from({ length: N_SIRKLER }, (_, i) => {
                const a = (i / N_SIRKLER) * Math.PI * 2 + 0.2;
                return {
                    cx: SENTER.x + Math.cos(a) * 140,
                    cy: SENTER.y + Math.sin(a) * 120,
                    px: SENTER.x + Math.cos(a) * 560,
                    py: SENTER.y + Math.sin(a) * 300,
                    farge: SIRKEL_FARGER[i % SIRKEL_FARGER.length],
                    venstre: Math.cos(a) < 0,
                };
            }),
        []
    );
    const titler = [
        'Alle har sin egen idiolekt',
        'Det felles i mange: en dialekt',
        'Det felles for alle: språket',
        'Norsk = det vi har til felles',
    ];
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 3)]} />
            {sirkler.map((s, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 && beat <= 1 ? 0.9 : 1 }}
                    transition={{ delay: beat === 0 ? i * 0.12 : 0, duration: 0.6 }}
                >
                    <line
                        x1={s.px}
                        y1={s.py}
                        x2={s.cx}
                        y2={s.cy}
                        stroke={s.farge}
                        strokeWidth={3}
                        opacity={0.4}
                    />
                    <ellipse
                        cx={s.cx}
                        cy={s.cy}
                        rx={230}
                        ry={190}
                        fill={s.farge}
                        fillOpacity={0.07}
                        stroke={s.farge}
                        strokeWidth={3}
                        strokeOpacity={0.6}
                    />
                    <Person x={s.px} y={s.py} s={1.6} farge={s.farge} />
                </motion.g>
            ))}
            {beat >= 1 &&
                [-1, 1].map((side) => (
                    <Inn key={side}>
                        <ellipse
                            cx={SENTER.x + side * 110}
                            cy={SENTER.y}
                            rx={95}
                            ry={130}
                            fill={side < 0 ? TEAL : BLA}
                            fillOpacity={beat === 1 ? 0.75 : 0.4}
                        />
                        {beat === 1 && (
                            <text
                                x={SENTER.x + side * 110}
                                y={SENTER.y + 14}
                                textAnchor="middle"
                                fontSize={38}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                dialekt
                            </text>
                        )}
                    </Inn>
                ))}
            {beat >= 2 && (
                <Inn>
                    <motion.ellipse
                        cx={SENTER.x}
                        cy={SENTER.y}
                        initial={{ rx: 0, ry: 0 }}
                        animate={{ rx: beat === 3 ? 120 : 95, ry: beat === 3 ? 100 : 80 }}
                        transition={{ duration: 0.8 }}
                        fill="#0f172a"
                    />
                    <text
                        x={SENTER.x}
                        y={SENTER.y + 18}
                        textAnchor="middle"
                        fontSize={beat === 3 ? 56 : 48}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        norsk
                    </text>
                </Inn>
            )}
        </g>
    );
}

/* ---------- endring ---------- */

function Endring({ beat }: { beat: number }) {
    const folk = useMemo(() => {
        const rand = lagRand(31);
        const ut: { x: number; y: number; d: number }[] = [];
        for (let r = 0; r < 5; r++) {
            for (let k = 0; k < 12; k++) {
                const x = 170 + k * 115 + (r % 2 ? 55 : 0) + (rand() - 0.5) * 30;
                const y = 300 + r * 120 + (rand() - 0.5) * 24;
                ut.push({ x, y, d: Math.hypot(x - 260, y - 420) });
            }
        }
        return ut;
    }, []);
    const forste = useMemo(
        () =>
            folk
                .map((f, i) => ({ i, d: f.d }))
                .sort((a, b) => a.d - b.d)
                .slice(0, 3)
                .map((x) => x.i),
        [folk]
    );
    const titler = [
        'Språket endrer seg gjennom idiolekter',
        'Noen sier et ord på en ny måte',
        'Etter hvert: vanlig i hele gruppen',
    ];
    const NY = '#f59e0b';
    const GAMMEL = '#64748b';
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 2)]} farge="#f8fafc" />
            {folk.map((f, i) => {
                const ny = beat === 1 ? forste.includes(i) : beat >= 2;
                return (
                    <g key={i}>
                        <Person
                            x={f.x}
                            y={f.y}
                            s={1.5}
                            farge={ny ? NY : GAMMEL}
                            forsinkelse={beat >= 2 ? (f.d / 1400) * 2.2 : 0}
                        />
                        <motion.g
                            initial={false}
                            animate={{ opacity: ny ? 1 : 0.35 }}
                            transition={{
                                duration: 0.6,
                                delay: beat >= 2 ? (f.d / 1400) * 2.2 : 0,
                            }}
                        >
                            <rect
                                x={f.x - 2}
                                y={f.y - 82}
                                width={46}
                                height={28}
                                rx={12}
                                fill={ny ? NY : '#334155'}
                            />
                            <path
                                d={`M ${f.x + 4} ${f.y - 56} l -5 11 l 13 -11 z`}
                                fill={ny ? NY : '#334155'}
                            />
                        </motion.g>
                    </g>
                );
            })}
            <g>
                <rect x={560} y={850} width={22} height={22} rx={6} fill={NY} />
                <text x={594} y={870} fontSize={30} fontWeight={700} fill="#e2e8f0">
                    ny måte
                </text>
                <rect x={820} y={850} width={22} height={22} rx={6} fill={GAMMEL} />
                <text x={854} y={870} fontSize={30} fontWeight={700} fill="#e2e8f0">
                    gammel måte
                </text>
            </g>
        </g>
    );
}
