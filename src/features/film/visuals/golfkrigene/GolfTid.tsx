import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Krigen i 1991 i tid: bakkekrigen (100 timer) som en kort stolpe, så luftkrigen (38 dager)
 * som en lang stolpe med ett merke per dag. Til slutt tallene for koalisjonen.
 */

const DAGER = 38;
/** Bredden i prosent: luftkrigen fyller nesten hele raden, bakkekrigen i riktig forhold. */
const LUFT_BREDDE = 92;
const BAKKE_BREDDE = (LUFT_BREDDE * 100) / (DAGER * 24);

export function GolfTid({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-slate-900 text-white px-[6%] pt-[7%] flex flex-col gap-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-display font-black text-center"
            >
                {beat === 0 ? 'Kuwait er fritt' : beat === 1 ? 'Luft mot bakke' : 'Koalisjonen'}
            </motion.div>

            {beat <= 1 && (
                <div className="flex flex-col gap-10 mt-6">
                    {beat >= 1 && (
                        <Stolpe
                            etikett="Luftkrigen: 38 dager"
                            bredde={LUFT_BREDDE}
                            farge="#f97316"
                            dager
                        />
                    )}
                    <Stolpe
                        etikett="Bakkekrigen: 100 timer"
                        bredde={BAKKE_BREDDE}
                        farge="#38bdf8"
                    />
                    {beat === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 1.6, rotate: -6 }}
                            animate={{ opacity: 1, scale: 1, rotate: -4 }}
                            transition={{ delay: 1.6, type: 'spring', stiffness: 220, damping: 16 }}
                            className="self-center mt-8 px-8 py-3 border-[6px] border-teal-400 text-teal-300 rounded-2xl text-5xl font-black tracking-wider"
                        >
                            VÅPENHVILE
                        </motion.div>
                    )}
                </div>
            )}

            {beat >= 2 && (
                <div className="flex justify-center gap-6 mt-16 text-slate-900">
                    <Teller verdi={700000} etikett="soldater" prefiks="ca. " />
                    <Teller verdi={2000} etikett="fly" forsinkelse={0.8} />
                    <Teller
                        verdi={300}
                        etikett="soldater mistet"
                        prefiks="under "
                        forsinkelse={1.6}
                        tone="rod"
                    />
                </div>
            )}
        </div>
    );
}

function Stolpe({
    etikett,
    bredde,
    farge,
    dager,
}: {
    etikett: string;
    bredde: number;
    farge: string;
    dager?: boolean;
}) {
    return (
        <div>
            <div className="text-2xl font-bold mb-2" style={{ color: farge }}>
                {etikett}
            </div>
            <div className="relative h-16 w-full rounded-lg bg-slate-800">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-lg"
                    style={{ background: farge }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${bredde}%` }}
                    transition={{ duration: dager ? 2.6 : 1.2, ease: 'easeOut', delay: 0.3 }}
                />
                {dager && (
                    <div className="absolute inset-y-0 left-0 flex" style={{ width: `${bredde}%` }}>
                        {Array.from({ length: DAGER }, (_, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 border-r-2 border-slate-900/50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + (i / DAGER) * 2.6 }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
