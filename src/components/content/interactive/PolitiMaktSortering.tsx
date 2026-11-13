import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    Gavel,
    HeartHandshake,
    RotateCcw,
    Search,
    ShieldCheck,
    XCircle,
} from 'lucide-react';

// PolitiMaktSortering: eleven får åtte ting politiet kan gjøre, én om gangen, og sorterer hver
// handling etter hva som må til for at politiet får lov: ingenting (ro, orden og hjelp),
// mistanke om lovbrudd, eller at retten sier ja.
//
// Lyspære-øyeblikket: Jo mer politiet griper inn i livet ditt, jo strengere krav stiller loven.
// Å be folk flytte seg krever lite. Å ransake hjemmet ditt eller holde deg innesperret i dager
// krever at en dommer har sagt ja.
//
// Reglene er hentet fra politiloven (Lovdata) og Store norske leksikon (ransaking, pågripelse).

interface PolitiMaktSorteringProps {
    title?: string;
}

type KravId = 'ingen' | 'mistanke' | 'retten';
type Phase = 'question' | 'answered' | 'done';

interface Krav {
    id: KravId;
    navn: string;
    kort: string;
    ikon: typeof Gavel;
}

interface Handling {
    id: string;
    tekst: string;
    svar: KravId;
    forklaring: string;
}

const KRAV: Krav[] = [
    {
        id: 'ingen',
        navn: 'Ingen mistanke trengs',
        kort: 'Ro, orden og hjelp',
        ikon: HeartHandshake,
    },
    {
        id: 'mistanke',
        navn: 'Mistanke om lovbrudd',
        kort: 'Politiet må ha god grunn',
        ikon: Search,
    },
    {
        id: 'retten',
        navn: 'Retten må si ja',
        kort: 'En dommer bestemmer',
        ikon: Gavel,
    },
];

const HANDLINGER: Handling[] = [
    {
        id: 'flytte',
        tekst: 'Etter en slåsskamp i sentrum ber politiet en stor gjeng om å gå hver til sitt.',
        svar: 'ingen',
        forklaring:
            'Politiet kan gripe inn for å stanse uro og holde orden. Ingen trenger å være mistenkt for noe. Du må adlyde, men du kan klage etterpå.',
    },
    {
        id: 'syk',
        tekst: 'En eldre mann har falt på fortauet og klarer ikke å reise seg. Politiet hjelper ham og ringer lege.',
        svar: 'ingen',
        forklaring:
            'Politiloven sier at politiet skal hjelpe syke som ikke klarer seg selv. Å hjelpe folk er en del av jobben.',
    },
    {
        id: 'full',
        tekst: 'En mann er så full at han er til fare for seg selv. Politiet tar ham med til arresten til han er edru.',
        svar: 'ingen',
        forklaring:
            'Politiet kan ta med seg personer som er så beruset at de er til fare for seg selv eller andre. Han er ikke mistenkt for et lovbrudd, og han skal ikke holdes lenger enn nødvendig.',
    },
    {
        id: 'hjem',
        tekst: 'Politiet møter en 13-åring alene ute sent på natten og kjører henne hjem til foreldrene.',
        svar: 'ingen',
        forklaring:
            'Politiet kan stoppe barn og unge de er bekymret for. Barn under 15 år kan ikke straffes, men politiet kan kjøre dem hjem.',
    },
    {
        id: 'fersk',
        tekst: 'En person blir tatt i det han stikker av fra et innbrudd. Politiet sjekker lommene hans med en gang.',
        svar: 'mistanke',
        forklaring:
            'Når noen blir tatt på fersk gjerning, kan politiet ransake personen uten å spørre retten først. Men de må ha en klar mistanke om et lovbrudd.',
    },
    {
        id: 'pagripe',
        tekst: 'Politiet tror en kvinne har ranet en butikk, og er redde for at hun skal rømme. De pågriper henne.',
        svar: 'mistanke',
        forklaring:
            'For å pågripe noen må politiet ha «skjellig grunn til mistanke» om et lovbrudd som kan gi mer enn seks måneder i fengsel. I tillegg må det være en særlig grunn, for eksempel fare for at hun rømmer.',
    },
    {
        id: 'hjemme',
        tekst: 'Politiet vil lete etter bevis inne i leiligheten din. Du sier nei.',
        svar: 'retten',
        forklaring:
            'Hjemmet ditt er godt beskyttet. Sier du nei, er hovedregelen at retten må bestemme om politiet får ransake. Bare når det haster veldig, kan påtalemyndigheten bestemme i stedet.',
    },
    {
        id: 'varetekt',
        tekst: 'Politiet vil holde en pågrepet person innesperret i flere uker mens de etterforsker saken.',
        svar: 'retten',
        forklaring:
            'Den som er pågrepet, må løslates eller føres fram for tingretten innen 48 timer. Bare en dommer kan bestemme at noen skal sitte i varetekt lenger.',
    },
];

const FARGER: Record<KravId, { knapp: string; merke: string }> = {
    ingen: {
        knapp: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400',
        merke: 'bg-sky-100 text-sky-800',
    },
    mistanke: {
        knapp: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400',
        merke: 'bg-amber-100 text-amber-800',
    },
    retten: {
        knapp: 'border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400',
        merke: 'bg-violet-100 text-violet-800',
    },
};

export function PolitiMaktSortering({
    title = 'Hva skal til for at politiet får lov?',
}: PolitiMaktSorteringProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('question');
    const [valgt, setValgt] = useState<KravId | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [sortert, setSortert] = useState<Record<KravId, string[]>>({
        ingen: [],
        mistanke: [],
        retten: [],
    });

    const handling = HANDLINGER[index];
    const erRiktig = valgt === handling?.svar;

    const velg = (id: KravId) => {
        if (phase !== 'question') return;
        setValgt(id);
        setPhase('answered');
        if (id === handling.svar) setRiktige((r) => r + 1);
        setSortert((s) => ({ ...s, [handling.svar]: [...s[handling.svar], handling.id] }));
    };

    const neste = () => {
        if (index + 1 >= HANDLINGER.length) {
            setPhase('done');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('question');
    };

    const tilbakestill = () => {
        setIndex(0);
        setValgt(null);
        setPhase('question');
        setRiktige(0);
        setSortert({ ingen: [], mistanke: [], retten: [] });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les hva politiet gjør, og velg hva som må til for at de får lov.
                    </p>
                </div>
            </div>

            {/* Fremdrift: tre bokser som fylles opp */}
            <div className="px-6 pt-4 grid grid-cols-3 gap-2">
                {KRAV.map((k) => {
                    const Ikon = k.ikon;
                    return (
                        <div
                            key={k.id}
                            className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${FARGER[k.id].merke}`}
                        >
                            <Ikon className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">{k.navn}</span>
                            <span className="ml-auto flex gap-0.5">
                                {sortert[k.id].map((id) => (
                                    <motion.span
                                        key={id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-current"
                                    />
                                ))}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {phase !== 'done' ? (
                        <motion.div
                            key={handling.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                        >
                            <p className="text-xs font-medium text-slate-400 mb-2">
                                Handling {index + 1} av {HANDLINGER.length}
                            </p>
                            <p className="text-slate-800 text-base leading-relaxed mb-5 min-h-[3rem]">
                                {handling.tekst}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {KRAV.map((k) => {
                                    const Ikon = k.ikon;
                                    const erValgt = valgt === k.id;
                                    const erSvar = phase === 'answered' && k.id === handling.svar;
                                    let ekstra = '';
                                    if (phase === 'answered') {
                                        if (erSvar) ekstra = 'ring-2 ring-emerald-400';
                                        else if (erValgt) ekstra = 'ring-2 ring-rose-400 opacity-80';
                                        else ekstra = 'opacity-50';
                                    }
                                    return (
                                        <motion.button
                                            key={k.id}
                                            type="button"
                                            whileHover={phase === 'question' ? { y: -2 } : undefined}
                                            whileTap={phase === 'question' ? { scale: 0.97 } : undefined}
                                            animate={
                                                phase === 'answered' && erValgt && !erSvar
                                                    ? { x: [0, -6, 6, -4, 4, 0] }
                                                    : { x: 0 }
                                            }
                                            onClick={() => velg(k.id)}
                                            disabled={phase !== 'question'}
                                            className={`rounded-xl border px-4 py-3 text-left ${FARGER[k.id].knapp} ${ekstra}`}
                                        >
                                            <span className="flex items-center gap-2 font-semibold text-sm">
                                                <Ikon className="w-4 h-4" />
                                                {k.navn}
                                            </span>
                                            <span className="block text-xs mt-1 opacity-80">
                                                {k.kort}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="text-center py-4"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                            >
                                <CheckCircle2 className="w-8 h-8" />
                            </motion.div>
                            <p className="text-lg font-semibold text-slate-800">
                                {riktige} av {HANDLINGER.length} riktige
                            </p>
                            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                Ser du mønsteret? Jo mer politiet griper inn i livet ditt, jo
                                strengere krav stiller loven. Å be folk flytte seg krever lite. Å
                                ransake hjemmet ditt eller holde deg innesperret krever at en dommer
                                sier ja.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'answered' ? (
                        <motion.div
                            key={`fb-${handling.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            {erRiktig ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 shrink-0" />
                            )}
                            <span>
                                <span className="font-semibold">
                                    {erRiktig ? 'Riktig! ' : 'Ikke helt. '}
                                </span>
                                {handling.forklaring}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="fb-tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'done'
                                ? 'Bra jobbet! Prøv igjen hvis du vil se alle forklaringene på nytt.'
                                : 'Velg én av de tre boksene. Du får en forklaring med en gang.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={neste}
                    disabled={phase !== 'answered'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium"
                >
                    {index + 1 >= HANDLINGER.length ? 'Se resultatet' : 'Neste'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
