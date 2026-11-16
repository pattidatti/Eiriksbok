import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Ord og skrift på papiret.
 *
 *  - smugling:  1814 og grunnloven. En side på dansk der norske ord og vendinger dukker opp,
 *               først fra Wergeland, så fra Asbjørnsen og Moe. Til slutt: fortsatt dansk
 *  - veiskille: veien deler seg i to på 1840-tallet: Aasen opp mot bygdene, Knudsen mot dansken
 *  - knudsen:   gradvishetens vei. Ord på en dansk side byttes ut ett og ett, steen blir sten
 *               og så stein, og fornorsket dansk blir riksmål og bokmål
 */

type Modus = 'smugling' | 'veiskille' | 'knudsen';

const PAPIR = '#fbf5e6';
const BLEKK = '#44403c';
const DANSK = '#b91c1c';
const NORSK = '#15803d';

function Kort({ children, top = 22, bred }: { children: ReactNode; top?: number; bred?: number }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl shadow-xl bg-white text-center"
                style={{ padding: '10px 26px', width: bred }}
            >
                {children}
            </motion.div>
        </div>
    );
}

/* ---------------- Sida med skrift ---------------- */

/** Ordlengder på sida, rad for rad. */
const RADER = [
    [5, 3, 7, 4, 6, 3],
    [4, 6, 3, 5, 7],
    [6, 3, 5, 4, 3, 5],
    [3, 7, 4, 6, 4],
    [5, 4, 6, 3, 6, 3],
    [7, 3, 5, 5, 4],
    [4, 5, 3, 6, 5, 3],
];

/** Hvilke ord som er norske etter hvert: [rad, ord, fraBeat]. */
const NORSKE: [number, number, number][] = [
    [0, 2, 2],
    [2, 4, 2],
    [4, 1, 2],
    [1, 1, 3],
    [3, 3, 3],
    [5, 0, 3],
    [6, 3, 3],
    [2, 0, 3],
];

function Side({
    beat,
    norskFra,
    x,
    y,
}: {
    beat: number;
    /** Ord fra NORSKE vises grønne fra sin beat. */
    norskFra?: boolean;
    x: number;
    y: number;
}) {
    let teller = 0;
    return (
        <div
            className="absolute rounded-lg shadow-2xl"
            style={{
                left: x,
                top: y,
                width: 380,
                height: 330,
                background: PAPIR,
                padding: '28px 26px',
                border: '2px solid #e7dcc2',
            }}
        >
            {RADER.map((rad, r) => (
                <div key={r} className="flex" style={{ gap: 9, marginBottom: 16 }}>
                    {rad.map((len, o) => {
                        const nr = teller++;
                        const fra = NORSKE.find(([nr0, no]) => nr0 === r && no === o)?.[2];
                        const norsk = !!norskFra && fra !== undefined && beat >= fra;
                        return (
                            <motion.div
                                key={o}
                                animate={{
                                    backgroundColor: norsk ? NORSK : BLEKK,
                                    scaleY: norsk ? 1.25 : 1,
                                }}
                                transition={{
                                    duration: 0.6,
                                    delay: norsk && norskFra ? (nr % 5) * 0.15 : 0,
                                }}
                                style={{
                                    width: len * 8.5,
                                    height: 16,
                                    borderRadius: 4,
                                    opacity: 0.85,
                                }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function Forklaring({ x, y, synlig }: { x: number; y: number; synlig: boolean }) {
    return (
        <motion.div
            className="absolute flex"
            style={{ left: x, top: y, gap: 24 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
        >
            <div className="flex items-center" style={{ gap: 10 }}>
                <div style={{ width: 34, height: 14, borderRadius: 4, background: BLEKK }} />
                <div className="font-bold" style={{ fontSize: 20, color: BLEKK }}>
                    dansk
                </div>
            </div>
            <div className="flex items-center" style={{ gap: 10 }}>
                <div style={{ width: 34, height: 14, borderRadius: 4, background: NORSK }} />
                <div className="font-bold" style={{ fontSize: 20, color: NORSK }}>
                    norske ord
                </div>
            </div>
        </motion.div>
    );
}

/* ---------------- smugling ---------------- */

function Smugling({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="#e8e2d2">
            <AnimatePresence mode="wait">
                {beat <= 1 ? (
                    <motion.div
                        key="grunnlov"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-x-0 flex justify-center" style={{ top: 60 }}>
                            <div
                                className="rounded-xl shadow-2xl text-center"
                                style={{
                                    background: PAPIR,
                                    padding: '26px 48px',
                                    border: '2px solid #e7dcc2',
                                }}
                            >
                                <div
                                    className="font-serif font-bold"
                                    style={{ fontSize: 22, color: '#78716c' }}
                                >
                                    1814
                                </div>
                                <div
                                    className="font-serif font-black"
                                    style={{ fontSize: 46, color: '#1c1917' }}
                                >
                                    Norges grunnlov
                                </div>
                                <motion.div
                                    className="font-semibold"
                                    style={{ fontSize: 20, color: '#57534e' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    senere: union med Sverige
                                </motion.div>
                            </div>
                        </div>
                        {beat >= 1 && (
                            <div
                                className="absolute inset-x-0 flex justify-center"
                                style={{ top: 300, gap: 22 }}
                            >
                                {[
                                    { t: 'Eget land', ok: true },
                                    { t: 'Egen grunnlov', ok: true },
                                    { t: 'Eget skriftspråk', ok: false },
                                ].map((r, i) => (
                                    <motion.div
                                        key={r.t}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.6 }}
                                        className="rounded-2xl shadow-lg bg-white flex items-center"
                                        style={{
                                            padding: '14px 22px',
                                            gap: 12,
                                            border: `3px solid ${r.ok ? NORSK : '#d97706'}`,
                                        }}
                                    >
                                        <div
                                            className="font-black flex items-center justify-center rounded-full"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                fontSize: 26,
                                                color: 'white',
                                                background: r.ok ? NORSK : '#d97706',
                                            }}
                                        >
                                            {r.ok ? '✓' : '?'}
                                        </div>
                                        <div
                                            className="font-display font-black"
                                            style={{ fontSize: 28, color: '#1c1917' }}
                                        >
                                            {r.t}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="side"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Side beat={beat} norskFra x={120} y={150} />
                        <Forklaring x={130} y={110} synlig />
                        <div className="absolute" style={{ left: 560, top: 170, width: 380 }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={Math.min(beat, 4)}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-2xl shadow-xl bg-white"
                                    style={{ padding: '18px 24px' }}
                                >
                                    {beat === 2 && (
                                        <>
                                            <div
                                                className="font-display font-black"
                                                style={{ fontSize: 32, color: '#1c1917' }}
                                            >
                                                Henrik Wergeland
                                            </div>
                                            <div
                                                className="font-semibold"
                                                style={{ fontSize: 22, color: NORSK }}
                                            >
                                                smugler norske ord inn i dansken
                                            </div>
                                        </>
                                    )}
                                    {beat === 3 && (
                                        <>
                                            <div
                                                className="font-display font-black"
                                                style={{ fontSize: 32, color: '#1c1917' }}
                                            >
                                                Asbjørnsen og Moe
                                            </div>
                                            <div
                                                className="font-semibold"
                                                style={{ fontSize: 22, color: NORSK }}
                                            >
                                                folkeeventyr: dansk på utsiden, norske vendinger
                                                inni
                                            </div>
                                        </>
                                    )}
                                    {beat >= 4 && (
                                        <>
                                            <div
                                                className="font-display font-black"
                                                style={{ fontSize: 32, color: DANSK }}
                                            >
                                                Fortsatt dansk
                                            </div>
                                            <div
                                                className="font-semibold"
                                                style={{ fontSize: 22, color: '#57534e' }}
                                            >
                                                i bunn og grunn
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        {beat >= 4 && (
                            <div className="absolute" style={{ left: 600, top: 360 }}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                                    className="font-display font-black rounded-xl"
                                    style={{
                                        fontSize: 40,
                                        color: DANSK,
                                        border: `6px solid ${DANSK}`,
                                        padding: '4px 22px',
                                        rotate: '-8deg',
                                    }}
                                >
                                    DANSK
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

/* ---------------- veiskille ---------------- */

function Veiskille({ beat }: { beat: number }) {
    // Tegnet i en SVG på 1000x562 inni flaten, så alt følger samme mål.
    const start: [number, number] = [150, 290];
    const delt: [number, number] = [360, 290];
    const opp: [number, number] = [820, 150];
    const ned: [number, number] = [820, 430];
    return (
        <Flate bakgrunn="#eef2e6">
            <svg viewBox="0 0 1000 562" className="absolute inset-0" width={1000} height={562}>
                <path
                    d={`M ${start[0]} ${start[1]} L ${delt[0]} ${delt[1]}`}
                    stroke="#a8a29e"
                    strokeWidth={34}
                    strokeLinecap="round"
                />
                <motion.path
                    d={`M ${delt[0]} ${delt[1]} C 520 290, 560 ${opp[1]}, ${opp[0]} ${opp[1]}`}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={30}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0, opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 1.3 }}
                />
                <motion.path
                    d={`M ${delt[0]} ${delt[1]} C 520 290, 560 ${ned[1]}, ${ned[0]} ${ned[1]}`}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={30}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 2 ? 1 : 0, opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 1.3 }}
                />
                <circle cx={delt[0]} cy={delt[1]} r={22} fill="#57534e" />
            </svg>
            <div
                className="absolute rounded-xl shadow-lg bg-white text-center"
                style={{ left: 40, top: 200, padding: '8px 16px' }}
            >
                <div className="font-bold" style={{ fontSize: 18, color: '#78716c' }}>
                    1840-tallet
                </div>
                <div className="font-display font-black" style={{ fontSize: 24, color: '#1c1917' }}>
                    Norsk skrift?
                </div>
            </div>
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.div
                        key="aasen"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute rounded-2xl shadow-xl bg-white"
                        style={{
                            left: 560,
                            top: 22,
                            padding: '10px 20px',
                            borderLeft: '8px solid #0f766e',
                        }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 30, color: '#134e4a' }}
                        >
                            Ivar Aasen
                        </div>
                        <div className="font-semibold" style={{ fontSize: 20, color: '#3f3f46' }}>
                            det ekte norske bor i bygdedialektene
                        </div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        key="knudsen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute rounded-2xl shadow-xl bg-white"
                        style={{
                            left: 560,
                            top: 452,
                            padding: '10px 20px',
                            borderLeft: '8px solid #b91c1c',
                        }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 30, color: '#7f1d1d' }}
                        >
                            Knud Knudsen
                        </div>
                        <div className="font-semibold" style={{ fontSize: 20, color: '#3f3f46' }}>
                            lærer i Christiania, i dag Oslo
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="motsatt"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute rounded-2xl shadow-2xl text-center"
                        style={{ left: 395, top: 245, padding: '8px 18px', background: '#1c1917' }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 26, color: '#fde68a' }}
                        >
                            stikk motsatt
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

/* ---------------- knudsen ---------------- */

const STEIN = [
    { ord: 'steen', etikett: 'dansk', farge: DANSK },
    { ord: 'sten', etikett: 'et steg', farge: '#b45309' },
    { ord: 'stein', etikett: 'etter hvert', farge: NORSK },
];

function Knudsen({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="#f1ece0">
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="radikal"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort top={40}>
                            <div
                                className="font-display font-black"
                                style={{ fontSize: 34, color: '#1c1917' }}
                            >
                                Knudsen om Aasens plan:
                            </div>
                            <div
                                className="font-display font-black"
                                style={{ fontSize: 40, color: DANSK }}
                            >
                                for radikal
                            </div>
                        </Kort>
                        <div
                            className="absolute inset-x-0 flex justify-center items-end"
                            style={{ top: 250, gap: 70 }}
                        >
                            <div className="flex flex-col items-center" style={{ gap: 10 }}>
                                <div
                                    className="grid"
                                    style={{ gridTemplateColumns: 'repeat(5, 34px)', gap: 5 }}
                                >
                                    {Array.from({ length: 20 }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ backgroundColor: BLEKK }}
                                            animate={{ backgroundColor: NORSK }}
                                            transition={{ delay: 0.8, duration: 0.3 }}
                                            style={{ width: 34, height: 26, borderRadius: 4 }}
                                        />
                                    ))}
                                </div>
                                <div
                                    className="font-bold"
                                    style={{ fontSize: 22, color: '#3f3f46' }}
                                >
                                    alt nytt på en gang
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="skolebarn"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Side beat={beat} x={310} y={110} />
                        <Kort top={30}>
                            <div
                                className="font-display font-black"
                                style={{ fontSize: 30, color: '#1c1917' }}
                            >
                                Dette skriftspråket kan alle skolebarn allerede
                            </div>
                        </Kort>
                        <div className="absolute" style={{ left: 720, top: 300 }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="rounded-2xl shadow-xl bg-white font-display font-black text-center"
                                style={{ fontSize: 30, padding: '12px 20px', color: '#b45309' }}
                            >
                                Hvorfor lage
                                <br />
                                et helt nytt?
                            </motion.div>
                        </div>
                    </motion.div>
                )}
                {beat === 2 && <Gradvis key="gradvis" />}
                {beat === 3 && (
                    <motion.div
                        key="stein"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-x-0 flex justify-center items-center"
                            style={{ top: 170, gap: 24 }}
                        >
                            {STEIN.map((s, i) => (
                                <div key={s.ord} className="flex items-center" style={{ gap: 24 }}>
                                    {i > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 1.4 - 0.4 }}
                                            className="font-black"
                                            style={{ fontSize: 48, color: '#a8a29e' }}
                                        >
                                            →
                                        </motion.div>
                                    )}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 1.4 }}
                                        className="rounded-2xl shadow-xl bg-white text-center"
                                        style={{
                                            padding: '14px 28px',
                                            border: `5px solid ${s.farge}`,
                                        }}
                                    >
                                        <div
                                            className="font-serif font-black"
                                            style={{ fontSize: 64, color: s.farge }}
                                        >
                                            {s.ord}
                                        </div>
                                        <div
                                            className="font-bold"
                                            style={{ fontSize: 20, color: '#57534e' }}
                                        >
                                            {s.etikett}
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="navn"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-x-0 flex justify-center items-center"
                            style={{ top: 190, gap: 20 }}
                        >
                            {[
                                { t: 'fornorsket dansk', s: 'Knudsens vei', f: '#b45309' },
                                { t: 'riksmål', s: 'etter hvert', f: '#be123c' },
                                { t: 'bokmål', s: 'navnet fra 1929', f: '#1d4ed8' },
                            ].map((n, i) => (
                                <div key={n.t} className="flex items-center" style={{ gap: 20 }}>
                                    {i > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 1.0 - 0.3 }}
                                            className="font-black"
                                            style={{ fontSize: 44, color: '#a8a29e' }}
                                        >
                                            →
                                        </motion.div>
                                    )}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 1.0 }}
                                        className="rounded-2xl shadow-xl text-center"
                                        style={{ padding: '14px 22px', background: n.f }}
                                    >
                                        <div
                                            className="font-display font-black"
                                            style={{ fontSize: 34, color: 'white' }}
                                        >
                                            {n.t}
                                        </div>
                                        <div
                                            className="font-semibold"
                                            style={{
                                                fontSize: 18,
                                                color: 'rgba(255,255,255,0.85)',
                                            }}
                                        >
                                            {n.s}
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

/** Ordene på sida byttes ut ett og ett, med en trapp som viser hvor langt han har kommet. */
function Gradvis() {
    return (
        <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <GradvisSide />
            <div className="absolute" style={{ left: 570, top: 120, width: 380 }}>
                <div className="rounded-2xl shadow-xl bg-white" style={{ padding: '16px 24px' }}>
                    <div
                        className="font-display font-black"
                        style={{ fontSize: 32, color: '#1c1917' }}
                    >
                        Gradvishetens vei
                    </div>
                    <div className="font-semibold" style={{ fontSize: 21, color: '#57534e' }}>
                        bytt ut de mest danske ordene med norske former, litt etter litt
                    </div>
                </div>
                <div className="flex items-end" style={{ gap: 8, marginTop: 30, height: 150 }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.15 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.7 }}
                            style={{
                                width: 52,
                                height: 24 + i * 24,
                                borderRadius: 6,
                                background: i < 2 ? '#b45309' : i < 4 ? '#ca8a04' : NORSK,
                            }}
                        />
                    ))}
                </div>
            </div>
            <Forklaring x={130} y={80} synlig />
        </motion.div>
    );
}

function GradvisSide() {
    return (
        <div className="absolute" style={{ left: 120, top: 120 }}>
            <div
                className="rounded-lg shadow-2xl"
                style={{
                    width: 380,
                    height: 330,
                    background: PAPIR,
                    padding: '28px 26px',
                    border: '2px solid #e7dcc2',
                }}
            >
                {RADER.map((rad, r) => (
                    <div key={r} className="flex" style={{ gap: 9, marginBottom: 16 }}>
                        {rad.map((len, o) => {
                            const nr = r * 6 + o;
                            const byttes = nr % 3 === 1;
                            return (
                                <motion.div
                                    key={o}
                                    initial={{ backgroundColor: BLEKK }}
                                    animate={{ backgroundColor: byttes ? NORSK : BLEKK }}
                                    transition={{
                                        delay: byttes ? 0.6 + (nr / 3) * 0.28 : 0,
                                        duration: 0.4,
                                    }}
                                    style={{
                                        width: len * 8.5,
                                        height: 16,
                                        borderRadius: 4,
                                        opacity: 0.85,
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BokmalOrd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'smugling';
    if (modus === 'veiskille') return <Veiskille beat={beat} />;
    if (modus === 'knudsen') return <Knudsen beat={beat} />;
    return <Smugling beat={beat} />;
}
