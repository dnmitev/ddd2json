# Converter fixtures

## Driver card target shape (TachoBox demo)

TachoBox expects the **same top-level wrapper as its demo download**, not a bare `DF_Tachograph` root:

```json
{
  "result": [
    {
      "uuid": "…",
      "name": "C_….DDD",
      "meta": {
        "driver_first_name": "…",
        "driver_last_name": "…",
        "driver_id": "…",
        "plate_number": "",
        "region": "E",
        "type": "tacho"
      },
      "content": {
        "DF_Tachograph": {
          "EF_Identification": { … },
          "EF_Driver_Activity_Data": {
            "CardDriverActivity": {
              "activityDailyRecords": [
                {
                  "activityRecordDate": 1764547200,
                  "activityDayDistance": 510,
                  "activityChangeInfo": [
                    {
                      "activity": "DRIVING",
                      "cardInserted": true,
                      "changeTime": 348,
                      "drivingStatus": "SINGLE",
                      "slot": "DRIVER"
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]
}
```

Key differences from raw tachoparser JSON:

- One `result` entry per card (all days inside `activityDailyRecords`)
- Dates as **unix seconds**, not ISO strings
- `activityChangeInfo` uses `slot`, `drivingStatus`, `cardInserted` (not `workType` / `minutes` alone)
- Vehicle unit files still use per-day `result[]` with `content.ActivityChangeInfo`
