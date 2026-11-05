import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Store tall på en flate.
 * - «tvang»: hva tvangen var (abort og sterilisering mot sin vilje), tallene fra 1983 og
 *   hvorfor mange kaller det brudd på menneskerettighetene. Bare ord og tall, ingen mennesker.
 * - «krymper»: 2025: født mot døde, som to stolper, og hvor mye befolkningen krympet.
 */

type Modus = 'tvang' | 'krymper';

/** Tall med én eller to desimaler som teller opp fra null («14,4»). */
function Desimal({
    verdi,
    desimaler,
    forsinkelse = 0,
}: {
    verdi: number;
    desimaler: number;
    forsinkelse?: number;
}) {
    const [vist, setVist] = useState(0);
    useEffect(() => {
        const c = animate(0, verdi, {
            duration: 1.4,
            delay: forsinkelse,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: setVist,
        });
        return () => c.stop();
    }, [verdi, forsinkelse]);
    return <>{vist.toFixed(desimaler).replace('.', ',')}</>;
}

function Kort({ tittel, tekst, farge }: { tittel: string; tekst: string; farge: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 22 }}
            className="rounded-3xl bg-white shadow-2xl px-10 py-7"
            style={{ width: 720, borderLeft: `14px solid ${farge}` }}
        >
            <div className="font-display font-black text-slate-900" style={{ fontSize: 46 }}>
                {tittel}
            </div>
            <div className="font-semibold text-slate-600 mt-2" style={{ fontSize: 28 }}>
                {tekst}
            </div>
        </motion.div>
    );
}

function Tvang({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="ord"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-display font-black text-red-200"
                        style={{ fontSize: 150 }}
                    >
                        Tvang
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div key="abort" exit={{ opacity: 0 }}>
                        <Kort
                            tittel="Tvangsabort"
                            tekst="Mange kvinner ble tvunget til å avbryte svangerskapet"
                            farge="#b91c1c"
                        />
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div key="steril" exit={{ opacity: 0 }}>
                        <Kort
                            tittel="Sterilisering mot sin vilje"
                            tekst="En operasjon som gjør at en person ikke kan få flere barn"
                            farge="#7f1d1d"
                        />
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="tall"
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-display font-black text-white"
                            style={{ fontSize: 64 }}
                        >
                            1983, året tvangen var verst
                        </motion.div>
                        <div className="flex gap-8">
                            {[
                                { verdi: 14.4, etikett: 'aborter', d: 0.4 },
                                { verdi: 20.7, etikett: 'steriliseringer', d: 1.2 },
                            ].map((t) => (
                                <motion.div
                                    key={t.etikett}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: t.d }}
                                    className="rounded-3xl bg-white shadow-2xl px-8 py-5 text-center"
                                    style={{ minWidth: 340 }}
                                >
                                    <div
                                        className="font-black tabular-nums text-red-700"
                                        style={{ fontSize: 76 }}
                                    >
                                        <Desimal verdi={t.verdi} desimaler={1} forsinkelse={t.d} />
                                    </div>
                                    <div
                                        className="font-bold text-slate-600"
                                        style={{ fontSize: 30 }}
                                    >
                                        millioner {t.etikett}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="rettigheter"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                        style={{ width: 820 }}
                    >
                        <div className="font-bold text-red-200" style={{ fontSize: 34 }}>
                            Mange mener at politikken brøt med
                        </div>
                        <div
                            className="font-display font-black text-white mt-3"
                            style={{ fontSize: 64, lineHeight: 1.1 }}
                        >
                            grunnleggende menneskerettigheter
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const STOLPE_MAKS = 470;
const ETIKETT = 150;
const VENSTRE = 50;
const FODT = 7.92;
const DODE = 11.31;

function Stolpe({
    verdi,
    etikett,
    farge,
    forsinkelse = 0,
}: {
    verdi: number;
    etikett: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <div className="flex items-center" style={{ height: 110 }}>
            <div
                className="text-right font-bold text-slate-700"
                style={{ width: ETIKETT, fontSize: 34, paddingRight: 24 }}
            >
                {etikett}
            </div>
            <div style={{ width: STOLPE_MAKS }}>
                <motion.div
                    className="rounded-2xl"
                    style={{ height: 90, background: farge }}
                    initial={{ width: 0 }}
                    animate={{ width: (verdi / DODE) * STOLPE_MAKS }}
                    transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeOut' }}
                />
            </div>
            <div
                className="font-black tabular-nums text-slate-900"
                style={{ fontSize: 46, paddingLeft: 24, whiteSpace: 'nowrap' }}
            >
                <Desimal verdi={verdi} desimaler={2} forsinkelse={forsinkelse} /> mill.
            </div>
        </div>
    );
}

function Krymper({ beat }: { beat: number }) {
    const fodtSlutt = VENSTRE + ETIKETT + (FODT / DODE) * STOLPE_MAKS;
    const dodeSlutt = VENSTRE + ETIKETT + STOLPE_MAKS;
    return (
        <div className="absolute inset-0">
            <div className="absolute" style={{ left: VENSTRE, top: 110 }}>
                <Stolpe verdi={FODT} etikett="født" farge="#0d9488" />
                {beat >= 1 && <Stolpe verdi={DODE} etikett="døde" farge="#b91c1c" />}
            </div>
            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div
                        className="absolute rounded-lg"
                        style={{
                            left: fodtSlutt,
                            top: 345,
                            width: dodeSlutt - fodtSlutt,
                            height: 14,
                            background: '#f59e0b',
                        }}
                    />
                    <div
                        className="absolute rounded-2xl bg-white shadow-xl px-5 py-2 font-black text-amber-700"
                        style={{
                            right: 1000 - dodeSlutt,
                            top: 375,
                            fontSize: 40,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        3,39 millioner færre på ett år
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-x-0 flex gap-6 items-center justify-center"
                    style={{ top: 470 }}
                >
                    <div
                        className="rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-500"
                        style={{ fontSize: 32 }}
                    >
                        Før: bare ett barn
                    </div>
                    <div className="font-black text-slate-400" style={{ fontSize: 40 }}>
                        →
                    </div>
                    <div
                        className="rounded-2xl bg-red-700 px-6 py-3 font-bold text-white"
                        style={{ fontSize: 32 }}
                    >
                        Nå: få flere barn
                    </div>
                </motion.div>
            )}
        </div>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    tvang: ['', '', '', '', ''],
    krymper: ['2025: født', '2025: født og døde', 'Befolkningen krymper', 'Staten snur'],
};

export function EttbarnTall({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tvang';
    const tekst = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'tvang' ? '#1c1917' : '#f8fafc' }}
        >
            <Flate>
                {modus === 'tvang' ? <Tvang beat={beat} /> : <Krymper beat={beat} />}
                {tekst && (
                    <div className="absolute inset-x-0 flex justify-center" style={{ top: 26 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tekst}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold shadow-xl"
                                style={{ fontSize: 30 }}
                            >
                                {tekst}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </Flate>
        </div>
    );
}
