import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug logging
//console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
//console.log('Final API_URL:', API_URL);

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
  reminderTimes?: number[];
  defaultReminderMode?: 'template' | 'custom';
  remindersSent?: number[];
  staffContact?: {
    name?: string;
    phone?: string;
  };
  participants?: string[]; // Users authorized to view this private event
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
  reminderTimes?: number[];
  defaultReminderMode?: 'template' | 'custom';
  staffContact?: {
    name?: string;
    phone?: string;
  };
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
    const response = await axios.get(url, {
      headers: authHeader(),
    });
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Get published, non-private events (for public display)

  async getPublicEvents(): Promise<Event[]> {
    const url = `${API_URL}/events/public`;
    const response = await axios.get(url);
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Get published, non-private, non-expired events (for public display)

  async getPublicNonExpiredEvents(): Promise<Event[]> {
    const url = `${API_URL}/events/public-nonexpired`;
    const response = await axios.get(url);
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Get single event

  async getEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}`;
    const response = await axios.get(url, {
      headers: authHeader(),
    });
    //console.log('[eventService] Response:', response.data);
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
    //console.log('[eventService] POST', url, 'params:', eventData);
    const response = await axios.post(url, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Update event

  async updateEvent(id: string, eventData: EventFormData | FormData): Promise<Event> {
    const url = `${API_URL}/events/${id}`;
    const response = await axios.put(url, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Delete event

  async deleteEvent(id: string): Promise<void> {
    const url = `${API_URL}/events/${id}`;
    const response = await axios.delete(url, {
      headers: authHeader(),
    });
    //console.log('[eventService] Response:', response.data);
  },

  // Register for event

  async registerForEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}/register`;
    const response = await axios.post(url, {}, {
      headers: authHeader(),
    });
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Unregister from event

  async unregisterFromEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}/unregister`;
    const response = await axios.post(url, {}, {
      headers: authHeader(),
    });
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Add participants to private event
  async addParticipants(eventId: string, participantIds: string[]): Promise<Event> {
    const url = `${API_URL}/events/${eventId}/participants`;
    const response = await axios.post(url, { participantIds }, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Remove participants from private event
  async removeParticipants(eventId: string, participantIds: string[]): Promise<Event> {
    const url = `${API_URL}/events/${eventId}/participants`;
    const response = await axios.delete(url, {
      headers: authHeader(),
      data: { participantIds },
    });
    return response.data;
  },

  // Get available users for participant selection
  async getAvailableUsers(eventId: string): Promise<{ _id: string; firstName: string; lastName: string; email: string; role: string }[]> {
    const url = `${API_URL}/events/${eventId}/available-users`;
    const response = await axios.get(url, {
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
    const url = `${API_URL}/event-registrations/event/${eventId}`;
    //console.log('[eventService] POST', url, 'params:', data);
    const response = await axios.post(
      url,
      data,
      { headers: authHeader() }
    );
    //console.log('[eventService] Response:', response.data);
    return response.data;
  },

  // Send WhatsApp message to all registered participants
  async sendWhatsAppMessage(eventId: string, title: string, message: string, useTemplate: boolean = false): Promise<{
    message: string;
    successful: number;
    failed: number;
    failedNumbers: string[];
  }> {
    const url = `${API_URL}/events/${eventId}/send-whatsapp`;
    //console.log('[eventService] POST', url, 'title:', title, 'message:', message);
    const response = await axios.post(
      url,
      { title, message, useTemplate },
      { headers: authHeader() }
    );
    //console.log('[eventService] WhatsApp Response:', response.data);
    return response.data;
  },

  // Assign participants to private event
  async assignParticipants(eventId: string, participantIds: string[]): Promise<{
    message: string;
    results: Array<{
      participantId: string;
      status: 'assigned' | 'already_registered';
      registrationId: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    errors: Array<{
      participantId: string;
      error: string;
    }>;
    summary: {
      total: number;
      assigned: number;
      alreadyRegistered: number;
      errors: number;
    };
  }> {
    const url = `${API_URL}/event-registrations/event/${eventId}/assign-participants`;
    const response = await axios.post(
      url,
      { participantIds },
      { headers: authHeader() }
    );
    return response.data;
  },

  // Remove participants from private event (new method for registration removal)
  async removeParticipantRegistrations(eventId: string, participantIds: string[]): Promise<{
    message: string;
    results: Array<{
      participantId: string;
      status: 'removed' | 'not_found';
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    errors: Array<{
      participantId: string;
      error: string;
    }>;
    summary: {
      total: number;
      removed: number;
      notFound: number;
      errors: number;
    };
  }> {
    const url = `${API_URL}/event-registrations/event/${eventId}/remove-participants`;
    const response = await axios.post(
      url,
      { participantIds },
      { headers: authHeader() }
    );
    return response.data;
  }
};

export default eventService; 