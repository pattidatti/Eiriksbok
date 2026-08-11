import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Check, X, Sparkles, ArrowRight } from 'lucide-react';

interface TreKurverOgFlereKanonerProps {
    title?: string;
}

type Status = 'med' | 'utenfor';

interface Tradisjon {
    id: string;
    navn: string;
    samling: string;
    omraade: string;
}

interface Tekst {
    id: string;
    navn: string;
    sjanger: string;
    rader: Record<string, { status: Status; notat: string }>;
}

const TRADISJONER: Tradisjon[] = [
    {
        id: 'theravada',
        navn: 'Theravada',
        samling: 'Tipitaka, skrevet på pali',
        omraade: 'Sri Lanka, Myanmar, Thailand, Laos og Kambodsja',
    },
    {
        id: 'ostasia',
        navn: 'Øst-asiatisk mahayana',
        samling: 'Den kinesiske Tripitaka',
        omraade: 'Kina, Korea, Japan og Vietnam',
    },
    {
        id: 'tibet',
        navn: 'Tibetansk buddhisme',
        samling: 'Kanjur og Tenjur',
        omraade: 'Tibet, Himalaya-området og Mongolia',
    },
];

const TEKSTER: Tekst[] = [
    {
        id: 'vinaya',
        navn: 'Klosterreglene',
        sjanger: 'vinaya - regler for munker og nonner',
        rader: {
            theravada: {
                status: 'med',
                notat: 'Theravada-skolens vinaya. Den er bevart i sin helhet på pali.',
            },
            ostasia: {
                status: 'med',
                notat: 'Her brukes Dharmaguptaka-skolens vinaya.',
            },
            tibet: {
                status: 'med',
                notat: 'Her brukes Mulasarvastivada-skolens vinaya.',
            },
        },
    },
    {
        id: 'sutra',
        navn: 'Buddhas taler',
        sjanger: 'sutra - prekener og samtaler som tilskrives Buddha',
        rader: {
            theravada: {
                status: 'med',
                notat: 'Sutta-kurven, på pali.',
            },
            ostasia: {
                status: 'med',
                notat: 'De tidlige skolenes taler er hovedsakelig bevart i kinesisk oversettelse.',
            },
            tibet: {
                status: 'med',
                notat: 'Noen av de samme tekstene finnes i tibetansk oversettelse.',
            },
        },
    },
    {
        id: 'abhidharma',
        navn: 'Den systematiske læren',
        sjanger: 'abhidharma - analyse av hva virkeligheten består av',
        rader: {
            theravada: {
                status: 'med',
                notat: 'Theravada-skolens abhidhamma-tekster er bevart på pali.',
            },
            ostasia: {
                status: 'med',
                notat: 'Sarvastivada-skolens abhidharma-tekster er bare bevart i kinesisk oversettelse.',
            },
            tibet: {
                status: 'utenfor',
                notat: 'Ingen egen kanonisk abhidharma-samling. Avhandlinger som Abhidharmakosha står sentralt i stedet.',
            },
        },
    },
    {
        id: 'mahayana',
        navn: 'Mahayana-sutraene',
        sjanger: 'for eksempel Lotus-sutraen',
        rader: {
            theravada: {
                status: 'utenfor',
                notat: 'Ikke en del av theravadas Tipitaka.',
            },
            ostasia: {
                status: 'med',
                notat: 'Lotus-sutraen har spilt en uvanlig viktig rolle her.',
            },
            tibet: {
                status: 'med',
                notat: 'Kanjur samler alt som tilskrives Buddha selv, også disse.',
            },
        },
    },
    {
        id: 'kommentar',
        navn: 'Kommentarer og avhandlinger',
        sjanger: 'for eksempel Buddhaghosa og Nagarjuna',
        rader: {
            theravada: {
                status: 'utenfor',
                notat: 'Buddhaghosas kommentarer fra 400-tallet er viktige, men står utenfor de tre kurvene.',
            },
            ostasia: {
                status: 'med',
                notat: 'Den store avhandlingen Mahavibhasa finnes i dag bare i kinesisk oversettelse.',
            },
            tibet: {
                status: 'med',
                notat: 'Tenjur er en egen samling for kommentarer, på 225 bind.',
            },
        },
    },
];

export function TreKurverOgFlereKanoner({
    title = 'Hva teller som hellig skrift her?',
}: TreKurverOgFlereKanonerProps) {
    const [valgt, setValgt] = useState<string>(TRADISJONER[0].id);
    const [besokt, setBesokt] = useState<string[]>([TRADISJONER[0].id]);

    const ferdig = besokt.length === TRADISJONER.length;
    const tradisjon = TRADISJONER.find((t) => t.id === valgt) ?? TRADISJONER[0];
    const antallMed = TEKSTER.filter((t) => t.rader[valgt].status === 'med').length;

    const velg = (id: string) => {
        setValgt(id);
        setBesokt((forrige) => (forrige.includes(id) ? forrige : [...forrige, id]));
    };

    const neste = () => {
        const i = TRADISJONER.findIndex((t) => t.id === valgt);
        velg(TRADISJONER[(i + 1) % TRADISJONER.length].id);
    };

    const tilbakestill = () => {
        setValgt(TRADISJONER[0].id);
        setBesokt([TRADISJONER[0].id]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Library className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en buddhistisk tradisjon og se hvilke tekster som regnes med.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="flex flex-wrap gap-2">
                    {TRADISJONER.map((t) => {
                        const aktiv = t.id === valgt;
                        return (
                            <button
                                key={t.id}
                                onClick={() => velg(t.id)}
                                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    aktiv
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {besokt.includes(t.id) && !aktiv && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    )}
                                    {t.navn}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={tradisjon.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 text-sm text-slate-600"
                    >
                        Samlingen heter{' '}
                        <span className="font-semibold text-slate-800">{tradisjon.samling}</span>.
                        Den brukes i {tradisjon.omraade}.
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 space-y-2">
                {TEKSTER.map((tekst) => {
                    const rad = tekst.rader[valgt];
                    const med = rad.status === 'med';
                    return (
                        <motion.div
                            key={tekst.id}
                            animate={{
                                backgroundColor: med ? '#ecfdf5' : '#f8fafc',
                                borderColor: med ? '#a7f3d0' : '#e2e8f0',
                            }}
                            transition={{ duration: 0.25 }}
                            className="rounded-xl border p-3 sm:flex sm:items-start sm:gap-4"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 text-sm">{tekst.navn}</p>
                                <p className="text-xs text-slate-500">{tekst.sjanger}</p>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={valgt + tekst.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className={`mt-1 text-sm ${
                                            med ? 'text-emerald-800' : 'text-slate-600'
                                        }`}
                                    >
                                        {rad.notat}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={valgt + tekst.id + rad.status}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                    className={`mt-2 sm:mt-0 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                                        med
                                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                            : 'bg-slate-100 border-slate-200 text-slate-500'
                                    }`}
                                >
                                    {med ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                    {med ? 'Med i samlingen' : 'Utenfor samlingen'}
                                </motion.span>
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            </motion.span>
                            <span>
                                Du har sett alle tre. Ingen av listene er like. Buddhismen har ingen
                                felles hellig bok, men flere samlinger som hver for seg svarer ulikt
                                på hva som er Buddhas ord.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="underveis"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
                        >
                            {antallMed} av {TEKSTER.length} tekstgrupper er med her. Du har sett{' '}
                            {besokt.length} av {TRADISJONER.length} tradisjoner. Se hva som endrer
                            seg når du bytter.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={neste}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    Neste tradisjon
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
