import type { ArcadeSynth } from '../arcade/synth';

// Slagmarkslyden: smell bygd av ekte byggesteiner i stedet for pip. Hvert skudd er tre lag -
// et skarpt knall (høy støy, noen millisekunder), kroppen (filtrert støy) og et dunk (lav sinus) -
// og alt sendes også gjennom et ekko som ruller ut over en åpen slette (`ir`). Hvert skudd får
// litt tilfeldig tonehøyde og styrke, så hundre skudd ikke høres ut som ett skudd hundre ganger.
// Fiendens lyder er lenger unna: svakere, mørkere og mer ekko. UI-lydene står i makeSfx.

interface Bus {
    ac: AudioContext;
    dry: GainNode;
    wet: GainNode;
    white: AudioBuffer;
    brown: AudioBuffer;
}

interface Burst {
    /** Sekunder fra nå. */
    at?: number;
    dur: number;
    vol: number;
    type?: BiquadFilterType;
    f: number;
    /** Filteret glir hit i løpet av lyden (mørkner når smellet dør ut). */
    f2?: number;
    q?: number;
    attack?: number;
    /** Hvor mye som går til ekkoet (0-1). */
    send?: number;
    brown?: boolean;
}

/** Ekkoet over sletta: et tidlig tilbakekast fra skogkanten, så en lang, mørk hale. */
function ir(ac: AudioContext) {
    const len = Math.floor(ac.sampleRate * 2.6);
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
            const t = i / ac.sampleRate;
            // Lavpass i halen: høye toner dør fortere ute i det fri.
            const k = 0.25 + 0.7 * Math.min(1, t / 1.2);
            lp += ((Math.random() * 2 - 1) - lp) * (1 - k);
            const slap = t > 0.11 + ch * 0.02 && t < 0.16 + ch * 0.02 ? 1.6 : 0;
            d[i] = (lp + slap * (Math.random() * 2 - 1)) * Math.exp(-t * 2.4) * (t < 0.02 ? t / 0.02 : 1);
        }
    }
    return buf;
}

function noiseBuf(ac: AudioContext, brown: boolean) {
    const n = ac.sampleRate * 2;
    const b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) {
            last = (last + 0.02 * w) / 1.02;
            d[i] = last * 3.5;
        } else d[i] = w;
    }
    return b;
}

const vary = (v: number, k = 0.15) => v * (1 + (Math.random() * 2 - 1) * k);

export function createField(a: ArcadeSynth) {
    let bus: Bus | null = null;

    const get = (): Bus | null => {
        const c = a.context();
        if (!c) return null;
        if (bus && bus.ac === c.ac) return bus;
        const { ac, out } = c;
        // En kompressor holder et tett slag fra å sprekke, og gjør at smellene «puster».
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.ratio.value = 5;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;
        comp.connect(out);
        const dry = ac.createGain();
        dry.gain.value = 0.9;
        dry.connect(comp);
        const conv = ac.createConvolver();
        conv.buffer = ir(ac);
        const wet = ac.createGain();
        wet.gain.value = 1;
        wet.connect(conv);
        const wetOut = ac.createGain();
        wetOut.gain.value = 0.32;
        conv.connect(wetOut);
        wetOut.connect(comp);
        bus = { ac, dry, wet, white: noiseBuf(ac, false), brown: noiseBuf(ac, true) };
        return bus;
    };

    /** Filtrert støy med kort anslag og eksponentiell hale. */
    const burst = (o: Burst) => {
        const b = get();
        if (!b) return;
        const { ac } = b;
        const t = ac.currentTime + (o.at ?? 0);
        const src = ac.createBufferSource();
        src.buffer = o.brown ? b.brown : b.white;
        const f = ac.createBiquadFilter();
        f.type = o.type ?? 'lowpass';
        f.frequency.setValueAtTime(o.f, t);
        if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
        f.Q.value = o.q ?? 0.7;
        const g = ac.createGain();
        const atk = o.attack ?? 0.002;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(o.vol, t + atk);
        g.gain.exponentialRampToValueAtTime(0.0001, t + atk + o.dur);
        src.connect(f);
        f.connect(g);
        g.connect(b.dry);
        if (o.send) {
            const s = ac.createGain();
            s.gain.value = o.send;
            g.connect(s);
            s.connect(b.wet);
        }
        src.start(t, Math.random() * 1.2);
        src.stop(t + atk + o.dur + 0.05);
    };

    /** Lav sinus som faller: trykket i brystet fra et kanonskudd eller et nedslag. */
    const thump = (f1: number, f2: number, dur: number, vol: number, at = 0, send = 0.3) => {
        const b = get();
        if (!b) return;
        const { ac } = b;
        const t = ac.currentTime + at;
        const o = ac.createOscillator();
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(b.dry);
        if (send) {
            const s = ac.createGain();
            s.gain.value = send;
            g.connect(s);
            s.connect(b.wet);
        }
        o.start(t);
        o.stop(t + dur + 0.05);
    };

    /** Metall som synger: uharmoniske deltoner (granat mot panser). */
    const ring = (base: number, dur: number, vol: number, at = 0) => {
        const b = get();
        if (!b) return;
        const { ac } = b;
        const t = ac.currentTime + at;
        for (const [k, v] of [[1, 1], [2.61, 0.6], [4.23, 0.35], [6.1, 0.2]] as const) {
            const o = ac.createOscillator();
            o.type = 'sine';
            o.frequency.value = base * k;
            const g = ac.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol * v, t + 0.003);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur / k ** 0.4);
            o.connect(g);
            g.connect(b.dry);
            o.start(t);
            o.stop(t + dur + 0.05);
        }
    };

    /** Motor: sagtann gjennom et lavpass, som kommer, passerer og forsvinner. */
    const engine = (f1: number, f2: number, dur: number, vol: number) => {
        const b = get();
        if (!b) return;
        const { ac } = b;
        const t = ac.currentTime;
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f1, t);
        o.frequency.linearRampToValueAtTime(f1 * 1.15, t + dur * 0.45);
        o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(300, t);
        f.frequency.linearRampToValueAtTime(1400, t + dur * 0.45);
        f.frequency.exponentialRampToValueAtTime(250, t + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.45);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f);
        f.connect(g);
        g.connect(b.dry);
        o.start(t);
        o.stop(t + dur + 0.05);
        burst({ dur: dur * 0.6, vol: vol * 1.6, f: 500, f2: 200, attack: dur * 0.4, brown: true, send: 0.3 });
    };

    /** Fløyta til offiseren: en trillende tone (erten i fløyta). */
    const whistle = (dur: number, at = 0) => {
        const b = get();
        if (!b) return;
        const { ac } = b;
        const t = ac.currentTime + at;
        const o = ac.createOscillator();
        o.frequency.value = 2350;
        const lfo = ac.createOscillator();
        lfo.frequency.value = 26;
        const depth = ac.createGain();
        depth.gain.value = 130;
        lfo.connect(depth);
        depth.connect(o.frequency);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
        g.gain.setValueAtTime(0.05, t + dur - 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(b.dry);
        const s = ac.createGain();
        s.gain.value = 0.4;
        g.connect(s);
        s.connect(b.wet);
        for (const n of [o, lfo]) {
            n.start(t);
            n.stop(t + dur + 0.05);
        }
    };

    // ---- Lydene ------------------------------------------------------------------------
    /** Et geværskudd. `far` = fienden, lenger unna. */
    const rifle = (far: boolean, at = 0, v = 1) => {
        const k = (far ? 0.5 : 1) * vary(v, 0.2);
        burst({ at, dur: 0.025, vol: 0.5 * k, type: 'highpass', f: far ? 1800 : 2600, send: 0.2 });
        burst({ at, dur: vary(0.11), vol: 0.4 * k, type: 'bandpass', f: vary(far ? 700 : 1100), q: 1, send: far ? 0.9 : 0.55 });
        thump(vary(150), 60, 0.09, 0.18 * k, at, 0);
    };

    /** Et kanonskudd: knall, et tungt brøl som mørkner, og trykket. */
    const cannon = (far: boolean) => {
        const k = far ? 0.55 : 1;
        burst({ dur: 0.04, vol: 0.55 * k, type: 'highpass', f: 1500 });
        burst({ dur: vary(0.9), vol: 0.75 * k, f: far ? 500 : 900, f2: 90, brown: true, send: far ? 0.9 : 0.6 });
        thump(vary(80), 30, 0.45, 0.5 * k);
    };

    /** Et nedslag: jord og luft som kastes opp, så smuss som drysser ned. */
    const explosion = (big: number, far = false) => {
        const k = big * (far ? 0.5 : 1);
        burst({ dur: 0.05, vol: 0.45 * k, type: 'highpass', f: 1200 });
        burst({ dur: vary(1.1 * big), vol: 0.85 * k, f: vary(far ? 400 : 700), f2: 60, brown: true, send: far ? 1 : 0.6 });
        thump(vary(65), 24, 0.7 * big, 0.6 * k);
        if (!far) for (let i = 0; i < 5; i++) burst({ at: 0.18 + Math.random() * 0.6, dur: 0.03, vol: 0.06 * k, type: 'highpass', f: 2500 + Math.random() * 2000 });
    };

    /** Radiostøy: knitring og et kort sus. */
    const stat = (dur: number) => {
        for (let i = 0; i < 6; i++) burst({ at: i * (dur / 6) + Math.random() * 0.03, dur: 0.03 + Math.random() * 0.04, vol: 0.08, type: 'bandpass', f: 1800 + Math.random() * 1500, q: 2 });
        burst({ dur, vol: 0.04, type: 'bandpass', f: 2600, q: 0.8, attack: 0.01 });
    };

    return (name: string): boolean => {
        if (!a.context()) return false;
        switch (name) {
            case 'gevær':
                rifle(false);
                break;
            case 'egevær':
                rifle(true);
                break;
            case 'mg':
                // Maskingevær: et kort belte, raskt og ujevnt.
                for (let i = 0, t = 0; i < 6; i++, t += vary(0.07, 0.1)) rifle(false, t, 0.75);
                break;
            case 'kanon':
                cannon(false);
                break;
            case 'ekanon':
                cannon(true);
                break;
            case 'klang':
                // Granaten slår mot panser: et hardt klakk og metall som synger.
                burst({ dur: 0.04, vol: 0.4, type: 'highpass', f: 3000 });
                ring(vary(430, 0.2), 0.5, 0.06);
                burst({ dur: 0.25, vol: 0.2, type: 'bandpass', f: 1500, send: 0.4 });
                break;
            case 'nedslag':
                explosion(0.8);
                break;
            case 'smell':
                explosion(1);
                break;
            case 'salvenedslag':
                explosion(1.3);
                break;
            case 'salve':
                // Batteriet skyter langt unna: fire dumpe drønn etter hverandre.
                for (let i = 0; i < 3; i++) {
                    burst({ at: i * 0.18, dur: 1.2, vol: 0.4, f: 300, f2: 60, brown: true, send: 1 });
                    thump(55, 28, 0.6, 0.3, i * 0.18, 0.6);
                }
                break;
            case 'flak':
                // Luftvern: et skarpt smell nede, og granaten som springer i lufta litt etter.
                burst({ dur: 0.03, vol: 0.35, type: 'highpass', f: 2200 });
                burst({ dur: 0.18, vol: 0.3, type: 'bandpass', f: 600, send: 0.5 });
                burst({ at: 0.14, dur: 0.6, vol: 0.25, f: 900, f2: 200, brown: true, send: 0.9 });
                break;
            case 'fjern':
                // Torden fra kanoner langt unna: bare bassen og ekkoet kommer fram.
                burst({ dur: 2.2, vol: 0.35, f: 160, f2: 50, brown: true, attack: 0.06, send: 1 });
                thump(45, 25, 1.4, 0.18, 0, 0.8);
                break;
            case 'fjernSalve':
                for (let i = 0; i < 4; i++) burst({ at: i * 0.16 + Math.random() * 0.05, dur: 1.5, vol: 0.3, f: 200, f2: 50, brown: true, attack: 0.03, send: 1 });
                break;
            case 'fjernMg':
                for (let i = 0; i < 8; i++) burst({ at: i * 0.075, dur: 0.06, vol: 0.05, type: 'bandpass', f: 600, send: 1 });
                break;
            case 'vind':
                burst({ dur: 3, vol: 0.06, f: 400, f2: 250, brown: true, attack: 1.2 });
                break;
            case 'hyl':
                // Granatene på vei ned: et fallende hyl med sus av luft.
                a.tone(1500, 520, 1.25, 'sine', 0.035);
                burst({ dur: 1.2, vol: 0.05, type: 'bandpass', f: 2200, f2: 700, q: 3, attack: 0.5 });
                break;
            case 'snik':
                // Snikskuddet: et knall som river, og ekkoet som ruller fram og tilbake mellom åsene.
                burst({ dur: 0.02, vol: 0.75, type: 'highpass', f: 3200, send: 0.6 });
                burst({ dur: 0.14, vol: 0.5, type: 'bandpass', f: 1300, q: 0.9, send: 1 });
                thump(180, 60, 0.12, 0.3);
                burst({ at: 0.35, dur: 0.4, vol: 0.12, f: 900, f2: 300, send: 1 });
                burst({ at: 0.8, dur: 0.6, vol: 0.06, f: 600, f2: 200, send: 1 });
                break;
            case 'signal':
                // Signalraketten: et dumpt plopp og et fresende sus opp i lufta.
                burst({ dur: 0.08, vol: 0.3, f: 500, brown: true });
                burst({ at: 0.03, dur: 0.9, vol: 0.12, type: 'bandpass', f: 3500, f2: 1600, q: 1.5, attack: 0.05, send: 0.5 });
                break;
            case 'typhoon':
                engine(85, 70, 2.6, 0.06);
                break;
            case 'rakett':
                // Rakett som går: et fresende sus.
                burst({ dur: 0.5, vol: 0.25, type: 'bandpass', f: 1200, f2: 3200, q: 1.2, attack: 0.03, send: 0.4 });
                break;
            case 'stup':
                // Stukaens sirene når den stuper.
                a.tone(420, 1150, 1.2, 'sawtooth', 0.018);
                burst({ dur: 1.2, vol: 0.06, type: 'bandpass', f: 900, f2: 2400, q: 4, attack: 0.6 });
                break;
            case 'sakte':
                // Sakte film: et dypt sug og en tung dunk.
                burst({ dur: 1, vol: 0.4, f: 300, f2: 60, brown: true, attack: 0.2, send: 0.6 });
                thump(70, 28, 0.9, 0.4, 0.15);
                break;
            case 'kutt':
                stat(0.3);
                break;
            case 'bølge':
                // Offiserens fløyte: to korte støt, så går angrepet.
                whistle(0.22);
                whistle(0.45, 0.32);
                break;
            case 'marsj':
                // Kompaniet går: støvler i grus.
                for (let i = 0; i < 4; i++) burst({ at: i * 0.13, dur: 0.07, vol: 0.12, type: 'bandpass', f: vary(900), q: 1.5 });
                break;
            default:
                return false;
        }
        return true;
    };
}
