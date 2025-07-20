# Event Cover Image Upload API

This document describes the image upload functionality for events.

## Overview

The backend supports storing small cover images (up to 500KB) directly in MongoDB for events. The implementation provides **two approaches** for maximum flexibility:

1. **Integrated Approach** (Recommended): Upload images directly with event creation/update
2. **Separate Endpoints**: Dedicated endpoints for image management

## Event Model Field

The `Event` model includes a `coverImage` field for storing image data:

```javascript
coverImage: {
  data: {
    type: Buffer,
    required: false
  },
  contentType: {
    type: String,
    required: false
  },
  size: {
    type: Number,
    required: false,
    max: 500 * 1024 // 500KB limit
  }
}
```

## API Endpoints

### 1. Integrated Image Upload (Recommended)

#### Create Event with Image
**POST** `/api/events`

Create a new event with an optional cover image in a single request.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Body:**
- All event fields (title, description, etc.)
- `image`: Image file (max 500KB, optional)

**Response:**
```json
{
  "_id": "event_id",
  "title": "Event Title",
  "coverImage": {
    "data": "buffer_data",
    "contentType": "image/png",
    "size": 12345
  }
}
```

#### Update Event with Image
**PUT** `/api/events/:id`

Update an existing event with an optional new cover image.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Body:**
- Event fields to update
- `image`: New image file (max 500KB, optional)

### 2. Separate Image Management Endpoints

#### Upload Cover Image
**POST** `/api/events/:id/cover-image`

Upload a new cover image for an existing event.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Body:**
- `coverImage`: Image file (max 500KB)

**Response:**
```json
{
  "message": "Cover image uploaded successfully",
  "imageSize": 12345,
  "contentType": "image/png"
}
```

#### Get Cover Image
**GET** `/api/events/:id/cover-image`

Retrieve the cover image for an event.

**Response:**
- Image file with appropriate `Content-Type` header
- 404 if no image exists

#### Update Cover Image
**PUT** `/api/events/:id/cover-image`

Replace the existing cover image with a new one.

#### Delete Cover Image
**DELETE** `/api/events/:id/cover-image`

Remove the cover image from an event.

## Frontend Integration

### Recommended Approach (Single API Call)

```javascript
// Create event with image
const formData = new FormData();
formData.append('title', 'Event Title');
formData.append('description', 'Event Description');
formData.append('category', 'Education & Training');
formData.append('targetGroup', 'All Hong Kong Residents');
formData.append('location[venue]', 'Venue Name');
formData.append('location[address]', 'Venue Address');
formData.append('location[district]', 'Central and Western');
formData.append('location[onlineEvent]', 'false');
formData.append('startDate', startDate.toISOString());
formData.append('endDate', endDate.toISOString());
formData.append('isPrivate', 'false');
formData.append('status', 'Draft');
formData.append('registrationFormId', formId);
formData.append('capacity', '20');

// Add image if selected
if (imageFile) {
  formData.append('image', imageFile);
}

const response = await eventService.createEvent(formData);
```

### Image Display

```javascript
// Get the image URL using the helper method
const imageUrl = eventService.getEventImageUrl(eventId, event);

// Use in component
<img src={imageUrl || "/placeholder.svg"} alt="Event Cover" />
```

### Frontend Event Interface

```typescript
export interface Event {
  _id: string;
  title: string;
  description: string;
  // ... other fields
  coverImage?: {
    data: string; // base64 string representation
    contentType: string;
    size: number;
  };
  // ... other fields
}
```

### cURL Examples

```bash
# Create event with image (recommended)
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "title=Event Title" \
  -F "description=Event Description" \
  -F "category=Education & Training" \
  -F "targetGroup=All Hong Kong Residents" \
  -F "location[venue]=Venue Name" \
  -F "location[address]=Venue Address" \
  -F "location[district]=Central and Western" \
  -F "location[onlineEvent]=false" \
  -F "startDate=2024-01-01T10:00:00.000Z" \
  -F "endDate=2024-01-01T12:00:00.000Z" \
  -F "isPrivate=false" \
  -F "status=Draft" \
  -F "registrationFormId=<form_id>" \
  -F "capacity=20" \
  -F "image=@image.jpg" \
  http://localhost:3001/api/events

# Update event with new image
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -F "title=Updated Event Title" \
  -F "image=@new-image.jpg" \
  http://localhost:3001/api/events/<eventId>

# Get event image
curl -X GET \
  http://localhost:3001/api/events/<eventId>/cover-image \
  --output image.jpg
```

## Benefits of Integrated Approach

1. **Single API Call**: Create/update event and image in one request
2. **Better UX**: No need for multiple requests or complex state management
3. **Atomic Operations**: Event and image are created/updated together
4. **Simpler Frontend**: Less complex form handling
5. **Clean Architecture**: Single source of truth for image data

## Error Responses

### 400 Bad Request
- No image file provided (when expected)
- Image size exceeds 500KB limit
- Invalid image format
- Missing required event fields

### 403 Forbidden
- User not authorized to perform the operation

### 404 Not Found
- Event not found
- Cover image not found (for separate endpoints)

### 500 Internal Server Error
- Server error during operation

## Migration Notes

- The old `coverImageUrl` field has been completely removed
- All frontend components have been updated to use the new `coverImage` field
- The `getEventImageUrl()` helper method provides a clean interface for image display
- Backward compatibility is maintained through the helper method

## Testing

Comprehensive tests have been added covering:
- Integrated image upload with event creation/update
- Separate image management endpoints
- Authorization checks
- Error handling
- File size validation

Run tests with:
```bash
npm test -- --testPathPattern=events.test.js
``` 