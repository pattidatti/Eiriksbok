import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    Building2,
    Church,
    Crown,
    Factory,
    GraduationCap,
    Landmark,
    Scale,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * En tidslinje med tre stasjoner som tennes én for én, og en banner nederst som
 * forklarer beaten. Brukes for loven, betongen og pavens tittel.
 */

const IKONER: Record<string, LucideIcon> = {
    bok: BookOpen,
    skole: GraduationCap,
    vekt: Scale,
    kuppel: Landmark,
    fabrikk: Factory,
    by: Building2,
    krone: Crown,
    kirke: Church,
};

interface Punkt {
    tid: string;
    tittel: string;
    tekst?: string;
    ikon: string;
    fraBeat: number;
}

interface Props {
    tittel: string;
    farge?: string;
    punkter: Punkt[];
    merknader?: { fraBeat: number; tekst: string }[];
}

export function ArvenTidslinje({ beat, props }: VisualProps<Props>) {
    const farge = props.farge ?? '#7c2d12';
    const synlige = props.punkter.filter((p) => beat >= p.fraBeat);
    const nyeste = synlige[synlige.length - 1];
    const merknad = props.merknader?.find((m) => m.fraBeat === beat);
    const andel = props.punkter.length > 1 ? (synlige.length - 1) / (props.punkter.length - 1) : 1;

    return (
        <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(180deg, #faf6ee 0%, #efe6d4 100%)' }}
        >
            <div
                className="absolute px-8 py-3 rounded-2xl text-white font-display font-black text-4xl shadow-xl"
                style={{ background: farge, top: '6%' }}
            >
                {props.tittel}
            </div>

            <div className="relative w-[90%]" style={{ height: 330, marginTop: 20 }}>
                {/* Linja og fremdriften langs den */}
                <div className="absolute left-[8%] right-[8%] h-3 rounded-full bg-stone-300" style={{ top: 72 }} />
                <motion.div
                    className="absolute left-[8%] h-3 rounded-full"
                    style={{ top: 72, background: farge }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, andel) * 84}%` }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 grid grid-cols-3">
                    {props.punkter.map((p) => {
                        const vis = beat >= p.fraBeat;
                        const fokus = p === nyeste;
                        const Ikon = IKONER[p.ikon] ?? BookOpen;
                        return (
                            <div key={p.tittel} className="flex flex-col items-center">
                                <motion.div
                                    className="rounded-full flex items-center justify-center border-[6px] shadow-lg"
                                    style={{ width: 156, height: 156, borderColor: farge }}
                                    initial={false}
                                    animate={{
                                        backgroundColor: vis ? farge : '#e7e5e4',
                                        scale: fokus ? 1.12 : 1,
                                        opacity: vis ? 1 : 0.5,
                                    }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Ikon size={74} color={vis ? '#ffffff' : '#a8a29e'} strokeWidth={2.2} />
                                </motion.div>
                                <motion.div
                                    className="mt-4 text-center"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: vis ? (fokus ? 1 : 0.65) : 0, y: vis ? 0 : 14 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="text-3xl font-black tabular-nums" style={{ color: farge }}>
                                        {p.tid}
                                    </div>
                                    <div
                                        className="text-3xl font-bold text-slate-900 leading-tight mt-1 mx-auto"
                                        style={{ maxWidth: 330 }}
                                    >
                                        {p.tittel}
                                    </div>
                                    {p.tekst && (
                                        <div
                                            className="text-xl font-semibold text-slate-600 leading-snug mt-1 mx-auto"
                                            style={{ maxWidth: 320 }}
                                        >
                                            {p.tekst}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '6%' }}>
                <AnimatePresence mode="wait">
                    {merknad && (
                        <motion.div
                            key={merknad.tekst}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-7 py-3 rounded-2xl bg-slate-900 text-white text-2xl font-bold shadow-xl"
                        >
                            {merknad.tekst}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
