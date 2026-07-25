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
    /** Fylt ellipse, pikselert. */
    ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void;
    /** Speiler alt som er tegnet så langt om den loddrette midtaksen. */
    mirror(): void;
}

export function createPainter(w: number, h: number): Painter & { canvas: HTMLCanvasElement } {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

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
                const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
                if (span <= 0) continue;
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
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(tmp, -w, 0);
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
