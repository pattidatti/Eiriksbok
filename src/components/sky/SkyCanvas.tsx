import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import type { SkyWorld, StarStatus } from '../../types/sky';
import { SKY_HEIGHT, SKY_WIDTH, skyStatusText } from '../../utils/skyModel';
import { mulberry32 } from '../../utils/reviewScheduler';

// Canvas-rendering av stjernehimmelen: én rAF-løkke, sprite-basert glød
// (ingen shadowBlur per stjerne - Chromebook 1366x768 er baseline).

export interface SkyCanvasHandle {
    focusStar: (index: number) => void;
    focusRegion: (subjectId: string) => void;
    resetView: () => void;
}

interface SkyCanvasProps {
    world: SkyWorld;
    focusSubjectId: string | null;
    reducedMotion: boolean;
    onStarClick: (index: number) => void;
    // Nylig tent stjerne - token øker per tenning så samme stjerne kan blusse igjen
    flare: { index: number; token: number } | null;
    // Fullført stjernebilde - gylne linjer + ekspanderende ring
    celebrate: { constellationId: string; token: number } | null;
}

interface Camera {
    x: number;
    y: number;
    scale: number;
}

const SUBJECT_TINTS: Record<string, string> = {
    historie: '#f59e0b',
    norsk: '#fb7185',
    krle: '#a78bfa',
    samfunnskunnskap: '#38bdf8',
    musikk: '#34d399',
};
const FALLBACK_TINT = '#818cf8';

const STATUS_SPRITES: Record<Exclude<StarStatus, 'unlit'>, { core: string; glow: string }> = {
    lit: { core: '#fff9e8', glow: '#ffd98a' },
    flickering: { core: '#fff3d6', glow: '#fbbf24' },
    fading: { core: '#dbe4f0', glow: '#7c8aa5' },
};

// Bakgrunnsstøv: bittesmå, ikke-interaktive stjerner som gir himmelen dybde
const DUST: Array<{ x: number; y: number; r: number; phase: number }> = (() => {
    const rng = mulberry32(987654321);
    return Array.from({ length: 260 }, () => ({
        x: -200 + rng() * (SKY_WIDTH + 400),
        y: -150 + rng() * (SKY_HEIGHT + 300),
        r: 0.5 + rng() * 1.1,
        phase: rng() * Math.PI * 2,
    }));
})();

const subjectTint = (subjectId: string): string => SUBJECT_TINTS[subjectId] || FALLBACK_TINT;

const hexToRgba = (hex: string, alpha: number): string => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// Forhåndstegnet glød-sprite: hvit kjerne + farget glød som tones ut
const makeSprite = (core: string, glow: string): HTMLCanvasElement => {
    const size = 96;
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const ctx = sprite.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.12, core);
    gradient.addColorStop(0.35, hexToRgba(glow, 0.5));
    gradient.addColorStop(1, hexToRgba(glow, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return sprite;
};

export const SkyCanvas = forwardRef<SkyCanvasHandle, SkyCanvasProps>(
    ({ world, focusSubjectId, reducedMotion, onStarClick, flare, celebrate }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 0.5 });
        const targetRef = useRef<Camera | null>(null);
        const fitScaleRef = useRef(0.5);
        const worldRef = useRef(world);
        const focusRef = useRef(focusSubjectId);
        const reducedRef = useRef(reducedMotion);
        const flareRef = useRef<{ index: number; start: number } | null>(null);
        const celebrateRef = useRef<{ id: string; start: number } | null>(null);
        const meteorRef = useRef<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            start: number;
        } | null>(null);
        const meteorNextRef = useRef(0);
        const pointersRef = useRef(new Map<number, { x: number; y: number }>());
        const pinchRef = useRef<{ dist: number; mx: number; my: number } | null>(null);
        const hoverRef = useRef<number | null>(null);
        const pointerRef = useRef<{
            startX: number;
            startY: number;
            camX: number;
            camY: number;
            down: boolean;
            dragging: boolean;
        }>({ startX: 0, startY: 0, camX: 0, camY: 0, down: false, dragging: false });
        const spriteCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
        const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(
            null
        );

        useEffect(() => {
            worldRef.current = world;
            focusRef.current = focusSubjectId;
            reducedRef.current = reducedMotion;
        }, [world, focusSubjectId, reducedMotion]);

        const getSprite = (key: Exclude<StarStatus, 'unlit'>): HTMLCanvasElement => {
            let sprite = spriteCache.current.get(key);
            if (!sprite) {
                sprite = makeSprite(STATUS_SPRITES[key].core, STATUS_SPRITES[key].glow);
                spriteCache.current.set(key, sprite);
            }
            return sprite;
        };

        const viewSize = () => {
            const el = containerRef.current;
            return { cw: el?.clientWidth ?? 1, ch: el?.clientHeight ?? 1 };
        };

        const computeFit = useCallback(() => {
            const { cw, ch } = viewSize();
            const fit = Math.min(cw / worldRef.current.width, ch / worldRef.current.height);
            fitScaleRef.current = fit;
            return fit;
        }, []);

        const centerOn = useCallback((wx: number, wy: number, scale: number): Camera => {
            const { cw, ch } = viewSize();
            return { x: wx - cw / (2 * scale), y: wy - ch / (2 * scale), scale };
        }, []);

        const resetView = useCallback(() => {
            const fit = computeFit();
            targetRef.current = centerOn(
                worldRef.current.width / 2,
                worldRef.current.height / 2,
                fit
            );
        }, [computeFit, centerOn]);

        useImperativeHandle(
            ref,
            () => ({
                focusStar: (index: number) => {
                    const star = worldRef.current.stars[index];
                    if (!star) return;
                    const scale = Math.max(cameraRef.current.scale, fitScaleRef.current * 2.4);
                    targetRef.current = centerOn(star.x, star.y, scale);
                },
                focusRegion: (subjectId: string) => {
                    const region = worldRef.current.regions.find(
                        (r) => r.subjectId === subjectId
                    );
                    if (!region) return;
                    const { cw, ch } = viewSize();
                    const scale = Math.max(
                        fitScaleRef.current,
                        Math.min(cw, ch) / (region.radius * 2.4)
                    );
                    targetRef.current = centerOn(region.cx, region.cy, scale);
                },
                resetView,
            }),
            [centerOn, resetView]
        );

        // Skjerm -> verden
        const toWorld = (px: number, py: number) => {
            const cam = cameraRef.current;
            return { wx: cam.x + px / cam.scale, wy: cam.y + py / cam.scale };
        };

        const hitTest = (px: number, py: number): number | null => {
            const { wx, wy } = toWorld(px, py);
            const cam = cameraRef.current;
            const threshold = 16 / cam.scale;
            const focus = focusRef.current;
            let best: number | null = null;
            let bestDist = threshold * threshold;
            const stars = worldRef.current.stars;
            for (let i = 0; i < stars.length; i++) {
                if (focus && stars[i].subjectId !== focus) continue;
                const dx = stars[i].x - wx;
                const dy = stars[i].y - wy;
                const dist = dx * dx + dy * dy;
                if (dist < bestDist) {
                    bestDist = dist;
                    best = i;
                }
            }
            return best;
        };

        // Blussanimasjon når en stjerne tennes
        useEffect(() => {
            if (flare) flareRef.current = { index: flare.index, start: performance.now() };
        }, [flare]);

        useEffect(() => {
            if (celebrate) {
                celebrateRef.current = { id: celebrate.constellationId, start: performance.now() };
            }
        }, [celebrate]);

        // Hovedløkka
        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            resetView();
            // Hopp rett til startposisjonen - ingen glidning inn fra (0,0)
            if (targetRef.current) cameraRef.current = { ...targetRef.current };

            let raf = 0;
            const draw = (time: number) => {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
                    canvas.width = cw * dpr;
                    canvas.height = ch * dpr;
                    canvas.style.width = `${cw}px`;
                    canvas.style.height = `${ch}px`;
                }

                // Gli mot målet
                const target = targetRef.current;
                if (target) {
                    const cam = cameraRef.current;
                    cam.x += (target.x - cam.x) * 0.14;
                    cam.y += (target.y - cam.y) * 0.14;
                    cam.scale += (target.scale - cam.scale) * 0.14;
                    if (
                        Math.abs(target.x - cam.x) < 0.5 &&
                        Math.abs(target.y - cam.y) < 0.5 &&
                        Math.abs(target.scale - cam.scale) < 0.001
                    ) {
                        cameraRef.current = { ...target };
                        targetRef.current = null;
                    }
                }

                const cam = cameraRef.current;
                const w = worldRef.current;
                const focus = focusRef.current;
                const reduced = reducedRef.current;
                const sx = (wx: number) => (wx - cam.x) * cam.scale;
                const sy = (wy: number) => (wy - cam.y) * cam.scale;

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                // Nattehimmel-bakgrunn
                const bg = ctx.createLinearGradient(0, 0, 0, ch);
                bg.addColorStop(0, '#04060f');
                bg.addColorStop(0.6, '#0a1024');
                bg.addColorStop(1, '#121a33');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, cw, ch);

                // Bakgrunnsstøv
                for (const dust of DUST) {
                    const px = sx(dust.x);
                    const py = sy(dust.y);
                    if (px < -4 || px > cw + 4 || py < -4 || py > ch + 4) continue;
                    const twinkle = reduced
                        ? 0.8
                        : 0.6 + 0.4 * Math.sin(time * 0.0007 + dust.phase);
                    ctx.fillStyle = `rgba(180, 197, 228, ${0.15 * twinkle})`;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0.4, dust.r * cam.scale * 1.6), 0, Math.PI * 2);
                    ctx.fill();
                }

                // Fagenes tåker
                for (const region of w.regions) {
                    const rx = sx(region.cx);
                    const ry = sy(region.cy);
                    const rr = region.radius * cam.scale;
                    if (rr <= 0) continue;
                    const dimmed = focus && focus !== region.subjectId;
                    const alpha = (region.litCount > 0 ? 0.1 : 0.06) * (dimmed ? 0.3 : 1);
                    const nebula = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
                    const tint = subjectTint(region.subjectId);
                    nebula.addColorStop(0, hexToRgba(tint, alpha));
                    nebula.addColorStop(1, hexToRgba(tint, 0));
                    ctx.fillStyle = nebula;
                    ctx.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
                }

                // Konstellasjonslinjer - trer frem når emnet har tente stjerner
                for (const constellation of w.constellations) {
                    if (constellation.litCount === 0 || constellation.lines.length === 0) {
                        continue;
                    }
                    const dimmed = focus && focus !== constellation.subjectId;
                    const strength = constellation.litCount / constellation.starIndices.length;
                    ctx.strokeStyle = hexToRgba(
                        subjectTint(constellation.subjectId),
                        (0.08 + 0.3 * strength) * (dimmed ? 0.15 : 1)
                    );
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (const [a, b] of constellation.lines) {
                        ctx.moveTo(sx(w.stars[a].x), sy(w.stars[a].y));
                        ctx.lineTo(sx(w.stars[b].x), sy(w.stars[b].y));
                    }
                    ctx.stroke();
                }

                // Fullført stjernebilde: gylne linjer, ekspanderende ring, lysende tittel
                const celebration = celebrateRef.current;
                if (celebration) {
                    const elapsed = time - celebration.start;
                    const constellation = w.constellations.find((c) => c.id === celebration.id);
                    if (elapsed > 2000 || !constellation) {
                        celebrateRef.current = null;
                    } else {
                        const t = elapsed / 2000;
                        const pulse = Math.sin(Math.min(1, t * 1.3) * Math.PI);
                        ctx.strokeStyle = `rgba(255, 224, 138, ${0.9 * pulse})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        for (const [a, b] of constellation.lines) {
                            ctx.moveTo(sx(w.stars[a].x), sy(w.stars[a].y));
                            ctx.lineTo(sx(w.stars[b].x), sy(w.stars[b].y));
                        }
                        ctx.stroke();
                        ctx.strokeStyle = `rgba(255, 224, 138, ${(1 - t) * 0.5})`;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(
                            sx(constellation.cx),
                            sy(constellation.cy),
                            (constellation.radius + 160 * t) * cam.scale,
                            0,
                            Math.PI * 2
                        );
                        ctx.stroke();
                        ctx.font = '700 16px Outfit, Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = `rgba(255, 234, 170, ${0.5 + 0.5 * pulse})`;
                        ctx.fillText(
                            constellation.title,
                            sx(constellation.cx),
                            sy(constellation.cy + constellation.radius) + 18
                        );
                    }
                }

                // Stjerner
                for (let i = 0; i < w.stars.length; i++) {
                    const star = w.stars[i];
                    const px = sx(star.x);
                    const py = sy(star.y);
                    if (px < -60 || px > cw + 60 || py < -60 || py > ch + 60) continue;
                    const dim = focus && focus !== star.subjectId ? 0.12 : 1;
                    const phase = ((i * 2654435761) % 1000) / 1000 * Math.PI * 2;

                    if (star.status === 'unlit') {
                        ctx.fillStyle = `rgba(148, 163, 184, ${0.32 * dim})`;
                        ctx.beginPath();
                        ctx.arc(px, py, Math.max(1, (0.8 + star.size * 0.5) * cam.scale * 2), 0, Math.PI * 2);
                        ctx.fill();
                        continue;
                    }

                    let alpha = star.brightness;
                    if (!reduced) {
                        if (star.status === 'lit') {
                            alpha *= 0.86 + 0.14 * Math.sin(time * 0.0013 + phase);
                        } else if (star.status === 'flickering') {
                            const pulse = Math.abs(
                                Math.sin(time * 0.004 + phase) * Math.sin(time * 0.0023 + phase * 1.7)
                            );
                            alpha *= 0.45 + 0.55 * pulse;
                        } else {
                            alpha *= 0.8 + 0.2 * Math.sin(time * 0.0008 + phase);
                        }
                    } else if (star.status === 'flickering') {
                        alpha *= 0.8;
                    }

                    const sprite = getSprite(star.status);
                    const glow =
                        (10 + star.size * 5) * cam.scale * (0.7 + 0.6 * star.brightness) * 2;
                    ctx.globalAlpha = Math.min(1, alpha) * dim;
                    ctx.drawImage(sprite, px - glow / 2, py - glow / 2, glow, glow);
                    ctx.globalAlpha = 1;
                }

                // Bluss - stjernen som nettopp ble tent
                const flareState = flareRef.current;
                if (flareState) {
                    const elapsed = time - flareState.start;
                    const star = w.stars[flareState.index];
                    if (elapsed > 1000 || !star) {
                        flareRef.current = null;
                    } else {
                        const t = elapsed / 1000;
                        const px = sx(star.x);
                        const py = sy(star.y);
                        const sprite = getSprite('lit');
                        const burst = (30 + 90 * t) * cam.scale * 2;
                        ctx.globalAlpha = (1 - t) * 0.9;
                        ctx.drawImage(sprite, px - burst / 2, py - burst / 2, burst, burst);
                        ctx.strokeStyle = `rgba(255, 235, 170, ${(1 - t) * 0.8})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(px, py, 10 + 70 * t * cam.scale, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }

                // Stjerneskudd - en sjelden gang, ren atmosfære
                if (!reduced) {
                    if (time > meteorNextRef.current) {
                        meteorNextRef.current = time + 9000 + Math.random() * 13000;
                        if (meteorRef.current === null) {
                            const angle = Math.PI * (0.15 + Math.random() * 0.2);
                            const speed = 0.5 + Math.random() * 0.25;
                            meteorRef.current = {
                                x: cw * (0.15 + Math.random() * 0.6),
                                y: ch * (0.05 + Math.random() * 0.25),
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                start: time,
                            };
                        }
                    }
                    const meteor = meteorRef.current;
                    if (meteor) {
                        const elapsed = time - meteor.start;
                        if (elapsed > 1100) {
                            meteorRef.current = null;
                        } else {
                            const fade = Math.sin((elapsed / 1100) * Math.PI);
                            const hx = meteor.x + meteor.vx * elapsed;
                            const hy = meteor.y + meteor.vy * elapsed;
                            const tail = 80;
                            const grad = ctx.createLinearGradient(
                                hx - meteor.vx * tail,
                                hy - meteor.vy * tail,
                                hx,
                                hy
                            );
                            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                            grad.addColorStop(1, `rgba(255, 250, 230, ${0.8 * fade})`);
                            ctx.strokeStyle = grad;
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.moveTo(hx - meteor.vx * tail, hy - meteor.vy * tail);
                            ctx.lineTo(hx, hy);
                            ctx.stroke();
                        }
                    }
                }

                // Hover-ring
                const hovered = hoverRef.current;
                if (hovered !== null && w.stars[hovered]) {
                    const star = w.stars[hovered];
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(sx(star.x), sy(star.y), 11, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Etiketter i skjermrommet
                const zoomFactor = cam.scale / fitScaleRef.current;
                for (const region of w.regions) {
                    const dimmed = focus && focus !== region.subjectId;
                    ctx.font = '700 15px Outfit, Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = hexToRgba(
                        subjectTint(region.subjectId),
                        0.55 * (dimmed ? 0.25 : 1)
                    );
                    ctx.fillText(region.title.toUpperCase(), sx(region.cx), sy(60));
                }
                for (const constellation of w.constellations) {
                    if (constellation.litCount === 0 && zoomFactor < 1.6) continue;
                    const dimmed = focus && focus !== constellation.subjectId;
                    const alpha =
                        Math.min(0.65, 0.18 + (zoomFactor - 1) * 0.35 + constellation.litCount * 0.04) *
                        (dimmed ? 0.15 : 1);
                    if (alpha <= 0.02) continue;
                    ctx.font = '600 11px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
                    ctx.fillText(
                        constellation.title,
                        sx(constellation.cx),
                        sy(constellation.cy + constellation.radius) + 16
                    );
                }

                raf = requestAnimationFrame(draw);
            };

            raf = requestAnimationFrame(draw);
            return () => cancelAnimationFrame(raf);
        }, [resetView]);

        // Zoom mot pekeren - non-passive for å kunne hindre side-scroll
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const onWheel = (e: WheelEvent) => {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const cam = cameraRef.current;
                targetRef.current = null;
                const factor = Math.exp(-e.deltaY * 0.0012);
                const fit = fitScaleRef.current;
                const newScale = Math.min(fit * 7, Math.max(fit * 0.85, cam.scale * factor));
                // Hold punktet under pekeren i ro
                cam.x = cam.x + px / cam.scale - px / newScale;
                cam.y = cam.y + py / cam.scale - py / newScale;
                cam.scale = newScale;
            };
            canvas.addEventListener('wheel', onWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', onWheel);
        }, []);

        const clampScale = (scale: number) => {
            const fit = fitScaleRef.current;
            return Math.min(fit * 7, Math.max(fit * 0.85, scale));
        };

        // Zoom rundt et skjermpunkt uten at punktet flytter seg
        const zoomAround = (px: number, py: number, newScale: number) => {
            const cam = cameraRef.current;
            targetRef.current = null;
            cam.x = cam.x + px / cam.scale - px / newScale;
            cam.y = cam.y + py / cam.scale - py / newScale;
            cam.scale = newScale;
        };

        const zoomBy = (factor: number) => {
            const { cw, ch } = viewSize();
            const cam = cameraRef.current;
            const scale = clampScale(cam.scale * factor);
            targetRef.current = {
                x: cam.x + cw / (2 * cam.scale) - cw / (2 * scale),
                y: cam.y + ch / (2 * cam.scale) - ch / (2 * scale),
                scale,
            };
        };

        const handlePointerDown = (e: React.PointerEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            pointersRef.current.set(e.pointerId, {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            if (pointersRef.current.size === 2) {
                const [a, b] = [...pointersRef.current.values()];
                pinchRef.current = {
                    dist: Math.hypot(b.x - a.x, b.y - a.y),
                    mx: (a.x + b.x) / 2,
                    my: (a.y + b.y) / 2,
                };
                pointerRef.current.dragging = true;
                if (hoverRef.current !== null) {
                    hoverRef.current = null;
                    setTooltip(null);
                }
                return;
            }
            pointerRef.current = {
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                camX: cameraRef.current.x,
                camY: cameraRef.current.y,
                down: true,
                dragging: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
        };

        const handlePointerMove = (e: React.PointerEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const pointer = pointerRef.current;

            if (pointersRef.current.has(e.pointerId)) {
                pointersRef.current.set(e.pointerId, { x: px, y: py });
            }
            const pinch = pinchRef.current;
            if (pinch && pointersRef.current.size >= 2) {
                const [a, b] = [...pointersRef.current.values()];
                const dist = Math.hypot(b.x - a.x, b.y - a.y);
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                if (pinch.dist > 0) {
                    const cam = cameraRef.current;
                    zoomAround(mx, my, clampScale(cam.scale * (dist / pinch.dist)));
                    // Panorer med midtpunktet
                    cam.x -= (mx - pinch.mx) / cam.scale;
                    cam.y -= (my - pinch.my) / cam.scale;
                }
                pinchRef.current = { dist, mx, my };
                return;
            }

            if (pointer.down) {
                const dx = px - pointer.startX;
                const dy = py - pointer.startY;
                if (pointer.dragging || Math.abs(dx) + Math.abs(dy) > 5) {
                    pointer.dragging = true;
                    targetRef.current = null;
                    cameraRef.current.x = pointer.camX - dx / cameraRef.current.scale;
                    cameraRef.current.y = pointer.camY - dy / cameraRef.current.scale;
                    if (hoverRef.current !== null) {
                        hoverRef.current = null;
                        setTooltip(null);
                    }
                }
                return;
            }

            const hit = hitTest(px, py);
            if (hit !== hoverRef.current) {
                hoverRef.current = hit;
                setTooltip(
                    hit === null
                        ? null
                        : { index: hit, x: Math.min(px + 14, rect.width - 236), y: py + 14 }
                );
            }
        };

        const handlePointerUp = (e: React.PointerEvent) => {
            pointersRef.current.delete(e.pointerId);
            if (pointersRef.current.size < 2) pinchRef.current = null;
            const pointer = pointerRef.current;
            if (!pointer.down) return;
            const wasDragging = pointer.dragging;
            pointer.down = false;
            pointer.dragging = false;
            if (wasDragging) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
            if (hit !== null) onStarClick(hit);
        };

        const handlePointerLeave = (e: React.PointerEvent) => {
            pointersRef.current.delete(e.pointerId);
            if (pointersRef.current.size < 2) pinchRef.current = null;
            hoverRef.current = null;
            setTooltip(null);
        };

        const hoveredStar = tooltip ? world.stars[tooltip.index] : null;

        return (
            <div ref={containerRef} className="relative w-full h-full overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className={hoveredStar ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerLeave}
                    aria-label="Stjernehimmelen - klikk på en stjerne for å øve"
                    role="application"
                    style={{ touchAction: 'none' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
                    <button
                        onClick={() => zoomBy(1.45)}
                        className="p-2 rounded-xl bg-white/80 backdrop-blur text-slate-600 hover:text-slate-900 hover:bg-white shadow-lg border border-white/40 transition-colors"
                        aria-label="Zoom inn"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => zoomBy(1 / 1.45)}
                        className="p-2 rounded-xl bg-white/80 backdrop-blur text-slate-600 hover:text-slate-900 hover:bg-white shadow-lg border border-white/40 transition-colors"
                        aria-label="Zoom ut"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={resetView}
                        className="p-2 rounded-xl bg-white/80 backdrop-blur text-slate-600 hover:text-slate-900 hover:bg-white shadow-lg border border-white/40 transition-colors"
                        aria-label="Vis hele himmelen"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
                {hoveredStar && tooltip && (
                    <div
                        className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-white/40 shadow-lg max-w-56"
                        style={{ left: tooltip.x, top: tooltip.y }}
                    >
                        <p className="font-bold text-sm text-slate-900 leading-tight">
                            {hoveredStar.term}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{skyStatusText(hoveredStar)}</p>
                    </div>
                )}
            </div>
        );
    }
);

SkyCanvas.displayName = 'SkyCanvas';
