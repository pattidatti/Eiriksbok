import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Building2, Wallet, ArrowRight } from 'lucide-react';

export const ProductionModel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'planner' | 'market'>('planner');

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 my-8">
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('planner')}
                    className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'planner'
                        ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Offentlig Planlegging
                </button>
                <button
                    onClick={() => setActiveTab('market')}
                    className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'market'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Privat Marked
                </button>
            </div>

            <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'planner' ? <PlannerSimulation /> : <MarketSimulation />}
                </AnimatePresence>
            </div>
        </div>
    );
};

const PlannerSimulation = () => {
    // Hidden "True Needs" that change every year
    const [trueNeeds, setTrueNeeds] = useState({
        helse: { senger: 50, utstyr: 50, ansatte: 50 },
        skole: { boker: 50, pc: 50, bygg: 50 },
        transport: { vei: 50, tog: 50, vedlikehold: 50 }
    });

    // User's plan
    const [plan, setPlan] = useState({
        helse: { senger: 50, utstyr: 50, ansatte: 50 },
        skole: { boker: 50, pc: 50, bygg: 50 },
        transport: { vei: 50, tog: 50, vedlikehold: 50 }
    });

    const [reports, setReports] = useState<string[]>([]);
    const [year, setYear] = useState(2024);
    const [score, setScore] = useState(100);

    const activeSectorKeys = ['helse', 'skole', 'transport'] as const;
    const [selectedSector, setSelectedSector] = useState<(typeof activeSectorKeys)[number]>('helse');

    const labels: Record<string, Record<string, string>> = {
        helse: { senger: "Sengeplasser", utstyr: "Avansert Utstyr", ansatte: "Leger/Sykepleiere" },
        skole: { boker: "Lærebøker", pc: "PC-er", bygg: "Skolebygg" },
        transport: { vei: "Motorvei", tog: "Jernbane", vedlikehold: "Vedlikehold" }
    };

    const runYear = () => {
        const newReports: string[] = [];
        let totalError = 0;

        // Calculate mismatches and generate narrative reports
        // Health
        if (plan.helse.senger > plan.helse.ansatte + 20) newReports.push("Helse: Vi har bygget mange nye sengeposter, men mangler folk. Rommene står tomme.");
        if (plan.helse.utstyr > plan.helse.ansatte + 20) newReports.push("Helse: Dyrt MR-utstyr støver ned fordi vi mangler spesialister.");
        if (plan.helse.ansatte > plan.helse.senger + 20) newReports.push("Helse: Leger går i gangene og har ingen steder å behandle pasienter.");
        if (plan.helse.senger < trueNeeds.helse.senger - 20) newReports.push("Helse: Pasienter må sove på gangen (korridorpasienter).");

        // School
        if (plan.skole.pc > plan.skole.bygg + 20) newReports.push("Skole: Vi kjøpte inn tusenvis av PC-er, men skolene har ikke strømuttak eller pulter nok.");
        if (plan.skole.bygg > trueNeeds.skole.bygg + 20) newReports.push("Skole: Nye, flotte skolebygg står tomme i utkantstrøk.");
        if (plan.skole.boker < trueNeeds.skole.boker - 20) newReports.push("Skole: Elevene må dele på utslitte lærebøker.");

        // Transport
        if (plan.transport.tog > plan.transport.vedlikehold + 20) newReports.push("Transport: Vi kjøpte flotte nye tog, men skinnegangen er ødelagt. Togene står.");
        if (plan.transport.vei > trueNeeds.transport.vei + 20) newReports.push("Transport: Vi bygget motorvei der ingen bor.");
        if (plan.transport.vedlikehold < trueNeeds.transport.vedlikehold - 20) newReports.push("Transport: Veiene er fulle av hull, folk kommer ikke på jobb.");

        // General abstract error calculation
        (Object.keys(plan) as Array<keyof typeof plan>).forEach(sector => {
            const sectorPlan = plan[sector];
            const sectorNeeds = trueNeeds[sector];

            Object.keys(sectorPlan).forEach(item => {
                const p = (sectorPlan as Record<string, number>)[item];
                const n = (sectorNeeds as Record<string, number>)[item];
                totalError += Math.abs(p - n);
            });
        });

        if (newReports.length === 0) newReports.push("Utrolig nok, ingen store kriser i år.");

        setReports(newReports);
        setScore(Math.max(0, 100 - Math.round(totalError / 3)));
        setYear(y => y + 1);

        // Randomize needs for next year (The hidden target moves!)
        setTrueNeeds(prev => ({
            helse: {
                senger: Math.max(10, Math.min(90, prev.helse.senger + (Math.random() * 20 - 10))),
                utstyr: Math.max(10, Math.min(90, prev.helse.utstyr + (Math.random() * 20 - 10))),
                ansatte: Math.max(10, Math.min(90, prev.helse.ansatte + (Math.random() * 20 - 10)))
            },
            skole: {
                boker: Math.max(10, Math.min(90, prev.skole.boker + (Math.random() * 20 - 10))),
                pc: Math.max(10, Math.min(90, prev.skole.pc + (Math.random() * 20 - 10))),
                bygg: Math.max(10, Math.min(90, prev.skole.bygg + (Math.random() * 20 - 10)))
            },
            transport: {
                vei: Math.max(10, Math.min(90, prev.transport.vei + (Math.random() * 20 - 10))),
                tog: Math.max(10, Math.min(90, prev.transport.tog + (Math.random() * 20 - 10))),
                vedlikehold: Math.max(10, Math.min(90, prev.transport.vedlikehold + (Math.random() * 20 - 10)))
            }
        }));
    };

    const updatePlan = (item: string, val: number) => {
        setPlan(prev => ({
            ...prev,
            [selectedSector]: {
                ...prev[selectedSector],
                [item]: val
            }
        }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-4">
                <Building2 className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                    <h3 className="font-bold text-red-800 text-lg">Sentralplanleggingskomiteen ({year})</h3>
                    <p className="text-red-700 text-sm mt-1">
                        Din jobb er å bestemme nøyaktig hva samfunnet trenger. Du har ingen priser, bare rapporter.
                        Bestem mengden ressurser (0-100) til hver ting.
                    </p>
                </div>
                <div className="ml-auto flex flex-col items-center bg-white p-2 rounded shadow-sm border border-red-100">
                    <span className="text-xs text-slate-400 font-bold uppercase">Effektivitet</span>
                    <span className={`text-2xl font-black ${score > 80 ? 'text-green-600' : score > 50 ? 'text-orange-500' : 'text-red-600'}`}>
                        {score}%
                    </span>
                </div>
            </div>

            {/* Sector Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                {activeSectorKeys.map(s => (
                    <button
                        key={s}
                        onClick={() => setSelectedSector(s)}
                        className={`flex-1 py-2 rounded-md text-sm font-bold capitalize transition-all ${selectedSector === s ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Sliders for active sector */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                {Object.keys(plan[selectedSector]).map(key => (
                    <div key={key}>
                        <div className="flex justify-between mb-2">
                            <label className="font-medium text-slate-700">{labels[selectedSector][key]}</label>
                            <span className="font-bold text-blue-600">{(plan[selectedSector] as Record<string, number>)[key]} enheter</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={(plan[selectedSector] as Record<string, number>)[key]}
                            onChange={(e) => updatePlan(key, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={runYear}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
            >
                Iverksett 5-årsplanen <ArrowRight className="w-5 h-5" />
            </button>

            {/* Reports */}
            {reports.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-500">
                    {reports.map((r, i) => (
                        <div key={i} className="flex gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-slate-700 text-sm">
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                            {r}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// Etterspørselen svinger tilfeldig, så markedsresultatet kan ikke utledes under
// render. Regnestykket ligger på modulnivå og kjøres fra skyvekontrollene i stedet
// for fra en effect.
const simulateMarket = (price: number, production: number) => {
    // Consumer demand curve: Higher price = lower demand
    // But demand also fluctuates randomly
    const baseDemand = 100 - price;
    const fluctuation = Math.random() * 20 - 10;
    const actualDemand = Math.max(0, baseDemand + fluctuation);

    const sold = Math.min(production, actualDemand);
    const revenue = sold * price;
    const cost = production * 30; // Fixed unit cost

    return {
        profit: revenue - cost,
        feedback:
            production > actualDemand + 10
                ? 'Lageret fylles opp! Ingen vil kjøpe til denne prisen.'
                : production < actualDemand - 10
                  ? 'Utsolgt! Kundene skriker etter mer.'
                  : 'God balanse mellom tilbud og etterspørsel.',
    };
};

const MarketSimulation = () => {
    const [price, setPrice] = useState(50);
    const [production, setProduction] = useState(50);
    const [{ profit, feedback }, setMarket] = useState(() => simulateMarket(50, 50));

    const changePrice = (next: number) => {
        setPrice(next);
        setMarket(simulateMarket(next, production));
    };

    const changeProduction = (next: number) => {
        setProduction(next);
        setMarket(simulateMarket(price, next));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Din Bedrift AS
                </h3>
                <p className="text-blue-700 text-sm">
                    Du produserer joggesko. Du må gjette hva kundene vil betale og hvor mange du skal lage.
                    Profitten forteller deg om du gjør rett.
                </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-medium text-slate-700">Pris ut til kunde (kr)</label>
                        <span className="font-bold text-blue-600">{price},-</span>
                    </div>
                    <input
                        type="range" min="10" max="100" value={price}
                        onChange={(e) => changePrice(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-medium text-slate-700">Antall produsert</label>
                        <span className="font-bold text-blue-600">{production} stk</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={production}
                        onChange={(e) => changeProduction(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className={`text-2xl font-bold ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {profit > 0 ? '+' : ''}{Math.round(profit)} kr
                </div>
                <div className="text-sm text-slate-600 border-l pl-4 border-slate-200">
                    <div className="font-medium">Markedssignal:</div>
                    {feedback}
                </div>
            </div>

            <p className="text-xs text-slate-400 italic">
                I et fritt marked fungerer profitt og tap som signaler. Tap betyr "stopp, du sløser ressurser". Profitt betyr "fortsett, folk vil ha dette".
            </p>
        </motion.div>
    );
};


