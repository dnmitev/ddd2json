## 1. Repository Baseline

- [x] 1.1 Add `.gitignore` (exclude `graphify-out/`, OS junk; keep `public/ddd_parser.wasm` optional — CI will rebuild)
- [x] 1.2 Verify `go.sum` and executable `scripts/build-wasm.sh` are tracked
- [x] 1.3 Create initial commit with application source, specs, and build tooling

## 2. AGPL Compliance

- [x] 2.1 Add a visible source-code link to the GitHub repository on `public/index.html`
- [x] 2.2 Confirm README license note references AGPL and public source availability

## 3. GitHub Pages Deployment

- [x] 3.1 Add GitHub Actions workflow: setup Go → run `./scripts/build-wasm.sh` → upload `public/` as Pages artifact
- [x] 3.2 Configure workflow to deploy on push to `main`
- [x] 3.3 Document the GitHub Pages URL and enablement steps in README

## 4. Release Verification

- [x] 4.1 Verify local build: `./scripts/build-wasm.sh` → serve `public/` → convert real VU `.DDD` → download JSON
- [ ] 4.2 Verify deployed site: same file flow → upload JSON to TachoBox successfully
- [x] 4.3 Smoke-test error paths: no file selected, driver card file rejected, parser-not-loaded message
