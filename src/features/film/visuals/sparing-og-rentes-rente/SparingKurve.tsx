import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import {
    DEMPET,
    Flate2D,
    INNSKUDD,
    JONAS,
    Kort,
    MORK,
    Overskrift,
    SARA,
    Tekst,
    Vis,
} from './sparingFelles';
import { sparekurve } from './sparingRegning';

/**
 * Sara og Jonas fra artikkelens tenkte eksempel: 1000 kr i måneden og 5 prosent i året.
 * Sara begynner ved 20 år, Jonas ved 30. Begge sparer til de er 60.
 * Fire moduser:
 * - start: to baner langs en aldersakse. Saras bane fylles fra 20, Jonas har bilen fra 20 til 30.
 * - resultat: to stolper ved 60 år i riktig målestokk: grått er det de har satt inn selv,
 *   grønt er renter. Bare artikkelens tall står skrevet.
 * - forskjell: kurvene over tid, regnet med samme modell som RentesRenteKurve i artikkelen
 *   (renten legges til ved slutten av hvert år). Ingen tall på aksen.
 * - jonas: hva Jonas kunne gjort: 200 kr i måneden mens han sparte til bilen.
 */

type Modus = 'start' | 'resultat' | 'forskjell' | 'jonas';

const OVERSKRIFT: Record<Modus, string[]> = {
    start: [
        'Samme klasse, hver sin deltidsjobb',
        'Begge sparer 1000 kr i måneden',
        'Sara begynner når hun er 20',
        'Jonas venter til han er 30',
        'Begge sparer til de er 60',
    ],
    resultat: ['Når de er 60 år', 'Sara', 'Jonas', 'Litt mer inn, nesten dobbelt så mye'],
    forskjell: [
        'Pengene på kontoen, år for år',
        'Ti år ekstra',
        'Ti år ekstra med renter på renter',
        'Forskjellen blir stor',
    ],
    jonas: [
        'Jonas valgte bilen først',
        'Han kunne spart litt samtidig',
        'Ti år ekstra til å vokse',
    ],
};

// ---------- Baner langs alder ----------

const AX0 = 260;
const AX_PR_AAR = 30;
const ax = (alder: number) => AX0 + (alder - 20) * AX_PR_AAR;
const AKSE_Y = 760;

function Aldersakse({ y = AKSE_Y }: { y?: number }) {
    return (
        <g>
            <line x1={ax(20)} y1={y} x2={ax(60)} y2={y} stroke={DEMPET} strokeWidth={4} />
            {[20, 30, 40, 50, 60].map((a) => (
                <g key={a}>
                    <line
                        x1={ax(a)}
                        y1={y}
                        x2={ax(a)}
                        y2={y + 16}
                        stroke={DEMPET}
                        strokeWidth={4}
                    />
                    <text
                        x={ax(a)}
                        y={y + 58}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill={DEMPET}
                    >
                        {`${a} år`}
                    </text>
                </g>
            ))}
        </g>
    );
}

/** En bil tegnet med noen få former, sentrert på (x, y). */
function Bil({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 70} y={y - 14} width={140} height={40} rx={12} fill="#b45309" />
            <path
                d={`M ${x - 42} ${y - 14} L ${x - 24} ${y - 46} L ${x + 30} ${y - 46} L ${x + 48} ${y - 14} Z`}
                fill="#d97706"
            />
            <rect x={x - 18} y={y - 40} width={20} height={22} fill="#fef3c7" />
            <rect x={x + 8} y={y - 40} width={22} height={22} fill="#fef3c7" />
            <circle cx={x - 40} cy={y + 28} r={15} fill={MORK} />
            <circle cx={x + 40} cy={y + 28} r={15} fill={MORK} />
        </g>
    );
}

/** En bane som fylles fra venstre. */
function Fyll({
    fra,
    til,
    y,
    h,
    farge,
    vis,
}: {
    fra: number;
    til: number;
    y: number;
    h: number;
    farge: string;
    vis: boolean;
}) {
    return (
        <motion.rect
            x={ax(fra)}
            y={y}
            height={h}
            rx={14}
            fill={farge}
            initial={{ width: 0 }}
            animate={{ width: vis ? ax(til) - ax(fra) : 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
    );
}

function Bane({ y, h, navn }: { y: number; h: number; navn: string }) {
    return (
        <g>
            <rect x={ax(20)} y={y} width={ax(60) - ax(20)} height={h} rx={14} fill="#e2e8f0" />
            <text
                x={AX0 - 30}
                y={y + h / 2 + 17}
                textAnchor="end"
                fontSize={48}
                fontWeight={900}
                fill={MORK}
            >
                {navn}
            </text>
        </g>
    );
}

function Start({ beat }: { beat: number }) {
    const sY = 230;
    const jY = 470;
    const h = 130;
    return (
        <g>
            <Aldersakse />
            <Bane y={sY} h={h} navn="Sara" />
            <Bane y={jY} h={h} navn="Jonas" />
            <Fyll fra={20} til={60} y={sY} h={h} farge={SARA} vis={beat >= 2} />
            <Fyll fra={30} til={60} y={jY} h={h} farge={JONAS} vis={beat >= 3} />
            <Vis vis={beat >= 3}>
                <rect x={ax(20)} y={jY} width={ax(30) - ax(20)} height={h} rx={14} fill="#fde68a" />
                <Bil x={(ax(20) + ax(30)) / 2} y={jY + h / 2 + 4} />
            </Vis>
            <Tekst
                x={ax(40)}
                y={sY + h / 2 + 14}
                str={40}
                farge={beat >= 2 ? '#ffffff' : DEMPET}
                vis={beat >= 1}
            >
                1000 kr i måneden
            </Tekst>
            <Tekst
                x={ax(45)}
                y={jY + h / 2 + 14}
                str={40}
                farge={beat >= 3 ? '#ffffff' : DEMPET}
                vis={beat >= 1}
            >
                1000 kr i måneden
            </Tekst>
            <Vis vis={beat >= 2}>
                <line
                    x1={ax(20)}
                    y1={sY - 10}
                    x2={ax(20)}
                    y2={sY - 46}
                    stroke={SARA}
                    strokeWidth={5}
                />
                <Tekst x={ax(20)} y={sY - 58} str={34} farge={SARA} anker="start">
                    Start: 20 år
                </Tekst>
            </Vis>
            <Vis vis={beat >= 3}>
                <line
                    x1={ax(30)}
                    y1={jY - 10}
                    x2={ax(30)}
                    y2={jY - 46}
                    stroke={JONAS}
                    strokeWidth={5}
                />
                <Tekst x={ax(30)} y={jY - 58} str={34} farge={JONAS} anker="start">
                    Start: 30 år
                </Tekst>
            </Vis>
            <Vis vis={beat >= 4}>
                <line
                    x1={ax(60)}
                    y1={sY - 40}
                    x2={ax(60)}
                    y2={AKSE_Y}
                    stroke={MORK}
                    strokeWidth={6}
                    strokeDasharray="14 10"
                />
                <path
                    d={`M ${ax(60)} ${sY - 40} L ${ax(60) + 70} ${sY - 22} L ${ax(60)} ${sY - 4} Z`}
                    fill="#dc2626"
                />
                <Kort x={1280} y={680} linjer={['+ 5 % i året']} farge={SARA} str={36} />
            </Vis>
        </g>
    );
}

// ---------- Resultat ved 60 ----------

const BUNN = 800;
const PR_KR = 520 / 1500000;

function Stolpe({
    x,
    innskudd,
    total,
    farge,
    vis,
    navn,
    innTekst,
    totTekst,
}: {
    x: number;
    innskudd: number;
    total: number;
    farge: string;
    vis: boolean;
    navn: string;
    innTekst: string;
    totTekst: string;
}) {
    const b = 300;
    const hInn = innskudd * PR_KR;
    const hTot = total * PR_KR;
    return (
        <g>
            <rect x={x - b / 2 - 10} y={BUNN} width={b + 20} height={8} fill={DEMPET} />
            <text
                x={x}
                y={BUNN + 66}
                textAnchor="middle"
                fontSize={50}
                fontWeight={900}
                fill={MORK}
            >
                {navn}
            </text>
            <motion.rect
                x={x - b / 2}
                width={b}
                rx={10}
                fill={farge}
                initial={{ y: BUNN, height: 0 }}
                animate={{ y: vis ? BUNN - hTot : BUNN, height: vis ? hTot : 0 }}
                transition={{ duration: 1.4, delay: vis ? 0.9 : 0, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.rect
                x={x - b / 2}
                width={b}
                rx={10}
                fill={INNSKUDD}
                initial={{ y: BUNN, height: 0 }}
                animate={{ y: vis ? BUNN - hInn : BUNN, height: vis ? hInn : 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <Vis vis={vis}>
                <text
                    x={x}
                    y={BUNN - hInn / 2 - 6}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill={MORK}
                >
                    satt inn
                </text>
                <text
                    x={x}
                    y={BUNN - hInn / 2 + 32}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={MORK}
                >
                    {innTekst}
                </text>
            </Vis>
            <Vis vis={vis} forsinkelse={1.4}>
                <text
                    x={x}
                    y={BUNN - hInn - (hTot - hInn) / 2 + 12}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    renter
                </text>
                <text
                    x={x}
                    y={BUNN - hTot - 22}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={farge}
                >
                    {totTekst}
                </text>
            </Vis>
        </g>
    );
}

function Resultat({ beat }: { beat: number }) {
    const jonasTopp = BUNN - 840000 * PR_KR;
    return (
        <g>
            <Stolpe
                x={520}
                innskudd={480000}
                total={1500000}
                farge={SARA}
                vis={beat >= 1}
                navn="Sara"
                innTekst="480 000 kr"
                totTekst="ca. 1,5 millioner"
            />
            <Stolpe
                x={1000}
                innskudd={360000}
                total={840000}
                farge={JONAS}
                vis={beat >= 2}
                navn="Jonas"
                innTekst="360 000 kr"
                totTekst="ca. 840 000 kr"
            />
            <Vis vis={beat === 0}>
                <Tekst x={520} y={BUNN - 60} str={120} farge="#cbd5e1" vekt={900}>
                    ?
                </Tekst>
                <Tekst x={1000} y={BUNN - 60} str={120} farge="#cbd5e1" vekt={900}>
                    ?
                </Tekst>
            </Vis>
            <Vis vis={beat >= 3}>
                <line
                    x1={340}
                    y1={jonasTopp}
                    x2={1160}
                    y2={jonasTopp}
                    stroke={MORK}
                    strokeWidth={4}
                    strokeDasharray="14 10"
                />
                <Kort
                    x={1370}
                    y={jonasTopp - 10}
                    linjer={['Jonas sitt nivå']}
                    str={30}
                    farge={JONAS}
                />
            </Vis>
            <g>
                <rect x={1230} y={600} width={36} height={36} rx={6} fill={INNSKUDD} />
                <text x={1280} y={630} fontSize={32} fontWeight={800} fill={MORK}>
                    satt inn selv
                </text>
                <rect x={1230} y={660} width={36} height={36} rx={6} fill={SARA} />
                <rect x={1248} y={660} width={18} height={36} fill={JONAS} />
                <text x={1280} y={690} fontSize={32} fontWeight={800} fill={MORK}>
                    renter
                </text>
            </g>
        </g>
    );
}

// ---------- Kurvene over tid ----------

const KX0 = 180;
const kx = (alder: number) => KX0 + (alder - 20) * 25;
const KBUNN = 780;
const ky = (verdi: number) => KBUNN - (verdi / 1600000) * 580;

const SARA_KURVE = sparekurve(20, 60, 1000, 5);
const JONAS_KURVE = sparekurve(30, 60, 1000, 5);
const sti = (p: { alder: number; verdi: number }[]) =>
    p
        .map((q, i) => `${i === 0 ? 'M' : 'L'} ${kx(q.alder).toFixed(1)} ${ky(q.verdi).toFixed(1)}`)
        .join(' ');
const SARA_STI = sti(SARA_KURVE);
const JONAS_STI = sti(JONAS_KURVE);
const MELLOM =
    sti(SARA_KURVE.filter((p) => p.alder >= 30)) +
    ' ' +
    [...JONAS_KURVE]
        .reverse()
        .map((q) => `L ${kx(q.alder).toFixed(1)} ${ky(q.verdi).toFixed(1)}`)
        .join(' ') +
    ' Z';

function Forskjell({ beat }: { beat: number }) {
    const saraSlutt = ky(SARA_KURVE[SARA_KURVE.length - 1].verdi);
    const jonasSlutt = ky(JONAS_KURVE[JONAS_KURVE.length - 1].verdi);
    return (
        <g>
            <Vis vis={beat === 1}>
                <rect
                    x={kx(20)}
                    y={200}
                    width={kx(30) - kx(20)}
                    height={KBUNN - 200}
                    fill="#fde68a"
                    opacity={0.7}
                />
                <Tekst x={(kx(20) + kx(30)) / 2} y={250} str={32} farge="#92400e">
                    20 til 30 år
                </Tekst>
                <Kort
                    x={(kx(20) + kx(30)) / 2 + 60}
                    y={560}
                    linjer={['+ 120 000 kr', 'satt inn av Sara']}
                    farge={SARA}
                    str={32}
                />
            </Vis>
            <Vis vis={beat >= 2}>
                <path d={MELLOM} fill={SARA} opacity={0.22} />
            </Vis>
            <line x1={kx(20)} y1={KBUNN} x2={kx(60)} y2={KBUNN} stroke={DEMPET} strokeWidth={4} />
            {[20, 30, 40, 50, 60].map((a) => (
                <text
                    key={a}
                    x={kx(a)}
                    y={KBUNN + 50}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={DEMPET}
                >
                    {`${a} år`}
                </text>
            ))}
            <text x={KX0} y={180} fontSize={32} fontWeight={800} fill={DEMPET}>
                Penger på kontoen
            </text>
            <motion.path
                d={SARA_STI}
                fill="none"
                stroke={SARA}
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            <motion.path
                d={JONAS_STI}
                fill="none"
                stroke={JONAS}
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
            />
            <text x={kx(60) + 26} y={saraSlutt + 4} fontSize={40} fontWeight={900} fill={SARA}>
                Sara
            </text>
            <text x={kx(60) + 26} y={saraSlutt + 46} fontSize={32} fontWeight={800} fill={SARA}>
                ca. 1,5 millioner
            </text>
            <text x={kx(60) + 26} y={jonasSlutt + 4} fontSize={40} fontWeight={900} fill={JONAS}>
                Jonas
            </text>
            <text x={kx(60) + 26} y={jonasSlutt + 46} fontSize={32} fontWeight={800} fill={JONAS}>
                ca. 840 000 kr
            </text>
            <Kort
                x={720}
                y={330}
                linjer={['Ti år ekstra', 'med renter på renter']}
                farge={SARA}
                str={34}
                vis={beat === 2}
            />
            <Vis vis={beat >= 3}>
                <line
                    x1={kx(60) + 8}
                    y1={saraSlutt}
                    x2={kx(60) + 8}
                    y2={jonasSlutt}
                    stroke={MORK}
                    strokeWidth={6}
                />
                <line
                    x1={kx(60) - 6}
                    y1={saraSlutt}
                    x2={kx(60) + 8}
                    y2={saraSlutt}
                    stroke={MORK}
                    strokeWidth={6}
                />
                <line
                    x1={kx(60) - 6}
                    y1={jonasSlutt}
                    x2={kx(60) + 8}
                    y2={jonasSlutt}
                    stroke={MORK}
                    strokeWidth={6}
                />
                <Kort
                    x={720}
                    y={330}
                    linjer={['Forskjellen er mye større', 'enn 120 000 kr']}
                    farge="#b91c1c"
                    str={34}
                />
            </Vis>
            <text x={1570} y={880} textAnchor="end" fontSize={26} fontWeight={700} fill={DEMPET}>
                Tenkt eksempel: 1000 kr i måneden, 5 % rente
            </text>
        </g>
    );
}

// ---------- Hva Jonas kunne gjort ----------

function Jonas({ beat }: { beat: number }) {
    const y = 320;
    const h = 150;
    const stripeY = y + h + 30;
    return (
        <g>
            <Aldersakse />
            <Bane y={y} h={h} navn="Jonas" />
            <rect x={ax(20)} y={y} width={ax(30) - ax(20)} height={h} rx={14} fill="#fde68a" />
            <Bil x={(ax(20) + ax(30)) / 2} y={y + h / 2 + 4} />
            <rect x={ax(30)} y={y} width={ax(60) - ax(30)} height={h} rx={14} fill={JONAS} />
            <text
                x={ax(45)}
                y={y + h / 2 + 14}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#ffffff"
            >
                1000 kr i måneden
            </text>
            <Vis vis={beat >= 1}>
                <rect
                    x={ax(20)}
                    y={stripeY}
                    width={ax(30) - ax(20)}
                    height={64}
                    rx={12}
                    fill={SARA}
                />
                <text
                    x={(ax(20) + ax(30)) / 2}
                    y={stripeY + 44}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    200 kr i måneden
                </text>
            </Vis>
            <Vis vis={beat >= 2}>
                <line
                    x1={ax(30) + 10}
                    y1={stripeY + 32}
                    x2={ax(60) - 30}
                    y2={stripeY + 32}
                    stroke={SARA}
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path
                    d={`M ${ax(60) - 40} ${stripeY + 6} L ${ax(60)} ${stripeY + 32} L ${ax(60) - 40} ${stripeY + 58} Z`}
                    fill={SARA}
                />
                <Tekst x={ax(45)} y={stripeY + 120} str={36} farge={SARA}>
                    pengene får vokse i ti år ekstra
                </Tekst>
            </Vis>
        </g>
    );
}

export function SparingKurve({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'start';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <Flate2D>
            <Overskrift tekst={tekst} />
            {modus === 'start' && <Start beat={beat} />}
            {modus === 'resultat' && <Resultat beat={beat} />}
            {modus === 'forskjell' && <Forskjell beat={beat} />}
            {modus === 'jonas' && <Jonas beat={beat} />}
        </Flate2D>
    );
}
