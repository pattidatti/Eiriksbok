// «Last koggen» (kontor-jobber.ts, blueprint §7.1): et pakkepuslespill i lasterommet til koggen ved
// allmenningen. Lasterommet er sett ovenfra: 8 rom på langs (akter til venstre, forut til høyre) og 4 på
// tvers (babord øverst, styrbord nederst). Endene er smale, og masta står midt i. Lasten kommer i en kø:
// tranfat (tunge), bunter tørrfisk og store pakker (to rom, R snur dem). Hver ting som settes, flytter
// tyngdepunktet: koggen krenger og trimmer i 3D (`Skipene.krenging`) og på tegningen. Står alt, eller
// går floen ut, sier Hermen om hun ligger rett.
//
// Etter at oppdraget er levert, kan jobben tas igjen for lønn én gang per døgn.
//
// Alt her er [S]: rutenettet, vektene og grensene. At tung last skal stå lavt og midt i skipet, og like
// mye på hver side, gjelder alle skip.
import * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import type { Plass } from '../bygg/folk';
import type { Snakkbar } from '../motor/streaming';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export const KOLS = 8;
export const RADER = 4;
/** Rom det ikke kan stå noe i: de smale endene og masta. */
export const STENGT = new Set(['0:0', '0:3', '7:0', '7:3', '4:1', '4:2']);

export type Art = 'tran' | 'bunt' | 'pakke';
export const VEKT: Record<Art, number> = { tran: 4, bunt: 1, pakke: 2 };
export const NAVN: Record<Art, string> = { tran: 'Tranfat', bunt: 'Bunt tørrfisk', pakke: 'Stor pakke tørrfisk' };

export interface Stuet {
    art: Art;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface KoggenHud {
    fase: 'klar' | 'stu' | 'slutt';
    plassert: Stuet[];
    ko: Art[];
    /** Markøren: der neste ting settes, og om den får plass. */
    mark: Stuet | null;
    lovlig: boolean;
    /** Krenging (+ styrbord) og trim (+ forut), i vekt-enheter. */
    side: number;
    trim: number;
    grenseSide: number;
    grenseTrim: number;
    igjen: number;
    tid: number;
    rett: boolean;
    tekst: string;
    n: number;
}

const GRENSE_SIDE = 2.5;
const GRENSE_TRIM = 6;
const TID = 150;
/** Hvor Hermen står: på kaia ved allmenningen, foran koggen (skip.ts: x 24, 9,2 m ut). */
export const HERMEN = new THREE.Vector3(23.2, 0, 1.15);

function nyKo(): Art[] {
    const ko: Art[] = [...Array(4).fill('tran'), ...Array(6).fill('bunt'), ...Array(5).fill('pakke')];
    for (let i = ko.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ko[i], ko[j]] = [ko[j], ko[i]];
    }
    return ko;
}

/** Krenging og trim av det som er stuet: vekt ganger avstand fra midten. */
export function balanse(liste: Stuet[]): { side: number; trim: number } {
    let side = 0;
    let trim = 0;
    for (const s of liste) {
        const v = VEKT[s.art];
        side += v * (s.y + s.h / 2 - RADER / 2);
        trim += v * (s.x + s.w / 2 - KOLS / 2);
    }
    return { side, trim };
}

function opptatt(liste: Stuet[]): Set<string> {
    const ut = new Set(STENGT);
    for (const s of liste) for (let i = 0; i < s.w; i++) for (let j = 0; j < s.h; j++) ut.add(`${s.x + i}:${s.y + j}`);
    return ut;
}

function passer(liste: Stuet[], d: Stuet): boolean {
    if (d.x < 0 || d.y < 0 || d.x + d.w > KOLS || d.y + d.h > RADER) return false;
    const opp = opptatt(liste);
    for (let i = 0; i < d.w; i++) for (let j = 0; j < d.h; j++) if (opp.has(`${d.x + i}:${d.y + j}`)) return false;
    return true;
}

export function lagKoggen(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let fase: KoggenHud['fase'] | null = null;
    let plassert: Stuet[] = [];
    let ko: Art[] = [];
    let mx = 3;
    let my = 0;
    let rot = false;
    let igjen = TID;
    let tekst = '';
    let rett = false;
    let fTid = 0;
    let n = 0;
    let arbeid = false;
    let hermen: Snakkbar | null = null;
    // Døgnene som har gått (klokka går rundt), og døgnet jobben sist ble gjort.
    let dag = 0;
    let forrige = k.lys.klokke;
    let sistJobb = -1;

    const trengs = () => oppdrag.status('kontor-koggen') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-koggen', 0);
    const kanArbeide = () => oppdrag.status('kontor-koggen') === 'levert' && dag > sistJobb;

    // Hermen og lasten som venter på kaia, i en egen liten celle (som sidefolk.ts).
    const plasser: Plass[] = [{ figur: 'skipper', rolle: 'staa', pos: HERMEN.clone(), yaw: Math.PI, id: 'hermen' }];
    k.world.streamer.leggTil({
        id: 'koggen-last',
        center: new THREE.Vector2(HERMEN.x, 2),
        half: new THREE.Vector2(6, 3),
        build: async () => {
            const { lagFolk } = await import('../bygg/folk');
            const { tonne, toGroup } = await import('../bygg/gard');
            const folk = await lagFolk(plasser, k.world.materials, 1380);
            const mk = new MeshKit();
            const c = new ColliderKit();
            // Tranfatene og buntene som venter på å komme om bord.
            for (const [x, z, t] of [[26.0, 1.7, 0.95], [26.75, 2.25, 0.9], [26.2, 2.75, 1.0]] as const) tonne(mk, c, x, z, t);
            const g = toGroup(mk, k.world.materials, 'koggen-last');
            const near = new THREE.Group();
            near.add(folk.group, g);
            return {
                near,
                colliders: [...c.specs, ...folk.colliders],
                snakkbare: folk.snakkbare,
                tick: (t, dt, ctx) => folk.tick(t, dt, ctx),
                dispose: () => {
                    folk.dispose();
                    g.traverse((o) => {
                        if (o instanceof THREE.Mesh) o.geometry.dispose();
                    });
                },
            };
        },
    });

    function mark(): Stuet | null {
        const art = ko[0];
        if (!art) return null;
        const w = art === 'pakke' && !rot ? 2 : 1;
        const h = art === 'pakke' && rot ? 2 : 1;
        return { art, x: Math.min(mx, KOLS - w), y: Math.min(my, RADER - h), w, h };
    }

    function krenging(): void {
        const b = balanse(plassert);
        k.world.skip.krenging('kogge', b.side * 0.012, -b.trim * 0.004);
    }

    function slutt(tidUte: boolean): void {
        const b = balanse(plassert);
        rett = !tidUte && Math.abs(b.side) <= GRENSE_SIDE && Math.abs(b.trim) <= GRENSE_TRIM;
        fase = 'slutt';
        fTid = 0;
        tekst = tidUte
            ? 'Floen er her. Hermens folk må stue resten selv, i full fart.'
            : rett
                ? 'Hermen ser ned i lasterommet og nikker. Hun ligger rett.'
                : Math.abs(b.side) > GRENSE_SIDE
                    ? `Hun krenger mot ${b.side > 0 ? 'styrbord' : 'babord'}. Det er for mye vekt på den ene siden.`
                    : `Hun ligger tungt ${b.trim > 0 ? 'forut' : 'akter'}. De tunge fatene står for langt ut i enden.`;
        if (arbeid) {
            sistJobb = dag;
            oppdrag.gjor(rett ? 'witten:+2;rykte:K:+1' : 'witten:+1');
        } else {
            if (rett) oppdrag.settFlagg('koggen-rett');
            oppdrag.hendelse('kontor:lastet');
        }
        k.lyd?.lyd.toner(rett ? [[392, 0, 0.3], [523.3, 0.12, 0.5], [659.3, 0.24, 0.6]] : [[220, 0, 0.5], [174.6, 0.2, 0.8]], 0.1);
        k.hudSnart();
    }

    function sett(): void {
        const m = mark();
        if (!m) return;
        if (!passer(plassert, m)) {
            k.lyd?.lyd.toner([[180, 0, 0.18], [150, 0.09, 0.25]], 0.1);
            tekst = 'Det får ikke plass der.';
            return;
        }
        plassert.push(m);
        ko.shift();
        rot = false;
        n++;
        k.lyd?.lyd.spill('fottrinn', 'tre-inne', { styrke: 0.5 + VEKT[m.art] * 0.1, fart: 1.2 - VEKT[m.art] * 0.08 });
        k.cam.addShake(0.008 * VEKT[m.art]);
        krenging();
        tekst = m.art === 'tran' ? 'Fatet dunker ned i bunnen. Koggen legger seg litt over.' : '';
        if (!ko.length) slutt(false);
    }

    return {
        navn: 'kontor-koggen',
        bilde() {
            const kl = k.lys.klokke;
            if (kl < forrige - 60) dag++;
            forrige = kl;
        },
        prompt(gutt) {
            if (fase || !(trengs() || kanArbeide())) return null;
            hermen = finnPerson(k.world, 'hermen');
            if (!hermen || !naer(gutt, hermen.pos, 2.4)) return null;
            return trengs() ? 'E: Stu lasten i koggen' : 'E: Stu lasten for Hermen (arbeid for lønn)';
        },
        trykk() {
            arbeid = !trengs();
            plassert = [];
            ko = nyKo();
            mx = 3;
            my = 0;
            rot = false;
            igjen = TID;
            fase = 'klar';
            n = 0;
            tekst = '';
            krenging();
            hermen?.vend(k.player.pos);
            k.world.si?.('Hermen', 'Tranfatene er tyngst. Midt i skipet med dem.', hermen?.pos);
            k.hudSnart();
        },
        steg(dt: number, inp: InputFrame) {
            if (!fase) return false;
            fTid += dt;
            const t = inp.trykt;
            if (fase === 'slutt') {
                if (fTid > 1 && (inp.jumpPressed || inp.interactPressed || fTid > 12)) {
                    fase = null;
                    hermen?.vend(null);
                    k.world.skip.krenging('kogge', 0, 0);
                    k.hudSnart();
                }
                return true;
            }
            if (fase === 'klar') {
                if (inp.jumpPressed || inp.interactPressed) {
                    fase = 'stu';
                    k.hudSnart();
                } else if (inp.dodgePressed) {
                    fase = null;
                    k.hudSnart();
                }
                return true;
            }
            igjen -= dt;
            if (igjen <= 0) {
                slutt(true);
                return true;
            }
            const flytt = (dx: number, dy: number) => {
                mx = Math.max(0, Math.min(KOLS - 1, mx + dx));
                my = Math.max(0, Math.min(RADER - 1, my + dy));
                k.lyd?.lyd.toner([[520 + mx * 30, 0, 0.05]], 0.03);
                k.hudSnart();
            };
            if (t.has('KeyA') || t.has('ArrowLeft')) flytt(-1, 0);
            if (t.has('KeyD') || t.has('ArrowRight')) flytt(1, 0);
            if (t.has('KeyW') || t.has('ArrowUp')) flytt(0, -1);
            if (t.has('KeyS') || t.has('ArrowDown')) flytt(0, 1);
            if (t.has('KeyR')) {
                rot = !rot;
                k.hudSnart();
            }
            if (t.has('Backspace') && plassert.length) {
                const s = plassert.pop()!;
                ko.unshift(s.art);
                krenging();
                tekst = 'Du tar den opp igjen.';
                k.hudSnart();
            }
            if (inp.jumpPressed || inp.interactPressed) {
                sett();
                k.hudSnart();
            }
            if (inp.dodgePressed) {
                fase = null;
                k.world.skip.krenging('kogge', 0, 0);
                k.world.si?.('Hermen', 'Kom tilbake før floen, da.', hermen?.pos);
                k.hudSnart();
            }
            return true;
        },
        rask: () => fase === 'stu',
        hud(): KoggenHud | null {
            if (!fase) return null;
            const m = fase === 'stu' ? mark() : null;
            const b = balanse(plassert);
            return {
                fase, plassert: [...plassert], ko: ko.slice(0, 4), mark: m, lovlig: !!m && passer(plassert, m),
                side: b.side, trim: b.trim, grenseSide: GRENSE_SIDE, grenseTrim: GRENSE_TRIM,
                igjen, tid: TID, rett, tekst, n,
            };
        },
        dispose() {
            fase = null;
        },
    };
}
