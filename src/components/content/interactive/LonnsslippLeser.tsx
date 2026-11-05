import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, Lightbulb, RotateCcw, Trophy, Wallet } from 'lucide-react';

// LonnsslippLeser: en lønnsslipp fra en sommerjobb der eleven klikker på hver linje og får den
// forklart. En bryter øverst lar eleven bytte mellom to situasjoner: frikortet har nok beløp igjen
// hos denne arbeidsgiveren, eller hele frikortbeløpet er lagt på en annen jobb. Da må denne
// arbeidsgiveren trekke 50 prosent skatt, og nettolønnen faller til det halve.
//
// Lyspære-øyeblikket: Nettolønn er bruttolønn minus trekk, og hvor stort trekket blir avhenger av
// skattekortet ditt, ikke av hvor hardt du jobbet. Er det trukket for mye, får du pengene igjen.
//
// Reglene (frikort på 100 000 kroner, 50 prosent trekk når frikortbeløpet er brukt opp hos en
// arbeidsgiver, feriepenger på 10,2 prosent) kommer fra Skatteetaten og Store norske leksikon.
// Timelønn og antall timer er et tenkt eksempel.

interface LonnsslippLeserProps {
    title?: string;
    arbeidsgiver?: string;
    navn?: string;
    timelonn?: number;
    timer?: number;
}

type Kort = 'frikort' | 'brukt-opp';
type LinjeId = 'timer' | 'brutto' | 'trekk' | 'netto' | 'feriepenger';

const kr = (n: number) =>
    n.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';

export function LonnsslippLeser({
    title = 'Les lønnsslippen',
    arbeidsgiver = 'Strandkiosken AS',
    navn = 'Ida Hansen',
    timelonn = 165,
    timer = 80,
}: LonnsslippLeserProps) {
    const [kort, setKort] = useState<Kort>('frikort');
    const [aktiv, setAktiv] = useState<LinjeId | null>(null);
    const [sett, setSett] = useState<Set<LinjeId>>(new Set());
    const [provdKort, setProvdKort] = useState<Set<Kort>>(new Set(['frikort']));

    const brutto = timelonn * timer;
    const trekk = kort === 'frikort' ? 0 : brutto * 0.5;
    const netto = brutto - trekk;
    const feriepenger = brutto * 0.102;

    const linjer: { id: LinjeId; tekst: string; belop: string; minus?: boolean; forklaring: string }[] = [
        {
            id: 'timer',
            tekst: `Timelønn ${timelonn} kr × ${timer} timer`,
            belop: kr(brutto),
            forklaring:
                'Her står hva du har jobbet og hva du får per time. Sjekk alltid at antall timer stemmer med det du faktisk jobbet.',
        },
        {
            id: 'brutto',
            tekst: 'Bruttolønn',
            belop: kr(brutto),
            forklaring:
                'Bruttolønn er hele lønnen før noe er trukket fra. Det er dette tallet arbeidsgiveren og du avtalte.',
        },
        {
            id: 'trekk',
            tekst: kort === 'frikort' ? 'Skattetrekk (frikort)' : 'Skattetrekk (50 %)',
            belop: '− ' + kr(trekk),
            minus: true,
            forklaring:
                kort === 'frikort'
                    ? 'Frikortet sier til arbeidsgiveren at du ikke skal betale skatt så lenge du tjener 100 000 kroner eller mindre i året. Derfor trekkes ingenting.'
                    : 'Hele frikortbeløpet ligger hos en annen arbeidsgiver. Da må denne arbeidsgiveren trekke 50 prosent. Pengene er ikke borte: du får dem igjen etter skatteoppgjøret året etter, og du kan flytte frikortbeløpet selv.',
        },
        {
            id: 'netto',
            tekst: 'Utbetalt til konto (nettolønn)',
            belop: kr(netto),
            forklaring:
                'Nettolønn er det som faktisk kommer inn på kontoen: bruttolønn minus alle trekk.',
        },
        {
            id: 'feriepenger',
            tekst: 'Opptjent feriepenger (10,2 %)',
            belop: kr(feriepenger),
            forklaring:
                'Feriepengene får du ikke nå. Du tjener dem opp i år og får dem utbetalt neste år, vanligvis i juni. Da blir det ikke trukket skatt av dem.',
        },
    ];

    const ferdig = sett.size === linjer.length && provdKort.size === 2;
    const aktivLinje = linjer.find((l) => l.id === aktiv);

    const velgLinje = (id: LinjeId) => {
        setAktiv(id);
        setSett((s) => new Set(s).add(id));
    };

    const byttKort = (k: Kort) => {
        setKort(k);
        setProvdKort((s) => new Set(s).add(k));
        if (aktiv === 'trekk' || aktiv === 'netto') setAktiv('trekk');
    };

    const reset = () => {
        setKort('frikort');
        setAktiv(null);
        setSett(new Set());
        setProvdKort(new Set(['frikort']));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på hver linje i lønnsslippen. Bytt så skattekort og se hva som skjer.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 grid gap-4">
                {/* Lønnsslippen */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-3">
                        <span className="font-semibold text-slate-700">{arbeidsgiver}</span>
                        <span>Lønnsslipp juli</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">Ansatt: {navn}</div>

                    <div className="flex gap-2 mb-3">
                        {(['frikort', 'brukt-opp'] as Kort[]).map((k) => (
                            <button
                                key={k}
                                onClick={() => byttKort(k)}
                                className={`flex-1 text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${
                                    kort === k
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {k === 'frikort' ? 'Frikortet ligger her' : 'Frikortet ligger på en annen jobb'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        {linjer.map((l) => {
                            const valgt = aktiv === l.id;
                            const lest = sett.has(l.id);
                            return (
                                <motion.button
                                    key={l.id}
                                    onClick={() => velgLinje(l.id)}
                                    whileTap={{ scale: 0.98 }}
                                    animate={{
                                        backgroundColor: valgt ? '#eef2ff' : '#ffffff',
                                        borderColor: valgt ? '#a5b4fc' : '#e2e8f0',
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 text-left text-sm border rounded-lg px-3 py-2 ${
                                        l.id === 'netto' ? 'font-semibold' : ''
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-slate-700">
                                        {lest ? (
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                        {l.tekst}
                                    </span>
                                    <motion.span
                                        key={l.belop}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`tabular-nums whitespace-nowrap ${
                                            l.id === 'feriepenger'
                                                ? 'text-slate-400'
                                                : l.minus && trekk > 0
                                                  ? 'text-rose-600'
                                                  : 'text-slate-800'
                                        }`}
                                    >
                                        {l.belop}
                                    </motion.span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Forklaring */}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="min-h-[96px]">
                        <AnimatePresence mode="wait">
                            {aktivLinje ? (
                                <motion.div
                                    key={aktivLinje.id + kort}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    className="h-full rounded-xl bg-blue-50 border border-blue-200 text-blue-800 p-4 text-sm"
                                >
                                    <div className="flex items-center gap-2 font-semibold mb-1">
                                        <Lightbulb className="w-4 h-4" />
                                        {aktivLinje.tekst}
                                    </div>
                                    {aktivLinje.forklaring}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="tom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 p-4 text-sm flex items-center justify-center text-center"
                                >
                                    Klikk på en linje i lønnsslippen for å se hva den betyr.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3 text-sm flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="flex-1">
                            <div className="text-slate-500 text-xs">Inn på kontoen</div>
                            <motion.div
                                key={netto}
                                initial={{ scale: 1.15 }}
                                animate={{ scale: 1 }}
                                className={`font-bold text-lg tabular-nums ${
                                    trekk > 0 ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                            >
                                {kr(netto)}
                            </motion.div>
                        </div>
                        <div className="text-xs text-slate-500 text-right">
                            Linjer lest: {sett.size}/{linjer.length}
                            <br />
                            Skattekort prøvd: {provdKort.size}/2
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring' }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                Du kan lese en lønnsslipp! Bruttolønnen var den samme hele tiden. Det
                                eneste som endret seg, var skattekortet. Netto er brutto minus trekk, og
                                blir det trukket for mye, får du pengene igjen etter skatteoppgjøret.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ikke-ferdig"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            {provdKort.size < 2
                                ? 'Tips: Trykk på «Frikortet ligger på en annen jobb» og se hva som skjer med kontoen.'
                                : 'Les alle linjene for å bli ferdig.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={() => velgLinje(linjer.find((l) => !sett.has(l.id))?.id ?? 'netto')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Neste linje
                </button>
                <button
                    onClick={reset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
