import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Footprints, RotateCcw, Sparkles, Users, X } from 'lucide-react';

// RiketPaVandring: eleven følger Mzilikazi og folket hans fra Zululand i 1822
// til Matabeleland rundt 1840. Ved hvert stopp svarer eleven på hva som
// skjedde. Riktig svar trekker streken videre på kartet og legger til en ny
// gruppe i folket.
//
// Lyspære-øyeblikket: Ndebele-riket var ikke et fast sted, men et folk som
// flyttet. Det vokste ved å ta inn folk det beseiret, og det flyttet når det
// møtte fiender med gevær.
//
// Bygger på South African History Online (2022, 2026), Encyclopedia of World
// Biography (u.å.) og Leraand og Tjønneland (2026).

interface RiketPaVandringProps {
    title?: string;
}

type Phase = 'velg' | 'riktig' | 'ferdig';

interface Stopp {
    ar: string;
    sted: string;
    // Posisjon på skissekartet (viewBox 0 0 300 260)
    x: number;
    y: number;
    situasjon: string;
    sporsmal: string;
    alternativer: string[];
    riktig: number;
    forklaring: string;
    nyttFolk: string;
    antall?: string;
}

const STOPP: Stopp[] = [
    {
        ar: '1822',
        sted: 'Zululand',
        x: 250,
        y: 225,
        situasjon:
            'Mzilikazi er en av Shakas ledere. Etter et raid skal han gi kyrne han har tatt, til Shaka. Han nekter.',
        sporsmal: 'Hva gjør Mzilikazi nå?',
        alternativer: [
            'Han ber om tilgivelse og blir hos Shaka.',
            'Han flykter med noen hundre krigere.',
            'Han angriper Shakas hovedstad.',
        ],
        riktig: 1,
        forklaring:
            'Han flyktet fra Zululand med noen hundre krigere. Etter å ha sagt nei til Shaka var han ikke trygg lenger.',
        nyttFolk: 'Khumalo-krigerne',
        antall: 'Noen hundre',
    },
    {
        ar: 'Ca. 1823',
        sted: 'Ved dagens Middelburg',
        x: 205,
        y: 160,
        situasjon:
            'Den lille gruppa er på vandring i et land fullt av krig. De beseirer pedi-folket og andre grupper.',
        sporsmal: 'Hvordan blir den lille gruppa større?',
        alternativer: [
            'De kjøper gevær av europeerne.',
            'De får nye krigere sendt fra Shaka.',
            'De tar inn folk de beseirer, og trener dem som krigere på zulu-måten.',
        ],
        riktig: 2,
        forklaring:
            'Mzilikazi tok inn folk fra gruppene han beseiret, og trente dem i regimenter som Shaka gjorde.',
        nyttFolk: 'Sotho-grupper',
    },
    {
        ar: '1827-1832',
        sted: 'Magaliesberg',
        x: 150,
        y: 150,
        situasjon:
            'Riket er nå stort, med tre festninger. I 1830 kommer en skotsk misjonær, Robert Moffat, på besøk.',
        sporsmal: 'Hvordan tar Mzilikazi imot Moffat?',
        alternativer: [
            'Han blir venn med ham og kaller ham «kongen av Kuruman».',
            'Han jager ham ut av riket.',
            'Han tar ham til fange.',
        ],
        riktig: 0,
        forklaring:
            'De ble nære venner. Moffat kom tilbake mange ganger, helt til 1859.',
        nyttFolk: 'Nguni-flyktninger',
        antall: 'Ca. 70 000 (1829)',
    },
    {
        ar: '1836-1837',
        sted: 'Mosega ved Marico-elva',
        x: 90,
        y: 160,
        situasjon:
            'Voortrekkerne kommer: boere med hester og gevær. Ndebele angriper dem i 1836. I 1837 kommer motangrepet.',
        sporsmal: 'Hvorfor taper Ndebele?',
        alternativer: [
            'De gir opp uten å kjempe.',
            'Voortrekkerne har gevær og får hjelp av griqua og rolong.',
            'Shaka sender en hær mot dem.',
        ],
        riktig: 1,
        forklaring:
            'Geværene avgjorde. Griqua og rolong, som Ndebele hadde angrepet før, slo seg sammen med boerne.',
        nyttFolk: '',
        antall: 'Ca. 15 000 (1837)',
    },
    {
        ar: 'Ca. 1840',
        sted: 'Bulawayo, Matabeleland',
        x: 165,
        y: 45,
        situasjon:
            'Folket krysser Limpopo-elva. På veien deler de seg i to grupper som mister kontakten.',
        sporsmal: 'Hva skjer med de to gruppene?',
        alternativer: [
            'De finner hverandre igjen rundt to år senere.',
            'De blir aldri samlet igjen.',
            'De drar tilbake til Zululand.',
        ],
        riktig: 0,
        forklaring:
            'Rundt to år senere var folket samlet igjen. De slo seg ned blant shona-folket og bygde hovedstaden Bulawayo.',
        nyttFolk: 'Folk fra det gamle Rozvi-riket',
    },
];

export function RiketPaVandring({ title = 'Riket på vandring' }: RiketPaVandringProps) {
    const [steg, setSteg] = useState(0);
    const [phase, setPhase] = useState<Phase>('velg');
    const [feil, setFeil] = useState<number[]>([]);

    const stopp = STOPP[Math.min(steg, STOPP.length - 1)];
    const ferdigeStopp = phase === 'velg' ? steg : steg + 1;
    const folk = STOPP.slice(0, ferdigeStopp).filter((s) => s.nyttFolk);
    const antall = [...STOPP.slice(0, ferdigeStopp)].reverse().find((s) => s.antall)?.antall;

    const velg = (i: number) => {
        if (phase !== 'velg' || feil.includes(i)) return;
        if (i === stopp.riktig) {
            setPhase('riktig');
        } else {
            setFeil([...feil, i]);
        }
    };

    const neste = () => {
        if (steg === STOPP.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setFeil([]);
        setPhase('velg');
    };

    const reset = () => {
        setSteg(0);
        setFeil([]);
        setPhase('velg');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Footprints className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Følg Mzilikazi fra stopp til stopp. Svar riktig, så går folket videre.
                    </p>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
                {/* Skissekart */}
                <div className="flex flex-col gap-3">
                    <svg
                        viewBox="0 0 300 260"
                        className="w-full max-h-64 rounded-xl bg-amber-50 border border-amber-100"
                        role="img"
                        aria-label="Skissekart over vandringen fra Zululand til Matabeleland"
                    >
                        {/* Limpopo-elva */}
                        <path
                            d="M 10 95 C 80 80, 140 110, 200 90 S 280 70, 295 85"
                            fill="none"
                            stroke="#7dd3fc"
                            strokeWidth={5}
                            strokeLinecap="round"
                        />
                        <text x={14} y={88} fontSize={10} fill="#0369a1">
                            Limpopo
                        </text>
                        {/* Havet i øst */}
                        <path d="M 300 120 L 300 260 L 275 260 C 285 200, 290 160, 300 120 Z" fill="#bae6fd" />

                        {STOPP.slice(1).map((s, i) => {
                            const fra = STOPP[i];
                            const tegnet = i + 1 <= steg;
                            return (
                                <motion.line
                                    key={`linje-${s.sted}`}
                                    x1={fra.x}
                                    y1={fra.y}
                                    x2={s.x}
                                    y2={s.y}
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    strokeDasharray="6 5"
                                    initial={false}
                                    animate={{ pathLength: tegnet ? 1 : 0, opacity: tegnet ? 1 : 0 }}
                                    transition={{ duration: 0.6 }}
                                />
                            );
                        })}

                        {STOPP.map((s, i) => {
                            const ferdig = i < ferdigeStopp;
                            const aktiv = i === steg && phase === 'velg';
                            const synlig = i <= steg;
                            return (
                                <g key={s.sted} opacity={synlig ? 1 : 0.35}>
                                    {aktiv && (
                                        <motion.circle
                                            cx={s.x}
                                            cy={s.y}
                                            r={9}
                                            fill="#a5b4fc"
                                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                                            transition={{ duration: 1.6, repeat: Infinity }}
                                        />
                                    )}
                                    <motion.circle
                                        cx={s.x}
                                        cy={s.y}
                                        r={7}
                                        animate={{ scale: ferdig ? [1.4, 1] : 1 }}
                                        fill={ferdig ? '#10b981' : aktiv ? '#6366f1' : '#cbd5e1'}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                    <text
                                        x={s.x}
                                        y={s.y + 20}
                                        fontSize={10}
                                        textAnchor="middle"
                                        fill="#334155"
                                    >
                                        {synlig ? s.ar : ''}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    <p className="text-xs text-slate-400">Skisse, ikke i riktig målestokk.</p>

                    {/* Folket */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            Folket: {antall ?? '?'}
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
                            <AnimatePresence>
                                {folk.map((s) => (
                                    <motion.span
                                        key={s.nyttFolk}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 text-xs"
                                    >
                                        {s.nyttFolk}
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Spørsmål */}
                <AnimatePresence mode="wait">
                    {phase !== 'ferdig' ? (
                        <motion.div
                            key={`stopp-${steg}`}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
                                Stopp {steg + 1} av {STOPP.length}: {stopp.ar}, {stopp.sted}
                            </p>
                            <p className="text-slate-700 leading-relaxed mb-3">{stopp.situasjon}</p>
                            <p className="font-semibold text-slate-800 mb-3">{stopp.sporsmal}</p>
                            <div className="flex flex-col gap-2">
                                {stopp.alternativer.map((tekst, i) => {
                                    const erFeil = feil.includes(i);
                                    const erRiktig = phase === 'riktig' && i === stopp.riktig;
                                    return (
                                        <motion.button
                                            key={tekst}
                                            onClick={() => velg(i)}
                                            disabled={phase !== 'velg' || erFeil}
                                            whileHover={phase === 'velg' && !erFeil ? { x: 3 } : {}}
                                            whileTap={phase === 'velg' && !erFeil ? { scale: 0.98 } : {}}
                                            animate={erFeil ? { x: [0, -6, 6, -3, 0] } : {}}
                                            transition={{ duration: 0.3 }}
                                            className={`text-left rounded-xl border px-4 py-2.5 text-sm shadow-sm flex items-start gap-2 ${
                                                erRiktig
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : erFeil
                                                      ? 'bg-rose-50 border-rose-200 text-rose-400 line-through'
                                                      : phase === 'riktig'
                                                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:shadow-md hover:border-indigo-300'
                                            }`}
                                        >
                                            {erRiktig && <Check className="w-4 h-4 mt-0.5 shrink-0" />}
                                            {erFeil && <X className="w-4 h-4 mt-0.5 shrink-0" />}
                                            {tekst}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        >
                            <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold">
                                <motion.span
                                    initial={{ rotate: -30, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring' }}
                                >
                                    <Sparkles className="w-5 h-5" />
                                </motion.span>
                                Folket er framme i Matabeleland!
                            </div>
                            <p className="text-slate-700 leading-relaxed mb-3">
                                Fra noen hundre krigere i 1822 vokste folket til rundt 70 000 i
                                1829. Det skjedde fordi Mzilikazi tok inn folk han beseiret, og
                                gjorde dem til en del av hæren og folket.
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                Riket var ikke et fast sted. Det var et folk på vandring. Da en
                                fiende med gevær kom, flyttet hele riket videre.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone, alltid i DOM-en */}
            <div className="mx-6 mb-4 min-h-[4rem]">
                <AnimatePresence mode="wait">
                    {phase === 'riktig' ? (
                        <motion.div
                            key={`riktig-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg border text-sm bg-emerald-50 border-emerald-200 text-emerald-800"
                        >
                            <span className="font-semibold">Riktig! </span>
                            {stopp.forklaring}
                        </motion.div>
                    ) : feil.length > 0 && phase === 'velg' ? (
                        <motion.div
                            key={`feil-${steg}-${feil.length}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg border text-sm bg-rose-50 border-rose-200 text-rose-700"
                        >
                            Ikke det som skjedde. Prøv et annet svar.
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`tom-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 text-sm text-slate-400"
                        >
                            {phase === 'ferdig'
                                ? 'Se på kartet: fem stopp, og nye grupper ble med underveis.'
                                : 'Trykk på svaret du tror er riktig.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={neste}
                    disabled={phase !== 'riktig'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {steg === STOPP.length - 1 ? 'Se hele reisen' : 'Videre'}
                </button>
                <button
                    onClick={reset}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
