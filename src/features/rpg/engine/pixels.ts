// Bittelite tegneverktøy for piksel-grafikk. Alt i spillet tegnes med disse
// funksjonene rett inn i et canvas - vi har ingen bildefiler i det hele tatt.
// Det betyr at utseendet på en figur er data (farger + valg), og derfor kan
// eleven bygge sin egen karakter uten at noen må tegne nye sprites.

export interface Painter {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    /** Én piksel. */
    px(x: number, y: number, color: string): void;
    /** Fylt rektangel i pikselkoordinater. */
    rect(x: number, y: number, w: number, h: number, color: string): void;
    /** Vannrett linje. */
    hline(x: number, y: number, len: number, color: string): void;
    /** Loddrett linje. */
    vline(x: number, y: number, len: number, color: string): void;
    /** Fylt ellipse, pikselert. Hjørnene rundes så polene ikke blir knotete. */
    ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void;
    /** Speiler alt som er tegnet så langt om den loddrette midtaksen. */
    mirror(): void;
    /**
     * Legger en 1px kontur rundt alt som er tegnet. Konturen er selve
     * skillet mellom «koden tegner former» og «dette ser ut som pikselkunst»:
     * uten den flyter figuren sammen med bakgrunnen.
     */
    outline(color?: string): void;
    /** Tegner bak alt som allerede står der - brukt til bakkeskygger. */
    behind(draw: () => void): void;
    /** Flytter origo, slik at én stor plate kan tegnes celle for celle. */
    at(x: number, y: number, draw: () => void): void;
}

export function createPainter(
    w: number,
    h: number,
    offsetX = 0,
    offsetY = 0
): Painter & { canvas: HTMLCanvasElement } {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    if (offsetX || offsetY) ctx.translate(offsetX, offsetY);

    const painter = {
        canvas,
        ctx,
        w,
        h,
        px(x: number, y: number, color: string) {
            ctx.fillStyle = color;
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        },
        rect(x: number, y: number, rw: number, rh: number, color: string) {
            ctx.fillStyle = color;
            ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
        },
        hline(x: number, y: number, len: number, color: string) {
            painter.rect(x, y, len, 1, color);
        },
        vline(x: number, y: number, len: number, color: string) {
            painter.rect(x, y, 1, len, color);
        },
        ellipse(cx: number, cy: number, rx: number, ry: number, color: string) {
            ctx.fillStyle = color;
            for (let y = -ry; y <= ry; y++) {
                let span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
                if (span <= 0) continue;
                // Uten dette får ellipsen 1px-knotter på topp og bunn.
                if (Math.abs(y) === Math.round(ry) && rx > 2) span = Math.max(1, span - 1);
                ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2, 1);
            }
        },
        mirror() {
            const snapshot = ctx.getImageData(0, 0, w, h);
            const tmp = document.createElement('canvas');
            tmp.width = w;
            tmp.height = h;
            const tctx = tmp.getContext('2d')!;
            tctx.putImageData(snapshot, 0, 0);
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.scale(-1, 1);
            ctx.drawImage(tmp, -w, 0);
            ctx.restore();
        },
        outline(color = '#171320') {
            const bilde = ctx.getImageData(0, 0, w, h);
            const d = bilde.data;
            const ut = new Uint8ClampedArray(d);
            const { r, g, b } = hexToRgb(color);
            const dekket = (x: number, y: number) =>
                x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    if (d[i + 3] > 40) continue;
                    if (!dekket(x - 1, y) && !dekket(x + 1, y) && !dekket(x, y - 1) && !dekket(x, y + 1)) {
                        continue;
                    }
                    ut[i] = r;
                    ut[i + 1] = g;
                    ut[i + 2] = b;
                    ut[i + 3] = 255;
                }
            }
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.putImageData(new ImageData(ut, w, h), 0, 0);
            ctx.restore();
        },
        behind(draw: () => void) {
            const forrige = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'destination-over';
            draw();
            ctx.globalCompositeOperation = forrige;
        },
        at(x: number, y: number, draw: () => void) {
            ctx.save();
            ctx.translate(x, y);
            draw();
            ctx.restore();
        },
    };
    return painter;
}

// ─── Farge-hjelpere ─────────────────────────────────────────────────────────

export function shade(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    const f = (v: number) =>
        Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
    return rgbToHex(f(r), f(g), f(b));
}

/**
 * Ett trinn opp eller ned i en fargerampe.
 *
 * Forskjellen på dette og `shade()` er hele grunnen til at figurene ser malt ut
 * i stedet for utregnet: skygger går kaldere og mer mettede, lys går varmere og
 * mindre mettet. Å bare gange fargen med 0,75 gir den grå, «skitne» skyggen som
 * skiller amatør-pikselkunst fra proff.
 *
 * `steg` er -2 (dyp skygge) til +2 (høylys).
 */
export function ramp(hex: string, steg: number): string {
    if (steg === 0) return hex;
    const { h, s, l } = hexToHsl(hex);
    const skygge = steg < 0;
    const n = Math.abs(steg);

    // Mot blått i skyggen, mot gult i lyset - men aldri hele veien.
    const mal = skygge ? 255 : 45;
    const nyH = dreiHue(h, mal, n * (skygge ? 13 : 9));
    const nyS = Math.max(0, Math.min(1, s + (skygge ? 0.06 : -0.07) * n));
    const nyL = Math.max(0, Math.min(1, l + (skygge ? -0.11 : 0.12) * n));
    return hslToHex(nyH, nyS, nyL);
}

/** Dreier en fargetone mot en måltone, høyst `maks` grader. */
function dreiHue(fra: number, til: number, maks: number): number {
    let diff = ((til - fra + 540) % 360) - 180;
    if (Math.abs(diff) > maks) diff = Math.sign(diff) * maks;
    return (fra + diff + 360) % 360;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    const full =
        clean.length === 3
            ? clean
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : clean;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const maks = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (maks + min) / 2;
    if (maks === min) return { h: 0, s: 0, l };
    const d = maks - min;
    const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);
    let h: number;
    if (maks === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (maks === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
    return { h, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rgb: [number, number, number];
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return rgbToHex(
        Math.round((rgb[0] + m) * 255),
        Math.round((rgb[1] + m) * 255),
        Math.round((rgb[2] + m) * 255)
    );
}

export function numToHex(value: number): string {
    return `#${value.toString(16).padStart(6, '0')}`;
}

export function hexToNum(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
}

// ─── Deterministisk tilfeldighet ────────────────────────────────────────────
// Verden skal se lik ut hver gang eleven kommer tilbake, så vi bruker en
// seedet generator i stedet for Math.random når vi strør gress og steiner.

export function makeRng(seed: number): () => number {
    let state = seed >>> 0 || 1;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
    };
}
