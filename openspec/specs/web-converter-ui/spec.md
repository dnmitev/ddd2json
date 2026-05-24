# web-converter-ui Specification

## Purpose
TBD - created by archiving change initial-release. Update Purpose after archive.
## Requirements
### Requirement: Bulgarian single-page interface

The system SHALL present a single-page interface in Bulgarian (`lang="bg"`) with no navigation, login, or configuration steps.

#### Scenario: Page loads with clear purpose

- **WHEN** the user opens the application
- **THEN** the page title and heading indicate DDD to TachoBox JSON conversion and show a "local in browser" privacy badge

### Requirement: File selection via drag-and-drop or picker

The system SHALL allow users to select one `.DDD` file at a time via drag-and-drop or a file picker button. Accepted extensions SHALL include `.ddd`, `.v1b`, `.c1b`, and `.tgd` (case-insensitive).

#### Scenario: File selected via picker

- **WHEN** the user clicks "Избери файл" and chooses a file
- **THEN** the file name and size are displayed and the convert button becomes enabled

#### Scenario: File dropped on dropzone

- **WHEN** the user drags a supported file onto the dropzone
- **THEN** the file is selected the same way as via the picker

#### Scenario: No file selected

- **WHEN** no file is selected
- **THEN** the convert, download, and TachoBox buttons are disabled and status reads "Изберете DDD файл."

### Requirement: One-click conversion flow

The system SHALL convert the selected file when the user clicks "Конвертирай", show a busy state during processing, and display success or error status in Bulgarian.

#### Scenario: Successful conversion

- **WHEN** the user clicks convert with a valid VU file loaded
- **THEN** the status changes to "Готово. Свалете JSON файла и го качете в TachoBox." and download/TachoBox buttons become enabled

#### Scenario: Conversion in progress

- **WHEN** conversion is running
- **THEN** the convert button shows "Моля, изчакайте..." and is disabled

#### Scenario: Parser not loaded

- **WHEN** the user attempts conversion before WASM has loaded
- **THEN** the system shows an error asking the user to reload the page

### Requirement: JSON download

The system SHALL let the user download the converted JSON as a file via a "Свали JSON" button using a client-side blob download.

#### Scenario: Download after conversion

- **WHEN** the user clicks "Свали JSON" after a successful conversion
- **THEN** the browser downloads a `.tachobox.json` file containing pretty-printed JSON

### Requirement: TachoBox handoff

The system SHALL provide an "Отвори TachoBox" button that opens `https://tachobox.flespi.io/#/` in a new browser tab after successful conversion.

#### Scenario: Open TachoBox after conversion

- **WHEN** the user clicks "Отвори TachoBox" after successful conversion
- **THEN** TachoBox opens in a new tab so the user can upload the downloaded JSON

### Requirement: Large file warning

The system SHALL warn the user when a selected file exceeds 8 MB but still allow conversion attempt.

#### Scenario: Oversized file selected

- **WHEN** the user selects a file larger than 8 MB
- **THEN** the status shows a warning that the file is unusually large

### Requirement: AGPL source visibility

The deployed site SHALL include a visible link to the project's public source repository to satisfy AGPL obligations for the bundled tachoparser dependency.

#### Scenario: Source link on deployed site

- **WHEN** the user views the deployed application
- **THEN** a link to the GitHub repository source code is visible on the page

