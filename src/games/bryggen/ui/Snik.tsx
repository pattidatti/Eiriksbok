import { motion } from 'framer-motion';
import type { BudetHud } from '../graboks/holmenvakt';
import { ETIKETT, KORT } from './stil';

// Snikingen ved vaktbua: er du skjult, ser noen deg, eller er du sett? Måleren er den vakta som er
// nærmest å se deg. Under står hva du skal gjøre (vaktskiftet, vaktsonen).

const STATUS = {
    skjult: { tekst: 'Skjult', farge: 'text-emerald-700', bar: 'bg-emerald-500' },
    ser: { tekst: 'Noen ser noe ...', farge: 'text-orange-700', bar: 'bg-orange-500' },
    sett: { tekst: 'Sett!', farge: 'text-red-700', bar: 'bg-red-600' },
} as const;

export function Snik({ data }: { data: unknown }) {
    const h = data as BudetHud;
    const s = STATUS[h.status];
    return (
        <motion.div
            animate={h.status === 'sett' ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className={`w-[min(520px,92vw)] px-4 py-2.5 ${KORT} ${h.status === 'sett' ? 'ring-4 ring-red-400/70' : ''}`}
        >
            <div className="flex items-center justify-between gap-3">
                <span className={ETIKETT}>Snik</span>
                <span className={`text-[17px] font-black ${s.farge}`}>{s.tekst}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#e2d2b0]">
                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.max(h.status === 'skjult' ? 0 : 6, h.maler * 100)}%` }} />
            </div>
            {h.linjer.map((l) => (
                <div key={l} className="mt-1 text-[15px] leading-snug text-[#2b1d10]">{l}</div>
            ))}
        </motion.div>
    );
}
