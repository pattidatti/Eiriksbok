// Scenen bak leksearket i «Hunden spiste leksa»: et rom per æra (klasserom,
// rektors kontor, kommunestyret, Stortinget, FN, universet) og en gjeng
// medskyldige som faktisk GJØR ting. Hver medskyldig har sin egen oppførsel, og
// hver oppgradering låser opp noe nytt å se på: hundene begynner å spise ark,
// lillebror tegner på veggen, fabrikken får samlebånd, tidsmaskinen slipper ut
// dinosaurer. Store hendelser dukker opp av og til, og alt som vises for første
// gang er en «oppdagelse» eleven kan samle på.
//
// Ren canvas 2D. Rommet tegnes én gang til et skjult lerret per æra og størrelse;
// bare figurer, partikler og levende detaljer tegnes hvert bilde.

export interface SceneInput {
    owned: number[];
    tier: (i: number) => number; // antall oppgraderinger for medskyldig i (0-4)
    era: number;
    upg: Record<string, 1>;
    flow: number; // 0-1
    frenzy: boolean; // gullstjerne: Inspirasjon
    storm: boolean; // gullstjerne: Klikkstorm
    sus: boolean; // læreren mistenker deg
    teacher: boolean; // læreren er i rommet
    reduce: boolean;
    sheet: () => { x: number; y: number; w: number; h: number } | null; // i scenens koordinater
}

export interface SceneHooks {
    discover: (id: string, text: string) => void;
}

export interface Scene {
    update: (dt: number) => void;
    resize: () => void;
    onBuy: (i: number, k: number) => void;
    onUpgrade: (id: string) => void;
    onClick: (x: number, y: number) => void; // scenekoordinater
    onEra: () => void;
    onGold: () => void;
    onQuiz: (right: boolean) => void;
    toLocal: (clientX: number, clientY: number) => [number, number];
    /** Klikk i rommet: figuren som ble truffet hopper og svarer. Scenekoordinater inn og ut. */
    poke: (x: number, y: number) => { kind: string; x: number; y: number } | null;
    destroy: () => void;
}

/** Alt som kan oppdages. Teksten vises som toast første gang det skjer. */
export const DISCOVERIES: Record<string, string> = {
    'dog-walk': 'Hunden har flyttet inn.',
    'dog-chomp': 'Hundene har begynt å spise ark!',
    'dog-paws': 'Poteavtrykk overalt. Noen har vært ute i søla.',
    'dog-house': 'Hundepensjonatet har åpnet. Se hvem som kommer ut.',
    'dog-crown': 'Hundekongen har inntatt rommet.',
    'dog-conga': 'HUNDE-CONGA!',
    'baby-crawl': 'Lillebror kryper rundt.',
    'baby-scribble': 'Lillebror tegner på veggen. Igjen.',
    'baby-talk': 'Lillebror kan snakke: «Det var ikke meg!»',
    'baby-pr': 'Lillebror har fått megafon.',
    'baby-stampede': 'Lillebror-stormløp!',
    'gas-puff': 'Magevondt-maskinen puffer grønn sky.',
    'gas-wave': 'BLÆÆRK. Hele rommet ble grønt.',
    'gas-monday': 'Det er mandag. For alltid.',
    'wifi-zap': 'Wifi-sabotøren sender lyn.',
    'wifi-hamster': 'En hamster løper i hjulet og stjeler nettet.',
    'wifi-aurora': 'Solstorm! Nordlyset danser over rommet.',
    'granny-walk': 'Bestemor kommer med kake.',
    'granny-party': 'Bestemor har tatt med konfetti.',
    'granny-balloons': 'Ballonger! Flere bursdager.',
    'granny-dance': 'Bestemorkonferansen danser i ring.',
    'factory-belt': 'Samlebåndet går. Unnskyldninger på løpende bånd.',
    'factory-stamp': 'Stempelmaskinen: UNNSKYLDT!',
    'factory-night': 'Nattskift. Lysene blinker.',
    'factory-boom': 'Fabrikken eksploderte. Av konfetti.',
    'lobby-walk': 'Lobbyisten går rundt med koffert.',
    'lobby-money': 'Det regner penger.',
    'lobby-shake': 'To lobbyister tok hverandre i hånda. Noe ble bestemt.',
    'tm-portal': 'Tidsportalen er åpen.',
    'tm-dino': 'En DINOSAUR løp gjennom rommet!',
    'tm-summer': 'Evig sommerferie. Det ble varmt her.',
    'rel-candles': 'Lysene er tent.',
    'rel-rays': 'Lys fra himmelen faller på leksa.',
    'rel-pilgrims': 'Pilegrimer på vei til kantina.',
    'rift-open': 'En revne i virkeligheten åpnet seg.',
    'rift-copy': 'Noe kom ut av revnen. Det ser kjent ut, bare … feil farge.',
    'dove-flock': 'Fredsduene har kommet.',
    'dove-flags': 'Hvite flagg. Lærerværelset forhandler.',
    'cal-rip': 'Tirsdagene rives av kalenderen.',
    'cal-wobble': 'Tiden selv gir opp. Alt vugger.',
    'paper-rain': 'Det regner unnskyldningsdokumenter.',
    'veto-slam': 'VETO!',
    'sub-ding': 'Ka-tsjing. Abonnementet trekker penger.',
    'teacher-walk': 'Læreren kommer! Alle gjemmer seg.',
    'frenzy-disco': 'Inspirasjon: DISKO!',
    'quiz-party': 'Riktig svar. Hele gjengen jubler.',
    'flow-cheer': 'Full flyt: gjengen hopper med.',
    'era-rektor': 'Nytt rom: rektors kontor.',
    'era-kommune': 'Nytt rom: kommunestyresalen.',
    'era-stortinget': 'Nytt rom: Stortinget.',
    'era-fn': 'Nytt rom: FNs sikkerhetsråd.',
    'era-univers': 'Nytt rom: universet.',
};

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

interface Actor {
    kind: string;
    i: number; // medskyldig-indeks, -1 for andre
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number; // levetid så langt
    phase: number;
    size: number;
    dir: number; // 1 = mot høyre
    mode: string;
    timer: number;
    tx: number; // mål
    ty: number;
    drop: number; // >0 mens figuren faller inn
    gone?: boolean;
    data?: number;
    hue?: number;
}

interface Part {
    k: 'emo' | 'circ' | 'text' | 'rect' | 'ring';
    x: number;
    y: number;
    vx: number;
    vy: number;
    g: number;
    life: number;
    max: number;
    size: number;
    rot: number;
    vr: number;
    col: string;
    txt: string;
    grow: number;
    drag: number;
    fade: boolean;
    w?: number;
    h?: number;
}

function rnd(a: number, b: number) {
    return a + Math.random() * (b - a);
}
function pick<T>(a: T[]): T {
    return a[Math.floor(Math.random() * a.length)];
}

export function createScene(canvas: HTMLCanvasElement, input: () => SceneInput, hooks: SceneHooks): Scene {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let DPR = 1;
    let U = 30; // grunnstørrelse for figurer
    const seen = new Set<string>();
    const discover = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        if (DISCOVERIES[id]) hooks.discover(id, DISCOVERIES[id]);
    };

    /* ---------- emoji-sprites (tegnes én gang per størrelse) ---------- */
    const sprites = new Map<string, HTMLCanvasElement>();
    function sprite(e: string, size: number): HTMLCanvasElement {
        const s = Math.max(8, Math.round(size));
        const key = e + '|' + s;
        let c = sprites.get(key);
        if (!c) {
            c = document.createElement('canvas');
            const px = Math.ceil(s * 1.35 * DPR);
            c.width = c.height = px;
            const g = c.getContext('2d') as CanvasRenderingContext2D;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.font = `${s * DPR}px ${EMOJI_FONT}`;
            g.fillText(e, px / 2, px / 2 + s * DPR * 0.06);
            if (sprites.size > 600) sprites.clear();
            sprites.set(key, c);
        }
        return c;
    }
    function emo(e: string, x: number, y: number, size: number, opt: { flip?: boolean; rot?: number; sx?: number; sy?: number; alpha?: number } = {}) {
        const c = sprite(e, size);
        const d = c.width / DPR;
        ctx.save();
        ctx.translate(x, y);
        if (opt.rot) ctx.rotate(opt.rot);
        ctx.scale((opt.flip ? -1 : 1) * (opt.sx ?? 1), opt.sy ?? 1);
        if (opt.alpha !== undefined) ctx.globalAlpha *= opt.alpha;
        ctx.drawImage(c, -d / 2, -d / 2, d, d);
        ctx.restore();
    }

    /* ---------- rommet ---------- */
    const roomCache = new Map<string, HTMLCanvasElement>();
    const floorTop = () => H * 0.72;
    const laneY = (r: number) => H * (0.8 + r * 0.15);
    const depth = (y: number) => Math.max(0.7, Math.min(1.25, 0.8 + ((y - H * 0.8) / (H * 0.15)) * 0.4));

    function roomFor(era: number): HTMLCanvasElement {
        const key = `${era}|${W}|${H}|${DPR}`;
        let c = roomCache.get(key);
        if (c) return c;
        c = document.createElement('canvas');
        c.width = Math.max(1, W * DPR);
        c.height = Math.max(1, H * DPR);
        const g = c.getContext('2d') as CanvasRenderingContext2D;
        g.scale(DPR, DPR);
        drawRoom(g, era);
        roomCache.clear();
        roomCache.set(key, c);
        return c;
    }

    function plankFloor(g: CanvasRenderingContext2D, a: string, b: string) {
        const ft = floorTop();
        const grad = g.createLinearGradient(0, ft, 0, H);
        grad.addColorStop(0, a);
        grad.addColorStop(1, b);
        g.fillStyle = grad;
        g.fillRect(0, ft, W, H - ft);
        g.strokeStyle = 'rgba(0,0,0,.12)';
        g.lineWidth = 1;
        for (let y = ft + 10, k = 0; y < H; y += 8 + k * 2.2, k++) {
            g.beginPath();
            g.moveTo(0, y);
            g.lineTo(W, y);
            g.stroke();
        }
        // perspektivlinjer
        for (let k = -8; k <= 8; k++) {
            g.beginPath();
            g.moveTo(W / 2 + k * W * 0.06, ft);
            g.lineTo(W / 2 + k * W * 0.16, H);
            g.stroke();
        }
    }
    function wall(g: CanvasRenderingContext2D, top: string, bottom: string) {
        const grad = g.createLinearGradient(0, 0, 0, floorTop());
        grad.addColorStop(0, top);
        grad.addColorStop(1, bottom);
        g.fillStyle = grad;
        g.fillRect(0, 0, W, floorTop());
    }
    function frame(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frameCol: string, inner: string) {
        g.fillStyle = frameCol;
        g.fillRect(x - 6, y - 6, w + 12, h + 12);
        g.fillStyle = inner;
        g.fillRect(x, y, w, h);
    }
    function skirting(g: CanvasRenderingContext2D, col: string) {
        g.fillStyle = col;
        g.fillRect(0, floorTop() - 8, W, 8);
    }

    function drawRoom(g: CanvasRenderingContext2D, era: number) {
        const ft = floorTop();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        if (era === 0) {
            // Klasserommet: tavle, vindu, plakat
            wall(g, '#efe8d2', '#e2d8b8');
            g.fillStyle = 'rgba(0,0,0,.04)';
            g.fillRect(0, ft * 0.62, W, ft * 0.38);
            const bw = W * 0.26;
            const bh = ft * 0.42;
            frame(g, W * 0.03, ft * 0.2, bw, bh, '#8a5a2b', '#2f4f3a');
            g.fillStyle = 'rgba(255,255,255,.85)';
            g.font = `700 ${Math.max(12, bw / 13)}px Kalam, cursive`;
            g.fillText('Lekse til i morgen:', W * 0.03 + bw / 2, ft * 0.2 + bh * 0.3);
            g.fillText('Sidemål s. 47 (!!)', W * 0.03 + bw / 2, ft * 0.2 + bh * 0.55);
            g.strokeStyle = 'rgba(255,255,255,.6)';
            g.lineWidth = 2;
            g.beginPath();
            g.arc(W * 0.03 + bw * 0.82, ft * 0.2 + bh * 0.78, bh * 0.1, 0, Math.PI * 2);
            g.stroke();
            g.fillStyle = '#b08a5a';
            g.fillRect(W * 0.03, ft * 0.2 + bh + 6, bw, 5);
            // vindu
            const wx = W * 0.74;
            const ww = W * 0.22;
            const wh = ft * 0.5;
            frame(g, wx, ft * 0.14, ww, wh, '#f7f3ea', '#9fd3f2');
            const sky = g.createLinearGradient(0, ft * 0.14, 0, ft * 0.14 + wh);
            sky.addColorStop(0, '#7cc4f0');
            sky.addColorStop(1, '#d2eefb');
            g.fillStyle = sky;
            g.fillRect(wx, ft * 0.14, ww, wh);
            g.fillStyle = '#7bb661';
            g.fillRect(wx, ft * 0.14 + wh * 0.78, ww, wh * 0.22);
            g.fillStyle = '#f7f3ea';
            g.fillRect(wx + ww / 2 - 3, ft * 0.14, 6, wh);
            g.fillRect(wx, ft * 0.14 + wh / 2 - 3, ww, 6);
            // plakat
            frame(g, W * 0.665, ft * 0.36, W * 0.055, ft * 0.22, '#d7262e', '#fff7d6');
            g.fillStyle = '#d7262e';
            g.font = `400 ${Math.max(9, W * 0.012)}px "Permanent Marker", cursive`;
            g.fillText('LES!', W * 0.6925, ft * 0.47);
            skirting(g, '#9c7a4e');
            plankFloor(g, '#c89a62', '#a5764a');
        } else if (era === 1) {
            // Rektors kontor: trepanel, diplomer, bokhylle, teppe
            wall(g, '#7a4f2e', '#5c3a20');
            g.fillStyle = 'rgba(255,255,255,.05)';
            for (let x = 0; x < W; x += 40) g.fillRect(x, 0, 2, ft);
            for (let k = 0; k < 3; k++) {
                frame(g, W * (0.05 + k * 0.08), ft * 0.18 + (k % 2) * 14, W * 0.06, ft * 0.16, '#d4af37', '#fbf5e3');
                g.fillStyle = '#8a6b3a';
                g.fillRect(W * (0.06 + k * 0.08), ft * 0.24 + (k % 2) * 14, W * 0.04, 2);
                g.fillRect(W * (0.06 + k * 0.08), ft * 0.28 + (k % 2) * 14, W * 0.03, 2);
            }
            // bokhylle
            const sx = W * 0.75;
            const sw = W * 0.2;
            g.fillStyle = '#3d2614';
            g.fillRect(sx, ft * 0.08, sw, ft * 0.92);
            const cols = ['#b23a48', '#3a6ea5', '#e0a526', '#3f8f5b', '#6b4e9c', '#cf6a32'];
            for (let r = 0; r < 4; r++) {
                const y = ft * 0.12 + r * ft * 0.22;
                g.fillStyle = '#5a3a20';
                g.fillRect(sx, y + ft * 0.18, sw, 5);
                let x = sx + 6;
                let n = 0;
                while (x < sx + sw - 12) {
                    const bw2 = 7 + ((r * 7 + n * 3) % 6);
                    const bh2 = ft * 0.12 + ((n * 13) % 9);
                    g.fillStyle = cols[(n + r) % cols.length];
                    g.fillRect(x, y + ft * 0.18 - bh2, bw2, bh2);
                    x += bw2 + 2;
                    n++;
                }
            }
            // dørskilt
            g.fillStyle = '#d4af37';
            g.fillRect(W * 0.55, ft * 0.12, W * 0.1, 26);
            g.fillStyle = '#3d2614';
            g.font = `800 ${Math.max(10, W * 0.012)}px Inter, sans-serif`;
            g.fillText('REKTOR', W * 0.6, ft * 0.12 + 13);
            skirting(g, '#2e1b0e');
            const grad = g.createLinearGradient(0, ft, 0, H);
            grad.addColorStop(0, '#8e1f2a');
            grad.addColorStop(1, '#6b1520');
            g.fillStyle = grad;
            g.fillRect(0, ft, W, H - ft);
            g.strokeStyle = 'rgba(212,175,55,.35)';
            g.lineWidth = 3;
            g.strokeRect(W * 0.05, ft + 10, W * 0.9, H - ft - 16);
        } else if (era === 2) {
            // Kommunestyresalen: blågrå vegg, våpenskjold, bannere, langbord
            wall(g, '#c9d6e3', '#aebfd1');
            const cx = W * 0.5;
            const cy = ft * 0.2;
            g.fillStyle = '#c8102e';
            g.beginPath();
            g.moveTo(cx - 34, cy - 30);
            g.lineTo(cx + 34, cy - 30);
            g.lineTo(cx + 34, cy + 10);
            g.quadraticCurveTo(cx + 34, cy + 40, cx, cy + 52);
            g.quadraticCurveTo(cx - 34, cy + 40, cx - 34, cy + 10);
            g.closePath();
            g.fill();
            g.fillStyle = '#f2c230';
            g.font = `${40}px ${EMOJI_FONT}`;
            g.fillText('🐕', cx, cy + 8);
            for (const bx of [W * 0.12, W * 0.82]) {
                g.fillStyle = '#244a7a';
                g.fillRect(bx, ft * 0.08, W * 0.06, ft * 0.5);
                g.beginPath();
                g.moveTo(bx, ft * 0.58);
                g.lineTo(bx + W * 0.03, ft * 0.52);
                g.lineTo(bx + W * 0.06, ft * 0.58);
                g.fillStyle = '#c9d6e3';
                g.fill();
                g.fillStyle = '#f2c230';
                g.fillRect(bx + 4, ft * 0.14, W * 0.06 - 8, 3);
            }
            // langbord
            g.fillStyle = '#6b4a2b';
            g.fillRect(W * 0.08, ft - ft * 0.16, W * 0.84, ft * 0.08);
            g.fillStyle = '#4e341d';
            g.fillRect(W * 0.08, ft - ft * 0.08, W * 0.84, ft * 0.08);
            for (let k = 0; k < 9; k++) {
                g.fillStyle = '#333';
                g.fillRect(W * (0.13 + k * 0.09), ft - ft * 0.26, 3, ft * 0.1);
                g.beginPath();
                g.arc(W * (0.13 + k * 0.09) + 1.5, ft - ft * 0.27, 4, 0, Math.PI * 2);
                g.fill();
            }
            skirting(g, '#7d8fa3');
            plankFloor(g, '#9aa7b4', '#7c8996');
        } else if (era === 3) {
            // Stortinget: halvsirkel av røde stoler, talerstol, gull
            wall(g, '#f3e6c8', '#e3cf9f');
            g.fillStyle = 'rgba(160,120,40,.18)';
            for (let x = W * 0.05; x < W; x += W * 0.12) g.fillRect(x, 0, W * 0.025, ft);
            const cx = W * 0.5;
            for (let r = 0; r < 5; r++) {
                const rad = W * (0.2 + r * 0.075);
                const n = 10 + r * 4;
                for (let k = 0; k <= n; k++) {
                    const a = Math.PI + (k / n) * Math.PI;
                    const x = cx + Math.cos(a) * rad;
                    const y = ft + 10 + Math.sin(a) * rad * 0.42;
                    if (y > ft + 4) continue;
                    g.fillStyle = r % 2 ? '#a3192b' : '#c0283a';
                    g.beginPath();
                    g.roundRect(x - 7, y - 9, 14, 14, 4);
                    g.fill();
                }
            }
            g.fillStyle = '#5a3a1e';
            g.fillRect(cx - W * 0.05, ft - ft * 0.22, W * 0.1, ft * 0.22);
            g.fillStyle = '#d4af37';
            g.fillRect(cx - W * 0.055, ft - ft * 0.23, W * 0.11, 6);
            skirting(g, '#8f6b2a');
            const grad = g.createLinearGradient(0, ft, 0, H);
            grad.addColorStop(0, '#2d4a8a');
            grad.addColorStop(1, '#1d3266');
            g.fillStyle = grad;
            g.fillRect(0, ft, W, H - ft);
            g.fillStyle = 'rgba(212,175,55,.25)';
            for (let x = 0; x < W; x += 34) for (let y = ft + 12; y < H; y += 26) g.fillRect(x + ((y / 26) % 2) * 17, y, 4, 4);
        } else if (era === 4) {
            // FNs sikkerhetsråd: veggmaleri, hesteskobord, globus-emblem
            wall(g, '#dfe3e6', '#c9cfd4');
            const mx = W * 0.2;
            const mw = W * 0.6;
            const mh = ft * 0.55;
            g.fillStyle = '#c99b5e';
            g.fillRect(mx, ft * 0.05, mw, mh);
            const blobs = ['#8c4a2f', '#e0c08a', '#5a7f8c', '#b6633f', '#3e4f63', '#d9a55a'];
            for (let k = 0; k < 26; k++) {
                g.fillStyle = blobs[k % blobs.length];
                g.globalAlpha = 0.7;
                g.fillRect(mx + ((k * 97) % mw) * 0.92, ft * 0.07 + ((k * 53) % mh) * 0.85, mw * 0.08, mh * 0.18);
            }
            g.globalAlpha = 1;
            // globus
            const gx = W * 0.5;
            const gy = ft * 0.32;
            g.fillStyle = '#4b92db';
            g.beginPath();
            g.arc(gx, gy, 30, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = 'rgba(255,255,255,.8)';
            g.lineWidth = 1.5;
            g.stroke();
            for (let k = -2; k <= 2; k++) {
                g.beginPath();
                g.ellipse(gx, gy, Math.abs(k) * 7 + 2, 30, 0, 0, Math.PI * 2);
                g.stroke();
                g.beginPath();
                g.moveTo(gx - 30, gy + k * 10);
                g.lineTo(gx + 30, gy + k * 10);
                g.stroke();
            }
            // hesteskobord
            g.strokeStyle = '#d9c8a5';
            g.lineWidth = ft * 0.07;
            g.beginPath();
            g.ellipse(W / 2, ft + ft * 0.02, W * 0.3, ft * 0.16, 0, Math.PI * 1.04, Math.PI * 1.96);
            g.stroke();
            skirting(g, '#8e979e');
            const grad = g.createLinearGradient(0, ft, 0, H);
            grad.addColorStop(0, '#29466b');
            grad.addColorStop(1, '#1a2f4b');
            g.fillStyle = grad;
            g.fillRect(0, ft, W, H - ft);
        } else {
            // Universet: tåker, stjerner, planet med ring
            const grad = g.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#05060f');
            grad.addColorStop(1, '#12183a');
            g.fillStyle = grad;
            g.fillRect(0, 0, W, H);
            const neb = [
                ['rgba(140,60,200,.35)', 0.2, 0.3, 0.35],
                ['rgba(40,120,220,.3)', 0.75, 0.25, 0.3],
                ['rgba(220,80,140,.22)', 0.55, 0.6, 0.28],
            ] as const;
            for (const [col, x, y, r] of neb) {
                const rg = g.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * r);
                rg.addColorStop(0, col);
                rg.addColorStop(1, 'rgba(0,0,0,0)');
                g.fillStyle = rg;
                g.fillRect(0, 0, W, H);
            }
            for (let k = 0; k < 220; k++) {
                g.fillStyle = `rgba(255,255,255,${0.3 + ((k * 37) % 70) / 100})`;
                const s = (k * 13) % 3 === 0 ? 2 : 1;
                g.fillRect((k * 7919) % W, (k * 104729) % (H * 0.95), s, s);
            }
            const px = W * 0.86;
            const py = H * 0.22;
            const pg = g.createRadialGradient(px - 10, py - 10, 4, px, py, 34);
            pg.addColorStop(0, '#ffd59a');
            pg.addColorStop(1, '#c0602c');
            g.fillStyle = pg;
            g.beginPath();
            g.arc(px, py, 32, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = 'rgba(255,220,170,.7)';
            g.lineWidth = 4;
            g.beginPath();
            g.ellipse(px, py, 56, 12, -0.3, 0, Math.PI * 2);
            g.stroke();
            g.strokeStyle = 'rgba(120,160,255,.25)';
            g.lineWidth = 1;
            for (let k = 0; k < 6; k++) {
                g.beginPath();
                g.moveTo(0, H * (0.82 + k * 0.035));
                g.lineTo(W, H * (0.82 + k * 0.035));
                g.stroke();
            }
        }
    }

    /* ---------- figurer og partikler ---------- */
    let actors: Actor[] = [];
    let parts: Part[] = [];
    const scribbles: { pts: [number, number][]; col: string; age: number }[] = [];
    const paws: { x: number; y: number; age: number; r: number }[] = [];
    let time = 0;
    let greenFlash = 0;
    let wobble = 0;
    let shake = 0;
    let warm = 0;
    let disco = 0;
    let eventT = 14;
    let reconcileT = 0;
    let tmDinoT = 25;
    let bannerT = 0;
    let bannerTxt = '';
    let bannerCol = '#d7262e';
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let teacherActor: Actor | null = null;
    let lastEra = -1;
    let flowCheerT = 0;

    function part(o: Partial<Part>): Part | null {
        if (parts.length > 700) return null;
        const p: Part = { k: 'emo', x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 20, rot: 0, vr: 0, col: '#fff', txt: '', grow: 0, drag: 0, fade: true, ...o };
        p.max = p.life;
        parts.push(p);
        return p;
    }
    const text = (txt: string, x: number, y: number, col = '#23252c', size = 18, life = 1.2) =>
        part({ k: 'text', txt, x, y, vy: -40, life, col, size });
    function confetti(x: number, y: number, n: number, power = 1) {
        const cols = ['#ff4d6d', '#ffd21f', '#3ec1d3', '#7ae582', '#b388ff', '#ff9f1c'];
        for (let k = 0; k < n; k++) {
            const a = rnd(Math.PI * 1.1, Math.PI * 1.9);
            const sp = rnd(150, 420) * power;
            part({ k: 'rect', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 520, life: rnd(1, 2), size: rnd(4, 8), rot: rnd(0, 6), vr: rnd(-10, 10), col: pick(cols), drag: 1.2 });
        }
    }
    function dust(x: number, y: number, n = 8) {
        for (let k = 0; k < n; k++)
            part({ k: 'circ', x: x + rnd(-10, 10), y, vx: rnd(-60, 60), vy: rnd(-30, -5), life: rnd(0.4, 0.8), size: rnd(4, 9), grow: 14, col: 'rgba(160,140,120,.45)' });
    }
    function paper(x: number, y: number, n: number) {
        for (let k = 0; k < n; k++)
            part({ k: 'rect', x, y, vx: rnd(-180, 180), vy: rnd(-260, -80), g: 600, life: rnd(0.7, 1.3), size: rnd(6, 11), rot: rnd(0, 6), vr: rnd(-12, 12), col: '#ffffff', drag: 1.4 });
    }

    function newActor(kind: string, i: number, o: Partial<Actor> = {}): Actor {
        const a: Actor = { kind, i, x: rnd(W * 0.1, W * 0.9), y: laneY(Math.random()), vx: 0, vy: 0, t: 0, phase: rnd(0, 6), size: U, dir: Math.random() < 0.5 ? 1 : -1, mode: 'walk', timer: rnd(2, 6), tx: 0, ty: 0, drop: 0, ...o };
        actors.push(a);
        return a;
    }
    const count = (kind: string) => actors.filter((a) => a.kind === kind && !a.gone).length;

    // Hvor mange figurer av hver medskyldig som skal stå i rommet
    const KINDS = ['dog', 'baby', 'gas', 'dish', 'granny', 'factory', 'lobby', 'portal', 'candle', 'rift', 'dove', 'calendar'];
    const CAPS = [9, 7, 4, 3, 5, 1, 5, 1, 8, 3, 10, 1];
    function wanted(i: number, owned: number) {
        if (owned <= 0) return 0;
        if (CAPS[i] === 1) return 1;
        return Math.min(CAPS[i], 1 + Math.floor(Math.log2(owned) * 1.5));
    }

    function spawnFor(i: number, entrance: boolean) {
        const kind = KINDS[i];
        const sheet = input().sheet();
        const avoid = (x: number) => (sheet && Math.abs(x - (sheet.x + sheet.w / 2)) < sheet.w * 0.7 ? x + sheet.w * 1.2 * (x < W / 2 ? -1 : 1) : x);
        let a: Actor;
        switch (kind) {
            case 'gas':
                a = newActor(kind, i, { x: avoid(rnd(W * 0.08, W * 0.92)), y: laneY(rnd(0.1, 0.6)), mode: 'idle', size: U * 1.2 });
                break;
            case 'dish':
                a = newActor(kind, i, { x: rnd(W * 0.08, W * 0.92), y: H * rnd(0.12, 0.45), mode: 'idle', size: U * 1.1 });
                break;
            case 'factory':
                a = newActor(kind, i, { x: W * 0.5, y: H * 0.97, mode: 'idle' });
                break;
            case 'portal':
                a = newActor(kind, i, { x: W * rnd(0.15, 0.3) * (Math.random() < 0.5 ? 1 : 3.2), y: H * 0.42, mode: 'idle' });
                break;
            case 'candle':
                a = newActor(kind, i, { x: avoid(rnd(W * 0.2, W * 0.8)), y: laneY(rnd(0, 0.3)), mode: 'idle', size: U * 0.8 });
                break;
            case 'rift':
                a = newActor(kind, i, { x: rnd(W * 0.08, W * 0.92), y: H * rnd(0.25, 0.55), mode: 'idle', timer: rnd(2, 5) });
                break;
            case 'dove':
                a = newActor(kind, i, { x: Math.random() < 0.5 ? -40 : W + 40, y: H * rnd(0.08, 0.4), mode: 'fly', size: U * 0.9 });
                a.dir = a.x < 0 ? 1 : -1;
                break;
            case 'calendar':
                a = newActor(kind, i, { x: W * 0.09, y: H * 0.34, mode: 'idle', size: U * 2 });
                break;
            default:
                a = newActor(kind, i, { mode: 'walk' });
        }
        if (entrance && !input().reduce) {
            if (['dog', 'baby', 'granny', 'lobby', 'gas', 'candle'].includes(kind)) {
                a.drop = 1;
                a.vy = 0;
            } else a.t = -0.0001; // pop-in via t
        }
        discover({ dog: 'dog-walk', baby: 'baby-crawl', gas: 'gas-puff', dish: 'wifi-zap', granny: 'granny-walk', factory: 'factory-belt', lobby: 'lobby-walk', portal: 'tm-portal', candle: 'rel-candles', rift: 'rift-open', dove: 'dove-flock', calendar: 'cal-rip' }[kind] as string);
    }

    function reconcile(entrance: boolean) {
        const st = input();
        KINDS.forEach((kind, i) => {
            const want = wanted(i, st.owned[i]);
            let have = count(kind);
            while (have < want) {
                spawnFor(i, entrance);
                have++;
            }
            if (have > want) {
                for (const a of actors) if (a.kind === kind && have > want && !a.gone) {
                    a.gone = true;
                    have--;
                }
            }
        });
    }

    /* ---------- store hendelser ---------- */
    function banner(txt: string, col: string) {
        bannerTxt = txt;
        bannerCol = col;
        bannerT = 2.2;
    }
    function runEvent() {
        const st = input();
        const opts: (() => void)[] = [];
        const own = st.owned;
        if (count('dog') >= 4) opts.push(() => {
            // Hunde-conga: alle hundene i rekke over gulvet
            const dogs = actors.filter((a) => a.kind === 'dog' && !a.gone);
            const dir = Math.random() < 0.5 ? 1 : -1;
            dogs.forEach((d, k) => {
                d.mode = 'conga';
                d.dir = dir;
                d.x = dir > 0 ? -40 - k * U * 1.1 : W + 40 + k * U * 1.1;
                d.y = laneY(0.5);
                d.timer = 0;
            });
            banner('HUNDE-CONGA!', '#e07a00');
            discover('dog-conga');
        });
        if (count('baby') >= 4) opts.push(() => {
            for (let k = 0; k < 14; k++)
                newActor('stampede', -1, { x: -30 - k * 26, y: laneY(Math.random()), vx: rnd(260, 360), mode: 'run', size: U * rnd(0.8, 1) });
            banner('STORMLØP!', '#d7262e');
            discover('baby-stampede');
        });
        if (st.tier(7) >= 2) opts.push(() => spawnDino());
        if (count('granny') >= 3 && st.tier(4) >= 3) opts.push(() => {
            const gs = actors.filter((a) => a.kind === 'granny' && !a.gone);
            const cx = W * rnd(0.25, 0.75);
            gs.forEach((g, k) => {
                g.mode = 'dance';
                g.timer = 6;
                g.tx = cx;
                g.data = (k / gs.length) * Math.PI * 2;
            });
            banner('BESTEMOR-DANS!', '#b23a8a');
            discover('granny-dance');
        });
        if (own[5] >= 3) opts.push(() => {
            const f = actors.find((a) => a.kind === 'factory');
            if (!f) return;
            shake = 14;
            confetti(W * 0.85, H * 0.25, 90, 1.5);
            for (let k = 0; k < 12; k++) part({ k: 'emo', txt: '📄', x: W * 0.85, y: H * 0.25, vx: rnd(-300, 100), vy: rnd(-300, -80), g: 500, life: 2, size: U * 0.7, rot: 0, vr: rnd(-6, 6) });
            banner('KABOOM!', '#ff6a00');
            discover('factory-boom');
        });
        if (st.upg.g1) opts.push(() => {
            for (let k = 0; k < 40; k++)
                part({ k: 'emo', txt: '📄', x: rnd(0, W), y: -20 - rnd(0, H * 0.6), vx: rnd(-30, 30), vy: rnd(60, 120), g: 30, life: 6, size: U * rnd(0.5, 0.8), rot: rnd(0, 6), vr: rnd(-2, 2), fade: true });
            discover('paper-rain');
        });
        if (st.upg.g3) opts.push(() => {
            shake = 18;
            banner('VETO!', '#1565c0');
            discover('veto-slam');
        });
        if (count('dove') >= 1) opts.push(() => {
            const dir = Math.random() < 0.5 ? 1 : -1;
            for (let k = 0; k < 12; k++)
                newActor('dove', -1, { x: dir > 0 ? -30 - k * 22 : W + 30 + k * 22, y: H * (0.12 + (k % 4) * 0.06), dir, mode: 'pass', size: U * 0.8 });
        });
        if (opts.length) pick(opts)();
    }
    function spawnDino() {
        const dir = Math.random() < 0.5 ? 1 : -1;
        newActor('dino', -1, { x: dir > 0 ? -80 : W + 80, y: laneY(0.7), dir, mode: 'run', size: U * 2.6 });
        shake = 8;
        banner('DINOSAUR!', '#3f8f5b');
        discover('tm-dino');
    }

    /* ---------- oppdatering ---------- */
    function sheetCenter(): [number, number] {
        const s = input().sheet();
        return s ? [s.x + s.w / 2, s.y + s.h / 2] : [W / 2, H / 2];
    }

    function updateActor(a: Actor, dt: number, st: SceneInput, speed: number) {
        a.t += dt;
        a.phase += dt;
        // Inngangen: figuren faller ned fra taket og lander med en støvsky
        if (a.drop > 0) {
            if (a.drop === 1) {
                a.data = a.y;
                a.y = -40;
                a.drop = 0.99;
            }
            a.vy += 1600 * dt;
            a.y += a.vy * dt;
            if (a.y >= (a.data ?? laneY(0.5))) {
                a.y = a.data ?? laneY(0.5);
                a.drop = 0;
                a.vy = 0;
                dust(a.x, a.y + a.size * 0.4, 10);
                shake = Math.max(shake, 2);
            }
            return;
        }
        // Læreren i rommet: de som kan gå, gjemmer seg ved veggene
        const hiding = st.teacher && ['dog', 'baby', 'granny', 'lobby'].includes(a.kind);
        if (hiding) {
            const edge = a.x < W / 2 ? -60 : W + 60;
            a.dir = edge > a.x ? 1 : -1;
            a.x += a.dir * 220 * dt;
            if (a.x < -50) a.x = -50;
            if (a.x > W + 50) a.x = W + 50;
            return;
        }
        if (st.sus && ['dog', 'baby', 'granny', 'lobby'].includes(a.kind)) speed *= 0.3;
        const tier = a.i >= 0 ? st.tier(a.i) : 0;
        const walk = (v: number) => {
            a.x += a.dir * v * speed * dt;
            if (a.x < W * 0.04) a.dir = 1;
            if (a.x > W * 0.96) a.dir = -1;
            if (a.x < -20 || a.x > W + 20) a.x = Math.max(-20, Math.min(W + 20, a.x));
        };
        switch (a.kind) {
            case 'dog': {
                if (a.mode === 'conga') {
                    a.x += a.dir * 170 * dt;
                    if (Math.random() < 0.06) part({ k: 'emo', txt: '🎵', x: a.x, y: a.y - a.size, vy: -60, life: 1, size: U * 0.5 });
                    if ((a.dir > 0 && a.x > W + 60) || (a.dir < 0 && a.x < -60)) {
                        a.mode = 'walk';
                        a.x = rnd(W * 0.1, W * 0.9);
                        a.y = laneY(Math.random());
                    }
                    break;
                }
                if (a.mode === 'chomp') {
                    const dx = a.tx - a.x;
                    a.dir = dx > 0 ? 1 : -1;
                    a.x += a.dir * Math.min(Math.abs(dx), 260 * speed * dt);
                    if (Math.abs(dx) < 6) {
                        a.mode = 'eat';
                        a.timer = 0.8;
                        const [, sy] = sheetCenter();
                        paper(a.x, Math.min(a.y - a.size * 0.5, sy + 40), 16);
                        text('CHOMP!', a.x, a.y - a.size * 1.2, '#d7262e', 22, 1);
                        shake = Math.max(shake, 3);
                        discover('dog-chomp');
                    }
                    break;
                }
                if (a.mode === 'eat') {
                    a.timer -= dt;
                    if (a.timer <= 0) a.mode = 'walk';
                    break;
                }
                if (a.mode === 'house') {
                    a.timer -= dt;
                    if (a.timer <= 0) {
                        a.mode = 'walk';
                        a.x = W * 0.07;
                        dust(a.x, a.y + a.size * 0.4, 6);
                    }
                    break;
                }
                walk(55 + tier * 12);
                if (tier >= 2 && Math.random() < dt * 4) paws.push({ x: a.x, y: a.y + a.size * 0.4, age: 0, r: a.dir });
                a.timer -= dt;
                if (a.timer <= 0) {
                    a.timer = rnd(5, 11);
                    if (tier >= 1 && Math.random() < 0.6) {
                        const [sx] = sheetCenter();
                        a.mode = 'chomp';
                        a.tx = sx + rnd(-40, 40);
                    } else if (tier >= 3 && Math.random() < 0.5) {
                        a.mode = 'house';
                        a.timer = rnd(1.5, 3);
                        dust(W * 0.07, a.y, 6);
                        discover('dog-house');
                    } else a.dir *= -1;
                }
                break;
            }
            case 'baby': {
                walk(26 + tier * 5);
                a.timer -= dt;
                if (a.timer <= 0) {
                    a.timer = rnd(3, 7);
                    const r = Math.random();
                    if (r < 0.55) {
                        // Tegn en krusedull på veggen
                        const cols = ['#e63946', '#1d77d1', '#2a9d3f', '#f4a100', '#9b5de5'];
                        const pts: [number, number][] = [];
                        let x = a.x;
                        let y = floorTop() - rnd(20, H * 0.2);
                        for (let k = 0; k < 14; k++) {
                            x += rnd(-14, 18);
                            y += rnd(-12, 12);
                            pts.push([x, y]);
                        }
                        scribbles.push({ pts, col: pick(cols), age: 0 });
                        if (scribbles.length > 40) scribbles.shift();
                        discover('baby-scribble');
                    } else if (tier >= 1 && r < 0.85) {
                        text(pick(['Det var ikke meg!', 'Hunden gjorde det!', 'Ikke jeg!', 'Bæsj!']), a.x, a.y - a.size * 1.1, '#1d77d1', 15, 1.6);
                        discover('baby-talk');
                    } else if (tier >= 3) {
                        part({ k: 'emo', txt: '📣', x: a.x + a.dir * 16, y: a.y - a.size * 0.4, life: 1.2, size: U * 0.8, fade: true });
                        text('PRESSEMELDING!', a.x, a.y - a.size * 1.4, '#d7262e', 17, 1.6);
                        discover('baby-pr');
                    }
                }
                break;
            }
            case 'gas': {
                a.timer -= dt * speed;
                if (a.timer <= 0) {
                    a.timer = rnd(0.5, 1.4) / (1 + tier * 0.4);
                    const big = 1 + tier * 0.35;
                    part({ k: 'circ', x: a.x + rnd(-8, 8), y: a.y - a.size * 0.5, vx: rnd(-15, 15), vy: rnd(-55, -30), life: rnd(1.5, 2.6), size: rnd(8, 14) * big, grow: 16 * big, col: `rgba(${Math.round(rnd(110, 160))},210,80,.35)` });
                    if (tier >= 2 && Math.random() < 0.04) {
                        greenFlash = 1;
                        text('BLÆÆRK', a.x, a.y - a.size * 1.5, '#3b8f2a', 26, 1.2);
                        discover('gas-wave');
                    }
                    if (tier >= 3 && Math.random() < 0.015) {
                        banner('MANDAG', '#3b8f2a');
                        discover('gas-monday');
                    }
                }
                break;
            }
            case 'dish': {
                a.timer -= dt * speed;
                if (a.timer <= 0) {
                    a.timer = rnd(0.8, 2.4) / (1 + tier * 0.5);
                    a.mode = 'zap';
                    a.data = 0.25;
                    a.tx = a.x + rnd(-W * 0.25, W * 0.25);
                    a.ty = a.y + rnd(40, H * 0.35);
                    if (Math.random() < 0.3) part({ k: 'emo', txt: '📶', x: a.tx, y: a.ty, vy: -30, life: 0.9, size: U * 0.7 });
                    if (tier >= 3 && Math.random() < 0.1) {
                        warm = -1;
                        discover('wifi-aurora');
                    }
                }
                if (a.data && a.data > 0) a.data -= dt;
                if (tier >= 2) discover('wifi-hamster');
                break;
            }
            case 'granny': {
                if (a.mode === 'dance') {
                    a.timer -= dt;
                    a.data = (a.data ?? 0) + dt * 2.2;
                    a.x += (a.tx + Math.cos(a.data) * U * 2 - a.x) * Math.min(1, dt * 6);
                    a.y += (laneY(0.5) + Math.sin(a.data) * U * 0.6 - a.y) * Math.min(1, dt * 6);
                    if (Math.random() < 0.08) part({ k: 'emo', txt: pick(['🎵', '🎶', '💃']), x: a.x, y: a.y - a.size, vy: -50, life: 1.2, size: U * 0.55 });
                    if (a.timer <= 0) a.mode = 'walk';
                    break;
                }
                walk(20);
                a.timer -= dt;
                if (a.timer <= 0) {
                    a.timer = rnd(4, 8);
                    part({ k: 'emo', txt: '🎶', x: a.x, y: a.y - a.size, vy: -40, life: 1.4, size: U * 0.6 });
                    if (tier >= 1 && Math.random() < 0.6) {
                        confetti(a.x, a.y - a.size, 26);
                        text('Hurra!', a.x, a.y - a.size * 1.4, '#b23a8a', 18, 1.2);
                        discover('granny-party');
                    }
                    if (tier >= 2 && Math.random() < 0.6) {
                        for (let k = 0; k < 3; k++) part({ k: 'emo', txt: '🎈', x: a.x + rnd(-20, 20), y: a.y - a.size, vx: rnd(-15, 15), vy: rnd(-70, -45), life: 5, size: U * rnd(0.7, 1), fade: true });
                        discover('granny-balloons');
                    }
                }
                break;
            }
            case 'factory': {
                a.timer -= dt * speed;
                const n = st.owned[5];
                if (a.timer <= 0) {
                    a.timer = Math.max(0.35, 1.8 - tier * 0.3 - Math.log10(n + 1) * 0.3);
                    // Nytt ark på samlebåndet
                    newActor('belt', -1, { x: -20, y: H * 0.955, vx: 70 + tier * 25, mode: 'belt', size: U * 0.7 });
                    // Røyk fra pipa
                    part({ k: 'circ', x: W * 0.9, y: H * 0.08, vx: rnd(-10, 10), vy: rnd(-30, -15), life: 3, size: 10, grow: 14, col: 'rgba(120,120,130,.35)' });
                }
                if (tier >= 3) discover('factory-night');
                break;
            }
            case 'belt': {
                a.x += a.vx * speed * dt;
                if (a.mode === 'belt' && Math.abs(a.x - W * 0.62) < 4 && input().tier(5) >= 1) {
                    a.mode = 'stamped';
                    text('UNNSKYLDT!', a.x, a.y - U * 1.2, '#d7262e', 14, 0.8);
                    discover('factory-stamp');
                }
                if (a.x > W + 30) a.gone = true;
                break;
            }
            case 'lobby': {
                walk(40);
                a.timer -= dt;
                if (tier >= 1 && Math.random() < dt * 0.8) {
                    part({ k: 'emo', txt: '💸', x: a.x, y: a.y - a.size * 0.6, vx: rnd(-20, 20), vy: rnd(-80, -40), g: 60, life: 1.8, size: U * 0.55, rot: rnd(-0.4, 0.4), vr: rnd(-2, 2) });
                    discover('lobby-money');
                }
                if (a.timer <= 0) {
                    a.timer = rnd(4, 9);
                    if (tier >= 2) {
                        const other = actors.find((b) => b !== a && b.kind === 'lobby' && Math.abs(b.x - a.x) < U * 3);
                        if (other) {
                            part({ k: 'emo', txt: '🤝', x: (a.x + other.x) / 2, y: a.y - a.size, vy: -30, life: 1.4, size: U });
                            discover('lobby-shake');
                        }
                    }
                    if (tier >= 3) text('Retten til å glemme!', a.x, a.y - a.size * 1.3, '#23252c', 15, 1.6);
                }
                break;
            }
            case 'portal': {
                a.timer -= dt * speed;
                if (a.timer <= 0) {
                    a.timer = rnd(1.2, 3) / (1 + tier * 0.3);
                    const e = pick(['🕰️', '⏰', '📜', '🦕', '⌛', '🗿']);
                    const ang = rnd(0, Math.PI * 2);
                    part({ k: 'emo', txt: e, x: a.x, y: a.y, vx: Math.cos(ang) * rnd(60, 160), vy: Math.sin(ang) * rnd(60, 160), g: 120, life: 2, size: U * 0.8, rot: 0, vr: rnd(-5, 5) });
                }
                if (tier >= 2) {
                    tmDinoT -= dt;
                    if (tmDinoT <= 0) {
                        tmDinoT = rnd(40, 80);
                        spawnDino();
                    }
                }
                if (tier >= 3 && Math.random() < dt * 0.04) {
                    warm = 1;
                    part({ k: 'emo', txt: '☀️', x: W * 0.15, y: H * 0.15, life: 3, size: U * 2, fade: true });
                    part({ k: 'emo', txt: '🏖️', x: W * 0.8, y: laneY(0.4), life: 3, size: U * 1.6, fade: true });
                    discover('tm-summer');
                }
                break;
            }
            case 'candle': {
                if (Math.random() < dt * 0.5) part({ k: 'emo', txt: pick(['🎵', '🎶']), x: a.x, y: a.y - a.size, vx: rnd(-10, 10), vy: -35, life: 1.6, size: U * 0.45 });
                if (tier >= 1) discover('rel-rays');
                if (tier >= 2 && Math.random() < dt * 0.06 && count('pilgrim') < 6) {
                    for (let k = 0; k < 4; k++) newActor('pilgrim', -1, { x: -30 - k * 30, y: laneY(0.3), dir: 1, mode: 'walk', size: U * 0.9 });
                    discover('rel-pilgrims');
                }
                break;
            }
            case 'pilgrim': {
                a.x += 45 * speed * dt;
                if (a.x > W + 40) a.gone = true;
                break;
            }
            case 'rift': {
                a.timer -= dt * speed;
                if (a.timer <= 0) {
                    a.timer = rnd(4, 9) / (1 + tier * 0.3);
                    a.mode = 'open';
                    a.data = 2.2;
                    // Noe kjent kommer ut, i feil farge
                    const src = actors.filter((b) => ['dog', 'baby', 'granny', 'lobby'].includes(b.kind) && !b.gone);
                    const e = src.length ? emojiFor(pick(src)) : pick(['🐕', '👶', '👵']);
                    const m = newActor('mirror', -1, { x: a.x, y: laneY(Math.random()), dir: Math.random() < 0.5 ? 1 : -1, mode: 'walk', size: U, hue: rnd(90, 270), timer: rnd(6, 10) });
                    m.data = e.codePointAt(0) ?? 0;
                    discover('rift-copy');
                }
                if (a.data && a.data > 0) a.data -= dt;
                break;
            }
            case 'mirror': {
                walk(60);
                a.timer -= dt;
                if (a.timer <= 0) a.gone = true;
                break;
            }
            case 'dove': {
                if (a.mode === 'pass') {
                    a.x += a.dir * 160 * dt;
                    a.y += Math.sin(a.phase * 3) * 20 * dt;
                    if (a.x < -60 || a.x > W + 60) a.gone = true;
                    break;
                }
                a.x += a.dir * (70 + tier * 10) * speed * dt;
                a.y += Math.sin(a.phase * 2) * 18 * dt;
                if (a.x < -50) a.dir = 1;
                if (a.x > W + 50) a.dir = -1;
                if (tier >= 2 && Math.random() < dt * 0.15) {
                    part({ k: 'emo', txt: '🏳️', x: rnd(W * 0.1, W * 0.9), y: laneY(rnd(0, 0.4)) - U, life: 2.5, size: U, fade: true });
                    discover('dove-flags');
                }
                break;
            }
            case 'calendar': {
                a.timer -= dt * speed;
                if (a.timer <= 0) {
                    a.timer = rnd(1.5, 4) / (1 + tier * 0.4);
                    part({ k: 'text', txt: 'TIRSDAG', x: a.x, y: a.y, vx: rnd(-160, -40), vy: rnd(-120, -40), g: 260, life: 2.4, size: 13, rot: 0, vr: rnd(-6, 6), col: '#d7262e', fade: true });
                }
                if (tier >= 3) {
                    wobble = Math.max(wobble, 0.35);
                    discover('cal-wobble');
                }
                break;
            }
            case 'stampede': {
                a.x += a.vx * dt;
                if (Math.random() < dt * 10) dust(a.x - 10, a.y + a.size * 0.4, 1);
                if (a.x > W + 60) a.gone = true;
                break;
            }
            case 'dino': {
                a.x += a.dir * 300 * dt;
                if (Math.random() < dt * 14) dust(a.x - a.dir * a.size * 0.4, a.y + a.size * 0.4, 2);
                if (Math.floor(a.t * 3) !== Math.floor((a.t - dt) * 3)) shake = Math.max(shake, 5);
                if (a.x < -120 || a.x > W + 120) a.gone = true;
                break;
            }
            case 'teacher': {
                const target = W * 0.2;
                if (a.mode === 'in') {
                    a.x += (target - a.x) * Math.min(1, dt * 3);
                } else {
                    a.x -= 260 * dt;
                    if (a.x < -80) a.gone = true;
                }
                break;
            }
        }
    }

    function emojiFor(a: Actor): string {
        switch (a.kind) {
            case 'dog':
                return '🐕';
            case 'baby':
                return '👶';
            case 'gas':
                return '🤢';
            case 'dish':
                return '📡';
            case 'granny':
                return '👵';
            case 'lobby':
                return '🕴️';
            case 'candle':
                return '🕯️';
            case 'dove':
                return '🕊️';
            case 'pilgrim':
                return '🚶';
            case 'stampede':
                return '👶';
            case 'dino':
                return '🦖';
            case 'teacher':
                return '👩‍🏫';
            case 'belt':
                return '📄';
            case 'mirror':
                return String.fromCodePoint(a.data ?? 0x1f415);
            default:
                return '❓';
        }
    }

    /* ---------- tegning ---------- */
    function drawActor(a: Actor, st: SceneInput) {
        if (a.gone && a.kind !== 'mirror') return;
        const d = a.kind === 'dove' || a.kind === 'dish' || a.kind === 'portal' || a.kind === 'rift' || a.kind === 'calendar' || a.kind === 'factory' || a.kind === 'belt' ? 1 : depth(a.y);
        const size = a.size * d;
        const pop = a.t < 0.35 ? Math.min(1, a.t / 0.35) * 1.2 - Math.max(0, a.t / 0.35 - 0.8) : 1;
        const tier = a.i >= 0 ? st.tier(a.i) : 0;
        const jump = (st.flow > 0.85 || st.frenzy || cheerT > 0) && ['dog', 'baby', 'granny', 'lobby', 'mirror'].includes(a.kind) ? Math.abs(Math.sin(a.phase * 9)) * U * 0.5 : 0;
        const bob = ['dog', 'baby', 'granny', 'lobby', 'pilgrim', 'mirror', 'stampede'].includes(a.kind) ? Math.abs(Math.sin(a.phase * (a.kind === 'baby' ? 6 : 10))) * 3 : 0;
        const y = a.y - bob - jump;
        switch (a.kind) {
            case 'factory': {
                // Samlebånd langs gulvet + fabrikk i hjørnet
                const by = H * 0.955;
                ctx.fillStyle = '#3b3f4a';
                ctx.fillRect(0, by + U * 0.25, W, U * 0.35);
                ctx.fillStyle = '#5b6070';
                for (let x = -((time * (70 + tier * 25)) % 24); x < W; x += 24) {
                    ctx.beginPath();
                    ctx.arc(x, by + U * 0.42, U * 0.13, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (tier >= 1) {
                    // stempelpresse
                    const px = W * 0.62;
                    const press = Math.max(0, Math.sin(time * 4)) ** 8;
                    ctx.fillStyle = '#7a7f8c';
                    ctx.fillRect(px - 4, by - U * 2, 8, U * 1.2 + press * U * 0.6);
                    ctx.fillStyle = '#d7262e';
                    ctx.fillRect(px - U * 0.5, by - U * 0.8 + press * U * 0.6, U, U * 0.3);
                }
                emo('🏭', W * 0.9, H * 0.14, U * 2 * pop);
                if (tier >= 2) {
                    emo('👷', W * 0.55, by - U * 0.1, U * 0.9, { flip: true });
                    emo('👷', W * 0.75, by - U * 0.1, U * 0.9);
                }
                if (tier >= 3 && Math.sin(time * 6) > 0.6) {
                    ctx.fillStyle = 'rgba(255,200,0,.12)';
                    ctx.fillRect(0, 0, W, H);
                }
                return;
            }
            case 'portal': {
                const r = U * (1.6 + tier * 0.25) * pop;
                ctx.save();
                ctx.translate(a.x, a.y);
                for (let k = 0; k < 6; k++) {
                    ctx.rotate(time * (1.2 + k * 0.3));
                    ctx.strokeStyle = `hsla(${(time * 60 + k * 40) % 360},90%,60%,${0.7 - k * 0.09})`;
                    ctx.lineWidth = 4;
                    ctx.setLineDash([r * 0.5, r * 0.2]);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, r - k * r * 0.13, (r - k * r * 0.13) * 0.8, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.6);
                rg.addColorStop(0, 'rgba(255,255,255,.9)');
                rg.addColorStop(1, 'rgba(120,80,255,0)');
                ctx.fillStyle = rg;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return;
            }
            case 'rift': {
                const open = a.data && a.data > 0 ? Math.min(1, a.data, 2.2 - a.data + 0.2) : 0.12;
                ctx.save();
                ctx.translate(a.x, a.y);
                ctx.shadowColor = '#c77dff';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#1a0033';
                ctx.strokeStyle = '#e0aaff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 0, Math.max(1, U * 0.9 * open + 3), U * 1.8, Math.sin(time) * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                return;
            }
            case 'calendar': {
                ctx.save();
                ctx.translate(a.x, a.y);
                ctx.rotate(0.06);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-U * 0.9, -U * 0.8, U * 1.8, U * 1.9);
                ctx.fillStyle = '#d7262e';
                ctx.fillRect(-U * 0.9, -U * 0.8, U * 1.8, U * 0.5);
                ctx.fillStyle = '#23252c';
                ctx.font = `800 ${U * 0.36}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('TIRS', 0, -U * 0.55);
                ctx.font = `800 ${U * 0.8}px Inter, sans-serif`;
                ctx.fillText(String(1 + (Math.floor(time / 2) % 28)), 0, U * 0.35);
                ctx.restore();
                return;
            }
            case 'dish': {
                emo('📡', a.x, a.y, size * pop);
                if (a.data && a.data > 0) {
                    ctx.strokeStyle = '#fff36a';
                    ctx.shadowColor = '#ffe14a';
                    ctx.shadowBlur = 12;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    const n = 7;
                    for (let k = 1; k <= n; k++) {
                        const f = k / n;
                        ctx.lineTo(a.x + (a.tx - a.x) * f + (k < n ? rnd(-14, 14) : 0), a.y + (a.ty - a.y) * f + (k < n ? rnd(-14, 14) : 0));
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
                if (tier >= 2) {
                    // hamsterhjul
                    const hx = a.x + U * 1.3;
                    const hy = a.y + U * 0.3;
                    ctx.strokeStyle = '#8a8f99';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(hx, hy, U * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                    for (let k = 0; k < 6; k++) {
                        const ang = time * 6 + (k * Math.PI) / 3;
                        ctx.beginPath();
                        ctx.moveTo(hx, hy);
                        ctx.lineTo(hx + Math.cos(ang) * U * 0.6, hy + Math.sin(ang) * U * 0.6);
                        ctx.stroke();
                    }
                    emo('🐹', hx, hy + U * 0.3, U * 0.6, { sy: 1 + Math.sin(time * 18) * 0.08 });
                }
                return;
            }
            case 'candle': {
                const fl = 1 + Math.sin(time * 13 + a.phase) * 0.08;
                const rg = ctx.createRadialGradient(a.x, a.y - size * 0.4, 0, a.x, a.y - size * 0.4, size * 1.6 * fl);
                rg.addColorStop(0, 'rgba(255,210,90,.45)');
                rg.addColorStop(1, 'rgba(255,210,90,0)');
                ctx.fillStyle = rg;
                ctx.fillRect(a.x - size * 2, a.y - size * 2, size * 4, size * 4);
                emo('🕯️', a.x, a.y, size * pop, { sy: fl });
                if (tier >= 3 && a === actors.find((b) => b.kind === 'candle')) {
                    const px = W * 0.5 + Math.sin(time * 0.6) * W * 0.3;
                    const py = H * 0.3 + Math.sin(time * 1.3) * 12;
                    ctx.strokeStyle = 'rgba(255,230,120,.8)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(px, py - U * 0.75, U * 0.45, U * 0.14, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    emo('🧙', px, py, U * 1.2);
                }
                return;
            }
            case 'teacher': {
                emo('👩‍🏫', a.x, a.y - U * 0.4, U * 2.1, { flip: a.mode === 'in' });
                if (a.mode === 'in' && Math.floor(time * 2) % 2 === 0) {
                    ctx.fillStyle = '#fff';
                    ctx.strokeStyle = '#23252c';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(a.x + U * 0.6, a.y - U * 2.6, U * 1.4, U * 0.8, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#d7262e';
                    ctx.font = `800 ${U * 0.5}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?!', a.x + U * 1.3, a.y - U * 2.2);
                }
                return;
            }
        }
        // vanlige figurer
        if (a.kind === 'dove') {
            emo('🕊️', a.x, a.y, size * pop, { flip: a.dir > 0, sy: 0.75 + Math.abs(Math.sin(a.phase * 12)) * 0.35 });
            return;
        }
        // skygge (ikke mens figuren faller inn)
        ctx.fillStyle = a.drop > 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,.14)';
        ctx.beginPath();
        ctx.ellipse(a.x, a.y + size * 0.45, size * 0.38, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        const e = emojiFor(a);
        if (a.kind === 'mirror') {
            ctx.save();
            ctx.filter = `hue-rotate(${a.hue ?? 180}deg) saturate(2)`;
            emo(e, a.x, y, size, { flip: a.dir > 0, alpha: Math.min(1, a.timer) });
            ctx.restore();
            return;
        }
        const chew = a.mode === 'eat' ? 1 + Math.sin(a.phase * 30) * 0.12 : 1;
        emo(e, a.x, y, size * pop * (a.kind === 'dog' ? 1 + tier * 0.08 : 1), { flip: a.dir > 0, sx: chew, sy: 2 - chew });
        if (a.kind === 'granny') emo('🎂', a.x - a.dir * size * 0.45, y - size * 0.05, size * 0.55);
        if (a.kind === 'lobby') emo('💼', a.x + a.dir * size * 0.4, y + size * 0.2, size * 0.45);
        if (tier >= 4 && ['dog', 'baby', 'granny', 'lobby'].includes(a.kind)) {
            emo('👑', a.x, y - size * 0.62, size * 0.5, { rot: Math.sin(a.phase * 4) * 0.15 });
            if (a.kind === 'dog') discover('dog-crown');
        }
        if (a.kind === 'baby' && tier >= 2 && Math.floor(a.phase * 0.5) % 4 === 0) emo('🖍️', a.x + a.dir * size * 0.45, y, size * 0.45);
    }

    function drawPart(p: Part) {
        const t = p.life / p.max;
        ctx.globalAlpha = p.fade ? Math.min(1, t * 2.5) : 1;
        if (p.k === 'emo') emo(p.txt, p.x, p.y, p.size, { rot: p.rot });
        else if (p.k === 'circ') {
            ctx.fillStyle = p.col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + p.grow * (1 - t), 0, Math.PI * 2);
            ctx.fill();
        } else if (p.k === 'rect') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.col;
            ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
            ctx.restore();
        } else if (p.k === 'text') {
            const age = 1 - t;
            const sc = age < 0.12 ? 0.5 + (age / 0.12) * 0.6 : 1;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.scale(sc, sc);
            ctx.font = `${p.size}px "Permanent Marker", cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(255,255,255,.95)';
            ctx.strokeText(p.txt, 0, 0);
            ctx.fillStyle = p.col;
            ctx.fillText(p.txt, 0, 0);
            ctx.restore();
        } else if (p.k === 'ring') {
            ctx.strokeStyle = p.col;
            ctx.lineWidth = 4 * t;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    function drawAmbient(st: SceneInput) {
        const ft = floorTop();
        if (st.era === 0) {
            // klokke som tikker
            const cx = W * 0.565;
            const cy = ft * 0.12 + 10;
            const r = Math.max(12, H * 0.035);
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#23252c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx + W * 0.13, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const sec = Math.floor(time);
            for (const [len, ang, w] of [[0.8, (sec / 60) * Math.PI * 2, 1.5], [0.55, (time / 3600) * Math.PI * 2 + 2, 3]] as const) {
                ctx.lineWidth = w;
                ctx.beginPath();
                ctx.moveTo(cx + W * 0.13, cy);
                ctx.lineTo(cx + W * 0.13 + Math.sin(ang) * r * len, cy - Math.cos(ang) * r * len);
                ctx.stroke();
            }
            // skyer i vinduet
            ctx.save();
            ctx.beginPath();
            ctx.rect(W * 0.74, ft * 0.14, W * 0.22, ft * 0.39);
            ctx.clip();
            for (let k = 0; k < 3; k++) {
                const x = W * 0.74 + ((time * (8 + k * 4) + k * 90) % (W * 0.32)) - W * 0.05;
                emo('☁️', x, ft * (0.2 + k * 0.08), U * (0.9 + k * 0.2));
            }
            ctx.restore();
        } else if (st.era === 2) {
            // bannerne blafrer litt
            ctx.fillStyle = 'rgba(255,255,255,.08)';
            for (const bx of [W * 0.12, W * 0.82]) ctx.fillRect(bx + Math.sin(time * 2) * 2, ft * 0.08, W * 0.06, ft * 0.5);
        } else if (st.era === 3) {
            // lysekrone som glitrer
            const cx = W * 0.5;
            ctx.strokeStyle = '#b8902a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, ft * 0.06);
            ctx.stroke();
            for (let k = 0; k < 9; k++) {
                const x = cx + (k - 4) * U * 0.45;
                const y = ft * 0.08 + Math.abs(k - 4) * -2;
                ctx.fillStyle = `rgba(255,240,180,${0.5 + 0.5 * Math.sin(time * 5 + k)})`;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (st.era === 5) {
            for (let k = 0; k < 30; k++) {
                const a = 0.5 + 0.5 * Math.sin(time * (1 + (k % 5)) + k);
                ctx.fillStyle = `rgba(255,255,255,${a})`;
                ctx.fillRect((k * 7333) % W, (k * 3571) % (H * 0.7), 2, 2);
            }
            // galakse som snurrer
            ctx.save();
            ctx.translate(W * 0.18, H * 0.2);
            ctx.rotate(time * 0.15);
            for (let k = 0; k < 120; k++) {
                const ang = k * 0.3;
                const r = k * 0.45;
                ctx.fillStyle = `hsla(${200 + k},80%,75%,${1 - k / 130})`;
                ctx.fillRect(Math.cos(ang) * r, Math.sin(ang) * r * 0.5, 2, 2);
                ctx.fillRect(-Math.cos(ang) * r, -Math.sin(ang) * r * 0.5, 2, 2);
            }
            ctx.restore();
            if (!shooting && Math.random() < 0.006) shooting = { x: rnd(0, W), y: rnd(0, H * 0.3), vx: rnd(300, 500), vy: rnd(80, 180), life: 1 };
            if (shooting) {
                ctx.strokeStyle = `rgba(255,255,255,${shooting.life})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(shooting.x, shooting.y);
                ctx.lineTo(shooting.x - shooting.vx * 0.12, shooting.y - shooting.vy * 0.12);
                ctx.stroke();
            }
        }
    }

    let cheerT = 0;
    function update(dt: number) {
        const st = input();
        if (!W || !H) return;
        time += dt;
        const speed = st.frenzy ? 2.4 : st.storm ? 1.6 : 1;
        if (st.era !== lastEra) {
            if (lastEra >= 0 && st.era > lastEra) discover(['', 'era-rektor', 'era-kommune', 'era-stortinget', 'era-fn', 'era-univers'][st.era]);
            lastEra = st.era;
        }
        reconcileT -= dt;
        if (reconcileT <= 0) {
            reconcileT = 0.5;
            reconcile(true);
        }
        if (!st.reduce && !st.teacher) {
            eventT -= dt;
            if (eventT <= 0) {
                eventT = rnd(16, 32);
                runEvent();
            }
        }
        // Læreren går inn og ut
        if (st.teacher && !teacherActor) {
            teacherActor = newActor('teacher', -1, { x: -80, y: laneY(0.6), mode: 'in', size: U * 2 });
            discover('teacher-walk');
        } else if (!st.teacher && teacherActor) {
            teacherActor.mode = 'out';
            if (teacherActor.gone) teacherActor = null;
        }
        if (teacherActor?.gone) teacherActor = null;
        if (st.flow > 0.85) {
            flowCheerT += dt;
            if (flowCheerT > 1.5) discover('flow-cheer');
        } else flowCheerT = 0;
        if (st.frenzy) {
            disco += dt;
            if (disco > 0.5) discover('frenzy-disco');
        } else disco = 0;
        if (cheerT > 0) cheerT -= dt;
        // Abonnementet trekker penger
        if (st.upg.g2 && Math.random() < dt * 0.05 && !st.reduce) {
            part({ k: 'emo', txt: '💳', x: rnd(W * 0.2, W * 0.8), y: H * 0.15, vy: -20, life: 1.6, size: U * 0.9 });
            text('Ka-tsjing! 49 kr', W * 0.5 + rnd(-W * 0.3, W * 0.3), H * 0.2, '#2a7a32', 16, 1.6);
            discover('sub-ding');
        }

        for (const a of actors) updateActor(a, dt, st, speed);
        actors = actors.filter((a) => !a.gone || (a.kind === 'teacher' && a.mode === 'out' && a.x > -80));
        for (const p of parts) {
            p.life -= dt;
            p.vy += p.g * dt;
            if (p.drag) {
                p.vx *= 1 - p.drag * dt;
                p.vy *= 1 - p.drag * 0.3 * dt;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
        }
        parts = parts.filter((p) => p.life > 0);
        for (const s of scribbles) s.age += dt;
        while (scribbles.length && scribbles[0].age > 40) scribbles.shift();
        for (const p of paws) p.age += dt;
        while (paws.length && (paws[0].age > 6 || paws.length > 120)) paws.shift();
        if (shooting) {
            shooting.x += shooting.vx * dt;
            shooting.y += shooting.vy * dt;
            shooting.life -= dt * 1.2;
            if (shooting.life <= 0) shooting = null;
        }
        greenFlash = Math.max(0, greenFlash - dt * 0.8);
        warm = warm > 0 ? Math.max(0, warm - dt * 0.3) : Math.min(0, warm + dt * 0.25);
        wobble = Math.max(0, wobble - dt * 0.1);
        bannerT = Math.max(0, bannerT - dt);
        shake *= Math.pow(0.02, dt);
        if (shake < 0.2) shake = 0;

        draw(st);
    }

    function draw(st: SceneInput) {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (shake && !st.reduce) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
        if (wobble && !st.reduce) {
            ctx.translate(W / 2, H / 2);
            ctx.rotate(Math.sin(time * 1.3) * 0.012 * wobble * 3);
            ctx.translate(-W / 2, -H / 2);
        }
        ctx.drawImage(roomFor(st.era), 0, 0, W, H);
        drawAmbient(st);
        // krusedullene til lillebror
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const s of scribbles) {
            ctx.globalAlpha = Math.min(1, (40 - s.age) / 8) * 0.85;
            ctx.strokeStyle = s.col;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const n = Math.min(s.pts.length, Math.floor(s.age * 30) + 1);
            s.pts.slice(0, n).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // lys fra himmelen
        if (st.tier(8) >= 1 && st.owned[8] > 0) {
            const s = st.sheet();
            const cx = s ? s.x + s.w / 2 : W / 2;
            const a = 0.1 + 0.05 * Math.sin(time * 1.5);
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, `rgba(255,240,170,${a * 2})`);
            grad.addColorStop(1, 'rgba(255,240,170,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx - U, 0);
            ctx.lineTo(cx + U, 0);
            ctx.lineTo(cx + U * 4, H);
            ctx.lineTo(cx - U * 4, H);
            ctx.fill();
        }
        // poteavtrykk
        for (const p of paws) {
            ctx.fillStyle = `rgba(90,60,30,${0.35 * (1 - p.age / 6)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        if (st.tier(0) >= 3 && st.owned[0] > 0) emo('🏠', W * 0.07, laneY(0.35) - U * 0.4, U * 1.8);

        const sorted = [...actors].sort((a, b) => a.y - b.y);
        for (const a of sorted) drawActor(a, st);
        for (const p of parts) drawPart(p);

        // overlegg: grønn bølge, nordlys, sommer, disko
        if (greenFlash > 0) {
            ctx.fillStyle = `rgba(120,200,60,${greenFlash * 0.35})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (warm > 0) {
            ctx.fillStyle = `rgba(255,170,60,${warm * 0.25})`;
            ctx.fillRect(0, 0, W, H);
        } else if (warm < 0) {
            for (let k = 0; k < 3; k++) {
                ctx.fillStyle = `rgba(${k === 1 ? '180,80,255' : '60,255,160'},${-warm * 0.18})`;
                ctx.beginPath();
                ctx.moveTo(0, H * 0.1);
                for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (0.12 + k * 0.06) + Math.sin(x * 0.01 + time * 2 + k) * 20);
                ctx.lineTo(W, 0);
                ctx.lineTo(0, 0);
                ctx.fill();
            }
        }
        if (st.frenzy && !st.reduce) {
            for (let k = 0; k < 4; k++) {
                const ang = time * 2 + (k * Math.PI) / 2;
                const grad = ctx.createRadialGradient(W / 2 + Math.cos(ang) * W * 0.3, H * 0.4 + Math.sin(ang) * H * 0.2, 0, W / 2 + Math.cos(ang) * W * 0.3, H * 0.4 + Math.sin(ang) * H * 0.2, W * 0.25);
                grad.addColorStop(0, `hsla(${(time * 120 + k * 90) % 360},100%,60%,.22)`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
            }
        }
        if (st.storm && Math.random() < 0.05 && !st.reduce) {
            ctx.fillStyle = 'rgba(255,255,255,.35)';
            ctx.fillRect(0, 0, W, H);
        }
        if (bannerT > 0) {
            const age = 2.2 - bannerT;
            const sc = age < 0.2 ? 3 - age * 10 : 1;
            ctx.save();
            ctx.globalAlpha = Math.min(1, bannerT * 2);
            ctx.translate(W / 2, H * 0.62);
            ctx.rotate(-0.08);
            ctx.scale(sc, sc);
            ctx.font = `${Math.min(W * 0.1, 64)}px "Permanent Marker", cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#fff';
            ctx.strokeText(bannerTxt, 0, 0);
            ctx.fillStyle = bannerCol;
            ctx.fillText(bannerTxt, 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    function resize() {
        const r = canvas.getBoundingClientRect();
        DPR = Math.min(1.5, window.devicePixelRatio || 1);
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        U = Math.max(20, Math.min(40, H / 17));
        sprites.clear();
        roomCache.clear();
        // Figurene beholder plassen sin relativt til rommet
        for (const a of actors) {
            a.x = Math.min(a.x, W - 10);
            if (['dog', 'baby', 'granny', 'lobby', 'gas', 'candle'].includes(a.kind)) a.y = laneY(Math.random());
            a.size = a.kind === 'calendar' ? U * 2 : a.kind === 'gas' ? U * 1.2 : U;
        }
    }

    return {
        update,
        resize,
        onBuy(i, k) {
            const st = input();
            // Kjøpte du mange på en gang, kommer de som en hel klynge
            const extra = Math.min(3, Math.floor(Math.log10(k + 1) * 2));
            if (wanted(i, st.owned[i]) <= count(KINDS[i]) && !st.reduce) {
                for (let n = 0; n < 1 + extra; n++) {
                    const x = rnd(W * 0.1, W * 0.9);
                    part({ k: 'emo', txt: emojiFor({ kind: KINDS[i] } as Actor), x, y: -20, vy: rnd(200, 300), g: 900, life: 0.9, size: U, fade: true });
                }
            }
            reconcile(true);
        },
        onUpgrade(id) {
            const m = /^p(\d+)_(\d)$/.exec(id);
            if (m) {
                const i = +m[1];
                // Alle figurene av denne typen jubler og glitrer
                for (const a of actors)
                    if (a.i === i && !a.gone) {
                        for (let k = 0; k < 10; k++) {
                            const ang = rnd(0, Math.PI * 2);
                            part({ k: 'emo', txt: '✨', x: a.x, y: a.y - a.size * 0.5, vx: Math.cos(ang) * 120, vy: Math.sin(ang) * 120 - 60, g: 200, life: 0.9, size: U * 0.5 });
                        }
                        part({ k: 'ring', x: a.x, y: a.y, life: 0.6, size: U * 2.5, col: '#f2b705' });
                        a.timer = Math.min(a.timer, 0.4); // vis den nye oppførselen med en gang
                    }
                if (i === 7 && +m[2] >= 1) tmDinoT = Math.min(tmDinoT, 3);
                text('NIVÅ OPP!', W / 2, H * 0.55, '#e09a00', 30, 1.4);
            } else {
                confetti(W / 2, H * 0.6, 40);
                if (id === 'g1') eventT = Math.min(eventT, 1);
                if (id === 'g3') {
                    eventT = 0.5;
                }
            }
            shake = Math.max(shake, 5);
        },
        onClick(x, y) {
            const st = input();
            if (st.reduce) return;
            // Klikk-oppgraderingene gir klikket sin egen effekt
            if (st.upg.c1 && Math.random() < 0.3) part({ k: 'emo', txt: '✏️', x, y, vx: rnd(-150, 150), vy: rnd(-300, -150), g: 900, life: 0.8, size: U * 0.6, rot: rnd(0, 6), vr: rnd(-12, 12) });
            if (st.upg.c3 && Math.random() < 0.4) {
                for (let k = 0; k < 6; k++) part({ k: 'circ', x, y, vx: rnd(-200, 200), vy: rnd(-200, 100), g: 500, life: rnd(0.4, 0.8), size: rnd(2, 5), col: '#1f43b5' });
            }
            if (st.upg.c4 && Math.random() < 0.15) part({ k: 'emo', txt: '🎭', x, y: y - 20, vy: -120, life: 1, size: U * 0.8, vr: rnd(-3, 3) });
            if (st.upg.c5 && Math.random() < 0.12) part({ k: 'emo', txt: '🎓', x, y, vx: rnd(-80, 80), vy: -400, g: 700, life: 1.2, size: U * 0.8, vr: rnd(-8, 8) });
            if (st.upg.c6 && Math.random() < 0.5) for (let k = 0; k < 4; k++) part({ k: 'emo', txt: '✨', x: x + rnd(-30, 30), y: y + rnd(-30, 30), vy: -30, life: 0.6, size: U * 0.4 });
            if (st.upg.c7 && Math.random() < 0.15) shooting = { x, y, vx: rnd(-500, 500), vy: rnd(-300, -100), life: 1 };
            // Hundene kan ikke la være å se når du klikker fort
            if (st.flow > 0.85 && Math.random() < 0.1) cheerT = 1;
        },
        onEra() {
            shake = 12;
            confetti(W / 2, H * 0.4, 120, 1.6);
        },
        onGold() {
            confetti(W / 2, H * 0.35, 60);
            cheerT = 2;
        },
        onQuiz(right) {
            if (right) {
                cheerT = 3;
                confetti(W * 0.3, H * 0.5, 50);
                confetti(W * 0.7, H * 0.5, 50);
                discover('quiz-party');
            }
        },
        toLocal(cx, cy) {
            const r = canvas.getBoundingClientRect();
            return [cx - r.left, cy - r.top];
        },
        poke(x, y) {
            let best: Actor | null = null;
            let bd = Infinity;
            for (const a of actors) {
                if (a.gone || a.kind === 'factory' || a.kind === 'belt') continue;
                // Gående figurer står med føttene på a.y, de andre er sentrert
                const d = Math.min(Math.hypot(x - a.x, y - a.y), Math.hypot(x - a.x, y - (a.y - a.size * 0.5)));
                if (d < a.size * 1.1 && d < bd) {
                    bd = d;
                    best = a;
                }
            }
            if (!best) return null;
            const a = best;
            if (!input().reduce) {
                for (let k = 0; k < 6; k++) {
                    const ang = rnd(0, Math.PI * 2);
                    part({ k: 'emo', txt: '✨', x: a.x, y: a.y - a.size * 0.6, vx: Math.cos(ang) * 110, vy: Math.sin(ang) * 110 - 60, g: 220, life: 0.7, size: U * 0.45 });
                }
                part({ k: 'ring', x: a.x, y: a.y - a.size * 0.4, life: 0.45, size: U * 1.8, col: '#ffffff' });
                a.dir = -a.dir;
                a.timer = Math.min(a.timer, 0.3);
            }
            return { kind: a.kind, x: a.x, y: a.y - a.size * 1.1 };
        },
        destroy() {
            actors = [];
            parts = [];
            sprites.clear();
            roomCache.clear();
        },
    };
}
