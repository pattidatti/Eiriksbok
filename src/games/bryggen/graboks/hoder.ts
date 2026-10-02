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
//  - Ingenting synes gjennom vegger: en stråle fra kameraet til hodet (kolliderne i verden) sjekkes
//    noen ganger i sekundet per figur.
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

const STIL = `
.bh-hode{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;
  pointer-events:none;will-change:transform,opacity;transform-origin:50% 100%}
.bh-navn{font:700 15px/1.1 Outfit,Inter,system-ui,sans-serif;color:#fff;letter-spacing:.01em;
  text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 6px rgba(0,0,0,.6);white-space:nowrap;text-align:center;transition:opacity .25s}
.bh-navn small{display:block;font:600 11.5px/1.2 Inter,system-ui,sans-serif;color:#e5dccb;letter-spacing:.04em;
  text-transform:lowercase;margin-top:1px}
.bh-navn.bh-giver{color:#ffe08a}
.bh-merke{font:900 34px/1 Outfit,Inter,system-ui,sans-serif;color:#ffd23f;margin-bottom:2px;
  text-shadow:0 0 2px #000,0 2px 0 #6b4a00,0 0 10px rgba(255,190,40,.75);-webkit-text-stroke:1.5px #3d2800;
  animation:bh-dupp 1.6s ease-in-out infinite;transition:opacity .3s}
.bh-merke.bh-gra{color:#c9c9c9;text-shadow:0 0 2px #000,0 2px 0 #444;-webkit-text-stroke:1.5px #222;animation:none}
@keyframes bh-dupp{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.bh-boble{position:relative;max-width:310px;width:max-content;margin-bottom:10px;padding:9px 13px 10px;
  background:rgba(255,252,244,.96);color:#1c1917;border-radius:14px;
  font:500 16px/1.32 Inter,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.28),0 0 0 1px rgba(80,60,30,.18);
  transform-origin:50% 100%;transition:opacity .28s ease, transform .28s cubic-bezier(.2,1.4,.4,1)}
.bh-boble::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-9px;border:9px solid transparent;
  border-bottom:0;border-top-color:rgba(255,252,244,.96)}
.bh-boble.bh-skjult{opacity:0;transform:scale(.6) translateY(8px)}
.bh-boble .bh-rest{opacity:0}
.bh-boble.bh-rop{font-weight:700}
.bh-boble.bh-gutt{background:rgba(232,240,255,.96)}
.bh-boble.bh-gutt::after{border-top-color:rgba(232,240,255,.96)}
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
                const hit = len > 0.5 ? this.phys.rayWorld(kam, _d.divideScalar(len), len - 0.4) : null;
                el.skjult = hit ? 1 : 0;
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
            const s = THREE.MathUtils.clamp(5.5 / Math.max(0.1, d), 0.62, 1.05);
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
