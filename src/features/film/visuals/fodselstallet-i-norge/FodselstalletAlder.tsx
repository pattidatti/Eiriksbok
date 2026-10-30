import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Camera, User } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Hvordan SFT regnes ut. «maling»: to land med ulikt mange unge voksne, så én stolpe per
 * alder fra 15 til 49 som til slutt stables til ett tall. «venter»: stolpene flytter seg
 * mot høyere alder, en kvinne som venter fra 27 til 32, og kvinnene født i 1979.
 * Stolpehøydene er en tegning av formen (flest barn rundt 30), ikke målte tall.
 */

type Modus = 'maling' | 'venter';

const B = 1600;
const H = 900;
const ALDRE = Array.from({ length: 35 }, (_, i) => 15 + i);
const X0 = 180;
const X1 = 1180;
const BUNN = 720;
const BREDDE = (X1 - X0) / ALDRE.length;

const xFor = (alder: number) => X0 + (alder - 15) * BREDDE;

/** En jevn pukkel: flest barn rundt toppen. */
function hoyde(alder: number, topp: number) {
    const d = (alder - topp) / 5.5;
    return 340 * Math.exp(-d * d);
}

function Stolper({ topp, stablet, hullFra, hullTil }: { topp: number; stablet: boolean; hullFra?: number; hullTil?: number }) {
    // Når stolpene stables, legges de oppå hverandre i én søyle til høyre.
    const skala = 0.11;
    const hoyder = ALDRE.map((a) => {
        const tom = hullFra !== undefined && hullTil !== undefined && a >= hullFra && a < hullTil;
        return hoyde(a, topp) * (tom ? 0.55 : 1);
    });
    const topper = hoyder.map((_, i) => BUNN - hoyder.slice(0, i + 1).reduce((sum, h) => sum + h * skala, 0));
    return (
        <>
            {ALDRE.map((a, i) => {
                const h = hoyder[i];
                const sh = h * skala;
                const mål = stablet ? { x: 1330, y: topper[i], width: 110, height: sh } : { x: xFor(a) + 2, y: BUNN - h, width: BREDDE - 4, height: h };
                return (
                    <motion.rect
                        key={a}
                        initial={{ x: xFor(a) + 2, y: BUNN, width: BREDDE - 4, height: 0 }}
                        animate={mål}
                        transition={{ duration: 1.1, delay: stablet ? (a - 15) * 0.03 : (a - 15) * 0.02 }}
                        fill={a % 2 === 0 ? '#0d9488' : '#14b8a6'}
                        rx={3}
                    />
                );
            })}
        </>
    );
}

function Akse({ vis }: { vis: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }}>
            <line x1={X0 - 10} x2={X1 + 10} y1={BUNN} y2={BUNN} stroke="#334155" strokeWidth={4} />
            {[15, 20, 25, 30, 35, 40, 45, 49].map((a) => (
                <text key={a} x={xFor(a) + BREDDE / 2} y={BUNN + 48} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                    {a}
                </text>
            ))}
            <text x={(X0 + X1) / 2} y={BUNN + 100} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                kvinnens alder dette året
            </text>
        </motion.g>
    );
}

function Tittel({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={800}
                y={95}
                textAnchor="middle"
                fontSize={50}
                fontWeight={900}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

/** To land: mange unge voksne som får ett barn hver, mot få som får to. */
function ToLand() {
    const land = [
        { navn: 'Mange unge voksne', kvinner: 8, barn: 1, x: '6%' },
        { navn: 'Få unge voksne', kvinner: 3, barn: 2, x: '54%' },
        // Tenkt eksempel, ikke målte tall.
    ];
    return (
        <>
            {land.map((l, li) => (
                <motion.div
                    key={l.navn}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + li * 0.6 }}
                    className="absolute rounded-3xl bg-white/95 shadow-xl px-5 py-4"
                    style={{ left: l.x, top: '20%', width: '40%' }}
                >
                    <div className="text-3xl font-black text-slate-900 mb-1">{l.navn}</div>
                    <div className="text-lg font-semibold text-slate-400">tenkt eksempel</div>
                    <div className="text-xl font-semibold text-slate-500 mb-3">
                        {l.barn === 1 ? 'hver får få barn' : 'hver får flere barn'}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {Array.from({ length: l.kvinner }, (_, i) => (
                            <div key={i} className="flex items-end">
                                <User size={44} className="text-pink-600" strokeWidth={2.5} />
                                {Array.from({ length: l.barn }, (_, b) => (
                                    <Baby key={b} size={26} className="text-amber-500" strokeWidth={2.5} />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-2xl font-black text-amber-600">
                        {l.barn === 1 ? 'Mange fødte barn' : 'Færre fødte barn'}
                    </div>
                </motion.div>
            ))}
        </>
    );
}

function Kort({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute rounded-2xl bg-white/95 shadow-xl px-5 py-3"
            style={style}
        >
            {children}
        </motion.div>
    );
}

function Maling({ beat }: { beat: number }) {
    const titler = [
        'Å telle barna sier lite alene',
        'Samlet fruktbarhetstall (SFT)',
        'Hver alder for seg, fra 15 til 49 år',
        'Legg sammen alle aldrene',
        'Et øyeblikksbilde av ett år',
    ];
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Tittel tekst={titler[Math.min(beat, 4)]} />
                {beat >= 2 && (
                    <>
                        <Akse vis />
                        <Stolper topp={30} stablet={beat >= 3} />
                    </>
                )}
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                        <text x={1385} y={BUNN + 60} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f766e">
                            = SFT
                        </text>
                    </motion.g>
                )}
            </svg>
            {beat === 0 && <ToLand />}
            <AnimatePresence>
                {beat === 1 && (
                    <Kort key="sft" style={{ left: '12%', right: '12%', top: '30%' }}>
                        <div className="text-4xl font-black text-slate-900 mb-3">Hvor mange barn får en kvinne i løpet av livet, i snitt?</div>
                        <div className="text-2xl font-semibold text-slate-600">
                            Hvis dette året gjentar seg. Fruktbarhet betyr her: hvor mange barn folk får.
                        </div>
                    </Kort>
                )}
                {beat === 4 && (
                    <Kort key="bilde" style={{ left: '8%', top: '18%', width: '46%' }}>
                        <div className="flex items-center gap-4">
                            <Camera size={56} className="text-slate-800" />
                            <div className="text-2xl font-bold text-slate-800">
                                Hva om dette året gjentok seg gjennom hele livet til en kvinne?
                            </div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </>
    );
}

function Venter({ beat }: { beat: number }) {
    const titler = ['Flere venter med første barn', 'Barn som 27-åring eller som 32-åring?', 'Årene hun venter, teller ikke', 'Kvinnene født i 1979, fulgt hele livet'];
    const topp = beat >= 1 ? 32 : 30;
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Tittel tekst={titler[Math.min(beat, 3)]} />
                {beat <= 2 && (
                    <>
                        <Akse vis />
                        <Stolper topp={topp} stablet={false} hullFra={beat === 2 ? 27 : undefined} hullTil={beat === 2 ? 32 : undefined} />
                    </>
                )}
                {beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                        <line x1={xFor(30)} x2={xFor(33)} y1={300} y2={300} stroke="#ea580c" strokeWidth={8} markerEnd="url(#pil)" />
                        <text x={xFor(31.5)} y={270} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ea580c">
                            senere
                        </text>
                    </motion.g>
                )}
                {(beat === 1 || beat === 2) &&
                    [27, 32].map((a, i) => (
                        <motion.g key={a} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.8 }}>
                            <line x1={xFor(a) + BREDDE / 2} x2={xFor(a) + BREDDE / 2} y1={250} y2={BUNN} stroke={i === 0 ? '#94a3b8' : '#db2777'} strokeWidth={6} strokeDasharray={i === 0 ? '14 10' : undefined} />
                            <text x={xFor(a) + BREDDE / 2} y={230} textAnchor="middle" fontSize={36} fontWeight={900} fill={i === 0 ? '#64748b' : '#db2777'}>
                                {a} år
                            </text>
                        </motion.g>
                    ))}
                {beat === 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                        <rect x={xFor(27)} y={330} width={xFor(32) - xFor(27)} height={BUNN - 330} fill="#f59e0b" opacity={0.15} />
                        <text x={(xFor(27) + xFor(32)) / 2 + BREDDE / 2} y={380} textAnchor="middle" fontSize={30} fontWeight={800} fill="#b45309">
                            venter
                        </text>
                    </motion.g>
                )}
                <defs>
                    <marker id="pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M0,0 L10,5 L0,10 z" fill="#ea580c" />
                    </marker>
                </defs>
            </svg>
            <AnimatePresence>
                {beat === 2 && (
                    <Kort key="faller" style={{ right: '4%', top: '22%', width: '24%' }}>
                        <div className="text-3xl font-black text-red-600">SFT faller</div>
                        <div className="text-xl font-semibold text-slate-600">men kanskje like mange barn til slutt</div>
                    </Kort>
                )}
                {beat === 3 && (
                    <Kort key="kull" style={{ left: '18%', right: '18%', top: '28%' }}>
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <div className="text-2xl font-bold text-slate-500">Født i 1979, ved 45 år</div>
                                <div className="text-7xl font-black text-teal-700 tabular-nums">1,89</div>
                                <div className="text-2xl font-bold text-slate-700">barn i snitt</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-500">SFT i 2025</div>
                                <div className="text-7xl font-black text-slate-400 tabular-nums">1,48</div>
                                <div className="text-2xl font-bold text-slate-700">dagens tall er lavere</div>
                            </div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </>
    );
}

export function FodselstalletAlder({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'maling';
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            {modus === 'maling' ? <Maling beat={beat} /> : <Venter beat={beat} />}
        </div>
    );
}
