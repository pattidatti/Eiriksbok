import { motion } from 'framer-motion';

/**
 * En enkel figur i SVG for etikkfilmen. Tegnet rundt (0, 0) = mellom føttene, ca. 190 høy.
 * - staar: står rett opp
 * - ettbein: står på ett bein, det andre er bøyd bakover
 * - sitter: sitter på en krakk med hendene i fanget
 * - gir: rekker armene fram (mot høyre)
 * - tar: rekker armene fram (mot venstre)
 */
export type Positur = 'staar' | 'ettbein' | 'sitter' | 'gir' | 'tar';

export function EtikkFigur({
    x,
    y,
    farge,
    positur = 'staar',
    skjegg = false,
    hue,
    skala = 1,
}: {
    x: number;
    y: number;
    farge: string;
    positur?: Positur;
    skjegg?: boolean;
    hue?: string;
    skala?: number;
}) {
    const hud = '#e9c39b';
    const sitter = positur === 'sitter';
    // Hoftehøyden: lavere når figuren sitter.
    const hofte = sitter ? -70 : -88;
    const skulder = hofte - 70;
    const hode = skulder - 30;
    const arm =
        positur === 'gir'
            ? 'M -14 ' + (skulder + 8) + ' L 40 ' + (skulder + 34) + ' M 14 ' + (skulder + 8) + ' L 52 ' + (skulder + 30)
            : positur === 'tar'
              ? 'M 14 ' + (skulder + 8) + ' L -40 ' + (skulder + 34) + ' M -14 ' + (skulder + 8) + ' L -52 ' + (skulder + 30)
              : sitter
                ? 'M -20 ' + (skulder + 8) + ' L -12 ' + (hofte - 6) + ' M 20 ' + (skulder + 8) + ' L 12 ' + (hofte - 6)
                : 'M -22 ' + (skulder + 8) + ' L -30 ' + (hofte + 6) + ' M 22 ' + (skulder + 8) + ' L 30 ' + (hofte + 6);
    const bein =
        positur === 'ettbein'
            ? 'M -6 ' + hofte + ' L -8 0 M 8 ' + hofte + ' L 30 -40 L 52 -66'
            : sitter
              ? 'M -10 ' + hofte + ' L -44 ' + hofte + ' L -44 0 M 10 ' + hofte + ' L -30 ' + hofte + ' L -28 0'
              : 'M -8 ' + hofte + ' L -14 0 M 8 ' + hofte + ' L 14 0';
    return (
        <motion.g
            initial={false}
            animate={{ x, y, scale: skala }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
            {sitter && <rect x={-66} y={hofte - 2} width={56} height={14} rx={4} fill="#a16207" />}
            {sitter && (
                <path d={`M -60 ${hofte + 12} L -60 0 M -16 ${hofte + 12} L -16 0`} stroke="#a16207" strokeWidth={8} />
            )}
            <path d={bein} stroke="#334155" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x={-26} y={skulder} width={52} height={hofte - skulder + 8} rx={20} fill={farge} />
            <path d={arm} stroke={farge} strokeWidth={13} strokeLinecap="round" fill="none" />
            <circle cx={0} cy={hode} r={26} fill={hud} />
            {skjegg && <path d={`M -22 ${hode + 4} Q 0 ${hode + 52} 22 ${hode + 4} Z`} fill="#d6d3d1" />}
            {hue && <path d={`M -16 ${hode - 22} Q 0 ${hode - 36} 16 ${hode - 22} Z`} fill={hue} />}
        </motion.g>
    );
}
