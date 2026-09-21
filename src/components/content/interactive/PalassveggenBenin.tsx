import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Flame, Home, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: platene på palassveggen var Benins arkiv. Da de ble
// spredt i 1897, var det ikke bare kunst som forsvant - det var rikets evne
// til å fortelle sin egen historie. Eleven leser veggen, mister den, og
// henter den hjem igjen.

interface PalassveggenBeninProps {
    title?: string;
}

type Phase = 'lese' | 'spredt' | 'hjemme';

interface Plate {
    id: number;
    motiv: string;
    // Linja platen bidrar med til rikets historie.
    linje: string;
    // Hvor stor hovedfiguren er tegnet (rang vises med størrelse).
    rang: 'stor' | 'mellom' | 'liten';
    sted: string;
    stedInfo: string;
}

const PLATER: Plate[] = [
    {
        id: 0,
        motiv: 'Obaen med hoffet rundt seg',
        linje: 'Obaen styrte riket, og de som sto nærmest ham, er tegnet nærmest ham.',
        rang: 'stor',
        sted: 'London',
        stedInfo: 'British Museum har over 900 gjenstander fra Benin.',
    },
    {
        id: 1,
        motiv: 'Hærføreren med sverd',
        linje: 'Riket hadde en hær, og hærførerne ble husket ved navn og rang.',
        rang: 'mellom',
        sted: 'Berlin',
        stedInfo: 'Tyskland inngikk i 2022 avtale om å overføre over tusen gjenstander.',
    },
    {
        id: 2,
        motiv: 'Portugisisk handelsmann med hatt',
        linje: 'Portugiserne kom til Benin i 1472, men fikk aldri kontroll over riket.',
        rang: 'mellom',
        sted: 'Leiden',
        stedInfo: 'Nederland bestemte i 2025 å levere tilbake 113 gjenstander.',
    },
    {
        id: 3,
        motiv: 'Hornblåserne i seremonien',
        linje: 'Hoffet holdt store seremonier, og vi ser hvilke instrumenter som ble brukt.',
        rang: 'liten',
        sted: 'Rotterdam',
        stedInfo: 'Seks gjenstander fra Rotterdam ble med i tilbakeføringen i 2025.',
    },
    {
        id: 4,
        motiv: 'Leoparden, obaens dyr',
        linje: 'Makt ble vist med symboler alle i riket kunne lese med én gang.',
        rang: 'liten',
        sted: 'Washington',
        stedInfo: 'Smithsonian ga tilbake 29 gjenstander i 2024.',
    },
];

const FIGUR_HOYDE: Record<Plate['rang'], number> = { stor: 44, mellom: 32, liten: 24 };

function PlateGrafikk({ plate, dempet }: { plate: Plate; dempet: boolean }) {
    const h = FIGUR_HOYDE[plate.rang];
    return (
        <div
            className={`relative flex h-full w-full items-end justify-center rounded-lg ${
                dempet
                    ? 'bg-gradient-to-b from-amber-200 to-amber-300'
                    : 'bg-gradient-to-b from-amber-300 to-amber-500'
            }`}
        >
            {/* ramme-prikker som på de ekte platene */}
            <div className="absolute inset-1.5 rounded-md border border-amber-700/40" />
            {/* hovedfigur: hodet + kropp, størrelsen viser rang */}
            <div className="relative mb-3 flex flex-col items-center">
                <div
                    className="rounded-full bg-amber-800/80"
                    style={{ width: h * 0.34, height: h * 0.34 }}
                />
                <div
                    className="mt-0.5 rounded-t-md bg-amber-800/80"
                    style={{ width: h * 0.46, height: h * 0.62 }}
                />
            </div>
            {/* to småfigurer ved siden av */}
            <div className="absolute bottom-3 left-2.5 h-3 w-2 rounded-t-sm bg-amber-800/45" />
            <div className="absolute bottom-3 right-2.5 h-3 w-2 rounded-t-sm bg-amber-800/45" />
        </div>
    );
}

export function PalassveggenBenin({
    title = 'Palassveggen i Benin City',
}: PalassveggenBeninProps) {
    const [phase, setPhase] = useState<Phase>('lese');
    const [lest, setLest] = useState<number[]>([]);
    const [hjemme, setHjemme] = useState<number[]>([]);

    const alleLest = lest.length === PLATER.length;
    const alleHjemme = hjemme.length === PLATER.length;

    const handleReset = () => {
        setPhase('lese');
        setLest([]);
        setHjemme([]);
    };

    const lesPlate = (id: number) => {
        if (phase !== 'lese' || lest.includes(id)) return;
        setLest((prev) => [...prev, id]);
    };

    const plyndre = () => {
        setPhase('spredt');
    };

    const hentHjem = (id: number) => {
        if (phase !== 'spredt' || hjemme.includes(id)) return;
        const neste = [...hjemme, id];
        setHjemme(neste);
        if (neste.length === PLATER.length) setPhase('hjemme');
    };

    // En plate henger på veggen når den ikke er plyndret, eller er hentet hjem.
    const paaVeggen = (id: number) => phase === 'lese' || hjemme.includes(id);

    const feedback =
        phase === 'lese'
            ? alleLest
                ? 'Hele veggen er lest. Nå vet du hvem som styrte, hvem som kjempet, hvem som kom utenfra og hvordan seremoniene så ut.'
                : `Lest ${lest.length} av ${PLATER.length} plater. Klikk en plate for å lese hva den forteller.`
            : phase === 'spredt'
              ? `Historien har hull. ${hjemme.length} av ${PLATER.length} plater er hentet hjem.`
              : 'Veggen kan leses igjen. Det er dette tilbakeføring egentlig handler om.';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk platene og les hva veggen forteller om riket.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-6 flex flex-col 2xl:flex-row gap-5">
                {/* Veggen */}
                <div className="flex-1">
                    <div className="rounded-xl bg-stone-200 border border-stone-300 p-3 sm:p-4">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {PLATER.map((p) => {
                                const her = paaVeggen(p.id);
                                const erLest = lest.includes(p.id);
                                return (
                                    <div
                                        key={p.id}
                                        className="relative h-[92px] sm:h-[104px] rounded-lg bg-stone-300/70 border border-stone-400/50"
                                    >
                                        <AnimatePresence>
                                            {her && (
                                                <motion.button
                                                    layoutId={`plate-${p.id}`}
                                                    type="button"
                                                    onClick={() => lesPlate(p.id)}
                                                    aria-label={p.motiv}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 210,
                                                        damping: 24,
                                                    }}
                                                    whileHover={
                                                        phase === 'lese' && !erLest
                                                            ? { scale: 1.05 }
                                                            : undefined
                                                    }
                                                    whileTap={
                                                        phase === 'lese' ? { scale: 0.96 } : undefined
                                                    }
                                                    className={`absolute inset-0 rounded-lg p-0.5 ${
                                                        phase === 'lese' && !erLest
                                                            ? 'cursor-pointer ring-2 ring-amber-600/50'
                                                            : 'cursor-default'
                                                    }`}
                                                >
                                                    <PlateGrafikk plate={p} dempet={erLest} />
                                                    {erLest && (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -top-1 -right-1 rounded-full bg-emerald-500 p-0.5"
                                                        >
                                                            <Sparkles className="w-3 h-3 text-white" />
                                                        </motion.span>
                                                    )}
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                        {!her && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] font-medium text-stone-500">
                                                    tom
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-2.5 text-[11px] text-stone-600">
                            Palassveggen. Den største figuren på en plate er alltid den med høyest
                            rang.
                        </p>
                    </div>

                    {/* Museumshylla - bare når platene er borte */}
                    <AnimatePresence>
                        {phase !== 'lese' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden"
                            >
                                <p className="mb-2 text-xs font-semibold text-slate-600">
                                    Museene som fikk platene. Klikk for å hente dem hjem.
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {PLATER.map((p) => {
                                        const borte = !hjemme.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => hentHjem(p.id)}
                                                disabled={!borte}
                                                className={`rounded-lg border p-1.5 text-center transition-colors ${
                                                    borte
                                                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer'
                                                        : 'border-emerald-200 bg-emerald-50 cursor-default'
                                                }`}
                                            >
                                                <div className="relative mx-auto h-[52px] w-full">
                                                    <AnimatePresence>
                                                        {borte && (
                                                            <motion.div
                                                                layoutId={`plate-${p.id}`}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 210,
                                                                    damping: 24,
                                                                }}
                                                                className="absolute inset-0 rounded-lg p-0.5"
                                                            >
                                                                <PlateGrafikk plate={p} dempet />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                    {!borte && (
                                                        <div className="flex h-full items-center justify-center">
                                                            <Home className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="mt-1 block w-full text-[9px] font-semibold leading-tight text-slate-600">
                                                    {p.sted}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Rikets historie */}
                <div className="2xl:w-[340px] shrink-0">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-slate-700">
                            Det veggen forteller
                        </h4>
                        <ul className="space-y-2">
                            {PLATER.map((p) => {
                                const erLest = lest.includes(p.id);
                                const harHull = phase === 'spredt' && !hjemme.includes(p.id);
                                return (
                                    <li key={p.id} className="text-xs leading-relaxed">
                                        {!erLest ? (
                                            <span className="text-slate-400">
                                                Plate {p.id + 1}: ikke lest ennå
                                            </span>
                                        ) : harHull ? (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-rose-600"
                                            >
                                                Plate {p.id + 1}: borte, står nå i {p.sted}.{' '}
                                                <span className="text-rose-400">
                                                    {p.stedInfo}
                                                </span>
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-slate-700"
                                            >
                                                <span className="font-semibold text-slate-800">
                                                    {p.motiv}.
                                                </span>{' '}
                                                {p.linje}
                                            </motion.span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-4 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${lest.length}-${hjemme.length}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            phase === 'hjemme'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : phase === 'spredt'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feedback}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Suksess */}
            <AnimatePresence>
                {alleHjemme && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="mx-4 sm:mx-6 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <p className="text-sm text-emerald-800">
                            Platene var ikke bare kunst. De var måten Benin husket seg selv på. Da
                            de ble spredt, mistet edo-folket oversikten over sin egen fortid. I
                            virkeligheten har bare noen av dem kommet hjem så langt.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'lese' ? (
                    <button
                        type="button"
                        onClick={plyndre}
                        disabled={!alleLest}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                            alleLest
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Flame className="w-4 h-4" />
                        Februar 1897
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'spredt'
                            ? 'Klikk et museum for å hente platen hjem.'
                            : 'Alle platene henger på veggen igjen.'}
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors shrink-0"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
