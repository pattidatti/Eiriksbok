// Sidemenyen i Pengeliv.
//
// Elleve moduler skal få plass på en Chromebook med 768 piksler skjermhøyde.
// Derfor er radene kompakte, og de tre gruppene kan slås sammen når eleven
// vil ha ro rundt det den jobber med. Alt er åpent fra start.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Briefcase,
    ChevronDown,
    CreditCard,
    Hourglass,
    House,
    LayoutDashboard,
    PieChart,
    PiggyBank,
    Receipt,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModulDefinisjon, ModulGruppe, ModulId } from '../types';
import { MODUL_GRUPPER } from '../data/moduler';

// Bare ikonene menyen faktisk bruker importeres, så vi ikke drar inn hele
// lucide-biblioteket i pakka.
const IKONER: Record<string, LucideIcon> = {
    'layout-dashboard': LayoutDashboard,
    receipt: Receipt,
    wallet: Wallet,
    'credit-card': CreditCard,
    'piggy-bank': PiggyBank,
    'pie-chart': PieChart,
    'trending-up': TrendingUp,
    hourglass: Hourglass,
    briefcase: Briefcase,
    house: House,
    users: Users,
};

interface SidemenyProps {
    moduler: ModulDefinisjon[];
    aktiv: ModulId;
    onVelg: (id: ModulId) => void;
    className?: string;
}

export function Sidemeny({ moduler, aktiv, onVelg, className = '' }: SidemenyProps) {
    // Alle grupper er åpne fra start. Her ligger bare de eleven har lukket.
    const [lukkede, setLukkede] = useState<ModulGruppe[]>([]);

    const veksle = (gruppe: ModulGruppe) => {
        setLukkede((forrige) =>
            forrige.includes(gruppe) ? forrige.filter((g) => g !== gruppe) : [...forrige, gruppe]
        );
    };

    return (
        <nav
            aria-label="Moduler i Pengeliv"
            className={`w-full shrink-0 rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm backdrop-blur md:w-52 ${className}`}
        >
            {MODUL_GRUPPER.map((gruppe) => {
                const iGruppen = moduler.filter((m) => m.gruppe === gruppe);
                if (iGruppen.length === 0) return null;
                const apen = !lukkede.includes(gruppe);

                return (
                    <div key={gruppe} className="mb-1 last:mb-0">
                        <button
                            type="button"
                            onClick={() => veksle(gruppe)}
                            aria-expanded={apen}
                            className="flex w-full items-center gap-1 rounded-lg px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400 transition-colors hover:text-slate-600"
                        >
                            <motion.span
                                animate={{ rotate: apen ? 0 : -90 }}
                                transition={{ duration: 0.15 }}
                                className="flex"
                            >
                                <ChevronDown className="h-3 w-3" />
                            </motion.span>
                            <span className="leading-tight">{gruppe}</span>
                        </button>

                        <AnimatePresence initial={false}>
                            {apen && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                >
                                    {iGruppen.map((modul) => {
                                        const Ikon = IKONER[modul.ikon] ?? LayoutDashboard;
                                        const valgt = modul.id === aktiv;
                                        return (
                                            <li key={modul.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => onVelg(modul.id)}
                                                    aria-current={valgt ? 'page' : undefined}
                                                    className={`relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                                                        valgt
                                                            ? 'font-bold text-indigo-700'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {valgt && (
                                                        <motion.span
                                                            layoutId="pengeliv-aktiv-modul"
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 500,
                                                                damping: 40,
                                                            }}
                                                            className="absolute inset-0 -z-10 rounded-lg bg-indigo-50"
                                                        />
                                                    )}
                                                    <Ikon className="h-4 w-4 shrink-0" />
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {modul.navn}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </nav>
    );
}
