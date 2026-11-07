import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Kort, Overskrift, Tekst, Vis } from './kredittFelles';

/**
 * Pant og reglene rundt forbrukslån, i 2D. Fire moduser:
 * - pant: lån med pant (hus, hytte, bil står som sikkerhet) mot forbrukslån uten pant.
 * - fem: utlånsforskriften. All gjeld høyst fem ganger inntekten: 300 000 kr blir 1,5 millioner.
 * - register: banker og kortselskaper melder gjeld uten pant til gjeldsregistrene.
 * - inkasso: faktura, purring, inkasso. Gjelden vokser med gebyrer. Over 30 prosent av all
 *   forbruksgjeld var eid av inkassoselskaper ved slutten av 2025.
 * Hvor mye gjelden vokser for hvert steg, står ikke i artikkelen. Blokkene er et bilde.
 */

type Modus = 'pant' | 'fem' | 'register' | 'inkasso';

const OVERSKRIFT: Record<Modus, string[]> = {
    pant: [
        'Rente: prisen for å låne',
        'Lån med pant',
        'Banken kan ta det',
        'Forbrukslån: uten pant',
        'Større risiko, høyere rente',
    ],
    fem: [
        'Utlånsforskriften',
        'Høyst fem ganger inntekten',
        'Et eksempel',
        'Betal ned hver måned',
        'Banken skal også sjekke',
    ],
    register: [
        'Gjeldsregistrene',
        'Siden 1. juli 2019',
        'To registre',
        'Banken ser gjelden din',
        'Du kan se den selv',
    ],
    inkasso: ['Når du ikke betaler', 'Inkasso', 'Gjelden vokser', 'Ved slutten av 2025'],
};

// ---------- Små tegninger ----------

function Hus({
    x,
    y,
    s = 1,
    farge = '#f97316',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-70} y={-60} width={140} height={110} fill={farge} />
            <polygon points="-90,-60 0,-140 90,-60" fill="#7c2d12" />
            <rect x={-18} y={0} width={36} height={50} fill="#451a03" />
            <rect x={-55} y={-35} width={30} height={30} fill="#bfdbfe" />
            <rect x={25} y={-35} width={30} height={30} fill="#bfdbfe" />
        </g>
    );
}

function Bil({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-90} y={-40} width={180} height={50} rx={14} fill="#2563eb" />
            <path d="M -50 -40 L -30 -80 L 40 -80 L 60 -40 Z" fill="#1d4ed8" />
            <rect x={-25} y={-74} width={30} height={28} fill="#bfdbfe" />
            <rect x={12} y={-74} width={30} height={28} fill="#bfdbfe" />
            <circle cx={-50} cy={14} r={22} fill="#0f172a" />
            <circle cx={50} cy={14} r={22} fill="#0f172a" />
        </g>
    );
}

function Bank({ x, y, navn, s = 1 }: { x: number; y: number; navn: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <polygon points="-90,-50 0,-110 90,-50" fill="#475569" />
            <rect
                x={-80}
                y={-50}
                width={160}
                height={110}
                fill="#e2e8f0"
                stroke="#475569"
                strokeWidth={4}
            />
            {[-55, -18, 18, 55].map((xx) => (
                <rect key={xx} x={xx - 9} y={-36} width={18} height={84} fill="#94a3b8" />
            ))}
            <text x={0} y={100} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                {navn}
            </text>
        </g>
    );
}

function Pil({
    d,
    vis,
    farge = '#0f172a',
    forsinkelse = 0,
}: {
    d: string;
    vis: boolean;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={d}
            stroke={farge}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: vis ? 1 : 0, opacity: vis ? 1 : 0 }}
            transition={{ duration: 1, delay: vis ? forsinkelse : 0 }}
        />
    );
}

// ---------- Pant ----------

function ModusPant({ beat }: { beat: number }) {
    return (
        <g>
            <Vis vis={beat === 0}>
                <Kort
                    x={800}
                    y={300}
                    linjer={[
                        'Du låner penger.',
                        'Du betaler dem tilbake,',
                        'pluss en pris for å låne:',
                        'renten.',
                    ]}
                    str={48}
                />
            </Vis>
            <Vis vis={beat >= 1}>
                <rect
                    x={80}
                    y={180}
                    width={680}
                    height={600}
                    rx={28}
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth={4}
                />
                <Tekst x={420} y={250} str={44}>
                    Lån med pant
                </Tekst>
                <Hus x={230} y={430} s={0.9} />
                <Hus x={420} y={440} s={0.65} farge="#a16207" />
                <Bil x={600} y={450} />
                <Tekst x={230} y={530} str={30} farge="#475569">
                    hus
                </Tekst>
                <Tekst x={420} y={530} str={30} farge="#475569">
                    hytte
                </Tekst>
                <Tekst x={600} y={530} str={30} farge="#475569">
                    bil
                </Tekst>
                <Tekst x={420} y={610} str={34} farge="#0f766e">
                    står som sikkerhet
                </Tekst>
            </Vis>
            <Vis vis={beat >= 2}>
                <Tekst x={420} y={700} str={36} farge="#b91c1c">
                    Betaler du ikke, kan banken ta det
                </Tekst>
            </Vis>
            <Vis vis={beat >= 3}>
                <rect
                    x={840}
                    y={180}
                    width={680}
                    height={600}
                    rx={28}
                    fill="#ffffff"
                    stroke="#dc2626"
                    strokeWidth={4}
                />
                <Tekst x={1180} y={250} str={44} farge="#b91c1c">
                    Forbrukslån
                </Tekst>
                <rect
                    x={1010}
                    y={320}
                    width={340}
                    height={230}
                    rx={20}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={6}
                    strokeDasharray="20 14"
                />
                <Tekst x={1180} y={450} str={40} farge="#94a3b8">
                    ingenting
                </Tekst>
                <Tekst x={1180} y={610} str={34} farge="#475569">
                    uten pant: banken har
                </Tekst>
                <Tekst x={1180} y={652} str={34} farge="#475569">
                    ingenting å ta
                </Tekst>
            </Vis>
            <Vis vis={beat >= 4}>
                <Tekst x={1180} y={730} str={40} farge="#dc2626">
                    Vanligvis mye høyere rente
                </Tekst>
                <Tekst x={420} y={760} str={34} farge="#0f766e">
                    Boliglån: lavere rente
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- Fem ganger inntekten ----------

function ModusFem({ beat }: { beat: number }) {
    const B = 190;
    const H = 100;
    const x0 = 560;
    return (
        <g>
            <Vis vis={beat === 0}>
                <Kort x={800} y={300} linjer={['Statens regler', 'for lån']} str={52} />
            </Vis>
            <Vis vis={beat >= 1 && beat <= 2}>
                {/* Inntekten: én blokk */}
                <rect x={180} y={720 - H} width={B} height={H} rx={10} fill="#0d9488" />
                <Tekst x={180 + B / 2} y={780} str={34} farge="#0f766e">
                    inntekt
                </Tekst>
                <Tekst x={180 + B / 2} y={820} str={34} farge="#0f766e">
                    i ett år
                </Tekst>
                <Tekst x={470} y={690} str={70} vekt={900} farge="#475569">
                    ×5
                </Tekst>
                {/* Gjelden: fem like blokker */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.rect
                        key={i}
                        x={x0}
                        width={B}
                        height={H - 8}
                        rx={10}
                        fill="#dc2626"
                        initial={{ y: 720 - H, opacity: 0 }}
                        animate={{ y: 720 - H - i * H, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
                    />
                ))}
                <Tekst x={x0 + B / 2} y={780} str={34} farge="#b91c1c">
                    mest gjeld
                </Tekst>
                <Tekst x={x0 + B / 2} y={820} str={34} farge="#b91c1c">
                    til sammen
                </Tekst>
            </Vis>
            <Vis vis={beat === 1}>
                <Kort
                    x={1200}
                    y={330}
                    linjer={[
                        'All gjelden din',
                        'kan ikke bli større enn',
                        'fem ganger det du',
                        'tjener i året',
                    ]}
                    str={42}
                />
            </Vis>
            <Vis vis={beat === 2}>
                <Tekst x={1220} y={470} str={60} vekt={900} farge="#0f766e">
                    300 000 kr
                </Tekst>
                <Tekst x={1220} y={520} str={34} farge="#475569">
                    i inntekt
                </Tekst>
                <Tekst x={1220} y={640} str={60} vekt={900} farge="#b91c1c">
                    1,5 millioner
                </Tekst>
                <Tekst x={1220} y={690} str={34} farge="#475569">
                    mest i gjeld til sammen
                </Tekst>
            </Vis>
            <Vis vis={beat === 3}>
                {Array.from({ length: 12 }, (_, i) => (
                    <g key={i}>
                        <rect
                            x={250 + (i % 6) * 190}
                            y={260 + Math.floor(i / 6) * 230}
                            width={160}
                            height={190}
                            rx={16}
                            fill="#ffffff"
                            stroke="#94a3b8"
                            strokeWidth={4}
                        />
                        <rect
                            x={250 + (i % 6) * 190}
                            y={260 + Math.floor(i / 6) * 230}
                            width={160}
                            height={40}
                            rx={10}
                            fill="#dc2626"
                        />
                        <motion.path
                            d={`M ${285 + (i % 6) * 190} ${380 + Math.floor(i / 6) * 230} l 30 30 l 55 -60`}
                            stroke="#0d9488"
                            strokeWidth={12}
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
                        />
                    </g>
                ))}
                <Tekst x={800} y={800} str={40}>
                    Litt ned på gjelden, hver eneste måned
                </Tekst>
            </Vis>
            <Vis vis={beat >= 4}>
                <Bank x={420} y={470} navn="Banken" s={1.4} />
                <Kort
                    x={1100}
                    y={330}
                    linjer={[
                        'Klarer du å betale',
                        'tilbake?',
                        'Det skal banken sjekke',
                        'før du får lånet.',
                    ]}
                    str={44}
                />
            </Vis>
        </g>
    );
}

// ---------- Gjeldsregistrene ----------

function Register({ x, y, navn }: { x: number; y: number; navn: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={-70} rx={110} ry={30} fill="#a5b4fc" />
            <rect x={-110} y={-70} width={220} height={140} fill="#6366f1" />
            <ellipse cx={0} cy={70} rx={110} ry={30} fill="#4f46e5" />
            <ellipse cx={0} cy={-70} rx={110} ry={30} fill="#c7d2fe" />
            <text x={0} y={130} textAnchor="middle" fontSize={34} fontWeight={900} fill="#312e81">
                {navn}
            </text>
        </g>
    );
}

function ModusRegister({ beat }: { beat: number }) {
    const banker: [number, string][] = [
        [200, 'Bank'],
        [200, 'Kortselskap'],
        [200, 'Bank'],
    ];
    return (
        <g>
            {banker.map(([x, navn], i) => (
                <Bank key={i} x={x} y={260 + i * 210} navn={navn} s={0.8} />
            ))}
            <Vis vis={beat <= 1}>
                <Register x={950} y={460} navn="Gjeldsregister" />
            </Vis>
            <Vis vis={beat >= 2}>
                <Register x={850} y={330} navn="Gjeldsregisteret" />
                <Register x={850} y={640} navn="Norsk Gjeld" />
            </Vis>
            <Pil d="M 300 260 L 700 420" vis={beat === 1} farge="#4f46e5" />
            <Pil d="M 300 470 L 700 460" vis={beat === 1} farge="#4f46e5" forsinkelse={0.2} />
            <Pil d="M 300 680 L 700 500" vis={beat === 1} farge="#4f46e5" forsinkelse={0.4} />
            <Vis vis={beat === 0}>
                <Kort
                    x={1300}
                    y={330}
                    linjer={['Én oversikt', 'over gjeld', 'uten pant']}
                    str={44}
                />
            </Vis>
            <Vis vis={beat === 1}>
                <Kort x={1310} y={330} linjer={['Meld fra om', 'all gjeld uten pant']} str={40} />
            </Vis>
            <Vis vis={beat === 3}>
                <Pil d="M 980 330 L 1180 450" vis={beat === 3} farge="#0d9488" />
                <Pil d="M 980 640 L 1180 500" vis={beat === 3} farge="#0d9488" forsinkelse={0.2} />
                <Bank x={1340} y={470} navn="Lånesøknad" s={0.9} />
            </Vis>
            <Vis vis={beat >= 4}>
                <rect x={1180} y={220} width={280} height={500} rx={40} fill="#0f172a" />
                <rect x={1198} y={250} width={244} height={440} rx={28} fill="#ffffff" />
                <Tekst x={1320} y={310} str={32}>
                    All din gjeld
                </Tekst>
                {[0, 1, 2].map((i) => (
                    <rect
                        key={i}
                        x={1220}
                        y={350 + i * 90}
                        width={200}
                        height={60}
                        rx={12}
                        fill="#e0e7ff"
                    />
                ))}
                <Tekst x={1320} y={640} str={28} farge="#475569">
                    på ett sted
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- Inkasso ----------

function ModusInkasso({ beat }: { beat: number }) {
    const steg: [string, string][] = [
        ['Faktura', '#e2e8f0'],
        ['Purring', '#fde68a'],
        ['Inkasso', '#fca5a5'],
    ];
    // Hvor mange blokker gjelden er på hvert steg. Et bilde, ikke beløp.
    const blokker = [3, 4, 6];
    const aktiv = beat === 0 ? 1 : 2;
    if (beat >= 3) {
        const r = 230;
        const vinkel = 0.31 * Math.PI * 2;
        const x = 800 + r * Math.sin(vinkel);
        const y = 480 - r * Math.cos(vinkel);
        return (
            <g>
                <circle cx={800} cy={480} r={r} fill="#cbd5e1" />
                <motion.path
                    d={`M 800 480 L 800 ${480 - r} A ${r} ${r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Z`}
                    fill="#dc2626"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                />
                <Tekst x={1240} y={420} str={80} vekt={900} farge="#dc2626">
                    over 30 %
                </Tekst>
                <Tekst x={1240} y={480} str={34} farge="#475569">
                    av all forbruksgjeld
                </Tekst>
                <Tekst x={1240} y={524} str={34} farge="#475569">
                    i Norge var eid av
                </Tekst>
                <Tekst x={1240} y={568} str={34} farge="#475569">
                    inkassoselskaper
                </Tekst>
                <Tekst x={800} y={800} str={34} farge="#475569">
                    Omtrentlig: det røde er over 30 %
                </Tekst>
            </g>
        );
    }
    return (
        <g>
            {steg.map(([navn, farge], i) => {
                const x = 300 + i * 500;
                const vis = i <= aktiv;
                return (
                    <Vis key={navn} vis={vis} forsinkelse={i * 0.2}>
                        <rect
                            x={x - 150}
                            y={200}
                            width={300}
                            height={110}
                            rx={20}
                            fill={farge}
                            stroke="#475569"
                            strokeWidth={4}
                        />
                        <Tekst x={x} y={270} str={44}>
                            {navn}
                        </Tekst>
                        {Array.from({ length: blokker[i] }, (_, b) => (
                            <rect
                                key={b}
                                x={x - 70}
                                y={720 - (b + 1) * 52}
                                width={140}
                                height={46}
                                rx={8}
                                fill={b < 3 ? '#dc2626' : '#f97316'}
                            />
                        ))}
                        {i > 0 && (
                            <Tekst x={x} y={780} str={32} farge="#c2410c">
                                + gebyr
                            </Tekst>
                        )}
                        {i < 2 && (
                            <polygon
                                points={`${x + 190},255 ${x + 160},230 ${x + 160},280`}
                                fill="#475569"
                            />
                        )}
                    </Vis>
                );
            })}
            <Vis vis={beat === 0}>
                <Kort x={800} y={360} linjer={['Purring:', 'en påminnelse med gebyr']} str={36} />
            </Vis>
            <Vis vis={beat === 1}>
                <Kort
                    x={800}
                    y={360}
                    linjer={['Banken selger gjelden', 'til et inkassoselskap']}
                    str={36}
                />
            </Vis>
            <Vis vis={beat === 2}>
                <Kort
                    x={800}
                    y={360}
                    linjer={['Nye gebyrer.', 'Gjelden blir enda større.']}
                    str={36}
                    farge="#b91c1c"
                    kant="#ef4444"
                />
            </Vis>
        </g>
    );
}

export function KredittRegler({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'pant';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Overskrift tekst={tekst} />
                {modus === 'pant' && <ModusPant beat={beat} />}
                {modus === 'fem' && <ModusFem beat={beat} />}
                {modus === 'register' && <ModusRegister beat={beat} />}
                {modus === 'inkasso' && <ModusInkasso beat={beat} />}
            </svg>
        </div>
    );
}
