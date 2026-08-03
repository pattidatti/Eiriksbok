import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Radio, Shield, Users, AlertTriangle } from 'lucide-react';

export const EliteNetworkBuilder: React.FC = () => {
    const [wealth, setWealth] = useState(60);
    const [militarySupport, setMilitarySupport] = useState(50);
    const [mediaControl, setMediaControl] = useState(40);
    const [dissent, setDissent] = useState(20);
    const [day, setDay] = useState(1);
    const totalPower = (wealth + militarySupport + mediaControl) / 3;

    // Utledet, ikke egen state: sluttilstanden følger alltid direkte av målerne.
    // Som state i en effect ble den satt én render for sent, og reset måtte huske
    // å nullstille den i tillegg til målerne.
    const gameOver =
        totalPower < 30
            ? 'Kupp! Den herskende klassen var for svak. En ny elite har tatt makten.'
            : dissent > 80
              ? 'Revolusjon! Folket har stormet palasset. Oligarkiet har falt.'
              : null;

    const performAction = (action: string) => {
        if (gameOver) return;

        setDay(day + 1);

        // Passive changes per turn
        setDissent(prev => Math.min(100, prev + 5));

        switch (action) {
            case 'bribe_press':
                setWealth(prev => prev - 10);
                setMediaControl(prev => Math.min(100, prev + 15));
                setDissent(prev => Math.max(0, prev - 5));
                break;
            case 'fund_military':
                setWealth(prev => prev - 15);
                setMilitarySupport(prev => Math.min(100, prev + 20));
                setDissent(prev => prev + 5); // People dislike military spending
                break;
            case 'tax_break':
                setWealth(prev => Math.min(100, prev + 20));
                setDissent(prev => prev + 10); // People hate tax cuts for rich
                break;
            case 'propaganda':
                setMediaControl(prev => Math.max(0, prev - 5));
                setDissent(prev => Math.max(0, prev - 10));
                break;
        }
    };

    const reset = () => {
        setWealth(60);
        setMilitarySupport(50);
        setMediaControl(40);
        setDissent(20);
        setDay(1);
    };

    return (
        <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl border border-slate-700 my-10 shadow-2xl relative overflow-hidden font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-amber-500 mb-1 flex items-center gap-2">
                        <Users /> ELITENETTVERKET
                    </h3>
                    <p className="text-slate-400 text-sm">Hold makten. Unngå revolusjon. Dag {day}.</p>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Total Makt</span>
                    <span className={`text-xl font-bold ${totalPower < 40 ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.round(totalPower)}%
                    </span>
                </div>
            </div>

            {gameOver ? (
                <div className="bg-white/10 p-8 rounded-xl text-center border-2 border-red-500 mb-8 backdrop-blur-sm">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h4 className="text-2xl font-black text-white mb-2">{gameOver.split('!')[0]}!</h4>
                    <p className="text-slate-300 mb-6">{gameOver.split('!')[1]}</p>
                    <button onClick={reset} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-black font-bold rounded-lg transition-colors">
                        Prøv igjen
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Metrics */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-end mb-2">
                            <Briefcase className="text-emerald-400" />
                            <span className="font-mono font-bold text-xl">{wealth}%</span>
                        </div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Kapital</div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${wealth}%` }} className="h-full bg-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-end mb-2">
                            <Shield className="text-blue-400" />
                            <span className="font-mono font-bold text-xl">{militarySupport}%</span>
                        </div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Militær støtte</div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${militarySupport}%` }} className="h-full bg-blue-500" />
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-end mb-2">
                            <Radio className="text-purple-400" />
                            <span className="font-mono font-bold text-xl">{mediaControl}%</span>
                        </div>
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Mediekontroll</div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${mediaControl}%` }} className="h-full bg-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => performAction('bribe_press')}
                    disabled={!!gameOver}
                    className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-left border border-slate-700 transition-all group"
                >
                    <div className="text-xs font-bold text-purple-400 mb-1">KJØP MEDIER</div>
                    <div className="text-sm font-medium mb-2">Bestikk journalister</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span className="text-red-400">-10$</span>
                        <span className="text-green-400">+Media</span>
                    </div>
                </button>

                <button
                    onClick={() => performAction('fund_military')}
                    disabled={!!gameOver}
                    className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-left border border-slate-700 transition-all group"
                >
                    <div className="text-xs font-bold text-blue-400 mb-1">STØTT HÆREN</div>
                    <div className="text-sm font-medium mb-2">Gi generalene lønnsøkning</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span className="text-red-400">-15$</span>
                        <span className="text-green-400">+Militær</span>
                    </div>
                </button>

                <button
                    onClick={() => performAction('tax_break')}
                    disabled={!!gameOver}
                    className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-left border border-slate-700 transition-all group"
                >
                    <div className="text-xs font-bold text-emerald-400 mb-1">SKATTEKUTT</div>
                    <div className="text-sm font-medium mb-2">Kutt skatt for de rike</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span className="text-green-400">+20$</span>
                        <span className="text-red-400">+Misnøye</span>
                    </div>
                </button>

                <button
                    onClick={() => performAction('propaganda')}
                    disabled={!!gameOver}
                    className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-left border border-slate-700 transition-all group"
                >
                    <div className="text-xs font-bold text-amber-400 mb-1">SPIN-DOKTOR</div>
                    <div className="text-sm font-medium mb-2">Kjør svertekampanje</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span className="text-red-400">-Media</span>
                        <span className="text-green-400">-Misnøye</span>
                    </div>
                </button>
            </div>

            {/* Dissent Meter */}
            <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
                    <span>Folkelig Misnøye</span>
                    <span className={dissent > 60 ? 'text-red-500 animate-pulse' : 'text-slate-400'}>{dissent}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${dissent}%` }}
                        className={`h-full ${dissent > 60 ? 'bg-red-500' : 'bg-slate-500'}`}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1 uppercase tracking-widest">
                    <span>Passiv</span>
                    <span>Protester</span>
                    <span>Opprør</span>
                    <span>Revolusjon</span>
                </div>
            </div>

        </div>
    );
};
