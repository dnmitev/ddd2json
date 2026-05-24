export const REPORT_STORAGE_KEY = "ddd2json-report";

const MINUTES_PER_DAY = 1440;

export function buildReport(parseResult, fileName = "tachograph.DDD") {
  if (!parseResult || parseResult.error) {
    throw new Error(parseResult?.error || "Parser did not return data.");
  }

  if (parseResult.mode === "card") {
    return buildCardReport(parseResult.data, fileName);
  }

  if (parseResult.mode === "vu") {
    return buildVuReport(parseResult.data, fileName);
  }

  throw new Error("Неразпознат тип tachograph файл.");
}

function buildCardReport(data, fileName) {
  const identification =
    data?.card_identification_and_driver_card_holder_identification_1 || {};
  const holder = identification.driver_card_holder_identification || {};
  const cardId = identification.card_identification || {};
  const holderName = holder.card_holder_name || {};
  const records = data?.card_driver_activity_1?.decoded_activity_daily_records || [];

  const days = records
    .filter((day) => (day.activity_change_info?.length || 0) > 0)
    .map((day) => buildDayRow(day.activity_record_date, day.activity_change_info, day.activity_day_distance))
    .sort((left, right) => left.dateUnix - right.dateUnix);

  if (!days.length) {
    throw new Error("Не са намерени дневни записи за активност в картата на водача.");
  }

  const driverName = [holderName.holder_first_names, holderName.holder_surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return buildReportModel({
    kind: "card",
    fileName,
    typeLabel: "Карта на водач",
    identity: [
      { label: "Водач", value: driverName || "-" },
      { label: "Номер на карта", value: cardId.card_number || "-" },
      { label: "Издател", value: cardId.card_issuing_authority_name || "-" },
    ],
    days,
  });
}

function buildVuReport(data, fileName) {
  const overview = data?.vu_overview_1 || {};
  const activities = data?.vu_activities_1 || [];
  const registration = overview.vehicle_registration_identification || {};

  const days = activities
    .map((day) => {
      const changes = day.vu_activity_daily_data?.activity_change_info || [];
      if (!changes.length) {
        return null;
      }
      return buildDayRow(day.time_real, changes, day.odometer_value_midnight);
    })
    .filter(Boolean)
    .sort((left, right) => left.dateUnix - right.dateUnix);

  if (!days.length) {
    throw new Error("No daily activity records were found in this vehicle unit file.");
  }

  return buildReportModel({
    kind: "vu",
    fileName,
    typeLabel: "Tachograph (VU)",
    identity: [
      { label: "Рег. номер", value: registration.vehicle_registration_number || "-" },
      { label: "VIN", value: overview.vehicle_identification_number || "-" },
      { label: "Държава", value: String(registration.vehicle_registration_nation || "-") },
    ],
    days,
  });
}

function buildReportModel({ kind, fileName, typeLabel, identity, days }) {
  return {
    kind,
    fileName,
    typeLabel,
    generatedAt: new Date().toISOString(),
    identity,
    period: {
      from: days[0].dateLabel,
      to: days.at(-1).dateLabel,
    },
    days,
    disclaimer:
      "Справка за информация. Не е официален документ и не включва проверка по EU 561/2006.",
  };
}

function buildDayRow(dateValue, changes, distance) {
  const totals = aggregateActivityDurations(changes);
  const dateUnix = toUnix(dateValue);

  return {
    dateUnix,
    dateLabel: formatDate(dateUnix),
    driving: totals.driving,
    drivingLabel: formatDuration(totals.driving),
    work: totals.work,
    workLabel: formatDuration(totals.work),
    rest: totals.rest,
    restLabel: formatDuration(totals.rest),
    availability: totals.availability,
    availabilityLabel: formatDuration(totals.availability),
    distance: normalizeDistance(distance),
  };
}

export function aggregateActivityDurations(changes) {
  const sorted = [...changes].sort((left, right) => (left.minutes || 0) - (right.minutes || 0));
  const totals = { driving: 0, work: 0, rest: 0, availability: 0 };

  for (let index = 0; index < sorted.length; index += 1) {
    const start = sorted[index].minutes || 0;
    const end =
      index + 1 < sorted.length ? sorted[index + 1].minutes || 0 : MINUTES_PER_DAY;
    const duration = Math.max(0, end - start);
    const workType = sorted[index].work_type ?? 0;

    if (workType === 3) {
      totals.driving += duration;
    } else if (workType === 2) {
      totals.work += duration;
    } else if (workType === 1) {
      totals.availability += duration;
    } else {
      totals.rest += duration;
    }
  }

  return totals;
}

export function storeReport(report) {
  sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
}

export function loadReport() {
  const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

export function formatDuration(minutes) {
  if (!minutes) {
    return "0мин";
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) {
    return `${hours}ч ${mins}мин`;
  }
  if (hours) {
    return `${hours}ч`;
  }
  return `${mins}мин`;
}

function normalizeDistance(value) {
  if (value == null || value === "") {
    return "-";
  }
  return String(value);
}

function toUnix(value) {
  if (!value) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
}

function formatDate(unix) {
  if (!unix) {
    return "-";
  }
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(unix * 1000));
}
