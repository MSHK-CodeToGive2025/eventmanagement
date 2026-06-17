/**
 * Shared copy and sanitization for Twilio WhatsApp "event update" content template
 * (TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID / zubin_foundation_event_update_v3).
 */

/** Twilio Content API: no null/empty, no newlines/tabs, max 4 consecutive spaces (error 21656) */
export function sanitizeContentVariable(val) {
  if (val == null || val === "") return " ";
  let s = String(val)
    .replace(/\r\n|\r|\n|\t/g, " ")
    .replace(/\s{5,}/g, "    ");
  return s.trim() === "" ? " " : s;
}

/**
 * Builds template variable 3: user/system message body.
 * Newlines in the user message are flattened to spaces for Twilio compliance.
 */
export function buildEventUpdateMessageBodyVariable(userMessage) {
  const body = String(userMessage ?? "").trim();
  return sanitizeContentVariable(body);
}
