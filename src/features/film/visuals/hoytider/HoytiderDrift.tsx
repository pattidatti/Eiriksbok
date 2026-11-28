import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { FARGE, MANEDER, MANEDSTART, bareMane, dag, erSkuddAar, maneSol } from './felles';

/**
 * Hvor høytiden havner, år for år. Den vannrette aksen er årene, den loddrette er året
 * fra januar (øverst) til desember (nederst). En flat linje står fast, en sagtann vandrer
 * gjennom hele året, og en sikksakk vandrer fram og tilbake inne i én årstid.
 * «pesach»: jødedommen med sju skuddmåneder på nitten år, og hanukka i november/desember.
 * «indisk»: vesak (fullmåne), vaisakhi (fast dato) og Guru Nanaks fødselsdag.
 * «alle»: ramadan, jul og pesach i samme bilde, over 33 år.
 * Kurvene er en modell, ikke virkelige datoer.
 */

type Modus = 'pesach' | 'indisk' | 'alle';

const B = 1600;
const H = 900;
const X0 = 230;
const X1 = 1000;
const Y0 = 190;
const Y1 = 830;

const ANTALL: Record<Modus, number> = { pesach: 19, indisk: 12, alle: 33 };

function yFor(d: number) {
    return Y0 + (d / 365) * (Y1 - Y0);
}

function xFor(aar: number, antall: number) {
    return X0 + ((aar - 1) / (antall - 1)) * (X1 - X0);
}

/** Linje gjennom punktene. Bryter linja der den hopper rundt årsskiftet. */
function sti(punkter: [number, number][]) {
    let d = '';
    punkter.forEach(([x, y], i) => {
        const forrige = punkter[i - 1];
        const brudd = !forrige || Math.abs(forrige[1] - y) > (Y1 - Y0) / 2;
        d += `${brudd ? 'M' : 'L'} ${x} ${y} `;
    });
    return d;
}

function Kurve({
    dager,
    antall,
    farge,
    navn,
    bredde = 8,
    forsinkelse = 0,
    dy = 0,
}: {
    dager: number[];
    antall: number;
    farge: string;
    navn: string;
    bredde?: number;
    forsinkelse?: number;
    dy?: number;
}) {
    const p = dager.map((d, i) => [xFor(i + 1, antall), yFor(d)] as [number, number]);
    const siste = p[p.length - 1];
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <path
                d={sti(p)}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {p.map(([x, y], i) => (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={bredde}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={3}
                />
            ))}
            <text
                x={siste[0] + 30}
                y={siste[1] + 12 + dy}
                fontSize={34}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
}

/** Et bånd for en årstid eller noen måneder, med navn i venstre kant av plottet. */
function Band({
    fra,
    til,
    farge,
    tekst,
}: {
    fra: number;
    til: number;
    farge: string;
    tekst?: string;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect
                x={X0 - 20}
                y={yFor(fra)}
                width={X1 - X0 + 40}
                height={yFor(til) - yFor(fra)}
                fill={farge}
                opacity={0.18}
            />
            {tekst && (
                <text x={X0} y={yFor(fra) - 10} fontSize={28} fontWeight={800} fill={farge}>
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

function Akser({ antall }: { antall: number }) {
    const steg = antall > 20 ? 4 : antall > 12 ? 3 : 1;
    const merker = Array.from({ length: antall }, (_, i) => i + 1).filter(
        (a) => a === 1 || a % steg === 0
    );
    return (
        <g>
            <rect x={X0 - 20} y={Y0} width={X1 - X0 + 40} height={Y1 - Y0} fill="#ffffff" />
            {MANEDSTART.map((d, i) => (
                <g key={i}>
                    <line
                        x1={X0 - 20}
                        x2={X1 + 20}
                        y1={yFor(d)}
                        y2={yFor(d)}
                        stroke="#e2e8f0"
                        strokeWidth={2}
                    />
                    <text
                        x={X0 - 36}
                        y={yFor(d + 15) + 10}
                        textAnchor="end"
                        fontSize={28}
                        fontWeight={700}
                        fill={FARGE.dempet}
                    >
                        {MANEDER[i]}
                    </text>
                </g>
            ))}
            {merker.map((a) => (
                <text
                    key={a}
                    x={xFor(a, antall)}
                    y={Y1 + 40}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fill={FARGE.dempet}
                >
                    {a}
                </text>
            ))}
            <text
                x={X1 + 20}
                y={Y1 + 40}
                textAnchor="end"
                fontSize={26}
                fontWeight={700}
                fill={FARGE.dempet}
                dx={70}
            >
                år
            </text>
        </g>
    );
}

/** Kort til høyre for plottet. */
function Kort({ linjer, y = 250, farge }: { linjer: string[]; y?: number; farge: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={1230}
                y={y}
                width={350}
                height={44 + linjer.length * 50}
                rx={22}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={4}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={1252}
                    y={y + 60 + i * 50}
                    fontSize={i === 0 ? 36 : 32}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={i === 0 ? farge : FARGE.tekst}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

const PESACH = 100;
const aar = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

function Pesach({ beat }: { beat: number }) {
    const n = ANTALL.pesach;
    const pesach = aar(n).map((a) => maneSol(PESACH, a));
    const utenSkudd = aar(9).map((a) => PESACH - 11 * (a - 1));
    const hanukka = pesach.map((d) => d + 245);
    return (
        <>
            <Akser antall={n} />
            <Band fra={dag(3, 1)} til={dag(6, 1)} farge="#16a34a" tekst="våren" />
            {beat >= 4 && (
                <Band
                    fra={dag(11, 1)}
                    til={365}
                    farge={FARGE.jodedom}
                    tekst="november og desember"
                />
            )}
            {beat >= 4 && <Band fra={dag(7, 1)} til={dag(8, 1)} farge={FARGE.rod} />}
            {beat === 0 && (
                <>
                    <motion.path
                        d={sti(utenSkudd.map((d, i) => [xFor(i + 1, n), yFor(d)]))}
                        fill="none"
                        stroke={FARGE.dempet}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2 }}
                    />
                    <text
                        x={xFor(9, n) + 20}
                        y={yFor(utenSkudd[8]) + 10}
                        fontSize={30}
                        fontWeight={800}
                        fill={FARGE.dempet}
                    >
                        uten skuddmåned
                    </text>
                </>
            )}
            {beat >= 1 && <Kurve dager={pesach} antall={n} farge={FARGE.jodedom} navn="Pesach" />}
            {beat >= 1 &&
                aar(n)
                    .filter((a) => erSkuddAar(a))
                    .map((a, i) => (
                        <motion.g
                            key={a}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.3 }}
                            style={{
                                transformOrigin: `${xFor(a, n)}px ${yFor(pesach[a - 1]) - 46}px`,
                                transformBox: 'view-box',
                            }}
                        >
                            <circle
                                cx={xFor(a, n)}
                                cy={yFor(pesach[a - 1]) - 46}
                                r={22}
                                fill="#f59e0b"
                            />
                            <text
                                x={xFor(a, n)}
                                y={yFor(pesach[a - 1]) - 36}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={900}
                                fill="#ffffff"
                            >
                                {i + 1}
                            </text>
                        </motion.g>
                    ))}
            {beat >= 4 && <Kurve dager={hanukka} antall={n} farge="#0e7490" navn="Hanukka" />}
            {beat >= 4 && (
                <g>
                    <text
                        x={X0}
                        y={yFor(dag(7, 20)) + 10}
                        fontSize={30}
                        fontWeight={900}
                        fill={FARGE.rod}
                    >
                        juli: aldri
                    </text>
                </g>
            )}
            {beat === 0 && (
                <Kort
                    farge={FARGE.dempet}
                    linjer={['354 dager', '11 dager', 'for tidlig', 'hvert år']}
                />
            )}
            {(beat === 1 || beat === 2) && (
                <Kort farge="#b45309" linjer={['7 skuddmåneder', 'på 19 år']} />
            )}
            {beat === 2 && (
                <Kort farge="#b45309" y={470} linjer={['Adar sheni:', 'den andre', 'adar']} />
            )}
            {beat === 3 && (
                <Kort
                    farge={FARGE.jodedom}
                    linjer={['År 358', 'Rabbi Hillel 2.', 'gir systemet', 'fast form']}
                />
            )}
            {beat === 4 && (
                <Kort
                    farge={FARGE.jodedom}
                    linjer={['Datoen sklir,', 'men årstiden', 'står fast']}
                />
            )}
        </>
    );
}

function Indisk({ beat }: { beat: number }) {
    const n = ANTALL.indisk;
    const vesak = aar(n).map((a) => maneSol(118, a));
    const vaisakhi = aar(n).map(() => dag(4, 13));
    const nanak = aar(n).map((a) => maneSol(320, a));
    return (
        <>
            <Akser antall={n} />
            <Band fra={dag(4, 1)} til={dag(6, 1)} farge={FARGE.buddha} tekst="april og mai" />
            {beat >= 4 && (
                <Band fra={dag(11, 1)} til={dag(12, 1)} farge={FARGE.sikh} tekst="november" />
            )}
            <Kurve
                dager={vesak}
                antall={n}
                farge={FARGE.buddha}
                navn="Vesak"
                dy={beat >= 2 ? 26 : 0}
            />
            {vesak.map((d, i) => (
                <circle
                    key={i}
                    cx={xFor(i + 1, n)}
                    cy={yFor(d)}
                    r={13}
                    fill="#fef08a"
                    stroke={FARGE.buddha}
                    strokeWidth={4}
                />
            ))}
            {beat >= 2 && (
                <Kurve dager={vaisakhi} antall={n} farge={FARGE.sikh} navn="Vaisakhi" dy={-16} />
            )}
            {beat >= 4 && <Kurve dager={nanak} antall={n} farge="#9a3412" navn="Guru Nanak" />}
            {beat === 0 && (
                <Kort farge={FARGE.buddha} linjer={['Vesak', 'fullmånedagen', 'i vaishakha']} />
            )}
            {beat === 1 && (
                <Kort
                    farge={FARGE.buddha}
                    linjer={['Theravada:', 'fødsel,', 'oppvåkning', 'og død på', 'samme dato']}
                />
            )}
            {beat === 2 && (
                <Kort
                    farge={FARGE.sikh}
                    linjer={['Vaisakhi', 'som regel', '13. april', 'fast etter sola']}
                />
            )}
            {beat === 3 && (
                <Kort
                    farge={FARGE.sikh}
                    linjer={['1699', 'Guru Gobind', 'Singh oppretter', 'khalsa']}
                />
            )}
            {beat === 4 && (
                <Kort
                    farge="#9a3412"
                    y={480}
                    linjer={['Minnedager', 'flytter seg:', 'Guru Nanak', 'som regel', 'i november']}
                />
            )}
        </>
    );
}

function Alle({ beat }: { beat: number }) {
    const n = ANTALL.alle;
    const ramadan = aar(n).map((a) => bareMane(dag(7, 10), a));
    const jul = aar(n).map(() => dag(12, 25));
    const pesach = aar(n).map((a) => maneSol(PESACH, a));
    const vesak = aar(n).map((a) => maneSol(118, a));
    const lys = (min: number) => (beat === 4 ? 1 : beat === min ? 1 : 0.35);
    return (
        <>
            <Akser antall={n} />
            {beat === 0 && (
                <text
                    x={(X0 + X1) / 2}
                    y={yFor(dag(10, 1))}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill={FARGE.dempet}
                >
                    11 dager i året
                </text>
            )}
            {beat === 0 && (
                <g opacity={0.3}>
                    <Kurve dager={ramadan} antall={n} farge={FARGE.islam} navn="" bredde={5} />
                    <Kurve dager={pesach} antall={n} farge={FARGE.jodedom} navn="" bredde={5} />
                    <Kurve dager={jul} antall={n} farge={FARGE.rod} navn="" bredde={5} />
                </g>
            )}
            {beat >= 1 && (
                <g opacity={lys(1)}>
                    <Kurve
                        dager={ramadan}
                        antall={n}
                        farge={FARGE.islam}
                        navn="Ramadan"
                        bredde={6}
                    />
                </g>
            )}
            {beat === 1 && (
                <>
                    <Band fra={dag(7, 1)} til={dag(8, 1)} farge={FARGE.sol} tekst="juli" />
                    <Band fra={dag(12, 1)} til={365} farge={FARGE.jodedom} tekst="desember" />
                </>
            )}
            {beat >= 2 && (
                <g opacity={lys(2)}>
                    <Kurve dager={jul} antall={n} farge={FARGE.rod} navn="Jul" />
                </g>
            )}
            {beat >= 3 && (
                <g opacity={lys(3)}>
                    <Kurve
                        dager={pesach}
                        antall={n}
                        farge={FARGE.jodedom}
                        navn="Pesach"
                        bredde={6}
                        dy={-18}
                    />
                    <Kurve
                        dager={vesak}
                        antall={n}
                        farge={FARGE.buddha}
                        navn="Vesak"
                        bredde={6}
                        dy={22}
                    />
                </g>
            )}
            {beat === 1 && (
                <Kort farge={FARGE.islam} y={260} linjer={['Bare måne:', 'vandrer', 'hele året']} />
            )}
            {beat === 2 && <Kort farge={FARGE.rod} y={260} linjer={['Bare sol:', 'står fast']} />}
            {beat === 3 && (
                <Kort
                    farge={FARGE.jodedom}
                    y={360}
                    linjer={['Begge:', 'fram og tilbake,', 'samme årstid']}
                />
            )}
            {beat === 4 && (
                <Kort
                    farge={FARGE.dempet}
                    y={360}
                    linjer={['Ikke mindre', 'nøyaktig:', 'laget for', 'å følge månen']}
                />
            )}
        </>
    );
}

const TEKST: Record<Modus, string[]> = {
    pesach: [
        'Jødedommen: 354 dager',
        'Sju skuddmåneder på nitten år',
        'Skuddmåneden: adar sheni',
        'Et fast system',
        'Pesach om våren, hanukka i nov. eller des.',
    ],
    indisk: [
        'Buddhismen: fullmånen bestemmer',
        'Vesak',
        'Sikhismen: vaisakhi',
        'Khalsa',
        'Guruenes minnedager flytter seg',
    ],
    alle: [
        'Mønsteret',
        'Bare måne: ramadan',
        'Bare sol: julen',
        'Måne og sol: pesach og vesak',
        'Tre måter å telle på',
    ],
};

export function HoytiderDrift({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'alle';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'pesach' && <Pesach beat={beat} />}
                {modus === 'indisk' && <Indisk beat={beat} />}
                {modus === 'alle' && <Alle beat={beat} />}
                <text
                    x={B - 30}
                    y={H - 18}
                    textAnchor="end"
                    fontSize={24}
                    fontWeight={600}
                    fill={FARGE.dempet}
                >
                    Modell: datoene er omtrentlige
                </text>
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
