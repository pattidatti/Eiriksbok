// Bære tørrfisk (blueprint §7.1, «Heise og bære tørrfisk»): gutten tar en bunt fra stabelen på
// kaia, bærer den opp gårdsrommet og inn i bua, og legger den ved bismeren. Med en bunt i armene
// går han saktere, kan ikke springe, hoppe eller slåss. Husbonden sendte ham hit (samtaler.ts).
//
// En bunt er her omtrent en våg, «det en gutt kan bære» (ca. 18 kg). Hvor stor en våg var i
// 1420-årene, er ikke slått fast [U] (§4.3).
import * as THREE from 'three';
import type { BryggenWorld } from '../bygg/bryggen';
import { botteMesh, buntMesh } from '../bygg/folk';
import type { Character } from '../motor/character';
import { BismerSpill } from './bismer';
import { SPOR } from '../bygg/samtaler';

/** Hvor nær stabelen eller bismeren gutten må stå (m). Merket på bakken (maalmerke.ts) er like stort. */
export const NAER = 1.5;

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
    /** En bunt er veid (oppdraget «Fisken bærer seg ikke selv» teller). */
    onVeid: () => void = () => undefined;
    /** Vannbøtta gutten bærer for oppdraget «Vann til gryta». */
    private readonly botte: THREE.Object3D;
    private harBotte = false;
    /** Noe annet enn en bunt i armene (en kornsekk i kapittel 2, kap2.ts), eller null. */
    private annet: THREE.Object3D | null = null;
    private trekk = 0.37;
    /** Farten med en bunt i armene, del av vanlig fart. Styrke-ferdigheten løfter den (rpg.ts). */
    fart = 0.42;
    /** Hvor langt fra riktig vekt avlesningen kan være og fortsatt godtas (bismerpund). Regning løfter den. */
    slark = 0.15;
    /** Ekstra demping på bismerstanga, så den roer seg fortere (regning, rpg.ts). */
    roligere = 0;
    /** En bunt er lest av: riktig eller ikke (rpg.ts gir øvelse i regning). */
    onLest: (riktig: boolean) => void = () => undefined;

    constructor(world: BryggenWorld, gutt: Character) {
        this.world = world;
        this.gutt = gutt;
        // Samme plass foran brystet som hos skutedrengen, skalert til gutten.
        this.bunt = buntMesh(world.materials);
        this.bunt.position.set(0, 0.86, 0.27);
        this.bunt.scale.setScalar(0.92);
        this.bunt.visible = false;
        gutt.anim.root.add(this.bunt);
        this.botte = botteMesh(world.materials);
        this.botte.position.set(0, 0.8, 0.26);
        this.botte.scale.setScalar(0.9);
        this.botte.visible = false;
        gutt.anim.root.add(this.botte);
    }

    /** Viser det gutten bærer for oppdragene (bøtta foran seg med begge hender). */
    visTing(ting: ReadonlySet<string>): void {
        this.harBotte = ting.has('botte');
        this.vis();
    }

    /** Finner hva gutten kan gjøre der han står. Gir teksten til «E: …», eller null. */
    oppdater(): string | null {
        const p = this.gutt.pos;
        this.prompt = null;
        this.maal = null;
        // Med en sekk i armene er det systemet som ga den, som vet hvor den skal.
        if (this.annet) return null;
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
        // Fra tredje bunt vil svennen at gutten skal lese av for lite på fisken til nordlendingen [S].
        const juks = this.antall >= 2;
        this.veier = new BismerSpill(Math.round((2.5 + this.trekk * 1.1) * 10) / 10, juks, this.roligere);
        if (this.antall === 0) return 'Bunten henger i kroken på bismeren. Flytt hanken med A og D til stanga ligger vannrett, og les av merket med E.';
        if (this.antall === 2) return 'Svennen hvisker: «Denne er nordlendingens fisk. Si et halvt pund mindre enn merket viser. Husbonden vil ha det slik.»';
        return null;
    }

    /**
     * Mens veiingen pågår: `styr` flytter hanken, `les` leser av ærlig, `jukse` leser av et halvt
     * pund for lite (bare når svennen har bedt om det). Jo oftere gutten jukser, jo større er
     * sjansen for at fiskeren merker det (risiko-måleren i §7.1).
     */
    styr(dt: number, styr: number, les: boolean, jukse = false): void {
        const v = this.veier;
        if (!v) return;
        v.step(dt, styr);
        if (jukse && v.juks) {
            const lest = Math.max(0, v.lesAv() - 0.5);
            this.veier = null;
            this.antall++;
            SPOR.baret++;
            SPOR.juks++;
            this.onVeid();
            this.trekk = (this.trekk * 9301 + 0.4927) % 1;
            const tatt = !SPOR.tatt && this.trekk < Math.min(0.85, 0.2 * SPOR.juks);
            if (tatt) SPOR.tatt = true;
            const tall = lest.toFixed(1).replace('.', ',');
            this.onMelding(
                tatt
                    ? `Du sier ${tall} bismerpund. Fiskeren står i døra og ser på deg. Han sier ingenting, men han så det.`
                    : `Du sier ${tall} bismerpund. Svennen nikker fornøyd. Fiskeren får betalt for mindre fisk enn han leverte.`
            );
            return;
        }
        if (!les) return;
        const lest = v.lesAv();
        const feil = Math.abs(lest - v.sann);
        this.veier = null;
        this.antall++;
        SPOR.baret++;
        this.onVeid();
        this.onLest(feil <= this.slark);
        const tall = (x: number) => x.toFixed(1).replace('.', ',');
        this.onMelding(
            feil <= this.slark
                ? `${tall(lest)} bismerpund. Svennen nikker, og husbonden skriver det i gjeldsboka. (${this.antall} båret)`
                : `Du leste ${tall(lest)}, men stanga lå ikke vannrett. Svennen veier på nytt: ${tall(v.sann)} bismerpund. «Se etter at stanga ligger rett, junge.»`
        );
    }

    /** Slipp bunten (om bord i færingen, slått ned). Den går tilbake til stabelen. */
    slipp(): void {
        if (!this.baerer) return;
        this.baerTing(null);
    }

    /**
     * Bær noe annet enn en bunt tørrfisk (kornsekken i kapittel 2): samme fart og samme regler (ingen
     * sprint, hopp eller slag). `null` legger det fra seg. Systemet som gir tingen, eier den.
     */
    baerTing(t: THREE.Object3D | null): void {
        if (this.annet) this.annet.removeFromParent();
        this.annet = t;
        if (t) {
            t.position.set(0, 0.86, 0.27);
            this.gutt.anim.root.add(t);
        }
        this.baerer = !!t;
        this.vis();
    }

    /** Bærer gutten noe som ikke er en bunt (`baerTing`)? */
    get baererTing(): boolean {
        return !!this.annet;
    }

    private vis(): void {
        this.bunt.visible = this.baerer && !this.annet;
        this.botte.visible = this.harBotte && !this.baerer;
        this.gutt.anim.overlay(this.baerer || this.harBotte ? 'Baere_Over' : null, 0.3);
    }
}
