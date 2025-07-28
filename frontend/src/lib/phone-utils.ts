/**
 * Phone Number Utilities for Twilio WhatsApp Compliance
 * 
 * This module provides utilities for formatting and validating phone numbers
 * to ensure they comply with Twilio WhatsApp requirements (E.164 format).
 */

export interface PhoneNumberInfo {
  formatted: string;
  isValid: boolean;
  countryCode?: string;
  nationalNumber?: string;
  error?: string;
}

/**
 * Validates and formats a phone number for Twilio WhatsApp compliance
 * @param phoneNumber - The phone number to validate and format
 * @returns PhoneNumberInfo object with formatting results
 */
export function formatPhoneNumberForTwilio(phoneNumber: string): PhoneNumberInfo {
  if (!phoneNumber) {
    return {
      formatted: '',
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Handle Hong Kong numbers (most common for this application)
  if (cleaned.startsWith('852')) {
    // Already has country code
    if (!cleaned.startsWith('+852')) {
      cleaned = '+852' + cleaned.substring(3);
    }
  } else if (cleaned.startsWith('+852')) {
    // Already properly formatted
  } else if (cleaned.startsWith('852')) {
    // Has country code but missing +
    cleaned = '+' + cleaned;
  } else if (cleaned.length === 8 && !cleaned.startsWith('+')) {
    // Hong Kong local number (8 digits)
    cleaned = '+852' + cleaned;
  } else if (cleaned.length === 9 && !cleaned.startsWith('+')) {
    // Hong Kong number with leading 9
    cleaned = '+852' + cleaned;
  } else if (cleaned.startsWith('+')) {
    // International number with +, validate format
    if (cleaned.length < 10 || cleaned.length > 15) {
      return {
        formatted: cleaned,
        isValid: false,
        error: 'Invalid international phone number length'
      };
    }
  } else {
    // Try to detect country code or assume Hong Kong
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      // Could be international, add + if missing
      cleaned = '+' + cleaned;
    } else {
      return {
        formatted: phoneNumber,
        isValid: false,
        error: 'Invalid phone number format'
      };
    }
  }

  // Final validation
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      formatted: cleaned,
      isValid: false,
      error: 'Phone number must be in E.164 format (e.g., +85212345678)'
    };
  }

  return {
    formatted: cleaned,
    isValid: true,
    countryCode: cleaned.substring(0, 4), // +852 for Hong Kong
    nationalNumber: cleaned.substring(4)
  };
}

/**
 * Validates if a phone number is in correct format for Twilio
 * @param phoneNumber - The phone number to validate
 * @returns boolean indicating if the number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  return result.isValid;
}

/**
 * Formats a phone number for display (adds spaces for readability)
 * @param phoneNumber - The phone number to format for display
 * @returns Formatted phone number string
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  
  if (!result.isValid) {
    return phoneNumber; // Return original if invalid
  }

  // Format for display (add spaces)
  if (result.countryCode === '+852') {
    // Hong Kong format: +852 1234 5678
    const national = result.nationalNumber || '';
    if (national.length === 8) {
      return `${result.countryCode} ${national.substring(0, 4)} ${national.substring(4)}`;
    } else if (national.length === 9) {
      return `${result.countryCode} ${national.substring(0, 4)} ${national.substring(4, 7)} ${national.substring(7)}`;
    }
  }

  // Generic international format
  return result.formatted;
}

/**
 * Extracts country code from phone number
 * @param phoneNumber - The phone number
 * @returns Country code (e.g., +852) or undefined
 */
export function extractCountryCode(phoneNumber: string): string | undefined {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  return result.countryCode;
}

/**
 * Normalizes phone number input for consistent processing
 * @param phoneNumber - The phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all spaces, dashes, parentheses
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
}

/**
 * Validates phone number with specific error messages for forms
 * @param phoneNumber - The phone number to validate
 * @returns Validation result with error message if invalid
 */
export function validatePhoneNumberForForm(phoneNumber: string): { isValid: boolean; error?: string } {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  
  if (!result.isValid) {
    return {
      isValid: false,
      error: result.error || 'Please enter a valid phone number'
    };
  }

  return { isValid: true };
}

/**
 * Gets placeholder text for phone input based on detected country
 * @param detectedCountry - Optional country code to customize placeholder
 * @returns Placeholder text for phone input
 */
export function getPhonePlaceholder(detectedCountry?: string): string {
  if (detectedCountry === '+852') {
    return '+852 1234 5678';
  }
  return '+852 1234 5678'; // Default to Hong Kong format
}

/**
 * Formats phone number for WhatsApp API calls
 * @param phoneNumber - The phone number to format
 * @returns Phone number formatted for WhatsApp API
 */
export function formatForWhatsApp(phoneNumber: string): string {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  
  if (!result.isValid) {
    throw new Error(`Invalid phone number: ${result.error}`);
  }

  return result.formatted;
} 