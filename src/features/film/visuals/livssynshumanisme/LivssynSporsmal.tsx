import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Hake, Kryss, LivssynOverskrift, Person, Vis } from './felles';

/**
 * 2D: de store spørsmålene et livssyn svarer på.
 * «sporsmal»: fire spørsmål rundt et menneske, så mange mennesker.
 * «verdslig»: religionene (svar ovenfra) mot livssynshumanismen (svar fra denne verden).
 * «moral»: du og den andre kjenner vondt og godt, og regelen som følger.
 * «svar»: livssynshumanismens fire svar fylles inn.
 */

type Modus = 'sporsmal' | 'verdslig' | 'moral' | 'svar';

const OVERSKRIFT: Record<Modus, string[]> = {
    sporsmal: [
        'Et livssyn: et samlet svar på de store spørsmålene',
        'Hva finnes? Hvordan kan vi vite noe?',
        'Hva er rett og galt? Hva gjør vi når noen dør?',
        'Alle svarer, enten de tenker over det eller ikke',
    ],
    verdslig: [
        'Religionene er livssyn',
        'Et livssyn trenger ikke en gud',
        'Verdslig: bare denne verden',
        'Ikke bare et nei, men egne svar',
    ],
    moral: [
        'Hvis ingen gud har bestemt hva som er rett?',
        'Du vet hva det vil si å ha vondt',
        'Og å ha det godt. Det gjør alle andre også',
        'Den andre kjenner det samme som deg',
        'Grunnlaget for en regel',
    ],
    svar: ['Livssynshumanismens svar', 'Virkeligheten', 'Kunnskapen', 'Etikken', 'Seremoniene'],
};

/* ------------------------------------------------------------ Spørsmål */

const SPORSMAL = [
    { tekst: 'Hva finnes egentlig?', x: 110, y: 200, fra: 1 },
    { tekst: 'Hvordan kan vi vite noe sikkert?', x: 890, y: 200, fra: 1 },
    { tekst: 'Hva er rett og galt?', x: 110, y: 470, fra: 2 },
    { tekst: 'Hva gjør vi når noen dør?', x: 890, y: 470, fra: 2 },
];

function Sporsmal({ beat }: { beat: number }) {
    return (
        <g>
            {SPORSMAL.map((s, i) => {
                const vist = beat >= s.fra;
                const kx = s.x < 800 ? s.x + 600 : s.x;
                return (
                    <g key={i}>
                        <line
                            x1={800}
                            y1={500}
                            x2={kx}
                            y2={s.y + 60}
                            stroke={vist ? '#0f766e' : '#cbd5e1'}
                            strokeWidth={5}
                            strokeDasharray={vist ? undefined : '12 10'}
                        />
                        <rect
                            x={s.x}
                            y={s.y}
                            width={600}
                            height={120}
                            rx={22}
                            fill={vist ? '#ffffff' : '#f1f5f9'}
                            stroke={vist ? '#0f766e' : '#cbd5e1'}
                            strokeWidth={4}
                            strokeDasharray={vist ? undefined : '14 10'}
                        />
                        {vist ? (
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                x={s.x + 300}
                                y={s.y + 73}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                {s.tekst}
                            </motion.text>
                        ) : (
                            <text
                                x={s.x + 300}
                                y={s.y + 78}
                                textAnchor="middle"
                                fontSize={56}
                                fontWeight={900}
                                fill="#94a3b8"
                            >
                                ?
                            </text>
                        )}
                    </g>
                );
            })}
            <circle cx={800} cy={470} r={95} fill="#ccfbf1" />
            <Person x={800} y={540} h={170} farge="#0f766e" />
            <Vis nar={beat >= 3}>
                {Array.from({ length: 15 }, (_, i) => {
                    const x = 120 + i * 97;
                    const farger = ['#64748b', '#b45309', '#2563eb', '#be185d', '#475569'];
                    return <Person key={i} x={x} y={860} h={110} farge={farger[i % 5]} />;
                })}
            </Vis>
        </g>
    );
}

/* ------------------------------------------------------------ Verdslig */

const SLOTS = ['Hva finnes?', 'Hvordan vite?', 'Rett og galt?', 'Når noen dør?'];

function Kolonne({
    x,
    tittel,
    beat,
    side,
}: {
    x: number;
    tittel: string;
    beat: number;
    side: 'religion' | 'humanisme';
}) {
    const fylt = side === 'religion' ? true : beat >= 3;
    const farge = side === 'religion' ? '#b45309' : '#0f766e';
    return (
        <g>
            <text
                x={x + 330}
                y={212}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={farge}
            >
                {tittel}
            </text>
            {/* Himmelen: det overnaturlige */}
            <rect
                x={x}
                y={240}
                width={660}
                height={150}
                rx={24}
                fill={side === 'religion' ? '#fef3c7' : '#f8fafc'}
                stroke={side === 'religion' ? '#f59e0b' : '#94a3b8'}
                strokeWidth={4}
                strokeDasharray={side === 'religion' ? undefined : '14 10'}
            />
            {side === 'religion' ? (
                <g>
                    <g transform={`translate(${x + 110} 315)`}>
                        {Array.from({ length: 8 }, (_, i) => {
                            const a = (i / 8) * Math.PI * 2;
                            return (
                                <line
                                    key={i}
                                    x1={Math.cos(a) * 30}
                                    y1={Math.sin(a) * 30}
                                    x2={Math.cos(a) * 52}
                                    y2={Math.sin(a) * 52}
                                    stroke="#f59e0b"
                                    strokeWidth={7}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                        <circle r={24} fill="#f59e0b" />
                    </g>
                    <text x={x + 190} y={305} fontSize={32} fontWeight={800} fill="#78350f">
                        Mange: en gud, eller
                    </text>
                    <text x={x + 190} y={345} fontSize={32} fontWeight={800} fill="#78350f">
                        noe overnaturlig
                    </text>
                </g>
            ) : (
                <g>
                    <text
                        x={x + 330}
                        y={300}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#475569"
                    >
                        Ingen gud i livssynet
                    </text>
                    <Vis nar={beat >= 2}>
                        <text
                            x={x + 300}
                            y={350}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#64748b"
                        >
                            noe overnaturlig
                        </text>
                        <Kryss x={x + 470} y={340} s={16} />
                    </Vis>
                </g>
            )}
            {/* Pila viser hvor svarene kommer fra */}
            {side === 'religion' ? (
                <g>
                    <line
                        x1={x + 330}
                        y1={392}
                        x2={x + 330}
                        y2={452}
                        stroke={farge}
                        strokeWidth={8}
                    />
                    <path d={`M ${x + 310} 446 L ${x + 330} 472 L ${x + 350} 446 Z`} fill={farge} />
                    <text x={x + 360} y={442} fontSize={28} fontWeight={700} fill="#78350f">
                        svar ovenfra
                    </text>
                </g>
            ) : (
                <Vis nar={beat >= 3}>
                    <line
                        x1={x + 330}
                        y1={792}
                        x2={x + 330}
                        y2={762}
                        stroke={farge}
                        strokeWidth={8}
                    />
                    <path d={`M ${x + 310} 768 L ${x + 330} 746 L ${x + 350} 768 Z`} fill={farge} />
                </Vis>
            )}
            {SLOTS.map((s, i) => {
                const y = 480 + i * 66;
                return (
                    <g key={s}>
                        <rect
                            x={x + 60}
                            y={y}
                            width={540}
                            height={54}
                            rx={14}
                            fill={fylt ? (side === 'religion' ? '#fde68a' : '#99f6e4') : '#f1f5f9'}
                            stroke={fylt ? farge : '#cbd5e1'}
                            strokeWidth={3}
                        />
                        <text x={x + 90} y={y + 38} fontSize={30} fontWeight={800} fill="#0f172a">
                            {s}
                        </text>
                        {fylt && side === 'humanisme' && <Hake x={x + 560} y={y + 26} s={14} />}
                    </g>
                );
            })}
            {/* Bakken: denne verden */}
            <rect
                x={x}
                y={796}
                width={660}
                height={70}
                rx={18}
                fill={side === 'humanisme' && beat >= 2 ? '#0f766e' : '#e2e8f0'}
            />
            <text
                x={x + 330}
                y={842}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill={side === 'humanisme' && beat >= 2 ? '#ffffff' : '#475569'}
            >
                {side === 'humanisme' && beat >= 2 ? 'Verdslig: bare denne verden' : 'Denne verden'}
            </text>
        </g>
    );
}

function Verdslig({ beat }: { beat: number }) {
    return (
        <g>
            <Kolonne x={70} tittel="Religionene" beat={beat} side="religion" />
            <Vis nar={beat >= 1}>
                <Kolonne x={870} tittel="Livssynshumanismen" beat={beat} side="humanisme" />
            </Vis>
        </g>
    );
}

/* --------------------------------------------------------------- Moral */

function Ring({ x, y, farge, nar }: { x: number; y: number; farge: string; nar: boolean }) {
    if (!nar) return null;
    return (
        <motion.circle
            cx={x}
            cy={y}
            r={150}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
    );
}

function Lapp({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    const b = tekst.length * 19 + 50;
    return (
        <g>
            <rect x={x - b / 2} y={y - 40} width={b} height={56} rx={16} fill={farge} />
            <text x={x} y={y - 2} textAnchor="middle" fontSize={32} fontWeight={800} fill="#ffffff">
                {tekst}
            </text>
        </g>
    );
}

function Moral({ beat }: { beat: number }) {
    const A = 470;
    const B = 1130;
    const regel = beat >= 4;
    return (
        <g>
            {!regel && (
                <g>
                    <rect
                        x={560}
                        y={190}
                        width={480}
                        height={86}
                        rx={22}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth={3}
                        strokeDasharray="14 10"
                    />
                    <text
                        x={800}
                        y={246}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#475569"
                    >
                        Hvorfor ikke lyve eller slå?
                    </text>
                </g>
            )}
            <Vis nar={regel}>
                <rect x={180} y={180} width={1240} height={110} rx={24} fill="#0f766e" />
                <text
                    x={800}
                    y={233}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    Ikke gjør mot andre det du ikke vil
                </text>
                <text
                    x={800}
                    y={274}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    at de skal gjøre mot deg
                </text>
            </Vis>
            <Ring x={A} y={560} farge="#dc2626" nar={beat >= 1} />
            <Ring x={B} y={560} farge="#dc2626" nar={beat >= 2} />
            <Person x={A} y={690} h={260} farge="#0f766e" />
            <Person x={B} y={690} h={260} farge="#2563eb" />
            <text x={A} y={760} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                Du
            </text>
            <text x={B} y={760} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                Den andre
            </text>
            <Vis nar={beat >= 1}>
                <Lapp x={A - 200} y={420} tekst="vondt" farge="#dc2626" />
            </Vis>
            <Vis nar={beat >= 2}>
                <Lapp x={A + 200} y={420} tekst="godt" farge="#0d9488" />
                <Lapp x={B - 200} y={420} tekst="vondt" farge="#dc2626" />
                <Lapp x={B + 200} y={420} tekst="godt" farge="#0d9488" />
            </Vis>
            <Vis nar={beat >= 3 && !regel}>
                <line
                    x1={A + 120}
                    y1={600}
                    x2={B - 120}
                    y2={600}
                    stroke="#7c3aed"
                    strokeWidth={8}
                />
                <path d={`M ${A + 120} 600 l 26 -18 l 0 36 Z`} fill="#7c3aed" />
                <path d={`M ${B - 120} 600 l -26 -18 l 0 36 Z`} fill="#7c3aed" />
                <text
                    x={800}
                    y={580}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#5b21b6"
                >
                    det samme
                </text>
            </Vis>
            <Vis nar={regel}>
                <rect
                    x={250}
                    y={800}
                    width={300}
                    height={70}
                    rx={18}
                    fill="#ccfbf1"
                    stroke="#0f766e"
                    strokeWidth={3}
                />
                <text
                    x={420}
                    y={846}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#134e4a"
                >
                    fornuft
                </text>
                <Hake x={300} y={834} s={14} />
                <rect
                    x={600}
                    y={800}
                    width={360}
                    height={70}
                    rx={18}
                    fill="#ccfbf1"
                    stroke="#0f766e"
                    strokeWidth={3}
                />
                <text
                    x={800}
                    y={846}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#134e4a"
                >
                    medfølelse
                </text>
                <Hake x={650} y={834} s={14} />
                <rect
                    x={1010}
                    y={800}
                    width={400}
                    height={70}
                    rx={18}
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth={3}
                />
                <text
                    x={1235}
                    y={846}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#475569"
                >
                    befaling ovenfra
                </text>
                <Kryss x={1060} y={835} s={14} />
            </Vis>
        </g>
    );
}

/* ---------------------------------------------------------------- Svar */

const SVAR = [
    { tag: 'Virkeligheten', sporsmal: 'Hva finnes?', svar: 'Bare den verden vi kan undersøke' },
    {
        tag: 'Kunnskapen',
        sporsmal: 'Hvordan kan vi vite noe sikkert?',
        svar: 'Fornuft, forskning og fri tenkning',
    },
    {
        tag: 'Etikken',
        sporsmal: 'Hva er rett og galt?',
        svar: 'Mennesker selv, ut fra at vi kan lide og ha det godt',
    },
    {
        tag: 'Seremoniene',
        sporsmal: 'Hvordan markerer vi livets store øyeblikk?',
        svar: 'Med egne seremonier, uten noen gud',
    },
];

function Svar({ beat }: { beat: number }) {
    return (
        <g>
            {SVAR.map((s, i) => {
                const y = 180 + i * 172;
                const fylt = beat >= i + 1;
                const na = beat === i + 1;
                return (
                    <g key={s.tag}>
                        <rect
                            x={80}
                            y={y}
                            width={1440}
                            height={150}
                            rx={24}
                            fill={na ? '#f0fdfa' : '#ffffff'}
                            stroke={na ? '#0f766e' : '#cbd5e1'}
                            strokeWidth={na ? 6 : 3}
                        />
                        <rect
                            x={100}
                            y={y + 20}
                            width={310}
                            height={110}
                            rx={18}
                            fill={fylt ? '#0f766e' : '#94a3b8'}
                        />
                        <text
                            x={255}
                            y={y + 88}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {s.tag}
                        </text>
                        <text x={440} y={y + 58} fontSize={32} fontWeight={700} fill="#64748b">
                            {s.sporsmal}
                        </text>
                        {fylt ? (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Hake x={466} y={y + 104} s={16} />
                                <text
                                    x={500}
                                    y={y + 116}
                                    fontSize={36}
                                    fontWeight={900}
                                    fill="#134e4a"
                                >
                                    {s.svar}
                                </text>
                            </motion.g>
                        ) : (
                            <rect
                                x={440}
                                y={y + 84}
                                width={700}
                                height={40}
                                rx={10}
                                fill="#f1f5f9"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
}

export function LivssynSporsmal({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sporsmal';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-teal-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'sporsmal' && <Sporsmal beat={beat} />}
                {modus === 'verdslig' && <Verdslig beat={beat} />}
                {modus === 'moral' && <Moral beat={beat} />}
                {modus === 'svar' && <Svar beat={beat} />}
            </svg>
            <LivssynOverskrift tekst={tekst} />
        </div>
    );
}
