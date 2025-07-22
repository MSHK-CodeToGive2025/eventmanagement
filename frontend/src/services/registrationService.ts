import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug logging
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Final API_URL:', API_URL);

// Add auth token to requests
export const authHeader = (): { Authorization?: string } => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface EventRegistration {
  _id: string;
  eventId: string;
  userId?: string;
  attendee: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  sessions: string[];
  formResponses: Array<{
    sectionId: string;
    fieldId: string;
    response: any;
  }>;
  status: 'registered' | 'cancelled' | 'rejected';
  registeredAt: string;
  cancelledAt?: string;
  notes?: string;
}

const registrationService = {
  // Get all event registrations (admin/staff only)
  async getAllRegistrations(): Promise<EventRegistration[]> {
    const response = await axios.get(`${API_URL}/event-registrations`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get registrations for a specific event
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const response = await axios.get(`${API_URL}/event-registrations/event/${eventId}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Update registration status (admin/staff only)
  async updateRegistrationStatus(registrationId: string, status: EventRegistration['status']): Promise<EventRegistration> {
    const response = await axios.put(
      `${API_URL}/event-registrations/${registrationId}/status`,
      { status },
      { headers: authHeader() }
    );
    return response.data;
  },

  // Cancel registration
  async cancelRegistration(registrationId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/event-registrations/${registrationId}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get user's own registrations
  async getMyRegistrations(): Promise<EventRegistration[]> {
    const response = await axios.get(`${API_URL}/event-registrations/my-registrations`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Check if user is registered for a specific event
  async checkUserRegistration(eventId: string): Promise<EventRegistration | null> {
    try {
      const response = await axios.get(`${API_URL}/event-registrations/my-registrations`, {
        headers: authHeader(),
      });
      const registrations = response.data;
      const eventRegistration = registrations.find((reg: EventRegistration) => {
        const regEventId = typeof reg.eventId === 'object' && reg.eventId !== null ? (reg.eventId as any)._id : reg.eventId;
        return regEventId === eventId && reg.status === 'registered';
      });
      return eventRegistration || null;
    } catch (error) {
      console.error('Error checking user registration:', error);
      return null;
    }
  },

  // Get all user registrations for a specific event (including cancelled/rejected)
  async getUserEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    try {
      const response = await axios.get(`${API_URL}/event-registrations/my-registrations`, {
        headers: authHeader(),
      });
      const registrations = response.data;
      console.log('[REGISTRATION SERVICE] All user registrations:', registrations);
      console.log('[REGISTRATION SERVICE] Looking for eventId:', eventId);
      
      const filteredRegistrations = registrations.filter((reg: EventRegistration) => {
        // Handle both populated eventId (object) and string eventId
        const regEventId = typeof reg.eventId === 'object' && reg.eventId !== null ? (reg.eventId as any)._id : reg.eventId;
        console.log('[REGISTRATION SERVICE] Comparing:', regEventId, 'with', eventId, 'result:', regEventId === eventId);
        return regEventId === eventId;
      });
      
      console.log('[REGISTRATION SERVICE] Filtered registrations for event:', filteredRegistrations);
      return filteredRegistrations;
    } catch (error) {
      console.error('Error getting user event registrations:', error);
      return [];
    }
  },
};

export default registrationService; 