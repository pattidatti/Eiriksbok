// Ett abonnement for hele dashbordet.
//
// Hver panel-komponent kunne lyttet for seg, men da ville seks paneler åpnet
// seks strømmer mot de samme nodene. Her lyttes det én gang, og panelene får
// ferdig normaliserte tall som props.

import { useEffect, useMemo, useState } from 'react';
import { ref, onValue, query, orderByKey, startAt } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { useManifest } from '../../../hooks/useManifest';
import {
    byggDagsserie,
    byggSideregister,
    byggSiderader,
    dagsnokkel,
    sisteDager,
    tomStats,
    type DagPunkt,
    type RaaStats,
    type SideRad,
} from './statsModel';

// Hvor langt tilbake dagsbøttene hentes. 120 dager dekker et skoleår-halvår
// uten å dra ned hele historikken på hver visning.
const DAGER_TILBAKE = 120;

export interface StatsData {
    raa: RaaStats;
    siderader: SideRad[];
    serie: DagPunkt[];
    dager: string[];
    laster: boolean;
}

export const useStatsData = (): StatsData => {
    const { data: manifest } = useManifest();
    const [raa, setRaa] = useState<RaaStats>(tomStats);
    const [laster, setLaster] = useState(true);

    useEffect(() => {
        const sett = <K extends keyof RaaStats>(noekkel: K) => (snap: { val: () => unknown }) => {
            setRaa((forrige) => ({
                ...forrige,
                [noekkel]: (snap.val() as RaaStats[K]) ?? ({} as RaaStats[K]),
            }));
        };

        // Dagsbøttene begrenses på nøkkel ('YYYY-MM-DD' sorterer kronologisk),
        // slik at et par års historikk ikke lastes ned for å tegne 30 dager.
        const fra = new Date();
        fra.setDate(fra.getDate() - DAGER_TILBAKE);
        const dagligQuery = query(
            ref(db, 'analytics/daily'),
            orderByKey(),
            startAt(dagsnokkel(fra))
        );

        const abonnementer = [
            onValue(ref(db, 'analytics/views'), (snap) => {
                sett('views')(snap);
                setLaster(false);
            }),
            onValue(dagligQuery, sett('daily')),
            onValue(ref(db, 'analytics/reading_time'), sett('readingTime')),
            onValue(ref(db, 'analytics/clock'), sett('clock')),
            onValue(ref(db, 'analytics/devices'), sett('devices')),
            onValue(ref(db, 'analytics/browsers'), sett('browsers')),
            onValue(ref(db, 'analytics/activity'), sett('activity')),
            onValue(ref(db, 'analytics/quiz'), sett('quiz')),
            onValue(ref(db, 'analytics/zero_hits'), sett('zeroHits')),
            onValue(ref(db, 'analytics/unique_users'), sett('uniqueUsers')),
            onValue(ref(db, 'analytics/active_users'), sett('activeUsers')),
            onValue(ref(db, 'analytics/searches'), sett('searches')),
            onValue(ref(db, 'analytics/games/hangman'), sett('hangman')),
        ];

        // Dashbordet skal ikke stå og laste i evighet om en node er tom eller
        // utilgjengelig - etter fem sekunder viser vi det vi har.
        const nodutgang = setTimeout(() => setLaster(false), 5000);

        return () => {
            clearTimeout(nodutgang);
            abonnementer.forEach((av) => av());
        };
    }, []);

    const register = useMemo(() => byggSideregister(manifest), [manifest]);
    const siderader = useMemo(() => byggSiderader(raa, register), [raa, register]);
    const dager = useMemo(() => sisteDager(DAGER_TILBAKE), []);
    const serie = useMemo(() => byggDagsserie(raa, dager), [raa, dager]);

    return { raa, siderader, serie, dager, laster };
};
