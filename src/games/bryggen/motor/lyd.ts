// Lydbildet: Web Audio, uten bibliotek.
//
// Grafen:
//
//   løkker og lyder ute ──► ute-bussen ──► lavpass (stenger seg inne) ──┐
//   lyder inne (rotter, fottrinn) ───────► inne-bussen ─────────────────┼──► hoved (volum) ──► høyttaler
//   hendelser (kamp, oppdragstoner) ─────► hendelse-bussen ─────────────┤
//                                         └► romklang (bare inne) ──────┘
//
// Hver buss har sitt eget volum fra innstillingene (`busser`). Pausemenyen demper hovedbussen
// (`dempet`) uten å røre volumet eleven har valgt.
//
// Ute-bussen er alt som hører hjemme utendørs: regn, vind, bølger, måker, båten. Står kameraet
// inne i et rom, lukkes lavpasset ned mot noen hundre hertz, så verden utenfor høres dempet
// gjennom veggene, og regnet på taket tar over. Lyder i rommet (rotter, fottrinn på golvet) går
// rett til hovedbussen og får litt romklang inne.
//
// Romlig lyd: PannerNode per lyd, og lytteren står der kameraet står og ser dit det ser.
// Lydfilene (Opus i Ogg, CC0) lastes først når lyden slås på etter første tastetrykk eller
// klikk (nettlesere slipper ikke ut lyd før det). Korte lyder ligger samlet i sprites; hvor hver
// lyd starter og hvor lang den er, står i `lyd.json`. Lisensene står i KILDE.md i samme mappe.
import * as THREE from 'three';

const MAPPE = '/games/bryggen/audio/';

interface Manifest {
    lokker: Record<string, { fil: string; lengde: number }>;
    sprites: Record<string, { fil: string; lyder: Record<string, [number, number][]> }>;
}

/** En romlig løkke: kilde → gain → panner → buss. */
interface Lokke {
    kilde: AudioBufferSourceNode;
    gain: GainNode;
    panner: PannerNode | null;
}

export interface SpillOpts {
    /** Hvor (null: rett i øret, uten panner). */
    pos?: THREE.Vector3 | null;
    /** Volum (1 = normalt). */
    styrke?: number;
    /** Avspillingsfart: tonehøyde og lengde (1 = som innspilt). */
    fart?: number;
    /** Ute (gjennom lavpasset når man er inne) eller inne (rett ut, med romklang). */
    buss?: Buss;
    /** Avstanden der lyden har fullt volum (meter). Mindre = må være nærmere for å høre den. */
    ref?: number;
    /** Start om så mange sekunder. */
    om?: number;
}

/** Bussene: omgivelser ute, lyder i rommet, og hendelser (kamp, oppdrag). */
export type Buss = 'ute' | 'inne' | 'hendelse';
export type BussVolum = Record<Buss, number>;

export class Lydbilde {
    private ctx: AudioContext | null = null;
    private hoved!: GainNode;
    private uteBuss!: GainNode;
    private inneBuss!: GainNode;
    private hendelseBuss!: GainNode;
    /** Volumet eleven har valgt per buss (0-1). Inne-bussen dempes ikke av `settInne`; ute-bussen gjør det. */
    private bussVolum: BussVolum = { ute: 1, inne: 1, hendelse: 1 };
    private uteInne = 1;
    private _dempet = false;
    private lavpass!: BiquadFilterNode;
    private klang!: GainNode;
    private buffere = new Map<string, AudioBuffer>();
    private manifest: Manifest | null = null;
    private lokker = new Map<string, Lokke>();
    private laster: Promise<void> | null = null;
    private _volum = 0.8;
    private _paa = true;
    /** Hvor mange korte lyder som spiller nå (taket hindrer at det hoper seg opp). */
    private aktive = 0;
    private readonly fremover = new THREE.Vector3();

    /** Om nettleseren kan spille Opus i Ogg (Chrome, Firefox og Edge kan; eldre Safari ikke). */
    static get stottet(): boolean {
        if (typeof window === 'undefined' || !('AudioContext' in window)) return false;
        return new Audio().canPlayType('audio/ogg; codecs=opus') !== '';
    }

    get klar(): boolean {
        return !!this.ctx && !!this.manifest;
    }

    get volum(): number {
        return this._volum;
    }

    set volum(v: number) {
        this._volum = THREE.MathUtils.clamp(v, 0, 1);
        this.settHoved();
    }

    /** Pausemenyen: hovedbussen tones ned, volumet eleven har valgt beholdes. */
    get dempet(): boolean {
        return this._dempet;
    }

    set dempet(d: boolean) {
        this._dempet = d;
        this.settHoved();
    }

    get busser(): BussVolum {
        return { ...this.bussVolum };
    }

    set busser(b: BussVolum) {
        for (const k of ['ute', 'inne', 'hendelse'] as const) this.bussVolum[k] = THREE.MathUtils.clamp(b[k] ?? 1, 0, 1);
        this.settBusser();
    }

    private bussNode(b: Buss | undefined): GainNode {
        return b === 'inne' ? this.inneBuss : b === 'hendelse' ? this.hendelseBuss : this.uteBuss;
    }

    private settBusser(): void {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const v = this.bussVolum;
        // Kvadratisk, som hovedvolumet: glidebryteren føles jevn.
        this.uteBuss.gain.setTargetAtTime(this.uteInne * v.ute * v.ute, t, 0.08);
        this.inneBuss.gain.setTargetAtTime(v.inne * v.inne, t, 0.08);
        this.hendelseBuss.gain.setTargetAtTime(v.hendelse * v.hendelse, t, 0.08);
    }

    get paa(): boolean {
        return this._paa;
    }

    set paa(p: boolean) {
        this._paa = p;
        this.settHoved();
        if (this.ctx && p && this.ctx.state === 'suspended') void this.ctx.resume();
    }

    /**
     * Kalles fra et tastetrykk eller klikk: lager lydmotoren og laster filene. Trygt å kalle flere
     * ganger.
     */
    start(): Promise<void> {
        if (!Lydbilde.stottet) return Promise.resolve();
        if (this.ctx) {
            if (this.ctx.state === 'suspended') void this.ctx.resume();
            return this.laster ?? Promise.resolve();
        }
        const ctx = new AudioContext({ latencyHint: 'interactive' });
        this.ctx = ctx;
        this.hoved = ctx.createGain();
        this.hoved.gain.value = 0;
        this.hoved.connect(ctx.destination);
        this.lavpass = ctx.createBiquadFilter();
        this.lavpass.type = 'lowpass';
        this.lavpass.frequency.value = 20000;
        this.lavpass.Q.value = 0.5;
        this.uteBuss = ctx.createGain();
        this.uteBuss.connect(this.lavpass).connect(this.hoved);
        this.inneBuss = ctx.createGain();
        this.inneBuss.connect(this.hoved);
        this.hendelseBuss = ctx.createGain();
        this.hendelseBuss.connect(this.hoved);
        // Romklang: et kort, kunstig rom (støy som dør ut på et halvt sekund). Ingen fil å laste.
        const romklang = ctx.createConvolver();
        romklang.buffer = lagRomklang(ctx, 0.55);
        this.klang = ctx.createGain();
        this.klang.gain.value = 0;
        this.inneBuss.connect(romklang);
        this.hendelseBuss.connect(romklang);
        romklang.connect(this.klang).connect(this.hoved);
        this.settHoved();
        this.settBusser();
        this.laster = this.last(ctx);
        return this.laster;
    }

    private async last(ctx: AudioContext): Promise<void> {
        const res = await fetch(MAPPE + 'lyd.json');
        const m = (await res.json()) as Manifest;
        const filer = [...Object.values(m.lokker).map((l) => l.fil), ...Object.values(m.sprites).map((s) => s.fil)];
        await Promise.all(filer.map(async (f) => {
            try {
                const data = await (await fetch(MAPPE + f)).arrayBuffer();
                this.buffere.set(f, await ctx.decodeAudioData(data));
            } catch {
                // En fil som mangler eller ikke kan leses, gir bare stillhet der.
            }
        }));
        this.manifest = m;
    }

    private settHoved(): void {
        if (!this.ctx) return;
        const maal = this._paa && !this._dempet ? this._volum * this._volum : 0; // kvadratisk: glidebryteren føles jevn
        this.hoved.gain.setTargetAtTime(maal, this.ctx.currentTime, this._dempet ? 0.15 : 0.08);
    }

    /** Lytteren følger kameraet. */
    lytter(kamera: THREE.Camera): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const l = ctx.listener;
        const p = kamera.getWorldPosition(_p);
        kamera.getWorldDirection(this.fremover);
        if (l.positionX) {
            const t = ctx.currentTime;
            l.positionX.setValueAtTime(p.x, t);
            l.positionY.setValueAtTime(p.y, t);
            l.positionZ.setValueAtTime(p.z, t);
            l.forwardX.setValueAtTime(this.fremover.x, t);
            l.forwardY.setValueAtTime(this.fremover.y, t);
            l.forwardZ.setValueAtTime(this.fremover.z, t);
            l.upX.setValueAtTime(0, t);
            l.upY.setValueAtTime(1, t);
            l.upZ.setValueAtTime(0, t);
        } else {
            l.setPosition(p.x, p.y, p.z);
            l.setOrientation(this.fremover.x, this.fremover.y, this.fremover.z, 0, 1, 0);
        }
    }

    /**
     * Inne (0-1): lavpasset lukkes og romklangen åpnes. Tonet mykt, så det ikke klikker i døra.
     */
    settInne(inne: number): void {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        // Fra 20 kHz ute til ca. 500 Hz godt inne, jevnt i oktaver.
        const hz = 20000 * Math.pow(500 / 20000, THREE.MathUtils.clamp(inne, 0, 1));
        this.lavpass.frequency.setTargetAtTime(hz, t, 0.12);
        this.uteInne = 1 - inne * 0.35;
        this.uteBuss.gain.setTargetAtTime(this.uteInne * this.bussVolum.ute * this.bussVolum.ute, t, 0.12);
        this.klang.gain.setTargetAtTime(inne * 0.5, t, 0.15);
    }

    /**
     * Setter volumet (og stedet) til en løkke. Løkka startes første gang den får volum over null,
     * og fortsetter (stille) etterpå, så den ikke starter forfra hver gang man går ut og inn.
     */
    lokke(navn: string, styrke: number, opts: { pos?: THREE.Vector3 | null; buss?: Buss; ref?: number; fart?: number } = {}): void {
        const ctx = this.ctx;
        if (!ctx || !this.manifest) return;
        let l = this.lokker.get(navn);
        if (!l) {
            if (styrke <= 0.001) return;
            const info = this.manifest.lokker[navn];
            const buf = info && this.buffere.get(info.fil);
            if (!buf) return;
            const kilde = ctx.createBufferSource();
            kilde.buffer = buf;
            kilde.loop = true;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            let panner: PannerNode | null = null;
            kilde.connect(gain);
            if (opts.pos) {
                panner = lagPanner(ctx, opts.ref ?? 2, 1);
                gain.connect(panner).connect(this.bussNode(opts.buss));
            } else gain.connect(this.bussNode(opts.buss));
            // Ulike startpunkt: to løkker av samme lengde skal ikke gå i takt.
            kilde.start(0, Math.random() * buf.duration);
            l = { kilde, gain, panner };
            this.lokker.set(navn, l);
        }
        const t = ctx.currentTime;
        l.gain.gain.setTargetAtTime(styrke, t, 0.25);
        if (opts.fart) l.kilde.playbackRate.setTargetAtTime(opts.fart, t, 0.2);
        if (l.panner && opts.pos) settPos(l.panner, opts.pos, t);
    }

    /** Spiller én lyd fra en sprite (`gruppe` er f.eks. «pip» i «rotter»). Velger en tilfeldig variant. */
    spill(sprite: string, gruppe: string, o: SpillOpts = {}): void {
        const ctx = this.ctx;
        if (!ctx || !this.manifest || !this._paa || ctx.state !== 'running') return;
        if (this.aktive > 24) return;
        const s = this.manifest.sprites[sprite];
        const buf = s && this.buffere.get(s.fil);
        const varianter = s?.lyder[gruppe];
        if (!buf || !varianter?.length) return;
        const [start, len] = varianter[Math.floor(Math.random() * varianter.length)];
        const kilde = ctx.createBufferSource();
        kilde.buffer = buf;
        const fart = o.fart ?? 1;
        kilde.playbackRate.value = fart;
        const gain = ctx.createGain();
        gain.gain.value = o.styrke ?? 1;
        kilde.connect(gain);
        const buss = this.bussNode(o.buss);
        if (o.pos) {
            const p = lagPanner(ctx, o.ref ?? 1.5, 1.2);
            settPos(p, o.pos, ctx.currentTime);
            gain.connect(p).connect(buss);
        } else gain.connect(buss);
        kilde.start(ctx.currentTime + (o.om ?? 0), start, len);
        this.aktive++;
        kilde.onended = () => {
            this.aktive--;
            kilde.disconnect();
            gain.disconnect();
        };
    }

    /**
     * Et lite klokkespill uten fil: rene toner med myk anslag og lang hale (oppdrag tatt, levert).
     * `noter` er [frekvens, start (s), lengde (s)].
     */
    toner(noter: [number, number, number][], styrke = 0.25): void {
        const ctx = this.ctx;
        if (!ctx || !this._paa || ctx.state !== 'running') return;
        const t0 = ctx.currentTime + 0.02;
        for (const [hz, start, len] of noter) {
            for (const [mult, v] of [[1, 1], [2.01, 0.28], [3.02, 0.08]] as const) {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.value = hz * mult;
                const g = ctx.createGain();
                const t = t0 + start;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(styrke * v, t + 0.012);
                g.gain.exponentialRampToValueAtTime(0.0001, t + len);
                o.connect(g).connect(this.hendelseBuss);
                o.start(t);
                o.stop(t + len + 0.05);
                o.onended = () => {
                    o.disconnect();
                    g.disconnect();
                };
            }
        }
    }

    /**
     * Seglet som stemples (oppdrag fullført, ui/Melding.tsx): et dumpt slag i voks og bord, laget av
     * en dempet støyhvisl og en lav tone som faller. `om` er sekunder fra nå. `papir` legger på
     * lyden av arket som rulles ut (lys støy som sveiper).
     */
    stempel(om: number, papir = 0): void {
        const ctx = this.ctx;
        if (!ctx || !this._paa || ctx.state !== 'running') return;
        const t0 = ctx.currentTime + 0.02;
        const stoy = (lengde: number) => {
            const n = Math.ceil(ctx.sampleRate * lengde);
            const buf = ctx.createBuffer(1, n, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const k = ctx.createBufferSource();
            k.buffer = buf;
            return k;
        };
        const kobl = (kilde: AudioScheduledSourceNode, ledd: AudioNode[], t: number, len: number) => {
            let siste: AudioNode = kilde;
            for (const l of ledd) siste = siste.connect(l);
            siste.connect(this.hendelseBuss);
            kilde.start(t);
            kilde.stop(t + len);
            kilde.onended = () => {
                kilde.disconnect();
                for (const l of ledd) l.disconnect();
            };
        };
        if (papir > 0) {
            const t = t0;
            const k = stoy(0.45);
            const f = ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.Q.value = 0.8;
            f.frequency.setValueAtTime(1800, t);
            f.frequency.exponentialRampToValueAtTime(5200, t + 0.4);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.09 * papir, t + 0.08);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
            kobl(k, [f, g], t, 0.45);
        }
        const t = t0 + om;
        // Slaget: lavpasset støy, kort.
        const k = stoy(0.2);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(900, t);
        f.frequency.exponentialRampToValueAtTime(220, t + 0.15);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        kobl(k, [f, g], t, 0.2);
        // Kroppen i slaget: en lav tone som faller.
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.55, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        kobl(o, [og], t, 0.3);
    }

    dispose(): void {
        for (const l of this.lokker.values()) {
            try {
                l.kilde.stop();
            } catch {
                // Allerede stoppet.
            }
        }
        this.lokker.clear();
        void this.ctx?.close();
        this.ctx = null;
    }
}

const _p = new THREE.Vector3();

function lagPanner(ctx: AudioContext, ref: number, rolloff: number): PannerNode {
    // «equalpower» i stedet for HRTF: mye billigere på en Chromebook, og godt nok med høyttalere.
    return new PannerNode(ctx, { panningModel: 'equalpower', distanceModel: 'inverse', refDistance: ref, rolloffFactor: rolloff, maxDistance: 80 });
}

function settPos(p: PannerNode, pos: THREE.Vector3, t: number): void {
    if (p.positionX) {
        p.positionX.setValueAtTime(pos.x, t);
        p.positionY.setValueAtTime(pos.y, t);
        p.positionZ.setValueAtTime(pos.z, t);
    } else p.setPosition(pos.x, pos.y, pos.z);
}

/** Et kunstig rom: dempet støy i to kanaler som dør ut eksponentielt. */
function lagRomklang(ctx: AudioContext, sek: number): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * sek);
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        let lav = 0;
        for (let i = 0; i < n; i++) {
            // Trerom: lite diskant i halen. Et enkelt lavpass på støyen.
            lav += (Math.random() * 2 - 1 - lav) * 0.35;
            d[i] = lav * Math.pow(1 - i / n, 2.2) * (i < ctx.sampleRate * 0.008 ? 0 : 1);
        }
    }
    return buf;
}
