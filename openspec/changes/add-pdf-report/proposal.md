## Why

Users who convert tachograph files often need a simple printable summary for office staff — without opening [TachoBox](https://tachobox.flespi.io/#/) or uploading JSON elsewhere. A browser-generated report from locally parsed `.DDD` data closes that gap while keeping the app free, private, and usable by non-technical Bulgarian-speaking users.

## What Changes

- Add a **Tier 1 printable report** after successful conversion (driver card and vehicle unit)
- Build report content from **parsed tachograph data** (WASM output), not from TachoBox JSON
- Show driver/vehicle identity, covered period, and a daily totals table (driving, work, rest, distance where available)
- Provide **„Печат / PDF“** via print-friendly HTML and the browser print dialog (Save as PDF)
- Keep all processing client-side; no new backend or paid services

## Capabilities

### New Capabilities

- `tachograph-pdf-report`: Generate printable HTML report and daily activity summaries from parsed VU or driver card data

### Modified Capabilities

- `web-converter-ui`: Add print/PDF action after successful conversion; optional report preview

## Impact

- **Code**: new `public/report.js` (or similar), `public/report.css`, updates to `public/app.js`, `public/index.html`
- **Logic**: duration aggregation from activity change records (shared helper, no new WASM)
- **Out of scope**: EU 561/2006 violation engine, maps/GNSS, TachoBox replacement, programmatic PDF libraries in v1
