import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Search, Trophy, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: nesten alt vi "vet" om havfolkene kommer fra vinnerens egen
// seiersinnskrift. Eleven sorterer linje for linje hva som er et etterprøvbart spor
// og hva som er skryt, og ser til slutt hvor lite hard kunnskap som blir igjen.

interface Line {
    /** Selve setningen fra innskriften, gjenfortalt på enkelt norsk. */
    text: string;
    /** true = etterprøvbart spor, false = skryt fra vinneren. */
    spor: boolean;
    /** Forklaringen eleven får etter valget. */
    forklaring: string;
}

interface SeiersinnskriftenProps {
    title?: string;
    subtitle?: string;
    /** Hvem som skrev kilden. Vises som etikett over linjene. */
    kilde?: string;
    lines?: Line[];
}

const DEFAULT_LINES: Line[] = [
    {
        text: 'Fremmede folk slo seg sammen ute på øyene sine.',
        spor: true,
        forklaring:
            'Dette er et spor. Innskriften sier at flere grupper kom sammen, og at de kom fra øyer. Arkeologene finner nettopp egeisk keramikk i områdene der disse gruppene slo seg ned, så to uavhengige kilder peker samme vei.',
    },
    {
        text: 'Ingen land klarte å stå imot dem. Hettittriket falt.',
        spor: true,
        forklaring:
            'Dette er et spor. At hettittriket forsvant rundt samme tid, kan vi sjekke i bakken: hovedstaden Hattusa ble forlatt og brent. Her stemmer skrytet med utgravningene.',
    },
    {
        text: 'De kom mot Egypt med ild foran seg.',
        spor: false,
        forklaring:
            'Dette er skryt. "Ild foran seg" er et fast bilde egyptiske skrivere brukte om alle fiender. Det forteller oss hvordan farao ville framstille angrepet, ikke hva som faktisk brant.',
    },
    {
        text: 'Farao var som en mur av jern rundt Egypt.',
        spor: false,
        forklaring:
            'Dette er skryt. Innskriften står på farao sin egen gravtempelvegg. Bilder av kongen som en urokkelig mur er reklame for kongemakten, ikke en beskrivelse av et slag.',
    },
    {
        text: 'De ble slept i land og talt opp som fanger.',
        spor: false,
        forklaring:
            'Dette er skryt. Fangetallene i egyptiske seiersinnskrifter er ofte runde og altfor høye. Ingen andre kilder kan stadfeste dem, så vi kan ikke bruke dem som tall.',
    },
    {
        text: 'Noen av dem fikk bo i Egypt og tjene farao.',
        spor: true,
        forklaring:
            'Dette er et spor. Andre egyptiske tekster nevner de samme gruppene som leiesoldater og bosettere etterpå. At fienden dukker opp igjen som naboer, passer dårlig med ren skryt og er derfor trolig sant.',
    },
];

type Valg = 'spor' | 'skryt';

export function Seiersinnskriften({
    title = 'Les seiersinnskriften',
    subtitle = 'Er linjen et etterprøvbart spor, eller er den skryt fra vinneren?',
    kilde = 'Ramses 3. sin tempelvegg i Medinet Habu, ca. 1175 fvt.',
    lines = DEFAULT_LINES,
}: SeiersinnskriftenProps) {
    const [steg, setSteg] = useState(0);
    const [svar, setSvar] = useState<Valg[]>([]);

    const ferdig = steg >= lines.length;
    const aktiv = ferdig ? null : lines[steg];
    const sisteSvar = svar.length > 0 ? svar[svar.length - 1] : null;
    const sisteLinje = svar.length > 0 ? lines[svar.length - 1] : null;
    const sisteRiktig =
        sisteLinje && sisteSvar ? (sisteSvar === 'spor') === sisteLinje.spor : false;

    const antallSpor = lines.filter((l) => l.spor).length;
    const treff = svar.filter((v, i) => (v === 'spor') === lines[i].spor).length;

    const velg = (valg: Valg) => {
        if (ferdig) return;
        setSvar([...svar, valg]);
        setSteg(steg + 1);
    };

    const tilbakestill = () => {
        setSteg(0);
        setSvar([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Kildeetikett + framdrift */}
            <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    {kilde}
                </span>
                <div className="flex items-center gap-1.5">
                    {lines.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i < svar.length
                                    ? (svar[i] === 'spor') === lines[i].spor
                                        ? 'w-6 bg-emerald-400'
                                        : 'w-6 bg-rose-300'
                                    : i === steg
                                      ? 'w-6 bg-indigo-400'
                                      : 'w-3 bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-6 py-5">
                <AnimatePresence mode="wait">
                    {aktiv ? (
                        <motion.blockquote
                            key={`linje-${steg}`}
                            initial={{ opacity: 0, x: 14 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -14 }}
                            transition={{ duration: 0.22 }}
                            className="rounded-xl border-l-4 border-amber-300 bg-amber-50/70 px-5 py-4"
                        >
                            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
                                «{aktiv.text}»
                            </p>
                        </motion.blockquote>
                    ) : (
                        <motion.div
                            key="oppsummering"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            <div className="flex items-start gap-3">
                                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-emerald-900">
                                        Du sorterte {treff} av {lines.length} linjer riktig.
                                    </p>
                                    <p className="text-sm text-emerald-800 mt-1.5 leading-relaxed">
                                        Bare {antallSpor} av {lines.length} linjer holder som
                                        etterprøvbare spor. Resten er farao som roser seg selv. Det
                                        er derfor havfolkene fortsatt er en gåte: vi har mye tekst
                                        om dem, men nesten ingen av den er skrevet for å fortelle
                                        sannheten om hvem de var.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="mx-6 mb-4 min-h-[76px]">
                <AnimatePresence mode="wait">
                    {sisteLinje && sisteSvar ? (
                        <motion.div
                            key={`fb-${svar.length}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                                sisteRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <span className="font-semibold">
                                {sisteRiktig ? 'Riktig. ' : 'Ikke helt. '}
                            </span>
                            {sisteLinje.forklaring}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="fb-tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500"
                        >
                            Velg under. Du får en forklaring etter hvert valg.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => velg('spor')}
                        disabled={ferdig}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        Etterprøvbart spor
                    </button>
                    <button
                        onClick={() => velg('skryt')}
                        disabled={ferdig}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Skryt fra vinneren
                    </button>
                </div>
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
