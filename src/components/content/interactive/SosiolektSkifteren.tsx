import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Briefcase,
    Home,
    GraduationCap,
    Sparkles,
    RotateCcw,
    Check,
    Quote,
} from 'lucide-react';

// Signaturkomponent for artikkelen «Sosiolekt».
//
// Lyspære-øyeblikket: «Du snakker ikke likt overalt. Du har flere talemål, og
// du bytter mellom dem etter hvem du er sammen med — det er sosiolekt i
// praksis.» Eleven velger en situasjon og ser den SAMME beskjeden skifte stil,
// sammen med hvilket sosialt signal den nye stilen sender. Når alle fire
// situasjonene er utforsket, låses innsikten opp.

interface Situasjon {
    id: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    setning: string;
    signal: string;
    note: string;
    tone: 'uformell' | 'noytral' | 'formell';
}

const SITUASJONER: Situasjon[] = [
    {
        id: 'venn',
        label: 'Med bestevennen',
        Icon: Users,
        setning: 'Æ, skal vi kjøpe oss noe å spise etterpå, eller?',
        signal: 'Nærhet og avslappethet',
        note: 'Sammen med venner slapper du av. Du dropper høflige omveier, bruker korte ord og småord, og kanskje slang. Talemålet sier «vi hører sammen».',
        tone: 'uformell',
    },
    {
        id: 'intervju',
        label: 'I et jobbintervju',
        Icon: Briefcase,
        setning: 'Kunne det passe å spise lunsj sammen etterpå?',
        signal: 'Seriøsitet og respekt',
        note: 'I en formell situasjon legger du talemålet nærmere skriftspråket. Du velger hele, høflige setninger for å virke voksen og til å stole på.',
        tone: 'formell',
    },
    {
        id: 'familie',
        label: 'Hjemme med familien',
        Icon: Home,
        setning: 'Skal vi lage oss litt mat om litt?',
        signal: 'Trygghet og fortrolighet',
        note: 'Hjemme snakker du slik du alltid har gjort. Her sitter dialekten og familieordene løsest, fordi du ikke trenger å gjøre inntrykk på noen.',
        tone: 'noytral',
    },
    {
        id: 'klasse',
        label: 'I klasserommet',
        Icon: GraduationCap,
        setning: 'Kan vi ta en matpause ganske snart?',
        signal: 'Høflighet og orden',
        note: 'På skolen ligger du et sted i midten: tydelig og høflig, men ikke stivt. Du tilpasser talemålet til at det er en lærer og en hel klasse til stede.',
        tone: 'noytral',
    },
];

const TONE_STYLES: Record<Situasjon['tone'], { chip: string; label: string }> = {
    uformell: { chip: 'bg-rose-50 border-rose-200 text-rose-700', label: 'Uformell stil' },
    noytral: { chip: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Nøytral stil' },
    formell: { chip: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Formell stil' },
};

interface SosiolektSkifterenProps {
    title?: string;
}

export function SosiolektSkifteren({ title = 'Sosiolekt-skifteren' }: SosiolektSkifterenProps) {
    const [valgtId, setValgtId] = useState<string | null>(null);
    const [utforsket, setUtforsket] = useState<Set<string>>(new Set());

    const valgt = SITUASJONER.find((s) => s.id === valgtId) ?? null;
    const alleUtforsket = utforsket.size === SITUASJONER.length;

    const velg = (s: Situasjon) => {
        setValgtId(s.id);
        setUtforsket((prev) => {
            const next = new Set(prev);
            next.add(s.id);
            return next;
        });
    };

    const reset = () => {
        setValgtId(null);
        setUtforsket(new Set());
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en situasjon og se hvordan du selv bytter stil.
                    </p>
                </div>
            </div>

            {/* Situasjonsvalg */}
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SITUASJONER.map((s) => {
                        const Icon = s.Icon;
                        const erValgt = valgtId === s.id;
                        const erUtforsket = utforsket.has(s.id);
                        return (
                            <button
                                key={s.id}
                                onClick={() => velg(s)}
                                className={`relative rounded-xl border-2 p-3 text-center transition ${
                                    erValgt
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : erUtforsket
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-white'
                                }`}
                            >
                                {erUtforsket && !erValgt && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </span>
                                )}
                                <Icon
                                    className={`w-5 h-5 mx-auto mb-1.5 ${
                                        erValgt ? 'text-white' : 'text-indigo-500'
                                    }`}
                                />
                                <span className="text-xs font-semibold leading-tight block">
                                    {s.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Talemålsvindu — den samme beskjeden skifter stil */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 min-h-[132px] flex items-center">
                    <AnimatePresence mode="wait">
                        {valgt ? (
                            <motion.div
                                key={valgt.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                className="w-full"
                            >
                                <div className="flex items-start gap-2.5">
                                    <Quote className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-lg sm:text-xl font-semibold text-slate-800 leading-snug">
                                        {valgt.setning}
                                    </p>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${TONE_STYLES[valgt.tone].chip}`}
                                    >
                                        {TONE_STYLES[valgt.tone].label}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                                        Signaliserer: {valgt.signal}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                    {valgt.note}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full text-center text-sm text-slate-400 italic"
                            >
                                Trykk på en situasjon over. Beskjeden er den samme — men du sier den
                                på fire forskjellige måter.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback-sone: innsikten låses opp når alle er utforsket */}
            <AnimatePresence>
                {alleUtforsket && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="mx-4 sm:mx-6 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3"
                    >
                        <div className="flex items-start gap-2.5">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
                                <Check className="w-4 h-4 text-white" />
                            </span>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                Du snakker ikke likt overalt. Du har flere talemål, og du bytter
                                mellom dem etter hvem du er sammen med — helt uten å tenke over det.
                                Nettopp dette samspillet mellom talemål og sosial gruppe er kjernen i
                                en sosiolekt.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                    {utforsket.size} av {SITUASJONER.length} situasjoner utforsket
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
