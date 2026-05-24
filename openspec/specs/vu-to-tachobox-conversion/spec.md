# vu-to-tachobox-conversion Specification

## Purpose
TBD - created by archiving change initial-release. Update Purpose after archive.
## Requirements
### Requirement: Parse VU DDD files locally

The system SHALL parse vehicle unit tachograph files (`.DDD` and related extensions) entirely in the user's browser using a WebAssembly build of `traconiq/tachoparser`. No file content SHALL be sent to a server.

#### Scenario: Successful VU parse

- **WHEN** the user provides a valid 1st-generation VU `.DDD` file
- **THEN** the parser returns structured JSON with `mode: "vu"`, a verification flag, and decoded VU data

#### Scenario: Unrecognized file

- **WHEN** the user provides a file that cannot be parsed as tachograph data
- **THEN** the system returns a clear error message in Bulgarian explaining that conversion failed

#### Scenario: Auto-detection prefers VU for vehicle files

- **WHEN** the file name starts with `M_` or `V_`, or the file begins with byte `0x76`
- **THEN** the parser attempts VU decoding before driver card decoding

### Requirement: Convert gen-1 VU data to TachoBox JSON shape

The system SHALL map `vu_overview_1` and `vu_activities_1` fields from the parsed VU structure into a TachoBox-compatible JSON document with a top-level `{ "result": [...] }` array.

#### Scenario: Daily activity records produced

- **WHEN** the parsed VU data contains one or more `vu_activities_1` daily records
- **THEN** each daily record becomes one entry in the `result` array with `content.ActivityChangeInfo`, `content.CurrentDateTime`, `content.OdometerValueMidnight`, `content.VehicleIdentificationNumber`, and `content.VehicleRegistrationIdentification`

#### Scenario: Download activity on first day

- **WHEN** the VU overview contains `vu_download_activity_data`
- **THEN** the first day's record includes `content.VuDownloadActivityData` with `downloadingTime`, `fullCardNumber`, and `companyOrWorkshopName`

#### Scenario: No activity records

- **WHEN** the parsed VU data has no `vu_activities_1` entries
- **THEN** the system rejects conversion with an error stating no daily activity records were found

### Requirement: Reject non-VU files for conversion

The system SHALL NOT produce TachoBox JSON from driver card files in this release. Only VU mode results are accepted by the converter.

#### Scenario: Driver card file rejected at conversion

- **WHEN** the parser returns `mode: "card"` for the uploaded file
- **THEN** the converter rejects the file with a message that only vehicle unit files are supported

### Requirement: Output file naming

The system SHALL suggest an output filename derived from the input filename by replacing the extension with `.tachobox.json`.

#### Scenario: Standard filename suggestion

- **WHEN** the user converts `M_20260401.DDD`
- **THEN** the suggested download name is `M_20260401.tachobox.json`

### Requirement: Conversion summary metadata

The system SHALL compute a summary from the TachoBox JSON including registration plate, VIN, number of days, total activity count, and date period.

#### Scenario: Summary after successful conversion

- **WHEN** conversion completes successfully
- **THEN** the UI displays plate, VIN, day count, activity count, and from/to dates derived from the output JSON

