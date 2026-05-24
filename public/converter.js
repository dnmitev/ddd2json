const ACTIVITY_BY_WORK_TYPE = {
  0: "BREAK/REST",
  1: "AVAILABILITY",
  2: "WORK",
  3: "DRIVING",
};

export function convertParseResultToTachobox(parseResult, fileName) {
  if (!parseResult || parseResult.error) {
    throw new Error(parseResult?.error || "Parser did not return data.");
  }

  if (parseResult.mode === "vu") {
    return convertVuToTachobox(parseResult.data, fileName);
  }

  if (parseResult.mode === "card") {
    return convertCardToTachobox(parseResult.data, fileName);
  }

  throw new Error("Неразпознат тип tachograph файл.");
}

export function convertVuToTachobox(data, fileName = "tachograph.DDD") {
  const overview = data?.vu_overview_1 || {};
  const activities = data?.vu_activities_1 || [];

  if (!activities.length) {
    throw new Error("No daily activity records were found in this vehicle unit file.");
  }

  const vin = overview.vehicle_identification_number || "";
  const registration = overview.vehicle_registration_identification || {};
  const plate = registration.vehicle_registration_number || "";
  const nation = registration.vehicle_registration_nation || "";
  const downloadActivity = convertDownloadActivity(overview.vu_download_activity_data);

  const result = activities.map((day, index) => {
    const currentDateTime = toUnix(day.time_real);
    const activityInfo = day.vu_activity_daily_data?.activity_change_info || [];
    const content = {
      CurrentDateTime: [currentDateTime],
      ActivityChangeInfo: activityInfo.map(convertActivity),
      OdometerValueMidnight: [day.odometer_value_midnight || 0],
      VehicleIdentificationNumber: [vin],
      VehicleRegistrationIdentification: [
        {
          vehicleRegistrationNation: nation,
          vehicleRegistrationNumber: plate,
        },
      ],
    };

    if (index === 0 && downloadActivity) {
      content.VuDownloadActivityData = [downloadActivity];
    }

    return {
      uuid: `${fileName}:${index}`,
      name: fileName,
      meta: {
        vin,
        plate_number: plate,
        region: nation,
      },
      content,
    };
  });

  return { result };
}

/**
 * Driver card output uses the flespi/TachoBox DF_Tachograph shape (see scripts/fixtures/README.md).
 */
export function convertCardToTachobox(data, fileName = "driver.DDD") {
  const activityBlock = data?.card_driver_activity_1;
  const dailyRecords = activityBlock?.decoded_activity_daily_records || [];

  if (!dailyRecords.length) {
    throw new Error("Не са намерени дневни записи за активност в картата на водача.");
  }

  const identification =
    data?.card_identification_and_driver_card_holder_identification_1 || {};
  const holder = identification.driver_card_holder_identification || {};
  const cardId = identification.card_identification || {};
  const holderName = holder.card_holder_name || {};

  const activityDailyRecords = dailyRecords
    .filter((day) => (day.activity_change_info?.length || 0) > 0)
    .map((day) => ({
      activityRecordDate: day.activity_record_date,
      activityDayDistance: day.activity_day_distance || 0,
      activityDailyPresenceCounter: day.activity_daily_presence_counter || 0,
      activityChangeInfo: (day.activity_change_info || []).map(convertCardActivityChange),
    }))
    .sort((left, right) => toUnix(left.activityRecordDate) - toUnix(right.activityRecordDate));

  if (!activityDailyRecords.length) {
    throw new Error("Не са намерени дневни записи за активност в картата на водача.");
  }

  return {
    DF_Tachograph: {
      EF_Identification: {
        CardIdentification: {
          cardIssuingMemberState: cardId.card_issuing_member_state ?? null,
          cardNumber: cardId.card_number || "",
          cardIssuingAuthorityName: cardId.card_issuing_authority_name || "",
          cardIssueDate: cardId.card_issue_date || null,
          cardValidityBegin: cardId.card_validity_begin || null,
          cardExpiryDate: cardId.card_expiry_date || null,
        },
        DriverCardHolderIdentification: {
          cardHolderName: {
            holderSurname: holderName.holder_surname || "",
            holderFirstNames: holderName.holder_first_names || "",
          },
          cardHolderBirthDate: holder.card_holder_birth_date || null,
        },
      },
      EF_Driver_Activity_Data: {
        CardDriverActivity: {
          cardDownloadFileName: fileName,
          activityDailyRecords,
        },
      },
    },
  };
}

export function summarizeTachobox(tachoboxJson) {
  if (tachoboxJson?.DF_Tachograph) {
    return summarizeCardTachobox(tachoboxJson);
  }

  return summarizeVuTachobox(tachoboxJson);
}

function summarizeVuTachobox(tachoboxJson) {
  const records = tachoboxJson?.result || [];
  const first = records[0]?.content || {};
  const last = records.at(-1)?.content || {};
  const meta = records[0]?.meta || {};

  const activityCount = records.reduce(
    (count, record) => count + (record.content?.ActivityChangeInfo?.length || 0),
    0,
  );

  return {
    kind: "vu",
    plate: meta.plate_number || "-",
    vin: meta.vin || "-",
    days: records.length,
    activities: activityCount,
    from: formatDate(first.CurrentDateTime?.[0]),
    to: formatDate(last.CurrentDateTime?.[0]),
  };
}

function summarizeCardTachobox(tachoboxJson) {
  const identification = tachoboxJson.DF_Tachograph?.EF_Identification || {};
  const cardId = identification.CardIdentification || {};
  const holder = identification.DriverCardHolderIdentification || {};
  const holderName = holder.cardHolderName || {};
  const records =
    tachoboxJson.DF_Tachograph?.EF_Driver_Activity_Data?.CardDriverActivity
      ?.activityDailyRecords || [];

  const activityCount = records.reduce(
    (count, day) => count + (day.activityChangeInfo?.length || 0),
    0,
  );

  const driverName = [holderName.holderFirstNames, holderName.holderSurname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    kind: "card",
    driverName: driverName || "-",
    cardNumber: cardId.cardNumber || "-",
    days: records.length,
    activities: activityCount,
    from: formatDate(records[0]?.activityRecordDate),
    to: formatDate(records.at(-1)?.activityRecordDate),
  };
}

export function suggestOutputName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base || "tachograph"}.tachobox.json`;
}

function convertActivity(activity) {
  return {
    slot: activity.driver ? "DRIVER" : "CO-DRIVER",
    team: Boolean(activity.team),
    cardPresent: Boolean(activity.card_present),
    activity: ACTIVITY_BY_WORK_TYPE[activity.work_type] || "BREAK/REST",
    changeTime: activity.minutes || 0,
  };
}

function convertCardActivityChange(activity) {
  return {
    driver: Boolean(activity.driver),
    team: Boolean(activity.team),
    cardPresent: Boolean(activity.card_present),
    workType: activity.work_type ?? 0,
    activity: ACTIVITY_BY_WORK_TYPE[activity.work_type] || "BREAK/REST",
    minutes: activity.minutes || 0,
    changeTime: activity.minutes || 0,
  };
}

function convertDownloadActivity(record) {
  if (!record?.downloading_time) {
    return null;
  }

  return {
    downloadingTime: toUnix(record.downloading_time),
    fullCardNumber: record.full_card_number || null,
    companyOrWorkshopName: record.company_or_workshop_name || "",
  };
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

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const unix = typeof value === "string" ? toUnix(value) : value;
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(unix * 1000));
}
