// app/admin/generateFilledCalendar.js
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

const toIsoDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const s = value.trim().split(/[T\s]/)[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const parsed = new Date(s);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed.toISOString().split("T")[0];
    }
  }
  return null;
};

export const generateFilledCalendar = async (
  unitLabel,
  events = [],
  visibleDate,
) => {
  if (!visibleDate) visibleDate = new Date();
  const view = new Date(visibleDate);
  view.setHours(0, 0, 0, 0);

  const year = view.getFullYear();
  const month = view.getMonth();

  const response = await fetch("/templates/calendar-template.docx");
  const arrayBuffer = await (await response.blob()).arrayBuffer();
  const zip = new PizZip(arrayBuffer);

  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  // Map events by date for quick lookup
  const eventsByDate = {};
  for (const ev of events) {
    const iso = toIsoDate(ev.start);
    if (!iso) continue;
    if (!eventsByDate[iso]) eventsByDate[iso] = [];
    eventsByDate[iso].push(ev);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun, 6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const weeks = [];
  let currentWeek = [];

  // Previous month tail
  for (let i = 0; i < startWeekday; i++) {
    const dayNum = prevMonthDays - startWeekday + 1 + i; // ascending order
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const isoPrev = `${prevYear}-${String(prevMonth + 1).padStart(
      2,
      "0",
    )}-${String(dayNum).padStart(2, "0")}`;
    const matchingEvents = eventsByDate[isoPrev] || [];
    const label =
      matchingEvents.length > 0
        ? matchingEvents.map((ev) => ev.title).join("\n")
        : "";

    currentWeek.push({ day: `${dayNum}`, label, isOtherMonth: true });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    const matchingEvents = eventsByDate[iso] || [];
    const label =
      matchingEvents.length > 0
        ? matchingEvents.map((ev) => ev.title).join("\n")
        : "";

    currentWeek.push({ day: `${day}`, label, isOtherMonth: false });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  // After finishing current month, fill next month tail if needed
  let nextDay = 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const isoNext = `${nextYear}-${String(nextMonth + 1).padStart(
        2,
        "0",
      )}-${String(nextDay).padStart(2, "0")}`;
      const matchingEvents = eventsByDate[isoNext] || [];
      const label =
        matchingEvents.length > 0
          ? matchingEvents.map((ev) => ev.title).join("\n")
          : "";

      currentWeek.push({ day: `${nextDay}`, label, isOtherMonth: true });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  // Fill extra weeks to ensure 6 rows
  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i++) {
      const isoNext = `${nextYear}-${String(nextMonth + 1).padStart(
        2,
        "0",
      )}-${String(nextDay).padStart(2, "0")}`;
      const matchingEvents = eventsByDate[isoNext] || [];
      const label =
        matchingEvents.length > 0
          ? matchingEvents.map((ev) => ev.title).join("\n")
          : "";

      extraWeek.push({ day: `${nextDay}`, label, isOtherMonth: true });
      nextDay++;
    }
    weeks.push(extraWeek);
  }

  // Flatten weeks into day0..day41
  const dayVars = {};
  let counter = 0;
  weeks.forEach((week) => {
    week.forEach((d) => {
      dayVars[`day${counter}`] = d.day;
      dayVars[`label${counter}`] = d.label;
      dayVars[`isOtherMonth${counter}`] = !!d.isOtherMonth;
      counter++;
    });
  });

  doc.setData({
    unitLabel,
    monthName: view.toLocaleString("default", { month: "long" }),
    year,
    ...dayVars,
  });

  try {
    doc.render();
  } catch (err) {
    console.error("Error rendering DOCX:", err);
    throw err;
  }

  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  saveAs(out, `Calendar_${unitLabel}_${year}.docx`);
};
