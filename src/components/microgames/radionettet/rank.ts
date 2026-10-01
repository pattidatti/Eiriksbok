import * as THREE from 'three';

// Gradsmerket over en sammenslått enhet: to vinkler for to like på samme rute, stjerne for veteran.
// `copies` 0 = kompaniet eleven styrer selv (skilt med tasten).
// Tegnet én gang på canvas og delt av alle enhetene.

const cache = new Map<number, THREE.SpriteMaterial>();

function draw(copies: number) {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    const vet = copies >= 3;
    if (copies === 0) {
        // Kompaniet: et hvitt skilt med tasten (1), så eleven ser hvem som kan flyttes.
        c.beginPath();
        c.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
        c.fillStyle = '#f4eedb';
        c.fill();
        c.lineWidth = 9;
        c.strokeStyle = '#1f2318';
        c.stroke();
        c.fillStyle = '#1f2318';
        c.font = 'bold 76px Inter, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('1', S / 2, S / 2 + 4);
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        return new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false });
    }
    // Skiltet: mørk oliven med gul kant, som et merke på uniformen.
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
    c.fillStyle = vet ? '#5a1e14' : '#2f3420';
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = '#e8c046';
    c.stroke();
    c.fillStyle = '#f2d060';
    c.strokeStyle = '#1a1a10';
    c.lineWidth = 3;
    if (vet) {
        // Stjerna.
        c.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 ? 18 : 42;
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            c.lineTo(S / 2 + Math.cos(a) * r, S / 2 + 4 + Math.sin(a) * r);
        }
        c.closePath();
        c.fill();
        c.stroke();
    } else {
        // To vinkler.
        for (let i = 0; i < 2; i++) {
            const y = 44 + i * 26;
            c.beginPath();
            c.moveTo(30, y);
            c.lineTo(64, y + 20);
            c.lineTo(98, y);
            c.lineTo(98, y + 14);
            c.lineTo(64, y + 34);
            c.lineTo(30, y + 14);
            c.closePath();
            c.fill();
            c.stroke();
        }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.SpriteMaterial({ map: tex, depthTest: false, toneMapped: false });
}

export function rankMaterial(copies: number) {
    const k = Math.max(0, Math.min(3, copies));
    let m = cache.get(k);
    if (!m) cache.set(k, (m = draw(k)));
    return m;
}
