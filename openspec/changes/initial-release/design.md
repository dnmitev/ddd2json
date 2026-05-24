## Context

The project wraps [traconiq/tachoparser](https://github.com/traconiq/tachoparser) as a browser-only tool for Bulgarian-speaking transport staff. The MVP was built outside OpenSpec and validated end-to-end: a real 1st-gen VU `.DDD` file was parsed, converted, downloaded, and successfully uploaded to [TachoBox](https://tachobox.flespi.io/#/).

The architecture is intentionally minimal — static HTML/CSS/JS plus a Go WASM binary — to keep hosting free (GitHub Pages) and data private (no backend).

## Goals / Non-Goals

**Goals:**

- Document and ship the existing MVP as a public GitHub Pages site
- Keep the UI simple enough for non-technical users (one screen, three actions)
- Preserve client-side-only processing for privacy
- Satisfy AGPL source availability for tachoparser
- Ensure reproducible builds via committed `go.sum` and CI WASM build

**Non-Goals:**

- 2nd-generation and 2nd-gen v2 VU field mapping (deferred)
- Driver card (`.DDD` card files) to TachoBox conversion (deferred)
- Multi-language UI or English translation
- Direct upload/integration with TachoBox API (manual upload only)
- Signature verification with downloaded public keys (tachoparser supports this server-side; not required for JSON shape conversion)

## Decisions

### 1. WebAssembly in-browser parsing (not a backend API)

**Choice:** Compile a thin Go wrapper (`cmd/wasm/main.go`) to WASM and expose `window.ddd2jsonParse(bytes, fileName)`.

**Rationale:** Zero hosting cost beyond static files; files never leave the device; aligns with privacy badge in UI.

**Alternatives considered:**
- Server-side Go API — simpler parsing but requires hosting, handles sensitive tachograph data on server, ongoing cost
- JavaScript port of parser — no Go/WASM toolchain but massive rewrite effort

### 2. JavaScript converter layer separate from WASM

**Choice:** WASM returns raw tachoparser JSON; `public/converter.js` maps to TachoBox shape.

**Rationale:** TachoBox format is a project-specific concern, not part of tachoparser. Keeps WASM thin and allows offline testing via `scripts/convert-sample.mjs` without rebuilding WASM.

### 3. Gen-1 VU fields only for initial release

**Choice:** `converter.js` reads `vu_overview_1` and `vu_activities_1` only.

**Rationale:** Validated with real user files. Gen-2 mapping is deferrable until needed.

**Risk:** Modern smart-tacho files may parse in WASM but fail conversion. Acceptable for now given user confirmation.

### 4. Bulgarian UI

**Choice:** All user-facing strings in Bulgarian; `lang="bg"` on HTML.

**Rationale:** Target users are Bulgarian-speaking with limited English.

### 5. GitHub Pages with CI-built WASM

**Choice:** GitHub Actions workflow builds WASM on push to `main`, deploys `public/` to Pages.

**Rationale:** Avoid committing a 6 MB binary that goes stale; ensure deploy always matches source. `go.sum` committed for reproducible module resolution.

**Alternatives considered:**
- Commit `ddd_parser.wasm` directly — simpler CI but binary drift risk
- Cloudflare Pages — equally viable but GitHub Pages keeps repo and deploy in one place

### 6. File size soft limit (8 MB)

**Choice:** Warn above 8 MB, do not hard-block.

**Rationale:** WASM parsing is memory-bound in browser; warn without blocking edge cases.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Gen-2 VU files fail conversion despite successful parse | Document limitation; defer gen-2 converter work; show clear Bulgarian error |
| ~6 MB WASM slow on mobile/weak networks | Accept for MVP; consider lazy-loading or compression later |
| AGPL requires source availability | Add GitHub source link on deployed page |
| WASM load race on slow connections | `ensureParserLoaded()` error message asks user to reload |
| No automated test fixtures (DDD files contain PII) | Keep `convert-sample.mjs` for JSON-in/JSON-out regression; manual E2E with real files |

## Migration Plan

1. Commit current codebase including `go.sum` and hardened `build-wasm.sh`
2. Add GitHub Actions workflow: Go setup → `./scripts/build-wasm.sh` → deploy `public/` to Pages
3. Add AGPL source link to `index.html`
4. Enable GitHub Pages on repository
5. Verify deployed site with same real `.DDD` file used in local testing

**Rollback:** Revert GitHub Pages to previous deployment or disable Pages; no database or state to migrate.

## Open Questions

- _(none blocking initial release — gen-2 and driver card scope explicitly deferred)_
