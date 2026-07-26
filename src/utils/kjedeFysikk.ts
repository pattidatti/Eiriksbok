// Ren geometri og bevegelseslogikk for Kjedereaksjonen.
// Ingen React, ingen canvas, ingen DOM - alt her skal kunne kjøres og testes
// uten nettleser. Kanvaset (KjedeCanvas.tsx) tegner det denne fila regner ut.

// ---------------------------------------------------------------------------
// Verdensmål (logiske piksler - kanvaset skalerer selv til skjermen)
// ---------------------------------------------------------------------------

/** Logisk bredde på det eleven ser. Alt tegnes i dette koordinatsystemet. */
export const VIEW_W = 1280;
export const VIEW_H = 640;

/** Steinen med teksten hugget i. Eleven lander her og leser årsaken. */
export const SLAB_W = 560;
export const SLAB_H = 104;

/**
 * Broa fra steinen og fram til kanten. Dette er pusterommet i spillet.
 *
 * Før lå kanten rett etter steinen, og eleven løp halvannet sekund mellom hvert
 * spørsmål. Da var det ikke et løpespill, det var en quiz med animasjon mellom
 * spørsmålene. Nå tar strekket rundt fire og et halvt sekund på grunnfart, og
 * det er der bakgrunnen rekker å skifte fra én scene til den neste.
 */
export const RUN_STRETCH = 820;
/** Hele plattformen: stein pluss bro. */
export const PLATFORM_W = SLAB_W + RUN_STRETCH;
export const GAP_W = 300;
/** Avstand fra starten av én plattform til starten av den neste. */
export const PITCH = PLATFORM_W + GAP_W;

/** Y-koordinat for oversiden av bakkesteinen. */
export const GROUND_TOP = 492;
/** De tre høydene valgsteinene svever i, ovenfra og ned. */
export const CHOICE_ROW_Y = [52, 212, 372] as const;
/** Feilsporet ligger under bakken. Kameraet panorerer ned dit ved fall. */
export const FEILSPOR_TOP = 736;

/** Der landet slutter og juvet begynner. Steinene svever over dette. */
export const KANT_Y = 366;
/** Hvor langt ned juv-gradienten er definert. Under dette er det bare dis. */
export const JUV_BUNN = GROUND_TOP + 320;

/** Hvor langt inn på steinen figuren lander. */
export const LANDING_INSET = 88;
/** Figuren holdes på denne andelen av skjermbredden mens hun løper. */
export const CAMERA_ANCHOR = 0.3;

export const PLAYER_W = 30;
export const PLAYER_H = 54;

// ---------------------------------------------------------------------------
// Fart og tid
// ---------------------------------------------------------------------------

export const RUN_BASE = 280;
export const RUN_PER_STREAK = 32;
export const RUN_MAX = 470;

/**
 * Glemselen går i konstant fart. Den er tregere enn grunnfarten med vilje: en
 * ren runde skal trekke fra, ikke bare så vidt holde unna.
 */
export const FOG_SPEED = 245;
export const FOG_START_LEAD = 1100;
/** Tas du igjen når tåka er nærmere enn dette, er runden slutt. */
export const FOG_CATCH_MARGIN = 40;
/**
 * Forspranget HUD-bjelken viser som full.
 *
 * Ikke satt etter hvor langt forspranget kan bli, men etter hva bjelken skal
 * BETY. På 2200 startet runden på halvfull bjelke, og ett eneste bomskudd slo
 * den over i rødt med «Glemselen tar deg igjen!» - på ledd 1 av 6. Nå starter
 * den på rundt seksti prosent, ett bomskudd tar den ned uten å rope varsku, og
 * to setter den i rødt. Da er advarselen verdt noe.
 */
export const FORSPRANG_MAKS = 1800;

/**
 * Straffen for å ta feil: Glemselen rykker fram med ett fast byks.
 *
 * Dette er hele kostnaden ved et feilsvar, og den er bevisst løsrevet fra tid.
 * Før betalte eleven i sekunder, og da ble spillet snudd på hodet: den som
 * grublet lenge og leste hele forklaringen i feilsporet tapte terreng, mens den
 * som gjettet raskt og trykket seg forbi forklaringen var praktisk talt
 * uangripelig.
 *
 * Nå står tåka stille mens eleven tenker, mens hun leser forklaringen, og mens
 * kjeden knepper på plass. Å tenke og å lese er gratis. Det som koster, er å ta
 * feil. Bykset er stilt inn slik at tre bomskudd på seks ledd så vidt lar seg
 * berge, mens det fjerde tar deg.
 */
export const FOG_SURGE = 620;

// --- Lesetid ---------------------------------------------------------------

/**
 * Tenketiden regnes ut fra hvor mye tekst som faktisk står på skjermen.
 *
 * Fast tid virket ikke: fire sekunder holdt kanskje til å telle tre alternativer,
 * men ikke til å lese tre hele setninger på nitti tegn og velge mellom dem. En
 * fjortenåring leser rundt tre ord i sekundet når hun leser for å forstå, ikke
 * for å skumme, og hun må lese alle tre før hun kan sammenligne dem.
 */
export const TENKETID_BASIS = 3.4;
export const TENKETID_PER_ORD = 0.3;
export const TENKETID_MIN = 7;
export const TENKETID_MAKS = 18;

export const lesetid = (tekster: string[]): number => {
    const ord = tekster.reduce(
        (sum, t) => sum + t.trim().split(/\s+/).filter(Boolean).length,
        0
    );
    return clamp(TENKETID_BASIS + ord * TENKETID_PER_ORD, TENKETID_MIN, TENKETID_MAKS);
};

/** Verden går i denne farten mens eleven tenker, så grubling er nesten gratis. */
export const THINK_TIME_SCALE = 0.22;

export const LEAP_DUR = 0.78;
export const SETTLE_DUR = 0.45;
/**
 * Pusterommet etter at kjeden har kneppet på plass. Her står alt stille, eleven
 * ser hva hun nettopp bygget, og bakgrunnen begynner å skifte til neste scene.
 * Uten dette gikk spillet rett fra ett spørsmål til det neste uten at noe fikk
 * synke inn.
 */
export const PUST_DUR = 1.6;
/**
 * De gale påstandene skal rekke å DØ. På 0,3 sekunder var de borte før eleven
 * registrerte at de falt, og hele dramaet i valget forsvant.
 */
export const CRACK_DUR = 0.85;
/** Andelen av smuldringen som går med til å slå sprekker før steinen faller. */
export const CRACK_HOLD = 0.22;
export const FALL_DUR = 0.55;
export const FEILSPOR_DUR = 3.4;
export const CLIMB_DUR = 0.6;

/** Hvor lenge bakgrunnen bruker på å tone over til neste scene. */
export const SCENE_FADE = 2.2;

// ---------------------------------------------------------------------------
// Geometri
// ---------------------------------------------------------------------------

/** Venstre kant av plattformen for segment `i`. Steinen ligger her. */
export const segmentX = (i: number): number => i * PITCH;

/** Broa på segment `i` går fra her ... */
export const broStart = (i: number): number => segmentX(i) + SLAB_W;
/** ... og hit. */
export const broSlutt = (i: number): number => segmentX(i) + PLATFORM_W;

/** X-en figuren hopper fra på segment `i`. */
export const edgeX = (i: number): number => segmentX(i) + PLATFORM_W - 20;

/** X-en figuren lander på når den går inn på segment `i`. */
export const landingX = (i: number): number => segmentX(i) + LANDING_INSET;

/**
 * Senteret kameraet legger seg på i valgøyeblikket: enden av broa, gapet og de
 * tre påstandene.
 *
 * Årsaken vises som tekst over kanvaset mens eleven velger, ikke som stein i
 * bildet. Det var det som gjorde det mulig å gjøre løpestrekket langt uten at
 * skriften på steinene krympet: kameraet slipper å romme hele plattformen.
 */
export const rammeSenter = (i: number): number =>
    (edgeX(i) + segmentX(i + 1) + SLAB_W) / 2 - 120;

/** Smaleste utsnitt rammen må romme. Styrer hvor stort alt tegnes. */
export const RAMME_BREDDE = GAP_W + SLAB_W + 440;

export const runSpeed = (streak: number): number =>
    Math.min(RUN_MAX, RUN_BASE + RUN_PER_STREAK * streak);

/** 0 ved grunnfart, 1 ved toppfart. Driver alle fartseffektene. */
export const fartsandel = (streak: number): number =>
    clamp01((runSpeed(streak) - RUN_BASE) / (RUN_MAX - RUN_BASE));

/**
 * Punkt på en kastebane fra (x0,y0) til (x1,y1). `lift` er hvor høyt over den
 * rette linjen buen svinger på midten.
 */
export const arcPoint = (
    t: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    lift: number
): { x: number; y: number } => ({
    x: x0 + (x1 - x0) * t,
    y: y0 + (y1 - y0) * t - lift * 4 * t * (1 - t),
});

// ---------------------------------------------------------------------------
// Interpolasjon
// ---------------------------------------------------------------------------

export const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v;

export const clamp01 = (v: number): number => clamp(v, 0, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeInQuad = (t: number): number => t * t;

/** Litt overskyting - brukt når den riktige steinen dunker ned på plass. */
export const easeOutBack = (t: number): number => {
    const c = 1.7;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

// ---------------------------------------------------------------------------
// Tekstbryting
// ---------------------------------------------------------------------------

/**
 * Bryter tekst til linjer som holder seg innenfor `maxWidth`. `measure` er en
 * callback (typisk `ctx.measureText(s).width`) slik at funksjonen selv er ren.
 */
export const wrapText = (
    text: string,
    maxWidth: number,
    measure: (s: string) => number
): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && measure(candidate) > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
};
