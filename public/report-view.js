import { loadReport } from "./report.js";

bootstrap();

function bootstrap() {
  const report = loadReport();
  const root = document.querySelector("[data-report-root]");
  const empty = document.querySelector("[data-report-empty]");
  const printButton = document.querySelector("[data-print-report]");

  if (!report) {
    root.hidden = true;
    empty.hidden = false;
    printButton.disabled = true;
    return;
  }

  empty.hidden = true;
  root.hidden = false;
  renderReport(report, root);
  printButton.addEventListener("click", () => window.print());
}

function renderReport(report, root) {
  document.title = `Справка — ${report.fileName}`;

  const identityHtml = report.identity
    .map(
      (item) =>
        `<div class="report-identity-item"><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`,
    )
    .join("");

  const rowsHtml = report.days
    .map(
      (day) => `
        <tr>
          <td>${escapeHtml(day.dateLabel)}</td>
          <td>${escapeHtml(day.drivingLabel)}</td>
          <td>${escapeHtml(day.workLabel)}</td>
          <td>${escapeHtml(day.restLabel)}</td>
          <td>${escapeHtml(day.availabilityLabel)}</td>
          <td>${escapeHtml(day.distance)}</td>
        </tr>`,
    )
    .join("");

  root.innerHTML = `
    <header class="report-header">
      <p class="report-eyebrow">DDD converter</p>
      <h1>Справка за tachograph данни</h1>
      <p class="report-meta"><strong>Файл:</strong> ${escapeHtml(report.fileName)}</p>
      <p class="report-meta"><strong>Тип:</strong> ${escapeHtml(report.typeLabel)}</p>
      <p class="report-meta"><strong>Период:</strong> ${escapeHtml(report.period.from)} – ${escapeHtml(report.period.to)}</p>
      <dl class="report-identity">${identityHtml}</dl>
    </header>
    <section>
      <h2>Дневна активност</h2>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Шофиране</th>
            <th>Работа</th>
            <th>Почивка</th>
            <th>Наличност</th>
            <th>Разст. (км)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </section>
    <footer class="report-footer">
      <p>${escapeHtml(report.disclaimer)}</p>
      <p>Генерирано: ${escapeHtml(formatGeneratedAt(report.generatedAt))}</p>
    </footer>
  `;
}

function formatGeneratedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
