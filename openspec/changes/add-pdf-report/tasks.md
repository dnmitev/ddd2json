## 1. Report Data Layer

- [x] 1.1 Add `public/report.js` with `buildReport(parseResult, fileName)` for card and VU modes
- [x] 1.2 Implement daily duration aggregation from activity change records
- [x] 1.3 Add unit tests in `scripts/test-report.mjs` with redacted card and VU fixtures

## 2. Print UI

- [x] 2.1 Add `public/report.html` and `public/report.css` with Bulgarian labels and `@media print` styles
- [x] 2.2 Render header (identity, period) and daily totals table from report model
- [x] 2.3 Hand off report data from `app.js` after successful conversion (sessionStorage or equivalent)

## 3. Main App Integration

- [x] 3.1 Add „Печат / PDF“ button to `index.html` and wire in `app.js`
- [x] 3.2 Enable button only after successful conversion; open report in new tab
- [x] 3.3 Update README with print/PDF usage instructions

## 4. Validation

- [x] 4.1 Generate report from real driver card `.DDD` and verify daily totals look reasonable
- [x] 4.2 Generate report from real VU `.DDD` (regression) and print to PDF via browser
- [ ] 4.3 Deploy to GitHub Pages and smoke-test print flow on live site
