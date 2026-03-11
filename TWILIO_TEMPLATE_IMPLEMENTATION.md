# Twilio WhatsApp Template Implementation

## Overview

WhatsApp messaging uses **templates only** (no freeform/body messages) to avoid delivery failures outside the 24-hour session window (error 63016).

1. **Manual messages (Send WhatsApp in UI)**  
   - Uses the **event update (notification) template** (`TWILIO_WHATSAPP_NOTIFICATION_TEMPLATE_SID`, `zubin_foundation_event_update_v2`).  
   - 5 variables: {{1}} event title, {{2}} session, {{3}} message body, {{4}} contact name, {{5}} contact phone.

2. **Scheduled event reminders**  
   - Uses the **8-variable reminder template** (`TWILIO_WHATSAPP_TEMPLATE_SID`, `zubin_foundation_event_reminder_v2`) when the event's default is "template", or the **5-variable notification template** (`TWILIO_WHATSAPP_NOTIFICATION_TEMPLATE_SID`) when "custom".  
   - Reminders are checked **every 5 minutes** in Hong Kong time (Asia/Hong_Kong).

## Template Configuration

### Environment Variables

```bash
# 8-variable reminder template (zubin_foundation_event_reminder_v2)
TWILIO_WHATSAPP_TEMPLATE_SID=HX6dcf16072c4b77b1513ef377de2c0879

# 5-variable event update/notification template (zubin_foundation_event_update_v2)
TWILIO_WHATSAPP_NOTIFICATION_TEMPLATE_SID=HX1fc0085538023f4de77d3d3cce079387

TWILIO_WHATSAPP_NUMBER=+15557515340
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
```

### Reminder Template Variables (8-variable, `TWILIO_WHATSAPP_TEMPLATE_SID`)

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

- **{{1}}**: Event title
- **{{2}}**: Session title (space for main events)
- **{{3}}**: Time until event (e.g., "2 hours", "1 day")
- **{{4}}**: Date (formatted, e.g., "Monday, January 15, 2026 HKT")
- **{{5}}**: Time (formatted, e.g., "09:00 AM HKT")
- **{{6}}**: Location (venue and district, or "Online")
- **{{7}}**: Contact name
- **{{8}}**: Contact phone

### Notification/Event Update Template Variables (5-variable, `TWILIO_WHATSAPP_NOTIFICATION_TEMPLATE_SID`)

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

- **{{1}}**: Event title
- **{{2}}**: Session title (space if not applicable)
- **{{3}}**: Message body
- **{{4}}**: Contact name
- **{{5}}**: Contact phone

## Troubleshooting

1. **Template Not Found**: Ensure `TWILIO_WHATSAPP_TEMPLATE_SID` and `TWILIO_WHATSAPP_NOTIFICATION_TEMPLATE_SID` are correct
2. **Invalid Variables**: Twilio rejects empty string variables — all variables are sanitized to a space `" "` if empty
3. **Authentication**: Verify Twilio credentials are valid
