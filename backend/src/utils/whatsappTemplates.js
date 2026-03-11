const DEFAULT_REMINDER_TEMPLATE_SID = 'HX6dcf16072c4b77b1513ef377de2c0879';
const DEFAULT_EVENT_UPDATE_TEMPLATE_SID = 'HX1fc0085538023f4de77d3d3cce079387';

function getConfiguredTemplateSid(envName, fallbackSid) {
  const configuredSid = process.env[envName];
  if (typeof configuredSid === 'string' && configuredSid.trim()) {
    return configuredSid.trim();
  }
  return fallbackSid;
}

export function getReminderTemplateSid() {
  return getConfiguredTemplateSid('TWILIO_WHATSAPP_TEMPLATE_SID', DEFAULT_REMINDER_TEMPLATE_SID);
}

export function getEventUpdateTemplateSid() {
  return getConfiguredTemplateSid('TWILIO_WHATSAPP_EVENT_UPDATE_TEMPLATE_SID', DEFAULT_EVENT_UPDATE_TEMPLATE_SID);
}

export function sanitizeContentVariable(value) {
  if (value == null || value === '') {
    return ' ';
  }

  const sanitizedValue = String(value)
    .replace(/\r\n|\r|\n|\t/g, ' ')
    .replace(/\s{5,}/g, '    ')
    .trim();

  return sanitizedValue || ' ';
}

export function getDefaultSessionLabel(sessions = []) {
  if (sessions.length === 1) {
    return sessions[0].title || 'Main event';
  }
  if (sessions.length > 1) {
    return 'All sessions';
  }
  return 'Main event';
}

export function buildEventUpdateTemplateVariables({
  eventTitle,
  sessionTitle,
  messageBody,
  contactName,
  contactPhone
}) {
  return {
    '1': sanitizeContentVariable(eventTitle),
    '2': sanitizeContentVariable(sessionTitle),
    '3': sanitizeContentVariable(messageBody),
    '4': sanitizeContentVariable(contactName),
    '5': sanitizeContentVariable(contactPhone)
  };
}

export {
  DEFAULT_REMINDER_TEMPLATE_SID,
  DEFAULT_EVENT_UPDATE_TEMPLATE_SID
};
