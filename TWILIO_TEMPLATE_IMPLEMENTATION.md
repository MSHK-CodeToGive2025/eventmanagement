# Twilio WhatsApp Template Implementation

## Overview

WhatsApp messaging uses **templates only** (no freeform/body messages) to avoid delivery failures outside the 24-hour session window (error 63016).

1. **Manual messages (Send WhatsApp Event Update in UI)**  
   - Use the **event update utility template** (`TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID` / `zubin_foundation_event_update_v2`).  
   - Variable 1 = event title (auto-filled), Variable 2 = session (selectable), Variable 3 = your message (entered in the dialog), Variable 4 = contact name (auto-filled from event settings), Variable 5 = contact phone (auto-filled from event settings).

2. **Scheduled event reminders**  
   - Use the **8-variable reminder template** (`TWILIO_WHATSAPP_TEMPLATE_SID` / `zubin_foundation_event_reminder_v2`) when the event's default is "template", or the **event update template** when "custom".  
   - Reminders are checked **every 5 minutes** in Hong Kong time (Asia/Hong_Kong).

## Template Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Event reminder template (8 variables): zubin_foundation_event_reminder_v2
TWILIO_WHATSAPP_TEMPLATE_SID=HX6dcf16072c4b77b1513ef377de2c0879
# Event update template (5 variables): zubin_foundation_event_update_v2
TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID=HX1fc0085538023f4de77d3d3cce079387
TWILIO_WHATSAPP_NUMBER=xxx
```

### Reminder Template Variables (8 variables)

Template: `zubin_foundation_event_reminder_v2`

```
🔔 Event Reminder from The Zubin Foundation

📢 Event: {{1}}
📋 Session: {{2}}

⏰ The session will start in {{3}}
📅 Date: {{4}}
🕐 Time: {{5}}
📍 Location: {{6}}
👤 Contact: {{7}}
📞 Phone: {{8}}

We look forward to seeing you!
```

- **Variable 1**: Event title
- **Variable 2**: Session title (space for main events)
- **Variable 3**: Time until event (e.g., "2 hours", "1 day")
- **Variable 4**: Date (formatted as "Monday, January 15, 2024 HKT")
- **Variable 5**: Time (formatted as "2:30 PM HKT")
- **Variable 6**: Location (venue and district)
- **Variable 7**: Contact name
- **Variable 8**: Contact phone

### Event Update Template Variables (5 variables)

Template: `zubin_foundation_event_update_v2`

```
📢 *The Zubin Foundation Event Update*

*Event:* {{1}}
*Session:* {{2}}

{{3}}

For query,
👤 Contact: {{4}}
📞 Phone: {{5}}

Reply STOP to unsubscribe.
```

- **Variable 1**: Event title
- **Variable 2**: Session title (space if not applicable)
- **Variable 3**: Message body
- **Variable 4**: Contact name
- **Variable 5**: Contact phone

## Implementation Details

### Backend Changes

#### 1. Reminder Service (`backend/src/services/reminderService.js`)

The `sendEventReminder` method supports both modes:

```javascript
// Template mode (default) - uses 8-variable reminder template
await this.sendEventReminder(event, reminderHours, eventType, startDateTime, true);

// Custom message mode - uses event update template
await this.sendEventReminder(event, reminderHours, eventType, startDateTime, false);
```

#### 2. Events Routes (`backend/src/routes/events.js`)

Both individual and bulk WhatsApp message routes use the event update template:

- `/send-whatsapp-reminder` - Individual messages (5 variables)
- `/:id/send-whatsapp` - Bulk messages to all registered participants (5 variables)

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
