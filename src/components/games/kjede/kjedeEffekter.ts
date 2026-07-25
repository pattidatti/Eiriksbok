// Rene visuelle effekter for Kjedereaksjonen: støv, fartsstriper, kamerarystelse
// og klem-strekk på figuren. Ingenting her påvirker simuleringen - verden vet
// ikke at de finnes. Det er med vilje: juice skal aldri kunne endre utfallet.

import { GROUND_TOP, PITCH, SLAB_W, clamp01 } from '../../../utils/kjedeFysikk';

export interface Partikkel {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    liv: number;
    maksLiv: number;
    /** Rotasjon for flisene som spretter av steinen. */
    rot: number;
    vrot: number;
    /** Støv er runde og bleke, fliser er firkantede og mørkere. */
    flis: boolean;
}

export interface Fartsstripe {
    x: number;
    y: number;
    lengde: number;
    fart: number;
    alpha: number;
}

export interface Effekter {
    partikler: Partikkel[];
    striper: Fartsstripe[];
    /** Utslag i piksler. Faller mot null av seg selv. */
    rystelse: number;
    /** 0 = ingen klem, 1 = full klem. Fjærer tilbake. */
    klem: number;
    /** Sekunder siden kjedeglimtet startet, null når det ikke går. */
    glimt: number | null;
    /**
     * Verdenskoordinatene glimtet løper mellom, låst i det slaget skjer.
     * Må lagres: `w.segment` øker midt i glimtet, så en x regnet ut fra
     * segmentnummeret ville hoppet et helt steg fremover underveis.
     */
    glimtFra: number;
    glimtTil: number;
    /** Sekunder siden trykkbølgen fra nedslaget startet, null når den ikke går. */
    sjokk: number | null;
    sjokkX: number;
}

export const nyeEffekter = (): Effekter => ({
    partikler: [],
    striper: [],
    rystelse: 0,
    klem: 0,
    glimt: null,
    glimtFra: 0,
    glimtTil: 0,
    sjokk: null,
    sjokkX: 0,
});

export const GLIMT_VARIGHET = 0.95;
export const SJOKK_VARIGHET = 0.5;

/** Fartsstripene lever i juvet mellom landkanten og bunnen av bildet. */
const STRIPE_Y_MIN = 392;
const STRIPE_Y_MAKS = 636;

// Flest mulig partikler uten å koste noe på en Chromebook
const MAKS_PARTIKLER = 160;

const tilfeldig = (rng: () => number, min: number, max: number) => min + rng() * (max - min);

/** Liten dusj under føttene når figuren treffer en stein. */
export const stoevSprut = (e: Effekter, x: number, y: number, rng: () => number, antall = 10) => {
    for (let i = 0; i < antall && e.partikler.length < MAKS_PARTIKLER; i++) {
        const liv = tilfeldig(rng, 0.35, 0.7);
        e.partikler.push({
            x: x + tilfeldig(rng, -14, 14),
            y,
            vx: tilfeldig(rng, -110, 60),
            vy: tilfeldig(rng, -160, -40),
            r: tilfeldig(rng, 2.5, 6),
            liv,
            maksLiv: liv,
            rot: 0,
            vrot: 0,
            flis: false,
        });
    }
};

/**
 * Tenner kjedeglimtet og låser banen det skal løpe: fra forrige stein og inn i
 * den nye. Egen funksjon fordi glimtet også skal gå ved redusert bevegelse, der
 * støvet og rystelsen er slått av.
 */
export const tennGlimt = (e: Effekter, venstreX: number) => {
    e.glimt = 0;
    // Fra midten av årsak-steinen til midten av virkning-steinen. Før startet
    // pulsen 196 px til venstre for forrige stein, altså i løse lufta bak
    // eleven, og den lyseste delen av banen (styrken topper på midten) havnet
    // oppå steinen hun allerede sto på i stedet for over gapet. Nå går den
    // synlig fra årsak til virkning, som er hele metaforen.
    e.glimtFra = venstreX - PITCH + SLAB_W / 2;
    e.glimtTil = venstreX + SLAB_W / 2;
};

/**
 * Det store slaget: steinen dunker ned på plass. Støv langs hele underkanten
 * pluss noen steinfliser som spretter. Dette er øyeblikket eleven skal kjenne.
 */
export const steinSlam = (e: Effekter, venstreX: number, rng: () => number) => {
    const y = GROUND_TOP;
    for (let i = 0; i < 46 && e.partikler.length < MAKS_PARTIKLER; i++) {
        // Trekk plasseringen mot endene: der presses lufta ut når steinen lander,
        // og der leser skyen som nedslag i stedet for som en rad småstein
        const u = rng();
        const t = u < 0.5 ? Math.pow(u * 2, 2) * 0.5 : 1 - Math.pow((1 - u) * 2, 2) * 0.5;
        const utover = (t - 0.5) * 2;
        const liv = tilfeldig(rng, 0.55, 1.1);
        e.partikler.push({
            x: venstreX + t * SLAB_W + tilfeldig(rng, -14, 14),
            y: y + tilfeldig(rng, -2, 14),
            vx: utover * tilfeldig(rng, 220, 430),
            vy: tilfeldig(rng, -125, -22),
            r: tilfeldig(rng, 10, 24),
            liv,
            maksLiv: liv,
            rot: 0,
            vrot: 0,
            flis: false,
        });
    }
    for (let i = 0; i < 8 && e.partikler.length < MAKS_PARTIKLER; i++) {
        const liv = tilfeldig(rng, 0.6, 1.1);
        e.partikler.push({
            x: venstreX + tilfeldig(rng, 0, SLAB_W),
            y,
            vx: tilfeldig(rng, -190, 190),
            vy: tilfeldig(rng, -320, -160),
            r: tilfeldig(rng, 2.5, 4.5),
            liv,
            maksLiv: liv,
            rot: tilfeldig(rng, 0, Math.PI),
            vrot: tilfeldig(rng, -9, 9),
            flis: true,
        });
    }
    e.rystelse = Math.max(e.rystelse, 16);
    e.klem = 1;
    e.sjokk = 0;
    e.sjokkX = venstreX + SLAB_W / 2;
};

/** Når en gal stein smuldrer bort under føttene. */
export const smuldreSprut = (e: Effekter, x: number, y: number, rng: () => number) => {
    for (let i = 0; i < 16 && e.partikler.length < MAKS_PARTIKLER; i++) {
        const liv = tilfeldig(rng, 0.4, 0.9);
        e.partikler.push({
            x: x + tilfeldig(rng, 0, SLAB_W),
            y: y + tilfeldig(rng, 0, 40),
            vx: tilfeldig(rng, -80, 80),
            vy: tilfeldig(rng, -60, 40),
            r: tilfeldig(rng, 2, 6),
            liv,
            maksLiv: liv,
            rot: tilfeldig(rng, 0, Math.PI),
            vrot: tilfeldig(rng, -6, 6),
            flis: true,
        });
    }
    e.rystelse = Math.max(e.rystelse, 5);
};

export const oppdaterEffekter = (e: Effekter, dt: number, fartsandel: number, viewW: number, camX: number, rng: () => number) => {
    // Partikler
    for (let i = e.partikler.length - 1; i >= 0; i--) {
        const p = e.partikler[i];
        p.liv -= dt;
        if (p.liv <= 0) {
            e.partikler.splice(i, 1);
            continue;
        }
        p.vy += (p.flis ? 620 : 240) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 1.6 * dt;
        p.rot += p.vrot * dt;
    }

    // Fartsstriper: tettheten følger farten, så streaken blir noe du SER.
    // De holder seg i juvet under landkanten - i himmelen leste de som riper.
    if (fartsandel > 0.04) {
        const onsket = Math.round(fartsandel * 20);
        // Er feltet tomt, så strø stripene utover hele bredden med én gang.
        // Ellers ville de klumpet seg i høyre kant de første sekundene.
        const tomtFelt = e.striper.length === 0;
        while (e.striper.length < onsket) {
            e.striper.push({
                x: tomtFelt
                    ? camX + tilfeldig(rng, -100, viewW + 200)
                    : camX + viewW + tilfeldig(rng, 0, 340),
                y: tilfeldig(rng, STRIPE_Y_MIN, STRIPE_Y_MAKS),
                lengde: tilfeldig(rng, 60, 170) * (0.5 + fartsandel),
                fart: tilfeldig(rng, 540, 920) * (0.4 + fartsandel),
                alpha: tilfeldig(rng, 0.3, 0.7) * fartsandel,
            });
        }
    }
    for (let i = e.striper.length - 1; i >= 0; i--) {
        const s = e.striper[i];
        s.x -= s.fart * dt;
        if (s.x + s.lengde < camX - 100 || (fartsandel < 0.02 && rng() < dt * 3)) {
            e.striper.splice(i, 1);
        }
    }

    // Rystelse og klem faller tilbake av seg selv
    e.rystelse *= Math.max(0, 1 - 9 * dt);
    if (e.rystelse < 0.15) e.rystelse = 0;
    e.klem *= Math.max(0, 1 - 7 * dt);
    if (e.klem < 0.01) e.klem = 0;

    if (e.glimt !== null) {
        e.glimt += dt;
        if (e.glimt > GLIMT_VARIGHET) e.glimt = null;
    }
    if (e.sjokk !== null) {
        e.sjokk += dt;
        if (e.sjokk > SJOKK_VARIGHET) e.sjokk = null;
    }
};

/**
 * Trykkbølgen fra nedslaget: en flat ring som skyter utover langs steinflaten.
 * Støvet alene leste som en rad prikker langs kanten - ringen er det som gjør
 * at slaget kjennes i kroppen.
 */
export const tegnSjokkbolge = (ctx: CanvasRenderingContext2D, e: Effekter, y: number) => {
    if (e.sjokk === null) return;
    const t = clamp01(e.sjokk / SJOKK_VARIGHET);
    const rx = 60 + t * 430;
    const ry = 10 + t * 46;
    const a = (1 - t) * (1 - t) * 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 252, 240, ${a})`;
    ctx.lineWidth = 7 * (1 - t) + 1.5;
    ctx.beginPath();
    ctx.ellipse(e.sjokkX, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(176, 152, 108, ${a * 0.55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(e.sjokkX, y, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

export const tegnPartikler = (ctx: CanvasRenderingContext2D, e: Effekter) => {
    for (const p of e.partikler) {
        const a = clamp01(p.liv / p.maksLiv);
        if (p.flis) {
            ctx.save();
            ctx.globalAlpha = a;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = '#a08a63';
            ctx.fillRect(-p.r, -p.r * 0.7, p.r * 2, p.r * 1.4);
            ctx.restore();
        } else {
            // Myk sky som vokser og tynnes ut, ikke en hard prikk
            const r = p.r * (2.2 - a * 1.1);
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            g.addColorStop(0, `rgba(184, 165, 130, ${a * 0.66})`);
            g.addColorStop(0.6, `rgba(193, 177, 145, ${a * 0.34})`);
            g.addColorStop(1, 'rgba(206, 194, 168, 0)');
            ctx.globalAlpha = 1;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
};

export const tegnFartsstriper = (ctx: CanvasRenderingContext2D, e: Effekter) => {
    ctx.lineCap = 'round';
    for (const s of e.striper) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.lengde, s.y);
        ctx.stroke();
    }
};
