import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To slags tid side om side: stoppeklokka (fortalt tid, hvor lenge det varer i historien) og
 * boka (fortelletid, hvor lang tid det tar å lese). I «sakte» står klokka nesten stille mens
 * sidene hoper seg opp, og til slutt viser en spenningskurve hvor grepet hører hjemme.
 */

type Modus = 'begrep' | 'sakte';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const VENSTRE = 420;
const HOYRE = 1180;
const MIDT_Y = 450;

interface Side {
    verdi: string;
    /** Viseren går rundt så mange ganger per sekund (0 = stille). */
    fart: number;
    sider: number;
}

interface Steg {
    venstre: Side;
    hoyre: Side;
    under?: [string, string];
    detaljer?: boolean;
    rop?: boolean;
    kurve?: boolean;
}

const BEGREP: Steg[] = [
    { venstre: { verdi: '?', fart: 0.3, sider: 0 }, hoyre: { verdi: '?', fart: 0, sider: 2 } },
    { venstre: { verdi: '100 år', fart: 2.5, sider: 0 }, hoyre: { verdi: '?', fart: 0, sider: 2 } },
    {
        venstre: { verdi: '100 år', fart: 2.5, sider: 0 },
        hoyre: { verdi: '5 timer', fart: 0, sider: 12 },
    },
    {
        venstre: { verdi: '5 sekunder', fart: 0.05, sider: 0 },
        hoyre: { verdi: '10 sider', fart: 0, sider: 10 },
    },
    {
        venstre: { verdi: '5 sekunder', fart: 0.05, sider: 0 },
        hoyre: { verdi: '10 sider', fart: 0, sider: 10 },
        under: ['hva som faktisk skjer', 'hvor mye plass det får'],
    },
];

const SAKTE_V: Side = { verdi: '1 sekund', fart: 0.02, sider: 0 };
const SAKTE_H: Side = { verdi: 'mange sider', fart: 0, sider: 14 };
const SAKTE: Steg[] = [
    { venstre: SAKTE_V, hoyre: SAKTE_H, under: ['kort', 'lang'] },
    { venstre: SAKTE_V, hoyre: SAKTE_H, detaljer: true },
    { venstre: SAKTE_V, hoyre: SAKTE_H, rop: true },
    { venstre: SAKTE_V, hoyre: SAKTE_H, kurve: true },
];

const STEG: Record<Modus, Steg[]> = { begrep: BEGREP, sakte: SAKTE };

/**
 * Viseren på stoppeklokka. Står stille på pause. Vinkelen skrives rett på linja hver frame
 * i stedet for i state: en React-oppdatering per frame holdt skriftlastingen i gang for
 * alltid, så skjermbildene ventet seg i hjel.
 */
function Viser({ fart, playing }: { fart: number; playing: boolean }) {
    const linje = useRef<SVGLineElement>(null);
    const vinkel = useRef(0);
    useEffect(() => {
        const tegn = () => {
            const r = vinkel.current;
            linje.current?.setAttribute('x2', String(VENSTRE + Math.sin(r) * 130));
            linje.current?.setAttribute('y2', String(MIDT_Y - Math.cos(r) * 130));
        };
        tegn();
        if (!playing || fart === 0) return;
        let id = 0;
        let forrige = performance.now();
        const steg = (na: number) => {
            const dt = Math.min((na - forrige) / 1000, 0.05);
            forrige = na;
            vinkel.current = (vinkel.current + dt * fart * Math.PI * 2) % (Math.PI * 2);
            tegn();
            id = requestAnimationFrame(steg);
        };
        id = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(id);
    }, [fart, playing]);
    return (
        <line
            ref={linje}
            x1={VENSTRE}
            y1={MIDT_Y}
            x2={VENSTRE}
            y2={MIDT_Y - 130}
            stroke="#dc2626"
            strokeWidth={10}
            strokeLinecap="round"
        />
    );
}

function Stoppeklokke({ fart, playing }: { fart: number; playing: boolean }) {
    return (
        <g>
            <rect x={VENSTRE - 26} y={MIDT_Y - 225} width={52} height={40} rx={8} fill="#334155" />
            <circle
                cx={VENSTRE}
                cy={MIDT_Y}
                r={175}
                fill="#ffffff"
                stroke="#334155"
                strokeWidth={16}
            />
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <line
                        key={i}
                        x1={VENSTRE + Math.sin(a) * 140}
                        y1={MIDT_Y - Math.cos(a) * 140}
                        x2={VENSTRE + Math.sin(a) * 158}
                        y2={MIDT_Y - Math.cos(a) * 158}
                        stroke="#94a3b8"
                        strokeWidth={6}
                    />
                );
            })}
            <Viser fart={fart} playing={playing} />
            <circle cx={VENSTRE} cy={MIDT_Y} r={14} fill="#334155" />
        </g>
    );
}

/** Ei bok sett fra siden: sidene legger seg oppå hverandre som en bunke. */
function Bunke({ sider }: { sider: number }) {
    return (
        <g>
            {Array.from({ length: 14 }, (_, i) => {
                const vis = i < sider;
                return (
                    <motion.rect
                        key={i}
                        x={HOYRE - 150 + (i % 2) * 6}
                        width={300}
                        height={20}
                        rx={4}
                        fill={i % 2 ? '#f8fafc' : '#ffffff'}
                        stroke="#94a3b8"
                        strokeWidth={3}
                        initial={false}
                        animate={{ y: MIDT_Y + 150 - i * 22, opacity: vis ? 1 : 0 }}
                        transition={{ duration: 0.4, delay: vis ? i * 0.12 : 0 }}
                    />
                );
            })}
            <rect x={HOYRE - 160} y={MIDT_Y + 172} width={320} height={22} rx={6} fill="#7c2d12" />
        </g>
    );
}

/** Verdien teller fram med en liten sprett når den skifter. */
function Verdi({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    const [skala, setSkala] = useState(1);
    useEffect(() => {
        const c = animate(0.6, 1, { duration: 0.5, onUpdate: setSkala });
        return () => c.stop();
    }, [tekst]);
    return (
        <text
            x={x}
            y={MIDT_Y + 290}
            textAnchor="middle"
            fontSize={68 * skala}
            fontWeight={900}
            fill={farge}
            style={FONT}
        >
            {tekst}
        </text>
    );
}

const DETALJER = ['en svettedråpe', 'en lyd', 'en følelse'];

function Kurve() {
    // Spenningskurven stiger mot et høydepunkt; det utvidede øyeblikket ligger på toppen.
    const d =
        'M 160 760 C 520 720, 700 560, 860 300 C 920 210, 1000 210, 1060 300 C 1180 470, 1320 600, 1440 640';
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={80}
                y={150}
                width={1440}
                height={690}
                rx={30}
                fill="#ffffff"
                stroke="#e2ddd2"
                strokeWidth={4}
            />
            <motion.path
                d={d}
                fill="none"
                stroke="#334155"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
            <motion.circle
                cx={960}
                cy={232}
                r={46}
                fill="#facc15"
                stroke="#b45309"
                strokeWidth={6}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 1.6, duration: 0.7 }}
                style={{ transformOrigin: '960px 232px', transformBox: 'view-box' }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
                <text x={1110} y={250} fontSize={42} fontWeight={900} fill="#b45309" style={FONT}>
                    utvidet øyeblikk
                </text>
                <text x={1110} y={300} fontSize={32} fontWeight={600} fill="#64748b" style={FONT}>
                    der det er mest spennende
                </text>
            </motion.g>
            <text
                x={890}
                y={250}
                textAnchor="end"
                fontSize={34}
                fontWeight={800}
                fill="#334155"
                style={FONT}
            >
                høydepunkt
            </text>
            <text x={160} y={810} fontSize={32} fontWeight={700} fill="#94a3b8" style={FONT}>
                spenningskurven
            </text>
        </motion.g>
    );
}

export function TidToKlokker({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'begrep';
    const liste = STEG[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    const overskrift = steg.kurve
        ? 'Hvor i historien?'
        : modus === 'sakte'
          ? 'Utvidet øyeblikk'
          : 'Fortalt tid og fortelletid';
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {!steg.kurve && (
                    <g>
                        <text
                            x={VENSTRE}
                            y={170}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#0f766e"
                            style={FONT}
                        >
                            Fortalt tid
                        </text>
                        <text
                            x={HOYRE}
                            y={170}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#7c3aed"
                            style={FONT}
                        >
                            Fortelletid
                        </text>
                        <line
                            x1={800}
                            y1={150}
                            x2={800}
                            y2={800}
                            stroke="#e2ddd2"
                            strokeWidth={4}
                        />
                        <Stoppeklokke fart={steg.venstre.fart} playing={playing} />
                        <g opacity={steg.detaljer ? 0.25 : 1}>
                            <Bunke sider={steg.hoyre.sider} />
                        </g>
                        <Verdi x={VENSTRE} tekst={steg.venstre.verdi} farge="#0f766e" />
                        <Verdi x={HOYRE} tekst={steg.hoyre.verdi} farge="#7c3aed" />
                        {steg.under && (
                            <motion.g
                                key={steg.under.join()}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <text
                                    x={VENSTRE}
                                    y={MIDT_Y + 350}
                                    textAnchor="middle"
                                    fontSize={36}
                                    fontWeight={600}
                                    fill="#475569"
                                    style={FONT}
                                >
                                    {steg.under[0]}
                                </text>
                                <text
                                    x={HOYRE}
                                    y={MIDT_Y + 350}
                                    textAnchor="middle"
                                    fontSize={36}
                                    fontWeight={600}
                                    fill="#475569"
                                    style={FONT}
                                >
                                    {steg.under[1]}
                                </text>
                            </motion.g>
                        )}
                    </g>
                )}
                {steg.kurve && <Kurve />}
            </svg>
            <div
                className="absolute left-0 right-0 text-center font-black text-slate-900"
                style={{ ...FONT, top: '3%', fontSize: '2.1rem' }}
            >
                {overskrift}
            </div>
            <AnimatePresence>
                {steg.detaljer && (
                    <motion.div
                        key="detaljer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex flex-col gap-3"
                        style={{ left: '60%', top: '24%' }}
                    >
                        {DETALJER.map((d, i) => (
                            <motion.div
                                key={d}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.7 }}
                                className="rounded-2xl bg-white shadow-xl border-4 border-violet-600 text-violet-800 font-black"
                                style={{ ...FONT, padding: '0.5rem 1.2rem', fontSize: '1.7rem' }}
                            >
                                {d}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {steg.rop && (
                    <motion.div
                        key="rop"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                        className="absolute left-1/2 -translate-x-1/2 rounded-3xl bg-red-600 text-white shadow-2xl text-center font-black"
                        style={{
                            ...FONT,
                            top: '36%',
                            padding: '1rem 2rem',
                            fontSize: '2.6rem',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Stopp opp! Dette er viktig.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
