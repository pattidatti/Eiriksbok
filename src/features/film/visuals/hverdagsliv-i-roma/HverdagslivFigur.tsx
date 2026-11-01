import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Etikett, Inn, Kryss, Overskrift, Person } from './felles';
import { B, H } from './mal';

/**
 * Skole og klær, tegnet i SVG. «tavle»: hvem fikk skole, den greske læreren og vokstavla.
 * «pedagog»: slaven som fulgte gutten, ordet pedagog og retorikken. «tunika»: klær som viste
 * hvem du var. «toga»: halvsirkelen av ull og hvordan den ble lagt rundt kroppen.
 */

type Modus = 'tavle' | 'pedagog' | 'tunika' | 'toga';

const OVERSKRIFT: Record<Modus, string[]> = {
    tavle: [
        'Skolen kom fra Hellas',
        'Hvem fikk mest skole?',
        'En gresk tjener fra barnet var lite',
        'Vokstavle og stylus',
        'Glatt ut og start på nytt',
    ],
    pedagog: [
        'Paedagogus',
        'Til og fra skolen',
        'Paedagogus blir pedagog',
        'Retorikk: kunsten å tale',
        'Talen som våpen',
    ],
    tunika: ['Klærne viste hvem du var', 'Tunika: som en lang skjorte', 'Fargen viste rangen'],
    toga: [
        'Toga over tunikaen',
        'En halv sirkel av stoff',
        'Ull: tung å bære',
        'Slik ble den lagt',
        'Bare for borgere',
    ],
};

const HVIT = '#f8f5ec';
const BRUN = '#8b6b4a';

/* ---------- Tavle ---------- */

function Talerstol({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-110} y={-40} width={220} height={40} fill="#cdbb9b" />
            <rect
                x={-90}
                y={0}
                width={180}
                height={140}
                fill="#e2d6bc"
                stroke="#8b7f66"
                strokeWidth={4}
            />
        </g>
    );
}

function Lydbuer({ x, y }: { x: number; y: number }) {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.path
                    key={i}
                    d={`M${x + 40 + i * 40},${y - 50 - i * 20} C${x + 70 + i * 50},${y - 10} ${x + 70 + i * 50},${y + 10} ${x + 40 + i * 40},${y + 50 + i * 20}`}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={8}
                    strokeLinecap="round"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                />
            ))}
        </g>
    );
}

const BOKSTAVER = [
    'M520,560 L520,400 L580,400 C620,400 620,470 580,470 L520,470 M570,470 L620,560',
    'M700,480 C700,390 800,390 800,480 C800,570 700,570 700,480',
    'M870,560 L870,400 L930,500 L990,400 L990,560',
    'M1060,560 L1110,400 L1160,560 M1080,500 L1140,500',
];

function Vokstavle({ beat }: { beat: number }) {
    const glatt = beat >= 4;
    return (
        <g>
            <rect x={400} y={300} width={880} height={360} rx={20} fill="#8b5a2b" />
            <rect x={440} y={340} width={800} height={280} rx={8} fill="#3f3a2a" />
            {BOKSTAVER.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#e9d8a6"
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: glatt ? 0 : 1 }}
                    transition={{
                        pathLength: { duration: 0.9, delay: i * 0.8 },
                        opacity: { duration: 0.8, delay: glatt ? 0.6 + i * 0.3 : 0 },
                    }}
                />
            ))}
            {/* Stylusen: spiss i den ene enden, flat i den andre */}
            <motion.g
                initial={{ x: 0, y: 0 }}
                animate={glatt ? { x: [0, 600, 0], y: [0, 40, 0] } : { x: [0, 560], y: [0, 0] }}
                transition={{ duration: glatt ? 3 : 3.2, repeat: glatt ? Infinity : 0 }}
            >
                <g
                    transform={
                        glatt ? 'translate(470 420) rotate(-60)' : 'translate(540 380) rotate(30)'
                    }
                >
                    <rect
                        x={-8}
                        y={-200}
                        width={16}
                        height={190}
                        fill="#d6d3d1"
                        stroke="#57534e"
                        strokeWidth={3}
                    />
                    <path d="M-8,-10 L8,-10 L0,20 Z" fill="#57534e" />
                    <rect x={-22} y={-214} width={44} height={18} rx={4} fill="#a8a29e" />
                </g>
            </motion.g>
            <Etikett
                x={840}
                y={740}
                tekst={glatt ? 'Streng og hard disiplin' : 'Stylus: en spiss penn'}
                str={42}
            />
        </g>
    );
}

function Tavle({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#eee7d8" />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Gresk søyle og en taler */}
                        {[260, 1340].map((x) => (
                            <g key={x}>
                                <rect
                                    x={x - 50}
                                    y={240}
                                    width={100}
                                    height={500}
                                    fill={HVIT}
                                    stroke="#a8a29e"
                                    strokeWidth={4}
                                />
                                {[0, 1, 2, 3].map((k) => (
                                    <line
                                        key={k}
                                        x1={x - 30 + k * 20}
                                        y1={260}
                                        x2={x - 30 + k * 20}
                                        y2={720}
                                        stroke="#d6d3d1"
                                        strokeWidth={4}
                                    />
                                ))}
                                <rect x={x - 70} y={220} width={140} height={30} fill="#e7e5e4" />
                            </g>
                        ))}
                        <Person x={760} y={600} s={1.1} kropp={HVIT} />
                        <Talerstol x={760} y={620} />
                        <Lydbuer x={790} y={420} />
                        <Etikett x={480} y={290} tekst="Hellas" str={44} />
                        <Pil x1={580} y1={276} x2={960} y2={276} />
                        <Etikett x={1080} y={290} tekst="Roma" str={44} />
                        <Etikett x={800} y={850} tekst="Talekunst var viktig" str={44} />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g
                        key="b1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {[
                            { e: 'Rik gutt', l: 700, k: HVIT, t: 'gikk lengst' },
                            { e: 'Rik jente', l: 400, k: HVIT, t: 'kortere' },
                        ].map((r, i) => (
                            <g key={r.e}>
                                <Person x={200} y={440 + i * 260} s={0.62} kropp={r.k} />
                                <Etikett
                                    x={290}
                                    y={390 + i * 260}
                                    tekst={r.e}
                                    str={38}
                                    anker="start"
                                />
                                <Etikett
                                    x={520 + r.l + 30}
                                    y={392 + i * 260}
                                    tekst={r.t}
                                    str={36}
                                    anker="start"
                                />
                                <motion.rect
                                    x={520}
                                    y={350 + i * 260}
                                    height={60}
                                    rx={12}
                                    fill="#0f766e"
                                    initial={{ width: 0 }}
                                    animate={{ width: r.l }}
                                    transition={{ duration: 1.2, delay: 0.3 + i * 0.3 }}
                                />
                            </g>
                        ))}
                        <Etikett
                            x={800}
                            y={850}
                            tekst="Barna i rike familier fikk mest skole"
                            str={38}
                            farge="#475569"
                        />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        key="b2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Person x={620} y={760} s={1.2} kropp={BRUN} />
                        <Person x={900} y={760} s={0.6} kropp={HVIT} />
                        <Etikett x={620} y={830} tekst="Gresk tjener eller slave" str={38} />
                        <Etikett x={940} y={830} tekst="Barnet" str={38} />
                        <rect
                            x={760}
                            y={240}
                            width={360}
                            height={140}
                            rx={30}
                            fill="#fff"
                            stroke="#475569"
                            strokeWidth={5}
                        />
                        <path
                            d="M820,380 L780,440 L870,380 Z"
                            fill="#fff"
                            stroke="#475569"
                            strokeWidth={5}
                        />
                        <text
                            x={940}
                            y={340}
                            textAnchor="middle"
                            fontSize={84}
                            fontWeight={800}
                            fill="#1d4ed8"
                        >
                            Α Β Γ
                        </text>
                        <Etikett x={1340} y={450} tekst="Barnet lærte gresk" str={40} />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="b3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Vokstavle beat={beat} />
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/* ---------- Pedagog ---------- */

function Skolehus({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-160}
                y={-260}
                width={320}
                height={260}
                fill="#efe3cc"
                stroke="#8b7355"
                strokeWidth={5}
            />
            <path d="M-190,-260 L0,-360 L190,-260 Z" fill="#b4532a" />
            <rect x={-50} y={-130} width={100} height={130} fill="#5b4632" />
        </g>
    );
}

function Pedagog({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                <rect width={B} height={H} fill="#dbe7ee" />
                <rect y={720} width={B} height={180} fill="#9a9081" />
                <Skolehus x={1340} y={720} />
                <Etikett x={1340} y={330} tekst="Skolen" str={42} />
                {/* Huset der gutten bor */}
                <rect
                    x={60}
                    y={420}
                    width={240}
                    height={300}
                    fill="#f5ecd8"
                    stroke="#8b7355"
                    strokeWidth={5}
                />
                <path d="M40,420 L180,350 L320,420 Z" fill="#b4532a" />
                <motion.g
                    initial={{ x: 0 }}
                    animate={{ x: beat === 1 ? [0, 760, 760, 0] : 0 }}
                    transition={
                        beat === 1
                            ? { duration: 7, repeat: Infinity, times: [0, 0.45, 0.55, 1] }
                            : {}
                    }
                >
                    <Person x={420} y={760} s={1.05} kropp={BRUN} />
                    <Person x={530} y={760} s={0.6} kropp={HVIT} />
                    {beat === 0 && (
                        <>
                            <Etikett x={420} y={840} tekst="Slave familien stolte på" str={36} />
                            <Etikett x={560} y={590} tekst="Rik gutt" str={36} />
                        </>
                    )}
                </motion.g>
                {beat === 1 && (
                    <Etikett x={800} y={860} tekst="Og passet på at han oppførte seg" str={38} />
                )}
            </g>
        );
    }
    if (beat === 2) {
        return (
            <g>
                <rect width={B} height={H} fill="#eee7d8" />
                <motion.text
                    x={800}
                    y={400}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#7c2d12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    paedagogus
                </motion.text>
                <motion.path
                    d="M800,450 L800,560"
                    stroke="#475569"
                    strokeWidth={12}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8 }}
                />
                <path d="M770,540 L800,590 L830,540 Z" fill="#475569" />
                <motion.text
                    x={800}
                    y={720}
                    textAnchor="middle"
                    fontSize={140}
                    fontWeight={900}
                    fill="#0f766e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    pedagog
                </motion.text>
                <Etikett x={800} y={820} tekst="= lærer" str={52} />
            </g>
        );
    }
    return (
        <g>
            <rect width={B} height={H} fill="#eee7d8" />
            {/* Et halvsirkel-rom med tilhørere */}
            <path d="M200,800 C200,400 1400,400 1400,800 Z" fill="#e2d6bc" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = Math.PI * (0.15 + (i / 7) * 0.7);
                return (
                    <Person
                        key={i}
                        x={800 - Math.cos(a) * 520}
                        y={790 - Math.sin(a) * 200}
                        s={0.55}
                        kropp={beat >= 4 ? HVIT : i % 2 ? BRUN : HVIT}
                    />
                );
            })}
            <Person x={800} y={800} s={1.1} kropp={HVIT} />
            <Lydbuer x={830} y={600} />
            {beat === 3 && (
                <Etikett x={800} y={300} tekst="Folk lytter og blir overbevist" str={42} />
            )}
            {beat >= 4 && (
                <Inn>
                    {/* En stor bygning med søyler: makta i Roma */}
                    <path
                        d="M420,250 L800,150 L1180,250 Z"
                        fill="#e7e5e4"
                        stroke="#a8a29e"
                        strokeWidth={4}
                    />
                    {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                        <rect
                            key={k}
                            x={450 + k * 112}
                            y={250}
                            width={44}
                            height={200}
                            fill="#f5f5f4"
                            stroke="#a8a29e"
                            strokeWidth={3}
                        />
                    ))}
                    <Etikett x={800} y={875} tekst="Viktig for den som ville styre" str={42} />
                </Inn>
            )}
        </g>
    );
}

/* ---------- Klær ---------- */

/** Figur i tunika. */
function Tunika({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M-20,-150 L-22,0 M20,-150 L22,0"
                stroke="#57402c"
                strokeWidth={16}
                strokeLinecap="round"
            />
            <path
                d="M-70,-420 L70,-420 L110,-340 L80,-320 L64,-360 L74,-130 L-74,-130 L-64,-360 L-80,-320 L-110,-340 Z"
                fill={farge}
                stroke="#57534e"
                strokeWidth={4}
            />
            <rect x={-70} y={-260} width={140} height={14} fill="#78350f" />
            <circle cx={0} cy={-460} r={40} fill="#e7c4a0" />
            <path d="M-40,-466 C-40,-512 40,-512 40,-466 Z" fill="#3f2a1d" />
        </g>
    );
}

/** Figur i toga: tunikaen under, og togaen over venstre skulder. */
function Toga({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <Tunika x={0} y={0} farge={HVIT} />
            <path
                d="M70,-420 C40,-300 -60,-200 -80,-60 L60,-60 C60,-200 40,-260 -20,-300 C-60,-330 -80,-380 -70,-420 Z"
                fill="#fffbeb"
                stroke="#78716c"
                strokeWidth={4}
            />
            <path
                d="M0,-400 C20,-330 40,-260 30,-120 M-40,-330 C-10,-250 0,-180 -10,-80"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth={5}
            />
        </g>
    );
}

function Klaer({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#eee7d8" />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* T-skjorte og jeans i dag */}
                        <g transform="translate(480 800)">
                            <path
                                d="M-24,-250 L-30,0 M24,-250 L30,0"
                                stroke="#1d4ed8"
                                strokeWidth={36}
                                strokeLinecap="round"
                            />
                            <path
                                d="M-80,-500 L80,-500 L130,-430 L95,-400 L72,-430 L72,-240 L-72,-240 L-72,-430 L-95,-400 L-130,-430 Z"
                                fill="#94a3b8"
                            />
                            <circle cx={0} cy={-540} r={40} fill="#e7c4a0" />
                        </g>
                        <Etikett x={480} y={870} tekst="Milliardær i dag" str={40} />
                        <Etikett x={480} y={200} tekst="Kan se ut som alle andre" str={38} />
                        <Inn forsinkelse={0.8}>
                            <Toga x={1120} y={800} s={1.05} />
                            <Etikett x={1120} y={870} tekst="Rik romer" str={40} />
                            <Etikett x={1120} y={200} tekst="Alle ser hvem han er" str={38} />
                        </Inn>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g
                        key="b1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Tunika x={800} y={820} farge="#d6c7a8" s={1.15} />
                        <Etikett x={1150} y={420} tekst="Tunika" str={52} />
                        <Etikett x={1150} y={480} tekst="grunnplagget" str={40} />
                    </motion.g>
                )}
                {beat >= 2 && (
                    <motion.g
                        key="b2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Tunika x={520} y={800} farge={HVIT} s={1.05} />
                        <Etikett x={520} y={870} tekst="Hvitt: overklassen" str={42} />
                        <Inn forsinkelse={0.6}>
                            <Tunika x={1080} y={800} farge={BRUN} s={1.05} />
                            <Etikett
                                x={1080}
                                y={870}
                                tekst="Ubleket eller brunt: alle andre"
                                str={42}
                            />
                        </Inn>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/** Halvsirkelen av stoff, med mål. */
function Halvsirkel({ beat }: { beat: number }) {
    return (
        <g>
            <motion.path
                d="M260,640 A540,380 0 0 1 1340,640 Z"
                fill="#fffbeb"
                stroke="#78716c"
                strokeWidth={6}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ transformOrigin: '800px 640px' }}
                transition={{ duration: 1 }}
            />
            {beat === 1 && (
                <Inn forsinkelse={0.8}>
                    <line x1={260} y1={720} x2={1340} y2={720} stroke="#b91c1c" strokeWidth={6} />
                    <line x1={260} y1={700} x2={260} y2={740} stroke="#b91c1c" strokeWidth={6} />
                    <line x1={1340} y1={700} x2={1340} y2={740} stroke="#b91c1c" strokeWidth={6} />
                    <Etikett x={800} y={790} tekst="ca. 5,5 meter lang" str={44} farge="#b91c1c" />
                    <line x1={1420} y1={260} x2={1420} y2={640} stroke="#b91c1c" strokeWidth={6} />
                    <line x1={1400} y1={260} x2={1440} y2={260} stroke="#b91c1c" strokeWidth={6} />
                    <line x1={1400} y1={640} x2={1440} y2={640} stroke="#b91c1c" strokeWidth={6} />
                    <Etikett
                        x={1400}
                        y={220}
                        tekst="ca. 1,7 meter bred"
                        str={40}
                        farge="#b91c1c"
                        anker="end"
                    />
                </Inn>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.3}>
                    {/* Vekt som trykker stoffet ned */}
                    <path d="M700,380 L900,380 L940,560 L660,560 Z" fill="#475569" />
                    <rect x={760} y={340} width={80} height={40} rx={10} fill="#334155" />
                    <text
                        x={800}
                        y={500}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={900}
                        fill="#f8fafc"
                    >
                        TUNG
                    </text>
                    <Etikett x={800} y={790} tekst="Laget av ull" str={44} />
                </Inn>
            )}
        </g>
    );
}

const DRAPERING = [
    { tekst: 'Over venstre skulder', x: 1000, y: 330, px: 885, py: 335 },
    { tekst: 'Rundt ryggen', x: 1000, y: 520, px: 870, py: 520 },
    { tekst: 'Under høyre arm', x: 600, y: 480, anker: 'end' as const, px: 700, py: 470 },
    { tekst: 'Høyre arm er fri', x: 600, y: 330, anker: 'end' as const, px: 715, py: 400 },
];

function TogaScene({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={B} height={H} fill="#eee7d8" />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="b0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Tunika x={500} y={820} farge={HVIT} s={1.05} />
                        <Etikett x={500} y={880} tekst="Tunika" str={40} />
                        <Toga x={1100} y={820} s={1.05} />
                        <Etikett x={1100} y={880} tekst="Tunika + toga" str={40} />
                        <Pil x1={660} y1={520} x2={920} y2={520} />
                    </motion.g>
                )}
                {(beat === 1 || beat === 2) && (
                    <motion.g
                        key="b12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Halvsirkel beat={beat} />
                    </motion.g>
                )}
                {beat === 3 && (
                    <motion.g
                        key="b3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Tunika x={800} y={840} farge={HVIT} s={1.15} />
                        {/* Togaen tegnes opp: venstre skulder (til høyre i bildet), rundt ryggen, under høyre arm */}
                        <motion.path
                            d="M880,330 C900,420 880,520 840,600 C760,640 700,560 690,470 C700,420 760,380 860,360"
                            fill="none"
                            stroke="#fffbeb"
                            strokeWidth={60}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 4 }}
                        />
                        <motion.path
                            d="M880,330 C900,420 880,520 840,600 C760,640 700,560 690,470 C700,420 760,380 860,360"
                            fill="none"
                            stroke="#a8a29e"
                            strokeWidth={4}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 4 }}
                        />
                        {DRAPERING.map((d, i) => (
                            <motion.line
                                key={`l${d.tekst}`}
                                x1={d.anker ? d.x + 10 : d.x - 10}
                                y1={d.y - 12}
                                x2={d.px}
                                y2={d.py}
                                stroke="#475569"
                                strokeWidth={5}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 1.1 }}
                            />
                        ))}
                        {DRAPERING.map((d, i) => (
                            <motion.text
                                key={d.tekst}
                                x={d.x}
                                y={d.y}
                                textAnchor={d.anker ?? 'start'}
                                fontSize={40}
                                fontWeight={800}
                                fill="#0f172a"
                                stroke="#fbf7ee"
                                strokeWidth={8}
                                paintOrder="stroke"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 1.1 }}
                            >
                                {d.tekst}
                            </motion.text>
                        ))}
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g
                        key="b4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <g transform="translate(420 520)">
                            {/* Løpende figur, krysset over */}
                            <circle cx={0} cy={-150} r={34} fill="#e7c4a0" />
                            <path
                                d="M0,-110 L-10,10 M-10,10 L-70,90 M-10,10 L50,100 M-6,-80 L-70,-30 M-6,-80 L60,-50"
                                stroke="#57534e"
                                strokeWidth={18}
                                strokeLinecap="round"
                                fill="none"
                            />
                            <Kryss x={0} y={-30} r={170} />
                        </g>
                        <Etikett x={420} y={820} tekst="Kan ikke løpe eller arbeide" str={38} />
                        <Toga x={1120} y={800} s={1.05} />
                        <rect x={1240} y={300} width={240} height={70} rx={20} fill="#0f766e" />
                        <text
                            x={1360}
                            y={348}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#fff"
                        >
                            Borger
                        </text>
                        <Etikett x={1120} y={870} tekst="Et rangmerke" str={40} />
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

function Pil({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return (
        <g>
            <line
                x1={x1}
                y1={y1}
                x2={x2 - 20}
                y2={y2}
                stroke="#475569"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path
                d={`M${x2},${y2} L${x2 - 34},${y2 - 22} L${x2 - 34},${y2 + 22} Z`}
                fill="#475569"
            />
        </g>
    );
}

export function HverdagslivFigur({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tavle';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 bg-[#eee7d8]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'tavle' && <Tavle beat={beat} />}
                {modus === 'pedagog' && <Pedagog beat={beat} />}
                {modus === 'tunika' && <Klaer beat={beat} />}
                {modus === 'toga' && <TogaScene beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
