// Ryktet i samtalene (blueprint §8.3): folk møter gutten kaldt når fraksjonen deres mistror ham, og
// varmt når de liker ham (`kald` og `varm`, valgt av `startNode` i samtaler.ts). Noen svar står låst
// til ryktet er høyt nok (`Valg.krav`, rpg.ts), og åpner noe nytt: kunnskap, eller en rett.
//
// Alt her er laget for spillet [S]. Fakta i svarene bygger på det samtalene ellers sier og har kilde
// for (gjeld på bok, Kontoret styrte kornet, kongens lov). Grensene for rykte er i rpg-data.ts.
//
// `leggTilRykte` kalles sist i oppdrag-data.ts: oppdragene skriver om svarene i `start` (Ottar får
// oppdragssvarene der), og kald og varm skal ha de ferdige svarene.
import { SAMTALER, type Replikk, type Samtale, type Valg } from './samtaler';

/** Svarene i `start`, med de låste lagt til sist (så tallene på de åpne ikke flytter seg). */
function laast(s: Samtale, ...nye: Valg[]): Valg[] {
    const valg = [...(s.start.valg ?? []), ...nye].slice(0, 4);
    s.start.valg = valg;
    return valg;
}

/**
 * Kald og varm start med samme svar som `start`, og samme `gjor` (en start som leverer et oppdrag,
 * skal levere det uansett hvordan gutten blir møtt).
 */
function moter(s: Samtale, kald: Omit<Replikk, 'valg'>, varm: Omit<Replikk, 'valg'>): void {
    const { valg, gjor, til } = s.start;
    const med = (r: Omit<Replikk, 'valg'>): Replikk =>
        valg ? { ...r, valg, gjor } : { ...r, gjor, til: til ?? 'start' };
    s.kald = med(kald);
    s.varm = med(varm);
}

let lagtTil = false;

/** Legger ryktet inn i samtalene. Kalles én gang, sist i oppdrag-data.ts. */
export function leggTilRykte(): void {
    if (lagtTil) return;
    lagtTil = true;

    // ── Husbonden (Kontoret) ──
    {
        const s = SAMTALER.husbonde;
        laast(s, {
            tekst: 'Hva skal til for å bli svenn en dag?',
            til: 'svenn',
            krav: { rykte: { K: 30 } },
        });
        s.svenn = {
            tekst: 'Det spør du om nå? Ja vel. Du må kunne regne og skrive, og du må tie når Kontoret ber deg tie. Gjør du det i mange år, kan du en dag styre en stue selv.',
            gest: 'nikk',
            til: 'svenn2',
        };
        s.svenn2 = {
            tekst: 'Men glem aldri hvem som eier fisken. Det er ikke deg, og ikke meg. Det er gården og kjøpmennene hjemme i Lübeck.',
            gest: 'peke',
        };
        moter(
            s,
            {
                tekst: 'Du igjen. Folk i gården snakker om deg, junge, og ikke pent. Gjør jobben din, og hold munn.',
                gest: 'riste',
            },
            {
                tekst: 'Der er du. Lambert sier du er flink. Fortsetter du slik, blir du ikke junge lenge.',
                gest: 'nikk',
            }
        );
    }

    // ── Ottar, fiskeren (Fiskerne) ──
    {
        const s = SAMTALER.fisker;
        laast(s, {
            tekst: 'Hvordan kommer en fisker seg ut av gjelda?',
            til: 'ut',
            krav: { rykte: { F: 15 } },
        });
        s.ut = {
            tekst: 'Det spør ingen tysker om. Godt fiske mange år på rad, det er én vei. Den andre er at noen skriver ærlig i boka.',
            gest: 'skuldre',
            til: 'ut2',
        };
        s.ut2 = {
            tekst: 'Du kan lese tall, du. Se etter at det står riktig, også når det ikke er din gjeld. Det er alt jeg ber om.',
            gest: 'peke',
            til: 'vet',
        };
        moter(
            s,
            {
                tekst: 'Du. Folk fra nord har fortalt meg hva du gjør mot oss. Si det du skal, og gå.',
                gest: 'riste',
            },
            {
                tekst: 'Der er gutten som er grei mot oss fra nord! Kom hit, så skal du få høre.',
                gest: 'kom',
            }
        );
    }

    // ── Kornselgeren (Byfolket) ──
    {
        const s = SAMTALER.kornselger;
        laast(s, {
            tekst: 'Hva betaler du Kontoret for kornet?',
            til: 'innkjop',
            krav: { rykte: { N: 15 } },
        });
        s.innkjop = {
            tekst: 'Det sier jeg ikke til hvem som helst. Men du er grei. Jeg betaler så mye at jeg bare så vidt tjener noe. Og hvert år ber de om litt mer.',
            gest: 'skuldre',
            // Gutten lærer hvordan prisen blir til (rpg.ts teller høyst én øvelse i minuttet).
            gjor: 'ferdighet:prute',
            til: 'vet',
        };
        moter(
            s,
            {
                tekst: 'Kontorgutten. Kornet blir ikke billigere av at du står og glor.',
                gest: 'vift',
            },
            {
                tekst: 'Å, er det deg? Folk i Skostredet sier du er grei, til tysker å være.',
                gest: 'nikk',
            }
        );
    }

    // ── Borgeren (Byfolket) ──
    moter(
        SAMTALER.borger,
        {
            tekst: 'Du er han tyskergutten folk snakker om. Jeg har ingenting å si til deg.',
            gest: 'riste',
        },
        { tekst: 'Du er tysk, men du oppfører deg ordentlig. Det har jeg hørt.', gest: 'nikk' }
    );

    // ── Skomakeren (Byfolket) ──
    moter(
        SAMTALER.skomaker,
        { tekst: 'Du. Hold deg unna benken min, Kontor-gutt.', gest: 'vift' },
        { tekst: 'Der er du, junge! Kom og se. Folk i gata snakker godt om deg.', gest: 'kom' }
    );

    // ── Høvedsmannen (Bergenhus) ──
    {
        const s = SAMTALER.hovedsmann;
        laast(s, {
            tekst: 'Kan jeg gå forbi vaktbua uten å bli jaget?',
            til: 'fri',
            krav: { rykte: { B: 20 } },
        });
        s.fri = {
            tekst: 'Du har hjulpet kongens menn før. Jeg sier fra til vaktene: de skal ikke jage deg for å gå på veien. Men stjeler du, gjelder kongens lov for deg som for alle andre.',
            gest: 'nikk',
            // Vaktene leser flagget (holmenvakt.ts): vaktsonen gjelder ikke gutten lenger.
            gjor: 'flagg:bergenhus-fri',
        };
        moter(
            s,
            {
                tekst: 'Deg har vaktene fortalt meg om. Én gang til, og du står foran gjaldkeren.',
                gest: 'peke',
            },
            { tekst: 'Jungen som hjelper kongens menn. Si hva du vil.', gest: 'nikk' }
        );
    }

    // ── Presten i Jonskirken (Kirken) ──
    {
        const s = SAMTALER.jonspresten;
        laast(s, {
            tekst: 'Kan jeg hjelpe til i kirka?',
            til: 'hjelp',
            krav: { rykte: { Ki: 15 } },
        });
        s.hjelp = {
            tekst: 'Det er ikke mange som spør om det lenger. Kom til kveldsbønnen og tenn lysene. Det er nok.',
            gest: 'nikk',
        };
        moter(
            s,
            {
                tekst: 'Også du er velkommen i Guds hus. Men jeg har hørt hva du har gjort, gutt.',
                gest: 'riste',
            },
            {
                tekst: 'Velkommen, gutt. Presten i Mariakirken har sagt pene ting om deg.',
                gest: 'kom',
            }
        );
    }

    // ── Detmar ved bommen (Byfolket) ── Ryktet åpner veien til fots til Stranden (bommen.ts).
    {
        const s = SAMTALER.sperring;
        laast(s, { tekst: 'Folk i gata vet hvem jeg er. Løft bommen for meg.', til: 'loft', krav: { rykte: { N: 15 } } });
        s.loft = {
            tekst: 'Ja, du er han som byfolket snakker godt om. Greit. Gå forbi, gå langs kaia og over til Stranden. Men ta ikke med deg folk fra Kontoret.',
            gest: 'nikk',
            gjor: 'flagg:bommen-aapen',
        };
        moter(
            s,
            { tekst: 'Deg kjenner vi. Her går du ikke forbi, Kontor-gutt.', gest: 'peke' },
            { tekst: 'Du igjen, junge. Folk i gata snakker godt om deg.', gest: 'nikk' }
        );
    }
}
