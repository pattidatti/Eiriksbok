import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Isfjellet: det alle ser over vannet (påskuddet) og det som ligger under (den egentlige
 * årsaken). Samme bilde brukes for Thukydid, Cæsar, armadaen og hybrid krigføring.
 * Den skjulte delen står mørk med et spørsmålstegn til beaten der den avsløres.
 */

type Modus = 'thukydid' | 'rubicon' | 'armada' | 'hybrid';

const B = 1600;
const H = 900;
const VANN = 400;

interface Kort {
    fraBeat: number;
    overskrift: string;
    linjer: string[];
}

interface Oppsett {
    tittel: string;
    brikke: { tekst: string; fraBeat: number; tilBeat?: number };
    topp: Kort;
    bunn: Kort;
    sider?: number;
    ekstra?: 'skip' | 'elv' | 'sporsmal' | 'bok';
    ekstraFra?: number;
}

const OPPSETT: Record<Modus, Oppsett> = {
    thukydid: {
        tittel: 'Peloponneserkrigen: Athen mot Sparta',
        brikke: { tekst: 'Thukydid ser under overflaten', fraBeat: 0, tilBeat: 0 },
        ekstra: 'bok',
        ekstraFra: 0,
        topp: { fraBeat: 1, overskrift: 'Gnisten', linjer: ['Angrepet på Potideia'] },
        bunn: {
            fraBeat: 2,
            overskrift: 'Den egentlige årsaken',
            linjer: ['Sparta er bekymret:', 'Athen blir stadig mektigere'],
        },
        sider: 3,
    },
    rubicon: {
        tittel: 'Cæsar ved Rubicon, 49 f.Kr.',
        brikke: { tekst: 'Hæren krysser elva Rubicon', fraBeat: 0, tilBeat: 0 },
        ekstra: 'elv',
        ekstraFra: 0,
        topp: {
            fraBeat: 1,
            overskrift: 'Det Cæsar sa',
            linjer: ['Forsvare rettighetene', 'til tribunene'],
        },
        bunn: {
            fraBeat: 2,
            overskrift: 'Det som skjedde',
            linjer: ['Et statskupp:', 'makta tatt med våpen'],
        },
        sider: 2,
    },
    armada: {
        tittel: 'Den spanske armada, 1588',
        brikke: { tekst: 'Religion: den vanligste grunnen til krig', fraBeat: 0, tilBeat: 0 },
        ekstra: 'skip',
        ekstraFra: 1,
        topp: {
            fraBeat: 2,
            overskrift: 'Det Filip sa',
            linjer: ['Gjøre England katolsk igjen', 'Hevne Maria Stuart'],
        },
        bunn: {
            fraBeat: 3,
            overskrift: 'Det Filip også ville',
            linjer: ['Stoppe England', 'før det blir for sterkt på havet'],
        },
        sider: 3,
    },
    hybrid: {
        tittel: 'Hybrid krigføring',
        brikke: { tekst: 'Midt mellom krig og fred', fraBeat: 0, tilBeat: 0 },
        ekstra: 'sporsmal',
        ekstraFra: 3,
        topp: { fraBeat: 1, overskrift: 'Det alle ser', linjer: ['Alt ser fredelig ut'] },
        bunn: {
            fraBeat: 2,
            overskrift: 'Det som skjer',
            linjer: ['Digitale angrep', 'Forsøk på å påvirke hva folk mener'],
        },
    },
};

const TOPP_STI =
    'M 690 400 L 735 318 L 772 262 L 812 228 L 846 270 L 880 300 L 918 352 L 942 400 Z';
const BUNN_STI =
    'M 600 400 L 942 400 L 1060 430 L 1170 520 L 1210 640 L 1150 760 L 980 840 L 760 856 L 560 800 L 430 690 L 420 560 L 490 450 Z';

export function CasusIsfjell({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const o = OPPSETT[props.modus ?? 'thukydid'];
    const avslort = beat >= o.bunn.fraBeat;
    const brikkeVis =
        beat >= o.brikke.fraBeat && (o.brikke.tilBeat === undefined || beat <= o.brikke.tilBeat);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e8f1f8' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="casus-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#dbeafe" />
                        <stop offset="1" stopColor="#f1f5f9" />
                    </linearGradient>
                    <linearGradient id="casus-hav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#3b82c4" />
                        <stop offset="1" stopColor="#0c2a4a" />
                    </linearGradient>
                </defs>
                <rect x={0} y={0} width={B} height={VANN} fill="url(#casus-himmel)" />
                <rect x={0} y={VANN} width={B} height={H - VANN} fill="url(#casus-hav)" />

                {/* Den skjulte delen: mørk til den avsløres */}
                <motion.path
                    d={BUNN_STI}
                    initial={false}
                    animate={{
                        fill: avslort ? '#bfe3f5' : '#1e4b72',
                        opacity: avslort ? 0.95 : 0.8,
                    }}
                    transition={{ duration: 1.2 }}
                    stroke={avslort ? '#e0f2fe' : '#2f6390'}
                    strokeWidth={3}
                />
                <AnimatePresence>
                    {!avslort && (
                        <motion.text
                            key="sporsmal"
                            x={815}
                            y={680}
                            textAnchor="middle"
                            fontSize={200}
                            fontWeight={900}
                            fill="#5b8bb5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            exit={{ opacity: 0 }}
                        >
                            ?
                        </motion.text>
                    )}
                </AnimatePresence>
                <path d={TOPP_STI} fill="#ffffff" stroke="#bcd4e6" strokeWidth={3} />
                <line x1={0} x2={B} y1={VANN} y2={VANN} stroke="#93c5fd" strokeWidth={4} />

                {o.ekstra === 'skip' && beat >= (o.ekstraFra ?? 0) && <Flaate />}
                {o.ekstra === 'elv' && <Elv beat={beat} />}

                {o.sider !== undefined && beat >= o.sider && (
                    <g>
                        <Sidelapp y={250} tekst="DET DE SIER" farge="#0f172a" />
                        <Sidelapp y={470} tekst="DET SOM" farge="#fef3c7" />
                        <Sidelapp y={515} tekst="DRIVER DEM" farge="#fef3c7" />
                    </g>
                )}
            </svg>

            {/* Tittel øverst til venstre */}
            <div
                className="absolute left-[3%] top-[4%] px-5 py-2 rounded-xl bg-white/90 shadow-lg font-black text-slate-800"
                style={{ fontSize: '1.7rem' }}
            >
                {o.tittel}
            </div>

            <AnimatePresence>
                {brikkeVis && (
                    <motion.div
                        key="brikke"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute right-[3%] bottom-[5%] px-5 py-2 rounded-xl bg-slate-900/85 text-white font-bold"
                        style={{ fontSize: '1.45rem' }}
                    >
                        {o.brikke.tekst}
                    </motion.div>
                )}
            </AnimatePresence>

            {o.ekstra === 'bok' && beat === 0 && <Bokrull />}

            <AnimatePresence>
                {beat >= o.topp.fraBeat && (
                    <KortBoks key="topp" kort={o.topp} style={{ left: '61%', top: '20%' }} lys />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= o.bunn.fraBeat && (
                    <KortBoks
                        key="bunn"
                        kort={o.bunn}
                        style={{ left: '50%', top: '60%', transform: 'translateX(-50%)' }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {o.ekstra === 'sporsmal' && beat >= (o.ekstraFra ?? 99) && (
                    <motion.div
                        key="nar"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute left-[4%] top-[22%] px-6 py-4 rounded-2xl bg-amber-400 text-slate-900 font-black shadow-xl"
                        style={{ fontSize: '2.2rem', lineHeight: 1.15 }}
                    >
                        Når startet
                        <br />
                        krigen?
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KortBoks({ kort, style, lys }: { kort: Kort; style: React.CSSProperties; lys?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className={`absolute px-6 py-4 rounded-2xl shadow-2xl text-center ${
                lys ? 'bg-white text-slate-900' : 'bg-amber-300 text-slate-900'
            }`}
            style={{ ...style, maxWidth: '34%' }}
        >
            <div
                className={`font-bold uppercase tracking-wide ${lys ? 'text-sky-700' : 'text-amber-900'}`}
                style={{ fontSize: '1.15rem' }}
            >
                {kort.overskrift}
            </div>
            {kort.linjer.map((l) => (
                <div
                    key={l}
                    className="font-black"
                    style={{ fontSize: '1.75rem', lineHeight: 1.2 }}
                >
                    {l}
                </div>
            ))}
        </motion.div>
    );
}

function Sidelapp({ y, tekst, farge }: { y: number; tekst: string; farge: string }) {
    return (
        <motion.text
            x={70}
            y={y}
            fontSize={42}
            fontWeight={900}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Armadaen: små seilskip som glir over havflaten fra venstre. */
function Flaate() {
    return (
        <g>
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.g
                    key={i}
                    initial={{ x: -300 - i * 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 3, delay: i * 0.25, ease: 'easeOut' }}
                >
                    <g
                        transform={`translate(${120 + i * 95} ${VANN - 4 - (i % 2) * 10}) scale(${0.9 + (i % 3) * 0.1})`}
                    >
                        <path d="M -38 0 L 38 0 L 28 16 L -28 16 Z" fill="#7c2d12" />
                        <line x1={0} y1={0} x2={0} y2={-64} stroke="#44403c" strokeWidth={4} />
                        <path d="M 2 -60 L 30 -38 L 2 -14 Z" fill="#fef3c7" stroke="#a8a29e" />
                        <path d="M -2 -56 L -26 -34 L -2 -14 Z" fill="#fef3c7" stroke="#a8a29e" />
                        <rect x={-2} y={-74} width={16} height={10} fill="#dc2626" />
                    </g>
                </motion.g>
            ))}
        </g>
    );
}

/** Rubicon: ei lita elv på overflaten, og hæren som en rekke skjold som krysser den. */
function Elv({ beat }: { beat: number }) {
    return (
        <g>
            <path
                d="M 70 404 C 160 396, 250 414, 340 404 L 340 416 C 250 426, 160 408, 70 416 Z"
                fill="#60a5fa"
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.rect
                    key={i}
                    width={18}
                    height={30}
                    rx={4}
                    y={VANN - 30}
                    fill="#b91c1c"
                    stroke="#fde68a"
                    strokeWidth={2}
                    initial={{ x: 20 + i * 26 }}
                    animate={{ x: beat >= 0 ? 260 + i * 26 : 20 + i * 26 }}
                    transition={{ duration: 3.5, delay: 0.5 + i * 0.15, ease: 'easeInOut' }}
                />
            ))}
        </g>
    );
}

/** Thukydid: en bokrull, for han skrev det ned. */
function Bokrull() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="absolute left-[4%] top-[22%] px-6 py-4 rounded-2xl shadow-xl font-serif text-amber-950"
            style={{
                background: '#f5e6c4',
                border: '3px solid #b45309',
                fontSize: '1.6rem',
                maxWidth: '30%',
            }}
        >
            <div className="font-bold">Thukydid</div>
            <div style={{ fontSize: '1.2rem' }}>skrev historien om krigen</div>
        </motion.div>
    );
}
