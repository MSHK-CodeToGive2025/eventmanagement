# Staff Contact Feature Implementation

## Overview
This feature adds staff contact information to event notification messages. When users receive event reminders, they will see a line at the bottom of the message saying "Contact <staff_name> on <phone_number> for any issue."

## Changes Made

### Backend Changes

#### 1. Event Model (`backend/src/models/Event.js`)
- Added `staffContact` field to the Event schema:
  ```javascript
  staffContact: {
    name: {
      type: String,
      required: false,
      trim: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    }
  }
  ```

#### 2. Reminder Service (`backend/src/services/reminderService.js`)
- Updated `createReminderMessage` function to include staff contact information:
  ```javascript
  // Add staff contact information if available
  if (event.staffContact && event.staffContact.name && event.staffContact.phone) {
    message += `\n\nContact ${event.staffContact.name} on ${event.staffContact.phone} for any issue.`;
  }
  ```

### Frontend Changes

#### 1. Event Types (`frontend/src/types/event-types.ts`)
- Added `StaffContact` interface:
  ```typescript
  export interface StaffContact {
    name?: string;
    phone?: string;
  }
  ```
- Updated `ZubinEvent` interface to include `staffContact?: StaffContact`

#### 2. Event Service (`frontend/src/services/eventService.ts`)
- Added `staffContact` field to both `Event` and `EventFormData` interfaces

#### 3. Event Builder Form (`frontend/src/components/events-builder/new-event-builder.tsx`)
- Added `staffContact` to the form schema:
  ```typescript
  staffContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  ```
- Added staff contact form fields in the UI:
  - Staff Name input field
  - Staff Phone Number input field
  - Added descriptive text explaining the purpose
- Updated default values and form data handling to include staff contact information

#### 4. Tests
- Created `backend/test-staff-contact.js` to test the reminder message functionality
- Created `frontend/src/components/events-builder/__tests__/new-event-builder.test.tsx` to test the form fields

## How It Works

1. **Event Creation/Editing**: Users can now add staff contact information when creating or editing events through the event builder form.

2. **Notification Messages**: When reminder notifications are sent, the system checks if staff contact information is available for the event.

3. **Message Format**: If staff contact information exists, the notification message includes:
   ```
   Contact <staff_name> on <phone_number> for any issue.
   ```

4. **Optional Feature**: The staff contact information is optional - if not provided, the notification messages work as before without the contact line.

## Example Usage

### Creating an Event with Staff Contact
1. Navigate to the event builder
2. Fill in the basic event information
3. Scroll to the "Staff Contact Information" section
4. Enter the staff member's name (e.g., "John Doe")
5. Enter the staff member's phone number (e.g., "+852 1234 5678")
6. Save the event

### Notification Message Example
When participants receive a reminder, they will see:
```
🔔 Event Reminder: "Community Workshop"

⏰ The event will start in 24 hours
📅 Date: Monday, January 15, 2024
🕐 Time: 2:00 PM
📍 Location: Community Center, Central and Western
🔗 Meeting Link: https://meet.google.com/abc-defg-hij

We look forward to seeing you!

Contact John Doe on +852 1234 5678 for any issue.
```

## Testing

### Backend Test
Run the backend test script:
```bash
cd backend
node test-staff-contact.js
```

### Frontend Test
Run the frontend tests:
```bash
cd frontend
npm test new-event-builder.test.tsx
```

## Database Migration
The new `staffContact` field is optional, so existing events will continue to work without any migration needed. New events can optionally include staff contact information.

## Backward Compatibility
- Existing events without staff contact information will continue to work normally
- Notification messages for events without staff contact will not include the contact line
- The feature is completely optional and doesn't break existing functionality 