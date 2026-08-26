# Twilio WhatsApp Template Implementation

## Overview

WhatsApp messaging uses **templates only** (no freeform/body messages) to avoid delivery failures outside the 24-hour session window (error 63016).

1. **Manual messages (Send WhatsApp Event Update in UI)**
   - Single session events use **`TWILIO_WHATSAPP_EVENT_UPDATE_SINGLE_SESSION_TEMPLATE_SID`** (5 variables: 1=firstName, 2=event title, 4=message, 5=contact name, 6=contact phone - {{3}} omitted).
   - Multiple session events use **`TWILIO_WHATSAPP_EVENT_UPDATE_MULTIPLE_SESSION_TEMPLATE_SID`** (6 variables: 1=firstName, 2=event title, 3=session, 4=message, 5=contact name, 6=contact phone).
   - Falls back to `TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID` if specific SID is not set.

2. **Scheduled event reminders**
   - Single session events use **`TWILIO_WHATSAPP_EVENT_REMINDER_SINGLE_SESSION_TEMPLATE_SID`** (8 variables: 1=firstName, 2=event title, 4=timeUntil, 5=date, 6=time, 7=location, 8=contact name, 9=contact phone - {{3}} omitted).
   - Multiple session events use **`TWILIO_WHATSAPP_EVENT_REMINDER_MULTIPLE_SESSION_TEMPLATE_SID`** (9 variables: 1=firstName, 2=event title, 3=session, 4=timeUntil, 5=date, 6=time, 7=location, 8=contact name, 9=contact phone).
   - Reminders are checked **every 5 minutes** in Hong Kong time (Asia/Hong_Kong).

## Template Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Event reminder single session template (8 variables): zubin_foundation_event_reminder_single_session_v3
TWILIO_WHATSAPP_EVENT_REMINDER_SINGLE_SESSION_TEMPLATE_SID=HXb7700b60a9fce26f582b44a5db78dc22
# Event reminder multiple sessions template (9 variables): zubin_foundation_event_reminder_multiple_sessions_v3
TWILIO_WHATSAPP_EVENT_REMINDER_MULTIPLE_SESSION_TEMPLATE_SID=HX2444217df35bf5af73648b0b2ab9463c

# Event update single session template (5 variables): zubin_foundation_event_update_single_session_v3
TWILIO_WHATSAPP_EVENT_UPDATE_SINGLE_SESSION_TEMPLATE_SID=HX4fdb80d8928f6962f8df1bd04b127303
# Event update multiple sessions template (6 variables): zubin_foundation_event_update_multiple_sessions_v3
TWILIO_WHATSAPP_EVENT_UPDATE_MULTIPLE_SESSION_TEMPLATE_SID=HX240c7c10a582fa8b2e081d4fc2c84da1

TWILIO_WHATSAPP_NUMBER=whatsapp:+1xxxxxxxxxxx
```

### Multiple Session Reminder Template Variables (9 variables)

```
Dear {{1}},
📢 Event: {{2}}
📋 Session: {{3}}

⏰ The session will start in {{4}}
📅 Date: {{5}}
🕐 Time: {{6}}
📍 Location: {{7}}
👤 Contact: {{8}}
📞 Phone: {{9}}
```

- **Variable 1**: First name
- **Variable 2**: Event title
- **Variable 3**: Session title
- **Variable 4**: Time until event
- **Variable 5**: Date
- **Variable 6**: Time
- **Variable 7**: Location
- **Variable 8**: Contact name
- **Variable 9**: Contact phone

### Single Session Reminder Template Variables (8 variables, {{3}} removed)

```
Dear {{1}},
📢 Event: {{2}}

⏰ The session will start in {{4}}
📅 Date: {{5}}
🕐 Time: {{6}}
📍 Location: {{7}}
👤 Contact: {{8}}
📞 Phone: {{9}}
```

- **Variable 1**: First name
- **Variable 2**: Event title
- **Variable 4**: Time until event
- **Variable 5**: Date
- **Variable 6**: Time
- **Variable 7**: Location
- **Variable 8**: Contact name
- **Variable 9**: Contact phone

### Multiple Session Event Update Template Variables (6 variables)

```
Dear {{1}},
*Event:* {{2}}
*Session:* {{3}}

{{4}}

For query,
👤 Contact: {{5}}
📞 Phone: {{6}}
```

- **Variable 1**: First name
- **Variable 2**: Event title
- **Variable 3**: Session title
- **Variable 4**: Message body
- **Variable 5**: Contact name
- **Variable 6**: Contact phone

### Single Session Event Update Template Variables (5 variables, {{3}} removed)

```
Dear {{1}},
*Event:* {{2}}

{{4}}

For query,
👤 Contact: {{5}}
📞 Phone: {{6}}
```

- **Variable 1**: First name
- **Variable 2**: Event title
- **Variable 4**: Message body
- **Variable 5**: Contact name
- **Variable 6**: Contact phone

## Implementation Details

### Backend Changes

#### 1. Reminder Service (`backend/src/services/reminderService.js`)

The `sendEventReminder` method supports both modes:

```javascript
// Template mode (default) - uses 8-variable reminder template
await this.sendEventReminder(
  event,
  reminderHours,
  eventType,
  startDateTime,
  true,
);

// Custom message mode - uses event update template
await this.sendEventReminder(
  event,
  reminderHours,
  eventType,
  startDateTime,
  false,
);
```

#### 2. Events Routes (`backend/src/routes/events.js`)

Both individual and bulk WhatsApp message routes use the event update template:

- `/send-whatsapp-reminder` - Individual messages (5 variables; variable 3 includes the post-body disclaimer)
- `/:id/send-whatsapp` - Bulk messages to all registered participants (5 variables; variable 3 includes the post-body disclaimer)

### Frontend Changes

#### 1. WhatsApp Message Dialog (`frontend/src/components/events-builder/whatsapp-message-dialog.tsx`)

- Session selector (from event sessions)
- Message input field
- Auto-fills contact info from event settings (staffContact)
- Template info display

## Troubleshooting

### Common Issues

1. **Template Not Found**: Ensure `TWILIO_WHATSAPP_TEMPLATE_SID` and `TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID` are correct
2. **Invalid Variables**: Check that date and time are properly formatted
3. **Authentication**: Verify Twilio credentials are valid

### Debugging

Check the backend logs for:

- Template variable formatting
- Twilio API responses
- Message delivery status
