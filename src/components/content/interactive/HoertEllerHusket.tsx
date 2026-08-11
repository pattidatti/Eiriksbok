import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenText, Brain, CheckCircle2, Ear, RotateCcw, Sparkles } from 'lucide-react';

type Klasse = 'shruti' | 'smriti';

interface Tekst {
    id: string;
    navn: string;
    fakta: string;
    klasse: Klasse;
    iPraksis: string;
    bomTekst: string;
}

interface HoertEllerHusketProps {
    title?: string;
}

const TEKSTER: Tekst[] = [
    {
        id: 'rigveda',
        navn: 'Rigveda',
        fakta: '1028 hymner i ti bøker',
        klasse: 'shruti',
        iPraksis:
            'Ifølge tradisjonen ble hymnene skuet av seere, ikke forfattet av mennesker. De resiteres på sanskrit, lyd for lyd.',
        bomTekst:
            'Ikke helt. Rigveda regnes ikke som forfattet av mennesker, og hører derfor til shruti.',
    },
    {
        id: 'upanishadene',
        navn: 'Upanishadene',
        fakta: 'Over 100 tekster, siste del av Veda',
        klasse: 'shruti',
        iPraksis:
            'Regnes som siste del av Veda. Ordet kan bety å sitte ved siden av, og peker på elever som lærer av en lærer.',
        bomTekst: 'Ikke helt. Upanishadene regnes som siste del av Veda, altså shruti.',
    },
    {
        id: 'bhagavadgita',
        navn: 'Bhagavadgita',
        fakta: 'Rundt 700 vers, i sjette bok av Mahabharata',
        klasse: 'smriti',
        iPraksis:
            'Den hinduistiske teksten som er oversatt til flest språk. Lavere rang enn Veda, men den teksten flest kjenner.',
        bomTekst:
            'Ikke helt. Bhagavadgita står inne i Mahabharata, og hører til de huskede tekstene.',
    },
    {
        id: 'mahabharata',
        navn: 'Mahabharata',
        fakta: 'Rundt 100 000 dobbeltvers',
        klasse: 'smriti',
        iPraksis:
            'Samlet under det mytiske forfatternavnet Vyasa. Kalles gjerne den femte Veda, men har altså et forfatternavn og teller ikke som Veda.',
        bomTekst: 'Ikke helt. Mahabharata knyttes til forfatternavnet Vyasa, og er smriti.',
    },
    {
        id: 'ramayana',
        navn: 'Ramayana',
        fakta: '24 000 tolinjede vers',
        klasse: 'smriti',
        iPraksis:
            'Forfatterskapet tilskrives Valmiki. Oversatt til nesten alle moderne indiske språk.',
        bomTekst: 'Ikke helt. Ramayana tilskrives dikteren Valmiki, og hører til smriti.',
    },
];

const KLASSER: Record<
    Klasse,
    { navn: string; undertittel: string; regel: string; ring: string; flate: string }
> = {
    shruti: {
        navn: 'Shruti',
        undertittel: 'det som er hørt',
        regel: 'Regnes som evig og uforanderlig, uten menneskelig forfatter.',
        ring: 'border-amber-300 bg-amber-50',
        flate: 'border-amber-200 bg-white',
    },
    smriti: {
        navn: 'Smriti',
        undertittel: 'det som er husket',
        regel: 'Knyttes alltid til en forfatter. Regnes som mindre evig.',
        ring: 'border-sky-300 bg-sky-50',
        flate: 'border-sky-200 bg-white',
    },
};

type Tone = 'nøytral' | 'ok' | 'feil';

export function HoertEllerHusket({ title = 'Hørt eller husket?' }: HoertEllerHusketProps) {
    const [plassert, setPlassert] = useState<Record<string, Klasse>>({});
    const [valgtId, setValgtId] = useState<string | null>(null);
    const [bomId, setBomId] = useState<string | null>(null);
    const [tone, setTone] = useState<Tone>('nøytral');
    const [melding, setMelding] = useState(
        'Klikk en tekst, og klikk deretter bunken du tror den hører til.'
    );

    const igjen = TEKSTER.filter((t) => !plassert[t.id]);
    const ferdig = igjen.length === 0;

    const plasser = (klasse: Klasse) => {
        if (!valgtId) {
            setTone('nøytral');
            setMelding('Velg en tekst i rekken over først.');
            return;
        }
        const tekst = TEKSTER.find((t) => t.id === valgtId);
        if (!tekst) return;

        if (tekst.klasse === klasse) {
            const nye = { ...plassert, [tekst.id]: klasse };
            setPlassert(nye);
            setValgtId(null);
            setTone('ok');
            setMelding(`${tekst.navn}: ${tekst.iPraksis}`);
        } else {
            setBomId(tekst.id);
            setTone('feil');
            setMelding(tekst.bomTekst);
        }
    };

    const nullstill = () => {
        setPlassert({});
        setValgtId(null);
        setBomId(null);
        setTone('nøytral');
        setMelding('Klikk en tekst, og klikk deretter bunken du tror den hører til.');
    };

    const toneKlasse =
        tone === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : tone === 'feil'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpenText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Plasser hver tekst i riktig klasse, og se hva plasseringen betyr i praksis.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="flex flex-wrap gap-2 min-h-[72px] items-start">
                    <AnimatePresence mode="popLayout">
                        {igjen.map((t) => {
                            const valgt = valgtId === t.id;
                            return (
                                <motion.button
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={
                                        bomId === t.id
                                            ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }
                                            : { opacity: 1, scale: 1, x: 0 }
                                    }
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onAnimationComplete={() => {
                                        if (bomId === t.id) setBomId(null);
                                    }}
                                    transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                                    onClick={() => {
                                        setValgtId(valgt ? null : t.id);
                                        setTone('nøytral');
                                        setMelding(
                                            valgt
                                                ? 'Velg en tekst i rekken over.'
                                                : `${t.navn} er valgt. Klikk en av de to bunkene.`
                                        );
                                    }}
                                    className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                                        valgt
                                            ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                                            : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md'
                                    }`}
                                >
                                    <span className="block text-sm font-semibold text-slate-800">
                                        {t.navn}
                                    </span>
                                    <span className="block text-xs text-slate-500">{t.fakta}</span>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                    {ferdig && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400 py-2"
                        >
                            Alle tekstene er plassert.
                        </motion.p>
                    )}
                </div>
            </div>

            <div className="px-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(KLASSER) as Klasse[]).map((k) => {
                    const info = KLASSER[k];
                    const Ikon = k === 'shruti' ? Ear : Brain;
                    const kort = TEKSTER.filter((t) => plassert[t.id] === k);
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => plasser(k)}
                            className={`text-left rounded-xl border-2 border-dashed p-3 min-h-[176px] transition-colors ${
                                valgtId
                                    ? `${info.ring} hover:shadow-md`
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Ikon className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="text-sm font-semibold text-slate-800">
                                    {info.navn}
                                </span>
                                <span className="text-xs text-slate-500">- {info.undertittel}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{info.regel}</p>
                            <div className="mt-3 space-y-2">
                                <AnimatePresence>
                                    {kort.map((t) => (
                                        <motion.div
                                            key={t.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.94 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 320,
                                                damping: 24,
                                            }}
                                            className={`rounded-lg border px-3 py-2 shadow-sm ${info.flate}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-800">
                                                        {t.navn}
                                                    </span>
                                                    <span className="block text-xs text-slate-600">
                                                        {t.iPraksis}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="px-5 pt-3">
                <motion.div
                    key={`${tone}-${melding}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg border px-4 py-3 text-sm ${toneKlasse}`}
                >
                    {melding}
                </motion.div>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="mx-5 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-emerald-800">
                                Legg merke til hvor Bhagavadgita havnet. Den regnes som husket, ikke
                                hørt, og har dermed lavere rang enn Veda. Likevel er det den
                                hinduistiske teksten som er oversatt til flest språk. Høyest
                                autoritet og størst utbredelse er ikke det samme.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {TEKSTER.length - igjen.length} av {TEKSTER.length} plassert
                </p>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
