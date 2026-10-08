import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../types';
import { TelleTall } from './shared';

interface Rad {
    etikett: string;
    reddet: number;
    totalt: number;
    fraBeat: number;
    farge: string;
}

interface Props {
    tittel: string;
    kilde?: string;
    rader: Rad[];
    sammenlign?: {
        fraBeat: number;
        venstre: Omit<Rad, 'fraBeat'>;
        hoyre: Omit<Rad, 'fraBeat'>;
    };
}

/** Andel reddet per gruppe som liggende stolper, og til slutt to grupper side om side. */
export function Andeler({ beat, props }: VisualProps<Props>) {
    const sammenlign =
        props.sammenlign && beat >= props.sammenlign.fraBeat ? props.sammenlign : null;
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col px-[7%] py-[5%]">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center">
                {sammenlign ? 'Kvinner og barn først' : props.tittel}
            </h2>
            <AnimatePresence mode="wait">
                {sammenlign ? (
                    <motion.div
                        key="sammenlign"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center gap-[8%]"
                    >
                        <Ring rad={sammenlign.venstre} />
                        <div className="text-4xl font-black text-slate-400">mot</div>
                        <Ring rad={sammenlign.hoyre} forsinkelse={1} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="stolper"
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col justify-center gap-[3.5%]"
                    >
                        {props.rader.map((r) => {
                            const vis = beat >= r.fraBeat;
                            const andel = r.reddet / r.totalt;
                            return (
                                <motion.div
                                    key={r.etikett}
                                    animate={{
                                        opacity: vis ? (beat === r.fraBeat ? 1 : 0.8) : 0.15,
                                    }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-[16%] text-right text-xl md:text-3xl font-black text-slate-800">
                                        {r.etikett}
                                    </div>
                                    <div className="flex-1 h-12 md:h-16 rounded-xl bg-slate-200 relative overflow-hidden">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-xl"
                                            style={{ background: r.farge }}
                                            initial={{ width: 0 }}
                                            animate={{ width: vis ? `${andel * 100}%` : 0 }}
                                            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                                        />
                                    </div>
                                    <div className="w-[24%] text-xl md:text-3xl font-black tabular-nums text-slate-900">
                                        {vis ? (
                                            <>
                                                <TelleTall verdi={Math.round(andel * 100)} />
                                                {' %'}
                                                <span className="block text-sm md:text-lg font-semibold text-slate-500">
                                                    {r.reddet} av {r.totalt}
                                                </span>
                                            </>
                                        ) : null}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            {props.kilde && (
                <div className="text-right text-sm text-slate-500">Kilde: {props.kilde}</div>
            )}
        </div>
    );
}

function Ring({ rad, forsinkelse = 0 }: { rad: Omit<Rad, 'fraBeat'>; forsinkelse?: number }) {
    const andel = rad.reddet / rad.totalt;
    const R = 120;
    const omkrets = 2 * Math.PI * R;
    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 300 300" className="w-[min(30vw,40vh)]">
                <circle cx={150} cy={150} r={R} fill="none" stroke="#e2e8f0" strokeWidth={36} />
                <motion.circle
                    cx={150}
                    cy={150}
                    r={R}
                    fill="none"
                    stroke={rad.farge}
                    strokeWidth={36}
                    strokeLinecap="round"
                    transform="rotate(-90 150 150)"
                    strokeDasharray={omkrets}
                    initial={{ strokeDashoffset: omkrets }}
                    animate={{ strokeDashoffset: omkrets * (1 - andel) }}
                    transition={{ duration: 2, delay: forsinkelse, ease: [0.16, 1, 0.3, 1] }}
                />
                <text
                    x={150}
                    y={168}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    {Math.round(andel * 100)} %
                </text>
            </svg>
            <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{rad.etikett}</div>
            <div className="text-lg md:text-xl font-semibold text-slate-500">
                {rad.reddet} av {rad.totalt} overlevde
            </div>
        </div>
    );
}
