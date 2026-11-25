import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, Gamepad2, Globe, Monitor, Music, Smartphone, TrendingDown } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';
import { LAG } from './felles';

/**
 * Det nyeste laget: engelske ord, og hva norsk kan gjøre med dem.
 *
 *  - flom:     engelske importord og tingene de følger med
 *  - veier:    Gisle Andersens tre måter, som et veiskille
 *  - avloser:  Språkrådets avløserord, kort som snus
 *  - oversatt: oversettelseslån, ord som er oversatt bit for bit
 */

type Modus = 'flom' | 'veier' | 'avloser' | 'oversatt';

const BLA = LAG.engelsk.farge;
const GRONN = '#0f766e';

function Overskrift({ children, farge = '#1f2937' }: { children: ReactNode; farge?: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <div
                className="font-display font-black text-center"
                style={{ fontSize: 34, color: farge }}
            >
                {children}
            </div>
        </div>
    );
}

/* ---------------- flom ---------------- */

const TING = [
    { ikon: Monitor, navn: 'datamaskiner' },
    { ikon: Globe, navn: 'internett' },
    { ikon: Music, navn: 'musikk' },
    { ikon: Film, navn: 'filmer' },
    { ikon: Gamepad2, navn: 'spill' },
    { ikon: Smartphone, navn: 'sosiale medier' },
];

function Boks({
    tekst,
    farge,
    style,
}: {
    tekst: string;
    farge: string;
    style: React.CSSProperties;
}) {
    return (
        <div
            className="absolute rounded-3xl shadow-xl flex items-center justify-center font-display font-black text-white"
            style={{ background: farge, fontSize: 34, ...style }}
        >
            {tekst}
        </div>
    );
}

function Flom({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="linear-gradient(180deg,#eff6ff,#dbeafe)">
            <Overskrift farge={BLA}>
                {beat <= 1 ? 'Lag 4: engelsk i nyere tid' : 'Ordene følger med tingene'}
            </Overskrift>
            <Boks
                tekst="engelsk"
                farge={BLA}
                style={{ left: 40, top: 200, width: 210, height: 150 }}
            />
            <Boks
                tekst="norsk"
                farge="#b91c1c"
                style={{ right: 40, top: 200, width: 210, height: 150 }}
            />
            {/* Pila fra engelsk til norsk */}
            <svg
                className="absolute"
                style={{ left: 260, top: 255, width: 480, height: 40 }}
                viewBox="0 0 480 40"
            >
                <line
                    x1="0"
                    y1="20"
                    x2="455"
                    y2="20"
                    stroke="#93c5fd"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                <polygon points="480,20 450,4 450,36" fill="#93c5fd" />
            </svg>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 400 }}
                >
                    <div
                        className="rounded-2xl bg-white shadow-lg font-display font-black"
                        style={{ fontSize: 30, color: BLA, padding: '8px 24px' }}
                    >
                        svært stor påvirkning
                    </div>
                </motion.div>
            )}
            {beat === 1 && (
                <>
                    <div
                        className="absolute flex justify-center"
                        style={{ left: 260, width: 480, top: 120, gap: 12 }}
                    >
                        {['backstage', 'server', 'tanks'].map((o, i) => (
                            <motion.span
                                key={o}
                                initial={{ opacity: 0, x: -180 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.4, duration: 0.8 }}
                                className="rounded-xl bg-white shadow-lg font-display font-black"
                                style={{
                                    fontSize: 28,
                                    color: BLA,
                                    padding: '4px 14px',
                                    border: `3px solid ${BLA}`,
                                }}
                            >
                                {o}
                            </motion.span>
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 390 }}
                    >
                        <div
                            className="rounded-2xl bg-white shadow-xl text-center"
                            style={{ padding: '10px 26px', width: 640 }}
                        >
                            <div
                                className="font-display font-black"
                                style={{ fontSize: 30, color: BLA }}
                            >
                                Importord
                            </div>
                            <div
                                className="font-semibold"
                                style={{ fontSize: 22, color: '#334155' }}
                            >
                                et nyere lånord som ofte fortsatt har engelsk skrivemåte
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
            {beat >= 2 && (
                <div
                    className="absolute flex flex-wrap justify-center"
                    style={{ left: 270, width: 460, top: 90, gap: 10 }}
                >
                    {TING.map((t, i) => {
                        const vis = beat >= 3 || i < 2;
                        const Ikon = t.ikon;
                        return (
                            <motion.div
                                key={t.navn}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: vis ? 1 : 0, y: vis ? 0 : -20 }}
                                transition={{ delay: beat === 3 ? i * 0.25 : i * 0.4 }}
                                className="rounded-2xl bg-white shadow-lg flex flex-col items-center"
                                style={{ width: 140, padding: '8px 4px' }}
                            >
                                <Ikon size={40} color={BLA} strokeWidth={1.8} />
                                <div
                                    className="font-display font-bold"
                                    style={{ fontSize: 18, color: '#1e293b' }}
                                >
                                    {t.navn}
                                </div>
                                <div
                                    className="rounded-md font-display font-black text-white"
                                    style={{
                                        background: BLA,
                                        fontSize: 16,
                                        padding: '0 8px',
                                        marginTop: 3,
                                    }}
                                >
                                    + ordet
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute font-display font-bold text-center"
                    style={{ left: 30, top: 360, width: 240, fontSize: 22, color: '#1e3a8a' }}
                >
                    ofte fra engelskspråklige land
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 450 }}
                >
                    <div
                        className="rounded-2xl shadow-xl font-display font-black"
                        style={{
                            background: '#fde047',
                            color: '#1e3a8a',
                            fontSize: 28,
                            padding: '8px 24px',
                        }}
                    >
                        Også: en del svenske ord i nyere tid
                    </div>
                </motion.div>
            )}
        </Flate>
    );
}

/* ---------------- veier ---------------- */

const START: [number, number] = [60, 520];
const SKILLE: [number, number] = [640, 520];
const MAL = [230, 520, 790];
const VEIFARGE = ['#7c3aed', '#ea580c', GRONN];
const SKILT = [
    { tittel: '1. Behold ordet', eks: 'house, dance' },
    { tittel: '2. Norsk skrivemåte', eks: 'guide → gaid, service → sørvis' },
    { tittel: '3. Bytt ut med et norsk ord', eks: 'et avløserord' },
];

function Veier({ beat }: { beat: number }) {
    const valgt = beat >= 1 ? beat - 1 : -1;
    const ordPos: [number, number] =
        valgt < 0 ? [START[0] + 60, START[1] - 45] : [655, MAL[valgt] - 45];
    return (
        <div className="absolute inset-0" style={{ background: '#e7efe0' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <text
                    x={800}
                    y={80}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#1f2937"
                >
                    Gisle Andersen: tre måter
                </text>
                {/* Veien inn og de tre greinene */}
                <path
                    d={`M ${START[0]} ${START[1]} L ${SKILLE[0]} ${SKILLE[1]}`}
                    stroke="#94a3b8"
                    strokeWidth={70}
                    strokeLinecap="round"
                    fill="none"
                />
                {MAL.map((y, i) => (
                    <path
                        key={i}
                        d={`M ${SKILLE[0]} ${SKILLE[1]} C ${SKILLE[0] + 200} ${SKILLE[1]}, ${SKILLE[0] + 160} ${y}, 960 ${y}`}
                        stroke={valgt === i ? VEIFARGE[i] : '#cbd5e1'}
                        strokeWidth={valgt === i ? 64 : 50}
                        strokeLinecap="round"
                        fill="none"
                        style={{ transition: 'stroke 0.6s, stroke-width 0.6s' }}
                    />
                ))}
                {MAL.map((y, i) => {
                    const aktiv = valgt === i;
                    const dempet = valgt >= 0 && !aktiv;
                    return (
                        <g
                            key={i}
                            opacity={beat === 0 || aktiv ? 1 : dempet ? 0.4 : 1}
                            style={{ transition: 'opacity 0.6s' }}
                        >
                            <rect
                                x={985}
                                y={y - 85}
                                width={600}
                                height={170}
                                rx={26}
                                fill="#ffffff"
                                stroke={VEIFARGE[i]}
                                strokeWidth={aktiv ? 10 : 5}
                            />
                            <text
                                x={1285}
                                y={y - 22}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill={VEIFARGE[i]}
                            >
                                {SKILT[i].tittel}
                            </text>
                            {(aktiv || beat > i + 1) && (
                                <text
                                    x={1285}
                                    y={y + 42}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={700}
                                    fill="#334155"
                                >
                                    {SKILT[i].eks}
                                </text>
                            )}
                        </g>
                    );
                })}
                {/* Ordet som går veien */}
                <motion.g
                    initial={false}
                    animate={{ x: ordPos[0], y: ordPos[1] }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                >
                    <rect
                        x={0}
                        y={0}
                        width={300}
                        height={90}
                        rx={20}
                        fill={BLA}
                        stroke="#ffffff"
                        strokeWidth={5}
                    />
                    <text
                        x={150}
                        y={58}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        engelsk ord
                    </text>
                </motion.g>
            </svg>
        </div>
    );
}

/* ---------------- avloser ---------------- */

const PAR = [
    { en: 'e-mail', no: 'e-post' },
    { en: 'hashtag', no: 'emneknagg' },
    { en: 'streaming', no: 'strømming' },
    { en: 'influencer', no: 'påvirker' },
    { en: 'deadline', no: 'frist' },
    { en: 'selfie', no: 'selvknips' },
];

function Avloser({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="linear-gradient(180deg,#f0fdf4,#dcfce7)">
            <Overskrift farge={GRONN}>Avløserord: norsk ord i stedet for et engelsk</Overskrift>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 190 }}
                >
                    <div
                        className="rounded-3xl bg-white shadow-xl text-center"
                        style={{ padding: '22px 40px', width: 620 }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 40, color: GRONN }}
                        >
                            Språkrådet
                        </div>
                        <div className="font-semibold" style={{ fontSize: 26, color: '#334155' }}>
                            gir råd om norsk språk, og har en egen liste med avløserord
                        </div>
                    </div>
                </motion.div>
            )}
            {beat >= 1 && (
                <div
                    className="absolute grid"
                    style={{
                        left: 50,
                        right: 50,
                        top: 100,
                        gridTemplateColumns: '1fr 1fr',
                        gap: 14,
                    }}
                >
                    {PAR.map((p, i) => {
                        const vis = i < 3 || beat >= 2;
                        const kjent = beat >= 3 && p.no === 'e-post';
                        const lite = beat >= 3 && p.no === 'selvknips';
                        return (
                            <motion.div
                                key={p.en}
                                initial={{ opacity: 0, rotateX: 90 }}
                                animate={{ opacity: vis ? 1 : 0, rotateX: vis ? 0 : 90 }}
                                transition={{ delay: vis ? (i % 3) * 0.45 : 0, duration: 0.6 }}
                                className="rounded-2xl bg-white shadow-lg flex items-center"
                                style={{
                                    height: 72,
                                    padding: '0 18px',
                                    gap: 12,
                                    border: kjent
                                        ? `4px solid ${GRONN}`
                                        : lite
                                          ? '4px solid #94a3b8'
                                          : '4px solid transparent',
                                }}
                            >
                                <span
                                    className="font-display font-bold"
                                    style={{ fontSize: 26, color: BLA, fontStyle: 'italic' }}
                                >
                                    {p.en}
                                </span>
                                <span style={{ fontSize: 26, color: '#94a3b8' }}>→</span>
                                <span
                                    className="font-display font-black"
                                    style={{ fontSize: 30, color: GRONN }}
                                >
                                    {p.no}
                                </span>
                                {(kjent || lite) && (
                                    <span
                                        className="ml-auto rounded-lg font-display font-bold text-white"
                                        style={{
                                            background: kjent ? GRONN : '#475569',
                                            fontSize: 18,
                                            padding: '2px 8px',
                                        }}
                                    >
                                        {kjent ? 'kjent' : 'ikke like populært'}
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
            <AnimatePresence mode="wait">
                {beat === 3 && (
                    <motion.div
                        key="lenke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 400 }}
                    >
                        <div
                            className="rounded-2xl bg-white shadow-lg font-display font-bold"
                            style={{
                                fontSize: 26,
                                color: '#334155',
                                padding: '8px 22px',
                                border: `4px solid ${GRONN}`,
                            }}
                        >
                            <span>Også kjent: </span>
                            <span style={{ color: GRONN, fontWeight: 900 }}>lenke</span>
                        </div>
                    </motion.div>
                )}
                {beat >= 4 && (
                    <motion.div
                        key="forslag"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 392, gap: 18 }}
                    >
                        <motion.div
                            initial={{ scale: 1.6, rotate: -8 }}
                            animate={{ scale: 1, rotate: -4 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                            className="rounded-2xl font-display font-black"
                            style={{
                                fontSize: 34,
                                color: '#b91c1c',
                                border: '5px solid #b91c1c',
                                padding: '6px 20px',
                                background: '#fff',
                            }}
                        >
                            BARE FORSLAG
                        </motion.div>
                        <div
                            className="rounded-2xl bg-white shadow-lg font-display font-bold"
                            style={{
                                fontSize: 22,
                                color: '#334155',
                                padding: '8px 18px',
                                width: 440,
                            }}
                        >
                            Andersen: et norsk ord betyr ikke alltid helt det samme som det engelske
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

/* ---------------- oversatt ---------------- */

function Ledd({
    ord,
    sprak,
    farge,
    forsinkelse = 0,
}: {
    ord: string;
    sprak: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 18 }}
            className="rounded-2xl bg-white shadow-xl flex flex-col items-center"
            style={{ padding: '10px 20px', borderBottom: `8px solid ${farge}` }}
        >
            <span className="font-display font-black" style={{ fontSize: 34, color: farge }}>
                {ord}
            </span>
            <span className="font-semibold" style={{ fontSize: 20, color: '#334155' }}>
                {sprak}
            </span>
        </motion.div>
    );
}

function Pil({ tekst, forsinkelse = 0 }: { tekst?: string; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
            className="flex flex-col items-center"
        >
            <span style={{ fontSize: 40, color: '#64748b', lineHeight: 1 }}>→</span>
            {tekst && (
                <span className="font-display font-bold" style={{ fontSize: 18, color: '#334155' }}>
                    {tekst}
                </span>
            )}
        </motion.div>
    );
}

function Bit({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <span
            className="rounded-xl font-display font-black text-white"
            style={{ background: farge, fontSize: 36, padding: '6px 18px' }}
        >
            {tekst}
        </span>
    );
}

function Oversatt({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="linear-gradient(180deg,#faf5ff,#ede9fe)">
            <Overskrift farge="#6d28d9">
                {beat === 0 || beat >= 3
                    ? 'Oversettelseslån: oversatt bit for bit'
                    : 'Oversettelseslån'}
            </Overskrift>
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-0 flex flex-col items-center"
                    style={{ top: 130, gap: 22 }}
                >
                    <div className="flex" style={{ gap: 10 }}>
                        <Bit tekst="bit 1" farge="#2563eb" />
                        <Bit tekst="bit 2" farge="#ea580c" />
                    </div>
                    <div className="font-semibold" style={{ fontSize: 22, color: '#64748b' }}>
                        ord i et annet språk
                    </div>
                    <div className="flex" style={{ gap: 90, fontSize: 40, color: '#64748b' }}>
                        <span>↓</span>
                        <span>↓</span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex"
                        style={{ gap: 10 }}
                    >
                        <Bit tekst="norsk 1" farge="#1d4ed8" />
                        <Bit tekst="norsk 2" farge="#c2410c" />
                    </motion.div>
                    <div className="font-semibold" style={{ fontSize: 22, color: '#64748b' }}>
                        vi låner ikke ordet, vi oversetter det
                    </div>
                </motion.div>
            )}
            {beat >= 1 && (
                <div
                    className="absolute inset-x-0 flex justify-center items-center"
                    style={{ top: 150, gap: 14 }}
                >
                    {beat >= 2 && (
                        <>
                            <Ledd ord="et gresk ord" sprak="gresk" farge="#0891b2" />
                            <Pil tekst="oversatt" forsinkelse={0.3} />
                        </>
                    )}
                    <Ledd ord="conscientia" sprak="latin" farge="#7c3aed" />
                    <Pil tekst="gjennom dansk" forsinkelse={0.4} />
                    <Ledd ord="samvittighet" sprak="norsk" farge="#b91c1c" forsinkelse={0.7} />
                </div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 flex justify-center items-center"
                    style={{ top: 330, gap: 18 }}
                >
                    <div className="flex flex-col items-center" style={{ gap: 6 }}>
                        <div className="flex" style={{ gap: 8 }}>
                            <Bit tekst="bear" farge="#2563eb" />
                            <Bit tekst="market" farge="#ea580c" />
                        </div>
                        <span className="font-semibold" style={{ fontSize: 18, color: '#64748b' }}>
                            engelsk
                        </span>
                    </div>
                    <span style={{ fontSize: 44, color: '#64748b' }}>→</span>
                    <div className="flex flex-col items-center" style={{ gap: 6 }}>
                        <div className="flex" style={{ gap: 8 }}>
                            <Bit tekst="bjørne" farge="#1d4ed8" />
                            <Bit tekst="marked" farge="#c2410c" />
                        </div>
                        <span className="font-semibold" style={{ fontSize: 18, color: '#64748b' }}>
                            norsk
                        </span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="rounded-2xl bg-white shadow-lg flex items-center"
                        style={{ padding: '8px 14px', gap: 8, marginLeft: 10 }}
                    >
                        <TrendingDown size={40} color="#b91c1c" strokeWidth={2.6} />
                        <span
                            className="font-display font-bold"
                            style={{ fontSize: 20, color: '#334155', width: 150 }}
                        >
                            prisene på aksjer faller
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </Flate>
    );
}

export function LanordVeier({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'flom';
    if (modus === 'veier') return <Veier beat={beat} />;
    if (modus === 'avloser') return <Avloser beat={beat} />;
    if (modus === 'oversatt') return <Oversatt beat={beat} />;
    return <Flom beat={beat} />;
}
