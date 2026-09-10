# WhatsApp Template Customization, Variable Engine & Lifecycle Management Guide

**Date:** September 10, 2026  
**Status:** Phase 1 Implemented & Verified (LIVE) | Phase 2 Architecture Ready  
**Relevant Modules:**
- Backend: `backend/src/models/Event.js`, `backend/src/models/WhatsAppTemplate.js`, `backend/src/services/reminderService.js`, `backend/src/routes/events.js`, `backend/src/routes/whatsappTemplates.js`, `backend/src/utils/whatsappEventUpdateVariables.js`
- Frontend: `frontend/src/components/events-builder/whatsapp-message-dialog.tsx`, `frontend/src/components/events/EventAdminForm.tsx`, `frontend/src/components/events-builder/new-event-builder.tsx`, `frontend/src/services/eventService.ts`, `frontend/src/types/event-types.ts`

---

## 1. Executive Summary & Strategic Decision

To support the client's request for multi-paragraph formatting and a dedicated WhatsApp template for their upcoming **Annual Event this Saturday**, the scope is divided into two phases:

* **Strategic Decision for Phase 1 (COMPLETED & VERIFIED):**
  * **Scope restricted EXCLUSIVELY to Automated Reminders** (`reminderService.js`).
  * **Manual Broadcast Updates** (`whatsapp-message-dialog.tsx` / `POST /api/events/:id/send-whatsapp`) **remain 100% UNTOUCHED**. Manual updates already provide a free-form textarea allowing staff to type and broadcast custom announcements on-demand.
  * The client's core problem was that automated reminders were collapsing into a single paragraph. Providing a dedicated template SID override specifically for automated reminders solves the issue with minimal code touch and zero risk to existing messaging flows.
* **Phase 2 (Post-Saturday):**
  * Introduces the full systematic **WhatsApp Template Registry**, live chat bubble preview, dynamic variable dictionary, Twilio Content API sync, and automated lifecycle archiving.

---

## 2. Technical Constraints: Line Breaks in WhatsApp

* **Forbidden Inside Placeholders:** Meta/Twilio strictly rejects newline characters (`\n`, `\r`) and tabs inside variable values (`{{1}}`, `{{2}}`), returning **Error 21656** or **Error 63005**.
* **Allowed in Template Body:** Multi-paragraph layout is achieved by baking line breaks directly into the **template body** in Twilio Console, surrounding individual variables or static text.
* **Separation of Concerns:** The template body holds the visual structure (paragraphs, headers, emojis); the variables only supply concise, sanitized text values.

---

## 3. Phase 1 Implementation Details: Automatic Reminders (COMPLETED & VERIFIED)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 PHASE 1: AUTOMATIC REMINDERS OVERRIDE (LIVE)            │
├───────────────────────────────┬─────────────────────────────────────────┤
│ 1. Manual Broadcast Updates   │ ❌ NO CHANGES (already supports custom) │
│ 2. Automatic Event Reminders  │ ✅ Dedicated Template SID Override      │
│ 3. Database Schema (Event.js) │ ✅ Added customReminderTemplateSid      │
│ 4. Backend (reminderService)  │ ✅ Template SID resolution & variables  │
│ 5. Backend (events.js)        │ ✅ CRUD support for custom template SID │
│ 6. Frontend Forms & Services  │ ✅ Admin input in Edit Form & Builder   │
│ 7. Unit Testing               │ ✅ 12/12 Jest tests passing             │
└───────────────────────────────┴─────────────────────────────────────────┘
```

### 3.1 Database Schema Addition: `backend/src/models/Event.js` [IMPLEMENTED]

Added `customReminderTemplateSid` under the reminder configuration block:

```javascript
// In backend/src/models/Event.js
customReminderTemplateSid: {
  type: String,
  trim: true,
  default: null
}
```

* **Behavior:** For all standard events, `customReminderTemplateSid` is `null`, automatically falling back to standard Twilio reminder templates. Only the Annual Event has this SID populated.

### 3.2 Event Routes: `backend/src/routes/events.js` [IMPLEMENTED]
* Updated `POST /api/events` (create) and `PUT /api/events/:id` (update) to parse, sanitize, and save `customReminderTemplateSid` from request payloads.

### 3.3 Automated Reminder Resolution: `backend/src/services/reminderService.js` [IMPLEMENTED]

In `sendEventReminder()`:

```javascript
// 1. Resolve Template SID
const hasCustomReminder = Boolean(
  event.customReminderTemplateSid &&
  String(event.customReminderTemplateSid).trim()
);

if (hasCustomReminder) {
  const customSid = String(event.customReminderTemplateSid).trim();
  const templateVariables = this.createCustomReminderVariables(registration, event);
  console.log(`[REMINDER SERVICE] Using custom event reminder template SID: ${customSid}`);
  await twilioClient.messages.create({
    from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
    contentSid: customSid,
    contentVariables: JSON.stringify(templateVariables),
    to: `whatsapp:${formattedNumber}`
  });
} else if (useTemplate && reminderTemplateSid) {
  // Existing default reminder flow
}
```

Added dedicated variable builder with Twilio Content API sanitization:
```javascript
// Create variables for custom event reminder template (e.g. Annual Event)
createCustomReminderVariables(registration, event) {
  const firstName = registration?.attendee?.firstName || ' ';
  return {
    "1": this.sanitizeContentVariable(firstName)
  };
}
```

### 3.4 Frontend Forms & Services [IMPLEMENTED]
* **`frontend/src/services/eventService.ts`**: Added `customReminderTemplateSid?: string;` to `Event` and `EventFormData` interfaces.
* **`frontend/src/types/event-types.ts`**: Added `customReminderTemplateSid?: string;` to `ZubinEvent` interface.
* **`frontend/src/components/events/EventAdminForm.tsx`**: Added **"Custom WhatsApp Reminder Template SID (Optional)"** text input under the WhatsApp Reminder section.
* **`frontend/src/components/events-builder/new-event-builder.tsx`**: Added `customReminderTemplateSid` to Zod validation schema, default form state, and UI form fields.

### 3.5 Manual Broadcasts Remain Untouched
* `POST /api/events/:id/send-whatsapp` in `backend/src/routes/events.js` remains unchanged.
* `frontend/src/components/events-builder/whatsapp-message-dialog.tsx` remains unchanged.
* Staff can continue to broadcast on-demand updates with freeform text whenever needed.

### 3.6 Automated Unit Tests [VERIFIED]
* Added tests in `backend/src/services/__tests__/reminderService.test.js` validating:
  * Variable 1 is populated with attendee first name.
  * Empty first names fallback safely to sanitized single space `" "`.
  * Newline characters in attendee names are sanitized to prevent Twilio Error 21656.
* Result: **12 passed, 12 total** in Jest.

### 3.7 Admin Instructions for Saturday's Annual Event
1. Copy the approved Twilio Content SID (e.g., `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
2. In the dashboard, edit the Annual Event (`/events/:id/edit` or Events Builder).
3. Paste the SID into the **Custom WhatsApp Reminder Template SID (Optional)** field.
4. Save the event.
5. Scheduled reminders will automatically use this multi-paragraph template for this event, while all other events continue using standard templates.

---

## 4. Phase 2 Architecture: Full Template Registry & Variable Engine

Post-Saturday, the system evolves into a fully configurable, database-backed template management architecture to eliminate `.env` maintenance and hardcoded variables.

### 4.1 Data Schema: `backend/src/models/WhatsAppTemplate.js`

```javascript
import mongoose from 'mongoose';

const whatsappTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g., "Annual Gala Confirmation & Schedule"
  },
  twilioContentSid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // e.g., "HX240c7c10a582fa8b2e081d4fc2c84da1"
  },
  channelType: {
    type: String,
    enum: ['reminder', 'update', 'both'],
    default: 'reminder'
  },
  templateBody: {
    type: String,
    required: true,
    // Static template body with placeholders for UI preview
  },
  // Systematic variable mapping: index (1, 2, 3) -> system token
  variables: [{
    index: { type: Number, required: true },
    token: { type: String, required: true }, // e.g., "attendee.firstName", "event.title"
    label: { type: String, required: true },
    fallbackValue: { type: String, default: " " }
  }],
  isSingleUse: {
    type: Boolean,
    default: false
  },
  associatedEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);
```

### 4.2 Predefined Variable Dictionary
The system exposes a standard catalog of data tokens:

| Token | Data Source | Sample Value |
| :--- | :--- | :--- |
| `attendee.firstName` | Registration attendee first name | Alex |
| `attendee.fullName` | Registration attendee full name | Alex Wong |
| `attendee.phone` | Registration attendee phone | +852 9123 4567 |
| `event.title` | Event title | Annual General Meeting 2026 |
| `event.date` | Event date (formatted HKT) | Saturday, September 12, 2026 |
| `event.startTime` | Event start time | 14:00 |
| `event.endTime` | Event end time | 17:00 |
| `event.venue` | Event location venue & district | Grand Hall, Central |
| `event.meetingLink` | Online video conference URL | https://zoom.us/j/... |
| `session.title` | Active session name (if applicable) | Keynote Speech |
| `staffContact.name` | Event staff contact person | Sarah Chen |
| `staffContact.phone` | Event staff phone number | +852 2345 6789 |
| `message.timeUntil` | Relative start time | 24 hours |
| `message.remarks` | Event custom reminder remarks | Please bring your ID card. |

### 4.3 Universal Variable Resolver Engine
```javascript
// backend/src/utils/templateVariableResolver.js
import { sanitizeContentVariable } from './whatsappEventUpdateVariables.js';
import { formatDateHKT } from './dateTimeUtils.js';

export function resolveTemplateVariables(template, { event, session, registration, reminderHours }) {
  const contentVariables = {};

  const context = {
    'attendee.firstName': registration?.attendee?.firstName || 'Participant',
    'attendee.fullName': [registration?.attendee?.firstName, registration?.attendee?.lastName].filter(Boolean).join(' ') || 'Participant',
    'attendee.phone': registration?.attendee?.phone || '',
    'event.title': event.title || 'Event',
    'event.date': formatDateHKT(session?.date || event.sessions?.[0]?.date || new Date()),
    'event.startTime': session?.startTime || event.sessions?.[0]?.startTime || '',
    'event.endTime': session?.endTime || event.sessions?.[0]?.endTime || '',
    'event.venue': session?.location?.venue || event.location?.venue || 'Venue',
    'event.meetingLink': session?.location?.meetingLink || event.location?.meetingLink || '',
    'session.title': session?.title || 'Main Session',
    'staffContact.name': event.staffContact?.name || 'Organizer',
    'staffContact.phone': event.staffContact?.phone || '',
    'message.timeUntil': reminderHours ? `${reminderHours >= 24 ? Math.floor(reminderHours / 24) + ' day(s)' : reminderHours + ' hour(s)'}` : '',
    'message.remarks': event.reminderRemarks || ''
  };

  for (const mapping of template.variables) {
    const rawVal = context[mapping.token] || mapping.fallbackValue || ' ';
    contentVariables[String(mapping.index)] = sanitizeContentVariable(rawVal);
  }

  return contentVariables;
}
```

---

## 5. Live WhatsApp Message Preview Component

In the Event Builder (`EventAdminForm.tsx`):
* When an admin selects a template, a **Live WhatsApp Chat Bubble** renders on-screen.
* Placeholders (`{{1}}`, `{{2}}`, etc.) are dynamically replaced with actual event details (Event Title, Date, Venue, Staff Name) or sample attendee data ("Dear Alex").
* Admins can inspect paragraph breaks, spacing, and emojis **before** saving the event.

```
┌────────────────────────────────────────────────────────┐
│  📱 WhatsApp Reminder Preview                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Dear Alex,                                       │  │
│  │                                                  │  │
│  │ 📢 Reminder: Annual General Meeting 2026        │  │
│  │ 📅 Date: Saturday, September 12, 2026            │  │
│  │ 📍 Venue: Grand Hall, Central                    │  │
│  │                                                  │  │
│  │ For queries, contact Sarah Chen (+852 2345 6789).│  │
│  │                                        10:30 AM  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 6. Single-Use Lifecycle & Automatic Disabling

To prevent one-off templates (e.g. Annual Event) from cluttering future event creation forms:

1. **Scoping in Event Forms:**
   ```javascript
   // Query for active templates:
   const query = {
     status: 'active',
     $or: [
       { isSingleUse: false },                                  // Global templates
       { isSingleUse: true, associatedEventId: currentEventId } // Single-use template tied to THIS event
     ]
   };
   ```
   * **Result:** No other event will ever see another event's single-use template.
2. **Auto-Archiving Trigger:**
   * When an event is marked `'Completed'` or `'Cancelled'`.
   * When `reminderService` detects that the event's end date has passed, any template with `isSingleUse: true` and `associatedEventId: event._id` is updated to `status: 'archived'`.

---

## 7. Eliminating `.env` Maintenance: Twilio Sync & UI Management

* `.env` is reserved strictly for **Global Credentials**:
  * `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
  * Global fallback default SIDs (`TWILIO_WHATSAPP_EVENT_REMINDER_...`, `TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID`)
* All custom template SIDs live in MongoDB.
* **Adding Templates Without Deployments:**
  * **Option A (Twilio Sync):** Backend queries `client.content.v1.contents.list()`, lists approved templates, and lets admins map variables in 2 clicks.
  * **Option B (Manual Entry):** Admin pastes the `HX...` Content SID and assigns variable tokens in the dashboard.
  * **Zero server redeployments or `.env` edits required.**

---

## 8. Summary Comparison: Phase 1 vs. Phase 2

| Dimension | Phase 1 (LIVE / COMPLETED) | Phase 2 (Post-Saturday Roadmap) |
| :--- | :--- | :--- |
| **Status** | **Implemented & Verified** | Architecture Ready for Development |
| **Scope** | **Automated Reminders Only** | Full Template Registry (Reminders & Updates) |
| **Manual Updates** | **Untouched** (keeps existing freeform text) | Integrated with Template Registry |
| **Files Modified** | `Event.js`, `events.js`, `reminderService.js`, forms | New Model, Resolver, Sync Route, UI Preview |
| **Variable Mapping** | Single recipient variable (`{{1}} = firstName`) | Predefined Dynamic Variable Dictionary |
| **Template SID Location** | Stored directly on `Event.customReminderTemplateSid` | Stored in `WhatsAppTemplate` MongoDB collection |
| **UI Experience** | Input field in Event Edit Form & Builder | Live WhatsApp Chat Bubble Preview Component |
| **Risk Level** | **Near Zero** (isolated to 1 event's reminder cron) | Comprehensive feature release with full tests |
