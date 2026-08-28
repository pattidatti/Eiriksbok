import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, RotateCcw } from 'lucide-react';

// Signaturkomponent til artikkelen "Livegenskapet i Russland".
//
// Lyspære-øyeblikket: eleven skal forstå at friheten fra 1861 var ekte på
// papiret, men at bonden måtte kjøpe tilbake jorda han allerede dyrket og
// betale i 49 år. Eleven snur hvert løfte fra loven og ser hva som faktisk
// skjedde, og får så regningen tegnet opp som en strek gjennom 49 år.

interface Loftekort {
    lofte: string;
    virkelighet: string;
}

interface FrihetensRegningProps {
    title?: string;
    intro?: string;
    kort?: Loftekort[];
    konklusjon?: string;
}

const STANDARD_KORT: Loftekort[] = [
    {
        lofte: 'Du er et fritt menneske.',
        virkelighet:
            'Sant i loven. Men fram til jorda var betalt var du «midlertidig forpliktet», og måtte fortsatt jobbe for godseieren.',
    },
    {
        lofte: 'Du kan gifte deg uten å spørre om lov.',
        virkelighet:
            'Dette holdt. Før 1861 måtte en livegen ha tillatelse fra jordherren for å gifte seg, og betalte som regel for den.',
    },
    {
        lofte: 'Du får kjøpe jorda du dyrker.',
        virkelighet:
            'Nesten ingen hadde penger. Staten betalte godseieren, og krevde summen inn av bonden igjen over 49 år.',
    },
    {
        lofte: 'Du får din egen jordlapp.',
        virkelighet:
            'Godseieren beholdt den beste jorda. De fleste fikk mindre å dyrke enn de hadde hatt før reformen.',
    },
    {
        lofte: 'Nå styrer du ditt eget liv.',
        virkelighet:
            'Jorda ble skrevet på landsbyfellesskapet, ikke på deg. Det bestemte hvem som dyrket hva, og krevde inn betalingen.',
    },
];

export function FrihetensRegning({
    title = 'Frihetsbrevet 1861',
    intro = 'Klikk hvert løfte fra loven og se hva som faktisk skjedde.',
    kort = STANDARD_KORT,
    konklusjon = 'Bøndene ble frie mennesker i 1861. Men de måtte kjøpe tilbake jorda de allerede dyrket, og nedbetalingen skulle løpe i 49 år. Staten strøk resten av gjelden først i 1905.',
}: FrihetensRegningProps) {
    const [snudd, setSnudd] = useState<boolean[]>(() => kort.map(() => false));

    const antallSnudd = snudd.filter(Boolean).length;
    const ferdig = antallSnudd === kort.length;

    const snu = (i: number) => {
        setSnudd((forrige) => forrige.map((v, j) => (j === i ? true : v)));
    };

    const snuAlle = () => setSnudd(kort.map(() => true));
    const nullstill = () => setSnudd(kort.map(() => false));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: fem løftekort som snus */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {kort.map((k, i) => {
                    const erSnudd = snudd[i];
                    return (
                        <div key={i} className="[perspective:1000px]">
                            <motion.button
                                type="button"
                                onClick={() => snu(i)}
                                animate={{ rotateY: erSnudd ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                                whileHover={erSnudd ? undefined : { scale: 1.03 }}
                                whileTap={erSnudd ? undefined : { scale: 0.98 }}
                                className="relative w-full h-56 text-left [transform-style:preserve-3d]"
                                aria-label={
                                    erSnudd
                                        ? `${k.lofte} Slik ble det: ${k.virkelighet}`
                                        : `Snu kortet: ${k.lofte}`
                                }
                            >
                                {/* Forside: løftet i loven */}
                                <span className="absolute inset-0 [backface-visibility:hidden] rounded-xl border border-slate-200 bg-slate-50 shadow-sm p-4 flex flex-col justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                                        Loven lovte
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 leading-snug">
                                        {k.lofte}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        Klikk for å se hvordan det gikk
                                    </span>
                                </span>

                                {/* Bakside: slik ble det */}
                                <span className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-4 flex flex-col justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                                        Slik ble det
                                    </span>
                                    <span className="text-sm text-amber-900 leading-snug">
                                        {k.virkelighet}
                                    </span>
                                </span>
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-4 rounded-lg bg-emerald-50 border border-emerald-200"
                        >
                            <p className="text-sm text-emerald-800 leading-relaxed">{konklusjon}</p>

                            {/* Regningen tegnet opp: 49 år med nedbetaling */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs font-medium text-emerald-700 mb-1">
                                    <span>1861: du er fri</span>
                                    <span>1910: gjelden skulle vært betalt</span>
                                </div>
                                <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.6, ease: 'easeOut' }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-emerald-700">
                                    49 år med innløsningsbetaling. En bonde som var 25 år i 1861,
                                    ville vært 74 før jorda var hans. Mange rakk aldri å bli ferdige,
                                    og gjelden gikk videre til barna.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="teller"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Snudd {antallSnudd} av {kort.length} løfter. Snu resten for å se hele
                            regnskapet.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={snuAlle}
                    disabled={ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Snu alle
                </button>
                <button
                    type="button"
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
