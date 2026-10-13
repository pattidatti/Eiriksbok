import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Building2, Factory, FileText, GraduationCap, HeartPulse, Route, Sprout } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Tavla: tre 2D-bilder uten kart.
 * «rapport»: Perkins sin rapport. Prosjektene, den oppblåste veksten, lånet og boken fra 2004.
 * «renter»: rike land og det globale sør. Rentene blir dobbelt så høye, og budsjettene til helse,
 *   skole og utvikling krymper.
 * «kilder»: hva som er dokumentert, og hva vi bare har Perkins sitt ord for.
 */

type Modus = 'rapport' | 'renter' | 'kilder';

const fjær = { type: 'spring', stiffness: 160, damping: 18 } as const;

export function LeiemordereTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'rapport';
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
            {modus === 'rapport' && <Rapport beat={beat} />}
            {modus === 'renter' && <Renter beat={beat} />}
            {modus === 'kilder' && <Kilder beat={beat} />}
        </div>
    );
}

function Rapport({ beat }: { beat: number }) {
    const prosjekter = [
        { Ikon: Route, tekst: 'Veier' },
        { Ikon: Factory, tekst: 'Kraftverk' },
        { Ikon: Building2, tekst: 'Havner' },
    ];
    return (
        <>
            {/* Perkins sitt navneskilt */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={fjær}
                className="absolute left-[5%] top-[10%] w-[19rem] p-5 rounded-3xl bg-slate-900 text-white shadow-2xl"
            >
                <div className="font-display font-black text-3xl">John Perkins</div>
                <div className="mt-1 text-xl text-slate-300">Sjeføkonom, 1970-tallet</div>
                <div className="mt-3 text-lg text-amber-300">Et stort amerikansk konsulentselskap</div>
            </motion.div>

            {/* Rapporten */}
            <motion.div
                initial={{ opacity: 0, y: 30, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 1 }}
                transition={{ ...fjær, delay: 0.3 }}
                className="absolute left-[34%] top-[8%] w-[38rem] h-[84%] rounded-xl bg-white shadow-2xl p-6"
            >
                <div className="flex items-center gap-3 border-b-4 border-slate-800 pb-2">
                    <FileText className="w-8 h-8 text-slate-700" />
                    <span className="font-display font-black text-3xl tracking-wide text-slate-800">
                        RAPPORT
                    </span>
                    <span className="ml-auto text-lg font-semibold text-slate-500">Hva tjener landet?</span>
                </div>

                <div className="mt-4 flex gap-4">
                    {prosjekter.map(({ Ikon, tekst }, i) => (
                        <motion.div
                            key={tekst}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={beat >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0.15, scale: 0.9 }}
                            transition={{ ...fjær, delay: beat >= 1 ? 0.4 + i * 0.35 : 0 }}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-100"
                        >
                            <Ikon className="w-10 h-10 text-slate-700" />
                            <span className="text-xl font-bold text-slate-800">{tekst}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Søylene: lovet vekst og lånet */}
                <div className="absolute left-6 right-6 bottom-6 h-[52%] border-b-4 border-l-4 border-slate-400 flex items-end justify-around px-6">
                    <Søyle
                        høyde={beat >= 2 ? 150 : beat >= 1 ? 30 : 0}
                        farge="#16a34a"
                        etikett="Lovet vekst"
                    />
                    <Søyle høyde={beat >= 3 ? 115 : 0} farge="#dc2626" etikett="Lånet" />
                    <Søyle høyde={beat >= 3 ? 18 : 0} farge="#64748b" etikett="Kan betale" />
                </div>
                <AnimatePresence>
                    {beat === 2 && (
                        <motion.div
                            key="blast"
                            initial={{ opacity: 0, scale: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: -10 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 15 }}
                            className="absolute right-8 top-[38%] px-4 py-2 border-[6px] border-red-700 rounded-xl text-red-700 font-black text-3xl bg-white/90"
                        >
                            BLÅST OPP
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="bok"
                        initial={{ opacity: 0, x: -60, rotate: -8 }}
                        animate={{ opacity: 1, x: 0, rotate: -4 }}
                        transition={{ ...fjær, delay: 1.6 }}
                        className="absolute left-[7%] bottom-[9%] w-[16rem] h-[15rem] rounded-lg bg-amber-500 shadow-2xl p-4 flex flex-col justify-between"
                    >
                        <BookOpen className="w-9 h-9 text-amber-950" />
                        <div className="font-display font-black text-2xl leading-tight text-amber-950">
                            Confessions of an Economic Hit Man
                        </div>
                        <div className="text-xl font-bold text-amber-950">2004 · bestselger</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/** En søyle som vokser fra null. Høyde i px av rapportens graf. */
function Søyle({ høyde, farge, etikett }: { høyde: number; farge: string; etikett: string }) {
    return (
        <div className="relative flex flex-col items-center w-[8rem]">
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: høyde }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-t-lg"
                style={{ background: farge }}
            />
            <div className="absolute -bottom-[2.6rem] text-lg font-bold text-slate-700 whitespace-nowrap">
                {høyde > 0 ? etikett : ''}
            </div>
        </div>
    );
}

function Renter({ beat }: { beat: number }) {
    const budsjett = [
        { Ikon: HeartPulse, tekst: 'Helse' },
        { Ikon: GraduationCap, tekst: 'Skole' },
        { Ikon: Sprout, tekst: 'Utvikling' },
    ];
    const krymp = beat >= 2;
    return (
        <>
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white shadow-xl font-display font-bold text-4xl text-slate-900 whitespace-nowrap">
                {beat === 0 ? 'Gjeldsfellen finnes fortsatt' : 'Renter: prisen for å låne'}
            </div>

            {/* To land med hver sin rentebunke */}
            <div className="absolute left-[6%] bottom-[12%] w-[46%] h-[62%] flex items-end justify-around">
                {[
                    { navn: 'Rike land', stabler: 1, farge: '#2563eb' },
                    { navn: 'Det globale sør', stabler: 2, farge: '#dc2626' },
                ].map((l) => (
                    <div key={l.navn} className="flex flex-col items-center">
                        <div className="flex flex-col-reverse items-center gap-1 mb-2 h-[19rem] justify-start">
                            {Array.from({ length: l.stabler * 5 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: -30 }}
                                    animate={beat >= 1 ? { opacity: 1, y: 0 } : { opacity: i < 5 ? 0.18 : 0, y: 0 }}
                                    transition={{ delay: beat >= 1 ? 0.4 + i * 0.15 : 0 }}
                                    className="w-[8rem] h-[1.6rem] rounded-full border-4"
                                    style={{ background: '#facc15', borderColor: '#a16207' }}
                                />
                            ))}
                        </div>
                        <div
                            className="px-4 py-2 rounded-xl text-2xl font-black text-white whitespace-nowrap"
                            style={{ background: l.farge }}
                        >
                            {l.navn}
                        </div>
                    </div>
                ))}
                <AnimatePresence>
                    {beat >= 1 && (
                        <motion.div
                            key="dobbelt"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.2 }}
                            className="absolute right-[2%] top-[0%] px-4 py-2 rounded-xl bg-red-700 text-white text-2xl font-black"
                        >
                            omtrent dobbelt så mye
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Budsjettet i det globale sør */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={beat >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
                transition={fjær}
                className="absolute right-[5%] top-[22%] w-[40%] p-5 rounded-3xl bg-white shadow-2xl"
            >
                <div className="text-2xl font-black text-slate-900 mb-3">Igjen i budsjettet</div>
                {budsjett.map(({ Ikon, tekst }, i) => (
                    <div key={tekst} className="flex items-center gap-3 mb-3">
                        <Ikon className="w-8 h-8 text-teal-700 shrink-0" />
                        <span className="w-[7.5rem] text-xl font-bold text-slate-800">{tekst}</span>
                        <div className="flex-1 h-7 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                initial={{ width: '90%' }}
                                animate={{ width: krymp ? `${34 - i * 6}%` : '90%' }}
                                transition={{ duration: 1.4, delay: 0.8 + i * 0.3 }}
                                className="h-full rounded-full bg-teal-600"
                            />
                        </div>
                    </div>
                ))}
            </motion.div>

            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="kina"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...fjær, delay: 0.3 }}
                        className="absolute right-[5%] bottom-[8%] w-[40%] p-5 rounded-3xl bg-slate-900 text-white shadow-2xl"
                    >
                        <div className="text-2xl font-bold text-amber-300">
                            Også Kina: lån til Afrika og Asia
                        </div>
                        <div className="mt-2 font-display font-black text-3xl">
                            Den som eier gjelden, har makten
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Kilder({ beat }: { beat: number }) {
    const venstre = ['Iran 1953', 'Chile 1973', 'Historikere', 'Hemmelige papirer, nå offentlige'];
    const høyre = ['Hans egen fortelling', 'Flere av historiene', 'Overdriver han?'];
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={fjær}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-amber-500 shadow-xl"
            >
                <BookOpen className="w-10 h-10 text-amber-950" />
                <span className="font-display font-black text-4xl text-amber-950 whitespace-nowrap">
                    Kan vi tro på Perkins?
                </span>
            </motion.div>

            <Kolonne
                tittel="Godt dokumentert"
                farge="#15803d"
                punkter={venstre}
                vis={beat >= 1}
                side="left-[5%]"
            />
            <Kolonne
                tittel="Bare hans ord"
                farge="#b45309"
                punkter={beat >= 3 ? høyre : høyre.slice(0, 2)}
                vis={beat >= 2}
                side="right-[5%]"
            />

            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="sammenlign"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...fjær, delay: 1.4 }}
                        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl whitespace-nowrap"
                    >
                        <div className="flex -space-x-3">
                            {[0, 1, 2].map((i) => (
                                <FileText key={i} className="w-9 h-9 text-amber-300" />
                            ))}
                        </div>
                        <span className="font-display font-black text-3xl">Sammenlign flere kilder</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Kolonne({
    tittel,
    farge,
    punkter,
    vis,
    side,
}: {
    tittel: string;
    farge: string;
    punkter: string[];
    vis: boolean;
    side: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0.25 }}
            animate={{ opacity: vis ? 1 : 0.25 }}
            transition={{ duration: 0.6 }}
            className={`absolute ${side} top-[22%] w-[42%] h-[52%] rounded-3xl bg-white shadow-2xl p-5`}
        >
            <div
                className="px-4 py-2 rounded-xl text-3xl font-black text-white inline-block"
                style={{ background: farge }}
            >
                {tittel}
            </div>
            <div className="mt-4 space-y-3">
                {vis &&
                    punkter.map((p, i) => (
                        <motion.div
                            key={p}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.4 }}
                            className="flex items-center gap-3 text-2xl font-bold text-slate-800"
                        >
                            <span className="w-4 h-4 rounded-full shrink-0" style={{ background: farge }} />
                            {p}
                        </motion.div>
                    ))}
            </div>
        </motion.div>
    );
}
