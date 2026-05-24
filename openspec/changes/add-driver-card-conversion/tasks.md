## 1. Format Spike

- [x] 1.1 Export tachoparser JSON for a real `C_*.DDD` file via WASM or `convert-sample.mjs` pipeline
- [x] 1.2 Upload candidate JSON to TachoBox and record which shape loads (mapped `DF_Tachograph`; raw tachoparser not used)
- [x] 1.3 Document the chosen target JSON structure in the change design or a redacted fixture under `scripts/fixtures/`

## 2. Card Converter

- [x] 2.1 Add `convertCardToTachobox` mapping gen-1 `card_driver_activity_1` and identification fields
- [x] 2.2 Update `convertParseResultToTachobox` to route `mode: "card"` to the card converter
- [x] 2.3 Extend `summarizeTachobox` (or add `summarizeCardTachobox`) for driver name, card number, days, activities, period
- [x] 2.4 Add Node regression test via `convert-sample.mjs` with a redacted card parser JSON fixture

## 3. UI and Docs

- [x] 3.1 Adapt summary panel labels/values for driver card vs vehicle unit files
- [x] 3.2 Update README current scope to list driver card support (gen-1)
- [x] 3.3 Verify Bulgarian error messages for empty card activity

## 4. Validation

- [ ] 4.1 End-to-end test: real `C_*.DDD` → download JSON → upload to TachoBox successfully (retry after format fix)
- [x] 4.2 Confirm existing VU file flow still works (no regression)
- [x] 4.3 Deploy to GitHub Pages and smoke-test card conversion on the live site
