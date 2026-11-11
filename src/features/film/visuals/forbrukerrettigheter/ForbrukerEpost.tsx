import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Clock, Paperclip, Receipt, Send, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Klagen som skrives, felt for felt: mottaker, tidspunkt (bevis), kvitteringen som vedlegg,
 * feilen og kravet, regelen, og til slutt en voksen på kopi.
 */

const OVERSKRIFT = [
    'Klag til butikken',
    'Skriftlig: bevis på hva og når',
    'Kvitteringen',
    'Feilen, og hva du vil ha',
    'Si hvilken regel du bruker',
    'Under 18? En voksen kan hjelpe',
];

function Felt({
    etikett,
    children,
    vist,
}: {
    etikett: string;
    children: ReactNode;
    vist: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: vist ? 1 : 0, x: vist ? 0 : -12 }}
            className="flex items-center gap-3 border-b border-slate-200 py-2"
        >
            <span className="text-xl font-bold text-slate-400 shrink-0" style={{ width: 70 }}>
                {etikett}
            </span>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
                {children}
            </div>
        </motion.div>
    );
}

export function ForbrukerEpost({ beat }: VisualProps) {
    const tittel = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    return (
        <Flate bakgrunn="#e0f2fe">
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tittel}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-4xl font-black text-slate-900 font-display"
                    >
                        {tittel}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div
                className="absolute rounded-2xl bg-white shadow-2xl overflow-hidden"
                style={{ left: 130, top: 92, width: 740, height: 450 }}
            >
                <div className="flex items-center justify-between bg-slate-800 text-white px-5 py-2">
                    <span className="text-xl font-bold">Ny e-post</span>
                    <span className="flex items-center gap-2 text-lg font-bold">
                        <Send size={22} /> Send
                    </span>
                </div>
                <div className="px-5">
                    <Felt etikett="Til" vist>
                        Butikken der du kjøpte varen
                    </Felt>
                    {beat >= 5 && (
                        <Felt etikett="Kopi" vist>
                            <Users size={26} className="text-teal-600" /> En voksen
                        </Felt>
                    )}
                    <Felt etikett="Emne" vist>
                        Reklamasjon
                    </Felt>
                    <Felt etikett="" vist={beat >= 1}>
                        <Clock size={26} className="text-blue-600" />
                        <span className="text-blue-700">Datoen lagres</span>
                    </Felt>
                    <Felt etikett="" vist={beat >= 2}>
                        <Paperclip size={26} className="text-slate-500" />
                        <Receipt size={26} className="text-amber-600" />
                        Kvitteringen
                        <span className="flex items-center gap-1 text-lg text-slate-500">
                            (<Camera size={20} /> et bilde holder)
                        </span>
                    </Felt>
                    <motion.div
                        animate={{ opacity: beat >= 3 ? 1 : 0 }}
                        className="pt-3 text-2xl text-slate-800 leading-snug"
                    >
                        Mobilen min slutter å lade. Jeg vil ha den reparert eller få en ny.
                    </motion.div>
                    <motion.div
                        animate={{ opacity: beat >= 4 ? 1 : 0 }}
                        className="mt-3 inline-block rounded-lg px-2 py-1 text-2xl font-bold text-teal-800"
                        style={{ background: beat >= 4 ? '#ccfbf1' : 'transparent' }}
                    >
                        Jeg reklamerer etter forbrukerkjøpsloven.
                    </motion.div>
                </div>
            </div>
        </Flate>
    );
}
