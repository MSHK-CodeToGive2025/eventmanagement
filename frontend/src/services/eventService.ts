import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug logging
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Final API_URL:', API_URL);

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetGroup: string;
  location: {
    venue: string;
    address: string;
    district: string;
    onlineEvent: boolean;
    meetingLink?: string;
  };
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  isPrivate: boolean;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  registrationFormId: string;
  sessions: Array<{
    _id: string;
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: {
      venue?: string;
      meetingLink?: string;
    };
    capacity?: number;
  }>;
  capacity?: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedAt?: string;
  tags?: string[];
  registeredCount?: number;
}

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  targetGroup: string;
  location: {
    venue: string;
    address: string;
    district: string;
    onlineEvent: boolean;
    meetingLink?: string;
  };
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  isPrivate: boolean;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  registrationFormId: string;
  sessions: Array<{
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: {
      venue?: string;
      meetingLink?: string;
    };
    capacity?: number;
  }>;
  capacity?: number;
  tags?: string[];
}

// Add auth token to requests
export const authHeader = (): { Authorization?: string } => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const eventService = {
  // Get all events
  async getEvents(): Promise<Event[]> {
    const response = await axios.get(`${API_URL}/events`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get published, non-private events (for public display)
  async getPublicEvents(): Promise<Event[]> {
    const response = await axios.get(`${API_URL}/events/public`);
    return response.data;
  },

  // Get single event
  async getEvent(id: string): Promise<Event> {
    const response = await axios.get(`${API_URL}/events/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Create event
  async createEvent(eventData: EventFormData | FormData): Promise<Event> {
    const response = await axios.post(`${API_URL}/events`, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    return response.data;
  },

  // Update event
  async updateEvent(id: string, eventData: EventFormData | FormData): Promise<Event> {
    const response = await axios.put(`${API_URL}/events/${id}`, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    return response.data;
  },

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    await axios.delete(`${API_URL}/events/${id}`, {
      headers: authHeader(),
    });
  },

  // Register for event
  async registerForEvent(id: string): Promise<Event> {
    const response = await axios.post(`${API_URL}/events/${id}/register`, {}, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Unregister from event
  async unregisterFromEvent(id: string): Promise<Event> {
    const response = await axios.post(`${API_URL}/events/${id}/unregister`, {}, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Register for event (new, correct endpoint)
  async registerForEventV2(eventId: string, data: {
    sessions: string[];
    formResponses: Array<{ sectionId: string; fieldId: string; response: any }>;
    attendee: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
  }): Promise<any> {
    const response = await axios.post(
      `${API_URL}/event-registrations/event/${eventId}`,
      data,
      { headers: authHeader() }
    );
    return response.data;
  }
};

export default eventService; 