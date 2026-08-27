# Bulk Upload Feature Documentation

A comprehensive technical and non-technical reference guide for the **Bulk Upload** feature in the Event Management System, covering both **User Management** (`/manage/users`) and **Event Registrations** (`/manage/events/:id/registrations`).

---

## Table of Contents

1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Role-Based Permissions Matrix](#2-role-based-permissions-matrix)
3. [User Management Bulk Upload](#3-user-management-bulk-upload)
4. [Event Registrations Bulk Upload (Dual Resolution)](#4-event-registrations-bulk-upload-dual-resolution)
5. [Data Rules, Formulas & Normalization](#5-data-rules-formulas--normalization)
6. [Actionable Error Feedback & Correction Workflow](#6-actionable-error-feedback--correction-workflow)
7. [Post-Upload Reports & Credential Distribution](#7-post-upload-reports--credential-distribution)
8. [Technical Architecture & System Design](#8-technical-architecture--system-design)
9. [API Specifications & JSON Schemas](#9-api-specifications--json-schemas)
10. [Database Indexes & Regression Safeguards](#10-database-indexes--regression-safeguards)
11. [Testing & Verification Guide](#11-testing--verification-guide)

---

## 1. Executive Summary & Purpose

The **Bulk Upload** system enables administrators and staff members to onboard multiple users and attendees efficiently using standard spreadsheet files (`.xlsx`, `.xls`, `.csv`). 

### Core Capabilities:
- **Instant Account Creation**: Bulk creates accounts with auto-generated credentials and standardized formats.
- **Smart Dual Resolution**: In event registration, a single mixed spreadsheet seamlessly registers existing users while creating and registering brand-new users.
- **Automatic Data Sanitization**: Standardizes names to Title Case, emails and usernames to lowercase, and prefixes Hong Kong mobile numbers with `+852`.
- **Duplicate Protection**: Avoids duplicate accounts by performing a case-insensitive match on `(First Name + Last Name + Mobile)`.
- **Fault-Tolerant Batching**: Valid rows are processed even if other rows have errors.
- **Comprehensive Reports**: Exports credentials for new users and generates annotated Excel error reports for quick row-level fixes.

---

## 2. Role-Based Permissions Matrix

Access and capabilities are strictly governed by user roles:

| Feature / Action | Admin | Staff (All Staff) | Participant |
| :--- | :---: | :---: | :---: |
| **User Management: Create Staff via Bulk Upload** | ✅ **YES** | ❌ **NO** | ❌ **NO** |
| **User Management: Create Participants via Bulk Upload** | ✅ **YES** | ✅ **YES** | ❌ **NO** |
| **User Management: Create Admin via Bulk Upload** | ❌ **NO** *(Never allowed)* | ❌ **NO** *(Never allowed)* | ❌ **NO** |
| **Event Registrations: Bulk Register Attendees** | ✅ **YES** | ✅ **YES** | ❌ **NO** |
| **Event Registrations: Mixed List Dual Resolution** | ✅ **YES** | ✅ **YES** | ❌ **NO** |

> [!IMPORTANT]
> - **Admin Protection**: No user role (including Admin) can create `admin` accounts via bulk upload.
> - **Staff Boundary**: Staff members uploading via User Management can **only** create `participant` accounts. If a staff member includes rows with role `staff` or `admin`, those specific rows will fail with clear permission error messages while valid participant rows succeed.

---

## 3. User Management Bulk Upload

- **Location**: `/manage/users` $\rightarrow$ **Bulk Upload** button in the toolbar.
- **Target Audience**: Organization Admins and Staff.
- **Purpose**: Rapidly create new participant or staff accounts in bulk with pre-generated initial passwords.

### Step-by-Step User Flow:
1. Navigate to **User Management** in the administration portal.
2. Click the **Bulk Upload** button next to *Add New User*.
3. Review the in-modal instruction card.
4. Click **Download Template (.xlsx / .csv)** for pre-formatted columns.
5. Drag and drop or browse to select your completed spreadsheet.
6. Preview the parsed rows and inspect any formatting badges.
7. Click **Upload Users**.
8. Inspect the **Results Popup**:
   - Download **Imported User Credentials (.xlsx / .csv)** to distribute usernames and initial passwords.
   - If any rows failed, download **Failed Rows Report (.xlsx)** to view the exact error reasons.

---

## 4. Event Registrations Bulk Upload (Dual Resolution)

- **Location**: `/manage/events-builder` $\rightarrow$ Select Event $\rightarrow$ **Manage Registrations** $\rightarrow$ **Bulk Upload**.
- **Purpose**: Register a list of attendees for a specific event from a spreadsheet that may contain **both existing system users and brand-new attendees**.

### Dual Resolution Workflow:
```mermaid
flowchart TD
    A[Spreadsheet Row: Name, Mobile, Email] --> B{Valid Format?}
    B -- No --> C[Record in Failed Rows with specific error]
    B -- Yes --> D{Case-Insensitive Match in DB?\nfirstName + lastName + mobile}
    
    D -- "No (New User)" --> E[Path A: Create User in DB\nUsername: [firstname][phone8]\nPassword: [firstname][phone8]\nRole: participant\nActive: true]
    E --> F[Create EventRegistration for Event Sessions]
    F --> G[Record in Successful Imports with Temp Password]
    
    D -- "Yes (Existing User)" --> H{Already Registered\nfor this Specific Event?}
    H -- "Yes" --> I[Record in Skipped: 'Already registered for this event']
    H -- "No" --> J[Path B: Create EventRegistration for Existing User]
    J --> K[Record in Successful Registrations]
```

- **Path A (New User)**: The attendee does not exist in the database. The system automatically registers a new `User` account (`isActive = true`, `role = participant`, auto-credentials) and creates their `EventRegistration`.
- **Path B (Existing User)**: The attendee already has an account. The system identifies their existing user ID and creates the `EventRegistration` without creating duplicate user accounts.
- **Duplicate Registration**: If the user is already actively registered for that event, they are safely reported under *Skipped* with `"Already registered for this event"`.

---

## 5. Data Rules, Formulas & Normalization

### Summary of Field Constraints:

| Field | Requirement | Accepted Formats / Rules | Database Transformation |
| :--- | :--- | :--- | :--- |
| **First Name** | Mandatory | Letters, spaces, hyphens, apostrophes only. **No digits allowed.** | Standardized to **Title Case** (e.g. `john` $\rightarrow$ `John`, `mAtThEw` $\rightarrow$ `Matthew`) |
| **Last Name** | Mandatory | Letters only (no digits). If person has no last name, enter **`"Nil"`** (or leave blank). | Standardized to **Title Case** (e.g. `wong` $\rightarrow$ `Wong`, `nil` $\rightarrow$ `Nil`) |
| **Mobile Number** | Mandatory | 8-digit Hong Kong number (e.g. `25409588`, `+85225409588`, `85225409588`). | Normalized to E.164 with **`+852`** prefix (e.g. `+85225409588`) |
| **Email** | Optional | Valid RFC email address format. | Converted to **lowercase** (e.g. `john.deo@example.com`). Empty string converted to `undefined`. |
| **Role** | Optional | Case-insensitive: `participant`, `staff`. Defaults to `participant`. | Stored in lowercase (`participant` or `staff`). |
| **Active Status** | Automatic | Defaults to `true` (Active = Yes). | `isActive: true` |

### Column Sequence & Header Flexibility:
- **Column Order Does Not Matter**: Columns can appear in any order in your spreadsheet (e.g. `[Mobile Number] [Email] [First Name] [Last Name]`). The parser reads data by header key rather than column index.
- **Header Casing & Formatting**: Headers are case-insensitive and allow spaces, underscores, or hyphens (e.g. `First Name`, `firstname`, `FIRST_NAME` are all supported).
- **Extra Columns**: Any unneeded columns (e.g. `Address`, `Remarks`) present in the uploaded sheet are safely ignored without triggering errors.

### Auto-Generated Credentials Formula:
- **Username**: `[lowercase FirstName][8-digit Mobile]` (e.g. `john25409588`, `sarah25409588`).
- **Initial Password**: `[lowercase FirstName][8-digit Mobile]` (e.g. `john25409588`, `sarah25409588`).
  - *Shared Mobile Number Support*: Because family members or dependents may share a single mobile number (e.g. parent and child sharing `+85225409588`), prefixing the lowercase first name guarantees that each family member receives a unique username and personal initial password.

### Duplicate Matching Rule:
A record is treated as an existing user if all three fields match case-insensitively:
$$\text{First Name (case-insensitive)} \quad \text{AND} \quad \text{Last Name (case-insensitive)} \quad \text{AND} \quad \text{Mobile Number (+852...)}$$

---

## 6. Actionable Error Feedback & Correction Workflow

When a spreadsheet row fails validation, the system outputs clear, human-readable error messages explaining the exact reason:

| Failure Scenario | Error Message Displayed | Action Required by User |
| :--- | :--- | :--- |
| **Empty First Name** | `"First Name is required"` | Enter the person's first name. |
| **Numbers in First Name** | `"First Name must contain only characters, no numbers"` | Remove any digits from the name (e.g. change `John123` to `John`). |
| **Numbers in Last Name** | `"Last Name must contain only characters, no numbers (use 'Nil' if no last name)"` | Remove numbers or enter `"Nil"` if no surname exists. |
| **Empty Mobile** | `"Mobile number is required"` | Provide an 8-digit Hong Kong mobile number. |
| **Invalid Mobile Number** | `"Mobile number must be a valid 8-digit Hong Kong number (e.g. 25409588 or +85225409588)"` | Ensure phone has exactly 8 numeric digits. |
| **Misspelled Role** | `"Invalid role: '<input>'. Allowed values are 'participant' or 'staff'"` | Correct spelling of role or leave blank for default `participant`. |
| **Staff Creating Staff** | `"Staff users are only permitted to create Participant accounts"` | Change role to `participant` or have an Admin perform the upload. |
| **Admin Role Attempt** | `"Admin accounts cannot be created via bulk upload"` | Admin accounts must be created individually via system admin controls. |
| **Invalid Email Format** | `"Invalid email format (e.g. user@example.com)"` | Correct email syntax or leave blank. |
| **Duplicate Email Conflict** | `"Email is already in use by another user in the system"` | Use a unique email or omit if not known. |

---

## 7. Post-Upload Reports & Credential Distribution

After every upload, the system displays the **Post-Upload Results Dialog**:

1. **Summary Metrics**: Real-time counter of *Total Processed*, *Successfully Imported*, *Skipped (Already Exists)*, and *Failed*.
2. **Tabbed Inspection**:
   - **Failed Entries Tab**: Lists original row number, submitted inputs, and highlighted red error badges.
   - **Successful Records Tab**: Displays names, auto-generated usernames, plaintext initial passwords, and roles.
   - **Skipped Records Tab**: Displays existing accounts that were safely skipped.
3. **Export Downloads**:
   - **Download Credentials (`imported_credentials.xlsx` / `.csv`)**: Includes `Username`, `Password`, `First Name`, `Last Name`, `Mobile`, `Role`, and `Status` for secure distribution to participants.
   - **Download Failed Rows (`failed_entries_report.xlsx`)**: Exports the exact failed rows alongside an appended `Error Reason(s)` column. Users can fix the values directly in Excel and re-upload.

---

## 8. Technical Architecture & System Design

```
ob-eventmanagement/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── users.js                     # POST /api/users/bulk
│   │   │   ├── eventRegistrations.js        # POST /api/event-registrations/event/:eventId/bulk-upload
│   │   ├── utils/
│   │   │   ├── bulkUploadUtils.js           # Validation, Title Case, Mobile normalizer, credential generator
│   │   └── routes/__tests__/
│   │       ├── users.test.js                # Integration tests for user bulk upload
│   │       └── eventRegistrations.test.js   # Integration tests for event attendee bulk upload
└── frontend/
    └── src/
        ├── services/
        │   ├── user-template-service.ts     # Template builder, parser, credential & error exporters
        │   ├── user-service.ts              # bulkUploadUsers API client
        │   └── registrationService.ts       # bulkUploadRegistrations API client
        ├── components/
        │   ├── users/
        │   │   ├── bulk-upload-dialog.tsx   # User Management bulk upload modal
        │   │   ├── bulk-upload-result-dialog.tsx # Post-upload results & export modal
        │   │   └── user-list.tsx            # Toolbar Bulk Upload trigger button
        │   └── events-builder/
        │       ├── bulk-registration-dialog.tsx # Event attendee bulk upload modal
        │       └── manage-registrations.tsx     # Event Manage Registrations toolbar integration
```

---

## 9. API Specifications & JSON Schemas

### 1. `POST /api/users/bulk`
- **Auth**: Required (`Bearer <JWT>` - Admin or Staff)
- **Request Body**:
```json
{
  "users": [
    {
      "rowNumber": 2,
      "firstName": "matthew",
      "lastName": "wong",
      "mobile": "25409588",
      "email": "MATTHEW.WONG@EXAMPLE.COM",
      "role": "participant"
    },
    {
      "rowNumber": 3,
      "firstName": "sarah",
      "lastName": "nil",
      "mobile": "+85225409588"
    }
  ]
}
```
- **Response (`200 OK`)**:
```json
{
  "total": 2,
  "successful": 2,
  "skipped": 0,
  "failed": 0,
  "successfulUsers": [
    {
      "id": "67be1...",
      "row": 2,
      "firstName": "Matthew",
      "lastName": "Wong",
      "mobile": "+85225409588",
      "email": "matthew.wong@example.com",
      "username": "matthew25409588",
      "tempPassword": "matthew25409588",
      "role": "participant",
      "isActive": true
    }
  ],
  "skippedUsers": [],
  "errors": []
}
```

---

### 2. `POST /api/event-registrations/event/:eventId/bulk-upload`
- **Auth**: Required (`Bearer <JWT>` - Admin or Staff)
- **Request Body**:
```json
{
  "participants": [
    {
      "rowNumber": 2,
      "firstName": "John",
      "lastName": "Deo",
      "mobile": "25409588"
    }
  ]
}
```
- **Response (`200 OK`)**:
```json
{
  "total": 1,
  "successful": 1,
  "skipped": 0,
  "failed": 0,
  "successfulRegistrations": [
    {
      "id": "67be2...",
      "userId": "67be1...",
      "row": 2,
      "firstName": "John",
      "lastName": "Deo",
      "mobile": "+85225409588",
      "email": "",
      "username": "john25409588",
      "tempPassword": "john25409588",
      "isNewUser": true,
      "role": "participant",
      "status": "registered"
    }
  ],
  "skippedRegistrations": [],
  "errors": []
}
```

---

## 10. Database Indexes & Regression Safeguards

1. **MongoDB Sparse Unique Index on `email`**:
   - `User` collection has `{ email: 1 }, { unique: true, sparse: true }`.
   - **Protection**: If an email is omitted or empty string `""`, it is converted to `undefined` before saving. This prevents duplicate key errors (`E11000`) caused by empty string collisions.
2. **Username Collision Handling**:
   - If two distinct users have the same first name and same mobile (e.g. `John Doe` and `John Wong` sharing `25409588`), `generateCredentials` checks the database and automatically appends a suffix (`john25409588`, `john25409588_1`) to preserve uniqueness.
3. **Event Registered Count (`registeredCount`)**:
   - Bulk event registrations automatically calculate the count of new active registrations and execute an atomic increment: `Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: newCount } })`.
4. **Session Assignment**:
   - Event registrations automatically associate the attendee with the active sessions of the event (`event.sessions`).
5. **Password Encryption**:
   - Passwords are encrypted with bcrypt via the Mongoose `pre('save')` hook. Plaintext passwords are held in-memory only during the immediate HTTP request cycle for report generation.

---

## 11. Testing & Verification Guide

### Automated Tests Execution:
```bash
# Run backend integration tests for bulk upload:
cd backend
node --experimental-vm-modules node_modules/jest/bin/jest.js src/routes/__tests__/users.test.js
node --experimental-vm-modules node_modules/jest/bin/jest.js src/routes/__tests__/eventRegistrations.test.js

# Run frontend typecheck:
cd frontend
npx tsc --noEmit
```

### Manual QA Verification Checklist:
- [x] **User Management**:
  - [x] Admin can upload sheet with participants and staff.
  - [x] Staff can upload participants but fails on staff/admin rows.
  - [x] Admin row upload fails with `"Admin accounts cannot be created via bulk upload"`.
  - [x] Names with numbers fail validation (`"First Name must contain only characters, no numbers"`).
  - [x] Missing last names / `"Nil"` properly store as `"Nil"`.
  - [x] Auto-generated credentials match formula: `[lowercase firstName][8-digit mobile]`.
  - [x] Case-insensitive duplicates are skipped under `skippedUsers`.
  - [x] Credentials export (.xlsx / .csv) and Failed rows export (.xlsx) download correctly.
- [x] **Event Manage Registrations**:
  - [x] Mixed sheet creates new users (with credentials) and registers existing users.
  - [x] Already-registered users are reported under `skippedRegistrations`.
  - [x] Event `registeredCount` increments accurately.
