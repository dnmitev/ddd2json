## Context

The app parses `.DDD` files locally via WASM and converts to TachoBox JSON. Users also want a **printable summary** without depending on TachoBox for viewing — especially office staff who need paper/PDF with driver name, period, and daily driving/rest totals.

TachoBox’s value for compliance (EU 561/2006 violations, maps, cross-checks) is explicitly out of scope. Tier 1 is a **factual activity report** only.

Parsed data already contains everything needed for Tier 1:
- Cards: `card_identification_and_driver_card_holder_identification_1`, `card_driver_activity_1.decoded_activity_daily_records`
- VU: `vu_overview_1`, `vu_activities_1`

## Goals / Non-Goals

**Goals:**

- Printable Bulgarian report after successful convert
- Driver card and gen-1 VU support
- Daily duration totals (driving, work, rest/availability)
- Browser print → Save as PDF (no paid libs in v1)
- Stay static / GitHub Pages compatible

**Non-Goals:**

- EU 561/2006 violation detection
- Charts, maps, GNSS, border crossings
- Replacing TachoBox or flespi platform features
- jsPDF/pdfmake one-click download (defer to follow-up if print CSS insufficient)
- Gen-2-only data paths

## Decisions

### 1. Report from parse result, not TachoBox JSON

**Choice:** `buildReport(parseResult, fileName)` reads raw WASM JSON.

**Rationale:** Richer fields (vehicles, places) available later; avoids coupling report to TachoBox mapper changes.

### 2. Duration aggregation in JavaScript

**Choice:** Walk `activity_change_info` / activity segments; accumulate minutes per work type until next change; cap at 1440 minutes per day.

**Rationale:** Same underlying data TachoBox visualizes; no WASM changes.

### 3. Print via dedicated HTML document + `@media print`

**Choice:** Open `report.html` (or blob URL) populated from sessionStorage / URL hash / in-memory handoff from `app.js`; user prints with Ctrl+P / „Печат“.

**Alternatives:**
- Hidden iframe on main page — cramped layout
- pdfmake — heavier dependency, more layout work for v1

### 4. Separate `report.js` + `report.css`

**Choice:** Keep `app.js` thin; report logic and print styles isolated.

**Rationale:** Report page can be large (400+ rows); separate file easier to maintain.

### 5. Pagination strategy for long cards

**Choice:** CSS `thead { display: table-header-group }` for repeating headers; allow multi-page table; optional limit note if > N days (none in v1 — show all).

**Risk:** Very long cards (400+ days) produce long PDFs — acceptable for Tier 1.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Print layout breaks on mobile | Primary use desktop; report opens in new tab |
| Duration math differs from TachoBox | Document as informational totals, not legal compliance |
| Large reports slow to render | Virtual scrolling not needed for print; test 400-row table |
| sessionStorage size limits | Store compact report model, not full parse blob |

## Migration Plan

1. Add report builder + print page
2. Wire button in main UI after convert stores parse snapshot
3. Test with real card and VU files
4. Deploy via existing GitHub Pages workflow

**Rollback:** Hide print button; no data migration.

## Open Questions

- Defer: include top-N vehicles table on card reports (nice-to-have, not v1)
- Defer: one-click PDF download library if users reject browser print flow
