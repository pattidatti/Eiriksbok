// Firebase-synk for progresjonsprofilen. Når eleven har opprettet en
// tre-ords-kode speiles hele profilen til Realtime DB (debounced
// write-through). På en ny enhet henter koden profilen ned igjen.
// Konflikt: siste skriver vinner (per idébeskrivelsen - v1-avveining).

import { getFirebase } from '../../lib/firebaseLazy';
import { generateSyncCode, isValidSyncCode, normalizeSyncCode } from './wordlist';
import { serializeProgress, useProgressStore } from './useProgressStore';
import type { ProgressData } from './useProgressStore';

const SYNC_PATH = 'progress';
const WRITE_DEBOUNCE_MS = 3000;

// Firebase lastes først når en synk-kode faktisk er i bruk. Eleven uten kode
// treffer aldri disse to, og progresjonen ligger uansett i localStorage
// (useProgressStore) - skyen er kun speilingen mellom enheter.
const readRemote = async (code: string) => {
    const { db, ref, get } = await getFirebase();
    return get(ref(db, `${SYNC_PATH}/${code}`));
};

const writeRemote = async (code: string, payload: ProgressData) => {
    const { db, ref, set } = await getFirebase();
    return set(ref(db, `${SYNC_PATH}/${code}`), payload);
};

// Firebase avviser undefined og dropper tomme objekter/arrays.
// JSON-runde stripper undefined; normalizeRemote fyller hull ved henting.
const toRemotePayload = (data: ProgressData): ProgressData =>
    JSON.parse(JSON.stringify(data)) as ProgressData;

const normalizeRemote = (raw: Partial<ProgressData>, code: string): ProgressData => ({
    profile: raw.profile ?? { nickname: null, avatarId: 'rev' },
    totalXp: raw.totalXp ?? 0,
    streak: raw.streak ?? { current: 0, best: 0, lastActiveDay: null },
    events: raw.events ?? [],
    firstCompletions: raw.firstCompletions ?? {},
    lastBonusDay: raw.lastBonusDay ?? {},
    bestScores: raw.bestScores ?? {},
    dayLog: raw.dayLog ?? {},
    badges: raw.badges ?? {},
    counters: raw.counters ?? {},
    goals: raw.goals ?? null,
    checkedGoalIds: raw.checkedGoalIds ?? [],
    lastGoalBonusDay: raw.lastGoalBonusDay ?? null,
    lastSurpriseBonusDay: raw.lastSurpriseBonusDay ?? null,
    retroDone: raw.retroDone ?? true,
    sync: { code, lastSyncedAt: raw.updatedAt ?? null },
    updatedAt: raw.updatedAt ?? 0,
});

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

const pushNow = async (): Promise<void> => {
    const code = useProgressStore.getState().sync.code;
    if (!code) return;
    try {
        await writeRemote(code, toRemotePayload(serializeProgress()));
        useProgressStore.getState().markSynced(Date.now());
    } catch (err) {
        console.error('Progress-synk feilet', err);
    }
};

const schedulePush = (): void => {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
        writeTimer = null;
        void pushNow();
    }, WRITE_DEBOUNCE_MS);
};

// Kalles én gang ved app-oppstart (ProgressBoot). Henter ev. nyere
// remote-profil og begynner å speile lokale endringer.
export const startProgressSync = (): void => {
    if (started) return;
    started = true;

    const initialCode = useProgressStore.getState().sync.code;
    if (initialCode) {
        void readRemote(initialCode)
            .then((snapshot) => {
                const raw = snapshot.val() as Partial<ProgressData> | null;
                const local = useProgressStore.getState();
                if (raw && (raw.updatedAt ?? 0) > local.updatedAt) {
                    useProgressStore.getState().hydrateFromRemote(
                        normalizeRemote(raw, initialCode)
                    );
                }
            })
            .catch((err) => console.error('Kunne ikke hente progress fra Firebase', err));
    }

    let lastSeen = useProgressStore.getState().updatedAt;
    useProgressStore.subscribe((state) => {
        if (state.updatedAt === lastSeen) return;
        lastSeen = state.updatedAt;
        if (state.sync.code) schedulePush();
    });
};

// Opprett ny kode for denne profilen og last opp umiddelbart
export const createSyncCode = async (): Promise<string> => {
    // Kollisjonssjekk: generer til vi finner en ledig (i praksis første forsøk)
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateSyncCode();
        const snapshot = await readRemote(code);
        if (!snapshot.exists()) {
            useProgressStore.getState().setSyncCode(code);
            await pushNow();
            return code;
        }
    }
    throw new Error('Fant ikke ledig kode');
};

export type LoginResult = 'ok' | 'not-found' | 'invalid' | 'error';

// Hent profil med eksisterende kode (ny enhet). Erstatter lokal profil.
export const loginWithCode = async (input: string): Promise<LoginResult> => {
    const code = normalizeSyncCode(input);
    if (!isValidSyncCode(code)) return 'invalid';
    try {
        const snapshot = await readRemote(code);
        const raw = snapshot.val() as Partial<ProgressData> | null;
        if (!raw) return 'not-found';
        useProgressStore.getState().hydrateFromRemote(normalizeRemote(raw, code));
        return 'ok';
    } catch (err) {
        console.error('Kode-innlogging feilet', err);
        return 'error';
    }
};

// Slå av synk lokalt (profilen beholdes både lokalt og i skyen)
export const disconnectSync = (): void => {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = null;
    useProgressStore.getState().setSyncCode(null);
};
