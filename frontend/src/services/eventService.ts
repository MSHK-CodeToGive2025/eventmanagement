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
  coverImage?: {
    data: string; // base64 string representation
    contentType: string;
    size: number;
  };
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
    const url = `${API_URL}/events`;
    console.log('[eventService] GET', url);
    const response = await axios.get(url, {
      headers: authHeader(),
    });
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Get published, non-private events (for public display)

  async getPublicEvents(): Promise<Event[]> {
    const url = `${API_URL}/events/public`;
    console.log('[eventService] GET', url);
    const response = await axios.get(url);
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Get single event

  async getEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}`;
    console.log('[eventService] GET', url);
    const response = await axios.get(url, {
      headers: authHeader(),
    });
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Helper method to get the best available image URL for an event
  getEventImageUrl(eventId: string, event?: Event | any): string | undefined {
    // Check if event has coverImage
    if (event?.coverImage?.data) {
      return `${API_URL}/events/${eventId}/cover-image`;
    }
    
    return undefined;
  },

  // Create event

  async createEvent(eventData: EventFormData | FormData): Promise<Event> {
    const url = `${API_URL}/events`;
    console.log('[eventService] POST', url, 'params:', eventData);
    const response = await axios.post(url, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Update event

  async updateEvent(id: string, eventData: EventFormData | FormData): Promise<Event> {
    const url = `${API_URL}/events/${id}`;
    console.log('[eventService] PUT', url, 'params:', eventData);
    const response = await axios.put(url, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Delete event

  async deleteEvent(id: string): Promise<void> {
    const url = `${API_URL}/events/${id}`;
    console.log('[eventService] DELETE', url);
    const response = await axios.delete(url, {
      headers: authHeader(),
    });
    console.log('[eventService] Response:', response.data);
  },

  // Register for event

  async registerForEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}/register`;
    console.log('[eventService] POST', url);
    const response = await axios.post(url, {}, {
      headers: authHeader(),
    });
    console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Unregister from event

  async unregisterFromEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}/unregister`;
    console.log('[eventService] POST', url);
    const response = await axios.post(url, {}, {
      headers: authHeader(),
    });
    console.log('[eventService] Response:', response.data);
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
    const url = `${API_URL}/event-registrations/event/${eventId}`;
    console.log('[eventService] POST', url, 'params:', data);
    const response = await axios.post(
      url,
      data,
      { headers: authHeader() }
    );
    console.log('[eventService] Response:', response.data);
    return response.data;
  }
};

export default eventService; 