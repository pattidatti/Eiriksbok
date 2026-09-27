// Tilstanden bak arkadeskallets tekstlag: banner, lapper, lærings-øyeblikk,
// «Dette skjedde» og flytende poengtekst.
//
// Alt her lever UTENFOR spillkomponentens React-tilstand. Grunnen er ytelse:
// da en melding var `useState` i spillkomponenten, tegnet React hele 3D-treet på
// nytt for hver «+340 SNUDD» og hver toast - og spillet hakket midt i kampen
// (Plottebordet, september 2026). Nå abonnerer bare det lille tekstlaget.
//
// Hvorfor ikke toasts under spillet lenger: eleven ser på spillet, ikke under det
// (eier, 2026-09-26). Tekst som skal leses, må stå der blikket er - festet til
// tingen den handler om - eller komme når spillet har pause.

/** Et punkt i spillvinduet, i CSS-piksler fra øvre venstre hjørne. null = ikke synlig nå. */
export type Anchor = () => { x: number; y: number } | null;

type Listener = () => void;

class Emitter {
    private ls = new Set<Listener>();
    version = 0;
    subscribe = (l: Listener) => {
        this.ls.add(l);
        return () => {
            this.ls.delete(l);
        };
    };
    getVersion = () => this.version;
    emit() {
        this.version++;
        this.ls.forEach((l) => l());
    }
}

// ---------------------------------------------------------------------------
// Banner (kort tittel midt i bildet)
// ---------------------------------------------------------------------------

export interface BannerMsg {
    t: string;
    color: string;
    n: number;
    dur: number;
}

export class BannerStore extends Emitter {
    current: BannerMsg | null = null;
    private q: BannerMsg[] = [];
    private timer: number | undefined;
    private n = 0;
    push(t: string, color: string, dur = 2.2) {
        this.n++;
        this.q.push({ t, color, n: this.n, dur });
        while (this.q.length > 2) this.q.shift();
        if (!this.current) this.next();
    }
    private next = () => {
        this.current = this.q.shift() ?? null;
        this.emit();
        if (this.current) this.timer = window.setTimeout(this.next, this.current.dur * 1000 + 150);
    };
    clear() {
        this.q.length = 0;
        window.clearTimeout(this.timer);
        this.current = null;
        this.emit();
    }
    dispose() {
        window.clearTimeout(this.timer);
    }
}

// ---------------------------------------------------------------------------
// Coach: lapper, lærings-øyeblikk og «Dette skjedde»
// ---------------------------------------------------------------------------

export type PinTone = 'info' | 'fare' | 'bra';

export interface CoachPin {
    key: string;
    text: string;
    at: Anchor;
    tone: PinTone;
    until?: () => boolean;
    born: number;
    seconds: number;
}

export interface CoachBeat {
    key: string;
    title: string;
    text: string;
    at?: Anchor;
    until?: () => boolean;
    born: number;
}

export interface PinOptions {
    tone?: PinTone;
    /** Lappen forsvinner når dette blir sant (eleven gjorde det lappen ba om). */
    until?: () => boolean;
    /** Lengste levetid i sekunder (standard 6). */
    seconds?: number;
    /** Vis bare første gang denne eleven spiller (lagres i nettleseren). */
    once?: boolean;
}

export interface BeatOptions {
    at?: Anchor;
    /** Øyeblikket slutter av seg selv når eleven gjør handlingen. */
    until?: () => boolean;
}

/** Hvor fort spillet går mens et lærings-øyeblikk står (sakte film, ikke stopp). */
export const BEAT_TIME_SCALE = 0.12;
const MAX_WORDS_PIN = 7;
const MAX_WORDS_BEAT = 22;

// Ord = tegngrupper med bokstaver eller tall («-», «→» og emoji teller ikke).
const words = (s: string) =>
    s
        .trim()
        .split(/\s+/)
        .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

export class CoachStore extends Emitter {
    pins: CoachPin[] = [];
    beat: CoachBeat | null = null;
    private lessonList: { key: string; text: string; weight: number; order: number }[] = [];
    private seen: Set<string>;
    private beatsThisRun = 0;
    private storageKey: string;

    private maxBeats: number;

    constructor(gameId: string, maxBeats = 3) {
        super();
        this.maxBeats = maxBeats;
        this.storageKey = `arcade_coach_${gameId}`;
        this.seen = new Set();
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) for (const k of JSON.parse(raw) as string[]) this.seen.add(k);
        } catch {
            /* privat modus o.l. - da vises alt hver gang */
        }
    }

    private remember(key: string) {
        this.seen.add(key);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify([...this.seen]));
        } catch {
            /* ignorer */
        }
    }

    /** En kort lapp festet til noe i spillet. Maks ~7 ord - det er et skilt, ikke en setning. */
    point(key: string, text: string, at: Anchor, opts: PinOptions = {}) {
        if (opts.once && this.seen.has(`pin:${key}`)) return false;
        if (import.meta.env.DEV && words(text) > MAX_WORDS_PIN)
            console.warn(
                `[coach] lappen «${text}» har ${words(text)} ord - hold den på ${MAX_WORDS_PIN} eller færre`
            );
        this.pins = this.pins.filter((p) => p.key !== key);
        this.pins.push({
            key,
            text,
            at,
            tone: opts.tone ?? 'info',
            until: opts.until,
            born: performance.now(),
            seconds: opts.seconds ?? 6,
        });
        // Aldri mer enn to lapper samtidig: den eldste viker.
        while (this.pins.length > 2) this.pins.shift();
        if (opts.once) this.remember(`pin:${key}`);
        this.emit();
        return true;
    }

    unpoint(key: string) {
        const before = this.pins.length;
        this.pins = this.pins.filter((p) => p.key !== key);
        if (this.pins.length !== before) this.emit();
    }

    /**
     * Et lærings-øyeblikk: spillet går i sakte film, og et kort med én setning
     * står ved hendelsen til eleven gjør handlingen eller trykker «Skjønner».
     * Vises bare første gang (per elev), og maks tre per runde.
     */
    beatOnce(key: string, title: string, text: string, opts: BeatOptions = {}) {
        if (this.beat || this.seen.has(`beat:${key}`) || this.beatsThisRun >= this.maxBeats)
            return false;
        if (import.meta.env.DEV && words(text) > MAX_WORDS_BEAT)
            console.warn(
                `[coach] øyeblikket «${title}» har ${words(text)} ord - hold det på ${MAX_WORDS_BEAT} eller færre`
            );
        this.beatsThisRun++;
        this.remember(`beat:${key}`);
        this.beat = { key, title, text, at: opts.at, until: opts.until, born: performance.now() };
        this.emit();
        return true;
    }

    endBeat() {
        if (!this.beat) return;
        this.beat = null;
        this.emit();
    }

    /** 1 normalt, BEAT_TIME_SCALE mens et lærings-øyeblikk står. Gang dt med denne. */
    timeScale() {
        return this.beat ? BEAT_TIME_SCALE : 1;
    }

    /**
     * Noe eleven skal sitte igjen med. Samles gjennom runden og vises på
     * slutt-skjermen («Dette skjedde»), der eleven har tid til å lese.
     * Samme nøkkel to ganger teller som viktigere, ikke som to linjer.
     */
    lesson(key: string, text: string, weight = 1) {
        const hit = this.lessonList.find((l) => l.key === key);
        if (hit) hit.weight += weight;
        else this.lessonList.push({ key, text, weight, order: this.lessonList.length });
    }

    /** De viktigste læringspunktene fra runden (flest ganger / tyngst først). */
    lessons(max = 3) {
        return [...this.lessonList]
            .sort((a, b) => b.weight - a.weight || a.order - b.order)
            .slice(0, max)
            .map((l) => l.text);
    }

    /** Ny runde: tøm lapper, øyeblikk og læringspunkter (det eleven har sett, huskes). */
    resetRun() {
        this.pins = [];
        this.beat = null;
        this.lessonList = [];
        this.beatsThisRun = 0;
        this.emit();
    }

    /** Glem hva eleven har sett (for «Vis hjelp igjen» i menyen). */
    forgetSeen() {
        this.seen.clear();
        try {
            localStorage.removeItem(this.storageKey);
        } catch {
            /* ignorer */
        }
    }
}

// ---------------------------------------------------------------------------
// Flytende poengtekst («+340 SNUDD»)
// ---------------------------------------------------------------------------

export interface FloatMsg {
    id: number;
    t: string;
    x: number;
    y: number;
    color: string;
    big: boolean;
}

export class FloatStore extends Emitter {
    items: FloatMsg[] = [];
    private n = 0;
    push(t: string, x: number, y: number, color = '#f7f1e3', big = false) {
        this.n++;
        const id = this.n;
        // Maks to samtidig, og aldri oppå hverandre: en ny tekst nær en som allerede
        // svever, skyves opp over den. (Thranittene 2026-09-27: flytetekstene la seg
        // oppå hverandre og oppå stedsnavnene - vurdereren trakk for det tre ganger.)
        let yy = y;
        for (let k = 0; k < 4; k++) {
            const hit = this.items.find((f) => Math.abs(f.x - x) < 150 && Math.abs(f.y - yy) < 30);
            if (!hit) break;
            yy = hit.y - 32;
        }
        this.items = [...this.items.slice(-1), { id, t, x, y: yy, color, big }];
        this.emit();
        window.setTimeout(() => {
            this.items = this.items.filter((f) => f.id !== id);
            this.emit();
        }, 1300);
    }
    clear() {
        this.items = [];
        this.emit();
    }
}
