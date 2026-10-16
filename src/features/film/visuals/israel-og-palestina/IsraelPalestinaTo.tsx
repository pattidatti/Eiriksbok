import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To folk på hver sin side av det samme landet, i fire modus:
 * «apning»: to folk, to historier, to sår og ett land begge vil ha.
 * «oslo»: hemmelige møter i Oslo, en bro mellom sidene, håndtrykket og fredsprisen.
 * «rabin»: Rabin blir drept, og broen faller sammen bit for bit.
 * «perspektiv»: hva israelere, palestinere og FN sier, ett kort om gangen.
 * Ingen vold vises. Drapet på Rabin vises bare som en dato og et navn med sørgebånd.
 */

const B = 1600;
const H = 900;
type Modus = 'apning' | 'oslo' | 'rabin' | 'perspektiv';

const FARGE = {
    israel: '#2563eb',
    israelLys: '#dbeafe',
    palestina: '#0f766e',
    palestinaLys: '#ccfbf1',
    land: '#d6c7a1',
    landMork: '#a8956b',
    himmel: '#f5efe2',
    bro: '#92400e',
    gull: '#ca8a04',
    sorg: '#111827',
};

const VENSTRE_X = 260;
const HOYRE_X = 1340;
const BAKKE_Y = 640;
const PLANKER = 12;
const BRO_FRA = 470;
const BRO_TIL = 1130;

export function IsraelPalestinaTo({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'apning';
    const visBro = modus === 'oslo' || modus === 'rabin';

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.himmel }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* To klipper med en kløft imellom når broen skal vises, ellers én bakke */}
                {visBro ? (
                    <>
                        <path
                            d={`M 0 ${BAKKE_Y} L ${BRO_FRA} ${BAKKE_Y} L ${BRO_FRA - 30} ${H} L 0 ${H} Z`}
                            fill={FARGE.land}
                        />
                        <path
                            d={`M ${BRO_TIL} ${BAKKE_Y} L ${B} ${BAKKE_Y} L ${B} ${H} L ${BRO_TIL + 30} ${H} Z`}
                            fill={FARGE.land}
                        />
                        <rect
                            x={BRO_FRA - 30}
                            y={H - 40}
                            width={BRO_TIL - BRO_FRA + 60}
                            height={40}
                            fill="#57534e"
                        />
                    </>
                ) : (
                    <path
                        d={`M 0 ${BAKKE_Y} C 400 ${BAKKE_Y} 560 ${BAKKE_Y - 190} 800 ${BAKKE_Y - 190} C 1040 ${
                            BAKKE_Y - 190
                        } 1200 ${BAKKE_Y} ${B} ${BAKKE_Y} L ${B} ${H} L 0 ${H} Z`}
                        fill={FARGE.land}
                    />
                )}

                <Folk x={VENSTRE_X} farge={FARGE.israel} />
                <Folk x={HOYRE_X} farge={FARGE.palestina} />
                <Navn x={VENSTRE_X} tekst={visBro ? 'Israel' : 'Israelere'} farge={FARGE.israel} />
                <Navn x={HOYRE_X} tekst={visBro ? 'PLO' : 'Palestinere'} farge={FARGE.palestina} />

                {modus === 'apning' && <Apning beat={beat} />}
                {modus === 'oslo' && <Oslo beat={beat} />}
                {modus === 'rabin' && <Rabin beat={beat} />}
            </svg>

            {modus === 'perspektiv' && <Perspektiv beat={beat} />}
        </div>
    );
}

/** En liten gruppe mennesker, tegnet som enkle figurer. */
function Folk({ x, farge }: { x: number; farge: string }) {
    // Bakre rad først, så den fremre tegnes over
    const plass = [-75, 0, 75, -112, -37, 37, 112];
    return (
        <g>
            {plass.map((dx, i) => {
                const bak = i < 3;
                const y = BAKKE_Y - (bak ? 18 : 0);
                const s = bak ? 0.85 : 1;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: bak ? 0.75 : 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.6 }}
                    >
                        <g transform={`translate(${x + dx} ${y}) scale(${s})`}>
                            <circle cx={0} cy={-118} r={22} fill={farge} />
                            <path
                                d="M -30 0 L -30 -60 Q -30 -90 0 -90 Q 30 -90 30 -60 L 30 0 Z"
                                fill={farge}
                            />
                        </g>
                    </motion.g>
                );
            })}
        </g>
    );
}

function Navn({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    return (
        <text
            x={x}
            y={BAKKE_Y + 80}
            textAnchor="middle"
            fontSize={52}
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

function Kort({
    x,
    y,
    b = 380,
    tekst,
    farge,
    bakgrunn = '#ffffff',
    forsinkelse = 0,
    stor,
}: {
    x: number;
    y: number;
    b?: number;
    tekst: string;
    farge: string;
    bakgrunn?: string;
    forsinkelse?: number;
    stor?: boolean;
}) {
    const h = stor ? 96 : 80;
    // Bred nok til teksten: ca. 0,6 x skriftstørrelsen per tegn, pluss marg
    const bredde = Math.max(b, tekst.length * (stor ? 30 : 24) + 70);
    return (
        <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, duration: 0.6 }}
        >
            <rect
                x={x - bredde / 2}
                y={y - h / 2}
                width={bredde}
                height={h}
                rx={20}
                fill={bakgrunn}
                stroke={farge}
                strokeWidth={6}
            />
            <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={stor ? 50 : 40}
                fontWeight={900}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Apning({ beat }: { beat: number }) {
    return (
        <g>
            <motion.text
                x={800}
                y={BAKKE_Y - 230}
                textAnchor="middle"
                fontSize={58}
                fontWeight={900}
                fill="#57534e"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                Ett land
            </motion.text>
            {beat >= 1 && (
                <>
                    <Kort x={VENSTRE_X + 40} y={130} tekst="Vår historie" farge={FARGE.israel} />
                    <Kort
                        x={HOYRE_X - 40}
                        y={130}
                        tekst="Vår historie"
                        farge={FARGE.palestina}
                        forsinkelse={0.4}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Kort
                        x={VENSTRE_X + 40}
                        y={240}
                        tekst="Sår: Holocaust"
                        farge="#ffffff"
                        bakgrunn={FARGE.sorg}
                    />
                    <Kort
                        x={HOYRE_X - 40}
                        y={240}
                        tekst="Sår: flukten i 1948"
                        farge="#ffffff"
                        bakgrunn={FARGE.sorg}
                        forsinkelse={0.4}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <BuePil
                        fra={[VENSTRE_X + 130, BAKKE_Y - 140]}
                        til={[740, BAKKE_Y - 260]}
                        farge={FARGE.israel}
                    />
                    <BuePil
                        fra={[HOYRE_X - 130, BAKKE_Y - 140]}
                        til={[860, BAKKE_Y - 260]}
                        farge={FARGE.palestina}
                    />
                    <Kort
                        x={800}
                        y={130}
                        b={460}
                        tekst="Begge: «Vårt land»"
                        farge="#7c2d12"
                        stor
                        forsinkelse={1}
                    />
                </>
            )}
        </g>
    );
}

function BuePil({
    fra,
    til,
    farge,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
}) {
    const mx = (fra[0] + til[0]) / 2;
    const my = Math.min(fra[1], til[1]) - 90;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
            <motion.path
                d="M -26 -16 L 8 0 L -26 16 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
            />
        </g>
    );
}

/** Broen mellom klippene. `lagt` = antall planker på plass, `faller` = plankene ramler ned. */
function Bro({ lagt, faller, sprekk }: { lagt: number; faller: boolean; sprekk: boolean }) {
    const bredde = (BRO_TIL - BRO_FRA) / PLANKER;
    return (
        <g>
            {Array.from({ length: PLANKER }, (_, i) => {
                const synlig = i < lagt;
                const x = BRO_FRA + i * bredde;
                // Plankene i midten faller først
                const avstand = Math.abs(i - (PLANKER - 1) / 2);
                return (
                    <motion.rect
                        key={i}
                        x={x + 2}
                        width={bredde - 4}
                        height={34}
                        rx={4}
                        fill={FARGE.bro}
                        initial={false}
                        animate={
                            faller
                                ? { y: H + 40, opacity: 0, rotate: i % 2 ? 25 : -25 }
                                : {
                                      y: synlig ? BAKKE_Y : BAKKE_Y - 140,
                                      opacity: synlig ? 1 : 0,
                                      rotate: 0,
                                  }
                        }
                        transition={
                            faller
                                ? { delay: (6 - avstand) * 0.18, duration: 1.4, ease: 'easeIn' }
                                : { delay: synlig ? i * 0.12 : 0, duration: 0.6 }
                        }
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                );
            })}
            {!faller && lagt >= PLANKER && (
                <motion.line
                    x1={BRO_FRA}
                    x2={BRO_TIL}
                    y1={BAKKE_Y - 70}
                    y2={BAKKE_Y - 70}
                    stroke={FARGE.bro}
                    strokeWidth={8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                />
            )}
            {sprekk && (
                <motion.path
                    d={`M 800 ${BAKKE_Y - 70} L 788 ${BAKKE_Y - 30} L 812 ${BAKKE_Y} L 796 ${BAKKE_Y + 34}`}
                    fill="none"
                    stroke={FARGE.sorg}
                    strokeWidth={7}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                />
            )}
        </g>
    );
}

function Oslo({ beat }: { beat: number }) {
    const lagt = beat >= 2 ? PLANKER : beat === 1 ? 3 : 0;
    return (
        <g>
            <Bro lagt={lagt} faller={false} sprekk={false} />
            {beat === 0 && (
                <Kort x={800} y={170} b={420} tekst="Håp om fred" farge="#7c2d12" stor />
            )}
            {beat === 1 && (
                <>
                    <Kort
                        x={800}
                        y={170}
                        b={520}
                        tekst="Oslo: hemmelige møter"
                        farge="#7c2d12"
                        stor
                    />
                    <Kort
                        x={800}
                        y={300}
                        b={560}
                        tekst="PLO: ledet av Yasser Arafat"
                        farge={FARGE.palestina}
                        forsinkelse={0.6}
                    />
                </>
            )}
            {beat === 2 && (
                <>
                    <Kort x={800} y={170} b={480} tekst="1993: Oslo-avtalen" farge="#7c2d12" stor />
                    <Kort
                        x={800}
                        y={300}
                        b={560}
                        tekst="De godtar hverandre"
                        farge="#15803d"
                        forsinkelse={1.6}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Kort
                        x={800}
                        y={170}
                        b={560}
                        tekst="Det hvite hus, Washington"
                        farge="#7c2d12"
                        stor
                    />
                    <Kort
                        x={620}
                        y={BAKKE_Y - 150}
                        b={250}
                        tekst="Rabin"
                        farge={FARGE.israel}
                        forsinkelse={0.4}
                    />
                    <Kort
                        x={980}
                        y={BAKKE_Y - 150}
                        b={250}
                        tekst="Arafat"
                        farge={FARGE.palestina}
                        forsinkelse={0.4}
                    />
                    {beat === 3 && (
                        <Kort
                            x={800}
                            y={300}
                            b={300}
                            tekst="Clinton"
                            farge="#475569"
                            forsinkelse={0.9}
                        />
                    )}
                </>
            )}
            {beat >= 4 && (
                <>
                    <Medalje x={620} y={BAKKE_Y - 270} />
                    <Medalje x={980} y={BAKKE_Y - 270} forsinkelse={0.4} />
                    <Kort
                        x={800}
                        y={300}
                        b={480}
                        tekst="Nobels fredspris"
                        farge={FARGE.gull}
                        forsinkelse={0.8}
                    />
                </>
            )}
        </g>
    );
}

function Medalje({ x, y, forsinkelse = 0 }: { x: number; y: number; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 260, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={46} fill={FARGE.gull} stroke="#fde68a" strokeWidth={8} />
            <circle cx={x} cy={y} r={28} fill="none" stroke="#fef3c7" strokeWidth={4} />
        </motion.g>
    );
}

function Rabin({ beat }: { beat: number }) {
    return (
        <g>
            <Bro lagt={PLANKER} faller={beat >= 2} sprekk={beat <= 1} />
            {beat === 0 && (
                <Kort x={800} y={170} b={520} tekst="Men freden varte ikke" farge="#7c2d12" stor />
            )}
            {beat === 1 && (
                <>
                    <Kort
                        x={800}
                        y={170}
                        b={480}
                        tekst="4. november 1995"
                        farge="#ffffff"
                        bakgrunn={FARGE.sorg}
                        stor
                    />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <rect
                            x={590}
                            y={262}
                            width={420}
                            height={90}
                            rx={18}
                            fill="#ffffff"
                            stroke="#6b7280"
                            strokeWidth={5}
                        />
                        <text
                            x={800}
                            y={309}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill="#374151"
                        >
                            Yitzhak Rabin
                        </text>
                        <path d="M 960 262 L 1010 262 L 1010 312 Z" fill={FARGE.sorg} />
                    </motion.g>
                </>
            )}
            {beat === 2 && (
                <Kort
                    x={800}
                    y={170}
                    b={600}
                    tekst="Mindre vilje til å gi og ta"
                    farge="#7c2d12"
                    stor
                />
            )}
            {beat >= 3 && (
                <>
                    <Kort x={800} y={130} b={560} tekst="Forhandlingene stopper" farge="#7c2d12" />
                    <Kort
                        x={800}
                        y={230}
                        b={560}
                        tekst="Volden øker"
                        farge="#b91c1c"
                        forsinkelse={0.6}
                    />
                    <Kort
                        x={800}
                        y={330}
                        b={560}
                        tekst="Mindre tillit"
                        farge="#475569"
                        forsinkelse={1.2}
                    />
                </>
            )}
        </g>
    );
}

const SIDER = [
    {
        navn: 'Mange israelere',
        farge: FARGE.israel,
        lys: FARGE.israelLys,
        tekst: 'Det eneste stedet der jøder kan beskytte seg selv. Etter Holocaust en nødvendighet.',
    },
    {
        navn: 'Mange palestinere',
        farge: FARGE.palestina,
        lys: FARGE.palestinaLys,
        tekst: 'Vi har bodd her i generasjoner. Drevet ut i 1948. Okkupert siden 1967.',
    },
    {
        navn: 'FN',
        farge: '#b45309',
        lys: '#fef3c7',
        tekst: 'Bosettingene er ulovlige. Begge parter har brutt folkeretten.',
    },
];

function Perspektiv({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-x-0 top-0 flex items-start justify-center gap-5 px-10 pt-16">
            {SIDER.map((s, i) => {
                const vist = beat >= i + 1;
                const aktiv = beat === i + 1;
                return (
                    <motion.div
                        key={s.navn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, scale: aktiv ? 1.04 : 1 }}
                        transition={{ delay: beat === 0 ? i * 0.25 : 0, duration: 0.5 }}
                        className="flex-1 rounded-3xl shadow-xl p-5 min-h-[11rem]"
                        style={{
                            background: vist ? s.lys : '#ffffff',
                            border: `6px solid ${s.farge}`,
                            opacity: vist && !aktiv ? 0.75 : 1,
                        }}
                    >
                        <div className="text-3xl font-black" style={{ color: s.farge }}>
                            {s.navn}
                        </div>
                        <AnimatePresence>
                            {vist ? (
                                <motion.div
                                    key="tekst"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-2 text-xl font-bold text-slate-800 leading-snug"
                                >
                                    {s.tekst}
                                </motion.div>
                            ) : (
                                <div className="mt-3 text-6xl font-black text-slate-300">?</div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
