import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Husarbeidet i regnestykket: Kiær i 1912, med under og etter krigen fram til 1949, og ut
 * da FN laget felles regler i 1952. Til slutt mange land som regner likt.
 */

const B = 1600;
const H = 900;
const FRA = 1900;
const TIL = 1960;
const X0 = 140;
const X1 = 1460;
const Y = 520;

const x = (aar: number) => X0 + ((aar - FRA) / (TIL - FRA)) * (X1 - X0);

function Merke({
    aar,
    tekst,
    under,
    farge,
    vis,
    hoyde = 170,
    underY = 70,
    ned = false,
}: {
    aar: number;
    tekst: string;
    under: string;
    farge: string;
    vis: boolean;
    hoyde?: number;
    underY?: number;
    ned?: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <line x1={x(aar)} x2={x(aar)} y1={Y} y2={ned ? Y + hoyde : Y - hoyde} stroke={farge} strokeWidth={6} />
            <circle cx={x(aar)} cy={Y} r={16} fill={farge} />
            <text x={x(aar)} y={ned ? Y + hoyde + 55 : Y - hoyde - 70} textAnchor="middle" fontSize={56} fontWeight={900} fill={farge}>
                {aar}
            </text>
            <text x={x(aar)} y={ned ? Y + hoyde + 100 : Y - hoyde - 22} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                {tekst}
            </text>
            {under && (
                <text x={x(aar)} y={ned ? Y + hoyde + 140 : Y + underY} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                    {under}
                </text>
            )}
        </motion.g>
    );
}

export function BnpTidslinje({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={800} y={90} textAnchor="middle" fontSize={46} fontWeight={900} fill="#0f172a">
                    Var husarbeidet med i regnestykket?
                </text>
                {/* Tida husarbeidet var med: fra Kiær, og så krigen og årene etter */}
                <motion.rect
                    x={x(1912)}
                    y={Y - 22}
                    height={44}
                    rx={22}
                    fill="#ea580c"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: beat >= 1 ? 20 : 0, opacity: beat >= 1 ? 0.9 : 0 }}
                    transition={{ duration: 0.8 }}
                />
                <motion.rect
                    x={x(1940)}
                    y={Y - 22}
                    height={44}
                    rx={22}
                    fill="#ea580c"
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 2 ? x(1949) - x(1940) : 0 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                />
                <line x1={X0 - 40} x2={X1 + 40} y1={Y} y2={Y} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
                <Merke aar={1912} tekst="Kiær: verdt 15 % av inntekten" under="husarbeid regnes" farge="#ea580c" vis={beat >= 1} />
                <motion.text
                    x={(x(1940) + x(1949)) / 2}
                    y={Y + 70}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#c2410c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ delay: 0.8 }}
                >
                    krigen og årene etter
                </motion.text>
                <Merke aar={1949} tekst="regnet med til hit" under="" farge="#c2410c" vis={beat >= 2} hoyde={110} />
                <Merke aar={1952} tekst="FN: felles regler" under="husarbeid holdes utenfor" farge="#2563eb" vis={beat >= 3} hoyde={120} ned />
                {beat === 0 && (
                    <motion.text x={800} y={Y - 120} textAnchor="middle" fontSize={64} fontWeight={900} fill="#ea580c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        Ja, en gang
                    </motion.text>
                )}
            </svg>
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute flex items-center gap-5 px-6 py-3 rounded-2xl bg-white shadow-xl"
                    style={{ right: '4%', top: '14%' }}
                >
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.15 }}>
                            <Calculator size={46} className="text-blue-600" />
                        </motion.div>
                    ))}
                    <div className="text-3xl font-black text-slate-900 whitespace-nowrap">Alle land regner likt</div>
                </motion.div>
            )}
        </div>
    );
}
