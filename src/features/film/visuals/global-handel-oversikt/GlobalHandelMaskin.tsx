import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Verdenshandelen som en maskin av tannhjul (SVG), i fire moduser.
 *
 * «maskin»: tre tannhjul. Råvarer -> fabrikker -> kjøpere, og under dem strømmer penger,
 * data og energi. Siste beat: ingen land er selvforsynt.
 * «avhengig»: en kjede av land-tannhjul. Ett stopper, og alle stopper. Så går de igjen,
 * og velstanden vokser.
 * «ricardo»: to land og to varer. Land A er best til begge, men begge satser på det de er
 * relativt best til og bytter. Søylene er bare forhold, uten tall.
 * «press»: maskinen knirker. Merkelapper for handelskrig, Brexit, sanksjoner, pandemi,
 * gass og halvledere legger seg mellom hjulene, og til slutt flytter ett hjul hjem.
 */

type Modus = 'maskin' | 'avhengig' | 'ricardo' | 'press';

const B = 1600;
const H = 900;

/** SVG-sti for et tannhjul med sentrum i origo. */
function tannhjul(r: number, tenner: number) {
    const inn = r - 22;
    const steg = (Math.PI * 2) / tenner;
    let d = '';
    for (let i = 0; i < tenner; i++) {
        const a = i * steg;
        const pkt = [
            [inn, a],
            [r, a + steg * 0.18],
            [r, a + steg * 0.5],
            [inn, a + steg * 0.68],
        ];
        for (const [rr, aa] of pkt) {
            const x = (rr * Math.cos(aa)).toFixed(1);
            const y = (rr * Math.sin(aa)).toFixed(1);
            d += `${d ? 'L' : 'M'}${x},${y}`;
        }
    }
    return d + 'Z';
}

/** Vinkel i grader som øker med en fart som glir mot målet. Fryser på pause. */
function useVinkel(målFart: number, playing: boolean) {
    const [vinkel, setVinkel] = useState(0);
    const fart = useRef(målFart);
    const mål = useRef(målFart);
    useEffect(() => {
        mål.current = målFart;
    }, [målFart]);
    useEffect(() => {
        if (!playing) return;
        let id = 0;
        let sist = performance.now();
        const tikk = (n: number) => {
            const dt = Math.min(0.05, (n - sist) / 1000);
            sist = n;
            fart.current += (mål.current - fart.current) * (1 - Math.exp(-2.5 * dt));
            setVinkel((v) => (v + fart.current * dt) % 360000);
            id = requestAnimationFrame(tikk);
        };
        id = requestAnimationFrame(tikk);
        return () => cancelAnimationFrame(id);
    }, [playing]);
    return vinkel;
}

interface Hjul {
    x: number;
    y: number;
    r: number;
    farge: string;
    /** +1 eller -1: nabohjul går motsatt vei. */
    retning: number;
}

function Tannhjul({
    hjul,
    vinkel,
    etikett,
    dempet,
    rod,
}: {
    hjul: Hjul;
    vinkel: number;
    etikett?: string;
    dempet?: boolean;
    rod?: boolean;
}) {
    const tenner = Math.round(hjul.r / 14);
    // Mindre hjul går fortere, så tennene følger hverandre.
    const a = (vinkel * hjul.retning * 140) / hjul.r;
    return (
        <g opacity={dempet ? 0.35 : 1}>
            <g transform={`translate(${hjul.x} ${hjul.y}) rotate(${a.toFixed(2)})`}>
                <path
                    d={tannhjul(hjul.r, tenner)}
                    fill={rod ? '#dc2626' : hjul.farge}
                    stroke="#0f172a"
                    strokeWidth={4}
                />
                <circle r={hjul.r * 0.56} fill="#f8fafc" stroke="#0f172a" strokeWidth={4} />
                {!etikett && <circle r={16} fill="#0f172a" />}
            </g>
            {etikett && (
                <text
                    x={hjul.x}
                    y={hjul.y + 12}
                    textAnchor="middle"
                    fontSize={etikett && etikett.length > 7 ? 30 : 36}
                    fontWeight={800}
                    fill="#0f172a"
                    style={{ paintOrder: 'stroke', stroke: '#f8fafc', strokeWidth: 10 }}
                >
                    {etikett}
                </text>
            )}
        </g>
    );
}

function Overskrift({ tekst, rod }: { tekst: string; rod?: boolean }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <rect
                    x={B / 2 - tekst.length * 13 - 30}
                    y={44}
                    width={tekst.length * 26 + 60}
                    height={76}
                    rx={22}
                    fill={rod ? '#dc2626' : '#ffffff'}
                    opacity={0.95}
                />
                <text
                    x={B / 2}
                    y={96}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill={rod ? '#ffffff' : '#0f172a'}
                >
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/** Små bokser som glir langs en linje fra a til b, i en evig løkke. */
function Strom({
    fra,
    til,
    farge,
    vinkel,
    antall = 4,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    vinkel: number;
    antall?: number;
}) {
    const fase = (vinkel / 90) % 1;
    return (
        <g>
            <line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={6}
                strokeDasharray="4 14"
                opacity={0.6}
            />
            {Array.from({ length: antall }, (_, i) => {
                const f = (fase + i / antall) % 1;
                const x = fra[0] + (til[0] - fra[0]) * f;
                const y = fra[1] + (til[1] - fra[1]) * f;
                return (
                    <rect
                        key={i}
                        x={x - 16}
                        y={y - 12}
                        width={32}
                        height={24}
                        rx={4}
                        fill={farge}
                        stroke="#0f172a"
                        strokeWidth={3}
                    />
                );
            })}
        </g>
    );
}

// ---------- maskin ----------

const TRE: Hjul[] = [
    { x: 470, y: 400, r: 170, farge: '#16a34a', retning: 1 },
    { x: 800, y: 400, r: 150, farge: '#2563eb', retning: -1 },
    { x: 1120, y: 400, r: 160, farge: '#ea580c', retning: 1 },
];

const STROMMER = [
    { navn: 'Penger', farge: '#ca8a04', y: 660 },
    { navn: 'Data', farge: '#0891b2', y: 735 },
    { navn: 'Energi', farge: '#dc2626', y: 810 },
];

function Maskin({ beat, vinkel }: { beat: number; vinkel: number }) {
    const etiketter = ['Råvarer', 'Fabrikker', 'Kjøpere'];
    const vis = [beat >= 1, beat >= 1, beat >= 2];
    const overskrift = [
        'Én stor maskin',
        'Råvarer til fabrikker',
        'Ferdige varer til kjøpere',
        'Penger, data og energi',
        'Ingen land lager alt selv',
    ][Math.min(beat, 4)];
    const fase = (vinkel / 60) % 1;
    return (
        <>
            {TRE.map((h, i) => (
                <Tannhjul
                    key={i}
                    hjul={h}
                    vinkel={vinkel}
                    etikett={vis[i] ? etiketter[i] : undefined}
                />
            ))}
            {beat >= 1 && (
                <Strom
                    fra={[470, 200]}
                    til={[800, 200]}
                    farge="#16a34a"
                    vinkel={vinkel}
                    antall={3}
                />
            )}
            {beat >= 2 && (
                <Strom
                    fra={[800, 200]}
                    til={[1120, 200]}
                    farge="#ea580c"
                    vinkel={vinkel}
                    antall={3}
                />
            )}
            {beat >= 3 &&
                STROMMER.map((s, i) => (
                    <motion.g
                        key={s.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.4 }}
                    >
                        <text
                            x={250}
                            y={s.y + 12}
                            textAnchor="end"
                            fontSize={34}
                            fontWeight={800}
                            fill={s.farge}
                        >
                            {s.navn}
                        </text>
                        <path
                            d={`M 280 ${s.y} C 600 ${s.y - 30}, 1000 ${s.y + 30}, 1360 ${s.y}`}
                            fill="none"
                            stroke={s.farge}
                            strokeWidth={14}
                            strokeLinecap="round"
                            strokeDasharray="40 30"
                            strokeDashoffset={-fase * 70 * (i + 2)}
                        />
                    </motion.g>
                ))}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ originX: '50%', originY: '50%' }}
                >
                    <rect x={1240} y={560} width={320} height={110} rx={20} fill="#0f172a" />
                    <text
                        x={1400}
                        y={605}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#f8fafc"
                    >
                        Selvforsynt?
                    </text>
                    <text
                        x={1400}
                        y={645}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={600}
                        fill="#fca5a5"
                    >
                        Ingen land er det
                    </text>
                </motion.g>
            )}
            <Overskrift tekst={overskrift} />
        </>
    );
}

// ---------- avhengig ----------

const KJEDE: Hjul[] = [
    { x: 260, y: 470, r: 120, farge: '#16a34a', retning: 1 },
    { x: 485, y: 400, r: 110, farge: '#2563eb', retning: -1 },
    { x: 705, y: 470, r: 115, farge: '#ca8a04', retning: 1 },
    { x: 925, y: 400, r: 110, farge: '#7c3aed', retning: -1 },
    { x: 1145, y: 470, r: 115, farge: '#0891b2', retning: 1 },
    { x: 1365, y: 400, r: 110, farge: '#ea580c', retning: -1 },
];

function Avhengig({ beat, vinkel }: { beat: number; vinkel: number }) {
    const stoppet = beat === 1;
    const overskrift = ['Gjensidig avhengighet', 'Ett hjul stopper ...', 'Grunnmur for velstand'][
        Math.min(beat, 2)
    ];
    return (
        <>
            {KJEDE.map((h, i) => (
                <Tannhjul
                    key={i}
                    hjul={h}
                    vinkel={vinkel}
                    etikett="Land"
                    rod={stoppet && i === 2}
                />
            ))}
            {stoppet && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ originX: '705px', originY: '470px' }}
                >
                    <line
                        x1={645}
                        y1={410}
                        x2={765}
                        y2={530}
                        stroke="#0f172a"
                        strokeWidth={18}
                        strokeLinecap="round"
                    />
                    <line
                        x1={765}
                        y1={410}
                        x2={645}
                        y2={530}
                        stroke="#0f172a"
                        strokeWidth={18}
                        strokeLinecap="round"
                    />
                </motion.g>
            )}
            {stoppet && (
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    x={B / 2}
                    y={700}
                    textAnchor="middle"
                    fontSize={42}
                    fontWeight={800}
                    fill="#dc2626"
                >
                    ... og de andre merker det
                </motion.text>
            )}
            {beat >= 2 && <Velstand />}
            <Overskrift tekst={overskrift} rod={stoppet} />
        </>
    );
}

/** Mynter som stables opp under kjeden når den går igjen. */
function Velstand() {
    return (
        <g>
            {Array.from({ length: 6 }, (_, kol) =>
                Array.from({ length: 2 + kol }, (_, i) => (
                    <motion.ellipse
                        key={`${kol}-${i}`}
                        cx={500 + kol * 120}
                        cy={800 - i * 22}
                        rx={46}
                        ry={14}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + kol * 0.25 + i * 0.12 }}
                    />
                ))
            )}
        </g>
    );
}

// ---------- ricardo ----------

/** Hvor flinke landene er (bare forhold, ingen tall vises): A er best til begge. */
const DYKTIGHET = { A: { mat: 0.6, klaer: 0.95 }, B: { mat: 0.45, klaer: 0.2 } };
const VARER = [
    { id: 'mat', navn: 'Mat', farge: '#ca8a04' },
    { id: 'klaer', navn: 'Klær', farge: '#2563eb' },
] as const;

function Ricardo({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <rect
                    x={450}
                    y={250}
                    width={700}
                    height={360}
                    rx={32}
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth={4}
                />
                <text
                    x={800}
                    y={360}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={600}
                    fill="#475569"
                >
                    En britisk økonom
                </text>
                <text
                    x={800}
                    y={450}
                    textAnchor="middle"
                    fontSize={80}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    David Ricardo
                </text>
                <text
                    x={800}
                    y={540}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={800}
                    fill="#2563eb"
                >
                    1817
                </text>
            </motion.g>
        );
    }
    if (beat >= 4) {
        return (
            <motion.g
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ originX: '50%', originY: '50%' }}
            >
                <text
                    x={800}
                    y={400}
                    textAnchor="middle"
                    fontSize={92}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Komparativt fortrinn
                </text>
                <text
                    x={800}
                    y={500}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={600}
                    fill="#2563eb"
                >
                    komparativt = sammenlignet
                </text>
            </motion.g>
        );
    }
    const satser = beat >= 2;
    const bytter = beat >= 3;
    const overskrift = [
        '',
        'Land A er best til alt',
        'Hver satser på det de er relativt best til',
        'De bytter, og begge får mer',
    ][beat];
    const land: ('A' | 'B')[] = ['A', 'B'];
    return (
        <>
            {land.map((l, li) => {
                const x0 = li === 0 ? 120 : 900;
                const valgt = l === 'A' ? 'klaer' : 'mat';
                return (
                    <g key={l}>
                        <rect
                            x={x0}
                            y={170}
                            width={580}
                            height={600}
                            rx={28}
                            fill={l === 'A' ? '#eff6ff' : '#fefce8'}
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                        <text
                            x={x0 + 290}
                            y={235}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            Land {l}
                        </text>
                        {VARER.map((vare, vi) => {
                            const y = 300 + vi * 130;
                            const dempet = satser && vare.id !== valgt;
                            const bredde = 380 * DYKTIGHET[l][vare.id];
                            return (
                                <g key={vare.id} opacity={dempet ? 0.25 : 1}>
                                    <text
                                        x={x0 + 40}
                                        y={y + 50}
                                        fontSize={36}
                                        fontWeight={800}
                                        fill="#0f172a"
                                    >
                                        {vare.navn}
                                    </text>
                                    <motion.rect
                                        x={x0 + 170}
                                        y={y + 18}
                                        height={44}
                                        rx={10}
                                        fill={vare.farge}
                                        initial={{ width: 0 }}
                                        animate={{ width: bredde }}
                                        transition={{ duration: 1, delay: 0.2 + vi * 0.3 }}
                                    />
                                </g>
                            );
                        })}
                        {beat === 1 && l === 'A' && (
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                x={x0 + 290}
                                y={590}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#16a34a"
                            >
                                Best til begge deler
                            </motion.text>
                        )}
                        {satser && (
                            <motion.text
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                x={x0 + 290}
                                y={590}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                Satser på {l === 'A' ? 'klær' : 'mat'}
                            </motion.text>
                        )}
                        {bytter && <Haug x={x0 + 290} y={720} />}
                    </g>
                );
            })}
            {bytter && (
                <g>
                    <motion.path
                        d="M 700 470 L 900 470"
                        stroke="#2563eb"
                        strokeWidth={14}
                        markerEnd="url(#pil-bla)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                    <motion.path
                        d="M 900 340 L 700 340"
                        stroke="#ca8a04"
                        strokeWidth={14}
                        markerEnd="url(#pil-gul)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <text
                        x={800}
                        y={448}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#2563eb"
                    >
                        klær
                    </text>
                    <text
                        x={800}
                        y={318}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#ca8a04"
                    >
                        mat
                    </text>
                </g>
            )}
            <Overskrift tekst={overskrift} />
        </>
    );
}

/** En haug med begge varene: begge land får mer. */
function Haug({ x, y }: { x: number; y: number }) {
    return (
        <g>
            {Array.from({ length: 8 }, (_, i) => (
                <motion.rect
                    key={i}
                    x={x - 200 + i * 50}
                    y={y - 40}
                    width={40}
                    height={40}
                    rx={6}
                    fill={i % 2 === 0 ? '#ca8a04' : '#2563eb'}
                    stroke="#0f172a"
                    strokeWidth={3}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.12 }}
                />
            ))}
            <text
                x={x}
                y={y + 40}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#16a34a"
            >
                Mer enn alene
            </text>
        </g>
    );
}

// ---------- press ----------

const PRESS_MERKER = [
    { tekst: 'Handelskrig: USA og Kina', fraBeat: 1, x: 470, y: 180 },
    { tekst: 'Brexit', fraBeat: 1, x: 800, y: 650 },
    { tekst: 'Sanksjoner mot Russland', fraBeat: 1, x: 1180, y: 180 },
    { tekst: 'Pandemi', fraBeat: 2, x: 330, y: 650 },
    { tekst: 'Gassen til Europa kuttet', fraBeat: 3, x: 1250, y: 650 },
    { tekst: 'Kamp om halvledere', fraBeat: 3, x: 800, y: 790 },
];

function Press({ beat, vinkel }: { beat: number; vinkel: number }) {
    const overskrift = [
        'Det knirker i maskinen',
        'Handel blir et våpen',
        'Lange kjeder er sårbare',
        'Krig og kamp om brikker',
        'Lage mer hjemme igjen',
    ][Math.min(beat, 4)];
    const rist = beat >= 0 && beat < 4 ? Math.sin(vinkel * 3) * 3 : 0;
    const hjem = beat >= 4;
    return (
        <>
            <g transform={`translate(${rist.toFixed(1)} 0)`}>
                {TRE.map((h, i) => {
                    const flytt = hjem && i === 2;
                    return (
                        <motion.g
                            key={i}
                            animate={{ x: flytt ? 260 : 0, y: flytt ? 120 : 0 }}
                            transition={{ duration: 1.8, ease: 'easeInOut' }}
                        >
                            <Tannhjul
                                hjul={h}
                                vinkel={flytt ? vinkel * 2 : vinkel}
                                rod={!flytt && beat >= 1 && beat < 4}
                            />
                        </motion.g>
                    );
                })}
            </g>
            {beat === 0 && <Gnister vinkel={vinkel} />}
            {PRESS_MERKER.filter((m) => beat >= m.fraBeat && beat < 4).map((m) => (
                <motion.g
                    key={m.tekst}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ originX: `${m.x}px`, originY: `${m.y}px` }}
                >
                    <rect
                        x={m.x - m.tekst.length * 11 - 24}
                        y={m.y - 38}
                        width={m.tekst.length * 22 + 48}
                        height={64}
                        rx={16}
                        fill="#0f172a"
                    />
                    <text
                        x={m.x}
                        y={m.y + 6}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fca5a5"
                    >
                        {m.tekst}
                    </text>
                </motion.g>
            ))}
            {hjem && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <path
                        d="M 1190 720 L 1570 720 L 1570 470 L 1380 300 L 1190 470 Z"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth={10}
                        strokeLinejoin="round"
                    />
                    <text
                        x={1380}
                        y={775}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#16a34a"
                    >
                        Hjemme
                    </text>
                    <text
                        x={460}
                        y={700}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Deglobalisering
                    </text>
                    <text
                        x={460}
                        y={745}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={600}
                        fill="#475569"
                    >
                        også kalt reshoring
                    </text>
                </motion.g>
            )}
            <Overskrift tekst={overskrift} rod={beat >= 1 && beat < 4} />
        </>
    );
}

function Gnister({ vinkel }: { vinkel: number }) {
    const punkter = [
        [635, 330],
        [960, 470],
        [635, 470],
        [960, 330],
    ];
    return (
        <g>
            {punkter.map(([x, y], i) => {
                const s = 0.5 + 0.5 * Math.abs(Math.sin(vinkel / 8 + i));
                return (
                    <g key={i} transform={`translate(${x} ${y}) scale(${s.toFixed(2)})`}>
                        {[0, 60, 120, 180, 240, 300].map((a) => (
                            <line
                                key={a}
                                x1={0}
                                y1={0}
                                x2={40 * Math.cos((a * Math.PI) / 180)}
                                y2={40 * Math.sin((a * Math.PI) / 180)}
                                stroke="#f97316"
                                strokeWidth={7}
                                strokeLinecap="round"
                            />
                        ))}
                    </g>
                );
            })}
        </g>
    );
}

// ---------- felles ----------

function fartFor(modus: Modus, beat: number) {
    if (modus === 'avhengig') return beat === 1 ? 6 : 40;
    if (modus === 'press') return [22, 14, 9, 5, 20][Math.min(beat, 4)];
    return 40;
}

export function GlobalHandelMaskin({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['maskin', 'avhengig', 'ricardo', 'press'] as const).includes(
        props?.modus as Modus
    )
        ? (props?.modus as Modus)
        : 'maskin';
    const vinkel = useVinkel(fartFor(modus, beat), playing);
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #f8fafc 100%)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <marker
                        id="pil-bla"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3"
                        markerHeight="3"
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 Z" fill="#2563eb" />
                    </marker>
                    <marker
                        id="pil-gul"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3"
                        markerHeight="3"
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 Z" fill="#ca8a04" />
                    </marker>
                </defs>
                {modus === 'maskin' && <Maskin beat={beat} vinkel={vinkel} />}
                {modus === 'avhengig' && <Avhengig beat={beat} vinkel={vinkel} />}
                {modus === 'ricardo' && <Ricardo beat={beat} />}
                {modus === 'press' && <Press beat={beat} vinkel={vinkel} />}
            </svg>
        </div>
    );
}
