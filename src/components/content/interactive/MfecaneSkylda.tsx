import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, CloudSun, RotateCcw, Ship, Sparkles, Swords, Wheat, Coins } from 'lucide-react';

// MfecaneSkylda: eleven velger først selv hva som forklarer mfecane (krigene og
// flukten i det sørlige Afrika ca. 1815-1840), og blar så gjennom hvordan
// historikere har forklart det samme gjennom tidene.
//
// Lyspære-øyeblikket: mfecane har flere årsaker, og hvem som forteller
// historien, påvirker hvem som får skylda.
//
// Synene bygger på South African History Online (2025): The Mfecane.

interface MfecaneSkyldaProps {
    title?: string;
}

type Phase = 'velg' | 'sammenlign' | 'ferdig';
type ArsakId = 'shaka' | 'torke' | 'mais' | 'handel' | 'slaver';

interface Arsak {
    id: ArsakId;
    navn: string;
    forklaring: string;
    Ikon: typeof Swords;
}

interface Syn {
    id: string;
    hvem: string;
    tid: string;
    arsaker: ArsakId[];
    tekst: string;
}

const ARSAKER: Arsak[] = [
    {
        id: 'shaka',
        navn: 'Shakas kriger',
        forklaring: 'Zulu-hæren erobret naboene og tvang folk på flukt.',
        Ikon: Swords,
    },
    {
        id: 'torke',
        navn: 'Tørke',
        forklaring: 'Det regnet svært lite, særlig fra 1809 til 1823.',
        Ikon: CloudSun,
    },
    {
        id: 'mais',
        navn: 'Mais',
        forklaring: 'Mais trenger mer vann enn kornet folk dyrket før.',
        Ikon: Wheat,
    },
    {
        id: 'handel',
        navn: 'Handel og beite',
        forklaring: 'Høvdinger sloss om elfenbenshandelen og om gress til kveget.',
        Ikon: Coins,
    },
    {
        id: 'slaver',
        navn: 'Slavehandel',
        forklaring: 'Portugisiske slavehandlere og bønder i Kappkolonien ville ha arbeidsfolk.',
        Ikon: Ship,
    },
];

const SYN: Syn[] = [
    {
        id: 'tidlig',
        hvem: 'Tidlige europeiske fortellinger',
        tid: '1800-tallet',
        arsaker: ['shaka'],
        tekst: 'Alt var Shakas skyld. Afrikanere ble framstilt som voldelige, og det ble brukt som en grunn til at Europa skulle ta over.',
    },
    {
        id: 'omer-cooper',
        hvem: 'John Omer-Cooper',
        tid: '1966',
        arsaker: ['shaka'],
        tekst: 'Shaka sto fortsatt i midten. Men nå var poenget at afrikanere bygde nye stater, ikke bare at de sloss.',
    },
    {
        id: 'cobbing',
        hvem: 'Julian Cobbing',
        tid: '1988',
        arsaker: ['slaver'],
        tekst: 'Historien om Shaka var en «unnskyldning» som skjulte europeernes skyld. Den egentlige årsaken var jakten på slaver og arbeidsfolk.',
    },
    {
        id: 'i-dag',
        hvem: 'Historikere i dag',
        tid: 'nå',
        arsaker: ['shaka', 'torke', 'mais', 'handel', 'slaver'],
        tekst: 'Mange årsaker virket sammen. Historikerne er fortsatt uenige om hvilken som veide tyngst.',
    },
];

export function MfecaneSkylda({ title = 'Hvem fikk skylda for mfecane?' }: MfecaneSkyldaProps) {
    const [phase, setPhase] = useState<Phase>('velg');
    const [mine, setMine] = useState<ArsakId[]>([]);
    const [aktiv, setAktiv] = useState(0);
    const [sett, setSett] = useState<string[]>([]);

    const syn = SYN[aktiv];

    const veksle = (id: ArsakId) => {
        if (phase !== 'velg') return;
        setMine((liste) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]));
    };

    const startSammenlign = () => {
        setPhase('sammenlign');
        setAktiv(0);
        setSett([SYN[0].id]);
    };

    const visSyn = (i: number) => {
        setAktiv(i);
        const nye = sett.includes(SYN[i].id) ? sett : [...sett, SYN[i].id];
        setSett(nye);
        if (nye.length === SYN.length) setPhase('ferdig');
    };

    const reset = () => {
        setPhase('velg');
        setMine([]);
        setAktiv(0);
        setSett([]);
    };

    // Hvilket syn ligner mest på elevens eget valg? Flest felles årsaker, færrest avvik.
    const likest = SYN.reduce(
        (best, s) => {
            const felles = s.arsaker.filter((a) => mine.includes(a)).length;
            const avvik =
                s.arsaker.filter((a) => !mine.includes(a)).length +
                mine.filter((a) => !s.arsaker.includes(a)).length;
            const poeng = felles * 3 - avvik;
            return poeng > best.poeng ? { syn: s, poeng } : best;
        },
        { syn: SYN[0], poeng: -Infinity }
    ).syn;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'velg'
                            ? 'Trykk på de årsakene du tror forklarer krigene og flukten.'
                            : 'Trykk på hver historiker og se hvilke årsaker de la vekt på.'}
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5">
                {phase !== 'velg' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {SYN.map((s, i) => {
                            const valgt = i === aktiv;
                            const harSett = sett.includes(s.id);
                            return (
                                <motion.button
                                    key={s.id}
                                    onClick={() => visSyn(i)}
                                    whileTap={{ scale: 0.96 }}
                                    animate={valgt ? { y: -2 } : { y: 0 }}
                                    className={`rounded-xl border px-3 py-2 text-left ${
                                        valgt
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:shadow-md'
                                    }`}
                                >
                                    <p className="text-[11px] uppercase tracking-wide opacity-70 flex items-center gap-1">
                                        {s.tid}
                                        {harSett && !valgt && <Check className="w-3 h-3" />}
                                    </p>
                                    <p className="text-sm font-semibold leading-tight">{s.hvem}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ARSAKER.map(({ id, navn, forklaring, Ikon }) => {
                        const minValgt = mine.includes(id);
                        const synValgt = phase !== 'velg' && syn.arsaker.includes(id);
                        const lys = phase === 'velg' ? minValgt : synValgt;
                        return (
                            <motion.button
                                key={id}
                                onClick={() => veksle(id)}
                                disabled={phase !== 'velg'}
                                whileTap={phase === 'velg' ? { scale: 0.95 } : undefined}
                                animate={{
                                    scale: lys ? 1.03 : 1,
                                    opacity: phase !== 'velg' && !synValgt ? 0.45 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className={`relative rounded-xl border px-3 py-2.5 text-left ${
                                    lys
                                        ? 'bg-amber-50 border-amber-300 shadow-md'
                                        : 'bg-white border-slate-200'
                                } ${phase === 'velg' ? 'hover:shadow-md' : ''}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Ikon
                                        className={`w-4 h-4 shrink-0 ${lys ? 'text-amber-600' : 'text-slate-400'}`}
                                    />
                                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                                        {navn}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">{forklaring}</p>
                                {phase !== 'velg' && minValgt && (
                                    <span className="absolute -top-2 -right-2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-1.5 py-0.5">
                                        ditt valg
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="mx-6 mb-4 min-h-[76px]">
                <AnimatePresence mode="wait">
                    {phase === 'ferdig' ? (
                        <motion.div
                            key={`ferdig-${aktiv}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <div className="flex items-center gap-2 font-semibold mb-1">
                                <motion.span
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 0.8, repeat: 2 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Samme hendelse, fire forklaringer
                            </div>
                            <p className="mb-1">
                                <span className="font-semibold">{syn.hvem}:</span> {syn.tekst}
                            </p>
                            <p>
                                Ditt valg ligner mest på: <span className="font-semibold">{likest.hvem}</span>.
                                Den som forteller historien, påvirker ofte hvem som får skylda.
                            </p>
                        </motion.div>
                    ) : phase === 'sammenlign' ? (
                        <motion.div
                            key={`syn-${aktiv}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            <span className="font-semibold">
                                {syn.hvem} ({syn.tid}):
                            </span>{' '}
                            {syn.tekst}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`velg-${mine.length}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {mine.length === 0
                                ? 'Du kan velge én eller flere årsaker. Det finnes ikke ett fasitsvar her.'
                                : `Du har valgt ${mine.length} ${mine.length === 1 ? 'årsak' : 'årsaker'}. Sammenlign med historikerne når du er klar.`}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'velg' ? (
                    <button
                        onClick={startSammenlign}
                        disabled={mine.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Se hva historikerne mente
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'ferdig'
                            ? 'Ferdig!'
                            : `${sett.length} av ${SYN.length} forklaringer sett`}
                    </span>
                )}
                <button
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
