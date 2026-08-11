import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, RotateCcw, Check, Sparkles } from 'lucide-react';

interface EnEllerMillionerProps {
    title?: string;
}

type LinseId = 'alle' | 'vaishnav' | 'shaiva' | 'shakta' | 'brahman';

interface Gud {
    id: string;
    navn: string;
    rolle: string;
}

interface Linse {
    id: LinseId;
    knapp: string;
    hoyest: string | null;
    svar: string;
    forklaring: string;
}

const GUDER: Gud[] = [
    { id: 'vishnu', navn: 'Vishnu', rolle: 'Beskytter verden' },
    { id: 'shiva', navn: 'Shiva', rolle: 'Skaper og ødelegger' },
    { id: 'durga', navn: 'Durga', rolle: 'Gudinnen på løven' },
    { id: 'krishna', navn: 'Krishna', rolle: 'Avatar av Vishnu' },
    { id: 'rama', navn: 'Rama', rolle: 'Avatar av Vishnu' },
    { id: 'brahma', navn: 'Brahma', rolle: 'Skaperguden' },
];

const LINSER: Linse[] = [
    {
        id: 'alle',
        knapp: 'Uten linse',
        hoyest: null,
        svar: 'Mange',
        forklaring:
            'Du teller figurene i rommet. Ingen av dem står over de andre. Det er dette svaret folk mener når de kaller hinduismen polyteistisk.',
    },
    {
        id: 'vaishnav',
        knapp: 'Vaishnavisme',
        hoyest: 'vishnu',
        svar: 'Én øverst',
        forklaring:
            'Vaishnaver setter Vishnu høyest. Han skaper, opprettholder og beskytter verden. Krishna og Rama er ikke nye guder, men Vishnu i en annen skikkelse.',
    },
    {
        id: 'shaiva',
        knapp: 'Shaivisme',
        hoyest: 'shiva',
        svar: 'Én øverst',
        forklaring:
            'Shaivaer setter Shiva høyest. For dem er det Shiva som både skaper og opprettholder verden, ikke bare ødelegger den.',
    },
    {
        id: 'shakta',
        knapp: 'Shaktisme',
        hoyest: 'durga',
        svar: 'Én øverst',
        forklaring:
            'Shaktaer setter gudinnen høyest. I teksten Devimahatmya er Durga verdenssjelen og den høyeste guddommen, og ingen mannlig gud er hennes like.',
    },
    {
        id: 'brahman',
        knapp: 'Brahman-linsen',
        hoyest: null,
        svar: 'Én',
        forklaring:
            'Nå ser du ikke på figurene, men på det de peker mot. Brahman er den ene virkeligheten som finnes i alt, og gudene blir navn og former på den samme enheten. Merk: Brahman er ikke det samme som skaperguden Brahma.',
    },
];

export function EnEllerMillioner({ title = 'Hvor mange guder ser du?' }: EnEllerMillionerProps) {
    const [aktiv, setAktiv] = useState<LinseId>('alle');
    const [sett, setSett] = useState<LinseId[]>(['alle']);

    const linse = LINSER.find((l) => l.id === aktiv) ?? LINSER[0];
    const ferdig = sett.length === LINSER.length;

    const velgLinse = (id: LinseId) => {
        setAktiv(id);
        setSett((forrige) => (forrige.includes(id) ? forrige : [...forrige, id]));
    };

    const handleReset = () => {
        setAktiv('alle');
        setSett(['alle']);
    };

    const toppGud = linse.hoyest ? GUDER.find((g) => g.id === linse.hoyest) : undefined;
    const resten = GUDER.filter((g) => g.id !== linse.hoyest);
    const visAvatarmerke = aktiv === 'vaishnav';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Bytt linse. Gudene er de samme hele tiden - bare blikket endrer seg.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {LINSER.map((l) => {
                    const erAktiv = l.id === aktiv;
                    return (
                        <button
                            key={l.id}
                            onClick={() => velgLinse(l.id)}
                            className={`relative rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                                erAktiv
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {l.knapp}
                            {sett.includes(l.id) && !erAktiv && (
                                <Check className="w-3 h-3 absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-[1px]" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="px-5 py-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 min-h-[228px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {aktiv === 'brahman' ? (
                            <motion.div
                                key="brahman"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className="w-32 h-32 rounded-full bg-amber-100 border-4 border-amber-300 flex flex-col items-center justify-center shadow-sm">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                    <span className="mt-1 font-display text-xl font-semibold text-amber-800">
                                        Brahman
                                    </span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                                    {GUDER.map((g, i) => (
                                        <motion.span
                                            key={g.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 + i * 0.06 }}
                                            className="text-xs bg-white border border-amber-200 text-amber-700 rounded-full px-3 py-1"
                                        >
                                            {g.navn}
                                        </motion.span>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 text-center">
                                    Alle navnene peker mot den samme virkeligheten.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="figurer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full"
                            >
                                {toppGud && (
                                    <motion.div
                                        layout
                                        layoutId={toppGud.id}
                                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                        className="mx-auto mb-3 w-full max-w-xs rounded-xl bg-white border-2 border-amber-300 shadow-md px-4 py-3 text-center"
                                    >
                                        <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-semibold uppercase tracking-wide">
                                            <Crown className="w-3.5 h-3.5" />
                                            Høyest
                                        </div>
                                        <div className="font-display text-lg font-semibold text-slate-800">
                                            {toppGud.navn}
                                        </div>
                                        <div className="text-xs text-slate-500">{toppGud.rolle}</div>
                                    </motion.div>
                                )}
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {resten.map((g) => (
                                        <motion.div
                                            layout
                                            layoutId={g.id}
                                            key={g.id}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 24,
                                            }}
                                            className="rounded-xl bg-white border border-slate-200 shadow-sm px-2 py-2 text-center"
                                        >
                                            <div className="text-sm font-semibold text-slate-800">
                                                {g.navn}
                                            </div>
                                            <div className="text-[11px] leading-tight text-slate-500">
                                                {g.rolle}
                                            </div>
                                            {visAvatarmerke && g.rolle.startsWith('Avatar') && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="mt-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-1.5 py-0.5"
                                                >
                                                    form av Vishnu
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mx-5 mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                <div className="flex items-baseline gap-3">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={linse.svar}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="font-display text-xl font-semibold text-blue-800 whitespace-nowrap"
                        >
                            {linse.svar}
                        </motion.span>
                    </AnimatePresence>
                    <p className="text-sm text-blue-800">{linse.forklaring}</p>
                </div>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        className="mx-5 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2"
                    >
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-800">
                            Fem linser, samme guder, fem svar. Derfor har spørsmålet om hvor mange
                            guder hinduismen har, ikke ett riktig svar.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Linser prøvd: {sett.length} av {LINSER.length}
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
