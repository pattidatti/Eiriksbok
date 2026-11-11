import { AnimatePresence, motion } from 'framer-motion';
import { DoorOpen, Laptop, Mail, Package, PackageOpen, Shirt, Stamp, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Angreretten. To moduser:
 * - nett: pakken, hvor angreretten gjelder (nett, døra), 14 dager i kalenderen, beskjeden,
 *   og 14 nye dager butikken har på å betale tilbake.
 * - unntak: porto, genseren med navn, den forseglede pakken og den vanlige butikken.
 */

type Modus = 'nett' | 'unntak';

const OVERSKRIFT: Record<Modus, string[]> = {
    nett: [
        'Ombestemt deg?',
        'Når gjelder angreretten?',
        '14 dager, ingen grunn',
        'Si klart fra',
        'Pengene tilbake',
    ],
    unntak: [
        'Porto tilbake',
        'Unntak: laget for deg',
        'Unntak: forseglet pakke',
        'Åpnet? Helse og hygiene',
        'Vanlig butikk',
        'Bytte i butikken?',
    ],
};

const DAGER = 14;

function Rute({ fylt, farge, forsinkelse }: { fylt: boolean; farge: string; forsinkelse: number }) {
    return (
        <motion.div
            className="rounded-md border-2"
            style={{ width: 38, height: 38, borderColor: farge }}
            initial={{ backgroundColor: '#ffffff' }}
            animate={{ backgroundColor: fylt ? farge : '#ffffff' }}
            transition={{ delay: forsinkelse, duration: 0.2 }}
        />
    );
}

function Nett({ beat }: { beat: number }) {
    // Beskjeden sendes en dag midt i fristen. Dagen er bare et eksempel og står ikke som tall.
    const beskjed = 9;
    return (
        <>
            {/* Venstre: pakken og hvor angreretten gjelder */}
            <div
                className="absolute flex flex-col items-center gap-4"
                style={{ left: 40, top: 110, width: 250 }}
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl bg-amber-100 border-4 border-amber-500 p-4"
                >
                    <Package size={beat >= 1 ? 64 : 110} className="text-amber-700" />
                </motion.div>
                {beat === 0 && (
                    <div className="text-2xl font-bold text-slate-700 text-center">
                        Varen er helt fin
                    </div>
                )}
                {beat >= 1 && (
                    <>
                        <Kanal ikon={<Laptop size={40} />} tekst="Kjøpt på nett" />
                        <Kanal
                            ikon={<DoorOpen size={40} />}
                            tekst="Solgt på døra"
                            forsinkelse={0.4}
                        />
                    </>
                )}
            </div>
            {/* Høyre: kalenderen */}
            {beat >= 2 && (
                <div className="absolute" style={{ left: 330, top: 130, width: 640 }}>
                    <div className="text-2xl font-bold text-teal-700 mb-2">
                        Angrefrist: 14 dager
                    </div>
                    <div className="flex gap-1.5">
                        {Array.from({ length: DAGER }, (_, i) => (
                            <Rute
                                key={i}
                                fylt={i < (beat >= 3 ? beskjed + 1 : DAGER)}
                                farge="#0d9488"
                                forsinkelse={i * 0.06}
                            />
                        ))}
                    </div>
                    <div
                        className="flex justify-between text-lg font-semibold text-slate-600 mt-1"
                        style={{ width: 610 }}
                    >
                        <span>Du får varen</span>
                        <span>Fristen er ute</span>
                    </div>
                    {beat >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 mt-3 rounded-xl bg-white shadow-lg border-2 border-blue-500 px-3 py-2"
                            style={{ marginLeft: beskjed * 44 - 106, width: 340 }}
                        >
                            <Mail size={32} className="text-blue-600" />
                            <span className="text-xl font-bold text-blue-700">
                                Angreskjema eller e-post
                            </span>
                        </motion.div>
                    )}
                    {beat >= 4 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-5"
                        >
                            <div className="text-2xl font-bold text-amber-700 mb-2">
                                Butikken betaler tilbake
                            </div>
                            <div className="flex gap-1.5">
                                {Array.from({ length: DAGER }, (_, i) => (
                                    <Rute
                                        key={i}
                                        fylt
                                        farge="#d97706"
                                        forsinkelse={0.2 + i * 0.06}
                                    />
                                ))}
                            </div>
                            <div
                                className="flex justify-between text-lg font-semibold text-slate-600 mt-1"
                                style={{ width: 610 }}
                            >
                                <span>Beskjeden kommer</span>
                                <span>Senest her</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </>
    );
}

function Kanal({
    ikon,
    tekst,
    forsinkelse = 0,
}: {
    ikon: ReactNode;
    tekst: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse }}
            className="flex items-center gap-3 rounded-2xl bg-white shadow-lg border-2 border-teal-500 px-4 py-2 w-full"
        >
            <span className="text-teal-700">{ikon}</span>
            <span className="text-2xl font-bold text-slate-800">{tekst}</span>
        </motion.div>
    );
}

function Unntakskort({
    ikon,
    tittel,
    tekst,
    nei,
    merknad,
}: {
    ikon: ReactNode;
    tittel: string;
    tekst: string;
    nei: boolean;
    merknad?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white shadow-xl border-2 border-slate-200 p-4 flex gap-4 items-start"
            style={{ width: 440, minHeight: 170 }}
        >
            <span className="text-slate-700 shrink-0">{ikon}</span>
            <div className="flex-1">
                <div className="text-2xl font-black text-slate-900">{tittel}</div>
                <div className="text-xl font-semibold text-slate-600 mt-1">{tekst}</div>
                {merknad && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-bold text-amber-700 mt-2"
                    >
                        {merknad}
                    </motion.div>
                )}
            </div>
            {nei && <span className="text-5xl font-black text-red-600 shrink-0">✗</span>}
        </motion.div>
    );
}

function Unntak({ beat }: { beat: number }) {
    return (
        <div className="absolute grid grid-cols-2 gap-6" style={{ left: 50, top: 110, width: 910 }}>
            <Unntakskort
                ikon={<Stamp size={56} />}
                tittel="Porto tilbake"
                tekst="Du betaler som regel selv"
                nei={false}
                merknad="Ikke hvis butikken lovet å betale, eller ikke sa noe"
            />
            {beat >= 1 ? (
                <Unntakskort
                    ikon={<Shirt size={56} />}
                    tittel="Genser med navnet ditt"
                    tekst="Laget spesielt for deg"
                    nei
                />
            ) : (
                <div />
            )}
            {beat >= 2 ? (
                <Unntakskort
                    ikon={beat >= 3 ? <PackageOpen size={56} /> : <Package size={56} />}
                    tittel="Forseglet pakke"
                    tekst={
                        beat >= 3
                            ? 'Åpnet, og kan ikke selges igjen av hensyn til helse og hygiene'
                            : 'Du ser om den er åpnet'
                    }
                    nei={beat >= 3}
                />
            ) : (
                <div />
            )}
            {beat >= 4 && (
                <Unntakskort
                    ikon={<Store size={56} />}
                    tittel="Vanlig butikk i sentrum"
                    tekst="Ingen angrerett etter loven"
                    nei
                    merknad={beat >= 5 ? 'Bytte? Bare et frivillig tilbud' : undefined}
                />
            )}
        </div>
    );
}

export function ForbrukerAngre({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'nett';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate bakgrunn="#f8fafc">
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 28 }}>
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
            {modus === 'nett' ? <Nett beat={beat} /> : <Unntak beat={beat} />}
        </Flate>
    );
}
