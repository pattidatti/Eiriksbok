// Bære tørrfisk (blueprint §7.1, «Heise og bære tørrfisk»): gutten tar en bunt fra stabelen på
// kaia, bærer den opp gårdsrommet og inn i bua, og legger den ved bismeren. Med en bunt i armene
// går han saktere, kan ikke springe, hoppe eller slåss. Husbonden sendte ham hit (samtaler.ts).
//
// En bunt er her omtrent en våg, «det en gutt kan bære» (ca. 18 kg). Hvor stor en våg var i
// 1420-årene, er ikke slått fast [U] (§4.3).
import * as THREE from 'three';
import type { BryggenWorld } from '../bygg/bryggen';
import { buntMesh } from '../bygg/folk';
import type { Character } from '../motor/character';
import { BismerSpill } from './bismer';

const NAER = 1.5;

export class Baering {
    baerer = false;
    antall = 0;
    prompt: string | null = null;
    private readonly world: BryggenWorld;
    private readonly gutt: Character;
    private readonly bunt: THREE.Object3D;
    private maal: { hent: THREE.Vector3; lever: THREE.Vector3 } | null = null;
    /** Veiingen som pågår (gutten står stille ved bismeren). */
    veier: BismerSpill | null = null;
    /** Meldinger til gutten (vises øverst). */
    onMelding: (tekst: string) => void = () => undefined;
    private trekk = 0.37;

    constructor(world: BryggenWorld, gutt: Character) {
        this.world = world;
        this.gutt = gutt;
        // Samme plass foran brystet som hos skutedrengen, skalert til gutten.
        this.bunt = buntMesh(world.materials);
        this.bunt.position.set(0, 0.86, 0.27);
        this.bunt.scale.setScalar(0.92);
        this.bunt.visible = false;
        gutt.anim.root.add(this.bunt);
    }

    /** Finner hva gutten kan gjøre der han står. Gir teksten til «E: …», eller null. */
    oppdater(): string | null {
        const p = this.gutt.pos;
        this.prompt = null;
        this.maal = null;
        for (const b of this.world.streamer.bunter()) {
            const mal = this.baerer ? b.lever : b.hent;
            if (Math.hypot(mal.x - p.x, mal.z - p.z) < NAER && Math.abs(mal.y - p.y) < 0.8) {
                this.maal = b;
                this.prompt = this.baerer ? 'E: Legg bunten ved bismeren' : 'E: Ta en bunt tørrfisk';
                break;
            }
        }
        return this.prompt;
    }

    /** E ved stabelen eller bismeren. Gir en melding til gutten, eller null. */
    trykk(): string | null {
        if (!this.maal) return null;
        this.baerer = !this.baerer;
        this.vis();
        if (this.baerer) return this.antall === 0 ? 'Tung! En bunt er omtrent en våg, det en gutt klarer å bære. Bær den opp gårdsrommet og inn i bua.' : null;
        // Bunten henger i kroken: nå skal den veies. Vekta trekkes rundt en våg (ca. 3 bismerpund).
        this.trekk = (this.trekk * 9301 + 0.4927) % 1;
        this.veier = new BismerSpill(Math.round((2.5 + this.trekk * 1.1) * 10) / 10);
        return this.antall === 0
            ? 'Bunten henger i kroken på bismeren. Flytt hanken med A og D til stanga ligger vannrett, og les av merket med E.'
            : null;
    }

    /** Mens veiingen pågår: `styr` flytter hanken, `les` leser av. */
    styr(dt: number, styr: number, les: boolean): void {
        const v = this.veier;
        if (!v) return;
        v.step(dt, styr);
        if (!les) return;
        const lest = v.lesAv();
        const feil = Math.abs(lest - v.sann);
        this.veier = null;
        this.antall++;
        const tall = (x: number) => x.toFixed(1).replace('.', ',');
        this.onMelding(
            feil <= 0.15
                ? `${tall(lest)} bismerpund. Svennen nikker, og husbonden skriver det i gjeldsboka. (${this.antall} båret)`
                : `Du leste ${tall(lest)}, men stanga lå ikke vannrett. Svennen veier på nytt: ${tall(v.sann)} bismerpund. «Se etter at stanga ligger rett, junge.»`
        );
    }

    /** Slipp bunten (om bord i færingen, slått ned). Den går tilbake til stabelen. */
    slipp(): void {
        if (!this.baerer) return;
        this.baerer = false;
        this.vis();
    }

    private vis(): void {
        this.bunt.visible = this.baerer;
        this.gutt.anim.overlay(this.baerer ? 'Baere_Over' : null, 0.3);
    }
}
