import { motion } from 'framer-motion';
import { Factory, Scale, Shield, Store, User, Users, type LucideIcon } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Vest mot øst, side om side. Hver beat fyller ut en ny rad: politikk, økonomi,
 * hva som var viktigst, og militæralliansen.
 */

interface Side {
    tekst: string;
    ikon?: LucideIcon;
    partier?: string[];
}

const RADER: { tema: string; fraBeat: number; vest: Side; ost: Side }[] = [
    {
        tema: 'Partier',
        fraBeat: 1,
        vest: {
            tekst: 'Mange å velge mellom',
            partier: ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#0891b2'],
        },
        ost: { tekst: 'Bare kommunistpartiet', partier: ['#dc2626'] },
    },
    {
        tema: 'Økonomi',
        fraBeat: 2,
        vest: { tekst: 'Kjøp og salg styrer', ikon: Store },
        ost: { tekst: 'Staten eier og bestemmer', ikon: Factory },
    },
    {
        tema: 'Viktigst',
        fraBeat: 3,
        vest: { tekst: 'Frihet for hver enkelt', ikon: User },
        ost: { tekst: 'Likhet', ikon: Scale },
    },
    {
        tema: 'Allianse',
        fraBeat: 4,
        vest: { tekst: 'NATO', ikon: Shield },
        ost: { tekst: 'Warszawapakten', ikon: Shield },
    },
];

export function KaldkrigSystemer({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-100">
            {/* To halvdeler i hver sin farge */}
            <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-50" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-red-50" />
            <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-slate-800"
                style={{ width: 6 }}
            />

            <div className="absolute inset-x-0 flex" style={{ top: 22 }}>
                <Hode farge="#1d4ed8" tittel="VEST" under="USA og allierte" system="Kapitalisme" />
                <Hode
                    farge="#b91c1c"
                    tittel="ØST"
                    under="Sovjetunionen og allierte"
                    system="Kommunisme"
                />
            </div>

            <div className="absolute inset-x-0 flex flex-col" style={{ top: 168, gap: 12 }}>
                {RADER.map((r) => {
                    const vis = beat >= r.fraBeat;
                    const fokus = beat === r.fraBeat;
                    return (
                        <motion.div
                            key={r.tema}
                            className="relative flex"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: vis ? (fokus ? 1 : 0.62) : 0, y: vis ? 0 : 18 }}
                            transition={{ duration: 0.5 }}
                            style={{ height: 80 }}
                        >
                            <Celle side={r.vest} farge="#1d4ed8" />
                            <Celle side={r.ost} farge="#b91c1c" />
                            <div
                                className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full bg-slate-800 text-white font-bold uppercase tracking-wide"
                                style={{ fontSize: 13, padding: '4px 12px' }}
                            >
                                {r.tema}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function Hode({
    farge,
    tittel,
    under,
    system,
}: {
    farge: string;
    tittel: string;
    under: string;
    system: string;
}) {
    return (
        <div className="w-1/2 text-center">
            <div className="font-black" style={{ color: farge, fontSize: 52, lineHeight: 1 }}>
                {tittel}
            </div>
            <div className="font-semibold text-slate-600" style={{ fontSize: 18, marginTop: 4 }}>
                {under}
            </div>
            <div
                className="inline-block font-black text-white rounded-xl shadow"
                style={{ background: farge, fontSize: 24, padding: '4px 18px', marginTop: 8 }}
            >
                {system}
            </div>
        </div>
    );
}

function Celle({ side, farge }: { side: Side; farge: string }) {
    const Ikon = side.ikon;
    return (
        <div
            className="w-1/2 flex items-center justify-center"
            style={{ gap: 16, padding: '0 70px' }}
        >
            <div
                className="flex items-center justify-center rounded-2xl bg-white shadow"
                style={{ width: 64, height: 64, flexShrink: 0 }}
            >
                {side.partier ? (
                    side.partier.length > 1 ? (
                        <div
                            className="flex flex-wrap justify-center"
                            style={{ gap: 4, width: 50 }}
                        >
                            {side.partier.map((f, i) => (
                                <div
                                    key={i}
                                    className="rounded-full"
                                    style={{ width: 13, height: 13, background: f }}
                                />
                            ))}
                        </div>
                    ) : (
                        <Users size={36} color={side.partier[0]} strokeWidth={2.4} />
                    )
                ) : (
                    Ikon && <Ikon size={36} color={farge} strokeWidth={2.4} />
                )}
            </div>
            <div
                className="font-bold text-slate-900"
                style={{ fontSize: 26, lineHeight: 1.15, width: 300 }}
            >
                {side.tekst}
            </div>
        </div>
    );
}
