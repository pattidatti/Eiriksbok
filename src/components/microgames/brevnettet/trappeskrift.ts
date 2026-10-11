// Trappeskriften: årstall og bokstaver slik de vevdes inn i åklær, i et 5 x 7-rutenett.
// Bare store bokstaver og tall som spillet bruker. Skrå streker blir trinn av seg selv.

const G: Record<string, string[]> = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    '·': ['.....', '.....', '.....', '..#..', '.....', '.....', '.....'],
};

/** Bredden av en tekst i ruter (5 per tegn, 1 mellomrom, 3 for blanktegn). */
export function trappBredde(tekst: string) {
    let w = 0;
    for (const c of tekst) w += c === ' ' ? 3 : 6;
    return Math.max(0, w - 1);
}

/**
 * Tegn teksten med trappeskrift. `celle` er størrelsen på én rute i piksler.
 * Hver rute får en mørkere underkant, som en innslagstråd som ligger oppå renningen.
 */
export function tegnTrapp(
    ctx: CanvasRenderingContext2D,
    tekst: string,
    x: number,
    y: number,
    celle: number,
    farge: string,
    skygge = 'rgba(0,0,0,0.35)'
) {
    let cx = x;
    for (const c of tekst) {
        if (c === ' ') {
            cx += 3 * celle;
            continue;
        }
        const rader = G[c];
        if (rader)
            for (let r = 0; r < 7; r++)
                for (let k = 0; k < 5; k++) {
                    if (rader[r][k] !== '#') continue;
                    const px = cx + k * celle;
                    const py = y + r * celle;
                    ctx.fillStyle = farge;
                    ctx.fillRect(px, py, celle, celle);
                    ctx.fillStyle = skygge;
                    ctx.fillRect(px, py + celle * 0.72, celle, celle * 0.28);
                }
        cx += 6 * celle;
    }
}

/**
 * Tegn trappeskrift på et DOM-lerret (HUD og meny). Lerretet får riktig størrelse selv,
 * skarpt på skjermer med høy pikseltetthet. Høyden blir 7 ruter pluss skyggen.
 */
export function tegnTrappLerret(
    lerret: HTMLCanvasElement,
    tekst: string,
    celle: number,
    farge: string
) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = (trappBredde(tekst) + 1) * celle;
    const h = 8 * celle;
    lerret.style.width = `${w}px`;
    lerret.style.height = `${h}px`;
    lerret.width = Math.ceil(w * dpr);
    lerret.height = Math.ceil(h * dpr);
    const ctx = lerret.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    tegnTrapp(ctx, tekst, celle * 0.5, celle * 0.5, celle, '#1a1410', 'rgba(0,0,0,0)');
    tegnTrapp(ctx, tekst, 0, 0, celle, farge, 'rgba(0,0,0,0.3)');
}

let lerret: HTMLCanvasElement | null = null;

/**
 * Samme som tegnTrappLerret, men på et bilde (img). HUD-en bruker bilder: lerreter i
 * spillvinduet behandles som spillets eget 3D-lerret av skallet og verktøyene.
 */
export function tegnTrappBilde(img: HTMLImageElement, tekst: string, celle: number, farge: string) {
    lerret ??= document.createElement('canvas');
    tegnTrappLerret(lerret, tekst, celle, farge);
    img.src = lerret.toDataURL();
    img.style.width = lerret.style.width;
    img.style.height = lerret.style.height;
}
