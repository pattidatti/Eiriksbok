import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDown,
    Briefcase,
    Bus,
    Fuel,
    GraduationCap,
    Home,
    Landmark,
    Lightbulb,
    RotateCcw,
    School,
    ShoppingCart,
    Stethoscope,
    Trophy,
    Users,
} from 'lucide-react';

// Bygdesirkelen: eleven drar innbyggertallet i en tenkt bygd nedover og ser tilbudene
// forsvinne ett etter ett. Når nok har forsvunnet, dukker den onde sirkelen opp, og eleven
// velger et distriktspolitisk tiltak som kan prøve å bryte den.
//
// Lyspære-øyeblikket: Sentralisering forsterker seg selv. Når folk flytter, forsvinner
// tilbudene, og når tilbudene forsvinner, blir det enda vanskeligere å bli boende. Derfor
// mener mange at staten må gripe inn - men tiltakene koster, og folk er uenige om de virker.
//
// Bygda er tenkt. Grensene for når et tilbud forsvinner er bare eksempler, ikke regler.
// Tiltakene er hentet fra Innst. 110 S (2023-2024) og Udir (2026).

interface BygdesirkelenProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Tilbud {
    id: string;
    navn: string;
    grense: number;
    ikon: typeof School;
    folge: string;
}

interface Tiltak {
    id: string;
    navn: string;
    ikon: typeof School;
    hjelper: string;
    men: string;
}

const MAKS = 2000;
const MIN = 200;
const STEG = 50;

const TILBUD: Tilbud[] = [
    {
        id: 'ungdomsskole',
        navn: 'Ungdomsskole',
        grense: 1600,
        ikon: GraduationCap,
        folge: 'Ungdomsskoleelevene må ta buss til nabokommunen hver dag.',
    },
    {
        id: 'bensin',
        navn: 'Bensinstasjon',
        grense: 1300,
        ikon: Fuel,
        folge: 'Nå må alle kjøre langt for å fylle tanken eller lade bilen.',
    },
    {
        id: 'lege',
        navn: 'Legekontor',
        grense: 1000,
        ikon: Stethoscope,
        folge: 'Legen kommer bare to dager i uka. Eldre må reise for å få hjelp.',
    },
    {
        id: 'barneskole',
        navn: 'Barneskole',
        grense: 700,
        ikon: School,
        folge: 'Skolen er lagt ned. Familier med små barn velger å flytte et annet sted.',
    },
    {
        id: 'butikk',
        navn: 'Butikk',
        grense: 450,
        ikon: ShoppingCart,
        folge: 'Butikken har stengt. Bygda har mistet møteplassen sin.',
    },
    {
        id: 'buss',
        navn: 'Bussrute',
        grense: 300,
        ikon: Bus,
        folge: 'Bussen går ikke lenger. Uten bil kommer du deg ikke noe sted.',
    },
];

const SIRKEL = [
    'Unge flytter for å ta utdanning og jobbe',
    'Færre barn og flere eldre blir igjen',
    'Skole, butikk og lege mister kundene sine',
    'Tilbudene legges ned',
    'Det blir mindre fristende å flytte hjem igjen',
];

const TILTAK: Tiltak[] = [
    {
        id: 'skoletilskudd',
        navn: 'Penger for å holde skolen åpen',
        ikon: School,
        hjelper:
            'Staten gir kommunene drøyt 580 000 kroner i året for hver kommunale grunnskole. Det gjør det litt lettere å beholde en liten skole.',
        men: 'En elev på en liten skole koster mer enn en elev på en stor skole. Noen mener pengene gjør mer nytte andre steder.',
    },
    {
        id: 'studielan',
        navn: 'Slette studielån for dem som flytter nordover',
        ikon: Home,
        hjelper:
            'I Finnmark og Nord-Troms kan de som bor der, få slettet noe av studielånet sitt. Målet er å lokke unge voksne og barnefamilier dit.',
        men: 'Det koster penger, og ingen vet sikkert hvor mange som blir boende over tid.',
    },
    {
        id: 'statlige-jobber',
        navn: 'Flytte statlige arbeidsplasser ut av Oslo',
        ikon: Briefcase,
        hjelper:
            'Når staten legger kontorer til mindre steder, får folk med høy utdanning jobb der. Brønnøysundregistrene er et kjent eksempel.',
        men: 'Kritikere mener at etaten kan miste ansatte med viktig erfaring hvis de ikke vil flytte med.',
    },
];

export function Bygdesirkelen({ title = 'Bygda som krymper' }: BygdesirkelenProps) {
    const [folk, setFolk] = useState(MAKS);
    const [tiltakId, setTiltakId] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');

    const borte = TILBUD.filter((t) => folk < t.grense);
    const sisteBorte = borte[borte.length - 1];
    const sirkelSynlig = borte.length >= 4;
    const tiltak = TILTAK.find((t) => t.id === tiltakId) ?? null;

    const endreFolk = (n: number) => {
        setFolk(n);
        if (phase === 'idle') setPhase('active');
    };

    const velgTiltak = (id: string) => {
        setTiltakId(id);
        setPhase('complete');
    };

    const handleReset = () => {
        setFolk(MAKS);
        setTiltakId(null);
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra i glidebryteren og se hva som skjer med bygda når folk flytter.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-[1fr_15rem]">
                <div className="space-y-4">
                    {/* Innbyggertall */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                        <div className="flex items-end justify-between">
                            <span className="text-sm font-medium text-slate-600">Innbyggere i bygda</span>
                            <motion.span
                                key={folk}
                                initial={{ scale: 1.15, color: '#4f46e5' }}
                                animate={{ scale: 1, color: '#1e293b' }}
                                className="font-display text-2xl font-bold"
                            >
                                {folk.toLocaleString('nb-NO')}
                            </motion.span>
                        </div>
                        <input
                            type="range"
                            min={MIN}
                            max={MAKS}
                            step={STEG}
                            value={MAKS + MIN - folk}
                            onChange={(e) => endreFolk(MAKS + MIN - Number(e.target.value))}
                            aria-label="Innbyggertall i bygda"
                            className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Mange bor her</span>
                            <span>Folk har flyttet</span>
                        </div>
                    </div>

                    {/* Tilbudene */}
                    <div className="grid grid-cols-3 gap-2">
                        {TILBUD.map((t) => {
                            const aapen = folk >= t.grense;
                            const Ikon = t.ikon;
                            return (
                                <motion.div
                                    key={t.id}
                                    animate={{
                                        opacity: aapen ? 1 : 0.45,
                                        scale: aapen ? 1 : 0.94,
                                        rotate: aapen ? 0 : -2,
                                    }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    className={`rounded-xl border px-2 py-3 flex flex-col items-center gap-1 text-center ${
                                        aapen
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                                            : 'bg-rose-50 border-rose-200 text-rose-700'
                                    }`}
                                >
                                    <Ikon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{t.navn}</span>
                                    <span className="text-[10px] uppercase tracking-wide">
                                        {aapen ? 'Åpen' : 'Lagt ned'}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Sirkelen og tiltakene */}
                <div className="self-start space-y-3">
                    <AnimatePresence mode="wait">
                        {!sirkelSynlig ? (
                            <motion.div
                                key="venter"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                            >
                                Når fire av tilbudene er borte, ser du hva som henger sammen her.
                                <div className="mt-2 font-semibold text-slate-700">{borte.length} av 4</div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sirkel"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                            >
                                <div className="text-[11px] uppercase tracking-wide text-amber-700 mb-2">
                                    En ond sirkel
                                </div>
                                <ol className="space-y-0.5">
                                    {SIRKEL.map((s, i) => (
                                        <motion.li
                                            key={s}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.12 }}
                                            className="text-xs text-slate-700"
                                        >
                                            <span>{s}</span>
                                            {i < SIRKEL.length - 1 && (
                                                <ArrowDown className="w-3 h-3 text-amber-500 my-0.5" />
                                            )}
                                        </motion.li>
                                    ))}
                                </ol>
                                <div className="text-[11px] text-amber-700 mt-1">... og så starter det på nytt.</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {sirkelSynlig && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-1.5"
                        >
                            <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Landmark className="w-3.5 h-3.5" /> Velg et tiltak fra staten:
                            </div>
                            {TILTAK.map((t) => {
                                const Ikon = t.ikon;
                                const er = t.id === tiltakId;
                                return (
                                    <motion.button
                                        key={t.id}
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => velgTiltak(t.id)}
                                        className={`w-full rounded-xl border px-3 py-2 text-xs text-left flex items-center gap-2 ${
                                            er
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md'
                                                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <Ikon className="w-4 h-4 shrink-0" />
                                        {t.navn}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' && tiltak ? (
                        <motion.div
                            key={`ferdig-${tiltak.id}`}
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                <span className="font-semibold">Dette kan hjelpe: </span>
                                {tiltak.hjelper}{' '}
                                <span className="font-semibold">Men: </span>
                                {tiltak.men} Ingen av tiltakene stopper sirkelen alene. Derfor
                                er politikerne uenige om hvor mye staten skal bruke på bygdene.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={sisteBorte ? sisteBorte.id : phase}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm flex gap-3 ${
                                sisteBorte
                                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}
                        >
                            <Lightbulb className="w-5 h-5 shrink-0" />
                            <span>
                                {sisteBorte
                                    ? sirkelSynlig
                                        ? `${sisteBorte.folge} Se på sirkelen til høyre, og velg et tiltak som kan bryte den.`
                                        : sisteBorte.folge
                                    : 'Alt er åpent. Dra glidebryteren mot høyre for å la folk flytte fra bygda.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                    Bygda er tenkt. Grensene er eksempler, ikke regler.
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
