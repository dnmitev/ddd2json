## MODIFIED Requirements

### Requirement: One-click conversion flow

The system SHALL convert the selected file when the user clicks "Конвертирай", show a busy state during processing, and display success or error status in Bulgarian.

#### Scenario: Successful VU conversion

- **WHEN** the user clicks convert with a valid vehicle unit file loaded
- **THEN** the status changes to "Готово. Свалете JSON файла и го качете в TachoBox." and download/TachoBox buttons become enabled

#### Scenario: Successful driver card conversion

- **WHEN** the user clicks convert with a valid driver card file loaded
- **THEN** the status confirms success in Bulgarian and download/TachoBox buttons become enabled

#### Scenario: Conversion in progress

- **WHEN** conversion is running
- **THEN** the convert button shows "Моля, изчакайте..." and is disabled

#### Scenario: Parser not loaded

- **WHEN** the user attempts conversion before WASM has loaded
- **THEN** the system shows an error asking the user to reload the page

## ADDED Requirements

### Requirement: File-type-aware conversion summary

The summary panel SHALL adapt labels and values based on whether the converted file was a vehicle unit or driver card.

#### Scenario: Driver card summary labels

- **WHEN** a driver card file is converted successfully
- **THEN** the summary shows driver name and card number fields instead of registration plate and VIN

#### Scenario: Vehicle unit summary labels

- **WHEN** a vehicle unit file is converted successfully
- **THEN** the summary continues to show plate and VIN as today
