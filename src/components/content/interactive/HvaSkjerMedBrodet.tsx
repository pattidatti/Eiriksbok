import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, RotateCcw, Sparkles, Check, X, Minus } from 'lucide-react';

interface HvaSkjerMedBrodetProps {
    title?: string;
}

type SynId = 'katolsk' | 'luthersk' | 'zwingli' | 'calvin';
type Merke = 'ja' | 'nei' | 'delvis';

interface Rad {
    merke: Merke;
    svar: string;
    tekst: string;
}

interface Syn {
    id: SynId;
    knapp: string;
    hvem: string;
    stikkord: string;
    ser: Rad;
    vesen: Rad;
    naervaer: Rad;
    oppsummering: string;
    knappAktiv: string;
    knappHvile: string;
    kjerne: string;
    kjernefarge: string;
    figur: 'forvandlet' | 'begge' | 'minne' | 'himmel';
}

const SYN: Syn[] = [
    {
        id: 'katolsk',
        knapp: 'Katolsk',
        hvem: 'Den katolske kirken',
        stikkord: 'Transsubstansiasjon, altså vesensforvandling',
        ser: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Utseende, lukt og smak er nøyaktig som før.',
        },
        vesen: {
            merke: 'nei',
            svar: 'Nei',
            tekst: 'Ved vigslingen blir hele brødets vesen forvandlet til Kristi legemes vesen.',
        },
        naervaer: {
            merke: 'ja',
            svar: 'Ja, helt og fullt',
            tekst: 'Kristus er sant og virkelig til stede under brødets skikkelse.',
        },
        oppsummering:
            'Trientkonsilet på 1500-tallet sa at ordet transsubstansiasjon passer best på det som skjer. Læren fikk sin klassiske form hos Thomas Aquinas.',
        knappAktiv: 'border-amber-400 bg-amber-100 text-amber-900',
        knappHvile: 'border-slate-200 bg-white text-slate-600 hover:border-amber-300',
        kjerne: 'Kristi legeme',
        kjernefarge: '#f59e0b',
        figur: 'forvandlet',
    },
    {
        id: 'luthersk',
        knapp: 'Luthersk',
        hvem: 'Luther og lutherske kirker, blant dem Den norske kirke',
        stikkord: 'Realpresens, men ingen forvandling',
        ser: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Ingen kan se eller smake noen forskjell.',
        },
        vesen: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Brødet fortsetter å være brød. Luther avviste transsubstansiasjonslæren.',
        },
        naervaer: {
            merke: 'ja',
            svar: 'Ja, samtidig',
            tekst: 'Jesu legeme og blod er virkelig til stede i brødet og vinen. Dette kalles realpresens.',
        },
        oppsummering:
            'Luther holdt altså fast på to ting samtidig: brødet er fortsatt brød, og Kristus er virkelig der. Faguttrykket som ofte brukes om dette, er konsubstansiasjon.',
        knappAktiv: 'border-indigo-400 bg-indigo-100 text-indigo-900',
        knappHvile: 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300',
        kjerne: 'Brød og Kristus samtidig',
        kjernefarge: '#6366f1',
        figur: 'begge',
    },
    {
        id: 'zwingli',
        knapp: 'Zwingli',
        hvem: 'Ulrich Zwingli og den symbolske tradisjonen',
        stikkord: 'Nattverden som minnemåltid',
        ser: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Brødet er og blir vanlig brød for øynene og munnen.',
        },
        vesen: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Ingenting i selve brødet blir gjort om.',
        },
        naervaer: {
            merke: 'nei',
            svar: 'Nei, ikke i brødet',
            tekst: 'Zwingli så nattverden i hovedsak som et symbolsk minnemåltid om Jesu død.',
        },
        oppsummering:
            'For Zwingli ligger kraften i det måltidet minner om, ikke i noe som skjer inne i brødet.',
        knappAktiv: 'border-sky-400 bg-sky-100 text-sky-900',
        knappHvile: 'border-slate-200 bg-white text-slate-600 hover:border-sky-300',
        kjerne: 'Brød, og et minnemåltid',
        kjernefarge: '#0ea5e9',
        figur: 'minne',
    },
    {
        id: 'calvin',
        knapp: 'Calvin',
        hvem: 'Jean Calvin og reformerte kirker',
        stikkord: 'Åndelig nærvær, en mellomvei',
        ser: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Også her er brødet helt uforandret å se til.',
        },
        vesen: {
            merke: 'ja',
            svar: 'Ja',
            tekst: 'Brødet forblir brød. Kroppen og blodet til Jesus er i himmelen, mente Calvin, og kan ikke være i brødet samtidig.',
        },
        naervaer: {
            merke: 'delvis',
            svar: 'Ikke i brødet, men i måltidet',
            tekst: 'Calvin lærte at Jesus er åndelig nærværende når menigheten spiser sammen.',
        },
        oppsummering:
            'Calvin gikk en mellomvei mellom Luther og Zwingli: mer enn et minne, men ikke noe som sitter i selve brødet.',
        knappAktiv: 'border-violet-400 bg-violet-100 text-violet-900',
        knappHvile: 'border-slate-200 bg-white text-slate-600 hover:border-violet-300',
        kjerne: 'Brød her, Kristus i himmelen',
        kjernefarge: '#8b5cf6',
        figur: 'himmel',
    },
];

const SPORSMAL: { key: 'ser' | 'vesen' | 'naervaer'; tekst: string }[] = [
    { key: 'ser', tekst: 'Ser og smaker det fortsatt som brød?' },
    { key: 'vesen', tekst: 'Er brødet fortsatt brød i sitt vesen?' },
    { key: 'naervaer', tekst: 'Er Kristus til stede i selve brødet?' },
];

const MERKESTIL: Record<Merke, string> = {
    ja: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    nei: 'bg-rose-50 border-rose-200 text-rose-700',
    delvis: 'bg-blue-50 border-blue-200 text-blue-700',
};

function MerkeIkon({ merke }: { merke: Merke }) {
    if (merke === 'ja') return <Check className="w-3.5 h-3.5 shrink-0" />;
    if (merke === 'nei') return <X className="w-3.5 h-3.5 shrink-0" />;
    return <Minus className="w-3.5 h-3.5 shrink-0" />;
}

export function HvaSkjerMedBrodet({ title = 'Hva skjer med brødet?' }: HvaSkjerMedBrodetProps) {
    const [valgt, setValgt] = useState<SynId | null>(null);
    const [utforsket, setUtforsket] = useState<SynId[]>([]);

    const aktivt = SYN.find((s) => s.id === valgt) ?? null;
    const ferdig = utforsket.length === SYN.length;

    const velg = (id: SynId) => {
        setValgt(id);
        setUtforsket((forrige) => (forrige.includes(id) ? forrige : [...forrige, id]));
    };

    const handleReset = () => {
        setValgt(null);
        setUtforsket([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Wheat className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Presten har lest de samme ordene i alle fire kirkene. Klikk et syn og se hva
                        de mener har skjedd.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SYN.map((syn) => (
                    <motion.button
                        key={syn.id}
                        type="button"
                        onClick={() => velg(syn.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                            valgt === syn.id ? syn.knappAktiv : syn.knappHvile
                        }`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            {syn.knapp}
                            {utforsket.includes(syn.id) && valgt !== syn.id && (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                        </span>
                    </motion.button>
                ))}
            </div>

            <div className="px-5 pt-4 grid gap-4 md:grid-cols-[13rem_1fr] items-start">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <svg viewBox="0 0 200 200" className="w-full h-auto" role="img">
                        <title>Alterbrødet sett fra fire kirkelige syn</title>
                        <circle
                            cx="100"
                            cy="100"
                            r="74"
                            fill="#fdf6e3"
                            stroke="#d6cbb2"
                            strokeWidth="3"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="62"
                            fill="none"
                            stroke="#e3d9c2"
                            strokeWidth="2"
                        />
                        <AnimatePresence mode="wait">
                            {aktivt && (
                                <motion.g
                                    key={aktivt.id}
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                    style={{ transformOrigin: '100px 100px' }}
                                >
                                    {aktivt.figur === 'forvandlet' && (
                                        <motion.circle
                                            cx="100"
                                            cy="100"
                                            r={50}
                                            initial={{ r: 0 }}
                                            animate={{ r: 50 }}
                                            transition={{ duration: 0.5 }}
                                            fill={aktivt.kjernefarge}
                                            fillOpacity="0.75"
                                        />
                                    )}
                                    {aktivt.figur === 'begge' && (
                                        <>
                                            <motion.circle
                                                cx="80"
                                                cy="100"
                                                r={40}
                                                initial={{ r: 0 }}
                                                animate={{ r: 40 }}
                                                transition={{ duration: 0.45 }}
                                                fill="#e3d9c2"
                                                fillOpacity="0.9"
                                            />
                                            <motion.circle
                                                cx="120"
                                                cy="100"
                                                r={40}
                                                initial={{ r: 0 }}
                                                animate={{ r: 40 }}
                                                transition={{ duration: 0.45, delay: 0.12 }}
                                                fill={aktivt.kjernefarge}
                                                fillOpacity="0.55"
                                            />
                                        </>
                                    )}
                                    {aktivt.figur === 'minne' && (
                                        <>
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="50"
                                                fill="none"
                                                stroke={aktivt.kjernefarge}
                                                strokeWidth="3"
                                                strokeDasharray="7 7"
                                            />
                                            <motion.text
                                                x="100"
                                                y="106"
                                                textAnchor="middle"
                                                fontSize="20"
                                                fill={aktivt.kjernefarge}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                minne
                                            </motion.text>
                                        </>
                                    )}
                                    {aktivt.figur === 'himmel' && (
                                        <>
                                            <motion.circle
                                                cx="100"
                                                cy="46"
                                                r={16}
                                                initial={{ r: 0 }}
                                                animate={{ r: 16 }}
                                                transition={{ duration: 0.4, delay: 0.15 }}
                                                fill={aktivt.kjernefarge}
                                                fillOpacity="0.8"
                                            />
                                            <motion.path
                                                d="M100 132 L100 74"
                                                stroke={aktivt.kjernefarge}
                                                strokeWidth="3"
                                                strokeDasharray="6 6"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </>
                                    )}
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </svg>
                    <p className="mt-2 text-center text-xs font-medium text-slate-500">
                        {aktivt ? aktivt.kjerne : 'Ett tynt alterbrød, kalt oblat'}
                    </p>
                </div>

                <div className="space-y-2">
                    {SPORSMAL.map((sporsmal, i) => {
                        const rad = aktivt ? aktivt[sporsmal.key] : null;
                        return (
                            <div
                                key={sporsmal.key}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {sporsmal.tekst}
                                </p>
                                <AnimatePresence mode="wait">
                                    {rad ? (
                                        <motion.div
                                            key={`${aktivt?.id}-${sporsmal.key}`}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.22, delay: i * 0.08 }}
                                            className="mt-1 flex items-start gap-2"
                                        >
                                            <span
                                                className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${MERKESTIL[rad.merke]}`}
                                            >
                                                <MerkeIkon merke={rad.merke} />
                                                {rad.svar}
                                            </span>
                                            <span className="text-sm text-slate-700 leading-snug">
                                                {rad.tekst}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key={`tom-${sporsmal.key}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="mt-1 text-sm text-slate-400"
                                        >
                                            Velg et syn over.
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-5 pt-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={ferdig ? 'ferdig' : (valgt ?? 'tom')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={
                            ferdig
                                ? { type: 'spring', stiffness: 220, damping: 16 }
                                : { duration: 0.22 }
                        }
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                            ferdig
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {ferdig ? (
                            <motion.span
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            </motion.span>
                        ) : (
                            <Wheat className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span>
                            {ferdig
                                ? 'Alle fire leser de samme ordene fra Det nye testamentet: «Dette er min kropp.» Alle fire er enige om at brødet ser ut som brød. Striden står om hva det lille ordet er betyr.'
                                : aktivt
                                  ? `${aktivt.hvem}: ${aktivt.stikkord}. ${aktivt.oppsummering}`
                                  : 'Fire kirkelige syn, ett og samme brød. Klikk deg gjennom alle fire.'}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {utforsket.length} av {SYN.length} syn utforsket
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
