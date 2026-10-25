import { motion } from 'framer-motion';
import { Baby, Brush, EyeOff, Flame, GraduationCap, Scissors, School, Trophy, type LucideIcon } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Hva teller i BNP? Kortene sorteres i to kolonner, beat for beat. Til slutt står
 * husbrannen alene i midten med et spørsmålstegn.
 */

interface Ting {
    tekst: string;
    Ikon: LucideIcon;
    teller: boolean;
    fraBeat: number;
}

const TING: Ting[] = [
    { tekst: 'Plen klippet for penger', Ikon: Scissors, teller: true, fraBeat: 0 },
    { tekst: 'Din egen plen', Ikon: Scissors, teller: false, fraBeat: 0 },
    { tekst: 'Skole', Ikon: GraduationCap, teller: true, fraBeat: 1 },
    { tekst: 'Barnehage', Ikon: School, teller: true, fraBeat: 1 },
    { tekst: 'Husarbeid', Ikon: Brush, teller: false, fraBeat: 2 },
    { tekst: 'Barnepass i familien', Ikon: Baby, teller: false, fraBeat: 2 },
    { tekst: 'Dugnad i idrettslaget', Ikon: Trophy, teller: false, fraBeat: 2 },
    { tekst: 'Svart arbeid', Ikon: EyeOff, teller: false, fraBeat: 3 },
];

function Kort({ t, beat }: { t: Ting; beat: number }) {
    const ny = t.fraBeat === beat;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: t.teller ? -60 : 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ny ? 0.3 : 0, type: 'spring', stiffness: 200, damping: 22 }}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl shadow-lg ${
                t.fraBeat === 3 ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
            }`}
        >
            <t.Ikon size={34} className={t.teller ? 'text-teal-600' : t.fraBeat === 3 ? 'text-slate-300' : 'text-red-500'} />
            <span className="text-2xl font-bold">{t.tekst}</span>
        </motion.div>
    );
}

function Kolonne({ tittel, under, farge, ting, beat }: { tittel: string; under: string; farge: string; ting: Ting[]; beat: number }) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl p-5" style={{ width: 400, background: `${farge}22`, border: `4px solid ${farge}` }}>
            <div>
                <div className="text-4xl font-black" style={{ color: farge }}>
                    {tittel}
                </div>
                <div className="text-xl font-semibold text-slate-600">{under}</div>
            </div>
            {ting
                .filter((t) => t.fraBeat <= beat && beat < 4)
                .map((t) => (
                    <Kort key={t.tekst} t={t} beat={beat} />
                ))}
        </div>
    );
}

export function BnpTeller({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 flex items-start justify-center gap-10 pt-8" style={{ background: '#f1f5f9' }}>
            <Kolonne
                tittel="Teller i BNP"
                under={beat >= 1 ? 'betalt, eller drevet av det offentlige' : 'noen betaler for det'}
                farge="#0d9488"
                ting={TING.filter((t) => t.teller)}
                beat={beat}
            />
            <Kolonne tittel="Teller ikke" under="ingen betaler, eller det skjules" farge="#dc2626" ting={TING.filter((t) => !t.teller)} beat={beat} />
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.3 }}
                    style={{ top: '32%' }}
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 px-10 py-6 rounded-3xl bg-white shadow-2xl border-4 border-orange-500"
                >
                    <Flame size={90} className="text-orange-500" />
                    <div className="text-4xl font-black text-slate-900">En husbrann?</div>
                    <div className="text-7xl font-black text-orange-500">?</div>
                </motion.div>
            )}
        </div>
    );
}
