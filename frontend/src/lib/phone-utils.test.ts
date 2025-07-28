import { describe, it, expect } from 'vitest';
import { 
  formatPhoneNumberForTwilio, 
  isValidPhoneNumber, 
  formatPhoneNumberForDisplay,
  validatePhoneNumberForForm,
  formatForWhatsApp
} from './phone-utils';

describe('Phone Number Utilities', () => {
  describe('formatPhoneNumberForTwilio', () => {
    it('should format Hong Kong numbers correctly', () => {
      const testCases = [
        { input: '12345678', expected: '+85212345678' },
        { input: '91234567', expected: '+85291234567' },
        { input: '85212345678', expected: '+85212345678' },
        { input: '+85212345678', expected: '+85212345678' },
        { input: '852 1234 5678', expected: '+85212345678' },
        { input: '+852 1234 5678', expected: '+85212345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatPhoneNumberForTwilio(input);
        expect(result.formatted).toBe(expected);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle international numbers', () => {
      const testCases = [
        { input: '+1234567890', expected: '+1234567890' },
        { input: '+44123456789', expected: '+44123456789' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatPhoneNumberForTwilio(input);
        expect(result.formatted).toBe(expected);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid numbers', () => {
      const invalidNumbers = [
        '',
        '123',
        '1234567', // Too short for Hong Kong
        '+123', // Too short
        'abc123def',
        '+852123456789012345', // Too long
      ];

      invalidNumbers.forEach(input => {
        const result = formatPhoneNumberForTwilio(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid numbers', () => {
      const validNumbers = [
        '+85212345678',
        '+85291234567',
        '+1234567890',
        '+44123456789',
      ];

      validNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(true);
      });
    });

    it('should return false for invalid numbers', () => {
      const invalidNumbers = [
        '',
        '123',
        '1234567',
        'abc123def',
        '+852123456789012345',
      ];

      invalidNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(false);
      });
    });
  });

  describe('formatPhoneNumberForDisplay', () => {
    it('should format Hong Kong numbers for display', () => {
      const testCases = [
        { input: '+85212345678', expected: '+852 1234 5678' },
        { input: '+85291234567', expected: '+852 9123 4567' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatPhoneNumberForDisplay(input);
        expect(result).toBe(expected);
      });
    });

    it('should return original for invalid numbers', () => {
      const invalidInput = 'invalid';
      const result = formatPhoneNumberForDisplay(invalidInput);
      expect(result).toBe(invalidInput);
    });
  });

  describe('validatePhoneNumberForForm', () => {
    it('should return valid for correct numbers', () => {
      const validNumbers = [
        '+85212345678',
        '+85291234567',
        '+1234567890',
      ];

      validNumbers.forEach(number => {
        const result = validatePhoneNumberForForm(number);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should return error for invalid numbers', () => {
      const invalidNumbers = [
        { input: '', expectedError: 'Phone number is required' },
        { input: '123', expectedError: 'Invalid phone number format' },
      ];

      invalidNumbers.forEach(({ input, expectedError }) => {
        const result = validatePhoneNumberForForm(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });

  describe('formatForWhatsApp', () => {
    it('should format valid numbers for WhatsApp', () => {
      const testCases = [
        { input: '+85212345678', expected: '+85212345678' },
        { input: '12345678', expected: '+85212345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatForWhatsApp(input);
        expect(result).toBe(expected);
      });
    });

    it('should throw error for invalid numbers', () => {
      const invalidNumbers = ['', '123', 'abc'];

      invalidNumbers.forEach(number => {
        expect(() => formatForWhatsApp(number)).toThrow();
      });
    });
  });
}); 