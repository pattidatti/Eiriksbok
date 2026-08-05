import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    MessageSquare,
    Hammer,
    Baby,
    DoorClosed,
    RotateCcw,
    Sparkles,
    Check,
} from 'lucide-react';

// Lyspære: staten brukte de samme fire grepene mot alle fem nasjonale
// minoritetene - språket, levebrødet, barna og retten til å være her - men i
// ulik kombinasjon. Ingen ble rammet av alt. Alle mistet noe.

type GrepId = 'sprak' | 'levebrod' | 'barna' | 'adgang';

interface Grep {
    rammet: boolean;
    fakta: string;
}

interface Folk {
    id: string;
    navn: string;
    kort: string;
    farge: string;
    grep: Record<GrepId, Grep>;
}

interface MinoritetsMatrisenProps {
    title?: string;
    folk?: Folk[];
    innsikt?: string;
}

const GREP_META: { id: GrepId; navn: string; Ikon: typeof Users }[] = [
    { id: 'sprak', navn: 'Språket', Ikon: MessageSquare },
    { id: 'levebrod', navn: 'Levebrødet', Ikon: Hammer },
    { id: 'barna', navn: 'Barna', Ikon: Baby },
    { id: 'adgang', navn: 'Retten til å være her', Ikon: DoorClosed },
];

const DEFAULT_FOLK: Folk[] = [
    {
        id: 'kvener',
        navn: 'Kvener',
        kort: 'Finsktalende innvandrere som slo seg ned i Finnmark, Troms og nordre Nordland.',
        farge: 'sky',
        grep: {
            sprak: {
                rammet: true,
                fakta: 'Finsk ble forbudt som undervisningsspråk i skolen i 1936. Kvensk ble først godkjent som eget språk i 2005.',
            },
            levebrod: {
                rammet: true,
                fakta: 'Jordsalgsloven av 1902 ga bare folk som kunne norsk lov til å kjøpe jord i Finnmark.',
            },
            barna: {
                rammet: false,
                fakta: 'Kvenske barn ble ikke tatt fra foreldrene. Men skolen tok språket deres.',
            },
            adgang: {
                rammet: false,
                fakta: 'Kvenene fikk bo i Norge. I 1875 var hver fjerde innbygger i Finnmark kven.',
            },
        },
    },
    {
        id: 'skogfinner',
        navn: 'Skogfinner',
        kort: 'Finske bønder som kom til skogene på Østlandet fra 1640-årene. Området heter Finnskogen.',
        farge: 'emerald',
        grep: {
            sprak: {
                rammet: true,
                fakta: 'Den finske dialekten savolaks levde noen steder til midt på 1900-tallet. Så forsvant den helt.',
            },
            levebrod: {
                rammet: true,
                fakta: 'Svedjebruket, å brenne granskog og så rug i asken, bar hele kulturen. Det tok slutt tidlig på 1900-tallet.',
            },
            barna: {
                rammet: false,
                fakta: 'Skogfinske barn ble ikke tatt fra hjemmet. Språket forsvant likevel på én til to generasjoner.',
            },
            adgang: {
                rammet: false,
                fakta: 'Skogfinnene ble ønsket velkommen. Svedjebruket deres gjorde skogen om til åker.',
            },
        },
    },
    {
        id: 'romanifolket',
        navn: 'Romanifolket',
        kort: 'Også kalt taterne eller de reisende. De har vært i Norge siden 1500-tallet.',
        farge: 'amber',
        grep: {
            sprak: {
                rammet: true,
                fakta: 'På arbeidskolonien Svanviken var det forbudt å snakke romani og å spille musikken sin.',
            },
            levebrod: {
                rammet: true,
                fakta: 'Å leve på reisefot ble gjort straffbart. Løsgjengerloven kunne gi tvangsarbeid.',
            },
            barna: {
                rammet: true,
                fakta: 'Rundt 1500 barn ble tatt fra foreldrene mellom 1900 og 1959. Det var nesten tre av ti barn som ble født.',
            },
            adgang: {
                rammet: true,
                fakta: 'En forordning fra 1584 påla dem å forlate landet. Fra 1589 kunne lederne dømmes til døden.',
            },
        },
    },
    {
        id: 'rom',
        navn: 'Rom',
        kort: 'Tidligere kalt sigøynere. De kom til Norge i siste halvdel av 1800-tallet.',
        farge: 'rose',
        grep: {
            sprak: {
                rammet: false,
                fakta: 'Romanes lever fortsatt i Norge og er i dag et nasjonalt minoritetsspråk.',
            },
            levebrod: {
                rammet: false,
                fakta: 'Rom ble ikke tvangsbosatt slik romanifolket ble på Svanviken.',
            },
            barna: {
                rammet: false,
                fakta: 'Det var romanifolket, ikke rom, som mistet barna sine til barnehjemmene.',
            },
            adgang: {
                rammet: true,
                fakta: 'Fremmedloven av 1927 nektet sigøynere adgang til Norge. I 1934 ble 68 rom avvist på grensen, de fleste født her. Loven ble endret i 1956.',
            },
        },
    },
    {
        id: 'joder',
        navn: 'Jøder',
        kort: 'Et folk med opprinnelse i Midtøsten. De fikk ikke lov til å bo i Norge før i 1851.',
        farge: 'violet',
        grep: {
            sprak: {
                rammet: false,
                fakta: 'Staten prøvde ikke å ta språket fra jødene i Norge.',
            },
            levebrod: {
                rammet: false,
                fakta: 'Etter 1851 kunne jøder bo og arbeide i Norge på lik linje med andre.',
            },
            barna: {
                rammet: false,
                fakta: 'Jødiske barn ble ikke tatt fra foreldrene. Men under okkupasjonen ble 773 jøder deportert, og bare 38 kom tilbake.',
            },
            adgang: {
                rammet: true,
                fakta: 'Grunnloven av 1814 slo fast at jøder ikke hadde adgang til riket. Forbudet falt i 1851, etter Henrik Wergelands kamp.',
            },
        },
    },
];

const KNAPP_FARGE: Record<string, { valgt: string; hvile: string }> = {
    sky: { valgt: 'bg-sky-600 text-white border-sky-600', hvile: 'border-sky-200 text-sky-700 hover:bg-sky-50' },
    emerald: {
        valgt: 'bg-emerald-600 text-white border-emerald-600',
        hvile: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    },
    amber: {
        valgt: 'bg-amber-600 text-white border-amber-600',
        hvile: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    },
    rose: { valgt: 'bg-rose-600 text-white border-rose-600', hvile: 'border-rose-200 text-rose-700 hover:bg-rose-50' },
    violet: {
        valgt: 'bg-violet-600 text-white border-violet-600',
        hvile: 'border-violet-200 text-violet-700 hover:bg-violet-50',
    },
};

export function MinoritetsMatrisen({
    title = 'Fire grep, fem folk',
    folk = DEFAULT_FOLK,
    innsikt = 'Ingen av de fem folkene ble rammet av alt. Men alle mistet noe. Det er dette som er assimilering: staten trenger ikke å bruke vold for å få en kultur til å forsvinne. Det holder å gjøre den vanskelig nok å leve med.',
}: MinoritetsMatrisenProps) {
    const [valgtId, setValgtId] = useState<string | null>(null);
    const [sett, setSett] = useState<string[]>([]);

    const valgt = folk.find((f) => f.id === valgtId) ?? null;
    const ferdig = sett.length === folk.length;

    const velg = (id: string) => {
        setValgtId(id);
        setSett((s) => (s.includes(id) ? s : [...s, id]));
    };

    const tilbakestill = () => {
        setValgtId(null);
        setSett([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk på et folk og se hvilke grep som rammet akkurat dem.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 pt-5">
                <div className="flex flex-wrap gap-2">
                    {folk.map((f) => {
                        const erValgt = f.id === valgtId;
                        const erSett = sett.includes(f.id);
                        const farge = KNAPP_FARGE[f.farge] ?? KNAPP_FARGE.sky;
                        return (
                            <motion.button
                                key={f.id}
                                onClick={() => velg(f.id)}
                                whileTap={{ scale: 0.96 }}
                                className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 ${
                                    erValgt ? farge.valgt : `bg-white ${farge.hvile}`
                                }`}
                            >
                                {erSett && !erValgt && <Check className="w-3.5 h-3.5" />}
                                {f.navn}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Matrisen for valgt folk */}
                <AnimatePresence mode="wait">
                    {valgt ? (
                        <motion.div
                            key={valgt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                            className="mt-5"
                        >
                            <p className="text-sm text-slate-600 mb-4">{valgt.kort}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GREP_META.map(({ id, navn, Ikon }, i) => {
                                    const celle = valgt.grep[id];
                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 + i * 0.06 }}
                                            className={`rounded-xl border p-4 ${
                                                celle.rammet
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : 'bg-slate-50 border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Ikon
                                                    className={`w-4 h-4 shrink-0 ${
                                                        celle.rammet ? 'text-rose-600' : 'text-slate-400'
                                                    }`}
                                                />
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        celle.rammet ? 'text-rose-800' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {navn}
                                                </span>
                                                <span
                                                    className={`ml-auto text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                        celle.rammet
                                                            ? 'bg-rose-600 text-white'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {celle.rammet ? 'Rammet' : 'Ikke slik'}
                                                </span>
                                            </div>
                                            <p
                                                className={`text-sm leading-relaxed ${
                                                    celle.rammet ? 'text-rose-900' : 'text-slate-600'
                                                }`}
                                            >
                                                {celle.fakta}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-5 text-sm text-slate-400 italic"
                        >
                            Velg et folk over for å se de fire grepene.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                            >
                                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                            </motion.span>
                            <span className="leading-relaxed">{innsikt}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="teller"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {sett.length} av {folk.length} folk utforsket. Se på alle fem, så dukker
                            mønsteret opp.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <div className="flex gap-1.5" aria-hidden="true">
                    {folk.map((f) => (
                        <motion.span
                            key={f.id}
                            animate={{ scale: sett.includes(f.id) ? 1 : 0.7 }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                sett.includes(f.id) ? 'bg-indigo-500' : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
