import { AnimatePresence, motion } from 'framer-motion';
import type { EttersoktHud } from '../graboks/ettersokt';
import { ETIKETT, KORT } from './stil';

// Ettersøkt-nivået under oppdragslista: tre merker (mistenkt, etterlyst, jaget), hva eleven kan gjøre,
// og hvor lenge til vaktene glemmer ham. Når vakta fører gutten til gjaldkeren, går skjermen i svart
// (`EttersoktSvart`, over hele skjermen).

const NIVAER = ['Mistenkt', 'Etterlyst', 'Jaget'];
const FARGE = ['bg-amber-500', 'bg-orange-600', 'bg-red-600'];

export function Ettersokt({ data }: { data: unknown }) {
    const h = data as EttersoktHud;
    return (
        <>
            {h.niva > 0 && (
                <motion.div
                    key={h.n}
                    initial={{ scale: 1.25, y: -6 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 15 }}
                    className={`w-full px-4 py-2.5 ${KORT} ${h.niva === 3 ? 'ring-4 ring-red-400/70' : ''}`}
                >
                    <div className="flex items-center justify-between">
                        <span className={ETIKETT}>
                            Ettersøkt{h.grunn === 'tyveri' ? ' for tyveri' : ''}
                        </span>
                        <span
                            className={`text-[17px] font-black ${h.niva === 3 ? 'text-red-700' : h.niva === 2 ? 'text-orange-700' : 'text-amber-700'}`}
                        >
                            {h.navn}
                        </span>
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                        {NIVAER.map((n, i) => (
                            <div key={n} className="flex-1">
                                <div
                                    className={`h-2.5 rounded-full ${i < h.niva ? FARGE[i] : 'bg-[#e2d2b0]'} ${i === h.niva - 1 ? 'animate-pulse' : ''}`}
                                />
                                <div
                                    className={`mt-0.5 text-center text-[13px] ${i < h.niva ? 'font-bold text-[#2b1d10]' : 'text-[#7a6650]'}`}
                                >
                                    {n}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 text-[15px] font-semibold leading-snug text-[#2b1d10]">
                        {h.tips}
                    </div>
                    <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e2d2b0]"
                        title="Til vaktene glemmer deg"
                    >
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                            style={{ width: `${h.glemmer * 100}%` }}
                        />
                    </div>
                </motion.div>
            )}
        </>
    );
}

export function EttersoktSvart({ data }: { data: unknown }) {
    const h = data as EttersoktHud;
    return (
        <AnimatePresence>
            {h.svart > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: h.svart }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1200] flex items-center justify-center bg-black"
                >
                    <p className="max-w-xl px-6 text-center text-[20px] font-semibold leading-snug text-white">
                        {h.svartTekst}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
