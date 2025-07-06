import { RegistrationForm } from '@/types/form-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const formService = {
  // Get all registration forms (admin/staff only)
  async getAllForms(): Promise<RegistrationForm[]> {
    return apiCall('/registration-forms');
  },

  // Get active registration forms (public)
  async getActiveForms(): Promise<RegistrationForm[]> {
    return apiCall('/registration-forms/active');
  },

  // Get single registration form
  async getForm(id: string): Promise<RegistrationForm> {
    return apiCall(`/registration-forms/${id}`);
  },

  // Create registration form (admin/staff only)
  async createForm(formData: {
    title: string;
    description?: string;
    sections: any[];
    isActive?: boolean;
  }): Promise<RegistrationForm> {
    return apiCall('/registration-forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  // Update registration form (admin/staff only)
  async updateForm(id: string, formData: {
    title?: string;
    description?: string;
    sections?: any[];
    isActive?: boolean;
  }): Promise<RegistrationForm> {
    return apiCall(`/registration-forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
  },

  // Delete registration form (admin only)
  async deleteForm(id: string): Promise<{ message: string }> {
    return apiCall(`/registration-forms/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle form active status (admin/staff only)
  async toggleFormStatus(id: string): Promise<RegistrationForm> {
    return apiCall(`/registration-forms/${id}/toggle`, {
      method: 'PATCH',
    });
  },
}; 