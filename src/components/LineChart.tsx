import React from 'react';
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
import { Line } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

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

/** Samme punkt, men med x/y-navn slik noe av innholds-JSON-en skriver det. */
interface AliasedDataPoint {
    x?: number;
    y?: number;
    year?: number;
    value?: number;
}

interface DataPoint {
    year: number;
    value: number;
}

interface LineChartProps {
    title: string;
    data?: DataPoint[];
    points?: AliasedDataPoint[]; // Aliased data from some JSON files
    xAxisLabel?: string;
    yAxisLabel?: string;
    datasetLabel?: string;
    color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
    title,
    data = [],
    points,
    xAxisLabel,
    yAxisLabel,
    datasetLabel = 'Befolkning',
    color = 'rgb(79, 70, 229)' // Default to Indigo 600
}) => {
    // Normalize data: support 'points' prop and 'x/y' property names
    const normalizedData: DataPoint[] = React.useMemo(() => {
        const source = (points && Array.isArray(points)) ? points : data;
        if (!source || !Array.isArray(source)) return [];

        return source.map((item: AliasedDataPoint) => ({
            year: item.year ?? item.x ?? 0,
            value: item.value ?? item.y ?? 0
        }));
    }, [data, points]);

    if (normalizedData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 my-10 min-h-[100px] flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-slate-400 mb-2">{title}</h3>
                <p className="text-xs text-slate-300 italic">Ingen data tilgjengelig</p>
            </div>
        );
    }

    const chartData = {
        labels: normalizedData.map(d => d.year),
        datasets: [
            {
                label: datasetLabel,
                data: normalizedData.map(d => d.value),
                borderColor: color,
                backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold' as const
                },
                color: '#1e293b'
            },
            tooltip: {
                callbacks: {
                    label: (context: TooltipItem<'line'>) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Format number with spaces
                            label += new Intl.NumberFormat('no-NO').format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: !!yAxisLabel,
                    text: yAxisLabel
                }
            },
            x: {
                title: {
                    display: !!xAxisLabel,
                    text: xAxisLabel
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 my-10">
            <Line options={options} data={chartData} />
        </div>
    );
};
