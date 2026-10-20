import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building2,
    Bus,
    Check,
    GraduationCap,
    HardHat,
    Landmark,
    MapPinned,
    Printer,
    RotateCcw,
    Users,
    UserRound,
} from 'lucide-react';

// Motorsaga: eleven skal tette hullet i statsbudsjettet til Argentina slik
// Milei lovet. Hver post eleven sager bort lukker en bit av hullet, men viser
// også hvem som merker kuttet. Den andre veien, å trykke penger, lukker hullet
// på papiret mens prisene løper fra folk.
//
// Lyspære-øyeblikket: For å stoppe inflasjonen måtte staten slutte å bruke mer
// enn den hadde. Spørsmålet er ikke om noen betaler, men hvem.
//
// Fakta: AFP (2023), Simauchi mfl. (2023), Debre (2024), Grainger (2024b),
// Salomon (2025), Reuters (2025d). Hullet er delt i like store klosser for å
// gjøre det enkelt - postene var ikke like store i virkeligheten.

interface MotorsagaProps {
    title?: string;
}

type Phase = 'kutt' | 'trykket' | 'ferdig';

interface Post {
    id: string;
    navn: string;
    hvem: string;
    fakta: string;
    Ikon: typeof Bus;
}

const POSTER: Post[] = [
    {
        id: 'departementer',
        navn: 'Departementer',
        hvem: 'Politikere og byråkrater',
        fakta: 'Milei kuttet antallet departementer fra 18 til 9.',
        Ikon: Landmark,
    },
    {
        id: 'subsidier',
        navn: 'Billig strøm og buss',
        hvem: 'Alle som tar buss og betaler strøm',
        fakta: 'Staten kuttet støtten som holdt prisene på buss og strøm nede.',
        Ikon: Bus,
    },
    {
        id: 'bygging',
        navn: 'Veier og bygg',
        hvem: 'Bygningsarbeidere og byer som ventet på nye veier',
        fakta: 'Nye statlige byggeprosjekter ble stanset.',
        Ikon: HardHat,
    },
    {
        id: 'provinser',
        navn: 'Penger til provinsene',
        hvem: 'Fylkene og tjenestene de driver',
        fakta: 'Provinsene fikk mindre penger fra staten.',
        Ikon: MapPinned,
    },
    {
        id: 'statsansatte',
        navn: 'Statsansatte',
        hvem: 'Folk som jobbet for staten',
        fakta: 'Rundt 34 000 statlige jobber forsvant det første året.',
        Ikon: Building2,
    },
    {
        id: 'universiteter',
        navn: 'Universiteter',
        hvem: 'Studenter og lærere',
        fakta: 'Universitetet i Buenos Aires fikk et kutt på 61 prosent og advarte om at det kunne måtte stenge.',
        Ikon: GraduationCap,
    },
    {
        id: 'pensjoner',
        navn: 'Pensjoner',
        hvem: 'Pensjonister',
        fakta: 'I 2025 fikk fem millioner pensjonister rundt 300 dollar i måneden.',
        Ikon: UserRound,
    },
];

const KLOSSER_I_HULLET = 5;

export function Motorsaga({ title = 'Motorsaga: Tett hullet i budsjettet' }: MotorsagaProps) {
    const [phase, setPhase] = useState<Phase>('kutt');
    const [kuttet, setKuttet] = useState<string[]>([]);
    const [siste, setSiste] = useState<Post | null>(null);

    const igjen = KLOSSER_I_HULLET - kuttet.length;
    const kuttedePoster = POSTER.filter((p) => kuttet.includes(p.id));

    const handleKutt = (post: Post) => {
        if (phase !== 'kutt' || kuttet.includes(post.id)) return;
        const neste = [...kuttet, post.id];
        setKuttet(neste);
        setSiste(post);
        if (neste.length >= KLOSSER_I_HULLET) setPhase('ferdig');
    };

    const handleTrykk = () => {
        if (phase !== 'kutt') return;
        setPhase('trykket');
    };

    const handleReset = () => {
        setPhase('kutt');
        setKuttet([]);
        setSiste(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <motion.div
                    animate={siste ? { rotate: [0, -12, 12, -8, 0] } : {}}
                    key={siste?.id ?? 'start'}
                    transition={{ duration: 0.4 }}
                    className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl"
                    aria-hidden
                >
                    🪚
                </motion.div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Staten bruker mer enn den har. Sag bort {KLOSSER_I_HULLET} poster - eller
                        trykk penger.
                    </p>
                </div>
            </div>

            {/* Hullet i budsjettet */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Hullet i budsjettet</span>
                    <span className="text-slate-500">
                        {phase === 'trykket'
                            ? 'Dekket med nye pesos'
                            : igjen > 0
                              ? `${igjen} av ${KLOSSER_I_HULLET} klosser igjen`
                              : 'Tettet!'}
                    </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: KLOSSER_I_HULLET }).map((_, i) => {
                        const fylt = i < kuttet.length;
                        return (
                            <motion.div
                                key={i}
                                animate={
                                    phase === 'trykket'
                                        ? { backgroundColor: '#fecdd3', scale: [1, 1.08, 1] }
                                        : fylt
                                          ? { backgroundColor: '#a7f3d0', scale: [1.15, 1] }
                                          : { backgroundColor: '#f1f5f9', scale: 1 }
                                }
                                transition={{
                                    duration: 0.35,
                                    delay: phase === 'trykket' ? i * 0.08 : 0,
                                }}
                                className="h-8 rounded-lg border border-slate-200 flex items-center justify-center"
                            >
                                {fylt && phase !== 'trykket' && (
                                    <Check className="w-4 h-4 text-emerald-700" />
                                )}
                                {phase === 'trykket' && (
                                    <Printer className="w-4 h-4 text-rose-600" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Postene */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {POSTER.map((post) => {
                    const erKuttet = kuttet.includes(post.id);
                    const last = phase !== 'kutt';
                    return (
                        <motion.button
                            key={post.id}
                            onClick={() => handleKutt(post)}
                            disabled={erKuttet || last}
                            whileHover={!erKuttet && !last ? { y: -2 } : {}}
                            whileTap={!erKuttet && !last ? { scale: 0.95 } : {}}
                            animate={
                                erKuttet ? { opacity: 0.55, rotate: -2 } : { opacity: 1, rotate: 0 }
                            }
                            className={`relative text-left rounded-xl border p-3 min-h-[76px] shadow-sm ${
                                erKuttet
                                    ? 'bg-slate-50 border-slate-200'
                                    : last
                                      ? 'bg-white border-slate-200 cursor-default'
                                      : 'bg-white border-slate-200 hover:shadow-md hover:border-amber-300'
                            }`}
                        >
                            <post.Ikon className="w-5 h-5 text-indigo-500 mb-1" />
                            <div
                                className={`text-sm font-medium text-slate-800 ${erKuttet ? 'line-through' : ''}`}
                            >
                                {post.navn}
                            </div>
                            {erKuttet && (
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    className="absolute left-2 right-2 top-1/2 h-0.5 bg-amber-500 origin-left"
                                />
                            )}
                        </motion.button>
                    );
                })}
                <motion.button
                    onClick={handleTrykk}
                    disabled={phase !== 'kutt'}
                    whileHover={phase === 'kutt' ? { y: -2 } : {}}
                    whileTap={phase === 'kutt' ? { scale: 0.95 } : {}}
                    className="text-left rounded-xl border border-dashed border-rose-300 bg-rose-50 p-3 min-h-[76px]"
                >
                    <Printer className="w-5 h-5 text-rose-500 mb-1" />
                    <div className="text-sm font-medium text-rose-700">
                        Trykk nye pesos i stedet
                    </div>
                </motion.button>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[72px]">
                <AnimatePresence mode="wait">
                    {phase === 'kutt' && !siste && (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Klikk på en post for å sage den bort. Under ser du hvem som merker
                            kuttet.
                        </motion.div>
                    )}
                    {phase === 'kutt' && siste && (
                        <motion.div
                            key={siste.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm"
                        >
                            <div className="flex items-center gap-2 font-medium">
                                <Users className="w-4 h-4" /> Merker det: {siste.hvem}
                            </div>
                            <div className="mt-1">{siste.fakta}</div>
                        </motion.div>
                    )}
                    {phase === 'trykket' && (
                        <motion.div
                            key="trykket"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            Hullet er dekket, og ingen post er kuttet. Men det kom ikke mer mat
                            eller flere varer - bare flere pesos. Slik ble det i 2023: prisene steg
                            25,5 prosent på én måned. Alle betaler, mest de som har minst
                            sparepenger. Prøv igjen og kutt i stedet.
                        </motion.div>
                    )}
                    {phase === 'ferdig' && (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                        >
                            <div className="font-semibold">
                                Hullet er tettet! I 2024 fikk Argentina overskudd for første gang på
                                14 år.
                            </div>
                            <div className="mt-1">
                                Regningen gikk til:{' '}
                                {kuttedePoster
                                    .map((p) => p.hvem.charAt(0).toLowerCase() + p.hvem.slice(1))
                                    .join(', ')}
                                . Milei kuttet i alle sju postene. Hvem ville du skånet?
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Forenklet: hver kloss er like stor. Det var ikke postene i virkeligheten.
                </span>
                <button
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
