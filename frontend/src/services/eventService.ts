import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  capacity: number;
  image?: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  registeredParticipants: Array<{
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  } | string>;
  waitlist: Array<{
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  } | string>;
  availableSpots: number;
  isFull: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  capacity: number;
  image?: File;
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
  }
};

export default eventService; 