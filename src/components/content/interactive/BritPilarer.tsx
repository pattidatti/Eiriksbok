import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Link2, Star } from 'lucide-react';

interface Pilar {
    id: string;
    hebrewLabel: string;
    name: string;
    subtitle: string;
    description: string;
    examples: string[];
    accentColor: string;
    bgFrom: string;
    badgeClass: string;
    ringClass: string;
}

const PILARER: Pilar[] = [
    {
        id: 'shema',
        hebrewLabel: 'שְׁמַע',
        name: 'Shema',
        subtitle: 'Én Gud',
        description:
            'Shema begynner slik: "Hør, Israel! Adonai (Herren) er vår Gud, Adonai er én." Strengt tatt er det ikke en vanlig bønn, men en bekjennelse av at Gud er én. Den blir ofte kalt den jødiske trosbekjennelsen, selv om jødedommen egentlig ikke har noen. Teksten er satt sammen av tre steder i Bibelen: 5. Mosebok 6,4-9 og 11,13-21, og 4. Mosebok 15,37-41.',
        examples: [
            'Shema skal leses to ganger om dagen, morgen og kveld',
            'Den hører med blant bønnene jøder ber på dødsleiet',
            'Plikten følges i stor grad blant ortodokse menn, og i ulik grad i de ikke-ortodokse retningene',
        ],
        accentColor: '#d97706',
        bgFrom: 'from-amber-50',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        ringClass: 'ring-amber-400',
    },
    {
        id: 'brit',
        hebrewLabel: 'בְּרִית',
        name: 'Brit',
        subtitle: 'Pakten',
        description:
            'Brit betyr pakt. Jødedommen bygger på en overbevisning om at Gud har inngått en pakt med Abrahams etterkommere. Pakten går begge veier: den gir folket både forpliktelser, altså mitzvot, og rettigheter. Det er ikke bare én part som gir.',
        examples: [
            'Ifølge Tanakh, den hebraiske bibelen, ble pakten inngått med Abrahams etterkommere',
            'Ifølge Mosebøkene ble lovene og levereglene åpenbart for Moses på Sinai',
            'Rabbinerne lærer at jøder ikke er mer verdifulle enn andre, bare underlagt andre forpliktelser',
        ],
        accentColor: '#2563eb',
        bgFrom: 'from-blue-50',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        ringClass: 'ring-blue-400',
    },
    {
        id: 'mitzvot',
        hebrewLabel: 'מִצְווֹת',
        name: 'Mitzvot',
        subtitle: '613 bud',
        description:
            'Rabbinerne har utledet 613 religiøse bud, mitzvot, fra tekstene i Mosebøkene. De styrer både forholdet mellom mennesket og Gud og forholdet mellom mennesker. Til sammen utgjør de halakha, den jødiske loven. Religion er noe du gjør, ikke bare noe du tror.',
        examples: [
            '248 av budene er ting du skal gjøre, 365 er ting du ikke skal gjøre',
            'De handler blant annet om mat, om shabbat der arbeid er forbudt, og om hvordan du behandler andre',
            'Ortodokse jøder søker å følge så mye som mulig, mens ikke-ortodokse praktiserer i ulik grad',
        ],
        accentColor: '#16a34a',
        bgFrom: 'from-green-50',
        badgeClass: 'bg-green-100 text-green-700 border-green-200',
        ringClass: 'ring-green-400',
    },
];

export function BritPilarer() {
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

    const allSeen = seen.size === PILARER.length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">Tre nøkkelord i jødedommen</h3>
                    <p className="text-sm text-slate-500">
                        Klikk hvert ord for å utforske begrepet
                    </p>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                {PILARER.map((pilar, idx) => {
                    const isOpen = expanded === pilar.id;
                    const isSeen = seen.has(pilar.id);
                    return (
                        <motion.div
                            key={pilar.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                                isOpen
                                    ? `ring-2 ${pilar.ringClass} border-transparent`
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <button
                                onClick={() => toggle(pilar.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left bg-gradient-to-r ${pilar.bgFrom} to-white transition-colors`}
                            >
                                <span
                                    className="text-lg font-bold shrink-0 w-12 text-right leading-none"
                                    style={{ color: pilar.accentColor, fontFamily: 'serif' }}
                                >
                                    {pilar.hebrewLabel}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pilar.badgeClass}`}
                                        >
                                            {pilar.name}
                                        </span>
                                        <span className="text-sm text-slate-600">
                                            {pilar.subtitle}
                                        </span>
                                    </div>
                                </div>
                                {isSeen && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                <motion.span
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="shrink-0 text-slate-400"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </motion.span>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    >
                                        <div className="px-4 pb-4 pt-1">
                                            <p className="text-sm text-slate-700 leading-relaxed mb-3">
                                                {pilar.description}
                                            </p>
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                                    I praksis
                                                </div>
                                                <ul className="flex flex-col gap-1.5">
                                                    {pilar.examples.map((ex, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-2 text-sm text-slate-700"
                                                        >
                                                            <span
                                                                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        pilar.accentColor,
                                                                }}
                                                            />
                                                            {ex}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mx-4 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Sammenhengen
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {PILARER.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2">
                            <span
                                className={`text-sm font-semibold px-2.5 py-1 rounded-full transition-all duration-500 ${
                                    seen.has(p.id)
                                        ? `${p.badgeClass} border`
                                        : 'bg-slate-200 text-slate-400'
                                }`}
                            >
                                {p.name}
                            </span>
                            {i < PILARER.length - 1 && (
                                <Link2
                                    className={`w-3.5 h-3.5 transition-colors duration-500 ${
                                        seen.has(p.id) && seen.has(PILARER[i + 1].id)
                                            ? 'text-slate-400'
                                            : 'text-slate-200'
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                    <span className="text-xs text-slate-500 ml-1">= livet i praksis</span>
                </div>
            </div>

            <AnimatePresence>
                {allSeen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Troen på én Gud (Shema) og pakten med Gud (Brit) gir folket forpliktelser
                        (mitzvot). Budene og rabbinernes tolkninger av dem blir til halakha, den
                        jødiske loven, som former hverdagen. Hvor mye den følges, varierer sterkt
                        mellom retningene.
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pb-4 flex items-center gap-2">
                {PILARER.map((p) => (
                    <div
                        key={p.id}
                        className="flex-1 h-1.5 rounded-full transition-all duration-500"
                        style={{ backgroundColor: seen.has(p.id) ? p.accentColor : '#e2e8f0' }}
                    />
                ))}
                <span className="text-xs text-slate-400 shrink-0">
                    {seen.size}/{PILARER.length} utforsket
                </span>
            </div>
        </div>
    );
}
