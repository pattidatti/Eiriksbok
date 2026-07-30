---
description: The Builder. Reads a Blueprint and creates physical files per plan_article standard.
---

This workflow is a bulk loop over a Blueprint — each article is built to the same standard as `/plan_article`. There are no shortcuts.

---

## 1. Read Context (The Foundation)

- File: `docs/Design documents/[Subject ID]-blueprint.md`
- File: `.agent/workflows/plan_article.md` — **CRITICAL: all article content rules come from here. Read it fully before writing any JSON.**

---

## 2. Verify Sync

Run: `node scripts/blueprint-manager.cjs --sync [Subject ID]`

---

## 3. Execute Content Matrix (The Build)

Loop through each article defined in the Blueprint:

**If file exists:** Log "Hopper over [Article], finnes allerede." and continue.

**If missing — CREATE (Deep Mode):**

Follow `plan_article.md` Phase 1 and Phase 2 exactly for each article:

### Pedagogical Vision (from plan_article Phase 1)
- Tone: narrative, wondering, pedagogical — derived from the Blueprint's Hook and Misconception
- Implement the Mental Model defined in the Blueprint
- Cross-linking: weave 2–4 natural inline links to related articles in the prose — NOT a summary component at the bottom
- **Length:** 800–1200 words (focused depth, not padding)

### Signaturkomponent (obligatorisk — from plan_article Phase 1.3)
Each article must have one signature component that teaches the article's core insight interactively. Design a new component unless an existing one fits perfectly.
- Brukervennlig: a 14-year-old understands what to do within 5 seconds
- Juicy: immediate visual response, Framer Motion, spring physics
- One pedagogical core — no overloading
- Works on 1366×768, no internal scrolling, light base, rounded-xl

Write the component to `src/components/content/interactive/[Navn].tsx`, register it in `src/components/ComponentRegistry.tsx`.

### JSON Structure Rules (from plan_article Phase 2)
- `content` array must be **flat** — `header` blocks for sections, never nested section objects
- Never use `**bold**` in body text — use the concepts system
- Never use markdown lists — use `{ "type": "list", "items": [...] }`
- `"layout": "rich"` for historical topics with timelines
- Cross-links as inline prose links with absolute paths

### Bilder — alltid placeholder (KRITISK)
**Never write a real image path. Never try to generate images in this workflow.**

Every article MUST have:
```json
"heroImage": "/images/placeholder.webp"
```
And in the manifest entry:
```json
"image": "/images/placeholder.webp"
```
And exactly 3 inline image blocks in the content array:
1. Right after the opening text
2. At a dramatic turning point mid-article
3. After the last main section (before Quiz)

Each with a descriptive `alt` (5–10 words, Norwegian, concrete scene description — used by the image generation workflow):
```json
{ "type": "image", "src": "/images/placeholder.webp", "alt": "Norske vikingskip i havn, 900-tallet", "caption": "Caption tekst her" }
```

Images are generated separately by running `/bilde`.

### Global Data Sync
- Set `year` (or `date`) on the article JSON top level for timeline inclusion
- Add new terms to `public/content/concepts/`
- Add historical figures to `public/content/people/`
- Add 3–5 quiz questions under a `quiz` field

---

## 4. Compile Learning Path (The Pedagogy)

Create/update `public/content/[Subject ID]/[Subject ID]-sti.json`.

Follow `.agent/workflows/LEARNING_PATH_GUIDE.md` strictly:
- 3-Act Model: Akt 1 Opptakten → Akt 2 Konfrontasjonen → Akt 3 Resolusjonen
- Start with **Steg 0 (Prolog)** — zero prior knowledge assumed
- 150–300 words of narrative text per step (not just a link list)
- 4–7 tasks per step following Bloom's Taxonomy (Fakta → Forståelse → Anvendelse → Refleksjon)
- At least one interactive component integrated where the narrative supports it

---

## 5. Verification Checklist

For each article created, verify:
- [ ] JSON is syntax-valid: `python3 -c "import json; json.load(open('public/content/[sti].json')); print('OK')"`
- [ ] `heroImage` is `/images/placeholder.webp`
- [ ] 3 inline image blocks with descriptive Norwegian `alt` text
- [ ] No `**bold**` in body text
- [ ] No markdown lists — only `{ "type": "list" }` blocks
- [ ] Signature component created, registered in ComponentRegistry, and referenced in JSON
- [ ] 2–4 inline cross-links in prose (not a component at the bottom)
- [ ] `year` set at top level for timeline
- [ ] 3–5 quiz questions present

---

## 6. Register & Final Polish

Run: `node scripts/content-manager.cjs --register [Subject ID]`
Run: `node scripts/blueprint-manager.cjs --sync [Subject ID]`
Run: `npm run scan:content`

Notify user: "Build ferdig. Manifest oppdatert. Artiklene er tilgjengelige på [URL]. Kjør `/bilde` for å generere bilder."
