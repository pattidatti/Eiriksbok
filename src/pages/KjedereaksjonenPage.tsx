// Kjedereaksjonen (`/oving/kjedereaksjonen`) - 2D-sidescroller der eleven løper
// gjennom en årsakskjede. Denne fila orkestrerer bare: henter innhold, holder
// verdensobjektet, og oversetter hendelser fra simuleringen til UI og progresjon.
// Selve spillet lever i src/components/games/kjede/.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { DrivkraftId, Kjede, KjedeFeil, KjedeIndexEntry, KjedeResultat } from '../types/kjede';
import { KjedeCanvas, type HudSnapshot } from '../components/games/kjede/KjedeCanvas';
import { KjedeHud } from '../components/games/kjede/KjedeHud';
import { KjedeOverlay } from '../components/games/kjede/KjedeOverlay';
import { KjedeSetup } from '../components/games/kjede/KjedeSetup';
import { KjedeSummary } from '../components/games/kjede/KjedeSummary';
import {
    opprettVerden,
    velgDrivkraft,
    type KjedeVerden,
    type Verdenshendelse,
} from '../components/games/kjede/kjedeWorld';
import { hentKjede, hentKjedeIndeks } from '../components/games/kjede/loadKjeder';
import { hentStats, registrerRunde, type KjedeStats, type Rekordbrudd } from '../components/games/kjede/kjedeStats';
import { useStepSounds } from '../hooks/useStepSounds';
import { useProgressStore } from '../features/progress/useProgressStore';

const TOM_SNAPSHOT: HudSnapshot = {
    ledd: 1,
    totaltLedd: 1,
    streak: 0,
    forsprang: 1,
    tenkeandel: 0,
    fase: 'lop',
    arsak: '',
    fasit: '',
    tidUt: false,
    valg: [],
};

const KjedereaksjonenPage: React.FC = () => {
    const reducedMotion = useReducedMotion() ?? false;
    const { play, setMuted, isMuted } = useStepSounds();

    const [indeks, setIndeks] = useState<KjedeIndexEntry[]>([]);
    const [laster, setLaster] = useState(true);
    const [feil, setFeil] = useState<string | null>(null);

    const [kjede, setKjede] = useState<Kjede | null>(null);
    const [verden, setVerden] = useState<KjedeVerden | null>(null);
    const [snapshot, setSnapshot] = useState<HudSnapshot>(TOM_SNAPSHOT);
    const [aktivFeil, setAktivFeil] = useState<KjedeFeil | null>(null);
    const [tilbudte, setTilbudte] = useState<DrivkraftId[] | null>(null);
    const [drivkrefter, setDrivkrefter] = useState<DrivkraftId[]>([]);
    const [resultat, setResultat] = useState<KjedeResultat | null>(null);
    const [muted, setMutedState] = useState(false);
    const [rekordbrudd, setRekordbrudd] = useState<Rekordbrudd | null>(null);
    const [stats, setStats] = useState<KjedeStats>(() => hentStats());

    const verdenRef = useRef<KjedeVerden | null>(null);
    const registrertRef = useRef(false);

    useEffect(() => {
        setMutedState(isMuted());
    }, [isMuted]);

    useEffect(() => {
        let avbrutt = false;
        hentKjedeIndeks()
            .then((k) => {
                if (!avbrutt) setIndeks(k);
            })
            .catch(() => {
                if (!avbrutt) setFeil('Fikk ikke tak i kjedene. Prøv å laste siden på nytt.');
            })
            .finally(() => {
                if (!avbrutt) setLaster(false);
            });
        return () => {
            avbrutt = true;
        };
    }, []);

    const startKjede = useCallback(
        async (id: string) => {
            setFeil(null);
            try {
                const data = await hentKjede(id);
                const ny = opprettVerden(data, Date.now() & 0x7fffffff);
                verdenRef.current = ny;
                registrertRef.current = false;
                setKjede(data);
                setVerden(ny);
                setResultat(null);
                setAktivFeil(null);
                setTilbudte(null);
                setDrivkrefter([]);
                setRekordbrudd(null);
                setSnapshot({ ...TOM_SNAPSHOT, totaltLedd: data.ledd.length });
            } catch {
                setFeil('Klarte ikke å laste kjeden. Prøv en annen.');
            }
        },
        []
    );

    const avsluttRunde = useCallback(
        (w: KjedeVerden, fullfort: boolean) => {
            if (registrertRef.current) return;
            registrertRef.current = true;
            const res: KjedeResultat = {
                kjedeId: w.kjede.id,
                title: w.kjede.title,
                subjectId: w.kjede.subjectId,
                topicId: w.kjede.topicId,
                fullfort,
                ledd: w.resultater,
                riktigeForsteForsok: w.riktigeForsteForsok,
                bestStreak: w.bestStreak,
                drivkrefter: w.drivkrefter,
                tid: w.tid,
            };
            setResultat(res);
            setRekordbrudd(registrerRunde(res, w.kjede.ledd.length));

            // «Min læring»: bare fullførte kjeder teller. Broen er målet.
            if (fullfort) {
                useProgressStore.getState().recordActivity({
                    kind: 'practice-game',
                    activityId: `kjede/${w.kjede.id}`,
                    subjectId: w.kjede.subjectId,
                    topicId: w.kjede.topicId,
                    score: w.kjede.ledd.length
                        ? w.riktigeForsteForsok / w.kjede.ledd.length
                        : undefined,
                    title: `Kjedereaksjonen: ${w.kjede.title}`,
                });
            }
        },
        []
    );

    const onHendelse = useCallback(
        (h: Verdenshendelse) => {
            const w = verdenRef.current;
            switch (h.type) {
                case 'valg-vises':
                    setAktivFeil(null);
                    play('select');
                    break;
                case 'riktig':
                    setAktivFeil(null);
                    play('correct');
                    break;
                case 'feil':
                    if (w) setAktivFeil(w.aktivFeil);
                    play('incorrect');
                    break;
                case 'drivkraft-tilbud':
                    setTilbudte(h.tilbudte);
                    play('advance');
                    break;
                case 'ferdig':
                    play('complete');
                    if (w) avsluttRunde(w, h.fullfort);
                    break;
            }
        },
        [avsluttRunde, play]
    );

    const onVelgDrivkraft = useCallback(
        (id: DrivkraftId) => {
            const w = verdenRef.current;
            if (!w) return;
            velgDrivkraft(w, id);
            setTilbudte(null);
            setDrivkrefter([...w.drivkrefter]);
            play('pick');
        },
        [play]
    );

    const toggleMute = useCallback(() => {
        const ny = !muted;
        setMuted(ny);
        setMutedState(ny);
    }, [muted, setMuted]);

    const tilbakeTilValg = useCallback(() => {
        verdenRef.current = null;
        setVerden(null);
        setKjede(null);
        setResultat(null);
        setStats(hentStats());
    }, []);

    // Setup-skjerm
    if (!verden || !kjede) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-8 sm:px-6">
                <KjedeSetup
                    kjeder={indeks}
                    laster={laster}
                    feil={feil}
                    stats={stats}
                    onStart={startKjede}
                />
            </div>
        );
    }

    // Oppsummering (broen)
    if (resultat) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-8 sm:px-6">
                <KjedeSummary
                    kjede={kjede}
                    resultat={resultat}
                    rekordbrudd={rekordbrudd}
                    onPaaNytt={() => startKjede(kjede.id)}
                    onNyKjede={tilbakeTilValg}
                />
            </div>
        );
    }

    // Selve spillet
    return (
        <div className="min-h-screen bg-slate-50 px-3 pb-8 pt-4 sm:px-5">
            <div className="mx-auto max-w-[1500px]">
                <KjedeHud
                    snapshot={snapshot}
                    tittel={kjede.title}
                    drivkrefter={drivkrefter}
                    muted={muted}
                    onToggleMute={toggleMute}
                    onAvslutt={tilbakeTilValg}
                />
                <div className="relative">
                    <AnimatePresence>
                        <motion.div key={kjede.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <KjedeCanvas
                                verden={verden}
                                paused={false}
                                reducedMotion={reducedMotion}
                                onHendelse={onHendelse}
                                onSnapshot={setSnapshot}
                            />
                        </motion.div>
                    </AnimatePresence>
                    <KjedeOverlay
                        fase={snapshot.fase}
                        tenkeandel={snapshot.tenkeandel}
                        arsak={snapshot.arsak}
                        valg={snapshot.valg}
                        fasit={snapshot.fasit}
                        tidUt={snapshot.tidUt}
                        aktivFeil={aktivFeil}
                        tilbudte={tilbudte}
                        onVelgDrivkraft={onVelgDrivkraft}
                    />
                </div>
            </div>
        </div>
    );
};

export default KjedereaksjonenPage;
