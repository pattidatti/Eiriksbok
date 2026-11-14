import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Fagsamtalen etter presentasjonen: faglærerens spørsmål som snakkebobler, et svakt og et
 * godt svar, og til slutt baklomme-tekstene eleven har klare.
 */

type Modus = 'naturalisme' | 'askeladden';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function Avatar({ navn, farge }: { navn: string; farge: string }) {
    return (
        <div className="flex flex-col items-center" style={{ width: 96 }}>
            <div
                className="rounded-full flex items-center justify-center text-white text-2xl font-black"
                style={{ width: 64, height: 64, background: farge, ...FONT }}
            >
                {navn[0]}
            </div>
            <div className="text-base font-bold text-slate-600 mt-1">{navn}</div>
        </div>
    );
}

function Boble({
    y,
    hvem,
    tone,
    merke,
    dempet,
    children,
}: {
    y: number;
    hvem: 'laerer' | 'elev';
    tone: 'sporsmal' | 'svak' | 'god';
    merke?: string;
    dempet?: boolean;
    children: ReactNode;
}) {
    const bg = { sporsmal: '#ffffff', svak: '#fee2e2', god: '#ccfbf1' }[tone];
    const lærer = hvem === 'laerer';
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: dempet ? 0.5 : 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute flex items-start gap-3"
            style={{
                top: y,
                left: lærer ? 30 : 150,
                width: 820,
                flexDirection: lærer ? 'row' : 'row-reverse',
            }}
        >
            <Avatar navn={lærer ? 'Faglærer' : 'Eleven'} farge={lærer ? '#334155' : '#7c3aed'} />
            <div className="rounded-2xl shadow-lg px-5 py-3 flex-1" style={{ background: bg }}>
                {merke && (
                    <div
                        className="flex items-center gap-2 text-base font-black uppercase tracking-wider"
                        style={{ color: tone === 'god' ? '#0f766e' : '#b91c1c' }}
                    >
                        <span
                            className="rounded-full text-white p-0.5"
                            style={{ background: tone === 'god' ? '#0d9488' : '#dc2626' }}
                        >
                            {tone === 'god' ? (
                                <Check size={18} strokeWidth={3} />
                            ) : (
                                <X size={18} strokeWidth={3} />
                            )}
                        </span>
                        {merke}
                    </div>
                )}
                <div className="text-xl font-semibold text-slate-900 leading-snug mt-0.5">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}

function Naturalisme({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center gap-24"
                >
                    <div style={{ transform: 'scale(1.8)' }}>
                        <Avatar navn="Faglærer" farge="#334155" />
                    </div>
                    <div className="text-4xl font-black text-slate-400" style={FONT}>
                        ?
                    </div>
                    <div style={{ transform: 'scale(1.8)' }}>
                        <Avatar navn="Eleven" farge="#7c3aed" />
                    </div>
                </motion.div>
            )}
            {beat >= 1 && (
                <Boble y={40} hvem="laerer" tone="sporsmal">
                    Du sa at naturalismen tror arv og miljø avgjør alt. Ser du den tanken i en
                    moderne tekst?
                </Boble>
            )}
            {beat >= 2 && (
                <Boble y={160} hvem="elev" tone="svak" merke="Svakt svar" dempet={beat >= 3}>
                    «Eh, ja, kanskje. Folk har det jo vanskelig i dag også.»
                </Boble>
            )}
            {beat >= 3 && (
                <Boble y={268} hvem="elev" tone="god" merke="Godt svar">
                    I Aldri godt nok fra 2024 skriver jenta at noen ganger handler det bare om arv
                    og hvordan du er født.
                </Boble>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute flex items-center justify-center gap-4"
                    style={{ top: 420, left: 30, width: 940 }}
                >
                    <div
                        className="rounded-2xl bg-slate-700 text-white shadow-xl px-5 py-3"
                        style={{ width: 380 }}
                    >
                        <div className="text-base font-bold uppercase tracking-wider text-slate-300">
                            Skram, 1885
                        </div>
                        <div className="text-xl font-black leading-tight" style={FONT}>
                            Tvangen ligger i samfunnet
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-500">→</div>
                    <div
                        className="rounded-2xl bg-sky-700 text-white shadow-xl px-5 py-3"
                        style={{ width: 380 }}
                    >
                        <div className="text-base font-bold uppercase tracking-wider text-sky-200">
                            Aldri godt nok, 2024
                        </div>
                        <div className="text-xl font-black leading-tight" style={FONT}>
                            Tvangen ligger i selvbildet
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}

const BAKLOMME = [
    { tittel: 'Piken med svovelstikkene', tekst: 'et fattig barn som fryser i hjel i en høytid' },
    { tittel: 'Aldri godt nok', tekst: 'temaet lever i 2024, i selvbildet' },
    { tittel: 'Jeg ser', tekst: 'Obstfelders dikt om å føle seg fremmed' },
];

function Askeladden({ beat }: { beat: number }) {
    const baklomme = beat >= 4;
    return (
        <>
            <AnimatePresence>
                {!baklomme && (
                    <motion.div key="samtale" exit={{ opacity: 0 }} className="absolute inset-0">
                        <Boble y={40} hvem="laerer" tone="sporsmal">
                            Askeladden jukser jo. Fortjener han egentlig framgangen sin?
                        </Boble>
                        {beat >= 1 && (
                            <Boble
                                y={150}
                                hvem="elev"
                                tone="svak"
                                merke="Svakt svar"
                                dempet={beat >= 2}
                            >
                                «Nei, han jukser, så han fortjener det ikke.»
                            </Boble>
                        )}
                        {beat >= 2 && (
                            <Boble y={258} hvem="elev" tone="god" merke="Godt svar">
                                Etter våre regler jukser han. Men i eventyrets logikk er list en
                                dyd, ikke fusk.
                            </Boble>
                        )}
                        {beat >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute flex items-center justify-center gap-4"
                                style={{ top: 390, left: 30, width: 940 }}
                            >
                                <div
                                    className="rounded-2xl bg-slate-800 text-white shadow-xl px-5 py-3"
                                    style={{ width: 400 }}
                                >
                                    <div className="text-base font-bold uppercase tracking-wider text-slate-300">
                                        Trollet
                                    </div>
                                    <div className="text-xl font-black leading-tight" style={FONT}>
                                        et symbol på de mektige
                                    </div>
                                </div>
                                <div
                                    className="rounded-2xl bg-amber-300 text-slate-900 shadow-xl px-5 py-3"
                                    style={{ width: 400 }}
                                >
                                    <div className="text-base font-bold uppercase tracking-wider text-amber-900">
                                        Kløkt
                                    </div>
                                    <div className="text-xl font-black leading-tight" style={FONT}>
                                        det folkediktningen verdsatte
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            {baklomme && (
                <motion.div
                    key="baklomme"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
                        <div className="text-3xl font-black text-slate-900" style={FONT}>
                            Baklomme-tekster: klare hvis du trenger dem
                        </div>
                    </div>
                    {/* Lomma: kortene stikker opp av den */}
                    <div
                        className="absolute shadow-2xl"
                        style={{
                            left: 120,
                            top: 390,
                            width: 760,
                            height: 140,
                            background: '#1e3a5f',
                            zIndex: 2,
                            borderRadius: '0 0 48px 48px',
                        }}
                    />
                    {BAKLOMME.map((b, i) => (
                        <motion.div
                            key={b.tittel}
                            initial={{ y: 120, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                delay: 0.6 + i * 0.5,
                                type: 'spring',
                                stiffness: 80,
                                damping: 14,
                            }}
                            className="absolute rounded-2xl bg-white shadow-xl px-4 py-3"
                            style={{
                                left: 150 + i * 240,
                                top: 225,
                                width: 220,
                                height: 210,
                                zIndex: 1,
                            }}
                        >
                            <div
                                className="text-xl font-black leading-tight text-slate-900"
                                style={FONT}
                            >
                                {b.tittel}
                            </div>
                            <div className="text-lg font-semibold text-slate-700 mt-2 leading-snug">
                                {b.tekst}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </>
    );
}

export function MuntligSamtale({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'naturalisme';
    return (
        <Flate bakgrunn="#eef2f6">
            {modus === 'naturalisme' && <Naturalisme beat={beat} />}
            {modus === 'askeladden' && <Askeladden beat={beat} />}
        </Flate>
    );
}
