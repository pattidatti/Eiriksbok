import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark,
    Crown,
    HeartCrack,
    Megaphone,
    EyeOff,
    RotateCcw,
    Sparkles,
    Check,
} from 'lucide-react';

// Mytenes verksted - signaturkomponent for artikkelen om nasjonenes gullaldre.
// Lyspære: en nasjonal fortelling er et VALG. Eleven er rådgiver for et nytt
// land og setter sammen landets store fortelling av en epoke, en helt og et
// felles sår. Festtalen bygger seg opp live - og for hvert valg dukker det opp
// et "dette skjuler fortellingen"-kort. Innsikten oppleves: det du løfter fram,
// kaster skygge over noe annet.

interface MytenesVerkstedProps {
    title?: string;
}

type SlotId = 'epoke' | 'helt' | 'saar';

interface Choice {
    id: string;
    label: string;
    speech: string; // setningen som havner i festtalen
    hides: string; // det fortellingen skjuler
}

interface Slot {
    id: SlotId;
    name: string;
    prompt: string;
    Icon: React.ComponentType<{ className?: string }>;
    choices: Choice[];
}

const SLOTS: Slot[] = [
    {
        id: 'epoke',
        name: 'Gullalderen',
        prompt: 'Hvilken epoke skal landet se tilbake på?',
        Icon: Landmark,
        choices: [
            {
                id: 'sjofarere',
                label: 'Sjøfarernes storhetstid',
                speech: 'Husk den gangen skipene våre seilte lenger enn noen andres!',
                hides: 'At sjøfarerne også plyndret og tok slaver, nevner talen ikke.',
            },
            {
                id: 'bondefrihet',
                label: 'Den frie bondetiden',
                speech: 'Husk tiden da frie bønder eide sin egen jord og bøyde seg for ingen!',
                hides: 'Husmennene og de fattige som eide ingenting, er visket ut av bildet.',
            },
            {
                id: 'frihetskamp',
                label: 'Frihetskampen mot naboriket',
                speech: 'Husk heltene som reiste seg og kastet ut undertrykkerne!',
                hides: 'At mange i landet faktisk samarbeidet med naboriket, snakker ingen om.',
            },
        ],
    },
    {
        id: 'helt',
        name: 'Helten',
        prompt: 'Hvem skal stå på sokkelen?',
        Icon: Crown,
        choices: [
            {
                id: 'konge',
                label: 'Kong Aldar, som samlet landet',
                speech: 'Vi er ett folk fordi kong Aldar gjorde oss til ett!',
                hides: 'Kongen samlet landet med sverd. De som nektet, mistet alt.',
            },
            {
                id: 'dikter',
                label: 'Dikteren Liv, som ga folket et språk',
                speech: 'Dikteren Liv lærte oss hvem vi er, med våre egne ord!',
                hides: 'De fleste kunne ikke lese. Diktene ble skrevet for eliten i byene.',
            },
            {
                id: 'oppfinner',
                label: 'Oppfinneren Brage, som gjorde landet rikt',
                speech: 'Brages maskiner løftet oss ut av fattigdommen!',
                hides: 'Rikdommen fra maskinene ble aldri delt likt. Arbeiderne slet for lite lønn.',
            },
        ],
    },
    {
        id: 'saar',
        name: 'Såret',
        prompt: 'Hvilket sår skal samle folket?',
        Icon: HeartCrack,
        choices: [
            {
                id: 'nederlag',
                label: 'Det store nederlaget ved elven',
                speech: 'Aldri glem dagen vi sto alene ved elven. Aldri igjen!',
                hides: 'Såret holder også hatet mot gamlefienden varmt, generasjon etter generasjon.',
            },
            {
                id: 'hungersnod',
                label: 'Hungersnøden',
                speech: 'Aldri glem årene da barna våre sultet. Aldri igjen!',
                hides: 'At landets egne ledere solgte korn ut av landet mens folket sultet, er glemt.',
            },
            {
                id: 'fremmedstyre',
                label: 'Hundre år under fremmed styre',
                speech: 'Hundre år i lenker, men folkesjelen døde aldri!',
                hides: 'Hundre år er lenge. Folk levde vanlige liv, giftet seg og handlet med «fienden».',
            },
        ],
    },
];

type Phase = 'idle' | 'complete';

export function MytenesVerksted({ title = 'Mytenes verksted' }: MytenesVerkstedProps) {
    const [selected, setSelected] = useState<Record<SlotId, Choice | null>>({
        epoke: null,
        helt: null,
        saar: null,
    });
    const [phase, setPhase] = useState<Phase>('idle');

    const chosenCount = SLOTS.filter((s) => selected[s.id]).length;
    const allChosen = chosenCount === SLOTS.length;

    const pick = (slot: SlotId, choice: Choice) => {
        if (phase === 'complete') return;
        setSelected((prev) => ({ ...prev, [slot]: choice }));
    };

    const handleReset = () => {
        setSelected({ epoke: null, helt: null, saar: null });
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er rådgiver for det nye landet Nordavind. Velg en gullalder, en helt og
                        et sår - og se hva fortellingen din skjuler.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-5 grid gap-4 lg:grid-cols-2">
                {/* Venstre: valgene */}
                <div className="space-y-4">
                    {SLOTS.map((slot) => {
                        const SlotIcon = slot.Icon;
                        return (
                            <div key={slot.id}>
                                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <SlotIcon className="w-3.5 h-3.5 text-indigo-400" />
                                    {slot.name}
                                    <span className="font-medium normal-case tracking-normal text-slate-400">
                                        · {slot.prompt}
                                    </span>
                                </p>
                                <div className="grid gap-1.5">
                                    {slot.choices.map((choice) => {
                                        const isPicked = selected[slot.id]?.id === choice.id;
                                        return (
                                            <motion.button
                                                key={choice.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => pick(slot.id, choice)}
                                                disabled={phase === 'complete'}
                                                className={`flex items-center gap-2 text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                    isPicked
                                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                                        : phase === 'complete'
                                                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                                                          : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                <span
                                                    className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        isPicked
                                                            ? 'bg-indigo-500 border-indigo-500'
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    {isPicked && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </span>
                                                {choice.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Høyre: festtalen + skyggesiden */}
                <div className="flex flex-col gap-3">
                    <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                            Festtalen på nasjonaldagen
                        </p>
                        <p className="text-sm text-amber-900 italic">Landsmenn i Nordavind!</p>
                        <div className="mt-1.5 space-y-1.5 min-h-[7.5rem]">
                            {SLOTS.map((slot) => {
                                const choice = selected[slot.id];
                                return (
                                    <AnimatePresence mode="wait" key={slot.id}>
                                        {choice ? (
                                            <motion.p
                                                key={choice.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="text-sm text-amber-900 italic"
                                            >
                                                {choice.speech}
                                            </motion.p>
                                        ) : (
                                            <motion.p
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                exit={{ opacity: 0 }}
                                                className="text-sm text-amber-400 italic"
                                            >
                                                ... (velg {slot.name.toLowerCase()})
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            <EyeOff className="w-3.5 h-3.5" />
                            Dette skjuler fortellingen
                        </p>
                        <div className="space-y-1.5 min-h-[6rem]">
                            {chosenCount === 0 && (
                                <p className="text-sm text-slate-400 italic">
                                    Hver gang du velger noe, dukker skyggesiden opp her.
                                </p>
                            )}
                            {SLOTS.map((slot) => {
                                const choice = selected[slot.id];
                                if (!choice) return null;
                                return (
                                    <motion.p
                                        key={choice.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sm text-slate-600"
                                    >
                                        {choice.hides}
                                    </motion.p>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        className="mx-4 sm:mx-5 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200"
                    >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Nordavind har fått sin nasjonale fortelling!
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                            La du merke til hva som skjedde? Alt du valgte, skjulte noe annet. Slik
                            er det for ekte land også: en gullalder er ikke bare historie, den er
                            et utvalg. Prøv gjerne på nytt med andre valg og se hvordan landet
                            «blir» et annet.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-5 pb-4 flex items-center justify-between">
                <button
                    onClick={() => setPhase('complete')}
                    disabled={!allChosen || phase === 'complete'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        allChosen && phase !== 'complete'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {phase === 'complete' ? 'Talen er holdt' : `Hold talen (${chosenCount}/3 valgt)`}
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
