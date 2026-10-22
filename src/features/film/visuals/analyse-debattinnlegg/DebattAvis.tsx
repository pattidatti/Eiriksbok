import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Avissiden med innlegget til Hofmann. Etterforskeren merker opp setningene én etter én i
 * fargen til appellformen: grønt for etos, blått for logos, rødt for patos og gult for
 * imøtegåelsen. Merknadene står som kort til høyre for siden, så de aldri dekker teksten.
 */

type Modus = 'apning' | 'avsender' | 'forskning' | 'imotegaelse';
type Tone = 'etos' | 'logos' | 'patos' | 'gul' | 'noytral' | 'mork';

const FARGE: Record<Tone, { bak: string; tekst: string; kant: string }> = {
    etos: { bak: '#dcfce7', tekst: '#14532d', kant: '#16a34a' },
    logos: { bak: '#dbeafe', tekst: '#1e3a8a', kant: '#2563eb' },
    patos: { bak: '#fee2e2', tekst: '#7f1d1d', kant: '#dc2626' },
    gul: { bak: '#fef3c7', tekst: '#78350f', kant: '#d97706' },
    noytral: { bak: '#ffffff', tekst: '#0f172a', kant: '#94a3b8' },
    mork: { bak: '#1e293b', tekst: '#f8fafc', kant: '#475569' },
};

const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' };
const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

/** Siden: x 110-990. Teksten starter ved x 170. */
const SIDE = { x: 110, y: 40, b: 880, h: 830 };
const TX = 170;
const LINJE = 37;

type Blokk = 'overskrift' | 'byline' | 'ingress' | 'tyv' | 'leger' | 'forskning' | 'innrom' | 'men';

interface Rad {
    blokk?: Blokk;
    tekst?: string;
    /** Grå strek i stedet for tekst: resten av innlegget. */
    fyll?: number;
    fet?: boolean;
}

const RADER: Rad[] = [
    { blokk: 'ingress', tekst: 'Kunstig intelligens gjør oss dummere og dårligere.', fet: true },
    { fyll: 0.92 },
    { fyll: 0.7 },
    { blokk: 'tyv', tekst: 'Det viser seg nemlig at KI er en ferdighetstyv ...' },
    { blokk: 'leger', tekst: 'Leger blir for eksempel dårligere til å gjøre' },
    { blokk: 'leger', tekst: 'kliniske undersøkelser ...' },
    { blokk: 'forskning', tekst: 'Forskning viser at studenter som har skrevet' },
    { blokk: 'forskning', tekst: 'oppgaver på egen hånd, leverer bedre oppgaver.' },
    { fyll: 0.85 },
    { blokk: 'innrom', tekst: 'Det kan virke meningsløst å lære seg ferdigheter' },
    { blokk: 'innrom', tekst: 'når KI kan gjøre oppgavene raskere og enklere.' },
    { blokk: 'men', tekst: 'Problemet er bare at da får man aldri selv' },
    { blokk: 'men', tekst: 'utviklet ferdigheten.' },
    { fyll: 0.6 },
];
const RAD_Y0 = 372;

/** Hvilke blokker som er merket, og i hvilken farge, per modus og beat. */
function merkingFor(modus: Modus, beat: number): Partial<Record<Blokk, Tone>> {
    if (modus === 'apning') return beat === 0 ? { overskrift: 'gul' } : {};
    if (modus === 'avsender') {
        if (beat === 0) return { overskrift: 'gul' };
        if (beat <= 2) return { byline: 'etos' };
        return { byline: 'etos', ingress: 'patos' };
    }
    if (modus === 'forskning') {
        if (beat === 0) return { ingress: 'patos', tyv: 'patos' };
        if (beat === 1) return { forskning: 'logos' };
        if (beat === 2) return { forskning: 'logos', leger: 'logos' };
        return { forskning: 'gul', leger: 'logos' };
    }
    if (beat === 0) return {};
    if (beat <= 3) return { innrom: beat === 3 ? 'etos' : 'gul' };
    return { innrom: 'etos', men: 'gul' };
}

interface Merknad {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    tone: Tone;
    /** Topp i prosent av bildet. */
    y: number;
}

function merknaderFor(modus: Modus): Merknad[] {
    if (modus === 'apning') {
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Overskriften roper', tekst: 'Fordummende intelligent teknologi', tone: 'gul', y: 8 },
            { fraBeat: 1, tittel: 'Målet hans', tekst: 'Du skal mene det samme som ham.', tone: 'mork', y: 8 },
            { fraBeat: 2, tittel: 'Din jobb', tekst: 'Avslør hvordan han gjør det.', tone: 'gul', y: 34 },
            { fraBeat: 3, tittel: 'Fakta?', tone: 'logos', y: 60 },
            { fraBeat: 3, tittel: 'Følelser?', tone: 'patos', y: 77 },
        ];
    }
    if (modus === 'avsender') {
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Eksempelteksten', tekst: 'et ekte debattinnlegg', tone: 'noytral', y: 8 },
            { fraBeat: 1, tittel: 'Bjørn Hofmann', tekst: 'Professor, arbeider med medisinsk etikk. NTNU og Universitetet i Oslo.', tone: 'noytral', y: 8 },
            { fraBeat: 2, tittel: 'Etos', tekst: 'Vi stoler lettere på en vi tror er pålitelig.', tone: 'etos', y: 43 },
            { fraBeat: 3, tittel: 'KI gjør oss sløve', tekst: '«Kunstig intelligens gjør oss dummere og dårligere.»', tone: 'patos', y: 70 },
        ];
    }
    if (modus === 'forskning') {
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Skremt, men ikke overbevist', tekst: 'Han må bevise at han har rett.', tone: 'mork', y: 8 },
            { fraBeat: 1, tilBeat: 2, tittel: '«Forskning viser at ...»', tekst: 'Logos: forskning gjør ham troverdig.', tone: 'logos', y: 8 },
            { fraBeat: 2, tilBeat: 2, tittel: '«Leger blir dårligere ...»', tekst: 'Et konkret og skremmende eksempel.', tone: 'logos', y: 40 },
            { fraBeat: 3, tittel: 'Hvilken forskning?', tekst: 'Han nevner ingen kilder.', tone: 'gul', y: 8 },
            { fraBeat: 4, tittel: 'En svakhet', tekst: 'Påstanden er litt vag.', tone: 'patos', y: 40 },
            { fraBeat: 4, tittel: 'Skriv det i analysen', tekst: 'Da blir den dypere.', tone: 'etos', y: 70 },
        ];
    }
    return [
        { fraBeat: 0, tilBeat: 0, tittel: 'Motstanderen vil si ...', tekst: 'Svar før det blir sagt.', tone: 'mork', y: 8 },
        { fraBeat: 1, tilBeat: 2, tittel: '«Det kan virke meningsløst ...»', tekst: 'Han innrømmer: KI er raskt og enkelt.', tone: 'gul', y: 8 },
        { fraBeat: 2, tilBeat: 2, tittel: 'Skyter han seg selv i foten?', tone: 'patos', y: 40 },
        { fraBeat: 3, tittel: 'Nei: det gir etos', tekst: 'Han virker gjennomtenkt og balansert.', tone: 'etos', y: 8 },
        { fraBeat: 4, tittel: 'Imøtegåelse', tekst: 'Motargumentet blir svakere. Konklusjonen: Komforten har en pris.', tone: 'gul', y: 40 },
    ];
}

/** Lupen til etterforskeren, med sentrum der den skal stå på hver beat. */
const LUPE: Record<number, [number, number]> = {
    0: [1300, 1100],
    1: [1300, 1100],
    2: [560, 210],
    3: [520, 560],
};

function Lupe({ beat }: { beat: number }) {
    const [x, y] = LUPE[Math.min(beat, 3)];
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ duration: 1.4, ease: [0.45, 0, 0.2, 1] }}
        >
            <line x1={78} y1={78} x2={190} y2={190} stroke="#3f2a1d" strokeWidth={30} strokeLinecap="round" />
            <circle r={115} fill="#e0f2fe" fillOpacity={0.22} stroke="#1e293b" strokeWidth={18} />
            <circle r={115} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={4} strokeDasharray="60 500" />
        </motion.g>
    );
}

function Merking({ y, h, tone }: { y: number; h: number; tone: Tone }) {
    const f = FARGE[tone];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <motion.rect
                x={TX - 14}
                y={y}
                height={h}
                rx={8}
                fill={f.bak}
                initial={{ width: 0 }}
                animate={{ width: SIDE.x + SIDE.b - TX - 26 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            <rect x={SIDE.x + 14} y={y} width={12} height={h} rx={6} fill={f.kant} />
        </motion.g>
    );
}

function Side({ modus, beat }: { modus: Modus; beat: number }) {
    const merket = merkingFor(modus, beat);
    const blokker = new Map<Blokk, { y0: number; y1: number }>();
    RADER.forEach((r, i) => {
        if (!r.blokk) return;
        const y = RAD_Y0 + i * LINJE;
        const b = blokker.get(r.blokk);
        blokker.set(r.blokk, { y0: b ? b.y0 : y - 28, y1: y + 12 });
    });
    blokker.set('overskrift', { y0: 140, y1: 268 });
    blokker.set('byline', { y0: 284, y1: 326 });
    const dempet = modus === 'imotegaelse' && beat === 0;
    return (
        <g>
            <rect x={SIDE.x + 10} y={SIDE.y + 14} width={SIDE.b} height={SIDE.h} rx={6} fill="#000" opacity={0.12} />
            <rect x={SIDE.x} y={SIDE.y} width={SIDE.b} height={SIDE.h} rx={6} fill="#fbfaf6" />
            <AnimatePresence>
                {(Object.keys(merket) as Blokk[]).map((b) => {
                    const m = blokker.get(b)!;
                    return <Merking key={`${b}-${merket[b]}`} y={m.y0} h={m.y1 - m.y0} tone={merket[b]!} />;
                })}
            </AnimatePresence>
            <g opacity={dempet ? 0.45 : 1} style={{ transition: 'opacity 0.6s' }}>
                <text x={TX} y={100} fontSize={24} fontWeight={800} letterSpacing={6} fill="#b91c1c" style={FONT}>
                    DEBATT
                </text>
                <line x1={TX} x2={SIDE.x + SIDE.b - 60} y1={118} y2={118} stroke="#0f172a" strokeWidth={3} />
                <text x={TX} y={196} fontSize={58} fontWeight={700} fill="#0f172a" style={SERIF}>
                    Fordummende
                </text>
                <text x={TX} y={254} fontSize={58} fontWeight={700} fill="#0f172a" style={SERIF}>
                    intelligent teknologi
                </text>
                <text x={TX} y={314} fontSize={26} fontStyle="italic" fill="#334155" style={SERIF}>
                    Av Bjørn Hofmann
                </text>
                {RADER.map((r, i) => {
                    const y = RAD_Y0 + i * LINJE;
                    if (r.fyll)
                        return (
                            <rect key={i} x={TX} y={y - 14} width={(SIDE.b - 120) * r.fyll} height={10} rx={5} fill="#cbd5e1" />
                        );
                    const tone = r.blokk ? merket[r.blokk] : undefined;
                    return (
                        <text
                            key={i}
                            x={TX}
                            y={y}
                            fontSize={tone ? 31 : 28}
                            fontWeight={r.fet || tone ? 700 : 400}
                            fill={tone ? FARGE[tone].tekst : '#1e293b'}
                            style={SERIF}
                        >
                            {r.tekst}
                        </text>
                    );
                })}
            </g>
        </g>
    );
}

export function DebattAvis({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'apning';
    const merknader = merknaderFor(modus).filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    return (
        <div className="absolute inset-0" style={{ background: '#d9cfbd' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <defs>
                    <pattern id="debatt-bord" width="160" height="160" patternUnits="userSpaceOnUse">
                        <rect width="160" height="160" fill="#d9cfbd" />
                        <path d="M0 40 Q 80 20 160 44 M0 110 Q 80 90 160 116" stroke="#cbbfa9" strokeWidth={3} fill="none" />
                    </pattern>
                </defs>
                <rect width="1600" height="900" fill="url(#debatt-bord)" />
                <motion.g
                    initial={modus === 'apning' ? { x: -80, opacity: 0 } : false}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                >
                    <Side modus={modus} beat={beat} />
                </motion.g>
                {modus === 'apning' && <Lupe beat={beat} />}
            </svg>
            <AnimatePresence>
                {merknader.map((m) => {
                    const f = FARGE[m.tone];
                    return (
                        <motion.div
                            key={m.tittel}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.55 }}
                            className="absolute rounded-2xl shadow-xl px-5 py-3"
                            style={{
                                left: '65.5%',
                                width: '31%',
                                top: `${m.y}%`,
                                background: f.bak,
                                color: f.tekst,
                                borderLeft: `8px solid ${f.kant}`,
                            }}
                        >
                            <div className="text-2xl font-black leading-tight" style={FONT}>
                                {m.tittel}
                            </div>
                            {m.tekst && <div className="text-lg font-semibold mt-1 leading-snug">{m.tekst}</div>}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
