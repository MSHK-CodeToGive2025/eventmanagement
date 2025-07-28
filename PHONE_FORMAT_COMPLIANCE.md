# Phone Format Compliance for Twilio WhatsApp

This document outlines the implementation of consistent mobile phone format validation and formatting to comply with Twilio WhatsApp number format requirements.

## Overview

The system now includes comprehensive phone number validation and formatting utilities that ensure all phone numbers are stored and transmitted in E.164 format, which is required for Twilio WhatsApp API integration.

## Key Features

### 1. E.164 Format Compliance
- All phone numbers are automatically formatted to E.164 standard
- Hong Kong numbers are handled with +852 country code
- International numbers are supported with proper country codes
- Real-time validation with user-friendly error messages

### 2. Frontend Components
- **PhoneInput Component**: Specialized input component with real-time validation
- **Visual Feedback**: Green checkmark for valid numbers, red alert for invalid
- **Auto-formatting**: Numbers are formatted for display when user leaves the field
- **Placeholder Guidance**: Clear examples of expected format

### 3. Backend Validation
- **Mongoose Schema Validation**: Phone numbers validated at database level
- **Middleware**: Automatic phone number formatting in API requests
- **WhatsApp Integration**: Proper formatting for Twilio WhatsApp API calls

## Implementation Details

### Frontend Utilities (`frontend/src/lib/phone-utils.ts`)

```typescript
// Main validation function
formatPhoneNumberForTwilio(phoneNumber: string): PhoneNumberInfo

// Form validation
validatePhoneNumberForForm(phoneNumber: string): { isValid: boolean; error?: string }

// Display formatting
formatPhoneNumberForDisplay(phoneNumber: string): string

// WhatsApp API formatting
formatForWhatsApp(phoneNumber: string): string
```

### Backend Utilities (`backend/src/utils/phoneUtils.js`)

```javascript
// Main validation function
formatPhoneNumberForTwilio(phoneNumber)

// Form validation
validatePhoneNumberForForm(phoneNumber)

// Middleware for API requests
validatePhoneNumberMiddleware(req, res, next)
```

### PhoneInput Component (`frontend/src/components/ui/phone-input.tsx`)

Features:
- Real-time validation with visual feedback
- Auto-formatting on blur
- Error message display
- Accessibility support
- Consistent styling with design system

## Usage Examples

### Frontend Form Integration

```tsx
import { PhoneInput } from '@/components/ui/phone-input';

// In a form component
<PhoneInput
  label="Mobile Number"
  value={formData.mobile}
  onChange={(value) => setFormData(prev => ({ ...prev, mobile: value }))}
  required
  placeholder="+852 1234 5678"
/>
```

### Backend API Integration

```javascript
// In route handlers
router.post('/register', validatePhoneNumberMiddleware, async (req, res) => {
  // Phone number is automatically validated and formatted
  const { mobile } = req.body; // Already in E.164 format
});

// In WhatsApp service
const formattedNumber = formatForWhatsApp(registration.attendee.phone);
await twilioClient.messages.create({
  to: `whatsapp:${formattedNumber}`,
  // ...
});
```

## Supported Formats

### Hong Kong Numbers
- `12345678` → `+85212345678`
- `91234567` → `+85291234567`
- `85212345678` → `+85212345678`
- `+85212345678` → `+85212345678` (no change)

### International Numbers
- `+1234567890` → `+1234567890`
- `+44123456789` → `+44123456789`

### Display Formatting
- `+85212345678` → `+852 1234 5678`
- `+85291234567` → `+852 9123 4567`

## Validation Rules

1. **Required Field**: Phone number cannot be empty
2. **E.164 Format**: Must start with + and country code
3. **Length Validation**: 10-15 digits total
4. **Hong Kong Specific**: 8-9 digits after +852
5. **International**: Valid country code + national number

## Error Messages

- "Phone number is required" - Empty field
- "Phone number must be in E.164 format (e.g., +85212345678)" - Invalid format
- "Invalid international phone number length" - Wrong length
- "Invalid phone number format" - Unrecognized format

## Testing

Comprehensive test suite in `frontend/src/lib/phone-utils.test.ts`:

```bash
npm run test phone-utils.test.ts
```

Tests cover:
- Hong Kong number formatting
- International number handling
- Invalid number rejection
- Display formatting
- Form validation
- WhatsApp API formatting

## Integration Points

### Updated Components
1. **Sign-up Form** (`frontend/src/pages/public/sign-up.tsx`)
2. **User Profile** (`frontend/src/pages/public/user-profile.tsx`)
3. **User Management** (`frontend/src/components/users/form-fields.tsx`)
4. **Event Registration** (dynamic forms)

### Updated Backend Routes
1. **Auth Routes** (`backend/src/routes/auth.js`) - Registration
2. **Events Routes** (`backend/src/routes/events.js`) - WhatsApp messaging
3. **Reminder Service** (`backend/src/services/reminderService.js`) - Event reminders

### Database Schema
- **User Model** (`backend/src/models/User.js`) - Mobile field validation
- **Event Registration** - Phone number storage

## Benefits

1. **Twilio Compliance**: All numbers properly formatted for WhatsApp API
2. **User Experience**: Real-time validation with clear feedback
3. **Data Consistency**: Uniform phone number format across the system
4. **Error Prevention**: Validation at multiple levels (frontend, API, database)
5. **International Support**: Ready for expansion to other countries

## Future Enhancements

1. **Country Detection**: Auto-detect country based on user location
2. **International Expansion**: Support for more country codes
3. **Phone Number Library**: Integration with libphonenumber-js for more robust validation
4. **SMS Fallback**: Support for SMS when WhatsApp is unavailable

## Migration Notes

For existing data:
1. Phone numbers in the database will be validated on next update
2. Invalid numbers will trigger validation errors
3. Consider a data migration script for existing invalid numbers

## Security Considerations

1. **Input Sanitization**: All phone numbers are cleaned of special characters
2. **Validation**: Multiple layers of validation prevent invalid data
3. **Error Handling**: Graceful handling of malformed numbers
4. **Logging**: Phone number errors are logged for debugging

## Troubleshooting

### Common Issues

1. **Validation Errors**: Check if number follows E.164 format
2. **WhatsApp Delivery**: Ensure number is properly formatted for Twilio
3. **Display Issues**: Verify number is being formatted correctly for display

### Debug Commands

```bash
# Test phone validation
npm run test phone-utils.test.ts

# Check backend validation
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"mobile": "12345678"}'
```

## Compliance Checklist

- [x] E.164 format validation
- [x] Hong Kong number support (+852)
- [x] International number support
- [x] Real-time frontend validation
- [x] Backend API validation
- [x] Database schema validation
- [x] WhatsApp API integration
- [x] User-friendly error messages
- [x] Comprehensive test coverage
- [x] Documentation 