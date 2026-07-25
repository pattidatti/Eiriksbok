// Ren geometri og bevegelseslogikk for Kjedereaksjonen.
// Ingen React, ingen canvas, ingen DOM - alt her skal kunne kjøres og testes
// uten nettleser. Kanvaset (KjedeCanvas.tsx) tegner det denne fila regner ut.

// ---------------------------------------------------------------------------
// Verdensmål (logiske piksler - kanvaset skalerer selv til skjermen)
// ---------------------------------------------------------------------------

/** Logisk bredde på det eleven ser. Alt tegnes i dette koordinatsystemet. */
export const VIEW_W = 1280;
export const VIEW_H = 640;

export const SLAB_W = 560;
export const SLAB_H = 104;
export const GAP_W = 280;
/** Avstand fra starten av én stein til starten av den neste. */
export const PITCH = SLAB_W + GAP_W;

/** Y-koordinat for oversiden av bakkesteinen. */
export const GROUND_TOP = 492;
/** De tre høydene valgsteinene svever i, ovenfra og ned. */
export const CHOICE_ROW_Y = [52, 212, 372] as const;
/** Feilsporet ligger under bakken. Kameraet panorerer ned dit ved fall. */
export const FEILSPOR_TOP = 736;

/** Hvor langt inn på steinen figuren lander. */
export const LANDING_INSET = 88;
/** Figuren holdes på denne andelen av skjermbredden. */
export const CAMERA_ANCHOR = 0.36;

export const PLAYER_W = 30;
export const PLAYER_H = 54;

// ---------------------------------------------------------------------------
// Fart og tid
// ---------------------------------------------------------------------------

export const RUN_BASE = 245;
export const RUN_PER_STREAK = 24;
export const RUN_MAX = 400;

/** Glemselen går i konstant fart. Den er tregere enn grunnfarten med vilje:
 *  en ren runde skal trekke fra, ikke bare så vidt holde unna. */
export const FOG_SPEED = 168;
export const FOG_START_LEAD = 1150;
/** Tas du igjen når tåka er nærmere enn dette, er runden slutt. */
export const FOG_CATCH_MARGIN = 40;

/** Tenkeøyeblikket måles i ekte sekunder. */
export const THINK_MAX = 4.0;
/** Verden går i denne farten mens eleven tenker, så grubling er nesten gratis. */
export const THINK_TIME_SCALE = 0.22;

export const LEAP_DUR = 0.72;
export const SETTLE_DUR = 0.45;
/**
 * De gale påstandene skal rekke å DØ. På 0,3 sekunder var de borte før eleven
 * registrerte at de falt, og hele dramaet i valget forsvant.
 */
export const CRACK_DUR = 0.85;
/** Andelen av smuldringen som går med til å slå sprekker før steinen faller. */
export const CRACK_HOLD = 0.22;
export const FALL_DUR = 0.55;
export const FEILSPOR_DUR = 2.8;
export const CLIMB_DUR = 0.6;

// ---------------------------------------------------------------------------
// Geometri
// ---------------------------------------------------------------------------

/** Venstre kant av bakkesteinen for segment `i`. */
export const segmentX = (i: number): number => i * PITCH;

/** X-en figuren hopper fra på segment `i`. */
export const edgeX = (i: number): number => segmentX(i) + SLAB_W - 18;

/** X-en figuren lander på når den går inn på segment `i`. */
export const landingX = (i: number): number => segmentX(i) + LANDING_INSET;

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
