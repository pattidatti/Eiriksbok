import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Baby, HeartPulse } from 'lucide-react';

type AgeGroup = {
    range: string;
    male: number;
    female: number;
};

type PyramidShape = 'expansive' | 'stationary' | 'constrictive';

// Pyramiden får en tilfeldig variasjon per kohort, så den kan ikke utledes under
// render. Regnestykket ligger på modulnivå og kjøres fra skyvekontrollene i
// stedet for fra en effect.
const buildPyramid = (birthRate: number, lifeExpectancy: number): AgeGroup[] => {
    const newData: AgeGroup[] = [];
    const ageGroups = [
        '0-4',
        '5-9',
        '10-14',
        '15-19',
        '20-24',
        '25-29',
        '30-34',
        '35-39',
        '40-44',
        '45-49',
        '50-54',
        '55-59',
        '60-64',
        '65-69',
        '70-74',
        '75-79',
        '80+',
    ];

    // Calculate decay factor based on life expectancy
    // Higher life expectancy = lower decay (more people survive)
    const decay = 0.85 + ((lifeExpectancy - 50) / 40) * 0.14; // 0.85 to 0.99

    // Calculate birth factor
    // Higher birth rate = wider base
    const baseWidth = (birthRate / 10) * 100;

    let currentPop = baseWidth;

    ageGroups.forEach((range, i) => {
        // Simulate cohort shrinking over time
        // For the first few groups, it's mostly about birth rate history
        // For older groups, it's about mortality

        // Simple simulation:
        // If birth rate is high now, bottom bars are wide.
        // If life expectancy is high, top bars stay wide longer.

        if (i > 0) {
            currentPop = currentPop * decay;

            // Adjust for "baby boom" or rapid changes if we wanted more complex logic
            // But for this simple builder, we assume stable rates over the cohort's life for simplicity
            // OR we interpret sliders as "Current State of Society" parameters
        }

        // Add some noise/variation
        const variance = 0.95 + Math.random() * 0.1;

        newData.push({
            range,
            male: Math.round(currentPop * 0.49 * variance),
            female: Math.round(currentPop * 0.51 * variance),
        });
    });

    return newData;
};

export const PopulationPyramidBuilder: React.FC = () => {
    const [birthRate, setBirthRate] = useState(30); // 10-50
    const [lifeExpectancy, setLifeExpectancy] = useState(70); // 50-90
    const [data, setData] = useState<AgeGroup[]>(() => buildPyramid(30, 70));

    // Utledet, ikke egen state: formen følger alltid direkte av fødselsraten.
    const shape: PyramidShape =
        birthRate > 35 ? 'expansive' : birthRate < 15 ? 'constrictive' : 'stationary';

    const changeBirthRate = (next: number) => {
        setBirthRate(next);
        setData(buildPyramid(next, lifeExpectancy));
    };

    const changeLifeExpectancy = (next: number) => {
        setLifeExpectancy(next);
        setData(buildPyramid(birthRate, next));
    };

    const maxVal = Math.max(...data.map((d) => Math.max(d.male, d.female)));

    return (
        <div className="my-8 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    Bygg en Befolkningspyramide
                </h3>
                <p className="text-slate-600 mt-2">
                    Endre på fødselstall og levealder for å se hvordan pyramidens form endrer seg.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="space-y-8 p-6 bg-white rounded-xl border border-slate-100 shadow-sm h-fit">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="font-bold text-slate-700 flex items-center gap-2">
                                <Baby className="w-5 h-5 text-blue-500" />
                                Fødselstrate
                            </label>
                            <span className="text-blue-600 font-mono font-bold">
                                {birthRate} pr 1000
                            </span>
                        </div>
                        <input
                            type="range"
                            value={birthRate}
                            onChange={(e) => changeBirthRate(Number(e.target.value))}
                            min={10}
                            max={50}
                            step={1}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-slate-500">
                            Hvor mange barn fødes per 1000 innbyggere? (10 = Lavt, 50 = Høyt)
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="font-bold text-slate-700 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-red-500" />
                                Forventet Levealder
                            </label>
                            <span className="text-red-600 font-mono font-bold">
                                {lifeExpectancy} år
                            </span>
                        </div>
                        <input
                            type="range"
                            value={lifeExpectancy}
                            onChange={(e) => changeLifeExpectancy(Number(e.target.value))}
                            min={50}
                            max={90}
                            step={1}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <p className="text-xs text-slate-500">
                            Hvor lenge lever folk i gjennomsnitt? (50 = Lavt, 90 = Høyt)
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Resultat
                        </div>
                        <div
                            className={`text-center p-3 rounded-lg font-bold text-lg capitalize transition-colors
                    ${shape === 'expansive' ? 'bg-green-100 text-green-800' : ''}
                    ${shape === 'stationary' ? 'bg-blue-100 text-blue-800' : ''}
                    ${shape === 'constrictive' ? 'bg-orange-100 text-orange-800' : ''}
                `}
                        >
                            {shape === 'expansive' && 'Ekspansiv (Trekant)'}
                            {shape === 'stationary' && 'Stabil (Bikube)'}
                            {shape === 'constrictive' && 'Konstriktiv (Urne)'}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-full h-full flex items-end justify-center gap-[1px] relative">
                        {/* Y-Axis Labels */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 py-1 h-full">
                            {data.map((_, i) =>
                                i % 2 === 0 ? (
                                    <span key={i}>{data[data.length - 1 - i].range}</span>
                                ) : null
                            )}
                        </div>

                        {/* Bars Container */}
                        <div className="flex flex-col-reverse w-full max-w-md gap-[2px] ml-8">
                            {data.map((group, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center w-full h-5 text-[9px] group relative hover:z-10"
                                >
                                    {/* Tooltip */}
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-1 bg-slate-800 text-white text-xs p-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                        {group.range}: M:{group.male} F:{group.female}
                                    </div>

                                    {/* Male Bar (Left) */}
                                    <div className="flex justify-end w-1/2 pr-0.5">
                                        <motion.div
                                            className="bg-blue-400 h-full rounded-l-sm"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(group.male / maxVal) * 100}%` }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                        />
                                    </div>

                                    {/* Female Bar (Right) */}
                                    <div className="flex justify-start w-1/2 pl-0.5">
                                        <motion.div
                                            className="bg-pink-400 h-full rounded-r-sm"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(group.female / maxVal) * 100}%` }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 mt-4 text-xs font-bold uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-sm"></div> Menn
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-pink-400 rounded-sm"></div> Kvinner
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
