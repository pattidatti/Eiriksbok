---
description: Specialized workflow for planning and implementing KRLE articles.
---

# KRLE Article Planning Workflow

This workflow is optimized for the **Comparison-First** nature of KRLE. Use this for articles under `krle/religion` or `krle/filosofi`.

---

## Phase 1: Comparison Design

### 0. The KRLE Guide Check
- **Action:** Read `docs/KRLE_PEDAGOGICAL_GUIDE.md`.
- **Constraint:** Content MUST align with Ninian Smart's 7 Dimensions.

### 1. Classification
Before drafting content, establish its place in the comparison matrix:
- **Religion:** (e.g., islam, kristendom, buddhisme)
- **Dimension:** (ritual, narrative, experiential, social, ethical, doctrinal, material)
- **Comparison Tags:** At least 2 tags that appear in other religions (e.g., #bønn, #frelse).

### 2. Pedagogy: The Comparison Hook
- **Hook:** Instead of a simple intro, start with a "Did you know?" that contrasts or connects this topic to another religion.
- **Tone:** Objective, respectful, yet immersive.

---

## Phase 2: Technical Structure (KRLE-Specific)

### 1. Directory Structure
KRLE articles use a deep nested structure for the "Artikkel" pattern:
- **Path:** `public/content/krle/religion/[religion]/[topic]/artikkel.json`

### 2. JSON Rules
- **Schema:** Use the `name` field for blocks (matches ComponentRegistry lookup).
- **Metadata:**
  ```json
  {
    "title": "Title",
    "subject": "KRLE",
    "topic": "Topic Name",
    "religion": "id",
    "dimension": "ritual",
    "comparison_tags": ["tag1", "tag2"],
    "content": [
      { "name": "header", "text": "Section 1" },
      { "name": "text", "content": "Sample text..." }
    ]
  }
  ```

---

## Phase 3: Verification

### 1. Dashboard Check
- **Verification:** Does this article appear correctly in the `DimensionComparison` component?
- **Tags:** Do the `#tags` successfully link to the cross-religion comparison view?

### 2. Standard Checks
- [ ] No bold text in body.
- [ ] Quiz included (3-5 questions).
- [ ] Hero image follows `image-style-guide.md`.

---

## Usage
Simply state: **"Plan en ny KRLE-artikkel om [tema] ved å bruke /plan_krle_article"**.
