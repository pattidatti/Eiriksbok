import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Heart, Lock, UserX } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Verdens medfølelse med USA som et felt av hjerter. Beat 0: alle lyser rødt. Beat 1-3: ett
 * kort per hendelse (Abu Ghraib, Guantanamo, uskyldige fanger), og for hvert kort blir flere
 * hjerter grå. Beat 4: det meste er grått. Hjertene er et bilde, ikke en måling, så det står
 * ingen tall.
 */

const RADER = 6;
const KOLONNER = 10;
const ANTALL = RADER * KOLONNER;

/** Hvor mange hjerter som er grå på hver beat. */
const GRA = [0, 16, 30, 38, 44];

/** Rekkefølgen hjertene blir grå i, så det sprer seg i feltet og ikke går rad for rad. */
const REKKEFOLGE = Array.from({ length: ANTALL }, (_, i) => i).sort(
    (a, b) => ((a * 37) % ANTALL) - ((b * 37) % ANTALL)
);
const GRA_FRA = new Map(REKKEFOLGE.map((indeks, plass) => [indeks, plass]));

const KORT = [
    {
        fraBeat: 1,
        ikon: Camera,
        tittel: 'Abu Ghraib, Irak',
        tekst: 'Fanger mishandlet og ydmyket. Bildene går verden rundt.',
    },
    {
        fraBeat: 2,
        ikon: Lock,
        tittel: 'Guantanamo, Cuba',
        tekst: 'Fanget i årevis uten rettssak.',
    },
    {
        fraBeat: 3,
        ikon: UserX,
        tittel: 'Uskyldige bak gitter',
        tekst: 'Mange hadde aldri gjort noe galt.',
    },
];

const OVERSKRIFT = [
    'Verden føler med USA',
    'Medfølelsen begynner å slokne',
    'Medfølelsen begynner å slokne',
    'Medfølelsen begynner å slokne',
    'Mye av medfølelsen er borte',
];

export function TerrorMedfolelse({ beat }: VisualProps) {
    const gra = GRA[Math.min(beat, GRA.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-rose-50 flex flex-col px-[5%] pt-[3%] pb-[3%]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`self-center px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl ${
                        beat >= 4 ? 'bg-red-700 text-white' : 'bg-white text-slate-900'
                    }`}
                >
                    {OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]}
                </motion.div>
            </AnimatePresence>

            <div className="flex-1 flex items-center gap-[4%] mt-4">
                <div className="flex flex-col items-center" style={{ width: '48%' }}>
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${KOLONNER}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: ANTALL }, (_, i) => {
                            const grått = (GRA_FRA.get(i) ?? 0) < gra;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.3 }}
                                    animate={{
                                        opacity: grått ? 0.55 : 1,
                                        scale: grått ? 0.82 : 1,
                                    }}
                                    transition={{
                                        delay:
                                            beat === 0
                                                ? i * 0.012
                                                : ((GRA_FRA.get(i) ?? 0) % 16) * 0.05,
                                        duration: 0.5,
                                    }}
                                >
                                    <Heart
                                        size={34}
                                        strokeWidth={1.5}
                                        color={grått ? '#94a3b8' : '#b91c1c'}
                                        fill={grått ? '#cbd5e1' : '#dc2626'}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="mt-4 text-xl font-bold text-slate-600">
                        Verdens medfølelse med USA
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    {beat === 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="rounded-2xl bg-white shadow-lg px-6 py-5 text-2xl font-bold text-slate-900 leading-snug"
                        >
                            USA er blitt angrepet. Hele verden føler med landet.
                        </motion.div>
                    )}
                    {KORT.map((k) => {
                        if (beat < k.fraBeat) return null;
                        const naa = beat === k.fraBeat;
                        const Ikon = k.ikon;
                        return (
                            <motion.div
                                key={k.tittel}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: naa || beat >= 4 ? 1 : 0.6, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className={`rounded-2xl bg-white shadow-lg px-5 py-3 flex items-center gap-4 ${
                                    naa ? 'ring-4 ring-red-700/70' : ''
                                }`}
                            >
                                <span className="w-14 h-14 shrink-0 rounded-full bg-red-700 text-white flex items-center justify-center">
                                    <Ikon size={30} />
                                </span>
                                <span className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 leading-tight">
                                        {k.tittel}
                                    </span>
                                    <span className="text-xl font-semibold text-slate-600 leading-snug">
                                        {k.tekst}
                                    </span>
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
