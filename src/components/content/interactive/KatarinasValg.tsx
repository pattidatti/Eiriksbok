import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Feather, Users, RotateCcw, Check, ShieldAlert } from 'lucide-react';

interface Decision {
    id: string;
    title: string;
    note: string;
    lys: number;
    stotte: number;
}

interface KatarinasValgProps {
    title?: string;
    decisions?: Decision[];
    startStotte?: number;
    tapGrense?: number;
}

type Phase = 'idle' | 'active' | 'lost' | 'done';

const DEFAULT_DECISIONS: Decision[] = [
    {
        id: 'brev',
        title: 'Skriv brev til Voltaire og Diderot',
        note: 'Filosofene i Paris hyller deg som Europas mest opplyste hersker. I Russland merker ingen noe.',
        lys: 1,
        stotte: 0,
    },
    {
        id: 'kommisjon',
        title: 'Kall inn den lovgivende kommisjonen',
        note: 'Utsendinger fra hele riket møtes i 1767 for å lage nye lover. De blir aldri enige, og kommisjonen oppløses uten én eneste ny lov.',
        lys: 2,
        stotte: -5,
    },
    {
        id: 'skoler',
        title: 'Grunnlegg skoler og tidsskrifter',
        note: 'Adelens barn får undervisning, og det kommer bøker og blader på russisk. Bøndene lærer fortsatt ikke å lese.',
        lys: 2,
        stotte: 0,
    },
    {
        id: 'klageforbud',
        title: 'Forby bøndene å klage på godseieren',
        note: 'Mellom 1765 og 1767 gjør du det ulovlig for en bonde å klage på herren sin. Godseierne er fornøyde.',
        lys: -2,
        stotte: 15,
    },
    {
        id: 'adelsbrev',
        title: 'Gi adelen nye privilegier (1785)',
        note: 'Adelen slipper skatt og straff, og får sin makt skrevet ned i loven. Tronen din står tryggere enn noen gang.',
        lys: -2,
        stotte: 20,
    },
    {
        id: 'livegenskap',
        title: 'Opphev livegenskapet',
        note: 'Bøndene blir frie mennesker. Godseierne mister arbeidsfolkene sine over natta.',
        lys: 6,
        stotte: -110,
    },
];

export function KatarinasValg({
    title = 'Regjer som Katarina',
    decisions = DEFAULT_DECISIONS,
    startStotte = 100,
    tapGrense = 40,
}: KatarinasValgProps) {
    const [played, setPlayed] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('idle');

    const lys = played.reduce((sum, id) => sum + (decisions.find((d) => d.id === id)?.lys ?? 0), 0);
    const stotte = played.reduce(
        (sum, id) => sum + (decisions.find((d) => d.id === id)?.stotte ?? 0),
        startStotte
    );
    const siste = played.length ? decisions.find((d) => d.id === played[played.length - 1]) : null;
    const locked = phase === 'lost' || phase === 'done';

    const handlePlay = (d: Decision) => {
        if (locked || played.includes(d.id)) return;
        const nyStotte = stotte + d.stotte;
        setPlayed([...played, d.id]);
        setPhase(nyStotte < tapGrense ? 'lost' : 'active');
    };

    const handleReset = () => {
        setPlayed([]);
        setPhase('idle');
    };

    const dom = () => {
        if (lys >= 4) {
            return 'Du gjorde nøyaktig det Katarina gjorde: brev til filosofene, skoler for adelens barn og en kommisjon som aldri ble ferdig. Riket så opplyst ut utenfra. Ingen bonde ble friere.';
        }
        if (lys <= 0) {
            return 'Du valgte adelen, slik Katarina gjorde etter bondeopprøret i 1773. Tronen sto trygt, og de ufrie bøndene ble enda mer ufrie enn før.';
        }
        return 'Du prøvde å gjøre litt av begge deler. Det gjorde Katarina også, og det var alltid adelen som vant når hun måtte velge.';
    };

    const stotteFyll = Math.max(0, Math.min(100, (stotte / 140) * 100));
    const lysFyll = Math.max(0, Math.min(100, (lys / 6) * 100));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Crown className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk avgjørelsene du vil ta. Faller adelens støtte under {tapGrense},
                        mister du tronen.
                    </p>
                </div>
            </div>

            {/* Målerne */}
            <div className="px-5 pt-5 grid gap-4 sm:grid-cols-2">
                <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Feather className="w-4 h-4 text-blue-500" />
                            Opplysning
                        </span>
                        <span className="tabular-nums text-slate-500">{lys}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-blue-500"
                            animate={{ width: `${lysFyll}%` }}
                            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Users className="w-4 h-4 text-amber-500" />
                            Adelens støtte
                        </span>
                        <span className="tabular-nums text-slate-500">{Math.max(0, stotte)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${
                                stotte < tapGrense ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            animate={{ width: `${stotteFyll}%` }}
                            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                        />
                    </div>
                </div>
            </div>

            {/* Avgjørelseskortene */}
            <div className="p-5 grid gap-2.5 sm:grid-cols-2">
                {decisions.map((d) => {
                    const brukt = played.includes(d.id);
                    return (
                        <motion.button
                            key={d.id}
                            onClick={() => handlePlay(d)}
                            disabled={brukt || locked}
                            whileHover={brukt || locked ? undefined : { y: -2 }}
                            whileTap={brukt || locked ? undefined : { scale: 0.98 }}
                            animate={brukt ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                            transition={{ duration: 0.28 }}
                            className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                                brukt
                                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                                    : locked
                                      ? 'bg-white border-slate-200 text-slate-300'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md shadow-sm'
                            }`}
                        >
                            <span className="flex items-start gap-2">
                                {brukt && <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                                <span className="text-sm font-medium leading-snug">{d.title}</span>
                            </span>
                            <span className="mt-2 flex gap-2 text-xs">
                                <span
                                    className={`px-2 py-0.5 rounded-full ${
                                        d.lys >= 0
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    Opplysning {d.lys > 0 ? `+${d.lys}` : d.lys}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-full ${
                                        d.stotte >= 0
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-rose-50 text-rose-700'
                                    }`}
                                >
                                    Støtte {d.stotte > 0 ? `+${d.stotte}` : d.stotte}
                                </span>
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Tilbakemelding */}
            <div className="px-5 pb-1">
                <AnimatePresence mode="wait">
                    {phase === 'lost' && (
                        <motion.div
                            key="lost"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm leading-relaxed"
                        >
                            <span className="flex items-center gap-2 font-semibold mb-1">
                                <ShieldAlert className="w-4 h-4" />
                                Du mistet tronen
                            </span>
                            Garden marsjerte mot palasset. Slik gikk det med Katarinas mann, Peter 3.,
                            i 1762: den samme garden avsatte ham og gjorde Katarina til keiserinne.
                            Adelen eide bøndene. Tok du bøndene fra adelen, tok adelen tronen fra deg.
                        </motion.div>
                    )}
                    {phase === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                        >
                            <span className="font-semibold block mb-1">
                                Regjeringstiden er over
                            </span>
                            {dom()} Livegenskapet i Russland ble ikke opphevet før i 1861, 65 år
                            etter at Katarina døde.
                        </motion.div>
                    )}
                    {phase === 'active' && siste && (
                        <motion.div
                            key={siste.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                        >
                            {siste.note}
                        </motion.div>
                    )}
                    {phase === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm leading-relaxed"
                        >
                            Året er 1762. Du har nettopp tatt tronen, og du har lest
                            opplysningsfilosofene. Hva gjør du med Russland?
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    onClick={() => setPhase('done')}
                    disabled={phase !== 'active'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Avslutt regjeringstiden
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
