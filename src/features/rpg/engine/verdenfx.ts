// Etterbehandlingen. Ett fullskjermspass som legges på hovedkameraet og gjør
// verden til et *bilde* i stedet for et rutenett med farger.
//
// Hvorfor i det hele tatt en shader, når alt annet i spillet tegnes med
// canvas-piksler? Fordi de tre tingene som skiller «utregnet» fra «malt» ikke
// kan bakes inn i en flis:
//
//  1. **Kalde skygger, varme høylys.** Samme grep som `ramp()` gjør inne i en
//     sprite, men nå over hele bildet på én gang - og dermed også over figurer,
//     tåke og vann samtidig, så alt ser ut til å stå i det samme lyset.
//  2. **Skyer som driver over landskapet.** Se under - dette er den viktigste
//     avgjørelsen i fila.
//
// ## Hvorfor skyene ligger her og ikke som sprites
//
// Skyskyggene og tåka var først tjue store, gjennomsiktige bilder som drev over
// kartet. Det så riktig ut, og det kostet halve bildefrekvensen. Grunnen er
// overtegning: hvert flak er en flate på flere hundre piksler som må blandes mot
// alt under seg, og fem-seks av dem dekker samme piksel samtidig.
//
// Regnet ut her i stedet koster begge deler til sammen to teksturprøver i et
// pass som uansett kjører. Det er den samme avveiningen `byggProps` i verden.ts
// kom fram til fra motsatt kant, og svaret er det samme: på en svak GPU er det å
// *tegne over* det samme pikselet igjen og igjen som koster.
//
// ## Hvorfor det ikke er noen glød her
//
// Passet hadde en runde til: fire diagonale prøver som lot bålet og
// besvergelsene smitte lys ut i lufta. Den kostet alene rundt en fjerdedel av
// bildetiden, og den gjorde nesten ingenting som ikke gloa-spritene i
// `systems/vaer.ts` alt gjør bedre og billigere - de vet *hvor* lyskilden er,
// mens shaderen bare gjetter ut fra hvor bildet er lyst. Sju prøver per piksel
// ble til tre.
//
// ## Hva målingene faktisk sier
//
// `scripts/rpg-sammenlign.mjs` kjører to utgaver vekselvis og sammenligner.
// Etter opprydningen ligger dette på rundt 72 % av bildefrekvensen til utgaven
// uten noe av dette - mot 51 % da skyene var sprites.
//
// **Men de tallene er fra headless Chromium, som rasteriserer på CPU-en.** Der
// er en fullskjerms shader uforholdsmessig dyr og alfablanding uforholdsmessig
// billig, altså stikk motsatt av en ekte GPU. Tallene er brukbare til å
// sammenligne to utgaver av *denne* koden med hverandre, og ubrukelige som svar
// på hva en Chromebook faktisk klarer. Det siste må måles på en Chromebook.

import Phaser from 'phaser';
import { hexToRgb, makeRng } from './pixels';
import type { Lysbilde, Vaerlag } from '../types';

export const VERDENFX = 'verdenfx';

const FRAG = `
precision mediump float;

uniform sampler2D uMainSampler;
// Sømløst skydekke, tegnet én gang på CPU-en. Se lagSkytekstur() under.
uniform sampler2D uSkyer;
uniform vec2  uOpplosning;
uniform float uTid;
/** Kamerarullingen i verdenspiksler, så lyset ligger i verden og ikke på glasset. */
uniform vec2  uSkift;
uniform float uZoom;
uniform vec3  uSkygge;
uniform vec3  uHoylys;
uniform vec3  uSkyfarge;
uniform float uKontrast;
uniform float uMetning;
uniform float uVignett;
uniform float uSol;
uniform float uEksponering;
uniform float uSkydybde;
uniform float uSkyfart;
uniform vec3  uTaakefarge;
uniform float uTaake;

varying vec2 outTexCoord;

float lys(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main () {
    vec2 uv = outTexCoord;
    vec4 kilde = texture2D(uMainSampler, uv);
    vec3 farge = kilde.rgb;

    // ── Sollys som driver over landskapet ───────────────────────────────────
    vec2 verden = (uv * uOpplosning) / uZoom + uSkift;
    float sol = sin(verden.x * 0.0037 + uTid * 0.11) * sin(verden.y * 0.0029 - uTid * 0.07)
              + 0.6 * sin((verden.x + verden.y * 0.7) * 0.0021 + uTid * 0.16);
    farge *= uEksponering + sol * uSol;

    // ── Skydekket ───────────────────────────────────────────────────────────
    // To lag av samme sømløse tekstur, i ulik målestokk og ulik fart. Ett lag
    // alene gjentar seg synlig så snart eleven har gått en skjermbredde; to lag
    // som glir fra hverandre gjør at mønsteret aldri kommer tilbake likt.
    // Retningen er den samme som vinden trærne svaier i (se systems/vaer.ts).
    vec2 driv = vec2(uTid * uSkyfart, uTid * uSkyfart * 0.22);
    float lag1 = texture2D(uSkyer, (verden + driv) * 0.0013).r;
    float lag2 = texture2D(uSkyer, (verden * 0.57 - driv * 0.8) * 0.0013).r;

    // Vinduet er *veldig* smalt, og det er ikke gjettet. Fordelingen ble målt
    // ved å tegne selve støyfeltet til skjermen: over én skjermbredde spenner
    // det fra 0,365 til 0,584, med nitti prosent av pikslene mellom 0,43 og
    // 0,54. Verdistøy samler seg rundt midten, og å blande to lag gjør det
    // verre - et snitt har alltid smalere spredning enn leddene.
    //
    // Terskelen må derfor ligge *inni* de tallene. To forsøk bommet før det:
    // 0,42-0,95 ga seks prosent skygge, og 0,48-0,71 nådde aldri full skygge
    // fordi feltet aldri kommer i nærheten av 0,71. Her ligger vinduet på
    // omtrent p20 til p85, og da blir det ekte sol og ekte skygge.
    float sky = smoothstep(0.462, 0.540, lag1 * 0.68 + lag2 * 0.32) * uSkydybde;
    farge = mix(farge, farge * uSkyfarge, sky);

    // ── Tåka ────────────────────────────────────────────────────────────────
    // Glemselen. Den lå som seks store gjennomsiktige flak i scenen, og de var
    // det siste tunge laget med overtegning igjen. Her leses det andre
    // skylaget for seg, med sin egen terskel: det driver i en annen retning og
    // en annen fart enn skydekket, så de to feltene glir fra hverandre og leser
    // som to uavhengige ting. Det koster ikke én eneste ekstra teksturprøve.
    float taake = smoothstep(0.50, 0.62, lag2) * uTaake;
    farge = mix(farge, uTaakefarge, taake);

    // ── Skuldertrekk ────────────────────────────────────────────────────────
    // Uten dette klipper sanden. Løftet i eksponeringen dytter alt som alt var
    // lyst rett i taket, og et klippet område er ikke «lyst» - det er en flate
    // uten tekstur, og på 16-pikslers fliser forsvinner hele detaljen. Her får
    // høylysene i stedet rulle mykt av, slik film gjør.
    //
    // Kurven kjøres på den *sterkeste kanalen*, ikke på hver kanal for seg.
    // Kanalvis komprimering trekker den kraftigste kanalen mest ned, og da
    // nærmer fargen seg grått etter hvert som den blir lys: sanden ble hvit
    // singel i stedet for sand. Å skalere alle tre likt beholder kuløren.
    float topp = max(max(farge.r, farge.g), farge.b);
    if (topp > 0.001) {
        farge *= (topp / (1.0 + max(topp - 0.72, 0.0) * 1.5)) / topp;
    }

    // ── Gradering ───────────────────────────────────────────────────────────
    float l = lys(farge);
    farge = mix(vec3(l), farge, uMetning);
    farge = (farge - 0.5) * uKontrast + 0.5;
    farge = mix(farge * uSkygge, farge, smoothstep(0.0, 0.52, l));
    farge = mix(farge, farge * uHoylys, smoothstep(0.44, 0.95, l));

    // ── Vignett ─────────────────────────────────────────────────────────────
    vec2 d = uv - 0.5;
    d.x *= uOpplosning.x / uOpplosning.y;
    farge *= 1.0 - smoothstep(0.30, 0.82, length(d)) * uVignett;

    gl_FragColor = vec4(clamp(farge, 0.0, 1.0), kilde.a);
}
`;

/** Standardlyset. En epoke uten eget `lys` i temaet får dette. */
export const STANDARD_LYS: Lysbilde = {
    skygge: '#8fa8d8',
    hoylys: '#fff0cc',
    kontrast: 1.05,
    metning: 1.04,
    vignett: 0.4,
    sol: 0.05,
    eksponering: 1.14,
};

/**
 * Et sømløst skydekke, tegnet én gang.
 *
 * Verdistøy med kosinus-utjevning: et grovt rutenett av tilfeldige tall som
 * blendes mykt sammen, lagt oppå hverandre i tre stadig finere oktaver. Det
 * sømløse kommer av modulo på rutenettet - punkt 0 og punkt N er samme punkt,
 * så teksturen møter seg selv uten skjøt når den gjentas.
 *
 * Perlin ville gitt et litt penere resultat. Verdistøy er tjue linjer, kjører
 * én gang ved oppstart, og forskjellen forsvinner uansett når to lag blandes.
 */
function lagSkytekstur(storrelse: number, seed: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = storrelse;
    canvas.height = storrelse;
    const ctx = canvas.getContext('2d')!;
    const bilde = ctx.createImageData(storrelse, storrelse);
    const rng = makeRng(seed);

    const oktav = (ruter: number) => {
        const gitter: number[] = [];
        for (let i = 0; i < ruter * ruter; i++) gitter.push(rng());
        return (x: number, y: number) => {
            const fx = (x / storrelse) * ruter;
            const fy = (y / storrelse) * ruter;
            const x0 = Math.floor(fx);
            const y0 = Math.floor(fy);
            // Kosinus i stedet for rett linje: rette overganger gir synlige
            // kanter langs rutenettet, og et rutenett i en sky er verre enn
            // ingen sky.
            const tx = (1 - Math.cos((fx - x0) * Math.PI)) / 2;
            const ty = (1 - Math.cos((fy - y0) * Math.PI)) / 2;
            const p = (ax: number, ay: number) =>
                gitter[(((ay % ruter) + ruter) % ruter) * ruter + (((ax % ruter) + ruter) % ruter)];
            const topp = p(x0, y0) * (1 - tx) + p(x0 + 1, y0) * tx;
            const bunn = p(x0, y0 + 1) * (1 - tx) + p(x0 + 1, y0 + 1) * tx;
            return topp * (1 - ty) + bunn * ty;
        };
    };

    const lag = [oktav(3), oktav(6), oktav(12)];
    const vekt = [0.55, 0.3, 0.15];
    for (let y = 0; y < storrelse; y++) {
        for (let x = 0; x < storrelse; x++) {
            let v = 0;
            for (let i = 0; i < lag.length; i++) v += lag[i](x, y) * vekt[i];
            const b = Math.round(Math.max(0, Math.min(1, v)) * 255);
            const i = (y * storrelse + x) * 4;
            bilde.data[i] = b;
            bilde.data[i + 1] = b;
            bilde.data[i + 2] = b;
            bilde.data[i + 3] = 255;
        }
    }
    ctx.putImageData(bilde, 0, 0);
    return canvas;
}

/** Hex til en multiplikator rundt 1,0 - «hvor mye trekkes fargen hit». */
function tone(hex: string, styrke: number): [number, number, number] {
    const { r, g, b } = hexToRgb(hex);
    const snitt = (r + g + b) / 3 || 1;
    return [
        1 + ((r / snitt - 1) * styrke),
        1 + ((g / snitt - 1) * styrke),
        1 + ((b / snitt - 1) * styrke),
    ];
}

export class VerdenFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    /** Sekunder siden scenen startet. Settes utenfra. */
    tid = 0;
    skiftX = 0;
    skiftY = 0;
    zoom = 3;

    private skygge = tone(STANDARD_LYS.skygge, 0.5);
    private hoylys = tone(STANDARD_LYS.hoylys, 0.5);
    private kontrast = STANDARD_LYS.kontrast;
    private metning = STANDARD_LYS.metning;
    private vignett = STANDARD_LYS.vignett;
    private sol = STANDARD_LYS.sol;
    private eksponering = STANDARD_LYS.eksponering;

    private skyfarge: [number, number, number] = [0.6, 0.68, 0.85];
    private skydybde = 0;
    private skyfart = 9;
    private taakefarge: [number, number, number] = [0.85, 0.9, 0.95];
    /** Tettheten stedet er bygget med. Endres ikke etter `settVaer`. */
    private taakeGrunn = 0;
    /**
     * Cutscenenes skrue på tåka, som faktor av grunntettheten.
     *
     * Den er offentlig og et rent tall med vilje: klippene toner den med en
     * vanlig tween fra `WorldScene`, og da må den kunne skrives til utenfra.
     * Skilt fra `taakeGrunn` av samme grunn som `grunnAlpha` var det da tåka
     * var sprites - toner et klipp ned til null, må oppturen etterpå ha noe å
     * gange med, ellers kommer tåka aldri tilbake.
     */
    taakeSkala = 1;
    private skytekstur: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper | null = null;

    constructor(game: Phaser.Game) {
        super({ game, name: VERDENFX, fragShader: FRAG });
    }

    onBoot(): void {
        // Skydekket må gjentas i det uendelige, og WebGL gjentar bare teksturer
        // som er satt opp med REPEAT. Phasers vanlige teksturhåndtering setter
        // CLAMP_TO_EDGE, så denne lages med rå `createTexture2D` i stedet - da
        // kan både gjentakelsen og den myke filtreringen bes om direkte.
        const renderer = this.renderer;
        const gl = renderer.gl;
        const STORRELSE = 256;
        this.skytekstur = renderer.createTexture2D(
            0,
            gl.LINEAR,
            gl.LINEAR,
            gl.REPEAT,
            gl.REPEAT,
            gl.RGBA,
            lagSkytekstur(STORRELSE, 20260726) as unknown as HTMLImageElement,
            STORRELSE,
            STORRELSE
        );
    }

    onDestroy(): void {
        if (this.skytekstur) this.renderer.deleteTexture(this.skytekstur);
        this.skytekstur = null;
    }

    /** Lyset kommer fra epoken stedet ligger i, ikke fra shaderen. */
    settLys(lysbilde: Lysbilde): void {
        this.skygge = tone(lysbilde.skygge, 0.5);
        this.hoylys = tone(lysbilde.hoylys, 0.5);
        this.kontrast = lysbilde.kontrast;
        this.metning = lysbilde.metning;
        this.vignett = lysbilde.vignett;
        this.sol = lysbilde.sol;
        this.eksponering = lysbilde.eksponering;
    }

    /**
     * Skydekket og tåka kommer fra værlaget, ikke fra lysbildet.
     *
     * `stedTaake` er hvor tykk Glemselen ligger akkurat her. 1 er Nordvik.
     * Hallen har mindre, for den ligger utenfor tiden - men ikke null, for tåka
     * er selve temaet i spillet, og et sted uten den ser ut som et annet spill.
     */
    settVaer(vaer: Vaerlag, stedTaake = 1): void {
        const sky = hexToRgb(vaer.skyfarge);
        this.skyfarge = [sky.r / 255, sky.g / 255, sky.b / 255];
        this.skydybde = vaer.skyggedybde;
        this.skyfart = vaer.skyfart;
        const tk = hexToRgb(vaer.taakefarge);
        this.taakefarge = [tk.r / 255, tk.g / 255, tk.b / 255];
        this.taakeGrunn = vaer.taake * Math.max(0, stedTaake);
        this.taakeSkala = 1;
    }

    onDraw(mal: Phaser.Renderer.WebGL.RenderTarget): void {
        this.set1i('uMainSampler', 0);
        this.set1i('uSkyer', 1);
        this.set2f('uOpplosning', mal.width, mal.height);
        this.set1f('uTid', this.tid);
        this.set2f('uSkift', this.skiftX, this.skiftY);
        this.set1f('uZoom', this.zoom);
        this.set3f('uSkygge', this.skygge[0], this.skygge[1], this.skygge[2]);
        this.set3f('uHoylys', this.hoylys[0], this.hoylys[1], this.hoylys[2]);
        this.set3f('uSkyfarge', this.skyfarge[0], this.skyfarge[1], this.skyfarge[2]);
        this.set1f('uKontrast', this.kontrast);
        this.set1f('uMetning', this.metning);
        this.set1f('uVignett', this.vignett);
        this.set1f('uSol', this.sol);
        this.set1f('uEksponering', this.eksponering);
        this.set1f('uSkydybde', this.skydybde);
        this.set1f('uSkyfart', this.skyfart);
        this.set3f('uTaakefarge', this.taakefarge[0], this.taakefarge[1], this.taakefarge[2]);
        this.set1f('uTaake', this.taakeGrunn * Math.max(0, this.taakeSkala));
        if (this.skytekstur) this.bindTexture(this.skytekstur, 1);
        this.bindAndDraw(mal);
    }
}

/**
 * Henger etterbehandlingen på hovedkameraet.
 *
 * Returnerer null når spillet kjører på canvas i stedet for WebGL. Det skjer på
 * maskiner uten fungerende GPU-driver, og da skal spillet fortsatt gå - bare
 * uten gradering. Alt annet i atmosfæren er vanlige sprites og virker uansett.
 */
export function hengPaVerdenFX(
    scene: Phaser.Scene,
    lysbilde: Lysbilde,
    vaer: Vaerlag,
    stedTaake = 1
): VerdenFX | null {
    const renderer = scene.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return null;

    // Idempotent: `addPostPipeline` hopper over navn som alt finnes, og scenen
    // bygges på nytt for hver reise mellom steder.
    renderer.pipelines.addPostPipeline(VERDENFX, VerdenFX);

    const cam = scene.cameras.main;
    cam.setPostPipeline(VerdenFX);
    const funnet = cam.getPostPipeline(VerdenFX);
    const fx = (Array.isArray(funnet) ? funnet[0] : funnet) as VerdenFX | undefined;
    if (!fx) return null;
    fx.settLys(lysbilde);
    fx.settVaer(vaer, stedTaake);
    return fx;
}
