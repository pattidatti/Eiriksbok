// Hvilket år byen viser: vanlig (fri lek uten årstall), våren 1428 mens kapittel 2 pågår, eller
// april 1429 mens kapittel 3 pågår.
//
// [V] Kjøpmennene fra de vendiske byene (Lübeck, Wismar, Stralsund, Lüneburg) forlot Bergen våren 1427
// og kom tilbake i juli 1433, under krigen mellom kong Erik og hansabyene (Ersland 2020, etter
// Hanserecesse og krøniken til Christian von Geren). Ersland finner ingen hansaskip i Bergen i 1428 og
// 1429. I begge kapitlene er derfor husbonden, svennene, drengene, oldermannen og skipperen fra Lübeck
// borte fra gårdene. Om noen tyskere ble igjen, vet vi ikke [U]. At gutten og stuedrengen Hennig ble satt
// igjen for å passe gården, er laget for spillet [S].
//
// Cellene leser `EPOKE` når de bygges (`utenTyske`). Når året skifter, bygges cellene på nytt
// (`CellStreamer.lastPaNytt`), så folkene forsvinner og kommer tilbake. Hvert kapittel eier sitt år og
// setter det med `settAar` (graboks/kap2.ts og graboks/kap3.ts).
import type { Plass } from './folk';
import type { Rute } from './vandrer';

export type Aar = 1428 | 1429;

export const EPOKE = {
    /** Året et kapittel pågår i, eller null i den frie byen. */
    aar: null as Aar | null,
};

/** Kapitlet som eier `aar` slår sitt år på eller av. Et annet kapittels år røres ikke. */
export function settAar(aar: Aar, paa: boolean): void {
    if (paa) EPOKE.aar = aar;
    else if (EPOKE.aar === aar) EPOKE.aar = null;
}

/** Draktene til folkene på Kontoret, som reiste hjem i 1427. */
const TYSKE = new Set(['husbonde', 'svenn', 'dreng', 'stuedreng', 'oldermann', 'skriver', 'skipper']);
/** Blir igjen likevel: Hennig passer gården med gutten, Volmer kom med sin egen kogge (kap2-data.ts). */
const BLIR = new Set(['hennig', 'volmer']);
/** Fiskerne som handlet med Kontoret på kaia, er heller ikke der uten kjøpmennene [S]. */
const BORTE = new Set(['ottar', 'solve', 'hermen']);
/** I 1429 står Hennig på kaia med gutten (kap3.ts), ikke i schøtstua. */
const BORTE_1429 = new Set(['hennig']);

/** Hvor nær to som prater står (m). Står ingen så nær, er den andre borte. */
const PRAT_R = 1.8;

/**
 * Folkene i gårdene og ved Kontorets kai, uten dem som ikke er i byen våren 1428 og 1429. En som pratet
 * med en tysker som er borte, står i stedet for å prate med lufta.
 */
export function utenTyske<T extends Plass | Rute>(folk: T[]): T[] {
    if (EPOKE.aar === null) return folk;
    const borte = (id: string) => BORTE.has(id) || (EPOKE.aar === 1429 && BORTE_1429.has(id));
    const igjen = folk.filter((p) => (p.id ? !borte(p.id) && (BLIR.has(p.id) || !TYSKE.has(p.figur)) : !TYSKE.has(p.figur)));
    const prater = igjen.filter((p): p is T & Plass => 'rolle' in p && p.rolle === 'prate');
    return igjen.map((p) => {
        if (!('rolle' in p) || p.rolle !== 'prate') return p;
        const alene = !prater.some((q) => q !== p && q.pos.distanceTo(p.pos) < PRAT_R);
        return alene ? { ...p, rolle: 'staa' } : p;
    });
}
