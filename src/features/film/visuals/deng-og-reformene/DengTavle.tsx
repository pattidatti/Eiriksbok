import { AnimatePresence, motion } from 'framer-motion';
import {
    Cat,
    Coins,
    DoorClosed,
    DoorOpen,
    EyeOff,
    Factory,
    FlaskConical,
    Hourglass,
    Landmark,
    Lock,
    Rat,
    Shield,
    Store,
    TrendingUp,
    Wheat,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Store, enkle tavler til Deng-filmen.
 * - «katt»: svart katt, hvit katt og musa.
 * - «fire»: de fire moderniseringene.
 * - «bonde»: høsten går til staten, så kan bonden selge en del selv.
 * - «navn»: partiet styrer politikken, markedet styrer butikkene.
 * - «vekst»: hykleri eller det som virker, ni prosent i året, nest størst.
 * - «frihet»: to dører. Den økonomiske går opp, den politiske er låst.
 * - «xi»: Xi Jinping bygger videre på modellen.
 */

type Modus = 'katt' | 'fire' | 'bonde' | 'navn' | 'vekst' | 'frihet' | 'xi';

const OVERSKRIFT: Record<Modus, string[]> = {
    katt: ['«Bare den fanger mus»', 'Fargen: ideologien', 'Musa: resultatet'],
    fire: [
        'De fire moderniseringene',
        'Industri og landbruk',
        'Forsvar og vitenskap',
        'Hent kunnskap og penger fra verden',
    ],
    bonde: ['Før: staten bestemmer', 'Nå: selg en del selv', 'Mer mat, egne penger'],
    navn: [
        'Kommunisme + marked = ?',
        'Ikke kapitalisme, sa Deng',
        '1993: sosialistisk markedsøkonomi',
        'To deler av samfunnet, to sjefer',
    ],
    vekst: ['Hykleri eller det som virker?', 'Vekst siden 1978', 'Verdens nest største økonomi'],
    frihet: ['Dengs grense', 'Økonomisk frihet: ja', 'Politisk frihet: aldri'],
    xi: ['Xi Jinping', 'Dengs modell', 'En hardere utgave', '2018: grensen forsvinner'],
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
                {modus === 'bonde' && <Bonde beat={beat} />}
                {modus === 'navn' && <Navn beat={beat} />}
                {modus === 'vekst' && <Vekst beat={beat} />}
                {modus === 'frihet' && <Frihet beat={beat} />}
                {modus === 'xi' && <Xi beat={beat} />}
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

function Bonde({ beat }: { beat: number }) {
    const selv = beat >= 1;
    const BUNTER = 10;
    const tilBonde = 4;
    return (
        <div className="w-full flex items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
                <div className="w-64 h-48 rounded-3xl bg-red-700 text-white flex flex-col items-center justify-center shadow-xl">
                    <Landmark className="w-20 h-20" />
                    <span className="font-display font-black text-3xl mt-2">Staten</span>
                </div>
                <div className="grid grid-cols-5 gap-2 min-h-[7rem]">
                    {Array.from({ length: BUNTER }, (_, i) => {
                        const tilStaten = !selv || i < BUNTER - tilBonde;
                        return (
                            <motion.div
                                key={i}
                                animate={{ opacity: tilStaten ? 1 : 0, scale: tilStaten ? 1 : 0.4 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                            >
                                <Wheat className="w-12 h-12 text-amber-600" strokeWidth={2.4} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-slate-500">høsten</span>
                <span className="text-6xl font-black text-slate-400">←</span>
                <motion.span
                    animate={{ opacity: selv ? 1 : 0 }}
                    className="text-6xl font-black text-teal-600"
                >
                    →
                </motion.span>
                <motion.span
                    animate={{ opacity: selv ? 1 : 0 }}
                    className="text-2xl font-bold text-teal-700"
                >
                    en del
                </motion.span>
            </div>
            <motion.div
                animate={{ opacity: selv ? 1 : 0.25 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center gap-3"
            >
                <div className="w-64 h-48 rounded-3xl bg-teal-600 text-white flex flex-col items-center justify-center shadow-xl">
                    <Store className="w-20 h-20" />
                    <span className="font-display font-black text-3xl mt-2">Selges selv</span>
                </div>
                <div className="flex gap-2 min-h-[7rem] items-start">
                    {Array.from({ length: tilBonde }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -60 }}
                            animate={{ opacity: selv ? 1 : 0, x: selv ? 0 : -60 }}
                            transition={{ delay: 0.6 + i * 0.15 }}
                        >
                            {beat >= 2 ? (
                                <Coins className="w-12 h-12 text-amber-500" strokeWidth={2.4} />
                            ) : (
                                <Wheat className="w-12 h-12 text-amber-600" strokeWidth={2.4} />
                            )}
                        </motion.div>
                    ))}
                </div>
                <Inn vis={beat >= 2} forsinkelse={0.8}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow text-2xl font-black text-teal-700">
                        <TrendingUp className="w-8 h-8" /> Matproduksjonen steg
                    </div>
                </Inn>
            </motion.div>
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

function Vekst({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <div className="flex gap-8 items-center">
                <Inn forsinkelse={0.3}>
                    <div className="w-[22rem] p-6 rounded-3xl bg-white shadow-xl text-center">
                        <div className="text-2xl font-semibold text-slate-500">Kritikerne</div>
                        <div className="font-display font-black text-5xl text-red-700 mt-2">
                            Hykleri
                        </div>
                        <div className="text-2xl text-slate-600 mt-2">
                            si én ting, gjør noe annet
                        </div>
                    </div>
                </Inn>
                <span className="text-4xl font-black text-slate-400">eller</span>
                <Inn forsinkelse={1.6}>
                    <div className="w-[22rem] p-6 rounded-3xl bg-white shadow-xl text-center">
                        <div className="text-2xl font-semibold text-slate-500">Tilhengerne</div>
                        <div className="font-display font-black text-5xl text-teal-700 mt-2">
                            Det virker
                        </div>
                        <div className="text-2xl text-slate-600 mt-2">det eneste som virket</div>
                    </div>
                </Inn>
            </div>
        );
    }
    if (beat === 1) {
        return (
            <Inn forsinkelse={0.2}>
                <div className="flex flex-col items-center gap-3">
                    <TrendingUp className="w-28 h-28 text-teal-600" />
                    <div className="font-display font-black text-[9rem] leading-none text-slate-900 tabular-nums">
                        over <TelleTall verdi={9} varighet={1.6} forsinkelse={0.5} /> %
                    </div>
                    <div className="text-3xl font-semibold text-slate-600">
                        vekst i året i snitt, siden 1978
                    </div>
                </div>
            </Inn>
        );
    }
    return (
        <div className="flex items-end gap-6">
            {[
                { plass: 2, h: 'h-56', farge: 'bg-red-700', navn: 'Kina' },
                { plass: 1, h: 'h-72', farge: 'bg-slate-300', navn: '' },
                { plass: 3, h: 'h-40', farge: 'bg-slate-300', navn: '' },
            ].map((p, i) => (
                <motion.div
                    key={p.plass}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.3 }}
                    className="flex flex-col items-center gap-3"
                >
                    <span className="font-display font-black text-4xl text-slate-900 min-h-[3rem]">
                        {p.navn}
                    </span>
                    <div
                        className={`w-52 ${p.h} ${p.farge} rounded-t-2xl flex items-start justify-center pt-4 shadow-xl`}
                    >
                        <span
                            className={`font-display font-black text-6xl ${p.plass === 2 ? 'text-white' : 'text-slate-500'}`}
                        >
                            {p.plass}
                        </span>
                    </div>
                </motion.div>
            ))}
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

function Xi({ beat }: { beat: number }) {
    const pilarer = ['Sterk vekst', 'Sterk stat', 'Lite rom for uenighet'];
    const hardere: { ikon: LucideIcon; tekst: string }[] = [
        { ikon: Landmark, tekst: 'Mer makt samlet hos Xi' },
        { ikon: EyeOff, tekst: 'Strengere sensur av internett og medier' },
    ];
    return (
        <div className="w-full flex flex-col items-center gap-6">
            <Inn forsinkelse={0.2}>
                <div className="px-8 py-3 rounded-2xl bg-red-700 text-white shadow-xl text-center">
                    <div className="font-display font-black text-4xl">Xi Jinping</div>
                    <div className="text-2xl font-semibold text-red-100">leder Kina i dag</div>
                </div>
            </Inn>
            {beat === 0 && (
                <Inn forsinkelse={1}>
                    <div className="flex items-center gap-4 text-3xl font-black">
                        <span className="text-slate-500">bygger videre på</span>
                        <span className="px-5 py-2 rounded-2xl bg-white shadow-xl text-slate-900">
                            Dengs modell
                        </span>
                    </div>
                </Inn>
            )}
            {beat === 1 && (
                <div className="flex gap-6">
                    {pilarer.map((p, i) => (
                        <Inn key={p} vis={beat >= 1} forsinkelse={0.3 + i * 0.6}>
                            <div className="w-72 px-5 py-6 rounded-2xl bg-white shadow-xl text-center font-display font-black text-3xl text-slate-800">
                                {p}
                            </div>
                        </Inn>
                    ))}
                </div>
            )}
            {beat === 2 && (
                <div className="flex gap-6">
                    {hardere.map((h, i) => (
                        <Inn key={h.tekst} forsinkelse={0.3 + i * 1.2}>
                            <div className="w-[26rem] px-5 py-5 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-4">
                                <h.ikon className="w-14 h-14 shrink-0 text-red-400" />
                                <span className="font-display font-black text-3xl">{h.tekst}</span>
                            </div>
                        </Inn>
                    ))}
                </div>
            )}
            {beat >= 3 && (
                <Inn forsinkelse={0.3}>
                    <div className="px-8 py-5 rounded-3xl bg-white shadow-xl flex items-center gap-6">
                        <div className="relative">
                            <Hourglass className="w-20 h-20 text-slate-700" />
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="absolute left-[-15%] right-[-15%] top-1/2 h-2.5 bg-red-600 origin-left rotate-[-30deg] rounded"
                            />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-slate-500">
                                Grensen for hvor lenge
                            </div>
                            <div className="font-display font-black text-3xl text-slate-900">
                                en president kan sitte
                            </div>
                            <div className="font-display font-black text-3xl text-red-700">
                                er borte
                            </div>
                        </div>
                    </div>
                </Inn>
            )}
        </div>
    );
}
