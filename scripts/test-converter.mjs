import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  convertParseResultToTachobox,
  summarizeTachobox,
} from "../public/converter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cardFixture = JSON.parse(
  readFileSync(join(root, "scripts/fixtures/card-parser-redacted.json"), "utf8"),
);

const cardJson = convertParseResultToTachobox(cardFixture, "C_redacted.DDD");
assert.ok(cardJson.DF_Tachograph, "card output uses DF_Tachograph");
assert.ok(
  cardJson.DF_Tachograph.EF_Driver_Activity_Data.CardDriverActivity.activityDailyRecords
    .length === 2,
  "card fixture has two activity days",
);

const cardSummary = summarizeTachobox(cardJson);
assert.equal(cardSummary.kind, "card");
assert.equal(cardSummary.driverName, "GIVEN NAMES SURNAME");
assert.equal(cardSummary.cardNumber, "EX0000000Z000000");

try {
  convertParseResultToTachobox({ mode: "card", data: { card_driver_activity_1: {} } }, "C_empty.DDD");
  assert.fail("empty card should throw");
} catch (error) {
  assert.match(error.message, /активност/);
}

const vuFixture = {
  mode: "vu",
  data: {
    vu_overview_1: {
      vehicle_identification_number: "VIN123",
      vehicle_registration_identification: {
        vehicle_registration_number: "CA1234XX",
        vehicle_registration_nation: "BG",
      },
    },
    vu_activities_1: [
      {
        time_real: "2026-05-01T00:00:00Z",
        odometer_value_midnight: 1000,
        vu_activity_daily_data: {
          activity_change_info: [{ driver: true, team: false, card_present: true, work_type: 3, minutes: 60 }],
        },
      },
    ],
  },
};

const vuJson = convertParseResultToTachobox(vuFixture, "M_test.DDD");
assert.ok(vuJson.result, "vu output still uses result array");
assert.equal(summarizeTachobox(vuJson).kind, "vu");

console.log("converter tests passed");
