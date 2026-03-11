import { format, isValid } from "date-fns";
import * as XLSX from "xlsx";
import type { EventRegistration } from "@/services/registrationService";
import type { RegistrationForm, FormField } from "@/types/form-types";
import type { ZubinEvent } from "@/types/event-types";

const ORGANIZATION_NAME = "The Zubin Foundation";

type ExportCellValue = string | number | boolean | Date | null | undefined;

interface RegistrationExportOptions {
  event: ZubinEvent;
  registrations: EventRegistration[];
  form?: RegistrationForm | null;
  organizationName?: string;
}

interface RegistrationExportSheetData {
  rows: string[][];
  columnWidths: { wch: number }[];
  mergeRangeEndColumn: number;
  filename: string;
}

interface OrderedFormField {
  sectionId: string;
  field: FormField;
}

function formatValue(value: ExportCellValue, fieldType?: FormField["type"]): string {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).filter(Boolean).join(", ");
  }

  if (fieldType === "date" || value instanceof Date) {
    const dateValue = value instanceof Date ? value : new Date(String(value));
    if (isValid(dateValue)) {
      return format(dateValue, "dd MMM yyyy");
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getOrderedFormFields(form?: RegistrationForm | null): OrderedFormField[] {
  if (!form) {
    return [];
  }

  return [...form.sections]
    .sort((left, right) => left.order - right.order)
    .flatMap((section) =>
      [...section.fields]
        .sort((left, right) => left.order - right.order)
        .map((field) => ({ sectionId: section._id, field }))
    );
}

function getFieldByResponse(
  orderedFields: OrderedFormField[],
  fieldId: string,
  sectionId?: string
): FormField | undefined {
  const exactMatch = orderedFields.find(
    ({ sectionId: candidateSectionId, field }) =>
      field._id === fieldId && (!sectionId || candidateSectionId === sectionId)
  );

  if (exactMatch) {
    return exactMatch.field;
  }

  return orderedFields.find(({ field }) => field._id === fieldId)?.field;
}

function formatSessionDate(sessionDate: Date | string): string {
  const parsedDate = sessionDate instanceof Date ? sessionDate : new Date(sessionDate);
  return isValid(parsedDate) ? format(parsedDate, "dd MMM yyyy") : "";
}

function formatSessionTime(startTime?: string, endTime?: string): string {
  if (!startTime && !endTime) {
    return "";
  }
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime || endTime || "";
}

function getSessionSummary(event: ZubinEvent): string {
  if (!event.sessions?.length) {
    return "Main event";
  }

  return event.sessions.map((session) => session.title).join(" | ");
}

function getDateSummary(event: ZubinEvent): string {
  if (event.sessions?.length) {
    return event.sessions.map((session) => formatSessionDate(session.date)).join(" | ");
  }

  const startDate = formatSessionDate(event.startDate);
  const endDate = formatSessionDate(event.endDate);
  return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
}

function getTimeSummary(event: ZubinEvent): string {
  if (!event.sessions?.length) {
    return "";
  }

  return event.sessions
    .map((session) => formatSessionTime(session.startTime, session.endTime))
    .join(" | ");
}

function getRegisteredSessions(registration: EventRegistration, event: ZubinEvent): string {
  if (!registration.sessions?.length || !event.sessions?.length) {
    return "";
  }

  return event.sessions
    .filter((session) => registration.sessions.includes(session._id))
    .map((session) => session.title)
    .join(", ");
}

function sanitizeFilenamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildRegistrationExportSheetData({
  event,
  registrations,
  form,
  organizationName = ORGANIZATION_NAME
}: RegistrationExportOptions): RegistrationExportSheetData {
  const orderedFields = getOrderedFormFields(form);
  const formHeaders = orderedFields.map(({ field }) => field.label);
  const baseHeaders = [
    "Participant First Name",
    "Participant Last Name",
    "Mobile Number",
    "Email",
    "Sessions Registered",
    "Registration Status",
    "Registered At"
  ];
  const headers = [...baseHeaders, ...formHeaders];

  const rows = [
    [organizationName],
    [],
    ["Event Name", event.title],
    ["Session", getSessionSummary(event)],
    ["Date", getDateSummary(event)],
    ["Time", getTimeSummary(event)],
    [],
    headers
  ];

  for (const registration of registrations) {
    const orderedResponseValues = orderedFields.map(({ field, sectionId }) => {
      const response = registration.formResponses?.find(
        (entry) =>
          entry.fieldId === field._id &&
          (!entry.sectionId || entry.sectionId === sectionId)
      );

      if (!response) {
        return "";
      }

      const resolvedField = getFieldByResponse(orderedFields, response.fieldId, response.sectionId);
      return formatValue(response.response, resolvedField?.type);
    });

    rows.push([
      registration.attendee.firstName,
      registration.attendee.lastName,
      registration.attendee.phone,
      registration.attendee.email || "",
      getRegisteredSessions(registration, event),
      registration.status,
      formatValue(registration.registeredAt, "date"),
      ...orderedResponseValues
    ]);
  }

  const columnWidths = headers.map((header, index) => {
    const rowValues = rows.slice(7).map((row) => row[index] || "");
    const longestValue = Math.max(header.length, ...rowValues.map((value) => String(value).length), 12);
    return { wch: Math.min(longestValue + 2, 40) };
  });

  return {
    rows,
    columnWidths,
    mergeRangeEndColumn: Math.max(headers.length - 1, 0),
    filename: `${sanitizeFilenamePart(event.title || "event")}-registrations.xlsx`
  };
}

export function downloadRegistrationExport(options: RegistrationExportOptions) {
  const sheetData = buildRegistrationExportSheetData(options);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData.rows);

  worksheet["!cols"] = sheetData.columnWidths;
  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: sheetData.mergeRangeEndColumn }
    }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
  XLSX.writeFile(workbook, sheetData.filename);

  return sheetData.filename;
}
