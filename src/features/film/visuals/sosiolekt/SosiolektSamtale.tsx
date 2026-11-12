import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Samtaler. «tilpasning»: du snakker litt ulikt etter hvem du er sammen med, vist som en
 * glidebryter fra avslappet til finere. «kode»: kodeveksling midt i en setning. «signal»:
 * den som hører deg, legger merke til små trekk, og språket endrer seg over tid.
 * Plassene på glidebryteren er en skisse, ikke målt.
 */

type Modus = 'tilpasning' | 'kode' | 'signal';

const LILLA = '#6d28d9';
const BLA = '#1d4ed8';
const ORANSJE = '#c2410c';

const TITLER: Record<Modus, string[]> = {
    tilpasning: [
        'Sosiolekten handler om deg',
        'Med bestevennen',
        'Med lærer, på jobbintervju',
        'Hjemme og på jobb',
        'Språktilpasning',
    ],
    kode: ['Midt i en samtale', 'Et engelsk uttrykk', 'Kodeveksling', 'Du velger signalet'],
    signal: ['Sosiolekten forsvinner ikke', 'Folk legger merke til det', 'Språket endrer seg'],
};

export function SosiolektSamtale({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tilpasning';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <Flate bakgrunn="#f5f3ff">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 18 }}
                >
                    <div className="px-5 py-1.5 rounded-2xl bg-white text-slate-900 font-display font-black text-3xl shadow-lg whitespace-nowrap">
                        {tittel}
                    </div>
                </motion.div>
            </AnimatePresence>
            {modus === 'tilpasning' && <Tilpasning beat={beat} />}
            {modus === 'kode' && <Kode beat={beat} />}
            {modus === 'signal' && <Signal beat={beat} />}
        </Flate>
    );
}

function Du({ x, y, d = 120 }: { x: number; y: number; d?: number }) {
    return (
        <div
            className="absolute rounded-full flex items-center justify-center text-white font-display font-black shadow-xl"
            style={{
                left: x - d / 2,
                top: y - d / 2,
                width: d,
                height: d,
                background: LILLA,
                fontSize: d * 0.32,
            }}
        >
            Du
        </div>
    );
}

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}

/* ---------- tilpasning ---------- */

interface Situasjon {
    navn: string;
    x: number;
    y: number;
    farge: string;
    /** Plass på glidebryteren, 0 = avslappet, 1 = finere. */
    plass: number;
    beat: number;
}

const SITUASJONER: Situasjon[] = [
    { navn: 'Med bestevennen', x: 60, y: 110, farge: '#0d9488', plass: 0.12, beat: 1 },
    { navn: 'Hjemme i sofaen', x: 60, y: 230, farge: '#65a30d', plass: 0.22, beat: 3 },
    { navn: 'Med en lærer', x: 700, y: 110, farge: BLA, plass: 0.68, beat: 2 },
    { navn: 'På jobbintervju', x: 700, y: 230, farge: '#9333ea', plass: 0.88, beat: 2 },
    { navn: 'På jobb', x: 700, y: 350, farge: '#be123c', plass: 0.62, beat: 3 },
];

const BRYTER_X = 220;
const BRYTER_B = 560;

function Tilpasning({ beat }: { beat: number }) {
    return (
        <>
            <Du x={500} y={beat === 0 ? 280 : 230} d={beat === 0 ? 170 : 130} />
            {SITUASJONER.map((s) => {
                if (beat < s.beat) return null;
                const dempet = beat === 3 && s.beat !== 3;
                return (
                    <motion.div
                        key={s.navn}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: dempet ? 0.4 : 1, scale: 1 }}
                        className="absolute rounded-2xl bg-white shadow-lg px-4 py-3 text-2xl font-black whitespace-nowrap"
                        style={{
                            left: s.x,
                            top: s.y,
                            width: 240,
                            borderLeft: `10px solid ${s.farge}`,
                            color: s.farge,
                        }}
                    >
                        {s.navn}
                    </motion.div>
                );
            })}
            {beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute"
                    style={{ left: BRYTER_X, top: 450, width: BRYTER_B }}
                >
                    <div
                        className="h-4 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #99f6e4, #c4b5fd, #fda4af)' }}
                    />
                    <div className="flex justify-between mt-2 text-xl font-black text-slate-700">
                        <span>Avslappet</span>
                        <span>Finere</span>
                    </div>
                    {SITUASJONER.filter((s) => beat >= s.beat).map((s) => (
                        <motion.div
                            key={s.navn}
                            initial={{ left: BRYTER_B / 2 - 14, opacity: 0 }}
                            animate={{
                                left: s.plass * BRYTER_B - 14,
                                opacity: beat === 3 && s.beat !== 3 ? 0.35 : 1,
                            }}
                            transition={{ duration: 0.9 }}
                            className="absolute rounded-full border-4 border-white shadow"
                            style={{ top: -6, width: 28, height: 28, background: s.farge }}
                        />
                    ))}
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute rounded-2xl text-white px-5 py-2 text-center"
                    style={{ left: 275, top: 330, width: 410, background: LILLA }}
                >
                    <div className="text-xl font-bold leading-tight">
                        Du endrer talemålet etter hvem du er med, og hvor du er
                    </div>
                </motion.div>
            )}
        </>
    );
}

/* ---------- kode ---------- */

function Boble({
    side,
    children,
    farge = '#ffffff',
}: {
    side: 'v' | 'h';
    children: ReactNode;
    farge?: string;
}) {
    return (
        <div className={`flex ${side === 'h' ? 'justify-end' : 'justify-start'}`}>
            <div
                className="rounded-3xl shadow-lg px-5 py-3"
                style={{
                    background: farge,
                    borderBottomRightRadius: side === 'h' ? 6 : undefined,
                    borderBottomLeftRadius: side === 'v' ? 6 : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
}

function Streker({ antall, farge }: { antall: number[]; farge: string }) {
    return (
        <div className="flex gap-2">
            {antall.map((b, i) => (
                <div key={i} className="h-4 rounded-full" style={{ width: b, background: farge }} />
            ))}
        </div>
    );
}

function Kode({ beat }: { beat: number }) {
    if (beat >= 3) {
        const valg = [
            { tekst: 'avslappet', x: 170, y: 170, farge: '#0d9488' },
            { tekst: 'finere', x: 690, y: 170, farge: BLA },
            { tekst: 'med engelsk', x: 410, y: 430, farge: ORANSJE },
        ];
        return (
            <>
                <Du x={500} y={290} d={150} />
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border-4"
                        style={{
                            left: 500 - 90 - i * 40,
                            top: 290 - 90 - i * 40,
                            width: 180 + i * 80,
                            height: 180 + i * 80,
                            borderColor: '#c4b5fd',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.9, 0.2] }}
                        transition={{ duration: 2, delay: i * 0.35, repeat: Infinity }}
                    />
                ))}
                {valg.map((v, i) => (
                    <motion.div
                        key={v.tekst}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.25 }}
                        className="absolute rounded-2xl bg-white shadow-lg px-4 py-2 text-2xl font-black whitespace-nowrap"
                        style={{
                            left: v.x,
                            top: v.y,
                            color: v.farge,
                            border: `3px solid ${v.farge}`,
                        }}
                    >
                        {v.tekst}
                    </motion.div>
                ))}
            </>
        );
    }
    return (
        <div className="absolute flex flex-col gap-4" style={{ left: 180, top: 100, width: 640 }}>
            <Inn>
                <Boble side="v">
                    <Streker antall={[90, 140, 60]} farge="#cbd5e1" />
                </Boble>
            </Inn>
            <Inn forsinkelse={0.3}>
                <Boble side="h" farge="#ede9fe">
                    <Streker antall={[120, 70, 100]} farge="#a78bfa" />
                </Boble>
            </Inn>
            {beat >= 1 && (
                <Inn>
                    <Boble side="h" farge="#ede9fe">
                        <div className="font-display font-black text-4xl whitespace-nowrap">
                            <span style={{ color: BLA }}>What&apos;s going on</span>
                            <span className="text-slate-500">, </span>
                            <span style={{ color: ORANSJE }}>lissom</span>
                            <span className="text-slate-500">!</span>
                        </div>
                    </Boble>
                </Inn>
            )}
            {beat >= 2 && (
                <Inn>
                    <div className="flex justify-end gap-3">
                        <div
                            className="rounded-xl px-3 py-1 text-white text-xl font-black"
                            style={{ background: BLA }}
                        >
                            engelsk
                        </div>
                        <div className="text-2xl font-black text-slate-500">+</div>
                        <div
                            className="rounded-xl px-3 py-1 text-white text-xl font-black"
                            style={{ background: ORANSJE }}
                        >
                            norsk
                        </div>
                    </div>
                    <div
                        className="mt-4 rounded-2xl px-5 py-2 text-white text-xl font-bold text-center"
                        style={{ background: LILLA }}
                    >
                        Du hopper mellom språk eller stiler i samme samtale
                    </div>
                </Inn>
            )}
        </div>
    );
}

/* ---------- signal ---------- */

function Lytter({ x, y }: { x: number; y: number }) {
    return (
        <div
            className="absolute rounded-full flex items-center justify-center text-white font-display font-black shadow-xl"
            style={{
                left: x - 60,
                top: y - 60,
                width: 120,
                height: 120,
                background: '#475569',
                fontSize: 30,
            }}
        >
            ?
        </div>
    );
}

function Signal({ beat }: { beat: number }) {
    const trekk = ['uttalen', 'bøyingen', 'ordene'];
    return (
        <>
            <Du x={190} y={300} d={140} />
            <div className="absolute" style={{ left: 280, top: 150, width: 260 }}>
                <Boble side="v" farge="#ede9fe">
                    <Streker antall={[70, 110, 50]} farge="#a78bfa" />
                </Boble>
            </div>
            {beat >= 1 && (
                <>
                    <Lytter x={810} y={300} />
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute rounded-3xl bg-white shadow-lg px-4 py-3 text-xl font-black text-slate-800 text-center"
                        style={{ left: 640, top: 110, width: 330 }}
                    >
                        Hvilken gruppe hører du til?
                    </motion.div>
                    {trekk.map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: 0 }}
                            animate={{ opacity: 1, x: 220 }}
                            transition={{ duration: 1.2, delay: 0.3 + i * 0.3 }}
                            className="absolute"
                            style={{ left: 290, top: 250 + i * 56 }}
                        >
                            <div
                                className="rounded-xl px-3 py-1 text-white text-xl font-black whitespace-nowrap"
                                style={{ background: i === 1 ? ORANSJE : BLA }}
                            >
                                {t}
                            </div>
                        </motion.div>
                    ))}
                </>
            )}
            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute flex items-center justify-center gap-3"
                    style={{ left: 60, right: 60, top: 460 }}
                >
                    {['1800-tallet', 'i dag', 'framtida'].map((t, i) => (
                        <div key={t} className="flex items-center gap-3">
                            {i > 0 && <div className="text-3xl font-black text-slate-400">→</div>}
                            <div
                                className="rounded-2xl px-4 py-2 text-2xl font-black text-white"
                                style={{
                                    background: i === 0 ? '#78716c' : i === 1 ? LILLA : '#a78bfa',
                                }}
                            >
                                {t}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </>
    );
}
