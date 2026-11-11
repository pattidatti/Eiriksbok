import { AnimatePresence, motion } from 'framer-motion';
import {
    Coins,
    Gavel,
    Handshake,
    Percent,
    RefreshCw,
    Scale,
    Store,
    Undo2,
    Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Hva du kan kreve, og hvor du går når butikken sier nei. To moduser:
 * - krav: først reparasjon eller ny vare (gratis), så prisavslag, heving og erstatning.
 * - klage: trappa fra butikken til Forbrukertilsynet, Forbrukerklageutvalget og tingretten.
 */

type Modus = 'krav' | 'klage';

const OVERSKRIFT: Record<Modus, string[]> = {
    krav: [
        'Først: reparasjon eller ny vare',
        'Gratis, og innen rimelig tid',
        'Prisavslag',
        'Heving',
        'Erstatning',
        'Mias krav',
    ],
    klage: [
        'Butikken sier nei',
        'Mekling',
        'Forbrukerklageutvalget',
        'Svaret er bindende',
        'Uten advokat',
    ],
};

function Kravkort({
    ikon,
    tittel,
    tekst,
    vist,
    dempet = false,
    merke,
}: {
    ikon: ReactNode;
    tittel: string;
    tekst: string;
    vist: boolean;
    dempet?: boolean;
    merke?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: vist ? (dempet ? 0.55 : 1) : 0, x: vist ? 0 : 20 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4 rounded-2xl bg-white shadow-lg border-2 border-slate-200 px-4 py-3"
            style={{ minHeight: 86 }}
        >
            <span className="text-teal-700 shrink-0">{ikon}</span>
            <div className="flex-1">
                <div className="text-2xl font-black text-slate-900">{tittel}</div>
                <div className="text-xl font-semibold text-slate-700">{tekst}</div>
            </div>
            {merke && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-teal-600 text-white text-lg font-black px-3 py-1 shrink-0"
                >
                    {merke}
                </motion.span>
            )}
        </motion.div>
    );
}

function Krav({ beat }: { beat: number }) {
    const mia = beat >= 5;
    return (
        <div className="absolute flex gap-8" style={{ left: 40, top: 100, width: 920 }}>
            <div className="flex flex-col gap-3" style={{ width: 440 }}>
                <div className="text-xl font-black uppercase tracking-wide text-teal-700">
                    Først
                </div>
                <motion.div
                    className="flex flex-col gap-3 rounded-3xl p-2"
                    animate={{ backgroundColor: mia ? '#ccfbf1' : 'rgba(0,0,0,0)' }}
                >
                    <Kravkort
                        ikon={<Wrench size={44} />}
                        tittel="Reparasjon (retting)"
                        tekst="butikken reparerer varen"
                        vist
                        merke={beat >= 1 ? 'Gratis' : undefined}
                    />
                    <Kravkort
                        ikon={<RefreshCw size={44} />}
                        tittel="Ny vare (omlevering)"
                        tekst="du får en ny vare"
                        vist
                        merke={beat >= 1 ? 'Gratis' : undefined}
                    />
                </motion.div>
                {mia && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-teal-700 text-white text-2xl font-black px-4 py-3 text-center"
                    >
                        Mia: reparert eller ny mobil
                    </motion.div>
                )}
            </div>
            <div className="flex flex-col gap-3" style={{ width: 440 }}>
                <motion.div
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                    className="text-xl font-black uppercase tracking-wide text-amber-700"
                >
                    Hjelper ikke det?
                </motion.div>
                <div className="flex flex-col gap-3 p-2">
                    <Kravkort
                        ikon={<Percent size={44} />}
                        tittel="Prisavslag"
                        tekst="behold varen, få en del av prisen tilbake"
                        vist={beat >= 2}
                        dempet={mia}
                    />
                    <Kravkort
                        ikon={<Undo2 size={44} />}
                        tittel="Heving"
                        tekst={
                            beat >= 3
                                ? 'alle pengene tilbake, ikke ved helt liten feil'
                                : 'alle pengene tilbake'
                        }
                        vist={beat >= 3}
                        dempet={mia}
                    />
                    <Kravkort
                        ikon={<Coins size={44} />}
                        tittel="Erstatning"
                        tekst="butikken dekker tapet ditt"
                        vist={beat >= 4}
                        dempet={mia}
                    />
                </div>
            </div>
        </div>
    );
}

const TRINN = [
    { ikon: <Store size={40} />, navn: 'Butikken', tekst: 'Klag skriftlig' },
    {
        ikon: <Handshake size={40} />,
        navn: 'Forbruker­tilsynet',
        tekst: 'Mekling. Du betaler et gebyr',
    },
    {
        ikon: <Scale size={40} />,
        navn: 'Forbruker­klage­utvalget',
        tekst: 'Bestemmer hvem som har rett',
    },
    {
        ikon: <Gavel size={40} />,
        navn: 'Tingretten',
        tekst: 'Om noen går dit innen en måned, gjelder ikke svaret',
    },
];

function Klage({ beat }: { beat: number }) {
    const synlige = beat >= 3 ? 4 : beat >= 2 ? 3 : 2;
    return (
        <div className="absolute" style={{ left: 30, top: 0, width: 940, height: 562 }}>
            {TRINN.map((t, i) => {
                const hoyde = 190 + i * 75;
                const aktiv = i < synlige;
                return (
                    <motion.div
                        key={t.navn}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: aktiv ? 1 : 0, y: aktiv ? 0 : 30 }}
                        transition={{ duration: 0.45 }}
                        className="absolute rounded-t-2xl border-2 px-3 pt-3"
                        style={{
                            left: i * 235,
                            width: 222,
                            bottom: 12,
                            height: hoyde,
                            background: '#ffffff',
                            borderColor: i === 0 ? '#dc2626' : '#0d9488',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-slate-400">{i + 1}</span>
                            <span className="text-teal-700">{t.ikon}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 leading-tight mt-1 break-words">
                            {t.navn}
                        </div>
                        {(i !== 1 || beat >= 1) && (
                            <div className="text-xl font-semibold text-slate-700 mt-1 leading-snug">
                                {t.tekst}
                            </div>
                        )}
                        {i === 0 && (
                            <div className="mt-2 inline-block rounded-lg bg-red-600 text-white text-xl font-black px-3 py-1">
                                Sier nei
                            </div>
                        )}
                        {i === 2 && beat >= 3 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-2 inline-block rounded-lg bg-teal-700 text-white text-xl font-black px-3 py-1"
                            >
                                Bindende
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute rounded-2xl bg-white shadow-xl border-2 border-teal-500 px-4 py-2 text-xl font-bold text-slate-800"
                    style={{ left: 250, top: 140, width: 300 }}
                >
                    En nøytral mekler hjelper deg og butikken å bli enige
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute rounded-2xl bg-teal-700 text-white shadow-xl px-5 py-3 text-2xl font-black"
                    style={{ left: 20, top: 120, width: 420 }}
                >
                    Hjelp uten å betale for advokat
                </motion.div>
            )}
        </div>
    );
}

export function ForbrukerKrav({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'krav';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate bakgrunn="#f8fafc">
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 28 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tittel}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-4xl font-black text-slate-900 font-display"
                    >
                        {tittel}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'krav' ? <Krav beat={beat} /> : <Klage beat={beat} />}
        </Flate>
    );
}
