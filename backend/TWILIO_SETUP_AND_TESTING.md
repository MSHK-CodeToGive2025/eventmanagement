# Twilio WhatsApp Setup and Testing Guide

## Current Twilio Setup Status

Based on the codebase analysis, here's what's currently configured:

### ✅ Code Implementation
- **Reminder Service**: Fully implemented with automated hourly checks
- **Message Modes**: Supports both Custom and Template modes
- **Phone Formatting**: Automatic E.164 format conversion for WhatsApp compliance
- **Manual Trigger**: API endpoint available for testing (`/api/reminders/trigger`)

### ❌ Configuration Status
**Twilio credentials are NOT currently configured** in your `.env` file.

## Required Twilio Environment Variables

You need to add these to your `backend/.env` file:

```bash
# Twilio Account Credentials (Required)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# Twilio WhatsApp Number (Required)
# Format: whatsapp:+[country code][number]
# Example: whatsapp:+14155238886 (Twilio Sandbox)
# Example: whatsapp:+85212345678 (Hong Kong number)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Twilio WhatsApp Template SID (Optional - only if using template mode)
# This is only needed if you want to use WhatsApp Business API templates
TWILIO_WHATSAPP_TEMPLATE_SID=your_template_sid_here
```

## How the Reminder System Works

### 1. Automated Reminders
- **Schedule**: Runs every hour (cron job at minute 0)
- **Timezone**: Asia/Hong_Kong
- **Process**: 
  1. Finds all published events that haven't ended
  2. Checks if any reminder times match (within ±0.5 hour window)
  3. Sends WhatsApp messages to registered participants
  4. Marks reminders as sent to prevent duplicates

### 2. Reminder Timing
- Configurable per event via `reminderTimes` array (e.g., `[48, 24, 3]` = 48h, 24h, 3h before)
- Checks both main event and individual sessions
- Uses event's `defaultReminderMode` setting (custom or template)

### 3. Message Modes

#### Custom Message Mode (Default)
- Full control over message content
- Includes: Event title, date, time, location, staff contact
- More expensive but flexible

#### Template Mode
- Uses pre-approved WhatsApp Business API template
- Requires template approval from WhatsApp
- Significantly cheaper
- Uses 8 variables for dynamic content

## Testing the WhatsApp Reminder Flow

### Option 1: Manual API Trigger (Recommended for Testing)

Use the manual trigger endpoint to test immediately:

```bash
# Trigger reminder processing
curl -X POST http://localhost:3001/api/reminders/trigger
```

Or using PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/reminders/trigger" -Method POST
```

### Option 2: Create Test Event with Near-Future Date

1. Create an event that starts soon (e.g., 1 hour from now)
2. Set reminder times to `[1]` (1 hour before)
3. Register a participant with a valid WhatsApp number
4. Wait for the next hourly cron job OR trigger manually

### Option 3: Use Test Script

See `test-whatsapp-reminder.js` for a comprehensive test script.

## Twilio Sandbox Setup (For Testing)

If you don't have a production Twilio WhatsApp number yet, you can use Twilio's Sandbox:

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
2. **Enable WhatsApp Sandbox**: 
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join the sandbox
3. **Get Sandbox Number**: Usually `whatsapp:+14155238886`
4. **Get Credentials**: 
   - Account SID and Auth Token from Twilio Console Dashboard

### Sandbox Limitations
- Can only send to numbers that have joined the sandbox
- To join: Send "join [keyword]" to the sandbox number via WhatsApp
- Limited to testing purposes

## Production Setup

For production, you'll need:

1. **Twilio WhatsApp Business API Account**
2. **Approved WhatsApp Business Profile**
3. **Verified Phone Number** (can be purchased through Twilio)
4. **Template Approval** (if using template mode)

## Testing Checklist

- [ ] Twilio credentials added to `.env`
- [ ] Backend server restarted to load new credentials
- [ ] Test event created with reminder times
- [ ] Participant registered with valid WhatsApp number
- [ ] Manual trigger tested
- [ ] Check backend logs for success/failure messages
- [ ] Verify message received on WhatsApp

## Troubleshooting

### "Twilio client not initialized"
- Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Restart backend server after adding credentials

### "Reminder service will be disabled"
- Twilio credentials missing or invalid
- Check `.env` file and restart server

### Messages not sending
- Verify phone numbers are in E.164 format
- Check Twilio console for error messages
- Ensure recipient has joined sandbox (if using sandbox)
- Check Twilio account balance

### Wrong phone format errors
- Phone numbers must be in E.164 format: `+[country code][number]`
- Example: `+85212345678` (Hong Kong)
- The system auto-formats, but original must be valid

## Logs to Monitor

Watch backend console for:
- `[REMINDER SERVICE] Twilio client initialized successfully`
- `[REMINDER SERVICE] Reminder service started`
- `[REMINDER SERVICE] Processing reminders for event: [event name]`
- `[REMINDER SERVICE] ✅ Successfully sent reminder to [number]`
- `[REMINDER SERVICE] ❌ Failed to send reminder: [error]`

## Next Steps

1. Get Twilio credentials (sandbox or production)
2. Add credentials to `backend/.env`
3. Restart backend server
4. Run test script or create test event
5. Monitor logs and verify messages received


