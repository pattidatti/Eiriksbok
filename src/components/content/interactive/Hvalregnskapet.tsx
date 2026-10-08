import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Fish, Play, RotateCcw, Lightbulb, Waves } from 'lucide-react';

interface HvalregnskapetProps {
    title?: string;
    seasons?: number;
}

type Phase = 'velg' | 'fanger' | 'ferdig';

interface Forsok {
    kvote: number;
    totalt: number;
    igjen: number;
}

// Forenklet, tenkt modell - ikke historiske tall.
// Havet har plass til 110 hval. Hver sesong får bestanden unger tilsvarende 10 prosent,
// men aldri flere enn havet har plass til. Da tåler bestanden å miste rundt 10 dyr i året.
const START = 100;
const TAK = 110;
const VEKST = 0.1;
const IKONER = 20; // hvert ikon = 5 hval
const KVOTER = [0, 5, 10, 15, 20, 30, 40];

function nesteSesong(bestand: number, kvote: number) {
    const etterUnger = Math.min(TAK, bestand * (1 + VEKST));
    const fangst = Math.min(kvote, etterUnger);
    return { bestand: Math.max(0, etterUnger - fangst), fangst };
}

export function Hvalregnskapet({
    title = 'Hvalregnskapet',
    seasons = 20,
}: HvalregnskapetProps) {
    const [phase, setPhase] = useState<Phase>('velg');
    const [kvote, setKvote] = useState(30);
    const [bestand, setBestand] = useState(START);
    const [fangster, setFangster] = useState<number[]>([]);
    const [forsok, setForsok] = useState<Forsok[]>([]);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearInterval(timer.current), []);

    const start = () => {
        setPhase('fanger');
        setBestand(START);
        setFangster([]);
        let b = START;
        const liste: number[] = [];
        timer.current = window.setInterval(() => {
            const steg = nesteSesong(b, kvote);
            b = steg.bestand;
            liste.push(steg.fangst);
            setBestand(b);
            setFangster([...liste]);
            if (liste.length >= seasons) {
                window.clearInterval(timer.current);
                const totalt = Math.round(liste.reduce((s, x) => s + x, 0));
                setForsok((f) => [...f.slice(-3), { kvote, totalt, igjen: Math.round(b) }]);
                setPhase('ferdig');
            }
        }, 250);
    };

    const reset = () => {
        window.clearInterval(timer.current);
        setPhase('velg');
        setBestand(START);
        setFangster([]);
        setForsok([]);
    };

    const totalt = Math.round(fangster.reduce((s, x) => s + x, 0));
    const igjen = Math.round(bestand);
    const levende = Math.ceil(bestand / 5);
    const tomt = phase === 'ferdig' && igjen === 0;
    const baerekraftig = phase === 'ferdig' && igjen >= 90;

    let melding = 'Velg hvor mange hval flåten skal fange hver sesong, og trykk «Start fangsten».';
    if (phase === 'fanger') melding = `Sesong ${fangster.length} av ${seasons} ...`;
    if (phase === 'ferdig') {
        if (tomt) {
            melding = `Havet er tomt. Du fikk ${totalt} hval i alt, og nå er det ingen igjen å fange - verken neste år eller året etter. Prøv en lavere kvote og sammenlign.`;
        } else if (baerekraftig) {
            melding = `Det er fortsatt ${igjen} hval i havet. Du fikk ${totalt} hval, og flåten kan fortsette slik i hundre år. Hvalene rakk å få like mange unger som du tok.`;
        } else {
            melding = `Du fikk ${totalt} hval, men bare ${igjen} er igjen. Du tok flere enn hvalene rakk å få unger, så bestanden krymper hvert år. Snart er fangsten over.`;
        }
    }

    // Lyspære-øyeblikket: grådig kvote ga færre hval totalt enn en forsiktig kvote
    const grad = forsok.find((f) => f.igjen === 0);
    const forsiktig = forsok.find((f) => f.igjen >= 90 && f.kvote > 0);
    const innsikt = grad && forsiktig && forsiktig.totalt >= grad.totalt;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Anchor className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en fangstkvote, kjør {seasons} sesonger og se hva som skjer med
                        hvalene. Prøv flere kvoter.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-5 md:grid-cols-2">
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                        Hval fanget per sesong
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {KVOTER.map((k) => (
                            <motion.button
                                key={k}
                                whileTap={{ scale: 0.92 }}
                                disabled={phase === 'fanger'}
                                onClick={() => {
                                    setKvote(k);
                                    if (phase === 'ferdig') setPhase('velg');
                                }}
                                className={`w-12 h-10 rounded-xl border text-sm font-semibold ${
                                    kvote === k
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                } disabled:opacity-50`}
                            >
                                {k}
                            </motion.button>
                        ))}
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                        <Waves className="w-4 h-4 text-sky-500" />
                        <span>
                            Hval i havet: <strong className="text-slate-800">{igjen}</strong>
                            {' · '}Fanget i alt:{' '}
                            <strong className="text-slate-800">{totalt}</strong>
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-sky-50 border border-sky-100">
                        {Array.from({ length: IKONER }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    opacity: i < levende ? 1 : 0.12,
                                    scale: i < levende ? 1 : 0.7,
                                }}
                                transition={{ duration: 0.25 }}
                                className="flex items-center justify-center"
                            >
                                <Fish className="w-5 h-5 text-sky-600" />
                            </motion.div>
                        ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Hvert ikon er 5 hval. Forenklet modell, ikke ekte tall.
                    </p>
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Fangst hver sesong</p>
                    <div className="h-28 flex items-end gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        {Array.from({ length: seasons }).map((_, i) => {
                            const f = fangster[i] ?? 0;
                            return (
                                <div key={i} className="flex-1 h-full flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(f / 40) * 100}%` }}
                                        className={`w-full rounded-t ${
                                            f < kvote && i < fangster.length
                                                ? 'bg-rose-400'
                                                : 'bg-indigo-400'
                                        }`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Rød søyle: båtene fant ikke nok hval til å fylle kvoten.
                    </p>

                    <div className="mt-3 space-y-1 min-h-[5.5rem]">
                        <AnimatePresence>
                            {forsok.map((f, i) => (
                                <motion.div
                                    key={`${i}-${f.kvote}-${f.totalt}`}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`text-xs px-3 py-1 rounded-lg border ${
                                        f.igjen === 0
                                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                                            : f.igjen >= 90
                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                              : 'bg-amber-50 border-amber-200 text-amber-700'
                                    }`}
                                >
                                    Kvote {f.kvote}: fikk {f.totalt} hval, {f.igjen} igjen
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={innsikt ? 'innsikt' : melding}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, scale: innsikt ? [1, 1.03, 1] : 1 }}
                    exit={{ opacity: 0 }}
                    className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm flex gap-2 ${
                        innsikt || baerekraftig
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : tomt
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                >
                    <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                        {innsikt
                            ? `Se på forsøkene dine: Med kvote ${forsiktig.kvote} fikk du ${forsiktig.totalt} hval og havet er fortsatt fullt. Med kvote ${grad.kvote} fikk du bare ${grad.totalt}, og havet er tomt. Den som tar mest hvert år, får minst til sammen. Det var dette hvalfangerne i Sørishavet lærte for sent.`
                            : melding}
                    </span>
                </motion.div>
            </AnimatePresence>

            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={start}
                    disabled={phase === 'fanger'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Play className="w-4 h-4" />
                    {phase === 'ferdig' ? 'Prøv igjen' : 'Start fangsten'}
                </button>
                <button
                    onClick={reset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
