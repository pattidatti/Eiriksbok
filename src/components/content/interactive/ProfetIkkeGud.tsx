import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Check, RotateCcw, Sparkles, User, X } from 'lucide-react';

type Side = 'gud' | 'muhammad';

interface Kort {
    id: string;
    tekst: string;
    side: Side;
    forklaring: string;
}

interface Plassert {
    kort: Kort;
    riktig: boolean;
}

interface ProfetIkkeGudProps {
    title?: string;
}

const KORT: Kort[] = [
    {
        id: 'fodt',
        tekst: 'Ble født i Mekka rundt år 570',
        side: 'muhammad',
        forklaring:
            'Muhammad var et menneske med et fødested og et fødeår. Kildene sier omtrent år 570, så det nøyaktige året er usikkert.',
    },
    {
        id: 'tilbes',
        tekst: 'Skal tilbes i bønnen',
        side: 'gud',
        forklaring:
            'I islam er det bare Gud som tilbes. All dyrkelse av religionsstifteren avvises, selv om muslimer viser Muhammad stor respekt.',
    },
    {
        id: 'forkynte',
        tekst: 'Tok imot åpenbaringene og bar dem videre',
        side: 'muhammad',
        forklaring:
            'Ifølge islamsk tro tok Muhammad imot budskapet og bar det videre til menneskene. Det er nettopp det en profet gjør.',
    },
    {
        id: 'slekt',
        tekst: 'Har verken barn eller foreldre',
        side: 'gud',
        forklaring:
            'Sure 112 i Koranen sier om Gud at han verken har avlet eller er født. Gud står helt utenfor slektsrekkene.',
    },
    {
        id: 'forbilde',
        tekst: 'Er forbilde for hvordan muslimer bør leve',
        side: 'muhammad',
        forklaring:
            'Måten han levde og handlet på, kalles sunna. I Koranen blir han framhevet som et forbilde for de troende.',
    },
    {
        id: 'sendte',
        tekst: 'Sendte budskapet til menneskene',
        side: 'gud',
        forklaring:
            'I islam er Gud avsenderen og Muhammad budbringeren. Trosbekjennelsen kaller ham nettopp Guds profet.',
    },
    {
        id: 'segl',
        tekst: 'Er den siste i rekken av profeter',
        side: 'muhammad',
        forklaring:
            'Koranen bruker uttrykket profetenes segl om ham. Han står sist i en rekke som begynner med Adam.',
    },
    {
        id: 'en',
        tekst: 'Er én, og har ingen likemann',
        side: 'gud',
        forklaring:
            'Trosbekjennelsen begynner med at det ikke finnes noen gud utenom Gud. Å sette noen ved siden av Gud er utenkelig i islam.',
    },
    {
        id: 'dode',
        tekst: 'Døde i Medina i 632',
        side: 'muhammad',
        forklaring:
            'Han døde slik alle mennesker gjør. Muslimer mener det ikke svekker budskapet, for budskapet kom fra Gud, ikke fra ham.',
    },
];

const KOLONNER: { side: Side; navn: string; undertekst: string }[] = [
    { side: 'gud', navn: 'Gud (Allah)', undertekst: 'Den eneste som tilbes' },
    { side: 'muhammad', navn: 'Muhammad', undertekst: 'Menneske og profet' },
];

export function ProfetIkkeGud({ title = 'Grensen som ikke krysses' }: ProfetIkkeGudProps) {
    const [plasserte, setPlasserte] = useState<Plassert[]>([]);
    const [siste, setSiste] = useState<Plassert | null>(null);

    const index = plasserte.length;
    const ferdig = index >= KORT.length;
    const aktivt = ferdig ? null : KORT[index];
    const riktigeForsok = plasserte.filter((p) => p.riktig).length;

    const velg = (valg: Side) => {
        if (!aktivt) return;
        const resultat: Plassert = { kort: aktivt, riktig: valg === aktivt.side };
        setPlasserte((forrige) => [...forrige, resultat]);
        setSiste(resultat);
    };

    const nullstill = () => {
        setPlasserte([]);
        setSiste(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Slik framstiller islam de to. Hvem hører påstanden hjemme hos? Velg side for
                        hvert kort.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5">
                <AnimatePresence mode="wait">
                    {aktivt ? (
                        <motion.div
                            key={aktivt.id}
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                            <p className="text-center text-base sm:text-lg font-medium text-slate-800">
                                {aktivt.tekst}
                            </p>
                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => velg('gud')}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Gud (Allah)
                                </button>
                                <button
                                    onClick={() => velg('muhammad')}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Muhammad
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -25 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 340,
                                    damping: 14,
                                    delay: 0.1,
                                }}
                                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500"
                            >
                                <Check className="w-6 h-6 text-white" />
                            </motion.div>
                            <p className="font-semibold text-emerald-800">
                                Alle {KORT.length} kortene er plassert. Riktig på første forsøk:{' '}
                                {riktigeForsok} av {KORT.length}.
                            </p>
                            <p className="mt-1 text-sm text-emerald-700">
                                Ingenting om Muhammad havnet på Guds side. Det er akkurat det
                                muslimer mener når de sier at han er profet, ikke Gud.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative px-5 pt-5">
                <motion.div
                    className="absolute left-1/2 top-5 bottom-0 w-1 -translate-x-1/2 rounded-full"
                    initial={false}
                    animate={{ backgroundColor: ferdig ? '#10b981' : '#cbd5e1' }}
                    transition={{ duration: 0.4 }}
                />
                <div className="grid grid-cols-2">
                    {KOLONNER.map((kolonne) => (
                        <div
                            key={kolonne.side}
                            className={kolonne.side === 'gud' ? 'pr-4' : 'pl-4'}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {kolonne.side === 'gud' ? (
                                    <Sparkles className="w-3.5 h-3.5" />
                                ) : (
                                    <User className="w-3.5 h-3.5" />
                                )}
                                {kolonne.navn}
                            </div>
                            <p className="text-[11px] text-slate-400">{kolonne.undertekst}</p>
                            <div className="mt-2 min-h-[8.5rem] space-y-1.5">
                                {plasserte
                                    .filter((p) => p.kort.side === kolonne.side)
                                    .map((p) => (
                                        <motion.div
                                            key={p.kort.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.85, y: -8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 24,
                                            }}
                                            className={`rounded-lg border px-2.5 py-1.5 text-xs leading-snug ${
                                                kolonne.side === 'gud'
                                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            {p.kort.tekst}
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={siste ? siste.kort.id : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                            !siste
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : siste.riktig
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                    >
                        {!siste ? (
                            <span>
                                Kortet blir liggende på riktig side uansett hva du velger, så du
                                lærer av bommen.
                            </span>
                        ) : (
                            <>
                                {siste.riktig ? (
                                    <Check className="mt-0.5 w-4 h-4 shrink-0" />
                                ) : (
                                    <X className="mt-0.5 w-4 h-4 shrink-0" />
                                )}
                                <span>
                                    {siste.riktig ? 'Riktig. ' : 'Ikke helt. '}
                                    {siste.kort.forklaring}
                                </span>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {index} av {KORT.length} kort plassert
                </span>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
