import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { FARGE, MANEDER, MANEDSTART, bareMane, dag, maneSol } from './felles';
import { ARSTID, bue, punkt, sektor } from './hjulFelles';

/**
 * Årshjulet: 1. januar øverst, og året går med klokka. Fargen i ringen er årstiden.
 * «tre»: de tre løsningene side om side (bare måne, bare sol, begge).
 * «ramadan»: fastemåneden som vandrer bakover, år for år, til den har vært innom hele året.
 * «kristendom»: julen som står fast, påsken som flytter seg innenfor et vindu.
 * «nyere»: bahá'í-året med 19 måneder, mormonenes fellesmøte og Jehovas vitners minnehøytid.
 * Alle datoer er en modell: det er bevegelsen som er poenget, ikke den nøyaktige dagen.
 */

type Modus = 'tre' | 'ramadan' | 'kristendom' | 'nyere';

const B = 1600;
const H = 900;

/** Ett hjul med årstider og månedsnavn. */
function Hjul({
    cx,
    cy,
    r,
    navn = true,
    dempet = false,
    children,
}: {
    cx: number;
    cy: number;
    r: number;
    navn?: boolean;
    dempet?: boolean;
    children?: ReactNode;
}) {
    const indre = r * 0.62;
    return (
        <g opacity={dempet ? 0.4 : 1}>
            <circle cx={cx} cy={cy} r={r + 6} fill="#ffffff" />
            {MANEDSTART.map((d, i) => {
                const slutt = i === 11 ? 365 : MANEDSTART[i + 1];
                return (
                    <path
                        key={i}
                        d={sektor(cx, cy, indre, r, d, slutt)}
                        fill={ARSTID[i]}
                        stroke="#ffffff"
                        strokeWidth={3}
                    />
                );
            })}
            <circle cx={cx} cy={cy} r={indre} fill="#f8fafc" />
            {navn &&
                MANEDSTART.map((d, i) => {
                    const midt = d + 15;
                    const [x, y] = punkt(cx, cy, r + 40, midt);
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y + 11}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#334155"
                        >
                            {MANEDER[i]}
                        </text>
                    );
                })}
            {children}
        </g>
    );
}

function Prikk({
    cx,
    cy,
    r,
    d,
    farge,
    stor = 18,
    opacity = 1,
}: {
    cx: number;
    cy: number;
    r: number;
    d: number;
    farge: string;
    stor?: number;
    opacity?: number;
}) {
    const [x, y] = punkt(cx, cy, r, d);
    return (
        <circle
            cx={x}
            cy={y}
            r={stor}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={4}
            opacity={opacity}
        />
    );
}

/** Merkelapp ved et punkt på hjulet, med hvit kant rundt skriften. */
function Merke({
    x,
    y,
    tekst,
    farge = FARGE.tekst,
    anker = 'middle',
    str = 34,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    str?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

interface Linje {
    t: string;
    farge?: string;
    stor?: boolean;
}

/** Tekstkort til høyre for hjulet. Bredden er fast, så linjene holdes korte (under 26 tegn). */
function Panel({ linjer, y = 260, nokkel }: { linjer: Linje[]; y?: number; nokkel: string }) {
    const hoyde = 50 + linjer.reduce((s, l) => s + (l.stor ? 66 : 54), 0);
    const ys = linjer.map((_, i) =>
        linjer.slice(0, i + 1).reduce((s, l) => s + (l.stor ? 66 : 54), y + 40)
    );
    return (
        <motion.g
            key={nokkel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <rect x={980} y={y} width={570} height={hoyde} rx={28} fill="#ffffff" opacity={0.96} />
            {linjer.map((l, i) => {
                return (
                    <text
                        key={i}
                        x={1020}
                        y={ys[i] - 14}
                        fontSize={l.stor ? 50 : 38}
                        fontWeight={l.stor ? 900 : 700}
                        fill={l.farge ?? FARGE.tekst}
                    >
                        {l.t}
                    </text>
                );
            })}
        </motion.g>
    );
}

const CX = 500;
const CY = 520;
const R = 290;
const RING = R * 0.81;

/* ---------------- «tre» ---------------- */

function Tre({ beat }: { beat: number }) {
    const hjul = [
        {
            cx: 300,
            navn: 'Bare måne',
            farge: FARGE.mane,
            fra: 1,
            tekst: ['Høytiden vandrer', 'gjennom hele året'],
        },
        { cx: 800, navn: 'Bare sol', farge: FARGE.sol, fra: 2, tekst: ['Datoen står fast'] },
        {
            cx: 1300,
            navn: 'Begge',
            farge: FARGE.begge,
            fra: 3,
            tekst: ['En ekstra måned', 'innimellom'],
        },
    ];
    const r = 180;
    const cy = 520;
    return (
        <>
            {hjul.map((h, i) => {
                const aktiv = beat >= h.fra;
                const ring = r * 0.81;
                return (
                    <g key={h.navn}>
                        <Hjul cx={h.cx} cy={cy} r={r} navn={false} dempet={!aktiv}>
                            {aktiv &&
                                i === 0 &&
                                [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                                    <Prikk
                                        key={k}
                                        cx={h.cx}
                                        cy={cy}
                                        r={ring}
                                        d={bareMane(200, 1 + k * 4)}
                                        farge={h.farge}
                                        stor={k === 0 ? 17 : 12}
                                        opacity={1 - k * 0.1}
                                    />
                                ))}
                            {aktiv && i === 1 && (
                                <Prikk cx={h.cx} cy={cy} r={ring} d={dag(12, 25)} farge={h.farge} />
                            )}
                            {aktiv &&
                                i === 2 &&
                                Array.from({ length: 19 }, (_, k) => (
                                    <Prikk
                                        key={k}
                                        cx={h.cx}
                                        cy={cy}
                                        r={ring}
                                        d={maneSol(100, k + 1)}
                                        farge={h.farge}
                                        stor={11}
                                        opacity={0.75}
                                    />
                                ))}
                        </Hjul>
                        <text
                            x={h.cx}
                            y={cy - r - 50}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={aktiv ? h.farge : FARGE.dempet}
                        >
                            {h.navn}
                        </text>
                        {aktiv &&
                            h.tekst.map((t, k) => (
                                <motion.text
                                    key={t}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    x={h.cx}
                                    y={cy + r + 64 + k * 42}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={700}
                                    fill={FARGE.tekst}
                                >
                                    {t}
                                </motion.text>
                            ))}
                    </g>
                );
            })}
        </>
    );
}

/* ---------------- «ramadan» ---------------- */

const RAMADAN_LENGDE = 29;

function RamadanBue({
    d,
    farge,
    opacity = 1,
    bredde = 40,
    forsinkelse = 0,
}: {
    d: number;
    farge: string;
    opacity?: number;
    bredde?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={bue(CX, CY, RING, d, d + RAMADAN_LENGDE)}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{ duration: 0.4, delay: forsinkelse }}
        />
    );
}

function Ramadan({ beat }: { beat: number }) {
    const start = dag(8, 8);
    const vinter = dag(1, 14);
    const sommer = dag(6, 14);
    const sist = dag(2, 20);
    return (
        <>
            <Hjul cx={CX} cy={CY} r={R}>
                {beat === 0 && <RamadanBue d={start} farge={FARGE.islam} />}
                {beat === 1 &&
                    [5, 4, 3, 2, 1, 0].map((k) => (
                        <RamadanBue
                            key={k}
                            d={start - 11 * k}
                            farge={FARGE.islam}
                            opacity={k === 5 ? 1 : 0.3 + (5 - k) * 0.1}
                            bredde={k === 5 ? 40 : 30}
                            forsinkelse={(5 - k) * 0.35}
                        />
                    ))}
                {beat === 2 && (
                    <>
                        <RamadanBue d={vinter} farge="#1e3a8a" />
                        <RamadanBue d={sommer} farge={FARGE.sol} />
                    </>
                )}
                {beat === 3 &&
                    Array.from({ length: 33 }, (_, k) => (
                        <RamadanBue
                            key={k}
                            d={start - 11 * k}
                            farge={FARGE.islam}
                            opacity={0.55}
                            bredde={14}
                            forsinkelse={k * 0.08}
                        />
                    ))}
                {beat === 4 && (
                    <>
                        <RamadanBue d={sist} farge={FARGE.islam} />
                        <Prikk
                            cx={CX}
                            cy={CY}
                            r={RING}
                            d={sist + RAMADAN_LENGDE + 1}
                            farge={FARGE.sol}
                            stor={22}
                        />
                    </>
                )}
            </Hjul>
            {beat === 4 &&
                (() => {
                    const [x, y] = punkt(CX, CY, RING - 120, sist + RAMADAN_LENGDE + 2);
                    return (
                        <Merke
                            x={x - 20}
                            y={y + 40}
                            tekst="Id al-fitr"
                            farge="#b45309"
                            anker="end"
                        />
                    );
                })()}
            <text
                x={CX}
                y={CY + 14}
                textAnchor="middle"
                fontSize={beat === 3 ? 64 : 40}
                fontWeight={900}
                fill={FARGE.islam}
            >
                {beat === 3 ? '33 år' : beat === 2 || beat === 4 ? '' : 'Ramadan'}
            </text>
            {beat === 0 && (
                <Panel
                    nokkel="r0"
                    linjer={[
                        { t: 'Ramadan', stor: true, farge: FARGE.islam },
                        { t: 'den niende månemåneden' },
                        { t: 'Faste fra daggry' },
                        { t: 'til solnedgang' },
                    ]}
                />
            )}
            {beat === 1 && (
                <Panel
                    nokkel="r1"
                    linjer={[
                        { t: '11 dager tidligere', stor: true, farge: FARGE.islam },
                        { t: 'hvert eneste år' },
                        { t: 'Ingenting retter opp' },
                        { t: 'mot sola' },
                    ]}
                />
            )}
            {beat === 2 && <Dagslys />}
            {beat === 3 && (
                <Panel
                    nokkel="r3"
                    linjer={[
                        { t: 'Rundt 33 år', stor: true, farge: FARGE.islam },
                        { t: 'før ramadan har vært' },
                        { t: 'innom hele året' },
                    ]}
                />
            )}
            {beat === 4 && (
                <Panel
                    nokkel="r4"
                    linjer={[
                        { t: 'Id al-fitr', stor: true, farge: '#b45309' },
                        { t: 'fasten er over' },
                        { t: 'Noen ser etter månen,' },
                        { t: 'andre regner ut datoen' },
                        { t: 'på forhånd' },
                    ]}
                />
            )}
        </>
    );
}

/** Kort og lang fastedag: sola over himmelen, uten tall. */
function Dagslys() {
    const rader = [
        { tittel: 'Vinter', tekst: 'kort og mørk fastedag', farge: '#1e3a8a', bue: 0.35 },
        { tittel: 'Sommer', tekst: 'svært lang fastedag', farge: FARGE.sol, bue: 0.95 },
    ];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={980} y={230} width={570} height={520} rx={28} fill="#ffffff" opacity={0.96} />
            {rader.map((r, i) => {
                const y0 = 440 + i * 250;
                const halv = 220 * r.bue;
                return (
                    <g key={r.tittel}>
                        <text x={1020} y={y0 - 150} fontSize={42} fontWeight={900} fill={r.farge}>
                            {r.tittel}
                        </text>
                        <line
                            x1={1030}
                            y1={y0}
                            x2={1500}
                            y2={y0}
                            stroke="#94a3b8"
                            strokeWidth={4}
                        />
                        <path
                            d={`M ${1265 - halv} ${y0} Q 1265 ${y0 - 170 * r.bue} ${1265 + halv} ${y0}`}
                            fill="none"
                            stroke={r.farge}
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <circle cx={1265} cy={y0 - 85 * r.bue} r={18} fill={r.farge} />
                        <text
                            x={1020}
                            y={y0 + 48}
                            fontSize={32}
                            fontWeight={700}
                            fill={FARGE.tekst}
                        >
                            {r.tekst}
                        </text>
                    </g>
                );
            })}
        </motion.g>
    );
}

/* ---------------- «kristendom» ---------------- */

function Kristendom({ beat }: { beat: number }) {
    const jul = dag(12, 25);
    const vinduFra = dag(3, 22);
    const vinduTil = dag(4, 25);
    const vaar = dag(3, 21);
    const [vx, vy] = punkt(CX, CY, R + 4, vaar);
    const [ix, iy] = punkt(CX, CY, R * 0.62 - 4, vaar);
    return (
        <>
            <Hjul cx={CX} cy={CY} r={R}>
                {beat === 1 && (
                    <path
                        d={sektor(CX, CY, R * 0.62, R, dag(12, 14), dag(12, 29))}
                        fill="#1e293b"
                        opacity={0.35}
                    />
                )}
                {beat >= 2 && (
                    <line x1={ix} y1={iy} x2={vx} y2={vy} stroke={FARGE.kristen} strokeWidth={6} />
                )}
                {beat >= 3 && (
                    <path
                        d={bue(CX, CY, RING, vinduFra, vinduTil)}
                        fill="none"
                        stroke={FARGE.kristen}
                        strokeWidth={44}
                        strokeLinecap="round"
                        opacity={0.35}
                    />
                )}
                {beat >= 3 &&
                    Array.from({ length: 8 }, (_, k) => (
                        <motion.g
                            key={k}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: k * 0.25 }}
                        >
                            <Prikk
                                cx={CX}
                                cy={CY}
                                r={RING}
                                d={vinduFra + ((k * 13) % 34)}
                                farge={FARGE.kristen}
                                stor={11}
                            />
                        </motion.g>
                    ))}
                <Prikk cx={CX} cy={CY} r={RING} d={jul} farge={FARGE.rod} stor={22} />
                {beat >= 4 && (
                    <Prikk cx={CX} cy={CY} r={RING} d={dag(1, 7)} farge={FARGE.mane} stor={20} />
                )}
            </Hjul>
            {(() => {
                const [x, y] = punkt(CX, CY, RING, jul);
                return <Merke x={x - 30} y={y + 12} tekst="Jul" farge={FARGE.rod} anker="end" />;
            })()}
            {beat >= 2 &&
                (() => {
                    const [x, y] = punkt(CX, CY, R * 0.62 - 20, vaar);
                    return (
                        <Merke
                            x={x - 6}
                            y={y - 4}
                            tekst="21. mars"
                            farge={FARGE.kristen}
                            anker="end"
                        />
                    );
                })()}
            {beat >= 3 &&
                (() => {
                    const [x, y] = punkt(CX, CY, R * 0.62 - 20, (vinduFra + vinduTil) / 2);
                    return (
                        <Merke
                            x={x - 6}
                            y={y + 40}
                            tekst="Påske"
                            farge={FARGE.kristen}
                            anker="end"
                        />
                    );
                })()}
            {beat >= 4 &&
                (() => {
                    const [x, y] = punkt(CX, CY, RING, dag(1, 7));
                    return (
                        <Merke
                            x={x + 8}
                            y={y + 62}
                            tekst="Ortodoks jul"
                            farge={FARGE.mane}
                            anker="start"
                            str={32}
                        />
                    );
                })()}
            {beat === 0 && (
                <Panel
                    nokkel="k0"
                    linjer={[
                        { t: 'Jul: 25. desember', stor: true, farge: FARGE.rod },
                        { t: 'samme dato hvert år' },
                        { t: 'Sola bestemmer' },
                    ]}
                />
            )}
            {beat === 1 && (
                <Panel
                    nokkel="k1"
                    linjer={[
                        { t: 'Ingen vet når', stor: true },
                        { t: 'Jesus ble født' },
                        { t: 'Datoen falt sammen med' },
                        { t: 'romerske fester rundt' },
                        { t: 'årets korteste dag' },
                    ]}
                />
            )}
            {beat === 2 && <PaskeRegel />}
            {beat === 3 && (
                <Panel
                    nokkel="k3"
                    linjer={[
                        { t: 'Nikea, år 325', stor: true, farge: FARGE.kristen },
                        { t: 'Kirkemøtet vedtar' },
                        { t: 'regelen. Med den kan' },
                        { t: 'påsken flytte seg' },
                        { t: 'over fem uker' },
                    ]}
                />
            )}
            {beat === 4 && (
                <Panel
                    nokkel="k4"
                    linjer={[
                        { t: 'Ortodokse kirker', stor: true, farge: FARGE.mane },
                        { t: 'eldre kalender:' },
                        { t: 'den julianske' },
                        { t: 'Jul på det som hos oss' },
                        { t: 'er 7. januar' },
                    ]}
                />
            )}
        </>
    );
}

/** Påskeregelen som tre trinn. */
function PaskeRegel() {
    const trinn = [
        { t: '21. mars', ikon: 'linje' },
        { t: 'første fullmåne', ikon: 'mane' },
        { t: 'første søndag: påske', ikon: 'sondag' },
    ];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={980} y={250} width={570} height={420} rx={28} fill="#ffffff" opacity={0.96} />
            <text x={1020} y={320} fontSize={44} fontWeight={900} fill={FARGE.kristen}>
                Påsken
            </text>
            {trinn.map((s, i) => (
                <motion.g
                    key={s.t}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.7 }}
                >
                    {s.ikon === 'linje' && (
                        <rect
                            x={1030}
                            y={384 + i * 100}
                            width={10}
                            height={44}
                            fill={FARGE.kristen}
                        />
                    )}
                    {s.ikon === 'mane' && (
                        <circle
                            cx={1035}
                            cy={406 + i * 100}
                            r={22}
                            fill="#fde68a"
                            stroke="#ca8a04"
                            strokeWidth={4}
                        />
                    )}
                    {s.ikon === 'sondag' && (
                        <circle cx={1035} cy={406 + i * 100} r={22} fill={FARGE.kristen} />
                    )}
                    <text
                        x={1080}
                        y={418 + i * 100}
                        fontSize={36}
                        fontWeight={800}
                        fill={FARGE.tekst}
                    >
                        {s.t}
                    </text>
                    {i < 2 && (
                        <path
                            d={`M 1035 ${440 + i * 100} L 1035 ${470 + i * 100}`}
                            stroke={FARGE.dempet}
                            strokeWidth={4}
                        />
                    )}
                </motion.g>
            ))}
        </motion.g>
    );
}

/* ---------------- «nyere» ---------------- */

const BAHAI_MANED = 19;
const EKSTRA = 4;

function Bahai({ beat }: { beat: number }) {
    const r1 = R * 0.6;
    const total = 19 * BAHAI_MANED + EKSTRA;
    const skala = 365 / total;
    const deler: { fra: number; til: number; farge: string; type: 'maned' | 'ekstra' | 'faste' }[] =
        [];
    let d = 0;
    for (let m = 1; m <= 19; m++) {
        if (m === 19) {
            deler.push({ fra: d, til: d + EKSTRA, farge: '#f59e0b', type: 'ekstra' });
            d += EKSTRA;
        }
        deler.push({
            fra: d,
            til: d + BAHAI_MANED,
            farge: m === 19 && beat >= 2 ? FARGE.sol : m % 2 ? '#a78bfa' : '#c4b5fd',
            type: m === 19 ? 'faste' : 'maned',
        });
        d += BAHAI_MANED;
    }
    const ekstra = deler.find((x) => x.type === 'ekstra');
    const faste = deler.find((x) => x.type === 'faste');
    return (
        <>
            <circle cx={CX} cy={CY} r={R + 6} fill="#ffffff" />
            {deler.map((x, i) => (
                <motion.path
                    key={i}
                    d={sektor(CX, CY, r1, R, x.fra * skala, x.til * skala)}
                    fill={x.type === 'ekstra' ? (beat >= 2 ? x.farge : '#e2e8f0') : x.farge}
                    stroke="#ffffff"
                    strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: beat === 1 ? i * 0.06 : 0 }}
                />
            ))}
            <circle cx={CX} cy={CY} r={r1} fill="#f8fafc" />
            <text
                x={CX}
                y={CY - 6}
                textAnchor="middle"
                fontSize={64}
                fontWeight={900}
                fill={FARGE.nyere}
            >
                {beat >= 2 ? '361' : '19 × 19'}
            </text>
            <text
                x={CX}
                y={CY + 44}
                textAnchor="middle"
                fontSize={32}
                fontWeight={700}
                fill={FARGE.dempet}
            >
                {beat >= 2 ? '+ noen ekstra dager' : 'dager'}
            </text>
            {beat >= 2 && ekstra && faste && (
                <>
                    {(() => {
                        const [x, y] = punkt(CX, CY, R, (ekstra.fra + 2) * skala);
                        return (
                            <g>
                                <line
                                    x1={250}
                                    y1={290}
                                    x2={x}
                                    y2={y}
                                    stroke="#b45309"
                                    strokeWidth={4}
                                />
                                <Merke
                                    x={70}
                                    y={290}
                                    tekst="ekstra dager"
                                    farge="#b45309"
                                    anker="start"
                                    str={38}
                                />
                            </g>
                        );
                    })()}
                    {(() => {
                        const [x, y] = punkt(CX, CY, R + 34, (faste.fra + 10) * skala);
                        return (
                            <Merke
                                x={x - 6}
                                y={y - 24}
                                tekst="fasten"
                                farge="#b45309"
                                anker="end"
                                str={38}
                            />
                        );
                    })()}
                    {(() => {
                        const [x, y] = punkt(CX, CY, R + 24, 2);
                        return (
                            <Merke
                                x={x + 10}
                                y={y - 20}
                                tekst="Naw-Rúz, nyttår"
                                farge={FARGE.nyere}
                                anker="start"
                                str={32}
                            />
                        );
                    })()}
                </>
            )}
        </>
    );
}

function Nyere({ beat }: { beat: number }) {
    if (beat === 0) {
        const kort = [
            { navn: "Bahá'í", x: 300 },
            { navn: 'Mormonene', x: 800 },
            { navn: 'Jehovas vitner', x: 1300 },
        ];
        return (
            <>
                {kort.map((k, i) => (
                    <motion.g
                        key={k.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.4 }}
                    >
                        <rect
                            x={k.x - 210}
                            y={300}
                            width={420}
                            height={330}
                            rx={30}
                            fill="#ffffff"
                        />
                        <circle
                            cx={k.x}
                            cy={410}
                            r={62}
                            fill="none"
                            stroke={FARGE.nyere}
                            strokeWidth={10}
                            strokeDasharray="20 12"
                        />
                        <text
                            x={k.x}
                            y={424}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={FARGE.nyere}
                        >
                            ?
                        </text>
                        <text
                            x={k.x}
                            y={540}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={FARGE.tekst}
                        >
                            {k.navn}
                        </text>
                    </motion.g>
                ))}
                <text
                    x={800}
                    y={740}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill={FARGE.tekst}
                >
                    Egen kalender, eller låne en?
                </text>
            </>
        );
    }
    if (beat <= 2) {
        return (
            <>
                <Bahai beat={beat} />
                {beat === 1 && (
                    <Panel
                        nokkel="n1"
                        linjer={[
                            { t: "Bahá'í", stor: true, farge: FARGE.nyere },
                            { t: 'egen solkalender' },
                            { t: '19 måneder' },
                            { t: 'med 19 dager hver' },
                        ]}
                    />
                )}
                {beat === 2 && (
                    <Panel
                        nokkel="n2"
                        linjer={[
                            { t: '19 × 19 = 361', stor: true, farge: FARGE.nyere },
                            { t: 'fire dager for lite:' },
                            { t: 'noen ekstra dager' },
                            { t: 'så fasten,' },
                            { t: 'så nyttår: Naw-Rúz' },
                        ]}
                    />
                )}
            </>
        );
    }
    const april = dag(4, 4);
    const oktober = dag(10, 3);
    return (
        <>
            <Hjul cx={CX} cy={CY} r={R}>
                {beat === 3 && (
                    <>
                        <Prikk cx={CX} cy={CY} r={RING} d={april} farge={FARGE.nyere} stor={22} />
                        <Prikk cx={CX} cy={CY} r={RING} d={oktober} farge={FARGE.nyere} stor={22} />
                    </>
                )}
                {beat === 4 && (
                    <Prikk
                        cx={CX}
                        cy={CY}
                        r={RING}
                        d={maneSol(99, 1)}
                        farge={FARGE.jodedom}
                        stor={22}
                    />
                )}
                {beat === 5 &&
                    Array.from({ length: 19 }, (_, k) => (
                        <motion.g
                            key={k}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: k * 0.12 }}
                        >
                            <Prikk
                                cx={CX}
                                cy={CY}
                                r={RING}
                                d={maneSol(99, k + 1)}
                                farge={FARGE.jodedom}
                                stor={12}
                                opacity={0.8}
                            />
                        </motion.g>
                    ))}
            </Hjul>
            {beat === 3 && (
                <>
                    {(() => {
                        const [x, y] = punkt(CX, CY, RING - 70, april);
                        return (
                            <Merke
                                x={x - 10}
                                y={y + 12}
                                tekst="april"
                                farge={FARGE.nyere}
                                anker="end"
                            />
                        );
                    })()}
                    {(() => {
                        const [x, y] = punkt(CX, CY, RING - 70, oktober);
                        return (
                            <Merke
                                x={x + 10}
                                y={y + 12}
                                tekst="oktober"
                                farge={FARGE.nyere}
                                anker="start"
                            />
                        );
                    })()}
                    <Panel
                        nokkel="n3"
                        linjer={[
                            { t: 'Mormonene', stor: true, farge: FARGE.nyere },
                            { t: 'vanlig kalender' },
                            { t: 'Fellesmøtet: første' },
                            { t: 'helg i april og' },
                            { t: 'første helg i oktober' },
                        ]}
                    />
                </>
            )}
            {beat >= 4 && (
                <>
                    {(() => {
                        const [x, y] = punkt(CX, CY, RING - 60, dag(12, 20));
                        return (
                            <g>
                                <Merke
                                    x={x - 30}
                                    y={y + 12}
                                    tekst="Jul"
                                    farge={FARGE.dempet}
                                    anker="end"
                                />
                                <path
                                    d={`M ${x - 10} ${y - 14} l 30 30 M ${x + 20} ${y - 14} l -30 30`}
                                    stroke={FARGE.rod}
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })()}
                    {(() => {
                        const [x, y] = punkt(CX, CY, RING - 76, maneSol(99, 1));
                        return (
                            <Merke
                                x={x - 10}
                                y={y + 12}
                                tekst="Minnehøytiden"
                                farge={FARGE.jodedom}
                                anker="end"
                                str={32}
                            />
                        );
                    })()}
                </>
            )}
            {beat === 4 && (
                <Panel
                    nokkel="n4"
                    linjer={[
                        { t: 'Jehovas vitner', stor: true, farge: FARGE.nyere },
                        { t: 'ingen jul,' },
                        { t: 'ingen bursdager' },
                        { t: 'Én dag: minnehøytiden' },
                    ]}
                />
            )}
            {beat === 5 && (
                <Panel
                    nokkel="n5"
                    linjer={[
                        { t: '14. nisan', stor: true, farge: FARGE.jodedom },
                        { t: 'i den jødiske' },
                        { t: 'kalenderen: måne' },
                        { t: 'og sol sammen' },
                    ]}
                />
            )}
        </>
    );
}

const TEKST: Record<Modus, (string | null)[]> = {
    tre: ['Tre løsninger', 'Løsning 1: bare måne', 'Løsning 2: bare sol', 'Løsning 3: måne og sol'],
    ramadan: [
        'Islam: ramadan',
        'Ramadan vandrer bakover',
        'Vinter og sommer',
        'Innom hele året',
        'Slutten på fasten',
    ],
    kristendom: [
        'Kristendommen: julen står fast',
        'Hvorfor 25. desember?',
        'Påsken spør månen',
        'Påsken flytter seg',
        'Ortodoks jul',
    ],
    nyere: [
        'Tre nyere bevegelser',
        "Bahá'í: egen kalender",
        "Bahá'í-året",
        'Mormonene: låner kalenderen',
        'Jehovas vitner',
        'En dato fra den jødiske kalenderen',
    ],
};

export function HoytiderHjul({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'tre';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#eef2ff' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'tre' && <Tre beat={beat} />}
                {modus === 'ramadan' && <Ramadan beat={beat} />}
                {modus === 'kristendom' && <Kristendom beat={beat} />}
                {modus === 'nyere' && <Nyere beat={beat} />}
                <text
                    x={B - 30}
                    y={H - 24}
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
