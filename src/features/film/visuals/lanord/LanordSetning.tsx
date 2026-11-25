import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Crown, Package, Search } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { LAG, type LagId } from './felles';

/**
 * Setningen som høres norsk ut, og ordene som avslører den.
 *
 *  - setning:  åpningssetningen. Seks ord lyser opp og får fargen til laget de kom med
 *  - begreper: lånord og arveord, hvorfor vi låner, fremmedord og lånord i forkledning
 */

type Modus = 'setning' | 'begreper';

const ORD: { ord: string; lag?: LagId }[] = [
    { ord: 'Den' },
    { ord: 'kloke', lag: 'dansk' },
    { ord: 'snekkeren', lag: 'hansa' },
    { ord: 'tok' },
    { ord: 'på' },
    { ord: 'seg' },
    { ord: 'trøya', lag: 'hansa' },
    { ord: 'og' },
    { ord: 'begynte', lag: 'dansk' },
    { ord: 'å' },
    { ord: 'skrive', lag: 'kirke' },
    { ord: 'til' },
    { ord: 'biskopen.', lag: 'kirke' },
];

const HVEM: Record<'kirke' | 'hansa' | 'dansk', string> = {
    kirke: 'med prestene',
    hansa: 'med tyske handelsmenn',
    dansk: 'gjennom dansk',
};

function SetningVisning({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="linear-gradient(180deg,#fdf8ee,#f3e8d2)">
            <div
                className="absolute inset-x-0 flex justify-center"
                style={{ top: beat >= 4 ? 70 : 120, transition: 'top 0.8s' }}
            >
                <div
                    className="flex flex-wrap justify-center"
                    style={{ width: 900, columnGap: 14, rowGap: 34 }}
                >
                    {ORD.map((o, i) => {
                        const lant = !!o.lag && beat >= 2;
                        const farge = o.lag && beat >= 3 ? LAG[o.lag].farge : '#b45309';
                        return (
                            <div
                                key={i}
                                className="relative flex flex-col items-center"
                                style={{ minHeight: 92 }}
                            >
                                <motion.span
                                    className="font-serif"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: beat === 0 ? i * 0.12 : 0 }}
                                    style={{
                                        fontSize: 48,
                                        lineHeight: 1.1,
                                        color: lant ? farge : '#1f2937',
                                        fontWeight: lant ? 800 : 500,
                                        borderBottom: lant
                                            ? `5px solid ${farge}`
                                            : '5px solid transparent',
                                        transition: 'color 0.6s, border-color 0.6s',
                                    }}
                                >
                                    {o.ord}
                                </motion.span>
                                {o.lag && beat >= 3 && (
                                    <motion.span
                                        className="absolute font-display font-bold whitespace-nowrap"
                                        style={{ top: 62, fontSize: 19, color: LAG[o.lag].farge }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {HVEM[o.lag as 'kirke' | 'hansa' | 'dansk']}
                                    </motion.span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {beat === 1 && (
                    <Merke key="norsk" farge="#0f766e">
                        Helt norsk?
                    </Merke>
                )}
                {(beat === 2 || beat === 3) && (
                    <Merke key="seks" farge="#b45309">
                        6 av ordene er lånt
                    </Merke>
                )}
            </AnimatePresence>
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 flex flex-col items-center"
                    style={{ top: 330 }}
                >
                    <div
                        className="rounded-2xl font-display font-black text-white shadow-xl"
                        style={{ background: LAG.engelsk.farge, fontSize: 30, padding: '8px 24px' }}
                    >
                        I dag: nye ord nesten hver uke, de fleste fra engelsk
                    </div>
                    <div className="flex" style={{ gap: 14, marginTop: 22 }}>
                        {[
                            'nytt ord',
                            'nytt ord',
                            'nytt ord',
                            'nytt ord',
                            'nytt ord',
                            'nytt ord',
                        ].map((o, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.35 }}
                                className="rounded-xl bg-white font-display font-black shadow-lg"
                                style={{
                                    border: `3px dashed ${LAG.engelsk.farge}`,
                                    color: LAG.engelsk.farge,
                                    fontSize: 28,
                                    padding: '4px 16px',
                                }}
                            >
                                <span>{o}</span>
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}
        </Flate>
    );
}

function Merke({ children, farge }: { children: ReactNode; farge: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 400 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl font-display font-black text-white shadow-xl"
                style={{ background: farge, fontSize: 36, padding: '8px 28px' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

/* ---------------- begreper ---------------- */

function Felt({
    tittel,
    tekst,
    farge,
    ikon,
}: {
    tittel: string;
    tekst: string;
    farge: string;
    ikon?: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl bg-white shadow-xl flex flex-col items-center text-center"
            style={{ width: 400, padding: '20px 24px', borderTop: `10px solid ${farge}` }}
        >
            {ikon}
            <div className="font-display font-black" style={{ fontSize: 40, color: farge }}>
                {tittel}
            </div>
            <div className="font-semibold" style={{ fontSize: 24, color: '#334155', marginTop: 6 }}>
                {tekst}
            </div>
        </motion.div>
    );
}

function Brikke({
    ord,
    farge,
    fremmed = false,
    forsinkelse = 0,
}: {
    ord: string;
    farge: string;
    fremmed?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 240, damping: 18 }}
            className="inline-block rounded-2xl bg-white shadow-lg font-display font-black"
            style={{
                fontSize: 40,
                padding: '6px 22px',
                color: farge,
                border: fremmed ? `4px dashed ${farge}` : `4px solid ${farge}`,
                fontStyle: fremmed ? 'italic' : 'normal',
            }}
        >
            {ord}
        </motion.span>
    );
}

function Begreper({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="linear-gradient(180deg,#f8fafc,#e2e8f0)">
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="b0"
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ gap: 40 }}
                    >
                        <Felt
                            tittel="Lånord"
                            tekst="tatt over fra et annet språk, på et bestemt tidspunkt"
                            farge="#b45309"
                        />
                        <Felt
                            tittel="Arveord"
                            tekst="i språket helt fra den eldste formen vi kjenner"
                            farge="#0f766e"
                        />
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="b1"
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ gap: 24 }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 40, color: '#1f2937' }}
                        >
                            Ordet følger med tingen
                        </div>
                        <div className="flex items-center" style={{ gap: 30 }}>
                            <motion.div
                                initial={{ x: -120, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.9 }}
                                className="rounded-3xl bg-white shadow-xl flex flex-col items-center"
                                style={{ padding: '22px 34px' }}
                            >
                                <Package size={96} color="#b45309" strokeWidth={1.6} />
                                <div
                                    className="font-display font-bold"
                                    style={{ fontSize: 26, color: '#334155' }}
                                >
                                    noe nytt
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.9 }}
                                className="font-display font-black"
                                style={{ fontSize: 60, color: '#94a3b8' }}
                            >
                                +
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="rounded-3xl shadow-xl font-display font-black text-white"
                                style={{
                                    background: '#b45309',
                                    fontSize: 40,
                                    padding: '18px 30px',
                                }}
                            >
                                ordet for det
                            </motion.div>
                        </div>
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div
                        key="b2"
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Felt
                            tittel="Høy status"
                            tekst="Det virker fint eller moderne å bruke ord fra et annet språk"
                            farge="#7c3aed"
                            ikon={<Crown size={84} color="#7c3aed" strokeWidth={1.6} />}
                        />
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div key="b3" className="absolute inset-0">
                        <div
                            className="absolute flex flex-col items-center"
                            style={{ left: 40, top: 70, width: 430, gap: 18 }}
                        >
                            <div
                                className="font-display font-black"
                                style={{ fontSize: 36, color: '#b45309' }}
                            >
                                Fremmedord
                            </div>
                            <div
                                className="font-semibold text-center"
                                style={{ fontSize: 22, color: '#475569' }}
                            >
                                lånord som fortsatt ser fremmede ut
                            </div>
                            <Brikke ord="deadline" farge="#b45309" fremmed />
                            <Brikke ord="backstage" farge="#b45309" fremmed forsinkelse={0.3} />
                        </div>
                        {beat >= 4 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute flex flex-col items-center"
                                style={{ right: 40, top: 70, width: 430, gap: 18 }}
                            >
                                <div
                                    className="font-display font-black flex items-center"
                                    style={{ fontSize: 36, color: '#0f766e', gap: 10 }}
                                >
                                    <Search size={38} strokeWidth={2.6} />
                                    <span>Lånord i forkledning</span>
                                </div>
                                <div
                                    className="font-semibold text-center"
                                    style={{ fontSize: 22, color: '#475569' }}
                                >
                                    norsk uttale, bøying og skrivemåte
                                </div>
                                <Brikke ord="begynne" farge="#0f766e" />
                                <Brikke ord="snekker" farge="#0f766e" forsinkelse={0.3} />
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className="flex items-center font-display font-bold"
                                    style={{ fontSize: 22, color: '#334155', gap: 8 }}
                                >
                                    <BookOpen size={28} />
                                    <span>Bare språkforskere avslører dem</span>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

export function LanordSetning({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'setning';
    return modus === 'setning' ? <SetningVisning beat={beat} /> : <Begreper beat={beat} />;
}
