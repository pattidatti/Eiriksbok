import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, RotateCcw, Sparkles, Split } from 'lucide-react';

interface HvemSnakkerDuTilProps {
    title?: string;
}

type Retning = 'innover' | 'begge' | 'utover';

interface Praksis {
    id: string;
    handling: string;
    hvor: string;
    fasit: Retning;
    forklaring: string;
}

const VINKEL: Record<Retning, number> = {
    innover: -58,
    begge: 0,
    utover: 58,
};

const ETIKETT: Record<Retning, string> = {
    innover: 'Innover',
    begge: 'Begge veier',
    utover: 'Utover',
};

const PRAKSISER: Praksis[] = [
    {
        id: 'bukk',
        handling: 'En kvinne bøyer seg foran en buddhastatue og setter fram blomster og røkelse.',
        hvor: 'Theravada, Thailand',
        fasit: 'innover',
        forklaring:
            'I theravada understrekes det at Buddha etter sin død ikke lenger kan kommuniseres med. Handlingen ærer minnet hans og retter oppmerksomheten mot sannheter som at alt forgår.',
    },
    {
        id: 'pust',
        handling: 'En mann sitter stille og følger sin egen pust og sine egne tanker.',
        hvor: 'Meditasjon, alle retninger',
        fasit: 'innover',
        forklaring:
            'Dette er ikke bønn i det hele tatt. I theravada består meditasjon i en systematisk observasjon av kroppen og av alt som rører seg i tanken. Ingen mottaker, bare trening.',
    },
    {
        id: 'nenbutsu',
        handling:
            'En eldre mann gjentar setningen namu Amida butsu, hundre ganger etter hverandre.',
        hvor: 'Rene land-buddhisme, Japan',
        fasit: 'utover',
        forklaring:
            'Her påkalles buddha Amitabha. Resitasjonen skal sikre gjenfødsel i hans rene land, Sukhavati, der man kan nå nirvana. Dette er bønn til noen, med et svar i den andre enden.',
    },
    {
        id: 'mani',
        handling: 'En kvinne resiterer om mani padme hum og ber om hjelp til å få barn.',
        hvor: 'Mahayana og tibetansk tradisjon',
        fasit: 'utover',
        forklaring:
            'Mantraet påkaller bodhisattvaen Avalokiteshvara, som er kjent for medlidenhet og regnes for å kunne redde fra farer og hjelpe med problemer som barnløshet.',
    },
    {
        id: 'hjul',
        handling: 'En pilegrim snurrer et hjul som er stappfullt av skrevne mantraer.',
        hvor: 'Tibetansk buddhisme',
        fasit: 'begge',
        forklaring:
            'Bønnehjul snurres i stedet for å si de hellige ordene høyt, og skal gi hell og lykke. Ordene peker mot noe utenfor, men det er pilegrimen selv som gjør arbeidet.',
    },
    {
        id: 'tilflukt',
        handling: 'En ungdom sier fram en kort formel om å ta tilflukt til De tre juveler.',
        hvor: 'Felles for alle buddhister',
        fasit: 'begge',
        forklaring:
            'Ordene retter seg mot tre ting utenfor deg: Buddha, læren og munkeordenen. Men den som sier formelen offentlig, regnes fra da av som buddhist. Det er altså den som snakker, som endres.',
    },
];

export function HvemSnakkerDuTil({ title = 'Hvem snakker du til?' }: HvemSnakkerDuTilProps) {
    const [steg, setSteg] = useState(0);
    const [valgt, setValgt] = useState<Retning | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [ferdig, setFerdig] = useState(false);

    const naa = PRAKSISER[steg];
    const riktig = valgt !== null && valgt === naa.fasit;
    const sisteSteg = steg === PRAKSISER.length - 1;

    const velg = (retning: Retning) => {
        if (valgt !== null) return;
        setValgt(retning);
        if (retning === naa.fasit) setRiktige((t) => t + 1);
    };

    const neste = () => {
        if (sisteSteg) {
            setFerdig(true);
            return;
        }
        setSteg((s) => s + 1);
        setValgt(null);
    };

    const nullstill = () => {
        setSteg(0);
        setValgt(null);
        setRiktige(0);
        setFerdig(false);
    };

    const naalVinkel = valgt === null ? 0 : VINKEL[naa.fasit];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Compass className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les handlingen, og velg hvilken vei den peker.
                    </p>
                </div>
            </div>

            {!ferdig ? (
                <>
                    <div className="px-5 pt-4">
                        <div className="relative mx-auto w-full max-w-md">
                            <svg viewBox="0 0 240 116" className="w-full">
                                <path
                                    d="M 24 104 A 96 96 0 0 1 216 104"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                                <text
                                    x="20"
                                    y="114"
                                    className="fill-slate-400"
                                    fontSize="11"
                                    textAnchor="start"
                                >
                                    Innover
                                </text>
                                <text
                                    x="120"
                                    y="18"
                                    className="fill-slate-400"
                                    fontSize="11"
                                    textAnchor="middle"
                                >
                                    Begge veier
                                </text>
                                <text
                                    x="220"
                                    y="114"
                                    className="fill-slate-400"
                                    fontSize="11"
                                    textAnchor="end"
                                >
                                    Utover
                                </text>
                                <motion.g
                                    animate={{ rotate: naalVinkel }}
                                    transition={{ type: 'spring', stiffness: 90, damping: 11 }}
                                    style={{ transformOrigin: '120px 104px' }}
                                >
                                    <line
                                        x1="120"
                                        y1="104"
                                        x2="120"
                                        y2="26"
                                        stroke={
                                            valgt === null
                                                ? '#94a3b8'
                                                : riktig
                                                  ? '#059669'
                                                  : '#e11d48'
                                        }
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </motion.g>
                                <circle cx="120" cy="104" r="7" fill="#334155" />
                            </svg>
                        </div>
                    </div>

                    <div className="px-5 pt-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={naa.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
                            >
                                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                    {naa.hvor}
                                </p>
                                <p className="mt-1 text-slate-800 font-medium leading-snug">
                                    {naa.handling}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="px-5 pt-3 grid grid-cols-3 gap-2">
                        {(['innover', 'begge', 'utover'] as Retning[]).map((retning) => {
                            const erFasit = valgt !== null && retning === naa.fasit;
                            const erFeilvalg = valgt === retning && retning !== naa.fasit;
                            const Ikon =
                                retning === 'innover'
                                    ? ArrowLeft
                                    : retning === 'utover'
                                      ? ArrowRight
                                      : Split;
                            return (
                                <motion.button
                                    key={retning}
                                    type="button"
                                    onClick={() => velg(retning)}
                                    whileTap={valgt === null ? { scale: 0.96 } : undefined}
                                    className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                                        erFasit
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                            : erFeilvalg
                                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                                              : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md'
                                    }`}
                                >
                                    <Ikon className="w-4 h-4" />
                                    {ETIKETT[retning]}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="px-5 pt-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={valgt === null ? `tom-${naa.id}` : `svar-${naa.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`rounded-lg border px-4 py-3 text-sm min-h-[72px] ${
                                    valgt === null
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : riktig
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}
                            >
                                {valgt === null
                                    ? 'Peker handlingen innover mot den som gjør den, eller utover mot noen som kan svare?'
                                    : naa.forklaring}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            {PRAKSISER.map((p, i) => (
                                <span
                                    key={p.id}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i < steg
                                            ? 'w-5 bg-indigo-400'
                                            : i === steg
                                              ? 'w-8 bg-indigo-600'
                                              : 'w-5 bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={nullstill}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Tilbakestill
                            </button>
                            <button
                                type="button"
                                onClick={neste}
                                disabled={valgt === null}
                                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                                    valgt === null
                                        ? 'bg-slate-100 text-slate-400'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {sisteSteg ? 'Se svaret' : 'Neste'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 py-6 text-center"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 13 }}
                        className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center"
                    >
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                    </motion.div>
                    <p className="mt-3 text-slate-800 font-semibold">
                        {riktige} av {PRAKSISER.length} plassert riktig
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        {PRAKSISER.map((p, i) => (
                            <motion.span
                                key={p.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    delay: 0.1 * i,
                                    type: 'spring',
                                    stiffness: 320,
                                    damping: 14,
                                }}
                                className={`w-7 h-7 rounded-full border-2 ${
                                    p.fasit === 'innover'
                                        ? 'bg-sky-50 border-sky-300'
                                        : p.fasit === 'utover'
                                          ? 'bg-amber-50 border-amber-300'
                                          : 'bg-violet-50 border-violet-300'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Nålen pekte ikke samme vei hver gang. Det er hele poenget: buddhismen har
                        ingen skapergud, men den har praksiser som peker begge veier. Noen trener
                        sinnet til den som gjør dem, andre henvender seg til en buddha eller en
                        bodhisattva som kan svare. Hvilken vei nålen peker, avhenger av skolen og av
                        handlingen.
                    </p>
                    <button
                        type="button"
                        onClick={nullstill}
                        className="mt-5 inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Prøv på nytt
                    </button>
                </motion.div>
            )}
        </div>
    );
}
