# ULTRATHINK RAPPORT: UI/UX Analyse av Komposisjonsverktøyet

## 1. Innledning & Premiss
**Målsetting:** Skape et effektivt, ryddig og lettlest grensesnitt for bandmedlemmer som bruker laptop (ofte på litt avstand/notestativ) under øving eller konsert.
**Nåsituasjon:** Designet er "pent" og luftig (moderne web-estetikk), men lider av "Desktop Office"-syndromet: For små klikkflater, for lav kontrast på inaktive elementer, og for mye fokus på redigering kontra fremføring/lesing.

---

## 2. Kritisk Analyse

### 2.1 Visuelt Hierarki & Lesbarhet
*   **Problem:** Notestørrelsen og akkordsymbolene er optimalisert for en person som sitter 40-50 cm fra skjermen. På et notestativ (80-100 cm unna) blir `text-[10px]` og `w-10` ikoner for utydelige.
*   **Problem:** Kontrasten på "inaktive" elementer (eks. instrument-toggles som ikke er valgt) er svært lav (`text-slate-400`). I et mørkt øvingslokale eller scenelys vil disse forsvinne helt.
*   **Problem:** Tekstfelt for lyrics er små og "flyter" litt. Det er vanskelig å se hvor takten starter og slutter ved raskt øyekast.

### 2.2 Interaksjonsdesign (UX)
*   **Klikkflater (Fitts's Law):** Mange knapper er for små. Slette-knappen for akkorder er en liten `x` eller tekstboks som krever presisjonsmus. Instrument-velgerne er små "piller".
    *   *Konsekvens:* Frustrasjon når man skal gjøre raske endringer under en øving.
*   **Redigering vs. Visning:** Dagens UI blander "Composer Mode" (redigering) og "Player Mode" (visning). Det er mange redigeringsknapper (+, -, søppelbøtte, flyttehåndtak) som støyer visuelt når man bare skal spille sangen.

### 2.3 "Stage Presence" (Scene-faktor)
*   **Manglende "Gig Mode":** Det finnes ingen modus som fjerner UI-støy og maksimerer notene/akkordene.
*   **Lysstyrke:** Den hvite bakgrunnen (`bg-[#FDFBF7]`) kan være blendende på en mørk scene. En "Dark Mode" eller "High Contrast Mode" er essensielt for scenebruk.

---

## 3. Konkrete Forbedringspotensialer (Tiltaksliste)

### Tiltak A: "Performance Mode" (Høy Prioritet)
Introduser en dedikert visningsmodus som kan toggles (f.eks. med `P`-tasten).
*   **Hva:** Skjuler alle redigeringsverktøy (sletteknapper, drag-handles, input-borders).
*   **Resultat:** Renere skjermbilde, større plass til noter/tekst.
*   **Design:** Mørk bakgrunn (OLED black) med hvit tekst/akkorder for maksimal kontrast.

### Tiltak B: Justering av Dimensjoner (Middels Prioritet)
Oppskalering av kjerneelementer i "Edit Mode":
1.  **Akkorder:** Øk fontstørrelse fra dagens standard (ca 14px) til `text-xl` eller `text-2xl` og bruk fetere vekting (Black/Bold).
2.  **Instrument-toggles:** Gjør om fra tekst-baserte "piller" til større ikoner eller bokser med tydeligere PÅ/AV tilstand.
3.  **Notehoder:** Øk SVG-størrelsen på `NoteSymbol` med 20-30%.

### Tiltak C: Typografisk Opprydding (Lav Prioritet)
*   Bytt ut `text-slate-500` med `text-slate-700` generelt for bedre lesbarhet.
*   Gjør seksjonsoverskrifter (INTRO, VERS) større og mer distinste for å fungere som visuelle "ankere" når man skummer gjennom sangen.

### Tiltak D: Navigasjon & Spiller
*   Flytt "Play"-kontrolleren til en fast "Sticky Footer" eller "Floating Action Button" som er stor og lett å treffe (i stedet for dagens lille bar).
*   Legg til tastatursnarveier: `Mellomrom` for Play/Pause. `Pil Høyre/Venstre` for neste/forrige seksjon.

---

## 4. Anbefalt Fremdrift
1.  Endre fargepaletten på inaktive elementer (øk kontrast).
2.  Implementer en enkel "Toggle" for å skjule redigeringsverktøy (starten på Performance Mode).
3.  Øk base-størrelsen på notene i CSS/Tailwind.

**Konklusjon:**
Applikasjonen har et solid fundament, men trenger en "vekting" mot scenebruk. Tenk "Plakat" heller enn "Dokument".
