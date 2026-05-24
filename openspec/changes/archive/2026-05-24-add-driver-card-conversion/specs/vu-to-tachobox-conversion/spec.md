## REMOVED Requirements

### Requirement: Reject non-VU files for conversion

**Reason**: Driver card conversion is now in scope via `card-to-tachobox-conversion`.

**Migration**: Card files are routed to the card converter when `parseResult.mode` is `card`. VU conversion behavior is unchanged.

## MODIFIED Requirements

### Requirement: Conversion summary metadata

The system SHALL compute a summary from the TachoBox JSON. For vehicle unit files the summary SHALL include registration plate, VIN, number of days, total activity count, and date period.

#### Scenario: Summary after successful VU conversion

- **WHEN** a vehicle unit file converts successfully
- **THEN** the UI displays plate, VIN, day count, activity count, and from/to dates derived from the output JSON
