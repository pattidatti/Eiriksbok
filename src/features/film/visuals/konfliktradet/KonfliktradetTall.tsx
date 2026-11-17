import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { formatTall } from '../format';
import { FARGE, bredde } from './farger';
import { Figur, Kryss, Overskrift, Vis } from './felles';

/**
 * Tall og forløp i 2D (1600x900).
 * «tid»: tidslinja fra de første konfliktrådene til i dag (12 råd, 22 steder).
 * «saker»: to slags saker, og hvordan de 8034 sakene i 2023 fordelte seg.
 * «ofre»: hva undersøkelsene sier om hvordan ofrene opplever møtet.
 * «forbehold»: misfornøyde ofre, sammenligningen, svakhetene og det å bli hørt.
 */

type Modus = 'tid' | 'saker' | 'ofre' | 'forbehold';

/** Kort med tittel og linjer, midtstilt på x. Bredden følger teksten. */
function Kort({
    x,
    y,
    tittel,
    linjer = [],
    farge,
    str = 34,
}: {
    x: number;
    y: number;
    tittel: string;
    linjer?: string[];
    farge: string;
    str?: number;
}) {
    const ls = Math.round(str * 0.8);
    const b = Math.max(bredde(tittel, str), ...linjer.map((l) => bredde(l, ls))) + 50;
    const h = str + 40 + linjer.length * (ls + 12);
    return (
        <g>
            <rect x={x - b / 2} y={y} width={b} height={h} rx={18} fill="#ffffff" stroke={farge} strokeWidth={4} />
            <text x={x} y={y + str + 12} textAnchor="middle" fontSize={str} fontWeight={800} fill={farge}>
                {tittel}
            </text>
            {linjer.map((l, i) => (
                <text key={l} x={x} y={y + str + 22 + (i + 1) * (ls + 12) - 6} textAnchor="middle" fontSize={ls} fontWeight={600} fill="#334155">
                    {l}
                </text>
            ))}
        </g>
    );
}

// ---------- Tidslinja ----------

const HENDELSER = [
    { x: 250, ar: 'Midten av 1980-tallet', tittel: 'De første', linjer: ['konfliktrådene', 'mest for unge 15-18 år'], fra: 0, opp: true },
    { x: 450, ar: '1989', tittel: '81 konfliktråd', linjer: ['268 saker til sammen'], fra: 1, opp: false },
    { x: 650, ar: '1991', tittel: 'Egen lov', linjer: ['vedtatt av Stortinget'], fra: 2, opp: true },
    { x: 850, ar: '1993-1994', tittel: 'Hele landet', linjer: ['tilbudet finnes overalt'], fra: 2, opp: false },
    { x: 1050, ar: '2004', tittel: 'Statlige', linjer: ['staten driver dem'], fra: 3, opp: true },
    { x: 1250, ar: '2014', tittel: 'Ny lov', linjer: ['ungdomsstraff og', 'ungdomsoppfølging'], fra: 3, opp: false },
];

function Kontor({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 26} y={y - 40} width={52} height={40} fill="#0d9488" />
            <path d={`M ${x - 32} ${y - 40} L ${x} ${y - 62} L ${x + 32} ${y - 40} Z`} fill="#0f766e" />
            <rect x={x - 7} y={y - 20} width={14} height={20} fill="#ffffff" />
        </g>
    );
}

function Nal({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <path d={`M ${x} ${y} L ${x - 12} ${y - 22} A 14 14 0 1 1 ${x + 12} ${y - 22} Z`} fill={FARGE.rod} />
            <circle cx={x} cy={y - 30} r={5} fill="#ffffff" />
        </g>
    );
}

function Tid({ beat }: { beat: number }) {
    const idag = beat >= 4;
    const linjeY = 450;
    return (
        <g>
            <Overskrift tekst={idag ? 'I dag' : 'Fra forsøk til hele landet'} />
            <motion.g initial={false} animate={{ opacity: idag ? 0 : 1 }} transition={{ duration: 0.6 }}>
                <line x1={80} y1={linjeY} x2={1520} y2={linjeY} stroke="#334155" strokeWidth={8} strokeLinecap="round" />
                {HENDELSER.map((h) => {
                    const synlig = beat >= h.fra;
                    const kortY = h.opp ? 150 : 545;
                    return (
                        <g key={h.ar}>
                            <circle cx={h.x} cy={linjeY} r={synlig ? 16 : 9} fill={synlig ? '#0d9488' : '#94a3b8'} />
                            <Vis nar={synlig}>
                                <line x1={h.x} y1={linjeY} x2={h.x} y2={h.opp ? 300 : 545} stroke="#0d9488" strokeWidth={4} />
                                <Kort x={h.x} y={h.opp ? 160 : kortY} tittel={h.tittel} linjer={h.linjer} farge="#0d9488" str={32} />
                                <text x={h.x} y={h.opp ? linjeY + 56 : linjeY - 32} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0f766e">
                                    {h.ar}
                                </text>
                            </Vis>
                        </g>
                    );
                })}
            </motion.g>
            <Vis nar={idag}>
                <rect x={150} y={150} width={1300} height={680} rx={30} fill="#ffffff" stroke="#0d9488" strokeWidth={5} />
                <text x={460} y={250} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f766e">
                    12 konfliktråd
                </text>
                {Array.from({ length: 12 }, (_, i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}>
                        <Kontor x={280 + (i % 4) * 120} y={400 + Math.floor(i / 4) * 120} />
                    </motion.g>
                ))}
                <text x={1140} y={250} textAnchor="middle" fontSize={64} fontWeight={900} fill={FARGE.rod}>
                    22 steder
                </text>
                {Array.from({ length: 22 }, (_, i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 + i * 0.05 }}>
                        <Nal x={930 + (i % 6) * 84} y={380 + Math.floor(i / 6) * 100} />
                    </motion.g>
                ))}
                <text x={800} y={240} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                    med kontor på
                </text>
            </Vis>
        </g>
    );
}

// ---------- Sakene ----------

function Saker({ beat }: { beat: number }) {
    const total = 8034;
    const straff = 1879;
    const sivil = 3050;
    const b = 1300;
    const x0 = 150;
    const wStraff = (straff / total) * b;
    const wSivil = (sivil / total) * b;
    return (
        <g>
            <Overskrift tekst={beat >= 3 ? 'Sakene i 2023' : 'To slags saker'} />
            {/* De to boksene */}
            {[
                { x: 420, tittel: 'Straffesaker', farge: '#1d4ed8', fra: 1, linjer: ['tyveri, hærverk,', 'mobbing eller vold', 'politiet sender saken'] },
                { x: 1180, tittel: 'Sivile saker', farge: '#0d9488', fra: 2, linjer: ['ingen har brutt loven', 'for eksempel:', 'krangel mellom naboer'] },
            ].map((k) => (
                <g key={k.tittel}>
                    <rect x={k.x - 330} y={140} width={660} height={370} rx={24} fill="#ffffff" stroke={k.farge} strokeWidth={5} />
                    <rect x={k.x - 330} y={140} width={660} height={84} rx={24} fill={k.farge} />
                    <text x={k.x} y={198} textAnchor="middle" fontSize={44} fontWeight={800} fill="#ffffff">
                        {k.tittel}
                    </text>
                    <Vis nar={beat >= k.fra}>
                        {k.linjer.map((l, i) => (
                            <text key={l} x={k.x} y={290 + i * 62} textAnchor="middle" fontSize={38} fontWeight={i === 2 ? 800 : 600} fill={i === 2 ? k.farge : '#334155'}>
                                {l}
                            </text>
                        ))}
                    </Vis>
                        {k.fra === 1 ? (
                            // Politiskilt
                            <g>
                                <path d={`M ${k.x - 290} 470 L ${k.x - 260} 450 L ${k.x - 230} 470 L ${k.x - 240} 500 L ${k.x - 280} 500 Z`} fill="#1d4ed8" />
                            </g>
                        ) : (
                            // To hus
                            <g>
                                {[-290, -230].map((dx) => (
                                    <g key={dx}>
                                        <rect x={k.x + dx} y={465} width={44} height={36} fill="#0d9488" />
                                        <path d={`M ${k.x + dx - 6} 465 L ${k.x + dx + 22} 445 L ${k.x + dx + 50} 465 Z`} fill="#0f766e" />
                                    </g>
                                ))}
                            </g>
                        )}
                </g>
            ))}
            {/* Stolpen */}
            <Vis nar={beat >= 3}>
                <rect x={x0} y={590} width={b} height={110} rx={14} fill="#cbd5e1" />
                {beat < 4 && (
                    <text x={800} y={662} textAnchor="middle" fontSize={50} fontWeight={900} fill={FARGE.tekst}>
                        {formatTall(total)} saker
                    </text>
                )}
                <Vis nar={beat >= 4}>
                    <motion.rect x={x0} y={590} height={110} fill="#1d4ed8" initial={{ width: 0 }} animate={{ width: wStraff }} transition={{ duration: 1 }} />
                    <motion.rect x={x0 + wStraff} y={590} height={110} fill="#0d9488" initial={{ width: 0 }} animate={{ width: wSivil }} transition={{ duration: 1, delay: 0.8 }} />
                    <text x={x0 + wStraff / 2} y={662} textAnchor="middle" fontSize={46} fontWeight={900} fill="#ffffff">
                        {formatTall(straff)}
                    </text>
                    <text x={x0 + wStraff + wSivil / 2} y={662} textAnchor="middle" fontSize={46} fontWeight={900} fill="#ffffff">
                        {formatTall(sivil)}
                    </text>
                    <text x={x0 + wStraff + wSivil + (b - wStraff - wSivil) / 2} y={662} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                        andre saker
                    </text>
                    <text x={x0 + wStraff / 2} y={760} textAnchor="middle" fontSize={30} fontWeight={700} fill="#1d4ed8">
                        mekling, straffesak
                    </text>
                    <text x={x0 + wStraff + wSivil / 2} y={760} textAnchor="middle" fontSize={30} fontWeight={700} fill="#0d9488">
                        mekling, sivil sak
                    </text>
                    <text x={800} y={840} textAnchor="middle" fontSize={34} fontWeight={800} fill={FARGE.tekst}>
                        Til sammen {formatTall(total)} saker i 2023
                    </text>
                </Vis>
            </Vis>
        </g>
    );
}

// ---------- Ofrene ----------

function Ring({ x, y, prosent, etikett }: { x: number; y: number; prosent: number; etikett: string }) {
    const r = 120;
    return (
        <g>
            <circle cx={x} cy={y} r={r} fill="none" stroke="#e2e8f0" strokeWidth={34} />
            <motion.circle
                cx={x}
                cy={y}
                r={r}
                fill="none"
                stroke="#0d9488"
                strokeWidth={34}
                transform={`rotate(-90 ${x} ${y})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: prosent / 100 }}
                transition={{ duration: 1.4 }}
            />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f766e">
                {prosent} %
            </text>
            <text x={x} y={y + r + 70} textAnchor="middle" fontSize={30} fontWeight={700} fill="#334155">
                {etikett}
            </text>
        </g>
    );
}

function Pil({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 9} y={y - 34} width={18} height={40} fill="#0d9488" />
            <path d={`M ${x - 26} ${y + 2} L ${x} ${y + 34} L ${x + 26} ${y + 2} Z`} fill="#0d9488" />
        </g>
    );
}

function Ofre({ beat }: { beat: number }) {
    return (
        <g>
            <Overskrift tekst="Hva sier forskningen?" />
            {/* Venstre: de danske undersøkelsene */}
            <rect x={70} y={140} width={760} height={700} rx={28} fill="#ffffff" />
            <text x={450} y={210} textAnchor="middle" fontSize={36} fontWeight={800} fill={FARGE.tekst}>
                Danske forskere
            </text>
            {beat === 0 ? (
                <g>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.g key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25 }}>
                            <rect x={290 + i * 18} y={300 + i * 60} width={260} height={180} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={4} />
                            {[0, 1, 2].map((j) => (
                                <rect key={j} x={315 + i * 18} y={330 + i * 60 + j * 34} width={200} height={12} rx={6} fill="#cbd5e1" />
                            ))}
                        </motion.g>
                    ))}
                    <text x={450} y={790} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                        gikk gjennom mange undersøkelser
                    </text>
                </g>
            ) : (
                <g>
                    <Ring x={270} y={430} prosent={77} etikett="Undersøkelse 1" />
                    <Ring x={630} y={430} prosent={85} etikett="Undersøkelse 2" />
                    <text x={450} y={720} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                        av ofrene syntes møtet
                    </text>
                    <text x={450} y={768} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                        var vellykket
                    </text>
                </g>
            )}
            {/* Høyre: studier fra andre land */}
            <Vis nar={beat >= 2}>
                <rect x={880} y={140} width={650} height={700} rx={28} fill="#ffffff" />
                <text x={1205} y={210} textAnchor="middle" fontSize={36} fontWeight={800} fill={FARGE.tekst}>
                    Studier fra andre land:
                </text>
                <text x={1205} y={260} textAnchor="middle" fontSize={30} fontWeight={600} fill="#475569">
                    etterpå er ofrene ofte
                </text>
                {[
                    { tekst: 'mindre redde', fra: 2 },
                    { tekst: 'mindre sinte', fra: 2 },
                    { tekst: 'sjeldnere ute etter hevn', fra: 3 },
                ].map((p, i) => (
                    <Vis key={p.tekst} nar={beat >= p.fra} forsinkelse={i * 0.4}>
                        <Pil x={960} y={380 + i * 150} />
                        <text x={1010} y={395 + i * 150} fontSize={42} fontWeight={800} fill={FARGE.tekst}>
                            {p.tekst}
                        </text>
                    </Vis>
                ))}
            </Vis>
        </g>
    );
}

// ---------- Forbeholdet ----------

function Gruppe({ x, y, farge, stiplet = false }: { x: number; y: number; farge: string; stiplet?: boolean }) {
    if (stiplet) {
        return (
            <g>
                <rect x={x - 170} y={y - 190} width={340} height={200} rx={20} fill="none" stroke="#94a3b8" strokeWidth={5} strokeDasharray="16 12" />
                <text x={x} y={y - 75} textAnchor="middle" fontSize={64} fontWeight={900} fill="#94a3b8">
                    ?
                </text>
            </g>
        );
    }
    // En tett klynge: et symbol for en gruppe, ikke et antall.
    return (
        <g>
            {[-110, -55, 0, 55, 110].map((dx, i) => (
                <Figur key={dx} x={x + dx} y={y - (i % 2) * 18} farge={farge} skala={0.75} />
            ))}
        </g>
    );
}

function Forbehold({ beat }: { beat: number }) {
    const titler = ['Ikke bare positivt', 'En sammenligning', 'Mindre hjelp etterpå?', 'Svakheter', 'Å bli hørt'];
    return (
        <g>
            <Overskrift tekst={titler[Math.min(beat, 4)]} />
            {beat === 0 && (
                <g>
                    <Figur x={500} y={760} farge={FARGE.randi} skala={2.2} />
                    <path d="M 470 520 Q 500 500 530 520" stroke="#0f172a" strokeWidth={6} fill="none" />
                    <rect x={680} y={250} width={780} height={300} rx={30} fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} />
                    <path d="M 700 500 L 610 580 L 760 540 Z" fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} strokeLinejoin="round" />
                    <rect x={700} y={500} width={70} height={45} fill="#ffffff" />
                    <text x={1070} y={330} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                        En del ofre er misfornøyde, særlig når:
                    </text>
                    <text x={1070} y={410} textAnchor="middle" fontSize={40} fontWeight={800} fill={FARGE.tekst}>
                        Møtet handlet bare om å hjelpe
                    </text>
                    <text x={1070} y={465} textAnchor="middle" fontSize={40} fontWeight={800} fill={FARGE.tekst}>
                        den som gjorde det
                    </text>
                </g>
            )}
            {beat >= 1 && beat <= 3 && (
                <g>
                    <Gruppe x={450} y={560} farge="#0d9488" />
                    <text x={450} y={630} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f766e">
                        Var i konfliktråd
                    </text>
                    <Gruppe x={1150} y={560} farge="#64748b" stiplet={beat === 3} />
                    <text x={1150} y={630} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                        {beat === 3 ? 'Mangler ofte' : 'Var ikke i konfliktråd'}
                    </text>
                    <text x={800} y={460} textAnchor="middle" fontSize={56} fontWeight={900} fill="#475569">
                        {beat === 3 ? '' : 'mot'}
                    </text>
                    {beat === 1 && (
                        <text x={800} y={230} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                            Forskernes egen undersøkelse
                        </text>
                    )}
                    {beat === 2 && (
                        <g>
                            <rect x={330} y={700} width={940} height={150} rx={24} fill="#ffffff" stroke="#475569" strokeWidth={4} />
                            <text x={800} y={760} textAnchor="middle" fontSize={32} fontWeight={700} fill="#334155">
                                Trengte de mindre hjelp fra psykolog eller lege?
                            </text>
                            <Kryss x={540} y={805} r={18} />
                            <text x={580} y={818} fontSize={36} fontWeight={800} fill={FARGE.rod}>
                                Det fant forskerne ikke
                            </text>
                        </g>
                    )}
                    {beat === 3 && (
                        <g>
                            <rect x={330} y={700} width={940} height={150} rx={24} fill="#ffffff" stroke="#b45309" strokeWidth={4} />
                            <text x={800} y={765} textAnchor="middle" fontSize={34} fontWeight={800} fill="#b45309">
                                Mange av de positive undersøkelsene
                            </text>
                            <text x={800} y={815} textAnchor="middle" fontSize={32} fontWeight={700} fill="#334155">
                                har ingen gruppe å sammenligne med
                            </text>
                        </g>
                    )}
                </g>
            )}
            {beat >= 4 && (
                <g>
                    <Figur x={520} y={780} farge={FARGE.randi} skala={2.2} />
                    <rect x={720} y={260} width={600} height={190} rx={40} fill="#ffffff" stroke="#0d9488" strokeWidth={6} />
                    <path d="M 760 430 L 680 520 L 840 445 Z" fill="#ffffff" stroke="#0d9488" strokeWidth={6} strokeLinejoin="round" />
                    <rect x={765} y={420} width={70} height={24} fill="#ffffff" />
                    <text x={1020} y={380} textAnchor="middle" fontSize={72} fontWeight={900} fill="#0f766e">
                        Hvorfor meg?
                    </text>
                    <text x={1020} y={600} textAnchor="middle" fontSize={40} fontWeight={800} fill={FARGE.tekst}>
                        For mange ofre er det viktig
                    </text>
                    <text x={1020} y={656} textAnchor="middle" fontSize={40} fontWeight={800} fill={FARGE.tekst}>
                        å bli hørt og få et svar
                    </text>
                </g>
            )}
        </g>
    );
}

export function KonfliktradetTall({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tid';
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                {modus === 'tid' && <Tid beat={beat} />}
                {modus === 'saker' && <Saker beat={beat} />}
                {modus === 'ofre' && <Ofre beat={beat} />}
                {modus === 'forbehold' && <Forbehold beat={beat} />}
            </svg>
        </div>
    );
}
