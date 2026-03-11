/**
 * Export event registrations to Excel format.
 * Header: Organization, Event name, Session, Date, Time
 * Table: Form fields from the registration form, in order.
 */
import * as XLSX from 'xlsx';
import { formatDateHKT, formatSessionDateTimeHKT } from './dateTimeHKT';
import type { ZubinEvent } from '@/types/event-types';
import type { EventRegistration } from '@/services/registrationService';
import type { RegistrationForm, FormSection, FormField } from '@/types/form-types';

const ORGANIZATION_NAME = 'The Zubin Foundation';

function getSessionDetails(
  event: ZubinEvent,
  sessionIds: string[]
): { title: string; date: Date; startTime: string; endTime: string }[] {
  if (!event?.sessions) return [];
  return sessionIds
    .map((sessionId) => event.sessions.find((s) => s._id === sessionId))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((session) => ({
      title: session.title,
      date: new Date(session.date),
      startTime: session.startTime,
      endTime: session.endTime,
    }));
}

function getFormFieldsInOrder(form: RegistrationForm): { sectionId: string; fieldId: string; label: string; type?: string }[] {
  const result: { sectionId: string; fieldId: string; label: string; type?: string }[] = [];
  const sections = [...(form.sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const section of sections) {
    const sec = section as FormSection & { _id?: string; id?: string };
    const sectionId = sec._id ?? sec.id ?? '';
    const fields = [...(section.fields || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const field of fields) {
      const f = field as FormField & { _id?: string; id?: string };
      const fieldId = f._id ?? f.id ?? '';
      result.push({ sectionId, fieldId, label: field.label, type: field.type });
    }
  }
  return result;
}

function getResponseValue(
  registration: EventRegistration,
  sectionId: string,
  fieldId: string,
  fieldType?: string
): string {
  const resp = registration.formResponses?.find(
    (r) =>
      (r.sectionId === sectionId && r.fieldId === fieldId) ||
      (r.fieldId === fieldId && !sectionId)
  );
  if (!resp) return '';
  let val = resp.response;
  if (val == null) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (fieldType === 'date' && val) {
    try {
      return formatDateHKT(new Date(val));
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export function exportRegistrationsToExcel(
  event: ZubinEvent,
  registrations: EventRegistration[],
  form: RegistrationForm | null,
  filteredRegistrations?: EventRegistration[]
) {
  const data = filteredRegistrations ?? registrations;

  // Build header rows
  const firstSession = event.sessions?.[0];
  const sessionLabel =
    event.sessions?.length === 0
      ? 'N/A'
      : event.sessions?.length === 1
        ? event.sessions[0].title
        : event.sessions?.map((s) => s.title).join(', ');
  const dateStr = event.startDate
    ? formatDateHKT(new Date(event.startDate))
    : 'N/A';
  const timeStr = firstSession
    ? `${firstSession.startTime} - ${event.sessions?.[0]?.endTime ?? ''} HKT`
    : 'N/A';

  const headerRows: (string | number)[][] = [
    ['Organization', ORGANIZATION_NAME],
    ['Event', event.title ?? ''],
    ['Session', sessionLabel],
    ['Date', dateStr],
    ['Time', timeStr],
    [], // empty row before table
  ];

  // Build table columns: Participant Name, Mobile, Email, then form fields, Sessions, Status
  const formFields = form ? getFormFieldsInOrder(form) : [];
  const colHeaders = [
    'Participant Name',
    'Mobile Number',
    'Email',
    ...formFields.map((f) => f.label),
    'Sessions Registered (Date & Time)',
    'Status',
  ];

  const tableRows: (string | number)[][] = data.map((reg) => {
    const sessionDetails = getSessionDetails(event, reg.sessions ?? []);
    const sessionsStr =
      sessionDetails.length > 0
        ? sessionDetails
            .map((s) => formatSessionDateTimeHKT(s.date, s.startTime, s.endTime))
            .join('; ')
        : 'No sessions selected';

    const name = `${reg.attendee?.firstName ?? ''} ${reg.attendee?.lastName ?? ''}`.trim();
    const formValues = formFields.map((f) =>
      getResponseValue(reg, f.sectionId, f.fieldId, f.type)
    );

    return [
      name,
      reg.attendee?.phone ?? '',
      reg.attendee?.email ?? '',
      ...formValues,
      sessionsStr,
      reg.status?.charAt(0).toUpperCase() + (reg.status?.slice(1) ?? ''),
    ];
  });

  const wsData = [...headerRows, colHeaders, ...tableRows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = colHeaders.map((_, i) => ({
    wch: Math.min(Math.max(12, String(colHeaders[i] ?? '').length), 40),
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

  const dateForFile = new Date().toISOString().slice(0, 10);
  const fileName = `Registrations_${(event.title ?? 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_${dateForFile}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
