import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User, Wind, Check, RotateCcw, Layers, MousePointerClick } from 'lucide-react';

interface HvemErStorstProps {
    title?: string;
}

type KortId = 'jehova' | 'jesus' | 'aand';
type TrinnId = 'topp' | 'midt' | 'bunn';
type Tone = 'noytral' | 'ok' | 'feil';

interface Kort {
    id: KortId;
    navn: string;
    ikon: typeof Crown;
    fasit: TrinnId;
    treff: string;
    bom: string;
}

interface Trinn {
    id: TrinnId;
    tittel: string;
    tekst: string;
}

const KORT: Kort[] = [
    {
        id: 'jehova',
        navn: 'Jehova',
        ikon: Crown,
        fasit: 'topp',
        treff: 'Riktig. Jehova er den eneste allmektige Gud. Ingen står over ham, og ingen står ved siden av ham.',
        bom: 'Ikke helt. Jehovas vitner mener at Jehova ikke er skapt av noen, og at han ikke er en kraft. Prøv et annet trinn.',
    },
    {
        id: 'jesus',
        navn: 'Jesus',
        ikon: User,
        fasit: 'midt',
        treff: 'Riktig. De lærer at Jesus er den første Gud skapte, og at han er underordnet Faderen.',
        bom: 'Ikke helt. Jesus er verken den allmektige Gud eller en kraft i denne læren. Han er en person, men en skapt person.',
    },
    {
        id: 'aand',
        navn: 'Den hellige ånd',
        ikon: Wind,
        fasit: 'bunn',
        treff: 'Riktig. Ånden er ingen person i det hele tatt, men kraften Gud bruker for å få ting gjort.',
        bom: 'Ikke helt. Jehovas vitner regner ikke ånden som noen, verken som Gud eller som en skapning.',
    },
];

const TRINN: Trinn[] = [
    {
        id: 'topp',
        tittel: 'Den eneste allmektige Gud',
        tekst: 'Har skapt alt. Har et eget navn.',
    },
    {
        id: 'midt',
        tittel: 'Guds første skapning',
        tekst: 'En person, men under Faderen.',
    },
    {
        id: 'bunn',
        tittel: 'Ikke en person, men en kraft',
        tekst: 'Noe Gud bruker, ikke noen Gud er.',
    },
];

const START_TEKST = 'Klikk et kort, og klikk deretter trinnet du mener det hører hjemme på.';

export function HvemErStorst({ title = 'Hvem er størst?' }: HvemErStorstProps) {
    const [plassert, setPlassert] = useState<Partial<Record<TrinnId, KortId>>>({});
    const [valgt, setValgt] = useState<KortId | null>(null);
    const [tone, setTone] = useState<Tone>('noytral');
    const [melding, setMelding] = useState(START_TEKST);
    const [rister, setRister] = useState<TrinnId | null>(null);
    const [sammenlign, setSammenlign] = useState(false);

    const antallPlassert = Object.keys(plassert).length;
    const ferdig = antallPlassert === KORT.length;
    const igjen = KORT.filter((k) => !Object.values(plassert).includes(k.id));

    const velgKort = (id: KortId) => {
        const kort = KORT.find((k) => k.id === id);
        if (!kort) return;
        setValgt(id);
        setTone('noytral');
        setMelding(`Hvor hører ${kort.navn} hjemme? Klikk et trinn.`);
    };

    const velgTrinn = (trinnId: TrinnId) => {
        if (!valgt) {
            setTone('noytral');
            setMelding('Velg et kort først, så et trinn.');
            return;
        }
        if (plassert[trinnId]) {
            setTone('noytral');
            setMelding('Det trinnet er opptatt. Prøv et annet.');
            return;
        }
        const kort = KORT.find((k) => k.id === valgt);
        if (!kort) return;

        if (kort.fasit === trinnId) {
            const nytt = { ...plassert, [trinnId]: kort.id };
            setPlassert(nytt);
            setValgt(null);
            setTone('ok');
            setMelding(
                Object.keys(nytt).length === KORT.length
                    ? 'Ferdig. Legg merke til at de tre ikke står ved siden av hverandre, men over og under.'
                    : kort.treff
            );
        } else {
            setRister(trinnId);
            setTone('feil');
            setMelding(kort.bom);
            window.setTimeout(() => setRister(null), 420);
        }
    };

    const nullstill = () => {
        setPlassert({});
        setValgt(null);
        setTone('noytral');
        setMelding(START_TEKST);
        setRister(null);
        setSammenlign(false);
    };

    const toneKlasse =
        tone === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : tone === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sett Jehova, Jesus og den hellige ånd der Jehovas vitner mener de hører
                        hjemme.
                    </p>
                </div>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {sammenlign ? (
                        <motion.div
                            key="sammenlign"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Til sammenligning: treenighetslæren
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                {['Faderen', 'Sønnen', 'Den hellige ånd'].map((navn, i) => (
                                    <motion.div
                                        key={navn}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            delay: 0.1 * i,
                                            type: 'spring',
                                            stiffness: 220,
                                        }}
                                        className="rounded-full border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm"
                                    >
                                        {navn}
                                    </motion.div>
                                ))}
                            </div>
                            <p className="mt-4 text-center text-sm text-slate-600">
                                De aller fleste kristne mener at disse tre er like store, og at de
                                er én og samme Gud. Læren ble fastsatt på kirkemøter i 325 og 381.
                                Jehovas vitner mener den ikke står i Bibelen.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stige"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid gap-5 md:grid-cols-[1fr_220px]"
                        >
                            <div className="space-y-2">
                                {TRINN.map((trinn) => {
                                    const kortId = plassert[trinn.id];
                                    const kort = KORT.find((k) => k.id === kortId);
                                    return (
                                        <motion.button
                                            key={trinn.id}
                                            type="button"
                                            onClick={() => velgTrinn(trinn.id)}
                                            animate={
                                                rister === trinn.id
                                                    ? { x: [0, -7, 7, -5, 0] }
                                                    : { x: 0 }
                                            }
                                            transition={{ duration: 0.4 }}
                                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                                kort
                                                    ? 'border-emerald-200 bg-emerald-50'
                                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {trinn.tittel}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {trinn.tekst}
                                                </p>
                                            </div>
                                            <div className="w-40 shrink-0">
                                                {kort ? (
                                                    <motion.div
                                                        layoutId={`kort-${kort.id}`}
                                                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                                                    >
                                                        <kort.ikon className="h-4 w-4 shrink-0 text-emerald-600" />
                                                        <span className="truncate text-sm font-medium text-slate-800">
                                                            {kort.navn}
                                                        </span>
                                                    </motion.div>
                                                ) : (
                                                    <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center text-xs text-slate-400">
                                                        tomt
                                                    </div>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <MousePointerClick className="h-3.5 w-3.5" />
                                    Kort
                                </p>
                                <div className="space-y-2">
                                    {igjen.map((kort) => (
                                        <motion.button
                                            key={kort.id}
                                            type="button"
                                            layoutId={`kort-${kort.id}`}
                                            onClick={() => velgKort(kort.id)}
                                            whileTap={{ scale: 0.96 }}
                                            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                                                valgt === kort.id
                                                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                                                    : 'border-slate-200 bg-white hover:border-indigo-300'
                                            }`}
                                        >
                                            <kort.ikon className="h-4 w-4 shrink-0 text-indigo-500" />
                                            <span className="truncate text-sm font-medium text-slate-800">
                                                {kort.navn}
                                            </span>
                                        </motion.button>
                                    ))}
                                    {igjen.length === 0 && (
                                        <motion.div
                                            initial={{ scale: 0.6, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 14,
                                            }}
                                            className="flex flex-col items-center gap-1 py-4 text-emerald-600"
                                        >
                                            <Check className="h-8 w-8" />
                                            <span className="text-sm font-semibold">
                                                Alle plassert
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={`mx-6 mb-4 rounded-lg border px-4 py-3 text-sm ${toneKlasse}`}>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={melding}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {sammenlign
                            ? 'Samme tre navn, helt ulik modell. Det er dette Jehovas vitner sier nei til.'
                            : melding}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-6 pb-5">
                <button
                    type="button"
                    onClick={() => setSammenlign((v) => !v)}
                    disabled={!ferdig}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        ferdig
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                    }`}
                >
                    {sammenlign ? 'Tilbake til stigen' : 'Sammenlign med treenigheten'}
                </button>
                <button
                    type="button"
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
