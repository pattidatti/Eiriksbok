// Morgensprache i schøtstua (kontor-data.ts, oppdrag 1 og 6): gutten stiller seg foran oldermannen,
// og møtet går som en rekke replikker med fast kamera. Første gang leser sekretæren Kontorets tre
// regler med straffene, og gutten lover å holde dem. Andre gang dømmer oldermannen, etter det gutten
// valgte med Sølve og gjeldsboka: ros, dom med fem harde slag, eller dom over Sølve.
//
// [V] SNL «Det tyske kontor»: oldermenn, sekretær, møtet Morgensprache. [U] at reglene ble lest opp på
// møtet. De tre reglene er prologens (blueprint §6): [V] ildforbudet i gårdene og at hanseatene var
// ugifte; «ingen handel på egen hånd» er [S] slik spillet bruker den. Straffene: [V for 1600/1700-tallet,
// U for 1400-tallet] «fem harde slag over ryggen» (Hanseatiske museum, §4.2); bøtene og å miste plassen
// er [K]. Tonen er alvorlig: ingen vitser, ingen blod, og gutten styrer ikke slagene.
import * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import { KONTOR } from '../bygg/kontor-data';
import { KONTOR_STEDER } from './kontor-steder';
import { finnPerson, maalNaadd, naer } from './sidefolk';
import type { SpillKontekst, Spillsystem } from './system';

export interface MoteRegel {
    nr: number;
    tittel: string;
    straff: string;
}

export interface MoteBilde {
    hvem: string;
    tekst: string;
    regel?: MoteRegel;
    /** Valg gutten må svare (1, 2). */
    valg?: string[];
    /** Antall slag som telles (straffen). */
    slag?: number;
}

export interface MorgenspracheHud {
    tittel: string;
    bilde: MoteBilde;
    nr: number;
    av: number;
    /** `performance.now()` da teksten begynte å skrives. */
    start: number;
    /** Slagene som er slått så langt, og tida for det siste (ms). */
    slagt: number;
    slagTid: number;
    ferdigSkrevet: boolean;
}

const TEGN_PER_S = 42;
const SLAG_PAUSE = 1.25;

export const REGLER: MoteRegel[] = [
    { nr: 1, tittel: 'Ingen ild i gårdene', straff: 'Bot til Kontoret. Den som setter Bryggen i brann, kan jages bort.' },
    { nr: 2, tittel: 'Ingen kvinner i gården, og ingen gifter seg', straff: 'Bot til Kontoret. Den som gifter seg, mister plassen sin.' },
    { nr: 3, tittel: 'Ingen handel på egen hånd', straff: 'Fem harde slag over ryggen.' },
];

function reglene(): MoteBilde[] {
    return [
        { hvem: 'Magister Arnold', tekst: 'Morgensprache er satt. Alle i gården står. Den nye jungen til Hinrik Kolle står foran oldermannen.' },
        { hvem: 'Tidemann Ruge', tekst: 'Du er kommet til Kontoret, gutt. Her gjelder ikke det du gjorde hjemme i Lübeck. Her gjelder Kontorets lov. Sekretær, les den.' },
        { hvem: 'Magister Arnold', tekst: 'Ild får bare brenne i schøtstua. Den som tenner ild eller lys på loftet, i bua eller i gården, setter hele Bryggen i fare. Byen er av tre.', regel: REGLER[0] },
        { hvem: 'Magister Arnold', tekst: 'Ingen tar en kvinne med inn i gården om natta. Ingen her gifter seg med en kvinne fra byen. Den som gjør det, hører ikke lenger til Kontoret.', regel: REGLER[1] },
        { hvem: 'Magister Arnold', tekst: 'En junge kjøper ikke og selger ikke for seg selv. Han handler bare for husbonden sin, og bare slik Kontoret bestemmer.', regel: REGLER[2] },
        { hvem: 'Tidemann Ruge', tekst: 'Du har hørt loven. Lover du å holde den, foran alle her?', valg: ['Jeg lover å holde Kontorets lov.', '(Si ingenting)'] },
        { hvem: 'Tidemann Ruge', tekst: 'Sekretær, skriv det ned. Jungen har lovt.' },
        { hvem: 'Magister Arnold', tekst: 'Det er skrevet. Morgensprache er hevet.' },
    ];
}

function dommen(f: ReadonlySet<string>): { tittel: string; bilder: MoteBilde[] } {
    if (f.has('kontor-tilsto')) {
        return {
            tittel: 'Kontorets dom',
            bilder: [
                { hvem: 'Magister Arnold', tekst: 'Morgensprache er satt. Saken gjelder jungen til Hinrik Kolle.' },
                { hvem: 'Magister Arnold', tekst: 'Han lot to sekker salt være ute av Sølves side i gjeldsboka, fordi fiskeren ba ham om det. Han har sagt det selv.' },
                { hvem: 'Tidemann Ruge', tekst: 'Du gjorde en avtale med en nordmann bak ryggen på Kontoret. Det er handel på egen hånd.', regel: REGLER[2] },
                { hvem: 'Tidemann Ruge', tekst: 'Du sa sannheten, og det teller. Men loven er loven. Lambert, hold ham.' },
                { hvem: '', tekst: 'Det er stille i schøtstua. Bare ilden knitrer. Lambert holder deg i armene.', slag: 5 },
                { hvem: 'Tidemann Ruge', tekst: 'Det er gjort. Saken er over. Reis deg, gutt.' },
                { hvem: 'Magister Arnold', tekst: 'Det er skrevet. Morgensprache er hevet.' },
            ],
        };
    }
    if (f.has('kontor-skyldte')) {
        return {
            tittel: 'Kontorets dom',
            bilder: [
                { hvem: 'Magister Arnold', tekst: 'Morgensprache er satt. Saken gjelder Sølve, fisker fra Vesterålen.' },
                { hvem: 'Magister Arnold', tekst: 'Jungen sier at fiskeren leste opp feil tall, så to sekker salt ikke kom i boka.' },
                { hvem: 'Tidemann Ruge', tekst: 'Sølve har ingen her som taler for ham. Kontoret tror sin egen junge.' },
                { hvem: 'Tidemann Ruge', tekst: 'Sølve fra Vesterålen skal ikke handle på Bryggen mer. Ingen gård kjøper fisken hans. Det er bestemt.' },
                { hvem: 'Magister Arnold', tekst: 'Det er skrevet. Morgensprache er hevet.' },
            ],
        };
    }
    const brutt = f.has('kontor-lovte');
    return {
        tittel: 'Morgensprache',
        bilder: [
            { hvem: 'Magister Arnold', tekst: 'Morgensprache er satt. Saken gjelder Sølve fra Vesterålen og gjeldsboka til Hinrik Kolle.' },
            brutt
                ? { hvem: 'Tidemann Ruge', tekst: 'Fiskeren ba jungen stryke en linje i boka. Jungen sa ja, men skrev den likevel. Du lovte noe du ikke kunne love, gutt. Men boka er sann.' }
                : { hvem: 'Tidemann Ruge', tekst: 'Fiskeren ba jungen stryke en linje i boka. Jungen sa nei. Boka stemmer med lageret.' },
            { hvem: 'Tidemann Ruge', tekst: 'Kontoret lever av at boka er sann. Den som fører den, må ikke være venn med noen.' },
            { hvem: 'Magister Arnold', tekst: 'Det er skrevet. Morgensprache er hevet.' },
        ],
    };
}

export function lagMorgensprache(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    let bilder: MoteBilde[] | null = null;
    let tittel = '';
    let nr = 0;
    let start = 0;
    let tid = 0;
    let slagt = 0;
    let slagTid = 0;
    let neste = 0;
    let ferdigHendelse = '';
    let rist = 0;
    const kamPos = new THREE.Vector3();
    const kamMaal = new THREE.Vector3();
    let kamKlar = false;

    const venter = (): 'regler' | 'dom' | null => {
        if (oppdrag.status('kontor-morgensprache') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-morgensprache', 0)) return 'regler';
        if (oppdrag.status('kontor-dom') === 'aktiv' && !maalNaadd(oppdrag, 'kontor-dom', 0)) return 'dom';
        return null;
    };

    const skrevet = () => (tid * TEGN_PER_S) >= (bilder?.[nr].tekst.length ?? 0);

    // Stavslaget i golvet når en ny replikk kommer: et dypt, tørt dunk.
    function dunk(): void {
        k.lyd?.lyd.spill('kamp', 'blokk', { styrke: 0.55, fart: 0.55 });
        k.lyd?.lyd.toner([[73.4, 0, 0.5]], 0.22);
    }

    /** Hvem som snakker (navnet i replikken -> id i personer.ts). */
    const TALER: Record<string, string> = { 'Tidemann Ruge': 'oldermannen', 'Magister Arnold': 'sekretaeren' };

    function vis(i: number): void {
        nr = i;
        tid = 0;
        start = performance.now();
        slagt = 0;
        neste = 1.2;
        dunk();
        const b = bilder?.[i];
        const id = b ? TALER[b.hvem] : undefined;
        const taler = id ? finnPerson(k.world, id) : null;
        // Teksten står i panelet; den som snakker, gestikulerer.
        if (b && taler) taler.gest(b.regel ? 'peke' : 'snakk', 3);
        k.hudSnart();
    }

    function snuFolk(mot: THREE.Vector3 | null): void {
        for (const s of k.world.streamer.snakkbare()) if (naer(s.pos, KONTOR_STEDER.foran, 9, 2)) s.vend(mot);
    }

    function slutt(): void {
        bilder = null;
        snuFolk(null);
        kamKlar = false;
        oppdrag.hendelse(ferdigHendelse);
        k.lyd?.lyd.toner([[196, 0, 0.6], [261.6, 0.15, 0.9]], 0.12);
        k.hudSnart();
    }

    return {
        navn: 'kontor-morgensprache',
        prompt(gutt) {
            if (bilder || !venter()) return null;
            if (!naer(gutt, KONTOR_STEDER.foran, 1.7)) return null;
            return 'E: Still deg foran oldermannen';
        },
        trykk() {
            const v = venter();
            if (!v) return;
            if (v === 'regler') {
                tittel = 'Morgensprache';
                bilder = reglene();
                ferdigHendelse = 'kontor:morgensprache';
            } else {
                const d = dommen(KONTOR.flagg);
                tittel = d.tittel;
                bilder = d.bilder;
                ferdigHendelse = 'kontor:dom';
            }
            // Gutten står foran oldermannen og ser på ham. Folkene i stua snur seg mot gutten.
            const o = KONTOR_STEDER.oldermann;
            const yaw = Math.atan2(o.x - k.player.pos.x, o.z - k.player.pos.z);
            k.player.teleport(KONTOR_STEDER.foran.clone().setY(k.player.pos.y), yaw);
            snuFolk(k.player.pos);
            vis(0);
        },
        steg(dt: number, inp: InputFrame) {
            if (!bilder) return false;
            tid += dt;
            const b = bilder[nr];
            const videre = inp.jumpPressed || inp.interactPressed;
            if (b.slag) {
                // Slagene telles av seg selv. Gutten kan ikke hoppe over dem.
                neste -= dt;
                if (slagt < b.slag && neste <= 0) {
                    slagt++;
                    slagTid = performance.now();
                    neste = SLAG_PAUSE;
                    rist = 0.35;
                    k.lyd?.lyd.spill('kamp', 'slag-tung', { styrke: 0.9, fart: 0.8 });
                    k.lyd?.lyd.spill('kamp', 'smerte', { styrke: 0.6, fart: 1.15, om: 0.12 });
                    k.hudSnart();
                } else if (slagt >= b.slag && neste <= 0 && videre) vis(nr + 1);
                return true;
            }
            if (!skrevet()) {
                if (videre) start -= 60000;
                if (videre) tid = 9999;
                return true;
            }
            if (b.valg) {
                if (inp.valg === 1) vis(nr + 1);
                else if (inp.valg === 2) {
                    // Stillhet er ikke et svar: oldermannen spør igjen.
                    bilder = [...bilder.slice(0, nr), { hvem: 'Tidemann Ruge', tekst: 'Stillhet er ikke et svar her, gutt. Alle venter. Lover du å holde Kontorets lov?', valg: [b.valg[0]] }, ...bilder.slice(nr + 1)];
                    vis(nr);
                }
                return true;
            }
            if (videre) {
                if (nr + 1 < bilder.length) vis(nr + 1);
                else slutt();
            }
            return true;
        },
        kamera(kamera, dt) {
            if (!bilder) return false;
            // Fast kamera bak gutten, litt til siden, mot oldermannen.
            const o = KONTOR_STEDER.oldermann;
            const g = k.player.pos;
            const dx = g.x - o.x;
            const dz = g.z - o.z;
            const l = Math.hypot(dx, dz) || 1;
            const ux = dx / l;
            const uz = dz / l;
            kamMaal.set(g.x + ux * 2.0 - uz * 0.8, g.y + 1.85, g.z + uz * 2.0 + ux * 0.8);
            if (!kamKlar) {
                kamPos.copy(kamera.position);
                kamKlar = true;
            }
            kamPos.lerp(kamMaal, 1 - Math.exp(-dt * 3));
            kamera.position.copy(kamPos);
            if (rist > 0) {
                rist = Math.max(0, rist - dt);
                const s = rist * 0.12;
                kamera.position.x += (Math.random() - 0.5) * s;
                kamera.position.y += (Math.random() - 0.5) * s;
            }
            kamera.lookAt(o.x, o.y + 1.45, o.z);
            kamera.updateMatrixWorld();
            return true;
        },
        rask: () => bilder !== null,
        hud(): MorgenspracheHud | null {
            if (!bilder) return null;
            return { tittel, bilde: bilder[nr], nr: nr + 1, av: bilder.length, start, slagt, slagTid, ferdigSkrevet: skrevet() };
        },
        dispose() {
            bilder = null;
        },
    };
}
