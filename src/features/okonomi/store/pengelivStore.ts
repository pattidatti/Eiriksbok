// Pengeliv - storen. Én tilstand som alle moduler leser og skriver til.
//
// Endrer du lønna i skattemodulen, endrer budsjettet seg av seg selv, fordi
// det er de samme tallene. Storen eier ingen økonomisk logikk: den kaller
// motoren i engine/ og lagrer resultatet.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import type {
    BudsjettPostId,
    Fart,
    Fradrag,
    Laan,
    Nedbetaling,
    ModulId,
    Profil,
    Satser,
    Tilstand,
} from '../types';
import { finnMilepaeler, maalepunktFor, tikk } from '../engine/klokke';
import { personaMedId, profilFraPersona } from '../data/personaer';
import { tomTilstandUtvidelse } from '../engine/starttilstand';
import { kjopFond, selgFond } from '../engine/fond';
import { kjopAksje, selgAksje } from '../engine/bors';
import { betalEkstra, taOppLaan } from '../engine/laan';
import { settInnskuddssats, settIpsSparing } from '../engine/pensjon';
import { svarPaaHendelse } from '../engine/hendelser';
import { faaBarn, settSamboer } from '../engine/husholdning';
import { kjopBolig, selgBolig } from '../engine/bolig';
import { beOmLonnsokning, soekJobb, startUtdanning } from '../engine/karriere';

/**
 * Kjører en motorfunksjon på tilstanden hvis den finnes, og sørger for at
 * målepunktet er ferskt etterpå. Alle handlinger som flytter penger går
 * gjennom denne.
 *
 * Det siste er ikke en detalj. Historikken skrives normalt bare av klokka, én
 * gang i måneden, men eleven kan kjøpe fond, ta opp lån og kjøpe bolig mens
 * klokka står stille - og den står stille som utgangspunkt. Uten oppdateringen
 * her leste Oversikt formuen ferskt fra kontoene og gjelda fra et målepunkt
 * som var skrevet før lånet fantes: et forbrukslån på 150 000 kr sendte
 * nettoformuen fra 20 000 til 170 000 kr. Appen lærte bort at det å låne
 * penger gjør deg rikere, og toppbaren og hovedskjermen viste samtidig to
 * forskjellige tall.
 *
 * Målepunktet for inneværende måned byttes ut, det legges ikke til et nytt.
 * Historikken skal ha nøyaktig ett punkt per måned - framskrivningen og
 * grafene regner med det.
 */
function medMotor(
    s: { tilstand: Tilstand | null; satser: Satser | null },
    gjor: (t: Tilstand) => Tilstand
): { tilstand: Tilstand } | Record<string, never> {
    if (!s.tilstand) return {};

    const foer = s.tilstand;
    const etter = gjor(foer);
    if (etter === foer || !s.satser) return { tilstand: etter };

    return { tilstand: medFerskMaaling(foer, etter, s.satser) };
}

/**
 * Skriver målepunktet for inneværende måned på nytt, og feirer det handlingen
 * eventuelt utløste.
 *
 * At milepælene sjekkes her og ikke bare i klokka, er med vilje: betaler
 * eleven inn den siste kronen av gjelda si mens klokka står stille, skal
 * «Du er gjeldfri» komme med en gang - ikke vente til neste måned tikker.
 * Milepæler klokka allerede har funnet for denne måneden, filtreres bort på
 * id, så ingenting feires to ganger.
 */
function medFerskMaaling(foer: Tilstand, etter: Tilstand, satser: Satser): Tilstand {
    const punkt = maalepunktFor(etter, satser);
    const historikk =
        etter.historikk.length > 0 && etter.historikk[etter.historikk.length - 1].maaned === punkt.maaned
            ? [...etter.historikk.slice(0, -1), punkt]
            : [...etter.historikk, punkt];

    const maalt: Tilstand = { ...etter, historikk };

    const kjente = new Set(maalt.milepaeler.map((m) => m.id));
    const nye = finnMilepaeler(foer, maalt, satser).filter((m) => !kjente.has(m.id));
    if (nye.length === 0) return maalt;

    return { ...maalt, milepaeler: [...maalt.milepaeler, ...nye] };
}

const STORAGE_KEY = 'pengeliv-tilstand-v1';
const SATSER_URL = '/data/okonomi/satser-2026.json';

/** Skjemaversjonen `Tilstand.versjon` skrives med. Økes når formatet endres. */
const SKJEMA_VERSJON = 2;

const PERSIST_DEBOUNCE_MS = 600;

/** Tak på hvor mange måneder én spoling kan gjøre, så fanen aldri fryser. */
const MAKS_SPOLING = 12 * 80;

/** Millisekunder per måned ved hver fart. */
const TAKT_MS: Record<Exclude<Fart, 0>, number> = { 1: 900, 2: 450, 4: 180 };

// Debounced lagring, samme mønster som progresjonsstoren. Klokka kan fyre 4
// tikk i sekundet, og å stringify-e hele historikken på hvert tikk ville
// blokkert main thread på en Chromebook. Vi holder siste snapshot i minnet og
// skriver etter en kort pause - og med én gang fanen skjules, så ingenting går
// tapt hvis eleven lukker lokket midt i en spoling.
function lagDebouncetLagring<T>(): PersistStorage<T> {
    let ventende: StorageValue<T> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const skriv = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (!ventende) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ventende));
        } catch {
            // Kvote full eller utilgjengelig - økonomien lever videre i minnet
        }
        ventende = null;
    };

    if (typeof window !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') skriv();
        });
        window.addEventListener('pagehide', skriv);
    }

    return {
        getItem: (navn) => {
            if (ventende) return ventende;
            try {
                const rad = localStorage.getItem(navn);
                return rad ? (JSON.parse(rad) as StorageValue<T>) : null;
            } catch {
                return null;
            }
        },
        setItem: (_navn, verdi) => {
            ventende = verdi;
            if (timer) clearTimeout(timer);
            timer = setTimeout(skriv, PERSIST_DEBOUNCE_MS);
        },
        removeItem: (navn) => {
            ventende = null;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            try {
                localStorage.removeItem(navn);
            } catch {
                // Utilgjengelig - ignorer
            }
        },
    };
}

/** Feltene som faktisk lagres. Satsene lagres ikke: de hentes fra satsfila. */
interface PengelivData {
    tilstand: Tilstand | null;
    aktivModul: ModulId;
}

/**
 * Migreringspunktet.
 *
 * En lagret økonomi er timer med elevarbeid og skal løftes til neste skjema,
 * ikke kastes. Hver gang `SKJEMA_VERSJON` økes, legges det en ny blokk her som
 * fyller inn de nye feltene med fornuftige verdier, og blokkene kjøres etter
 * hverandre slik at en gammel lagring løftes hele veien opp. Er versjonen
 * ukjent (en nyere fane har skrevet fila), begynner vi på nytt heller enn å
 * tolke tall vi ikke forstår.
 */
function migrerTilstand(lagret: unknown): Tilstand | null {
    if (!lagret || typeof lagret !== 'object') return null;
    const raa = lagret as Tilstand;
    if (typeof raa.versjon !== 'number' || !raa.profil) return null;

    let tilstand = raa;

    // 1 -> 2: `Maalepunkt` fikk `kontanter` og `eiendeler`, og `formue` gikk
    // fra å være summen av kontoene til å være alt eleven eier, boligen med.
    //
    // De gamle målepunktene kan ikke regnes om - de forteller hva som skjedde
    // med de tallene som gjaldt da, og boligverdien for hver enkelt måned
    // finnes ikke lagret noe sted. De får derfor `kontanter = formue` og
    // `eiendeler = 0`, som er nøyaktig det de betydde den gangen de ble
    // skrevet. Historikken blir stående som den var; alt fra neste tikk og
    // framover er riktig. Å kaste en lagret økonomi ville vært verre: det er
    // timer med elevarbeid.
    if (tilstand.versjon === 1) {
        tilstand = {
            ...tilstand,
            versjon: 2,
            historikk: (tilstand.historikk ?? []).map((punkt) => ({
                ...punkt,
                kontanter: punkt.kontanter ?? punkt.formue,
                eiendeler: punkt.eiendeler ?? 0,
            })),
        };
    }

    return tilstand.versjon === SKJEMA_VERSJON ? tilstand : null;
}

interface PengelivState extends PengelivData {
    satser: Satser | null;
    laster: boolean;
    /** Feilmelding til eleven når satsfila ikke lot seg hente. */
    feil: string | null;

    lastSatser: () => Promise<void>;
    startFraPersona: (personaId: string) => void;
    velgModul: (id: ModulId) => void;
    settFart: (f: Fart) => void;
    tikkEnManed: () => void;
    spolTil: (maaned: number) => void;
    settLonn: (brutto: number) => void;
    settBudsjettPost: (id: BudsjettPostId, belop: number) => void;
    settManedligSparing: (belop: number) => void;
    /**
     * Hvilken konto den faste sparingen går til. Motoren flytter aldri penger
     * mellom kontoer av seg selv, så uten dette valget ville BSU-taket alene
     * bestemt hvor mye sparing som i det hele tatt hadde noe å si.
     */
    settSparingTilKonto: (kontoId: string) => void;

    // Fase 4-10. Hver av dem sender arbeidet videre til domenets egen
    // motorfil, slik at butikken aldri blir stedet der økonomien bor.
    kjopFond: (fondId: string, belop: number) => void;
    selgFond: (fondId: string, andeler: number) => void;
    kjopAksje: (aksjeId: string, antall: number) => void;
    selgAksje: (aksjeId: string, antall: number) => void;
    taOppLaan: (laan: Laan) => void;
    betalEkstra: (laanId: string, belop: number) => void;
    settInnskuddssats: (sats: number) => void;
    settIpsSparing: (belop: number) => void;
    soekJobb: (yrkeId: string) => void;
    beOmLonnsokning: () => void;
    startUtdanning: (utdanningId: string) => void;
    kjopBolig: (boligId: string, egenkapital: number, nedbetaling: Nedbetaling) => void;
    selgBolig: () => void;
    settSamboer: (harSamboer: boolean) => void;
    faaBarn: () => void;
    svarPaaHendelse: (valgIndeks: number) => void;
    settHendelserPa: (pa: boolean) => void;
    fullforUtfordringer: (ider: string[]) => void;
    settFradrag: (delvis: Partial<Fradrag>) => void;
    nullstill: () => void;
}

/**
 * Endrer profilen uten å røre historikken. Historikken forteller hva som
 * faktisk skjedde med de tallene som gjaldt da; den nye lønna gjelder framover.
 */
function medProfil(tilstand: Tilstand, endre: (profil: Profil) => Profil): Tilstand {
    return { ...tilstand, profil: endre(tilstand.profil) };
}

export const usePengelivStore = create<PengelivState>()(
    persist(
        (set, get) => ({
            tilstand: null,
            aktivModul: 'oversikt',
            satser: null,
            laster: false,
            feil: null,

            lastSatser: async () => {
                if (get().satser || get().laster) return;
                set({ laster: true, feil: null });
                try {
                    const svar = await fetch(SATSER_URL);
                    if (!svar.ok) throw new Error(`HTTP ${svar.status}`);
                    const satser = (await svar.json()) as Satser;
                    set({ satser, laster: false });
                } catch {
                    set({
                        laster: false,
                        feil: 'Klarte ikke å hente skattesatsene. Sjekk nettforbindelsen og last siden på nytt.',
                    });
                }
            },

            startFraPersona: (personaId) => {
                const { satser } = get();
                if (!satser) {
                    set({ feil: 'Skattesatsene er ikke lastet ennå. Prøv igjen om et øyeblikk.' });
                    return;
                }
                const persona = personaMedId(personaId);
                if (!persona) return;

                // Simuleringen starter i januar i satsenes år, så reglene
                // eleven ser i lønnsslippen er de som faktisk gjelder.
                const rot: Tilstand = {
                    ...tomTilstandUtvidelse(persona.id),
                    versjon: SKJEMA_VERSJON,
                    profil: profilFraPersona(persona),
                    startAar: satser.aar,
                    maaned: 0,
                    fart: 0,
                    hendelserPa: true,
                    historikk: [],
                    milepaeler: [],
                };

                set({
                    tilstand: { ...rot, historikk: [maalepunktFor(rot, satser)] },
                    aktivModul: 'oversikt',
                    feil: null,
                });
            },

            velgModul: (id) => set({ aktivModul: id }),

            settFart: (f) =>
                set((s) => (s.tilstand ? { tilstand: { ...s.tilstand, fart: f } } : {})),

            tikkEnManed: () => {
                const { tilstand, satser } = get();
                if (!tilstand || !satser) return;

                const ny = tikk(tilstand, satser);
                // Klokka stopper av seg selv ved milepæler, også når hendelser
                // er slått av. Ingen skal spole blindt forbi det viktige.
                const stopp = ny.milepaeler.length > tilstand.milepaeler.length;
                set({ tilstand: stopp ? { ...ny, fart: 0 } : ny });
            },

            spolTil: (maaned) => {
                const { tilstand, satser } = get();
                if (!tilstand || !satser || maaned <= tilstand.maaned) return;

                const steg = Math.min(maaned - tilstand.maaned, MAKS_SPOLING);
                let ny = tilstand;
                for (let i = 0; i < steg; i++) {
                    ny = tikk(ny, satser);
                    // Samme regel som over: første milepæl avbryter spolingen.
                    if (ny.milepaeler.length > tilstand.milepaeler.length) break;
                    // En hendelse venter på et svar, og valget er hele poenget.
                    // Uten dette kunne eleven spole rett forbi den.
                    if (ny.aktivHendelse) break;
                }
                set({ tilstand: { ...ny, fart: 0 } });
            },

            settLonn: (brutto) =>
                set((s) =>
                    medMotor(s, (t) =>
                        medProfil(t, (p) => ({ ...p, bruttoArslonn: Math.max(0, brutto) }))
                    )
                ),

            settBudsjettPost: (id, belop) =>
                set((s) =>
                    medMotor(s, (t) =>
                        medProfil(t, (p) => ({
                            ...p,
                            budsjett: p.budsjett.map((post) =>
                                post.id === id ? { ...post, belop: Math.max(0, belop) } : post
                            ),
                        }))
                    )
                ),

            settManedligSparing: (belop) =>
                set((s) =>
                    medMotor(s, (t) =>
                        medProfil(t, (p) => ({ ...p, manedligSparing: Math.max(0, belop) }))
                    )
                ),

            settSparingTilKonto: (kontoId) =>
                set((s) =>
                    medMotor(s, (t) =>
                        medProfil(t, (p) =>
                            // Ukjent konto-id ville stoppet all sparing i
                            // stillhet, så den ignoreres framfor å lagres.
                            p.kontoer.some((k) => k.id === kontoId)
                                ? { ...p, sparingTilKontoId: kontoId }
                                : p
                        )
                    )
                ),

            // Alle fase 4-10-handlingene har samme form: finn tilstanden, la
            // domenets motorfil gjøre jobben, og legg resultatet tilbake.
            kjopFond: (fondId, belop) => set((s) => medMotor(s, (t) => kjopFond(t, fondId, belop))),
            selgFond: (fondId, andeler) =>
                set((s) => medMotor(s, (t) => selgFond(t, fondId, andeler))),
            kjopAksje: (aksjeId, antall) =>
                set((s) => medMotor(s, (t) => kjopAksje(t, aksjeId, antall))),
            selgAksje: (aksjeId, antall) =>
                set((s) => medMotor(s, (t) => selgAksje(t, aksjeId, antall))),
            taOppLaan: (laan) => set((s) => medMotor(s, (t) => taOppLaan(t, laan))),
            betalEkstra: (laanId, belop) =>
                set((s) => medMotor(s, (t) => betalEkstra(t, laanId, belop))),
            settInnskuddssats: (sats) => set((s) => medMotor(s, (t) => settInnskuddssats(t, sats))),
            settIpsSparing: (belop) => set((s) => medMotor(s, (t) => settIpsSparing(t, belop))),
            soekJobb: (yrkeId) => set((s) => medMotor(s, (t) => soekJobb(t, yrkeId))),
            beOmLonnsokning: () => set((s) => medMotor(s, beOmLonnsokning)),
            startUtdanning: (utdanningId) =>
                set((s) => medMotor(s, (t) => startUtdanning(t, utdanningId))),
            kjopBolig: (boligId, egenkapital, nedbetaling) =>
                set((s) => medMotor(s, (t) => kjopBolig(t, boligId, egenkapital, nedbetaling))),
            selgBolig: () => set((s) => medMotor(s, selgBolig)),
            settSamboer: (harSamboer) => set((s) => medMotor(s, (t) => settSamboer(t, harSamboer))),
            faaBarn: () => set((s) => medMotor(s, faaBarn)),
            svarPaaHendelse: (valgIndeks) =>
                set((s) => medMotor(s, (t) => svarPaaHendelse(t, valgIndeks))),
            settHendelserPa: (pa) => set((s) => medMotor(s, (t) => ({ ...t, hendelserPa: pa }))),
            // Utfordringene lagres her, men XP-en gis av PengelivPage gjennom
            // recordActivity() - butikken skal ikke kjenne progresjonssystemet.
            fullforUtfordringer: (ider) =>
                set((s) =>
                    medMotor(s, (t) => ({
                        ...t,
                        fullforteUtfordringer: [...t.fullforteUtfordringer, ...ider],
                    }))
                ),

            settFradrag: (delvis) =>
                set((s) =>
                    medMotor(s, (t) =>
                        medProfil(t, (p) => ({ ...p, fradrag: { ...p.fradrag, ...delvis } }))
                    )
                ),

            // Satsene beholdes: de er data om skatteåret, ikke elevens tall.
            nullstill: () => set({ tilstand: null, aktivModul: 'oversikt', feil: null }),
        }),
        {
            name: STORAGE_KEY,
            storage: lagDebouncetLagring<PengelivData>(),
            version: SKJEMA_VERSJON,
            partialize: (s): PengelivData => ({ tilstand: s.tilstand, aktivModul: s.aktivModul }),
            migrate: (lagret): PengelivData => {
                const data = (lagret ?? {}) as Partial<PengelivData>;
                return {
                    tilstand: migrerTilstand(data.tilstand),
                    aktivModul: data.aktivModul ?? 'oversikt',
                };
            },
            onRehydrateStorage: () => (state) => {
                // En lagret økonomi skal aldri begynne å gå av seg selv når
                // eleven åpner siden igjen.
                if (state?.tilstand && state.tilstand.fart !== 0) {
                    state.tilstand = { ...state.tilstand, fart: 0 };
                }
            },
        }
    )
);

/**
 * Driver klokka. Kalles én gang, høyt oppe i Pengeliv-siden.
 *
 * Løkka ligger her og ikke i storen fordi den er en effekt i React, ikke
 * tilstand. `setInterval` er med vilje valgt foran requestAnimationFrame:
 * nettleseren struper intervaller i skjulte faner, så klokka står stille
 * mens eleven er et annet sted i stedet for å sprinte gjennom et tiår i det
 * øyeblikket fanen kommer fram igjen.
 */
export function usePengelivKlokke(): void {
    const fart = usePengelivStore((s) => s.tilstand?.fart ?? 0);

    useEffect(() => {
        if (fart === 0) return;
        const id = setInterval(() => {
            usePengelivStore.getState().tikkEnManed();
        }, TAKT_MS[fart]);
        return () => clearInterval(id);
    }, [fart]);
}
