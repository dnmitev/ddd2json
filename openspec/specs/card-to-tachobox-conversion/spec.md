# card-to-tachobox-conversion Specification

## Purpose
TBD - created by archiving change add-driver-card-conversion. Update Purpose after archive.
## Requirements
### Requirement: Route conversion by parser mode

The system SHALL dispatch conversion based on `parseResult.mode`: `vu` uses the existing VU mapper, `card` uses the driver card mapper.

#### Scenario: Driver card file routed to card converter

- **WHEN** the parser returns `mode: "card"` for an uploaded file
- **THEN** the system invokes the driver card to TachoBox conversion path instead of rejecting the file

#### Scenario: Vehicle unit file unchanged

- **WHEN** the parser returns `mode: "vu"` for an uploaded file
- **THEN** the system uses the existing VU conversion path without behavior change

### Requirement: Convert gen-1 driver card data to TachoBox JSON

The system SHALL map gen-1 driver card fields from tachoparser output (including `card_driver_activity_1` and driver identification blocks) into JSON that TachoBox accepts when uploaded from disk.

#### Scenario: Daily activity records from card

- **WHEN** the parsed card contains decodable gen-1 daily activity records in `card_driver_activity_1`
- **THEN** the converter produces a TachoBox-compatible JSON document with per-day activity data suitable for the Activities view

#### Scenario: Driver identification in output

- **WHEN** the parsed card contains `card_identification_and_driver_card_holder_identification_1`
- **THEN** the output includes driver identity metadata (name and/or card number) used by TachoBox overview views

#### Scenario: No activity records on card

- **WHEN** the parsed card has no usable gen-1 daily activity records
- **THEN** the system rejects conversion with a clear Bulgarian error explaining that no driver activity was found

### Requirement: TachoBox format validation spike

Before finalizing field mappings, the project SHALL validate the produced JSON by uploading a real gen-1 `C_*.DDD` conversion to TachoBox and confirming the file loads.

#### Scenario: End-to-end card validation

- **WHEN** a real driver card file is converted and uploaded to TachoBox
- **THEN** TachoBox displays driver activity data without import errors

### Requirement: Card conversion summary metadata

The system SHALL compute a summary for driver card output including driver name, card number (when available), number of days, total activity count, and date period.

#### Scenario: Summary after successful card conversion

- **WHEN** a driver card file converts successfully
- **THEN** the summary includes driver-oriented fields instead of vehicle plate and VIN

