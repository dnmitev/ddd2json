const ACTIVITY_BY_WORK_TYPE = {
  0: "BREAK/REST",
  1: "AVAILABILITY",
  2: "WORK",
  3: "DRIVING",
};

/** EU tachograph NationNumeric → alpha (TachoBox uses short codes like "I", "E", "BG"). */
const NATION_NUMERIC_TO_ALPHA = {
  7: "BG",
  15: "E",
  19: "I",
  21: "LT",
  25: "NL",
  27: "PL",
  34: "RO",
  36: "SK",
  38: "S",
  39: "CH",
  40: "TR",
  41: "GB",
  255: "",
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
 * Driver card output matches TachoBox demo JSON: one `result` entry with
 * `content.DF_Tachograph` and unix timestamps (see scripts/fixtures/README.md).
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
  const cardNumber = cardId.card_number || "";
  const region = memberStateAlpha(cardNumber, cardId.card_issuing_member_state);

  const activityDailyRecords = dailyRecords
    .filter((day) => (day.activity_change_info?.length || 0) > 0)
    .map((day) => ({
      activityRecordDate: toUnix(day.activity_record_date),
      activityDayDistance: day.activity_day_distance || 0,
      activityChangeInfo: (day.activity_change_info || []).map(convertCardActivityChange),
    }))
    .sort((left, right) => left.activityRecordDate - right.activityRecordDate);

  if (!activityDailyRecords.length) {
    throw new Error("Не са намерени дневни записи за активност в картата на водача.");
  }

  const dfTachograph = {
    EF_Identification: {
      CardIdentification: {
        cardIssuingMemberState: region,
        cardNumber,
        cardIssuingAuthorityName: cardId.card_issuing_authority_name || "",
        cardIssueDate: toUnix(cardId.card_issue_date),
        cardValidityBegin: toUnix(cardId.card_validity_begin),
        cardExpiryDate: toUnix(cardId.card_expiry_date),
      },
      DriverCardHolderIdentification: {
        cardHolderName: {
          holderSurname: holderName.holder_surname || "",
          holderFirstNames: holderName.holder_first_names || "",
        },
        cardHolderBirthDate: birthDateToUnix(holder.card_holder_birth_date),
        cardHolderPreferredLanguage: holder.card_holder_preferred_language || undefined,
      },
    },
    EF_Driver_Activity_Data: {
      CardDriverActivity: {
        activityDailyRecords,
      },
    },
  };

  const appId = data?.driver_card_application_identification_1;
  if (appId?.type_of_tachograph_card_id != null) {
    dfTachograph.EF_Application_Identification = {
      DriverCardApplicationIdentification: {
        typeOfTachographCardId: appId.type_of_tachograph_card_id,
        cardStructureVersion: appId.card_structure_version?.[0] ?? 0,
        noOfEventsPerType: appId.no_of_events_per_type ?? 0,
        noOfFaultsPerType: appId.no_of_faults_per_type ?? 0,
        activityStructureLength: appId.activity_structure_length ?? 0,
        noOfCardVehicleRecords: appId.no_of_card_vehicle_records ?? 0,
        noOfCardPlaceRecords: appId.no_of_card_place_records ?? 0,
      },
    };
  }

  const lastDownload = data?.last_card_download_1?.last_card_download;
  if (lastDownload) {
    dfTachograph.EF_Card_Download = {
      LastCardDownload: toUnix(lastDownload),
    };
  }

  const licence = data?.card_driving_licence_information_1;
  if (licence?.driving_licence_number) {
    dfTachograph.EF_Driving_Licence_Info = {
      CardDrivingLicenceInformation: {
        drivingLicenceNumber: licence.driving_licence_number,
        drivingLicenceIssuingAuthority: licence.driving_licence_issuing_authority || "",
        drivingLicenceIssuingNation: memberStateAlpha(
          "",
          licence.driving_licence_issuing_nation,
        ),
      },
    };
  }

  const currentUse = data?.card_current_use_1;
  const currentVehicle = currentUse?.session_open_vehicle;
  if (currentUse?.session_open_time || currentVehicle?.vehicle_registration_number) {
    dfTachograph.EF_Current_Usage = {
      CardCurrentUse: {
        sessionOpenTime: toUnix(currentUse.session_open_time),
        sessionOpenVehicle: {
          vehicleRegistrationNation: memberStateAlpha(
            "",
            currentVehicle?.vehicle_registration_nation,
          ),
          vehicleRegistrationNumber: currentVehicle?.vehicle_registration_number || "",
        },
      },
    };
  }

  const firstNames = holderName.holder_first_names || "";
  const surname = holderName.holder_surname || "";
  const currentPlate =
    dfTachograph.EF_Current_Usage?.CardCurrentUse?.sessionOpenVehicle
      ?.vehicleRegistrationNumber || "";

  return {
    result: [
      {
        uuid: `${fileName}:card`,
        name: fileName,
        meta: {
          driver_first_name: firstNames,
          driver_last_name: surname,
          driver_id: cardNumber,
          plate_number: currentPlate,
          region,
          type: "tacho",
        },
        content: {
          DF_Tachograph: dfTachograph,
        },
      },
    ],
  };
}

export function summarizeTachobox(tachoboxJson) {
  if (tachoboxJson?.result?.[0]?.content?.DF_Tachograph) {
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
  const entry = tachoboxJson.result[0];
  const meta = entry.meta || {};
  const df = entry.content?.DF_Tachograph || {};
  const records =
    df.EF_Driver_Activity_Data?.CardDriverActivity?.activityDailyRecords || [];

  const activityCount = records.reduce(
    (count, day) => count + (day.activityChangeInfo?.length || 0),
    0,
  );

  const driverName = [meta.driver_first_name, meta.driver_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    kind: "card",
    driverName: driverName || "-",
    cardNumber: meta.driver_id || "-",
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
    activity: ACTIVITY_BY_WORK_TYPE[activity.work_type] || "BREAK/REST",
    cardInserted: Boolean(activity.card_present),
    changeTime: activity.minutes || 0,
    drivingStatus: activity.team ? "CREW" : "SINGLE",
    slot: activity.driver ? "DRIVER" : "CO-DRIVER",
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

function memberStateAlpha(cardNumber, numericState) {
  if (typeof cardNumber === "string" && cardNumber.length >= 2) {
    if (cardNumber.startsWith("BG")) {
      return "BG";
    }
    if (/^[A-Z]/.test(cardNumber)) {
      return cardNumber[0];
    }
  }
  return NATION_NUMERIC_TO_ALPHA[numericState] ?? "";
}

function birthDateToUnix(birthDate) {
  if (!birthDate?.year) {
    return 0;
  }
  return Math.floor(Date.UTC(birthDate.year, (birthDate.month || 1) - 1, birthDate.day || 1) / 1000);
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
