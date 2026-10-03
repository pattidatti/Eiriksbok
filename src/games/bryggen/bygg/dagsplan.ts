// Dagsplaner (blueprint §8.7): folk som går til arbeid om morgenen, står i boden eller verkstedet om
// dagen, går til kirke eller hjem om kvelden og er inne om natta.
//
// Døgnet er delt i fire (klokka i `motor/dogn.ts`, sekunder fra soloppgang): morgen, dag, kveld og
// natt. Hver figur har et gjøremål per del: en rute å gå i løkke (en `Rute` fra vandrer.ts), eller
// «hjemme» (døra hen går inn, så er hen borte til neste del av dagen). Når delen skifter, går hen fra
// der hen står til det nye stedet langs gata cella oppgir (`Vei`): ingen veifinning, cella vet hvor
// det er fritt. Hver figur bytter litt før eller etter de andre (`forskyv`), så ikke alle går samtidig.
//
// Folk som står eller sitter stille (`FasePlass`) er bare der i noen deler av dagen. De kommer og
// går først når kameraet er et stykke unna, så ingen forsvinner rett foran øynene på gutten.
//
// Lages en celle på nytt (gutten kommer tilbake), står folk der dagsplanen sier, ikke ved start.
// `?dogn=0` stopper klokka, og da står dagen stille her også. Hvem som gjorde hva når på døgnet i
// Bergen i 1420-årene, er ikke funnet [K]; planene er valgt for spillet [S].
import * as THREE from 'three';
import type { Materials } from '../motor/materials';
import type { CellCtx } from '../motor/streaming';
import { lagFolk, type Folk, type Plass } from './folk';
import type { Rute, Stopp, Vandrer } from './vandrer';

export type Fase = 'morgen' | 'dag' | 'kveld' | 'natt';

/** Når hver del av dagen begynner (sekunder fra soloppgang; dagen er 600 s, natta 480 s). */
const START: [Fase, number][] = [
    ['morgen', 0],
    ['dag', 260],
    ['kveld', 470],
    ['natt', 655],
];

let klokke: (() => number) | null = null;

/** Spillet kobler klokka (`lys.klokke`) hit når systemene lages (graboks/strandliv-system.ts). */
export function koblKlokke(f: () => number): void {
    klokke = f;
}

/** Delen av dagen ved `sek` sekunder fra soloppgang. */
export function faseVed(sek: number): Fase {
    const t = ((sek % 1080) + 1080) % 1080;
    let f: Fase = 'natt';
    for (const [navn, s] of START) if (t >= s) f = navn;
    return f;
}

/** Delen av dagen nå, forskjøvet med `forskyv` sekunder (hver figur bytter litt for seg). */
export function fase(forskyv = 0): Fase {
    return klokke ? faseVed(klokke() - forskyv) : 'dag';
}

/** En rute i løkke, «hjemme» (inn døra si), eller inn en annen dør (kirka, en bod, opp trappa og bort). */
export type Gjoremaal = Stopp[] | 'hjemme' | { inn: THREE.Vector3 };

/** Døra hen går inn når gjøremålet er å være inne, eller null når det er en rute. */
function inneVed(d: Dagsfigur, g: Gjoremaal): THREE.Vector3 | null {
    if (g === 'hjemme') return d.hjem;
    if (Array.isArray(g)) return null;
    return g.inn;
}

export interface Dagsfigur {
    figur: Rute['figur'];
    id?: string;
    samtale?: string;
    fart?: number;
    baer?: Rute['baer'];
    /** Døra hen går inn og ut av. */
    hjem: THREE.Vector3;
    /** Gjøremålet i hver del av dagen. Mangler en del, gjør hen det samme som i delen før. */
    plan: Partial<Record<Fase, Gjoremaal>>;
    /** Bytter så mange sekunder etter de andre (standard: trukket fra plassen i lista). */
    forskyv?: number;
}

/** En som står eller sitter stille, bare i noen deler av dagen. */
export type FasePlass = Plass & { naar: Fase[] };

/** Hjørnene mellom to steder langs gata i cella (uten endepunktene). */
export type Vei = (fra: THREE.Vector3, til: THREE.Vector3) => THREE.Vector3[];

const REKKE: Fase[] = ['morgen', 'dag', 'kveld', 'natt'];

/** Gjøremålet i en del av dagen: det som står der, eller det som sto i delen før. */
function gjoremaal(d: Dagsfigur, f: Fase): Gjoremaal {
    for (let i = REKKE.indexOf(f), n = 0; n < 4; n++, i = (i + 3) % 4) {
        const g = d.plan[REKKE[i]];
        if (g) return g;
    }
    return 'hjemme';
}

interface Styrt {
    d: Dagsfigur;
    v: Vandrer | null;
    /** Døra hen sist gikk inn (der hen kommer ut igjen). */
    inne: THREE.Vector3;
    fase: Fase | null;
    /** Underveis til et nytt sted: ruta etterpå (eller null: inn døra). */
    etter: Stopp[] | null | undefined;
    forrige: number;
}

/** Kameraet må være så langt unna før en som står stille kommer eller går. */
const SKJULT_AVSTAND = 18;

/**
 * Lager folkene i en celle med dagsplaner: `plasser` står stille i delene av dagen de har, `figurer`
 * går etter planen sin. Samme form som `lagFolk` (folk.ts), så cella bruker dem på samme måte.
 */
export async function lagDagsfolk(plasser: FasePlass[], figurer: Dagsfigur[], vei: Vei, mats: Materials, seed = 1): Promise<Folk> {
    const styrte: Styrt[] = figurer.map((d, i) => ({
        d: { ...d, forskyv: d.forskyv ?? ((i * 37 + seed) % 41) - 10 }, v: null, inne: d.hjem, fase: null, etter: undefined, forrige: 0,
    }));
    const ruter: Rute[] = styrte.map((s, i) => {
        const f = fase(s.d.forskyv);
        const g = gjoremaal(s.d, f);
        s.fase = f;
        const inn = inneVed(s.d, g);
        if (inn) s.inne = inn;
        const stopp = Array.isArray(g) ? g : [{ p: s.inne.clone() }];
        return {
            figur: s.d.figur, id: s.d.id, samtale: s.d.samtale, fart: s.d.fart, baer: s.d.baer,
            stopp, start: inn ? 0 : (i * 3) % stopp.length,
            vedLaget: (v) => {
                s.v = v;
                if (inn) v.byttRute(null);
            },
        };
    });
    const folk = await lagFolk(plasser, mats, seed, ruter);
    // Folkene som står stille: figuren (barna i gruppa kommer i samme rekkefølge som plassene) og hvor de står.
    const faste = plasser.map((p, i) => ({
        p, root: folk.group.children[i], snakk: folk.snakkbare[i],
        hjemme: new THREE.Vector3().copy(folk.group.children[i].position), snakkPos: folk.snakkbare[i].pos.clone(),
        der: true,
    }));
    const settFast = (f: (typeof faste)[number], der: boolean) => {
        f.der = der;
        if (der) {
            f.root.position.copy(f.hjemme);
            f.snakk.pos.copy(f.snakkPos);
        } else {
            f.root.position.set(f.hjemme.x, -500, f.hjemme.z);
            f.snakk.pos.set(f.snakkPos.x, -500, f.snakkPos.z);
        }
    };
    const fasteFase = fase();
    for (const f of faste) settFast(f, f.p.naar.includes(fasteFase));

    const tilStopp = (pts: THREE.Vector3[]): Stopp[] => pts.map((p) => ({ p: p.clone() }));
    let tidTil = 0;
    return {
        ...folk,
        tick: (t: number, dt: number, ctx: CellCtx) => {
            tidTil -= dt;
            if (tidTil <= 0) {
                tidTil = 0.5;
                // De som står stille: kommer og går når kameraet er langt nok unna, eller ser en annen vei
                // (kameraet ser omtrent mot gutten).
                const nf = fase();
                const lx = ctx.spiller.x - ctx.kamera.x;
                const lz = ctx.spiller.z - ctx.kamera.z;
                const ll = Math.hypot(lx, lz) || 1;
                for (const f of faste) {
                    const skal = f.p.naar.includes(nf);
                    if (skal === f.der) continue;
                    const tx = f.hjemme.x - ctx.kamera.x;
                    const tz = f.hjemme.z - ctx.kamera.z;
                    const d = Math.hypot(tx, tz) || 1;
                    const foran = (tx * lx + tz * lz) / (d * ll);
                    if (d > SKJULT_AVSTAND || (d > 3 && foran < 0.2)) settFast(f, skal);
                }
                // De som går: et nytt gjøremål når delen av dagen skifter.
                for (const s of styrte) {
                    const v = s.v;
                    if (!v) continue;
                    const f = fase(s.d.forskyv);
                    if (f === s.fase) continue;
                    const forGj = s.fase ? gjoremaal(s.d, s.fase) : null;
                    s.fase = f;
                    const g = gjoremaal(s.d, f);
                    if (g === forGj) continue;
                    const inn = inneVed(s.d, g);
                    // Inne allerede, og skal inn et annet sted: ingen ser det, så hen er bare der.
                    if (v.skjult && inn) {
                        s.inne = inn;
                        continue;
                    }
                    const maal = inn ?? (g as Stopp[])[0].p;
                    // Inne: ut døra først. Så langs gata til det nye stedet.
                    const fra = v.skjult ? s.inne : v.pos;
                    const transit = [...vei(fra, maal), maal, maal];
                    v.byttRute(tilStopp(transit), v.skjult ? s.inne : undefined);
                    s.etter = inn ? null : (g as Stopp[]);
                    if (inn) s.inne = inn;
                    s.forrige = 0;
                }
            }
            // Fram: bytt til løkka, eller gå inn døra.
            for (const s of styrte) {
                const v = s.v;
                if (!v || s.etter === undefined) continue;
                const n = v.neste;
                if (n < s.forrige) {
                    v.byttRute(s.etter);
                    s.etter = undefined;
                }
                s.forrige = n;
            }
            folk.tick(t, dt, ctx);
        },
    };
}
