import {
  convertParseResultToTachobox,
  summarizeTachobox,
  suggestOutputName,
} from "./converter.js";

const TACHOBOX_URL = "https://tachobox.flespi.io/#/";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const state = {
  file: null,
  outputName: "",
  outputText: "",
};

const elements = {
  dropzone: document.querySelector("[data-dropzone]"),
  fileInput: document.querySelector("[data-file-input]"),
  chooseButton: document.querySelector("[data-choose-file]"),
  convertButton: document.querySelector("[data-convert]"),
  downloadButton: document.querySelector("[data-download]"),
  openTachobox: document.querySelector("[data-open-tachobox]"),
  fileName: document.querySelector("[data-file-name]"),
  fileMeta: document.querySelector("[data-file-meta]"),
  status: document.querySelector("[data-status]"),
  summary: document.querySelector("[data-summary]"),
  summaryFields: document.querySelectorAll("[data-summary-field]"),
  summaryLabels: document.querySelectorAll("[data-summary-label]"),
};

bootstrap();

function bootstrap() {
  elements.chooseButton.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", () => {
    selectFile(elements.fileInput.files?.[0] || null);
  });
  elements.convertButton.addEventListener("click", convertCurrentFile);
  elements.downloadButton.addEventListener("click", downloadCurrentJson);
  elements.openTachobox.addEventListener("click", () => {
    window.open(TACHOBOX_URL, "_blank", "noopener,noreferrer");
  });

  elements.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.dropzone.classList.add("is-dragging");
  });
  elements.dropzone.addEventListener("dragleave", () => {
    elements.dropzone.classList.remove("is-dragging");
  });
  elements.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove("is-dragging");
    selectFile(event.dataTransfer.files?.[0] || null);
  });

  setStatus("Изберете DDD файл.", "idle");
}

function selectFile(file) {
  resetOutput();

  if (!file) {
    state.file = null;
    elements.fileName.textContent = "Няма избран файл";
    elements.fileMeta.textContent = "";
    elements.convertButton.disabled = true;
    setStatus("Изберете DDD файл.", "idle");
    return;
  }

  state.file = file;
  elements.fileName.textContent = file.name;
  elements.fileMeta.textContent = `${formatBytes(file.size)} · файлът остава само във вашия браузър`;
  elements.convertButton.disabled = false;

  if (file.size > MAX_FILE_SIZE) {
    setStatus("Файлът е необичайно голям. Опитайте, но ако браузърът забави, пишете ми.", "warn");
  } else {
    setStatus("Готово за конвертиране.", "ready");
  }
}

async function convertCurrentFile() {
  if (!state.file) {
    return;
  }

  resetOutput();
  setBusy(true);
  setStatus("Конвертиране...", "busy");

  try {
    await ensureParserLoaded();
    const bytes = new Uint8Array(await state.file.arrayBuffer());
    const rawResult = window.ddd2jsonParse(bytes, state.file.name);
    const parseResult = JSON.parse(rawResult);
    const tachoboxJson = convertParseResultToTachobox(parseResult, state.file.name);

    state.outputName = suggestOutputName(state.file.name);
    state.outputText = `${JSON.stringify(tachoboxJson, null, 2)}\n`;

    renderSummary(summarizeTachobox(tachoboxJson));
    setStatus("Готово. Свалете JSON файла и го качете в TachoBox.", "success");
    elements.downloadButton.disabled = false;
    elements.openTachobox.disabled = false;
  } catch (error) {
    setStatus(error.message || "Неуспешно конвертиране.", "error");
  } finally {
    setBusy(false);
  }
}

function downloadCurrentJson() {
  if (!state.outputText) {
    return;
  }

  const url = URL.createObjectURL(
    new Blob([state.outputText], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = state.outputName || "tachobox.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function ensureParserLoaded() {
  if (typeof window.ddd2jsonParse !== "function") {
    throw new Error("Парсерът още не е зареден. Презаредете страницата и опитайте пак.");
  }
}

function renderSummary(summary) {
  const labels =
    summary.kind === "card"
      ? { primary: "Водач", secondary: "Номер на карта" }
      : { primary: "Рег. номер", secondary: "VIN" };

  for (const label of elements.summaryLabels) {
    label.textContent = labels[label.dataset.summaryLabel] || label.textContent;
  }

  const fields =
    summary.kind === "card"
      ? {
          primary: summary.driverName,
          secondary: summary.cardNumber,
          days: String(summary.days),
          activities: String(summary.activities),
          period: `${summary.from} - ${summary.to}`,
        }
      : {
          primary: summary.plate,
          secondary: summary.vin,
          days: String(summary.days),
          activities: String(summary.activities),
          period: `${summary.from} - ${summary.to}`,
        };

  for (const field of elements.summaryFields) {
    field.textContent = fields[field.dataset.summaryField] || "-";
  }
  elements.summary.hidden = false;
}

function resetOutput() {
  state.outputName = "";
  state.outputText = "";
  elements.summary.hidden = true;
  elements.downloadButton.disabled = true;
  elements.openTachobox.disabled = true;
}

function setBusy(isBusy) {
  elements.convertButton.disabled = isBusy || !state.file;
  elements.convertButton.dataset.busy = isBusy ? "true" : "false";
}

function setStatus(message, tone) {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

