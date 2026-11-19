import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tid og rammer i statsbudsjettet. Fire moduser:
 * - aaret: budsjettåret fra mars til 1. januar, med en markør som flytter seg.
 * - ramme: en fast ramme. Mer til én ting presser noe annet sammen. Penger kan ikke flyttes ut.
 * - milliard: én milliard i samme målestokk mot folketrygden og mot politiet.
 * - revidert: året etter vedtaket, med endringer i mai og desember og regnskapet til slutt.
 */

type Modus = 'aaret' | 'ramme' | 'milliard' | 'revidert';

const OVERSKRIFT: Record<Modus, string[]> = {
    aaret: [
        'Omtrent ett år med arbeid',
        'Alle vil ha penger',
        'Mars',
        'August',
        'Oktober',
        'November til 1. januar',
    ],
    ramme: [
        '30. november: rammene',
        'Bare innenfor rammen',
        'Mer her = mindre der',
        'Hvor henter du pengene?',
    ],
    milliard: [
        'Over 2000 milliarder',
        'Mer til én ting, mindre til noe annet',
        'Én milliard i folketrygden',
        'Én milliard hos politiet',
    ],
    revidert: [
        'Budsjettet gjelder',
        'Verden står ikke stille',
        'Mai: revidert nasjonalbudsjett',
        'Desember og regnskapet',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <Flate>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 18 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold shadow-xl"
                        style={{ fontSize: 30 }}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Flate>
    );
}

function Svg({ children }: { children: ReactNode }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
        >
            {children}
        </svg>
    );
}

const fram = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

/** Et kort med tekst, der bredden måles ut fra den lengste linja. */
function Kort({
    x,
    y,
    linjer,
    farge,
    str = 30,
    forsinkelse = 0.3,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge: string;
    str?: number;
    forsinkelse?: number;
}) {
    const w = Math.max(...linjer.map((l) => l.length)) * str * 0.56 + 44;
    const h = linjer.length * str * 1.25 + 28;
    // Hold kortet inne i bildet.
    const cx = Math.min(1580 - w / 2, Math.max(20 + w / 2, x));
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: forsinkelse }}
        >
            <rect
                x={cx - w / 2}
                y={y}
                width={w}
                height={h}
                rx={16}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={cx}
                    y={y + 14 + str + i * str * 1.25}
                    textAnchor="middle"
                    fontSize={str}
                    fontWeight={i === 0 ? 900 : 700}
                    fill="#0f172a"
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

// ---------- tidslinjer ----------

interface Hendelse {
    pos: number;
    linjer: string[];
    fraBeat: number;
    over: boolean;
    farge: string;
    /** Ekstra avstand fra linja, for kort som ellers kolliderer. */
    lavt?: boolean;
}

function Tidslinje({
    maaneder,
    hendelser,
    beat,
    markor,
    farge,
}: {
    maaneder: string[];
    hendelser: Hendelse[];
    beat: number;
    markor: number;
    farge: string;
}) {
    const X0 = 140;
    const X1 = 1460;
    const Y = 470;
    const x = (i: number) => X0 + ((X1 - X0) * i) / (maaneder.length - 1);
    return (
        <Svg>
            <line
                x1={X0}
                x2={X1}
                y1={Y}
                y2={Y}
                stroke="#334155"
                strokeWidth={8}
                strokeLinecap="round"
            />
            {maaneder.map((m, i) => (
                <g key={m + i}>
                    <circle cx={x(i)} cy={Y} r={9} fill="#334155" />
                    <text
                        x={x(i)}
                        y={Y + 62}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#475569"
                    >
                        {m}
                    </text>
                </g>
            ))}
            <AnimatePresence>
                {hendelser
                    // Når en beat har flere nye kort, viker de gamle for dem.
                    .filter(
                        (h) =>
                            beat >= h.fraBeat &&
                            (h.fraBeat === beat ||
                                hendelser.filter((n) => n.fraBeat === beat).length < 2)
                    )
                    .map((h) => {
                        const dempet = beat !== h.fraBeat;
                        const STR = 30;
                        const kortH = h.linjer.length * STR * 1.25 + 28;
                        const avstand = h.lavt ? 180 : h.over ? 60 : 80;
                        return (
                            <motion.g
                                key={h.linjer[0]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: dempet ? 0.55 : 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <line
                                    x1={x(h.pos)}
                                    x2={x(h.pos)}
                                    y1={h.over ? Y : Y + 72}
                                    y2={h.over ? Y - avstand : Y + avstand + 10}
                                    stroke={h.farge}
                                    strokeWidth={5}
                                />
                                <Kort
                                    x={x(h.pos)}
                                    y={h.over ? Y - avstand - kortH : Y + avstand + 10}
                                    linjer={h.linjer}
                                    farge={h.farge}
                                    str={STR}
                                    forsinkelse={0.1}
                                />
                            </motion.g>
                        );
                    })}
            </AnimatePresence>
            <motion.g
                initial={false}
                animate={{ x: x(markor) }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
                <circle cx={0} cy={Y} r={26} fill={farge} stroke="#fff" strokeWidth={6} />
            </motion.g>
        </Svg>
    );
}

const AARET_MND = ['mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des', 'jan'];
const AARET: Hendelse[] = [
    {
        pos: 0,
        linjer: ['Marskonferansen', 'omtrent hvor mye hvert', 'departement skal få'],
        fraBeat: 2,
        over: true,
        farge: '#2563eb',
    },
    {
        pos: 5,
        linjer: ['Augustkonferansen', 'penger til nye saker'],
        fraBeat: 3,
        over: false,
        farge: '#7c3aed',
    },
    {
        pos: 7,
        linjer: ['Forslaget og finanstalen', 'senest 6 dager etter at', 'Stortinget åpner'],
        fraBeat: 4,
        over: true,
        farge: '#ca8a04',
    },
    { pos: 8, linjer: ['Partiene', 'forhandler'], fraBeat: 5, over: false, farge: '#dc2626' },
    { pos: 9, linjer: ['Stortinget', 'stemmer'], fraBeat: 5, over: true, farge: '#16a34a' },
    {
        pos: 10,
        linjer: ['1. januar', 'budsjettet gjelder'],
        fraBeat: 5,
        over: false,
        farge: '#0f172a',
        lavt: true,
    },
];

const DEPARTEMENTER = ['Helsedepartementet', 'Kunnskapsdepartementet', 'og alle de andre'];

function Aaret({ beat }: { beat: number }) {
    const markor = beat <= 2 ? 0 : beat === 3 ? 5 : beat === 4 ? 7 : 10;
    return (
        <>
            <Tidslinje
                maaneder={AARET_MND}
                hendelser={AARET}
                beat={beat}
                markor={markor}
                farge="#ca8a04"
            />
            {beat === 1 && (
                <Svg>
                    <motion.g {...fram}>
                        {DEPARTEMENTER.map((d, i) => (
                            <Kort
                                key={d}
                                x={330 + i * 470}
                                y={150}
                                linjer={[d]}
                                farge="#64748b"
                                str={30}
                                forsinkelse={0.2 + i * 0.4}
                            />
                        ))}
                        <Kort
                            x={800}
                            y={640}
                            linjer={['Finansdepartementet', 'holder styr på helheten']}
                            farge="#ca8a04"
                            str={30}
                            forsinkelse={1.6}
                        />
                    </motion.g>
                </Svg>
            )}
            {beat === 0 && (
                <Svg>
                    <motion.g {...fram} transition={{ delay: 0.5 }}>
                        <Kort
                            x={800}
                            y={620}
                            linjer={['Her er de viktigste', 'stegene i året']}
                            farge="#ca8a04"
                            str={32}
                        />
                    </motion.g>
                </Svg>
            )}
        </>
    );
}

const REV_MND = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mai',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'des',
];
const REVIDERT: Hendelse[] = [
    {
        pos: 0,
        linjer: ['Gjelder fra 1. januar', 'regjeringen må følge det'],
        fraBeat: 0,
        over: true,
        farge: '#2563eb',
    },
    {
        pos: 4,
        linjer: ['Revidert nasjonalbudsjett', 'de største endringene'],
        fraBeat: 2,
        over: false,
        farge: '#ea580c',
    },
    { pos: 11, linjer: ['Siste justering'], fraBeat: 3, over: true, farge: '#16a34a' },
];

function Revidert({ beat }: { beat: number }) {
    const markor = beat <= 1 ? 0 : beat === 2 ? 4 : 11;
    return (
        <>
            <Tidslinje
                maaneder={REV_MND}
                hendelser={REVIDERT}
                beat={beat}
                markor={markor}
                farge="#2563eb"
            />
            <Svg>
                <AnimatePresence>
                    {beat === 0 && (
                        <motion.g key="etater" {...fram}>
                            <Kort
                                x={520}
                                y={680}
                                linjer={['Politiet', 'sin del']}
                                farge="#1e3a8a"
                                str={30}
                                forsinkelse={0.6}
                            />
                            <Kort
                                x={1080}
                                y={680}
                                linjer={['Et universitet', 'sin del']}
                                farge="#0891b2"
                                str={30}
                                forsinkelse={1.0}
                            />
                        </motion.g>
                    )}
                    {beat === 1 && (
                        <motion.g key="uventet" {...fram}>
                            <Kort
                                x={380}
                                y={680}
                                linjer={['Prisene stiger']}
                                farge="#dc2626"
                                str={32}
                                forsinkelse={0.3}
                            />
                            <Kort
                                x={800}
                                y={680}
                                linjer={['En krig']}
                                farge="#dc2626"
                                str={32}
                                forsinkelse={0.9}
                            />
                            <Kort
                                x={1220}
                                y={680}
                                linjer={['En pandemi']}
                                farge="#dc2626"
                                str={32}
                                forsinkelse={1.5}
                            />
                        </motion.g>
                    )}
                    {beat >= 3 && (
                        <motion.g key="regnskap" {...fram}>
                            <Kort
                                x={1130}
                                y={660}
                                linjer={['Regnskapet', 'hva pengene faktisk', 'ble brukt til']}
                                farge="#0f172a"
                                str={30}
                                forsinkelse={1.6}
                            />
                        </motion.g>
                    )}
                </AnimatePresence>
            </Svg>
        </>
    );
}

// ---------- ramme ----------

const RAMME = { x: 470, y: 230, w: 660, h: 420 };
const VEGG = 16;

function hoyderFor(beat: number) {
    if (beat <= 0) return [0, 0, 0];
    if (beat === 1) return [1 / 3, 1 / 3, 1 / 3];
    if (beat === 2) return [0.52, 0.18, 0.3];
    return [0.6, 0.12, 0.28];
}

const BLOKKER = [
    { navn: 'Det du lovet', farge: '#f59e0b' },
    { navn: 'Noe annet', farge: '#3b82f6' },
    { navn: 'Noe tredje', farge: '#14b8a6' },
];

function Ramme({ beat }: { beat: number }) {
    const indre = {
        x: RAMME.x + VEGG,
        y: RAMME.y + VEGG,
        w: RAMME.w - 2 * VEGG,
        h: RAMME.h - 2 * VEGG,
    };
    const andeler = hoyderFor(beat);
    const plass = andeler.map((a, i) => ({
        y: indre.y + andeler.slice(0, i).reduce((s, b) => s + b, 0) * indre.h,
        h: a * indre.h,
    }));
    return (
        <Svg>
            {/* Nabo-rammene: andre områder */}
            {[
                { x: 110, navn: 'Et annet', navn2: 'område' },
                { x: 1210, navn: 'Et tredje', navn2: 'område' },
            ].map((n) => (
                <g key={n.x}>
                    <rect
                        x={n.x}
                        y={330}
                        width={280}
                        height={220}
                        rx={8}
                        fill="#e2e8f0"
                        stroke="#64748b"
                        strokeWidth={10}
                    />
                    <text
                        x={n.x + 140}
                        y={430}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#475569"
                    >
                        {n.navn}
                    </text>
                    <text
                        x={n.x + 140}
                        y={468}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#475569"
                    >
                        {n.navn2}
                    </text>
                </g>
            ))}
            <motion.rect
                x={RAMME.x + VEGG / 2}
                y={RAMME.y + VEGG / 2}
                width={RAMME.w - VEGG}
                height={RAMME.h - VEGG}
                rx={10}
                fill="#ffffff"
                strokeWidth={VEGG}
                initial={false}
                animate={{ stroke: beat >= 3 ? '#dc2626' : '#0f172a' }}
                transition={{ duration: 0.6 }}
            />
            {BLOKKER.map((b, i) => (
                <g key={b.navn}>
                    <motion.rect
                        x={indre.x + 6}
                        width={indre.w - 12}
                        rx={10}
                        fill={b.farge}
                        initial={{ y: indre.y + indre.h, height: 0 }}
                        animate={{ y: plass[i].y + 4, height: Math.max(0, plass[i].h - 8) }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                    />
                    {beat >= 1 && (
                        <motion.text
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            x={indre.x + indre.w / 2}
                            y={plass[i].y + plass[i].h / 2 + 12}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#fff"
                        >
                            {b.navn}
                        </motion.text>
                    )}
                </g>
            ))}
            {beat >= 2 && (
                <motion.g {...fram} transition={{ delay: 1.1 }}>
                    <circle
                        cx={RAMME.x + RAMME.w - 70}
                        cy={plass[0].y + plass[0].h / 2}
                        r={30}
                        fill="#fff"
                    />
                    <text
                        x={RAMME.x + RAMME.w - 70}
                        y={plass[0].y + plass[0].h / 2 + 18}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#16a34a"
                    >
                        +
                    </text>
                    <circle
                        cx={RAMME.x + RAMME.w - 70}
                        cy={plass[1].y + plass[1].h / 2}
                        r={Math.min(30, plass[1].h / 2 - 4)}
                        fill="#fff"
                    />
                    <text
                        x={RAMME.x + RAMME.w - 70}
                        y={plass[1].y + plass[1].h / 2 + 16}
                        textAnchor="middle"
                        fontSize={Math.min(56, plass[1].h)}
                        fontWeight={900}
                        fill="#dc2626"
                    >
                        −
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g {...fram} transition={{ delay: 1.2 }}>
                    <line x1={400} x2={460} y1={440} y2={440} stroke="#dc2626" strokeWidth={8} />
                    <line x1={1140} x2={1200} y1={440} y2={440} stroke="#dc2626" strokeWidth={8} />
                    <text
                        x={430}
                        y={410}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#dc2626"
                    >
                        ✕
                    </text>
                    <text
                        x={1170}
                        y={410}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#dc2626"
                    >
                        ✕
                    </text>
                </motion.g>
            )}
            <text
                x={RAMME.x + RAMME.w / 2}
                y={RAMME.y + RAMME.h + 56}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                Rammen: fast sum for ett område
            </text>
            {beat >= 1 && (
                <motion.text
                    {...fram}
                    x={RAMME.x + RAMME.w / 2}
                    y={RAMME.y - 24}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#64748b"
                >
                    Tenkt eksempel
                </motion.text>
            )}
        </Svg>
    );
}

// ---------- milliard ----------

/** Sidelengde i px for et kvadrat med areal etter milliarder, i samme målestokk. */
const STOR = 600;
const side = (mrd: number) => STOR * Math.sqrt(mrd / 744);

function Milliard({ beat }: { beat: number }) {
    if (beat <= 1) {
        // Hele budsjettet som én flate, delt i to. En liten bit flytter seg.
        const x0 = 450;
        const y0 = 150;
        const W = 700;
        const H = 620;
        const flyttet = beat >= 1;
        return (
            <Svg>
                {!flyttet && <rect x={x0} y={y0} width={W} height={H} rx={10} fill="#cbd5e1" />}
                {flyttet && (
                    <>
                        <rect x={x0} y={y0} width={W / 2 - 6} height={H} rx={10} fill="#f59e0b" />
                        <rect
                            x={x0 + W / 2 + 6}
                            y={y0}
                            width={W / 2 - 6}
                            height={H}
                            rx={10}
                            fill="#3b82f6"
                        />
                    </>
                )}
                {flyttet && (
                    <motion.g {...fram} transition={{ delay: 0.3 }}>
                        <text
                            x={x0 + W / 4}
                            y={y0 + 70}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Én ting
                        </text>
                        <text
                            x={x0 + (3 * W) / 4}
                            y={y0 + 70}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Noe annet
                        </text>
                    </motion.g>
                )}
                <motion.rect
                    width={14}
                    height={14}
                    fill="#dc2626"
                    stroke="#fff"
                    strokeWidth={2}
                    initial={false}
                    animate={{ x: flyttet ? x0 + W / 2 - 60 : x0 + W / 2 + 40, y: y0 + H / 2 }}
                    transition={{ duration: 1.4, delay: 0.6 }}
                />
                {!flyttet && (
                    <motion.g {...fram} transition={{ delay: 0.8 }}>
                        <Kort
                            x={x0 + W + 170}
                            y={y0 + H / 2 - 50}
                            linjer={['Den røde prikken:', 'noen hundre', 'millioner']}
                            farge="#dc2626"
                            str={28}
                        />
                        <text
                            x={x0 + W / 2}
                            y={y0 + H + 60}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            Hele flaten: over 2000 milliarder
                        </text>
                    </motion.g>
                )}
                {flyttet && (
                    <motion.g {...fram} transition={{ delay: 1.8 }}>
                        <Kort
                            x={x0 + (3 * W) / 4}
                            y={y0 + H / 2 + 60}
                            linjer={['Noen merker', 'kuttet']}
                            farge="#dc2626"
                            str={30}
                        />
                    </motion.g>
                )}
            </Svg>
        );
    }
    const s1 = side(744);
    const s2 = side(32);
    const m = side(1);
    const y0 = 170;
    const xFt = 260;
    const xPol = 1120;
    return (
        <Svg>
            <rect x={xFt} y={y0} width={s1} height={s1} rx={6} fill="#ea580c" />
            <text
                x={xFt + s1 / 2}
                y={y0 + s1 / 2}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#fff"
            >
                Folketrygden
            </text>
            <text
                x={xFt + s1 / 2}
                y={y0 + s1 / 2 + 54}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#ffedd5"
            >
                744 milliarder
            </text>
            <rect
                x={xFt + s1 - m - 30}
                y={y0 + 30}
                width={m}
                height={m}
                fill="#facc15"
                stroke="#0f172a"
                strokeWidth={3}
            />
            <Kort
                x={xFt + s1 / 2}
                y={y0 + 70}
                linjer={['Gul rute = 1 milliard', 'en bitteliten del']}
                farge="#ca8a04"
                str={28}
                forsinkelse={0.8}
            />
            {beat >= 3 && (
                <motion.g {...fram}>
                    <rect x={xPol} y={y0 + s1 - s2} width={s2} height={s2} rx={4} fill="#1e3a8a" />
                    <rect
                        x={xPol + s2 - m - 10}
                        y={y0 + s1 - s2 + 10}
                        width={m}
                        height={m}
                        fill="#facc15"
                        stroke="#0f172a"
                        strokeWidth={3}
                    />
                    <text
                        x={xPol + s2 / 2}
                        y={y0 + s1 - s2 - 70}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Politiet
                    </text>
                    <text
                        x={xPol + s2 / 2}
                        y={y0 + s1 - s2 - 24}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#334155"
                    >
                        32 milliarder
                    </text>
                    <Kort
                        x={xPol + s2 / 2}
                        y={y0 + s1 - s2 - 230}
                        linjer={['1 milliard her:', 'ganske mye']}
                        farge="#1e3a8a"
                        str={30}
                        forsinkelse={0.9}
                    />
                </motion.g>
            )}
            <text
                x={800}
                y={y0 + s1 + 64}
                textAnchor="middle"
                fontSize={28}
                fontWeight={700}
                fill="#64748b"
            >
                Arealet viser beløpet. Samme målestokk.
            </text>
        </Svg>
    );
}

export function StatsbudsjettRamme({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'aaret';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            {modus === 'aaret' && <Aaret beat={beat} />}
            {modus === 'ramme' && <Ramme beat={beat} />}
            {modus === 'milliard' && <Milliard beat={beat} />}
            {modus === 'revidert' && <Revidert beat={beat} />}
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
