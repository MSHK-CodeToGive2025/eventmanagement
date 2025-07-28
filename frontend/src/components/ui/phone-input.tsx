import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { 
  validatePhoneNumberForForm, 
  formatPhoneNumberForDisplay,
  formatPhoneNumberForTwilio 
} from '@/lib/phone-utils';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  showValidation?: boolean;
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "+852 1234 5678",
  required = false,
  disabled = false,
  className = "",
  label,
  error,
  showValidation = true
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Validate phone number
  useEffect(() => {
    if (!showValidation) return;
    
    if (!value) {
      setIsValid(true);
      setValidationMessage("");
      return;
    }

    const validation = validatePhoneNumberForForm(value);
    setIsValid(validation.isValid);
    setValidationMessage(validation.error || "");
  }, [value, showValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    onChange(inputValue);
  };

  const handleBlur = () => {
    // Format for display when user leaves the field
    if (value && isValid) {
      const formatted = formatPhoneNumberForDisplay(value);
      setDisplayValue(formatted);
    }
    
    setIsFocused(false);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value when focused for editing
    setDisplayValue(value);
  };

  const getInputClassName = () => {
    let baseClass = "border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200";
    
    if (error) {
      baseClass = "border-red-500 focus:border-red-500 focus:ring focus:ring-red-200";
    } else if (value && isValid && showValidation) {
      baseClass = "border-green-500 focus:border-green-500 focus:ring focus:ring-green-200";
    }
    
    return `${baseClass} ${className}`;
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="tel"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={required}
          disabled={disabled}
          className={getInputClassName()}
        />
        
        {showValidation && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {showValidation && value && validationMessage && (
        <div className="flex items-start text-xs">
          {isValid ? (
            <CheckCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-red-500 mt-0.5" />
          )}
          <span className={isValid ? "text-green-600" : "text-red-600"}>
            {validationMessage}
          </span>
        </div>
      )}
      
      {error && (
        <div className="flex items-start text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {!value && !error && (
        <div className="flex items-start text-xs text-gray-500">
          <span>Use E.164 format (e.g., +85212345678) for WhatsApp compatibility</span>
        </div>
      )}
    </div>
  );
} 