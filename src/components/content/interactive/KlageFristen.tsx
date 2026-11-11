import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Gavel,
    Globe,
    Hand,
    RotateCcw,
    Scale,
    Store,
    Trophy,
    Undo2,
    XCircle,
} from 'lucide-react';

// KlageFristen: eleven møter fem klagesituasjoner. Hver situasjon er tegnet inn på en
// tidslinje fra kjøpsdagen, med fristene for angrerett (14 dager), en typisk garanti (1 år)
// og reklamasjon (2 og 5 år). Eleven velger hvilken regel som gjelder.
//
// Lyspære-øyeblikket: Garantien er butikkens frivillige løfte. Reklamasjonsretten er loven,
// og den varer lenger. Angreretten gjelder bare når du handler på avstand, for eksempel på nett.
//
// Reglene bygger på forbrukerkjøpsloven (§§ 18, 26, 27) og angrerettloven (§§ 21, 24),
// lovdata.no, og Store norske leksikon (reklamasjon). Situasjonene er tenkte eksempler.

interface KlageFristenProps {
    title?: string;
}

type Regel = 'angrerett' | 'reklamasjon' | 'ingen';
type Phase = 'question' | 'answered' | 'done';

interface Sak {
    id: string;
    vare: string;
    hvor: 'nett' | 'butikk';
    dager: number;
    tidTekst: string;
    situasjon: string;
    svar: Regel;
    forklaring: string;
}

const SAKER: Sak[] = [
    {
        id: 'mobil',
        vare: 'Mobiltelefon',
        hvor: 'butikk',
        dager: 395,
        tidTekst: '13 måneder etter kjøpet',
        situasjon:
            'Mobilen slutter plutselig å lade. Du har ikke mistet den. Butikken sier: «Garantien var bare ett år, så den er ute.»',
        svar: 'reklamasjon',
        forklaring:
            'Garantien er ute, men reklamasjonsretten er ikke det. Den varer minst to år. En feil som viser seg innen to år, regnes som om den fantes da du kjøpte mobilen.',
    },
    {
        id: 'genser',
        vare: 'Genser',
        hvor: 'nett',
        dager: 9,
        tidTekst: '9 dager etter at pakken kom',
        situasjon:
            'Du bestilte en genser i en nettbutikk. Den er helt fin, men du liker den ikke likevel. Du har ikke brukt den.',
        svar: 'angrerett',
        forklaring:
            'Når du handler på nett, har du 14 dagers angrerett fra dagen du fikk varen. Du trenger ingen grunn. Butikken må betale tilbake innen 14 dager.',
    },
    {
        id: 'sko',
        vare: 'Joggesko',
        hvor: 'butikk',
        dager: 3,
        tidTekst: '3 dager etter kjøpet',
        situasjon:
            'Du kjøpte joggesko i en butikk i sentrum. Skoene er hele, men du angrer på fargen.',
        svar: 'ingen',
        forklaring:
            'Angreretten gjelder når du handler på avstand, som på nett, eller utenfor butikken. Kjøper du i en vanlig butikk, gir loven deg ikke rett til å angre. Noen butikker lar deg bytte likevel, men det er et frivillig tilbud.',
    },
    {
        id: 'skjerm',
        vare: 'Nettbrett',
        hvor: 'nett',
        dager: 120,
        tidTekst: '4 måneder etter kjøpet',
        situasjon:
            'Du mistet nettbrettet i bakken, og skjermen sprakk. Ellers har det virket helt fint.',
        svar: 'ingen',
        forklaring:
            'Reklamasjon gjelder feil ved varen. Når du selv har ødelagt den, er det ikke en feil ved varen. Da må du betale reparasjonen selv, eller sjekke om du har en forsikring som dekker det.',
    },
    {
        id: 'tv',
        vare: 'TV',
        hvor: 'butikk',
        dager: 1280,
        tidTekst: '3 år og 6 måneder etter kjøpet',
        situasjon:
            'Familiens TV slutter å vise bilde. Ingen har mistet den eller brukt den feil.',
        svar: 'reklamasjon',
        forklaring:
            'For ting som skal vare mye lenger enn vanlig, som en TV, er reklamasjonsfristen fem år. Da kan dere kreve at butikken reparerer eller bytter TV-en uten at det koster dere noe.',
    },
];

const REGLER: Record<Regel, { navn: string; ikon: typeof Undo2; farge: string }> = {
    angrerett: {
        navn: 'Angrerett',
        ikon: Undo2,
        farge: 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100',
    },
    reklamasjon: {
        navn: 'Reklamasjon',
        ikon: Scale,
        farge: 'border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100',
    },
    ingen: {
        navn: 'Ingen rett',
        ikon: Hand,
        farge: 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
    },
};

// Tidslinja er ikke lineær: de første 14 dagene får mer plass, ellers ville de forsvunnet.
const MERKER = [
    { dager: 0, pos: 0, tekst: 'Kjøpt' },
    { dager: 14, pos: 14, tekst: '14 dager' },
    { dager: 365, pos: 38, tekst: '1 år' },
    { dager: 730, pos: 60, tekst: '2 år' },
    { dager: 1825, pos: 100, tekst: '5 år' },
];

function tilPosisjon(dager: number): number {
    for (let i = 1; i < MERKER.length; i++) {
        const a = MERKER[i - 1];
        const b = MERKER[i];
        if (dager <= b.dager) {
            return a.pos + ((dager - a.dager) / (b.dager - a.dager)) * (b.pos - a.pos);
        }
    }
    return 100;
}

function Tidslinje({ dager, vis }: { dager: number; vis: boolean }) {
    const pos = tilPosisjon(dager);
    return (
        <div className="relative mx-3 mt-8 mb-16">
            {/* Feltene på linja */}
            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-sky-200"
                    style={{ width: `${MERKER[1].pos}%` }}
                />
                <div
                    className="absolute inset-y-0 bg-amber-100"
                    style={{ left: `${MERKER[1].pos}%`, width: `${MERKER[2].pos - MERKER[1].pos}%` }}
                />
                <div
                    className="absolute inset-y-0 bg-indigo-100"
                    style={{ left: `${MERKER[2].pos}%`, width: `${MERKER[3].pos - MERKER[2].pos}%` }}
                />
                <div
                    className="absolute inset-y-0 bg-indigo-50"
                    style={{ left: `${MERKER[3].pos}%`, right: 0 }}
                />
            </div>
            {/* Merker */}
            {MERKER.map((m) => (
                <div
                    key={m.tekst}
                    className="absolute top-3 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${m.pos}%` }}
                >
                    <div className="w-0.5 h-3 bg-slate-400" />
                    <span className="mt-1 text-[11px] text-slate-500 whitespace-nowrap">{m.tekst}</span>
                </div>
            ))}
            {/* Hendelsen */}
            <motion.div
                key={dager}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pos}%` }}
            >
                <motion.div
                    animate={vis ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow"
                />
                <div className="w-0.5 h-2 bg-rose-400" />
            </motion.div>
            {/* Forklaring av feltene */}
            <AnimatePresence>
                {vis && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 top-12 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"
                    >
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-sky-200" /> angrerett (nett)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-200" /> vanlig garanti
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100" /> reklamasjon 2 år
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-50 border border-indigo-100" /> 5 år for ting som skal vare lenge
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function KlageFristen({ title = 'Klagefristen: Hvilken regel gjelder?' }: KlageFristenProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('question');
    const [valgt, setValgt] = useState<Regel | null>(null);
    const [riktige, setRiktige] = useState(0);

    const sak = SAKER[index];
    const riktig = valgt === sak.svar;

    const svar = (regel: Regel) => {
        if (phase !== 'question') return;
        setValgt(regel);
        if (regel === sak.svar) setRiktige((r) => r + 1);
        setPhase('answered');
    };

    const neste = () => {
        if (index + 1 >= SAKER.length) {
            setPhase('done');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('question');
    };

    const tilbakestill = () => {
        setIndex(0);
        setValgt(null);
        setRiktige(0);
        setPhase('question');
    };

    const HvorIkon = sak.hvor === 'nett' ? Globe : Store;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Gavel className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les saken, se hvor den ligger på tidslinja, og velg regelen som gjelder.
                    </p>
                </div>
                {phase !== 'done' && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                        Sak {index + 1} av {SAKER.length}
                    </span>
                )}
            </div>

            <AnimatePresence mode="wait">
                {phase === 'done' ? (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6"
                    >
                        <div className="flex flex-col items-center text-center">
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                                className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3"
                            >
                                <Trophy className="w-7 h-7 text-emerald-600" />
                            </motion.div>
                            <p className="text-lg font-semibold text-slate-800">
                                {riktige} av {SAKER.length} riktige
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {riktige === SAKER.length
                                    ? 'Full pott! Du vet mer om klagerett enn mange voksne.'
                                    : 'Godt jobbet. Prøv igjen og se om du får alle riktige.'}
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3 mt-5">
                            {[
                                {
                                    regel: 'angrerett' as Regel,
                                    tekst: '14 dager når du handler på nett. Du trenger ingen grunn.',
                                },
                                {
                                    regel: 'reklamasjon' as Regel,
                                    tekst: 'Når varen har en feil. To år, eller fem år for ting som skal vare lenge.',
                                },
                                {
                                    regel: 'ingen' as Regel,
                                    tekst: 'Når du har ødelagt varen selv, eller bare angrer etter kjøp i butikk.',
                                },
                            ].map((r, i) => {
                                const R = REGLER[r.regel];
                                const Ikon = R.ikon;
                                return (
                                    <motion.div
                                        key={r.regel}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.12 }}
                                        className={`rounded-xl border p-3 text-sm ${R.farge}`}
                                    >
                                        <div className="flex items-center gap-2 font-semibold mb-1">
                                            <Ikon className="w-4 h-4" /> {R.navn}
                                        </div>
                                        {r.tekst}
                                    </motion.div>
                                );
                            })}
                        </div>
                        <p className="text-sm text-slate-600 mt-4 text-center">
                            Husk: Garantien er butikkens frivillige løfte. Reklamasjonsretten er loven.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={sak.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-6 pt-5"
                    >
                        {/* Saken */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                                <span className="font-semibold text-slate-800 text-base mr-1">{sak.vare}</span>
                                <span className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                                    <HvorIkon className="w-3.5 h-3.5" />
                                    {sak.hvor === 'nett' ? 'Kjøpt på nett' : 'Kjøpt i butikk'}
                                </span>
                                <span className="bg-white border border-slate-200 rounded-full px-2 py-0.5">
                                    {sak.tidTekst}
                                </span>
                            </div>
                            <p className="text-slate-700">{sak.situasjon}</p>
                        </div>

                        <Tidslinje dager={sak.dager} vis={phase === 'answered'} />

                        {/* Valg */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {(Object.keys(REGLER) as Regel[]).map((r) => {
                                const R = REGLER[r];
                                const Ikon = R.ikon;
                                const erValgt = valgt === r;
                                const erRiktig = phase === 'answered' && r === sak.svar;
                                return (
                                    <motion.button
                                        key={r}
                                        whileTap={{ scale: 0.95 }}
                                        animate={
                                            erValgt && !erRiktig
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : erRiktig
                                                  ? { scale: [1, 1.06, 1] }
                                                  : {}
                                        }
                                        onClick={() => svar(r)}
                                        disabled={phase !== 'question'}
                                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${
                                            erRiktig
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                                : erValgt
                                                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                                                  : phase === 'answered'
                                                    ? 'border-slate-200 bg-white text-slate-400'
                                                    : R.farge
                                        }`}
                                    >
                                        <Ikon className="w-4 h-4" />
                                        {R.navn}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback-sone */}
            {phase !== 'done' && (
                <div className="px-6 pt-4 min-h-[6.5rem]">
                    <AnimatePresence mode="wait">
                        {phase === 'answered' ? (
                            <motion.div
                                key={`fb-${sak.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex gap-2 px-4 py-3 rounded-lg border text-sm ${
                                    riktig
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}
                            >
                                {riktig ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 shrink-0" />
                                )}
                                <div>
                                    <span className="font-semibold">
                                        {riktig ? 'Riktig! ' : `Ikke helt. Svaret er ${REGLER[sak.svar].navn.toLowerCase()}. `}
                                    </span>
                                    {sak.forklaring}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                            >
                                Tips: Tenk på tre ting. Hvor kjøpte du varen? Hvor lang tid har gått? Og er det
                                en feil ved varen, eller noe du har gjort selv?
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between">
                {phase === 'answered' ? (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={neste}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {index + 1 >= SAKER.length ? 'Se resultatet' : 'Neste sak'}
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {phase === 'done' ? '' : 'Velg en av de tre reglene'}
                    </span>
                )}
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
