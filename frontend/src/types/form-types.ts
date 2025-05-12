export interface RegistrationForm {
  _id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  isActive: boolean;
  createdBy: string; // User ID reference
  createdAt: Date;
  updatedBy?: string; // User ID reference
  updatedAt?: Date;
}

export interface FormSection {
  _id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface FormField {
  _id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'dropdown' | 'checkbox' | 'radio' | 'number' | 'textarea' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  options?: string[]; // For dropdown, radio, checkbox
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    message?: string;
  };
  order: number;
} 