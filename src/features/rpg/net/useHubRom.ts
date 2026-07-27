// Koblingen mellom hallen på skjermen og hallen på nettet.
//
// Hooken er det eneste som kjenner begge sider. Scenen melder hvor eleven står
// over broen, og hooken tar det videre; de andre kommer inn fra Firebase, og
// hooken sender dem samme vei tilbake. Ingen av de to vet om den andre.
//
// Det viktigste valget her er hva som **ikke** blir React-tilstand. Ti
// meldinger i sekundet ganger seksten elever er hundre og seksti oppdateringer
// i sekundet; ble hver av dem en `setState`, ville hele grensesnittet tegnes på
// nytt like ofte, og HUD-en ville koste mer enn spillet. Posisjonene går derfor
// rett over broen til Phaser. Bare *listen over hvem som er inne* blir
// tilstand, og den oppdateres én gang i sekundet.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FOLELSE_MS } from '../data/folelser';
import { fraSpill, tilSpill } from '../engine/bridge';
import type { Gjest } from '../types';
import type { HubIdentitet, HubRom, RaaGjest } from './hubRom';

/** Hvem eleven har valgt å skjule. Lokalt, og bare hennes eget valg. */
const SKJULTE_NOKKEL = 'rpg-skjulte';

/** Hvor ofte navnelista i grensesnittet friskes opp. */
const LISTE_MS = 1000;

/**
 * Skal vi la nettet være i fred?
 *
 * Settes bare av `verify-rpg-flerspiller.mjs`, og virker bare i utviklingsmodus.
 * Uten den ville hver kjøring av prøveskriptet skrevet en oppdiktet elev inn i
 * et ekte rom - i verste fall mens en klasse står der. En prøve skal måle
 * spillet, ikke delta i det.
 */
function utenNett(): boolean {
    return import.meta.env.DEV && localStorage.getItem('rpg-uten-nett') === '1';
}

function lesSkjulte(): string[] {
    try {
        const raa = JSON.parse(localStorage.getItem(SKJULTE_NOKKEL) ?? '[]') as unknown;
        return Array.isArray(raa) ? raa.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

export interface HubTilstand {
    /** Er vi inne i et rom? Falsk før tilkoblingen er ferdig, og uten nett. */
    tilkoblet: boolean;
    romId: string | null;
    /** De andre, oppdatert én gang i sekundet. Til navnelista, ikke til tegning. */
    andre: { id: string; navn: string }[];
    /** Skjulte, med navn, så eleven kan angre. */
    skjulte: { id: string; navn: string }[];
    send: (emoji: string) => void;
    skjul: (id: string) => void;
    visIgjen: (id: string) => void;
}

/**
 * Kobler eleven til hallen så lenge `aktiv` er sann.
 *
 * `aktiv` er `sted.flerspiller` og ingenting annet. Reiser hun inn i en epoke,
 * blir den falsk, hooken kobler fra og rommet er tomt for henne - «hubben er
 * sammen, epokene er alene» håndheves altså ett sted, i én betingelse.
 */
export function useHubRom(aktiv: boolean, identitet: HubIdentitet | null): HubTilstand {
    const romRef = useRef<HubRom | null>(null);
    const gjesterRef = useRef<Gjest[]>([]);
    const skjulteRef = useRef<string[]>(lesSkjulte());
    /** Navnene vi har sett, så en skjult elev kan hentes fram igjen med navn. */
    const navnRef = useRef<Map<string, string>>(new Map());
    const folelseTimer = useRef<number | null>(null);

    const [tilkoblet, setTilkoblet] = useState(false);
    const [romId, setRomId] = useState<string | null>(null);
    const [andre, setAndre] = useState<{ id: string; navn: string }[]>([]);
    const [skjulte, setSkjulte] = useState<{ id: string; navn: string }[]>(() =>
        lesSkjulte().map((id) => ({ id, navn: 'Skjult elev' }))
    );

    /** Sender bildet av rommet til scenen, uten dem eleven har skjult. */
    const tilScenen = useCallback(() => {
        const skjult = new Set(skjulteRef.current);
        tilSpill.emit('gjester', { liste: gjesterRef.current.filter((g) => !skjult.has(g.id)) });
    }, []);

    /**
     * Nytt bilde av rommet. Kalles av transporten - og i utviklingsmodus av
     * prøveskriptet, som går inn her og ikke rett på broen med vilje: filtrene,
     * navnehukommelsen og skjul-lista ligger i denne funksjonen, og en prøve som
     * hoppet over dem ville målt en kortere vei enn den ekte.
     */
    const motta = useCallback(
        (liste: Gjest[]) => {
            gjesterRef.current = liste;
            for (const g of liste) navnRef.current.set(g.id, g.navn);
            tilScenen();
        },
        [tilScenen]
    );

    // ── Tilkoblingen ────────────────────────────────────────────────────────
    //
    // Identiteten er med i avhengighetene som en streng, ikke som et objekt: et
    // nytt objekt med samme innhold hver render ville koblet fra og til igjen
    // seksti ganger i sekundet.
    const identitetNokkel = identitet ? JSON.stringify(identitet) : '';

    useEffect(() => {
        if (!aktiv || !identitet || utenNett()) return;
        let avbrutt = false;

        void import('./hubRom')
            .then(({ blimMed }) => blimMed(identitet, motta))
            .then((rom) => {
                if (avbrutt) {
                    rom.forlat();
                    return;
                }
                romRef.current = rom;
                setRomId(rom.romId);
                setTilkoblet(true);
            })
            .catch((e: unknown) => {
                // Uten nett er hallen tom, og en tom hall er en gyldig hall.
                // Derfor ingen feilskjerm: eleven skal kunne gå rundt, lese
                // skiltene og reise inn i en epoke akkurat som før.
                console.warn('[rpg] kom ikke inn i hallen', e);
            });

        return () => {
            avbrutt = true;
            romRef.current?.forlat();
            romRef.current = null;
            gjesterRef.current = [];
            setTilkoblet(false);
            setRomId(null);
            setAndre([]);
            // Scenen må tømmes eksplisitt. Rives den ikke i samme åndedrag -
            // og den rives ikke når eleven bare reiser til et annet sted -
            // ville figurene blitt stående igjen som statuer i den nye verdenen.
            tilSpill.emit('gjester', { liste: [] });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aktiv, identitetNokkel, motta, tilScenen]);

    // ── Sømmen prøveskriptene går inn gjennom ───────────────────────────────
    //
    // To nettlesere koblet til en ekte database er ikke en prøve man kan kjøre
    // i en byggejobb, og en prøve som skriver til produksjonsbasen er ikke en
    // prøve man skal ville kjøre. Derfor kan `verify-rpg-flerspiller.mjs` sette
    // medelever rett inn her, i det samme kallet Firebase ville gjort - alt
    // etter dette punktet er den ekte veien.
    useEffect(() => {
        if (!import.meta.env.DEV || !aktiv) return;
        const vindu = window as unknown as Record<string, unknown>;
        let levende = true;
        // Rådataene går gjennom `tolkGjest`, den samme tolkningen Firebase-svaret
        // går gjennom. Uten det ville prøven gått inn *etter* navnevakten og
        // ikoncensuren og målt en kortere vei enn den ekte - og de to tingene
        // som beskytter et klasserom ville stått uten prøve.
        void import('./hubRom').then(({ tolkGjest }) => {
            if (!levende) return;
            vindu.__rpgHub = {
                settGjester: (raa: (RaaGjest & { id: string })[]) =>
                    motta(
                        raa
                            .map((r) => tolkGjest(r.id, r))
                            .filter((g): g is NonNullable<typeof g> => g !== null)
                    ),
            };
        });
        return () => {
            levende = false;
            delete vindu.__rpgHub;
        };
    }, [aktiv, motta]);

    // ── Egen stilling opp ───────────────────────────────────────────────────
    useEffect(() => {
        if (!aktiv) return;
        return fraSpill.on('minStilling', (s) => romRef.current?.meld(s));
    }, [aktiv]);

    // ── Navnelista, én gang i sekundet ──────────────────────────────────────
    useEffect(() => {
        if (!aktiv) return;
        const timer = window.setInterval(() => {
            const skjult = new Set(skjulteRef.current);
            setAndre(
                gjesterRef.current
                    .filter((g) => !skjult.has(g.id))
                    .map((g) => ({ id: g.id, navn: g.navn }))
            );
        }, LISTE_MS);
        return () => window.clearInterval(timer);
    }, [aktiv]);

    const lagreSkjulte = useCallback((ids: string[]) => {
        skjulteRef.current = ids;
        localStorage.setItem(SKJULTE_NOKKEL, JSON.stringify(ids));
        setSkjulte(ids.map((id) => ({ id, navn: navnRef.current.get(id) ?? 'Skjult elev' })));
    }, []);

    const skjul = useCallback(
        (id: string) => {
            if (skjulteRef.current.includes(id)) return;
            lagreSkjulte([...skjulteRef.current, id]);
            setAndre((f) => f.filter((g) => g.id !== id));
            tilScenen();
        },
        [lagreSkjulte, tilScenen]
    );

    const visIgjen = useCallback(
        (id: string) => {
            lagreSkjulte(skjulteRef.current.filter((x) => x !== id));
            tilScenen();
        },
        [lagreSkjulte, tilScenen]
    );

    const send = useCallback((emoji: string) => {
        // Over eget hode med én gang, ikke etter en tur om tjeneren. Å vente på
        // nettet for å se sin egen knapp virke er det som får et grensesnitt til
        // å føles tregt.
        tilSpill.emit('folelse', { emoji });
        romRef.current?.settFolelse(emoji);
        // Følelsen tas ned igjen etterpå, ellers ligger den i noden og blir
        // sendt til alle som kommer inn i rommet en time senere.
        //
        // Den forrige nedtellingen avlyses først. Trykker eleven to ganger med
        // et sekund mellom, ville den første ellers tatt ned den andre tre
        // sekunder for tidlig - og hjulet er nettopp noe man trykker fort på.
        if (folelseTimer.current) window.clearTimeout(folelseTimer.current);
        folelseTimer.current = window.setTimeout(() => {
            romRef.current?.settFolelse(null);
            folelseTimer.current = null;
        }, FOLELSE_MS);
    }, []);

    return { tilkoblet, romId, andre, skjulte, send, skjul, visIgjen };
}
