// Kontoret som makt på Bryggen (kontor-data.ts): folkene oppdragskjeden trenger, mer liv i gården, og
// aktivitetene. Hektes på løkka med én linje i systemer.ts.
//
// Folkene står i en egen liten celle (strømmes som de andre, som sidefolk.ts): oldermannen og
// sekretæren ved østveggen i schøtstua med to svenner som hører på, Sølve fra Vesterålen på kaia,
// bødkeren som slår band på en tønne ved østre forhus, og en skutedreng som kneler og lapper en sekk
// i gårdsrommet. Bødkeren hamrer (lyd fra kaia), og folk sier noe når gutten går forbi.
//
// Alt her er laget for spillet [S]. Bødkere (tønnemakere) fantes i Bergen [V, torg.ts har bødkerboden],
// men hvem som arbeidet i gårdene, er [K].
import * as THREE from 'three';
import type { Plass } from '../bygg/folk';
import { KONTOR } from '../bygg/kontor-data';
import type { Snakkbar } from '../motor/streaming';
import { lagGjeldsbok } from './kontor-gjeldsbok';
import { lagMorgensprache } from './kontor-morgensprache';
import { lagPrute } from './kontor-prute';
import { lagSortering } from './kontor-sortering';
import { KONTOR_STEDER as S } from './kontor-steder';
import { lagVinsj } from './kontor-vinsj';
import type { SpillKontekst, Spillsystem } from './system';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Det bødkeren og skutedrengen sier når gutten går forbi [S]. */
const BODKER = ['Pass beina, junge.', 'En tønne som lekker, er verre enn ingen tønne.', 'Tran, salt eller øl: alt skal i tønner.'];
const DRENG = ['Sekken revnet på koggen. Nå syr jeg den før saltet renner ut.', 'Du er den nye? Vent til du har båret i en hel sommer.'];

export function lagKontoret(k: SpillKontekst): Spillsystem[] {
    const oppdrag = k.folk.oppdrag;
    KONTOR.flagg = oppdrag.flagg;
    KONTOR.status = (id) => oppdrag.status(id);

    const solveBort = () => KONTOR.flagg.has('kontor-skyldte') && oppdrag.status('kontor-dom') === 'levert';
    const plasser: Plass[] = [
        { figur: 'oldermann', rolle: 'staa', pos: S.oldermann.clone(), yaw: -Math.PI / 2, id: 'oldermannen' },
        { figur: 'skriver', rolle: 'prate', pos: S.sekretaer.clone(), yaw: -Math.PI / 2 + 0.5, id: 'sekretaeren' },
        { figur: 'svenn', rolle: 'staa', pos: V(2.7, 0.2, 50.85), yaw: 1.25 },
        { figur: 'dreng', rolle: 'staa', pos: V(2.6, 0.2, 55.2), yaw: 1.9 },
        { figur: 'bodker', rolle: 'hamre', pos: S.bodker.clone(), yaw: Math.PI },
        { figur: 'dreng', rolle: 'knele', pos: V(1.35, 0, 16.2), yaw: -Math.PI / 2 },
    ];
    if (!solveBort()) plasser.push({ figur: 'fisker', rolle: 'staa', pos: S.solve.clone(), yaw: 0.35, samtale: 'solve', id: 'solve' });

    let snakkbare: Snakkbar[] = [];
    let folkGruppe: THREE.Group | null = null;
    let sagt = 0;
    k.world.streamer.leggTil({
        id: 'kontoret-folk',
        center: new THREE.Vector2(0, 28),
        half: new THREE.Vector2(9, 28),
        build: async () => {
            const { lagFolk } = await import('../bygg/folk');
            const { lysestake } = await import('../bygg/kontor-lys');
            const folk = await lagFolk(plasser, k.world.materials, 1429);
            snakkbare = folk.snakkbare;
            folkGruppe = folk.group;
            // Talglyset mellom oldermannen og sekretæren, inntil gavlveggen (kontor-lys.ts).
            const stake = lysestake(k.world.materials, S.lysestake);
            const near = new THREE.Group();
            near.add(folk.group, stake.group);
            return {
                near,
                colliders: folk.colliders,
                snakkbare: folk.snakkbare,
                gaaende: folk.gaaende,
                tick: (t, dt, ctx) => {
                    folk.tick(t, dt, ctx);
                    // En replikk når gutten går tett forbi bødkeren eller skutedrengen.
                    sagt -= dt;
                    if (sagt > 0) return;
                    for (const s of folk.snakkbare) {
                        if (s.id || Math.hypot(s.pos.x - ctx.spiller.x, s.pos.z - ctx.spiller.z) > 2.2 || Math.abs(s.pos.y - ctx.spiller.y) > 1) continue;
                        const liste = s.figur === 'bodker' ? BODKER : s.figur === 'dreng' && s.pos.z < 30 ? DRENG : null;
                        if (!liste) continue;
                        ctx.si(s.figur === 'bodker' ? 'Bødkeren' : 'Skutedrengen', liste[Math.floor(t * 3.1) % liste.length], s.pos);
                        sagt = 14;
                        break;
                    }
                },
                dispose: () => {
                    folk.dispose();
                    stake.dispose();
                    snakkbare = [];
                    folkGruppe = null;
                },
            };
        },
    });

    // Bødkerens hammer: fire til seks slag, så en pause. Høres bare nær kaia.
    let slag = 0;
    let neste = 1;
    const liv: Spillsystem = {
        navn: 'kontoret',
        bilde(dt) {
            // Sølve er kastet ut fra kaia (dommen): han forsvinner fra lista og fra scenen.
            if (solveBort() && folkGruppe) {
                const i = snakkbare.findIndex((s) => s.id === 'solve');
                if (i >= 0) {
                    const root = folkGruppe.children[i];
                    if (root) root.visible = false;
                    if (root) folkGruppe.remove(root);
                    snakkbare.splice(i, 1);
                }
            }
            neste -= dt;
            if (neste > 0) return;
            const p = k.player.pos;
            if (Math.hypot(p.x - S.bodker.x, p.z - S.bodker.z) > 24) {
                neste = 1;
                return;
            }
            if (slag <= 0) slag = 4 + Math.floor(Math.random() * 3);
            k.lyd?.lyd.spill('aare', 'tak', { pos: S.bodker, ref: 2, styrke: 0.55, fart: 1.7 + Math.random() * 0.2 });
            slag--;
            neste = slag > 0 ? 0.42 + Math.random() * 0.06 : 2.2 + Math.random() * 2.5;
        },
    };

    return [liv, lagMorgensprache(k), lagSortering(k), lagPrute(k), lagGjeldsbok(k), lagVinsj(k)];
}
