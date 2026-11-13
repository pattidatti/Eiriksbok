/**
 * En ring som vokser og blekner, om og om igjen. Laget med SVG-animasjon (SMIL), fordi
 * framer-motion ikke animerte `r` på en sirkel pålitelig.
 */
export function Ringvann({
    x,
    y,
    r,
    farge,
    varighet,
    forsinkelse = 0,
    strek = 4,
}: {
    x: number;
    y: number;
    r: number;
    farge: string;
    varighet: number;
    forsinkelse?: number;
    strek?: number;
}) {
    return (
        <circle cx={x} cy={y} r={6} fill="none" stroke={farge} strokeWidth={strek} opacity={0}>
            <animate
                attributeName="r"
                from={6}
                to={r}
                dur={`${varighet}s`}
                begin={`${forsinkelse}s`}
                repeatCount="indefinite"
            />
            <animate
                attributeName="opacity"
                values="0.95;0"
                dur={`${varighet}s`}
                begin={`${forsinkelse}s`}
                repeatCount="indefinite"
            />
        </circle>
    );
}
