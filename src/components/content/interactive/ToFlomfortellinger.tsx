import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, RotateCcw, Check, X } from 'lucide-react';

// Lyspære-øyeblikket: etter denne interaksjonen skal eleven se at handlingen i de
// to flomfortellingene er nesten helt lik steg for steg. Det som skiller dem, er
// begrunnelsen for flommen og hva slags guder som står bak.

type Kilde = 'gilgamesj' | 'bibelen' | 'begge';

interface FlomSteg {
    id: string;
    tekst: string;
    svar: Kilde;
    forklaring: string;
}

interface ToFlomfortellingerProps {
    title?: string;
    intro?: string;
    steg?: FlomSteg[];
}

const STANDARD_STEG: FlomSteg[] = [
    {
        id: 'beslutning',
        tekst: 'Gudene bestemmer seg for å utslette menneskene med en stor flom',
        svar: 'begge',
        forklaring: 'Begge fortellingene starter likt: det er en guddommelig beslutning, ikke en ulykke.',
    },
    {
        id: 'advarsel',
        tekst: 'Én gud advarer én mann i hemmelighet',
        svar: 'begge',
        forklaring:
            'Ea advarer Utnapisjtim gjennom en drøm. I Bibelen taler Gud selv til Noah. Én mann får vite det ingen andre vet.',
    },
    {
        id: 'baten',
        tekst: 'Mannen bygger en diger båt',
        svar: 'begge',
        forklaring:
            'Utnapisjtim river huset sitt og bygger et fartøy med seks dekk og ni rom. Noah bygger arken.',
    },
    {
        id: 'dyrene',
        tekst: 'Dyr blir tatt om bord',
        svar: 'begge',
        forklaring: 'Både tamme og ville dyr blir berget i den mesopotamiske versjonen.',
    },
    {
        id: 'fuglene',
        tekst: 'Fugler blir sendt ut for å lete etter tørt land',
        svar: 'begge',
        forklaring:
            'Utnapisjtim sender ut due, svale og ravn. Ravnen kommer ikke tilbake, for den har funnet mat.',
    },
    {
        id: 'offeret',
        tekst: 'Mannen ofrer til gudene når vannet trekker seg tilbake',
        svar: 'begge',
        forklaring:
            'Utnapisjtim tenner et bål med sedertre og myrra. Gudene samler seg rundt røyken som fluer.',
    },
    {
        id: 'braket',
        tekst: 'Flommen kommer fordi menneskene bråker for mye',
        svar: 'gilgamesj',
        forklaring:
            'I den mesopotamiske versjonen blir gudene rett og slett forstyrret av støyen fra menneskene.',
    },
    {
        id: 'ondskap',
        tekst: 'Flommen kommer fordi menneskene er onde',
        svar: 'bibelen',
        forklaring:
            'Her ligger den store forskjellen: i Bibelen er flommen en dom over ondskap, ikke et irritert innfall.',
    },
    {
        id: 'evig-liv',
        tekst: 'Mannen og kona hans får evig liv til slutt',
        svar: 'gilgamesj',
        forklaring:
            'Utnapisjtim og kona blir gjort like gudene. Noah får ingen udødelighet - han får et løfte.',
    },
];

const VALG: { id: Kilde; etikett: string }[] = [
    { id: 'gilgamesj', etikett: 'Bare Gilgamesj' },
    { id: 'begge', etikett: 'I begge' },
    { id: 'bibelen', etikett: 'Bare Bibelen' },
];

export function ToFlomfortellinger({
    title = 'To flomfortellinger, samme spor',
    intro = 'Hvor hører hvert steg hjemme? Trykk på svaret ditt.',
    steg = STANDARD_STEG,
}: ToFlomfortellingerProps) {
    const [naa, setNaa] = useState(0);
    const [svar, setSvar] = useState<Record<string, Kilde>>({});
    const [sisteRiktig, setSisteRiktig] = useState<boolean | null>(null);

    const ferdig = naa >= steg.length;
    const aktivt = ferdig ? null : steg[naa];
    const besvarte = steg.slice(0, naa);
    const antallBegge = steg.filter((s) => s.svar === 'begge').length;
    const riktige = besvarte.filter((s) => svar[s.id] === s.svar).length;

    const velg = (valgt: Kilde) => {
        if (!aktivt) return;
        setSvar((f) => ({ ...f, [aktivt.id]: valgt }));
        setSisteRiktig(valgt === aktivt.svar);
        setNaa((n) => n + 1);
    };

    const nullstill = () => {
        setNaa(0);
        setSvar({});
        setSisteRiktig(null);
    };

    const forrige = naa > 0 ? steg[naa - 1] : null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Waves className="w-5 h-5 text-sky-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Sporet: de to fortellingene side ved side */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_72px_72px] bg-slate-50 border-b border-slate-200">
                        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            Steg i fortellingen
                        </div>
                        <div className="px-2 py-2 text-[11px] font-bold text-amber-700 text-center leading-tight">
                            Gilgamesj
                        </div>
                        <div className="px-2 py-2 text-[11px] font-bold text-indigo-700 text-center leading-tight">
                            Bibelen
                        </div>
                    </div>

                    {steg.map((s, i) => {
                        const lost = i < naa;
                        const iGilgamesj = s.svar === 'gilgamesj' || s.svar === 'begge';
                        const iBibelen = s.svar === 'bibelen' || s.svar === 'begge';
                        return (
                            <div
                                key={s.id}
                                className={`grid grid-cols-[1fr_72px_72px] items-center border-b border-slate-100 last:border-b-0 ${
                                    i === naa ? 'bg-sky-50' : 'bg-white'
                                }`}
                            >
                                <div
                                    className={`px-3 py-2 text-xs leading-snug ${
                                        lost ? 'text-slate-700' : 'text-slate-400'
                                    }`}
                                >
                                    {lost || i === naa ? s.tekst : 'Kommer snart'}
                                </div>
                                {[iGilgamesj, iBibelen].map((finnes, k) => (
                                    <div key={k} className="flex justify-center py-2">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: lost ? 1 : 0.55,
                                                opacity: lost ? 1 : 0.25,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 18,
                                            }}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                !lost
                                                    ? 'bg-slate-200'
                                                    : finnes
                                                      ? k === 0
                                                          ? 'bg-amber-500'
                                                          : 'bg-indigo-500'
                                                      : 'bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            {lost &&
                                                (finnes ? (
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                ) : (
                                                    <X className="w-3 h-3 text-slate-300" />
                                                ))}
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-5 sm:px-6 py-5">
                <AnimatePresence mode="wait">
                    {aktivt ? (
                        <motion.div
                            key={aktivt.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                Steg {naa + 1} av {steg.length}
                            </p>
                            <p className="text-slate-800 font-medium mb-3">{aktivt.tekst}</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {VALG.map((v) => (
                                    <motion.button
                                        key={v.id}
                                        type="button"
                                        onClick={() => velg(v.id)}
                                        whileTap={{ scale: 0.97 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="rounded-lg border border-slate-200 bg-white hover:border-slate-300 shadow-sm px-3 py-2.5 text-sm font-medium text-slate-700"
                                    >
                                        {v.etikett}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4"
                        >
                            <p className="font-semibold text-emerald-800 mb-1">
                                {antallBegge} av {steg.length} steg finnes i begge fortellingene.
                            </p>
                            <p className="text-sm text-emerald-700">
                                Selve handlingen er nesten den samme. Det som skiller de to, er
                                hvorfor flommen kommer, og hva slags guder som står bak. Den
                                mesopotamiske versjonen er over tusen år eldre enn den bibelske.
                            </p>
                            <p className="text-xs text-emerald-600 mt-2">
                                Du plasserte {riktige} av {steg.length} steg riktig.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={forrige ? forrige.id : 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            !forrige
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : sisteRiktig
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {!forrige
                            ? 'Gilgamesj-eposet ble skrevet på leirtavler i Mesopotamia. Bibelens fortelling om Noah kom senere. Se hvor mye som er likt.'
                            : `${sisteRiktig ? 'Riktig.' : 'Ikke helt.'} ${forrige.forklaring}`}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    Forskere mener fortellingene henger sammen, fordi de vokste fram i det samme
                    området.
                </p>
                <button
                    type="button"
                    onClick={nullstill}
                    className="shrink-0 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
