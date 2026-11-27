import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { EtikkFigur } from './EtikkFigur';

/**
 * De to formene av den gylne regel, i fire modus:
 * - beinet: mannen på ett bein foran rabbi Hillel, og svaret hans.
 * - snudd: Hillels «ikke gjør» og Jesu «gjør» side om side.
 * - former: å sitte stille (ikke gjør) mot å gi noe til en annen (gjør).
 * - fem: buddhismens fem leveregler, hensikten bak handlingen og Dhammapada.
 */

type Modus = 'beinet' | 'snudd' | 'former' | 'fem';

const OVERSKRIFT: Record<Modus, string[]> = {
    beinet: ['Talmud forteller', 'Hele Toraen på ett bein?', 'Hillels svar', 'Resten er forklaring'],
    snudd: ['Samme setning, snudd', 'Jesus i Matteus 7,12', 'To former'],
    former: [
        'Hva krever regelen av deg?',
        'Ikke gjør: sitt stille',
        'Gjør: først oppfylt når du handler',
        'Hvilken er best?',
        'Hva skiller dem?',
    ],
    fem: ['Buddhismen: fem leveregler', 'Buddhismen: det du mente, teller', 'Dhammapada'],
};

const FARGE: Record<Modus, string> = {
    beinet: '#2563eb',
    snudd: '#7c3aed',
    former: '#7c3aed',
    fem: '#d97706',
};

const IKKE = '#dc2626';
const GJOR = '#059669';

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}

function Kryss({ storrelse = 40 }: { storrelse?: number }) {
    return (
        <span
            className="flex items-center justify-center rounded-full text-white font-black shrink-0"
            style={{ width: storrelse, height: storrelse, fontSize: storrelse * 0.62, background: IKKE }}
        >
            ✕
        </span>
    );
}

function Hake({ storrelse = 44 }: { storrelse?: number }) {
    return (
        <span
            className="flex items-center justify-center rounded-full text-white font-black shrink-0"
            style={{ width: storrelse, height: storrelse, fontSize: storrelse * 0.62, background: GJOR }}
        >
            ✓
        </span>
    );
}

/** Mannen på ett bein og Hillel. */
function Beinet({ beat }: { beat: number }) {
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                <rect x={0} y={470} width={1000} height={92} fill="#e7d9bf" />
                <EtikkFigur x={170} y={480} farge="#b45309" positur="ettbein" />
                <EtikkFigur x={830} y={480} farge="#1e3a8a" skjegg hue="#1e293b" />
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <rect x={360} y={150} width={280} height={250} rx={18} fill="#fef3c7" stroke="#a16207" strokeWidth={4} />
                        <rect x={340} y={135} width={320} height={34} rx={17} fill="#a16207" />
                        <rect x={340} y={385} width={320} height={34} rx={17} fill="#a16207" />
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <rect key={i} x={392} y={200 + i * 28} width={216 - (i % 2) * 40} height={8} rx={4} fill="#d6b77a" />
                        ))}
                    </motion.g>
                )}
            </svg>
            <div className="absolute text-2xl font-black text-amber-900 text-center" style={{ left: 90, width: 160, top: 488 }}>
                en mann
            </div>
            <div className="absolute text-2xl font-black text-blue-900 text-center" style={{ left: 740, width: 180, top: 488 }}>
                rabbi Hillel
            </div>
            <AnimatePresence mode="wait">
                {beat === 1 && (
                    <motion.div
                        key="tora"
                        className="absolute text-4xl font-black text-amber-900 text-center"
                        style={{ left: 360, width: 280, top: 250 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Toraen
                        <div className="text-xl font-bold text-amber-800">jødenes hellige lov</div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        key="svar"
                        className="absolute rounded-3xl bg-white shadow-2xl px-7 py-5"
                        style={{ left: 300, width: 420, top: 120, borderTop: `8px solid ${FARGE.beinet}` }}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-xl font-bold text-slate-500">Hillel:</div>
                        <div className="leading-snug font-black text-slate-900 mt-1" style={{ fontSize: 28 }}>
                            Det du ikke vil at andre skal gjøre mot deg, skal du heller ikke gjøre
                            mot andre.
                        </div>
                        {beat >= 3 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-2xl font-black mt-3"
                                style={{ color: '#a16207' }}
                            >
                                Resten er forklaring. Gå og lær.
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Sitatkort({
    hvem,
    kilde,
    tekst,
    form,
    farge,
    visTekst,
    visForm,
}: {
    hvem: string;
    kilde: string;
    tekst: string;
    form: string;
    farge: string;
    visTekst: boolean;
    visForm: boolean;
}) {
    return (
        <div className="rounded-3xl bg-white shadow-2xl px-7 py-5 flex flex-col" style={{ width: 420, height: 380, borderTop: `10px solid ${farge}` }}>
            <div className="text-3xl font-black text-slate-900">{hvem}</div>
            <div className="text-xl font-bold text-slate-500">{kilde}</div>
            <div className="leading-snug font-bold text-slate-800 mt-4 flex-1" style={{ fontSize: 27 }}>
                {visTekst ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        {tekst}
                    </motion.span>
                ) : (
                    <span className="text-6xl font-black" style={{ color: farge }}>
                        ↻
                    </span>
                )}
            </div>
            {visForm && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="self-start rounded-2xl px-5 py-2 text-3xl font-black text-white"
                    style={{ background: farge }}
                >
                    {form}
                </motion.div>
            )}
        </div>
    );
}

function Snudd({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-x-0 flex justify-center gap-10" style={{ top: 120 }}>
            <Sitatkort
                hvem="Hillel"
                kilde="Talmud"
                tekst="Det du ikke vil at andre skal gjøre mot deg, skal du heller ikke gjøre mot andre."
                form="IKKE GJØR"
                farge={IKKE}
                visTekst
                visForm={beat >= 2}
            />
            <Sitatkort
                hvem="Jesus"
                kilde="Matteusevangeliet 7,12"
                tekst="Alt dere vil at andre skal gjøre mot dere, skal dere gjøre mot dem."
                form="GJØR"
                farge={GJOR}
                visTekst={beat >= 1}
                visForm={beat >= 2}
            />
        </div>
    );
}

/** To paneler: å sitte stille mot å gi noe. */
function Former({ beat }: { beat: number }) {
    const pakkeX = beat >= 2 ? 390 : 255;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {[0, 1].map((side) => (
                    <rect
                        key={side}
                        x={side === 0 ? 40 : 520}
                        y={110}
                        width={440}
                        height={330}
                        rx={24}
                        fill="#fff"
                        opacity={beat === 1 && side === 1 ? 0.45 : beat === 2 && side === 0 ? 0.45 : 0.92}
                        style={{ transition: 'opacity 0.5s' }}
                    />
                ))}
            </svg>
            {[0, 1].map((side) => (
                <div
                    key={side}
                    className="absolute text-center text-3xl font-black"
                    style={{
                        left: side === 0 ? 40 : 520,
                        width: 440,
                        top: 122,
                        color: side === 0 ? IKKE : GJOR,
                        opacity: beat === 1 && side === 1 ? 0.45 : beat === 2 && side === 0 ? 0.45 : 1,
                        transition: 'opacity 0.5s',
                    }}
                >
                    {side === 0 ? 'IKKE GJØR' : 'GJØR'}
                </div>
            ))}
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full pointer-events-none">
                <g opacity={beat === 2 ? 0.45 : 1} style={{ transition: 'opacity 0.5s' }}>
                    <EtikkFigur x={300} y={410} farge="#64748b" positur="sitter" />
                </g>
                <g opacity={beat === 1 ? 0.45 : 1} style={{ transition: 'opacity 0.5s' }}>
                    <EtikkFigur x={620} y={410} farge="#0f766e" positur="gir" />
                    <EtikkFigur x={860} y={410} farge="#64748b" positur="tar" />
                    <motion.g initial={false} animate={{ x: 400 + pakkeX }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
                        <rect x={-26} y={262} width={52} height={44} rx={6} fill="#f59e0b" />
                        <rect x={-4} y={262} width={8} height={44} fill="#b91c1c" />
                    </motion.g>
                </g>
            </svg>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.div
                        key="h1"
                        className="absolute flex items-center gap-2 rounded-2xl bg-white shadow-lg px-3 py-2"
                        style={{ left: 60, top: 170, opacity: 1 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 0.45 : 1 }}
                    >
                        <Hake />
                        <span className="text-2xl font-black text-slate-800">fulgt</span>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        key="h2"
                        className="absolute flex items-center gap-2 rounded-2xl bg-white shadow-lg px-3 py-2"
                        style={{ left: 540, top: 170 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <Hake />
                        <span className="text-2xl font-black text-slate-800">oppfylt</span>
                    </motion.div>
                )}
            </AnimatePresence>
            {beat === 3 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ top: 448 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-3xl bg-slate-900 text-white px-7 py-4 text-center shadow-2xl"
                    >
                        <div className="text-3xl font-black">? De lærde er uenige</div>
                    </motion.div>
                </div>
            )}
            {beat >= 4 && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute rounded-2xl text-white text-2xl font-black text-center px-4 py-3"
                        style={{ left: 40, width: 440, top: 456, background: IKKE }}
                    >
                        tvinger ikke dine ønsker på andre
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute rounded-2xl text-white text-2xl font-black text-center px-4 py-3"
                        style={{ left: 520, width: 440, top: 456, background: GJOR }}
                    >
                        ber om mer av deg
                    </motion.div>
                </>
            )}
        </>
    );
}

const FEM = ['drap', 'tyveri', 'løgn', 'rus', 'seksuell utnytting'];

function Fem({ beat }: { beat: number }) {
    const smal = beat >= 1;
    return (
        <>
            <motion.div
                className="absolute rounded-3xl bg-white shadow-2xl px-7 py-5"
                initial={false}
                animate={{ left: smal ? 40 : 290, width: smal ? 400 : 420 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                style={{ top: 105, borderTop: `10px solid ${FARGE.fem}` }}
            >
                <div className="text-2xl font-bold text-slate-500">Hold deg unna</div>
                {FEM.map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: beat === 0 ? 0.3 + i * 0.5 : 0 }}
                        className="flex items-center gap-4 mt-3"
                    >
                        <Kryss />
                        <span className="text-3xl font-black text-slate-900">{t}</span>
                    </motion.div>
                ))}
            </motion.div>
            <AnimatePresence mode="wait">
                {beat === 1 && (
                    <motion.div
                        key="mente"
                        className="absolute rounded-3xl bg-white shadow-2xl px-7 py-6"
                        style={{ left: 480, width: 480, top: 105 }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="text-2xl font-bold text-slate-500">Du skader noen</div>
                        <div className="text-3xl font-black text-slate-900">helt uten å ville det</div>
                        <div className="text-5xl font-black text-slate-400 my-3 text-center">↓</div>
                        <div className="flex items-center gap-3">
                            <Hake />
                            <span className="text-3xl font-black" style={{ color: GJOR }}>
                                ingen dårlig karma
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-slate-600 mt-4">
                            Det du mente med handlingen, teller.
                        </div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        key="dhp"
                        className="absolute rounded-3xl shadow-2xl px-7 py-6"
                        style={{ left: 480, width: 480, top: 105, background: '#fffbeb', borderLeft: `10px solid ${FARGE.fem}` }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-2xl font-bold text-amber-800">Dhammapada, vers 129:</div>
                        <div className="leading-snug font-black text-slate-900 mt-2" style={{ fontSize: 28 }}>
                            Alle skjelver for vold, alle frykter døden. Sett deg selv i den andres
                            sted.
                        </div>
                        <div className="inline-block mt-4 rounded-xl bg-amber-100 px-3 py-1 text-2xl font-bold text-amber-900">
                            ingen gud nevnt
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export function EtikkToFormer({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'beinet';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate bakgrunn={modus === 'beinet' ? '#f3ead9' : '#eef2f7'}>
            {modus === 'beinet' && <Beinet beat={beat} />}
            {modus === 'snudd' && <Snudd beat={beat} />}
            {modus === 'former' && <Former beat={beat} />}
            {modus === 'fem' && <Fem beat={beat} />}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tekst}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 22 }}
                >
                    <Inn>
                        <div
                            className="px-6 py-2 rounded-2xl bg-white/95 shadow-xl text-4xl font-display font-black text-slate-900"
                            style={{ borderLeft: `10px solid ${FARGE[modus]}` }}
                        >
                            {tekst}
                        </div>
                    </Inn>
                </motion.div>
            </AnimatePresence>
        </Flate>
    );
}
