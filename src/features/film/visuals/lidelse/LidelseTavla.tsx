import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { GRUPPER, TRADISJONER, finnGruppe, finnTradisjon } from './data';
import { LidelseSymbol } from './LidelseSymbol';

/**
 * Tavla: samme spørsmål til hver tradisjon. Til venstre fylles en oversikt ut etter hvert
 * som filmen går gjennom tradisjonene. Til høyre står tradisjonen som er i fokus, med
 * svarene sine som brikker som kommer inn én beat om gangen.
 */

interface Brikke {
    tekst: string;
    fraBeat: number;
    /** Tradisjon, gruppe eller «monster». Bestemmer hva panelet til høyre viser. */
    fokus: string;
    tone?: 'rod' | 'gronn';
    /** Tradisjoner som lyser opp på tavla fra denne beaten. «alle» = alle ni. */
    marker?: string[];
}

interface Props {
    brikker: Brikke[];
    /** Tradisjoner som allerede er gjennomgått i tidligere scener. */
    sett?: string[];
}

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const NI = TRADISJONER.filter((t) => t.gruppe !== 'gjest').map((t) => t.id);

const BRIKKE_FARGE = {
    rod: { bg: '#fef2f2', bar: '#dc2626', tekst: '#7f1d1d' },
    gronn: { bg: '#f0fdfa', bar: '#0d9488', tekst: '#134e4a' },
};

function Tavla({
    sett,
    fokus,
    markert,
}: {
    sett: Set<string>;
    fokus: string;
    markert: Set<string>;
}) {
    const fokusGruppe = finnTradisjon(fokus)?.gruppe ?? fokus;
    return (
        <g>
            {GRUPPER.map((g, gi) => {
                const y = 98 + gi * 200;
                const medlemmer = TRADISJONER.filter((t) => t.gruppe === g.id);
                const aktiv = fokusGruppe === g.id;
                return (
                    <g key={g.id}>
                        <motion.rect
                            x={36}
                            y={y}
                            width={560}
                            height={186}
                            rx={26}
                            initial={false}
                            animate={{
                                fill: aktiv ? '#ffffff' : '#ffffffaa',
                                stroke: aktiv ? g.farge : '#e2d9c8',
                            }}
                            strokeWidth={aktiv ? 5 : 3}
                        />
                        <text
                            x={62}
                            y={y + 40}
                            fontSize={28}
                            fontWeight={800}
                            fill={g.farge}
                            style={FONT}
                        >
                            {g.navn}
                        </text>
                        {medlemmer.map((t, ti) => {
                            const cx = 36 + (560 / medlemmer.length) * (ti + 0.5);
                            const cy = y + 104;
                            const erFokus = fokus === t.id;
                            const vist = sett.has(t.id) || erFokus;
                            const lyser = markert.has(t.id);
                            return (
                                <g key={t.id}>
                                    <motion.circle
                                        cx={cx}
                                        cy={cy}
                                        r={52}
                                        initial={false}
                                        animate={{
                                            fill: erFokus ? t.farge : vist ? '#ffffff' : '#f1ece2',
                                            stroke: lyser ? '#f59e0b' : vist ? t.farge : '#d6cfc0',
                                            strokeWidth: lyser ? 10 : 4,
                                            scale: erFokus || lyser ? 1.08 : 1,
                                        }}
                                        transition={{ duration: 0.5 }}
                                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                                    />
                                    <g
                                        transform={`translate(${cx} ${cy}) scale(0.62)`}
                                        opacity={vist ? 1 : 0.6}
                                    >
                                        <LidelseSymbol
                                            id={t.id}
                                            farge={erFokus ? '#ffffff' : vist ? t.farge : '#a8a29e'}
                                        />
                                    </g>
                                    <text
                                        x={cx}
                                        y={cy + 72}
                                        textAnchor="middle"
                                        fontSize={26}
                                        fontWeight={700}
                                        fill={vist ? '#1e293b' : '#78716c'}
                                        style={FONT}
                                    >
                                        {t.navn}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </g>
    );
}

function Hode({ fokus }: { fokus: string }) {
    const t = finnTradisjon(fokus);
    const g = finnGruppe(t?.gruppe ?? fokus);
    if (fokus === 'monster') {
        return (
            <g>
                <text x={660} y={130} fontSize={74} fontWeight={900} fill="#0f172a" style={FONT}>
                    Mønsteret
                </text>
                <text x={662} y={186} fontSize={32} fontWeight={600} fill="#64748b" style={FONT}>
                    Hvilket spørsmål svarer de på?
                </text>
            </g>
        );
    }
    if (!t && g) {
        const medlemmer = TRADISJONER.filter((x) => x.gruppe === g.id);
        return (
            <g>
                {medlemmer.map((m, i) => (
                    <g key={m.id} transform={`translate(${720 + i * 110} 130)`}>
                        <circle r={50} fill="#ffffff" stroke={m.farge} strokeWidth={4} />
                        <g transform="scale(0.6)">
                            <LidelseSymbol id={m.id} farge={m.farge} />
                        </g>
                    </g>
                ))}
                <text x={1020} y={128} fontSize={56} fontWeight={900} fill={g.farge} style={FONT}>
                    {g.navn}
                </text>
                <text x={1022} y={176} fontSize={30} fontWeight={600} fill="#64748b" style={FONT}>
                    {g.merknad}
                </text>
            </g>
        );
    }
    if (!t) return null;
    return (
        <g>
            <circle cx={740} cy={130} r={78} fill={t.farge} />
            <g transform="translate(740 130)">
                <LidelseSymbol id={t.id} farge="#ffffff" />
            </g>
            <text x={850} y={140} fontSize={76} fontWeight={900} fill="#0f172a" style={FONT}>
                {t.navn}
            </text>
            {g && (
                <text x={854} y={190} fontSize={30} fontWeight={700} fill={g.farge} style={FONT}>
                    {g.navn}
                </text>
            )}
        </g>
    );
}

function Kort({
    brikke,
    i,
    antall,
    ny,
    farge,
}: {
    brikke: Brikke;
    i: number;
    antall: number;
    ny: boolean;
    farge: string;
}) {
    const h = antall > 4 ? 86 : 118;
    const luft = antall > 4 ? 14 : 22;
    const y = 250 + i * (h + luft);
    const tone = brikke.tone ? BRIKKE_FARGE[brikke.tone] : null;
    const str = Math.min(antall > 4 ? 36 : 46, 830 / (brikke.tekst.length * 0.58));
    return (
        <motion.g
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: ny ? 0.2 + (i % 2) * 0.5 : 0 }}
        >
            <rect
                x={650}
                y={y}
                width={910}
                height={h}
                rx={20}
                fill={tone?.bg ?? '#ffffff'}
                stroke={ny ? (tone?.bar ?? farge) : '#e2d9c8'}
                strokeWidth={ny ? 4 : 2}
            />
            <rect x={650} y={y} width={16} height={h} rx={8} fill={tone?.bar ?? farge} />
            <text
                x={694}
                y={y + h / 2 + str * 0.36}
                fontSize={str}
                fontWeight={ny ? 800 : 600}
                fill={tone?.tekst ?? (ny ? '#0f172a' : '#475569')}
                style={FONT}
            >
                {brikke.tekst}
            </text>
        </motion.g>
    );
}

export function LidelseTavla({ beat, props }: VisualProps<Props>) {
    const synlige = props.brikker.filter((b) => b.fraBeat <= beat);
    const fokus = synlige.length ? synlige[synlige.length - 1].fokus : props.brikker[0].fokus;
    const iPanel = synlige.filter((b) => b.fokus === fokus);

    const sett = new Set(props.sett ?? []);
    for (const b of synlige) if (finnTradisjon(b.fokus)) sett.add(b.fokus);
    const fokusGruppe = finnGruppe(fokus);
    if (fokusGruppe) for (const t of TRADISJONER) if (t.gruppe === fokus) sett.add(t.id);

    // Markering gjelder bare brikken på denne beaten.
    const markert = new Set<string>();
    for (const b of props.brikker.filter((x) => x.fraBeat === beat))
        for (const m of b.marker ?? []) (m === 'alle' ? NI : [m]).forEach((x) => markert.add(x));

    const farge = finnTradisjon(fokus)?.farge ?? fokusGruppe?.farge ?? '#0f172a';

    return (
        <div className="absolute inset-0" style={{ background: '#f5efe4' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Tavla sett={sett} fokus={fokus} markert={markert} />
                <AnimatePresence mode="wait">
                    <motion.g
                        key={fokus}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Hode fokus={fokus} />
                        {iPanel.map((b, i) => (
                            <Kort
                                key={b.tekst}
                                brikke={b}
                                i={i}
                                antall={iPanel.length}
                                ny={b.fraBeat === beat}
                                farge={farge}
                            />
                        ))}
                    </motion.g>
                </AnimatePresence>
            </svg>
        </div>
    );
}
