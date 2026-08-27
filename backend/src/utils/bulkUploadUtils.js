/**
 * Bulk Upload Utilities for User Management & Event Registrations
 */

/**
 * Transforms string to Title Case (for firstName and lastName)
 * e.g. "john" -> "John", "mAtThEw" -> "Matthew", "O'CONNOR" -> "O'Connor"
 * @param {string} str 
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .split(/(\s+|-|')/)
    .map(part => {
      if (!part || /^\s+$/.test(part) || part === '-' || part === "'") return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Validates First Name
 * - Must not be empty
 * - Must contain only alphabetic characters, hyphens, apostrophes, spaces (no digits)
 * - Returns Title Case value
 */
export function validateFirstName(firstName) {
  if (!firstName || !String(firstName).trim()) {
    return { valid: false, error: 'First Name is required' };
  }
  const trimmed = String(firstName).trim();
  if (/\d/.test(trimmed)) {
    return { valid: false, error: 'First Name must contain only characters, no numbers' };
  }
  const nameRegex = /^[\p{L}\p{M}'\-\s]+$/u;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'First Name contains invalid characters' };
  }
  return { valid: true, value: toTitleCase(trimmed) };
}

/**
 * Validates Last Name
 * - Defaults to 'Nil' if missing or equal to 'nil' (case-insensitive)
 * - Must contain only alphabetic characters, hyphens, apostrophes, spaces (no digits)
 * - Returns Title Case value (e.g. 'Nil', 'Wong')
 */
export function validateLastName(lastName) {
  if (!lastName || !String(lastName).trim()) {
    return { valid: true, value: 'Nil' };
  }
  const trimmed = String(lastName).trim();
  if (trimmed.toLowerCase() === 'nil') {
    return { valid: true, value: 'Nil' };
  }
  if (/\d/.test(trimmed)) {
    return { valid: false, error: "Last Name must contain only characters, no numbers (use 'Nil' if no last name)" };
  }
  const nameRegex = /^[\p{L}\p{M}'\-\s]+$/u;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Last Name contains invalid characters' };
  }
  return { valid: true, value: toTitleCase(trimmed) };
}

/**
 * Validates and normalizes 8-digit Hong Kong mobile number
 * - Accepts 8 digits with or without '+852' / '852'
 * - Returns 8-digit phone string and normalized '+852...' E.164 string
 */
export function validateAndNormalizeMobile(mobile) {
  if (!mobile || !String(mobile).trim()) {
    return { valid: false, error: 'Mobile number is required' };
  }

  let clean = String(mobile).trim().replace(/[\s\-\(\)]/g, '');

  if (clean.startsWith('+852')) {
    clean = clean.substring(4);
  } else if (clean.startsWith('852') && clean.length === 11) {
    clean = clean.substring(3);
  }

  // Must be strictly 8 numeric digits
  if (!/^\d{8}$/.test(clean)) {
    return {
      valid: false,
      error: 'Mobile number must be a valid 8-digit Hong Kong number (e.g. 25409588 or +85225409588)'
    };
  }

  return {
    valid: true,
    phone8: clean,
    normalizedMobile: `+852${clean}`
  };
}

/**
 * Validates role case-insensitively with exact spelling and permission check
 * @param {string} roleInput 
 * @param {string} uploaderRole ('admin' or 'staff')
 */
export function validateRole(roleInput, uploaderRole) {
  if (!roleInput || !String(roleInput).trim()) {
    return { valid: true, role: 'participant' }; // Default
  }

  const cleanRole = String(roleInput).trim().toLowerCase();

  if (cleanRole === 'admin') {
    return { valid: false, error: 'Admin accounts cannot be created via bulk upload' };
  }

  if (cleanRole === 'staff') {
    if (uploaderRole !== 'admin') {
      return { valid: false, error: 'Staff users are only permitted to create Participant accounts' };
    }
    return { valid: true, role: 'staff' };
  }

  if (cleanRole === 'participant') {
    return { valid: true, role: 'participant' };
  }

  return { valid: false, error: `Invalid role: '${roleInput}'. Allowed values are 'participant' or 'staff'` };
}

/**
 * Normalizes email: returns lowercase trimmed email or undefined if empty
 */
export function validateAndNormalizeEmail(email) {
  if (!email || !String(email).trim()) {
    return { valid: true, email: undefined };
  }
  const cleanEmail = String(email).trim().toLowerCase();
  // Simple RFC email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, error: 'Invalid email format (e.g. user@example.com)' };
  }
  return { valid: true, email: cleanEmail };
}

/**
 * Escapes regex special characters
 */
export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates unique lowercase username and password
 * Formula: username = [lowercase firstName][8-digit mobile] (with suffix if duplicate)
 * Password = [lowercase firstName][8-digit mobile]
 */
export async function generateCredentials(firstName, phone8, UserModel) {
  const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const base = `${cleanFirst}${phone8}`;
  let username = base;
  let counter = 1;

  if (UserModel) {
    while (await UserModel.findOne({ username })) {
      username = `${base}_${counter}`;
      counter++;
    }
  }

  return {
    username,
    tempPassword: base
  };
}
