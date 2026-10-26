import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Irak som et snitt: en stor boks med nord, midten og sør. Ikke et kart, men en mekanisme.
 *
 * «sanksjoner»: opprørene i nord og sør slås ned, en rød mur stenger landet inne (varer
 *   kommer ikke inn, oljepengene kommer ikke ut), sykehushylla tømmes, palasset lyser.
 * «kaos» (etter 2003): statsbygningen faller sammen, folk går fra lettelse til sinne, landet
 *   deler seg i grupper, og de amerikanske soldatene drar i 2011.
 *
 * Ingen mennesker som skades. Bare prikker, bokser og farger.
 */

type Modus = 'sanksjoner' | 'kaos';

const BOKS = { x: 440, y: 140, b: 720, h: 660 };
const NORD = BOKS.y + 190;
const SOR = BOKS.y + 450;

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    sanksjoner: [
        { tekst: 'Opprørene slås ned', rod: true },
        { tekst: 'Sanksjoner: Irak stenges inne' },
        { tekst: 'Sykehusene mangler medisin', rod: true },
        { tekst: 'Saddam sitter trygt' },
    ],
    kaos: [
        { tekst: 'Ingen stat som virker', rod: true },
        { tekst: 'Fra lettelse til sinne' },
        { tekst: 'Gamle fiender i samme land', rod: true },
        { tekst: '2011: soldatene drar' },
    ],
};

/** Faste, spredte punkter i en ellipse (solsikkemønster, samme hver gang). */
function sverm(n: number, x: number, y: number, b: number, h: number): [number, number][] {
    return Array.from({ length: n }, (_, i) => {
        const r = Math.sqrt((i + 0.5) / n);
        const a = i * 2.39996;
        return [x + b / 2 + (Math.cos(a) * r * b) / 2, y + h / 2 + (Math.sin(a) * r * h) / 2];
    });
}

const FOLK = sverm(70, BOKS.x + 60, NORD + 30, BOKS.b - 120, SOR - NORD - 60);
const SOLDATER = sverm(9, BOKS.x + 90, NORD + 50, BOKS.b - 180, SOR - NORD - 100);

function Etikett({
    x,
    y,
    tekst,
    farge,
    storrelse = 44,
    forsinkelse = 0,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    storrelse?: number;
    forsinkelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Landet: boksen med tre felt og navnet. */
function Landet({ farger }: { farger: [string, string, string] }) {
    const { x, y, b, h } = BOKS;
    return (
        <g>
            <motion.rect
                x={x}
                y={y}
                width={b}
                height={NORD - y}
                rx={24}
                animate={{ fill: farger[0] }}
                transition={{ duration: 1 }}
            />
            <motion.rect
                x={x}
                y={NORD}
                width={b}
                height={SOR - NORD}
                animate={{ fill: farger[1] }}
                transition={{ duration: 1 }}
            />
            <motion.rect
                x={x}
                y={SOR}
                width={b}
                height={y + h - SOR}
                rx={24}
                animate={{ fill: farger[2] }}
                transition={{ duration: 1 }}
            />
            <rect
                x={x}
                y={y}
                width={b}
                height={h}
                rx={24}
                fill="none"
                stroke="#7f1d1d"
                strokeWidth={6}
            />
            <text
                x={x + 30}
                y={y + 60}
                fontSize={44}
                fontWeight={900}
                fill="#7f1d1d"
                opacity={0.85}
            >
                IRAK
            </text>
        </g>
    );
}

function Sanksjoner({ beat }: { beat: number }) {
    const { x, y, b, h } = BOKS;
    const hylle = { x: x + 70, y: SOR - 190 };
    const igjen = beat >= 3 ? 1 : beat === 2 ? 2 : 8;
    return (
        <g>
            <Landet
                farger={
                    beat === 0
                        ? ['#fde68a', '#fecaca', '#bbf7d0']
                        : ['#e7e5e4', '#fee2e2', '#e7e5e4']
                }
            />

            {/* Opprør i nord og sør: oransje prikker som blir grå. */}
            {[
                { cy: y + 120, tekst: 'Kurdere i nord', farge: '#a16207' },
                { cy: y + h - 90, tekst: 'Sjiamuslimer i sør', farge: '#15803d' },
            ].map((o, i) => (
                <g key={i}>
                    {Array.from({ length: 9 }, (_, k) => (
                        <motion.circle
                            key={k}
                            cx={x + 400 + (k % 5) * 34}
                            cy={o.cy - 20 + Math.floor(k / 5) * 34}
                            r={12}
                            initial={{ fill: '#f97316' }}
                            animate={{
                                fill: beat === 0 ? ['#f97316', '#f97316', '#9ca3af'] : '#9ca3af',
                            }}
                            transition={{ duration: beat === 0 ? 3 : 0, delay: 0.3 }}
                        />
                    ))}
                    <Etikett
                        x={x + 380}
                        y={o.cy + 10}
                        tekst={o.tekst}
                        farge={o.farge}
                        anker="end"
                        storrelse={36}
                    />
                </g>
            ))}
            {beat === 0 && (
                <Etikett
                    x={x + b / 2}
                    y={(NORD + SOR) / 2 + 14}
                    tekst="slås ned"
                    farge="#b91c1c"
                    forsinkelse={2.4}
                />
            )}

            {/* Muren rundt landet. */}
            {beat >= 1 && (
                <motion.rect
                    x={x - 18}
                    y={y - 18}
                    width={b + 36}
                    height={h + 36}
                    rx={34}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={16}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: beat === 1 ? 1.6 : 0, delay: 0.2 }}
                />
            )}

            {/* Varer inn fra venstre: stoppes ved muren. */}
            {beat >= 1 && (
                <g>
                    {[300, 480, 660].map((cy, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, x: -140 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: beat === 1 ? 0.8 + i * 0.3 : 0, duration: 0.8 }}
                        >
                            <rect
                                x={250}
                                y={cy - 32}
                                width={64}
                                height={64}
                                rx={6}
                                fill="#a16207"
                                stroke="#451a03"
                                strokeWidth={4}
                            />
                            <line
                                x1={250}
                                y1={cy}
                                x2={314}
                                y2={cy}
                                stroke="#451a03"
                                strokeWidth={4}
                            />
                            <line
                                x1={330}
                                y1={cy}
                                x2={390}
                                y2={cy}
                                stroke="#64748b"
                                strokeWidth={8}
                            />
                            <path
                                d={`M 390 ${cy - 16} L 412 ${cy} L 390 ${cy + 16} Z`}
                                fill="#64748b"
                            />
                            <path
                                d={`M 396 ${cy - 26} l 40 52 M 436 ${cy - 26} l -40 52`}
                                stroke="#dc2626"
                                strokeWidth={9}
                                strokeLinecap="round"
                            />
                        </motion.g>
                    ))}
                    <Etikett
                        x={180}
                        y={175}
                        tekst="Varer inn:"
                        farge="#334155"
                        storrelse={38}
                        forsinkelse={beat === 1 ? 1.4 : 0}
                    />
                    <Etikett
                        x={180}
                        y={220}
                        tekst="stoppet"
                        farge="#dc2626"
                        storrelse={38}
                        forsinkelse={beat === 1 ? 1.4 : 0}
                    />
                </g>
            )}

            {/* Oljepenger ut til høyre: sperret. */}
            {beat >= 1 && (
                <g>
                    {[330, 520].map((cy, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 1 ? 1.6 + i * 0.3 : 0 }}
                        >
                            <rect
                                x={1200}
                                y={cy - 40}
                                width={56}
                                height={80}
                                rx={10}
                                fill="#1f2937"
                            />
                            <rect x={1200} y={cy - 12} width={56} height={8} fill="#facc15" />
                            <line
                                x1={1270}
                                y1={cy}
                                x2={1360}
                                y2={cy}
                                stroke="#64748b"
                                strokeWidth={8}
                            />
                            <path
                                d={`M 1360 ${cy - 16} L 1382 ${cy} L 1360 ${cy + 16} Z`}
                                fill="#64748b"
                            />
                            <path
                                d={`M 1300 ${cy - 26} l 40 52 M 1340 ${cy - 26} l -40 52`}
                                stroke="#dc2626"
                                strokeWidth={9}
                                strokeLinecap="round"
                            />
                        </motion.g>
                    ))}
                    <Etikett
                        x={1310}
                        y={640}
                        tekst="Oljepenger:"
                        farge="#334155"
                        storrelse={38}
                        forsinkelse={beat === 1 ? 2 : 0}
                    />
                    <Etikett
                        x={1310}
                        y={685}
                        tekst="sperret"
                        farge="#dc2626"
                        storrelse={38}
                        forsinkelse={beat === 1 ? 2 : 0}
                    />
                </g>
            )}

            {/* Sykehushylla: medisinene forsvinner. */}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect
                        x={hylle.x}
                        y={hylle.y}
                        width={250}
                        height={170}
                        rx={12}
                        fill="#ffffff"
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <rect
                        x={hylle.x + 105}
                        y={hylle.y - 46}
                        width={40}
                        height={40}
                        rx={4}
                        fill="#dc2626"
                    />
                    <rect x={hylle.x + 112} y={hylle.y - 36} width={26} height={8} fill="#ffffff" />
                    <rect x={hylle.x + 121} y={hylle.y - 43} width={8} height={30} fill="#ffffff" />
                    {[0, 1].map((r) => (
                        <line
                            key={r}
                            x1={hylle.x + 10}
                            y1={hylle.y + 80 + r * 75}
                            x2={hylle.x + 240}
                            y2={hylle.y + 80 + r * 75}
                            stroke="#94a3b8"
                            strokeWidth={5}
                        />
                    ))}
                    {Array.from({ length: 8 }, (_, i) => (
                        <motion.rect
                            key={i}
                            x={hylle.x + 22 + (i % 4) * 56}
                            y={hylle.y + 30 + Math.floor(i / 4) * 75}
                            width={40}
                            height={48}
                            rx={4}
                            fill="#38bdf8"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: i < igjen ? 1 : 0 }}
                            transition={{
                                delay: beat === 2 ? 0.8 + (7 - i) * 0.3 : 0,
                                duration: 0.4,
                            }}
                        />
                    ))}
                </motion.g>
            )}

            {/* Palasset lyser. */}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <circle cx={x + 520} cy={NORD + 120} r={95} fill="#fde047" opacity={0.45} />
                    <rect
                        x={x + 455}
                        y={NORD + 100}
                        width={130}
                        height={80}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={5}
                    />
                    {[0, 1, 2].map((k) => (
                        <path
                            key={k}
                            d={`M ${x + 465 + k * 40} ${NORD + 100} a 20 22 0 0 1 40 0 Z`}
                            fill="#eab308"
                            stroke="#a16207"
                            strokeWidth={4}
                        />
                    ))}
                    <Etikett
                        x={x + 520}
                        y={NORD + 230}
                        tekst="Palasset"
                        farge="#a16207"
                        storrelse={38}
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <Etikett
                    x={800}
                    y={870}
                    tekst="Hundretusener av barn døde"
                    farge="#b91c1c"
                    storrelse={40}
                    forsinkelse={1.2}
                />
            )}
        </g>
    );
}

function Kaos({ beat }: { beat: number }) {
    const { x, b } = BOKS;
    const midt = x + b / 2;
    const farger: [string, string, string] =
        beat >= 2 ? ['#e7e5e4', '#d6d3d1', '#bbf7d0'] : ['#e7e5e4', '#e7e5e4', '#e7e5e4'];
    return (
        <g>
            <Landet farger={farger} />

            {/* Staten: et hus med søyler som faller sammen. */}
            {beat === 0 && (
                <g>
                    <motion.path
                        d={`M ${midt - 150} ${NORD + 40} L ${midt} ${NORD - 20} L ${midt + 150} ${NORD + 40} Z`}
                        fill="#94a3b8"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0.25 }}
                        transition={{ delay: 2.2, duration: 1 }}
                    />
                    {[0, 1, 2, 3].map((k) => (
                        <motion.rect
                            key={k}
                            x={midt - 120 + k * 70}
                            width={30}
                            fill="#64748b"
                            initial={{ y: NORD + 40, height: 160 }}
                            animate={{ y: NORD + 170, height: 30 }}
                            transition={{ delay: 0.8 + k * 0.35, duration: 0.7 }}
                        />
                    ))}
                    <rect x={midt - 160} y={NORD + 200} width={320} height={22} fill="#475569" />
                    <Etikett
                        x={midt}
                        y={NORD + 280}
                        tekst="Staten"
                        farge="#334155"
                        forsinkelse={0.2}
                    />
                    <Etikett
                        x={midt}
                        y={NORD + 325}
                        tekst="virker ikke"
                        farge="#b91c1c"
                        forsinkelse={2.2}
                    />
                </g>
            )}

            {/* Folk: grønne (glede) blir oransje (sinne). Blå firkanter er fremmede soldater. */}
            {beat === 1 && (
                <g>
                    {FOLK.map(([cx, cy], i) => (
                        <motion.circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={10}
                            initial={{ fill: '#22c55e' }}
                            animate={{ fill: '#f97316' }}
                            transition={{ delay: 1.2 + (i % 10) * 0.12, duration: 0.6 }}
                        />
                    ))}
                    {SOLDATER.map(([sx, sy], i) => (
                        <rect
                            key={i}
                            x={sx - 12}
                            y={sy - 12}
                            width={24}
                            height={24}
                            fill="#1d4ed8"
                            stroke="#ffffff"
                            strokeWidth={3}
                        />
                    ))}
                    <Etikett
                        x={220}
                        y={330}
                        tekst="Først: lettelse"
                        farge="#15803d"
                        storrelse={40}
                    />
                    <Etikett
                        x={220}
                        y={380}
                        tekst="Saddam er borte"
                        farge="#334155"
                        storrelse={32}
                    />
                    <Etikett x={1390} y={560} tekst="Så: sinne" farge="#c2410c" forsinkelse={1.6} />
                    <Etikett
                        x={1390}
                        y={610}
                        tekst="fremmede soldater"
                        farge="#1d4ed8"
                        storrelse={32}
                        forsinkelse={1.6}
                    />
                </g>
            )}

            {/* Gruppene: feltene får farge og navn. */}
            {beat >= 2 && (
                <g>
                    <Etikett
                        x={midt}
                        y={(NORD + SOR) / 2 + 12}
                        tekst="Sunni-islamister"
                        farge="#1f2937"
                    />
                    <Etikett
                        x={midt}
                        y={(NORD + SOR) / 2 + 56}
                        tekst="senere IS"
                        farge="#b91c1c"
                        storrelse={36}
                    />
                    <Etikett
                        x={midt}
                        y={SOR + 115}
                        tekst="Sjia-militser"
                        farge="#166534"
                        forsinkelse={0.4}
                    />
                    {beat === 2 && (
                        <Etikett
                            x={1390}
                            y={500}
                            tekst="USA-soldater"
                            farge="#1d4ed8"
                            storrelse={40}
                        />
                    )}
                    {SOLDATER.map(([sx, sy], i) => (
                        <motion.rect
                            key={i}
                            y={sy - 12}
                            width={24}
                            height={24}
                            fill="#1d4ed8"
                            stroke="#ffffff"
                            strokeWidth={3}
                            initial={{ x: sx - 12 }}
                            animate={{
                                x: beat >= 3 ? 1380 + (i % 3) * 34 : i % 2 ? x + 40 : x + b - 70,
                            }}
                            transition={{
                                duration: beat >= 3 ? 2 : 0.8,
                                delay: beat >= 3 ? 0.5 + i * 0.1 : 0,
                            }}
                        />
                    ))}
                    {beat >= 3 && (
                        <>
                            <Etikett
                                x={1430}
                                y={330}
                                tekst="USA drar"
                                farge="#1d4ed8"
                                forsinkelse={1.2}
                            />
                            <Etikett
                                x={800}
                                y={870}
                                tekst="Hundretusener døde"
                                farge="#b91c1c"
                                storrelse={40}
                                forsinkelse={1.6}
                            />
                        </>
                    )}
                </g>
            )}
        </g>
    );
}

export function GolfLandet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sanksjoner';
    const liste = BRIKKER[modus];
    const brikke = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 bg-amber-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
            >
                {modus === 'sanksjoner' ? <Sanksjoner beat={beat} /> : <Kaos beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[3%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
