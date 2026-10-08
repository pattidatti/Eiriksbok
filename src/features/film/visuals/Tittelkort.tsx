import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../types';
import { Teller } from './shared';
import { isPendingImage } from '../../../utils/imageAvailability';

interface Props {
    tittel: string;
    undertittel?: string;
    bilde?: string;
    tall?: { verdi: number; etikett: string; fraBeat: number; tone?: 'rod' | 'gronn' }[];
    sporsmal?: { tekst: string; fraBeat: number };
}

/** Tittel over et bilde som sakte zoomer inn, med tall og spørsmål som dukker opp. */
export function Tittelkort({ beat, playing, props }: VisualProps<Props>) {
    const tall = (props.tall ?? []).filter((t) => beat >= t.fraBeat);
    const visSporsmal = props.sporsmal && beat >= props.sporsmal.fraBeat;
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-900">
            {props.bilde && !isPendingImage(props.bilde) && (
                <motion.img
                    src={props.bilde}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1.02 }}
                    animate={{ scale: playing ? 1.14 : undefined }}
                    transition={{ duration: 30, ease: 'linear' }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                <motion.h1
                    initial={{ opacity: 0, letterSpacing: '0.6em' }}
                    animate={{ opacity: 1, letterSpacing: '0.18em' }}
                    transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white font-black text-6xl md:text-8xl drop-shadow-2xl"
                >
                    {props.tittel}
                </motion.h1>
                {props.undertittel && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: beat >= 1 ? 1 : 0, y: beat >= 1 ? 0 : 10 }}
                        transition={{ duration: 0.8 }}
                        className="mt-3 text-white/90 text-xl md:text-3xl font-semibold"
                    >
                        {props.undertittel}
                    </motion.p>
                )}
                <div className="mt-8 flex gap-5 min-h-[7rem]">
                    {tall.map((t, i) => (
                        <Teller
                            key={t.etikett}
                            verdi={t.verdi}
                            etikett={t.etikett}
                            tone={t.tone}
                            forsinkelse={i * 0.6}
                            prefiks="ca. "
                        />
                    ))}
                </div>
                <AnimatePresence>
                    {visSporsmal && (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 px-6 py-3 rounded-2xl bg-amber-300 text-slate-900 text-2xl md:text-3xl font-black shadow-xl"
                        >
                            {props.sporsmal!.tekst}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
