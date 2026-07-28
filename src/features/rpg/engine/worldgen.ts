// Bygger kartet for Nordvik. Grunnformen er håndlagt (fjorden i vest, bygda i
// midten, tingplassen i øst, gravhaugen lengst ute), mens gress, skog og
// steiner strøs ut med en seedet generator - så kartet ser levende ut, men er
// helt likt hver gang eleven kommer tilbake.

import { NORDVIK_PORTAL, NORDVIK_SIZE } from '../data/nordvik';
import { makeRng } from './pixels';
import type { TileKey } from './tileforge';

export interface PropPlacement {
    kind:
        | 'tre'
        | 'busk'
        | 'blomst'
        | 'stein'
        | 'langhus'
        | 'bu'
        | 'kirke'
        | 'naust'
        | 'gjerde'
        | 'langskip'
        | 'kai'
        | 'benk'
        | 'telt'
        | 'kors';
    /** Piksler, ikke ruter. */
    x: number;
    y: number;
    solid: boolean;
    /** Kollisjonsboks i piksler, sentrert på foten av objektet. */
    treff?: { w: number; h: number; dy: number };
    /** Hvilken av variantene som brukes. 130 identiske trær leser som fyllmasse. */
    variant: number;
    /** Speilvendt? Gratis dobling av variasjonen. */
    flip: boolean;
    /** Liten størrelsesvariasjon, så skogen ikke er klippet av samme mal. */
    skala: number;
    /** Svak fargeforskyvning, samme grunn. */
    tint: number;
}

export interface WorldMap {
    bredde: number;
    hoyde: number;
    terreng: TileKey[][];
    /** true = kan ikke gås gjennom. */
    blokkert: boolean[][];
    /**
     * true = en farkost kan ferdes her. Nesten det motsatte av `blokkert`, men
     * ikke helt: brygga er gåbar *og* usjøbar, for et fartøy seiler ikke under
     * en brygge. Gjenbruker man spillerens maske, går båten på land.
     * (Blueprint R5, fallgruve 6.)
     */
    farbart: boolean[][];
    props: PropPlacement[];
    /** Der fiender får lov å dukke opp. */
    spawnRuter: [number, number][];
    /** Bossens arena. */
    bossArena: { x: number; y: number; r: number };
}

const { bredde: W, hoyde: H } = NORDVIK_SIZE;

const VANN_GRENSE = 6;
const SAND_GRENSE = 8;

/**
 * Det som skiller ett Nordvik fra et annet.
 *
 * Gården er den samme gjennom hele kampanjen, og det er hele poenget: eleven
 * skal kjenne igjen stien og naustet 79 år senere. Derfor er dette ikke to
 * kartgeneratorer, men den ene med to-tre ting flyttet på - og de tre tingene
 * er de eneste som *skal* si at tiden har gått.
 */
export interface NordvikValg {
    /**
     * Ruta et skip ligger på svai på, eller `null` for tom fjord.
     *
     * Ikke et ja/nei: i 793 ligger gårdens eget langskip lengst sør, i 872 er
     * fjorden tom fordi mennene tok det med til Hafrsfjord, og i 995 ligger
     * kongens knarr rett utenfor tunet. Samme skrog, tre helt forskjellige
     * setninger - og alle tre sies uten ord.
     */
    langskip?: [number, number] | null;
    /** Gravhaugene, om noen ligger her. Rutene de ligger på. */
    hauger?: [number, number][];
    /**
     * Hovet, om det står her. Ruta huset ligger på.
     *
     * Bygges som et langhus, og det er ikke en snarvei: et hov *var* et hus av
     * samme slag, ofte høvdingens egen hall. Det som gjør det til et hov, er
     * hva som skjer inni det.
     */
    hov?: [number, number] | null;
    /**
     * Kirken, om den står her. Ruta huset ligger på.
     *
     * Skal stå på samme rute som hovet sto på, og det er ikke en snarvei i
     * koden - det er det som faktisk skjedde. Under gulvet i Mære kirke ligger
     * gullgubber fra hedensk kult: kirken ble reist der folk kom fra før.
     *
     * Tråkket rundt og veien ned til bygda er den samme som hovet fikk. Det er
     * med vilje: stien er slitt av folk som har gått den i generasjoner, og den
     * ble ikke lagt om av at huset i enden ble byttet ut.
     */
    kirke?: [number, number] | null;
    /**
     * Kirkegården: rader med trekors nedenfor kirken.
     *
     * Bare epilogen har den, og den er den siste setningen kampanjen sier uten
     * ord. I 1030 står det på skiltet ved haugene at de døde legges i vigslet
     * jord ved kirken nå; sytti år senere ligger de der, i rader, med hodet mot
     * vest - og haugene er to grasrygger ingen kan navnet på.
     *
     * Krever at `kirke` står. Et gravfelt uten kirke er ikke en kirkegård.
     */
    kirkegard?: boolean;
}

export function byggNordvik({
    // Ved brygga, ikke oppe i fjellet. Standardverdien var [3, 46], og kartet
    // er 64x48 - alt sør for y=44 er fjellet som lukker fjorden. Skroget med
    // skjoldene lå halvveis oppå den grå berget, i både 793 og 1030 (som ikke
    // sender egen verdi og derfor arvet feilen). 872 sender null, og 995 sender
    // kongens knarr, så de to slapp unna.
    //
    // [2, 43] legger skipet langs vestenden av brygga, som går på y=42. Baugen
    // rekker akkurat borti sanden, og det er som det skal være: et skip ligger
    // ikke og svever midt i en fjord, det ligger fortøyd.
    langskip = [2, 43],
    hauger = [],
    hov = null,
    kirke = null,
    kirkegard = false,
}: NordvikValg = {}): WorldMap {
    const rng = makeRng(1793);
    const terreng: TileKey[][] = [];
    const blokkert: boolean[][] = [];
    const farbart: boolean[][] = [];

    for (let y = 0; y < H; y++) {
        terreng[y] = [];
        blokkert[y] = [];
        farbart[y] = [];
        for (let x = 0; x < W; x++) {
            let flis: TileKey = 'gress';
            // Fjorden bukter seg litt, så kystlinjen ikke blir en strek.
            const bukt = Math.sin(y * 0.28) * 1.8 + Math.sin(y * 0.11) * 1.2;
            const vannKant = VANN_GRENSE + bukt;
            const sandKant = SAND_GRENSE + bukt;

            if (x < vannKant) {
                flis = 'vann';
            } else if (x < sandKant) {
                flis = 'sand';
            }
            terreng[y][x] = flis;
            blokkert[y][x] = flis === 'vann';
            farbart[y][x] = flis === 'vann';
        }
    }

    // ── Fjellene i nord og øst rammer inn sonen ─────────────────────────────
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const nordFjell = y < 3 + Math.sin(x * 0.3) * 1.5;
            const sorFjell = y > H - 4 + Math.sin(x * 0.24) * 1.5;
            const ostFjell = x > W - 4 + Math.sin(y * 0.3) * 1.5;
            if (nordFjell || sorFjell || ostFjell) {
                terreng[y][x] = 'stein';
                blokkert[y][x] = true;
                // Fjellet lukker fjorden i begge ender. Glemmes denne, blir
                // ruta liggende igjen som farbar fra første runde, og båten
                // seiler tvers gjennom berget.
                farbart[y][x] = false;
            }
        }
    }

    // ── Stien gjennom bygda, videre til tinget og gravhaugen ────────────────
    const sti: [number, number][] = [];
    const leggSti = (x0: number, y0: number, x1: number, y1: number) => {
        let x = x0;
        let y = y0;
        while (x !== x1 || y !== y1) {
            sti.push([x, y]);
            if (x !== x1 && (y === y1 || rng() > 0.4)) x += Math.sign(x1 - x);
            else y += Math.sign(y1 - y);
        }
        sti.push([x1, y1]);
    };
    leggSti(10, 32, 20, 30);
    leggSti(20, 30, 30, 26);
    leggSti(30, 26, 38, 24);
    leggSti(38, 24, 46, 20);
    leggSti(46, 20, 54, 18);
    leggSti(20, 30, 22, 38);

    for (const [x, y] of sti) {
        for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
        ]) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
            if (terreng[ty][tx] === 'vann' || terreng[ty][tx] === 'stein') continue;
            terreng[ty][tx] = 'sti';
        }
    }

    // ── Tingplassen: en åpen steinring ──────────────────────────────────────
    const tingX = 38;
    const tingY = 24;
    for (let y = tingY - 5; y <= tingY + 5; y++) {
        for (let x = tingX - 6; x <= tingX + 6; x++) {
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            const d = Math.hypot((x - tingX) / 6, (y - tingY) / 5);
            if (d < 1) terreng[y][x] = 'sti';
        }
    }

    // ── Åkerlapper sør for bygda ────────────────────────────────────────────
    for (let y = 36; y < 42; y++) {
        for (let x = 24; x < 34; x++) {
            if (terreng[y][x] === 'gress') terreng[y][x] = 'aker';
        }
    }

    // ── Gravhaugen: bossens arena ───────────────────────────────────────────
    const bossX = 54;
    const bossY = 16;
    for (let y = bossY - 7; y <= bossY + 7; y++) {
        for (let x = bossX - 7; x <= bossX + 7; x++) {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            const d = Math.hypot(x - bossX, y - bossY);
            if (d < 7) {
                terreng[y][x] = d > 5.5 ? 'stein' : 'sti';
                blokkert[y][x] = false;
            }
        }
    }

    const props: PropPlacement[] = [];
    const opptatt = new Set<string>();
    const merk = (x: number, y: number, w = 1, h = 1) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) opptatt.add(`${x + dx},${y + dy}`);
        }
    };
    const erLedig = (x: number, y: number, w = 1, h = 1) => {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) return false;
                if (opptatt.has(`${tx},${ty}`)) return false;
                const t = terreng[ty][tx];
                // Trær midt i åkeren ser ut som en feil, for det er det.
                if (t === 'vann' || t === 'stein' || t === 'sti' || t === 'aker') return false;
            }
        }
        return true;
    };

    // ── Plassen foran porten hjem ───────────────────────────────────────────
    // Ryddes før alt annet plasseres. `strø` hopper over ruter som er merket,
    // og over alt som ligger inntil en sti - så både porten og lufta rundt den
    // holder seg fri for skog.
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const px = NORDVIK_PORTAL[0] + dx;
            const py = NORDVIK_PORTAL[1] + dy;
            if (px < 1 || py < 1 || px >= W - 1 || py >= H - 1) continue;
            if (terreng[py][px] === 'vann' || terreng[py][px] === 'stein') continue;
            terreng[py][px] = 'sti';
            blokkert[py][px] = false;
            merk(px, py);
        }
    }

    // ── Haugene over gårdens egne ───────────────────────────────────────────
    // En lav rygg med jord på og en krans av stein rundt. De er *ikke* arenaer
    // og har ingen fiende i seg: dette er graver, og eleven skal kunne gå opp
    // på dem og lese steinen som står der - eller se at det ikke står noen.
    //
    // Ligger etter `merk` med vilje - haugen skal rydde plass til seg selv, så
    // ingen skog strøs ned i den etterpå.
    for (const [hx, hy] of hauger) {
        for (let y = hy - 3; y <= hy + 3; y++) {
            for (let x = hx - 3; x <= hx + 3; x++) {
                if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
                if (terreng[y][x] === 'vann') continue;
                const d = Math.hypot(x - hx, (y - hy) * 1.3);
                if (d > 3) continue;
                // Steinkrans ytterst, tråkket sti på toppen: en haug folk går
                // opp på. Gress ville gjort den usynlig mot enga rundt.
                terreng[y][x] = d > 2.2 ? 'stein' : 'sti';
                blokkert[y][x] = false;
                merk(x, y);
            }
        }
    }

    // ── Bygninger ───────────────────────────────────────────────────────────
    /** Standardverdier for et objekt uten variasjon (bygninger, kaier). */
    const fast = { variant: 0, flip: false, skala: 1, tint: 0 };

    const bygg = (
        kind: PropPlacement['kind'],
        tx: number,
        ty: number,
        w: number,
        h: number,
        treff: { w: number; h: number; dy: number }
    ) => {
        props.push({ kind, x: tx * 16 + 8, y: ty * 16 + 8, solid: true, treff, ...fast });
        merk(tx - Math.floor(w / 2), ty - Math.floor(h / 2), w, h);
        for (let dy = -Math.floor(h / 2); dy <= Math.floor(h / 2); dy++) {
            for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
                const bx = tx + dx;
                const by = ty + dy;
                if (bx > 0 && by > 0 && bx < W && by < H) {
                    blokkert[by][bx] = true;
                    farbart[by][bx] = false;
                }
            }
        }
    };

    bygg('langhus', 18, 27, 5, 4, { w: 62, h: 26, dy: 10 });
    // ── Hovet, og kirken som kom etter det ──────────────────────────────────
    // Tråkket jord rundt huset og en vei ned til stien gjennom bygda. Tråkket
    // er ikke pynt: et hov var stedet hele bygda kom til, og en gresslette uten
    // en eneste sti inn ville sagt at ingen går dit.
    //
    // De to deler kode fordi de deler grunn. I 995 står hovet der; i 1030 står
    // kirken på samme rute, med den samme stien opp - og det er ikke en
    // gjenbruksfinte, det er hva som faktisk skjedde.
    const helligsted = hov ?? kirke;
    if (helligsted) {
        const [ox, oy] = helligsted;
        const traakk = (x: number, y: number) => {
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
            if (terreng[y][x] === 'vann' || terreng[y][x] === 'stein') return;
            terreng[y][x] = 'sti';
            blokkert[y][x] = false;
        };
        for (let y = oy - 3; y <= oy + 3; y++) {
            for (let x = ox - 4; x <= ox + 4; x++) {
                if (Math.hypot((x - ox) / 4, (y - oy) / 3) > 1) continue;
                traakk(x, y);
            }
        }
        // Veien opp. Den treffer hovedstien der den svinger mot tinget, så
        // hovet henger sammen med bygda i stedet for å ligge for seg selv i
        // skogen.
        for (let y = oy + 3; y <= 26; y++) {
            traakk(ox, y);
            traakk(ox + 1, y);
        }
        // Samme grunn, to hus. Kirken er smalere enn hovet var, og
        // kollisjonsboksen følger huset og ikke tomta - eleven skal kunne gå
        // rundt den der hovet sperret.
        if (hov) bygg('langhus', ox, oy, 5, 4, { w: 62, h: 26, dy: 10 });
        else bygg('kirke', ox, oy, 3, 4, { w: 36, h: 18, dy: 8 });

        // Kirkegården. Fire rader sør for kirken, med hodet mot vest - altså
        // korsene på rekke nedover, slik de faktisk ble lagt.
        //
        // Ingen av dem er `solid`. Eleven skal kunne gå mellom gravene, og et
        // gravfelt som stenger henne ute er et gjerde med kors på. Den lille
        // forskyvningen kommer fra den seedede generatoren: et helt rett rutenett
        // ser tegnet ut, og disse ble satt ned én om gangen over sytti år.
        if (kirkegard) {
            for (let rad = 0; rad < 4; rad++) {
                for (let n = 0; n < 5; n++) {
                    const gx = ox - 2 + n;
                    const gy = oy + 3 + rad;
                    if (gx < 1 || gy < 1 || gx >= W - 1 || gy >= H - 1) continue;
                    if (terreng[gy][gx] === 'vann' || terreng[gy][gx] === 'stein') continue;
                    props.push({
                        kind: 'kors',
                        x: gx * 16 + 8 + Math.round(rng() * 4 - 2),
                        y: gy * 16 + 10 + Math.round(rng() * 3 - 1),
                        solid: false,
                        ...fast,
                    });
                }
            }
        }
    }
    bygg('bu', 25, 33, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('bu', 13, 22, 3, 3, { w: 34, h: 16, dy: 8 });
    bygg('naust', 8, 39, 4, 3, { w: 42, h: 16, dy: 6 });

    // ── Brygga ──────────────────────────────────────────────────────────────
    // Den gikk før fra x=4 til x=8, altså langs stranda og ikke ut i vannet.
    // Nå strekker den seg helt ut til x=1, så eleven kan gå tørrskodd fram til
    // båten og gå om bord. Plankene er gåbare (`blokkert = false`) og
    // *usjøbare* (`farbart = false`): et fartøy seiler ikke under en brygge.
    // Den slutter på den første gressruta (x=6 på rad 41) og ikke lenger inn:
    // planker som fortsetter tvers over plenen leser som en feil, ikke som en
    // brygge.
    for (let x = 1; x <= 6; x++) {
        if (!terreng[41]?.[x]) continue;
        props.push({ kind: 'kai', x: x * 16 + 8, y: 41 * 16 + 8, solid: false, ...fast });
        blokkert[41][x] = false;
        farbart[41][x] = false;
    }

    // Langskipet ligger på svai lenger sør - ren pynt, og grunnen til at stedet
    // heter Nordvik. Båten eleven faktisk kan ro, står i `NORDVIK_FARKOSTER`.
    // Skroget er 66 piksler bredt, så det må ligge minst to ruter fra
    // kartkanten for ikke å bli klippet.
    //
    // I 872 ligger det ikke der. Mennene tok det med sørover til Hafrsfjord, og
    // den tomme fjorden er den første setningen kapittelet sier - uten ord. I
    // 995 ligger det et skrog der igjen, men det er ikke gårdens eget.
    if (langskip) {
        props.push({
            kind: 'langskip',
            x: langskip[0] * 16,
            y: langskip[1] * 16,
            solid: false,
            ...fast,
        });
    }

    // Gjerde rundt åkrene
    for (let x = 24; x < 34; x += 1) {
        props.push({ kind: 'gjerde', x: x * 16 + 8, y: 35 * 16 + 12, solid: false, ...fast });
    }

    // ── Skog, busker og steiner ─────────────────────────────────────────────
    const strø = (
        kind: PropPlacement['kind'],
        antall: number,
        treff: { w: number; h: number; dy: number } | undefined,
        varianter: number,
        omrade?: (x: number, y: number) => boolean
    ) => {
        let plassert = 0;
        let forsok = 0;
        while (plassert < antall && forsok < antall * 40) {
            forsok += 1;
            const x = 2 + Math.floor(rng() * (W - 4));
            const y = 2 + Math.floor(rng() * (H - 4));
            if (omrade && !omrade(x, y)) continue;
            if (!erLedig(x, y)) continue;
            // Ikke rett inntil stien - eleven skal kunne gå.
            if (terreng[y][x + 1] === 'sti' || terreng[y][x - 1] === 'sti') continue;
            props.push({
                kind,
                // Litt slark i plasseringen, så objektene ikke står i rutenett.
                x: x * 16 + 8 + Math.round((rng() - 0.5) * 6),
                y: y * 16 + 8 + Math.round((rng() - 0.5) * 4),
                solid: treff !== undefined,
                treff,
                variant: Math.floor(rng() * varianter),
                flip: rng() > 0.5,
                skala: 0.9 + rng() * 0.22,
                tint: Math.round((rng() - 0.5) * 22),
            });
            // Bevisst ikke `blokkert` her: et tre stopper deg med sin egen
            // lille stamme-boks. Merket vi hele ruta som sperret, ville en skog
            // blitt en vegg det er umulig å gå gjennom.
            merk(x, y);
            plassert += 1;
        }
    };

    strø('tre', 130, { w: 10, h: 8, dy: 12 }, 3, (x, y) => y < 18 || y > 38 || x > 44);
    strø('busk', 60, undefined, 2);
    strø('stein', 34, { w: 12, h: 8, dy: 4 }, 3);
    // Blomster sist, og bare i gresset. De merker ingen ruter som opptatt via
    // `erLedig` som alle andre - men de er små nok til at et tre som står i
    // samme rute leser som en blomst *ved foten av* treet, ikke som en feil.
    strø('blomst', 170, undefined, 3, (x, y) => terreng[y][x] === 'gress');

    // ── Hvor fiender får dukke opp ──────────────────────────────────────────
    const spawnRuter: [number, number][] = [];
    for (let y = 4; y < H - 4; y++) {
        for (let x = SAND_GRENSE + 2; x < W - 4; x++) {
            if (blokkert[y][x]) continue;
            if (opptatt.has(`${x},${y}`)) continue;
            // Hold bygda rimelig trygg, så eleven får puste mellom slagene.
            const iBygda = x > 10 && x < 28 && y > 22 && y < 38;
            if (iBygda) continue;
            // Bossarenaen har sin egen fiende.
            if (Math.hypot(x - bossX, y - bossY) < 9) continue;
            spawnRuter.push([x, y]);
        }
    }

    return {
        bredde: W,
        hoyde: H,
        terreng,
        blokkert,
        farbart,
        props,
        spawnRuter,
        bossArena: { x: bossX * 16 + 8, y: bossY * 16 + 8, r: 6 * 16 },
    };
}
