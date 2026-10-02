// Strømming per celle (blueprint §9.6).
//
// Byen er delt i celler på ca. 60×60 m. En celle bygges (med `import()` av byggekoden) når
// spilleren kommer innen LOAD_R, og kastes når hen er lenger unna enn DROP_R. Avstanden mellom
// de to hindrer at en celle lastes og kastes om og om igjen ved grensa.
//
// Hver celle har to nivåer:
//  - nær: full geometri med PBR, og kollidere i Rapier
//  - middels: sammenslåtte bokser med flat farge, ingen tekstur (vises bak NEAR_R)
// Tåka skjuler resten, så det trengs ikke et tredje nivå ennå. Bak TAAKE_R er tåka tett, og da
// tegnes ikke cella i det hele tatt (unntatt landemerker med tynnere tåke). Innredningen (`inne`)
// synes bare gjennom dører og glugger, og skjules bak INNE_R.
//
// Kollidere finnes bare for celler som er lastet. Når cellen kastes, fjernes Rapier-kroppene
// og geometrien. Materialene deles og blir liggende (se materials.ts).
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import type { Physics } from './physics';
import type { ColliderSpec } from './meshkit';
import type { Gest } from './gestikk';

export const LOAD_R = 120;
export const DROP_R = 180;
/** Bak denne avstanden vises middels-nivået i stedet for full geometri. */
export const NEAR_R = 70;
/**
 * Bak denne avstanden er tåka (FogExp2 0,021) over 99 % tett: cella tegnes ikke, verken nær
 * eller middels. Celler blir liggende lastet helt ut til DROP_R, og ellers kostet hver av dem et
 * tegnekall i ren tåkefarge. Landemerker (materialer fra `tynnTake`) synes lenger og skjules ikke.
 */
export const TAAKE_R = 110;
/**
 * Innredningen i et hus synes bare gjennom en åpen dør eller glugg. Lenger unna enn dette (fra
 * cella) skjules den: fra Vågen er bua et mørkt hull i tåka.
 */
export const INNE_R = 30;
/**
 * Celler som er delt i halvdeler (så Three kan hoppe over den som er utenfor bildet eller
 * skyggekameraet), tegnes samlet lenger unna enn dette: der ser man uansett begge halvdelene,
 * og delingen dobler bare tegnekallene. Den samlede kaster ikke skygge (kula rundt hele cella
 * traff nesten alltid skyggekameraet), så den brukes bare så langt fra skyggens midte at
 * skyggene ikke når inn i skyggekameraet (32 m bredt, skygger på opptil 8 m).
 */
export const SAMLET_R = 30;

export interface CellContent {
    near: THREE.Object3D;
    mid?: THREE.Object3D;
    /**
     * Innredning (bua, schøtstua): en del av `near` som skjules når cella er lenger unna enn
     * INNE_R. Kaster ikke skygge; veggene skygger allerede for sola inne.
     */
    inne?: THREE.Object3D[];
    /**
     * Samme geometri to ganger: `delt` (halvdelene) nær, `samlet` (én tegning per materiale for
     * hele cella) bak SAMLET_R. Begge ligger i `near`.
     */
    samlet?: { delt: THREE.Object3D[]; samlet: THREE.Object3D };
    colliders: ColliderSpec[];
    /** Det som lever i cella (flammer, røyk, folk). Kalles hvert bilde mens nær-nivået vises. */
    tick?: (t: number, dt: number, ctx: CellCtx) => void;
    /** Ildsteder i verdensrom. Verdenen flytter det felles ildlyset til det nærmeste. */
    ild?: THREE.Vector3[];
    /** Rom man kan gå inn i, i verdensrom. Inne dempes dagslyset. */
    rom?: Rom[];
    /** Folk som går (føttene, oppdatert av `tick`). Verdenen gir de nærmeste en kollider. */
    gaaende?: THREE.Vector3[];
    /** Hvor gutten kan hente bunter tørrfisk, og hvor de skal leveres (bære-aktiviteten). */
    bunter?: { hent: THREE.Vector3; lever: THREE.Vector3 }[];
    /** Folk man kan snakke med (E). */
    snakkbare?: Snakkbar[];
    /** Navngitte steder oppdragene bruker (brønnen, gjeldsboka, porten), i verdensrom. */
    steder?: Sted[];
    /** Rydder det cella eier selv (materialer som ikke hører til Materials). */
    dispose?: () => void;
}

/** Det cellene får vite hvert bilde: hvor kameraet og gutten er, og en munn. */
export interface CellCtx {
    kamera: THREE.Vector3;
    spiller: THREE.Vector3;
    /** En kort replikk fra noen i cella. Med `fra` (føttene til den som snakker) står den over hodet. */
    si: (hvem: string, tekst: string, fra?: THREE.Vector3) => void;
}

/** En figur man kan snakke med. `pos` er føttene og følger figuren. */
export interface Snakkbar {
    /** Drakten (husbonde, svenn, ...). Avgjør hva hen sier. */
    figur: string;
    /** Hvem hen er (personer.ts), for navnet over hodet og oppdragene. Uten: bare tittelen. */
    id?: string;
    pos: THREE.Vector3;
    /** Id i samtalene (samtaler.ts). Uten: en kort replikk. */
    samtale?: string;
    /** Snu seg mot noen og stoppe det hen holder på med (`null`: fortsett). */
    vend: (mot: THREE.Vector3 | null) => void;
    /** Toppen av hodet i verdensrom (skrives i `ut`). Navn, merker og snakkebobler står over den. */
    hode: (ut: THREE.Vector3) => THREE.Vector3;
    /** Gjør en gest (gestikk.ts) mens hen sier noe. */
    gest: (g: Gest, varighet?: number) => void;
    /** Tegnes figuren nå (ikke for langt unna)? */
    synlig: () => boolean;
}

/** Et navngitt sted i en celle: noe gutten kan gjøre noe ved, eller komme fram til. */
export interface Sted {
    id: string;
    pos: THREE.Vector3;
    /** Hvor nær han må være (meter). Standard 1,6. */
    r?: number;
}

/**
 * Et rom man kan gå inn i. `demp` er hvor mye dagslyset dempes inne: 1 i schøtstua, der ilden
 * tar over, mindre i en bu der lyset bare kommer inn gjennom døra.
 */
export interface Rom {
    box: THREE.Box3;
    demp: number;
}

export interface CellDef {
    id: string;
    /** Midten av cella i xz (meter). Avstand måles til nærmeste punkt i rektangelet. */
    center: THREE.Vector2;
    half: THREE.Vector2;
    build: () => Promise<CellContent>;
}

interface LiveCell {
    def: CellDef;
    state: 'loading' | 'live';
    content?: CellContent;
    bodies: RAPIER_NS.Collider[];
    /** Satt når cella ble forlatt mens den lastet: kast den så fort den er ferdig. */
    dropped?: boolean;
    /** Har materialer med tynnere tåke (et landemerke): skjules ikke bak TAAKE_R. */
    landemerke?: boolean;
}

export class CellStreamer {
    readonly root = new THREE.Group();
    private readonly live = new Map<string, LiveCell>();
    private readonly cells: CellDef[];
    private readonly phys: Physics;

    constructor(phys: Physics, cells: CellDef[]) {
        this.phys = phys;
        this.cells = cells;
        this.root.name = 'celler';
    }

    /** Avstand fra punktet til cellas rektangel (0 inne i cella). */
    private dist(def: CellDef, x: number, z: number): number {
        const dx = Math.max(0, Math.abs(x - def.center.x) - def.half.x);
        const dz = Math.max(0, Math.abs(z - def.center.y) - def.half.y);
        return Math.hypot(dx, dz);
    }

    /**
     * Kalles jevnlig med spillerens (eller kameraets) posisjon. Returnerer et løfte som er
     * ferdig når alle celler innen LOAD_R er lastet; ved oppstart ventes det på det. `skygge` er
     * midten av skyggekameraet (gutten), når den ikke er `focus` (fotokameraet i dev).
     */
    update(focus: THREE.Vector3, skygge: THREE.Vector3 = focus): Promise<void> {
        const jobs: Promise<void>[] = [];
        for (const def of this.cells) {
            const d = this.dist(def, focus.x, focus.z);
            const dSkygge = skygge === focus ? d : this.dist(def, skygge.x, skygge.z);
            const cell = this.live.get(def.id);
            if (!cell && d < LOAD_R) jobs.push(this.load(def));
            else if (cell && d > DROP_R) this.drop(cell);
            else if (cell?.state === 'live' && cell.content) {
                const near = d < NEAR_R || !cell.content.mid;
                const sett = d < TAAKE_R || !!cell.landemerke;
                cell.content.near.visible = near && sett;
                if (cell.content.mid) cell.content.mid.visible = !near && sett;
                for (const o of cell.content.inne ?? []) o.visible = d < INNE_R;
                const sam = cell.content.samlet;
                if (sam) {
                    const delt = Math.min(d, dSkygge) < SAMLET_R;
                    for (const o of sam.delt) o.visible = delt;
                    sam.samlet.visible = !delt;
                }
            }
        }
        return Promise.all(jobs).then(() => undefined);
    }

    private async load(def: CellDef): Promise<void> {
        const cell: LiveCell = { def, state: 'loading', bodies: [] };
        this.live.set(def.id, cell);
        const content = await def.build();
        if (cell.dropped) {
            content.dispose?.();
            disposeObject(content.near);
            if (content.mid) disposeObject(content.mid);
            return;
        }
        cell.content = content;
        cell.state = 'live';
        content.near.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.Material | undefined;
            if (m?.userData.tynnTake) cell.landemerke = true;
        });
        for (const spec of content.colliders) {
            const c = spec.kind === 'box'
                ? this.phys.addBox(spec.center, spec.half, spec.rot, spec.prop)
                : this.phys.addHull(spec.points, spec.prop);
            if (c) cell.bodies.push(c);
        }
        this.root.add(content.near);
        // Til første `update`: delt nær, samlet skjult.
        if (content.samlet) content.samlet.samlet.visible = false;
        if (content.mid) {
            content.mid.visible = false;
            this.root.add(content.mid);
        }
    }

    private drop(cell: LiveCell): void {
        this.live.delete(cell.def.id);
        if (cell.state === 'loading') {
            cell.dropped = true;
            return;
        }
        for (const b of cell.bodies) this.phys.world.removeCollider(b, false);
        if (cell.content) {
            cell.content.dispose?.();
            this.root.remove(cell.content.near);
            disposeObject(cell.content.near);
            if (cell.content.mid) {
                this.root.remove(cell.content.mid);
                disposeObject(cell.content.mid);
            }
        }
    }

    /** Kjører det som lever i cellene som vises nær. */
    tick(t: number, dt: number, ctx: CellCtx): void {
        for (const cell of this.live.values()) {
            if (cell.content?.tick && cell.content.near.visible) cell.content.tick(t, dt, ctx);
        }
    }

    /** Ildstedene og rommene i cellene som er lastet. */
    *ildsteder(): Generator<THREE.Vector3> {
        for (const cell of this.live.values()) yield* cell.content?.ild ?? [];
    }

    *rom(): Generator<Rom> {
        for (const cell of this.live.values()) yield* cell.content?.rom ?? [];
    }

    *gaaende(): Generator<THREE.Vector3> {
        for (const cell of this.live.values()) if (cell.content?.near.visible) yield* cell.content.gaaende ?? [];
    }

    *bunter(): Generator<{ hent: THREE.Vector3; lever: THREE.Vector3 }> {
        for (const cell of this.live.values()) yield* cell.content?.bunter ?? [];
    }

    *steder(): Generator<Sted> {
        for (const cell of this.live.values()) yield* cell.content?.steder ?? [];
    }

    *snakkbare(): Generator<Snakkbar> {
        for (const cell of this.live.values()) if (cell.content?.near.visible) yield* cell.content.snakkbare ?? [];
    }

    /** Til målerne: hvor mange celler er lastet nå. */
    get liveCount(): number {
        return this.live.size;
    }

    dispose(): void {
        for (const cell of [...this.live.values()]) this.drop(cell);
    }
}

/** Kaster geometrien i et tre. Materialene eies av Materials og røres ikke. */
export function disposeObject(o: THREE.Object3D): void {
    o.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
    });
}
