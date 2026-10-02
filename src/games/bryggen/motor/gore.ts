// Blod: dråper som spruter i slagretningen, faller og blir liggende som flekker på
// plankene. Alt er to InstancedMesh-er, så det koster nesten ingenting på Chromebook.
import * as THREE from 'three';

const MAX_DROPS = 260;
const MAX_STAINS = 140;

interface Drop {
    p: THREE.Vector3;
    v: THREE.Vector3;
    floor: number;
    life: number;
    size: number;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

export class Gore {
    readonly group = new THREE.Group();
    private readonly drops: THREE.InstancedMesh;
    private readonly stains: THREE.InstancedMesh;
    private live: Drop[] = [];
    private stainIdx = 0;
    private stainCount = 0;

    constructor() {
        this.drops = new THREE.InstancedMesh(
            new THREE.IcosahedronGeometry(0.025, 0),
            new THREE.MeshStandardMaterial({ color: 0x5a0a0a, roughness: 0.35 }),
            MAX_DROPS
        );
        this.drops.count = 0;
        this.drops.frustumCulled = false;
        const stainGeo = new THREE.CircleGeometry(1, 9);
        stainGeo.rotateX(-Math.PI / 2);
        this.stains = new THREE.InstancedMesh(
            stainGeo,
            new THREE.MeshStandardMaterial({ color: 0x3a0606, roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -2 }),
            MAX_STAINS
        );
        this.stains.count = 0;
        this.stains.frustumCulled = false;
        this.group.add(this.drops, this.stains);
    }

    /** `floorY` er høyden dråpene lander på (føttene til den som blør). */
    spray(at: THREE.Vector3, dir: THREE.Vector3, amount: number, floorY: number): void {
        const n = Math.round(10 + amount * 22);
        for (let i = 0; i < n && this.live.length < MAX_DROPS; i++) {
            const spread = new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 1.4 + 0.2, (Math.random() - 0.5) * 1.6);
            const v = dir.clone().multiplyScalar(1.5 + Math.random() * 2.8 * (0.5 + amount)).add(spread);
            this.live.push({ p: at.clone(), v, floor: floorY, life: 2.5, size: 0.6 + Math.random() * 1.2 });
        }
    }

    update(dt: number): void {
        let w = 0;
        for (const d of this.live) {
            d.v.y -= 14 * dt;
            d.p.addScaledVector(d.v, dt);
            d.life -= dt;
            if (d.p.y <= d.floor + 0.01) {
                this.stain(d.p.x, d.floor, d.p.z, 0.025 + d.size * 0.03);
                continue;
            }
            if (d.life <= 0) continue;
            this.live[w++] = d;
            _s.setScalar(d.size);
            _m.compose(d.p, _q.identity(), _s);
            this.drops.setMatrixAt(w - 1, _m);
        }
        this.live.length = w;
        this.drops.count = w;
        this.drops.instanceMatrix.needsUpdate = true;
    }

    private stain(x: number, y: number, z: number, r: number): void {
        _q.setFromAxisAngle(_up, Math.random() * Math.PI);
        _s.set(r * (0.7 + Math.random() * 0.8), 1, r);
        _m.compose(new THREE.Vector3(x, y + 0.012 + Math.random() * 0.002, z), _q, _s);
        this.stains.setMatrixAt(this.stainIdx, _m);
        this.stainIdx = (this.stainIdx + 1) % MAX_STAINS;
        this.stainCount = Math.min(MAX_STAINS, this.stainCount + 1);
        this.stains.count = this.stainCount;
        this.stains.instanceMatrix.needsUpdate = true;
    }

    clearStains(): void {
        this.stainCount = 0;
        this.stainIdx = 0;
        this.stains.count = 0;
    }
}
