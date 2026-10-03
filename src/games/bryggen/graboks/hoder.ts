// Det som står over hodene: navnet, oppdragsmerket («!» og «?») og snakkeboblene.
//
// Alt er vanlig HTML i et lag over lerretet, flyttet hvert bilde dit hodet er på skjermen. Tekst
// i HTML er skarp i alle størrelser og koster ingen tegnekall. Hvert hode har tre ting stablet
// nedenfra: navneskiltet, merket og boblen. Boblen skriver teksten fram (rask skrivemaskin), står
// en stund og toner ut.
//
// Hva synes:
//  - Navnet: nærmere enn NAVN_R, eller når figuren har et oppdragsmerke.
//  - Merket: nærmere enn MERKE_R. Gull «!» = har et oppdrag til deg, gull «?» = du kan levere,
//    grå «?» = du er i gang med oppdraget hen ga deg.
//  - Ingenting synes gjennom vegger: en stråle fra kameraet til hodet (kolliderne i verden og
//    sikt-skjermene på skipene) sjekkes noen ganger i sekundet per figur.
import * as THREE from 'three';
import type { Physics } from '../motor/physics';

export type Merke = '!' | '?' | '?grå' | null;

/** Det hodene trenger å vite om en figur. Snakkbare (streaming.ts) passer, og gutten og tyven. */
export interface Hode {
    /** Toppen av hodet i verdensrom. */
    hode: (ut: THREE.Vector3) => THREE.Vector3;
    synlig: () => boolean;
}

export interface HodeInfo {
    navn: string;
    tittel: string;
    merke: Merke;
    /** Har et oppdrag til gutten: navnet i gull. */
    giver: boolean;
    /** Gutten selv: bare boblen, lyseblå. */
    gutt?: boolean;
}

const NAVN_R = 11;
const MERKE_R = 38;
const BOBLE_R = 24;
/** Tegn i sekundet når boblen skriver fram teksten. */
const SKRIV = 55;

// Samme utseende som resten av UI-et (ui/stil.ts): navnet i Grenze Gotisch, boblene som pergament
// med blekktekst og tjærebrun kant. Fontene lastes av ui/stil.ts.
const STIL = `
.bh-hode{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;
  pointer-events:none;will-change:transform,opacity;transform-origin:50% 100%}
.bh-navn{font:700 19px/1.05 'Grenze Gotisch','Alegreya Sans',Georgia,serif;color:#fbf3df;letter-spacing:.015em;
  text-shadow:0 1px 1px #1a0f05,0 0 2px #1a0f05,0 0 7px rgba(26,15,5,.75);white-space:nowrap;text-align:center;transition:opacity .25s}
.bh-navn small{display:block;font:700 13px/1.2 'Alegreya Sans',Inter,system-ui,sans-serif;color:#eadcc0;letter-spacing:.05em;
  text-transform:lowercase;margin-top:1px}
.bh-navn.bh-giver{color:#ffd66e}
.bh-merke{font:900 36px/1 'Grenze Gotisch',Georgia,serif;color:#f4c446;margin-bottom:2px;
  text-shadow:0 0 2px #000,0 2px 0 #5a3a00,0 0 10px rgba(255,190,40,.7);-webkit-text-stroke:1.5px #3d2800;
  animation:bh-dupp 1.6s ease-in-out infinite;transition:opacity .3s}
.bh-merke.bh-gra{color:#cfc6b4;text-shadow:0 0 2px #000,0 2px 0 #444;-webkit-text-stroke:1.5px #222;animation:none}
@keyframes bh-dupp{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.bh-boble{position:relative;max-width:320px;width:max-content;margin-bottom:11px;padding:8px 14px 9px;
  background-color:#f6edd9;color:#2b1d10;border-radius:10px;border:1.5px solid #8a6438;
  background-image:radial-gradient(120% 90% at 50% 35%,rgba(255,251,240,.75),rgba(255,251,240,0) 65%),
    repeating-linear-gradient(97deg,rgba(120,85,40,.04) 0 1px,transparent 1px 5px);
  font:500 17px/1.3 'Alegreya Sans',Inter,system-ui,sans-serif;
  box-shadow:inset 0 0 12px rgba(140,95,40,.18),0 5px 14px rgba(30,18,6,.35);
  transform-origin:50% 100%;transition:opacity .28s ease, transform .28s cubic-bezier(.2,1.4,.4,1)}
.bh-boble::before{content:'';position:absolute;left:50%;bottom:-11px;margin-left:-10px;border:10px solid transparent;
  border-bottom:0;border-top-color:#8a6438}
.bh-boble::after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-8px;border:8px solid transparent;
  border-bottom:0;border-top-color:#f6edd9}
.bh-boble.bh-skjult{opacity:0;transform:scale(.6) translateY(8px)}
.bh-boble .bh-rest{opacity:0}
.bh-boble.bh-rop{font-weight:800;border-color:#9a2a1c}
.bh-boble.bh-rop::before{border-top-color:#9a2a1c}
.bh-boble.bh-gutt{background-color:#fffaf0;border-color:#9a2a1c;border-left-width:4px}
.bh-boble.bh-gutt::before{border-top-color:#9a2a1c}
.bh-boble.bh-gutt::after{border-top-color:#fffaf0}
@media (prefers-reduced-motion: reduce){.bh-merke{animation:none}.bh-boble{transition:opacity .2s ease}}
`;

interface Boble {
    tekst: string;
    tid: number;
    varighet: number;
}

interface El {
    rot: HTMLDivElement;
    navn: HTMLDivElement;
    merke: HTMLDivElement;
    boble: HTMLDivElement;
    vist: HTMLSpanElement;
    rest: HTMLSpanElement;
    navnTekst: string;
    merkeVerdi: Merke;
    boblen: Boble | null;
    skrevet: number;
    skjult: number;
    sjekk: number;
    sett: boolean;
    opac: number;
}

const _h = new THREE.Vector3();
const _v = new THREE.Vector3();
const _d = new THREE.Vector3();

export class Hoder {
    private readonly lag: HTMLElement;
    private readonly phys: Physics;
    private els = new Map<Hode, El>();
    private bobler = new Map<Hode, Boble>();
    private klokke = 0;

    constructor(lag: HTMLElement, phys: Physics) {
        this.lag = lag;
        this.phys = phys;
        // Egen stablingskontekst: z-indeksene på hodene (nærmeste øverst) gjelder bare inni laget, så
        // navn og bobler legger seg aldri over HUD-en, menyene eller startskjermen.
        lag.style.isolation = 'isolate';
        if (!document.getElementById('bryggen-hoder-stil')) {
            const st = document.createElement('style');
            st.id = 'bryggen-hoder-stil';
            st.textContent = STIL;
            document.head.appendChild(st);
        }
    }

    /** `hvem` sier `tekst` (boble over hodet). Varigheten følger lengden på teksten. */
    si(hvem: Hode, tekst: string, varighet?: number): void {
        this.bobler.set(hvem, { tekst, tid: this.klokke, varighet: varighet ?? Math.min(9, 2.2 + tekst.length / 16) });
    }

    /** Fjern boblen (samtalen gikk videre, eller ble avbrutt). */
    taus(hvem: Hode): void {
        this.bobler.delete(hvem);
    }

    /** Snakker hen nå? */
    snakker(hvem: Hode): boolean {
        return this.bobler.has(hvem);
    }

    /**
     * Hvert bilde. `folk` er alle som kan ha noe over hodet; `info` gir navn og merke for hver.
     * `w` og `h` er størrelsen på lerretet.
     */
    update(dt: number, kamera: THREE.PerspectiveCamera, folk: Iterable<Hode>, info: (f: Hode) => HodeInfo | null, w: number, h: number): void {
        this.klokke += dt;
        for (const [f, b] of this.bobler) if (this.klokke - b.tid > b.varighet) this.bobler.delete(f);
        for (const el of this.els.values()) el.sett = false;
        const kam = kamera.position;

        for (const f of folk) {
            const i = info(f);
            if (!i || !f.synlig()) continue;
            f.hode(_h);
            const d = _h.distanceTo(kam);
            const boble = this.bobler.get(f) ?? null;
            const visNavn = !!i.navn && (d < NAVN_R || (!!i.merke && d < MERKE_R));
            const visMerke = !!i.merke && d < MERKE_R;
            const visBoble = !!boble && d < BOBLE_R;
            if (!visNavn && !visMerke && !visBoble) continue;
            _v.copy(_h).project(kamera);
            if (_v.z > 1 || Math.abs(_v.x) > 1.3 || Math.abs(_v.y) > 1.4) continue;

            let el = this.els.get(f);
            if (!el) {
                el = this.lag_(f);
                if (i.gutt) el.boble.classList.add('bh-gutt');
            }
            el.sett = true;

            // Ingenting gjennom vegger: en stråle fra kameraet mot hodet, noen ganger i sekundet.
            el.sjekk -= dt;
            if (el.sjekk <= 0) {
                el.sjekk = 0.2 + Math.random() * 0.1;
                _d.subVectors(_h, kam);
                const len = _d.length();
                // `raySikt` ser også skjermene (kastellene og seilene på skipene, physics.ts).
                el.skjult = len > 0.5 && this.phys.raySikt(kam, _d.divideScalar(len), len - 0.4) ? 1 : 0;
            }
            const maal = el.skjult ? 0 : 1;
            el.opac += (maal - el.opac) * Math.min(1, dt * 10);

            // Navn og merke.
            const navnTekst = i.tittel ? `${i.navn}<small>${i.tittel}</small>` : i.navn;
            if (navnTekst !== el.navnTekst) {
                el.navn.innerHTML = navnTekst;
                el.navnTekst = navnTekst;
            }
            el.navn.classList.toggle('bh-giver', i.giver);
            const navnOp = visNavn ? (d < NAVN_R ? THREE.MathUtils.clamp((NAVN_R - d) / 2.5, 0, 1) : 0.85) : 0;
            el.navn.style.opacity = String(navnOp);
            if (i.merke !== el.merkeVerdi) {
                el.merke.textContent = i.merke ? (i.merke === '!' ? '!' : '?') : '';
                el.merke.classList.toggle('bh-gra', i.merke === '?grå');
                el.merkeVerdi = i.merke;
            }
            el.merke.style.display = visMerke ? '' : 'none';

            // Boblen: skriver fram teksten, og bytter når en ny replikk kommer.
            if (boble !== el.boblen) {
                el.boblen = boble;
                el.skrevet = 0;
                if (boble) {
                    el.boble.classList.toggle('bh-rop', /!\s*$/.test(boble.tekst) && boble.tekst.length < 50);
                    el.vist.textContent = '';
                    el.rest.textContent = boble.tekst;
                }
            }
            if (boble && visBoble) {
                el.boble.classList.remove('bh-skjult');
                const n = Math.min(boble.tekst.length, Math.floor((this.klokke - boble.tid) * SKRIV));
                if (n !== el.skrevet) {
                    el.skrevet = n;
                    el.vist.textContent = boble.tekst.slice(0, n);
                    el.rest.textContent = boble.tekst.slice(n);
                }
                // Toner ut det siste halve sekundet.
                const igjen = boble.varighet - (this.klokke - boble.tid);
                el.boble.style.opacity = String(THREE.MathUtils.clamp(igjen / 0.5, 0, 1));
            } else el.boble.classList.add('bh-skjult');

            // Mindre lenger unna, men aldri for smått til å lese.
            const s = THREE.MathUtils.clamp(5.5 / Math.max(0.1, d), 0.78, 1.05);
            const x = (_v.x * 0.5 + 0.5) * w;
            const y = Math.max(8, (-_v.y * 0.5 + 0.5) * h);
            el.rot.style.transform = `translate(-50%,-100%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
            el.rot.style.opacity = el.opac.toFixed(3);
            // De nærmeste øverst.
            el.rot.style.zIndex = String(1000 - Math.round(d * 10));
        }

        for (const [f, el] of this.els) {
            if (el.sett) continue;
            el.rot.remove();
            this.els.delete(f);
        }
    }

    private lag_(f: Hode): El {
        const rot = document.createElement('div');
        rot.className = 'bh-hode';
        const boble = document.createElement('div');
        boble.className = 'bh-boble bh-skjult';
        const vist = document.createElement('span');
        const rest = document.createElement('span');
        rest.className = 'bh-rest';
        boble.append(vist, rest);
        const merke = document.createElement('div');
        merke.className = 'bh-merke';
        const navn = document.createElement('div');
        navn.className = 'bh-navn';
        rot.append(boble, merke, navn);
        this.lag.appendChild(rot);
        const el: El = { rot, navn, merke, boble, vist, rest, navnTekst: '', merkeVerdi: null, boblen: null, skrevet: 0, skjult: 0, sjekk: 0, sett: true, opac: 0 };
        this.els.set(f, el);
        return el;
    }

    dispose(): void {
        for (const el of this.els.values()) el.rot.remove();
        this.els.clear();
    }
}
