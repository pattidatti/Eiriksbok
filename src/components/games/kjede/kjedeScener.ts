// Bakgrunnen i Kjedereaksjonen.
//
// Poenget: eleven skal SE historien skifte under føttene på seg. Går kjeden fra
// et handelsskip i Bergen til tomme gårder til union med Danmark, så skal
// horisonten gå fra brygger og seil til råtne tak til et dansk slott. Før var
// bakgrunnen den samme kulissen hele veien, og da var det ingen forskjell på å
// løpe gjennom svartedauden og å løpe gjennom hva som helst annet.
//
// Én scene per ledd. Scenen bytter i pusterommet etter at kjeden har kneppet på
// plass, så skiftet leser som en FØLGE av valget eleven tok.
//
// Alt er vektortegning i kanvas: ingen bildefiler å laste, ingenting som må
// optimaliseres, og det skalerer fritt på en Chromebook.

import { KANT_Y, clamp01 } from '../../../utils/kjedeFysikk';

/** Deterministisk «tilfeldighet», så bakgrunnen ser lik ut hver gang. */
export const hash01 = (n: number): number => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};

/** Hvor mye ekstra himmel og juv som fylles utenfor utsnittet. */
const KANT_MARGIN = 420;

/** Silhuettene står på denne linjen. Landstripen ligger rett under. */
export const NAER_BASE = KANT_Y - 16;
/** Mellomgrunnen står høyere i bildet, altså lenger unna. */
export const MIDT_BASE = KANT_Y - 34;
/** Formene i det nære laget strekkes i høyden så de leses på en Chromebook. */
const NAER_SKALA = 1.32;

export type AtmosKind =
    | 'ingen'
    | 'fugler'
    | 'maker'
    | 'ravner'
    | 'aske'
    | 'blader'
    | 'sno'
    | 'pollen';

export interface ScenePalett {
    himmelTopp: string;
    himmelMidt: string;
    himmelBunn: string;
    /** Solskive/lysflekk i horisonten. null = overskyet. */
    sol: string | null;
    solX: number;
    solY: number;
    /** Skyene. Tettheten er 0-1. */
    sky: string;
    skyTetthet: number;
    fjern: string;
    /** Hvor kupert horisonten er. */
    aas: number;
    midt: string;
    bakke: string;
    kant: string;
    merke: string;
    juv: [string, string, string, string];
}

type Silhuett = (ctx: CanvasRenderingContext2D, x: number, base: number, r: number) => void;

export interface Scene {
    id: string;
    /** Vises i oppsummeringen og i utviklingsverktøy. */
    navn: string;
    palett: ScenePalett;
    midt?: Silhuett;
    naer: Silhuett;
    /** Andel av plassene langs horisonten som får en form. */
    tetthet: number;
    /** Avstanden mellom plassene. Tett bebyggelse har lav verdi. */
    steg: number;
    atmos: AtmosKind;
}

// ---------------------------------------------------------------------------
// Tegneprimitiver
//
// Alle former settes som én path og fylles av kalleren sin fillStyle. Da blir
// hver silhuett ett fill-kall, og en hel horisont koster nesten ingenting.
// ---------------------------------------------------------------------------

/** Hus med saltak. `skjev` velter mønet, for hus som holder på å gi etter. */
const saltakhus = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    veggH: number,
    takH: number,
    skjev = 0
) => {
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - veggH);
    ctx.lineTo(x + w / 2, base - veggH - takH + skjev);
    ctx.lineTo(x + w, base - veggH);
    ctx.lineTo(x + w, base);
    ctx.closePath();
};

/** Smalt gavlhus, slik brygga i Bergen står på rekke. */
const gavlhus = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number
) => {
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - h);
    ctx.lineTo(x + w / 2, base - h - w * 0.42);
    ctx.lineTo(x + w, base - h);
    ctx.lineTo(x + w, base);
    ctx.closePath();
};

const kors = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    h: number,
    tykk = 4
) => {
    ctx.rect(x - tykk / 2, base - h, tykk, h);
    ctx.rect(x - h * 0.22, base - h * 0.78, h * 0.44, tykk);
};

const grantre = (ctx: CanvasRenderingContext2D, x: number, base: number, h: number) => {
    const b = h * 0.42;
    ctx.rect(x - 2, base - h * 0.2, 4, h * 0.2);
    for (let i = 0; i < 3; i++) {
        const t = i / 3;
        const y = base - h * (0.2 + t * 0.72);
        const bredde = b * (1 - t * 0.55);
        ctx.moveTo(x - bredde / 2, y);
        ctx.lineTo(x, y - h * 0.34);
        ctx.lineTo(x + bredde / 2, y);
        ctx.closePath();
    }
};

const lauvtre = (ctx: CanvasRenderingContext2D, x: number, base: number, h: number) => {
    ctx.rect(x - 3, base - h * 0.55, 6, h * 0.55);
    ctx.moveTo(x, base - h);
    ctx.bezierCurveTo(x + h * 0.44, base - h, x + h * 0.4, base - h * 0.42, x, base - h * 0.46);
    ctx.bezierCurveTo(x - h * 0.4, base - h * 0.42, x - h * 0.44, base - h, x, base - h);
    ctx.closePath();
};

/** Vikingskip/kogge sett fra siden, med råseil. */
const skip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    lengde: number,
    seil: boolean
) => {
    const h = lengde * 0.17;
    // Skrog
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + lengde / 2, base + h * 0.9, x + lengde, base);
    ctx.lineTo(x + lengde - 6, base - h * 0.5);
    ctx.lineTo(x + 6, base - h * 0.5);
    ctx.closePath();
    // Mast
    const mx = x + lengde * 0.46;
    ctx.rect(mx - 2.5, base - lengde * 0.62, 5, lengde * 0.62);
    if (seil) {
        // Råseil som buler litt for vinden
        ctx.moveTo(mx - lengde * 0.2, base - lengde * 0.56);
        ctx.lineTo(mx + lengde * 0.2, base - lengde * 0.56);
        ctx.quadraticCurveTo(
            mx + lengde * 0.28,
            base - lengde * 0.34,
            mx + lengde * 0.2,
            base - lengde * 0.16
        );
        ctx.lineTo(mx - lengde * 0.2, base - lengde * 0.16);
        ctx.closePath();
    }
};

const fane = (ctx: CanvasRenderingContext2D, x: number, base: number, h: number, hoyre = true) => {
    ctx.rect(x - 2, base - h, 4, h);
    const b = h * 0.36;
    const d = hoyre ? b : -b;
    ctx.moveTo(x, base - h);
    ctx.lineTo(x + d, base - h + b * 0.28);
    ctx.lineTo(x + d * 0.82, base - h + b * 0.6);
    ctx.lineTo(x, base - h + b * 0.55);
    ctx.closePath();
};

const gjerde = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    bredde: number,
    h: number,
    lut = 0
) => {
    const antall = Math.max(3, Math.round(bredde / 15));
    for (let i = 0; i < antall; i++) {
        const px = x + (i / (antall - 1)) * bredde;
        const vipp = lut ? Math.sin(i * 2.3) * lut : 0;
        ctx.moveTo(px, base);
        ctx.lineTo(px + vipp, base - h);
        ctx.lineTo(px + vipp + 3, base - h);
        ctx.lineTo(px + 3, base);
        ctx.closePath();
    }
    ctx.rect(x, base - h * 0.68, bredde, 3);
};

const kjerre = (ctx: CanvasRenderingContext2D, x: number, base: number, s: number) => {
    ctx.rect(x, base - s * 0.5, s * 1.5, s * 0.34);
    ctx.rect(x + s * 1.5, base - s * 0.42, s * 0.5, 3);
    for (const hx of [x + s * 0.28, x + s * 1.2]) {
        ctx.moveTo(hx + s * 0.16, base);
        ctx.arc(hx, base - s * 0.16, s * 0.17, 0, Math.PI * 2);
    }
};

// --- Primitiver for de nyere epokene ---------------------------------------

/**
 * Menneske i silhuett. Brukes der folkemengden ER motivet: barrikaden,
 * brødkøen, fakkeltoget. Uten folk blir de scenene bare arkitektur, og da
 * mister de akkurat det de skal fortelle.
 */
const person = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    h: number,
    loftetArm = false
) => {
    ctx.moveTo(x + h * 0.14, base - h * 0.86);
    ctx.arc(x, base - h * 0.86, h * 0.14, 0, Math.PI * 2);
    ctx.rect(x - h * 0.15, base - h * 0.74, h * 0.3, h * 0.44);
    ctx.rect(x - h * 0.14, base - h * 0.32, h * 0.12, h * 0.32);
    ctx.rect(x + h * 0.03, base - h * 0.32, h * 0.12, h * 0.32);
    if (loftetArm) ctx.rect(x + h * 0.13, base - h, h * 0.09, h * 0.34);
};

/** Rekke med folk. Høyden varierer litt, ellers leser rekken som et gjerde. */
const rekke = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    antall: number,
    h: number,
    steg: number,
    armer = false
) => {
    for (let i = 0; i < antall; i++) {
        const px = x + i * steg;
        person(ctx, px, base, h * (0.86 + hash01(px * 0.7) * 0.3), armer && i % 2 === 0);
    }
};

/** Banner mellom to bærestenger. */
const banner = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    bredde: number,
    h: number
) => {
    ctx.rect(x - 2, base - h, 4, h);
    ctx.rect(x + bredde - 2, base - h * 0.94, 4, h * 0.94);
    ctx.rect(x, base - h, bredde, h * 0.28);
};

/** Bygård i flere etasjer. `mansard` gir det avkuttede, franske taket. */
const bygard = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number,
    mansard = true
) => {
    ctx.rect(x, base - h, w, h);
    if (mansard) {
        ctx.moveTo(x - 3, base - h);
        ctx.lineTo(x + w * 0.2, base - h - w * 0.32);
        ctx.lineTo(x + w * 0.8, base - h - w * 0.32);
        ctx.lineTo(x + w + 3, base - h);
        ctx.closePath();
    }
    ctx.rect(x + w * 0.28, base - h - w * 0.46, 5, w * 0.2);
};

/** Fabrikkpipe. Smalner oppover og har en tykkere krage på toppen. */
const skorstein = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    h: number,
    b = 12
) => {
    ctx.moveTo(x, base);
    ctx.lineTo(x + b * 0.26, base - h);
    ctx.lineTo(x + b * 0.74, base - h);
    ctx.lineTo(x + b, base);
    ctx.closePath();
    ctx.rect(x + b * 0.14, base - h - 5, b * 0.72, 5);
};

/** Kanon på lavett. */
const kanon = (ctx: CanvasRenderingContext2D, x: number, base: number, s: number) => {
    ctx.rect(x + s * 0.3, base - s * 0.46, s * 0.95, s * 0.14);
    ctx.moveTo(x + s * 0.18, base);
    ctx.lineTo(x + s * 0.4, base - s * 0.5);
    ctx.lineTo(x + s * 0.62, base - s * 0.5);
    ctx.lineTo(x + s * 0.78, base);
    ctx.closePath();
    ctx.moveTo(x + s * 0.55, base - s * 0.18);
    ctx.arc(x + s * 0.34, base - s * 0.18, s * 0.21, 0, Math.PI * 2);
};

/** Gatelykt. */
const lykt = (ctx: CanvasRenderingContext2D, x: number, base: number, h: number) => {
    ctx.rect(x - 2, base - h, 4, h);
    ctx.moveTo(x - 7, base - h);
    ctx.lineTo(x + 7, base - h);
    ctx.lineTo(x + 4, base - h - 10);
    ctx.lineTo(x - 4, base - h - 10);
    ctx.closePath();
};

/** Bil sett fra siden. */
const bil = (ctx: CanvasRenderingContext2D, x: number, base: number, l: number) => {
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - l * 0.2);
    ctx.lineTo(x + l * 0.26, base - l * 0.2);
    ctx.lineTo(x + l * 0.38, base - l * 0.37);
    ctx.lineTo(x + l * 0.68, base - l * 0.37);
    ctx.lineTo(x + l * 0.8, base - l * 0.2);
    ctx.lineTo(x + l, base - l * 0.2);
    ctx.lineTo(x + l, base);
    ctx.closePath();
    for (const hx of [x + l * 0.24, x + l * 0.78]) {
        ctx.moveTo(hx + l * 0.1, base);
        ctx.arc(hx, base - l * 0.06, l * 0.1, 0, Math.PI * 2);
    }
};

/** Høyt hus uten pynt: blokk, kontorbygg, leiegård. */
const blokk = (
    ctx: CanvasRenderingContext2D,
    x: number,
    base: number,
    w: number,
    h: number
) => ctx.rect(x, base - h, w, h);

// ---------------------------------------------------------------------------
// Mellomgrunn: enkle, bleke lag som gir dybde
// ---------------------------------------------------------------------------

const midtSkog: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    grantre(ctx, x, base, 34 + r * 26);
    grantre(ctx, x + 22, base, 26 + r * 20);
    grantre(ctx, x - 20, base, 22 + r * 18);
    ctx.fill();
};

const midtFjell: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    const h = 60 + r * 70;
    ctx.moveTo(x - 90, base);
    ctx.lineTo(x - 24, base - h);
    ctx.lineTo(x + 6, base - h * 0.72);
    ctx.lineTo(x + 40, base - h * 0.95);
    ctx.lineTo(x + 110, base);
    ctx.closePath();
    ctx.fill();
};

const midtBy: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    saltakhus(ctx, x, base, 30 + r * 14, 16 + r * 10, 10);
    saltakhus(ctx, x + 36, base, 24, 12 + r * 8, 8);
    if (r > 0.6) {
        ctx.rect(x + 62, base - 46, 10, 46);
        ctx.moveTo(x + 62, base - 46);
        ctx.lineTo(x + 67, base - 62);
        ctx.lineTo(x + 72, base - 46);
        ctx.closePath();
    }
    ctx.fill();
};

const midtMaster: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const mx = x + i * 26;
        const h = 34 + hash01(x + i) * 26;
        ctx.rect(mx - 1.5, base - h, 3, h);
        ctx.rect(mx - 11, base - h * 0.82, 22, 3);
    }
    if (r > 0.7) skip(ctx, x - 20, base, 60, false);
    ctx.fill();
};

const midtPiper: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    ctx.rect(x, base - 24, 44, 24);
    ctx.rect(x + 50, base - 56 - r * 26, 9, 56 + r * 26);
    ctx.fill();
};

// ---------------------------------------------------------------------------
// Nære silhuetter, én funksjon per scene
// ---------------------------------------------------------------------------

/** Bygda før pesten: gårder i drift, kirke, folk som har det de trenger. */
const naerBygdeliv: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.28) {
        // Langhus med torvtak og lite uthus
        saltakhus(ctx, x, base, 74, 26, 24);
        saltakhus(ctx, x + 82, base, 34, 16, 13);
    } else if (r < 0.52) {
        // Stavkirke: tårn i tårn
        ctx.rect(x + 12, base - 40, 44, 40);
        saltakhus(ctx, x + 8, base - 40, 52, 0, 22);
        saltakhus(ctx, x + 20, base - 62, 28, 0, 20);
        ctx.rect(x + 32, base - 96, 4, 16);
    } else if (r < 0.76) {
        // Høystakker og gjerde: jorda gir det den skal
        for (let i = 0; i < 3; i++) {
            const hx = x + i * 30;
            const h = 20 + hash01(x + i * 3) * 12;
            ctx.moveTo(hx - 12, base);
            ctx.quadraticCurveTo(hx, base - h * 1.5, hx + 12, base);
            ctx.closePath();
        }
        gjerde(ctx, x + 96, base, 60, 14);
    } else {
        lauvtre(ctx, x + 20, base, 62);
        gjerde(ctx, x + 44, base, 70, 13);
    }
    ctx.fill();
};

/** Havna der skipet la til: brygger, kraner, varer, seil. */
const naerHavn: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.3) {
        skip(ctx, x, base + 6, 132, true);
    } else if (r < 0.6) {
        // Bryggerekke: smale gavler tett i tett
        for (let i = 0; i < 4; i++) gavlhus(ctx, x + i * 27, base, 25, 34 + hash01(x + i) * 14);
    } else if (r < 0.82) {
        // Lastekran med talje
        ctx.rect(x + 16, base - 62, 8, 62);
        ctx.rect(x + 16, base - 68, 54, 7);
        ctx.rect(x + 64, base - 61, 3, 22);
        ctx.rect(x + 58, base - 40, 16, 12);
        ctx.rect(x, base - 12, 14, 12);
    } else {
        // Tønner og kasser på kaia
        for (let i = 0; i < 4; i++) {
            const bx = x + i * 19;
            ctx.rect(bx, base - 17, 15, 17);
        }
        ctx.rect(x + 10, base - 32, 15, 15);
    }
    ctx.fill();
};

/** Byen mens pesten herjer: graver, bål, kjerrer, stengte hus. */
const naerPestby: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.3) {
        // Gravmark: kors i ujevne rekker, noen har allerede veltet
        for (let i = 0; i < 6; i++) {
            const kx = x + i * 21;
            kors(ctx, kx, base, 22 + hash01(x + i * 7) * 14);
        }
        // Jordhauger under
        ctx.moveTo(x - 12, base);
        ctx.quadraticCurveTo(x + 60, base - 11, x + 132, base);
        ctx.closePath();
    } else if (r < 0.56) {
        // Bål: stablet ved, tent
        for (let i = 0; i < 5; i++) {
            ctx.rect(x + 8 + i * 4, base - 22 - i * 3, 46 - i * 6, 5);
        }
        ctx.rect(x, base - 8, 62, 8);
    } else if (r < 0.8) {
        kjerre(ctx, x, base, 34);
        kors(ctx, x + 66, base, 26);
    } else {
        // Hus med spikret dør og kors på veggen
        saltakhus(ctx, x, base, 66, 30, 22);
        ctx.fill();
        ctx.beginPath();
        ctx.rect(x + 24, base - 24, 18, 24);
        ctx.fill();
        ctx.beginPath();
        kors(ctx, x + 33, base - 30, 14, 3);
    }
    ctx.fill();
};

/** Ødegårdene: takene har gitt etter, skogen tar tilbake jorda. */
const naerOdegard: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.32) {
        // Langhus med innsunket møne og hull i taket
        ctx.moveTo(x, base);
        ctx.lineTo(x, base - 24);
        ctx.lineTo(x + 20, base - 34);
        ctx.lineTo(x + 34, base - 26);
        ctx.lineTo(x + 48, base - 36);
        ctx.lineTo(x + 70, base - 22);
        ctx.lineTo(x + 70, base);
        ctx.closePath();
        // Bjørkeskudd som har rotfestet seg inntil veggen
        ctx.rect(x + 76, base - 44, 3, 44);
        ctx.rect(x + 86, base - 34, 3, 34);
    } else if (r < 0.58) {
        gjerde(ctx, x, base, 96, 16, 5);
        // Gresset har vokst over
        for (let i = 0; i < 7; i++) {
            const gx = x + i * 15;
            ctx.moveTo(gx, base);
            ctx.lineTo(gx + 3, base - 12 - hash01(x + i) * 9);
            ctx.lineTo(gx + 6, base);
            ctx.closePath();
        }
    } else if (r < 0.84) {
        // Bjørkekratt der åkeren lå
        for (let i = 0; i < 5; i++) {
            const bx = x + i * 17;
            const h = 40 + hash01(x + i * 5) * 34;
            ctx.rect(bx, base - h, 2.5, h);
            ctx.moveTo(bx + 1, base - h);
            ctx.lineTo(bx + 9, base - h - 8);
            ctx.moveTo(bx + 1, base - h * 0.72);
            ctx.lineTo(bx - 8, base - h * 0.72 - 7);
        }
    } else {
        // Rester av en steinmur
        for (let i = 0; i < 8; i++) {
            const sx = x + i * 11;
            ctx.rect(sx, base - 8 - hash01(x + i * 2) * 12, 10, 18);
        }
    }
    ctx.fill();
};

/** Ny jord: færre folk, men de som er igjen driver den beste jorda. */
const naerNyjord: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.3) {
        // Gård i god stand, låve ved siden av
        saltakhus(ctx, x, base, 80, 30, 26);
        saltakhus(ctx, x + 88, base, 46, 22, 18);
        ctx.rect(x + 34, base - 20, 14, 20);
    } else if (r < 0.56) {
        // Plog med skjæker
        ctx.moveTo(x, base);
        ctx.lineTo(x + 10, base - 22);
        ctx.lineTo(x + 16, base - 22);
        ctx.lineTo(x + 30, base - 4);
        ctx.lineTo(x + 44, base);
        ctx.closePath();
        ctx.rect(x + 14, base - 26, 40, 4);
        // Furer i åkeren
        for (let i = 0; i < 4; i++) ctx.rect(x + 56 + i * 16, base - 3, 12, 3);
    } else if (r < 0.8) {
        // Kornstaur
        for (let i = 0; i < 4; i++) {
            const sx = x + i * 26;
            ctx.moveTo(sx - 11, base);
            ctx.lineTo(sx, base - 34);
            ctx.lineTo(sx + 11, base);
            ctx.closePath();
        }
    } else {
        // Ku på beite
        ctx.rect(x, base - 24, 46, 18);
        ctx.rect(x + 42, base - 30, 16, 12);
        for (const lx of [x + 4, x + 16, x + 30, x + 40]) ctx.rect(lx, base - 8, 4, 8);
        lauvtre(ctx, x + 84, base, 54);
    }
    ctx.fill();
};

/** Kongsgården: makten står der, men kista er tom. */
const naerKongsgard: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.32) {
        // Kongshall med dragehoder på mønet
        saltakhus(ctx, x, base, 110, 34, 30);
        ctx.moveTo(x + 4, base - 62);
        ctx.lineTo(x - 8, base - 74);
        ctx.lineTo(x + 2, base - 72);
        ctx.closePath();
        ctx.moveTo(x + 106, base - 62);
        ctx.lineTo(x + 118, base - 74);
        ctx.lineTo(x + 108, base - 72);
        ctx.closePath();
    } else if (r < 0.6) {
        // Steintårn med tinder og skyteskår
        ctx.rect(x + 8, base - 88, 52, 88);
        for (let i = 0; i < 4; i++) ctx.rect(x + 8 + i * 14, base - 98, 9, 12);
        ctx.fill();
        ctx.beginPath();
        ctx.rect(x + 22, base - 66, 8, 16);
        ctx.rect(x + 40, base - 66, 8, 16);
    } else if (r < 0.84) {
        fane(ctx, x + 10, base, 74);
        fane(ctx, x + 44, base, 62);
        ctx.rect(x, base - 6, 60, 6);
    } else {
        // Tom skattekjerre
        kjerre(ctx, x, base, 40);
        ctx.rect(x + 70, base - 20, 18, 20);
    }
    ctx.fill();
};

/** Unionen: makten flyttet over havet. Teglslott og skip som seiler fra oss. */
const naerUnion: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.34) {
        // Renessanseslott med trappegavler og spir
        ctx.rect(x, base - 54, 120, 54);
        for (let i = 0; i < 3; i++) {
            const gx = x + 8 + i * 40;
            ctx.moveTo(gx, base - 54);
            ctx.lineTo(gx, base - 62);
            ctx.lineTo(gx + 8, base - 62);
            ctx.lineTo(gx + 8, base - 70);
            ctx.lineTo(gx + 16, base - 70);
            ctx.lineTo(gx + 16, base - 62);
            ctx.lineTo(gx + 24, base - 62);
            ctx.lineTo(gx + 24, base - 54);
            ctx.closePath();
        }
        ctx.rect(x + 48, base - 96, 22, 46);
        ctx.moveTo(x + 46, base - 96);
        ctx.lineTo(x + 59, base - 128);
        ctx.lineTo(x + 72, base - 96);
        ctx.closePath();
    } else if (r < 0.64) {
        skip(ctx, x, base + 8, 118, true);
    } else if (r < 0.86) {
        fane(ctx, x + 8, base, 80, false);
        fane(ctx, x + 40, base, 68, false);
    } else {
        for (let i = 0; i < 3; i++) gavlhus(ctx, x + i * 30, base, 27, 30 + hash01(x + i) * 12);
    }
    ctx.fill();
};

/** Industribyen. Beholdt fra den gamle kulissen, litt utvidet. */
const naerIndustri: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.34) {
        ctx.rect(x, base - 34, 62, 34);
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(x + i * 21, base - 34);
            ctx.lineTo(x + i * 21, base - 48);
            ctx.lineTo(x + i * 21 + 21, base - 34);
        }
        ctx.rect(x + 66, base - 96, 13, 96);
    } else if (r < 0.66) {
        ctx.rect(x + 4, base - 18, 30, 18);
        ctx.moveTo(x + 12, base - 18);
        ctx.lineTo(x + 15, base - 112);
        ctx.lineTo(x + 26, base - 112);
        ctx.lineTo(x + 29, base - 18);
        ctx.closePath();
    } else {
        ctx.rect(x + 2, base - 52, 58, 52);
        for (let i = 1; i < 4; i++) ctx.rect(x + 2, base - 52 + i * 13, 58, 3);
        ctx.rect(x + 12, base - 60, 38, 8);
    }
    ctx.fill();
};

/** Den moderne byen. Beholdt fra den gamle kulissen. */
const naerModerne: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.36) {
        ctx.rect(x + 6, base - 104, 44, 104);
        ctx.rect(x + 50, base - 62, 22, 62);
    } else if (r < 0.68) {
        ctx.rect(x, base - 40, 74, 40);
        ctx.rect(x + 12, base - 50, 18, 10);
        ctx.rect(x + 44, base - 47, 14, 7);
    } else {
        ctx.rect(x + 22, base - 88, 7, 88);
        ctx.rect(x - 6, base - 92, 76, 6);
        ctx.rect(x + 60, base - 86, 4, 22);
    }
    ctx.fill();
};

/** Bygata på 1700- og 1800-tallet: bygårder, gatelykt, hestekjerre. */
const naerBygate: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.34) {
        bygard(ctx, x, base, 48, 86);
        bygard(ctx, x + 52, base, 40, 68);
    } else if (r < 0.62) {
        bygard(ctx, x, base, 44, 94);
        lykt(ctx, x + 58, base, 44);
    } else if (r < 0.84) {
        kjerre(ctx, x, base, 34);
        bygard(ctx, x + 70, base, 42, 76);
    } else {
        lykt(ctx, x, base, 42);
        lauvtre(ctx, x + 34, base, 56);
    }
    ctx.fill();
};

/** Slottet: makten som møtes innendørs, mens landet venter utenfor. */
const naerVersailles: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.4) {
        // Lang fasade med midtparti og kuppel
        ctx.rect(x, base - 58, 190, 58);
        ctx.rect(x + 66, base - 82, 58, 24);
        ctx.moveTo(x + 66, base - 82);
        ctx.lineTo(x + 95, base - 118);
        ctx.lineTo(x + 124, base - 82);
        ctx.closePath();
        // Sidefløyer, så bygget blir liggende og ikke stå
        ctx.rect(x - 26, base - 40, 30, 40);
        ctx.rect(x + 186, base - 40, 30, 40);
    } else if (r < 0.68) {
        // Klipt hage: hekker i rekke og en urne på sokkel
        for (let i = 0; i < 4; i++) ctx.rect(x + i * 34, base - 30, 26, 30);
        ctx.rect(x + 140, base - 34, 16, 34);
        ctx.moveTo(x + 137, base - 34);
        ctx.quadraticCurveTo(x + 148, base - 62, x + 159, base - 34);
        ctx.closePath();
    } else if (r < 0.88) {
        // Portpilarer med faner
        ctx.rect(x, base - 56, 16, 56);
        ctx.rect(x + 64, base - 56, 16, 56);
        fane(ctx, x + 8, base - 56, 26);
        fane(ctx, x + 72, base - 56, 26, false);
    } else {
        for (let i = 0; i < 3; i++) grantre(ctx, x + i * 28, base, 52);
    }
    ctx.fill();
};

/** Bastillen: festningen, og mengden som kom for kruttet. */
const naerBastillen: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.44) {
        // To runde tårn med tinder og muren mellom dem
        for (const tx of [x, x + 86]) {
            ctx.rect(tx, base - 96, 34, 96);
            for (let i = 0; i < 3; i++) ctx.rect(tx + i * 12, base - 106, 8, 12);
        }
        ctx.rect(x + 34, base - 74, 52, 74);
    } else if (r < 0.74) {
        // Folkemengde med piker og stenger
        rekke(ctx, x, base, 6, 40, 20);
        for (let i = 0; i < 4; i++) {
            const px = x + 8 + i * 26;
            ctx.rect(px, base - 68 - hash01(px) * 14, 3, 40);
        }
    } else {
        kanon(ctx, x, base, 44);
        ctx.rect(x + 62, base - 14, 30, 14);
    }
    ctx.fill();
};

/** Barrikaden: gata sperret med det folk hadde for hånden. */
const naerBarrikade: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.42) {
        // Stablede kasser og tønner, en veltet kjerre på toppen
        for (let i = 0; i < 5; i++) ctx.rect(x + i * 17, base - 20, 16, 20);
        for (let i = 0; i < 3; i++) ctx.rect(x + 10 + i * 20, base - 38, 18, 18);
        ctx.rect(x + 26, base - 54, 26, 16);
        fane(ctx, x + 40, base - 54, 34);
    } else if (r < 0.7) {
        bygard(ctx, x, base, 46, 66, false);
        banner(ctx, x + 54, base, 54, 46);
    } else if (r < 0.88) {
        rekke(ctx, x, base, 4, 42, 22, true);
    } else {
        kjerre(ctx, x, base, 32);
        for (let i = 0; i < 4; i++) ctx.rect(x + 52 + i * 9, base - 8, 8, 8);
    }
    ctx.fill();
};

/** Slagmarken: kanoner, telt og faner. Krigen som håndverk. */
const naerSlagmark: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.34) {
        kanon(ctx, x, base, 74);
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(x + 62 + i * 7, base);
            ctx.arc(x + 58 + i * 7, base - 4, 5, 0, Math.PI * 2);
        }
    } else if (r < 0.64) {
        // Teltrekke
        for (let i = 0; i < 3; i++) {
            const tx = x + i * 54;
            ctx.moveTo(tx, base);
            ctx.lineTo(tx + 24, base - 46);
            ctx.lineTo(tx + 48, base);
            ctx.closePath();
        }
        fane(ctx, x + 130, base, 52);
    } else if (r < 0.86) {
        // Geværer stilt sammen i pyramide
        for (let i = 0; i < 3; i++) {
            const gx = x + i * 34;
            ctx.moveTo(gx, base);
            ctx.lineTo(gx + 12, base - 30);
            ctx.lineTo(gx + 16, base - 30);
            ctx.lineTo(gx + 6, base);
            ctx.closePath();
            ctx.moveTo(gx + 22, base);
            ctx.lineTo(gx + 12, base - 30);
            ctx.lineTo(gx + 16, base - 30);
            ctx.lineTo(gx + 28, base);
            ctx.closePath();
        }
    } else {
        rekke(ctx, x, base, 5, 36, 18);
    }
    ctx.fill();
};

/** Kullgruva: heisetårnet, haugene og vognene på skinner. */
const naerGruve: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.36) {
        // Heisetårn med hjul over sjakta
        ctx.moveTo(x, base);
        ctx.lineTo(x + 22, base - 98);
        ctx.lineTo(x + 34, base - 98);
        ctx.lineTo(x + 14, base);
        ctx.closePath();
        ctx.moveTo(x + 46, base);
        ctx.lineTo(x + 36, base - 98);
        ctx.lineTo(x + 48, base - 98);
        ctx.lineTo(x + 60, base);
        ctx.closePath();
        ctx.moveTo(x + 52, base - 104);
        ctx.arc(x + 35, base - 104, 17, 0, Math.PI * 2);
        ctx.rect(x + 72, base - 38, 50, 38);
    } else if (r < 0.66) {
        // Kullhauger
        for (let i = 0; i < 3; i++) {
            const hx = x + i * 46;
            const h = 22 + hash01(x + i * 3) * 14;
            ctx.moveTo(hx, base);
            ctx.lineTo(hx + 24, base - h);
            ctx.lineTo(hx + 48, base);
            ctx.closePath();
        }
    } else {
        // Vogner på skinner
        ctx.rect(x, base - 4, 130, 4);
        for (let i = 0; i < 3; i++) {
            const vx = x + 8 + i * 42;
            ctx.rect(vx, base - 22, 30, 16);
            ctx.moveTo(vx + 12, base - 4);
            ctx.arc(vx + 7, base - 4, 5, 0, Math.PI * 2);
            ctx.moveTo(vx + 28, base - 4);
            ctx.arc(vx + 23, base - 4, 5, 0, Math.PI * 2);
        }
    }
    ctx.fill();
};

/** Jernbanen: viadukt, lokomotiv og telegrafstolper. */
const naerJernbane: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.4) {
        // Viadukt med buer
        ctx.rect(x, base - 82, 168, 16);
        for (let i = 0; i < 4; i++) ctx.rect(x + 8 + i * 42, base - 66, 18, 66);
    } else if (r < 0.74) {
        // Lokomotiv med to vogner
        ctx.rect(x, base - 26, 52, 20);
        ctx.rect(x + 6, base - 40, 16, 14);
        skorstein(ctx, x + 38, base - 26, 22, 10);
        ctx.rect(x + 56, base - 30, 40, 24);
        ctx.rect(x + 100, base - 30, 40, 24);
        for (const hx of [x + 10, x + 30, x + 66, x + 86, x + 110, x + 130]) {
            ctx.moveTo(hx + 6, base - 4);
            ctx.arc(hx, base - 4, 6, 0, Math.PI * 2);
        }
        ctx.rect(x - 6, base - 4, 156, 4);
    } else {
        for (let i = 0; i < 4; i++) {
            const sx = x + i * 34;
            ctx.rect(sx, base - 54, 4, 54);
            ctx.rect(sx - 8, base - 54, 20, 3);
            ctx.rect(sx - 6, base - 46, 16, 3);
        }
    }
    ctx.fill();
};

/** Arbeiderbyen: leiegårder tett i tett, piper og vaskesnorer. */
const naerArbeiderby: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.42) {
        for (let i = 0; i < 3; i++) {
            const bx = x + i * 40;
            blokk(ctx, bx, base, 38, 62 + hash01(bx) * 22);
            ctx.rect(bx + 8, base - 92, 6, 14);
            ctx.rect(bx + 22, base - 92, 6, 14);
        }
    } else if (r < 0.7) {
        // Bakgård med vaskesnorer mellom veggene
        blokk(ctx, x, base, 26, 88);
        blokk(ctx, x + 104, base, 26, 88);
        for (let i = 0; i < 2; i++) {
            const y = base - 60 - i * 18;
            ctx.rect(x + 26, y, 78, 2);
            for (let j = 0; j < 4; j++) ctx.rect(x + 34 + j * 18, y, 11, 13);
        }
    } else if (r < 0.9) {
        blokk(ctx, x, base, 56, 74);
        skorstein(ctx, x + 66, base, 84, 13);
    } else {
        // Vannpost og tønner i gata
        ctx.rect(x, base - 30, 7, 30);
        ctx.rect(x - 4, base - 34, 15, 6);
        for (let i = 0; i < 3; i++) ctx.rect(x + 20 + i * 16, base - 15, 14, 15);
    }
    ctx.fill();
};

/** Skyttergraven: sandsekker, piggtråd og trær som er skutt i stykker. */
const naerSkyttergrav: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.36) {
        // Sandsekkvoll i to lag
        for (let i = 0; i < 6; i++) ctx.rect(x + i * 19, base - 15, 18, 15);
        for (let i = 0; i < 5; i++) ctx.rect(x + 9 + i * 19, base - 28, 18, 13);
        ctx.rect(x + 52, base - 44, 4, 16);
        ctx.rect(x + 52, base - 48, 12, 5);
    } else if (r < 0.68) {
        // Piggtrådsperring: skrå staker med tråd mellom
        for (let i = 0; i < 5; i++) {
            const sx = x + i * 28;
            ctx.moveTo(sx, base);
            ctx.lineTo(sx + 6, base - 34);
            ctx.lineTo(sx + 10, base - 34);
            ctx.lineTo(sx + 4, base);
            ctx.closePath();
        }
        for (let i = 0; i < 3; i++) ctx.rect(x, base - 12 - i * 11, 120, 2);
    } else if (r < 0.9) {
        // Splintrede trestammer
        for (let i = 0; i < 4; i++) {
            const tx = x + i * 30;
            const h = 40 + hash01(tx) * 34;
            ctx.moveTo(tx, base);
            ctx.lineTo(tx + 2, base - h);
            ctx.lineTo(tx + 8, base - h + 9);
            ctx.lineTo(tx + 10, base - h * 0.9);
            ctx.lineTo(tx + 9, base);
            ctx.closePath();
        }
    } else {
        // Kanten av et granatkrater
        ctx.moveTo(x, base);
        ctx.quadraticCurveTo(x + 20, base - 20, x + 44, base - 6);
        ctx.quadraticCurveTo(x + 70, base - 22, x + 92, base);
        ctx.closePath();
    }
    ctx.fill();
};

/** Krisetiden: kø, stengte butikker og en fabrikk uten røyk. */
const naerKrisetid: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.36) {
        // Kø langs en husvegg
        blokk(ctx, x, base, 30, 76);
        rekke(ctx, x + 40, base, 6, 40, 19);
    } else if (r < 0.64) {
        // Stengt butikk: planker på kryss over døra
        bygard(ctx, x, base, 62, 56, false);
        ctx.rect(x + 16, base - 34, 30, 5);
        ctx.rect(x + 16, base - 22, 30, 5);
    } else if (r < 0.86) {
        // Kald fabrikk: hallen står, pipa er kald
        ctx.rect(x, base - 34, 66, 34);
        skorstein(ctx, x + 76, base, 92, 14);
    } else {
        // Tønnebål og to som varmer seg
        ctx.rect(x, base - 20, 18, 20);
        person(ctx, x + 32, base, 38);
        person(ctx, x + 52, base, 36);
    }
    ctx.fill();
};

/** Fakkeltoget: massen, bannerne og talerstolen. Makt som iscenesettelse. */
const naerFakkeltog: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.42) {
        rekke(ctx, x, base, 7, 40, 18, true);
        for (let i = 0; i < 5; i++) {
            const px = x + 6 + i * 26;
            ctx.rect(px, base - 76 - hash01(px) * 10, 3, 44);
        }
    } else if (r < 0.7) {
        // Talerstol med banner foran
        ctx.rect(x, base - 26, 46, 26);
        ctx.rect(x + 8, base - 44, 30, 18);
        banner(ctx, x + 60, base, 58, 52);
    } else if (r < 0.9) {
        for (let i = 0; i < 3; i++) fane(ctx, x + i * 30, base, 66 + hash01(x + i) * 16);
    } else {
        blokk(ctx, x, base, 70, 58);
        for (let i = 0; i < 3; i++) fane(ctx, x + 10 + i * 24, base - 58, 30);
    }
    ctx.fill();
};

/** Muren: betong, vakttårn og piggtråd tvers gjennom en by. */
const naerMuren: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.42) {
        // Murseksjoner med rør på toppen
        ctx.rect(x, base - 58, 150, 58);
        ctx.rect(x - 5, base - 66, 160, 9);
    } else if (r < 0.72) {
        // Vakttårn på ben
        ctx.rect(x + 10, base - 56, 8, 56);
        ctx.rect(x + 44, base - 56, 8, 56);
        ctx.rect(x, base - 84, 62, 28);
        ctx.moveTo(x - 4, base - 84);
        ctx.lineTo(x + 31, base - 98);
        ctx.lineTo(x + 66, base - 84);
        ctx.closePath();
        ctx.rect(x + 70, base - 40, 40, 40);
    } else {
        // Betongsperringer og piggtråd
        for (let i = 0; i < 4; i++) {
            const sx = x + i * 30;
            ctx.moveTo(sx, base);
            ctx.lineTo(sx + 22, base - 26);
            ctx.lineTo(sx + 27, base - 26);
            ctx.lineTo(sx + 5, base);
            ctx.closePath();
            ctx.moveTo(sx + 22, base);
            ctx.lineTo(sx, base - 26);
            ctx.lineTo(sx + 5, base - 26);
            ctx.lineTo(sx + 27, base);
            ctx.closePath();
        }
    }
    ctx.fill();
};

/** Panelblokkene: østblokkens boligmaskiner, like fra by til by. */
const naerPanelblokk: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.42) {
        blokk(ctx, x, base, 58, 104);
        blokk(ctx, x + 64, base, 50, 84);
        ctx.rect(x + 20, base - 116, 3, 12);
        ctx.rect(x + 34, base - 114, 3, 10);
    } else if (r < 0.72) {
        blokk(ctx, x, base, 66, 92);
        bil(ctx, x + 76, base, 44);
    } else if (r < 0.9) {
        // Lekestativ og benk mellom blokkene
        ctx.rect(x, base - 34, 4, 34);
        ctx.rect(x + 40, base - 34, 4, 34);
        ctx.rect(x - 4, base - 38, 52, 4);
        ctx.rect(x + 60, base - 14, 34, 4);
        ctx.rect(x + 62, base - 14, 4, 14);
        ctx.rect(x + 88, base - 14, 4, 14);
    } else {
        // Garasjerekke
        for (let i = 0; i < 4; i++) ctx.rect(x + i * 26, base - 22, 24, 22);
    }
    ctx.fill();
};

/** Folketoget: fredelig masse med bannere. Endring nedenfra. */
const naerFolketog: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.44) {
        rekke(ctx, x, base, 7, 42, 19);
        banner(ctx, x + 16, base, 74, 66);
    } else if (r < 0.74) {
        rekke(ctx, x, base, 5, 40, 21, true);
        for (let i = 0; i < 3; i++) fane(ctx, x + 12 + i * 32, base, 62);
    } else if (r < 0.92) {
        rekke(ctx, x, base, 8, 38, 16);
    } else {
        blokk(ctx, x, base, 54, 46);
        banner(ctx, x + 62, base, 60, 50);
    }
    ctx.fill();
};

/** Utvandrerhavna: dampskipet, kofferten og de som blir igjen på kaia. */
const naerUtvandrerhavn: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.36) {
        // Dampskip med skorstein og master
        ctx.moveTo(x, base - 6);
        ctx.quadraticCurveTo(x + 74, base + 16, x + 148, base - 6);
        ctx.lineTo(x + 142, base - 30);
        ctx.lineTo(x + 6, base - 30);
        ctx.closePath();
        ctx.rect(x + 40, base - 46, 68, 16);
        skorstein(ctx, x + 64, base - 46, 34, 16);
        ctx.rect(x + 20, base - 74, 3, 44);
        ctx.rect(x + 126, base - 70, 3, 40);
    } else if (r < 0.64) {
        // Kofferter og bylter på kaia
        for (let i = 0; i < 4; i++) {
            const kx = x + i * 24;
            ctx.rect(kx, base - 14, 22, 14);
            if (hash01(kx) > 0.5) ctx.rect(kx + 3, base - 25, 16, 11);
        }
        rekke(ctx, x + 106, base, 3, 38, 20);
    } else if (r < 0.88) {
        // Lastekran og pullerter
        ctx.rect(x + 14, base - 66, 8, 66);
        ctx.rect(x + 14, base - 72, 52, 7);
        ctx.rect(x + 60, base - 65, 3, 24);
        ctx.rect(x + 54, base - 43, 16, 12);
        for (let i = 0; i < 3; i++) ctx.rect(x + 80 + i * 18, base - 12, 10, 12);
    } else {
        rekke(ctx, x, base, 6, 40, 18);
    }
    ctx.fill();
};

/** Finansbyen: banken som tempel, og glasstårnene bak den. */
const naerFinansby: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.46) {
        // Tårnene: ulik høyde er det som leser som en finansby på avstand
        blokk(ctx, x, base, 42, 132);
        blokk(ctx, x + 48, base, 32, 96);
        blokk(ctx, x + 84, base, 38, 116);
        ctx.rect(x + 16, base - 146, 4, 14);
    } else if (r < 0.74) {
        // Banken: lav og bred, med en flat gavl over midtpartiet
        ctx.rect(x, base - 46, 170, 46);
        ctx.rect(x - 8, base - 54, 186, 8);
        ctx.moveTo(x + 56, base - 54);
        ctx.lineTo(x + 85, base - 68);
        ctx.lineTo(x + 114, base - 54);
        ctx.closePath();
        for (let i = 0; i < 8; i++) ctx.rect(x + 8 + i * 20, base - 42, 8, 42);
    } else if (r < 0.92) {
        // Klokketårn
        ctx.rect(x, base - 96, 30, 96);
        ctx.moveTo(x + 21, base - 82);
        ctx.arc(x + 15, base - 82, 9, 0, Math.PI * 2);
        ctx.moveTo(x - 4, base - 96);
        ctx.lineTo(x + 15, base - 118);
        ctx.lineTo(x + 34, base - 96);
        ctx.closePath();
    } else {
        blokk(ctx, x, base, 70, 44);
        bil(ctx, x + 80, base, 42);
    }
    ctx.fill();
};

/** Boligfeltet: eneboliger, hekk og bilen i innkjørselen. */
const naerBoligfelt: Silhuett = (ctx, x, base, r) => {
    ctx.beginPath();
    if (r < 0.4) {
        saltakhus(ctx, x, base, 84, 34, 26);
        saltakhus(ctx, x + 90, base, 40, 22, 15);
        bil(ctx, x + 136, base, 46);
    } else if (r < 0.68) {
        // Rekkehus
        for (let i = 0; i < 3; i++) saltakhus(ctx, x + i * 48, base, 46, 30, 21);
    } else if (r < 0.88) {
        // Hekk, postkasser og lykt
        ctx.rect(x, base - 16, 86, 16);
        ctx.rect(x + 96, base - 24, 6, 24);
        ctx.rect(x + 90, base - 34, 18, 12);
        lykt(ctx, x + 122, base, 38);
    } else {
        lauvtre(ctx, x + 16, base, 58);
        saltakhus(ctx, x + 44, base, 60, 24, 20);
    }
    ctx.fill();
};

// ---------------------------------------------------------------------------
// Scenene
// ---------------------------------------------------------------------------

const JUV_LYS: ScenePalett['juv'] = ['#c3d5e2', '#a6bccd', '#c3d1dd', '#e7edf2'];
const JUV_GRA: ScenePalett['juv'] = ['#c1c6cc', '#a4abb3', '#c2c8ce', '#e6e9ec'];
const JUV_VARM: ScenePalett['juv'] = ['#d2cbb8', '#b4ac96', '#ccc6b6', '#ece8de'];

/**
 * Grunnpalett for de nyere scenene. De eldste scenene skriver ut hele paletten
 * sin, men fra og med 1789-kjedene er det bare noen få verdier som faktisk
 * skiller én scene fra en annen: hvor mye lys det er igjen i himmelen, og hvor
 * kald bakken er. Resten er det samme lyse grunnfjellet, og da er det bedre å
 * si det én gang enn å gjenta det sytten ganger.
 */
const GRUNN: ScenePalett = {
    himmelTopp: '#b8cadb',
    himmelMidt: '#dde5ea',
    himmelBunn: '#efe9db',
    sol: null,
    solX: 0.5,
    solY: 0.2,
    sky: 'rgba(255, 255, 255, 0.62)',
    skyTetthet: 0.6,
    fjern: '#b2bcc4',
    aas: 28,
    midt: '#9aa5ae',
    bakke: '#a7aeb4',
    kant: '#7f868d',
    merke: '#6f767d',
    juv: JUV_LYS,
};

const pal = (o: Partial<ScenePalett>): ScenePalett => ({ ...GRUNN, ...o });

export const SCENER: Record<string, Scene> = {
    bygdeliv: {
        id: 'bygdeliv',
        navn: 'Bygda',
        palett: {
            himmelTopp: '#bfdcf2',
            himmelMidt: '#e6f0f6',
            himmelBunn: '#fbf3de',
            sol: 'rgba(255, 244, 206, 0.85)',
            solX: 0.74,
            solY: 0.2,
            sky: 'rgba(255, 255, 255, 0.7)',
            skyTetthet: 0.5,
            fjern: '#c2d9c9',
            aas: 44,
            midt: '#a8c2ae',
            bakke: '#b7cdb4',
            kant: '#8aa78d',
            merke: '#7d9a83',
            juv: JUV_VARM,
        },
        midt: midtSkog,
        naer: naerBygdeliv,
        tetthet: 0.7,
        steg: 250,
        atmos: 'fugler',
    },

    havn: {
        id: 'havn',
        navn: 'Havna',
        palett: {
            himmelTopp: '#b6d2ea',
            himmelMidt: '#dbe8f2',
            himmelBunn: '#eef0e8',
            sol: 'rgba(255, 250, 226, 0.6)',
            solX: 0.2,
            solY: 0.24,
            sky: 'rgba(255, 255, 255, 0.55)',
            skyTetthet: 0.75,
            fjern: '#b6cadb',
            aas: 30,
            midt: '#9db4c8',
            bakke: '#a9bfcf',
            kant: '#7f99ad',
            merke: '#6f8ba1',
            juv: JUV_LYS,
        },
        midt: midtMaster,
        naer: naerHavn,
        tetthet: 0.82,
        steg: 220,
        atmos: 'maker',
    },

    pestby: {
        id: 'pestby',
        navn: 'Pestbyen',
        palett: {
            himmelTopp: '#a9adb4',
            himmelMidt: '#cbcac6',
            himmelBunn: '#ded6c6',
            sol: null,
            solX: 0.5,
            solY: 0.2,
            sky: 'rgba(226, 222, 214, 0.85)',
            skyTetthet: 1,
            fjern: '#a9a9a6',
            aas: 26,
            midt: '#8f8d88',
            bakke: '#9c968b',
            kant: '#736d63',
            merke: '#645f56',
            juv: JUV_GRA,
        },
        midt: midtBy,
        naer: naerPestby,
        tetthet: 0.86,
        steg: 210,
        atmos: 'ravner',
    },

    odegard: {
        id: 'odegard',
        navn: 'Ødegårdene',
        palett: {
            himmelTopp: '#c4cfd6',
            himmelMidt: '#e0e0d6',
            himmelBunn: '#f0e6cf',
            sol: 'rgba(255, 246, 214, 0.5)',
            solX: 0.32,
            solY: 0.26,
            sky: 'rgba(248, 246, 238, 0.7)',
            skyTetthet: 0.7,
            fjern: '#b9bcae',
            aas: 38,
            midt: '#a3a68f',
            bakke: '#b0af95',
            kant: '#87856c',
            merke: '#767460',
            juv: JUV_VARM,
        },
        midt: midtSkog,
        naer: naerOdegard,
        tetthet: 0.7,
        steg: 262,
        atmos: 'blader',
    },

    nyjord: {
        id: 'nyjord',
        navn: 'Ny jord',
        palett: {
            himmelTopp: '#b8dbf0',
            himmelMidt: '#e4f0f4',
            himmelBunn: '#fbf1d6',
            sol: 'rgba(255, 246, 208, 0.9)',
            solX: 0.68,
            solY: 0.18,
            sky: 'rgba(255, 255, 255, 0.62)',
            skyTetthet: 0.4,
            fjern: '#bcd4bd',
            aas: 46,
            midt: '#a4c19f',
            bakke: '#b5cca4',
            kant: '#8aa47c',
            merke: '#7c9670',
            juv: JUV_VARM,
        },
        midt: midtSkog,
        naer: naerNyjord,
        tetthet: 0.64,
        steg: 276,
        atmos: 'pollen',
    },

    kongsgard: {
        id: 'kongsgard',
        navn: 'Kongsgården',
        palett: {
            himmelTopp: '#b0bcca',
            himmelMidt: '#d6dde2',
            himmelBunn: '#e8e4d8',
            sol: null,
            solX: 0.5,
            solY: 0.2,
            sky: 'rgba(240, 242, 245, 0.8)',
            skyTetthet: 0.9,
            fjern: '#adb8c0',
            aas: 34,
            midt: '#98a2ab',
            bakke: '#a4aaad',
            kant: '#7d8489',
            merke: '#6d747a',
            juv: JUV_GRA,
        },
        midt: midtFjell,
        naer: naerKongsgard,
        tetthet: 0.66,
        steg: 272,
        atmos: 'ravner',
    },

    union: {
        id: 'union',
        navn: 'Unionen',
        palett: {
            himmelTopp: '#9fb6cf',
            himmelMidt: '#dcd6d2',
            himmelBunn: '#f3dfc0',
            sol: 'rgba(255, 226, 170, 0.9)',
            solX: 0.82,
            solY: 0.3,
            sky: 'rgba(246, 234, 226, 0.7)',
            skyTetthet: 0.65,
            fjern: '#adbbc9',
            aas: 24,
            midt: '#97a7b6',
            bakke: '#a3b0bc',
            kant: '#7c8998',
            merke: '#6d7a88',
            juv: JUV_LYS,
        },
        midt: midtMaster,
        naer: naerUnion,
        tetthet: 0.66,
        steg: 280,
        atmos: 'maker',
    },

    industriby: {
        id: 'industriby',
        navn: 'Industribyen',
        palett: {
            himmelTopp: '#b5b7b6',
            himmelMidt: '#d5d2ca',
            himmelBunn: '#e6dcc8',
            sol: null,
            solX: 0.5,
            solY: 0.2,
            sky: 'rgba(228, 224, 216, 0.85)',
            skyTetthet: 1,
            fjern: '#adaea9',
            aas: 26,
            midt: '#95958f',
            bakke: '#a09d93',
            kant: '#77746b',
            merke: '#67655d',
            juv: JUV_GRA,
        },
        midt: midtPiper,
        naer: naerIndustri,
        tetthet: 0.78,
        steg: 240,
        atmos: 'aske',
    },

    byen: {
        id: 'byen',
        navn: 'Byen',
        palett: {
            himmelTopp: '#bcd8ee',
            himmelMidt: '#e5eef5',
            himmelBunn: '#f5f1e8',
            sol: 'rgba(255, 250, 230, 0.7)',
            solX: 0.6,
            solY: 0.16,
            sky: 'rgba(255, 255, 255, 0.6)',
            skyTetthet: 0.45,
            fjern: '#c0d1de',
            aas: 30,
            midt: '#a6b7c6',
            bakke: '#b1c0cb',
            kant: '#8698a6',
            merke: '#78899a',
            juv: JUV_LYS,
        },
        midt: midtBy,
        naer: naerModerne,
        tetthet: 0.74,
        steg: 250,
        atmos: 'fugler',
    },

    // -----------------------------------------------------------------------
    // Scenene som kom med kjedene fra 1789 og framover. De deler grunnpalett,
    // og setter bare det som faktisk skiller dem: hvor mye lys det er igjen i
    // himmelen, og hvor kald bakken er å løpe på.
    // -----------------------------------------------------------------------

    bygate: {
        id: 'bygate',
        navn: 'Bygata',
        palett: pal({
            himmelTopp: '#bcd4ea',
            himmelBunn: '#f7eeda',
            sol: 'rgba(255, 246, 214, 0.7)',
            solX: 0.7,
            fjern: '#bcc6cd',
            aas: 28,
            midt: '#a3adb8',
            bakke: '#b0b6bb',
            kant: '#868d95',
            merke: '#767e86',
        }),
        midt: midtBy,
        naer: naerBygate,
        tetthet: 0.8,
        steg: 230,
        atmos: 'fugler',
    },

    versailles: {
        id: 'versailles',
        navn: 'Slottet',
        palett: pal({
            himmelTopp: '#c3ddf1',
            himmelMidt: '#eaf1f2',
            himmelBunn: '#fbf0d2',
            sol: 'rgba(255, 246, 206, 0.9)',
            solX: 0.76,
            solY: 0.18,
            skyTetthet: 0.35,
            fjern: '#c3d4c4',
            aas: 30,
            midt: '#adc0ab',
            bakke: '#bcc6ad',
            kant: '#949c84',
            merke: '#848c76',
            juv: JUV_VARM,
        }),
        midt: midtSkog,
        naer: naerVersailles,
        tetthet: 0.6,
        steg: 285,
        atmos: 'pollen',
    },

    bastillen: {
        id: 'bastillen',
        navn: 'Bastillen',
        palett: pal({
            himmelTopp: '#b3b6b8',
            himmelMidt: '#d6d1c7',
            himmelBunn: '#e8d9be',
            sol: null,
            skyTetthet: 0.95,
            fjern: '#adaba4',
            aas: 24,
            midt: '#95928a',
            bakke: '#a09b8f',
            kant: '#77726a',
            merke: '#67635c',
            juv: JUV_VARM,
        }),
        midt: midtBy,
        naer: naerBastillen,
        tetthet: 0.84,
        steg: 215,
        atmos: 'aske',
    },

    barrikade: {
        id: 'barrikade',
        navn: 'Barrikaden',
        palett: pal({
            himmelTopp: '#aab3bd',
            himmelMidt: '#cfd2d2',
            himmelBunn: '#e0dccd',
            sol: null,
            skyTetthet: 1,
            fjern: '#a8abaa',
            aas: 22,
            midt: '#8f9092',
            bakke: '#9b9a97',
            kant: '#726f6d',
            merke: '#636160',
        }),
        midt: midtBy,
        naer: naerBarrikade,
        tetthet: 0.86,
        steg: 200,
        atmos: 'aske',
    },

    slagmark: {
        id: 'slagmark',
        navn: 'Slagmarken',
        palett: pal({
            himmelTopp: '#b7bfc4',
            himmelMidt: '#dad6cb',
            himmelBunn: '#ecdfc4',
            sol: 'rgba(255, 238, 194, 0.55)',
            solX: 0.22,
            solY: 0.28,
            skyTetthet: 0.85,
            fjern: '#b3b3a5',
            aas: 40,
            midt: '#9c9b8a',
            bakke: '#a9a693',
            kant: '#807d6c',
            merke: '#706d5e',
            juv: JUV_VARM,
        }),
        midt: midtFjell,
        naer: naerSlagmark,
        tetthet: 0.6,
        steg: 300,
        atmos: 'ravner',
    },

    gruve: {
        id: 'gruve',
        navn: 'Kullgruva',
        palett: pal({
            himmelTopp: '#adaeae',
            himmelMidt: '#cdc8be',
            himmelBunn: '#ded2ba',
            sol: null,
            skyTetthet: 1,
            fjern: '#a3a099',
            aas: 34,
            midt: '#8b877f',
            bakke: '#979186',
            kant: '#6e6960',
            merke: '#5f5b53',
            juv: JUV_GRA,
        }),
        midt: midtPiper,
        naer: naerGruve,
        tetthet: 0.72,
        steg: 250,
        atmos: 'aske',
    },

    jernbane: {
        id: 'jernbane',
        navn: 'Jernbanen',
        palett: pal({
            himmelTopp: '#b9cbdb',
            himmelMidt: '#dcdcd4',
            himmelBunn: '#eee2c8',
            sol: 'rgba(255, 244, 208, 0.6)',
            solX: 0.66,
            skyTetthet: 0.8,
            fjern: '#b2b6ab',
            aas: 42,
            midt: '#9ba394',
            bakke: '#a8ac9c',
            kant: '#7f8474',
            merke: '#6f7466',
            juv: JUV_VARM,
        }),
        midt: midtPiper,
        naer: naerJernbane,
        tetthet: 0.62,
        steg: 300,
        atmos: 'aske',
    },

    arbeiderby: {
        id: 'arbeiderby',
        navn: 'Arbeiderbyen',
        palett: pal({
            himmelTopp: '#aeb0ae',
            himmelMidt: '#cfcbc2',
            himmelBunn: '#e0d6c2',
            sol: null,
            skyTetthet: 1,
            fjern: '#a6a49d',
            aas: 22,
            midt: '#8e8b83',
            bakke: '#99958b',
            kant: '#706c64',
            merke: '#615e57',
            juv: JUV_GRA,
        }),
        midt: midtPiper,
        naer: naerArbeiderby,
        tetthet: 0.9,
        steg: 190,
        atmos: 'aske',
    },

    skyttergrav: {
        id: 'skyttergrav',
        navn: 'Skyttergraven',
        palett: pal({
            himmelTopp: '#a9aeb2',
            himmelMidt: '#c9c6bd',
            himmelBunn: '#d9cdb6',
            sol: null,
            skyTetthet: 1,
            fjern: '#a19c92',
            aas: 18,
            midt: '#8a8478',
            bakke: '#948d7f',
            kant: '#6b6558',
            merke: '#5c574c',
            juv: JUV_GRA,
        }),
        // Ingen mellomgrunn: fronten i Flandern var flat, og fjell bak en
        // skyttergrav gjør scenen til noe helt annet enn den skal være.
        naer: naerSkyttergrav,
        tetthet: 0.88,
        steg: 180,
        atmos: 'ravner',
    },

    krisetid: {
        id: 'krisetid',
        navn: 'Krisetiden',
        palett: pal({
            himmelTopp: '#b4bcc4',
            himmelMidt: '#d8dade',
            himmelBunn: '#e6e4de',
            sol: null,
            skyTetthet: 1,
            fjern: '#adb2b6',
            aas: 24,
            midt: '#979ba0',
            bakke: '#a3a6a8',
            kant: '#7b7e82',
            merke: '#6c6f73',
            juv: JUV_GRA,
        }),
        midt: midtBy,
        naer: naerKrisetid,
        tetthet: 0.8,
        steg: 230,
        atmos: 'sno',
    },

    fakkeltog: {
        id: 'fakkeltog',
        navn: 'Fakkeltoget',
        palett: pal({
            himmelTopp: '#96a4b6',
            himmelMidt: '#d0c8c0',
            himmelBunn: '#eecfa4',
            sol: 'rgba(255, 214, 150, 0.85)',
            solX: 0.5,
            solY: 0.34,
            skyTetthet: 0.7,
            fjern: '#a5a49f',
            aas: 22,
            midt: '#8c8983',
            bakke: '#97918a',
            kant: '#6e6862',
            merke: '#5f5a55',
            juv: JUV_VARM,
        }),
        midt: midtBy,
        naer: naerFakkeltog,
        tetthet: 0.85,
        steg: 200,
        atmos: 'ravner',
    },

    muren: {
        id: 'muren',
        navn: 'Muren',
        palett: pal({
            himmelTopp: '#b6bec6',
            himmelMidt: '#d5d8da',
            himmelBunn: '#e3e2dd',
            sol: null,
            skyTetthet: 0.95,
            fjern: '#aeb2b4',
            aas: 20,
            midt: '#999b9c',
            bakke: '#a5a6a5',
            kant: '#7d7e7e',
            merke: '#6e6f6f',
            juv: JUV_GRA,
        }),
        midt: midtBy,
        naer: naerMuren,
        tetthet: 0.9,
        steg: 195,
        atmos: 'ingen',
    },

    panelblokk: {
        id: 'panelblokk',
        navn: 'Blokkene',
        palett: pal({
            himmelTopp: '#b0c1d0',
            himmelMidt: '#d7dade',
            himmelBunn: '#e6e5df',
            sol: null,
            skyTetthet: 0.9,
            fjern: '#aeb3b7',
            aas: 22,
            midt: '#989ca1',
            bakke: '#a4a7a9',
            kant: '#7c8083',
            merke: '#6d7174',
            juv: JUV_GRA,
        }),
        midt: midtBy,
        naer: naerPanelblokk,
        tetthet: 0.7,
        steg: 280,
        atmos: 'sno',
    },

    folketog: {
        id: 'folketog',
        navn: 'Folketoget',
        palett: pal({
            himmelTopp: '#bad8f0',
            himmelMidt: '#e4eef4',
            himmelBunn: '#f8f0dd',
            sol: 'rgba(255, 248, 220, 0.8)',
            solX: 0.62,
            solY: 0.18,
            skyTetthet: 0.45,
            fjern: '#bcc8d0',
            aas: 26,
            midt: '#a5b0ba',
            bakke: '#b1b8bd',
            kant: '#888f96',
            merke: '#798087',
        }),
        midt: midtBy,
        naer: naerFolketog,
        tetthet: 0.82,
        steg: 200,
        atmos: 'fugler',
    },

    utvandrerhavn: {
        id: 'utvandrerhavn',
        navn: 'Utvandrerhavna',
        palett: pal({
            himmelTopp: '#aec8e2',
            himmelMidt: '#dbe6ee',
            himmelBunn: '#f2e6cc',
            sol: 'rgba(255, 240, 200, 0.7)',
            solX: 0.18,
            solY: 0.26,
            skyTetthet: 0.7,
            fjern: '#b2c3d1',
            aas: 24,
            midt: '#9aaebe',
            bakke: '#a7b8c4',
            kant: '#7d8f9d',
            merke: '#6e808e',
        }),
        midt: midtMaster,
        naer: naerUtvandrerhavn,
        tetthet: 0.8,
        steg: 220,
        atmos: 'maker',
    },

    finansby: {
        id: 'finansby',
        navn: 'Finansbyen',
        palett: pal({
            himmelTopp: '#b3d3ee',
            himmelMidt: '#e0ecf5',
            himmelBunn: '#f2f2ec',
            sol: 'rgba(255, 252, 236, 0.6)',
            solX: 0.56,
            solY: 0.14,
            skyTetthet: 0.4,
            fjern: '#bccbd8',
            aas: 26,
            midt: '#a2b1c0',
            bakke: '#adbac5',
            kant: '#84929f',
            merke: '#758391',
        }),
        midt: midtBy,
        naer: naerFinansby,
        tetthet: 0.7,
        steg: 260,
        atmos: 'fugler',
    },

    boligfelt: {
        id: 'boligfelt',
        navn: 'Boligfeltet',
        palett: pal({
            himmelTopp: '#bcdcf2',
            himmelMidt: '#e6f0f4',
            himmelBunn: '#fbf3e0',
            sol: 'rgba(255, 248, 216, 0.85)',
            solX: 0.72,
            solY: 0.2,
            skyTetthet: 0.42,
            fjern: '#c1d5c6',
            aas: 34,
            midt: '#a9c0aa',
            bakke: '#b7c9b0',
            kant: '#8ba286',
            merke: '#7c9379',
            juv: JUV_VARM,
        }),
        midt: midtSkog,
        naer: naerBoligfelt,
        tetthet: 0.66,
        steg: 270,
        atmos: 'pollen',
    },
};

export const SCENE_IDS = Object.keys(SCENER);

/** Kulissene fra den gamle datamodellen peker på hver sin standardscene. */
export const KULISSE_SCENE: Record<string, string> = {
    middelalder: 'bygdeliv',
    industri: 'industriby',
    moderne: 'byen',
};

export const hentScene = (id: string | undefined, fallback: string): Scene =>
    (id && SCENER[id]) || SCENER[fallback] || SCENER.bygdeliv;

// ---------------------------------------------------------------------------
// Tegning
// ---------------------------------------------------------------------------

/**
 * Himmelen. Tegnes inne i dy-forskyvningen slik at gradientene kan forankres i
 * verdens-Y - ellers glir horisonten fra landstripen på skjermer der bredden
 * bestemmer skalaen.
 */
export const tegnHimmel = (
    ctx: CanvasRenderingContext2D,
    p: ScenePalett,
    viewW: number,
    dy: number,
    camX: number,
    t: number
) => {
    const topp = -dy;
    const g = ctx.createLinearGradient(0, topp, 0, KANT_Y);
    g.addColorStop(0, p.himmelTopp);
    g.addColorStop(0.6, p.himmelMidt);
    g.addColorStop(1, p.himmelBunn);
    ctx.fillStyle = g;
    // Fylles godt over toppen: bakgrunnen parallakserer litt når kameraet
    // panorerer ned i feilsporet, og da skal det aldri glippe en stripe øverst.
    // Gradienten klemmes utenfor sitt eget spenn, så fargen er den samme.
    ctx.fillRect(0, topp - KANT_MARGIN, viewW, KANT_Y - topp + KANT_MARGIN);

    // Sola/lysflekken. En myk skive, ikke en hard sirkel: den skal lese som lys
    // i disen, ikke som en klistremerkesol.
    if (p.sol) {
        const sx = viewW * p.solX;
        const sy = topp + (KANT_Y - topp) * p.solY;
        const r = 190;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        sg.addColorStop(0, p.sol);
        sg.addColorStop(0.24, p.sol.replace(/[\d.]+\)$/, '0.32)'));
        sg.addColorStop(1, p.sol.replace(/[\d.]+\)$/, '0)'));
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Skyer i egen, veldig treg parallakse pluss litt egen drift
    if (p.skyTetthet > 0.02) {
        ctx.fillStyle = p.sky;
        const off = camX * 0.05 + t * 7;
        const steg = 380;
        const forste = Math.floor(off / steg) - 1;
        for (let i = forste; i < forste + Math.ceil(viewW / steg) + 3; i++) {
            const r = hash01(i * 5.1);
            if (r > p.skyTetthet) continue;
            const cx = i * steg - off + hash01(i * 2.3) * 120;
            const cy = topp + 40 + hash01(i * 7.7) * 130;
            const s = 0.7 + hash01(i * 3.3) * 0.8;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 96 * s, 22 * s, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 54 * s, cy - 10 * s, 62 * s, 18 * s, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - 50 * s, cy - 4 * s, 54 * s, 15 * s, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

/** Gjør en hex-farge om til rgba med gitt gjennomsiktighet. */
const hexA = (hex: string, a: number): string => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** Én fjellrygg nede i juvet. Kantlinjen er summen av tre sinuser, så den er
 *  ujevn uten å være tilfeldig. */
const tegnRygg = (
    ctx: CanvasRenderingContext2D,
    hex: string,
    alpha: number,
    camX: number,
    viewW: number,
    toppY: number,
    amp: number,
    parallakse: number,
    fro: number,
    bunn: number
) => {
    const off = camX * parallakse + fro;
    const kam = (x: number) => {
        const wx = x + off;
        return (
            toppY +
            Math.sin(wx * 0.0029) * amp +
            Math.sin(wx * 0.0091) * amp * 0.4 +
            Math.sin(wx * 0.024) * amp * 0.14
        );
    };
    ctx.beginPath();
    ctx.moveTo(-20, bunn);
    for (let x = -60; x <= viewW + 60; x += 30) ctx.lineTo(x, kam(x));
    ctx.lineTo(viewW + 20, bunn);
    ctx.closePath();
    ctx.fillStyle = hexA(hex, alpha);
    ctx.fill();
    // Kammen får en egen strek. Uten den flyter ryggene sammen med disen, og
    // juvet leser som lagvis flatt land i stedet for som dybde.
    ctx.beginPath();
    for (let x = -60; x <= viewW + 60; x += 30) {
        if (x === -60) ctx.moveTo(x, kam(x));
        else ctx.lineTo(x, kam(x));
    }
    ctx.strokeStyle = hexA(hex, Math.min(1, alpha + 0.16));
    ctx.lineWidth = 2;
    ctx.stroke();
};

/**
 * Juvet under landkanten.
 *
 * Steinene skal ha noe å stå MOT, og «det finnes ingen bakke der du ikke har
 * bygget kjeden» må leses som en avgrunn. En ren gradient klarte ikke det: den
 * ble en flat, lys flate som dekket nesten halve bildet og så mest ut som at
 * noe manglet. Nå ligger det tre fjellrygger nedover i hver sin parallakse med
 * disebånd mellom - juvet får dybde, og strekket eleven løper får noe som
 * beveger seg i ulik fart bak seg.
 */
export const tegnJuv = (
    ctx: CanvasRenderingContext2D,
    p: ScenePalett,
    viewW: number,
    viewH: number,
    dy: number,
    juvBunn: number,
    camX: number,
    t: number
) => {
    const bunn = viewH - dy + KANT_MARGIN;
    const juv = ctx.createLinearGradient(0, KANT_Y, 0, juvBunn);
    juv.addColorStop(0, p.juv[0]);
    juv.addColorStop(0.22, p.juv[1]);
    juv.addColorStop(0.55, p.juv[2]);
    juv.addColorStop(1, p.juv[3]);
    ctx.fillStyle = juv;
    ctx.fillRect(0, KANT_Y, viewW, juvBunn - KANT_Y);
    if (bunn > juvBunn) {
        ctx.fillStyle = p.juv[3];
        ctx.fillRect(0, juvBunn, viewW, bunn - juvBunn);
    }

    // Ryggene. Jo nærmere, jo lavere i bildet, jo mørkere og jo raskere.
    tegnRygg(ctx, p.kant, 0.14, camX, viewW, KANT_Y + 30, 26, 0.17, 0, bunn);
    tegnRygg(ctx, p.kant, 0.24, camX, viewW, KANT_Y + 92, 36, 0.3, 640, bunn);
    tegnRygg(ctx, p.kant, 0.38, camX, viewW, KANT_Y + 176, 46, 0.46, 1500, bunn);

    // Disen som legger seg mellom ryggene. Myke bånd som tones ut i begge
    // retninger, ikke former med kanter - kanter leser som gjenstander.
    ctx.save();
    for (let i = 0; i < 3; i++) {
        const y = KANT_Y + 66 + i * 76 + Math.sin(t * 0.22 + i * 1.7) * 6;
        const h = 44 + i * 16;
        const g = ctx.createLinearGradient(0, y - h, 0, y + h);
        g.addColorStop(0, hexA(p.juv[3], 0));
        g.addColorStop(0.5, hexA(p.juv[3], 0.5 - i * 0.06));
        g.addColorStop(1, hexA(p.juv[3], 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, y - h, viewW, h * 2);
    }
    // Noen tyngre dotter som driver sakte forbi, så disen ikke står helt stille
    for (let i = 0; i < 5; i++) {
        const r = 190 + hash01(i * 6.1) * 130;
        const bane = 1100 + hash01(i * 2.7) * 500;
        const x = ((hash01(i * 9.3) * bane - camX * 0.24 - t * 9) % bane) + viewW * 0.5 - bane * 0.3;
        const y = KANT_Y + 80 + hash01(i * 4.9) * 150;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, hexA(p.juv[3], 0.34));
        g.addColorStop(1, hexA(p.juv[3], 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

/** Fjerne åser. Formen er den samme overalt, fargen og høyden er scenens. */
export const tegnFjern = (
    ctx: CanvasRenderingContext2D,
    p: ScenePalett,
    camX: number,
    viewW: number
) => {
    const off = camX * 0.12;
    ctx.fillStyle = p.fjern;
    ctx.beginPath();
    ctx.moveTo(-10, KANT_Y);
    for (let x = -200; x <= viewW + 200; x += 40) {
        const wx = x + off;
        const y =
            KANT_Y - 60 - p.aas + Math.sin(wx * 0.0016) * p.aas + Math.sin(wx * 0.0043) * (p.aas * 0.45);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW + 10, KANT_Y);
    ctx.closePath();
    ctx.fill();
};

/** Mellomgrunnen: samme former, mindre og blekere, halv fart av det nære laget. */
export const tegnMidt = (
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    camX: number,
    viewW: number
) => {
    if (!scene.midt) return;
    const off = camX * 0.28;
    const steg = scene.steg * 1.35;
    ctx.save();
    ctx.fillStyle = scene.palett.midt;
    ctx.translate(0, MIDT_BASE);
    ctx.scale(1, 0.68);
    ctx.translate(0, -MIDT_BASE);
    const forste = Math.floor((off - 300) / steg);
    for (let i = forste; i < forste + Math.ceil(viewW / steg) + 4; i++) {
        const r = hash01(i * 9.13);
        if (r > 0.82) continue;
        scene.midt(ctx, i * steg - off + hash01(i * 4.4) * 110, MIDT_BASE, r / 0.82);
    }
    ctx.restore();
};

/** Det nære laget: landstripen, kantmerkene og scenens egne former. */
export const tegnNaer = (
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    camX: number,
    viewW: number
) => {
    const p = scene.palett;
    const off = camX * 0.5;

    // Landstripen silhuettene står på, tegnet først så de får bakke under seg
    ctx.fillStyle = p.bakke;
    ctx.fillRect(0, KANT_Y - 18, viewW, 18);
    ctx.fillStyle = p.kant;
    ctx.fillRect(0, KANT_Y - 5, viewW, 5);

    // Merker langs landkanten. Den sterkeste fartsfølelsen i et sidescroller-
    // bilde kommer fra detaljer som streamer forbi, ikke fra store former.
    ctx.fillStyle = p.merke;
    const merkeSteg = 120;
    const forsteMerke = Math.floor(off / merkeSteg);
    for (let i = forsteMerke; i < forsteMerke + Math.ceil(viewW / merkeSteg) + 2; i++) {
        ctx.fillRect(i * merkeSteg - off, KANT_Y - 5, 26, 5);
    }

    // Formene tegnes litt større enn de er målsatt. På en Chromebook er
    // landstripen bare en håndfull piksler høy, og en kirke på 96 piksler
    // forsvant rett og slett - historien i bakgrunnen må kunne SES.
    ctx.save();
    // Nære former tar landkantens tone, ikke mellomgrunnens. Ellers står de to
    // lagene i nøyaktig samme valør, og dybden i horisonten forsvinner.
    ctx.fillStyle = p.kant;
    ctx.translate(0, KANT_Y);
    ctx.scale(1, NAER_SKALA);
    ctx.translate(0, -KANT_Y);
    const steg = scene.steg;
    const forste = Math.floor((off - 340) / steg);
    for (let i = forste; i < forste + Math.ceil(viewW / steg) + 3; i++) {
        const r = hash01(i * 3.7);
        if (r > scene.tetthet) continue;
        scene.naer(ctx, i * steg - off + hash01(i + 5) * 90, NAER_BASE, r / scene.tetthet);
    }
    ctx.restore();
};

/**
 * Atmosfæren: det som beveger seg i lufta.
 *
 * Alt regnes ut fra tid og indeks, uten lagret tilstand. Da koster kryssfadingen
 * mellom to scener ingenting ekstra, og ingen partikkelsverm må ryddes opp når
 * scenen byttes.
 */
export const tegnAtmos = (
    ctx: CanvasRenderingContext2D,
    kind: AtmosKind,
    t: number,
    viewW: number,
    dy: number
) => {
    if (kind === 'ingen') return;
    const topp = -dy;
    const hoyde = KANT_Y - topp;

    const flyr = (antall: number, farge: string, fart: number, storrelse: number) => {
        ctx.strokeStyle = farge;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < antall; i++) {
            const bane = hash01(i * 12.7);
            const x = ((hash01(i * 3.1) * viewW + t * fart * (0.6 + bane)) % (viewW + 200)) - 100;
            const y = topp + hoyde * (0.12 + hash01(i * 5.9) * 0.42) + Math.sin(t * 1.4 + i) * 9;
            const s = storrelse * (0.7 + bane * 0.6);
            const vinge = Math.sin(t * 6 + i * 2) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(x - s, y + s * vinge * 0.8);
            ctx.lineTo(x, y - s * 0.3);
            ctx.lineTo(x + s, y + s * vinge * 0.8);
            ctx.stroke();
        }
    };

    const drysser = (
        antall: number,
        farge: string,
        fallFart: number,
        drift: number,
        r: number,
        firkant: boolean
    ) => {
        ctx.fillStyle = farge;
        for (let i = 0; i < antall; i++) {
            const fase = hash01(i * 7.3);
            const y = topp + ((hash01(i * 2.9) * hoyde + t * fallFart * (0.6 + fase)) % hoyde);
            const x =
                ((hash01(i * 4.7) * viewW + Math.sin(t * 0.8 + i) * drift - t * drift * 0.4) %
                    (viewW + 60)) +
                -30;
            const s = r * (0.5 + fase);
            if (firkant) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(t * 2 + i);
                ctx.fillRect(-s, -s * 0.6, s * 2, s * 1.2);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, s, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    switch (kind) {
        case 'fugler':
            flyr(7, 'rgba(90, 105, 120, 0.5)', 26, 7);
            break;
        case 'maker':
            flyr(10, 'rgba(255, 255, 255, 0.75)', 40, 9);
            flyr(5, 'rgba(120, 135, 150, 0.4)', 22, 6);
            break;
        case 'ravner':
            flyr(9, 'rgba(48, 46, 48, 0.6)', -34, 8);
            break;
        case 'aske':
            drysser(46, 'rgba(96, 92, 88, 0.35)', 34, 26, 2.4, false);
            break;
        case 'blader':
            drysser(26, 'rgba(178, 142, 84, 0.55)', 44, 42, 3.6, true);
            break;
        case 'sno':
            drysser(60, 'rgba(255, 255, 255, 0.7)', 40, 30, 2.6, false);
            break;
        case 'pollen':
            drysser(34, 'rgba(255, 240, 190, 0.7)', 12, 30, 2.2, false);
            break;
    }
};

/** Hele bakgrunnen for én scene, klar til å tegnes med globalAlpha. */
export const tegnScene = (
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    camX: number,
    viewW: number,
    viewH: number,
    dy: number,
    juvBunn: number,
    t: number,
    stille: boolean
) => {
    tegnHimmel(ctx, scene.palett, viewW, dy, stille ? 0 : camX, stille ? 0 : t);
    tegnJuv(ctx, scene.palett, viewW, viewH, dy, juvBunn, camX, stille ? 0 : t);
    tegnFjern(ctx, scene.palett, camX, viewW);
    tegnMidt(ctx, scene, camX, viewW);
    tegnNaer(ctx, scene, camX, viewW);
    if (!stille) tegnAtmos(ctx, scene.atmos, t, viewW, dy);
};

/** Brukes av kryssfadingen: 0 = bare forrige scene, 1 = bare den nye. */
export const fadeAndel = (gaatt: number, varighet: number): number =>
    clamp01(gaatt / varighet);
