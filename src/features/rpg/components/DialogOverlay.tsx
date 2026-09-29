import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { finnLandemerke, finnNpc } from '../data/steder';
import { sfx } from '../engine/audio';
import { tilSpill } from '../engine/bridge';
import { useRpgStore } from '../store/useRpgStore';
import type { QuestDef } from '../types';
import { Samtaleboks, Skrift, Valg } from './Samtaleboks';

interface DialogProps {
    npcId: string;
    quester: QuestDef[];
    onLukk: () => void;
    onTaOppdrag: (quest: QuestDef) => void;
    onSvarPa: (quest: QuestDef) => void;
    /** Eleven valgte en kapittelhandling. */
    onHandling: (handlingId: string) => void;
}

/**
 * Samtalen med en NPC, i samtaleboksen nederst i bildet. Den har tre deler:
 * det NPC-en sier, det hun *vet* (svarene eleven leter etter, bak «Spør ut»),
 * og det hun ber om - som valg eleven kan ta med tall eller mus.
 */
export function DialogOverlay({
    npcId,
    quester,
    onLukk,
    onTaOppdrag,
    onSvarPa,
    onHandling,
}: DialogProps) {
    const npc = finnNpc(npcId);
    const status = useRpgStore((s) => s.quester);
    const gjort = useRpgStore((s) => s.steg);
    const larBegrep = useRpgStore((s) => s.larBegrep);
    const [replikk] = useState(() =>
        npc ? npc.smalltalk[Math.floor(Math.random() * npc.smalltalk.length)] : ''
    );
    const [visKunnskap, setVisKunnskap] = useState(false);

    const aktiv = quester.find((q) => q.giverId === npcId && status[q.id] === 'aktiv') ?? null;
    const ny = quester.find((q) => q.giverId === npcId && !status[q.id]) ?? null;

    /**
     * Kapittelhandlingen han tilbyr nå, om noen.
     *
     * Den vinner over oppdraget under. Er Orm midt i å bygge et skip, skal
     * ikke samtalen begynne med et flervalgsspørsmål om merovingertiden -
     * kapittelet er det eleven faktisk holder på med.
     */
    const handlinger =
        npc?.handlinger?.filter(
            (h) => !gjort.includes(h.gir) && (h.krever ?? []).every((k) => gjort.includes(k))
        ) ?? [];
    const gjortHandling = npc?.handlinger?.find((h) => gjort.includes(h.gir)) ?? null;

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onLukk();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [onLukk]);

    if (!npc) return null;

    const fornavn = npc.name.split(' ')[0];
    const kanSporres = Boolean(npc.kunnskap && npc.kunnskap.length > 0);

    /**
     * Det han sier. Tilbudet vinner over småpratet: har han en handling eller
     * et oppdrag, er det det samtalen handler om, og småpratet ville bare
     * skjøvet det ned i en boks som skal være lav.
     */
    const tale = handlinger.length
        ? handlinger[0].ledetekst
        : aktiv
          ? aktiv.hint
          : ny
            ? ny.intro
            : gjortHandling
              ? gjortHandling.etterpa
              : replikk;
    const oppdrag = handlinger.length ? null : (aktiv ?? ny);

    const sporUt = () => {
        const apner = !visKunnskap;
        setVisKunnskap(apner);
        // Ordene hun nettopp fikk høre, settes i tåkekanten av minnetreet.
        // Aldri høyere: å høre et ord er ikke å kunne det (blueprint §7.4).
        if (!apner) return;
        for (const k of npc.kunnskap ?? []) {
            if (k.begrep) larBegrep(k.begrep, 'hort');
        }
    };

    /*
        Valgene. Alle handlingene som står åpne, ikke bare den første:
        Kongsmannen ber om korn, og eleven skal kunne si nei til ham i samme
        samtale - et nei som bare finnes i å gå sin vei, er ikke et valg hun
        ser at hun tar.

        «Spør ut» er et valg blant de andre, ikke en seksjon over dem. Før
        sto fasiten oppslått rett over «Jeg vet svaret», så letingen falt
        bort selv der svaret faktisk fantes. Nå må hun be om den.
    */
    const knapper: { id: string; tekst: string; hoved?: boolean; gjor: () => void }[] = [];
    handlinger.forEach((h, i) =>
        knapper.push({ id: h.id, tekst: h.knapp, hoved: i === 0, gjor: () => onHandling(h.id) })
    );
    if (!handlinger.length && aktiv) {
        knapper.push({
            id: 'svar',
            tekst: 'Jeg vet svaret',
            hoved: true,
            gjor: () => onSvarPa(aktiv),
        });
    } else if (!handlinger.length && ny) {
        knapper.push({ id: 'ta', tekst: 'Ta oppdraget', hoved: true, gjor: () => onTaOppdrag(ny) });
    }
    if (kanSporres) {
        knapper.push({
            id: 'spor',
            tekst: visKunnskap ? 'Tilbake' : `Spør ${fornavn} ut`,
            gjor: sporUt,
        });
    }

    return (
        <Samtaleboks
            navn={npc.name}
            undertittel={npc.role}
            onLukk={onLukk}
            merke={
                oppdrag && !visKunnskap ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                        {aktiv ? 'Oppdrag' : 'Nytt oppdrag'} · {oppdrag.title}
                    </p>
                ) : undefined
            }
            valg={knapper.map((k, i) => (
                <Valg key={k.id} nr={i + 1} hoved={k.hoved} onClick={k.gjor}>
                    {k.tekst}
                </Valg>
            ))}
        >
            {visKunnskap ? (
                <ul className="space-y-2 text-[15px] leading-relaxed text-slate-200">
                    {npc.kunnskap!.map((k) => (
                        <li key={k.tekst} className="border-l-2 border-sky-400/50 pl-3">
                            {k.tekst}
                        </li>
                    ))}
                </ul>
            ) : (
                <Skrift
                    tekst={`«${tale}»`}
                    className="whitespace-pre-line text-[16px] leading-relaxed text-slate-100"
                />
            )}
            {!visKunnskap && !knapper.some((k) => k.hoved) && !gjortHandling && (
                <p className="mt-1.5 text-xs text-slate-500">
                    {fornavn} har ikke mer å be deg om nå.
                </p>
            )}
        </Samtaleboks>
    );
}

interface LandmarkProps {
    landmarkId: string;
    onLukk: () => void;
}

export function LandmarkOverlay({ landmarkId, onLukk }: LandmarkProps) {
    const lm = finnLandemerke(landmarkId);
    const markerLest = useRpgStore((s) => s.markerLest);
    const larBegrep = useRpgStore((s) => s.larBegrep);
    const lest = useRpgStore((s) => s.lest);
    const flagg = useRpgStore((s) => s.flagg);
    const gjortSteg = useRpgStore((s) => s.steg);
    const settFlagg = useRpgStore((s) => s.settFlagg);
    const giSolv = useRpgStore((s) => s.giSolv);
    const forste = lm ? !lest.includes(lm.id) : false;
    const valg = lm?.valg;
    const tatt = valg ? Boolean(flagg[valg.flagg]) : false;

    useEffect(() => {
        sfx.apne();
        if (lm && forste) markerLest(lm.id);
        // Steinen ved veien er selve handlingen bak `[Nordvegen]`. Løftet
        // ligger på landemerket og ikke i storen: dataene sier hva teksten er
        // verdt, storen fører bare regnskapet.
        if (lm?.begrep) larBegrep(lm.begrep.id, lm.begrep.niva);
        // Skal bare kjøre når landemerket åpnes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lm?.id]);

    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') onLukk();
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [onLukk]);

    if (!lm) return null;

    const apenHandling =
        lm.handling && (lm.handling.krever ?? []).every((k) => gjortSteg.includes(k))
            ? lm.handling
            : null;
    let nr = 0;

    return (
        <Samtaleboks
            navn={lm.title}
            undertittel={
                lm.kind === 'runestein'
                    ? 'Runestein'
                    : lm.kind === 'skilt'
                      ? 'Innskrift'
                      : lm.kind === 'baal'
                        ? 'Bål'
                        : 'Kiste'
            }
            onLukk={onLukk}
            valg={
                <>
                    {/*
                        Døra inn til noe scenen eier - bua med forrådet. Skilt
                        fra `valg` under, som setter et flagg og er over med det.
                    */}
                    {apenHandling && (
                        <Valg
                            nr={++nr}
                            hoved
                            onClick={() => {
                                onLukk();
                                tilSpill.emit('landemerkeHandling', {
                                    landmarkId: lm.id,
                                    handlingId: apenHandling.id,
                                });
                            }}
                        >
                            {apenHandling.knapp}
                        </Valg>
                    )}
                    {/*
                        Valget. Ingen vurdering står her - ingen «er du sikker?»,
                        ingen farge som sier at dette er stygt, og ingen ros når
                        det er gjort. Derfor er det aldri `hoved`. Spillet sier
                        ingenting (blueprint §3). Følgen kommer i mellomspillet
                        og i graven hennes i kapittel 5.
                    */}
                    {valg && !tatt && (
                        <Valg
                            nr={++nr}
                            onClick={() => {
                                settFlagg(valg.flagg);
                                if (valg.solv) giSolv(valg.solv);
                                onLukk();
                            }}
                        >
                            {valg.knapp}
                        </Valg>
                    )}
                </>
            }
        >
            {/* Avsnitt beholdes. Runesteinene i Nordvik er én blokk hver, men
                skiltene i hallen forklarer to ting hver, og de skal ikke gro
                sammen til én vegg av tekst. */}
            <Skrift
                tekst={lm.text}
                className="whitespace-pre-line text-[16px] leading-relaxed text-slate-100"
            />
            {/*
                Det gården husker. Linjene står bare for den som gjorde det de
                handler om, og ingen av dem dømmer - de sier hva som ligger der.
            */}
            {(lm.tillegg ?? [])
                .filter((t) => flagg[t.flagg])
                .map((t) => (
                    <p
                        key={t.flagg}
                        data-prove="landemerke-tillegg"
                        className="mt-3 border-l-2 border-amber-300/40 pl-3 text-[15px] leading-relaxed text-amber-100/85"
                    >
                        {t.tekst}
                    </p>
                ))}
            {valg && tatt && (
                <p className="mt-3 border-l-2 border-white/20 pl-3 text-[15px] text-slate-300">
                    {valg.etterpa}
                </p>
            )}
            {forste && !valg && (
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                    Du husker dette nå. +5 erfaring.
                </p>
            )}
        </Samtaleboks>
    );
}

export function Ramme({ children, onLukk }: { children: React.ReactNode; onLukk: () => void }) {
    return (
        <div className="absolute inset-0 z-40 grid place-items-end justify-items-center bg-slate-950/40 px-3 pb-6 sm:place-items-center sm:pb-3">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 p-5 shadow-2xl">
                {children}
                <button
                    type="button"
                    onClick={onLukk}
                    className="mt-4 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                >
                    Lukk (Esc)
                </button>
            </div>
        </div>
    );
}

/** Liten lenke tilbake til artikkelen et spørsmål kom fra. */
export function KildeLenke({ href, tittel }: { href: string; tittel: string }) {
    return (
        <Link
            to={href}
            target="_blank"
            rel="noreferrer"
            className="text-sky-300 underline decoration-sky-300/40 underline-offset-2 transition hover:text-sky-200"
        >
            {tittel}
        </Link>
    );
}
