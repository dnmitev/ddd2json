## ADDED Requirements

### Requirement: Build report from parsed DDD data

The system SHALL generate a printable report from WASM parse results (`mode: "vu"` or `mode: "card"`) without sending data to a server.

#### Scenario: Driver card report source

- **WHEN** a driver card file is parsed successfully
- **THEN** the report uses gen-1 card identification and `card_driver_activity_1.decoded_activity_daily_records`

#### Scenario: Vehicle unit report source

- **WHEN** a vehicle unit file is parsed successfully
- **THEN** the report uses `vu_overview_1` and `vu_activities_1` daily records

### Requirement: Report header with identity and period

The report SHALL include a header section in Bulgarian with file name, file type (card or vehicle unit), identity fields (driver name and card number, or plate and VIN), and the covered date period.

#### Scenario: Driver card header

- **WHEN** the report is generated for a driver card
- **THEN** the header shows driver name, card number, and from/to dates

#### Scenario: Vehicle unit header

- **WHEN** the report is generated for a vehicle unit file
- **THEN** the header shows registration plate, VIN, and from/to dates

### Requirement: Daily activity totals table

The report SHALL include a table with one row per day that has activity data, showing date and total durations for driving, work, rest/availability, and day distance when present.

#### Scenario: Daily durations computed

- **WHEN** a day contains multiple activity change records
- **THEN** each activity segment contributes to the correct duration bucket until the next change or end of day (1440 minutes)

#### Scenario: Empty activity day omitted

- **WHEN** a day has no activity change records
- **THEN** that day is omitted from the table

### Requirement: Print-friendly output

The report SHALL be renderable in a print-friendly layout using CSS `@media print` and the browser print dialog so users can save as PDF.

#### Scenario: Print action available after conversion

- **WHEN** conversion completes successfully
- **THEN** the user can open the report and invoke the browser print dialog

#### Scenario: Report readable on paper

- **WHEN** the user prints or saves as PDF
- **THEN** the header and table fit standard A4 portrait layout without horizontal scrolling

### Requirement: No compliance violation engine in v1

The report SHALL NOT claim EU 561/2006 compliance analysis in this release. It presents factual activity totals only.

#### Scenario: No violation section

- **WHEN** the report is generated
- **THEN** it does not include violation or infringement summaries
