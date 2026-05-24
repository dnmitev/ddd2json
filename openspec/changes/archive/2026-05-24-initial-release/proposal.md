## Why

Fleet and transport staff need to convert tachograph vehicle unit (VU) `.DDD` files into JSON that can be uploaded to [TachoBox](https://tachobox.flespi.io/#/), but existing tools like [tachoparser](https://github.com/traconiq/tachoparser) are command-line only. A free, browser-based converter that runs entirely on the user's device removes server costs, protects privacy, and makes the workflow accessible to non-technical Bulgarian-speaking users.

An MVP was scaffolded outside OpenSpec and validated end-to-end with a real VU file (parse → download → TachoBox upload). This change formalizes that work and tracks what remains to ship a public deployment.

## What Changes

- Document and stabilize the existing browser-only DDD → TachoBox JSON converter
- Ship a minimal Bulgarian UI: select file, convert, download JSON, open TachoBox
- Keep parsing local via WebAssembly (`traconiq/tachoparser` compiled to WASM)
- Map 1st-generation VU data to the TachoBox JSON shape (validated manually)
- Add GitHub Pages deployment so the tool is publicly available at zero cost
- Add AGPL source-link compliance on the deployed site
- Commit missing build artifacts (`go.sum`, executable build script) and initial repository structure

## Capabilities

### New Capabilities

- `vu-to-tachobox-conversion`: Parse VU `.DDD` files and produce TachoBox-compatible JSON (gen-1 VU fields only)
- `web-converter-ui`: Simple Bulgarian drag-and-drop interface for file selection, conversion, download, and TachoBox handoff
- `static-deployment`: Build WASM in CI and publish the static site to GitHub Pages

### Modified Capabilities

_(none — greenfield project, no existing specs)_

## Impact

- **Code**: `cmd/wasm/`, `public/` (HTML/CSS/JS), `scripts/build-wasm.sh`, `scripts/convert-sample.mjs`
- **Dependencies**: `github.com/traconiq/tachoparser` (AGPL-3.0), Go 1.26+ for WASM build
- **Deployment**: GitHub Pages (static `public/` directory)
- **Out of scope (deferred)**: 2nd-gen / 2nd-gen v2 VU conversion, driver card conversion, multi-language UI
