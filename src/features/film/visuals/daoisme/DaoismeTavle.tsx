import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * 2D-tavle til daoisme-filmen (1600x900).
 * - «tosvar»: samme kaos, to svar. Konfucius setter folk i rekker, daoistene løsner grepet.
 * - «boka»: Daodejing med 81 vers, paradokset, og dao som kart i stedet for lov.
 * - «kritikk»: innvendingene mot daoismen.
 */
type Modus = 'tosvar' | 'boka' | 'kritikk';

const OVERSKRIFT: Record<Modus, string[]> = {
    tosvar: [
        'Samme kaos, to svar',
        'Konfucius: mer form og mer øving',
        'Daoistene: reglene har ødelagt alt',
        'Daoistene: jo mer fyrstene grep inn, jo verre',
        'Reparere, eller løsne grepet?',
    ],
    boka: [
        'Daodejing: 81 korte vers',
        'Vers 1 åpner med et paradoks',
        '81 vers som prøver likevel',
        'Chad Hansen: dao er mer et kart enn en lov',
        'Du må selv se hvor terrenget gir etter',
    ],
    kritikk: [
        'Kritikk: blir wu wei en unnskyldning?',
        'Konfusianerne: daoistene trakk seg unna',
        'Zhuangzi: alt har grenser og setter grenser',
        'Noen mener: daoismen er best som motvekt',
    ],
};

function Figur({
    x,
    y,
    farge,
    skala = 1,
}: {
    x: number;
    y: number;
    farge: string;
    skala?: number;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ x, y, scale: skala }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
            <circle cx={0} cy={-26} r={13} fill={farge} style={{ transition: 'fill 0.6s' }} />
            <path
                d="M -16 14 Q -16 -10 0 -10 Q 16 -10 16 14 Z"
                fill={farge}
                style={{ transition: 'fill 0.6s' }}
            />
        </motion.g>
    );
}

// Tolv personer: kaos, rekker og en elv.
const KAOS: [number, number][] = [
    [90, 120],
    [260, 90],
    [420, 150],
    [150, 260],
    [330, 240],
    [520, 210],
    [80, 400],
    [240, 380],
    [450, 350],
    [560, 420],
    [180, 500],
    [380, 480],
];
const REKKER: [number, number][] = Array.from({ length: 12 }, (_, i) => [
    110 + (i % 4) * 150,
    150 + Math.floor(i / 4) * 150,
]);
const ELV: [number, number][] = Array.from({ length: 12 }, (_, i) => [
    70 + i * 47,
    320 + Math.sin(i * 0.7) * 120,
]);

function Tosvar({ beat }: { beat: number }) {
    const venstreAktiv = beat === 1 || beat >= 4;
    const hoyreAktiv = beat >= 2;
    const tau = beat >= 2 && beat <= 3;
    return (
        <>
            {[0, 1].map((side) => (
                <g key={side} transform={`translate(${side === 0 ? 60 : 830} 165)`}>
                    <rect width={710} height={680} rx={36} fill="#ffffff" opacity={0.95} />
                    <rect
                        width={710}
                        height={70}
                        rx={36}
                        fill={side === 0 ? '#7c3aed' : '#0d9488'}
                        opacity={(side === 0 ? venstreAktiv : hoyreAktiv) || beat === 0 ? 1 : 0.35}
                    />
                    <text
                        x={355}
                        y={48}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        {side === 0 ? 'Konfucius' : 'Daoistene'}
                    </text>
                    <g transform="translate(10 60)">
                        {(side === 0 ? (beat >= 1 ? REKKER : KAOS) : beat >= 4 ? ELV : KAOS).map(
                            ([x, y], i) => (
                                <Figur
                                    key={i}
                                    x={x}
                                    y={y}
                                    farge={
                                        side === 0
                                            ? beat >= 1
                                                ? '#7c3aed'
                                                : '#64748b'
                                            : beat === 3
                                              ? '#dc2626'
                                              : beat >= 4
                                                ? '#0d9488'
                                                : '#64748b'
                                    }
                                />
                            )
                        )}
                        {side === 0 && beat >= 1 && (
                            <g>
                                {[0, 1, 2].map((r) => (
                                    <motion.line
                                        key={r}
                                        x1={60}
                                        x2={630}
                                        y1={170 + r * 150}
                                        y2={170 + r * 150}
                                        stroke="#7c3aed"
                                        strokeWidth={5}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.8 + r * 0.3 }}
                                    />
                                ))}
                            </g>
                        )}
                        {side === 1 && tau && (
                            <g>
                                {Array.from({ length: beat === 3 ? 14 : 7 }, (_, i) => (
                                    <motion.line
                                        key={i}
                                        x1={20 + ((i * 97) % 640)}
                                        y1={60}
                                        x2={20 + ((i * 211 + 300) % 640)}
                                        y2={520}
                                        stroke={beat === 3 ? '#b91c1c' : '#94a3b8'}
                                        strokeWidth={beat === 3 ? 6 : 4}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.8 }}
                                        transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                                    />
                                ))}
                            </g>
                        )}
                    </g>
                    <AnimatePresence>
                        {((side === 0 && beat >= 1) || (side === 1 && beat >= 2)) && (
                            <motion.g
                                key={`${side}-${beat >= 4 ? 'slutt' : side === 1 && beat === 3 ? 'verre' : 'start'}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <rect
                                    x={40}
                                    y={590}
                                    width={630}
                                    height={70}
                                    rx={20}
                                    fill={
                                        side === 0 ? '#ede9fe' : beat === 3 ? '#fee2e2' : '#ccfbf1'
                                    }
                                />
                                <text
                                    x={355}
                                    y={637}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#0f172a"
                                >
                                    {side === 0
                                        ? beat >= 4
                                            ? 'Reparere samfunnet'
                                            : 'Lær folk de riktige skikkene'
                                        : beat >= 4
                                          ? 'Løsne grepet'
                                          : beat === 3
                                            ? 'Mer styring: verre'
                                            : 'Regler, makt og ære'}
                                </text>
                            </motion.g>
                        )}
                    </AnimatePresence>
                </g>
            ))}
        </>
    );
}

function Boka({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <>
                <g transform="translate(110 170)">
                    {Array.from({ length: 81 }, (_, i) => {
                        const x = (i % 9) * 66;
                        const y = Math.floor(i / 9) * 66;
                        const lys = beat === 2 || (beat === 1 && i === 0);
                        return (
                            <motion.rect
                                key={i}
                                x={x}
                                y={y}
                                width={56}
                                height={56}
                                rx={8}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, fill: lys ? '#0d9488' : '#e7dcc3' }}
                                transition={{
                                    delay: beat === 0 ? i * 0.02 : beat === 2 ? i * 0.03 : 0.2,
                                    duration: 0.3,
                                }}
                                stroke={i === 0 && beat === 1 ? '#0f766e' : '#c4b48f'}
                                strokeWidth={i === 0 && beat === 1 ? 6 : 2}
                            />
                        );
                    })}
                </g>
                <AnimatePresence mode="wait">
                    {beat === 1 ? (
                        <motion.g
                            key="paradoks"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <line
                                x1={166}
                                y1={198}
                                x2={760}
                                y2={330}
                                stroke="#0f766e"
                                strokeWidth={4}
                            />
                            <rect x={760} y={220} width={760} height={380} rx={30} fill="#ffffff" />
                            <text x={800} y={290} fontSize={34} fontWeight={800} fill="#0f766e">
                                Paradoks: noe som ser ut til
                            </text>
                            <text x={800} y={332} fontSize={34} fontWeight={800} fill="#0f766e">
                                å motsi seg selv
                            </text>
                            {[
                                'Veien som kan forklares',
                                'med ord, er ikke den',
                                'virkelige veien.',
                            ].map((l, i) => (
                                <text
                                    key={l}
                                    x={800}
                                    y={420 + i * 56}
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {l}
                                </text>
                            ))}
                        </motion.g>
                    ) : (
                        <motion.g
                            key="tall"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <text
                                x={1150}
                                y={460}
                                textAnchor="middle"
                                fontSize={200}
                                fontWeight={900}
                                fill="#0d9488"
                            >
                                81
                            </text>
                            <text
                                x={1150}
                                y={540}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={800}
                                fill="#334155"
                            >
                                {beat === 2
                                    ? 'vers som prøver likevel'
                                    : 'korte vers, nesten som dikt'}
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
            </>
        );
    }
    // Lov mot kart.
    return (
        <>
            <g transform="translate(80 170)">
                <rect
                    width={640}
                    height={660}
                    rx={32}
                    fill="#ffffff"
                    opacity={beat === 4 ? 0.55 : 0.95}
                />
                <text
                    x={320}
                    y={70}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#b91c1c"
                >
                    En lov
                </text>
                <rect x={300} y={140} width={22} height={460} fill="#78716c" />
                {[
                    { y: 180, t: 'GÅ HIT', retning: 1 },
                    { y: 320, t: 'STOPP', retning: -1 },
                    { y: 460, t: 'GJØR SLIK', retning: 1 },
                ].map((s) => (
                    <g key={s.t} transform={`translate(${s.retning === 1 ? 322 : 300} ${s.y})`}>
                        <path
                            d={
                                s.retning === 1
                                    ? 'M 0 0 L 230 0 L 270 45 L 230 90 L 0 90 Z'
                                    : 'M 0 0 L -230 0 L -270 45 L -230 90 L 0 90 Z'
                            }
                            fill="#dc2626"
                        />
                        <text
                            x={s.retning === 1 ? 115 : -125}
                            y={58}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {s.t}
                        </text>
                    </g>
                ))}
                <text
                    x={320}
                    y={640}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill="#475569"
                >
                    roper ordrer til deg
                </text>
            </g>
            <g transform="translate(780 170)">
                <rect width={740} height={660} rx={32} fill="#f5efe0" />
                <text
                    x={370}
                    y={70}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f766e"
                >
                    Et kart
                </text>
                {/* Terreng: åser og et vann */}
                <ellipse cx={200} cy={260} rx={110} ry={70} fill="#d6c7a1" />
                <ellipse cx={540} cy={420} rx={130} ry={80} fill="#d6c7a1" />
                <ellipse cx={520} cy={210} rx={90} ry={55} fill="#93c5fd" />
                {[
                    'M 60 580 C 160 470 140 360 330 330 S 600 280 690 150',
                    'M 60 580 C 260 560 380 600 520 540 S 660 400 690 150',
                    'M 60 580 C 60 420 120 360 220 380 S 380 200 690 150',
                ].map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={beat === 4 && i === 0 ? '#0d9488' : '#a8a29e'}
                        strokeWidth={beat === 4 && i === 0 ? 12 : 7}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.6s' }}
                    />
                ))}
                {beat === 4 && (
                    <circle r={18} fill="#0f766e">
                        <animateMotion
                            dur="4s"
                            fill="freeze"
                            path="M 60 580 C 160 470 140 360 330 330 S 600 280 690 150"
                        />
                    </circle>
                )}
                <text
                    x={370}
                    y={640}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill="#475569"
                >
                    viser veiene som finnes
                </text>
            </g>
        </>
    );
}

function Kritikk({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={beat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                {beat === 0 && (
                    <>
                        <motion.circle
                            cx={560}
                            cy={520}
                            r={150}
                            fill="#dc2626"
                            initial={{ scale: 0.4 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 3 }}
                            style={{ transformOrigin: '560px 520px' }}
                            opacity={0.85}
                        />
                        <text
                            x={560}
                            y={535}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            URETT
                        </text>
                        <Figur x={980} y={600} farge="#0d9488" skala={2.2} />
                        <rect x={860} y={680} width={240} height={60} rx={14} fill="#ccfbf1" />
                        <text
                            x={980}
                            y={721}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#0f766e"
                        >
                            ikke presse
                        </text>
                        <motion.text
                            x={1300}
                            y={540}
                            textAnchor="middle"
                            fontSize={220}
                            fontWeight={900}
                            fill="#0f172a"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.6 }}
                        >
                            ?
                        </motion.text>
                        <rect x={360} y={780} width={880} height={70} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={827}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Hvem stopper da uretten?
                        </text>
                    </>
                )}
                {beat === 1 && (
                    <>
                        {Array.from({ length: 9 }, (_, i) => {
                            const a = (i / 9) * Math.PI * 2;
                            return (
                                <Figur
                                    key={i}
                                    x={620 + Math.cos(a) * 200}
                                    y={520 + Math.sin(a) * 170}
                                    farge="#7c3aed"
                                    skala={1.4}
                                />
                            );
                        })}
                        <ellipse
                            cx={620}
                            cy={510}
                            rx={260}
                            ry={230}
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth={5}
                            opacity={0.5}
                        />
                        <text
                            x={620}
                            y={525}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#5b21b6"
                        >
                            fellesskapet
                        </text>
                        <Figur x={1150} y={560} farge="#0d9488" skala={1.4} />
                        <text
                            x={1150}
                            y={660}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f766e"
                        >
                            daoisten
                        </text>
                        <motion.path
                            d="M 900 520 L 1080 540"
                            stroke="#0f766e"
                            strokeWidth={6}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.8 }}
                        />
                        <rect x={380} y={790} width={840} height={66} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={835}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Konfusianerne: daoistene trakk seg unna ansvaret
                        </text>
                    </>
                )}
                {beat === 2 && (
                    <>
                        {[
                            { navn: 'skole', x: 380 },
                            { navn: 'domstol', x: 800 },
                            { navn: 'sykehus', x: 1220 },
                        ].map((b, i) => (
                            <motion.g
                                key={b.navn}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.4 }}
                            >
                                <rect
                                    x={b.x - 140}
                                    y={360}
                                    width={280}
                                    height={260}
                                    rx={12}
                                    fill="#e2e8f0"
                                    stroke="#64748b"
                                    strokeWidth={4}
                                />
                                <path
                                    d={`M ${b.x - 160} 365 L ${b.x} 250 L ${b.x + 160} 365 Z`}
                                    fill="#94a3b8"
                                />
                                {[0, 1, 2].map((k) => (
                                    <rect
                                        key={k}
                                        x={b.x - 110 + k * 80}
                                        y={410}
                                        width={50}
                                        height={60}
                                        fill="#ffffff"
                                        stroke="#64748b"
                                        strokeWidth={3}
                                    />
                                ))}
                                <rect x={b.x - 30} y={520} width={60} height={100} fill="#64748b" />
                                <text
                                    x={b.x}
                                    y={680}
                                    textAnchor="middle"
                                    fontSize={40}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {b.navn}
                                </text>
                                <text
                                    x={b.x + 120}
                                    y={250}
                                    textAnchor="middle"
                                    fontSize={90}
                                    fontWeight={900}
                                    fill="#b45309"
                                >
                                    ?
                                </text>
                            </motion.g>
                        ))}
                        <rect x={260} y={760} width={1080} height={70} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={807}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Kunnskap, moral og ordninger: har grenser og setter grenser
                        </text>
                    </>
                )}
                {beat >= 3 && (
                    <>
                        <rect x={785} y={330} width={30} height={420} fill="#78716c" />
                        <path d="M 700 760 L 900 760 L 800 700 Z" fill="#57534e" />
                        <rect x={330} y={315} width={940} height={22} rx={10} fill="#44403c" />
                        {[
                            { x: 420, tekst: 'ta hardere i', farge: '#dc2626' },
                            { x: 1180, tekst: 'daoismen', farge: '#0d9488' },
                        ].map((s) => (
                            <g key={s.tekst}>
                                <line
                                    x1={s.x}
                                    y1={337}
                                    x2={s.x - 100}
                                    y2={520}
                                    stroke="#44403c"
                                    strokeWidth={4}
                                />
                                <line
                                    x1={s.x}
                                    y1={337}
                                    x2={s.x + 100}
                                    y2={520}
                                    stroke="#44403c"
                                    strokeWidth={4}
                                />
                                <path
                                    d={`M ${s.x - 130} 520 L ${s.x + 130} 520 L ${s.x + 100} 560 L ${s.x - 100} 560 Z`}
                                    fill="#a8a29e"
                                />
                                <rect
                                    x={s.x - 120}
                                    y={440}
                                    width={240}
                                    height={80}
                                    rx={14}
                                    fill={s.farge}
                                />
                                <text
                                    x={s.x}
                                    y={493}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="#ffffff"
                                >
                                    {s.tekst}
                                </text>
                            </g>
                        ))}
                        <rect x={340} y={790} width={920} height={70} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={837}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Noen mener: ikke alt blir bedre av å ta hardere i
                        </text>
                    </>
                )}
            </motion.g>
        </AnimatePresence>
    );
}

export function DaoismeTavle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'tosvar';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#efe7d6' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'tosvar' && <Tosvar beat={beat} />}
                {modus === 'boka' && <Boka beat={beat} />}
                {modus === 'kritikk' && <Kritikk beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
