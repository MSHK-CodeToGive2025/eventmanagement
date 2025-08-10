# Private Events Access Control System

## Overview

This document describes the implementation of a comprehensive access control system for private events in the Zubin platform. The system ensures that private events are only visible to authorized users while maintaining security and user experience.

## Access Control Rules

### Who Can View Private Events

1. **Administrators (Admin Role)**
   - Can view ALL private events
   - Can manage all events and participants
   - Full access to the system

2. **Event Creators (Staff Role)**
   - Can view events they created (including private ones)
   - Can manage participants for their own events
   - Can assign and invite participants

3. **Assigned Participants**
   - Users specifically assigned by event creators
   - Can view and register for the private event
   - Access granted through explicit assignment

4. **Invited Participants**
   - Users invited by event creators
   - Can view the private event
   - Need to register to participate

5. **Public Users (Unauthenticated)**
   - **NO ACCESS** to private events
   - Can only see public events

## Database Schema Changes

### Event Model Updates

```javascript
// New fields added to Event schema
assignedParticipants: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],
invitedParticipants: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
```

## API Endpoints

### Protected Routes (Require Authentication)

#### 1. Get All Events (with Access Control)
```
GET /api/events
```
- **Access**: Authenticated users only
- **Logic**: 
  - Admins see all events
  - Others see public events + private events they have access to

#### 2. Get Single Event (with Access Control)
```
GET /api/events/:id
```
- **Access**: Authenticated users with proper permissions
- **Logic**: Checks if user can view the specific event

#### 3. Manage Assigned Participants
```
POST /api/events/:id/assigned-participants
DELETE /api/events/:id/assigned-participants
```
- **Access**: Admin, Staff, or Event Creator
- **Purpose**: Add/remove users who are specifically assigned to the event

#### 4. Manage Invited Participants
```
POST /api/events/:id/invited-participants
DELETE /api/events/:id/invited-participants
```
- **Access**: Admin, Staff, or Event Creator
- **Purpose**: Add/remove users who are invited to the event

#### 5. Get Available Users for Selection
```
GET /api/events/:id/available-users
```
- **Access**: Admin, Staff, or Event Creator
- **Purpose**: Get list of users available for participant assignment

### Public Routes (No Authentication Required)

#### 1. Get Public Events
```
GET /api/events/public
```
- **Access**: Anyone
- **Logic**: Only published, non-private events

#### 2. Get Public Non-Expired Events
```
GET /api/events/public-nonexpired
```
- **Access**: Anyone
- **Logic**: Only published, non-private, non-expired events

## Frontend Implementation

### Form Updates

The event creation/editing form now includes:

1. **Private Event Toggle**
   - Checkbox to mark events as private
   - When enabled, shows participant management section

2. **Participant Management Section**
   - **Assigned Participants**: Users who can view and register
   - **Invited Participants**: Users who can view but need to register
   - Dropdown selection from available users
   - Add/remove functionality

### Service Layer Updates

New methods added to `eventService`:

```typescript
// Participant management
addAssignedParticipants(eventId: string, participantIds: string[]): Promise<Event>
removeAssignedParticipants(eventId: string, participantIds: string[]): Promise<Event>
addInvitedParticipants(eventId: string, participantIds: string[]): Promise<Event>
removeInvitedParticipants(eventId: string, participantIds: string[]): Promise<Event>

// User selection
getAvailableUsers(eventId: string): Promise<User[]>
```

## Security Features

### 1. Authentication Required
- All private event operations require valid authentication
- JWT tokens validated on every request

### 2. Role-Based Access Control
- Different permissions based on user role
- Event creators can only manage their own events

### 3. Input Validation
- Participant IDs validated as valid ObjectIds
- Array validation for participant lists

### 4. Authorization Checks
- Multiple layers of permission verification
- Event ownership validation

## Usage Examples

### Creating a Private Event

1. **Set Event as Private**
   ```javascript
   {
     title: "Staff Meeting",
     isPrivate: true,
     // ... other fields
   }
   ```

2. **Assign Participants**
   ```javascript
   // Add assigned participants
   await eventService.addAssignedParticipants(eventId, ['userId1', 'userId2'])
   
   // Add invited participants
   await eventService.addInvitedParticipants(eventId, ['userId3', 'userId4'])
   ```

### Viewing Private Events

```javascript
// This will automatically filter based on user permissions
const events = await eventService.getAllEvents()

// For a specific event, access control is enforced
const event = await eventService.getEvent(eventId)
```

## Migration Notes

### Existing Events
- All existing events remain public by default
- `isPrivate` field defaults to `false`
- New fields (`assignedParticipants`, `invitedParticipants`) are empty arrays

### Database Migration
- No data migration required
- New fields are optional and have default values
- Existing queries continue to work

## Testing

### Backend Tests
- Test access control for different user roles
- Test participant management endpoints
- Test unauthorized access attempts

### Frontend Tests
- Test form validation
- Test participant selection UI
- Test access control in event lists

## Future Enhancements

### 1. Bulk Operations
- Bulk add/remove participants
- Import participants from CSV

### 2. Advanced Permissions
- Time-based access (temporary invitations)
- Group-based permissions
- Hierarchical access levels

### 3. Notification System
- Automatic notifications to assigned/invited participants
- Email confirmations
- Reminder system integration

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Check user authentication
   - Verify user role and permissions
   - Ensure event ownership

2. **Participant Not Visible**
   - Check if user is in assignedParticipants or invitedParticipants arrays
   - Verify user authentication status
   - Check event privacy setting

3. **Form Validation Errors**
   - Ensure participant IDs are valid ObjectIds
   - Check array format for participant lists
   - Verify required fields are filled

### Debug Information

Enable logging to see:
- User authentication details
- Access control decisions
- Participant management operations
- API request/response details
