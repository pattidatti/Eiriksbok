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

const NAER = 1.5;

export class Baering {
    baerer = false;
    antall = 0;
    prompt: string | null = null;
    private readonly world: BryggenWorld;
    private readonly gutt: Character;
    private readonly bunt: THREE.Object3D;
    private maal: { hent: THREE.Vector3; lever: THREE.Vector3 } | null = null;

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
        this.antall++;
        if (this.antall === 1) return 'Bunten ligger ved bismeren. Der veier svennen den, og husbonden skriver vekta i gjeldsboka.';
        if (this.antall % 5 === 0) return `${this.antall} bunter båret. Skutedrengen bærer slik hele dagen når jektene er kommet.`;
        return null;
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
