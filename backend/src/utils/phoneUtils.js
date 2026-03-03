/**
 * Phone Number Utilities for Twilio WhatsApp Compliance
 * 
 * This module provides utilities for formatting and validating phone numbers
 * to ensure they comply with Twilio WhatsApp requirements (E.164 format).
 */

/**
 * Validates and formats a phone number for Twilio WhatsApp compliance
 * @param {string} phoneNumber - The phone number to validate and format
 * @returns {Object} Object with formatting results
 */
function formatPhoneNumberForTwilio(phoneNumber) {
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
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} indicating if the number is valid
 */
function isValidPhoneNumber(phoneNumber) {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  return result.isValid;
}

/**
 * Formats a phone number for display (adds spaces for readability)
 * @param {string} phoneNumber - The phone number to format for display
 * @returns {string} Formatted phone number string
 */
function formatPhoneNumberForDisplay(phoneNumber) {
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
 * @param {string} phoneNumber - The phone number
 * @returns {string|undefined} Country code (e.g., +852) or undefined
 */
function extractCountryCode(phoneNumber) {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  return result.countryCode;
}

/**
 * Normalizes phone number input for consistent processing
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  // Remove all spaces, dashes, parentheses
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
}

/**
 * Validates phone number with specific error messages for forms
 * @param {string} phoneNumber - The phone number to validate
 * @returns {Object} Validation result with error message if invalid
 */
function validatePhoneNumberForForm(phoneNumber) {
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
 * @param {string} detectedCountry - Optional country code to customize placeholder
 * @returns {string} Placeholder text for phone input
 */
function getPhonePlaceholder(detectedCountry) {
  if (detectedCountry === '+852') {
    return '+852 1234 5678';
  }
  return '+852 1234 5678'; // Default to Hong Kong format
}

/**
 * Formats phone number for WhatsApp API calls
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Phone number formatted for WhatsApp API
 */
function formatForWhatsApp(phoneNumber) {
  const result = formatPhoneNumberForTwilio(phoneNumber);
  
  if (!result.isValid) {
    throw new Error(`Invalid phone number: ${result.error}`);
  }

  return result.formatted;
}

/**
 * Middleware to validate phone number in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validatePhoneNumberMiddleware(req, res, next) {
  const { mobile, phone } = req.body;
  const phoneNumber = mobile || phone;
  
  if (phoneNumber) {
    const validation = validatePhoneNumberForForm(phoneNumber);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Format the phone number and update the request body
    const formatted = formatPhoneNumberForTwilio(phoneNumber);
    if (mobile) req.body.mobile = formatted.formatted;
    if (phone) req.body.phone = formatted.formatted;
  }
  
  next();
}

/**
 * Ensures a WhatsApp sender number has the required 'whatsapp:' prefix.
 * Twilio requires both 'from' and 'to' to use the 'whatsapp:' channel prefix.
 * @param {string} number - The sender phone number (with or without prefix)
 * @returns {string} Number with 'whatsapp:' prefix
 */
function ensureWhatsAppPrefix(number) {
  if (!number) return number;
  return number.startsWith('whatsapp:') ? number : `whatsapp:${number}`;
}

export {
  formatPhoneNumberForTwilio,
  isValidPhoneNumber,
  formatPhoneNumberForDisplay,
  extractCountryCode,
  normalizePhoneNumber,
  validatePhoneNumberForForm,
  getPhonePlaceholder,
  formatForWhatsApp,
  ensureWhatsAppPrefix,
  validatePhoneNumberMiddleware
}; 