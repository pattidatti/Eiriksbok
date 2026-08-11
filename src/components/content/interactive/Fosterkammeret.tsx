import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Baby,
    BookOpen,
    Ear,
    Eye,
    Hand,
    HeartHandshake,
    RotateCcw,
    Sparkles,
    Sprout,
    Wind,
} from 'lucide-react';

interface FosterkammeretProps {
    title?: string;
}

type Evne = {
    id: string;
    navn: string;
    Ikon: typeof Eye;
    naa: string;
    etterpaa: string;
};

type Runde = {
    id: string;
    merkelapp: string;
    kammer: string;
    kammerFarge: string;
    prikkFarge: string;
    utenfor: string;
    utenforFarge: string;
    knapp: string;
    ledetekst: string;
    kolonneNaa: string;
    kolonneEtter: string;
    avslutning: string;
    evner: Evne[];
};

const RUNDER: Runde[] = [
    {
        id: 'foster',
        merkelapp: 'Runde 1 av 2',
        kammer: 'I mors liv',
        kammerFarge: 'bg-rose-50',
        prikkFarge: '#fb7185',
        utenfor: 'Ute i verden',
        utenforFarge: 'bg-sky-50',
        knapp: 'Bli født',
        ledetekst:
            'Klikk fram de fire evnene fosteret bygger opp. Se hva de kan brukes til der inne.',
        kolonneNaa: 'Nytten der inne',
        kolonneEtter: 'Nytten etterpå',
        avslutning:
            "Fosteret bygde opp fire evner det ikke fikk brukt til noe der inne. Først da kammeret åpnet seg, ga de mening. Bahá'u'lláh bruker akkurat dette bildet: verden etter døden er like annerledes fra denne verden som denne verden er fra barnets verden i mors liv.",
        evner: [
            {
                id: 'oyne',
                navn: 'Øyne',
                Ikon: Eye,
                naa: 'Det er mørkt her inne. Ingenting å se på.',
                etterpaa: 'Lys, farger og ansikter.',
            },
            {
                id: 'orer',
                navn: 'Ører',
                Ikon: Ear,
                naa: 'Lyden er dempet. Ordene betyr ingenting ennå.',
                etterpaa: 'Språk, navn og musikk.',
            },
            {
                id: 'hender',
                navn: 'Hender',
                Ikon: Hand,
                naa: 'Ingenting å gripe. Nesten ingen plass.',
                etterpaa: 'Alt du skal holde, lage og gi bort.',
            },
            {
                id: 'lunger',
                navn: 'Lunger',
                Ikon: Wind,
                naa: 'Fosteret puster ikke. Oksygenet kommer gjennom navlestrengen.',
                etterpaa: 'Første pust. Uten den stopper alt.',
            },
        ],
    },
    {
        id: 'sjel',
        merkelapp: 'Runde 2 av 2',
        kammer: 'I dette livet',
        kammerFarge: 'bg-indigo-50',
        prikkFarge: '#818cf8',
        utenfor: 'I den neste verdenen',
        utenforFarge: 'bg-amber-50',
        knapp: "Se hva bahá'íer tror skjer ved døden",
        ledetekst:
            "Samme mekanikk, nytt kammer. Klikk fram fire ting bahá'íer mener sjelen øver på i dette livet.",
        kolonneNaa: 'Slik øver du nå',
        kolonneEtter: "Det bahá'íer tror det blir til",
        avslutning:
            "Merk én forskjell: øynene til fosteret var ubrukelige der inne, men bønn, kunnskap, gode egenskaper og tjeneste har nytte her og nå også. Bahá'í-troen sier at himmel og helvete ikke er steder, men tilstander: nærhet til Gud eller avstand fra Gud. Og reisen tar aldri slutt.",
        evner: [
            {
                id: 'bonn',
                navn: 'Bønn',
                Ikon: Sprout,
                naa: 'Du ber og mediterer, men ser ikke Gud med øynene.',
                etterpaa: 'Sjelen fortsetter mot Guds nærvær. Rikdommen der er nærhet til Gud.',
            },
            {
                id: 'kunnskap',
                navn: 'Kunnskap',
                Ikon: BookOpen,
                naa: 'Du leser, lærer og prøver å forstå.',
                etterpaa: 'Sjelen kan fortsette å utvikle seg videre, også etter døden.',
            },
            {
                id: 'dyder',
                navn: 'Gode egenskaper',
                Ikon: HeartHandshake,
                naa: 'Du øver på ærlighet, tålmodighet og vennlighet.',
                etterpaa:
                    "Å være fylt av gode egenskaper er ifølge 'Abdu'l-Bahá det virkelige paradiset.",
            },
            {
                id: 'tjeneste',
                navn: 'Tjeneste',
                Ikon: Hand,
                naa: 'Du hjelper andre og gjør noe for fellesskapet.',
                etterpaa:
                    "Bahá'í-skriftene sier at gode egenskaper vokser fram i tjeneste for andre, ikke ved å se innover.",
            },
        ],
    },
];

const PRIKK_POSISJONER = [
    { cx: 78, cy: 62 },
    { cx: 122, cy: 62 },
    { cx: 78, cy: 98 },
    { cx: 122, cy: 98 },
];

export function Fosterkammeret({ title = 'Fosterkammeret' }: FosterkammeretProps) {
    const [rundeNr, setRundeNr] = useState(0);
    const [utviklet, setUtviklet] = useState<string[]>([]);
    const [foedt, setFoedt] = useState(false);
    const [melding, setMelding] = useState<string | null>(null);

    const runde = RUNDER[rundeNr];
    const alleUtviklet = utviklet.length === runde.evner.length;
    const ferdig = foedt && rundeNr === RUNDER.length - 1;

    const handleUtvikle = (evne: Evne) => {
        if (utviklet.includes(evne.id) || foedt) return;
        setUtviklet((u) => [...u, evne.id]);
        setMelding(`${evne.navn}: ${evne.naa}`);
    };

    const handleFoedsel = () => {
        setFoedt(true);
        setMelding(null);
    };

    const handleNesteRunde = () => {
        setRundeNr(1);
        setUtviklet([]);
        setFoedt(false);
        setMelding(null);
    };

    const handleReset = () => {
        setRundeNr(0);
        setUtviklet([]);
        setFoedt(false);
        setMelding(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Baby className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{runde.ledetekst}</p>
                </div>
            </div>

            <motion.div
                key={`${runde.id}-${foedt ? 'ute' : 'inne'}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className={`px-5 py-4 ${foedt ? runde.utenforFarge : runde.kammerFarge}`}
            >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0">
                        <svg width="200" height="160" viewBox="0 0 200 160" aria-hidden="true">
                            <motion.ellipse
                                cx="100"
                                cy="80"
                                rx="72"
                                ry="58"
                                fill="#ffffff"
                                stroke={runde.prikkFarge}
                                strokeWidth="2"
                                initial={false}
                                animate={
                                    foedt
                                        ? { rx: 88, ry: 20, opacity: 0.25 }
                                        : { rx: 72, ry: 58, opacity: 1 }
                                }
                                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                            {runde.evner.map((evne, i) => {
                                const pos = PRIKK_POSISJONER[i];
                                const er = utviklet.includes(evne.id);
                                return (
                                    <motion.circle
                                        key={evne.id}
                                        cx={pos.cx}
                                        cy={pos.cy}
                                        r={2}
                                        fill={runde.prikkFarge}
                                        initial={false}
                                        animate={
                                            foedt
                                                ? { r: 6, cy: pos.cy - 34, opacity: 0.9 }
                                                : { r: er ? 11 : 2, cy: pos.cy, opacity: 1 }
                                        }
                                        transition={{
                                            type: 'spring',
                                            stiffness: 220,
                                            damping: 16,
                                            delay: foedt ? i * 0.08 : 0,
                                        }}
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">
                                {runde.merkelapp}
                            </span>
                            <span>{foedt ? runde.utenfor : runde.kammer}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {runde.evner.map((evne) => {
                                const er = utviklet.includes(evne.id);
                                const Ikon = evne.Ikon;
                                return (
                                    <motion.button
                                        key={evne.id}
                                        onClick={() => handleUtvikle(evne)}
                                        whileTap={er || foedt ? undefined : { scale: 0.96 }}
                                        animate={{ scale: 1 }}
                                        className={`text-left rounded-xl border px-3 py-2 ${
                                            foedt
                                                ? 'bg-white border-emerald-200'
                                                : er
                                                  ? 'bg-white border-slate-300'
                                                  : 'bg-white/70 border-dashed border-slate-300 hover:border-indigo-400 hover:shadow-md'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                initial={false}
                                                animate={{
                                                    scale: er ? 1 : 0.75,
                                                    opacity: er ? 1 : 0.4,
                                                }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 14,
                                                }}
                                            >
                                                <Ikon
                                                    className={`w-4 h-4 ${
                                                        foedt
                                                            ? 'text-emerald-600'
                                                            : 'text-slate-500'
                                                    }`}
                                                />
                                            </motion.span>
                                            <span className="text-sm font-semibold text-slate-800">
                                                {evne.navn}
                                            </span>
                                        </span>
                                        <span className="block text-[11px] leading-snug mt-1 min-h-[42px]">
                                            {!er ? (
                                                <span className="text-slate-400">
                                                    Klikk for å utvikle
                                                </span>
                                            ) : foedt ? (
                                                <span className="text-emerald-700">
                                                    <span className="block text-[10px] uppercase tracking-wide text-emerald-500">
                                                        {runde.kolonneEtter}
                                                    </span>
                                                    {evne.etterpaa}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">
                                                    <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                                                        {runde.kolonneNaa}
                                                    </span>
                                                    {evne.naa}
                                                </span>
                                            )}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {foedt ? (
                        <motion.div
                            key={`ferdig-${runde.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                {runde.utenfor}
                            </span>
                            <p className="mt-1">{runde.avslutning}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={melding ?? `tom-${runde.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                melding
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                        >
                            {melding ?? 'Ingen av evnene er utviklet ennå. Klikk på en av dem.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {!foedt && (
                        <button
                            onClick={handleFoedsel}
                            disabled={!alleUtviklet}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                        >
                            {runde.knapp}
                        </button>
                    )}
                    {foedt && rundeNr === 0 && (
                        <button
                            onClick={handleNesteRunde}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                        >
                            Nå sjelen i dette livet
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                    <span className="text-xs text-slate-500">
                        {ferdig
                            ? 'Begge kamrene er åpnet'
                            : `${utviklet.length} av ${runde.evner.length} utviklet`}
                    </span>
                </div>
                <button
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
