import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    HelpCircle,
    PenLine,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    XCircle,
} from 'lucide-react';

type Niva = 'apenbart' | 'veiledning' | 'ikke';

interface Kort {
    id: string;
    tekst: string;
    fasit: Niva;
    hvorfor: string;
}

interface SkrevetAvHamSelvProps {
    title?: string;
}

const NIVAER: {
    id: Niva;
    navn: string;
    under: string;
    Ikon: typeof PenLine;
    ring: string;
}[] = [
    {
        id: 'apenbart',
        navn: 'Åpenbart ord',
        under: "Bahá'u'lláhs egne skrifter",
        Ikon: PenLine,
        ring: 'hover:border-indigo-400 hover:bg-indigo-50',
    },
    {
        id: 'veiledning',
        navn: 'Autorisert veiledning',
        under: 'Utpekt tolker eller valgt råd',
        Ikon: ShieldCheck,
        ring: 'hover:border-amber-400 hover:bg-amber-50',
    },
    {
        id: 'ikke',
        navn: 'Ikke bindende',
        under: 'Gjelder bare den som sa det',
        Ikon: HelpCircle,
        ring: 'hover:border-slate-400 hover:bg-slate-100',
    },
];

const KORT: Kort[] = [
    {
        id: 'aqdas',
        tekst: "Kitáb-i-Aqdas, lovboka Bahá'u'lláh skrev på arabisk rundt 1873 mens han satt fengslet i byen Akká",
        fasit: 'apenbart',
        hvorfor:
            "Dette er Bahá'u'lláhs egne ord, skrevet ned mens han levde. Boka samler lovene i bahá'í-troen. Seinere skrifter og en rekke spørsmål og svar er lagt til som tillegg.",
    },
    {
        id: 'tavle',
        tekst: "Et brev fra Bahá'u'lláh til en enkelt person, det som kalles en tavle",
        fasit: 'apenbart',
        hvorfor:
            "Bahá'u'lláh skrev tusenvis av brev, tavler og bøker. Samlet ville de fylt mer enn 100 bind, og hele denne mengden regnes som åpenbarte skrifter.",
    },
    {
        id: 'abdulbaha',
        tekst: "'Abdu'l-Bahás forklaring av hva et vers hos faren betyr",
        fasit: 'veiledning',
        hvorfor:
            "Bahá'u'lláh pekte i testamentet sitt ut sønnen 'Abdu'l-Bahá (1844-1921) som den autoriserte tolkeren av læren og som leder for troen. Han forklarer skriftene, men i bahá'í-troen regnes ikke hans egne ord som ny åpenbaring.",
    },
    {
        id: 'shoghi',
        tekst: 'Shoghi Effendis engelske oversettelse av Visshetens bok, gitt ut i 1931',
        fasit: 'veiledning',
        hvorfor:
            "Shoghi Effendi (1897-1957) ble utpekt av 'Abdu'l-Bahá til å lede bahá'í-samfunnet, og han oversatte mange av skriftene til engelsk. Ordene er Bahá'u'lláhs, men den engelske ordlyden er hans.",
    },
    {
        id: 'hus',
        tekst: 'En avgjørelse fra Det universelle rettferdighetens hus i en sak skriftene ikke sier noe om',
        fasit: 'veiledning',
        hvorfor:
            'Rådet på ni medlemmer har fullmakt til å gi regler i saker som de hellige tekstene ikke dekker uttrykkelig. Det bestemmer altså hva samfunnet skal gjøre i dag.',
    },
    {
        id: 'egen',
        tekst: 'Din egen forståelse av et vers, slik du forklarer den i en samtalegruppe',
        fasit: 'ikke',
        hvorfor:
            "Bahá'í-troen har ikke noe presteskap, og alle leser og tenker selv. Men oppgaven med å tolke læren på vegne av alle ble gitt til 'Abdu'l-Bahá, ikke til hver enkelt.",
    },
    {
        id: 'fagbok',
        tekst: "En bok om bahá'í-troen skrevet av en religionsforsker",
        fasit: 'ikke',
        hvorfor:
            "Bahá'í-referansebiblioteket skiller mellom de autoritative skriftene og tekster om bahá'í som andre har skrevet. En slik bok kan være både god og nyttig, men den er ikke en del av skriftene.",
    },
];

export function SkrevetAvHamSelv({ title = 'Hvem har siste ord?' }: SkrevetAvHamSelvProps) {
    const [steg, setSteg] = useState(0);
    const [valg, setValg] = useState<Niva | null>(null);
    const [riktige, setRiktige] = useState(0);

    const ferdig = steg >= KORT.length;
    const kort = ferdig ? KORT[KORT.length - 1] : KORT[steg];
    const erRiktig = valg !== null && valg === kort.fasit;

    const velg = (niva: Niva) => {
        if (valg !== null) return;
        setValg(niva);
        if (niva === kort.fasit) setRiktige((n) => n + 1);
    };

    const neste = () => {
        setValg(null);
        setSteg((n) => n + 1);
    };

    const nullstill = () => {
        setSteg(0);
        setValg(null);
        setRiktige(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <PenLine className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les teksten under og velg hvor mye den veier i bahá'í-troen.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                    {KORT.map((k, i) => (
                        <motion.span
                            key={k.id}
                            animate={{
                                scale: i === steg && !ferdig ? 1.35 : 1,
                                opacity: i <= steg ? 1 : 0.35,
                            }}
                            className={`block w-2 h-2 rounded-full ${
                                i < steg || ferdig ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6 pb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
                                className="inline-flex"
                            >
                                <Sparkles className="w-8 h-8 text-emerald-600" />
                            </motion.div>
                            <p className="mt-2 text-lg font-semibold text-emerald-800">
                                {riktige} av {KORT.length} riktig
                            </p>
                            <p className="mt-1 text-sm text-emerald-700 max-w-xl mx-auto">
                                Alt henger på ett spørsmål: hvem skrev det, og i hvilken rolle? I
                                bahá'í-troen regnes ordene til Bahá'u'lláh som åpenbaring. Utpekte
                                tolkere og det valgte rådet gir veiledning. Alt annet står for den
                                enkeltes egen regning.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={kort.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
                        >
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Tekst {steg + 1} av {KORT.length}
                            </p>
                            <p className="mt-1 text-base text-slate-800 leading-snug">
                                {kort.tekst}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!ferdig && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {NIVAER.map(({ id, navn, under, Ikon, ring }) => {
                            const valgt = valg === id;
                            const fasit = valg !== null && id === kort.fasit;
                            const base =
                                'rounded-xl border px-4 py-3 text-left transition-colors flex items-start gap-2';
                            const farge = fasit
                                ? 'border-emerald-300 bg-emerald-50'
                                : valgt
                                  ? 'border-rose-300 bg-rose-50'
                                  : valg !== null
                                    ? 'border-slate-200 bg-white opacity-60'
                                    : `border-slate-200 bg-white ${ring}`;
                            return (
                                <motion.button
                                    key={id}
                                    onClick={() => velg(id)}
                                    disabled={valg !== null}
                                    whileTap={valg === null ? { scale: 0.97 } : undefined}
                                    className={`${base} ${farge}`}
                                >
                                    <Ikon
                                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                                            fasit
                                                ? 'text-emerald-600'
                                                : valgt
                                                  ? 'text-rose-500'
                                                  : 'text-slate-400'
                                        }`}
                                    />
                                    <span>
                                        <span className="block text-sm font-medium text-slate-800">
                                            {navn}
                                        </span>
                                        <span className="block text-xs text-slate-500">
                                            {under}
                                        </span>
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mx-6 mb-4 min-h-[76px]">
                <AnimatePresence mode="wait">
                    {valg === null || ferdig ? (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {ferdig
                                ? 'Trykk Tilbakestill for å gå gjennom tekstene en gang til.'
                                : 'Velg ett av de tre svarene, så får du vite hvorfor.'}
                        </motion.p>
                    ) : (
                        <motion.div
                            key={`svar-${kort.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            {erRiktig ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>{kort.hvorfor}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-4">
                <button
                    onClick={neste}
                    disabled={valg === null || ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {steg === KORT.length - 1 ? 'Se resultatet' : 'Neste tekst'}
                </button>
                <button
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
