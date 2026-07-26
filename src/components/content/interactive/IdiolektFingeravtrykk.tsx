import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, MapPin, Users, Sparkles, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: hvert enkelt språkvalg deler du med tusenvis av andre,
// men KOMBINASJONEN av alle valgene dine er din helt alene. Det er idiolekten din.

type Kilde = 'sted' | 'miljo' | 'vane';

interface Valg {
    ord: string;
    kilde: Kilde;
    spor: string;
}

interface Sporsmal {
    id: string;
    tekst: string;
    valg: Valg[];
}

interface IdiolektFingeravtrykkProps {
    title?: string;
    questions?: Sporsmal[];
}

const KILDE_META: Record<Kilde, { navn: string; farge: string; strek: string; ring: string }> = {
    sted: {
        navn: 'Stedet du vokste opp',
        farge: 'text-sky-700 bg-sky-50 border-sky-200',
        strek: '#0284c7',
        ring: 'ring-sky-300',
    },
    miljo: {
        navn: 'Folkene rundt deg',
        farge: 'text-violet-700 bg-violet-50 border-violet-200',
        strek: '#7c3aed',
        ring: 'ring-violet-300',
    },
    vane: {
        navn: 'Din egen vane',
        farge: 'text-amber-700 bg-amber-50 border-amber-200',
        strek: '#d97706',
        ring: 'ring-amber-300',
    },
};

const KILDE_IKON: Record<Kilde, typeof MapPin> = {
    sted: MapPin,
    miljo: Users,
    vane: Sparkles,
};

const STANDARD_SPORSMAL: Sporsmal[] = [
    {
        id: 'jeg',
        tekst: 'Hva sier du om deg selv?',
        valg: [
            { ord: 'jeg', kilde: 'sted', spor: 'Vanlig på Østlandet og i skriftspråket.' },
            { ord: 'eg', kilde: 'sted', spor: 'Vanlig på Vestlandet og i Agder.' },
            { ord: 'æ', kilde: 'sted', spor: 'Vanlig i Trøndelag og Nord-Norge.' },
            { ord: 'e', kilde: 'sted', spor: 'Kort form du hører flere steder på Vestlandet.' },
        ],
    },
    {
        id: 'ikke',
        tekst: 'Hvordan sier du «ikke»?',
        valg: [
            { ord: 'ikke', kilde: 'sted', spor: 'Formen som ligger nærmest bokmål.' },
            { ord: 'ikkje', kilde: 'sted', spor: 'Brukes i store deler av Vest- og Nord-Norge.' },
            { ord: 'itj', kilde: 'sted', spor: 'Et tydelig trøndersk kjennetegn.' },
            { ord: 'kke', kilde: 'vane', spor: 'Rask talespråksform mange bruker uten å merke det.' },
        ],
    },
    {
        id: 'fyllord',
        tekst: 'Hvilket fyllord kommer oftest ut av munnen din?',
        valg: [
            { ord: 'lissom', kilde: 'miljo', spor: 'Et fyllord mange ungdommer deler.' },
            { ord: 'altså', kilde: 'vane', spor: 'Litt mer voksent, men helt vanlig.' },
            { ord: 'på en måte', kilde: 'vane', spor: 'En lengre variant som gir deg tenketid.' },
            { ord: 'serr', kilde: 'miljo', spor: 'Kortform av «seriøst», typisk ungdomsspråk.' },
        ],
    },
    {
        id: 'enig',
        tekst: 'Hva sier du når du er enig?',
        valg: [
            { ord: 'jepp', kilde: 'vane', spor: 'Kort og kjapt. Mange plukker det opp fra engelsk.' },
            { ord: 'jada', kilde: 'vane', spor: 'Mykere, litt mer avslappet.' },
            { ord: 'mhm', kilde: 'vane', spor: 'Nesten et ord. Lyd er også en del av språket ditt.' },
            { ord: 'stemmer', kilde: 'miljo', spor: 'Litt mer formelt. Vanlig i skole og jobb.' },
        ],
    },
    {
        id: 'hilsen',
        tekst: 'Hvordan starter du en melding til en venn?',
        valg: [
            { ord: 'hei', kilde: 'vane', spor: 'Den trygge klassikeren.' },
            { ord: 'heisann', kilde: 'vane', spor: 'Litt blidere. Sier noe om tonen din.' },
            { ord: 'yo', kilde: 'miljo', spor: 'Lånt fra engelsk gjennom musikk og nett.' },
            { ord: 'du?', kilde: 'miljo', spor: 'Går rett på sak. Vanlig blant venner.' },
        ],
    },
    {
        id: 'bra',
        tekst: 'Hva sier du når noe er skikkelig bra?',
        valg: [
            { ord: 'sykt bra', kilde: 'miljo', spor: 'Forsterkeren mange unge bruker nå.' },
            { ord: 'heilt konge', kilde: 'sted', spor: 'Blander dialektform og ungdomsord.' },
            { ord: 'helt rått', kilde: 'miljo', spor: 'Har spredt seg fra sport og gaming.' },
            { ord: 'digg', kilde: 'vane', spor: 'Kort, positivt og lett å gjenta.' },
        ],
    },
];

type Phase = 'idle' | 'active' | 'complete';

export function IdiolektFingeravtrykk({
    title = 'Ditt språklige fingeravtrykk',
    questions = STANDARD_SPORSMAL,
}: IdiolektFingeravtrykkProps) {
    const [svar, setSvar] = useState<Record<string, number>>({});
    const [sist, setSist] = useState<{ ord: string; kilde: Kilde; spor: string } | null>(null);

    const antallSvar = Object.keys(svar).length;
    const totalt = questions.length;
    const phase: Phase = antallSvar === 0 ? 'idle' : antallSvar < totalt ? 'active' : 'complete';

    const kombinasjoner = useMemo(() => {
        let n = 1;
        questions.forEach((q, i) => {
            if (i < antallSvar) n *= q.valg.length;
        });
        return antallSvar === 0 ? 0 : n;
    }, [antallSvar, questions]);

    const maksKombinasjoner = useMemo(
        () => questions.reduce((acc, q) => acc * q.valg.length, 1),
        [questions]
    );

    const velg = (q: Sporsmal, i: number) => {
        setSvar((s) => ({ ...s, [q.id]: i }));
        setSist({ ord: q.valg[i].ord, kilde: q.valg[i].kilde, spor: q.valg[i].spor });
    };

    const nullstill = () => {
        setSvar({});
        setSist(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg ordet du selv bruker i hver linje. Se hva kombinasjonen din blir.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[1fr_180px]">
                {/* Spørsmålene */}
                <div className="space-y-3">
                    {questions.map((q) => {
                        const valgt = svar[q.id];
                        return (
                            <div key={q.id}>
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">
                                    {q.tekst}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {q.valg.map((v, i) => {
                                        const aktiv = valgt === i;
                                        const meta = KILDE_META[v.kilde];
                                        return (
                                            <motion.button
                                                key={v.ord}
                                                onClick={() => velg(q, i)}
                                                whileTap={{ scale: 0.94 }}
                                                animate={aktiv ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                                                transition={{ duration: 0.28 }}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                                    aktiv
                                                        ? `${meta.farge} ring-2 ${meta.ring}`
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {v.ord}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Fingeravtrykket */}
                <div className="flex md:flex-col items-center justify-center gap-4">
                    <Avtrykk
                        questions={questions}
                        svar={svar}
                        ferdig={phase === 'complete'}
                    />
                    <div className="text-center">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Mulige kombinasjoner
                        </p>
                        <motion.p
                            key={kombinasjoner}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                            className="text-2xl font-bold text-indigo-600 tabular-nums"
                        >
                            {kombinasjoner.toLocaleString('nb-NO')}
                        </motion.p>
                        <p className="text-[11px] text-slate-400">
                            {antallSvar} av {totalt} valg
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="font-semibold">
                                Du er 1 av {maksKombinasjoner.toLocaleString('nb-NO')}.
                            </span>{' '}
                            Hvert enkelt ord her deler du med mange. Men akkurat denne
                            kombinasjonen er det få eller ingen andre som har. Og dette er bare{' '}
                            {totalt} valg. Språket ditt består av tusenvis. Det er idiolekten din.
                        </motion.div>
                    ) : sist ? (
                        <motion.div
                            key={`${sist.ord}-${sist.spor}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-2"
                        >
                            <SporIkon kilde={sist.kilde} />
                            <span>
                                <span className="font-semibold">«{sist.ord}»</span> — {sist.spor}{' '}
                                <span className="text-blue-500">
                                    ({KILDE_META[sist.kilde].navn.toLowerCase()})
                                </span>
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Start hvor du vil. For hvert valg tegnes en ny strek i avtrykket ditt.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {(Object.keys(KILDE_META) as Kilde[]).map((k) => (
                        <span key={k} className="inline-flex items-center gap-1">
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: KILDE_META[k].strek }}
                            />
                            {KILDE_META[k].navn}
                        </span>
                    ))}
                </div>
                <button
                    onClick={nullstill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function SporIkon({ kilde }: { kilde: Kilde }) {
    const Ikon = KILDE_IKON[kilde];
    return <Ikon className="w-4 h-4 mt-0.5 flex-shrink-0" />;
}

function Avtrykk({
    questions,
    svar,
    ferdig,
}: {
    questions: Sporsmal[];
    svar: Record<string, number>;
    ferdig: boolean;
}) {
    // Hver besvarte linje tegner en bue i avtrykket. Fargen viser hvor trekket
    // kommer fra, og radien vokser utover, så mønsteret bygger seg opp lag på lag.
    return (
        <div className="relative">
            <svg viewBox="0 0 120 120" className="w-32 h-32 md:w-40 md:h-40">
                <circle cx="60" cy="60" r="56" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                {questions.map((q, i) => {
                    const idx = svar[q.id];
                    if (idx === undefined) return null;
                    const v = q.valg[idx];
                    const r = 12 + i * 7.5;
                    // Startvinkel varierer med hvilket alternativ som er valgt,
                    // så to elever med ulike svar får ulike mønstre.
                    const start = (idx / q.valg.length) * Math.PI * 2;
                    const sveip = Math.PI * 1.35;
                    const x1 = 60 + Math.cos(start) * r;
                    const y1 = 60 + Math.sin(start) * r;
                    const x2 = 60 + Math.cos(start + sveip) * r;
                    const y2 = 60 + Math.sin(start + sveip) * r;
                    return (
                        <motion.path
                            key={`${q.id}-${idx}`}
                            d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`}
                            fill="none"
                            stroke={KILDE_META[v.kilde].strek}
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    );
                })}
                <AnimatePresence>
                    {ferdig && (
                        <motion.circle
                            key="glod"
                            cx="60"
                            cy="60"
                            r="56"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                    )}
                </AnimatePresence>
            </svg>
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.35 }}
                        className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md"
                    >
                        <Fingerprint className="w-4 h-4" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
