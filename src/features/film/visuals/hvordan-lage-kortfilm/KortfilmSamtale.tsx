import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Bilde, Dom, Hode, Lerret, Merke, Overskrift, Profil, Vis } from './felles';

/**
 * To personer som snakker sammen.
 * - replikk: Emma og venninnen med eksponeringsdialog, og den bedre replikken.
 * - akse: 180-gradersregelen. Kartet ovenfra til venstre, det kameraet ser til høyre.
 */

type Modus = 'replikk' | 'akse';

/** Snakkeboble med tekst over flere linjer. Pila peker ned mot (px, py). */
function Boble({
    x,
    y,
    b,
    linjer,
    px,
    farge = '#fff',
    kant = FARGE.blekk,
}: {
    x: number;
    y: number;
    b: number;
    linjer: string[];
    px: number;
    farge?: string;
    kant?: string;
}) {
    const h = 40 + linjer.length * 46;
    return (
        <g>
            <path
                d={`M ${px - 22} ${y + h - 4} L ${px} ${y + h + 40} L ${px + 22} ${y + h - 4} Z`}
                fill={farge}
                stroke={kant}
                strokeWidth={5}
            />
            <rect
                x={x}
                y={y}
                width={b}
                height={h}
                rx={28}
                fill={farge}
                stroke={kant}
                strokeWidth={5}
            />
            <rect x={px - 20} y={y + h - 8} width={40} height={10} fill={farge} />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + b / 2}
                    y={y + 58 + i * 46}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill={FARGE.blekk}
                >
                    {l}
                </text>
            ))}
        </g>
    );
}

function Replikk({ beat }: { beat: number }) {
    const overskrift = [
        'Filmreplikker: korte og indirekte',
        'Emma og venninnen',
        'Eksponeringsdialog',
        'Bedre: si det indirekte',
    ][Math.min(beat, 3)];
    const god = beat === 3;
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* Vinduet Emma ser ut av i den gode versjonen */}
            <Vis nar={god}>
                <rect
                    x={80}
                    y={300}
                    width={240}
                    height={300}
                    rx={10}
                    fill="#bae6fd"
                    stroke="#64748b"
                    strokeWidth={10}
                />
                <line x1={200} y1={300} x2={200} y2={600} stroke="#64748b" strokeWidth={8} />
            </Vis>
            {/* Emma (venstre) og venninnen (høyre) */}
            <g>
                {god ? (
                    <Profil x={520} y={560} r={80} farge="#be185d" retning={-1} />
                ) : (
                    <Profil x={520} y={560} r={80} farge="#be185d" retning={1} />
                )}
                <text
                    x={520}
                    y={810}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={FARGE.blekk}
                    className="font-display"
                >
                    Emma
                </text>
                <Profil x={1080} y={560} r={80} farge="#0369a1" retning={-1} />
                <text
                    x={1080}
                    y={810}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={FARGE.blekk}
                    className="font-display"
                >
                    Venninnen
                </text>
            </g>
            {beat === 0 && (
                <>
                    <Merke x={520} y={330} tekst="kort" farge={FARGE.bla} str={40} />
                    <Merke x={1080} y={330} tekst="indirekte" farge={FARGE.lilla} str={40} />
                </>
            )}
            {(beat === 1 || beat === 2) && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Boble
                        x={150}
                        y={150}
                        b={620}
                        linjer={['«Husker du at pappa dro', 'for tre år siden?»']}
                        px={520}
                        kant={beat === 2 ? FARGE.rod : FARGE.blekk}
                    />
                    <Boble
                        x={860}
                        y={240}
                        b={560}
                        linjer={['«Ja, det var hardt for deg.»']}
                        px={1080}
                        kant={beat === 2 ? FARGE.rod : FARGE.blekk}
                    />
                </motion.g>
            )}
            <Vis nar={beat === 2}>
                <Dom x={1480} y={200} ok={false} r={44} />
                {/* Replikkene går rett ut til seeren */}
                <Hode x={1440} y={640} r={52} farge="#475569" ser={-1} />
                <path
                    d="M 1300 330 Q 1420 420 1430 520"
                    stroke={FARGE.rod}
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray="16 12"
                />
                <text
                    x={1440}
                    y={830}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={FARGE.rod}
                >
                    seeren
                </text>
                <Merke
                    x={800}
                    y={880 - 24}
                    tekst="bare for å informere seeren"
                    farge={FARGE.rod}
                    str={30}
                />
            </Vis>
            {god && (
                <motion.g
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Boble
                        x={380}
                        y={150}
                        b={700}
                        linjer={['«Han sendte ikke engang', 'melding til bursdagen min.»']}
                        px={560}
                        kant={FARGE.gronn}
                    />
                    <Dom x={1140} y={190} ok r={44} />
                    <Merke
                        x={800}
                        y={856}
                        tekst="vi skjønner resten selv"
                        farge={FARGE.gronn}
                        str={30}
                    />
                </motion.g>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- akse */

const JONAS = { x: 260, y: 480 };
const SOFIE = { x: 600, y: 480 };

/** Kamera sett ovenfra: en boks med en kjegle som viser hvor det ser. */
function Kamera({
    x,
    y,
    vinkel,
    farge,
    navn,
}: {
    x: number;
    y: number;
    vinkel: number;
    farge: string;
    navn: string;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
            <g transform={`rotate(${vinkel})`}>
                <path d="M 0 0 L 150 -70 L 150 70 Z" fill={farge} opacity={0.18} />
                <rect x={-34} y={-24} width={58} height={48} rx={8} fill={farge} />
                <rect x={22} y={-14} width={20} height={28} rx={4} fill={farge} />
            </g>
            <text x={0} y={62} textAnchor="middle" fontSize={30} fontWeight={800} fill={farge}>
                {navn}
            </text>
        </motion.g>
    );
}

/** Person sett ovenfra: sirkel med nese i retningen personen ser. */
function Ovenfra({
    x,
    y,
    farge,
    navn,
    retning,
}: {
    x: number;
    y: number;
    farge: string;
    navn: string;
    retning: 1 | -1;
}) {
    return (
        <g>
            <circle cx={x} cy={y} r={44} fill={farge} />
            <path
                d={`M ${x + retning * 38} ${y - 14} L ${x + retning * 64} ${y} L ${x + retning * 38} ${y + 14} Z`}
                fill={farge}
            />
            <text
                x={x}
                y={y - 64}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill={FARGE.blekk}
                className="font-display"
            >
                {navn}
            </text>
        </g>
    );
}

function Akse({ beat }: { beat: number }) {
    const overskrift = [
        'En tenkt linje mellom dem',
        'Kameraet på én side',
        'Over linja: alt snur',
        '180-gradersregelen',
    ][Math.min(beat, 3)];
    const krysset = beat === 2;
    // Kamera B filmer Sofie. På beat 2 står det på den andre siden av linja.
    const kamB = krysset ? { x: 330, y: 260, v: 35 } : { x: 330, y: 700, v: -35 };
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* Kartet ovenfra */}
            <rect
                x={60}
                y={170}
                width={760}
                height={640}
                rx={24}
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth={4}
            />
            <text x={90} y={215} fontSize={28} fontWeight={700} fill={FARGE.gra}>
                sett ovenfra
            </text>
            <Vis nar={beat === 3}>
                <rect
                    x={64}
                    y={484}
                    width={752}
                    height={322}
                    rx={20}
                    fill={FARGE.gronn}
                    opacity={0.14}
                />
                <rect
                    x={64}
                    y={174}
                    width={752}
                    height={306}
                    rx={20}
                    fill={FARGE.rod}
                    opacity={0.1}
                />
                <text
                    x={440}
                    y={790}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={FARGE.gronn}
                >
                    kameraet holder seg på denne siden
                </text>
                <text
                    x={440}
                    y={270}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={FARGE.rod}
                >
                    ikke kryss linja
                </text>
            </Vis>
            <line
                x1={100}
                y1={JONAS.y}
                x2={780}
                y2={SOFIE.y}
                stroke={beat === 2 ? FARGE.rod : FARGE.gul}
                strokeWidth={8}
                strokeDasharray="22 14"
            />
            <Ovenfra x={JONAS.x} y={JONAS.y} farge="#0f766e" navn="Jonas" retning={1} />
            <Ovenfra x={SOFIE.x} y={SOFIE.y} farge="#be185d" navn="Sofie" retning={-1} />
            <Vis nar={beat >= 1}>
                <Kamera x={530} y={700} vinkel={-145} farge={FARGE.bla} navn="A" />
                <Kamera
                    x={kamB.x}
                    y={kamB.y}
                    vinkel={kamB.v}
                    farge={krysset ? FARGE.rod : FARGE.lilla}
                    navn="B"
                />
            </Vis>
            {/* Det kameraene ser */}
            <Vis nar={beat >= 1}>
                <text
                    x={1190}
                    y={200}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill={FARGE.gra}
                >
                    det seeren ser
                </text>
                <Bilde x={900} y={225} b={580} h={250} bakgrunn="#cbd5e1">
                    <Profil x={1190} y={330} r={60} farge="#0f766e" retning={1} />
                    <text x={930} y={265} fontSize={28} fontWeight={800} fill={FARGE.bla}>
                        A
                    </text>
                </Bilde>
                <Bilde x={900} y={505} b={580} h={250} bakgrunn="#cbd5e1">
                    <Profil x={1190} y={610} r={60} farge="#be185d" retning={krysset ? 1 : -1} />
                    <text
                        x={930}
                        y={545}
                        fontSize={28}
                        fontWeight={800}
                        fill={krysset ? FARGE.rod : FARGE.lilla}
                    >
                        B
                    </text>
                </Bilde>
                <text
                    x={1440}
                    y={360}
                    textAnchor="end"
                    fontSize={56}
                    fontWeight={900}
                    fill={FARGE.blekk}
                >
                    →
                </text>
                <text
                    x={krysset ? 1440 : 940}
                    y={640}
                    textAnchor={krysset ? 'end' : 'start'}
                    fontSize={56}
                    fontWeight={900}
                    fill={krysset ? FARGE.rod : FARGE.blekk}
                >
                    {krysset ? '→' : '←'}
                </text>
            </Vis>
            <Vis nar={beat === 1 || beat === 3}>
                <Merke x={1190} y={820} tekst="De ser mot hverandre" farge={FARGE.gronn} str={32} />
            </Vis>
            <Vis nar={beat === 2}>
                <Merke x={1190} y={820} tekst="Begge ser samme vei" farge={FARGE.rod} str={32} />
            </Vis>
        </>
    );
}

export function KortfilmSamtale({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'replikk';
    return (
        <Lerret>
            {modus === 'replikk' && <Replikk beat={beat} />}
            {modus === 'akse' && <Akse beat={beat} />}
        </Lerret>
    );
}
