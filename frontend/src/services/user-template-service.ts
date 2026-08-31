import * as XLSX from 'xlsx';

export interface ParsedUserRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  role?: string;
  clientErrors?: string[];
}

export interface SuccessfulUserRecord {
  id?: string;
  row?: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  username: string;
  tempPassword?: string;
  role?: string;
  isActive?: boolean;
  isNewUser?: boolean;
  status?: string;
}

export interface FailedRowRecord {
  row: number;
  data: {
    firstName?: string;
    lastName?: string;
    mobile?: string;
    phone?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  errors: string[];
}

export interface SkippedRecord {
  row: number;
  data: any;
  reason: string;
  username?: string;
  userId?: string;
}

export interface BulkUploadResponse {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
  successfulUsers?: SuccessfulUserRecord[];
  successfulRegistrations?: SuccessfulUserRecord[];
  skippedUsers?: SkippedRecord[];
  skippedRegistrations?: SkippedRecord[];
  errors?: FailedRowRecord[];
}

/**
 * Downloads a sample template spreadsheet for User Management bulk upload
 */
export function downloadUserSampleTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = ['First Name', 'Last Name', 'Mobile Number', 'Email', 'Role'];
  const sampleData = [
    {
      'First Name': 'Matthew',
      'Last Name': 'Wong',
      'Mobile Number': '+85225409588',
      'Email': 'matthew.wong@example.com',
      'Role': 'participant'
    },
    {
      'First Name': 'Sarah',
      'Last Name': 'Nil',
      'Mobile Number': '25409588',
      'Email': '',
      'Role': 'participant'
    },
    {
      'First Name': 'David',
      'Last Name': 'Chan',
      'Mobile Number': '98765432',
      'Email': 'david.chan@example.com',
      'Role': 'staff'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  
  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 18 }, // Mobile Number
    { wch: 28 }, // Email
    { wch: 16 }  // Role
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users_Template');

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'user_bulk_upload_template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, 'user_bulk_upload_template.xlsx', { bookType: 'xlsx' });
  }
}

/**
 * Downloads a sample template spreadsheet for Event Registrations bulk upload
 */
export function downloadEventRegistrationSampleTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = ['First Name', 'Last Name', 'Mobile Number', 'Email'];
  const sampleData = [
    {
      'First Name': 'Matthew',
      'Last Name': 'Wong',
      'Mobile Number': '+85225409588',
      'Email': 'matthew.wong@example.com'
    },
    {
      'First Name': 'Sarah',
      'Last Name': 'Nil',
      'Mobile Number': '25409588',
      'Email': ''
    },
    {
      'First Name': 'John',
      'Last Name': 'Deo',
      'Mobile Number': '98765432',
      'Email': 'john.deo@example.com'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  worksheet['!cols'] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 18 }, // Mobile Number
    { wch: 28 }  // Email
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Event_Attendees_Template');

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'event_registration_template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, 'event_registration_template.xlsx', { bookType: 'xlsx' });
  }
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or .csv file
 */
export async function parseSpreadsheetFile(
  file: File,
  contextType: 'users' | 'events' = 'users'
): Promise<ParsedUserRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('The uploaded file contains no data rows.');
  }

  const parsedRows: ParsedUserRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 accounting for 1-based index and header row

    // Flexible column key matching
    let firstName = '';
    let lastName = '';
    let mobile = '';
    let email = '';
    let role = '';

    for (const key of Object.keys(row)) {
      const lowerKey = key.trim().toLowerCase().replace(/[\s_\-]/g, '');
      const value = String(row[key] ?? '').trim();

      if (lowerKey === 'firstname' || lowerKey === 'first') {
        firstName = value;
      } else if (lowerKey === 'lastname' || lowerKey === 'last' || lowerKey === 'surname') {
        lastName = value;
      } else if (lowerKey === 'mobilenumber' || lowerKey === 'mobile' || lowerKey === 'phone' || lowerKey === 'phonenumber' || lowerKey === 'contactnumber') {
        mobile = value;
      } else if (lowerKey === 'email' || lowerKey === 'emailaddress') {
        email = value;
      } else if (lowerKey === 'role' || lowerKey === 'userrole') {
        role = value;
      }
    }

    // Default lastName to "Nil" if empty or equal to "nil"
    if (!lastName || lastName.toLowerCase() === 'nil') {
      lastName = 'Nil';
    }

    // Role handling: Event attendees are always participants
    let cleanRole = 'participant';
    if (contextType === 'events') {
      cleanRole = 'participant';
    } else if (role && role.trim()) {
      const lower = role.trim().toLowerCase();
      if (['participant', 'staff'].includes(lower)) {
        cleanRole = lower;
      } else {
        cleanRole = lower;
      }
    }

    // Basic client-side checks for preview badges
    const clientErrors: string[] = [];
    if (!firstName) {
      clientErrors.push('First Name is required');
    } else if (/\d/.test(firstName)) {
      clientErrors.push('First Name must contain only characters, no numbers');
    }

    if (lastName !== 'Nil' && /\d/.test(lastName)) {
      clientErrors.push('Last Name must contain only characters, no numbers');
    }

    if (!mobile) {
      clientErrors.push('Mobile number is required');
    } else {
      let cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
      if (cleanMobile.startsWith('+852')) cleanMobile = cleanMobile.substring(4);
      else if (cleanMobile.startsWith('852') && cleanMobile.length === 11) cleanMobile = cleanMobile.substring(3);
      if (!/^\d{8}$/.test(cleanMobile)) {
        clientErrors.push('Mobile must be 8 digits (e.g. 25409588)');
      }
    }

    // Email format validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        clientErrors.push('Invalid email format (e.g. user@example.com)');
      }
    }

    // Role validation (for User Management uploads only)
    if (contextType === 'users' && role && role.trim()) {
      const lower = role.trim().toLowerCase();
      if (!['participant', 'staff'].includes(lower)) {
        clientErrors.push("Invalid role: must be 'participant' or 'staff'");
      }
    }

    parsedRows.push({
      rowNumber,
      firstName,
      lastName,
      mobile,
      email: email || undefined,
      role: cleanRole,
      clientErrors: clientErrors.length > 0 ? clientErrors : undefined
    });
  });

  // Second pass: Detect duplicate staff emails within the uploaded spreadsheet file
  const staffEmailCounts = new Map<string, number>();
  parsedRows.forEach((row) => {
    if (row.role === 'staff' && row.email) {
      const lowerEmail = row.email.toLowerCase();
      staffEmailCounts.set(lowerEmail, (staffEmailCounts.get(lowerEmail) || 0) + 1);
    }
  });

  parsedRows.forEach((row) => {
    if (row.role === 'staff' && row.email) {
      const lowerEmail = row.email.toLowerCase();
      if ((staffEmailCounts.get(lowerEmail) || 0) > 1) {
        row.clientErrors = row.clientErrors || [];
        if (!row.clientErrors.includes('Duplicate email for staff role in file')) {
          row.clientErrors.push('Duplicate email for staff role in file');
        }
      }
    }
  });

  return parsedRows;
}

/**
 * Exports successfully created accounts with generated credentials
 */
export function exportImportedCredentials(
  users: SuccessfulUserRecord[],
  format: 'xlsx' | 'csv' = 'xlsx',
  filename = 'imported_user_credentials'
) {
  if (!users || users.length === 0) return;

  const exportData = users.map((u, i) => ({
    'Row #': u.row || i + 1,
    'First Name': u.firstName,
    'Last Name': u.lastName,
    'Mobile Number': u.mobile,
    'Email': u.email || '',
    'Generated Username': u.username,
    'Initial Password': u.tempPassword || 'N/A (Existing User)',
    'Role': u.role || 'participant',
    'Account Type': u.isNewUser !== false ? 'New Account' : 'Existing User',
    'Status': 'Active'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 8 },  // Row #
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 18 }, // Mobile
    { wch: 28 }, // Email
    { wch: 22 }, // Username
    { wch: 22 }, // Password
    { wch: 14 }, // Role
    { wch: 16 }, // Account Type
    { wch: 10 }  // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Imported_Credentials');

  if (format === 'csv') {
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
  }
}

/**
 * Exports failed rows with detailed error reasons for quick correction and re-upload
 */
export function exportFailedRowsReport(
  errors: FailedRowRecord[],
  format: 'xlsx' | 'csv' = 'xlsx',
  filename = 'failed_entries_report'
) {
  if (!errors || errors.length === 0) return;

  const exportData = errors.map((e) => ({
    'Row Number': e.row,
    'First Name': e.data?.firstName ?? '',
    'Last Name': e.data?.lastName ?? '',
    'Mobile Number': e.data?.mobile ?? e.data?.phone ?? '',
    'Email': e.data?.email ?? '',
    'Role': e.data?.role ?? '',
    'Error Reason(s)': Array.isArray(e.errors) ? e.errors.join('; ') : String(e.errors)
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 12 }, // Row Number
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 18 }, // Mobile
    { wch: 28 }, // Email
    { wch: 14 }, // Role
    { wch: 50 }  // Error Reason(s)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed_Entries');

  if (format === 'csv') {
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
  }
}
