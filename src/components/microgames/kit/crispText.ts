import * as THREE from 'three';

// Skarp tekst i 3D: skilt, prislapper, etiketter på et kartbord.
//
// En canvas-tekstur i «logisk» størrelse (f.eks. 256 x 72) ser grei ut i
// forhåndsvisningen, men strekkes ut når skiltet er nær kameraet og blir uklar på
// skjermer med høy pikseltetthet (eier om Løp med lønna, 2026-09-26: «teksten
// ingame har litt lav oppløsning og er vanskelig å lese»). Denne hjelperen tegner
// i logiske mål, men lagrer 2-3 ganger så mange piksler, og slår på mipmaps og
// anisotropi så teksten også holder seg på skrå.
//
// Bruk:
//   const board = crispCanvas(384, 160);
//   board.draw((ctx, w, h) => { ctx.font = `900 64px ${FONT}`; ctx.fillText('BAKER', w / 2, h / 2); });
//   <sprite><spriteMaterial map={board.tex} /></sprite>

/** Hvor mange ganger flere piksler enn de logiske målene. */
export function crispScale() {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return Math.min(3, Math.max(2, Math.ceil(dpr * 1.5)));
}

export interface CrispCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    tex: THREE.CanvasTexture;
    /** Logiske mål - tegn som om canvasen var så stor. */
    w: number;
    h: number;
    /** Tøm, tegn på nytt i logiske mål, og last opp teksturen. */
    draw: (paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => void;
}

export function crispCanvas(w: number, h: number): CrispCanvas {
    const s = crispScale();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * s);
    canvas.height = Math.round(h * s);
    const ctx = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    const draw = (paint: (c: CanvasRenderingContext2D, w: number, h: number) => void) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(s, 0, 0, s, 0, 0);
        paint(ctx, w, h);
        tex.needsUpdate = true;
    };
    return { canvas, ctx, tex, w, h, draw };
}
