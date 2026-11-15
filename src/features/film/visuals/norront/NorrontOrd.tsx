import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, User } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Ordene i norrønt, side om side med norsk i dag. Tegnet på en flate på 1000x562.
 *
 *  - bokstaver: þ, ð, ǫ og æ/ø, ett kort per beat
 *  - ordpar:    seks norrøne ord blir til moderne ord (samme seks som i artikkelens ordmatch)
 *  - kasus:     hest-r, hest, hest-s, hest-i
 *  - verb:      vi to og dere to, «er» til alle, bøyningene faller bort
 */

type Modus = 'bokstaver' | 'ordpar' | 'kasus' | 'verb';

const BAKGRUNN = 'radial-gradient(ellipse at 50% 35%, #3b2f22 0%, #1c1611 70%, #120e0a 100%)';
const PERGAMENT = '#f3e6c8';
const BLEKK = '#3b2412';
const GULL = '#f59e0b';

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="font-display font-bold text-amber-100 tracking-wide"
                    style={{ fontSize: 30 }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ---------------- bokstaver ---------------- */

const BOKSTAVER = [
    { tegn: 'þ', navn: 'thorn', tekst: 'som th i thing', beat: 1 },
    { tegn: 'ð', navn: 'eth', tekst: 'som th i the. Finnes på islandsk', beat: 2 },
    { tegn: 'ǫ', navn: 'o med krok', tekst: 'ble til o eller å', beat: 3 },
    { tegn: 'æ ø', navn: 'æ og ø', tekst: 'helt like i dag', beat: 4 },
];

function Bokstaver({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Bokstaver du ikke kjenner" />
            <div
                className="absolute inset-x-0 flex justify-center items-end gap-6"
                style={{ top: 96, height: 400 }}
            >
                {BOKSTAVER.map((b) => {
                    const vist = beat >= b.beat;
                    const fokus = beat === b.beat;
                    return (
                        <motion.div
                            key={b.tegn}
                            animate={{
                                opacity: vist ? (fokus ? 1 : 0.6) : 0.85,
                                y: fokus ? -16 : 0,
                                scale: fokus ? 1.06 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            className="rounded-2xl shadow-2xl flex flex-col items-center"
                            style={{
                                width: 200,
                                height: 330,
                                background: PERGAMENT,
                                border: fokus ? `4px solid ${GULL}` : '4px solid transparent',
                                padding: 16,
                            }}
                        >
                            <div
                                className="font-serif leading-none"
                                style={{
                                    fontSize: b.tegn.length > 1 ? 92 : 132,
                                    color: BLEKK,
                                    marginTop: 18,
                                    height: 150,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {b.tegn}
                            </div>
                            <AnimatePresence mode="wait">
                                {vist ? (
                                    <motion.div
                                        key="tekst"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center"
                                    >
                                        <div
                                            className="font-display font-bold"
                                            style={{ fontSize: 26, color: '#92400e' }}
                                        >
                                            {b.navn}
                                        </div>
                                        <div
                                            className="font-semibold"
                                            style={{
                                                fontSize: 23,
                                                color: BLEKK,
                                                marginTop: 6,
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            {b.tekst}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="sporsmal"
                                        exit={{ opacity: 0 }}
                                        className="font-display font-black"
                                        style={{ fontSize: 64, color: '#b45309', opacity: 0.5 }}
                                    >
                                        ?
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
}

/* ---------------- ordpar ---------------- */

const ORDPAR = [
    { gammel: 'hús', ny: 'hus', beat: 1 },
    { gammel: 'skip', ny: 'skip', beat: 1, likt: true },
    { gammel: 'maðr', ny: 'mann', beat: 2 },
    { gammel: 'fjǫrðr', ny: 'fjord', beat: 3 },
    { gammel: 'kýr', ny: 'ku', beat: 3 },
    { gammel: 'auga', ny: 'øye', beat: 4 },
];

function Ordpar({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Norrønt → norsk i dag" />
            <div
                className="absolute grid"
                style={{
                    left: 80,
                    top: 90,
                    width: 840,
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 24,
                }}
            >
                {ORDPAR.map((o) => {
                    const vist = beat >= o.beat;
                    const fokus = beat === o.beat;
                    return (
                        <motion.div
                            key={o.gammel}
                            animate={{ scale: fokus ? 1.05 : 1, opacity: beat > o.beat ? 0.75 : 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                            className="rounded-2xl shadow-xl flex flex-col items-center justify-center"
                            style={{
                                height: 188,
                                background: PERGAMENT,
                                border: fokus ? `4px solid ${GULL}` : '4px solid transparent',
                            }}
                        >
                            <div className="font-serif italic" style={{ fontSize: 46, color: BLEKK }}>
                                {o.gammel === 'auga' && beat >= 4 ? (
                                    <span>
                                        au
                                        <span style={{ color: '#dc2626', opacity: 0.45 }}>g</span>a
                                    </span>
                                ) : (
                                    o.gammel
                                )}
                            </div>
                            <ArrowDown
                                size={28}
                                style={{ color: vist ? '#b45309' : '#d6c6a3', margin: '4px 0' }}
                            />
                            <div style={{ height: 60 }} className="flex items-center">
                                <AnimatePresence mode="wait">
                                    {vist ? (
                                        <motion.div
                                            key="ny"
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="font-display font-black flex items-center gap-2"
                                            style={{ fontSize: 46, color: '#0f766e' }}
                                        >
                                            {o.ny}
                                            {o.likt && (
                                                <span
                                                    className="font-sans font-bold rounded-full"
                                                    style={{
                                                        fontSize: 20,
                                                        padding: '2px 10px',
                                                        background: '#ccfbf1',
                                                        color: '#115e59',
                                                    }}
                                                >
                                                    helt likt
                                                </span>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="?"
                                            exit={{ opacity: 0 }}
                                            className="font-display font-black"
                                            style={{ fontSize: 42, color: '#c9b48a' }}
                                        >
                                            ?
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 512 }}
                    >
                        <div
                            className="rounded-xl font-semibold"
                            style={{
                                fontSize: 20,
                                padding: '6px 18px',
                                background: 'rgba(255,251,235,0.95)',
                                color: BLEKK,
                            }}
                        >
                            auga: g-en forsvinner, og «au» blir til «ø»
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------------- kasus ---------------- */

const KASUS = [
    { navn: 'nominativ', endelse: 'r', rolle: 'hesten gjør noe', beat: 2 },
    { navn: 'akkusativ', endelse: '', rolle: 'noe skjer med hesten', beat: 2 },
    { navn: 'genitiv', endelse: 's', rolle: 'hestens', beat: 3 },
    { navn: 'dativ', endelse: 'i', rolle: 'til hesten', beat: 3 },
];

function Kasus({ beat }: { beat: number }) {
    if (beat >= 4) return <KasusSprak />;
    return (
        <>
            <Overskrift tekst="Fire kasus: ett ord, fire former" />
            <div className="absolute flex flex-col" style={{ left: 120, top: 92, width: 760, gap: 14 }}>
                {KASUS.map((k, i) => {
                    const vist = beat >= k.beat;
                    const fokus = beat === k.beat;
                    return (
                        <motion.div
                            key={k.navn}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="rounded-2xl flex items-center shadow-lg"
                            style={{
                                height: 92,
                                background: vist ? PERGAMENT : 'rgba(243,230,200,0.18)',
                                border: fokus ? `3px solid ${GULL}` : '3px solid transparent',
                                padding: '0 26px',
                            }}
                        >
                            <div
                                className="font-display font-bold"
                                style={{
                                    width: 190,
                                    fontSize: 26,
                                    color: vist ? '#92400e' : '#e7d7b4',
                                }}
                            >
                                {k.navn}
                            </div>
                            <div
                                className="font-serif flex items-baseline"
                                style={{ width: 170, fontSize: 52, color: vist ? BLEKK : '#e7d7b4' }}
                            >
                                hest
                                <motion.span
                                    animate={{
                                        opacity: vist ? 1 : beat === 1 ? [0.3, 1, 0.3] : 0.5,
                                    }}
                                    transition={
                                        beat === 1 && !vist
                                            ? { duration: 1.4, repeat: Infinity }
                                            : { duration: 0.4 }
                                    }
                                    className="font-display font-black"
                                    style={{ color: vist ? '#dc2626' : '#fbbf24', marginLeft: 2 }}
                                >
                                    {vist ? k.endelse || '' : '-?'}
                                </motion.span>
                            </div>
                            <AnimatePresence>
                                {vist && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-semibold whitespace-nowrap"
                                        style={{ fontSize: 21, color: BLEKK }}
                                    >
                                        {k.endelse ? `endelse -${k.endelse}` : 'ingen endelse'}
                                        <span style={{ color: '#44403c' }}>{`  ·  ${k.rolle}`}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 506 }}
                    >
                        <div
                            className="rounded-xl font-semibold"
                            style={{
                                fontSize: 21,
                                padding: '6px 18px',
                                background: 'rgba(255,251,235,0.95)',
                                color: BLEKK,
                            }}
                        >
                            Rollen i setningen bestemmer endelsen
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

const SPRAK = [
    { navn: 'Islandsk', tekst: 'har kasus ennå', mengde: 'mye', farge: '#0f766e' },
    { navn: 'Tysk', tekst: 'har kasus litt', mengde: 'litt', farge: '#b45309' },
    { navn: 'Norsk', tekst: 'har det nesten ikke', mengde: 'nesten ingen', farge: '#1d4ed8' },
];

function KasusSprak() {
    return (
        <>
            <Overskrift tekst="Hvem har kasus i dag?" />
            <div className="absolute flex justify-center gap-6" style={{ left: 0, right: 0, top: 110 }}>
                {SPRAK.map((s, i) => (
                    <motion.div
                        key={s.navn}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.35 }}
                        className="rounded-2xl shadow-2xl flex flex-col items-center"
                        style={{ width: 270, height: 250, background: PERGAMENT, padding: 22 }}
                    >
                        <div className="font-display font-black" style={{ fontSize: 36, color: s.farge }}>
                            {s.navn}
                        </div>
                        <div className="font-semibold" style={{ fontSize: 22, color: BLEKK, marginTop: 4 }}>
                            {s.tekst}
                        </div>
                        <div
                            className="font-display font-black rounded-xl whitespace-nowrap"
                            style={{ marginTop: 26, fontSize: 28, padding: '6px 18px', background: s.farge, color: 'white' }}
                        >
                            {s.mengde}
                        </div>
                    </motion.div>
                ))}
            </div>
        </>
    );
}

/* ---------------- verb ---------------- */

function Personer({ antall, farge }: { antall: number; farge: string }) {
    return (
        <div className="flex" style={{ gap: 2 }}>
            {Array.from({ length: antall }, (_, i) => (
                <User key={i} size={44} strokeWidth={2.5} style={{ color: farge }} />
            ))}
        </div>
    );
}

const PRONOMEN = ['jeg', 'du', 'han', 'hun', 'vi', 'dere', 'de'];
const BORTE = ['fire kasus', 'tre kjønn', 'bøyning i person', 'bøyning i tall', '«vi to»'];

function Verb({ beat }: { beat: number }) {
    const titler = [
        'Verbene ble bøyd',
        'Egne ord for to personer',
        'I dag: «er» til alle',
        'Bøyningene faller bort',
    ];
    return (
        <>
            <Overskrift tekst={titler[Math.min(beat, 3)]} />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex justify-center items-center"
                        style={{ left: 0, right: 0, top: 120, gap: 40 }}
                    >
                        {[
                            { sp: 'Hvem gjør noe?', svar: 'person' },
                            { sp: 'Hvor mange?', svar: 'tall' },
                        ].map((k, i) => (
                            <motion.div
                                key={k.sp}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.6 }}
                                className="rounded-2xl shadow-2xl flex flex-col items-center justify-center"
                                style={{ width: 340, height: 260, background: PERGAMENT }}
                            >
                                <div className="font-display font-bold" style={{ fontSize: 34, color: BLEKK }}>
                                    {k.sp}
                                </div>
                                <ArrowDown size={36} style={{ color: '#b45309', margin: '10px 0' }} />
                                <div
                                    className="font-display font-black"
                                    style={{ fontSize: 30, color: '#92400e' }}
                                >
                                    bøyning i {k.svar}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="b1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex justify-center"
                        style={{ left: 0, right: 0, top: 110, gap: 40 }}
                    >
                        {['vi to', 'dere to'].map((t, i) => (
                            <motion.div
                                key={t}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.7 }}
                                className="rounded-2xl shadow-2xl flex flex-col items-center justify-center"
                                style={{ width: 330, height: 300, background: PERGAMENT, gap: 18 }}
                            >
                                <Personer antall={2} farge={i === 0 ? '#b45309' : '#0f766e'} />
                                <div className="font-display font-black" style={{ fontSize: 44, color: BLEKK }}>
                                    «{t}»
                                </div>
                                <div className="font-semibold" style={{ fontSize: 21, color: '#78716c' }}>
                                    et eget ord bare for to
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div
                        key="b2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-2xl"
                        style={{ left: 300, top: 88, width: 400, padding: '18px 30px', background: PERGAMENT }}
                    >
                        {PRONOMEN.map((p, i) => (
                            <motion.div
                                key={p}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.18 }}
                                className="flex items-baseline font-display"
                                style={{ fontSize: 34, height: 56 }}
                            >
                                <span style={{ width: 150, color: '#78716c', fontWeight: 600 }}>{p}</span>
                                <span style={{ color: '#0f766e', fontWeight: 900 }}>er</span>
                                <Check size={26} style={{ color: '#0f766e', marginLeft: 14 }} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="b3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                        style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    >
                        <div className="absolute flex flex-col items-center" style={{ left: 90, top: 96, width: 330, gap: 12 }}>
                            <div className="font-display font-bold" style={{ fontSize: 24, color: '#fde68a' }}>
                                Norrønt hadde
                            </div>
                            {BORTE.map((b, i) => (
                                <motion.div
                                    key={b}
                                    initial={{ opacity: 1, y: 0, rotate: 0 }}
                                    animate={{ opacity: 0.18, y: 16, rotate: i % 2 ? 4 : -4 }}
                                    transition={{ delay: 0.6 + i * 0.5, duration: 0.8 }}
                                    className="rounded-xl font-display font-bold text-center"
                                    style={{
                                        width: 300,
                                        fontSize: 26,
                                        padding: '10px 0',
                                        background: PERGAMENT,
                                        color: BLEKK,
                                    }}
                                >
                                    {b}
                                </motion.div>
                            ))}
                        </div>
                        <ArrowRight
                            size={60}
                            className="absolute"
                            style={{ left: 450, top: 250, color: GULL }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.4 }}
                            className="absolute rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center"
                            style={{ left: 560, top: 150, width: 350, height: 250, background: PERGAMENT, padding: 20 }}
                        >
                            <div className="font-display font-black" style={{ fontSize: 40, color: '#1d4ed8' }}>
                                Norsk i dag
                            </div>
                            <div className="font-semibold" style={{ fontSize: 24, color: BLEKK, marginTop: 10 }}>
                                lettere å lære enn islandsk
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export function NorrontOrd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ordpar';
    return (
        <Flate bakgrunn={BAKGRUNN}>
            {modus === 'bokstaver' && <Bokstaver beat={beat} />}
            {modus === 'ordpar' && <Ordpar beat={beat} />}
            {modus === 'kasus' && <Kasus beat={beat} />}
            {modus === 'verb' && <Verb beat={beat} />}
        </Flate>
    );
}
