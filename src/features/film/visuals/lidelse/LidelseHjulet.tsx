import { useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * De indiske svarene, i fire modus:
 * - karma: en handling som går ut og kommer tilbake, ingen dommer, så hjulet samsara og
 *   veien ut av det.
 * - fortjent: har den som lider, fortjent det? Tidligere liv er skjult, dårlig karma vaskes
 *   bort, god karma gis videre, og mennesket velger.
 * - sannheter: buddhismens fire edle sannheter som fire kort, uten en gud i bildet.
 * - sikh: sikhismen mellom gruppene, én Gud over hjulet, og hukam som vei ut.
 */

type Modus = 'karma' | 'fortjent' | 'sannheter' | 'sikh';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function T({
    x,
    y,
    str = 36,
    farge = '#0f172a',
    vekt = 800,
    children,
}: {
    x: number;
    y: number;
    str?: number;
    farge?: string;
    vekt?: number;
    children: ReactNode;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            style={FONT}
        >
            {children}
        </text>
    );
}

function Inn({
    vis,
    children,
    forsinkelse = 0,
}: {
    vis: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

/** Vinkel som går rundt bare mens filmen spiller. */
function useVinkel(playing: boolean, fart: number) {
    const [v, setV] = useState(0);
    const sist = useRef(0);
    useAnimationFrame((tid) => {
        const dt = sist.current ? Math.min(tid - sist.current, 50) : 0;
        sist.current = tid;
        if (playing) setV((x) => (x + dt * fart) % 360);
    });
    return v;
}

const LOKKE = 'M 470 560 C 760 140, 1380 160, 1360 470 C 1340 760, 820 800, 520 610';

function Karma({ beat, playing }: { beat: number; playing: boolean }) {
    const vinkel = useVinkel(playing && beat >= 3, 0.04);
    const fase = beat >= 3 ? 'hjul' : 'handling';
    return (
        <AnimatePresence mode="wait">
            {fase === 'handling' ? (
                <motion.g
                    key="handling"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <T x={800} y={96} str={60} vekt={900}>
                        Karma = handling
                    </T>
                    {/* Mennesket */}
                    <g transform="translate(400 700)">
                        <circle cx={0} cy={-190} r={40} fill="#e0b98a" />
                        <path d="M -56 -140 Q 0 -158 56 -140 L 66 0 L -66 0 Z" fill="#b45309" />
                    </g>
                    {/* Handlingen går ut og kommer tilbake */}
                    <motion.path
                        d={LOKKE}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth={10}
                        strokeDasharray="4 22"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{
                            pathLength: beat >= 1 ? 1 : 0.12,
                            opacity: beat >= 2 ? 0.45 : 1,
                        }}
                        transition={{ duration: 2.4 }}
                    />
                    <motion.circle
                        r={30}
                        fill="#f59e0b"
                        stroke="#7c2d12"
                        strokeWidth={5}
                        initial={false}
                        animate={
                            beat >= 1
                                ? { cx: [470, 1060, 1360, 980, 520], cy: [560, 260, 470, 740, 610] }
                                : { cx: 520, cy: 520 }
                        }
                        transition={{ duration: beat >= 1 ? 2.6 : 0.4, ease: 'easeInOut' }}
                    />
                    <Inn vis={beat === 0}>
                        <T x={400} y={430} str={32} farge="#7c2d12">
                            det du gjør
                        </T>
                    </Inn>
                    <Inn vis={beat === 1} forsinkelse={1}>
                        <rect x={860} y={420} width={420} height={110} rx={24} fill="#ffffff" />
                        <T x={1070} y={466} str={32}>
                            slår tilbake på deg
                        </T>
                        <T x={1070} y={508} str={30} farge="#64748b" vekt={600}>
                            i dette livet eller et senere
                        </T>
                    </Inn>
                    {/* Ingen dommer */}
                    <Inn vis={beat === 2}>
                        <g transform="translate(1100 640)">
                            <rect
                                x={-170}
                                y={-130}
                                width={340}
                                height={130}
                                rx={10}
                                fill="#78350f"
                            />
                            <rect x={-200} y={-150} width={400} height={30} rx={8} fill="#92400e" />
                            <rect
                                x={-40}
                                y={-260}
                                width={80}
                                height={110}
                                rx={14}
                                fill="#a8a29e"
                                opacity={0.5}
                            />
                            <line
                                x1={-210}
                                y1={-280}
                                x2={210}
                                y2={20}
                                stroke="#dc2626"
                                strokeWidth={16}
                                strokeLinecap="round"
                            />
                            <line
                                x1={210}
                                y1={-280}
                                x2={-210}
                                y2={20}
                                stroke="#dc2626"
                                strokeWidth={16}
                                strokeLinecap="round"
                            />
                        </g>
                        <T x={1100} y={740} str={44} farge="#dc2626" vekt={900}>
                            Ingen dommer
                        </T>
                        <T x={1100} y={790} str={30} farge="#334155" vekt={700}>
                            ingen gud som må forsvares
                        </T>
                    </Inn>
                </motion.g>
            ) : (
                <motion.g
                    key="hjul"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <T x={800} y={96} str={60} vekt={900}>
                        {beat >= 4 ? 'Målet: ut av kretsløpet' : 'Samsara: kretsløpet'}
                    </T>
                    <g transform="translate(800 500)">
                        <circle r={250} fill="none" stroke="#fcd34d" strokeWidth={34} />
                        <g transform={`rotate(${vinkel})`}>
                            {[0, 120, 240].map((a) => (
                                <path
                                    key={a}
                                    d="M 0 -250 l -26 -24 l 0 48 Z"
                                    transform={`rotate(${a + 60})`}
                                    fill="#d97706"
                                />
                            ))}
                        </g>
                        {[
                            { a: -90, tekst: 'fødsel' },
                            { a: 30, tekst: 'død' },
                            { a: 150, tekst: 'ny fødsel' },
                        ].map((n) => {
                            const r = (n.a * Math.PI) / 180;
                            const x = Math.cos(r) * 250;
                            const y = Math.sin(r) * 250;
                            return (
                                <g key={n.tekst}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={76}
                                        fill="#ffffff"
                                        stroke="#d97706"
                                        strokeWidth={6}
                                    />
                                    <T x={x} y={y + 10} str={28}>
                                        {n.tekst}
                                    </T>
                                </g>
                            );
                        })}
                        <motion.g
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: beat >= 4 ? 1 : 0, y: beat >= 4 ? 0 : 30 }}
                            transition={{ duration: 0.8 }}
                        >
                            <motion.path
                                d="M 0 0 C 80 -120, 300 -200, 470 -260"
                                fill="none"
                                stroke="#0d9488"
                                strokeWidth={14}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: beat >= 4 ? 1 : 0 }}
                                transition={{ duration: 1.6, delay: 0.3 }}
                            />
                            <circle cx={0} cy={0} r={22} fill="#0d9488" />
                            <circle
                                cx={500}
                                cy={-270}
                                r={56}
                                fill="#ccfbf1"
                                stroke="#0d9488"
                                strokeWidth={6}
                            />
                            <T x={500} y={-258} str={36} farge="#0f766e" vekt={900}>
                                ut
                            </T>
                        </motion.g>
                    </g>
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Menneske({ x, y, farge = '#b45309' }: { x: number; y: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-190} r={40} fill="#e0b98a" />
            <path d="M -56 -140 Q 0 -158 56 -140 L 66 0 L -66 0 Z" fill={farge} />
        </g>
    );
}

/** Har den som lider, fortjent det? Fire beats, ett svar per beat. */
function Fortjent({ beat }: { beat: number }) {
    const titler = [
        'Har den som lider, fortjent det?',
        'Ingen vet hva et annet menneske gjorde før',
        'Karma er ingen låst dom',
        'God karma kan gis videre',
    ];
    const tittel = titler[Math.min(beat, 3)];
    // Den mørke kulen over mennesket: dårlig karma. Den krymper når den vaskes bort.
    const kule = beat >= 2 ? 0.35 : 1;
    return (
        <>
            <AnimatePresence mode="wait">
                <motion.g
                    key={tittel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <T x={800} y={96} str={beat === 1 ? 50 : 56} vekt={900}>
                        {tittel}
                    </T>
                </motion.g>
            </AnimatePresence>

            {/* Mennesket som lider */}
            <motion.g
                initial={false}
                animate={{ x: beat >= 3 ? -240 : 0 }}
                transition={{ duration: 0.9 }}
            >
                <Menneske x={800} y={760} />
                <motion.circle
                    cx={800}
                    cy={440}
                    r={70}
                    fill="#44403c"
                    initial={false}
                    animate={{ scale: kule, opacity: beat >= 3 ? 0.25 : 1 }}
                    transition={{ duration: 1.6, delay: beat === 2 ? 1 : 0 }}
                    style={{ transformOrigin: '800px 440px' }}
                />
                <Inn vis={beat === 0}>
                    <T x={800} y={466} str={80} farge="#fde68a" vekt={900}>
                        ?
                    </T>
                </Inn>
            </motion.g>

            {/* 0: vekta, fortjent eller ikke */}
            <Inn vis={beat === 0}>
                <rect
                    x={160}
                    y={560}
                    width={360}
                    height={110}
                    rx={26}
                    fill="#ffffff"
                    stroke="#dc2626"
                    strokeWidth={5}
                />
                <T x={340} y={630} str={40} farge="#7f1d1d" vekt={900}>
                    fortjent?
                </T>
            </Inn>

            {/* 1: tidligere liv bak et forheng */}
            <Inn vis={beat === 1}>
                {[220, 400, 1200, 1380].map((x, i) => (
                    <g key={x} opacity={0.5 - i * 0.05}>
                        <Menneske x={x} y={700} farge="#a8a29e" />
                    </g>
                ))}
                <rect
                    x={130}
                    y={420}
                    width={360}
                    height={300}
                    rx={24}
                    fill="#e7dfd0"
                    opacity={0.92}
                />
                <rect
                    x={1110}
                    y={420}
                    width={360}
                    height={300}
                    rx={24}
                    fill="#e7dfd0"
                    opacity={0.92}
                />
                <T x={310} y={600} str={110} farge="#a8a29e" vekt={900}>
                    ?
                </T>
                <T x={1290} y={600} str={110} farge="#a8a29e" vekt={900}>
                    ?
                </T>
                <T x={310} y={790} str={30} farge="#64748b" vekt={700}>
                    tidligere liv
                </T>
                <T x={1290} y={790} str={30} farge="#64748b" vekt={700}>
                    tidligere liv
                </T>
                <rect x={560} y={810} width={480} height={74} rx={22} fill="#1e293b" />
                <T x={800} y={860} str={36} farge="#fde68a" vekt={900}>
                    Mange sier nei
                </T>
            </Inn>

            {/* 2: ritualer og pilegrimsreiser vasker */}
            <Inn vis={beat === 2}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.path
                        key={i}
                        d="M 0 -18 Q 12 0 0 10 Q -12 0 0 -18 Z"
                        fill="#0ea5e9"
                        initial={false}
                        animate={
                            beat === 2
                                ? { y: [240, 420], opacity: [0, 1, 0] }
                                : { y: 240, opacity: 0 }
                        }
                        transition={{
                            duration: 1.4,
                            repeat: beat === 2 ? Infinity : 0,
                            delay: i * 0.28,
                        }}
                        style={{ x: 720 + i * 40 }}
                    />
                ))}
                <rect
                    x={150}
                    y={330}
                    width={420}
                    height={110}
                    rx={26}
                    fill="#ffffff"
                    stroke="#0ea5e9"
                    strokeWidth={5}
                />
                <T x={360} y={400} str={40} farge="#0c4a6e" vekt={900}>
                    ritualer
                </T>
                <rect
                    x={1030}
                    y={330}
                    width={420}
                    height={110}
                    rx={26}
                    fill="#ffffff"
                    stroke="#0ea5e9"
                    strokeWidth={5}
                />
                <T x={1240} y={400} str={40} farge="#0c4a6e" vekt={900}>
                    pilegrimsreiser
                </T>
                <T x={800} y={850} str={32} farge="#334155" vekt={700}>
                    i hinduismen: vasker bort dårlig karma
                </T>
            </Inn>

            {/* 3: god karma gis videre, og valget */}
            <Inn vis={beat >= 3}>
                <Menneske x={1040} y={760} farge="#0f766e" />
                <motion.circle
                    r={36}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={5}
                    initial={false}
                    animate={
                        beat >= 3
                            ? { cx: [1040, 800, 560], cy: [470, 360, 470] }
                            : { cx: 1040, cy: 470 }
                    }
                    transition={{ duration: 2.2, delay: 0.6, ease: 'easeInOut' }}
                />
                <T x={800} y={300} str={30} farge="#334155" vekt={700}>
                    i noen buddhistiske retninger
                </T>
                <rect x={430} y={810} width={740} height={80} rx={24} fill="#0d9488" />
                <T x={800} y={864} str={40} farge="#ffffff" vekt={900}>
                    Mennesket kan alltid velge
                </T>
            </Inn>
        </>
    );
}

const SANNHETER = [
    { tittel: 'Livet gjør vondt', tekst: 'alt tar slutt' },
    { tittel: 'Vi vil ha mer', tekst: 'hele tiden' },
    { tittel: 'Det kan ta slutt', tekst: 'lidelsen kan stoppe' },
    { tittel: 'Det finnes en vei', tekst: 'veien dit' },
];

function Tegning({ i }: { i: number }) {
    switch (i) {
        case 0:
            // Et lys som brenner ned
            return (
                <g>
                    <rect
                        x={-22}
                        y={-20}
                        width={44}
                        height={70}
                        rx={6}
                        fill="#fef3c7"
                        stroke="#92400e"
                        strokeWidth={4}
                    />
                    <path d="M 0 -60 Q 18 -38 0 -24 Q -18 -38 0 -60 Z" fill="#f59e0b" />
                    <path
                        d="M -22 30 Q -30 44 -18 50"
                        stroke="#fde68a"
                        strokeWidth={8}
                        fill="none"
                    />
                </g>
            );
        case 1:
            // En hånd som griper etter mer
            return (
                <g fill="none" stroke="#7c2d12" strokeWidth={6} strokeLinecap="round">
                    <path d="M -40 50 L -40 0 Q -40 -20 -24 -20 L -24 -50 M -24 -20 L -8 -56 M -8 -20 L 8 -54 M 8 -20 L 24 -46 M 24 -10 L 24 50" />
                    <path
                        d="M 46 -40 L 46 -10 M 31 -25 L 61 -25"
                        stroke="#dc2626"
                        strokeWidth={8}
                    />
                </g>
            );
        case 2:
            // Flammen slukket
            return (
                <g>
                    <circle r={50} fill="none" stroke="#0d9488" strokeWidth={6} />
                    <path
                        d="M -24 20 Q 0 -30 24 20"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={6}
                        strokeDasharray="6 8"
                    />
                </g>
            );
        default:
            // En vei mot horisonten
            return (
                <g>
                    <path d="M -50 54 L -8 -46 L 8 -46 L 50 54 Z" fill="#a8a29e" />
                    <path
                        d="M 0 44 L 0 26 M 0 10 L 0 -6 M 0 -20 L 0 -32"
                        stroke="#ffffff"
                        strokeWidth={6}
                    />
                </g>
            );
    }
}

/** Sikhismen: mellom gruppene, én Gud over hjulet, mennesket holdt fast, hukam som vei ut. */
function Sikh({ beat, playing }: { beat: number; playing: boolean }) {
    const vinkel = useVinkel(playing && beat >= 1, 0.03);
    const titler = [
        'Sikhismen: mellom to grupper',
        'Én Gud og karma',
        'Holdt fast i kretsløpet',
        'Veien ut: hukam',
    ];
    const tittel = titler[Math.min(beat, 3)];
    return (
        <>
            <AnimatePresence mode="wait">
                <motion.g
                    key={tittel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <T x={800} y={96} str={56} vekt={900}>
                        {tittel}
                    </T>
                </motion.g>
            </AnimatePresence>

            {/* 0: to grupper som overlapper, sikhismen i midten */}
            <Inn vis={beat === 0}>
                <circle cx={600} cy={500} r={260} fill="#2563eb" opacity={0.18} />
                <circle cx={1000} cy={500} r={260} fill="#d97706" opacity={0.2} />
                <T x={480} y={500} str={40} farge="#1e3a8a" vekt={900}>
                    Abrahamittiske
                </T>
                <T x={1120} y={500} str={40} farge="#92400e" vekt={900}>
                    Indiske
                </T>
                <rect x={690} y={460} width={220} height={80} rx={40} fill="#ea580c" />
                <T x={800} y={512} str={36} farge="#ffffff" vekt={900}>
                    Sikhisme
                </T>
            </Inn>

            {/* 1-3: hjulet med Gud over */}
            <Inn vis={beat >= 1}>
                <g transform="translate(700 540)">
                    <circle r={220} fill="none" stroke="#fcd34d" strokeWidth={30} />
                    <g transform={`rotate(${vinkel})`}>
                        {[0, 120, 240].map((a) => (
                            <path
                                key={a}
                                d="M 0 -220 l -24 -22 l 0 44 Z"
                                transform={`rotate(${a + 60})`}
                                fill="#d97706"
                            />
                        ))}
                    </g>
                    <T x={0} y={-20} str={34} farge="#92400e" vekt={900}>
                        karma og
                    </T>
                    <T x={0} y={24} str={34} farge="#92400e" vekt={900}>
                        gjenfødsel
                    </T>
                </g>
                <g transform="translate(1250 300)">
                    <motion.circle
                        r={90}
                        fill="#fef3c7"
                        initial={false}
                        animate={{ r: beat >= 1 ? [84, 100, 84] : 84 }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <circle r={66} fill="#ea580c" />
                    <T x={0} y={14} str={40} farge="#ffffff" vekt={900}>
                        Gud
                    </T>
                    <T x={0} y={140} str={30} farge="#334155" vekt={700}>
                        vet alt og kan alt
                    </T>
                </g>
            </Inn>

            {/* 2: mennesket holdt fast av tre ting */}
            <Inn vis={beat >= 2}>
                <motion.g
                    initial={false}
                    animate={{ x: beat >= 3 ? 330 : 0, y: beat >= 3 ? -40 : 0 }}
                    transition={{ duration: 1.6, delay: beat >= 3 ? 0.8 : 0 }}
                >
                    <g transform="translate(700 320) scale(0.6)">
                        <circle cx={0} cy={-190} r={40} fill="#e0b98a" />
                        <path d="M -56 -140 Q 0 -158 56 -140 L 66 0 L -66 0 Z" fill="#b45309" />
                    </g>
                </motion.g>
                <Inn vis={beat === 2}>
                    {[
                        { ord: 'lyster', x: 330, y: 400 },
                        { ord: 'egoisme', x: 300, y: 560 },
                        { ord: 'uvitenhet', x: 350, y: 720 },
                    ].map((o) => (
                        <g key={o.ord}>
                            <line
                                x1={o.x + 110}
                                y1={o.y - 12}
                                x2={680}
                                y2={300}
                                stroke="#78716c"
                                strokeWidth={6}
                                strokeDasharray="10 10"
                            />
                            <rect
                                x={o.x - 120}
                                y={o.y - 50}
                                width={240}
                                height={76}
                                rx={20}
                                fill="#ffffff"
                                stroke="#dc2626"
                                strokeWidth={5}
                            />
                            <T x={o.x} y={o.y} str={34} farge="#7f1d1d" vekt={900}>
                                {o.ord}
                            </T>
                        </g>
                    ))}
                    <T x={1250} y={800} str={30} farge="#334155" vekt={700}>
                        egoisme: bare tenke på seg selv
                    </T>
                </Inn>
            </Inn>

            {/* 3: hukam, å leve slik Gud vil, og nåden */}
            <Inn vis={beat >= 3}>
                <motion.path
                    d="M 720 300 Q 860 200 1000 260"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth={12}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                    transition={{ duration: 1.4, delay: 0.4 }}
                />
                <rect x={130} y={720} width={760} height={120} rx={28} fill="#0d9488" />
                <T x={510} y={774} str={38} farge="#ffffff" vekt={900}>
                    hukam: leve slik Gud vil
                </T>
                <T x={510} y={818} str={28} farge="#ccfbf1" vekt={700}>
                    og få del i Guds nåde, en gave
                </T>
            </Inn>
        </>
    );
}

function Sannheter({ beat }: { beat: number }) {
    const vist = (i: number) => (i <= 1 ? beat >= i + 1 : i === 2 ? beat >= 3 : beat >= 3);
    return (
        <>
            <T x={800} y={96} str={56} vekt={900}>
                {beat === 0 ? 'Buddhismen snur oppgaven' : 'De fire edle sannhetene'}
            </T>
            <Inn vis={beat === 0}>
                <rect x={180} y={180} width={560} height={160} rx={28} fill="#e2e8f0" />
                <T x={460} y={252} str={40} farge="#64748b">
                    Forklare lidelsen?
                </T>
                <line
                    x1={230}
                    y1={262}
                    x2={690}
                    y2={236}
                    stroke="#dc2626"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <T x={460} y={304} str={26} farge="#64748b" vekt={600}>
                    det de abrahamittiske må
                </T>
                <rect x={860} y={180} width={560} height={160} rx={28} fill="#d97706" />
                <T x={1140} y={252} str={40} farge="#ffffff">
                    Starte med den
                </T>
                <T x={1140} y={304} str={26} farge="#fff7ed" vekt={600}>
                    lidelsen er utgangspunktet
                </T>
            </Inn>
            {SANNHETER.map((s, i) => {
                const x = 140 + i * 340;
                const y = beat === 0 ? 420 : 300;
                const på = vist(i);
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ y: y - 300, opacity: på ? 1 : 0.35 }}
                        transition={{ duration: 0.7 }}
                    >
                        <rect
                            x={x}
                            y={300}
                            width={300}
                            height={400}
                            rx={30}
                            fill={på ? '#ffffff' : '#ece5d8'}
                            stroke={på && beat === i + 1 ? '#d97706' : '#d6cfc0'}
                            strokeWidth={på && beat === i + 1 ? 8 : 3}
                        />
                        <circle cx={x + 150} cy={370} r={40} fill={på ? '#d97706' : '#d6cfc0'} />
                        <T x={x + 150} y={386} str={44} farge="#ffffff" vekt={900}>
                            {i + 1}
                        </T>
                        {på && (
                            <>
                                <g transform={`translate(${x + 150} 510)`}>
                                    <Tegning i={i} />
                                </g>
                                <T x={x + 150} y={624} str={34} vekt={900}>
                                    {s.tittel}
                                </T>
                                <T x={x + 150} y={668} str={28} farge="#64748b" vekt={600}>
                                    {s.tekst}
                                </T>
                            </>
                        )}
                    </motion.g>
                );
            })}
            <Inn vis={beat >= 4}>
                <rect x={430} y={760} width={740} height={104} rx={28} fill="#1e293b" />
                <T x={800} y={828} str={48} farge="#fde68a" vekt={900}>
                    Ingen gud nevnes
                </T>
            </Inn>
        </>
    );
}

export function LidelseHjulet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'karma';
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'sannheter' ? '#f5efe4' : '#fdf6e9' }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'karma' ? (
                    <Karma beat={beat} playing={playing} />
                ) : modus === 'fortjent' ? (
                    <Fortjent beat={beat} />
                ) : modus === 'sikh' ? (
                    <Sikh beat={beat} playing={playing} />
                ) : (
                    <Sannheter beat={beat} />
                )}
            </svg>
        </div>
    );
}
