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
    ctx.font = '700 96px Georgia, serif';
    ctx.fillText(tittel, 70, 270);
    ctx.font = 'italic 44px Georgia, serif';
    ctx.fillStyle = '#e2e8f0';
    const dato = new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });
    ctx.fillText(dato, 70, 400);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
