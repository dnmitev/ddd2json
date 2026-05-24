# Converter fixtures

## Driver card target shape (`DF_Tachograph`)

TachoBox expects driver card JSON in the [flespi tacho-file-parse](https://flespi.com/kb/tacho-file-parse-plugin) hierarchy, not the `{ "result": [...] }` wrapper used for vehicle unit daily exports.

```json
{
  "DF_Tachograph": {
    "EF_Identification": {
      "CardIdentification": { "cardNumber": "…" },
      "DriverCardHolderIdentification": {
        "cardHolderName": {
          "holderSurname": "…",
          "holderFirstNames": "…"
        }
      }
    },
    "EF_Driver_Activity_Data": {
      "CardDriverActivity": {
        "activityDailyRecords": [
          {
            "activityRecordDate": "2026-05-14T00:00:00Z",
            "activityDayDistance": 75,
            "activityChangeInfo": [
              {
                "workType": 3,
                "minutes": 471,
                "activity": "DRIVING"
              }
            ]
          }
        ]
      }
    }
  }
}
```

## Spike notes

- Raw tachoparser card JSON uses `card_driver_activity_1.decoded_activity_daily_records` (not the binary `activity_daily_records` field).
- Vehicle unit files continue to use `{ "result": [...] }` with `content.ActivityChangeInfo`.
- Confirm TachoBox import with a real `C_*.DDD` after conversion (task 4.1).
