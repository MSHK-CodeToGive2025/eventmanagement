# Twilio WhatsApp Template Implementation

## Overview

This implementation supports **both** Twilio's WhatsApp Business API template system and traditional custom messages, giving users the flexibility to choose based on their needs:

1. **Custom Message Mode (Default)**: 
   - Full control over message content
   - More expensive than template messages
   - Flexible for unique communication needs
   - Requires compliance with WhatsApp content policies

2. **Template Mode**: 
   - Uses your approved WhatsApp template
   - Variable 1 = Event date (MM/DD/YYYY), Variable 2 = Event time (HH:MM AM/PM)
   - Significantly cheaper than custom messages
   - Fully compliant with WhatsApp Business API policies

## Template Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Twilio WhatsApp Template Configuration
TWILIO_WHATSAPP_TEMPLATE_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Template Variables

The template uses two variables:
- **Variable 1**: Event date (MM/DD/YYYY format)
- **Variable 2**: Event time (HH:MM AM/PM format)

## Implementation Details

### Backend Changes

#### 1. Reminder Service (`backend/src/services/reminderService.js`)

The `sendEventReminder` method now supports both modes:

```javascript
// Template mode (default)
await this.sendEventReminder(event, reminderHours, eventType, startDateTime, true);

// Custom message mode
await this.sendEventReminder(event, reminderHours, eventType, startDateTime, false);
```

#### 2. Events Routes (`backend/src/routes/events.js`)

Both individual and bulk WhatsApp message routes support dual modes:

- `/send-whatsapp-reminder` - Individual messages with `useTemplate` parameter
- `/:id/send-whatsapp` - Bulk messages with `useTemplate` parameter

**Request Body Examples:**
```javascript
// Template mode
{
  "to": "+1234567890",
  "useTemplate": true
}

// Custom message mode
{
  "to": "+1234567890",
  "message": "Your custom message here",
  "useTemplate": false
}
```

### Frontend Changes

#### 1. WhatsApp Message Dialog (`frontend/src/components/events-builder/whatsapp-message-dialog.tsx`)

- Added toggle switch between template and custom message modes
- Template mode shows template information
- Custom mode shows message input fields
- Dynamic button text based on selected mode

#### 2. Event Admin Form (`frontend/src/components/events/EventAdminForm.tsx`)

- Added template/custom message toggle
- Template mode shows template information
- Custom mode shows message textarea
- Form validation adapts to selected mode

#### 3. Event Reminders Page (`frontend/src/pages/internal/events-builder/event-reminders-page.tsx`)

- Added template mode toggle in a dedicated card
- Template information display when template mode is selected
- Reminder sending logic adapts to selected mode

## Usage

### Mode Selection

Users can toggle between modes using the switch controls:

- **Template Mode**: Pre-approved messages with automatic date/time variables
- **Custom Mode**: Full message control with custom content

### Automated Reminders

The system automatically sends reminders using the configured default mode:
- Event reminders
- Session reminders  
- Automated notification systems

### Manual Message Sending

Staff and admins can choose the mode when sending messages through:
- Event management interface
- WhatsApp message dialog
- Direct API calls

## Cost Comparison

| Mode | Cost | Compliance | Flexibility | Default |
|------|------|------------|-------------|---------|
| **Custom** | High | Medium | High | ✅ Yes |
| **Template** | Low | High | Low | No |

## Benefits of Dual-Mode Implementation

1. **Cost Optimization**: Use templates for routine communications
2. **Flexibility**: Custom messages for unique situations
3. **Compliance**: Template mode ensures WhatsApp Business API compliance
4. **User Choice**: Staff can select the most appropriate mode
5. **Gradual Migration**: Easy transition from custom to template messages

## Migration Notes

- Existing custom message functionality is preserved
- Template mode is the default for new implementations
- Users can switch between modes as needed
- Both modes use the same underlying Twilio infrastructure

## Troubleshooting

### Common Issues

1. **Template Not Found**: Ensure `TWILIO_WHATSAPP_TEMPLATE_SID` is correct
2. **Invalid Variables**: Check that date and time are properly formatted
3. **Authentication**: Verify Twilio credentials are valid
4. **Mode Selection**: Ensure `useTemplate` parameter is properly set

### Debugging

Check the backend logs for:
- Template variable formatting
- Twilio API responses
- Message delivery status
- Mode selection logging

## Future Enhancements

Potential improvements could include:
- Multiple template support for different message types
- Dynamic template selection based on event type
- Template performance analytics
- A/B testing for different template variations
- Cost tracking and reporting for both modes
- Template approval workflow management
