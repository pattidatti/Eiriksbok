import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users } from 'lucide-react';
import { MiniGameHeader } from './MiniGameHeader';

interface Response {
    id: string;
    label: string;
    description: string;
    pressureChange: number;
    cooldown?: number;
}

interface CrowdPressureGameProps {
    config: {
        winNodeId: string;
        lossNodeId: string;
        timeLimit: number;
        fillRate: number;
        responses: Response[];
    };
    onComplete: (success: boolean) => void;
}

export const CrowdPressureGame: React.FC<CrowdPressureGameProps> = ({ config, onComplete }) => {
    const [pressure, setPressure] = useState(15);
    const [timeLeft, setTimeLeft] = useState(config.timeLimit);
    const [phase, setPhase] = useState<'playing' | 'win' | 'loss'>('playing');
    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
    const [log, setLog] = useState<string[]>([]);

    // Hold ref-en fersk i en effect, ikke under render — refs skal ikke skrives til
    // mens React renderer.
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Pressure fills over time
    useEffect(() => {
        if (phase !== 'playing') return;
        const interval = setInterval(() => {
            setPressure((p) => {
                const next = Math.min(100, p + config.fillRate);
                if (next >= 100) {
                    setPhase('loss');
                    setTimeout(() => onCompleteRef.current(false), 2000);
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, config.fillRate]);

    // Timer countdown
    useEffect(() => {
        if (phase !== 'playing') return;
        const interval = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    setPhase('win');
                    setTimeout(() => onCompleteRef.current(true), 2000);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    // Cooldown tick
    useEffect(() => {
        if (phase !== 'playing') return;
        const interval = setInterval(() => {
            setCooldowns((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((k) => {
                    if (next[k] > 0) next[k] = Math.max(0, next[k] - 1);
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    const handleResponse = (resp: Response) => {
        if ((cooldowns[resp.id] ?? 0) > 0 || phase !== 'playing') return;
        setPressure((p) => Math.min(100, Math.max(0, p + resp.pressureChange)));
        setCooldowns((prev) => ({ ...prev, [resp.id]: resp.cooldown ?? 4 }));
        setLog((prev) => [resp.label, ...prev].slice(0, 3));
    };

    const pressureColor =
        pressure < 40 ? 'bg-emerald-500' : pressure < 70 ? 'bg-amber-500' : 'bg-red-500';

    if (phase === 'win') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-3xl border border-emerald-200">
                <Users className="text-emerald-600 mb-4" size={48} />
                <h3 className="text-2xl font-bold text-stone-800 mb-2">Trykket holdt</h3>
                <p className="text-stone-600 text-center text-sm">
                    Du klarte å dempe opptøyene lenge nok — men revolusjonens gnister slukker ikke.
                </p>
            </div>
        );
    }

    if (phase === 'loss') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-3xl border border-red-200">
                <AlertTriangle className="text-red-600 mb-4" size={48} />
                <h3 className="text-2xl font-bold text-stone-800 mb-2">Revolusjonen utløst</h3>
                <p className="text-stone-600 text-center text-sm">
                    Folkemassene har nådd bristepunktet. Situasjonen er ute av kontroll.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden">
            <MiniGameHeader
                icon={Users}
                title="Folkemengde-trykk"
                badge={
                    <span className="flex items-center gap-3 text-[10px] font-mono text-stone-400 tabular-nums">
                        <span>
                            <span className={`font-bold ${pressure > 70 ? 'text-red-400' : 'text-stone-200'}`}>
                                {Math.round(pressure)}%
                            </span>
                        </span>
                        <span>
                            <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-stone-200'}`}>
                                {timeLeft}s
                            </span>
                        </span>
                    </span>
                }
            />

            {/* Pressure gauge */}
            <div className="p-5 pb-3">
                <div className="relative h-6 bg-stone-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        className={`absolute left-0 top-0 h-full rounded-full ${pressureColor}`}
                        animate={{ width: `${pressure}%` }}
                        transition={{ type: 'tween', duration: 0.6 }}
                    />
                    {pressure > 80 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow">
                                KRITISK
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Log */}
            <div className="px-5 pb-3">
                <div className="bg-white rounded-xl p-3 border border-stone-200 min-h-[44px]">
                    {log.length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center">
                            Folkemassene fyller gatene i Petrograd...
                        </p>
                    ) : (
                        log.map((entry, i) => (
                            <div
                                key={i}
                                className={`text-xs py-0.5 ${i === 0 ? 'font-bold text-stone-700' : 'text-stone-400'}`}
                            >
                                → {entry}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Response buttons */}
            <div className="p-5 pt-2 space-y-2">
                {config.responses.map((resp) => {
                    const cd = cooldowns[resp.id] ?? 0;
                    return (
                        <button
                            key={resp.id}
                            onClick={() => handleResponse(resp)}
                            disabled={cd > 0}
                            className={`relative w-full p-3 rounded-2xl text-left border transition-all ${
                                cd > 0
                                    ? 'bg-stone-200 border-stone-300 opacity-60 cursor-not-allowed'
                                    : resp.pressureChange > 0
                                      ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                      : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-sm text-stone-800">{resp.label}</div>
                                    <div className="text-xs text-stone-500 mt-0.5">{resp.description}</div>
                                </div>
                                <div
                                    className={`text-xs font-bold ml-3 flex-shrink-0 ${resp.pressureChange < 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                >
                                    {resp.pressureChange > 0 ? '+' : ''}
                                    {resp.pressureChange}%
                                </div>
                            </div>
                            {cd > 0 && (
                                <div className="absolute bottom-2 right-3 text-[10px] font-bold text-stone-400">
                                    {cd}s
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
