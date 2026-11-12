import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    FileX,
    Gavel,
    Landmark,
    RotateCcw,
    Scale,
    Shield,
    ShieldCheck,
    UserCheck,
    XCircle,
} from 'lucide-react';

// RettsstatVokteren: eleven møter fem tenkte situasjoner der staten går over streken, og
// avgjør hvilket rettsstatsprinsipp som blir brutt. Etter riktig svar vises paragrafen i
// Grunnloven som beskytter mot akkurat dette.
//
// Lyspære-øyeblikket: Hvert prinsipp i rettsstaten stopper én bestemt måte staten kan misbruke
// makten sin på. Faller ett av dem, kan hvem som helst bli rammet - også deg.
//
// Situasjonene er tenkte eksempler. Paragrafene er hentet fra Grunnloven (Lovdata).

interface RettsstatVokterenProps {
    title?: string;
}

type PrinsippId = 'likhet' | 'lov' | 'uskyldig' | 'domstol' | 'staten';
type Phase = 'question' | 'answered' | 'done';

interface Prinsipp {
    id: PrinsippId;
    navn: string;
    kort: string;
    ikon: typeof Scale;
}

interface Situasjon {
    id: string;
    tekst: string;
    svar: PrinsippId;
    forklaring: string;
    paragraf: string;
}

const PRINSIPPER: Prinsipp[] = [
    { id: 'likhet', navn: 'Alle er like for loven', kort: 'Samme regler for alle', ikon: Scale },
    { id: 'lov', navn: 'Ingen straff uten lov', kort: 'Loven må finnes først', ikon: FileX },
    { id: 'uskyldig', navn: 'Uskyldig til det motsatte er bevist', kort: 'Staten må bevise skyld', ikon: UserCheck },
    { id: 'domstol', navn: 'Uavhengige domstoler', kort: 'Ingen styrer dommeren', ikon: Gavel },
    { id: 'staten', navn: 'Staten må følge loven', kort: 'Makt trenger lov', ikon: Landmark },
];

const SITUASJONER: Situasjon[] = [
    {
        id: 'minister',
        tekst: 'En minister og en bussjåfør kjører begge 30 km/t for fort på samme vei. Bussjåføren får bot. Ministeren slipper, fordi «han har et viktig verv».',
        svar: 'likhet',
        forklaring: 'Loven skal gjelde likt for alle, uansett hvor mektig eller kjent du er.',
        paragraf: 'Grunnloven § 98: «Alle er like for loven.»',
    },
    {
        id: 'dans',
        tekst: 'I mars kommer en ny lov som forbyr å spille høy musikk i parken. Politiet gir Sara bot fordi hun spilte høy musikk der i fjor sommer.',
        svar: 'lov',
        forklaring: 'Du kan bare straffes for noe som var forbudt da du gjorde det. En ny lov kan ikke virke bakover i tid.',
        paragraf: 'Grunnloven § 97: «Ingen lov må gis tilbakevirkende kraft.»',
    },
    {
        id: 'bevis',
        tekst: 'Ali er anklaget for å ha stjålet en sykkel. Retten dømmer ham fordi han ikke klarte å bevise at han var et annet sted den kvelden.',
        svar: 'uskyldig',
        forklaring: 'Det er staten som må bevise at du er skyldig. Du skal ikke måtte bevise at du er uskyldig.',
        paragraf: 'Grunnloven § 96: Enhver skal bli «ansett som uskyldig inntil skyld er bevist etter loven».',
    },
    {
        id: 'dommer',
        tekst: 'Før en stor rettssak ringer en statsråd til dommeren og sier at regjeringen vil ha en streng dom. Ellers kan dommeren miste jobben.',
        svar: 'domstol',
        forklaring: 'Dommeren skal bare følge loven og bevisene, ikke hva regjeringen ønsker.',
        paragraf: 'Grunnloven § 95: rett til en «uavhengig og upartisk domstol».',
    },
    {
        id: 'klubb',
        tekst: 'En ungdomsgruppe kritiserer ordføreren i et innlegg. Uka etter stenger kommunen klubbhuset deres. Ingen lov gir kommunen rett til det.',
        svar: 'staten',
        forklaring: 'Når myndighetene griper inn i livet ditt, må de ha en lov som gir dem lov til det.',
        paragraf: 'Grunnloven § 113: «Myndighetenes inngrep overfor den enkelte må ha grunnlag i lov.»',
    },
];

export function RettsstatVokteren({ title = 'Rettsstatvokteren: Hvilket prinsipp brytes?' }: RettsstatVokterenProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('question');
    const [feil, setFeil] = useState<PrinsippId[]>([]);
    const [forsteForsok, setForsteForsok] = useState(0);
    const [vernet, setVernet] = useState<PrinsippId[]>([]);

    const situasjon = SITUASJONER[index];

    const velg = (id: PrinsippId) => {
        if (phase !== 'question' || feil.includes(id)) return;
        if (id === situasjon.svar) {
            if (feil.length === 0) setForsteForsok((n) => n + 1);
            setVernet((v) => [...v, id]);
            setPhase('answered');
        } else {
            setFeil((f) => [...f, id]);
        }
    };

    const neste = () => {
        if (index + 1 >= SITUASJONER.length) {
            setPhase('done');
            return;
        }
        setIndex((i) => i + 1);
        setFeil([]);
        setPhase('question');
    };

    const reset = () => {
        setIndex(0);
        setPhase('question');
        setFeil([]);
        setForsteForsok(0);
        setVernet([]);
    };

    const sisteFeil = feil[feil.length - 1];
    const feilPrinsipp = PRINSIPPER.find((p) => p.id === sisteFeil);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les situasjonen og trykk på prinsippet som blir brutt.
                    </p>
                </div>
                {/* Skjold-rad: ett skjold per situasjon */}
                <div className="hidden sm:flex gap-1" aria-label="Fremdrift">
                    {SITUASJONER.map((s, i) => (
                        <motion.div
                            key={s.id}
                            animate={{ scale: i < vernet.length ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <ShieldCheck
                                className={`w-5 h-5 ${
                                    i < vernet.length ? 'text-emerald-500' : 'text-slate-200'
                                }`}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase !== 'done' ? (
                    <motion.div
                        key={situasjon.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        className="p-5"
                    >
                        <div className="text-xs font-medium text-slate-400 mb-2">
                            Situasjon {index + 1} av {SITUASJONER.length}
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 mb-4">
                            {situasjon.tekst}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {PRINSIPPER.map((p) => {
                                const Ikon = p.ikon;
                                const erFeil = feil.includes(p.id);
                                const erRiktig = phase === 'answered' && p.id === situasjon.svar;
                                const stil = erRiktig
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : erFeil
                                      ? 'bg-rose-50 border-rose-200 text-rose-400'
                                      : phase === 'answered'
                                        ? 'bg-white border-slate-200 text-slate-400'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md';
                                return (
                                    <motion.button
                                        key={p.id}
                                        type="button"
                                        onClick={() => velg(p.id)}
                                        disabled={phase !== 'question' || erFeil}
                                        animate={
                                            erFeil && p.id === sisteFeil
                                                ? { x: [0, -6, 6, -4, 4, 0] }
                                                : erRiktig
                                                  ? { scale: [1, 1.05, 1] }
                                                  : {}
                                        }
                                        transition={{ duration: 0.4 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`flex items-center gap-2 text-left border rounded-xl px-3 py-2 shadow-sm ${stil}`}
                                    >
                                        <Ikon className="w-4 h-4 shrink-0" />
                                        <span>
                                            <span className="block text-sm font-semibold leading-tight">
                                                {p.navn}
                                            </span>
                                            <span className="block text-xs opacity-75">{p.kort}</span>
                                        </span>
                                        {erRiktig && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
                                        {erFeil && <XCircle className="w-4 h-4 ml-auto shrink-0" />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Feedback-sone: alltid til stede */}
                        <div className="mt-4 min-h-[4.5rem]">
                            <AnimatePresence mode="wait">
                                {phase === 'answered' ? (
                                    <motion.div
                                        key="riktig"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                                    >
                                        <p className="font-semibold">{situasjon.forklaring}</p>
                                        <p className="mt-1 text-emerald-700">{situasjon.paragraf}</p>
                                    </motion.div>
                                ) : feilPrinsipp ? (
                                    <motion.div
                                        key={`feil-${sisteFeil}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                                    >
                                        Ikke helt. Spør deg selv: hva er det staten gjør galt her? Prøv
                                        et annet prinsipp.
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="tom"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                                    >
                                        Hvilken regel i rettsstaten blir brutt i denne situasjonen?
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                            >
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <div>
                                <p className="font-semibold text-slate-800">
                                    Du fant {forsteForsok} av {SITUASJONER.length} på første forsøk.
                                </p>
                                <p className="text-sm text-slate-500">
                                    Hvert prinsipp stopper én måte staten kan misbruke makten på.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                            {PRINSIPPER.map((p, i) => {
                                const Ikon = p.ikon;
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-center"
                                    >
                                        <Ikon className="w-5 h-5 mx-auto mb-1" />
                                        <p className="text-xs font-semibold leading-tight">{p.navn}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Mangler ett av disse, kan hvem som helst bli rammet - også du. Derfor
                            gjelder reglene for alle, også dem som kanskje er skyldige.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {phase === 'answered' ? (
                    <button
                        type="button"
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {index + 1 >= SITUASJONER.length ? 'Se resultatet' : 'Neste situasjon'}
                    </button>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
