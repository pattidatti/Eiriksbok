import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    Cookie,
    Droplets,
    Eye,
    Flame,
    Flower2,
    Music,
    RotateCcw,
    Sparkles,
    Wind,
} from 'lucide-react';

interface PujaBrettetProps {
    title?: string;
}

type GaveId = 'vann' | 'blomst' | 'roykelse' | 'lampe' | 'mat' | 'sang';

interface Gave {
    id: GaveId;
    navn: string;
    ikon: LucideIcon;
    handling: string;
}

const GAVER: Gave[] = [
    {
        id: 'vann',
        navn: 'Vann',
        ikon: Droplets,
        handling:
            'Du vasker figuren og fyller vannskålene. Slik tar du imot en gjest som har reist langt.',
    },
    {
        id: 'blomst',
        navn: 'Blomster',
        ikon: Flower2,
        handling:
            'Du pynter alteret. Ingen setter fram friske blomster for noen de er likegyldige til.',
    },
    {
        id: 'roykelse',
        navn: 'Røkelse',
        ikon: Wind,
        handling:
            'Du tenner røkelse. Lukten i rommet skifter, og rommet er ikke helt vanlig lenger.',
    },
    {
        id: 'lampe',
        navn: 'Lampe',
        ikon: Flame,
        handling:
            'Du svinger en brennende lampe foran figuren. Dette kalles arti, og er ofte høydepunktet.',
    },
    {
        id: 'mat',
        navn: 'Mat',
        ikon: Cookie,
        handling: 'Du setter fram et måltid, gjerne noe søtt. Gjesten spiser først, du etterpå.',
    },
    {
        id: 'sang',
        navn: 'Sang og mantra',
        ikon: Music,
        handling: 'Du synger, og gjentar hellige ord. Dette er det eneste du gjør med munnen.',
    },
];

const TILBAKE = [
    {
        id: 'darshan',
        tittel: 'Darshan',
        tekst: 'Du ser guden, og guden ser deg. Blikket går begge veier.',
    },
    {
        id: 'prasad',
        tittel: 'Prasad',
        tekst: 'Maten du ga fram, blir delt ut igjen til alle som er til stede.',
    },
];

export function PujaBrettet({ title = 'Puja-brettet' }: PujaBrettetProps) {
    const [gitt, setGitt] = useState<GaveId[]>([]);
    const [sist, setSist] = useState<GaveId | null>(null);

    const ferdig = gitt.length === GAVER.length;
    const sisteGave = GAVER.find((g) => g.id === sist) ?? null;

    const gi = (id: GaveId) => {
        setSist(id);
        setGitt((tidligere) => (tidligere.includes(id) ? tidligere : [...tidligere, id]));
    };

    const nullstill = () => {
        setGitt([]);
        setSist(null);
    };

    const glod = 0.12 + gitt.length * 0.1;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Guden er gjest hjemme hos deg. Klikk en gave om gangen og gi den bort.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Du gir
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {GAVER.map((gave) => {
                            const erGitt = gitt.includes(gave.id);
                            const Ikon = gave.ikon;
                            return (
                                <motion.button
                                    key={gave.id}
                                    type="button"
                                    onClick={() => gi(gave.id)}
                                    whileTap={{ scale: 0.94 }}
                                    animate={erGitt ? { opacity: 0.55 } : { opacity: 1 }}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                        erGitt
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:shadow-md'
                                    }`}
                                >
                                    <Ikon
                                        className={`w-4 h-4 shrink-0 ${
                                            erGitt ? 'text-emerald-600' : 'text-amber-500'
                                        }`}
                                    />
                                    <span className="leading-snug">{gave.navn}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                        {gitt.length} av {GAVER.length} gaver gitt
                    </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex flex-col items-center justify-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-3">
                        Husalteret
                    </p>
                    <motion.div
                        animate={{
                            boxShadow: `0 0 ${10 + gitt.length * 7}px ${
                                2 + gitt.length * 2
                            }px rgba(251, 191, 36, ${glod})`,
                        }}
                        transition={{ duration: 0.4 }}
                        className="w-24 h-24 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center gap-2.5"
                    >
                        {[0, 1].map((i) => (
                            <motion.span
                                key={i}
                                animate={
                                    ferdig
                                        ? { width: 12, height: 12, borderRadius: 999 }
                                        : { width: 14, height: 3, borderRadius: 999 }
                                }
                                transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                                className="bg-amber-700 block"
                            />
                        ))}
                    </motion.div>

                    <div className="mt-3 flex flex-wrap justify-center gap-1.5 min-h-[28px]">
                        <AnimatePresence>
                            {gitt.map((id) => {
                                const gave = GAVER.find((g) => g.id === id);
                                if (!gave) return null;
                                const Ikon = gave.ikon;
                                return (
                                    <motion.span
                                        key={id}
                                        initial={{ scale: 0, y: 14, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                        className="w-7 h-7 rounded-full bg-white border border-amber-200 flex items-center justify-center"
                                    >
                                        <Ikon className="w-3.5 h-3.5 text-amber-600" />
                                    </motion.span>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    <p className="mt-2 text-center text-xs text-amber-700 leading-snug">
                        {ferdig
                            ? 'Øynene er åpne. Gjesten ser deg.'
                            : 'Figuren kalles en murti. Gaven legges fram for den.'}
                    </p>
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={sist ?? 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            sisteGave
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {sisteGave
                            ? sisteGave.handling
                            : 'Velg en gave over. Legg merke til hvor lite av dette som er ord.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pt-3"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2 flex items-center gap-1.5">
                            <motion.span
                                initial={{ scale: 0, rotate: -40 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                            </motion.span>
                            Du får tilbake
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {TILBAKE.map((post, i) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.12 * i,
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                                >
                                    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                                        <Eye className="w-4 h-4 shrink-0 text-emerald-600" />
                                        {post.tittel}
                                    </p>
                                    <p className="mt-1 text-xs leading-snug text-emerald-700">
                                        {post.tekst}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                        <p className="mt-3 text-center text-xs font-medium text-emerald-700">
                            Pujaen er fullført. Nesten alt du gjorde, gjorde du med hendene.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Rekkefølgen og gavene varierer mye fra hjem til hjem.
                </p>
                <button
                    type="button"
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
