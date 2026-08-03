import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, Eye, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { scatter } from '../../../utils/random';

type ObjectId = 'mane' | 'jupiter' | 'venus' | 'sol';

interface SkyObject {
    id: ObjectId;
    name: string;
    yearSeen: number;
    nakedEye: {
        description: string;
        oldBelief: string;
    };
    telescope: {
        description: string;
        discovery: string;
    };
    insight: string;
}

const OBJECTS: SkyObject[] = [
    {
        id: 'mane',
        name: 'Månen',
        yearSeen: 1609,
        nakedEye: {
            description:
                'Et glatt, lysende skive. En perfekt himmelsk kule, slik Aristoteles lærte at alt utenfor jorden var.',
            oldBelief:
                'Kirken og Aristoteles: Himmellegemene er guddommelige og uforanderlige — feilfri kuler av eter.',
        },
        telescope: {
            description:
                'Fjell, kratere og dype skygger. Månen ser ut som jorden — full av sår og uten å være glatt.',
            discovery:
                'Galileo tegnet månekart og beviste at himmellegemene er av samme stoff som jorden.',
        },
        insight: 'Himmelen er ikke perfekt. Den er fysisk.',
    },
    {
        id: 'jupiter',
        name: 'Jupiter',
        yearSeen: 1610,
        nakedEye: {
            description:
                'Et lite, lyssterkt punkt blant tusenvis av stjerner. Ingenting spesielt.',
            oldBelief:
                'Alt i universet kretser rundt jorden — også planetene. Jorden er sentrum.',
        },
        telescope: {
            description:
                'Fire små lyspunkter som flytter seg fra natt til natt — alltid rundt Jupiter.',
            discovery:
                'Galileo så Jupiters fire største måner (Io, Europa, Ganymedes, Kallisto) gå i bane rundt Jupiter.',
        },
        insight: 'Hvis fire måner kretser rundt Jupiter, kretser ikke alt rundt jorden.',
    },
    {
        id: 'venus',
        name: 'Venus',
        yearSeen: 1610,
        nakedEye: {
            description:
                'En lys morgenstjerne eller aftenstjerne. Alltid lik — bare et lyssterkt punkt.',
            oldBelief:
                'I Ptolemaios sin modell sirkler Venus mellom jorden og solen — og burde aldri vises som full skive.',
        },
        telescope: {
            description:
                'Venus skifter form gjennom året — fra sigd til halv, til nesten full, akkurat som månen gjør.',
            discovery:
                'Galileo så Venus gjennomgå alle faser. Det skjer bare hvis Venus går i bane rundt solen.',
        },
        insight: 'Venus sirkler rundt solen, ikke jorden. Kopernikus hadde rett.',
    },
    {
        id: 'sol',
        name: 'Solen',
        yearSeen: 1611,
        nakedEye: {
            description:
                'En perfekt, flammende skive. Symbolet på det evige og uforanderlige.',
            oldBelief:
                'Solen er den reneste og mest fullkomne himmelske kropp. Den kan ikke ha feil.',
        },
        telescope: {
            description:
                'Mørke flekker på soloverflaten. De beveger seg fra dag til dag — solen roterer.',
            discovery:
                'Galileo studerte solflekker (gjennom projisert bilde) og viste at også solen forandrer seg.',
        },
        insight: 'Selv solen er ikke perfekt. Forandring finnes overalt.',
    },
];

interface GalileoTelescopeProps {
    title?: string;
}

export function GalileoTelescope({
    title = 'Galileos kikkert',
}: GalileoTelescopeProps) {
    const [selected, setSelected] = useState<ObjectId | null>(null);
    const [useTelescope, setUseTelescope] = useState(false);
    const [seen, setSeen] = useState<Set<ObjectId>>(new Set());

    const obj = selected ? OBJECTS.find((o) => o.id === selected)! : null;
    const allSeen = seen.size === OBJECTS.length;

    const handleSelect = (id: ObjectId) => {
        setSelected(id);
        setUseTelescope(false);
    };

    const handleToggle = () => {
        const next = !useTelescope;
        setUseTelescope(next);
        if (next && selected) {
            setSeen((prev) => new Set(prev).add(selected));
        }
    };

    const handleReset = () => {
        setSelected(null);
        setUseTelescope(false);
        setSeen(new Set());
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Telescope className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et himmellegeme. Veksle mellom det blotte øye og kikkerten — og se det Galileo så.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50/60 border-b border-slate-100">
                {OBJECTS.map((o) => (
                    <button
                        key={o.id}
                        onClick={() => handleSelect(o.id)}
                        className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors border ${
                            selected === o.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                        }`}
                    >
                        {o.name}
                        {seen.has(o.id) && (
                            <CheckCircle2 className="w-3.5 h-3.5 absolute top-1 right-1 text-emerald-400" />
                        )}
                    </button>
                ))}
            </div>

            {!obj && (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">
                    Klikk på et himmellegeme over for å begynne.
                </div>
            )}

            {obj && (
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs uppercase tracking-wider text-slate-400">
                            {obj.name} · {useTelescope ? `Galileos kikkert, ${obj.yearSeen}` : 'Blotte øye'}
                        </div>
                        <button
                            onClick={handleToggle}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                                useTelescope
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {useTelescope ? (
                                <>
                                    <Eye className="w-3.5 h-3.5" /> Tilbake til blotte øye
                                </>
                            ) : (
                                <>
                                    <Telescope className="w-3.5 h-3.5" /> Se med kikkerten
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800">
                        <AnimatePresence mode="wait">
                            {!useTelescope ? (
                                <motion.div
                                    key={`naked-${obj.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <NakedEyeView id={obj.id} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={`tele-${obj.id}`}
                                    initial={{ opacity: 0, scale: 1.08 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <TelescopeView id={obj.id} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${obj.id}-${useTelescope ? 'tele' : 'naked'}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className={`mt-4 rounded-lg border px-4 py-3 ${
                                useTelescope
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-blue-50 border-blue-200'
                            }`}
                        >
                            {!useTelescope ? (
                                <>
                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                        Det blotte øye ser:
                                    </p>
                                    <p className="text-sm text-blue-900/90">{obj.nakedEye.description}</p>
                                    <p className="text-xs italic text-blue-800/80 mt-2">
                                        Tradisjon: {obj.nakedEye.oldBelief}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-amber-900 mb-1">
                                        Med kikkerten oppdaget Galileo:
                                    </p>
                                    <p className="text-sm text-amber-900/90">{obj.telescope.description}</p>
                                    <p className="text-xs text-amber-800/90 mt-2">{obj.telescope.discovery}</p>
                                    <div className="mt-3 flex items-start gap-2 text-amber-900 font-medium text-sm">
                                        <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{obj.insight}</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {allSeen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-6 mb-4 px-4 py-4 rounded-lg bg-emerald-50 border border-emerald-200"
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-emerald-800">Du har sett det Galileo så.</p>
                                <p className="text-sm text-emerald-700/90 mt-1">
                                    På fire netter mellom 1609 og 1611 forandret én mann og én kikkert hvordan
                                    mennesker tenker om universet. Vitenskapen var ikke lenger lydighet til
                                    autoritet — den ble til det du selv kan se og måle.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 pb-5 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                    {seen.size} av {OBJECTS.length} oppdagelser sett
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}

function NakedEyeView({ id }: { id: ObjectId }) {
    const dotSize = id === 'mane' || id === 'sol' ? 80 : 8;
    const color = id === 'sol' ? 'bg-amber-200' : 'bg-slate-100';
    return (
        <div className="relative w-full h-full">
            {Array.from({ length: 60 }).map((_, i) => {
                const x = (i * 53) % 100;
                const y = (i * 31 + 13) % 100;
                return (
                    <div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
                        style={{ left: `${x}%`, top: `${y}%` }}
                    />
                );
            })}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${color} rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)]`}
                style={{ width: dotSize, height: dotSize }}
            />
        </div>
    );
}

function TelescopeView({ id }: { id: ObjectId }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Telescope eyepiece — circular viewport */}
            <div className="relative w-[78%] aspect-square rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-black border-4 border-slate-700 shadow-inner overflow-hidden">
                {id === 'mane' && <MoonDetail />}
                {id === 'jupiter' && <JupiterDetail />}
                {id === 'venus' && <VenusDetail />}
                {id === 'sol' && <SunDetail />}
            </div>
        </div>
    );
}

function MoonDetail() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[85%] aspect-square rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-[inset_-20px_-20px_50px_rgba(0,0,0,0.4)]">
                {[
                    { x: 30, y: 25, s: 18 },
                    { x: 65, y: 35, s: 10 },
                    { x: 50, y: 55, s: 24 },
                    { x: 25, y: 70, s: 12 },
                    { x: 75, y: 70, s: 8 },
                    { x: 40, y: 40, s: 6 },
                ].map((c, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-slate-500/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6)]"
                        style={{
                            left: `${c.x}%`,
                            top: `${c.y}%`,
                            width: c.s,
                            height: c.s,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function JupiterDetail() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[55%] aspect-square rounded-full bg-gradient-to-b from-amber-300 via-orange-400 to-orange-600 shadow-[inset_-15px_-15px_40px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-x-0 top-1/3 h-2 bg-orange-700/40" />
                <div className="absolute inset-x-0 top-1/2 h-1.5 bg-amber-800/30" />
            </div>
            {[
                { x: 12, label: 'Io' },
                { x: 28, label: 'Europa' },
                { x: 72, label: 'Ganymedes' },
                { x: 86, label: 'Kallisto' },
            ].map((m, mi) => (
                <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + scatter(mi, 1) * 0.4 }}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    style={{ left: `${m.x}%` }}
                    title={m.label}
                />
            ))}
        </div>
    );
}

function VenusDetail() {
    return (
        <div className="absolute inset-0 flex items-center justify-around px-6">
            {[0.15, 0.45, 0.75, 1].map((phase, i) => (
                <div key={i} className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full bg-slate-700" />
                    <div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-100 to-amber-300"
                        style={{
                            clipPath: `inset(0 ${(1 - phase) * 100}% 0 0)`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

function SunDetail() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[80%] aspect-square rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 shadow-[0_0_40px_rgba(255,200,80,0.6)]">
                {[
                    { x: 32, y: 30, s: 10 },
                    { x: 55, y: 45, s: 14 },
                    { x: 70, y: 65, s: 8 },
                    { x: 40, y: 70, s: 6 },
                ].map((spot, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-stone-800/70"
                        style={{
                            left: `${spot.x}%`,
                            top: `${spot.y}%`,
                            width: spot.s,
                            height: spot.s,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
