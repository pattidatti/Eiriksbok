import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, FARGE, H, Overskrift, Pil, Tekst, Vis } from './felles';

/**
 * Valgene i filmen om produksjon, tegnet i SVG. Fire moduser:
 * - «ressurser»: haugene med jern, tømmer, olje og arbeidskraft, så stålet som må deles
 *   mellom jernbane og sykehussenger, og folk som må deles mellom hus og eldre.
 * - «middag»: du skal bestemme middagen for hele kommunen, og husene viser hva du ikke vet.
 * - «blind»: Mises. Med markedspriser ser du hva som er knapt, uten står det spørsmålstegn.
 * - «kaka»: kritikken om ulikhet, og svaret om at kaka vokser.
 */

type Modus = 'ressurser' | 'middag' | 'blind' | 'kaka';

const OVERSKRIFT: Record<Modus, string[]> = {
    ressurser: [
        'Det finnes bare så mye',
        'Også arbeidskraft',
        'En haug med stål',
        'Mer til det ene, mindre til det andre',
        'Bygge hus eller ta vare på eldre?',
        'Knappe ressurser: ikke nok til alt',
    ],
    middag: [
        'Du bestemmer middagen for hele kommunen',
        'Hvem er allergiske?',
        'Hvem hater fisk?',
        'Hvem fikk gjester?',
        'Hvilke problemer ville du møtt?',
    ],
    blind: ['Ludwig von Mises, 1920', 'Mises: ingen privat eier, ingen ekte pris', 'Hva er den beste bruken?', 'Kalkulasjonsproblemet'],
    kaka: [
        'Kritikk og svar',
        'Ett syn blant flere',
        'Kritikk: store forskjeller',
        'Østerrikerne: fattigdom er problemet',
        'Svar: kaka vokser, sier de',
    ],
};

/* ---------- ressurser ---------- */

const STAL = 8;
/** Hvor stålbjelke nr. i ligger: i haugen, eller fordelt på jernbane og senger. */
function bjelkePlass(i: number, beat: number): { x: number; y: number; o: number } {
    if (beat < 2) return { x: 800 - 90, y: 640 - i * 26, o: 0 };
    if (beat === 2) return { x: 710, y: 640 - i * 26, o: 1 };
    if (beat === 3) {
        /* Seks til jernbanen, to til sengene. */
        if (i < 6) return { x: 170 + i * 70, y: 700, o: 1 };
        return { x: 1150 + (i - 6) * 200, y: 640, o: 1 };
    }
    return { x: 710, y: 640 - i * 26, o: 0 };
}

function Ressurser({ beat }: { beat: number }) {
    const hauger = beat <= 1 || beat >= 5;
    return (
        <>
            {/* De fire haugene */}
            <Vis synlig={hauger}>
                {/* Jern */}
                {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={160 + (i % 2) * 20} y={560 - i * 36} width={220} height={30} rx={5} fill="#94a3b8" stroke="#475569" strokeWidth={3} />
                ))}
                <Tekst x={280} y={660}>
                    Jern
                </Tekst>
                {/* Tømmer */}
                {[0, 1, 2, 0.5, 1.5].map((k, i) => (
                    <circle key={i} cx={530 + k * 70} cy={i < 3 ? 560 : 500} r={34} fill="#b7793f" stroke="#7c4a1e" strokeWidth={4} />
                ))}
                <Tekst x={600} y={660}>
                    Tømmer
                </Tekst>
                {/* Olje */}
                {[0, 1, 2].map((i) => (
                    <g key={i}>
                        <rect x={830 + i * 80} y={470} width={64} height={120} rx={10} fill="#1f2937" />
                        <rect x={830 + i * 80} y={505} width={64} height={10} fill="#ca8a04" />
                        <rect x={830 + i * 80} y={545} width={64} height={10} fill="#ca8a04" />
                    </g>
                ))}
                <Tekst x={940} y={660}>
                    Olje
                </Tekst>
            </Vis>
            <Vis synlig={beat === 1 || beat >= 5} forsinkelse={0.2}>
                {[0, 1, 2, 3].map((i) => (
                    <g key={i} transform={`translate(${1190 + i * 70} 0)`}>
                        <circle cx={0} cy={455} r={24} fill="#e8b48c" />
                        <rect x={-26} y={485} width={52} height={105} rx={20} fill={FARGE.stat} />
                    </g>
                ))}
                <Tekst x={1295} y={660}>
                    Arbeidskraft
                </Tekst>
            </Vis>
            {/* Stålet og de to målene */}
            {Array.from({ length: STAL }, (_, i) => {
                const p = bjelkePlass(i, beat);
                return (
                    <motion.rect
                        key={i}
                        width={180}
                        height={22}
                        rx={4}
                        fill="#64748b"
                        stroke="#334155"
                        strokeWidth={3}
                        initial={false}
                        animate={{ x: p.x, y: p.y, opacity: p.o }}
                        transition={{ duration: 1.1, delay: beat === 3 ? i * 0.12 : 0 }}
                    />
                );
            })}
            <Vis synlig={beat === 2}>
                <Tekst x={800} y={720}>
                    Stål
                </Tekst>
            </Vis>
            <Vis synlig={beat === 2 || beat === 3}>
                {/* Jernbane: skinner og sviller */}
                <line x1={150} y1={760} x2={650} y2={760} stroke="#334155" strokeWidth={8} />
                <line x1={150} y1={790} x2={650} y2={790} stroke="#334155" strokeWidth={8} />
                {Array.from({ length: 11 }, (_, i) => (
                    <rect key={i} x={160 + i * 46} y={750} width={14} height={50} fill="#92400e" />
                ))}
                <Tekst x={400} y={860}>
                    Jernbane
                </Tekst>
                {/* Sykehussenger */}
                {[0, 1].map((i) => (
                    <g key={i} transform={`translate(${1150 + i * 200} 0)`}>
                        <rect x={0} y={700} width={170} height={40} rx={8} fill="#f8fafc" stroke="#94a3b8" strokeWidth={4} />
                        <rect x={0} y={670} width={14} height={110} fill="#64748b" />
                        <rect x={156} y={690} width={14} height={90} fill="#64748b" />
                        <rect x={20} y={680} width={50} height={22} rx={8} fill="#bfdbfe" />
                    </g>
                ))}
                <Tekst x={1335} y={860}>
                    Sykehussenger
                </Tekst>
            </Vis>
            <Vis synlig={beat === 3} forsinkelse={1}>
                <Tekst x={400} y={640} farge={FARGE.gronn}>
                    Mer
                </Tekst>
                <Tekst x={1335} y={570} farge={FARGE.rod}>
                    Mindre igjen
                </Tekst>
            </Vis>
            {/* Arbeidskraften som deles */}
            <Vis synlig={beat === 4}>
                {Array.from({ length: 6 }, (_, i) => {
                    const venstre = i < 3;
                    const x = venstre ? 260 + i * 110 : 1040 + (i - 3) * 110;
                    return (
                        <motion.g
                            key={i}
                            initial={{ x: 800 - x, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
                        >
                            <circle cx={x} cy={520} r={26} fill="#e8b48c" />
                            <rect x={x - 28} y={552} width={56} height={110} rx={22} fill={FARGE.stat} />
                        </motion.g>
                    );
                })}
                {/* Hus */}
                <path d="M 300 360 L 420 270 L 540 360 Z" fill="#b45343" />
                <rect x={320} y={360} width={200} height={110} fill="#f5d48a" />
                <Tekst x={420} y={740}>
                    Bygge nye hus
                </Tekst>
                {/* Eldre */}
                <circle cx={1150} cy={330} r={34} fill="#e8b48c" />
                <rect x={1112} y={370} width={76} height={100} rx={26} fill="#a8a29e" />
                <line x1={1210} y1={380} x2={1220} y2={470} stroke="#57534e" strokeWidth={8} strokeLinecap="round" />
                <Tekst x={1150} y={740}>
                    Ta vare på eldre
                </Tekst>
                <Tekst x={800} y={430} farge={FARGE.gra} storrelse={60}>
                    eller
                </Tekst>
            </Vis>
            <Vis synlig={beat >= 5} forsinkelse={0.4}>
                <rect x={430} y={150} width={740} height={150} rx={26} fill="#ffffff" stroke={FARGE.rod} strokeWidth={6} />
                <text x={800} y={215} textAnchor="middle" fontSize={50} fontWeight={900} fill={FARGE.rod}>
                    Knapt
                </text>
                <text x={800} y={270} textAnchor="middle" fontSize={34} fontWeight={700} fill={FARGE.blekk}>
                    Det finnes ikke nok til alt.
                </text>
            </Vis>
        </>
    );
}

/* ---------- middag ---------- */

type Merke = 'allergi' | 'fisk' | 'gjester' | null;
const HUS: { x: number; y: number; merke: Merke }[] = [];
for (let r = 0; r < 3; r++)
    for (let k = 0; k < 5; k++) {
        const nr = r * 5 + k;
        const merke: Merke = [1, 8, 12].includes(nr) ? 'allergi' : [3, 5, 11, 14].includes(nr) ? 'fisk' : nr === 7 ? 'gjester' : null;
        HUS.push({ x: 640 + k * 190, y: 250 + r * 205, merke });
    }

const MERKE_TEKST: Record<Exclude<Merke, null>, { tekst: string; farge: string; fraBeat: number }> = {
    allergi: { tekst: 'Allergisk', farge: FARGE.rod, fraBeat: 1 },
    fisk: { tekst: 'Hater fisk', farge: FARGE.marked, fraBeat: 2 },
    gjester: { tekst: 'Gjester!', farge: '#7c3aed', fraBeat: 3 },
};

function Middag({ beat }: { beat: number }) {
    return (
        <>
            {/* Planleggeren ved pulten */}
            <rect x={90} y={520} width={380} height={30} rx={6} fill="#92400e" />
            <rect x={110} y={550} width={20} height={150} fill="#78350f" />
            <rect x={430} y={550} width={20} height={150} fill="#78350f" />
            <circle cx={280} cy={400} r={46} fill="#e8b48c" />
            <rect x={225} y={450} width={110} height={90} rx={30} fill={FARGE.stat} />
            {/* Uka */}
            <rect x={90} y={160} width={380} height={190} rx={18} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
            <text x={280} y={205} textAnchor="middle" fontSize={30} fontWeight={900} fill={FARGE.blekk}>
                Middag hele uka
            </text>
            {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                <g key={i}>
                    <text x={125 + i * 52} y={260} textAnchor="middle" fontSize={26} fontWeight={800} fill={FARGE.gra}>
                        {d}
                    </text>
                    <text x={125 + i * 52} y={318} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.stat}>
                        ?
                    </text>
                </g>
            ))}
            {/* Husene i kommunen */}
            {HUS.map((h, i) => {
                const m = h.merke ? MERKE_TEKST[h.merke] : null;
                const vis = !!m && beat >= m.fraBeat;
                return (
                    <g key={i}>
                        <path d={`M ${h.x - 62} ${h.y} L ${h.x} ${h.y - 50} L ${h.x + 62} ${h.y} Z`} fill="#b45343" />
                        <motion.rect
                            x={h.x - 52}
                            y={h.y}
                            width={104}
                            height={78}
                            initial={false}
                            animate={{ fill: vis && m ? m.farge : beat >= 4 ? '#fde68a' : '#f5d48a' }}
                            transition={{ duration: 0.6 }}
                        />
                        <rect x={h.x - 14} y={h.y + 38} width={28} height={40} fill="#78350f" />
                        {h.merke === 'gjester' && (
                            <Vis synlig={beat >= 3}>
                                {[-1, 0, 1].map((d) => (
                                    <circle key={d} cx={h.x + 80 + d * 0} cy={h.y + 18 + d * 26} r={11} fill="#7c3aed" />
                                ))}
                            </Vis>
                        )}
                        {m && (
                            <Vis synlig={vis}>
                                <Tekst x={h.x} y={h.y + 116} farge={m.farge} storrelse={28}>
                                    {m.tekst}
                                </Tekst>
                            </Vis>
                        )}
                    </g>
                );
            })}
            <Vis synlig={beat >= 4}>
                <Pil fra={[480, 300]} til={[560, 300]} farge={FARGE.gra} synlig={beat >= 4} />
                <Tekst x={280} y={790} storrelse={34} farge={FARGE.rod}>
                    Hvordan skal du vite alt?
                </Tekst>
            </Vis>
        </>
    );
}

/* ---------- blind (Mises) ---------- */

const VARER = [
    { navn: 'Stål', pris: 'høy pris', farge: FARGE.rod },
    { navn: 'Tømmer', pris: 'lav pris', farge: FARGE.gronn },
    { navn: 'Olje', pris: 'høy pris', farge: FARGE.rod },
];

function Blind({ beat }: { beat: number }) {
    return (
        <>
            {/* Mises */}
            <Vis synlig={beat === 0}>
                <circle cx={800} cy={360} r={110} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={6} />
                <circle cx={800} cy={330} r={48} fill="#94a3b8" />
                <path d="M 720 440 Q 800 360 880 440 Z" fill="#94a3b8" />
                <Tekst x={800} y={560} storrelse={52}>
                    Ludwig von Mises
                </Tekst>
                <Tekst x={800} y={620} storrelse={34} farge={FARGE.gra} vekt={700}>
                    østerriksk økonom
                </Tekst>
                <g transform="rotate(-8 1130 330)">
                    <rect x={1010} y={280} width={240} height={100} rx={14} fill="none" stroke={FARGE.rod} strokeWidth={8} />
                    <text x={1130} y={355} textAnchor="middle" fontSize={64} fontWeight={900} fill={FARGE.rod}>
                        1920
                    </text>
                </g>
            </Vis>
            {/* To markeder side om side */}
            <Vis synlig={beat >= 1 && beat <= 2}>
                <rect x={110} y={150} width={640} height={620} rx={28} fill="#ffffff" stroke={FARGE.marked} strokeWidth={6} />
                <text x={430} y={215} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.marked}>
                    Med markedspriser
                </text>
                <rect x={850} y={150} width={640} height={620} rx={28} fill="#ffffff" stroke={FARGE.stat} strokeWidth={6} />
                <text x={1170} y={215} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.stat}>
                    Uten markedspriser
                </text>
                {VARER.map((v, i) => (
                    <g key={v.navn}>
                        <text x={170} y={320 + i * 150} fontSize={40} fontWeight={800} fill={FARGE.blekk}>
                            {v.navn}
                        </text>
                        <rect x={430} y={276 + i * 150} width={260} height={64} rx={14} fill={v.farge} />
                        <text x={560} y={320 + i * 150} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                            {v.pris}
                        </text>
                        <text x={910} y={320 + i * 150} fontSize={40} fontWeight={800} fill={FARGE.blekk}>
                            {v.navn}
                        </text>
                        <rect x={1170} y={276 + i * 150} width={260} height={64} rx={14} fill="#cbd5e1" />
                        <text x={1300} y={322 + i * 150} textAnchor="middle" fontSize={44} fontWeight={900} fill={FARGE.gra}>
                            ?
                        </text>
                    </g>
                ))}
            </Vis>
            <Vis synlig={beat === 1} forsinkelse={0.6}>
                <Tekst x={800} y={840} storrelse={32}>
                    Mises: prisen viser hva som er knapt
                </Tekst>
            </Vis>
            <Vis synlig={beat === 2} forsinkelse={0.3}>
                <rect x={920} y={790} width={500} height={90} rx={18} fill={FARGE.stat} />
                <text x={1170} y={848} textAnchor="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                    Beste bruk = ?
                </text>
                <Pil fra={[1170, 780]} til={[1170, 735]} farge={FARGE.stat} synlig={beat === 2} bue={0} bredde={6} />
            </Vis>
            {/* Ordet */}
            <Vis synlig={beat >= 3}>
                <text x={800} y={420} textAnchor="middle" fontSize={96} fontWeight={900} fill={FARGE.blekk}>
                    Kalkulasjons-
                </text>
                <text x={800} y={530} textAnchor="middle" fontSize={96} fontWeight={900} fill={FARGE.blekk}>
                    problemet
                </text>
                <Tekst x={800} y={650} storrelse={44} farge={FARGE.stat}>
                    å kalkulere = å regne ut
                </Tekst>
            </Vis>
        </>
    );
}

/* ---------- kaka ---------- */

/** En kakebit som SVG-sti, fra vinkel a til b (radianer, 0 = rett opp). */
function bit(cx: number, cy: number, r: number, a: number, b: number) {
    const p = (t: number) => [cx + r * Math.sin(t), cy - r * Math.cos(t)];
    const [x1, y1] = p(a);
    const [x2, y2] = p(b);
    const stor = b - a > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${stor} 1 ${x2} ${y2} Z`;
}

function Kaka({ beat }: { beat: number }) {
    const vokser = beat >= 4;
    const skala = vokser ? 1.3 : 1;
    const cy = 520;
    return (
        <>
            <Vis synlig={beat <= 1}>
                <rect x={160} y={200} width={560} height={300} rx={28} fill="#ffffff" stroke={FARGE.rod} strokeWidth={6} />
                <text x={440} y={370} textAnchor="middle" fontSize={64} fontWeight={900} fill={FARGE.rod}>
                    Kritikk
                </text>
                <rect x={880} y={200} width={560} height={300} rx={28} fill="#ffffff" stroke={FARGE.stat} strokeWidth={6} />
                <text x={1160} y={345} textAnchor="middle" fontSize={64} fontWeight={900} fill={FARGE.stat}>
                    Svar
                </text>
                <text x={1160} y={410} textAnchor="middle" fontSize={30} fontWeight={700} fill={FARGE.gra}>
                    fra den østerrikske skolen
                </text>
            </Vis>
            <Vis synlig={beat === 1} forsinkelse={0.3}>
                <rect x={330} y={600} width={940} height={130} rx={26} fill="#fef3c7" stroke={FARGE.gull} strokeWidth={6} />
                <text x={800} y={682} textAnchor="middle" fontSize={44} fontWeight={900} fill="#854d0e">
                    Ett syn blant flere. Ikke fasiten.
                </text>
            </Vis>
            <Vis synlig={beat >= 2}>
                {/* To tallerkener: en stor bit og en liten bit. Begge blir større når kaka vokser. */}
                {[
                    { x: 270, navn: 'De rike', b: Math.PI * 1.1, fyll: '#f59e0b', kant: '#ffffff' },
                    { x: 680, navn: 'De fattige', b: Math.PI * 0.35, fyll: beat >= 3 ? '#fecaca' : '#fde68a', kant: beat >= 3 ? FARGE.rod : '#ffffff' },
                ].map((t) => (
                    <g key={t.navn}>
                        <circle cx={t.x} cy={cy} r={190} fill="#ffffff" stroke="#cbd5e1" strokeWidth={6} />
                        <motion.g
                            initial={false}
                            animate={{ scale: skala }}
                            transition={{ duration: 1.4, ease: 'easeInOut' }}
                            style={{ transformOrigin: `${t.x}px ${cy + 40}px` }}
                        >
                            <path d={bit(t.x, cy + 40, 120, -t.b / 2, t.b / 2)} fill={t.fyll} stroke={t.kant} strokeWidth={8} />
                        </motion.g>
                        <Tekst x={t.x} y={cy + 250} storrelse={40}>
                            {t.navn}
                        </Tekst>
                    </g>
                ))}
                <Tekst x={475} y={880} storrelse={32} farge={FARGE.gra} vekt={700}>
                    Skisse
                </Tekst>
            </Vis>
            <Vis synlig={beat === 2}>
                <rect x={900} y={360} width={600} height={180} rx={26} fill="#ffffff" stroke={FARGE.rod} strokeWidth={6} />
                <text x={1200} y={430} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.rod}>
                    Kritikk
                </text>
                <text x={1200} y={490} textAnchor="middle" fontSize={32} fontWeight={700} fill={FARGE.blekk}>
                    Store forskjeller
                </text>
            </Vis>
            <Vis synlig={beat === 3}>
                <rect x={850} y={330} width={700} height={240} rx={26} fill="#ffffff" stroke={FARGE.stat} strokeWidth={6} />
                <text x={1200} y={400} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.stat}>
                    Svar
                </text>
                <text x={1200} y={460} textAnchor="middle" fontSize={32} fontWeight={700} fill={FARGE.blekk}>
                    De mener: forskjellene er ikke problemet.
                </text>
                <text x={1200} y={515} textAnchor="middle" fontSize={32} fontWeight={700} fill={FARGE.rod}>
                    For dem er fattigdom problemet.
                </text>
            </Vis>
            <Vis synlig={beat >= 4} forsinkelse={0.6}>
                <rect x={880} y={330} width={700} height={240} rx={26} fill="#ffffff" stroke={FARGE.stat} strokeWidth={6} />
                <text x={1230} y={400} textAnchor="middle" fontSize={38} fontWeight={900} fill={FARGE.stat}>
                    Kaka vokser, sier de
                </text>
                <text x={1230} y={460} textAnchor="middle" fontSize={30} fontWeight={700} fill={FARGE.blekk}>
                    De sier: millioner fikk nytte av PC-er
                </text>
                <text x={1230} y={515} textAnchor="middle" fontSize={30} fontWeight={700} fill={FARGE.blekk}>
                    De fattigste får det bedre over tid
                </text>
            </Vis>
        </>
    );
}

export function ProduksjonValg({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ressurser';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.bakgrunn }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'ressurser' && <Ressurser beat={beat} />}
                {modus === 'middag' && <Middag beat={beat} />}
                {modus === 'blind' && <Blind beat={beat} />}
                {modus === 'kaka' && <Kaka beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
