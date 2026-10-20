import { AnimatePresence, motion } from 'framer-motion';
import {
    Cat,
    Coins,
    DoorClosed,
    DoorOpen,
    Factory,
    FlaskConical,
    Landmark,
    Lock,
    Rat,
    Shield,
    Store,
    Wheat,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Store, enkle tavler til Deng-filmen.
 * - «katt»: svart katt, hvit katt og musa.
 * - «fire»: de fire moderniseringene.
 * - «navn»: partiet styrer politikken, markedet styrer butikkene.
 * - «frihet»: to dører. Den økonomiske går opp, den politiske er låst.
 */

type Modus = 'katt' | 'fire' | 'navn' | 'frihet';

const OVERSKRIFT: Record<Modus, string[]> = {
    katt: ['«Bare den fanger mus»', 'Fargen: ideologien', 'Musa: resultatet'],
    fire: [
        'De fire moderniseringene',
        'Industri og landbruk',
        'Forsvar og vitenskap',
        'Hent kunnskap og penger fra verden',
    ],
    navn: [
        'Kommunisme + marked = ?',
        'Ikke kapitalisme, sa Deng',
        '1993: sosialistisk markedsøkonomi',
        'To deler av samfunnet, to sjefer',
    ],
    frihet: ['Dengs grense', 'Økonomisk frihet: ja', 'Politisk frihet: aldri'],
};

export function DengTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'katt';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-rose-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap z-10"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 top-[20%] bottom-[6%] flex items-center justify-center px-[5%]">
                {modus === 'katt' && <Katt beat={beat} />}
                {modus === 'fire' && <Fire beat={beat} />}
                {modus === 'navn' && <Navn beat={beat} />}
                {modus === 'frihet' && <Frihet beat={beat} />}
            </div>
        </div>
    );
}

function Inn({
    children,
    vis = true,
    forsinkelse = 0.3,
    className = '',
}: {
    children: React.ReactNode;
    vis?: boolean;
    forsinkelse?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={vis ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{
                delay: vis ? forsinkelse : 0,
                type: 'spring',
                stiffness: 200,
                damping: 22,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function Katt({ beat }: { beat: number }) {
    const dempet = beat >= 2;
    return (
        <div className="w-full flex items-center justify-center gap-16">
            {[
                { farge: '#0f172a', bak: 'bg-slate-300', navn: 'Kommunisme' },
                { farge: '#ffffff', bak: 'bg-slate-700', navn: 'Kapitalisme' },
            ].map((k, i) => (
                <motion.div
                    key={k.navn}
                    animate={{ opacity: dempet ? 0.35 : 1, scale: dempet ? 0.85 : 1 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div
                        className={`w-56 h-56 rounded-full ${k.bak} flex items-center justify-center shadow-xl`}
                    >
                        <Cat className="w-36 h-36" color={k.farge} strokeWidth={2.2} />
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 1 ? 1 : 0 }}
                        transition={{ delay: 0.6 + i * 0.5 }}
                        className="px-4 py-1.5 rounded-xl bg-white shadow text-3xl font-black text-slate-800"
                    >
                        {k.navn}
                    </motion.div>
                </motion.div>
            ))}
            <motion.div
                animate={{ scale: dempet ? 1.25 : 0.9, opacity: beat >= 0 ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="flex flex-col items-center gap-4"
            >
                <div
                    className={`w-44 h-44 rounded-full flex items-center justify-center shadow-xl ${
                        dempet ? 'bg-amber-400' : 'bg-white'
                    }`}
                >
                    <Rat className="w-28 h-28 text-amber-900" strokeWidth={2.2} />
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dempet ? 1 : 0 }}
                    transition={{ delay: 0.6 }}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 text-white shadow text-2xl font-black text-center"
                >
                    mat, jobber, penger
                </motion.div>
            </motion.div>
        </div>
    );
}

function Fire({ beat }: { beat: number }) {
    const mål: { ikon: LucideIcon; navn: string; fra: number; farge: string }[] = [
        { ikon: Factory, navn: 'Industri', fra: 1, farge: 'bg-slate-700' },
        { ikon: Wheat, navn: 'Landbruk', fra: 1, farge: 'bg-amber-600' },
        { ikon: Shield, navn: 'Forsvar', fra: 2, farge: 'bg-emerald-700' },
        { ikon: FlaskConical, navn: 'Vitenskap', fra: 2, farge: 'bg-blue-700' },
    ];
    return (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="flex gap-6">
                {mål.map((m, i) => {
                    const på = beat >= m.fra;
                    const Ikon = m.ikon;
                    return (
                        <motion.div
                            key={m.navn}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: på ? 1 : 0.35,
                                y: 0,
                                scale: beat === m.fra ? 1.06 : 1,
                            }}
                            transition={{ delay: 0.2 + (i % 2) * 0.6, duration: 0.5 }}
                            className={`relative w-52 h-52 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-xl text-white ${
                                på ? m.farge : 'bg-slate-400'
                            }`}
                        >
                            <span className="absolute top-3 left-3 w-12 h-12 rounded-full bg-white text-slate-900 font-black text-2xl flex items-center justify-center shadow">
                                {i + 1}
                            </span>
                            <Ikon className="w-24 h-24" strokeWidth={1.8} />
                            <span className="font-display font-black text-3xl">{m.navn}</span>
                        </motion.div>
                    );
                })}
            </div>
            <Inn vis={beat >= 3} forsinkelse={0.4}>
                <div className="flex items-center gap-5 text-3xl font-black">
                    <span className="px-5 py-2 rounded-2xl bg-white shadow text-slate-700">
                        Verden
                    </span>
                    <span className="text-slate-500">kunnskap og penger</span>
                    <motion.span
                        animate={{ x: beat >= 3 ? [0, 14, 0] : 0 }}
                        transition={{ duration: 1.2, repeat: beat >= 3 ? 2 : 0 }}
                        className="text-red-700 text-5xl"
                    >
                        →
                    </motion.span>
                    <span className="px-5 py-2 rounded-2xl bg-red-700 text-white shadow">Kina</span>
                </div>
            </Inn>
        </div>
    );
}

function Navn({ beat }: { beat: number }) {
    return (
        <div className="w-full flex flex-col items-center gap-8">
            {beat <= 2 ? (
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6 font-display font-black text-6xl">
                        <span className="px-6 py-3 rounded-2xl bg-red-700 text-white shadow-xl">
                            Kommunistparti
                        </span>
                        <span className="text-slate-500">+</span>
                        <span className="px-6 py-3 rounded-2xl bg-teal-600 text-white shadow-xl">
                            marked
                        </span>
                    </div>
                    <div className="relative min-h-[6rem] flex items-center">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 1 ? 1 : 0 }}
                            className="font-display font-black text-6xl text-slate-500"
                        >
                            kapitalisme?
                        </motion.span>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: beat >= 1 ? 1 : 0 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                            className="absolute left-[-4%] right-[-4%] top-1/2 h-3 bg-red-600 origin-left rounded"
                        />
                    </div>
                    <Inn vis={beat >= 2} forsinkelse={0.2} className="flex gap-6 items-stretch">
                        <div className="px-6 py-3 rounded-2xl bg-white shadow-xl">
                            <div className="font-display font-black text-4xl text-red-700">
                                1992
                            </div>
                            <div className="text-2xl font-semibold text-slate-600">
                                lov å eie egne bedrifter
                            </div>
                        </div>
                        <div className="px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-xl">
                            <div className="font-display font-black text-4xl text-amber-300">
                                1993
                            </div>
                            <div className="text-2xl font-semibold">
                                «sosialistisk markedsøkonomi»
                            </div>
                        </div>
                    </Inn>
                </div>
            ) : (
                <div className="flex gap-10 items-stretch">
                    <Inn forsinkelse={0.2}>
                        <div className="w-[26rem] h-full p-6 rounded-3xl bg-red-700 text-white shadow-xl flex flex-col items-center gap-3">
                            <Landmark className="w-20 h-20" />
                            <div className="font-display font-black text-4xl">Partiet</div>
                            <div className="text-2xl font-semibold text-red-100">
                                bestemmer over
                            </div>
                            <div className="font-display font-black text-3xl">politikken</div>
                        </div>
                    </Inn>
                    <Inn forsinkelse={1.2}>
                        <div className="w-[26rem] h-full p-6 rounded-3xl bg-teal-600 text-white shadow-xl flex flex-col items-center gap-3">
                            <div className="flex gap-3">
                                <Store className="w-16 h-16" />
                                <Factory className="w-16 h-16" />
                                <Coins className="w-16 h-16" />
                            </div>
                            <div className="font-display font-black text-4xl">Markedet</div>
                            <div className="text-2xl font-semibold text-teal-50">
                                butikk, fabrikk og bank:
                            </div>
                            <div className="font-display font-black text-3xl">
                                pris og fortjeneste
                            </div>
                        </div>
                    </Inn>
                </div>
            )}
        </div>
    );
}

function Frihet({ beat }: { beat: number }) {
    return (
        <div className="flex gap-16 items-stretch">
            <motion.div
                animate={{ scale: beat === 1 ? 1.05 : 1 }}
                className={`w-[28rem] p-6 rounded-3xl shadow-xl flex flex-col items-center gap-3 ${
                    beat >= 1 ? 'bg-teal-600 text-white' : 'bg-white text-slate-800'
                }`}
            >
                {beat >= 1 ? (
                    <DoorOpen className="w-28 h-28" />
                ) : (
                    <DoorClosed className="w-28 h-28" />
                )}
                <div className="font-display font-black text-4xl">Økonomisk frihet</div>
                <div className="text-2xl font-semibold opacity-90 text-center">
                    kjøpe, selge, tjene penger
                </div>
                <Inn vis={beat >= 1} forsinkelse={0.6}>
                    <span className="px-6 py-1 rounded-xl bg-white text-teal-700 font-display font-black text-5xl">
                        JA
                    </span>
                </Inn>
            </motion.div>
            <motion.div
                animate={{ scale: beat === 2 ? 1.05 : 1 }}
                className={`w-[28rem] p-6 rounded-3xl shadow-xl flex flex-col items-center gap-3 ${
                    beat >= 2 ? 'bg-red-700 text-white' : 'bg-white text-slate-800'
                }`}
            >
                <div className="relative">
                    <DoorClosed className="w-28 h-28" />
                    <motion.div
                        initial={{ opacity: 0, scale: 2 }}
                        animate={{ opacity: beat >= 2 ? 1 : 0, scale: beat >= 2 ? 1 : 2 }}
                        transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 14 }}
                        className="absolute -right-6 -bottom-2 w-14 h-14 rounded-full bg-white flex items-center justify-center"
                    >
                        <Lock className="w-9 h-9 text-red-700" />
                    </motion.div>
                </div>
                <div className="font-display font-black text-4xl">Politisk frihet</div>
                <div className="text-2xl font-semibold opacity-90 text-center">
                    si imot partiet, stemme på andre
                </div>
                <Inn vis={beat >= 2} forsinkelse={0.9}>
                    <span className="px-6 py-1 rounded-xl bg-white text-red-700 font-display font-black text-5xl">
                        ALDRI
                    </span>
                </Inn>
            </motion.div>
        </div>
    );
}
