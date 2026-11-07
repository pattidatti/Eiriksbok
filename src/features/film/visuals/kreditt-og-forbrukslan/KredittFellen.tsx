import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Kort, Overskrift, Tekst, Vis } from './kredittFelles';

/**
 * Fellen med kredittkortet, i 2D. Fire moduser:
 * - kort: kortet er et lån fra kortselskapet. Kredittrammen på 20 000 kr, PC-en på 15 000 kr
 *   bruker det meste av den. Til slutt rundt 20 prosent effektiv rente.
 * - renter: renter på renter, regnestykket med 100 kroner fra artikkelen.
 * - betaling: hvor minstebeløpet går. Det meste til renter, en liten del til gjelden. Vist med
 *   ord, ikke som et målt forhold (artikkelen gir ingen andel).
 * - kurve: gjelden måned for måned i artikkelens tenkte eksempel (15 000 kr, 20 prosent).
 *   Minstebeløpet er 3 prosent av gjelden, minst 300 kr, som i Minstebelopsfellen i artikkelen.
 */

type Modus = 'kort' | 'renter' | 'betaling' | 'kurve';

const OVERSKRIFT: Record<Modus, string[]> = {
    kort: [
        'Kredittkort = forbrukslån',
        'Du låner av kortselskapet',
        'Kredittrammen',
        'Ikke dine penger',
        'Prisen',
    ],
    renter: [
        'To renter i reklamen',
        'To renter i reklamen',
        'Lån 100 kroner',
        'Etter et halvt år',
        'Etter et helt år',
        'Renter på renter',
    ],
    betaling: ['Minstebeløpet', 'Hvor går pengene?', 'Gjelden henger igjen', 'Regelen fra 2017'],
    kurve: [
        'Gjelden til Emil',
        'Bare minstebeløpet',
        'Hva kostet PC-en?',
        '1 500 kroner i måneden',
        'Samme PC',
    ],
};

// ---------- Kortet og rammen ----------

function Kredittkort({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={0} y={0} width={480} height={300} rx={30} fill="#1d4ed8" />
            <rect x={0} y={0} width={480} height={300} rx={30} fill="url(#kortglans)" />
            <rect x={50} y={90} width={80} height={60} rx={10} fill="#facc15" />
            <rect x={50} y={200} width={300} height={22} rx={8} fill="#bfdbfe" />
            <text x={430} y={60} textAnchor="end" fontSize={34} fontWeight={900} fill="#ffffff">
                KREDITT
            </text>
        </g>
    );
}

function ModusKort({ beat }: { beat: number }) {
    // Rammen: 20 000 kr. Stolpen er 520 høy, så 15 000 kr er 390.
    const H = 520;
    const brukt = (15000 / 20000) * H;
    return (
        <g>
            <defs>
                <linearGradient id="kortglans" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
            </defs>
            <Kredittkort x={140} y={250} s={1} />
            <Vis vis={beat === 0}>
                <Kort x={380} y={620} linjer={['Et forbrukslån', 'uten pant']} str={34} />
            </Vis>
            {/* Kortselskapet sender penger */}
            <Vis vis={beat === 1}>
                <rect
                    x={1060}
                    y={260}
                    width={340}
                    height={260}
                    rx={20}
                    fill="#e2e8f0"
                    stroke="#475569"
                    strokeWidth={5}
                />
                <polygon points="1040,265 1230,170 1420,265" fill="#475569" />
                {[1100, 1180, 1260, 1340].map((x) => (
                    <rect key={x} x={x} y={320} width={40} height={170} fill="#94a3b8" />
                ))}
                <Tekst x={1230} y={580} str={38}>
                    Kortselskapet
                </Tekst>
                <motion.path
                    d="M 1040 400 L 660 400"
                    stroke="#0d9488"
                    strokeWidth={16}
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat === 1 ? 1 : 0 }}
                    transition={{ duration: 1.2 }}
                />
                <polygon points="640,400 680,375 680,425" fill="#0d9488" />
                <Tekst x={850} y={370} str={34} farge="#0f766e">
                    lånte penger
                </Tekst>
                <Kort x={380} y={620} linjer={['Ikke dine egne penger']} str={36} />
            </Vis>
            {/* Rammen */}
            <Vis vis={beat >= 2 && beat <= 3}>
                <rect
                    x={1000}
                    y={200}
                    width={200}
                    height={H}
                    rx={16}
                    fill="#f1f5f9"
                    stroke="#1d4ed8"
                    strokeWidth={6}
                    strokeDasharray="18 12"
                />
                <motion.rect
                    x={1006}
                    width={188}
                    rx={12}
                    fill="#ef4444"
                    initial={{ y: 200 + H, height: 0 }}
                    animate={{
                        y: beat >= 2 ? 200 + H - brukt : 200 + H,
                        height: beat >= 2 ? brukt : 0,
                    }}
                    transition={{ duration: 1.4 }}
                />
                <Tekst x={1240} y={225} anker="start" str={36} farge="#1d4ed8">
                    Kredittramme
                </Tekst>
                <Tekst x={1240} y={268} anker="start" str={36} farge="#1d4ed8">
                    20 000 kr
                </Tekst>
                <Tekst x={1240} y={200 + H - brukt / 2} anker="start" str={36} farge="#b91c1c">
                    PC-en
                </Tekst>
                <Tekst x={1240} y={200 + H - brukt / 2 + 42} anker="start" str={36} farge="#b91c1c">
                    15 000 kr
                </Tekst>
            </Vis>
            <Vis vis={beat === 2}>
                <Kort x={380} y={620} linjer={['Grensen for hvor mye', 'du kan låne']} str={34} />
            </Vis>
            <Vis vis={beat === 3}>
                <Kort
                    x={380}
                    y={620}
                    linjer={['Rammen er ikke pengene dine.', 'Bare hvor mye du kan låne.']}
                    str={32}
                    farge="#b91c1c"
                    kant="#fca5a5"
                />
            </Vis>
            <Vis vis={beat >= 4}>
                <Tekst x={1150} y={430} str={170} vekt={900} farge="#dc2626">
                    ca. 20 %
                </Tekst>
                <Tekst x={1150} y={520} str={40}>
                    effektiv rente er ikke uvanlig
                </Tekst>
                <Tekst x={1150} y={570} str={40}>
                    på kredittkort
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- Renter på renter ----------

function Linje({
    y,
    belop,
    tekst,
    vis,
    farge = '#0f172a',
    fet,
}: {
    y: number;
    belop: string;
    tekst: string;
    vis: boolean;
    farge?: string;
    fet?: boolean;
}) {
    return (
        <Vis vis={vis}>
            <text
                x={760}
                y={y}
                textAnchor="end"
                fontSize={fet ? 64 : 52}
                fontWeight={900}
                fill={farge}
            >
                {belop}
            </text>
            <text x={800} y={y} textAnchor="start" fontSize={36} fontWeight={700} fill="#475569">
                {tekst}
            </text>
        </Vis>
    );
}

function ModusRenter({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                <Kort
                    x={480}
                    y={300}
                    linjer={['Nominell rente', 'den som står i avtalen']}
                    str={44}
                />
                <Vis vis={beat >= 1}>
                    <Kort
                        x={1120}
                        y={300}
                        linjer={[
                            'Effektiv rente',
                            'det lånet egentlig koster',
                            'nesten alltid høyest',
                        ]}
                        str={44}
                        farge="#b91c1c"
                        kant="#ef4444"
                    />
                </Vis>
            </g>
        );
    }
    return (
        <g>
            <Linje y={260} belop="100,00 kr" tekst="lånt, 10 % rente i året" vis />
            <Linje
                y={350}
                belop="+ 5,00 kr"
                tekst="5 % av 100 kr"
                vis={beat >= 3}
                farge="#b45309"
            />
            <Vis vis={beat >= 3}>
                <line x1={360} y1={385} x2={760} y2={385} stroke="#0f172a" strokeWidth={4} />
            </Vis>
            <Linje y={450} belop="105,00 kr" tekst="etter et halvt år" vis={beat >= 3} fet />
            <Linje
                y={560}
                belop="+ 5,25 kr"
                tekst="5 % av 105 kr"
                vis={beat >= 4}
                farge="#dc2626"
            />
            <Vis vis={beat >= 4}>
                <line x1={360} y1={595} x2={760} y2={595} stroke="#0f172a" strokeWidth={4} />
            </Vis>
            <Linje
                y={665}
                belop="110,25 kr"
                tekst="etter et helt år, ikke 110"
                vis={beat >= 4}
                fet
                farge="#b91c1c"
            />
            <Vis vis={beat >= 5}>
                <Kort
                    x={1250}
                    y={720}
                    linjer={['Effektiv rente: 10,25 %', 'rente også av rentene']}
                    str={40}
                    farge="#b91c1c"
                    kant="#ef4444"
                />
            </Vis>
        </g>
    );
}

// ---------- Hvor minstebeløpet går ----------

function ModusBetaling({ beat }: { beat: number }) {
    return (
        <g>
            {/* Fakturaen */}
            <rect
                x={110}
                y={200}
                width={360}
                height={470}
                rx={20}
                fill="#ffffff"
                stroke="#94a3b8"
                strokeWidth={4}
            />
            <Tekst x={290} y={265} str={38}>
                Faktura
            </Tekst>
            <rect x={150} y={300} width={280} height={14} rx={7} fill="#e2e8f0" />
            <rect x={150} y={340} width={220} height={14} rx={7} fill="#e2e8f0" />
            <rect
                x={150}
                y={420}
                width={280}
                height={110}
                rx={14}
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth={4}
            />
            <Tekst x={290} y={490} str={36} farge="#92400e">
                Minstebeløp
            </Tekst>
            <Vis vis={beat === 0}>
                <Tekst x={290} y={610} str={30} farge="#475569">
                    lite, og lett å velge
                </Tekst>
            </Vis>
            <Vis vis={beat >= 3}>
                <rect
                    x={150}
                    y={555}
                    width={280}
                    height={90}
                    rx={14}
                    fill="#ccfbf1"
                    stroke="#0d9488"
                    strokeWidth={4}
                />
                <Tekst x={290} y={612} str={30} farge="#0f766e">
                    Forslag: betal alt
                </Tekst>
            </Vis>
            {/* Fordelingen, med ord */}
            <Vis vis={beat >= 1 && beat <= 2}>
                <motion.path
                    d="M 480 470 C 640 470 680 300 860 300"
                    stroke="#dc2626"
                    strokeWidth={14}
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 1.2 }}
                />
                <motion.path
                    d="M 480 490 C 640 490 680 640 860 640"
                    stroke="#0d9488"
                    strokeWidth={14}
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                />
                <Kort
                    x={1170}
                    y={220}
                    linjer={['Det meste: renter', 'til kortselskapet']}
                    str={44}
                    farge="#b91c1c"
                    kant="#ef4444"
                />
                <Kort
                    x={1170}
                    y={580}
                    linjer={['En liten del:', 'ned på selve gjelden']}
                    str={36}
                    farge="#0f766e"
                    kant="#5eead4"
                />
            </Vis>
            <Vis vis={beat === 2}>
                <Tekst x={1170} y={480} str={40} farge="#475569">
                    Gjelden kan henge med i flere år
                </Tekst>
            </Vis>
            <Vis vis={beat >= 3}>
                <Kort
                    x={1120}
                    y={280}
                    linjer={[
                        'Siden 2017 må kortselskapet',
                        'foreslå at du betaler alt,',
                        'og vise hva det koster',
                        'å betale mindre',
                    ]}
                    str={40}
                />
            </Vis>
        </g>
    );
}

// ---------- Kurven ----------

/** Gjelden etter hver måned, i artikkelens eksempel. Regnet som i Minstebelopsfellen. */
function gjeldsKurve(betaling: (saldo: number) => number) {
    const r = Math.pow(1.2, 1 / 12) - 1;
    let saldo = 15000;
    const punkter = [saldo];
    while (saldo > 0.005 && punkter.length < 200) {
        saldo += saldo * r;
        saldo -= Math.min(saldo, betaling(saldo));
        punkter.push(saldo);
    }
    return punkter;
}

const MINSTE = gjeldsKurve((s) => Math.max(s * 0.03, 300));
const FAST = gjeldsKurve(() => 1500);

const X0 = 220;
const X1 = 1180;
const Y0 = 760;
const Y1 = 220;
const MND = 84;
const px = (m: number) => X0 + (m / MND) * (X1 - X0);
const py = (kr: number) => Y0 - (kr / 15000) * (Y0 - Y1);
const sti = (p: number[]) =>
    p.map((kr, m) => `${m === 0 ? 'M' : 'L'} ${px(m).toFixed(1)} ${py(kr).toFixed(1)}`).join(' ');

function ModusKurve({ beat }: { beat: number }) {
    const minsteSlutt = MINSTE.length - 1;
    const fastSlutt = FAST.length - 1;
    return (
        <g>
            {/* Akser */}
            <line x1={X0} y1={Y0} x2={X1 + 20} y2={Y0} stroke="#334155" strokeWidth={4} />
            <line x1={X0} y1={Y0} x2={X0} y2={Y1 - 20} stroke="#334155" strokeWidth={4} />
            {[1, 2, 3, 4, 5, 6, 7].map((aar) => (
                <g key={aar}>
                    <line
                        x1={px(aar * 12)}
                        y1={Y0}
                        x2={px(aar * 12)}
                        y2={Y0 + 14}
                        stroke="#334155"
                        strokeWidth={3}
                    />
                    <text
                        x={px(aar * 12)}
                        y={Y0 + 50}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#475569"
                    >
                        {`${aar} år`}
                    </text>
                </g>
            ))}
            <text
                x={X0 - 16}
                y={py(15000) + 10}
                textAnchor="end"
                fontSize={30}
                fontWeight={800}
                fill="#475569"
            >
                15 000
            </text>
            <text
                x={X0 - 16}
                y={Y0 + 10}
                textAnchor="end"
                fontSize={30}
                fontWeight={800}
                fill="#475569"
            >
                0
            </text>
            <text x={X0 + 10} y={Y1 - 34} fontSize={30} fontWeight={700} fill="#475569">
                Gjeld, kroner
            </text>
            <text x={X1} y={Y1 - 34} textAnchor="end" fontSize={28} fontWeight={700} fill="#64748b">
                Tenkt eksempel fra artikkelen
            </text>
            <Vis vis={beat === 0}>
                <Kort
                    x={800}
                    y={330}
                    linjer={['Tenkt eksempel', '15 000 kr på kort', '20 % effektiv rente']}
                    str={38}
                />
            </Vis>
            {/* Minstebeløpet */}
            <motion.path
                d={sti(MINSTE)}
                stroke="#dc2626"
                strokeWidth={9}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 2.5 }}
            />
            <Vis vis={beat >= 1} forsinkelse={beat === 1 ? 2.2 : 0}>
                <circle cx={px(minsteSlutt)} cy={Y0} r={14} fill="#dc2626" />
                <Kort
                    x={px(minsteSlutt) + 40}
                    y={Y0 - 220}
                    linjer={['Minstebeløpet', 'over 6 år']}
                    str={36}
                    farge="#b91c1c"
                    kant="#ef4444"
                />
            </Vis>
            <Vis vis={beat === 2}>
                <Kort
                    x={1300}
                    y={250}
                    linjer={['PC-en kostet', 'over 24 000 kr', 'over 9 000 kr renter']}
                    str={40}
                    farge="#b91c1c"
                    kant="#ef4444"
                />
            </Vis>
            {/* 1500 i måneden */}
            <motion.path
                d={sti(FAST)}
                stroke="#0d9488"
                strokeWidth={9}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1.5 }}
            />
            <Vis vis={beat >= 3} forsinkelse={beat === 3 ? 1.3 : 0}>
                <circle cx={px(fastSlutt)} cy={Y0} r={14} fill="#0d9488" />
            </Vis>
            <Vis vis={beat === 3}>
                <Kort
                    x={720}
                    y={150}
                    linjer={['1 500 kr i måneden', 'ferdig på under 1 år', 'ca. 1 400 kr renter']}
                    str={38}
                    farge="#0f766e"
                    kant="#5eead4"
                />
            </Vis>
            <Vis vis={beat >= 4}>
                <Kort
                    x={1290}
                    y={170}
                    linjer={['Samme PC.', 'Bare hvor fort du betaler', 'er forskjellig.']}
                    str={36}
                />
            </Vis>
        </g>
    );
}

export function KredittFellen({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kort';
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
                {modus === 'kort' && <ModusKort beat={beat} />}
                {modus === 'renter' && <ModusRenter beat={beat} />}
                {modus === 'betaling' && <ModusBetaling beat={beat} />}
                {modus === 'kurve' && <ModusKurve beat={beat} />}
            </svg>
        </div>
    );
}
