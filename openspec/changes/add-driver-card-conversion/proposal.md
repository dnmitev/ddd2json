## Why

The converter already parses driver card `.DDD` files (e.g. `C_*` filenames) in the browser via WebAssembly, but deliberately rejects them at conversion time. Users who download driver card data need the same simple workflow as vehicle unit files: convert locally, download JSON, upload to [TachoBox](https://tachobox.flespi.io/#/).

## What Changes

- Add conversion from tachoparser driver card output to TachoBox-compatible JSON
- Route conversion by parser mode (`vu` vs `card`) instead of rejecting card files
- Support gen-1 driver card fields first (`card_driver_activity_1`, identification blocks)
- Update the post-conversion summary for driver cards (driver name, card number instead of plate/VIN)
- Spike: validate target JSON shape against TachoBox with a real `C_*.DDD` file before locking the mapper
- Remove the v1 requirement that rejects all driver card files

## Capabilities

### New Capabilities

- `card-to-tachobox-conversion`: Map gen-1 driver card tachoparser JSON to TachoBox-uploadable JSON

### Modified Capabilities

- `vu-to-tachobox-conversion`: Remove driver-card rejection; clarify VU-only conversion scope
- `web-converter-ui`: Card-aware summary fields and Bulgarian status copy for driver card success

## Impact

- **Code**: `public/converter.js`, `public/app.js`, possibly `public/index.html` (summary labels)
- **Tests**: `scripts/convert-sample.mjs` usage with card parser JSON fixtures
- **Specs**: Main specs updated on archive
- **Out of scope**: Gen-2-only card sections (border crossings, GNSS, load/unload), raw tachoparser JSON export-only mode
