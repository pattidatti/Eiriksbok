import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Coins, Info, RotateCcw, Sprout, TrendingUp, Trophy } from 'lucide-react';

// RentesRenteKurve: eleven velger når hen begynner å spare, hvor mye hver måned og hvilken
// rente pengene får. Kurven viser to ting: pengene eleven har satt inn selv (grå), og hvor mye
// det har vokst til med renter på renter (grønn). En stiplet linje viser hva som skjer hvis
// du begynner ti år senere.
//
// Lyspære-øyeblikket: Tid er den viktigste ingrediensen i sparing. Jo tidligere du begynner,
// jo større del av sluttsummen er renter - penger du aldri har satt inn selv. Beløpet du sparer
// endrer ikke det forholdet. Det gjør bare tiden og renten.
//
// Utregningen følger renteregningen i Store norske leksikon: etter hver termin legges rentene
// til innskuddet. Her er terminen ett år. Rentesatsene er et tenkt eksempel, ikke et løfte om
// avkastning.

interface RentesRenteKurveProps {
    title?: string;
    sluttAlder?: number;
    startAlder?: number;
    manedsBelop?: number;
    rente?: number;
}

type Fase = 'aktiv' | 'ferdig';

const RENTER = [3, 5, 7];
const MIN_ALDER = 15;
const MAKS_ALDER = 50;

const kr = (n: number) => Math.round(n).toLocaleString('nb-NO') + ' kr';

interface Punkt {
    alder: number;
    innskudd: number;
    verdi: number;
}

// Sparer et fast beløp hver måned. Ved slutten av hvert år legges renten til.
function regnUt(start: number, slutt: number, belop: number, rentePst: number): Punkt[] {
    const punkter: Punkt[] = [{ alder: start, innskudd: 0, verdi: 0 }];
    let verdi = 0;
    let innskudd = 0;
    for (let alder = start; alder < slutt; alder++) {
        verdi += belop * 12;
        innskudd += belop * 12;
        verdi *= 1 + rentePst / 100;
        punkter.push({ alder: alder + 1, innskudd, verdi });
    }
    return punkter;
}

const B = 400;
const H = 260;
const MARG = 22;
const PAD_V = 8;
const PAD_B = 24;

export function RentesRenteKurve({
    title = 'Rentes rente-kurven',
    sluttAlder = 60,
    startAlder = 40,
    manedsBelop = 500,
    rente = 5,
}: RentesRenteKurveProps) {
    const [start, setStart] = useState(startAlder);
    const [belop, setBelop] = useState(manedsBelop);
    const [rentePst, setRentePst] = useState(rente);
    const [fase, setFase] = useState<Fase>('aktiv');
    const [harEndretBelop, setHarEndretBelop] = useState(false);

    const punkter = useMemo(
        () => regnUt(start, sluttAlder, belop, rentePst),
        [start, sluttAlder, belop, rentePst]
    );
    const senereStart = Math.min(start + 10, sluttAlder);
    const senere = useMemo(
        () => regnUt(senereStart, sluttAlder, belop, rentePst),
        [senereStart, sluttAlder, belop, rentePst]
    );

    const siste = punkter[punkter.length - 1];
    const sisteSenere = senere[senere.length - 1];
    const renter = siste.verdi - siste.innskudd;
    const renteAndel = siste.verdi > 0 ? Math.round((renter / siste.verdi) * 100) : 0;
    const maalNadd = renter > siste.innskudd;

    if (maalNadd && fase === 'aktiv') {
        // Settes én gang og blir stående til eleven tilbakestiller.
        setFase('ferdig');
    }

    // Skala: største verdi på kurven ved tidligste start med valgt beløp og rente, så kurven
    // faktisk vokser synlig når eleven flytter startalderen bakover.
    const maksVerdi = useMemo(() => {
        const tidligst = regnUt(MIN_ALDER, sluttAlder, belop, rentePst);
        return Math.max(tidligst[tidligst.length - 1].verdi, 1);
    }, [sluttAlder, belop, rentePst]);
    const x = (alder: number) =>
        ((alder - MIN_ALDER) / (sluttAlder - MIN_ALDER)) * (B - 2 * MARG) + MARG;
    const y = (v: number) => H - PAD_B - (v / maksVerdi) * (H - PAD_B - PAD_V);

    const linje = (ps: Punkt[], felt: 'innskudd' | 'verdi') =>
        ps.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.alder)},${y(p[felt])}`).join(' ');
    const flate = (ps: Punkt[], felt: 'innskudd' | 'verdi') =>
        `${linje(ps, felt)} L${x(ps[ps.length - 1].alder)},${y(0)} L${x(ps[0].alder)},${y(0)} Z`;

    const aksen = [15, 30, 45, 60].filter((a) => a <= sluttAlder);

    const tilbakestill = () => {
        setStart(startAlder);
        setBelop(manedsBelop);
        setRentePst(rente);
        setFase('aktiv');
        setHarEndretBelop(false);
    };

    let feedback: { tone: 'info' | 'ok'; tekst: string };
    if (fase === 'ferdig') {
        feedback = {
            tone: 'ok',
            tekst: `Nå er rentene større enn det du har satt inn selv. Av ${kr(siste.verdi)} er ${renteAndel} prosent renter. Starter du ti år senere, ender du med ${kr(sisteSenere.verdi)}.`,
        };
    } else if (harEndretBelop) {
        feedback = {
            tone: 'info',
            tekst: `Legg merke til at renteandelen fortsatt er ${renteAndel} prosent. Sparer du mer, blir alt større, men forholdet blir det samme. Prøv startalderen i stedet.`,
        };
    } else {
        feedback = {
            tone: 'info',
            tekst: `Akkurat nå er ${renteAndel} prosent av pengene renter. Klarer du å få rentene større enn det du har satt inn selv?`,
        };
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Flytt startalderen og se hvor mye av pengene som blir renter innen du
                        er {sluttAlder}.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[1fr_14rem] md:items-center">
                {/* Kurven */}
                <div>
                    <svg
                        viewBox={`0 0 ${B} ${H}`}
                        className="w-full h-auto"
                        role="img"
                        aria-label={`Sparing fra ${start} til ${sluttAlder} år: ${kr(siste.innskudd)} satt inn, ${kr(siste.verdi)} til sammen`}
                    >
                        <line x1={MARG} x2={B - MARG} y1={y(0)} y2={y(0)} stroke="#cbd5e1" />
                        {aksen.map((a) => (
                            <g key={a}>
                                <line x1={x(a)} x2={x(a)} y1={y(0)} y2={y(0) + 4} stroke="#94a3b8" />
                                <text
                                    x={x(a)}
                                    y={H - 6}
                                    textAnchor="middle"
                                    className="fill-slate-400"
                                    fontSize={13}
                                >
                                    {a} år
                                </text>
                            </g>
                        ))}
                        <motion.path
                            d={flate(punkter, 'verdi')}
                            fill="#d1fae5"
                            animate={{ d: flate(punkter, 'verdi') }}
                            transition={{ duration: 0.35 }}
                        />
                        <motion.path
                            d={flate(punkter, 'innskudd')}
                            fill="#cbd5e1"
                            animate={{ d: flate(punkter, 'innskudd') }}
                            transition={{ duration: 0.35 }}
                        />
                        <motion.path
                            d={linje(punkter, 'verdi')}
                            fill="none"
                            stroke="#059669"
                            strokeWidth={3}
                            animate={{ d: linje(punkter, 'verdi') }}
                            transition={{ duration: 0.35 }}
                        />
                        {senereStart < sluttAlder && (
                            <motion.path
                                d={linje(senere, 'verdi')}
                                fill="none"
                                stroke="#f97316"
                                strokeWidth={2}
                                strokeDasharray="6 5"
                                animate={{ d: linje(senere, 'verdi') }}
                                transition={{ duration: 0.35 }}
                            />
                        )}
                        <motion.circle
                            r={6}
                            fill="#4f46e5"
                            animate={{ cx: x(start), cy: y(0) }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        />
                    </svg>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
                            Det du har satt inn selv
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-500" />
                            Renter på renter
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 border-t-2 border-dashed border-orange-500" />
                            Start ti år senere
                        </span>
                    </div>
                </div>

                {/* Kontroller og tall */}
                <div className="space-y-4">
                    <label className="block">
                        <span className="flex items-center justify-between text-sm font-medium text-slate-700">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-500" /> Begynner å spare
                            </span>
                            <motion.span
                                key={start}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-indigo-600 font-semibold"
                            >
                                {start} år
                            </motion.span>
                        </span>
                        <input
                            type="range"
                            min={MIN_ALDER}
                            max={MAKS_ALDER}
                            value={start}
                            onChange={(e) => setStart(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </label>

                    <label className="block">
                        <span className="flex items-center justify-between text-sm font-medium text-slate-700">
                            <span className="flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-indigo-500" /> Hver måned
                            </span>
                            <motion.span
                                key={belop}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-indigo-600 font-semibold"
                            >
                                {kr(belop)}
                            </motion.span>
                        </span>
                        <input
                            type="range"
                            min={100}
                            max={2000}
                            step={100}
                            value={belop}
                            onChange={(e) => {
                                setBelop(Number(e.target.value));
                                setHarEndretBelop(true);
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </label>

                    <div>
                        <span className="text-sm font-medium text-slate-700">Rente i året</span>
                        <div className="mt-1.5 flex gap-2">
                            {RENTER.map((r) => (
                                <motion.button
                                    key={r}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => setRentePst(r)}
                                    className={`flex-1 rounded-full py-1.5 text-sm font-medium border ${
                                        rentePst === r
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {r} %
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                        <div className="flex justify-between text-slate-600">
                            <span>Satt inn selv</span>
                            <span className="font-medium">{kr(siste.innskudd)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                            <span>Renter</span>
                            <span className="font-medium">{kr(renter)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-800">
                            <span>Ved {sluttAlder} år</span>
                            <span>{kr(siste.verdi)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid synlig */}
            <div className="px-5 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fase + (harEndretBelop ? 'b' : '')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm ${
                            feedback.tone === 'ok'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feedback.tone === 'ok' ? (
                            <motion.span
                                initial={{ rotate: -30, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                        ) : (
                            <Info className="w-5 h-5 shrink-0" />
                        )}
                        <span>{feedback.tekst}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Sprout className="w-4 h-4" /> Tenkt eksempel. Ingen kan love deg en fast rente.
                </span>
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
