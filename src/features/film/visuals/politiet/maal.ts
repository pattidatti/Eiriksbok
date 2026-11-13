/** Bredden på en SVG-tekst, omtrent (0,56 x skriftstørrelse per tegn). */
export function tekstBredde(tekst: string, storrelse: number) {
    return tekst.length * storrelse * 0.56;
}
