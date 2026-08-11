import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Users,
    Crown,
    BookOpen,
    Cross,
    Globe2,
    RotateCcw,
} from 'lucide-react';

interface KristendomsGrenerUtforskerProps {
    title?: string;
}

interface Branch {
    id: string;
    name: string;
    founded: string;
    leader: string;
    followers: string;
    spread: string;
    distinctives: string[];
    accentColor: string;
    bgFrom: string;
    badgeClass: string;
    ringClass: string;
}

const BRANCHES: Branch[] = [
    {
        id: 'katolsk',
        name: 'Katolsk',
        founded: 'Vokste fram med Roma som sentrum i vest. Endelig brudd med kirken i øst i 1054.',
        leader: 'Paven i Roma, som kirken regner som etterfølger av apostelen Peter. Leo 14. ble valgt til pave 8. mai 2025.',
        followers: 'Cirka 1,1 milliarder',
        spread: 'I 2010 bodde 39 prosent av alle katolikker i Latin-Amerika og Karibia. I Norge var det 165 000 katolikker i 2020, etter kraftig vekst med arbeidsinnvandring.',
        distinctives: [
            'Sju sakramenter, altså hellige handlinger: dåp, ferming, nattverd, skriftemål, ekteskap, prestevielse og sykesalving',
            'Troen bygger på både Bibelen og Tradisjonen, det kirken har overlevert gjennom historien',
            'Kirken lærer at brødet og vinen i nattverden blir Kristi legeme og blod',
            'Ordet katolsk betyr allmenn eller universell',
        ],
        accentColor: '#2563eb',
        bgFrom: 'from-blue-50',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        ringClass: 'ring-blue-400',
    },
    {
        id: 'ortodoks',
        name: 'Ortodoks',
        founded:
            'Fortsettelsen av Østkirken, med hovedsete i Konstantinopel. Skilte lag med Roma i 1054.',
        leader: 'Ingen felles overhode. Hver selvstyrende kirke har sin patriark, metropolitt eller erkebiskop.',
        followers: 'Cirka 260 millioner',
        spread: 'Egne nasjonale kirker i blant annet Russland, Serbia, Romania, Bulgaria, Hellas og Polen. Fire av kirkene er de gamle patriarkatene i Konstantinopel, Antiokia, Jerusalem og Alexandria.',
        distinctives: [
            'Ordet ortodoks betyr rettroende',
            'Kirken ser seg selv som vokteren av den rette lære fra oldkirken',
            'Ikoner er et viktig kjennetegn, og de troende ber ved dem',
            'Reformer må vedtas i konsil, der alle de selvstendige kirkene blir enige',
        ],
        accentColor: '#7c3aed',
        bgFrom: 'from-purple-50',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
        ringClass: 'ring-purple-400',
    },
    {
        id: 'protestantisk',
        name: 'Protestantisk',
        founded:
            'Reformasjonen på 1500-tallet. Lederne var Martin Luther (1483-1546), Ulrich Zwingli (1484-1531) og Jean Calvin (1509-1564).',
        leader: 'Ingen felles overhode. Mange selvstendige kirkesamfunn i hvert land.',
        followers: 'Cirka 800 millioner',
        spread: 'Reformasjonen gjorde Nord-Europa protestantisk. Den norske kirke er luthersk og hadde 3,4 millioner medlemmer i 2024.',
        distinctives: [
            'Bare Bibelen kan være grunnlaget for den kristne troen',
            'Mennesket blir godtatt av Gud gjennom tro alene, ikke gjennom gode gjerninger',
            'De fleste beholdt bare to av de sju sakramentene: dåp og nattverd',
            'Navnet kommer av en protest på riksdagen i Speyer i 1529',
        ],
        accentColor: '#d97706',
        bgFrom: 'from-amber-50',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        ringClass: 'ring-amber-400',
    },
];

const COMMON_GROUNDS = [
    { icon: Cross, text: 'Jesus er sann Gud og sant menneske' },
    { icon: BookOpen, text: 'Bibelen er kristendommens hellige skrift' },
    { icon: Users, text: 'Gud er tre personer i ett vesen' },
    { icon: Crown, text: 'Trosbekjennelsen fra kirkemøtene i Nikea og Konstantinopel' },
];

export function KristendomsGrenerUtforsker({
    title = 'Kristendommens tre hovedgrener',
}: KristendomsGrenerUtforskerProps) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [seen, setSeen] = useState<Set<string>>(new Set());

    const toggle = (id: string) => {
        if (expanded === id) {
            setExpanded(null);
        } else {
            setExpanded(id);
            setSeen((prev) => new Set([...prev, id]));
        }
    };

    const handleReset = () => {
        setExpanded(null);
        setSeen(new Set());
    };

    const allSeen = seen.size === BRANCHES.length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Globe2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på en gren for å se hvem som leder den, hvor den er utbredt og hva som
                        skiller den fra de andre.
                    </p>
                </div>
            </div>

            {/* Grener */}
            <div className="p-4 flex flex-col gap-2">
                {BRANCHES.map((branch) => {
                    const isOpen = expanded === branch.id;
                    const isSeen = seen.has(branch.id);
                    return (
                        <div
                            key={branch.id}
                            className={`rounded-xl border-2 overflow-hidden ${
                                isOpen
                                    ? `ring-2 ${branch.ringClass} border-transparent`
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Kort-header */}
                            <button
                                onClick={() => toggle(branch.id)}
                                aria-expanded={isOpen}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left bg-gradient-to-r ${branch.bgFrom} to-white hover:to-slate-50`}
                            >
                                <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${branch.badgeClass} shrink-0`}
                                >
                                    {branch.name}
                                </span>
                                <span className="text-sm text-slate-600 flex-1">
                                    {branch.followers} kristne
                                </span>
                                {isSeen && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                            </button>

                            {/* Utvidet innhold */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    >
                                        <div className="px-4 pb-4 pt-1 grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                                    Slik ble den til
                                                </div>
                                                <p className="text-sm text-slate-700">
                                                    {branch.founded}
                                                </p>
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-3 mb-1.5">
                                                    Hvem bestemmer
                                                </div>
                                                <p className="text-sm text-slate-700">
                                                    {branch.leader}
                                                </p>
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-3 mb-1.5">
                                                    Utbredelse
                                                </div>
                                                <p className="text-sm text-slate-700">
                                                    {branch.spread}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                                    Særtrekk
                                                </div>
                                                <ul className="flex flex-col gap-1.5">
                                                    {branch.distinctives.map((d, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-1.5 text-sm text-slate-700"
                                                        >
                                                            <span
                                                                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        branch.accentColor,
                                                                }}
                                                            />
                                                            {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Felles grunnlag - alltid synlig */}
            <div className="mx-4 mb-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2.5">
                    Det alle tre holder fast på
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {COMMON_GROUNDS.map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            {text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence>
                {allSeen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-start gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        Du har utforsket alle tre. De er uenige om hvem som bestemmer og hvordan
                        gudstjenesten skal se ut, men alle tre bekjenner den samme troen på Jesus.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progresjon og kontroll */}
            <div className="px-4 pb-3 flex items-center gap-2">
                {BRANCHES.map((branch) => (
                    <div
                        key={branch.id}
                        className="flex-1 h-1.5 rounded-full"
                        style={{
                            backgroundColor: seen.has(branch.id) ? branch.accentColor : '#e2e8f0',
                        }}
                    />
                ))}
                <span className="text-xs text-slate-400 shrink-0">{seen.size}/3 utforsket</span>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 shrink-0"
                >
                    <RotateCcw className="w-3 h-3" />
                    Tilbakestill
                </button>
            </div>

            <p className="px-4 pb-4 text-[11px] text-slate-400">
                Tall for grenene: Store norske leksikon (2026). Den katolske kirke teller selv cirka
                1,36 milliarder medlemmer (2020).
            </p>
        </div>
    );
}
