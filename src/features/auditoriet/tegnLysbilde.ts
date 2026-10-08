// Tegner ett lysbilde på en 2D-canvas i logiske mål (16:9).
//
// Samme funksjon tegner lerretet i salen (en tekstur) og storskjermvisningen
// «Se lysbildet» (en vanlig canvas i DOM-en), så de to aldri kan bli ulike.
// Lysbildene lages bare av det artikkelen allerede har: tekst, bilder og steder.

import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Lysbilde } from './types';
import { isPendingImage } from '../../utils/imageAvailability';

const FONT = '"Outfit", "Inter", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const FARGE = {
    papir: '#fbf8f2',
    blekk: '#1e293b',
    dempet: '#64748b',
    aksent: '#b45309',
    aksentLys: '#fde7c7',
    hav: '#dbeaf3',
    land: '#e9e3d6',
    norge: '#f3d9a8',
    kyst: '#94a3b8',
};

// ── Ressurser: bilder og kartgeometri lastes én gang og deles ──────────────────

const bilder = new Map<string, HTMLImageElement | 'feil'>();

/** Bildet hvis det er lastet, `null` hvis det kommer, `'feil'` hvis det ikke finnes. */
export function hentBilde(src: string, nårLastet: () => void): HTMLImageElement | null | 'feil' {
    if (isPendingImage(src)) return 'feil';
    const kjent = bilder.get(src);
    if (kjent) return kjent === 'feil' || kjent.complete ? kjent : null;
    const img = new Image();
    img.onload = nårLastet;
    img.onerror = () => {
        bilder.set(src, 'feil');
        nårLastet();
    };
    img.src = src;
    bilder.set(src, img);
    return null;
}

interface Land {
    id: string;
    geo: GeoPermissibleObjects;
}
let land: Land[] | null = null;
let landLaster: Promise<void> | null = null;

/** Verdenskartet ligger lokalt (aldri CDN), samme fil som Verdensatlaset bruker. */
export function hentKart(nårLastet: () => void): Land[] | null {
    if (land) return land;
    if (!landLaster) {
        landLaster = fetch('/data/world/countries-110m.json')
            .then((r) => r.json())
            .then((world) => {
                const fc = topojson.feature(world, world.objects.countries) as unknown as {
                    features: (GeoPermissibleObjects & { id?: string | number })[];
                };
                land = fc.features.map((f) => ({ id: String(f.id), geo: f }));
            })
            .catch(() => {
                land = [];
            });
    }
    landLaster.then(nårLastet);
    return null;
}

// ── Hjelpere ──────────────────────────────────────────────────────────────────

function brytLinjer(ctx: CanvasRenderingContext2D, tekst: string, maksBredde: number): string[] {
    const ord = tekst.split(/\s+/);
    const linjer: string[] = [];
    let linje = '';
    for (const o of ord) {
        const prøve = linje ? `${linje} ${o}` : o;
        if (ctx.measureText(prøve).width > maksBredde && linje) {
            linjer.push(linje);
            linje = o;
        } else linje = prøve;
    }
    if (linje) linjer.push(linje);
    return linjer;
}

/** Skriver tekst med linjebryting og returnerer y under siste linje. */
function skriv(
    ctx: CanvasRenderingContext2D,
    tekst: string,
    x: number,
    y: number,
    maksBredde: number,
    linjeHøyde: number
): number {
    for (const l of brytLinjer(ctx, tekst, maksBredde)) {
        ctx.fillText(l, x, y);
        y += linjeHøyde;
    }
    return y;
}

function bakgrunn(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = FARGE.papir;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = FARGE.aksent;
    ctx.fillRect(0, 0, 14, h);
}

function bunntekst(ctx: CanvasRenderingContext2D, w: number, h: number, tekst: string) {
    ctx.fillStyle = FARGE.dempet;
    ctx.font = `500 26px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(tekst, 70, h - 40);
    ctx.textAlign = 'right';
    ctx.fillText('Auditoriet · bok.haaland.de', w - 60, h - 40);
    ctx.textAlign = 'left';
}

// ── Lysbildetypene ────────────────────────────────────────────────────────────

export interface TegneValg {
    /** Tittelen på forelesningen, til bunnteksten. */
    forelesning: string;
    /** Kalles når et bilde eller kartet er ferdig lastet, så lysbildet kan tegnes på nytt. */
    nårLastet: () => void;
}

export function tegnLysbilde(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lysbilde: Lysbilde | undefined,
    valg: TegneValg
) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    bakgrunn(ctx, w, h);

    if (!lysbilde) {
        ctx.fillStyle = FARGE.dempet;
        ctx.font = `600 64px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(valg.forelesning, w / 2, h / 2);
        ctx.restore();
        return;
    }

    switch (lysbilde.type) {
        case 'tittel': {
            if (lysbilde.del) {
                ctx.fillStyle = FARGE.aksent;
                ctx.font = `700 34px ${FONT}`;
                ctx.fillText(lysbilde.del.toUpperCase(), 110, 300);
            }
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `800 124px ${FONT}`;
            const y = skriv(ctx, lysbilde.tekst, 104, 430, w - 220, 132);
            if (lysbilde.undertekst) {
                ctx.fillStyle = FARGE.dempet;
                ctx.font = `500 54px ${FONT}`;
                skriv(ctx, lysbilde.undertekst, 110, y + 20, w - 220, 64);
            }
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'bilde': {
            const img = hentBilde(lysbilde.src, valg.nårLastet);
            if (img && img !== 'feil') {
                // Fyll hele lysbildet (cover), bildeteksten på et mørkt bånd nederst.
                const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
                const iw = img.naturalWidth * s;
                const ih = img.naturalHeight * s;
                ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
                if (lysbilde.tekst) {
                    const g = ctx.createLinearGradient(0, h * 0.7, 0, h);
                    g.addColorStop(0, 'rgba(15,23,42,0)');
                    g.addColorStop(1, 'rgba(15,23,42,0.75)');
                    ctx.fillStyle = g;
                    ctx.fillRect(0, h * 0.7, w, h * 0.3);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `700 56px ${FONT}`;
                    ctx.fillText(lysbilde.tekst, 70, h - 70);
                }
            } else {
                // Bildet finnes ikke (ennå): vis bildeteksten som tittel i stedet for et hull.
                ctx.fillStyle = FARGE.blekk;
                ctx.font = `800 96px ${FONT}`;
                skriv(ctx, lysbilde.tekst ?? valg.forelesning, 104, h / 2, w - 220, 104);
                bunntekst(ctx, w, h, valg.forelesning);
            }
            break;
        }

        case 'punkter': {
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `800 80px ${FONT}`;
            ctx.fillText(lysbilde.tittel, 104, 170);
            let y = 300;
            lysbilde.punkter.forEach((p, i) => {
                ctx.fillStyle = FARGE.aksent;
                ctx.beginPath();
                ctx.arc(134, y - 16, 34, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = `800 38px ${FONT}`;
                ctx.textAlign = 'center';
                ctx.fillText(String(i + 1), 134, y - 2);
                ctx.textAlign = 'left';
                ctx.fillStyle = FARGE.blekk;
                ctx.font = `600 50px ${FONT}`;
                y = skriv(ctx, p, 200, y, w - 320, 60) + 50;
            });
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'ord': {
            ctx.textAlign = 'center';
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `italic 700 150px ${SERIF}`;
            ctx.fillText(lysbilde.ord, w / 2, h * 0.45);
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `700 34px ${FONT}`;
            ctx.fillText('BETYR', w / 2, h * 0.45 + 90);
            ctx.fillStyle = FARGE.dempet;
            ctx.font = `500 58px ${FONT}`;
            const linjer = brytLinjer(ctx, lysbilde.betydning, w - 300);
            linjer.forEach((l, i) => ctx.fillText(l, w / 2, h * 0.45 + 170 + i * 68));
            ctx.textAlign = 'left';
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'aarstall': {
            ctx.textAlign = 'center';
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `900 300px ${FONT}`;
            ctx.fillText(lysbilde.aar, w / 2, h * 0.58);
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `600 58px ${FONT}`;
            ctx.fillText(lysbilde.tekst, w / 2, h * 0.58 + 110);
            ctx.textAlign = 'left';
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'tidslinje': {
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `800 72px ${FONT}`;
            ctx.fillText(lysbilde.tittel, 104, 170);
            const n = lysbilde.hendelser.length;
            const x0 = 160;
            const x1 = w - 160;
            const ly = h * 0.55;
            ctx.strokeStyle = FARGE.kyst;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x0 - 40, ly);
            ctx.lineTo(x1 + 40, ly);
            ctx.stroke();
            const bredde = (x1 - x0) / Math.max(1, n - 1);
            lysbilde.hendelser.forEach((e, i) => {
                const x = n === 1 ? w / 2 : x0 + i * bredde;
                const uthevet = lysbilde.uthev === i;
                ctx.fillStyle = uthevet ? FARGE.aksent : FARGE.blekk;
                ctx.beginPath();
                ctx.arc(x, ly, uthevet ? 26 : 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.textAlign = 'center';
                ctx.font = `800 ${uthevet ? 50 : 42}px ${FONT}`;
                ctx.fillText(e.aar, x, ly - 60);
                ctx.fillStyle = uthevet ? FARGE.blekk : FARGE.dempet;
                ctx.font = `${uthevet ? 700 : 500} 36px ${FONT}`;
                brytLinjer(ctx, e.tekst, bredde - 30).forEach((l, j) =>
                    ctx.fillText(l, x, ly + 80 + j * 44)
                );
            });
            ctx.textAlign = 'left';
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'kart':
            tegnKart(ctx, w, h, lysbilde, valg);
            break;

        case 'fakta': {
            ctx.fillStyle = FARGE.aksentLys;
            ctx.beginPath();
            ctx.roundRect(90, 120, w - 180, h - 260, 36);
            ctx.fill();
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `800 34px ${FONT}`;
            ctx.fillText('VERDT Å VITE', 150, 210);
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `800 72px ${FONT}`;
            const y = skriv(ctx, lysbilde.tittel, 150, 300, w - 300, 80);
            ctx.font = `500 46px ${FONT}`;
            skriv(ctx, lysbilde.tekst, 150, y + 30, w - 300, 58);
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'sitat': {
            ctx.fillStyle = FARGE.aksentLys;
            ctx.font = `900 360px ${SERIF}`;
            ctx.fillText('«', 70, 380);
            ctx.fillStyle = FARGE.blekk;
            const lang = lysbilde.tekst.length > 140;
            ctx.font = `italic 500 ${lang ? 54 : 68}px ${SERIF}`;
            const y = skriv(ctx, lysbilde.tekst, 200, 300, w - 380, lang ? 68 : 84);
            if (lysbilde.kilde) {
                ctx.fillStyle = FARGE.aksent;
                ctx.font = `700 42px ${FONT}`;
                ctx.fillText(`- ${lysbilde.kilde}`, 200, y + 40);
            }
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }

        case 'pause': {
            const igjen = Math.max(0, lysbilde.starter - Date.now());
            const mm = Math.floor(igjen / 60000);
            const ss = Math.floor((igjen % 60000) / 1000);
            ctx.textAlign = 'center';
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `800 40px ${FONT}`;
            ctx.fillText(`FRIMINUTT I ${lysbilde.sal.toUpperCase()}`, w / 2, 200);
            ctx.fillStyle = FARGE.dempet;
            ctx.font = `500 48px ${FONT}`;
            ctx.fillText('Neste forelesning', w / 2, 330);
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `800 92px ${FONT}`;
            brytLinjer(ctx, lysbilde.neste, w - 260).slice(0, 2).forEach((l, i) => ctx.fillText(l, w / 2, 450 + i * 100));
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `900 120px ${FONT}`;
            ctx.fillText(`${mm}:${String(ss).padStart(2, '0')}`, w / 2, 760);
            ctx.textAlign = 'left';
            break;
        }

        case 'sporsmal': {
            ctx.fillStyle = FARGE.aksentLys;
            ctx.beginPath();
            ctx.arc(w / 2, h * 0.3, 110, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = FARGE.aksent;
            ctx.font = `900 170px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText('?', w / 2, h * 0.3 + 60);
            ctx.fillStyle = FARGE.blekk;
            ctx.font = `700 70px ${FONT}`;
            brytLinjer(ctx, lysbilde.tekst, w - 300).forEach((l, i) =>
                ctx.fillText(l, w / 2, h * 0.62 + i * 84)
            );
            ctx.textAlign = 'left';
            bunntekst(ctx, w, h, valg.forelesning);
            break;
        }
    }
    ctx.restore();
}

/**
 * Utsnittet: Norge med nabolandene når alle stedene er der (fast, så kartet ikke
 * hopper mellom lysbildene). Ellers et utsnitt rundt stedene, aldri så trangt at man
 * ikke ser hvor i verden det er.
 */
function kartUtsnitt(b: Extract<Lysbilde, { type: 'kart' }>): GeoPermissibleObjects {
    const punkter: [number, number][] = [...b.steder.map((s) => [s.lng, s.lat] as [number, number]), ...(b.rute ?? [])];
    const iNorden = punkter.every(([lng, lat]) => lng > 3 && lng < 32 && lat > 54.5 && lat < 71.5);
    if (iNorden || punkter.length === 0) {
        return { type: 'MultiPoint', coordinates: [[3.5, 55.4], [31.5, 71.2]] };
    }
    const lngs = punkter.map((p) => p[0]);
    const lats = punkter.map((p) => p[1]);
    const midtLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const midtLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const halvLng = Math.max(18, (Math.max(...lngs) - Math.min(...lngs)) / 2 + 8);
    const halvLat = Math.max(12, (Math.max(...lats) - Math.min(...lats)) / 2 + 6);
    return {
        type: 'MultiPoint',
        coordinates: [
            [midtLng - halvLng, Math.max(-60, midtLat - halvLat)],
            [midtLng + halvLng, Math.min(78, midtLat + halvLat)],
        ],
    };
}

/** Kartet til høyre, stedslista til venstre. */
function tegnKart(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    b: Extract<Lysbilde, { type: 'kart' }>,
    valg: TegneValg
) {
    // Venstre: tittel og stedsliste. Høyre: kartet.
    ctx.fillStyle = FARGE.blekk;
    ctx.font = `800 72px ${FONT}`;
    let y = skriv(ctx, b.tittel, 104, 170, w * 0.42, 80) + 30;
    for (const s of b.steder) {
        ctx.fillStyle = s.uthev ? FARGE.aksent : FARGE.blekk;
        ctx.beginPath();
        ctx.arc(124, y - 16, s.uthev ? 16 : 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = FARGE.blekk;
        ctx.font = `${s.uthev ? 700 : 500} 46px ${FONT}`;
        ctx.fillText(s.navn, 160, y);
        y += 70;
    }
    if (b.rute) {
        ctx.strokeStyle = FARGE.aksent;
        ctx.lineWidth = 6;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(104, y + 4);
        ctx.lineTo(160, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = FARGE.blekk;
        ctx.font = `500 40px ${FONT}`;
        ctx.fillText('Sjøveien langs kysten', 180, y + 18);
    }

    const kx = w * 0.5;
    const ky = 40;
    const kw = w * 0.47;
    const kh = h - 80;
    ctx.fillStyle = FARGE.hav;
    ctx.beginPath();
    ctx.roundRect(kx, ky, kw, kh, 24);
    ctx.fill();

    const verden = hentKart(valg.nårLastet);
    if (!verden) return;

    const utsnitt = kartUtsnitt(b);
    const proj = geoMercator().fitExtent(
        [
            [kx + 20, ky + 20],
            [kx + kw - 20, ky + kh - 20],
        ],
        utsnitt
    );
    const sti = geoPath(proj, ctx);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(kx, ky, kw, kh, 24);
    ctx.clip();
    for (const l of verden) {
        ctx.beginPath();
        sti(l.geo);
        ctx.fillStyle = l.id === '578' ? FARGE.norge : FARGE.land;
        ctx.fill();
        ctx.strokeStyle = FARGE.kyst;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    if (b.rute) {
        ctx.beginPath();
        sti({ type: 'LineString', coordinates: b.rute });
        ctx.strokeStyle = FARGE.aksent;
        ctx.lineWidth = 6;
        ctx.setLineDash([16, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    for (const s of b.steder) {
        const p = proj([s.lng, s.lat]);
        if (!p) continue;
        const r = s.uthev ? 15 : 10;
        ctx.fillStyle = s.uthev ? FARGE.aksent : FARGE.blekk;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = `700 34px ${FONT}`;
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeText(s.navn, p[0] + 22, p[1] + 12);
        ctx.fillStyle = FARGE.blekk;
        ctx.fillText(s.navn, p[0] + 22, p[1] + 12);
    }
    ctx.restore();
}
