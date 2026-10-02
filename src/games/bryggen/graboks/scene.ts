// Gråboksen: en grå brygge med to gårdsrekker og et gårdsrom (smug) mellom, en tredje
// rekke med et ekstra trangt smug, svalgang med rekkverk, trapp, kasser å klatre på,
// kai og vann. Alt er grått med et 1-meters rutenett, så skala og avstand kan leses.
//
// Målene er omtrentlige og valgt for å teste følelsen, ikke for å være Bryggen. Det
// historiske kartet ligger i blueprintet.
import * as THREE from 'three';
import type { Physics } from '../motor/physics';
import { WATER_Y } from '../motor/boat';

export interface GrayboxLayout {
    playerStart: THREE.Vector3;
    playerYaw: number;
    enemyStart: THREE.Vector3;
    boatStart: THREE.Vector3;
    boatYaw: number;
    /** Hvor spilleren settes om hen faller i vannet. */
    rescue: THREE.Vector3;
}

/** Grått materiale med rutenett i verdensrommet (1 m tynne linjer, 4 m tykkere). */
export function grayMat(color: number, roughness = 0.92): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    m.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vGridPos;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGridPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>
varying vec3 vGridPos;
float gridLine(vec3 p, float cell, float width) {
    vec3 g = abs(fract(p / cell - 0.5) - 0.5) / (fwidth(p / cell) + 1e-4);
    float l = min(min(g.x, g.y), g.z);
    return 1.0 - clamp(l / width, 0.0, 1.0);
}`)
            .replace('#include <color_fragment>', `#include <color_fragment>
float g1 = gridLine(vGridPos, 1.0, 1.0);
float g4 = gridLine(vGridPos, 4.0, 1.6);
diffuseColor.rgb *= 1.0 - 0.10 * g1 - 0.14 * g4;`);
    };
    m.customProgramCacheKey = () => 'graybox-grid';
    return m;
}

export function buildGraybox(scene: THREE.Scene, phys: Physics): GrayboxLayout {
    const M = {
        ground: grayMat(0x8f9294),
        kai: grayMat(0x7f8285),
        wallA: grayMat(0xa3a6a8),
        wallB: grayMat(0x9a9da0),
        roof: grayMat(0x6d7174),
        wood: grayMat(0x85888a),
        crate: grayMat(0xa9aaa5),
        dark: new THREE.MeshStandardMaterial({ color: 0x3c4044, roughness: 1 }),
        far: new THREE.MeshStandardMaterial({ color: 0x7d868e, roughness: 1 }),
    };

    const box = (
        cx: number, cy: number, cz: number,
        sx: number, sy: number, sz: number,
        mat: THREE.Material,
        opts: { collide?: boolean; shadow?: boolean; rot?: THREE.Euler; prop?: boolean } = {}
    ) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        mesh.position.set(cx, cy, cz);
        if (opts.rot) mesh.rotation.copy(opts.rot);
        mesh.castShadow = opts.shadow ?? true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        if (opts.collide ?? true) phys.addBox(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(sx / 2, sy / 2, sz / 2), opts.rot, opts.prop);
        return mesh;
    };

    // ── Vann og kai ──
    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(220, 140),
        new THREE.MeshStandardMaterial({ color: 0x47545c, roughness: 0.25, metalness: 0.1 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, WATER_Y, -50);
    water.receiveShadow = true;
    scene.add(water);
    // Havbunn under vannflaten, så kameraet aldri ser «under» verden.
    box(0, WATER_Y - 3, -50, 220, 0.5, 140, M.dark, { collide: false, shadow: false });

    // Kaia: plankedekk på bolverk, overkant i y = 0.
    box(1, -0.7, 2.25, 44, 1.4, 4.5, M.kai, { shadow: false });
    for (let x = -20; x <= 22; x += 2.2) {
        box(x, WATER_Y - 0.4, 0.1, 0.32, 2.4, 0.32, M.wood, { collide: false });
    }
    // Pullerter langs kaikanten.
    for (const x of [-12, -6, 3, 10, 17]) box(x, 0.25, 0.45, 0.35, 0.5, 0.35, M.wood, { prop: true });

    // Bakken bak kaia (gårdsrommene og Øvregaten-siden).
    box(1, -0.7, 26, 44, 1.4, 43, M.ground, { shadow: false });

    // ── Gårdsrekker: lange hus med gavlen mot sjøen ──
    const row = (x0: number, x1: number, z0: number, z1: number, mat: THREE.Material, eaves = 5.4, ridge = 8.2) => {
        const w = x1 - x0;
        const cx = (x0 + x1) / 2;
        // Hver rekke deles opp i hus på ~7 m, med en liten forskyvning i høyde,
        // så gavlrekka ikke blir én flat vegg.
        const n = Math.max(1, Math.round((z1 - z0) / 7));
        const len = (z1 - z0) / n;
        for (let i = 0; i < n; i++) {
            const zc = z0 + len * (i + 0.5);
            const e = eaves + ((i * 37) % 5) * 0.12;
            box(cx, e / 2, zc, w, e, len - 0.04, mat);
            const rise = ridge - eaves;
            const slope = Math.atan2(rise, w / 2);
            const panel = Math.hypot(rise, w / 2) + 0.35;
            for (const side of [-1, 1]) {
                box(cx + (side * w) / 4, e + rise / 2, zc, panel, 0.18, len + 0.3, M.roof, {
                    rot: new THREE.Euler(0, 0, -side * slope),
                });
            }
            // Gavltrekant mot sjøen (bare den første i rekka) og mellom husene.
            const tri = new THREE.Shape();
            tri.moveTo(-w / 2, 0);
            tri.lineTo(w / 2, 0);
            tri.lineTo(0, rise);
            tri.closePath();
            const gable = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat);
            gable.position.set(cx, e, zc - len / 2 + 0.01);
            gable.rotation.y = Math.PI;
            gable.castShadow = true;
            scene.add(gable);
            const back = gable.clone();
            back.position.z = zc + len / 2 - 0.01;
            back.rotation.y = 0;
            scene.add(back);
            // Mørke dører og luker på gavlen, så skalaen leses (dør ≈ 1,9 m).
            box(cx, 0.95, zc - len / 2 - 0.02, 1.1, 1.9, 0.06, M.dark, { collide: false, shadow: false });
            box(cx, 3.8, zc - len / 2 - 0.02, 1.0, 1.2, 0.06, M.dark, { collide: false, shadow: false });
        }
    };

    // Rad A (vest) og B (øst) med gårdsrommet imellom: 2,8 m bredt.
    row(-8.5, -1.6, 5, 40, M.wallA);
    row(1.2, 7.6, 5, 40, M.wallB);
    // Rad C og det ekstra trange smuget mellom B og C: 1,4 m. Her skal kameraet prøves.
    row(9.0, 15.5, 5, 30, M.wallA, 5.0, 7.6);
    // Endevegg bak, så gårdsrommet ender i et bakhus.
    box(-0.2, 2.5, 41.5, 3.0, 5, 3, M.wallB);
    box(8.3, 2.5, 41.5, 1.6, 5, 3, M.wallB);

    // ── Svalgang langs rad A, ut i gårdsrommet ──
    const SV_Y = 2.7;
    const SV_X0 = -1.6;
    const SV_X1 = -0.6;
    const SV_Z0 = 8;
    const SV_Z1 = 34;
    box((SV_X0 + SV_X1) / 2, SV_Y - 0.06, (SV_Z0 + SV_Z1) / 2, SV_X1 - SV_X0, 0.12, SV_Z1 - SV_Z0, M.wood);
    // Rekkverk: håndlist + spiler. Kollideren er én tynn plate opp til 1 m.
    box(SV_X1 - 0.04, SV_Y + 0.96, (SV_Z0 + SV_Z1) / 2, 0.08, 0.08, SV_Z1 - SV_Z0, M.wood, { collide: false });
    phys.addBox(new THREE.Vector3(SV_X1 - 0.04, SV_Y + 0.5, (SV_Z0 + SV_Z1) / 2), new THREE.Vector3(0.04, 0.5, (SV_Z1 - SV_Z0) / 2), undefined, true);
    for (let z = SV_Z0 + 0.4; z < SV_Z1; z += 0.55) {
        box(SV_X1 - 0.04, SV_Y + 0.48, z, 0.05, 0.92, 0.05, M.wood, { collide: false, shadow: false });
    }
    // Endevern i sør.
    box((SV_X0 + SV_X1) / 2, SV_Y + 0.5, SV_Z0 + 0.04, SV_X1 - SV_X0, 1.0, 0.08, M.wood, { prop: true });
    // Stolper ned til bakken.
    for (let z = SV_Z0 + 0.5; z < SV_Z1; z += 3.2) {
        box(SV_X1 - 0.08, SV_Y / 2 - 0.06, z, 0.16, SV_Y - 0.12, 0.16, M.wood, { prop: true });
    }
    // Dører inn fra svalgangen.
    for (let z = SV_Z0 + 2; z < SV_Z1 - 1; z += 4.4) {
        box(SV_X0 + 0.02, SV_Y + 0.95, z, 0.06, 1.9, 0.95, M.dark, { collide: false, shadow: false });
    }

    // ── Trapp opp til svalgangen (glatt rampe som kolliderer, trinn som vises) ──
    const ST_Z0 = 38.6; // nederst
    const ST_Z1 = SV_Z1; // øverst
    const run = ST_Z0 - ST_Z1;
    const angle = Math.atan2(SV_Y, run);
    const rampLen = Math.hypot(SV_Y, run);
    phys.addBox(
        new THREE.Vector3((SV_X0 + SV_X1) / 2, SV_Y / 2 - 0.08, (ST_Z0 + ST_Z1) / 2),
        new THREE.Vector3((SV_X1 - SV_X0) / 2, 0.08, rampLen / 2),
        new THREE.Euler(angle, 0, 0)
    );
    const steps = 13;
    for (let i = 0; i < steps; i++) {
        const h = (SV_Y / steps) * (i + 1);
        const z = ST_Z0 - (run / steps) * (i + 0.5);
        box((SV_X0 + SV_X1) / 2, h - 0.04, z, SV_X1 - SV_X0, 0.08, run / steps + 0.02, M.wood, { collide: false });
    }
    // Vange (sidevange) på trappa mot gårdsrommet.
    box(SV_X1 - 0.04, SV_Y / 2 + 0.45, (ST_Z0 + ST_Z1) / 2, 0.08, 0.1, rampLen, M.wood, {
        collide: false,
        rot: new THREE.Euler(angle, 0, 0),
    });

    // ── Kasser og tønner: noe å klatre på ──
    box(0.05, 0.62, 18.6, 1.1, 1.25, 1.2, M.crate); // stabel ved svalgangen (opp på rekkverket)
    box(0.55, 0.42, 21.0, 0.8, 0.84, 0.8, M.crate); // lav kasse (hvelv)
    for (const [x, z] of [[-14, 2.2], [-13.2, 2.6], [14, 2.4], [5.2, 2.8], [6, 2.2]] as const) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.36, 0.9, 10), M.crate);
        barrel.position.set(x, 0.45, z);
        barrel.castShadow = true;
        scene.add(barrel);
        phys.addBox(new THREE.Vector3(x, 0.45, z), new THREE.Vector3(0.33, 0.45, 0.33), undefined, true);
    }
    // Stabel med tørrfiskbunter (grå blokker) på kaia.
    box(-9.5, 0.55, 3.0, 2.2, 1.1, 1.4, M.crate);

    // ── Fjerne silhuetter: Holmen i vest og Stranden på den andre siden av Vågen ──
    const far = (x: number, z: number, w: number, h: number, d: number) =>
        box(x, h / 2 - 1, z, w, h, d, M.far, { collide: false, shadow: false });
    far(-42, -18, 16, 14, 10); // Håkonshallen-blokk (bare en form i tåka)
    far(-36, -6, 7, 20, 7); // tårnet
    for (let i = 0; i < 12; i++) far(-30 + i * 6, -52 - (i % 3) * 2, 5, 6 + (i % 4), 6);

    // ── Usynlige grenser ──
    const wall = (cx: number, cz: number, hx: number, hz: number) =>
        phys.addBox(new THREE.Vector3(cx, 0, cz), new THREE.Vector3(hx, 12, hz));
    wall(-21.5, 24, 0.5, 30); // vest langs land
    wall(23.5, 24, 0.5, 30); // øst langs land
    wall(1, 48.5, 24, 0.5); // nord
    wall(-60, -30, 0.5, 40); // vannkant vest
    wall(60, -30, 0.5, 40); // vannkant øst
    wall(0, -68, 60, 0.5); // vannkant sør

    return {
        playerStart: new THREE.Vector3(-0.2, 0, 2.6),
        playerYaw: 0,
        enemyStart: new THREE.Vector3(-0.1, 0, 27),
        boatStart: new THREE.Vector3(-5, WATER_Y, -1.6),
        boatYaw: Math.PI / 2,
        rescue: new THREE.Vector3(-3, 0, 2.5),
    };
}
