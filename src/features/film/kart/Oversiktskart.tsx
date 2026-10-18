import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../components/atlas/useAtlasWorld';
import type { Utsnitt } from './useFilmVerden';

/**
 * Lite oversiktskart i et hjørne: et større område med en rød ramme rundt det hovedkartet
 * viser. En 14-åring vet ikke hvor Tora Bora eller Rørosvidda ligger; med rammen ser hen
 * det med en gang. Bruk det når hovedkartet zoomer så langt inn at landegrensene ikke
 * lenger forteller hvor vi er.
 *
 * Tegnes med det grove kartet (billig). `omrade` er det oversikten viser; uten det velges
 * et område rundt utsnittet som er ca. ti ganger så bredt.
 */

type Plassering = 'nede-venstre' | 'nede-hoyre' | 'oppe-venstre' | 'oppe-hoyre';

const PLASS: Record<Plassering, string> = {
    'nede-venstre': 'left-[2.5%] bottom-[4%]',
    'nede-hoyre': 'right-[2.5%] bottom-[4%]',
    'oppe-venstre': 'left-[2.5%] top-[4%]',
    'oppe-hoyre': 'right-[2.5%] top-[4%]',
};

const B = 200;
const H = 140;

function rundt(u: Utsnitt): Utsnitt {
    const [[v, s], [o, n]] = u;
    const cx = (v + o) / 2;
    const cy = (s + n) / 2;
    const bredde = Math.max(24, (o - v) * 10);
    const hoyde = Math.max(14, (n - s) * 10);
    return [
        [cx - bredde / 2, Math.max(-75, cy - hoyde / 2)],
        [cx + bredde / 2, Math.min(80, cy + hoyde / 2)],
    ];
}

export const Oversiktskart = memo(function Oversiktskart({
    utsnitt,
    omrade,
    plassering = 'nede-venstre',
    synlig = true,
    etikett,
}: {
    utsnitt: Utsnitt;
    omrade?: Utsnitt;
    plassering?: Plassering;
    synlig?: boolean;
    /** Navn under kartet, f.eks. «Nord-Europa». */
    etikett?: string;
}) {
    const { geographies } = useAtlasWorld();
    const flate = omrade ?? rundt(utsnitt);
    const { proj, sti } = useMemo(() => {
        const p = geoMercator()
            .fitExtent(
                [
                    [4, 4],
                    [B - 4, H - 4],
                ],
                { type: 'MultiPoint', coordinates: flate } as never
            )
            .clipExtent([
                [0, 0],
                [B, H],
            ]);
        return { proj: p, sti: geoPath(p) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flate.flat().join(',')]);
    const land = useMemo(() => geographies.map((g) => sti(g as never) ?? ''), [geographies, sti]);

    const a = proj(utsnitt[0]) ?? [0, 0];
    const b = proj(utsnitt[1]) ?? [0, 0];
    const x = Math.min(a[0], b[0]);
    const y = Math.min(a[1], b[1]);
    const w = Math.max(6, Math.abs(b[0] - a[0]));
    const h = Math.max(6, Math.abs(b[1] - a[1]));

    return (
        <AnimatePresence>
            {synlig && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute ${PLASS[plassering]} z-10 rounded-xl bg-white/95 p-1.5 shadow-xl ring-1 ring-slate-200`}
                >
                    <svg width={B} height={H} viewBox={`0 0 ${B} ${H}`} className="block rounded-lg bg-sky-100">
                        {land.map((d, i) => (
                            <path key={i} d={d} fill="#efe6cf" stroke="#c9bb98" strokeWidth={0.5} />
                        ))}
                        <motion.rect
                            x={x - 3}
                            y={y - 3}
                            width={w + 6}
                            height={h + 6}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={2.5}
                            rx={2}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.4, 1] }}
                            transition={{ duration: 1.6, delay: 0.3 }}
                        />
                    </svg>
                    {etikett && (
                        <div className="pt-1 text-center text-[13px] font-bold text-slate-600">{etikett}</div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
});
