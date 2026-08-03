import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, PiggyBank } from 'lucide-react';

export const InflationCalculator: React.FC = () => {
    const [interestRate, setInterestRate] = useState(5);

    // Savings calculator state
    const [savingsAmount, setSavingsAmount] = useState(10000);
    const [years, setYears] = useState(10);
    const [inflationRate, setInflationRate] = useState(2.5);

    // Utledet, ikke egen state: pengemengde og prisnivå følger alltid direkte av
    // renta. Som state i en effect lå de én render bak — eleven dro i renta og så
    // forrige verdi et øyeblikk.
    // Lower interest rate -> Higher money supply (more loans)
    // Higher interest rate -> Lower money supply (fewer loans)
    const moneySupply = 200 - interestRate * 10;
    // More money chasing same goods -> Higher prices
    // We assume goods are constant at 100 units
    const priceLevel = moneySupply;

    const calculateFutureValue = () => {
        // Real value = Nominal Value / (1 + inflation_rate)^years
        return savingsAmount / Math.pow(1 + inflationRate / 100, years);
    };

    const purchasingPowerLoss = savingsAmount - calculateFutureValue();

    return (
        <div className="space-y-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200 my-8">

            {/* Section 1: Interest Rate & Money Supply Model */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Hvordan renten påvirker inflasjon
                </h3>

                <div className="bg-slate-50 p-6 rounded-lg">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Styringsrente: {interestRate}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            step="0.5"
                            value={interestRate}
                            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Lav rente (Billig å låne)</span>
                            <span>Høy rente (Dyrt å låne)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-500 mb-2">Pengemengde i samfunnet</div>
                            <div className="flex justify-center items-center gap-1 flex-wrap h-16 overflow-hidden">
                                {Array.from({ length: Math.min(Math.floor(moneySupply / 10), 20) }).map((_, i) => (
                                    <DollarSign key={i} className="w-5 h-5 text-green-600" />
                                ))}
                            </div>
                            <div className="font-bold text-lg text-slate-800 mt-2">
                                {moneySupply > 150 ? 'Høy' : moneySupply < 80 ? 'Lav' : 'Middels'}
                            </div>
                        </div>

                        <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-500 mb-2">Prisnivå på varer</div>
                            <div className="flex justify-center items-center h-16">
                                <div className="relative">
                                    <ShoppingCart className="text-slate-800" style={{ width: `${priceLevel / 3}px`, height: `${priceLevel / 3}px` }} />
                                </div>
                            </div>
                            <div className="font-bold text-lg text-slate-800 mt-2">
                                {priceLevel.toFixed(0)} kr
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-slate-600 bg-blue-50 p-3 rounded border border-blue-100">
                        <strong>Forklaring:</strong> {interestRate < 4 ?
                            'Når renten er lav, tar folk opp mer lån. Det skapes nye penger. Mer penger konkurrerer om de samme varene, og prisene går opp (Inflasjon).' :
                            interestRate > 8 ?
                                'Når renten er høy, tar færre opp lån. Det skapes mindre nye penger. Prisveksten dempes eller prisene kan til og med synke.' :
                                'En moderat rente holder pengemengden og prisene stabile.'}
                    </div>
                </div>
            </div>

            {/* Section 2: Purchasing Power Calculator */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <PiggyBank className="w-6 h-6 text-pink-600" />
                    Hva skjer med sparepengene dine?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sparebeløp</label>
                            <input
                                type="number"
                                value={savingsAmount}
                                onChange={(e) => setSavingsAmount(Number(e.target.value))}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Årlig inflasjon (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={inflationRate}
                                onChange={(e) => setInflationRate(Number(e.target.value))}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Antall år</label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                            <div className="text-right text-sm text-slate-500">{years} år</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg flex flex-col justify-center">
                        <div className="mb-4">
                            <div className="text-sm text-slate-500">Verdi om {years} år (i dagens kroner)</div>
                            <div className="text-3xl font-bold text-slate-800">
                                {calculateFutureValue().toLocaleString('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Opprinnelig beløp:</span>
                                <span className="font-medium">{savingsAmount.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-600">Tapt kjøpekraft:</span>
                                <span className="font-medium text-red-600">-{purchasingPowerLoss.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500"
                                style={{ width: `${(calculateFutureValue() / savingsAmount) * 100}%` }}
                            />
                        </div>
                        <div className="text-xs text-slate-500 mt-1 text-center">
                            Du beholder ca. {((calculateFutureValue() / savingsAmount) * 100).toFixed(0)}% av kjøpekraften
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
