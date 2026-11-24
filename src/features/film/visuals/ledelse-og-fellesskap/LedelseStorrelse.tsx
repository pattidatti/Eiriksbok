import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate, Kort, Overskrift, Vis } from './felles';

/**
 * Lik form, ulik størrelse. Først toppen i Siste Dagers Hellige og i Jehovas vitner,
 * så to stolper i riktig forhold: rundt 1,36 milliarder katolikker (2020) mot rundt
 * 8,6 millioner forkynnere i Jehovas vitner (2019).
 */

const GULL = '#ca8a04';
const BLA = '#2563eb';
const LILLA = '#6366f1';
const BAR = 1100;

function Node({
    x,
    y,
    r = 26,
    farge,
    svak = false,
}: {
    x: number;
    y: number;
    r?: number;
    farge: string;
    svak?: boolean;
}) {
    return (
        <circle
            cx={x}
            cy={y}
            r={r}
            fill={svak ? 'none' : farge}
            stroke={farge}
            strokeWidth={svak ? 4 : 0}
            strokeDasharray={svak ? '8 6' : undefined}
        />
    );
}

function Stolpe({
    y,
    bredde,
    farge,
    etikett,
    tall,
}: {
    y: number;
    bredde: number;
    farge: string;
    etikett: string;
    tall: string;
}) {
    return (
        <g>
            <text x={300} y={y - 30} fontSize={36} fontWeight={800} fill="#334155">
                {etikett}
            </text>
            <rect x={300} y={y} width={BAR} height={90} rx={10} fill="#e2e8f0" />
            <motion.rect
                x={300}
                y={y}
                height={90}
                rx={6}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: Math.max(bredde, 6) }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <text x={300} y={y + 150} fontSize={44} fontWeight={900} fill="#0f172a">
                {tall}
            </text>
        </g>
    );
}

export function LedelseStorrelse({ beat }: VisualProps) {
    const sml = beat >= 3;
    return (
        <Flate>
            <Overskrift>{sml ? 'Lik form, ulik størrelse' : 'En tydelig topp'}</Overskrift>
            <Vis nar={!sml}>
                {/* Siste Dagers Hellige */}
                <Kort x={400} y={170} tekst="Siste Dagers Hellige" str={34} bakgrunn="#fef9c3" />
                <line x1={400} y1={270} x2={300} y2={350} stroke="#a16207" strokeWidth={5} />
                <line x1={400} y1={270} x2={500} y2={350} stroke="#a16207" strokeWidth={5} />
                <Node x={400} y={270} r={40} farge={GULL} />
                <Node x={300} y={350} farge={GULL} />
                <Node x={500} y={350} farge={GULL} />
                <Kort x={400} y={430} tekst="President og to rådgivere" str={34} />
                <Vis nar={beat >= 1}>
                    <Kort x={620} y={270} tekst="Profet" str={34} bakgrunn={GULL} farge="#fff" />
                    {Array.from({ length: 12 }, (_, i) => (
                        <Node key={i} x={125 + i * 50} y={530} r={18} farge="#a16207" />
                    ))}
                    <Kort x={400} y={600} tekst="De tolv apostlene" str={34} />
                    <Kort
                        x={400}
                        y={710}
                        tekst="Åpenbaringer fra Gud, ifølge kirken"
                        str={34}
                        bakgrunn="#fef9c3"
                    />
                </Vis>
            </Vis>
            <Vis nar={!sml && beat >= 2}>
                <line
                    x1={800}
                    y1={140}
                    x2={800}
                    y2={800}
                    stroke="#cbd5e1"
                    strokeWidth={4}
                    strokeDasharray="12 10"
                />
                <Kort x={1200} y={170} tekst="Jehovas vitner" str={34} bakgrunn="#dbeafe" />
                {Array.from({ length: 18 }, (_, i) => (
                    <Node
                        key={i}
                        x={1000 + (i % 9) * 50}
                        y={i < 9 ? 290 : 350}
                        r={18}
                        farge={BLA}
                        svak={i >= 7}
                    />
                ))}
                <Kort x={1200} y={440} tekst="Har hatt sju til atten medlemmer" str={34} />
                <Kort
                    x={1200}
                    y={530}
                    tekst="Bare menn, bare ved invitasjon"
                    str={34}
                    bakgrunn="#dbeafe"
                />
            </Vis>
            <Vis nar={sml}>
                <g transform="translate(160 250)">
                    <path d="M 0 -50 L 60 50 L -60 50 Z" fill={LILLA} />
                </g>
                <Stolpe
                    y={240}
                    bredde={BAR}
                    farge={LILLA}
                    etikett="Katolikker (2020), under én pave"
                    tall="ca. 1,36 milliarder"
                />
                <g transform="translate(160 540)">
                    <path d="M 0 -50 L 60 50 L -60 50 Z" fill={BLA} />
                </g>
                <Stolpe
                    y={530}
                    bredde={(BAR * 8.6) / 1360}
                    farge={BLA}
                    etikett="Forkynnere i Jehovas vitner (2019), under et titalls menn"
                    tall="ca. 8,6 millioner"
                />
            </Vis>
            <Vis nar={beat >= 4}>
                <Kort
                    x={800}
                    y={820}
                    tekst="Formen er lik. Størrelsen er det ikke."
                    str={42}
                    bakgrunn="#0f172a"
                    farge="#fff"
                />
            </Vis>
        </Flate>
    );
}
