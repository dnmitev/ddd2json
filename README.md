# DDD to TachoBox JSON

A small browser-only converter for tachograph `.DDD` vehicle unit files.

The app parses the file locally in the browser with [`traconiq/tachoparser`](https://github.com/traconiq/tachoparser)
compiled to WebAssembly, converts the data to a TachoBox-compatible JSON shape,
and lets the user download the JSON for upload to [TachoBox](https://tachobox.flespi.io/#/).

## Local Development

Requires Go 1.26+ (same version as `go.mod`).

Build the WebAssembly parser:

```sh
./scripts/build-wasm.sh
```

The first build downloads Go module dependencies and writes `go.sum` if it is
missing. Commit `go.sum` so later builds are reproducible offline.

Start a static server:

```sh
python3 -m http.server 4173 --directory public
```

Open:

```text
http://localhost:4173
```

## Current Scope

- Supported: 1st-generation vehicle unit DDD files.
- Not yet supported: 2nd-generation VU files, driver card conversion to the TachoBox JSON shape.
- Files are processed locally in the browser.

## Deployment (GitHub Pages)

The site is deployed automatically on push to `main` via
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). The workflow builds
WASM and publishes the `public/` directory.

### First-time setup

1. Push this repository to GitHub.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow) and wait for the deploy job to finish.

Live URL (after setup):

```text
https://dnmitev.github.io/ddd2json/
```

## License Note

This project depends on [`github.com/traconiq/tachoparser`](https://github.com/traconiq/tachoparser),
which is **AGPL-3.0** licensed. When you publish or use this app, you must keep the
corresponding source code available. The deployed site links to this repository for that purpose.
