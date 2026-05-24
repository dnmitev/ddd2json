## ADDED Requirements

### Requirement: Print or PDF report action

The system SHALL provide a „Печат / PDF“ button enabled after successful conversion, alongside existing download and TachoBox actions.

#### Scenario: Print button after conversion

- **WHEN** conversion completes successfully
- **THEN** the print/PDF button is enabled

#### Scenario: Print button before conversion

- **WHEN** no successful conversion output exists
- **THEN** the print/PDF button is disabled

### Requirement: Report opens without leaving privacy model

The report SHALL open in the same browser context (new tab or overlay) without uploading the file to any external service.

#### Scenario: Local report preview

- **WHEN** the user clicks „Печат / PDF“
- **THEN** the printable report is shown using only data already in the browser session

## MODIFIED Requirements

### Requirement: One-click conversion flow

The system SHALL convert the selected file when the user clicks "Конвертирай", show a busy state during processing, and display success or error status in Bulgarian.

#### Scenario: Successful VU conversion

- **WHEN** the user clicks convert with a valid vehicle unit file loaded
- **THEN** the status confirms success in Bulgarian and download, TachoBox, and print/PDF buttons become enabled

#### Scenario: Successful driver card conversion

- **WHEN** the user clicks convert with a valid driver card file loaded
- **THEN** the status confirms success in Bulgarian and download, TachoBox, and print/PDF buttons become enabled

#### Scenario: Conversion in progress

- **WHEN** conversion is running
- **THEN** the convert button shows "Моля, изчакайте..." and is disabled

#### Scenario: Parser not loaded

- **WHEN** the user attempts conversion before WASM has loaded
- **THEN** the system shows an error asking the user to reload the page
