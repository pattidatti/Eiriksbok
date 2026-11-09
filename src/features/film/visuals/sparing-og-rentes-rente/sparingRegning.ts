/** Sparingen i artikkelens eksempel: fast beløp hver måned, renten legges til ved slutten av året. */
export function sparekurve(start: number, slutt: number, belop: number, rentePst: number) {
    const punkter: { alder: number; verdi: number; innskudd: number }[] = [
        { alder: start, verdi: 0, innskudd: 0 },
    ];
    let verdi = 0;
    let innskudd = 0;
    for (let alder = start; alder < slutt; alder++) {
        verdi += belop * 12;
        innskudd += belop * 12;
        verdi *= 1 + rentePst / 100;
        punkter.push({ alder: alder + 1, verdi, innskudd });
    }
    return punkter;
}
