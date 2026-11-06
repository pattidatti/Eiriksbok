import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Lock, Minus, PiggyBank, Plus, RotateCcw, Trophy, Wallet } from 'lucide-react';

// HybelBudsjett: eleven fordeler en månedsinntekt på hybel. De faste utgiftene er låst, de
// variable kan eleven flytte penger mellom, og én post er buffer. Når hele beløpet har fått en
// jobb, starter måneden - og så kommer en uventet regning. Har eleven satt av nok i buffer, går
// regningen rett gjennom. Hvis ikke må eleven ta pengene fra mat, klær eller fritid.
//
// Lyspære-øyeblikket: Et budsjett er en plan med valg. De faste utgiftene kan du ikke gjøre noe
// med på kort sikt, men du kan velge hvordan resten fordeles - og en buffer gjør at en uventet
// regning ikke velter hele måneden.
//
// Skillet mellom faste og variable utgifter og rådet om buffer kommer fra Store norske leksikon
// (husholdningsbudsjett). Alle kronebeløp er et tenkt eksempel.

interface HybelBudsjettProps {
    title?: string;
    navn?: string;
    inntekt?: number;
    regningTekst?: string;
    regningBelop?: number;
}

type Fase = 'fordel' | 'regning' | 'ferdig';
type PostId = 'mat' | 'klaer' | 'fritid' | 'buffer';
type Dekning = 'full' | 'delvis' | 'ingen';

const STEG = 100;

const FASTE = [
    { navn: 'Husleie', belop: 5000 },
    { navn: 'Mobil', belop: 300 },
    { navn: 'Busskort', belop: 500 },
];

const POSTER: { id: PostId; navn: string; hint: string }[] = [
    { id: 'mat', navn: 'Mat', hint: 'Middag, frokost og matpakke hele måneden' },
    { id: 'klaer', navn: 'Klær og hygiene', hint: 'Sko, tannkrem, sjampo' },
    { id: 'fritid', navn: 'Fritid og moro', hint: 'Kino, kafé, spill, strømming' },
    { id: 'buffer', navn: 'Buffer', hint: 'Penger til det du ikke vet om ennå' },
];

const START: Record<PostId, number> = { mat: 0, klaer: 0, fritid: 0, buffer: 0 };

const kr = (n: number) => n.toLocaleString('nb-NO') + ' kr';

export function HybelBudsjett({
    title = 'Første måned på hybel',
    navn = 'Jonas',
    inntekt = 10000,
    regningTekst = 'Mobilskjermen knuser. Reparasjonen koster',
    regningBelop = 1200,
}: HybelBudsjettProps) {
    const [fase, setFase] = useState<Fase>('fordel');
    const [poster, setPoster] = useState<Record<PostId, number>>(START);
    const [manglerIgjen, setManglerIgjen] = useState(0);
    const [dekning, setDekning] = useState<Dekning>('ingen');

    const sumFaste = FASTE.reduce((s, f) => s + f.belop, 0);
    const fordelt = Object.values(poster).reduce((s, v) => s + v, 0);
    const igjen = inntekt - sumFaste - fordelt;

    const endre = (id: PostId, delta: number) => {
        if (fase !== 'fordel') return;
        setPoster((p) => {
            const ny = p[id] + delta;
            if (ny < 0) return p;
            if (delta > 0 && igjen < delta) return p;
            return { ...p, [id]: ny };
        });
    };

    const startManeden = () => {
        if (igjen !== 0) return;
        const fraBuffer = Math.min(poster.buffer, regningBelop);
        const rest = regningBelop - fraBuffer;
        setPoster((p) => ({ ...p, buffer: p.buffer - fraBuffer }));
        setDekning(rest === 0 ? 'full' : fraBuffer > 0 ? 'delvis' : 'ingen');
        setManglerIgjen(rest);
        setFase(rest === 0 ? 'ferdig' : 'regning');
    };

    const kutt = (id: PostId) => {
        if (fase !== 'regning' || poster[id] < STEG) return;
        const ta = Math.min(STEG, manglerIgjen);
        setPoster((p) => ({ ...p, [id]: p[id] - ta }));
        const rest = manglerIgjen - ta;
        setManglerIgjen(rest);
        if (rest === 0) setFase('ferdig');
    };

    const reset = () => {
        setFase('fordel');
        setPoster(START);
        setManglerIgjen(0);
        setDekning('ingen');
    };


    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {navn} har {kr(inntekt)} denne måneden. Gi hver krone en jobb med + og −, og
                        start måneden.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
                {/* Faste utgifter */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[240px]">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Faste utgifter - låst hver måned
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {FASTE.map((f) => (
                                <span
                                    key={f.navn}
                                    className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600"
                                >
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    {f.navn}
                                    <span className="tabular-nums text-slate-800 font-medium">{kr(f.belop)}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 min-w-[150px]">
                        <div className="text-xs text-slate-500">
                            {fase === 'fordel' ? 'Ikke fordelt ennå' : 'Uventet regning'}
                        </div>
                        <motion.div
                            key={fase === 'fordel' ? igjen : 'regning'}
                            initial={{ scale: 1.15 }}
                            animate={{ scale: 1 }}
                            className={`font-bold text-xl tabular-nums ${
                                fase !== 'fordel'
                                    ? 'text-rose-600'
                                    : igjen === 0
                                      ? 'text-emerald-600'
                                      : 'text-indigo-600'
                            }`}
                        >
                            {fase === 'fordel' ? kr(igjen) : kr(regningBelop)}
                        </motion.div>
                    </div>
                </div>

                {/* Variable utgifter og buffer */}
                <div className="space-y-2 min-w-0">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Variable utgifter - du velger
                    </div>
                    {POSTER.map((p) => {
                        const erBuffer = p.id === 'buffer';
                        const kanKutte = fase === 'regning' && !erBuffer && poster[p.id] >= STEG;
                        return (
                            <motion.div
                                key={p.id}
                                layout
                                animate={{
                                    backgroundColor: erBuffer ? '#ecfdf5' : '#ffffff',
                                    borderColor: kanKutte ? '#fda4af' : erBuffer ? '#a7f3d0' : '#e2e8f0',
                                }}
                                className="flex items-center gap-3 border rounded-xl px-3 py-2"
                            >
                                {erBuffer && <PiggyBank className="w-5 h-5 text-emerald-600 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-800">{p.navn}</div>
                                    <div className="text-xs text-slate-500 truncate">{p.hint}</div>
                                </div>
                                {fase === 'fordel' ? (
                                    <div className="flex items-center gap-1.5">
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, -STEG * 5)}
                                            disabled={poster[p.id] < STEG * 5}
                                            className="hidden sm:block text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                                        >
                                            −500
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, -STEG)}
                                            disabled={poster[p.id] < STEG}
                                            aria-label={`Mindre til ${p.navn}`}
                                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </motion.button>
                                        <motion.span
                                            key={poster[p.id]}
                                            initial={{ y: -4, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="w-20 text-right tabular-nums text-sm font-semibold text-slate-800"
                                        >
                                            {kr(poster[p.id])}
                                        </motion.span>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, STEG)}
                                            disabled={igjen < STEG}
                                            aria-label={`Mer til ${p.navn}`}
                                            className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-30"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => endre(p.id, STEG * 5)}
                                            disabled={igjen < STEG * 5}
                                            className="hidden sm:block text-xs px-2 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-30"
                                        >
                                            +500
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <motion.span
                                            key={poster[p.id]}
                                            initial={{ scale: 1.2, color: '#e11d48' }}
                                            animate={{ scale: 1, color: '#1e293b' }}
                                            className="w-20 text-right tabular-nums text-sm font-semibold"
                                        >
                                            {kr(poster[p.id])}
                                        </motion.span>
                                        {kanKutte && (
                                            <motion.button
                                                initial={{ opacity: 0, x: 8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => kutt(p.id)}
                                                className="text-xs px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                                            >
                                                Ta 100 kr
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4">
                <AnimatePresence mode="wait">
                    {fase === 'fordel' && (
                        <motion.div
                            key="fordel"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            {igjen > 0
                                ? `Du har ${kr(igjen)} igjen å fordele. Hver krone skal ha en jobb før måneden starter.`
                                : 'Alt er fordelt. Trykk «Start måneden» og se hva som skjer.'}
                        </motion.div>
                    )}
                    {fase === 'regning' && (
                        <motion.div
                            key="regning"
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2"
                        >
                            <motion.span
                                initial={{ rotate: -15 }}
                                animate={{ rotate: [-15, 15, -10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                Den 12. i måneden: {regningTekst} {kr(regningBelop)}.{' '}
                                {dekning === 'delvis' ? 'Bufferen dekket litt, men ikke alt. ' : 'Du har ingen buffer. '}
                                Du mangler <span className="font-semibold">{kr(manglerIgjen)}</span>. Ta pengene
                                fra en annen post - hva vil du klare deg uten resten av måneden?
                            </span>
                        </motion.div>
                    )}
                    {fase === 'ferdig' && (
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
                                {dekning === 'ingen'
                                    ? `Du klarte det, men regningen på ${kr(regningBelop)} måtte tas fra mat, klær eller fritid. Prøv igjen og sett av en buffer først - da kan du se hvor mye roligere måneden blir.`
                                    : dekning === 'full'
                                      ? `Bufferen tok hele regningen! Mat, klær og fritid er urørt. Det er dette en buffer er til: den gjør at en uventet regning ikke velter hele måneden.`
                                      : `Regningen er betalt. Bufferen tok en del, og resten måtte du kutte et annet sted. Litt mer i buffer, og du hadde sluppet å kutte.`}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={startManeden}
                    disabled={fase !== 'fordel' || igjen !== 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600"
                >
                    Start måneden
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
