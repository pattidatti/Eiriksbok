// Tilfeldighet i React-komponenter.
//
// Math.random() og Date.now() kan ikke kalles direkte under render: React krever
// at en render gir samme resultat hver gang, og i Strict Mode kjøres renderen
// dobbelt — med ekte tilfeldighet spriker de to kjøringene og UI-et flimrer.
// Hjelperne her dekker de tre tilfellene vi faktisk har i denne kodebasen.

/**
 * Deterministisk «tilfeldighet» for dekorative effekter — konfetti, støvkorn,
 * snøfnugg, gnister. Gir et tall mellom 0 og 1 som ser tilfeldig ut, men som
 * alltid er det samme for samme (i, salt). Bruk ulik salt per egenskap:
 *
 *     left: scatter(i, 1) * 100
 *     size: 2 + scatter(i, 2) * 3
 */
export function scatter(i: number, salt: number): number {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

/**
 * Ekte stokking (Fisher-Yates) av indeksene 0..n-1. Til oppgaver der rekkefølgen
 * skal være ulik fra gang til gang. Kall den i en useState-initialisator slik at
 * stokkingen skjer én gang per mount og ikke endrer seg under bruk:
 *
 *     const [order] = useState(() => shuffledIndices(items.length));
 */
export function shuffledIndices(n: number): number[] {
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
}

/**
 * Unik id til nye elementer eleven legger til (seksjoner, rader, kort). En teller
 * i stedet for Math.random() — kan ikke kollidere, og er lesbar i devtools.
 */
let idCounter = 0;
export function nextId(prefix = 'id'): string {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
}
