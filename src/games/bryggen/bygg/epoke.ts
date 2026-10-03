// Hvilket år byen viser: vanlig (fri lek uten årstall) eller våren 1428 mens kapittel 2 pågår.
//
// [V] Kjøpmennene fra de vendiske byene (Lübeck, Wismar, Stralsund, Lüneburg) forlot Bergen våren 1427
// og kom tilbake i juli 1433, under krigen mellom kong Erik og hansabyene (Ersland 2020, etter
// Hanserecesse og krøniken til Christian von Geren). I kapittel 2 er derfor husbonden, svennene,
// drengene, oldermannen og skipperen fra Lübeck borte fra gårdene. Om noen tyskere ble igjen, vet vi
// ikke [U]. At gutten og stuedrengen Hennig ble satt igjen for å passe gården, er laget for spillet [S].
//
// Cellene leser `EPOKE` når de bygges (`utenTyske`). Når epoken skifter, bygges cellene på nytt
// (`CellStreamer.lastPaNytt`), så folkene forsvinner og kommer tilbake.
import type { Plass } from './folk';
import type { Rute } from './vandrer';

export const EPOKE = {
    /** Våren 1428: kapittel 2 pågår (graboks/kap2.ts setter den). */
    kap2: false,
};

/** Draktene til folkene på Kontoret, som reiste hjem i 1427. */
const TYSKE = new Set(['husbonde', 'svenn', 'dreng', 'stuedreng', 'oldermann', 'skriver', 'skipper']);
/** Blir igjen likevel: Hennig passer gården med gutten, Volmer kom med sin egen kogge (kap2-data.ts). */
const BLIR = new Set(['hennig', 'volmer']);
/** Fiskerne som handlet med Kontoret på kaia, er heller ikke der uten kjøpmennene [S]. */
const BORTE = new Set(['ottar', 'solve', 'hermen']);

/** Folkene i gårdene og ved Kontorets kai, uten dem som ikke er i byen våren 1428. */
export function utenTyske<T extends Plass | Rute>(folk: T[]): T[] {
    if (!EPOKE.kap2) return folk;
    return folk.filter((p) => (p.id ? !BORTE.has(p.id) && (BLIR.has(p.id) || !TYSKE.has(p.figur)) : !TYSKE.has(p.figur)));
}
