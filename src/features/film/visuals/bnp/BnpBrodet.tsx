import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Bike, Bus, ChefHat, Factory, Scissors, User, Wheat } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Hva BNP er, i tre modus. «ordet»: forkortelsen, varer og tjenester, og SSB som regner.
 * «kjede»: korn, mel og brød, og hvorfor kornet ikke skal telles tre ganger. «priser»:
 * like mange brød, høyere priser, nominelt mot reelt BNP.
 */

type Modus = 'ordet' | 'kjede' | 'priser';

const KORN = '#d97706';
const MEL = '#a8a29e';
const BROD = '#92400e';

/** Et brød sett fra siden, med snitt på toppen. */
function Brod({ storrelse = 90 }: { storrelse?: number }) {
    return (
        <svg viewBox="0 0 120 70" width={storrelse} height={(storrelse * 70) / 120}>
            <path d="M 8 58 Q 4 18 60 12 Q 116 18 112 58 Z" fill="#c2823e" stroke="#7c4a1e" strokeWidth={4} />
            {[35, 60, 85].map((x) => (
                <path key={x} d={`M ${x - 9} 30 Q ${x} 22 ${x + 9} 30`} fill="none" stroke="#f3d3a1" strokeWidth={5} strokeLinecap="round" />
            ))}
        </svg>
    );
}

function Kort({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
            className={`rounded-3xl bg-white shadow-xl ${className}`}
        >
            {children}
        </motion.div>
    );
}

function Ordet({ beat }: { beat: number }) {
    const ord = [
        { bokstav: 'B', del: 'brutto', farge: '#2563eb' },
        { bokstav: 'N', del: 'nasjonal', farge: '#0d9488' },
        { bokstav: 'P', del: 'produkt', farge: '#ea580c' },
    ];
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-12">
            <motion.div layout className="flex items-end gap-6">
                {ord.map((o, i) => (
                    <motion.div key={o.bokstav} layout className="flex flex-col items-center">
                        <motion.div
                            layout
                            className="font-display font-black leading-none"
                            style={{ color: o.farge, fontSize: beat === 0 ? 170 : 96 }}
                        >
                            {o.bokstav}
                        </motion.div>
                        {beat === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.4 }}
                                className="text-4xl font-bold"
                                style={{ color: o.farge }}
                            >
                                {o.del}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
            <AnimatePresence mode="wait">
                {beat === 1 && (
                    <Kort key="aar" className="px-10 py-6 text-center">
                        <div className="text-4xl font-black text-slate-900">Alt et land lager på ett år</div>
                        <div className="mt-4 flex justify-center gap-6 text-slate-700">
                            {[Bike, Wheat, Scissors, Bus, Factory, ChefHat].map((Ikon, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: -30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.25 }}
                                >
                                    <Ikon size={54} strokeWidth={2} />
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-slate-500">varer og tjenester, regnet i kroner</div>
                    </Kort>
                )}
                {(beat === 2 || beat === 3) && (
                    <motion.div key="to" className="flex gap-8">
                        <Kort className="px-8 py-5">
                            <div className="text-4xl font-black text-blue-700" style={{ width: 360 }}>Varer</div>
                            <div className="text-2xl font-semibold text-slate-500">noe du kan ta på</div>
                            <div className="mt-4 flex items-center gap-8 text-slate-800">
                                <div className="flex flex-col items-center">
                                    <Bike size={72} />
                                    <span className="text-2xl font-bold">sykkel</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Brod />
                                    <span className="text-2xl font-bold">brød</span>
                                </div>
                            </div>
                        </Kort>
                        {beat === 3 && (
                            <Kort className="px-8 py-5">
                                <div className="text-4xl font-black text-orange-600" style={{ width: 360 }}>Tjenester</div>
                                <div className="text-2xl font-semibold text-slate-500">noe noen gjør for deg</div>
                                <div className="mt-4 flex items-center gap-8 text-slate-800">
                                    <div className="flex flex-col items-center">
                                        <Scissors size={72} />
                                        <span className="text-2xl font-bold">hårklipp</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Bus size={72} />
                                        <span className="text-2xl font-bold">busstur</span>
                                    </div>
                                </div>
                            </Kort>
                        )}
                    </motion.div>
                )}
                {beat >= 4 && (
                    <Kort key="ssb" className="px-10 py-6 flex items-center gap-8">
                        <BookOpen size={110} className="text-teal-700" strokeWidth={1.6} />
                        <div>
                            <div className="text-3xl font-black text-slate-900">Statistisk sentralbyrå (SSB)</div>
                            <div className="text-2xl font-semibold text-slate-600 mt-1">regner ut BNP i nasjonalregnskapet:</div>
                            <div className="text-2xl font-bold text-teal-700">et regnskap for hele landet</div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </div>
    );
}

const LEDD = [
    { navn: 'Bonden', ting: 'korn', Ikon: Wheat, farge: KORN },
    { navn: 'Mølla', ting: 'mel', Ikon: Factory, farge: MEL },
    { navn: 'Bakeren', ting: 'brød', Ikon: ChefHat, farge: BROD },
];

/** En stolpe som viser hva prisen på en ting består av: kornet nederst, så mel og brød. */
function Stolpe({ deler, etikett, borte, delay }: { deler: number; etikett: string; borte: boolean; delay: number }) {
    const farger = [KORN, MEL, BROD].slice(0, deler);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6 }}
            className="flex flex-col items-center relative"
            style={{ width: 150 }}
        >
            <div
                className="flex flex-col-reverse"
                style={{ width: 90, height: 3 * 58, opacity: borte ? 0.3 : 1, transition: 'opacity 0.6s' }}
            >
                {farger.map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: 54 }}
                        transition={{ delay: delay + 0.2 + i * 0.25, duration: 0.5 }}
                        className="rounded-md mt-1"
                        style={{ background: f }}
                    />
                ))}
            </div>
            {borte && (
                <div
                    className="absolute h-2 bg-red-600 rounded-full"
                    style={{ left: 16, right: 16, bottom: 40, transform: 'rotate(-20deg)' }}
                />
            )}
            <div className="mt-2 text-2xl font-bold text-slate-800">{etikett}</div>
        </motion.div>
    );
}

function Kjede({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10">
            {beat === 0 ? (
                <Kort className="px-14 py-8 flex flex-col items-center">
                    <Brod storrelse={300} />
                    <div className="mt-4 text-4xl font-black text-slate-900">Tenk på et brød</div>
                </Kort>
            ) : (
                <div className="flex items-center gap-4">
                    {LEDD.map((l, i) => (
                        <div key={l.navn} className="flex items-center gap-4">
                            <Kort delay={beat === 1 ? i * 0.6 : 0} className="px-6 py-4 flex flex-col items-center" >
                                <l.Ikon size={64} style={{ color: l.farge }} />
                                <div className="text-2xl font-black text-slate-900">{l.navn}</div>
                                <div className="text-xl font-semibold text-slate-500">lager {l.ting}</div>
                            </Kort>
                            {i < 2 && <ArrowRight size={44} className="text-slate-600" />}
                        </div>
                    ))}
                    {beat >= 4 && (
                        <>
                            <ArrowRight size={44} className="text-teal-600" />
                            <Kort className="px-6 py-4 flex flex-col items-center border-4 border-teal-500">
                                <User size={64} className="text-teal-600" />
                                <div className="text-2xl font-black text-slate-900">Deg</div>
                                <div className="text-xl font-semibold text-slate-500">kjøper brødet</div>
                            </Kort>
                        </>
                    )}
                </div>
            )}
            {beat >= 2 && (
                <div className="flex items-end gap-6 px-8 py-4 rounded-3xl bg-white/90 shadow-xl">
                    <Stolpe deler={1} etikett="kornet" borte={beat >= 3} delay={0} />
                    <div className="text-5xl font-black text-slate-500 pb-12">+</div>
                    <Stolpe deler={2} etikett="melet" borte={beat >= 3} delay={0.4} />
                    <div className="text-5xl font-black text-slate-500 pb-12">+</div>
                    <Stolpe deler={3} etikett="brødet" borte={false} delay={0.8} />
                    <div className="pl-4 pb-10" style={{ width: 300 }}>
                        <AnimatePresence mode="wait">
                            {beat === 2 && (
                                <motion.div key="tre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.6 }}>
                                    <div className="text-3xl font-black text-red-600">Kornet telt</div>
                                    <div className="text-3xl font-black text-red-600">tre ganger!</div>
                                </motion.div>
                            )}
                            {beat === 3 && (
                                <motion.div key="trekk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="text-3xl font-black text-slate-900">Trekk fra det</div>
                                    <div className="text-2xl font-bold text-slate-600">bedriftene kjøper av hverandre</div>
                                </motion.div>
                            )}
                            {beat >= 4 && (
                                <motion.div key="igjen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="text-3xl font-black text-teal-700">Dette teller:</div>
                                    <div className="text-2xl font-bold text-slate-600">brødet som selges til deg</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

function Brodrad({ etikett, prislapp, uthev }: { etikett: string; prislapp: string; uthev: boolean }) {
    return (
        <div className="flex items-center gap-5">
            <div className="text-3xl font-black text-slate-800" style={{ width: 120 }}>
                {etikett}
            </div>
            <div className={`flex gap-2 px-4 py-2 rounded-2xl ${uthev ? 'bg-teal-100 ring-4 ring-teal-500' : 'bg-white/80'}`}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <Brod key={i} storrelse={84} />
                ))}
            </div>
            <div className="px-4 py-2 rounded-xl bg-white shadow font-black text-2xl text-slate-800" style={{ minWidth: 150 }}>
                {prislapp}
            </div>
        </div>
    );
}

function Soyler({ tittel, under, ny, farge }: { tittel: string; under: string; ny: number; farge: string }) {
    const H = 210;
    return (
        <Kort className="px-8 py-5 flex flex-col items-center" >
            <div className="text-3xl font-black" style={{ color: farge }}>
                {tittel}
            </div>
            <div className="text-xl font-semibold text-slate-500">{under}</div>
            <div className="mt-4 flex items-end gap-10" style={{ height: H * 1.1 + 44 }}>
                {[1, ny].map((f, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <motion.div
                            initial={{ height: H }}
                            animate={{ height: H * f }}
                            transition={{ delay: 0.6, duration: 1.2 }}
                            className="rounded-t-lg"
                            style={{ width: 90, background: farge, opacity: i ? 1 : 0.55 }}
                        />
                        <div className="mt-2 text-2xl font-bold text-slate-700">{i ? 'i år' : 'i fjor'}</div>
                    </div>
                ))}
            </div>
        </Kort>
    );
}

function Priser({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10">
            {beat <= 1 && (
                <motion.div className="flex flex-col gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Brodrad etikett="I fjor" prislapp="vanlig pris" uthev={beat === 1} />
                    <Brodrad etikett="I år" prislapp="pris + 10 %" uthev={beat === 1} />
                    <AnimatePresence>
                        {beat === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="self-center px-6 py-3 rounded-2xl bg-slate-900 text-white text-3xl font-black"
                            >
                                Like mange brød, men flere kroner
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
            {beat >= 2 && (
                <div className="flex gap-8">
                    <Soyler tittel="Nominelt BNP" under="i dagens priser" ny={1.1} farge="#ea580c" />
                    {beat >= 3 && <Soyler tittel="Reelt BNP" under="prisene holdes fast" ny={1} farge="#0d9488" />}
                </div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="px-6 py-3 rounded-2xl bg-white shadow-xl text-3xl font-black text-teal-700"
                >
                    Vi laget ikke mer, prisene steg
                </motion.div>
            )}
        </div>
    );
}

export function BnpBrodet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ordet';
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #fef7ec 0%, #f3e3c7 100%)' }}>
            {modus === 'ordet' && <Ordet beat={beat} />}
            {modus === 'kjede' && <Kjede beat={beat} />}
            {modus === 'priser' && <Priser beat={beat} />}
        </div>
    );
}
