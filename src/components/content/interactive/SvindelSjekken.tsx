import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Gift,
    Hand,
    MessageSquareWarning,
    RotateCcw,
    ShieldCheck,
    Timer,
    Trophy,
    XCircle,
} from 'lucide-react';

// SvindelSjekken: eleven får fem meldinger og tilbud, én om gangen, og avgjør om hver er
// trygg eller svindel. Etter hvert svar vises varseltegnene, merket med hvilket triks de bruker.
//
// Lyspære-øyeblikket: Svindel ser forskjellig ut, men bruker de samme triksene. Den haster,
// den lokker med noe for godt til å være sant, og den vil at du skal gi fra deg noe: penger,
// koder eller kontoen din. Kjenner du igjen triksene, kan du stoppe før det er for sent.
//
// Alle meldingene er tenkte eksempler. Varseltegnene bygger på Europol (pengemuldyr),
// Store norske leksikon (nettfiske) og ung.no/Forbrukerrådet (falske nettbutikker).

interface SvindelSjekkenProps {
    title?: string;
}

type Triks = 'hastverk' | 'lokkemat' | 'gi-fra-deg';
type Phase = 'question' | 'answered' | 'done';

interface Tegn {
    tekst: string;
    triks?: Triks;
}

interface Melding {
    id: string;
    kanal: string;
    avsender: string;
    tekst: string;
    svindel: boolean;
    navn: string;
    tegn: Tegn[];
}

const TRIKS: Record<Triks, { navn: string; ikon: typeof Timer; farge: string }> = {
    hastverk: { navn: 'Hastverk', ikon: Timer, farge: 'bg-amber-100 text-amber-800 border-amber-200' },
    lokkemat: {
        navn: 'For godt til å være sant',
        ikon: Gift,
        farge: 'bg-violet-100 text-violet-800 border-violet-200',
    },
    'gi-fra-deg': {
        navn: 'Vil ha penger, koder eller kontoen din',
        ikon: Hand,
        farge: 'bg-rose-100 text-rose-800 border-rose-200',
    },
};

const MELDINGER: Melding[] = [
    {
        id: 'pakke',
        kanal: 'SMS',
        avsender: 'Pakkeinfo',
        tekst: 'Pakken din står på vent. Betal 29 kr i tollgebyr innen 24 timer, ellers sendes den i retur: pakke-sporing-no.info',
        svindel: true,
        navn: 'Falsk pakke-SMS',
        tegn: [
            { tekst: '«Innen 24 timer» skal få deg til å handle før du tenker.', triks: 'hastverk' },
            { tekst: 'Lenken går til en rar adresse, ikke til fraktselskapets egen side.' },
            { tekst: 'Du skal legge inn kortet ditt for å betale et lite gebyr.', triks: 'gi-fra-deg' },
        ],
    },
    {
        id: 'muldyr',
        kanal: 'Snapchat',
        avsender: 'ukjent_bruker_77',
        tekst: 'Heii! Vil du tjene 500 kr på fem minutter? Du tar imot 5 000 kr på kontoen din og sender dem videre. Helt lovlig, alle gjør det 😉',
        svindel: true,
        navn: 'Pengemuldyr',
        tegn: [
            { tekst: 'En fremmed lover lettjente penger uten innsats.', triks: 'lokkemat' },
            { tekst: 'Du skal låne bort kontoen din til å flytte penger.', triks: 'gi-fra-deg' },
            { tekst: '«Helt lovlig» er ikke sant. Dette er hvitvasking, og du kan bli straffet.' },
        ],
    },
    {
        id: 'sko',
        kanal: 'Annonse på Instagram',
        avsender: 'Sko-Outlet Norge',
        tekst: 'Kjente joggesko til 299 kr (før 1 899 kr). Bare i dag! Nesten utsolgt. Nettbutikken har bare et kontaktskjema, ingen adresse eller telefon.',
        svindel: true,
        navn: 'Falsk nettbutikk',
        tegn: [
            { tekst: 'Prisen er alt for lav for en kjent merkevare.', triks: 'lokkemat' },
            { tekst: '«Bare i dag» og «nesten utsolgt» presser deg til å kjøpe raskt.', triks: 'hastverk' },
            { tekst: 'Ingen adresse, telefon eller e-post. Du betaler, men får kanskje aldri noe.', triks: 'gi-fra-deg' },
        ],
    },
    {
        id: 'bank',
        kanal: 'SMS',
        avsender: 'Banken',
        tekst: 'Vi har oppdaget mistenkelig aktivitet på kontoen din. Logg inn her med BankID for å stoppe betalingen: bank-sikker-innlogging.com',
        svindel: true,
        navn: 'Nettfiske',
        tegn: [
            { tekst: 'Meldingen skremmer deg, så du skal skynde deg.', triks: 'hastverk' },
            { tekst: 'Lenken fører til en kopi av banken, ikke til banken.' },
            { tekst: 'Du skal logge inn, slik at svindlerne får koden din.', triks: 'gi-fra-deg' },
        ],
    },
    {
        id: 'butikk',
        kanal: 'Nettbutikk du skrev inn adressen til selv',
        avsender: 'Sportsbutikk',
        tekst: 'Fotballsko på salg: 1 199 kr (før 1 499 kr). Butikken har organisasjonsnummer, adresse, telefon og 14 dagers angrerett. Du kan betale med kort.',
        svindel: false,
        navn: 'Vanlig nettbutikk',
        tegn: [
            { tekst: 'Prisen er lavere, men ikke urimelig lav.' },
            { tekst: 'Du finner adresse, telefon og regler for angrerett.' },
            { tekst: 'Du fant butikken selv, i stedet for å trykke på en lenke.' },
        ],
    },
];

const ANTALL_SVINDEL = MELDINGER.filter((m) => m.svindel).length;

function tellTriks(triks: Triks): number {
    return MELDINGER.filter((m) => m.svindel && m.tegn.some((t) => t.triks === triks)).length;
}

export function SvindelSjekken({ title = 'Svindelsjekken: Trygt eller svindel?' }: SvindelSjekkenProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('question');
    const [valgt, setValgt] = useState<boolean | null>(null);
    const [riktige, setRiktige] = useState(0);

    const melding = MELDINGER[index];
    const riktig = valgt === melding.svindel;

    const svar = (erSvindel: boolean) => {
        if (phase !== 'question') return;
        setValgt(erSvindel);
        if (erSvindel === melding.svindel) setRiktige((r) => r + 1);
        setPhase('answered');
    };

    const neste = () => {
        if (index + 1 >= MELDINGER.length) {
            setPhase('done');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('question');
    };

    const handleReset = () => {
        setIndex(0);
        setValgt(null);
        setRiktige(0);
        setPhase('question');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <MessageSquareWarning className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les meldingen og velg: er den trygg, eller er det svindel?
                    </p>
                </div>
                <div className="flex gap-1.5" aria-label={`Melding ${Math.min(index + 1, MELDINGER.length)} av ${MELDINGER.length}`}>
                    {MELDINGER.map((m, i) => (
                        <motion.span
                            key={m.id}
                            animate={{ scale: i === index && phase !== 'done' ? 1.3 : 1 }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                i < index || phase === 'done'
                                    ? 'bg-indigo-500'
                                    : i === index
                                      ? 'bg-indigo-300'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase !== 'done' ? (
                    <motion.div
                        key={melding.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="p-5 grid gap-4 md:grid-cols-2"
                    >
                        {/* Meldingen */}
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                                {melding.kanal}
                            </div>
                            <motion.div
                                animate={
                                    phase === 'answered'
                                        ? {
                                              borderColor: melding.svindel ? '#fda4af' : '#6ee7b7',
                                          }
                                        : { borderColor: '#e2e8f0' }
                                }
                                className="rounded-2xl rounded-tl-sm border-2 bg-slate-50 p-4"
                            >
                                <div className="text-sm font-semibold text-slate-700 mb-1">
                                    {melding.avsender}
                                </div>
                                <p className="text-slate-700 leading-relaxed">{melding.tekst}</p>
                            </motion.div>

                            {phase === 'question' && (
                                <div className="mt-4 flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => svar(false)}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium hover:bg-emerald-100"
                                    >
                                        <ShieldCheck className="w-4 h-4" /> Trygt
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => svar(true)}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-medium hover:bg-rose-100"
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Svindel
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Feedback-sone */}
                        <div className="min-h-[180px]">
                            {phase === 'question' ? (
                                <div className="h-full rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-400 flex items-center justify-center text-center">
                                    Når du har svart, ser du varseltegnene her.
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    <div
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                                            riktig
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-rose-50 border-rose-200 text-rose-700'
                                        }`}
                                    >
                                        {riktig ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 shrink-0" />
                                        )}
                                        {riktig ? 'Riktig! ' : 'Ikke helt. '}
                                        {melding.svindel ? `Dette er svindel: ${melding.navn}.` : 'Dette er trygt.'}
                                    </div>
                                    <ul className="space-y-1.5">
                                        {melding.tegn.map((t, i) => (
                                            <motion.li
                                                key={t.tekst}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.12 }}
                                                className="text-sm text-slate-700"
                                            >
                                                {t.triks && <TriksMerke triks={t.triks} />}
                                                <span>{t.tekst}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Trophy className="w-8 h-8 text-amber-500" />
                            </motion.div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    Du fikk {riktige} av {MELDINGER.length} riktig.
                                </div>
                                <div className="text-sm text-slate-500">
                                    Se hvilke triks de {ANTALL_SVINDEL} svindlene brukte:
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {(Object.keys(TRIKS) as Triks[]).map((triks, i) => {
                                const antall = tellTriks(triks);
                                const Ikon = TRIKS[triks].ikon;
                                return (
                                    <div key={triks}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                <Ikon className="w-4 h-4" /> {TRIKS[triks].navn}
                                            </span>
                                            <span className="text-slate-500">
                                                {antall} av {ANTALL_SVINDEL}
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(antall / ANTALL_SVINDEL) * 100}%` }}
                                                transition={{ delay: 0.2 + i * 0.2, duration: 0.6 }}
                                                className="h-full bg-indigo-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3"
                        >
                            Alle svindlene ville at du skulle gi fra deg noe: penger, koden din eller kontoen
                            din. Når noen haster og vil ha noe av dette, er det på tide å stoppe og sjekke.
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {phase === 'answered' ? (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {index + 1 >= MELDINGER.length ? 'Se resultatet' : 'Neste melding'}
                    </motion.button>
                ) : (
                    <span />
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}

function TriksMerke({ triks }: { triks: Triks }) {
    const Ikon = TRIKS[triks].ikon;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium mr-1.5 align-middle ${TRIKS[triks].farge}`}
        >
            <Ikon className="w-3 h-3" />
            {TRIKS[triks].navn}
        </span>
    );
}
