## Context

The app already parses driver card `.DDD` files in WASM (`mode: "card"`) but `public/converter.js` rejects them. Vehicle unit conversion uses a custom `{ "result": [...] }` daily-record shape that was validated end-to-end with TachoBox. Driver cards use tachoparser's TLV `Card` struct with gen-1 and gen-2 fields; a real `C_*.DDD` file parses successfully with `card_driver_activity_1` and identification blocks present.

[TachoBox](https://flespi.com/kb/tachobox) documents full support for driver card JSON and references the [flespi tacho-file-parse](https://flespi.com/kb/tacho-file-parse-plugin) `DF_Tachograph` / `EF_*` hierarchy. Our VU output does not use that hierarchy but still works for VU daily data. The target card JSON shape must be confirmed by spike before implementing the full mapper.

## Goals / Non-Goals

**Goals:**

- Enable `C_*.DDD` (and other card files) to produce downloadable JSON uploadable to TachoBox
- Reuse existing WASM parsing; add `convertCardToTachobox` in `converter.js`
- Gen-1 card activity and identification first
- Adaptive UI summary for driver vs vehicle files
- Validate with a real driver card file before shipping

**Non-Goals:**

- Gen-2-only card sections (border crossings, GNSS accumulated driving, load/unload) in v1 of this change
- flespi API integration or server-side parsing
- Replacing or refactoring the existing VU mapper

## Decisions

### 1. Spike-first format discovery

**Choice:** First task exports tachoparser card JSON from a real file and tests TachoBox import. Implement the mapper to match what TachoBox accepts.

**Rationale:** Card and VU JSON shapes may differ inside TachoBox. Building a large `DF_Tachograph` mapper without validation risks wasted effort.

**Alternatives:**
- Assume same `{ result: [] }` wrapper as VU — fast if true, wrong if TachoBox expects `DF_Tachograph`
- Build full flespi `DF_Tachograph` mapper upfront — most complete but highest cost without proof TachoBox requires it for disk upload

### 2. Gen-1 card fields only (initial mapper)

**Choice:** Read `card_driver_activity_1` (decoded daily records) and `card_identification_and_driver_card_holder_identification_1` for identity.

**Rationale:** Mirrors the gen-1-only VU approach. The test card file contains gen-2 fields; they are ignored until a follow-up change.

### 3. Keep conversion logic in `converter.js`

**Choice:** Add `convertCardToTachobox`, extend `convertParseResultToTachobox` to dispatch by mode, extend `summarizeTachobox` to accept card summaries.

**Rationale:** Same pattern as VU; `convert-sample.mjs` can regression-test card JSON without WASM rebuild.

### 4. UI summary uses data attributes, not a second page

**Choice:** Toggle summary label text (plate/VIN vs driver name/card number) based on `parseResult.mode` after conversion.

**Rationale:** Keeps the single-screen Bulgarian UI; no new navigation.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| TachoBox requires `DF_Tachograph` JSON, not `{ result: [] }` | Spike task; implement mapper to match validated shape |
| `card_driver_activity_1` daily records are binary/cyclic in tachoparser | Use tachoparser's decoded JSON output from WASM (already expanded in `MarshalJSON`) |
| Gen-2 cards lack gen-1 activity | Clear Bulgarian error; defer gen-2 mapper |
| Card file parses but verification warnings | Same as VU — conversion proceeds on decoded data |

## Migration Plan

1. Complete spike and document chosen JSON shape in a short comment or fixture file (redacted sample)
2. Implement card converter and UI updates
3. Test locally with real `C_*.DDD` file
4. Deploy via existing GitHub Pages workflow (no WASM changes unless parser API changes)

**Rollback:** Revert `converter.js` / UI changes; card files return to previous error message.

## Open Questions

- **Resolved during apply:** Driver cards use `DF_Tachograph` / `EF_*` (flespi shape), not the VU `{ result: [] }` wrapper. See `scripts/fixtures/README.md`.
- **Deferred:** Gen-2 card field mapping (`card_driver_activity_2`, `card_border_crossings`, etc.)
- **Manual check:** Upload converted JSON to TachoBox to confirm the mapper (task 4.1).
