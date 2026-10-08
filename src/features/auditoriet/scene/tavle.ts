// Tavla bak kateteret: dagens tema skrevet med kritt.

import * as THREE from 'three';

export function lagTavle(tittel: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 604;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2f4a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * 1024, Math.random() * 604, 120, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'italic 600 54px Georgia, serif';
    ctx.fillText('I dag:', 70, 130);
    // Tittelen brytes over to linjer, og krymper til den får plass.
    const maks = canvas.width - 140;
    let str = 96;
    let linjer: string[] = [];
    for (; str >= 48; str -= 6) {
        ctx.font = `700 ${str}px Georgia, serif`;
        linjer = brytt(ctx, tittel, maks);
        if (linjer.length <= 2 && linjer.every((l) => ctx.measureText(l).width <= maks)) break;
    }
    linjer.slice(0, 2).forEach((l, i) => ctx.fillText(l, 70, 250 + i * str * 1.1));
    ctx.font = 'italic 44px Georgia, serif';
    ctx.fillStyle = '#e2e8f0';
    const dato = new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });
    ctx.fillText(dato, 70, 520);
    // Litt krittstøv i hjørnet.
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(820, 560, 140, 14);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function brytt(ctx: CanvasRenderingContext2D, tekst: string, maks: number): string[] {
    const linjer: string[] = [];
    let linje = '';
    for (const ord of tekst.split(/\s+/)) {
        const prov = linje ? `${linje} ${ord}` : ord;
        if (ctx.measureText(prov).width > maks && linje) {
            linjer.push(linje);
            linje = ord;
        } else linje = prov;
    }
    if (linje) linjer.push(linje);
    return linjer;
}
