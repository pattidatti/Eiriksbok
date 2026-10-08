import { motion } from 'framer-motion';
import {
    Coins,
    LifeBuoy,
    Radio,
    ScrollText,
    Ship,
    Snowflake,
    Star,
    Swords,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../types';

const IKONER: Record<string, LucideIcon> = {
    livbat: LifeBuoy,
    radio: Radio,
    is: Snowflake,
    avtale: ScrollText,
    skip: Ship,
    penger: Coins,
    hest: Swords,
    haer: Users,
    stjerne: Star,
};

interface Props {
    tittel: string;
    punkter: { ikon: string; tittel: string; tekst?: string; fraBeat: number }[];
}

/** Kort som legger seg på bordet ett for ett. Siste beat fremhever det første igjen. */
export function Punktkort({ beat, props }: VisualProps<Props>) {
    const siste = props.punkter.reduce((m, p) => Math.max(m, p.fraBeat), 0);
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-teal-50 flex flex-col items-center justify-center gap-[5%] px-[6%]">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900">{props.tittel}</h2>
            <div className="grid grid-cols-2 gap-5 w-full max-w-[1100px]">
                {props.punkter.map((p, i) => {
                    const Ikon = IKONER[p.ikon] ?? Ship;
                    const vis = beat >= p.fraBeat;
                    const fokus = beat === p.fraBeat || (beat > siste && i === 0);
                    return (
                        <motion.div
                            key={p.tittel}
                            initial={{ opacity: 0, y: 30, rotate: -2 }}
                            animate={{
                                opacity: vis ? (fokus ? 1 : 0.7) : 0,
                                y: vis ? 0 : 30,
                                rotate: vis ? 0 : -2,
                                scale: fokus ? 1.04 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                            className={`flex items-center gap-4 p-5 rounded-3xl bg-white shadow-xl border-2 ${fokus ? 'border-teal-500' : 'border-transparent'}`}
                        >
                            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                                <Ikon className="w-9 h-9 md:w-11 md:h-11" />
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                                    {p.tittel}
                                </div>
                                {p.tekst && (
                                    <div className="text-base md:text-xl font-semibold text-slate-500">
                                        {p.tekst}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
