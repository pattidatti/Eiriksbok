import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * En vektskål med forklaringene på vikingtiden. Til venstre de vanlige forklaringene,
 * til høyre den nye hypotesen om selvforsvar. Vekta viser at historikerne veier
 * forklaringene ulikt, og den spør til slutt eleven hva som veier tyngst.
 *
 *  - gamle:  de tre vanlige forklaringene legges i venstre skål, én per beat
 *  - ny:     hypotesen legges i høyre skål, og vekta står likt
 *  - uenige: leksikonets forklaringer legges til venstre, og vekta heller dit
 */

type Modus = 'gamle' | 'ny' | 'uenige';

const B = 1600;
const H = 900;
const MIDT_X = B / 2;
const AKSEL_Y = 400;
const ARM = 470;
const SNOR = 210;
const FONT = 30;

interface Lodd {
    tekst: string;
    farge: string;
    fraBeat: number;
}

const GAMLE: Lodd[] = [
    { tekst: 'Flere folk', farge: '#a16207', fraBeat: 1 },
    { tekst: 'Bedre skip', farge: '#0e7490', fraBeat: 2 },
    { tekst: 'Nye handelsveier', farge: '#4d7c0f', fraBeat: 3 },
];

function venstreLodd(modus: Modus): Lodd[] {
    if (modus === 'gamle') return GAMLE;
    const alle = GAMLE.map((l) => ({ ...l, fraBeat: 0 }));
    if (modus === 'uenige')
        alle.push({ tekst: 'Svakt organisert Europa', farge: '#7c3aed', fraBeat: 1 });
    return alle;
}

function hoyreLodd(modus: Modus): Lodd[] {
    if (modus === 'gamle') return [];
    return [{ tekst: 'Selvforsvar', farge: '#b91c1c', fraBeat: 0 }];
}

/** Hvor mye vekta heller, i grader. Positivt betyr at venstre skål går ned. */
function helling(modus: Modus, beat: number): number {
    if (modus === 'gamle') return [0, 4, 7, 10][Math.min(beat, 3)];
    if (modus === 'ny') return 0;
    return beat === 0 ? 4 : 8;
}

const loddBredde = (t: string) => Math.round(t.length * FONT * 0.58 + 56);

export function HypotesenVekt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'gamle';
    const start = modus === 'gamle' ? 0 : modus === 'ny' ? 10 : 0;
    const vinkel = useMotionValue(start);
    const [v, setV] = useState(start);
    useMotionValueEvent(vinkel, 'change', setV);

    useEffect(() => {
        const mal = helling(modus, beat);
        if (!playing) {
            vinkel.set(mal);
            return;
        }
        const a = animate(vinkel, mal, { type: 'spring', stiffness: 40, damping: 9 });
        return () => a.stop();
    }, [modus, beat, playing, vinkel]);

    const rad = (v * Math.PI) / 180;
    const venstre: [number, number] = [MIDT_X - Math.cos(rad) * ARM, AKSEL_Y + Math.sin(rad) * ARM];
    const hoyre: [number, number] = [MIDT_X + Math.cos(rad) * ARM, AKSEL_Y - Math.sin(rad) * ARM];

    const tittel =
        modus === 'gamle'
            ? 'Hvorfor startet vikingtiden?'
            : modus === 'ny'
              ? 'En ny hypotese'
              : 'Historikerne veier ulikt';

    return (
        <div className="absolute inset-0 bg-[#f4efe3]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={MIDT_X}
                    y={110}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#1c1917"
                >
                    {tittel}
                </text>

                {/* Stativet */}
                <polygon
                    points={`${MIDT_X - 110},${H - 70} ${MIDT_X + 110},${H - 70} ${MIDT_X + 24},${AKSEL_Y + 10} ${MIDT_X - 24},${AKSEL_Y + 10}`}
                    fill="#78350f"
                />
                <rect x={MIDT_X - 170} y={H - 80} width={340} height={26} rx={10} fill="#57270b" />

                {/* Armen */}
                <line
                    x1={venstre[0]}
                    y1={venstre[1]}
                    x2={hoyre[0]}
                    y2={hoyre[1]}
                    stroke="#44403c"
                    strokeWidth={16}
                    strokeLinecap="round"
                />
                <circle
                    cx={MIDT_X}
                    cy={AKSEL_Y}
                    r={20}
                    fill="#ca8a04"
                    stroke="#44403c"
                    strokeWidth={5}
                />

                <Skal
                    feste={venstre}
                    lodd={venstreLodd(modus)}
                    beat={beat}
                    etikett="Den vanlige forklaringen"
                    farge="#57534e"
                />
                <Skal
                    feste={hoyre}
                    lodd={hoyreLodd(modus)}
                    beat={beat}
                    etikett={modus === 'gamle' ? '?' : 'Den nye hypotesen'}
                    farge="#991b1b"
                />
            </svg>

            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '14%' }}
            >
                <InfoKort modus={modus} beat={beat} />
            </div>
        </div>
    );
}

function Skal({
    feste,
    lodd,
    beat,
    etikett,
    farge,
}: {
    feste: [number, number];
    lodd: Lodd[];
    beat: number;
    etikett: string;
    farge: string;
}) {
    const [fx, fy] = feste;
    const bunn = fy + SNOR;
    return (
        <g>
            <line x1={fx} y1={fy} x2={fx - 150} y2={bunn} stroke="#57534e" strokeWidth={4} />
            <line x1={fx} y1={fy} x2={fx + 150} y2={bunn} stroke="#57534e" strokeWidth={4} />
            <path
                d={`M ${fx - 180} ${bunn} Q ${fx} ${bunn + 70} ${fx + 180} ${bunn} Z`}
                fill="#a8a29e"
                stroke="#57534e"
                strokeWidth={5}
            />
            {/* Loddene stables fra skåla og oppover */}
            {lodd.map((l, i) => {
                const b = loddBredde(l.tekst);
                const y = bunn - 6 - (i + 1) * 51;
                const synlig = beat >= l.fraBeat;
                return (
                    <motion.g
                        key={l.tekst}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: synlig ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <rect
                            x={fx - b / 2}
                            y={y}
                            width={b}
                            height={46}
                            rx={12}
                            fill={l.farge}
                            stroke="#ffffff"
                            strokeWidth={3}
                        />
                        <text
                            x={fx}
                            y={y + 34}
                            textAnchor="middle"
                            fontSize={FONT}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {l.tekst}
                        </text>
                    </motion.g>
                );
            })}
            <text
                x={fx}
                y={bunn + 90}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill={farge}
            >
                {etikett}
            </text>
        </g>
    );
}

function InfoKort({ modus, beat }: { modus: Modus; beat: number }) {
    let innhold: { tittel: string; tekst?: string } | null = null;
    if (modus === 'ny') {
        if (beat === 0)
            innhold = { tittel: 'Blikket går sørover', tekst: 'mot en kristen stormakt' };
        if (beat === 1)
            innhold = {
                tittel: 'Preventiv krig',
                tekst: 'angrip først, før fienden angriper deg',
            };
        if (beat === 2)
            innhold = { tittel: 'Et desperat selvforsvar?', tekst: 'for nordboernes levemåte' };
        if (beat >= 3) innhold = { tittel: 'Robert Ferguson, 2009', tekst: 'bok om vikingene' };
    }
    if (modus === 'uenige') {
        if (beat === 0) innhold = { tittel: 'En hypotese, ikke en fasit' };
        if (beat === 1)
            innhold = { tittel: 'Store norske leksikon', tekst: 'peker på andre grunner' };
        if (beat === 2) innhold = { tittel: 'Starten: rundt år 750', tekst: 'ifølge leksikonet' };
        if (beat >= 3) innhold = { tittel: 'Hva veier tyngst for deg?' };
    }
    if (!innhold) return null;
    return (
        <motion.div
            key={innhold.tittel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-7 py-3 rounded-2xl bg-white shadow-xl text-center border-b-4 border-red-800"
        >
            <div className="text-3xl font-black text-stone-900">{innhold.tittel}</div>
            {innhold.tekst && (
                <div className="text-xl font-semibold text-stone-500">{innhold.tekst}</div>
            )}
        </motion.div>
    );
}
