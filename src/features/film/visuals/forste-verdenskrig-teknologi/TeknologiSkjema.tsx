import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skjemaer i SVG, i tre moduser:
 * - vekt: en vippe med angrep på den ene siden og forsvar på den andre. Maskingeværet får
 *   forsvaret til å synke, og nederst graver soldatene seg ned.
 * - tank: et snitt gjennom en Mark I (trangt, varmt, skiftenøkler mot panseret), og til
 *   slutt vippa igjen, der stridsvognen løfter angrepet.
 * - propell: et fly fra siden. Maskingeværet skyter bare når propellbladet er ute av veien.
 */

type Modus = 'vekt' | 'tank' | 'propell';

const B = 1600;
const H = 900;
const MIDT = 800;
const AKSE_Y = 520;
const ARM = 470;

const ANGREP = '#1d4ed8';
const FORSVAR = '#b45309';

/** En vinkel i grader som glir mot målet. */
function useGlidendeVinkel(mal: number) {
    const [a, setA] = useState(0);
    const naa = useRef(0);
    useEffect(() => {
        const c = animate(naa.current, mal, {
            duration: 1.8,
            delay: 0.4,
            ease: [0.34, 1.3, 0.64, 1],
            onUpdate: (x) => {
                naa.current = x;
                setA(x);
            },
        });
        return () => c.stop();
    }, [mal]);
    return a;
}

function MgIkon({ x, y, s = 1, farge = '#27272a' }: { x: number; y: number; s?: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-70} y={-48} width={110} height={30} rx={14} fill={farge} />
            <rect x={-110} y={-40} width={44} height={12} fill={farge} />
            <rect x={36} y={-50} width={40} height={34} rx={6} fill={farge} />
            <line x1={0} y1={-20} x2={-40} y2={30} stroke={farge} strokeWidth={9} strokeLinecap="round" />
            <line x1={0} y1={-20} x2={40} y2={30} stroke={farge} strokeWidth={9} strokeLinecap="round" />
            <line x1={0} y1={-20} x2={0} y2={30} stroke={farge} strokeWidth={9} strokeLinecap="round" />
        </g>
    );
}

function Soldat({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-62} r={14} fill={farge} />
            <rect x={-13} y={-46} width={26} height={44} rx={8} fill={farge} />
            <line x1={-6} y1={-4} x2={-14} y2={30} stroke={farge} strokeWidth={10} strokeLinecap="round" />
            <line x1={6} y1={-4} x2={16} y2={30} stroke={farge} strokeWidth={10} strokeLinecap="round" />
            <line x1={10} y1={-40} x2={44} y2={-58} stroke="#3f2d1d" strokeWidth={6} strokeLinecap="round" />
        </g>
    );
}

function TankIkon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -100 0 L 80 0 L 125 -45 L 100 -78 L -110 -78 L -125 -40 Z" fill="#3f3a2e" />
            <path d="M -85 -14 L 70 -14 L 104 -45 L 88 -64 L -95 -64 L -106 -40 Z" fill="#6b6a3a" />
            <rect x={-40} y={-50} width={60} height={30} rx={4} fill="#57552f" />
        </g>
    );
}

/** Vippa: angrep til venstre, forsvar til høyre. Positiv vinkel = forsvaret er tyngst. */
function Vippe({ vinkel, venstre, hoyre }: { vinkel: number; venstre: ReactNode; hoyre: ReactNode }) {
    const r = (vinkel * Math.PI) / 180;
    const vx = MIDT - ARM * Math.cos(r);
    const vy = AKSE_Y - ARM * Math.sin(r);
    const hx = MIDT + ARM * Math.cos(r);
    const hy = AKSE_Y + ARM * Math.sin(r);
    return (
        <g>
            <path d={`M ${MIDT} ${AKSE_Y} L ${MIDT - 70} ${AKSE_Y + 150} L ${MIDT + 70} ${AKSE_Y + 150} Z`} fill="#475569" />
            <line x1={vx} y1={vy} x2={hx} y2={hy} stroke="#334155" strokeWidth={18} strokeLinecap="round" />
            <circle cx={MIDT} cy={AKSE_Y} r={14} fill="#f8fafc" stroke="#334155" strokeWidth={6} />
            <g transform={`translate(${vx} ${vy})`}>
                <rect x={-150} y={-12} width={300} height={16} rx={8} fill={ANGREP} />
                {venstre}
                <text x={0} y={70} textAnchor="middle" fontSize={44} fontWeight={900} fill={ANGREP}>
                    ANGREP
                </text>
            </g>
            <g transform={`translate(${hx} ${hy})`}>
                <rect x={-150} y={-12} width={300} height={16} rx={8} fill={FORSVAR} />
                {hoyre}
                <text x={0} y={70} textAnchor="middle" fontSize={44} fontWeight={900} fill={FORSVAR}>
                    FORSVAR
                </text>
            </g>
        </g>
    );
}

/** Sandsekker foran maskingeværet: forsvarerne ligger beskyttet. */
function Sandvoll() {
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            {[-120, -60, 0, 60, 120].map((x) => (
                <ellipse key={x} cx={x} cy={-30} rx={34} ry={20} fill="#b9a37a" stroke="#8a7350" strokeWidth={3} />
            ))}
            {[-90, -30, 30, 90].map((x) => (
                <ellipse key={x} cx={x} cy={-62} rx={34} ry={20} fill="#c8b48a" stroke="#8a7350" strokeWidth={3} />
            ))}
        </motion.g>
    );
}

function VektBilde({ beat }: { beat: number }) {
    const vinkel = useGlidendeVinkel(beat === 0 ? 4 : 16);
    return (
        <>
            <Vippe
                vinkel={vinkel}
                venstre={
                    <>
                        <Soldat x={-80} y={-44} farge={ANGREP} />
                        <Soldat x={0} y={-44} farge={ANGREP} />
                        <Soldat x={80} y={-44} farge={ANGREP} />
                    </>
                }
                hoyre={
                    <>
                        <MgIkon x={0} y={-44} s={1.15} />
                        {beat >= 1 && <Sandvoll />}
                    </>
                }
            />
            <AnimatePresence>
                {beat === 4 && (
                    <motion.g key="lang" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }}>
                        <rect x={760} y={150} width={720} height={86} rx={20} fill="#fff7ed" stroke="#b45309" strokeWidth={5} />
                        <text x={1120} y={207} textAnchor="middle" fontSize={40} fontWeight={900} fill="#7c2d12">
                            Det tok lang og blodig tid
                        </text>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="selvmord" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }}>
                        <rect x={590} y={150} width={920} height={86} rx={20} fill="#fef2f2" stroke="#dc2626" strokeWidth={5} />
                        <text x={1050} y={207} textAnchor="middle" fontSize={40} fontWeight={900} fill="#991b1b">
                            Over åpent terreng = nesten selvmord
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Skyttergravene nederst */}
            <motion.g initial={false} animate={{ opacity: beat >= 3 ? 1 : 0 }} transition={{ duration: 0.8 }}>
                <rect x={0} y={760} width={B} height={140} fill="#6b5a44" />
                {[260, 1340].map((x) => (
                    <rect key={x} x={x - 160} y={772} width={320} height={70} rx={10} fill="#3b2f22" />
                ))}
                {[180, 260, 340].map((x) => (
                    <circle key={x} cx={x} cy={790} r={13} fill={ANGREP} />
                ))}
                {[1260, 1340, 1420].map((x) => (
                    <circle key={x} cx={x} cy={790} r={13} fill={FORSVAR} />
                ))}
                <text x={MIDT} y={830} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fef3c7" letterSpacing={6}>
                    STILLSTAND
                </text>
            </motion.g>
        </>
    );
}

function TankSnitt({ beat }: { beat: number }) {
    return (
        <>
            {/* Skroget sett fra siden, åpent som et snitt */}
            <path d="M 260 720 L 1220 720 L 1420 520 L 1300 330 L 230 330 L 160 520 Z" fill="#3f3a2e" />
            <path d="M 320 680 L 1180 680 L 1340 520 L 1250 380 L 290 380 L 230 520 Z" fill="#e7e2d3" />
            {/* Motoren i midten */}
            <rect x={640} y={500} width={300} height={170} rx={14} fill="#52525b" />
            <text x={790} y={600} textAnchor="middle" fontSize={40} fontWeight={900} fill="#f8fafc">
                MOTOR
            </text>
            {[680, 760, 840, 900].map((x, i) => (
                <motion.rect
                    key={x}
                    x={x}
                    y={470}
                    width={34}
                    height={40}
                    rx={6}
                    fill="#3f3f46"
                    animate={{ y: [470, 456, 470] }}
                    transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.08 }}
                />
            ))}
            {/* Mannskapet */}
            {[400, 500, 1060, 1160].map((x) => (
                <g key={x}>
                    <circle cx={x} cy={500} r={22} fill="#a8a29e" />
                    <rect x={x - 24} y={525} width={48} height={110} rx={12} fill="#78716c" />
                </g>
            ))}
            {/* Varmen */}
            <motion.rect
                x={290}
                y={380}
                width={1050}
                height={300}
                fill="#ef4444"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? [0.08, 0.2, 0.08] : 0.06 }}
                transition={{ duration: 2, repeat: beat === 0 ? Infinity : 0 }}
            />
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g key="varme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
                        <rect x={1400} y={130} width={42} height={160} rx={21} fill="#f8fafc" stroke="#334155" strokeWidth={5} />
                        <motion.rect
                            x={1410}
                            width={22}
                            rx={11}
                            fill="#dc2626"
                            initial={{ y: 270, height: 10 }}
                            animate={{ y: 150, height: 130 }}
                            transition={{ duration: 3 }}
                        />
                        <text x={1380} y={230} textAnchor="end" fontSize={40} fontWeight={900} fill="#991b1b">
                            uutholdelig varmt
                        </text>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="nokkel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.g
                            animate={{ x: [0, -18, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
                        >
                            <line x1={1205} y1={470} x2={1290} y2={420} stroke="#334155" strokeWidth={14} strokeLinecap="round" />
                            <circle cx={1290} cy={420} r={18} fill="none" stroke="#334155" strokeWidth={10} />
                        </motion.g>
                        {[0, 1, 2].map((i) => (
                            <motion.path
                                key={i}
                                d={`M ${1330 + i * 26} 380 Q ${1350 + i * 26} 430 ${1330 + i * 26} 480`}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={7}
                                strokeLinecap="round"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                            />
                        ))}
                        <text x={1180} y={260} textAnchor="middle" fontSize={44} fontWeight={900} fill="#1e293b">
                            BANK BANK
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

function TankRekke() {
    return (
        <>
            {[0, 1, 2, 3, 4].map((i) => {
                const brutt = i === 1 || i === 3;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: brutt ? 0.45 : 1 }}
                        transition={{ delay: 0.3 + i * 0.25 }}
                    >
                        <TankIkon x={200 + i * 300} y={560} s={0.9} />
                        {brutt && (
                            <g>
                                <circle cx={200 + i * 300} cy={470} r={34} fill="#dc2626" />
                                <rect x={200 + i * 300 - 20} y={464} width={40} height={12} fill="#fff" />
                            </g>
                        )}
                    </motion.g>
                );
            })}
            <rect x={0} y={600} width={B} height={300} fill="#6b5a44" />
            <text x={MIDT} y={730} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fef3c7">
                Mange brøt sammen. Men de skremte.
            </text>
        </>
    );
}

function TankVekt() {
    const vinkel = useGlidendeVinkel(-14);
    return (
        <>
            <Vippe
                vinkel={vinkel}
                venstre={
                    <>
                        <Soldat x={-110} y={-44} farge={ANGREP} s={0.8} />
                        <TankIkon x={40} y={-14} s={0.85} />
                    </>
                }
                hoyre={<MgIkon x={0} y={-44} s={1.15} />}
            />
            <text x={MIDT} y={250} textAnchor="middle" fontSize={50} fontWeight={900} fill={ANGREP}>
                1918: avgjørende for seieren
            </text>
        </>
    );
}

/** Flyet fra siden, med en propell som går rundt og et gevær som skyter mellom bladene. */
function Fly({ beat, playing }: { beat: number; playing: boolean }) {
    const blad = useRef<SVGLineElement>(null);
    const skudd = useRef<(SVGCircleElement | null)[]>([]);
    const synk = beat >= 2;
    useEffect(() => {
        let v = 0;
        let id = 0;
        let sist = performance.now();
        const kuler = [0, 0, 0, 0, 0].map((_, i) => ({ x: -1, i }));
        const steg = (naa: number) => {
            const dt = playing ? Math.min((naa - sist) / 1000, 0.05) : 0;
            sist = naa;
            v += dt * (synk ? 3.2 : 9);
            const a = v * Math.PI * 2;
            const y = Math.cos(a) * 120;
            if (blad.current) {
                blad.current.setAttribute('y1', String(430 - y));
                blad.current.setAttribute('y2', String(430 + y));
            }
            // Fritt når bladet er nesten vannrett (kort sett fra siden).
            const fritt = Math.abs(Math.cos(a)) < 0.35;
            if (synk && fritt && dt > 0) {
                const ledig = kuler.find((k) => k.x < 0);
                if (ledig) ledig.x = 1180;
            }
            kuler.forEach((k) => {
                if (k.x >= 0) k.x += dt * 1500;
                if (k.x > 1620) k.x = -1;
                const el = skudd.current[k.i];
                if (el) {
                    el.setAttribute('cx', String(k.x));
                    el.setAttribute('opacity', k.x >= 0 ? '1' : '0');
                }
            });
            id = requestAnimationFrame(steg);
        };
        id = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(id);
    }, [playing, synk]);
    return (
        <g>
            {/* Skrog, vinger og hale. Flyet peker mot høyre. */}
            <path d="M 560 400 L 1120 390 L 1150 430 L 1120 470 L 560 450 L 470 430 Z" fill="#a16207" />
            <rect x={760} y={300} width={240} height={22} rx={8} fill="#854d0e" />
            <rect x={760} y={520} width={240} height={22} rx={8} fill="#854d0e" />
            {[800, 960].map((x) => (
                <g key={x}>
                    <line x1={x} y1={322} x2={x} y2={400} stroke="#44403c" strokeWidth={6} />
                    <line x1={x} y1={460} x2={x} y2={520} stroke="#44403c" strokeWidth={6} />
                </g>
            ))}
            <path d="M 470 430 L 430 350 L 520 350 L 560 400 Z" fill="#854d0e" />
            <circle cx={900} cy={380} r={18} fill="#44403c" />
            <line x1={880} y1={560} x2={860} y2={620} stroke="#44403c" strokeWidth={6} />
            <line x1={940} y1={560} x2={960} y2={620} stroke="#44403c" strokeWidth={6} />
            <circle cx={860} cy={630} r={20} fill="#27272a" />
            <circle cx={960} cy={630} r={20} fill="#27272a" />
            {/* Geværet på toppen, foran piloten */}
            <motion.g initial={false} animate={{ opacity: beat >= 2 ? 1 : 0 }}>
                <rect x={960} y={365} width={170} height={16} rx={6} fill="#18181b" />
                <rect x={1000} y={352} width={60} height={22} rx={4} fill="#27272a" />
            </motion.g>
            {/* Navet og bladet */}
            <circle cx={1160} cy={430} r={20} fill="#3f3f46" />
            <line ref={blad} x1={1170} y1={310} x2={1170} y2={550} stroke="#57534e" strokeWidth={22} strokeLinecap="round" />
            {[0, 1, 2, 3, 4].map((i) => (
                <circle
                    key={i}
                    ref={(el) => {
                        skudd.current[i] = el;
                    }}
                    cx={-10}
                    cy={373}
                    r={9}
                    fill="#f59e0b"
                    opacity={0}
                />
            ))}
        </g>
    );
}

function FlyBilde({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {/* Bakken langt nede, med skyttergravene */}
            <rect x={0} y={760} width={B} height={140} fill="#7a8a55" />
            <path d="M 0 810 L 200 800 L 420 820 L 640 805 L 900 825 L 1150 805 L 1400 820 L 1600 808" fill="none" stroke="#5b4636" strokeWidth={14} />
            <path d="M 0 850 L 230 840 L 460 860 L 700 845 L 950 865 L 1200 845 L 1600 855" fill="none" stroke="#5b4636" strokeWidth={14} />
            <Fly beat={beat} playing={playing} />
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g key="speid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
                        <path d="M 880 470 L 620 790 L 1140 790 Z" fill="#fef9c3" opacity={0.45} />
                        <text x={1180} y={720} fontSize={40} fontWeight={900} fill="#1e293b">
                            speider bak linjene
                        </text>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="pistol" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
                        <rect x={140} y={180} width={520} height={90} rx={20} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                        <text x={400} y={240} textAnchor="middle" fontSize={44} fontWeight={900} fill="#1e293b">
                            pistoler og rifler
                        </text>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="synk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
                        <rect x={140} y={170} width={700} height={130} rx={20} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                        <text x={490} y={225} textAnchor="middle" fontSize={40} fontWeight={900} fill="#1e293b">
                            Skyter gjennom propellen
                        </text>
                        <text x={490} y={275} textAnchor="middle" fontSize={40} fontWeight={900} fill="#b45309">
                            uten å treffe bladene
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="ess" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
                        <rect x={140} y={170} width={640} height={130} rx={20} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                        <text x={460} y={225} textAnchor="middle" fontSize={42} fontWeight={900} fill="#1e293b">
                            Røde Baron
                        </text>
                        <text x={460} y={275} textAnchor="middle" fontSize={36} fontWeight={800} fill="#475569">
                            gjort til helt i propagandaen
                        </text>
                        <path d="M 900 250 l 14 30 l 33 4 l -24 23 l 6 33 l -29 -16 l -29 16 l 6 -33 l -24 -23 l 33 -4 Z" fill="#f59e0b" />
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

const TITLER: Record<Modus, string[]> = {
    vekt: ['Angrep mot forsvar', 'Forsvaret får overtaket', 'Åpent terreng', 'Ned i skyttergravene', 'Generalene lærer sakte'],
    tank: ['Inne i en Mark I', 'Skiftenøkkel mot panseret', 'Stålmonstrene', 'Avgjørende i 1918'],
    propell: ['1914: flyet speider', 'Pilotene skyter', 'Gjennombruddet', 'Jagerflyet'],
};

export function TeknologiSkjema({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props?.modus ?? 'vekt';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    const bakgrunn = modus === 'propell' ? '#dbeafe' : '#f1f5f9';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet">
                {modus === 'vekt' && <VektBilde beat={beat} />}
                {modus === 'tank' && beat <= 1 && <TankSnitt beat={beat} />}
                {modus === 'tank' && beat === 2 && <TankRekke />}
                {modus === 'tank' && beat >= 3 && <TankVekt />}
                {modus === 'propell' && <FlyBilde beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '3%', left: '3%' }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
