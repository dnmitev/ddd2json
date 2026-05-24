import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateActivityDurations,
  buildReport,
  formatDuration,
} from "../public/report.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cardFixture = JSON.parse(
  readFileSync(join(root, "scripts/fixtures/card-parser-redacted.json"), "utf8"),
);

const cardReport = buildReport(cardFixture, "C_redacted.DDD");
assert.equal(cardReport.kind, "card");
assert.equal(cardReport.typeLabel, "Карта на водач");
assert.equal(cardReport.identity[0].value, "GIVEN NAMES SURNAME");
assert.equal(cardReport.identity[1].value, "EX0000000Z000000");
assert.equal(cardReport.days.length, 2);
assert.equal(cardReport.period.from, "13.05.2026 г.");
assert.equal(cardReport.period.to, "14.05.2026 г.");

const may13 = cardReport.days.find((day) => day.dateLabel === "13.05.2026 г.");
assert.equal(may13.driving, 1140, "driving from minute 300 to end of day");
assert.equal(may13.distance, "120");

const may14 = cardReport.days.find((day) => day.dateLabel === "14.05.2026 г.");
assert.equal(may14.driving, 969, "driving from minute 471 to midnight");
assert.equal(may14.rest, 471, "rest from midnight to minute 471");

assert.equal(formatDuration(90), "1ч 30мин");
assert.equal(formatDuration(60), "1ч");
assert.equal(formatDuration(15), "15мин");

const aggregated = aggregateActivityDurations([
  { work_type: 0, minutes: 0 },
  { work_type: 3, minutes: 120 },
  { work_type: 2, minutes: 300 },
]);
assert.deepEqual(aggregated, {
  driving: 180,
  work: 1140,
  rest: 120,
  availability: 0,
});

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
          activity_change_info: [
            { work_type: 3, minutes: 60 },
            { work_type: 0, minutes: 480 },
          ],
        },
      },
    ],
  },
};

const vuReport = buildReport(vuFixture, "M_test.DDD");
assert.equal(vuReport.kind, "vu");
assert.equal(vuReport.identity[0].value, "CA1234XX");
assert.equal(vuReport.days[0].driving, 420);
assert.equal(vuReport.days[0].rest, 960);
assert.equal(vuReport.days[0].distance, "1000");

try {
  buildReport({ mode: "card", data: { card_driver_activity_1: {} } }, "C_empty.DDD");
  assert.fail("empty card should throw");
} catch (error) {
  assert.match(error.message, /активност/);
}

console.log("report tests passed");
