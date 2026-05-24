## ADDED Requirements

### Requirement: Static site deployable to GitHub Pages

The system SHALL be deployable as a static site with no server-side runtime. All assets SHALL live under the `public/` directory.

#### Scenario: GitHub Pages serves the app

- **WHEN** GitHub Pages is configured for the repository
- **THEN** users can access the converter at the repository's GitHub Pages URL

### Requirement: WASM built in CI before deploy

The system SHALL build `ddd_parser.wasm` and copy `wasm_exec.js` from the Go toolchain in CI before publishing, so deploys do not depend on a developer's local build.

#### Scenario: CI produces WASM artifact

- **WHEN** a deployment workflow runs on push to the default branch
- **THEN** the workflow runs `./scripts/build-wasm.sh` and includes the resulting WASM in the published site

### Requirement: Reproducible Go module dependencies

The repository SHALL commit `go.mod` and `go.sum` so CI and local builds resolve the same tachoparser version.

#### Scenario: Clean clone builds WASM

- **WHEN** a developer clones the repository and runs `./scripts/build-wasm.sh`
- **THEN** the build succeeds without manual `go mod tidy` if `go.sum` is present

### Requirement: Build script is executable and self-healing

The build script SHALL be executable and SHALL run `go mod tidy` automatically when `go.sum` is missing.

#### Scenario: Missing go.sum on first build

- **WHEN** `go.sum` does not exist and the build script runs
- **THEN** the script generates checksums and completes the WASM build

### Requirement: Offline conversion test harness

The repository SHALL include a Node.js script that converts a pre-parsed tachoparser JSON file to TachoBox JSON for development and regression testing without WASM.

#### Scenario: Sample conversion from parser JSON

- **WHEN** a developer runs `node scripts/convert-sample.mjs <parser.json> <output.json>`
- **THEN** the script writes TachoBox JSON and prints a summary to stdout
