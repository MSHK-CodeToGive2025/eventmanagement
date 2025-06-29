# Data Schemas - Frontend Backend Alignment

This document outlines the data schemas used in both frontend and backend, ensuring they are properly aligned.

## User Schema

### Frontend Interface (TypeScript)
```typescript
interface User {
  _id: string;
  username: string;
  password: string;
  mobile: string;
  email?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}
```

### Backend Schema (MongoDB/Mongoose)
```javascript
{
  username: String (required, unique)
  password: String (required, hashed)
  mobile: String (required) // Changed from phoneNumber to match frontend
  email: String (optional)
  role: String (enum: ['admin', 'staff', 'participant'])
  firstName: String (required)
  lastName: String (required)
  createdAt: Date (default: now)
  updatedAt: Date (default: now)
  lastLogin: Date (optional)
  isActive: Boolean (default: true)
}
```

## Event Schema

### Frontend Interface (TypeScript)
```typescript
interface ZubinEvent {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetGroup: string;
  location: Location;
  startDate: Date;
  endDate: Date;
  coverImageUrl?: string;
  isPrivate: boolean;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  registrationFormId: string;
  sessions: Session[];
  capacity?: number;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  tags?: string[];
  registeredCount?: number;
}
```

### Backend Schema (MongoDB/Mongoose)
```javascript
{
  title: String (required)
  description: String (required)
  category: String (required, enum: [...])
  targetGroup: String (required, enum: [...])
  location: {
    venue: String (required)
    address: String (required)
    district: String (required, enum: [...])
    onlineEvent: Boolean (required)
    meetingLink: String (conditional)
  }
  startDate: Date (required)
  endDate: Date (required)
  coverImageUrl: String (optional)
  isPrivate: Boolean (default: false)
  status: String (enum: ['Draft', 'Published', 'Cancelled', 'Completed'])
  registrationFormId: ObjectId (ref: 'RegistrationForm')
  sessions: [{
    _id: ObjectId (auto-generated) // Added to match frontend
    title: String (required)
    description: String (optional)
    date: Date (required)
    startTime: String (required)
    endTime: String (required)
    location: {
      venue: String (optional)
      meetingLink: String (optional)
    }
    capacity: Number (optional)
  }]
  capacity: Number (optional)
  createdBy: ObjectId (ref: 'User')
  createdAt: Date (default: now)
  updatedBy: ObjectId (ref: 'User') (optional)
  updatedAt: Date (optional)
  tags: [String] (optional)
  registeredCount: Number (default: 0)
}
```

## Event Registration Schema

### Frontend Interface (TypeScript)
```typescript
interface EventRegistration {
  _id: string;
  eventId: string;
  userId?: string;
  attendee: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  sessions: string[]; // Session IDs as strings
  formResponses: {
    sectionId: string;
    fieldId: string;
    response: any;
  }[];
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'waitlisted';
  registeredAt: Date;
  cancelledAt?: Date;
  notes?: string;
}
```

### Backend Schema (MongoDB/Mongoose)
```javascript
{
  eventId: ObjectId (ref: 'Event')
  userId: ObjectId (ref: 'User') (optional)
  attendee: {
    firstName: String (required)
    lastName: String (required)
    phone: String (required)
    email: String (optional)
  }
  sessions: [String] // Session IDs as strings (updated to match frontend)
  formResponses: [{
    sectionId: String (required)
    fieldId: String (required)
    response: Mixed (required)
  }]
  status: String (enum: ['pending', 'confirmed', 'attended', 'cancelled', 'waitlisted'])
  registeredAt: Date (default: now)
  cancelledAt: Date (optional)
  notes: String (optional)
}
```

## Registration Form Schema

### Frontend Interface (TypeScript)
```typescript
interface RegistrationForm {
  _id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}
```

### Backend Schema (MongoDB/Mongoose)
```javascript
{
  title: String (required)
  description: String (optional)
  sections: [{
    title: String (required)
    description: String (optional)
    fields: [{
      label: String (required)
      type: String (enum: ['text', 'email', 'phone', 'date', 'dropdown', 'checkbox', 'radio', 'number', 'textarea', 'file'])
      required: Boolean (default: false)
      placeholder: String (optional)
      helpText: String (optional)
      defaultValue: Mixed (optional)
      options: [String] (optional)
      validation: {
        pattern: String (optional)
        minLength: Number (optional)
        maxLength: Number (optional)
        minValue: Number (optional)
        maxValue: Number (optional)
        message: String (optional)
      }
      order: Number (required)
    }]
    order: Number (required)
  }]
  isActive: Boolean (default: true)
  createdBy: ObjectId (ref: 'User')
  createdAt: Date (default: now)
  updatedBy: ObjectId (ref: 'User') (optional)
  updatedAt: Date (auto-updated)
}
```

## Key Changes Made for Alignment

1. **User Schema**: Changed `phoneNumber` to `mobile` to match frontend interface
2. **Event Schema**: Added `_id` field to sessions subdocument for proper referencing
3. **EventRegistration Schema**: Changed sessions field from ObjectId references to String array to match frontend interface
4. **All schemas**: Ensured field names, types, and structures match between frontend and backend

## Validation Notes

- All required fields are properly marked in both frontend and backend
- Enum values are consistent across both layers
- Date fields use proper Date types
- ObjectId references are used for relationships
- Optional fields are properly marked with `?` in TypeScript and appropriate defaults in Mongoose

