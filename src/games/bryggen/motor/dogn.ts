// Døgnet og været: klokka, hvor sola og månen står, og bygene som kommer og går.
//
// Et døgn i spillet er 18 minutter: 10 minutter dag (fra soloppgang til solnedgang) og 8 minutter
// natt. Sola står opp i øst-nordøst, går gjennom sør og ned i vest-nordvest, og står ikke høyere
// enn 45°, slik den gjør i Bergen sent på sommeren [V]. Bryggen vender mot sørvest: om morgenen
// står sola bak gårdene, og fra midt på dagen til kvelden lyser den på bryggefronten. Om natta
// går sola under horisonten mot nord, og månen står lavt i sør. Hvor lang natta er, er valgt for
// spillet [S].
//
// Spillets rom er dreid: +x går langs Vågen mot Holmen, som i virkeligheten er nordvest (330°),
// +z inn i landet (nordøst), -z over Vågen (sørvest). Asimut θ her måles i spillets rom fra +x mot
// +z, og retningen er (cos θ, ·, sin θ). Ekte kompassretning = θ + 330°.
//
// Været er bygene: oppholdsvær i noen minutter, så trekker det over, regner en stund og klarner
// opp igjen. `takvann` er vannet som fortsatt renner av takene: det fylles mens det regner og
// renner av et par minutter etterpå. Det er da det drypper fra takskjeggene (drypp.ts).
import * as THREE from 'three';

export const DAG_S = 600;
export const NATT_S = 480;
export const DOGN_S = DAG_S + NATT_S;

/** Sola: asimut ved soloppgang og solnedgang (spillets grader, se over), og høyest midt på dagen. */
const SOL_OPP = 80; // ekte 50°, øst-nordøst
const SOL_NED = 340; // ekte 310°, nordvest
const SOL_MAKS = THREE.MathUtils.degToRad(45);
/** Hvor dypt sola går under horisonten midt på natta. */
const SOL_DYP = THREE.MathUtils.degToRad(14);
/** Månen om natta: lavt over sør, fra sørøst (ekte 110°) til sørvest (ekte 250°). */
const MAANE_OPP = 140;
const MAANE_NED = 280;
const MAANE_MAKS = THREE.MathUtils.degToRad(26);

const fraVinkler = (asimut: number, el: number, out: THREE.Vector3) => {
    const a = THREE.MathUtils.degToRad(asimut);
    const c = Math.cos(el);
    return out.set(Math.cos(a) * c, Math.sin(el), Math.sin(a) * c);
};

/** Retningen mot sola ved tid `t` (sekunder fra soloppgang). Under horisonten om natta. */
export function solRetning(t: number, out: THREE.Vector3): THREE.Vector3 {
    const tid = ((t % DOGN_S) + DOGN_S) % DOGN_S;
    if (tid < DAG_S) {
        const u = tid / DAG_S;
        return fraVinkler(SOL_OPP + (SOL_NED - SOL_OPP) * u, SOL_MAKS * Math.sin(Math.PI * u), out);
    }
    // Om natta: videre fra nordvest, under nord, til øst-nordøst.
    const v = (tid - DAG_S) / NATT_S;
    return fraVinkler(SOL_NED + (SOL_OPP + 360 - SOL_NED) * v, -SOL_DYP * Math.sin(Math.PI * v), out);
}

/** Retningen mot månen. Den står opp like etter solnedgang og går ned før soloppgang. */
export function maaneRetning(t: number, out: THREE.Vector3): THREE.Vector3 {
    const tid = ((t % DOGN_S) + DOGN_S) % DOGN_S;
    // Natta strekkes litt ut i begge ender, så månen er under horisonten i skumringen.
    const v = tid < DAG_S ? -1 : ((tid - DAG_S) / NATT_S) * 1.16 - 0.08;
    if (v < 0 || v > 1) return out.set(0, -1, 0);
    return fraVinkler(MAANE_OPP + (MAANE_NED - MAANE_OPP) * v, MAANE_MAKS * Math.sin(Math.PI * v), out);
}

/** Sekunder fra soloppgang til sola står i asimut `grader` (om dagen). */
export function tidVedAsimut(grader: number): number {
    return ((grader - SOL_OPP) / (SOL_NED - SOL_OPP)) * DAG_S;
}

export type VaerType = 'klart' | 'graatt';

interface VaerStart {
    regn?: number;
    takvann?: number;
    /** Sekunder til neste byge. */
    neste?: number;
}

/**
 * Bygene. `dekke` 0..1 er hvor overskyet det er (stemningen blandes mot den grå), `regn` 0..1
 * hvor mye det regner, `takvann` 0..1 vannet som ennå renner av takene.
 */
export class Vaer {
    dekke = 0;
    regn = 0;
    takvann = 0;
    /** Satt: været står stille på dette regnet (`?regn=`, testskript). */
    laast: number | null = null;
    private readonly type: VaerType;
    private fase: 'opphold' | 'trekker' | 'byge' | 'klarner' = 'opphold';
    private igjen: number;
    private maalRegn = 0.5;
    private frø = 11;

    constructor(type: VaerType, start: VaerStart = {}) {
        this.type = type;
        this.regn = start.regn ?? 0;
        this.takvann = start.takvann ?? 0;
        this.dekke = type === 'graatt' ? 1 : this.regn > 0 ? 1 : 0;
        if (this.regn > 0) {
            this.fase = 'byge';
            this.maalRegn = this.regn;
        }
        this.igjen = start.neste ?? (this.regn > 0 ? 120 : this.tilfeldig(150, 300));
    }

    laas(regn: number | null): void {
        this.laast = regn;
        if (regn !== null) {
            this.regn = regn;
            this.dekke = this.type === 'graatt' || regn > 0 ? 1 : 0;
        }
    }

    private tilfeldig(a: number, b: number): number {
        this.frø = (this.frø * 16807) % 2147483647;
        return a + ((this.frø - 1) / 2147483646) * (b - a);
    }

    update(dt: number): void {
        if (this.laast === null) {
            this.igjen -= dt;
            // Grått vær: alltid overskyet, og bygene kommer oftere.
            const grunn = this.type === 'graatt' ? 1 : 0;
            if (this.igjen <= 0) {
                if (this.fase === 'opphold') {
                    this.fase = 'trekker';
                    this.igjen = 35;
                    this.maalRegn = this.tilfeldig(0.35, 0.8);
                } else if (this.fase === 'trekker') {
                    this.fase = 'byge';
                    this.igjen = this.tilfeldig(60, 150);
                } else if (this.fase === 'byge') {
                    this.fase = 'klarner';
                    this.igjen = 50;
                } else {
                    this.fase = 'opphold';
                    this.igjen = this.type === 'graatt' ? this.tilfeldig(60, 150) : this.tilfeldig(150, 300);
                }
            }
            const dekkeMaal = this.fase === 'opphold' || this.fase === 'klarner' ? grunn : 1;
            const regnMaal = this.fase === 'byge' ? this.maalRegn : 0;
            this.dekke += (dekkeMaal - this.dekke) * Math.min(1, dt / (dekkeMaal > this.dekke ? 12 : 18));
            this.regn += (regnMaal - this.regn) * Math.min(1, dt / 6);
        }
        // Takene fylles fort når det regner, og renner av over et par minutter etterpå.
        if (this.regn > 0.05) this.takvann += (1 - this.takvann) * Math.min(1, dt * 0.4 * this.regn);
        else this.takvann *= Math.exp(-dt / 55);
    }
}

/** Startpunktet for `?lys=`: tid på døgnet og været. */
export interface DognStart {
    tid: number;
    vaer: VaerType;
    regn?: number;
    takvann?: number;
    vaat: number;
    neste?: number;
}

export const STARTER: Record<string, DognStart> = {
    // Kveld etter regnet: sola lavt i nordvest over Vågen, takene drypper ennå.
    kveld: { tid: tidVedAsimut(300), vaer: 'klart', takvann: 0.9, vaat: 0.85, neste: 240 },
    morgen: { tid: tidVedAsimut(186), vaer: 'klart', vaat: 0.35 },
    dag: { tid: DAG_S * 0.5, vaer: 'klart', vaat: 0.1 },
    graatt: { tid: DAG_S * 0.5, vaer: 'graatt', regn: 0.6, takvann: 1, vaat: 0.6 },
    natt: { tid: DAG_S + NATT_S * 0.5, vaer: 'klart', vaat: 0.3 },
};
