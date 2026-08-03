import { useCallback, useState } from 'react';

const KEY = 'learning_path_classroom_mode';

// Persistert "projektor-modus" — forstørrer typografi og skjuler chrome
// for læringsstier vist på klasserom-skjerm. Lokalt per nettleser.
export function useClassroomMode(): {
    classroom: boolean;
    setClassroom: (v: boolean) => void;
    toggle: () => void;
} {
    // Leses én gang ved mount. Som effect ble læringsstien først tegnet i normal
    // størrelse og hoppet så til projektor-modus.
    const [classroom, setClassroomState] = useState<boolean>(
        () => localStorage.getItem(KEY) === 'true'
    );

    const setClassroom = useCallback((v: boolean) => {
        setClassroomState(v);
        localStorage.setItem(KEY, v ? 'true' : 'false');
    }, []);

    const toggle = useCallback(() => {
        setClassroomState((prev) => {
            const next = !prev;
            localStorage.setItem(KEY, next ? 'true' : 'false');
            return next;
        });
    }, []);

    return { classroom, setClassroom, toggle };
}
