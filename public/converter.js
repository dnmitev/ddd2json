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

  if (parseResult.mode !== "vu") {
    throw new Error("Only vehicle unit DDD files are supported in this first version.");
  }

  return convertVuToTachobox(parseResult.data, fileName);
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

export function summarizeTachobox(tachoboxJson) {
  const records = tachoboxJson?.result || [];
  const first = records[0]?.content || {};
  const last = records.at(-1)?.content || {};
  const meta = records[0]?.meta || {};

  const activityCount = records.reduce(
    (count, record) => count + (record.content?.ActivityChangeInfo?.length || 0),
    0,
  );

  return {
    vin: meta.vin || "-",
    plate: meta.plate_number || "-",
    days: records.length,
    activities: activityCount,
    from: formatDate(first.CurrentDateTime?.[0]),
    to: formatDate(last.CurrentDateTime?.[0]),
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
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value * 1000));
}

