import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../types';
import { TelleTall } from './shared';

interface Bat {
    navn: string;
    plasser: number;
    brukt: number;
    fraBeat: number;
}

interface Props {
    bater: Bat[];
}

/** Livbåter sett ovenfra: ett sete per plass, fargede seter er folk som faktisk satt der. */
export function Livbater({ beat, props }: VisualProps<Props>) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-sky-300 flex flex-col items-center justify-center gap-6 px-8">
            {beat === 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-4xl md:text-6xl font-black text-slate-900 text-center"
                >
                    Halvtomme livbåter
                </motion.p>
            )}
            {props.bater.map((b) =>
                beat >= b.fraBeat ? (
                    <Baat key={b.navn} bat={b} uthevet={beat === b.fraBeat} />
                ) : null
            )}
            {beat >= 3 && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 py-2 rounded-2xl bg-white/90 text-xl md:text-3xl font-black text-slate-900 shadow"
                >
                    Ville du gått i båten?
                </motion.p>
            )}
        </div>
    );
}

function Baat({ bat, uthevet }: { bat: Bat; uthevet: boolean }) {
    const [fylt, setFylt] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setFylt(true), 50);
        return () => clearTimeout(t);
    }, []);
    const rader = 2;
    const perRad = Math.ceil(bat.plasser / rader);
    const sete = 15;
    const gap = 4;
    const bredde = perRad * (sete + gap) + 80;
    const hoyde = rader * (sete + gap) + 34;
    return (
        <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: uthevet ? 1 : 0.75, x: 0, scale: uthevet ? 1 : 0.92 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="flex flex-col items-center w-full max-w-[1100px]"
        >
            <div className="text-xl md:text-2xl font-bold text-slate-800 mb-1">
                {bat.navn}:{' '}
                <span className="text-teal-700 tabular-nums">
                    <TelleTall verdi={bat.brukt} forsinkelse={0.5} varighet={1.8} />
                </span>
                <span className="text-slate-500"> av {bat.plasser} plasser brukt</span>
            </div>
            <svg
                viewBox={`0 0 ${bredde} ${hoyde}`}
                style={{ width: bredde * 1.5, maxWidth: '100%' }}
            >
                <path
                    d={`M 20 ${hoyde / 2} Q 30 4 70 4 L ${bredde - 70} 4 Q ${bredde - 4} 4 ${bredde - 2} ${hoyde / 2} Q ${bredde - 4} ${hoyde - 4} ${bredde - 70} ${hoyde - 4} L 70 ${hoyde - 4} Q 30 ${hoyde - 4} 20 ${hoyde / 2} Z`}
                    fill="#f8fafc"
                    stroke="#334155"
                    strokeWidth={3}
                />
                {Array.from({ length: bat.plasser }, (_, i) => {
                    const r = i % rader;
                    const k = Math.floor(i / rader);
                    const brukt = fylt && i < bat.brukt;
                    return (
                        <rect
                            key={i}
                            x={45 + k * (sete + gap)}
                            y={17 + r * (sete + gap)}
                            width={sete}
                            height={sete}
                            rx={4}
                            style={{
                                fill: brukt ? '#0d9488' : '#e2e8f0',
                                stroke: brukt ? 'none' : '#94a3b8',
                                strokeDasharray: '3 2',
                                transition: `fill 300ms ease ${0.5 + (i / bat.plasser) * 1.6}s`,
                            }}
                        />
                    );
                })}
            </svg>
        </motion.div>
    );
}
