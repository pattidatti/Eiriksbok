import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { DEMPET, Flate2D, Kort, MORK, Overskrift, SARA, Tekst, Vis } from './sparingFelles';

/**
 * Valgene rundt sparingen, tegnet i 2D.
 * Fire moduser:
 * - risiko: sparekonto, enkeltaksjer og fond som linjer over tid. Skisse uten tall: linjene
 *   viser bare det artikkelen sier om formen (jevn, svinger mye, sprer seg).
 * - horisont: høyere mulig gevinst betyr høyere risiko, og når du trenger pengene.
 * - bsu: et hus som fylles: 27 500 kr i året opp til 300 000 kr, i riktig målestokk, og
 *   10 prosent tilbake i skatt.
 * - pris: prisstigning. Kontoen vokser, handlekurven blir mindre. Skisse uten tall.
 */

type Modus = 'risiko' | 'horisont' | 'bsu' | 'pris';

const FOND = '#7c3aed';
const AKSJE = '#ea580c';
const ROD = '#dc2626';

const OVERSKRIFT: Record<Modus, string[]> = {
    risiko: [
        'Sparekonto i banken',
        'Du vet renten, men vokser vanligvis saktere',
        'Én aksje: en bit av ett selskap',
        'Verdien kan også falle',
        'Fond: aksjer i mange selskaper',
        'Ikke alle eggene i én kurv',
    ],
    horisont: [
        'Høyere mulig gevinst: nesten alltid høyere risiko',
        'Hva er risiko?',
        'Trenger du pengene snart?',
        'Skal pengene stå lenge?',
    ],
    bsu: [
        'BSU: boligsparing for ungdom',
        'For unge',
        'Opptil 27 500 kr i året',
        'Skattefradrag: 10 % av det du setter inn',
        'To krav',
        'Bare til bolig',
    ],
    pris: [
        'Fienden: prisstigning',
        'Hvis prisene stiger raskere enn renten',
        'Mer på kontoen, mindre i kurven',
    ],
};

// ---------- risiko ----------

const RX0 = 200;
const RX1 = 1300;
const STEG = 60;
const ry = (v: number) => 620 - (v - 1) * 300;
const rx = (i: number) => RX0 + (i / STEG) * (RX1 - RX0);

/** Fast tilfeldig tallrekke, så skissen ser lik ut hver gang. */
function lcg(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function lagAksjer() {
    const r = lcg(7);
    const aksjer: number[][] = [];
    for (let k = 0; k < 8; k++) {
        const rekke = [1];
        for (let i = 1; i <= STEG; i++) {
            const forrige = rekke[i - 1];
            let neste = forrige * (1 + 0.012 + (r() - 0.5) * 0.11);
            // Aksje 0 går godt lenge, og så går det dårlig med selskapet.
            if (k === 0)
                neste =
                    i < 38
                        ? 1 + i * 0.022 + Math.sin(i * 0.9) * 0.05
                        : Math.max(0.45, forrige * 0.93);
            // Aksje 1 er den som går bra.
            if (k === 1) neste = 1 + Math.pow(i / STEG, 1.3) * 1.25 + Math.sin(i * 0.7) * 0.09;
            rekke.push(Math.min(2.4, Math.max(0.35, neste)));
        }
        aksjer.push(rekke);
    }
    return aksjer;
}

const AKSJER = lagAksjer();
const FONDET = AKSJER[0].map((_, i) => AKSJER.reduce((s, a) => s + a[i], 0) / AKSJER.length);
const BANK = Array.from(
    { length: STEG + 1 },
    (_, i) => Math.pow(1.3, i / STEG) + (i / STEG) * (i / STEG - 1) * 0.03
);
const sti = (rekke: number[]) =>
    rekke.map((v, i) => `${i === 0 ? 'M' : 'L'} ${rx(i).toFixed(1)} ${ry(v).toFixed(1)}`).join(' ');

function Linje({
    rekke,
    farge,
    bredde,
    vis,
    opasitet = 1,
}: {
    rekke: number[];
    farge: string;
    bredde: number;
    vis: boolean;
    opasitet?: number;
}) {
    return (
        <motion.path
            d={sti(rekke)}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: vis ? 1 : 0, opacity: vis ? opasitet : 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
    );
}

function Risiko({ beat }: { beat: number }) {
    const slutt = (rekke: number[]) => ry(rekke[STEG]);
    return (
        <g>
            <line
                x1={RX0}
                y1={ry(1)}
                x2={RX1}
                y2={ry(1)}
                stroke={DEMPET}
                strokeWidth={3}
                strokeDasharray="12 10"
            />
            <text x={RX0} y={ry(1) + 44} fontSize={30} fontWeight={800} fill={DEMPET}>
                det du satte inn
            </text>
            <line x1={RX0} y1={850} x2={RX1} y2={850} stroke={DEMPET} strokeWidth={4} />
            <text x={RX0} y={890} textAnchor="start" fontSize={30} fontWeight={800} fill={DEMPET}>
                tid
            </text>
            {/* Alle aksjene i fondet */}
            {AKSJER.map((a, k) => (
                <Linje
                    key={k}
                    rekke={a}
                    farge={k === 0 && beat >= 5 ? ROD : '#c4b5fd'}
                    bredde={k === 0 && beat >= 5 ? 7 : 3}
                    vis={beat >= 4}
                    opasitet={k === 0 && beat >= 5 ? 1 : 0.9}
                />
            ))}
            <Linje rekke={BANK} farge={SARA} bredde={9} vis />
            <Tekst x={RX1 + 20} y={slutt(BANK) + 12} str={34} farge={SARA} anker="start">
                Sparekonto
            </Tekst>
            <Linje rekke={FONDET} farge={FOND} bredde={9} vis={beat === 1 || beat >= 4} />
            <Tekst
                x={RX1 + 20}
                y={slutt(FONDET) - 14}
                str={34}
                farge={FOND}
                anker="start"
                vis={beat === 1 || beat >= 4}
            >
                Fond
            </Tekst>
            <Linje rekke={AKSJER[1]} farge={AKSJE} bredde={7} vis={beat === 2} />
            <Tekst
                x={RX1 + 20}
                y={slutt(AKSJER[1]) + 12}
                str={34}
                farge={AKSJE}
                anker="start"
                vis={beat === 2}
            >
                Én aksje
            </Tekst>
            <Linje rekke={AKSJER[0]} farge={ROD} bredde={7} vis={beat === 3} />
            <Tekst
                x={RX1 + 20}
                y={slutt(AKSJER[0]) + 12}
                str={34}
                farge={ROD}
                anker="start"
                vis={beat === 3 || beat >= 5}
            >
                Én aksje
            </Tekst>
            <Kort
                x={560}
                y={250}
                linjer={['Du vet renten', 'verdien svinger ikke']}
                farge={SARA}
                str={34}
                vis={beat === 1}
            />
            <Kort
                x={560}
                y={250}
                linjer={['Går det bra med selskapet,', 'kan du tjene penger']}
                farge={AKSJE}
                str={34}
                vis={beat === 2}
            />
            <Kort
                x={560}
                y={250}
                linjer={['Mindre enn du satte inn']}
                farge={ROD}
                str={34}
                vis={beat === 3}
            />
            <Kort
                x={560}
                y={250}
                linjer={['Pengene spres', 'på mange selskaper']}
                farge={FOND}
                str={34}
                vis={beat === 4}
            />
            <Kort
                x={560}
                y={250}
                linjer={['Ett selskap går dårlig:', 'fondet merker det mindre']}
                farge={FOND}
                str={34}
                vis={beat >= 5}
            />
            <text x={1580} y={890} textAnchor="end" fontSize={30} fontWeight={800} fill={DEMPET}>
                Skisse: ingen ekte tall
            </text>
        </g>
    );
}

// ---------- horisont ----------

const PUNKTER = [
    { navn: 'Sparekonto', x: 420, y: 660, farge: SARA },
    { navn: 'Fond', x: 820, y: 480, farge: FOND },
    { navn: 'Én aksje', x: 1220, y: 300, farge: AKSJE },
];

function Horisont({ beat }: { beat: number }) {
    const fokus = (i: number) => (beat === 2 ? i === 0 : beat === 3 ? i > 0 : true);
    return (
        <g>
            <text x={1580} y={880} textAnchor="end" fontSize={30} fontWeight={800} fill={DEMPET}>
                Skisse: ingen ekte tall
            </text>
            <line
                x1={250}
                y1={780}
                x2={1420}
                y2={780}
                stroke={beat === 1 ? ROD : MORK}
                strokeWidth={beat === 1 ? 8 : 5}
            />
            <path d="M 1440 780 L 1405 762 L 1405 798 Z" fill={beat === 1 ? ROD : MORK} />
            <text
                x={1420}
                y={835}
                textAnchor="end"
                fontSize={38}
                fontWeight={900}
                fill={beat === 1 ? ROD : MORK}
            >
                Risiko
            </text>
            <line x1={250} y1={780} x2={250} y2={200} stroke={MORK} strokeWidth={5} />
            <path d="M 250 180 L 232 215 L 268 215 Z" fill={MORK} />
            <text
                x={205}
                y={490}
                textAnchor="middle"
                fontSize={38}
                fontWeight={900}
                fill={MORK}
                transform="rotate(-90 205 490)"
            >
                Mulig gevinst
            </text>
            <line
                x1={330}
                y1={720}
                x2={1300}
                y2={240}
                stroke="#cbd5e1"
                strokeWidth={6}
                strokeDasharray="16 12"
            />
            {PUNKTER.map((p, i) => (
                <motion.g
                    key={p.navn}
                    animate={{ opacity: fokus(i) ? 1 : 0.25 }}
                    transition={{ duration: 0.5 }}
                >
                    <circle cx={p.x} cy={p.y} r={34} fill={p.farge} />
                    <text
                        x={p.x}
                        y={p.y + 82}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill={p.farge}
                    >
                        {p.navn}
                    </text>
                </motion.g>
            ))}
            <Kort
                x={720}
                y={220}
                linjer={['Risiko:', 'hvor usikkert det er hva du ender med']}
                farge={ROD}
                str={34}
                vis={beat === 1}
            />
            <Vis vis={beat === 2}>
                <line x1={420} y1={440} x2={420} y2={612} stroke={SARA} strokeWidth={6} />
                <Kort
                    x={470}
                    y={380}
                    linjer={['Trenger pengene', 'om et halvt år']}
                    farge={SARA}
                    str={34}
                />
            </Vis>
            <Vis vis={beat === 3}>
                <line x1={1080} y1={600} x2={860} y2={510} stroke={FOND} strokeWidth={6} />
                <line x1={1180} y1={600} x2={1210} y2={340} stroke={AKSJE} strokeWidth={6} />
                <Kort
                    x={1180}
                    y={640}
                    linjer={['Skal ikke bruke dem', 'på tjue år']}
                    farge={FOND}
                    str={34}
                />
            </Vis>
        </g>
    );
}

// ---------- bsu ----------

const HX = 200;
const HB = 620;
const HBUNN = 800;
const HH = 460;
const PR_KR = HH / 300000;
const AAR = 27500 * PR_KR;

function Bsu({ beat }: { beat: number }) {
    const tak = HBUNN - HH;
    return (
        <g>
            {/* Huset som en krukke */}
            <motion.rect
                x={HX}
                width={HB}
                fill={SARA}
                initial={{ y: HBUNN, height: 0 }}
                animate={{ y: beat >= 2 ? HBUNN - AAR : HBUNN, height: beat >= 2 ? AAR : 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <rect x={HX} y={tak} width={HB} height={HH} fill="none" stroke={MORK} strokeWidth={8} />
            <path
                d={`M ${HX - 40} ${tak} L ${HX + HB / 2} ${tak - 150} L ${HX + HB + 40} ${tak} Z`}
                fill="#e2e8f0"
                stroke={MORK}
                strokeWidth={8}
                strokeLinejoin="round"
            />
            <text
                x={HX + HB / 2}
                y={tak - 30}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill={MORK}
            >
                BSU
            </text>
            <Vis vis={beat >= 2}>
                <line
                    x1={HX - 20}
                    y1={tak}
                    x2={HX + HB + 20}
                    y2={tak}
                    stroke={ROD}
                    strokeWidth={5}
                    strokeDasharray="14 10"
                />
                <text
                    x={HX + HB / 2}
                    y={tak + 56}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill={ROD}
                >
                    maks 300 000 kr til sammen
                </text>
                <text
                    x={HX + HB / 2}
                    y={HBUNN - AAR - 18}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={SARA}
                >
                    ett år: 27 500 kr
                </text>
            </Vis>
            {/* Mynten som kommer tilbake fra skatten */}
            <Vis vis={beat === 3}>
                <circle
                    cx={HX + HB + 110}
                    cy={HBUNN - 120}
                    r={56}
                    fill="#facc15"
                    stroke="#ca8a04"
                    strokeWidth={6}
                />
                <text
                    x={HX + HB + 110}
                    y={HBUNN - 108}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#713f12"
                >
                    10 %
                </text>
            </Vis>
            <Kort
                x={1200}
                y={300}
                linjer={['Til og med året', 'du fyller 33 år']}
                farge={SARA}
                str={40}
                vis={beat === 1}
            />
            <Kort
                x={1200}
                y={300}
                linjer={['Opptil 27 500 kr i året', 'opptil 300 000 kr i alt']}
                farge={SARA}
                str={36}
                vis={beat === 2}
            />
            <Kort
                x={1230}
                y={300}
                linjer={['Setter du inn 27 500 kr,', 'betaler du 2750 kr', 'mindre i skatt']}
                farge="#a16207"
                str={36}
                vis={beat === 3}
            />
            <Kort
                x={1200}
                y={270}
                linjer={['Du må betale skatt']}
                farge={MORK}
                str={38}
                vis={beat === 4}
            />
            <Kort
                x={1200}
                y={430}
                linjer={['Du kan ikke eie', 'en bolig fra før']}
                farge={MORK}
                str={38}
                vis={beat === 4}
            />
            <Vis vis={beat === 5}>
                <Kort x={1200} y={300} linjer={['Til noe annet?']} farge={ROD} str={40} />
                <Kort
                    x={1200}
                    y={480}
                    linjer={['Betal tilbake hele', 'skattefordelen']}
                    farge={ROD}
                    str={36}
                />
                <line x1={HX + HB + 30} y1={500} x2={1060} y2={320} stroke={ROD} strokeWidth={6} />
            </Vis>
        </g>
    );
}

// ---------- pris ----------

type VareType = 'melk' | 'eple' | 'brod';
const VARER: VareType[] = ['melk', 'eple', 'brod', 'eple', 'melk', 'brod', 'eple', 'melk'];

function Vare({ x, y, type }: { x: number; y: number; type: VareType }) {
    if (type === 'melk') {
        return (
            <g>
                <rect
                    x={x - 34}
                    y={y - 40}
                    width={68}
                    height={90}
                    rx={6}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth={5}
                />
                <path
                    d={`M ${x - 34} ${y - 40} L ${x} ${y - 70} L ${x + 34} ${y - 40} Z`}
                    fill="#bfdbfe"
                    stroke="#2563eb"
                    strokeWidth={5}
                />
                <rect x={x - 34} y={y} width={68} height={22} fill="#2563eb" />
            </g>
        );
    }
    if (type === 'eple') {
        return (
            <g>
                <circle cx={x} cy={y + 10} r={42} fill="#dc2626" />
                <path d={`M ${x} ${y - 30} q 20 -30 40 -18 q -18 22 -40 18`} fill="#16a34a" />
            </g>
        );
    }
    return (
        <rect
            x={x - 56}
            y={y - 22}
            width={112}
            height={64}
            rx={30}
            fill="#d97706"
            stroke="#92400e"
            strokeWidth={5}
        />
    );
}

function Pris({ beat }: { beat: number }) {
    const kontoH = beat >= 1 ? 380 : 320;
    const igjen = beat >= 1 ? 5 : 8;
    return (
        <g>
            {/* Kontoen */}
            <text x={330} y={230} textAnchor="middle" fontSize={44} fontWeight={900} fill={MORK}>
                Kontoen
            </text>
            <rect x={230} y={800} width={200} height={8} fill={DEMPET} />
            <motion.rect
                x={240}
                width={180}
                rx={12}
                fill={SARA}
                initial={{ y: 800, height: 0 }}
                animate={{ y: 800 - kontoH, height: kontoH }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <Tekst x={330} y={800 - kontoH - 24} str={34} farge={SARA} vis={beat >= 1}>
                + renter
            </Tekst>
            {/* Handlekurven */}
            <text x={1050} y={230} textAnchor="middle" fontSize={44} fontWeight={900} fill={MORK}>
                Dette får du kjøpt
            </text>
            <path
                d="M 660 420 L 1440 420 L 1380 800 L 720 800 Z"
                fill="#f1f5f9"
                stroke={MORK}
                strokeWidth={8}
                strokeLinejoin="round"
            />
            {VARER.map((t, i) => {
                const kol = i % 4;
                const rad = Math.floor(i / 4);
                const x = 820 + kol * 160;
                const y = 520 + rad * 160;
                const borte = i >= igjen;
                return (
                    <motion.g
                        key={i}
                        animate={{ opacity: borte ? 0 : 1 }}
                        transition={{ duration: 0.8, delay: borte ? 0.6 + (i - igjen) * 0.25 : 0 }}
                    >
                        <Vare x={x} y={y} type={t} />
                    </motion.g>
                );
            })}
            <Vis vis={beat === 1}>
                <path
                    d="M 1490 640 L 1490 460"
                    stroke={ROD}
                    strokeWidth={14}
                    strokeLinecap="round"
                />
                <path d="M 1490 420 L 1460 475 L 1520 475 Z" fill={ROD} />
                <text
                    x={1490}
                    y={700}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill={ROD}
                >
                    prisene
                </text>
            </Vis>
            <Kort
                x={800}
                y={330}
                linjer={['Større tall, men du får kjøpt mindre']}
                farge={ROD}
                str={36}
                vis={beat >= 2}
            />
            <text x={1580} y={880} textAnchor="end" fontSize={30} fontWeight={800} fill={DEMPET}>
                Skisse: ingen ekte tall
            </text>
        </g>
    );
}

export function SparingValg({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'risiko';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate2D>
            <Overskrift tekst={tekst} />
            {modus === 'risiko' && <Risiko beat={beat} />}
            {modus === 'horisont' && <Horisont beat={beat} />}
            {modus === 'bsu' && <Bsu beat={beat} />}
            {modus === 'pris' && <Pris beat={beat} />}
        </Flate2D>
    );
}
