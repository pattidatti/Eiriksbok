import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Stethoscope, Baby, Skull, Hourglass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Én dødsårsak med sin andel av dødeligheten. */
interface DeathCause {
    id: string;
    label: string;
    val: number;
    color: string;
}

/** Tallene for ett årstall på skyvebryteren. */
interface Era {
    le: number;
    causes: DeathCause[];
    desc: string;
    icon: LucideIcon;
}

export const LifeExpectancyModel = () => {
    const [year, setYear] = useState<number>(1900);

    // Data mapping for different eras
    const eras: Record<number, Era> = {
        1850: {
            le: 45,
            causes: [
                { id: 'infant', label: 'Spedbarnsdød', val: 40, color: 'bg-rose-400' },
                { id: 'infection', label: 'Infeksjoner', val: 35, color: 'bg-orange-400' },
                { id: 'old', label: 'Alderdom', val: 25, color: 'bg-indigo-400' }
            ],
            desc: "Før renslighet og vaksiner. Mange barn dør før de fyller 5 år.",
            icon: Skull
        },
        1900: {
            le: 52,
            causes: [
                { id: 'infant', label: 'Spedbarnsdød', val: 25, color: 'bg-rose-400' },
                { id: 'infection', label: 'Infeksjoner', val: 30, color: 'bg-orange-400' },
                { id: 'old', label: 'Alderdom', val: 45, color: 'bg-indigo-400' }
            ],
            desc: "Bedre hygiene og kloakksystemer begynner å hjelpe, men ingen antibiotika ennå.",
            icon: Stethoscope
        },
        1950: {
            le: 72,
            causes: [
                { id: 'infant', label: 'Spedbarnsdød', val: 5, color: 'bg-rose-400' },
                { id: 'infection', label: 'Infeksjoner', val: 10, color: 'bg-orange-400' },
                { id: 'lifestyle', label: 'Livsstil/Kreft', val: 30, color: 'bg-purple-400' },
                { id: 'old', label: 'Alderdom', val: 55, color: 'bg-indigo-400' }
            ],
            desc: "Vaksiner og antibiotika har fjernet de store barnemorderne.",
            icon: Baby
        },
        2020: {
            le: 83,
            causes: [
                { id: 'infant', label: 'Spedbarnsdød', val: 1, color: 'bg-rose-400' },
                { id: 'lifestyle', label: 'Livsstil/Kreft', val: 40, color: 'bg-purple-400' },
                { id: 'old', label: 'Alderdom', val: 59, color: 'bg-indigo-400' }
            ],
            desc: "Vi lever så lenge at kroppen slites ut av kreft og hjerteproblemer.",
            icon: HeartPulse
        }
    };

    // Find closest available year in keys
    const availableYears = Object.keys(eras).map(Number).sort((a, b) => a - b);
    const closestYear = availableYears.reduce((prev, curr) =>
        (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev)
    );

    const data = eras[closestYear];
    const EraIcon = data.icon;

    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans">
            <div className="bg-sky-900 p-6 text-white flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Hourglass className="w-5 h-5 text-sky-400" />
                        Tidsreisen: Helse
                    </h3>
                    <p className="text-sky-200 text-sm mt-1">Dine sjanser for å overleve i {closestYear}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-sky-300">{data.le} år</div>
                    <div className="text-xs uppercase tracking-wider opacity-70">Forventet levealder</div>
                </div>
            </div>

            <div className="p-8">
                <input
                    type="range"
                    min="1850"
                    max="2020"
                    step="10"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 mb-8"
                />

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={closestYear}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-sky-100 p-3 rounded-full text-sky-700">
                                        <EraIcon className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800">Året er {closestYear}</h4>
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    {data.desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <h5 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-4">Dødsårsaker (Fordeling)</h5>
                        <div className="space-y-3">
                            {data.causes.map((cause) => (
                                <div key={cause.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{cause.label}</span>
                                        <span className="text-slate-500">{cause.val}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cause.val}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={`h-full ${cause.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
