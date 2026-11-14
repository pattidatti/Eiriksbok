import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Domhus, Figur, Hake, Kort, Kryss, Overskrift } from './felles';

/**
 * Domstolstrappen sett forfra: tre trinn som en pyramide, med én bygning per domstol.
 * «trinn»: trinnene kommer ett og ett. Tingrettene går fra 23 til 28 (seks deles i elleve).
 * «anke»: saken til Jonas sendes opp, fristen på 14 dager, og lagmannsretten som kan si nei.
 * «ankeutvalg»: tre dommere i Høyesterett slipper bare et fåtall saker gjennom.
 * «rettesnor»: linjer fra Høyesterett ned til alle domstolene under, og årstallene.
 */

type Modus = 'trinn' | 'anke' | 'ankeutvalg' | 'rettesnor';

const OVERSKRIFT: Record<Modus, string[]> = {
    trinn: ['En trapp med tre trinn', 'Tingretten', 'Fra 23 til 28 tingretter', 'Lagmannsretten', 'Høyesterett', 'Saken klatrer oppover'],
    anke: ['Dommere kan ta feil', 'Å anke', 'Fristen i straffesaker: 14 dager', 'Når kan lagmannsretten si nei?'],
    ankeutvalg: ['Helt til Høyesterett?', 'Ankeutvalget', 'Bare saker som gjelder mange', 'Et fåtall kommer helt opp'],
    rettesnor: ['Høyesterett har en annen jobb', 'Loven skal brukes likt', 'Uklare lover blir klarere', 'En rettesnor for mange', 'Fra 1814 til i dag'],
};

/** Trinnene: venstre kant, bredde, topp og bunn. */
const TRINN = [
    { navn: 'Tingretten', x: 80, b: 1360, topp: 660, bunn: 850, farge: '#fde68a', kant: '#b45309' },
    { navn: 'Lagmannsretten', x: 280, b: 960, topp: 470, bunn: 660, farge: '#bfdbfe', kant: '#1d4ed8' },
    { navn: 'Høyesterett', x: 480, b: 560, topp: 280, bunn: 470, farge: '#ddd6fe', kant: '#6d28d9' },
];

/** Plassen til bygning nr. i på tingrett-trinnet (to rader med 14). */
function tingPlass(i: number) {
    const rad = Math.floor(i / 14);
    const k = i % 14;
    return { x: 470 + k * 68, y: 750 + rad * 82 };
}
function lagPlass(i: number) {
    return { x: 690 + i * 98, y: 600 };
}
const HOY = { x: 920, y: 450 };

function Trinn({ i, aktiv, dempet }: { i: number; aktiv: boolean; dempet: boolean }) {
    const t = TRINN[i];
    return (
        <motion.g initial={false} animate={{ opacity: dempet ? 0.4 : 1 }} transition={{ duration: 0.5 }}>
            <rect x={t.x} y={t.topp} width={t.b} height={t.bunn - t.topp} fill={aktiv ? t.farge : '#e2e8f0'} stroke={aktiv ? t.kant : '#94a3b8'} strokeWidth={5} />
            <text x={t.x + 30} y={t.topp + 62} fontSize={40} fontWeight={900} fill={aktiv ? t.kant : '#64748b'}>
                {t.navn}
            </text>
        </motion.g>
    );
}

function Antall({ i, tekst, forsinkelse = 0 }: { i: number; tekst: string; forsinkelse?: number }) {
    const t = TRINN[i];
    return (
        <motion.text
            key={tekst}
            x={t.x + 30}
            y={t.topp + 112}
            fontSize={34}
            fontWeight={700}
            fill="#334155"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            {tekst}
        </motion.text>
    );
}

/** Byggene på tingrett-trinnet. «endring» viser 23 som blir 28. */
function Tingretter({ endring, farge }: { endring: boolean; farge: string }) {
    if (!endring) {
        return (
            <>
                {Array.from({ length: 28 }, (_, i) => {
                    const p = tingPlass(i);
                    return <Domhus key={i} x={p.x} y={p.y} b={52} farge={farge} tak="#92400e" />;
                })}
            </>
        );
    }
    return (
        <>
            {Array.from({ length: 17 }, (_, i) => {
                const p = tingPlass(i);
                return <Domhus key={i} x={p.x} y={p.y} b={52} farge={farge} tak="#92400e" />;
            })}
            {/* De seks som ble delt: synlige først, så borte */}
            {Array.from({ length: 6 }, (_, i) => {
                const p = tingPlass(17 + i);
                return (
                    <motion.g key={`gml${i}`} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3.2, duration: 0.6 }}>
                        <Domhus x={p.x} y={p.y} b={52} farge="#fb923c" tak="#c2410c" />
                    </motion.g>
                );
            })}
            {/* De elleve nye */}
            {Array.from({ length: 11 }, (_, i) => {
                const p = tingPlass(17 + i);
                return (
                    <motion.g key={`ny${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 + i * 0.12, duration: 0.4 }}>
                        <Domhus x={p.x} y={p.y} b={52} farge="#86efac" tak="#15803d" />
                    </motion.g>
                );
            })}
        </>
    );
}

function Lagmannsretter({ farge }: { farge: string }) {
    return (
        <>
            {Array.from({ length: 6 }, (_, i) => {
                const p = lagPlass(i);
                return (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}>
                        <Domhus x={p.x} y={p.y} b={80} farge={farge} tak="#1e3a8a" />
                    </motion.g>
                );
            })}
        </>
    );
}

/** Saksmappa. (x, y) er midten. */
function Mappe({ x, y, tekst = 'Jonas', farge = '#f59e0b' }: { x: number; y: number; tekst?: string; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -60 -36 L -20 -36 L -10 -46 L 60 -46 L 60 40 L -60 40 Z" fill={farge} stroke="#92400e" strokeWidth={4} />
            <text x={0} y={14} textAnchor="middle" fontSize={28} fontWeight={800} fill="#451a03">
                {tekst}
            </text>
        </g>
    );
}

/** Mappa ved venstre kant av et trinn. */
function mappePlass(trinn: number) {
    const t = TRINN[trinn];
    return { x: t.x - 10 + (trinn === 0 ? 120 : 110), y: t.topp - 50 };
}

function Trapp({ aktiv, dempet = [] }: { aktiv: number[]; dempet?: number[] }) {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <Trinn key={i} i={i} aktiv={aktiv.includes(i)} dempet={dempet.includes(i)} />
            ))}
        </>
    );
}

function TrinnModus({ beat }: { beat: number }) {
    const aktiv = beat === 0 ? [] : beat === 5 ? [0, 1, 2] : [0, 1, 2].filter((i) => (i === 0 ? beat >= 1 : i === 1 ? beat >= 3 : beat >= 4));
    return (
        <>
            <Trapp aktiv={aktiv} />
            {beat >= 1 && <Tingretter endring={beat === 2} farge="#fcd34d" />}
            {beat >= 2 && beat !== 2 && <Antall i={0} tekst="28 i dag" />}
            {beat === 2 && (
                <>
                    <motion.text x={110} y={772} fontSize={34} fontWeight={700} fill="#c2410c" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3.2 }}>
                        23 i 2021
                    </motion.text>
                    <Antall i={0} tekst="28 i dag" forsinkelse={4.6} />
                </>
            )}
            {beat >= 3 && <Lagmannsretter farge="#93c5fd" />}
            {beat >= 3 && <Antall i={1} tekst="6 i alt" />}
            {beat === 3 && <Lagkart />}
            {beat >= 4 && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Domhus x={HOY.x} y={HOY.y} b={150} farge="#c4b5fd" tak="#4c1d95" />
                    </motion.g>
                    <Antall i={2} tekst="20 dommere" />
                </>
            )}
            {beat === 5 && (
                <motion.g
                    initial={{ x: mappePlass(0).x, y: mappePlass(0).y }}
                    animate={{
                        x: [mappePlass(0).x, mappePlass(0).x, mappePlass(1).x, mappePlass(1).x, mappePlass(2).x],
                        y: [mappePlass(0).y, mappePlass(0).y, mappePlass(1).y, mappePlass(1).y, mappePlass(2).y],
                    }}
                    transition={{ duration: 4.5, times: [0, 0.2, 0.45, 0.65, 1], ease: 'easeInOut' }}
                >
                    <Mappe x={0} y={0} tekst="Saken" />
                </motion.g>
            )}
        </>
    );
}

/** Lite Norgeskart med tre av de seks lagmannsrettene. */
const LAGMANNSRETTER: { navn: string; by: string; ll: [number, number]; side: 'h' | 'v'; dy: number }[] = [
    { navn: 'Borgarting', by: 'Oslo', ll: [10.75, 59.91], side: 'h', dy: 36 },
    { navn: 'Gulating', by: 'Bergen', ll: [5.32, 60.39], side: 'h', dy: -16 },
    { navn: 'Hålogaland', by: 'Tromsø', ll: [18.96, 69.65], side: 'v', dy: 9 },
];

function Lagkart() {
    const { geographies } = useFilmVerden();
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [1280, 140],
                    [1580, 590],
                ],
                { type: 'MultiPoint', coordinates: [[4.5, 57.8], [31, 71.2]] } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <rect x={1262} y={124} width={330} height={500} rx={18} fill="#e0f2fe" stroke="#1d4ed8" strokeWidth={4} />
            {geographies
                .filter((g) => ['578', '752', '246'].includes(String(g.id)))
                .map((g) => (
                    <path key={String(g.id)} d={sti(g as never) ?? ''} fill={String(g.id) === '578' ? '#bfdbfe' : '#e2e8f0'} stroke="#64748b" strokeWidth={1.5} />
                ))}
            <text x={1427} y={170} textAnchor="middle" fontSize={28} fontWeight={800} fill="#1d4ed8">
                Tre av de seks
            </text>
            {LAGMANNSRETTER.map((l) => {
                const [x, y] = proj(l.ll) as [number, number];
                return (
                    <g key={l.navn}>
                        <circle cx={x} cy={y} r={11} fill="#1d4ed8" stroke="#ffffff" strokeWidth={3} />
                        <text
                            x={l.side === 'h' ? x + 18 : x - 18}
                            y={y + l.dy}
                            textAnchor={l.side === 'h' ? 'start' : 'end'}
                            fontSize={26}
                            fontWeight={800}
                            fill="#1e3a8a"
                            stroke="#ffffff"
                            strokeWidth={6}
                            paintOrder="stroke"
                        >
                            {l.by}
                        </text>
                    </g>
                );
            })}
        </motion.g>
    );
}

function Kalender() {
    return (
        <g>
            <rect x={40} y={140} width={420} height={250} rx={20} fill="#ffffff" stroke="#be123c" strokeWidth={4} />
            <text x={250} y={190} textAnchor="middle" fontSize={34} fontWeight={800} fill="#be123c">
                14 dager
            </text>
            {Array.from({ length: 14 }, (_, i) => {
                const r = Math.floor(i / 7);
                const k = i % 7;
                return (
                    <motion.rect
                        key={i}
                        x={70 + k * 54}
                        y={220 + r * 74}
                        width={44}
                        height={58}
                        rx={8}
                        initial={{ fill: '#f1f5f9' }}
                        animate={{ fill: '#fda4af' }}
                        transition={{ delay: 0.6 + i * 0.25, duration: 0.3 }}
                        stroke="#be123c"
                        strokeWidth={2}
                    />
                );
            })}
        </g>
    );
}

function AnkeModus({ beat }: { beat: number }) {
    const opp = beat >= 1;
    const p0 = mappePlass(0);
    const p1 = mappePlass(1);
    return (
        <>
            <Trapp aktiv={beat >= 3 ? [1] : [0, 1]} dempet={[2]} />
            <Tingretter endring={false} farge="#fcd34d" />
            <Lagmannsretter farge="#93c5fd" />
            {beat === 0 && (
                <text x={p0.x - 70} y={p0.y + 20} textAnchor="end" fontSize={80} fontWeight={900} fill="#be123c">
                    ?
                </text>
            )}
            <motion.g initial={false} animate={{ x: opp && beat >= 3 ? p1.x : p0.x, y: opp && beat >= 3 ? p1.y : p0.y }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
                <Mappe x={0} y={0} />
            </motion.g>
            {beat >= 1 && beat <= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path d={`M ${p0.x + 70} ${p0.y - 30} Q ${p0.x + 140} ${p1.y - 30} ${p1.x + 70} ${p1.y + 20}`} fill="none" stroke="#be123c" strokeWidth={9} strokeLinecap="round" />
                    <Kort x={1350} y={300} tittel="Anke" tekst="en ny domstol ser på saken" farge="#be123c" />
                </motion.g>
            )}
            {beat === 1 && (
                <>
                    <Kort x={250} y={160} tittel="Den dømte" farge="#475569" />
                    <Kort x={250} y={250} tittel="Påtalemyndigheten" farge="#475569" forsinkelse={0.5} />
                    <text x={250} y={370} textAnchor="middle" fontSize={30} fontWeight={700} fill="#334155">
                        Begge kan anke
                    </text>
                </>
            )}
            {beat === 2 && <Kalender />}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                    <Kort x={1340} y={150} tittel="Ny runde" tekst="saken tas på nytt" farge="#16a34a" />
                    <Hake x={1080} y={190} />
                    <Kort x={1340} y={380} tittel="Nei" tekst="helt klart samme resultat" farge="#dc2626" />
                    <Kryss x={1080} y={432} r={22} />
                </motion.g>
            )}
        </>
    );
}

/** En tett, utellbar haug med mapper som ble sendt tilbake. */
function Haug({ x, y }: { x: number; y: number }) {
    const biter = Array.from({ length: 26 }, (_, i) => ({
        dx: ((i * 37) % 150) - 75,
        dy: -((i * 23) % 60),
        r: ((i * 29) % 40) - 20,
    }));
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            {biter.map((b, i) => (
                <rect key={i} x={x + b.dx - 40} y={y + b.dy - 26} width={80} height={52} rx={6} fill="#fcd34d" stroke="#92400e" strokeWidth={3} transform={`rotate(${b.r} ${x + b.dx} ${y + b.dy})`} />
            ))}
        </motion.g>
    );
}

function AnkeutvalgModus({ beat }: { beat: number }) {
    const p1 = mappePlass(1);
    return (
        <>
            <Trapp aktiv={beat >= 1 ? [2] : [1, 2]} dempet={[0]} />
            <Tingretter endring={false} farge="#fcd34d" />
            <Lagmannsretter farge="#93c5fd" />
            <Domhus x={HOY.x} y={HOY.y} b={150} farge="#c4b5fd" tak="#4c1d95" />
            {beat < 3 && (
                <g transform={`translate(${p1.x} ${p1.y})`}>
                    <Mappe x={0} y={0} />
                </g>
            )}
            {beat === 0 && (
                <text x={p1.x + 30} y={p1.y - 80} fontSize={80} fontWeight={900} fill="#6d28d9">
                    ?
                </text>
            )}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <rect x={1120} y={140} width={440} height={300} rx={24} fill="#ffffff" stroke="#6d28d9" strokeWidth={5} />
                    <text x={1340} y={195} textAnchor="middle" fontSize={34} fontWeight={800} fill="#6d28d9">
                        Ankeutvalget
                    </text>
                    {[1240, 1340, 1440].map((x) => (
                        <Figur key={x} x={x} y={400} farge="#1e293b" skala={0.9} />
                    ))}
                </motion.g>
            )}
            {beat === 2 && <Kort x={600} y={150} tittel="Ja, bare hvis saken betyr noe for flere" farge="#6d28d9" />}
            {beat >= 3 && (
                <>
                    <Haug x={1420} y={590} />
                    <Kort x={1360} y={480} tittel="De fleste stopper her" farge="#475569" forsinkelse={0.6} />
                    <motion.g initial={{ x: p1.x, y: p1.y }} animate={{ x: HOY.x - 220, y: HOY.y - 50 }} transition={{ duration: 1.8, ease: 'easeInOut' }}>
                        <Mappe x={0} y={0} tekst="Sak" farge="#c4b5fd" />
                    </motion.g>
                    <Kort x={600} y={150} tittel="Litt over 100 saker i året" farge="#6d28d9" forsinkelse={1.6} />
                </>
            )}
        </>
    );
}

function RettesnorModus({ beat }: { beat: number }) {
    const mal = [...Array.from({ length: 28 }, (_, i) => tingPlass(i)), ...Array.from({ length: 6 }, (_, i) => lagPlass(i))];
    return (
        <>
            <Trapp aktiv={beat === 0 ? [2] : [0, 1, 2]} />
            <Tingretter endring={false} farge="#fcd34d" />
            <Lagmannsretter farge="#93c5fd" />
            {beat >= 1 &&
                mal.map((p, i) => (
                    <motion.line
                        key={i}
                        x1={HOY.x}
                        y1={HOY.y - 60}
                        x2={p.x}
                        y2={p.y - 40}
                        stroke="#7c3aed"
                        strokeWidth={beat >= 3 ? 4 : 2.5}
                        strokeOpacity={beat >= 3 ? 0.75 : 0.45}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: i * 0.03 }}
                    />
                ))}
            <Domhus x={HOY.x} y={HOY.y} b={150} farge="#c4b5fd" tak="#4c1d95" />
            {beat === 1 && <Kort x={1340} y={160} tittel="Likt over hele landet" farge="#7c3aed" />}
            {beat === 2 && (
                <>
                    <Kort x={1340} y={150} tittel="Uklar lov" tekst="blir klarere" farge="#7c3aed" />
                    <Kort x={1340} y={290} tittel="Loven sier ingenting" tekst="Høyesterett finner svar" farge="#7c3aed" forsinkelse={1.2} />
                </>
            )}
            {beat === 3 && <Kort x={1340} y={160} tittel="Rettesnor" tekst="en regel å rette seg etter" farge="#7c3aed" />}
            {beat >= 4 && (
                <>
                    <Kort x={1320} y={150} tittel="1814" tekst="Grunnloven: en Høyesterett" farge="#6d28d9" />
                    <Kort x={1320} y={290} tittel="1815" tekst="den første dommen" farge="#6d28d9" forsinkelse={1.2} />
                </>
            )}
        </>
    );
}

export function DomstoleneTrapp({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'trinn';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#f8fafc, #e2e8f0)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'trinn' && <TrinnModus beat={beat} />}
                {modus === 'anke' && <AnkeModus beat={beat} />}
                {modus === 'ankeutvalg' && <AnkeutvalgModus beat={beat} />}
                {modus === 'rettesnor' && <RettesnorModus beat={beat} />}
                <Overskrift tekst={tekst} />
            </svg>
        </div>
    );
}
