import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { TrendingUp, Info } from 'lucide-react';
import type { TooltipItem } from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const BusinessCycleGraph: React.FC = () => {
    const [interestRate, setInterestRate] = useState(5);

    // Generate data based on interest rate
    const data = useMemo(() => {
        const labels = Array.from({ length: 20 }, (_, i) => `År ${i + 1}`);

        // Sustainable growth (steady 3% growth)
        const sustainable = labels.map((_, i) => 100 * Math.pow(1.03, i));

        // Business Cycle (Boom/Bust)
        // Lower interest rate = Higher amplitude (bigger boom, deeper bust)
        // Rate 5 = Normal volatility
        // Rate 1 = Extreme volatility
        const volatility = (11 - interestRate) * 0.05; // 0.05 to 0.5

        const cycle = labels.map((_, i) => {
            const trend = 100 * Math.pow(1.03, i);
            // Sine wave component: sin(x) * volatility * trend
            // We want the boom to start early
            const wave = Math.sin(i * 0.6) * volatility * trend;
            return trend + wave;
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Konjunktursyklus (Boom/Bust)',
                    data: cycle,
                    borderColor: 'rgb(99, 102, 241)', // Indigo-500
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Bærekraftig Vekst (Ekte Sparing)',
                    data: sustainable,
                    borderColor: 'rgb(16, 185, 129)', // Emerald-500
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                },
            ],
        };
    }, [interestRate]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: TooltipItem<'line'>) {
                        return `${context.dataset.label}: ${Math.round(Number(context.raw))}`;
                    }
                }
            },
        },
        scales: {
            y: {
                title: {
                    display: true,
                    text: 'Økonomisk Verdi (BNP)'
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    // Determine current state description
    const getAnalysis = () => {
        if (interestRate > 7) return {
            title: "Høy Rente (Stramt)",
            desc: "Høy rente demper låneviljen. Syklusen følger den bærekraftige veksten tettere, med mindre svingninger. Kjedelig, men trygt.",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200"
        };
        if (interestRate < 4) return {
            title: "Lav Rente (Kunstig Boom)",
            desc: "Ekstremt lav rente skaper en massiv boom (boble) som går langt over den bærekraftige linjen. Men legg merke til nedturen (krisen) som følger – den blir like dyp som oppturen var høy.",
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200"
        };
        return {
            title: "Moderat Rente",
            desc: "Normale svingninger. Økonomien puster, men uten de mest ekstreme boblene.",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-200"
        };
    };

    const analysis = getAnalysis();

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 my-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Konjunktursyklusen Visualisert
            </h3>

            <div className="mb-6 space-y-4">
                <p className="text-slate-600">
                    Se hvordan renten påvirker svingningene i økonomien. Den stiplede linjen viser stabil, bærekraftig vekst basert på ekte sparing. Den helhetlige linjen viser den faktiske økonomien.
                </p>
                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    "På grunn av at sentralbanker overstyrer, er det egentlig umulig å vite om renten er for høy eller lav, for man har ikke tilgang på informasjon om den faktiske spareraten og tålmodigheten til samfunnet."
                </p>
            </div>

            {/* Controls */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-2">
                    <label className="font-medium text-slate-700">Sentralbankens Styringsrente</label>
                    <span className="font-bold text-indigo-600">{interestRate}%</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1% (Lav rente)</span>
                    <span>10% (Høy rente)</span>
                </div>
            </div>

            {/* Analysis Box */}
            <div className={`mb-6 p-4 rounded-lg border ${analysis.bg} ${analysis.border} flex gap-3`}>
                <Info className={`w-5 h-5 shrink-0 ${analysis.color} mt-0.5`} />
                <div>
                    <h4 className={`font-bold ${analysis.color} text-sm`}>{analysis.title}</h4>
                    <p className="text-sm text-slate-700 mt-1">{analysis.desc}</p>
                </div>
            </div>

            {/* Graph */}
            <div className="h-64 md:h-80 w-full">
                <Line options={options} data={data} />
            </div>

            <div className="mt-4 text-xs text-slate-500 italic text-center">
                * Grafen er en illustrasjon av Østerriksk Konjunkturteori (ABCT).
            </div>
        </div>
    );
};
